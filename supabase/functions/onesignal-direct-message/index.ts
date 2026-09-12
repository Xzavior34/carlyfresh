import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { receiver_id, message } = await req.json();

    if (!receiver_id || !message) {
      throw new Error("receiver_id and message are required.");
    }

    const ONESIGNAL_APP_ID = Deno.env.get("ONESIGNAL_APP_ID");
    const ONESIGNAL_REST_API_KEY = Deno.env.get("ONESIGNAL_REST_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
      throw new Error("OneSignal secrets are not configured.");
    }

    // ── Derive sender identity server-side from the JWT ────────────────────
    let senderDisplayName = "CarlyFresh";

    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const authHeader = req.headers.get("authorization") || "";
        // Create a client scoped to the calling user's JWT
        const userClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
          global: { headers: { authorization: authHeader } },
          auth: { persistSession: false },
        });

        const {
          data: { user },
        } = await userClient.auth.getUser();

        if (user) {
          // Fetch profile and role
          const [profileRes, roleRes] = await Promise.all([
            userClient
              .from("profiles")
              .select("full_name, business_name")
              .eq("user_id", user.id)
              .single(),
            userClient
              .from("user_roles")
              .select("role")
              .eq("user_id", user.id)
              .single(),
          ]);

          const role = roleRes.data?.role || "buyer";
          const profile = profileRes.data;

          if (role === "admin") {
            senderDisplayName = "CarlyFresh Admin";
          } else if (profile?.business_name) {
            senderDisplayName = profile.business_name;
          } else if (profile?.full_name) {
            senderDisplayName = profile.full_name;
          }
        }
      } catch (identityErr) {
        console.warn("Could not resolve sender identity:", identityErr);
        // Non-fatal: fall back to CarlyFresh
      }
    }

    // ── Send push via OneSignal ────────────────────────────────────────────
    const body = {
      app_id: ONESIGNAL_APP_ID,
      include_aliases: { external_id: [receiver_id] },
      target_channel: "push",
      headings: { en: `New message from ${senderDisplayName}` },
      contents: { en: message },
    };

    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    console.log("OneSignal direct message response:", data);

    if (!response.ok) {
      throw new Error(
        data.errors ? data.errors.join(", ") : "Failed to send push notification"
      );
    }

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Direct Message Push Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
