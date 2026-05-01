// Stub transactional email dispatcher.
// TODO: replace the simulated send with a real Resend call when the API key is provided.
// Templates: supplier_new_order, driver_job_available, order_status_update.

import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

interface Payload {
  template: "supplier_new_order" | "driver_job_available" | "order_status_update" | "test";
  to: string | string[];
  data?: Record<string, unknown>;
  subject?: string;
}

const APP_URL = Deno.env.get("APP_URL") ?? "https://carlyfresh.com";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY"); // not yet configured — stub mode

function renderTemplate(p: Payload): { subject: string; html: string } {
  const d = p.data ?? {};
  switch (p.template) {
    case "supplier_new_order": {
      const orderId = String(d.order_id ?? "");
      const acceptUrl = `${APP_URL}/order-action/${d.accept_token ?? ""}`;
      const rejectUrl = `${APP_URL}/order-action/${d.reject_token ?? ""}`;
      return {
        subject: `New order #${d.order_number ?? orderId.slice(0, 8)} — respond within 10 min`,
        html: `<h2>New order received</h2>
<p>Total: ₦${d.total_amount ?? "0"}</p>
<p>You have <b>10 minutes</b> to respond.</p>
<p>
  <a href="${acceptUrl}" style="background:#1f5e3a;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;margin-right:8px">Accept Order</a>
  <a href="${rejectUrl}" style="background:#b91c1c;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Reject Order</a>
</p>`,
      };
    }
    case "driver_job_available": {
      const claimUrl = `${APP_URL}/order-action/${d.claim_token ?? ""}`;
      return {
        subject: `New delivery job available — claim within 5 min`,
        html: `<h2>New delivery job</h2>
<p>Pickup: ${d.pickup ?? ""}</p>
<p>Dropoff: ${d.dropoff ?? ""}</p>
<p>Payout: ₦${d.payout ?? "0"}</p>
<p><a href="${claimUrl}" style="background:#1f5e3a;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Claim Job</a></p>
<p><small>First driver to claim wins.</small></p>`,
      };
    }
    case "order_status_update":
      return {
        subject: `Order #${d.order_number ?? ""} update: ${d.status ?? ""}`,
        html: `<p>Your order is now <b>${d.status ?? ""}</b>.</p>`,
      };
    default:
      return { subject: p.subject ?? "Test email", html: "<p>Stub email</p>" };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const payload = (await req.json()) as Payload;
    if (!payload?.template || !payload?.to) {
      return new Response(JSON.stringify({ error: "template and to required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];
    const { subject, html } = renderTemplate(payload);

    // Log the dispatch (always — useful as audit trail)
    console.log("[send-transactional-email]", {
      template: payload.template,
      recipients,
      subject,
      simulated: !RESEND_API_KEY,
    });

    if (!RESEND_API_KEY) {
      // STUB MODE — no real send. Returns ok so callers (cron, app code) keep working.
      return new Response(
        JSON.stringify({ ok: true, simulated: true, recipients, subject }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Real Resend send (active automatically once RESEND_API_KEY is set)
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "CarlyFresh <noreply@carlyfresh.com>",
        to: recipients,
        subject,
        html,
      }),
    });
    const body = await res.json();
    return new Response(JSON.stringify({ ok: res.ok, body }), {
      status: res.ok ? 200 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-transactional-email error", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
