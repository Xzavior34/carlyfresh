// Supabase Edge Function — notify-vendor-new-order
// Sends an email to the vendor when a new order is placed.
// Triggered by a Supabase database webhook on INSERT to public.orders.
// Auth: this function uses verify_jwt = false so the database webhook can call it.
// It validates a shared secret header (NOTIFY_WEBHOOK_SECRET) when set.

import { Resend } from "npm:resend@4.0.1";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};

interface OrderItem { product_id?: string; name?: string; quantity?: number; price?: number; unit?: string }

const RESEND_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const SHARED_SECRET = Deno.env.get("NOTIFY_WEBHOOK_SECRET") ?? "";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (SHARED_SECRET) {
      const provided = req.headers.get("x-webhook-secret") ?? "";
      if (provided !== SHARED_SECRET) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    const payload = await req.json();
    // Supabase database webhooks send: { type, table, record, old_record, schema }
    const order = payload?.record ?? payload?.order ?? payload;
    if (!order?.id || !order?.vendor_id) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Lookup vendor email via auth.users
    const { data: userRes } = await admin.auth.admin.getUserById(order.vendor_id);
    const vendorEmail = userRes?.user?.email;
    if (!vendorEmail) {
      return new Response(JSON.stringify({ error: "Vendor email not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const items: OrderItem[] = Array.isArray(order.items) ? order.items : [];
    const itemRows = items
      .map((i) => `<tr><td style="padding:8px;border-bottom:1px solid #eee;">${i.name ?? "Item"}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${i.quantity ?? 1} ${i.unit ?? ""}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">₦${Number(i.price ?? 0).toLocaleString("en-NG")}</td></tr>`) 
      .join("");

    const html = `
      <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0f172a;">
        <h1 style="font-size:22px;margin:0 0 8px;">🎉 New Order Received</h1>
        <p style="color:#64748b;margin:0 0 16px;">Order <strong>#${order.order_number ?? order.id.slice(0, 8)}</strong></p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:16px;">
          <thead><tr style="background:#f8fafc;"><th style="text-align:left;padding:8px;">Product</th><th style="padding:8px;">Qty</th><th style="text-align:right;padding:8px;">Price</th></tr></thead>
          <tbody>${itemRows || `<tr><td colspan="3" style="padding:12px;color:#64748b;">No items</td></tr>`}</tbody>
        </table>
        <p style="font-size:16px;"><strong>Total:</strong> ₦${Number(order.total_amount ?? 0).toLocaleString("en-NG")}</p>
        <p style="color:#64748b;font-size:13px;margin-top:24px;">Log in to your vendor portal to confirm and prepare this order.</p>
      </div>`;

    if (!RESEND_KEY) {
      console.log("[notify-vendor-new-order] RESEND_API_KEY missing — simulated send to", vendorEmail);
      return new Response(JSON.stringify({ ok: true, simulated: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const resend = new Resend(RESEND_KEY);
    const result = await resend.emails.send({
      from: "CarlyFresh Orders <noreply@carlyfresh.com>",
      to: [vendorEmail],
      subject: `New order #${order.order_number ?? order.id.slice(0, 8)} — ₦${Number(order.total_amount ?? 0).toLocaleString("en-NG")}`,
      html,
    });

    return new Response(JSON.stringify({ ok: true, id: result?.data?.id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("[notify-vendor-new-order]", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
