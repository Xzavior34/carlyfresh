// SLA tick — invoked by pg_cron every minute or on-demand background worker.
// 1. Supplier missed: pending orders older than deadline / 10 min → alert/cancelled.
// 2. Driver missed: delivery_jobs in awaiting_driver with sla_deadline < now()
//    → Disqualify timed-out driver, apply rating penalty, and AUTOMATICALLY cascade
//      and assign the order to the next most available driver!

import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const now = new Date().toISOString();
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

    // 1. Supplier SLA — auto-cancel or mark orders pending > 10 min
    const { data: missedOrders } = await admin
      .from("orders")
      .update({ status: "cancelled" })
      .eq("status", "pending")
      .lt("created_at", tenMinAgo)
      .select("id");

    // 2. Driver SLA — jobs in awaiting_driver past deadline get cascaded to next driver
    const { data: expiredJobs } = await admin
      .from("delivery_jobs")
      .select("id, order_id, driver_id, sla_deadline, status, pickup_address, dropoff_address, payout_amount")
      .eq("status", "awaiting_driver")
      .lt("sla_deadline", now);

    const reassignedResults = [];

    for (const job of expiredJobs ?? []) {
      const timedOutDriverId = job.driver_id;

      if (timedOutDriverId) {
        // Minor penalty for non-response within SLA
        const { data: prof } = await admin
          .from("profiles")
          .select("driver_rating")
          .eq("user_id", timedOutDriverId)
          .maybeSingle();

        const newRating = Math.max(0, Number(prof?.driver_rating ?? 5) - 0.05);
        await admin.from("profiles").update({ driver_rating: newRating }).eq("user_id", timedOutDriverId);

        // Notify the timed-out driver
        await admin.from("notifications").insert([
          {
            user_id: timedOutDriverId,
            type: "delivery_timeout",
            title: "Delivery Offer Expired ⏳",
            message: "You did not confirm the delivery offer in time. It has been reassigned to the next available driver.",
            link: "/driver",
          },
        ]);
      }

      // Fetch existing order metadata to exclude this driver in cascade
      const { data: order } = await admin
        .from("orders")
        .select("id, metadata")
        .eq("id", job.order_id)
        .maybeSingle();

      const meta = (order?.metadata && typeof order?.metadata === "object" ? order.metadata : {}) as Record<string, any>;
      const declinedList: string[] = Array.isArray(meta.declined_drivers) ? [...meta.declined_drivers] : [];
      if (timedOutDriverId && !declinedList.includes(timedOutDriverId)) {
        declinedList.push(timedOutDriverId);
      }

      // Reset job to available before reassignment
      await admin
        .from("delivery_jobs")
        .update({ driver_id: null, status: "available", sla_deadline: null })
        .eq("id", job.id);

      await admin
        .from("orders")
        .update({
          assigned_driver_id: null,
          driver_assignment_deadline: null,
          metadata: { ...meta, declined_drivers: declinedList },
        })
        .eq("id", job.order_id);

      // AUTOMATIC CASCADE: Call dispatch-driver-proximity to assign the NEXT available driver
      try {
        const dispatchUrl = `${SUPABASE_URL}/functions/v1/dispatch-driver-proximity`;
        const dispatchRes = await fetch(dispatchUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SERVICE_KEY}`,
          },
          body: JSON.stringify({
            order_id: job.order_id,
            exclude_driver_ids: declinedList,
            payout_amount: job.payout_amount,
            pickup_address: job.pickup_address,
            dropoff_address: job.dropoff_address,
            force: true,
          }),
        });

        const cascadeData = await dispatchRes.json();
        reassignedResults.push({ order_id: job.order_id, cascade: cascadeData });
      } catch (cascadeErr) {
        console.error("[sla-tick] Cascade error for order:", job.order_id, cascadeErr);
      }
    }

    const result = {
      ok: true,
      supplier_missed: missedOrders?.length ?? 0,
      driver_expired_count: expiredJobs?.length ?? 0,
      reassigned_results: reassignedResults,
      at: now,
    };

    console.log("[sla-tick]", result);
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[sla-tick] Error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
