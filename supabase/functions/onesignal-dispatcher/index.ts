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
      pushMessage = "New Order 🚨! Please confirm.";
    } else if (status === "driver_assigned") {
      // Handles both customer_id (from requirement) and buyer_id (from orders schema)
      targetUserId = record.customer_id ?? record.buyer_id;
      pushMessage = "A driver is heading to pick up your order! 🚗";
    } else if (status === "delivered") {
      // Handles both customer_id (from requirement) and buyer_id (from orders schema)
      targetUserId = record.customer_id ?? record.buyer_id;
      pushMessage = "Your CarlyFresh order has arrived! 🎉";
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

    // Query profiles to get push_token using targetUserId
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("push_token")
      .eq("user_id", targetUserId)
      .single();

    if (profileError) {
      console.error(`Error fetching profile for user_id ${targetUserId}:`, profileError);
      return new Response(JSON.stringify({ error: profileError.message }), {
        status: 500,
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

    // Send push notification via OneSignal
    console.log(`Sending push to OneSignal player ID: ${pushToken} with message: "${pushMessage}"`);
    
    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
      console.warn("OneSignal credentials are not configured. Skipping OneSignal fetch request.");
      return new Response(
        JSON.stringify({
          ok: false,
          error: "OneSignal credentials missing from Deno environment variables",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        include_player_ids: [pushToken],
        headings: { en: "CarlyFresh" },
        contents: { en: pushMessage },
      }),
    });

    const responseData = await response.json();
    console.log("OneSignal API response status:", response.status, "body:", responseData);

    if (!response.ok) {
      throw new Error(`OneSignal returned non-ok status: ${response.status} - ${JSON.stringify(responseData)}`);
    }

    return new Response(JSON.stringify({ ok: true, onesignal: responseData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in onesignal-dispatcher:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
