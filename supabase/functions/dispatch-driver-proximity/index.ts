// Supabase Edge Function — dispatch-driver-proximity
// Finds the most available driver based on availability markers:
// 1. Proximity to pickup point (Haversine formula)
// 2. Current active workload (active deliveries count)
// 3. Driver rating (0-5 stars)
// 4. Online ping recency (driver_locations / profiles)
// 5. Excludes drivers who declined or timed out (cascading fallback)
// Sets a confirmation deadline (90s SLA) and notifies the driver with an Accept button.

import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ONESIGNAL_APP_ID = Deno.env.get("ONESIGNAL_APP_ID") ?? "";
const ONESIGNAL_REST_API_KEY = Deno.env.get("ONESIGNAL_REST_API_KEY") ?? "";

/** Haversine distance in kilometres. */
function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function extractPickup(raw: unknown): { lat: number; lng: number } | null {
  if (!raw || typeof raw !== "object") return null;
  const meta = raw as Record<string, any>;
  const candidates = [
    meta.pickup,
    meta.pickup_location,
    meta.location,
    meta,
  ];
  for (const c of candidates) {
    if (!c || typeof c !== "object") continue;
    const lat = Number(c.latitude ?? c.lat ?? c.vendor_lat);
    const lng = Number(c.longitude ?? c.lng ?? c.lon ?? c.vendor_lon);
    if (Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0)) {
      return { lat, lng };
    }
  }
  return null;
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!SUPABASE_URL || !SERVICE_ROLE) {
      return json({ error: "Backend is not configured." }, 500);
    }

    const body = await req.json().catch(() => ({}));
    const record = body?.record ?? body ?? {};
    const orderId: string | undefined = body?.order_id ?? record?.id;
    if (!orderId) {
      return json({ error: "order_id is required." }, 400);
    }

    const radiusKm = Number(body?.radius_km) || 25;
    const stalenessMinutes = Number(body?.staleness_minutes) || 120; // 2 hours window
    const timeoutSeconds = Number(body?.timeout_seconds) || 90; // 90 seconds to accept

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    // 1. Load the order.
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, order_number, vendor_id, buyer_id, assigned_driver_id, status, metadata, delivery_address, total_amount")
      .eq("id", orderId)
      .maybeSingle();

    if (orderError) return json({ error: orderError.message }, 400);
    if (!order) return json({ error: "Order not found." }, 404);

    // If order already has a confirmed driver (status in-transit or delivered) and not forced, skip.
    if (order.assigned_driver_id && ["in-transit", "delivered"].includes(order.status) && !body?.force) {
      return json({
        skipped: true,
        reason: "Order is already actively in-transit or delivered.",
        driver_id: order.assigned_driver_id,
      });
    }

    // 2. Resolve excluded driver IDs (from request body or order metadata)
    const existingMeta = (order.metadata && typeof order.metadata === "object" ? order.metadata : {}) as Record<string, any>;
    const previousDeclined: string[] = Array.isArray(existingMeta.declined_drivers) ? existingMeta.declined_drivers : [];
    const requestExcluded: string[] = Array.isArray(body?.exclude_driver_ids) ? body.exclude_driver_ids : [];
    const excludeSet = new Set([...previousDeclined, ...requestExcluded]);

    // 3. Resolve pickup coordinates
    const pickup = extractPickup(body?.pickup) ?? extractPickup(order.metadata);
    const staleBefore = new Date(Date.now() - stalenessMinutes * 60_000).toISOString();

    // 4. Fetch all candidate drivers with roles, profiles, locations, and active job counts
    const [rolesRes, locationsRes, profilesRes, activeJobsRes] = await Promise.all([
      supabase.from("user_roles").select("user_id").eq("role", "driver"),
      supabase
        .from("driver_locations")
        .select("driver_id, latitude, longitude, updated_at")
        .gte("updated_at", staleBefore)
        .order("updated_at", { ascending: false }),
      supabase
        .from("profiles")
        .select("user_id, full_name, phone, driver_rating, push_token"),
      supabase
        .from("delivery_jobs")
        .select("driver_id, status")
        .in("status", ["accepted", "assigned", "picked_up", "in_transit", "in-transit", "awaiting_driver"]),
    ]);

    if (rolesRes.error) return json({ error: rolesRes.error.message }, 400);

    const driverRoleIds = new Set((rolesRes.data ?? []).map((r) => r.user_id));
    const profileMap = new Map((profilesRes.data ?? []).map((p) => [p.user_id, p]));

    // Count active jobs per driver
    const activeJobsCount = new Map<string, number>();
    for (const job of activeJobsRes.data ?? []) {
      if (job.driver_id) {
        activeJobsCount.set(job.driver_id, (activeJobsCount.get(job.driver_id) || 0) + 1);
      }
    }

    // Map latest location per driver
    const latestLocations = new Map<string, { lat: number; lng: number; updated_at: string }>();
    for (const loc of locationsRes.data ?? []) {
      if (!latestLocations.has(loc.driver_id)) {
        latestLocations.set(loc.driver_id, {
          lat: Number(loc.latitude),
          lng: Number(loc.longitude),
          updated_at: loc.updated_at,
        });
      }
    }

    // 5. Build candidate list with availability markers
    interface Candidate {
      driver_id: string;
      profile?: any;
      has_location: boolean;
      distance_km: number | null;
      active_jobs: number;
      rating: number;
      last_active: string;
      composite_score: number; // lower = better
    }

    const candidates: Candidate[] = [];

    for (const dId of driverRoleIds) {
      if (excludeSet.has(dId)) continue;
      if (dId === order.vendor_id || dId === order.buyer_id) continue;

      const loc = latestLocations.get(dId);
      const profile = profileMap.get(dId);
      const rating = Number(profile?.driver_rating ?? 5.0);
      const activeJobs = activeJobsCount.get(dId) || 0;
      const lastActive = loc?.updated_at || profile?.updated_at || "";

      let dist: number | null = null;
      if (pickup && loc) {
        dist = distanceKm(pickup, loc);
      }

      // Compute Availability Composite Score:
      // - Distance: 1 km = 1 point (or 15 pts if no GPS)
      // - Workload penalty: +8 points per active job
      // - Rating reward: -2 points per star above 3.0
      const distScore = dist != null ? dist : 15;
      const workloadScore = activeJobs * 8;
      const ratingScore = (rating - 3) * 2;
      const compositeScore = distScore + workloadScore - ratingScore;

      candidates.push({
        driver_id: dId,
        profile,
        has_location: Boolean(loc),
        distance_km: dist,
        active_jobs: activeJobs,
        rating,
        last_active: lastActive,
        composite_score: compositeScore,
      });
    }

    // Sort primarily by nearest location distance (km), then by workload & rating
    candidates.sort((a, b) => {
      // 1. If both have GPS distance, closest driver to pickup location is always ranked first
      if (a.distance_km != null && b.distance_km != null) {
        if (Math.abs(a.distance_km - b.distance_km) > 0.3) {
          return a.distance_km - b.distance_km;
        }
      }
      // 2. Proximity GPS data takes precedence over unlocated drivers
      if (a.distance_km != null && b.distance_km == null) return -1;
      if (b.distance_km != null && a.distance_km == null) return 1;

      // 3. Composite score for workload, rating, and recency
      return a.composite_score - b.composite_score;
    });

    if (candidates.length === 0) {
      return json({
        skipped: true,
        reason: "No eligible drivers available at this moment. Delivery open in public pool.",
        excluded_count: excludeSet.size,
      });
    }

    // Choose the top candidate
    const chosen = candidates[0];
    const now = new Date();
    const deadline = new Date(now.getTime() + timeoutSeconds * 1000);
    const deadlineIso = deadline.toISOString();

    const payoutAmount = Number(body?.payout_amount || 1500);

    // 6. Ensure delivery_jobs record exists and update with SLA deadline & claim token
    const claimToken = `claim_${order.id}_${chosen.driver_id}_${Date.now()}`;
    const updatedMeta = {
      ...existingMeta,
      current_offer: {
        driver_id: chosen.driver_id,
        offered_at: now.toISOString(),
        deadline: deadlineIso,
        timeout_seconds: timeoutSeconds,
      },
      declined_drivers: Array.from(excludeSet),
    };

    // Update order
    const { error: orderUpErr } = await supabase
      .from("orders")
      .update({
        assigned_driver_id: chosen.driver_id,
        driver_assignment_deadline: deadlineIso,
        status: "driver_assigned", // offered / assigned with confirmation window
        metadata: updatedMeta,
        updated_at: now.toISOString(),
      })
      .eq("id", order.id);

    if (orderUpErr) {
      return json({ error: `Failed to update order: ${orderUpErr.message}` }, 400);
    }

    // Check or upsert delivery_job
    const { data: existingJob } = await supabase
      .from("delivery_jobs")
      .select("id")
      .eq("order_id", order.id)
      .maybeSingle();

    if (existingJob) {
      await supabase
        .from("delivery_jobs")
        .update({
          driver_id: chosen.driver_id,
          status: "awaiting_driver",
          sla_deadline: deadlineIso,
          claim_token: claimToken,
          payout_amount: payoutAmount,
          pickup_address: body?.pickup_address || "Vendor Location",
          dropoff_address: order.delivery_address || "Customer Address",
          updated_at: now.toISOString(),
        })
        .eq("id", existingJob.id);
    } else {
      await supabase
        .from("delivery_jobs")
        .insert({
          order_id: order.id,
          driver_id: chosen.driver_id,
          status: "awaiting_driver",
          sla_deadline: deadlineIso,
          claim_token: claimToken,
          payout_amount: payoutAmount,
          pickup_address: body?.pickup_address || "Vendor Location",
          dropoff_address: order.delivery_address || "Customer Address",
        });
    }

    // 7. Send In-App Actionable Notification with direct Accept Link
    const orderLabel = order.order_number ? `#${order.order_number}` : `#${order.id.slice(0, 8)}`;
    await supabase.from("notifications").insert([
      {
        user_id: chosen.driver_id,
        type: "delivery_offer",
        title: `🚨 New Delivery Offer: ₦${payoutAmount.toLocaleString("en-NG")}`,
        message: `Order ${orderLabel} assigned to you based on your availability. Accept within ${timeoutSeconds}s before it passes to the next driver.`,
        link: `/driver?accept=${order.id}&deadline=${encodeURIComponent(deadlineIso)}`,
      },
    ]);

    // 8. Send OneSignal Push Notification with interactive Action Buttons
    let pushSent = false;
    const driverPushToken = chosen.profile?.push_token;
    if (ONESIGNAL_APP_ID && ONESIGNAL_REST_API_KEY && driverPushToken) {
      try {
        const pushRes = await fetch("https://onesignal.com/api/v1/notifications", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
          },
          body: JSON.stringify({
            app_id: ONESIGNAL_APP_ID,
            include_subscription_ids: [driverPushToken],
            headings: { en: `🚚 New Delivery Offer: ₦${payoutAmount.toLocaleString("en-NG")}` },
            contents: {
              en: `Order ${orderLabel} waiting for pickup. Tap to Accept within ${timeoutSeconds}s!`,
            },
            url: `https://carlyfresh.com/driver?accept=${order.id}`,
            data: {
              type: "delivery_offer",
              order_id: order.id,
              payout: payoutAmount,
              deadline: deadlineIso,
            },
            web_buttons: [
              { id: "accept", text: "✅ Accept Delivery", url: `https://carlyfresh.com/driver?accept=${order.id}` },
              { id: "decline", text: "❌ Decline", url: `https://carlyfresh.com/driver?decline=${order.id}` },
            ],
            buttons: [
              { id: "accept", text: "✅ Accept Delivery" },
              { id: "decline", text: "❌ Decline" },
            ],
          }),
        });
        pushSent = pushRes.ok;
      } catch (pushErr) {
        console.error("[dispatch-driver-proximity] Push error:", pushErr);
      }
    }

    // 9. Send Email to Driver with Accept CTA Button
    let emailSent = false;
    try {
      const { data: driverUser } = await supabase.auth.admin.getUserById(chosen.driver_id);
      const driverEmail = driverUser?.user?.email;
      if (driverEmail) {
        const emailUrl = `${SUPABASE_URL}/functions/v1/send-transactional-email`;
        const emailRes = await fetch(emailUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SERVICE_ROLE}`,
          },
          body: JSON.stringify({
            template: "driver_job_assigned",
            to: driverEmail,
            data: {
              order_id: order.id,
              order_number: order.order_number,
              driver_name: chosen.profile?.full_name || "Driver Partner",
              payout_amount: payoutAmount,
              pickup_address: body?.pickup_address || "Vendor Farm / Store",
              dropoff_address: order.delivery_address || "Customer Location",
              timeout_seconds: timeoutSeconds,
            },
          }),
        });
        emailSent = emailRes.ok;
      }
    } catch (emailErr) {
      console.error("[dispatch-driver-proximity] Email error:", emailErr);
    }

    return json({
      ok: true,
      order_id: order.id,
      driver_id: chosen.driver_id,
      payout_amount: payoutAmount,
      distance_km: chosen.distance_km,
      rating: chosen.rating,
      active_jobs: chosen.active_jobs,
      composite_score: chosen.composite_score,
      timeout_seconds: timeoutSeconds,
      deadline: deadlineIso,
      push_sent: pushSent,
      email_sent: emailSent,
      remaining_candidates: candidates.length - 1,
    });
  } catch (error) {
    console.error("[dispatch-driver-proximity]", error);
    return json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});
