// Supabase Edge Function — notify-vendor-whatsapp
// Notifies the vendor about a new order on WhatsApp (WhatsApp Cloud API) and
// always records an in-app notification as a guaranteed fallback.
// Accepts a database webhook payload ({ record: order }) or a direct call
// ({ order_id } or a full order record).
// Optional secrets: WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID.
// Auth: verify_jwt = false; uses the service role key server-side.

import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const WHATSAPP_TOKEN = Deno.env.get("WHATSAPP_TOKEN") ?? "";
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID") ?? "";

/** Normalise a phone number to an E.164-ish digit string (defaults to Nigeria +234). */
function toWhatsAppNumber(raw: string): string | null {
  let digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = `234${digits.slice(1)}`;
  if (digits.length <= 10) digits = `234${digits}`;
  return digits.length >= 11 && digits.length <= 15 ? digits : null;
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
    const order = body?.record ?? body?.order ?? body ?? {};

    let orderId: string | undefined = body?.order_id ?? order?.id;

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    // When called with only an id (or a webhook for a different table), reload the order.
    let fullOrder = order;
    if (!orderId || !order?.vendor_id) {
      if (!orderId) return json({ error: "order_id is required." }, 400);
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, vendor_id, buyer_id, total_amount, delivery_address, items")
        .eq("id", orderId)
        .maybeSingle();
      if (error) return json({ error: error.message }, 400);
      if (!data) return json({ error: "Order not found." }, 404);
      fullOrder = data;
    }

    // 1. Load the vendor profile.
    const { data: vendor, error: vendorError } = await supabase
      .from("profiles")
      .select("user_id, business_name, full_name, phone")
      .eq("user_id", fullOrder.vendor_id)
      .maybeSingle();

    if (vendorError) return json({ error: vendorError.message }, 400);
    if (!vendor) return json({ error: "Vendor profile not found." }, 404);

    const orderLabel = fullOrder.order_number ? `#${fullOrder.order_number}` : "";
    const total = Number(fullOrder.total_amount ?? 0).toLocaleString("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    });
    const message =
      `🛒 New CarlyFresh order ${orderLabel}!\n` +
      `Total: ${total}\n` +
      `Deliver to: ${fullOrder.delivery_address ?? "address on file"}\n` +
      `Open your vendor portal to confirm and prepare this order.`;

    // 2. Guaranteed in-app notification.
    const { error: notifError } = await supabase.from("notifications").insert({
      user_id: vendor.user_id,
      type: "order_new_whatsapp",
      title: "New order received",
      message: `New paid order ${orderLabel} — ${total}. Confirm and start preparing.`,
      link: "/vendor/orders",
    });
    if (notifError) console.error("[notify-vendor-whatsapp] in-app notification failed:", notifError.message);

    // 3. WhatsApp send when credentials are configured.
    if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
      return json({
        ok: true,
        whatsapp: "skipped",
        reason: "WHATSAPP_TOKEN / WHATSAPP_PHONE_NUMBER_ID not configured — in-app notification sent instead.",
      });
    }

    if (!vendor.phone) {
      return json({
        ok: true,
        whatsapp: "skipped",
        reason: "Vendor has no phone number on their profile — in-app notification sent instead.",
      });
    }

    const to = toWhatsAppNumber(vendor.phone);
    if (!to) {
      return json({
        ok: true,
        whatsapp: "skipped",
        reason: `Vendor phone "${vendor.phone}" is not a valid WhatsApp number — in-app notification sent instead.`,
      });
    }

    const waRes = await fetch(`https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: message },
      }),
    });

    const waBody = await waRes.text();
    if (!waRes.ok) {
      console.error(`[notify-vendor-whatsapp] WhatsApp send failed (${waRes.status}): ${waBody}`);
      return json({
        ok: true,
        whatsapp: "failed",
        status: waRes.status,
        details: waBody,
        note: "In-app notification was still delivered.",
      });
    }

    return json({ ok: true, whatsapp: "sent", to });
  } catch (error) {
    console.error("[notify-vendor-whatsapp]", error);
    return json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});
