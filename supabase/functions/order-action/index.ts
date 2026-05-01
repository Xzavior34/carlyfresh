// Token-signed Accept / Reject (supplier) and Claim (driver) endpoint.
// Called from links in transactional emails. No auth required because the token IS the auth.

import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { token, action, driver_id } = await req.json();
    if (!token || !action) {
      return new Response(JSON.stringify({ error: "token and action required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    if (action === "claim") {
      // Driver claim: atomic — first claimant wins via row lock on status='available'
      if (!driver_id) {
        return new Response(JSON.stringify({ error: "driver_id required to claim" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: job, error } = await admin
        .from("delivery_jobs")
        .update({ driver_id, status: "assigned" })
        .eq("claim_token", token)
        .in("status", ["available", "awaiting_driver"])
        .select()
        .maybeSingle();

      if (error || !job) {
        return new Response(
          JSON.stringify({ ok: false, error: "Job already claimed or invalid token" }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      return new Response(JSON.stringify({ ok: true, job }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Supplier accept / reject — token is the order id (simple stub; rotate to signed token later)
    if (action === "accept" || action === "reject") {
      const newStatus = action === "accept" ? "confirmed" : "cancelled";
      const { data: order, error } = await admin
        .from("orders")
        .update({ status: newStatus })
        .eq("id", token)
        .in("status", ["pending", "awaiting_supplier"])
        .select()
        .maybeSingle();

      if (error || !order) {
        return new Response(
          JSON.stringify({ ok: false, error: "Order not found or already processed" }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      return new Response(JSON.stringify({ ok: true, order }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("order-action error", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
