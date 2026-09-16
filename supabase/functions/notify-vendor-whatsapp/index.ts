import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderItem {
  name?: string;
  quantity?: number;
  price?: number;
  unit?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { order_id } = await req.json();

    if (!order_id) {
      throw new Error("order_id is required.");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const ONESIGNAL_APP_ID = Deno.env.get("ONESIGNAL_APP_ID");
    const ONESIGNAL_REST_API_KEY = Deno.env.get("ONESIGNAL_REST_API_KEY");
    const WHATSAPP_API_TOKEN = Deno.env.get("WHATSAPP_API_TOKEN");
    const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch order details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*, profiles:vendor_id(full_name, business_name, phone)")
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      throw new Error(orderError?.message || "Order not found");
    }

    const vendorProfile = (order as any).profiles;
    const vendorPhone = vendorProfile?.phone?.replace(/\D/g, "");
    const orderNumber = order.order_number || order.id.slice(0, 8);
    const items: OrderItem[] = Array.isArray(order.items) ? order.items : [];
    const itemsList = items
      .map((i) => `• ${i.name || "Item"} (${i.quantity || 1} ${i.unit || "unit"}) - ₦${Number((i.price || 0) * (i.quantity || 1)).toLocaleString("en-NG")}`)
      .join("\n");

    const whatsappMessage = `🚨 *NEW CARLYFRESH ORDER #${orderNumber}*\n\n` +
      `*Amount:* ₦${Number(order.total_amount).toLocaleString("en-NG")}\n` +
      `*Delivery Window:* ${order.delivery_window || "As soon as possible"}\n` +
      `*Delivery Address:* ${order.delivery_address || "Customer Address"}\n\n` +
      `*Items:*\n${itemsList || "No items listed"}\n\n` +
      `👉 *Action Required:*\n` +
      `Log in to your vendor portal to *Accept* or *Decline* this order:\n` +
      `https://carlyfresh.com/vendor/orders?orderId=${order.id}`;

    // 1. Send WhatsApp via Meta Cloud API if configured
    let whatsappSent = false;
    if (WHATSAPP_API_TOKEN && WHATSAPP_PHONE_NUMBER_ID && vendorPhone) {
      try {
        const formattedPhone = vendorPhone.startsWith("0") ? `234${vendorPhone.slice(1)}` : vendorPhone;
        const waResponse = await fetch(`https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${WHATSAPP_API_TOKEN}`,
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: formattedPhone,
            type: "text",
            text: { body: whatsappMessage },
          }),
        });
        const waData = await waResponse.json();
        console.log("WhatsApp Cloud API response:", waData);
        whatsappSent = waResponse.ok;
      } catch (waErr) {
        console.warn("WhatsApp API dispatch failed:", waErr);
      }
    }

    // 2. Send OneSignal Push to Vendor
    let pushSent = false;
    if (ONESIGNAL_APP_ID && ONESIGNAL_REST_API_KEY) {
      try {
        const pushBody = {
          app_id: ONESIGNAL_APP_ID,
          include_aliases: { external_id: [order.vendor_id] },
          target_channel: "push",
          headings: { en: `🚨 New Order #${orderNumber} Received!` },
          contents: {
            en: `₦${Number(order.total_amount).toLocaleString("en-NG")} — Tap to Accept and begin preparing.`,
          },
          data: {
            order_id: order.id,
            action_type: "new_order_review",
            url: `/vendor/orders?orderId=${order.id}`,
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
        pushSent = pushRes.ok;
      } catch (pErr) {
        console.warn("OneSignal Push dispatch failed:", pErr);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        order_id: order.id,
        whatsapp_sent: whatsappSent,
        push_sent: pushSent,
        whatsapp_text: whatsappMessage,
        vendor_phone: vendorPhone,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("notify-vendor-whatsapp error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
