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

    // The webhook payload contains `record` (the updated order row) or standard JSON if called directly
    const record = body.record ?? body;
    if (!record) {
      return new Response(JSON.stringify({ error: "Missing record payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const status = record.status;
    let targetUserId: string | null = null;
    let pushMessage = "";

    if (status === "pending") {
      targetUserId = record.vendor_id;
      pushMessage = "New Order ! Please confirm.";
    } else if (status === "driver_assigned") {
      // orders table uses buyer_id; fall back to customer_id for safety
      targetUserId = record.buyer_id ?? record.customer_id;
      pushMessage = "A driver is heading to pick up your order!";
    } else if (status === "delivered") {
      // orders table uses buyer_id; fall back to customer_id for safety
      targetUserId = record.buyer_id ?? record.customer_id;
      pushMessage = "Your CarlyFresh order has arrived!";
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

    // Query profiles to get push_token (OneSignal subscription ID) using targetUserId
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("push_token")
      .eq("user_id", targetUserId)
      .single();

    if (profileError) {
      console.log(`Error fetching profile for user_id ${targetUserId}:`, profileError);
      return new Response(JSON.stringify({ error: profileError.message }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const pushToken = profile?.push_token;
    if (!pushToken) {
      console.log(`No push_token registered for user_id: ${targetUserId}`);
      return new Response(
        JSON.stringify({ skipped: true, reason: "Target user has no push token registered" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Guard: ensure OneSignal credentials are present
    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
      console.warn("OneSignal credentials not configured. Skipping push notification.");
      return new Response(
        JSON.stringify({
          ok: false,
          error: "OneSignal credentials missing (ONESIGNAL_APP_ID, ONESIGNAL_REST_API_KEY)",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send push notification via OneSignal v1 API.
    // pushToken = os.User.PushSubscription.id from the SDK v16 (a subscription UUID).
    // We use include_subscription_ids — the correct field for SDK v16+ subscription IDs.
    // (Legacy include_player_ids is for older player UUIDs and will not match new subscriptions.)
    console.log(`Sending push to OneSignal subscription ID: ${pushToken} -> "${pushMessage}"`);

    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        include_subscription_ids: [pushToken],
        headings: { en: "CarlyFresh" },
        contents: { en: pushMessage },
      }),
    });

    const responseData = await response.json();
    console.log("OneSignal API response status:", response.status, "body:", JSON.stringify(responseData));

    if (!response.ok) {
      throw new Error(
        `OneSignal returned non-ok status: ${response.status} - ${JSON.stringify(responseData)}`
      );
    }

    return new Response(JSON.stringify({ ok: true, onesignal: responseData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.log("Error in onesignal-dispatcher:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
