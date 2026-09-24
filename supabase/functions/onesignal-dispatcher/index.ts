import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ONESIGNAL_REST_API_KEY = Deno.env.get("ONESIGNAL_REST_API_KEY") ?? "";
const ONESIGNAL_APP_ID = Deno.env.get("ONESIGNAL_APP_ID") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("Received webhook payload:", JSON.stringify(body));

    const record = body.record ?? body;
    if (!record) {
      return new Response(JSON.stringify({ error: "Missing record payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const status = record.status;
    let targetUserId: string | null = null;
    let pushTitle = "CarlyFresh";
    let pushMessage = "";
    let actionUrl = "https://carlyfresh.com";
    let buttons: any[] = [];
    let webButtons: any[] = [];

    const orderNum = record.order_number ? `#${record.order_number}` : `#${record.id?.slice(0, 8) || ""}`;

    if (status === "pending" || status === "awaiting_supplier") {
      targetUserId = record.vendor_id;
      pushTitle = `🎉 New Order ${orderNum}`;
      pushMessage = `New order received for ₦${Number(record.total_amount || 0).toLocaleString("en-NG")}. Tap to Accept or Decline.`;
      actionUrl = `https://carlyfresh.com/vendor/orders?open=${record.id}`;
      webButtons = [
        { id: "accept_order", text: "✅ Accept Order", url: `https://carlyfresh.com/vendor/orders?open=${record.id}&accept=true` },
        { id: "decline_order", text: "❌ Decline", url: `https://carlyfresh.com/vendor/orders?open=${record.id}&decline=true` },
      ];
      buttons = [
        { id: "accept_order", text: "✅ Accept Order" },
        { id: "decline_order", text: "❌ Decline" },
      ];
    } else if (status === "awaiting_driver" || status === "driver_assigned") {
      // If it's sent to the driver for acceptance
      if (record.assigned_driver_id && record.status === "awaiting_driver") {
        targetUserId = record.assigned_driver_id;
        pushTitle = `🚚 Delivery Offer ${orderNum}`;
        pushMessage = `New delivery offer available. Tap to Accept within 90s.`;
        actionUrl = `https://carlyfresh.com/driver?accept=${record.id}`;
        webButtons = [
          { id: "accept_delivery", text: "✅ Accept Delivery", url: `https://carlyfresh.com/driver?accept=${record.id}` },
          { id: "decline_delivery", text: "❌ Decline", url: `https://carlyfresh.com/driver?decline=${record.id}` },
        ];
        buttons = [
          { id: "accept_delivery", text: "✅ Accept Delivery" },
          { id: "decline_delivery", text: "❌ Decline" },
        ];
      } else {
        // Driver assigned notification to buyer
        targetUserId = record.buyer_id ?? record.customer_id;
        pushTitle = `🚚 Driver Heading to Pickup`;
        pushMessage = `A driver was assigned to your order ${orderNum} and is on the way!`;
        actionUrl = `https://carlyfresh.com/orders/${record.id}`;
      }
    } else if (status === "in-transit" || status === "in_transit") {
      targetUserId = record.buyer_id ?? record.customer_id;
      pushTitle = `📦 Order In Transit`;
      pushMessage = `Your order ${orderNum} is out for delivery with your driver!`;
      actionUrl = `https://carlyfresh.com/orders/${record.id}`;
    } else if (status === "delivered") {
      targetUserId = record.buyer_id ?? record.customer_id;
      pushTitle = `🎉 Order Delivered!`;
      pushMessage = `Your CarlyFresh order ${orderNum} has arrived. Enjoy your fresh produce!`;
      actionUrl = `https://carlyfresh.com/orders/${record.id}`;
    }

    if (!targetUserId || !pushMessage) {
      console.log(`No routing defined for status: ${status} or target user not found.`);
      return new Response(
        JSON.stringify({ skipped: true, reason: `No notification logic for status: ${status}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase Client
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Query profiles to get push_token
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("push_token")
      .eq("user_id", targetUserId)
      .single();

    if (profileError || !profile?.push_token) {
      console.log(`No push_token for user_id ${targetUserId}`);
      return new Response(
        JSON.stringify({ skipped: true, reason: "Target user has no push token registered" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const pushToken = profile.push_token;

    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
      return new Response(
        JSON.stringify({ ok: false, error: "OneSignal credentials missing" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload: any = {
      app_id: ONESIGNAL_APP_ID,
      include_subscription_ids: [pushToken],
      headings: { en: pushTitle },
      contents: { en: pushMessage },
      url: actionUrl,
      data: {
        order_id: record.id,
        status: status,
      },
    };

    if (webButtons.length > 0) payload.web_buttons = webButtons;
    if (buttons.length > 0) payload.buttons = buttons;

    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();
    return new Response(JSON.stringify({ ok: true, onesignal: responseData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in onesignal-dispatcher:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
