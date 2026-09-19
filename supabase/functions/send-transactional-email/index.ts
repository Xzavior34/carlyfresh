// Stub transactional email dispatcher.
// TODO: replace the simulated send with a real Resend call when the API key is provided.
// Templates: supplier_new_order, driver_job_available, order_status_update.

import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

interface Payload {
  template: "supplier_new_order" | "driver_job_available" | "order_status_update" | "vendor_prep_delay" | "test";
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
    case "add_phone_number_reminder": {
      const name = String(d.name ?? "Valued Member");
      const profileUrl = `${APP_URL}/profile`;
      return {
        subject: `📱 Action Required: Add your phone number to your CarlyFresh profile`,
        html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Add Phone Number to CarlyFresh Profile</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f7f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f7f4; padding: 40px 10px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.06); border: 1px solid #e5ebe5;" cellspacing="0" cellpadding="0" border="0">
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #1b432c 0%, #2a6b47 100%); padding: 36px 30px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 28px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">CarlyFresh</h1>
              <p style="color: #c9e8d4; font-size: 13px; font-weight: 500; margin: 6px 0 0; text-transform: uppercase; letter-spacing: 1.5px;">Fresh Groceries • Direct From Farm</p>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 36px 32px;">
              <h2 style="color: #1a2e22; font-size: 22px; font-weight: 700; margin: 0 0 16px;">Hello ${name}, 👋</h2>
              <p style="color: #4a5d50; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
                We noticed that your profile is currently missing an active phone number. To ensure smooth delivery and real-time order tracking, please take 30 seconds to update your profile.
              </p>

              <!-- Benefits Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f0f7f2; border-radius: 14px; border: 1px solid #d3e7d9; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 20px 22px;">
                    <p style="color: #1b432c; font-size: 14px; font-weight: 700; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 0.5px;">Why add your phone number?</p>
                    <ul style="margin: 0; padding-left: 20px; color: #2e4a36; font-size: 14px; line-height: 1.8;">
                      <li><b>⚡ Instant WhatsApp Order Receipts:</b> Get detailed item breakdowns and digital invoices straight to your WhatsApp.</li>
                      <li><b>🚚 Real-Time Driver Arrival:</b> Live dispatch coordination and delivery calls so your food arrives fresh and fast.</li>
                      <li><b>🏪 Direct Store & Seller DM:</b> 1-tap WhatsApp chat directly with vendors for custom grocery requests.</li>
                    </ul>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="text-align: center; margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="${profileUrl}" style="display: inline-block; background-color: #2a6b47; color: #ffffff; text-decoration: none; padding: 16px 36px; border-radius: 12px; font-size: 15px; font-weight: 700; box-shadow: 0 4px 14px rgba(42,107,71,0.35); text-align: center;">
                      👉 Add Phone Number to Profile
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color: #718375; font-size: 12px; text-align: center; margin: 0 0 10px;">
                Direct link: <a href="${profileUrl}" style="color: #2a6b47; text-decoration: underline;">${profileUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fbf9; padding: 24px 30px; border-top: 1px solid #eef2ee; text-align: center;">
              <p style="color: #8c9e90; font-size: 12px; line-height: 1.5; margin: 0 0 6px;">
                © ${new Date().getFullYear()} CarlyFresh Nigeria. Fresh groceries delivered from local farms.
              </p>
              <p style="color: #a3b3a6; font-size: 11px; margin: 0;">
                If you have already updated your phone number, you can safely ignore this reminder.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
      };
    }
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
