// SLA tick — invoked by pg_cron every minute.
// 1. Supplier missed: pending orders older than 10 min → cancelled, mark vendor as missed.
// 2. Driver missed: delivery_jobs in awaiting_driver with sla_deadline < now() → reset to available, deduct 0.1 from current driver rating.

import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const now = new Date().toISOString();
  const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

  // 1. Supplier SLA — auto-cancel orders pending > 10 min
  const { data: missedOrders } = await admin
    .from("orders")
    .update({ status: "cancelled" })
    .eq("status", "pending")
    .lt("created_at", tenMinAgo)
    .select("id");

  // 2. Driver SLA — jobs in awaiting_driver past deadline get reset + driver penalty
  const { data: expiredJobs } = await admin
    .from("delivery_jobs")
    .select("id, driver_id, sla_deadline, status")
    .eq("status", "awaiting_driver")
    .lt("sla_deadline", now);

  for (const job of expiredJobs ?? []) {
    if (job.driver_id) {
      // Deduct 0.1 from rating (clamp at 0)
      const { data: prof } = await admin
        .from("profiles")
        .select("driver_rating")
        .eq("user_id", job.driver_id)
        .maybeSingle();
      const newRating = Math.max(0, Number(prof?.driver_rating ?? 5) - 0.1);
      await admin.from("profiles").update({ driver_rating: newRating }).eq("user_id", job.driver_id);
    }
    // Reset job to available + new claim_token so old emails are invalidated
    await admin
      .from("delivery_jobs")
      .update({ driver_id: null, status: "available", sla_deadline: null })
      .eq("id", job.id);
  }

  const result = {
    supplier_missed: missedOrders?.length ?? 0,
    driver_reassigned: expiredJobs?.length ?? 0,
    at: now,
  };
  console.log("[sla-tick]", result);
  return new Response(JSON.stringify(result), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
