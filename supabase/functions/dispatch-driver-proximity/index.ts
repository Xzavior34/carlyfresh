import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Haversine formula to compute distance in kilometres
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { order_id, vendor_lat, vendor_lon, pickup_address, dropoff_address, payout_amount } = await req.json();

    if (!order_id) {
      throw new Error("order_id is required.");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const ONESIGNAL_APP_ID = Deno.env.get("ONESIGNAL_APP_ID");
    const ONESIGNAL_REST_API_KEY = Deno.env.get("ONESIGNAL_REST_API_KEY");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. Fetch Order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*, profiles:vendor_id(full_name, business_name, farm_location)")
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      throw new Error(orderError?.message || "Order not found");
    }

    const payout = Number(payout_amount || 1500);
    const resolvedPickup = pickup_address || (order as any).profiles?.farm_location || "Vendor Location";
    const resolvedDropoff = dropoff_address || order.delivery_address || "Customer Address";

    // 2. Create or Update Delivery Job
    const { data: existingJob } = await supabase
      .from("delivery_jobs")
      .select("id")
      .eq("order_id", order_id)
      .maybeSingle();

    let jobId = existingJob?.id;

    if (existingJob) {
      await supabase
        .from("delivery_jobs")
        .update({
          status: "available",
          pickup_address: resolvedPickup,
          dropoff_address: resolvedDropoff,
          payout_amount: payout,
        })
        .eq("id", existingJob.id);
    } else {
      const { data: newJob, error: createError } = await supabase
        .from("delivery_jobs")
        .insert({
          order_id: order_id,
          status: "available",
          pickup_address: resolvedPickup,
          dropoff_address: resolvedDropoff,
          payout_amount: payout,
        })
        .select("id")
        .single();

      if (createError) throw createError;
      jobId = newJob?.id;
    }

    // 3. Query Active Drivers and their Locations
    const { data: driverLocs } = await supabase
      .from("driver_locations")
      .select("driver_id, latitude, longitude, updated_at");

    // Also get all driver role users
    const { data: driverRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "driver");

    const driverUserIds = (driverRoles || []).map((d) => d.user_id);

    // Filter/rank drivers by proximity if coordinates are provided
    let targetDriverIds: string[] = driverUserIds;
    if (vendor_lat && vendor_lon && driverLocs && driverLocs.length > 0) {
      const ranked = driverLocs
        .map((loc) => ({
          driver_id: loc.driver_id,
          distanceKm: getDistanceKm(vendor_lat, vendor_lon, loc.latitude, loc.longitude),
        }))
        .sort((a, b) => a.distanceKm - b.distanceKm);

      // Target closest drivers within 25km radius (or all if none close)
      const nearby = ranked.filter((r) => r.distanceKm <= 25).map((r) => r.driver_id);
      if (nearby.length > 0) {
        targetDriverIds = nearby;
      }
    }

    // 4. Send OneSignal Push to Nearby Drivers
    let notificationsSent = false;
    if (ONESIGNAL_APP_ID && ONESIGNAL_REST_API_KEY && targetDriverIds.length > 0) {
      try {
        const orderNum = order.order_number || order.id.slice(0, 8);
        const pushBody = {
          app_id: ONESIGNAL_APP_ID,
          include_aliases: { external_id: targetDriverIds },
          target_channel: "push",
          headings: { en: `🚚 New Delivery Available! (₦${payout.toLocaleString("en-NG")} Payout)` },
          contents: {
            en: `Order #${orderNum} is prepared and ready for pickup at ${resolvedPickup}. Tap to accept.`,
          },
          data: {
            order_id: order.id,
            job_id: jobId,
            action_type: "claim_delivery",
            url: "/driver",
          },
        };

        const pushRes = await fetch("https://onesignal.com/api/v1/notifications", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
          },
          body: JSON.stringify(pushBody),
        });
        notificationsSent = pushRes.ok;
      } catch (pErr) {
        console.warn("Driver push notification failed:", pErr);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        job_id: jobId,
        targeted_drivers_count: targetDriverIds.length,
        notifications_sent: notificationsSent,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("dispatch-driver-proximity error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
