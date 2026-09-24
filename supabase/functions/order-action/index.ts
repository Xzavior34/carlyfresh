// Supabase Edge Function — order-action
// Handles 1-tap Accept / Decline actions for Vendors and Drivers.
// Supports:
// - driver_accept / claim: confirms assignment and locks job
// - driver_decline: rejects offer and immediately cascades to the NEXT most available driver
// - vendor_accept: confirms order and moves to preparing
// - vendor_decline: cancels order or triggers vendor reassignment

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
    const body = await req.json().catch(() => ({}));
    const { token, action, driver_id, order_id, vendor_id, reason } = body;

    const act = action || body?.type;
    const targetOrderId = order_id || token;

    if (!act || !targetOrderId) {
      return new Response(
        JSON.stringify({ error: "action and order_id (or token) are required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // ──────────────────────────────────────────────────────────────────────────
    // 1. DRIVER ACCEPT ACTION
    // ──────────────────────────────────────────────────────────────────────────
    if (act === "driver_accept" || act === "claim" || act === "accept_delivery") {
      const activeDriverId = driver_id || body?.user_id;
      if (!activeDriverId) {
        return new Response(
          JSON.stringify({ error: "driver_id required to accept delivery" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check order
      const { data: order, error: ordErr } = await admin
        .from("orders")
        .select("id, order_number, vendor_id, buyer_id, assigned_driver_id, status, metadata")
        .eq("id", targetOrderId)
        .maybeSingle();

      if (ordErr || !order) {
        return new Response(
          JSON.stringify({ ok: false, error: "Order not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify that the offer is still open to this driver or available in pool
      const isMyOffer = order.assigned_driver_id === activeDriverId;
      const isUnassigned = !order.assigned_driver_id;
      if (!isMyOffer && !isUnassigned) {
        return new Response(
          JSON.stringify({
            ok: false,
            error: "This delivery was already assigned or passed to another driver.",
          }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const now = new Date().toISOString();

      // Atomically update delivery_jobs and orders
      const [jobRes, orderRes] = await Promise.all([
        admin
          .from("delivery_jobs")
          .update({
            driver_id: activeDriverId,
            status: "accepted",
            sla_deadline: null,
            updated_at: now,
          })
          .eq("order_id", order.id)
          .select()
          .maybeSingle(),
        admin
          .from("orders")
          .update({
            assigned_driver_id: activeDriverId,
            status: "driver_assigned",
            driver_assignment_deadline: null,
            updated_at: now,
          })
          .eq("id", order.id)
          .select()
          .maybeSingle(),
      ]);

      if (jobRes.error || orderRes.error) {
        const first = jobRes.error || orderRes.error;
        return new Response(
          JSON.stringify({ ok: false, error: first?.message ?? "Failed to accept job" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Notify Buyer and Vendor
      const orderLabel = order.order_number ? `#${order.order_number}` : `#${order.id.slice(0, 8)}`;
      await admin.from("notifications").insert([
        {
          user_id: order.buyer_id,
          type: "order_driver_assigned",
          title: "Driver on the way 🚚",
          message: `A driver has accepted order ${orderLabel} and is heading to pick it up.`,
          link: `/orders/${order.id}`,
        },
        {
          user_id: order.vendor_id,
          type: "order_driver_assigned",
          title: "Driver assigned 🚚",
          message: `A driver has accepted order ${orderLabel} for pickup.`,
          link: `/vendor/orders`,
        },
      ]);

      return new Response(
        JSON.stringify({
          ok: true,
          message: "Delivery accepted successfully!",
          order: orderRes.data,
          job: jobRes.data,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 2. DRIVER DECLINE ACTION (CASCADES TO NEXT AVAILABLE DRIVER)
    // ──────────────────────────────────────────────────────────────────────────
    if (act === "driver_decline" || act === "decline_delivery") {
      const decliningDriverId = driver_id || body?.user_id;

      const { data: order } = await admin
        .from("orders")
        .select("id, order_number, vendor_id, buyer_id, assigned_driver_id, metadata, delivery_address")
        .eq("id", targetOrderId)
        .maybeSingle();

      if (!order) {
        return new Response(
          JSON.stringify({ error: "Order not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const meta = (order.metadata && typeof order.metadata === "object" ? order.metadata : {}) as Record<string, any>;
      const declinedList: string[] = Array.isArray(meta.declined_drivers) ? [...meta.declined_drivers] : [];
      if (decliningDriverId && !declinedList.includes(decliningDriverId)) {
        declinedList.push(decliningDriverId);
      }

      // Reset driver on order
      await admin
        .from("orders")
        .update({
          assigned_driver_id: null,
          driver_assignment_deadline: null,
          metadata: { ...meta, declined_drivers: declinedList },
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id);

      await admin
        .from("delivery_jobs")
        .update({
          driver_id: null,
          status: "available",
          sla_deadline: null,
          updated_at: new Date().toISOString(),
        })
        .eq("order_id", order.id);

      // Immediately trigger dispatch to the NEXT most available driver
      let nextCandidateResult = null;
      try {
        const dispatchUrl = `${SUPABASE_URL}/functions/v1/dispatch-driver-proximity`;
        const dispatchRes = await fetch(dispatchUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SERVICE_KEY}`,
          },
          body: JSON.stringify({
            order_id: order.id,
            exclude_driver_ids: declinedList,
            force: true,
          }),
        });
        nextCandidateResult = await dispatchRes.json();
      } catch (err) {
        console.error("Error triggering cascade dispatch:", err);
      }

      return new Response(
        JSON.stringify({
          ok: true,
          message: "Delivery declined. Reassigned to next available driver.",
          cascade: nextCandidateResult,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 3. VENDOR ACCEPT ACTION
    // ──────────────────────────────────────────────────────────────────────────
    if (act === "vendor_accept" || act === "accept") {
      const now = new Date().toISOString();
      const { data: order, error } = await admin
        .from("orders")
        .update({
          status: "preparing",
          vendor_decision_at: now,
          vendor_decision_source: "notification_button",
          updated_at: now,
        })
        .eq("id", targetOrderId)
        .in("status", ["pending", "confirmed", "awaiting_supplier"])
        .select()
        .maybeSingle();

      if (error || !order) {
        return new Response(
          JSON.stringify({ ok: false, error: "Order not found or already processed" }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const orderLabel = order.order_number ? `#${order.order_number}` : `#${order.id.slice(0, 8)}`;
      await admin.from("notifications").insert([
        {
          user_id: order.buyer_id,
          type: "order_preparing",
          title: "Order Accepted! 🍳",
          message: `The vendor has accepted your order ${orderLabel} and is preparing it.`,
          link: `/orders/${order.id}`,
        },
      ]);

      return new Response(
        JSON.stringify({ ok: true, message: "Order accepted. Preparation started.", order }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 4. VENDOR DECLINE ACTION
    // ──────────────────────────────────────────────────────────────────────────
    if (act === "vendor_decline" || act === "reject") {
      const now = new Date().toISOString();
      const { data: order, error } = await admin
        .from("orders")
        .update({
          status: "cancelled",
          vendor_decision_at: now,
          vendor_decision_source: "declined",
          updated_at: now,
        })
        .eq("id", targetOrderId)
        .in("status", ["pending", "confirmed", "awaiting_supplier"])
        .select()
        .maybeSingle();

      if (error || !order) {
        return new Response(
          JSON.stringify({ ok: false, error: "Order not found or already processed" }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const orderLabel = order.order_number ? `#${order.order_number}` : `#${order.id.slice(0, 8)}`;
      await admin.from("notifications").insert([
        {
          user_id: order.buyer_id,
          type: "order_cancelled",
          title: "Order Update",
          message: `Order ${orderLabel} could not be fulfilled by the vendor and was cancelled.`,
          link: `/orders/${order.id}`,
        },
      ]);

      return new Response(
        JSON.stringify({ ok: true, message: "Order declined and cancelled.", order }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: `Unknown action: ${act}` }), {
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
