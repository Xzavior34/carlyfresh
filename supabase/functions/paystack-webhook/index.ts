/**
 * Paystack Webhook — Edge Function
 * 
 * Listens for POST requests from Paystack, verifies the HMAC-SHA512 signature,
 * and updates the order status to 'processing' on successful payment.
 * 
 * The real-time subscription on the orders table will automatically
 * notify Vendor and Driver dashboards when the status changes.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Verify Paystack webhook signature using HMAC-SHA512.
 * Returns true only if the hash matches the x-paystack-signature header.
 */
async function verifyPaystackSignature(
  body: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"]
  );
  const signed = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const hashHex = Array.from(new Uint8Array(signed))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashHex === signature;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only accept POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!PAYSTACK_SECRET_KEY) {
      console.error("PAYSTACK_SECRET_KEY not configured");
      return new Response(JSON.stringify({ error: "Server misconfigured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Read the raw body for signature verification
    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature") || "";

    // Verify the signature — reject if invalid
    const isValid = await verifyPaystackSignature(rawBody, signature, PAYSTACK_SECRET_KEY);
    if (!isValid) {
      console.error("Invalid Paystack signature");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse the verified payload
    const payload = JSON.parse(rawBody);
    const event = payload.event;

    console.log(`Paystack event received: ${event}`);

    // Only process successful charges
    if (event === "charge.success") {
      const data = payload.data;
      const orderId = data?.metadata?.order_id;

      if (!orderId) {
        console.error("No order_id in metadata", data?.metadata);
        return new Response(JSON.stringify({ error: "Missing order_id" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Use the service role client to bypass RLS for this admin operation
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      // Update order status from 'pending' to 'processing' (paid)
      const { error: updateError } = await supabaseAdmin
        .from("orders")
        .update({ status: "processing" })
        .eq("id", orderId)
        .eq("status", "pending");

      if (updateError) {
        console.error("Failed to update order:", updateError.message);
        return new Response(JSON.stringify({ error: "DB update failed" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`Order ${orderId} marked as processing (paid)`);
    }

    // Always return 200 to Paystack so it doesn't retry
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
