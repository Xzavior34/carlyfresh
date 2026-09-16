// Supabase Edge Function — dispatch-driver-proximity
// Finds nearby available drivers (using recent driver_locations) and assigns
// the closest one to an order. Accepts either a database webhook payload
// ({ record: order }) or a direct call ({ order_id, pickup?, radius_km? }).
// Auth: verify_jwt = false; uses the service role key server-side.

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

    const radiusKm = Number(body?.radius_km) || 15;
    const stalenessMinutes = Number(body?.staleness_minutes) || 30;

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    // 1. Load the order.
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, order_number, vendor_id, buyer_id, assigned_driver_id, status, metadata, delivery_address")
      .eq("id", orderId)
      .maybeSingle();

    if (orderError) return json({ error: orderError.message }, 400);
    if (!order) return json({ error: "Order not found." }, 404);

    // Never re-assign an order that already has a driver unless explicitly forced.
    if (order.assigned_driver_id && !body?.force) {
      return json({
        skipped: true,
        reason: "Order already has an assigned driver.",
        driver_id: order.assigned_driver_id,
      });
    }

    // 2. Resolve pickup coordinates (body > order metadata > none).
    const pickup = extractPickup(body?.pickup) ?? extractPickup(order.metadata);
    const staleBefore = new Date(Date.now() - stalenessMinutes * 60_000).toISOString();

    // 3. Find candidate drivers: role = driver with a recent location ping.
    const [rolesRes, locationsRes, activeJobsRes] = await Promise.all([
      supabase.from("user_roles").select("user_id").eq("role", "driver"),
      supabase
        .from("driver_locations")
        .select("driver_id, latitude, longitude, updated_at")
        .gte("updated_at", staleBefore)
        .order("updated_at", { ascending: false }),
      supabase
        .from("delivery_jobs")
        .select("driver_id")
        .in("status", ["accepted", "assigned", "picked_up", "in_transit", "in-transit"]),
    ]);

    if (rolesRes.error || locationsRes.error || activeJobsRes.error) {
      const first = rolesRes.error || locationsRes.error || activeJobsRes.error;
      return json({ error: first?.message ?? "Failed to load drivers." }, 400);
    }

    const driverIds = new Set((rolesRes.data ?? []).map((r) => r.user_id));
    const busyDrivers = new Set((activeJobsRes.data ?? []).map((j) => j.driver_id));

    // Latest location per driver.
    const latestLocation = new Map<string, { lat: number; lng: number; updated_at: string }>();
    for (const loc of locationsRes.data ?? []) {
      if (!driverIds.has(loc.driver_id)) continue;
      if (busyDrivers.has(loc.driver_id)) continue;
      if (loc.driver_id === order.vendor_id || loc.driver_id === order.buyer_id) continue;
      if (!latestLocation.has(loc.driver_id)) {
        latestLocation.set(loc.driver_id, {
          lat: Number(loc.latitude),
          lng: Number(loc.longitude),
          updated_at: loc.updated_at,
        });
      }
    }

    if (latestLocation.size === 0) {
      return json({
        skipped: true,
        reason: "No available drivers with a recent location. Order stays open for manual assignment.",
      });
    }

    // 4. Rank drivers: by distance to pickup when coordinates exist, else by recency.
    const ranked = [...latestLocation.entries()]
      .map(([driver_id, loc]) => ({
        driver_id,
        ...loc,
        distance_km: pickup ? distanceKm(pickup, loc) : null,
      }))
      .sort((a, b) => {
        if (a.distance_km != null && b.distance_km != null) return a.distance_km - b.distance_km;
        return b.updated_at.localeCompare(a.updated_at);
      });

    const eligible = pickup ? ranked.filter((d) => (d.distance_km ?? Infinity) <= radiusKm) : ranked;
    const chosen = eligible[0] ?? null;

    if (!chosen) {
      return json({
        skipped: true,
        reason: `No available driver within ${radiusKm} km of the pickup point.`,
        nearest_driver_km: ranked[0]?.distance_km ?? null,
      });
    }

    // 5. Assign the driver to the order and its delivery job.
    const [orderUpdate, jobUpdate] = await Promise.all([
      supabase
        .from("orders")
        .update({ assigned_driver_id: chosen.driver_id, status: "driver_assigned", updated_at: new Date().toISOString() })
        .eq("id", order.id)
        .select("id")
        .single(),
      supabase
        .from("delivery_jobs")
        .update({ driver_id: chosen.driver_id, status: "assigned", updated_at: new Date().toISOString() })
        .eq("order_id", order.id)
        .select("id")
        .single(),
    ]);

    if (orderUpdate.error || jobUpdate.error) {
      const first = orderUpdate.error || jobUpdate.error;
      return json({ error: first?.message ?? "Failed to assign driver." }, 400);
    }

    // 6. Notify in-app and via push (best-effort).
    const orderLabel = order.order_number ? `#${order.order_number}` : "";
    await supabase.from("notifications").insert([
      {
        user_id: chosen.driver_id,
        type: "delivery_assigned",
        title: "New delivery near you",
        message: `You were assigned order ${orderLabel}. Pick it up and deliver on time.`,
        link: "/driver/active",
      },
      {
        user_id: order.buyer_id,
        type: "order_driver_assigned",
        title: "Driver assigned",
        message: `A driver is heading to pick up your order ${orderLabel}.`,
        link: `/orders/${order.id}`,
      },
    ]);

    let pushSent = false;
    if (ONESIGNAL_APP_ID && ONESIGNAL_REST_API_KEY) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("push_token")
        .eq("user_id", chosen.driver_id)
        .maybeSingle();
      if (profile?.push_token) {
        const res = await fetch("https://onesignal.com/api/v1/notifications", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
          },
          body: JSON.stringify({
            app_id: ONESIGNAL_APP_ID,
            include_subscription_ids: [profile.push_token],
            headings: { en: "CarlyFresh" },
            contents: { en: `New delivery assigned ${orderLabel}. Open your driver app for pickup details.` },
          }),
        });
        pushSent = res.ok;
      }
    }

    return json({
      ok: true,
      order_id: order.id,
      driver_id: chosen.driver_id,
      distance_km: chosen.distance_km,
      pickup_coordinates_used: Boolean(pickup),
      push_sent: pushSent,
    });
  } catch (error) {
    console.error("[dispatch-driver-proximity]", error);
    return json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});
