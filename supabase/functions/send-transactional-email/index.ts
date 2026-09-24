// Transactional email dispatcher with rich, branded templates for all order progress milestones.
// Templates:
// - order_confirmed: Order placed and payment verified
// - order_preparing: Produce being harvested & prepared at farm/store
// - order_packaged: Order ready and packaged for pickup
// - order_driver_assigned: Driver assigned and en route to pickup
// - order_in_transit: Driver picked up order, live delivery tracking
// - order_delivered: Order safely delivered
// - add_phone_number_reminder: Profile phone number reminder
// - supplier_new_order / driver_job_available: Direct action alerts

import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Payload {
  template:
    | "order_confirmed"
    | "order_preparing"
    | "order_packaged"
    | "order_driver_assigned"
    | "order_in_transit"
    | "order_delivered"
    | "order_status_update"
    | "supplier_new_order"
    | "driver_job_available"
    | "add_phone_number_reminder"
    | "vendor_prep_delay"
    | "test";
  to: string | string[];
  data?: Record<string, any>;
  subject?: string;
}

const APP_URL = Deno.env.get("APP_URL") ?? "https://carlyfresh.com";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

function getEmailWrapper(title: string, contentHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f7f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f7f4; padding: 30px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #e5ebe5;" cellspacing="0" cellpadding="0" border="0">
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #1b432c 0%, #2a6b47 100%); padding: 32px 28px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 26px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">CarlyFresh</h1>
              <p style="color: #c9e8d4; font-size: 12px; font-weight: 500; margin: 6px 0 0; text-transform: uppercase; letter-spacing: 1.5px;">Fresh Groceries • Direct From Farm</p>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 32px 28px;">
              ${contentHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fbf9; padding: 22px 28px; border-top: 1px solid #eef2ee; text-align: center;">
              <p style="color: #8c9e90; font-size: 12px; line-height: 1.5; margin: 0 0 6px;">
                © ${new Date().getFullYear()} CarlyFresh Nigeria. 100% Farm-Fresh Guarantee.
              </p>
              <p style="color: #a3b3a6; font-size: 11px; margin: 0;">
                Need help with your order? Contact us at support@carlyfresh.com or via WhatsApp.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function renderProgressStepper(activeStep: number): string {
  const steps = [
    { label: "Confirmed", icon: "✓" },
    { label: "Preparing", icon: "🥦" },
    { label: "In Transit", icon: "🚚" },
    { label: "Delivered", icon: "🎉" },
  ];

  const cols = steps.map((s, idx) => {
    const isDone = idx <= activeStep;
    const isCurrent = idx === activeStep;
    const circleBg = isDone ? "#2a6b47" : "#e5ebe5";
    const circleColor = isDone ? "#ffffff" : "#8c9e90";
    const textColor = isCurrent ? "#1b432c" : isDone ? "#2a6b47" : "#8c9e90";
    const fontWeight = isCurrent ? "700" : "500";

    return `<td align="center" style="width: 25%;">
      <div style="width: 32px; height: 32px; border-radius: 50%; background-color: ${circleBg}; color: ${circleColor}; line-height: 32px; font-size: 13px; font-weight: bold; margin: 0 auto 6px;">
        ${s.icon}
      </div>
      <span style="color: ${textColor}; font-size: 11px; font-weight: ${fontWeight};">${s.label}</span>
    </td>`;
  }).join("");

  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 20px 0 24px; padding: 14px 10px; background-color: #f0f7f2; border-radius: 12px;">
    <tr>${cols}</tr>
  </table>`;
}

function renderTemplate(p: Payload): { subject: string; html: string } {
  const d = p.data ?? {};
  const orderNumber = d.order_number ? `#${d.order_number}` : `#${String(d.order_id || "").slice(0, 8)}`;
  const trackUrl = `${APP_URL}/orders/${d.order_id || ""}`;
  const buyerName = String(d.buyer_name || "Valued Customer");
  const totalAmount = Number(d.total_amount || 0).toLocaleString("en-NG");

  switch (p.template) {
    // ──────────────────────────────────────────────────────────────────────────
    // 1. ORDER CONFIRMED
    // ──────────────────────────────────────────────────────────────────────────
    case "order_confirmed": {
      const content = `
        <h2 style="color: #1a2e22; font-size: 20px; font-weight: 700; margin: 0 0 8px;">Order Confirmed! 🎉</h2>
        <p style="color: #4a5d50; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
          Hi ${buyerName}, thank you for ordering with CarlyFresh. Your payment of <strong>₦${totalAmount}</strong> has been received and order <strong>${orderNumber}</strong> has been sent to our verified local farms.
        </p>

        ${renderProgressStepper(0)}

        <div style="background-color: #f8faf8; border: 1px solid #e2ece4; border-radius: 12px; padding: 18px; margin-bottom: 24px;">
          <h4 style="margin: 0 0 8px; color: #1b432c; font-size: 13px; text-transform: uppercase;">Delivery Details</h4>
          <p style="margin: 0 0 4px; font-size: 13px; color: #334155;"><strong>Address:</strong> ${d.delivery_address || "Customer Delivery Address"}</p>
          ${d.delivery_window ? `<p style="margin: 0; font-size: 13px; color: #334155;"><strong>Time Window:</strong> ${d.delivery_window}</p>` : ""}
        </div>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="text-align: center;">
          <tr>
            <td align="center">
              <a href="${trackUrl}" style="display: inline-block; background-color: #2a6b47; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-size: 14px; font-weight: 700; box-shadow: 0 4px 12px rgba(42,107,71,0.25);">
                📍 Track Order Live
              </a>
            </td>
          </tr>
        </table>
      `;
      return {
        subject: `🎉 Order Confirmed ${orderNumber} — CarlyFresh`,
        html: getEmailWrapper("Order Confirmed", content),
      };
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 2. ORDER PREPARING / HARVESTING
    // ──────────────────────────────────────────────────────────────────────────
    case "order_preparing": {
      const content = `
        <h2 style="color: #1a2e22; font-size: 20px; font-weight: 700; margin: 0 0 8px;">Your Produce is Being Prepared 🥦</h2>
        <p style="color: #4a5d50; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
          Hi ${buyerName}, great news! The farmer/vendor has accepted your order <strong>${orderNumber}</strong> and is currently harvesting and packing your fresh produce with care.
        </p>

        ${renderProgressStepper(1)}

        <div style="background-color: #f0f7f2; border: 1px solid #d3e7d9; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
          <p style="margin: 0; color: #1b432c; font-size: 13px; font-weight: 600;">
            ⚡ 15-Minute Quality & Freshness Guarantee
          </p>
          <p style="margin: 4px 0 0; color: #4a5d50; font-size: 12px;">
            Every item undergoes a freshness check before being packaged for our nearest dispatch driver.
          </p>
        </div>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="text-align: center;">
          <tr>
            <td align="center">
              <a href="${trackUrl}" style="display: inline-block; background-color: #2a6b47; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-size: 14px; font-weight: 700;">
                View Order Status
              </a>
            </td>
          </tr>
        </table>
      `;
      return {
        subject: `🥦 Your fresh produce is being prepared — ${orderNumber}`,
        html: getEmailWrapper("Order Preparing", content),
      };
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 3. ORDER DRIVER ASSIGNED
    // ──────────────────────────────────────────────────────────────────────────
    case "order_driver_assigned": {
      const driverName = String(d.driver_name || "Assigned Driver");
      const driverPhone = d.driver_phone ? String(d.driver_phone) : null;
      const content = `
        <h2 style="color: #1a2e22; font-size: 20px; font-weight: 700; margin: 0 0 8px;">Driver Assigned & Heading to Pickup 🚚</h2>
        <p style="color: #4a5d50; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
          Hi ${buyerName}, our system matched the nearest available driver to order <strong>${orderNumber}</strong> based on live GPS location!
        </p>

        ${renderProgressStepper(2)}

        <div style="background-color: #f8faf8; border: 1px solid #e2ece4; border-radius: 12px; padding: 18px; margin-bottom: 24px;">
          <h4 style="margin: 0 0 8px; color: #1b432c; font-size: 13px; text-transform: uppercase;">Driver Information</h4>
          <p style="margin: 0 0 4px; font-size: 13px; color: #334155;"><strong>Driver:</strong> ${driverName}</p>
          ${driverPhone ? `<p style="margin: 0 0 4px; font-size: 13px; color: #334155;"><strong>Phone:</strong> ${driverPhone}</p>` : ""}
          <p style="margin: 0; font-size: 12px; color: #64748b;">The driver is on the way to pick up your packaged order from the store.</p>
        </div>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="text-align: center;">
          <tr>
            <td align="center">
              <a href="${trackUrl}" style="display: inline-block; background-color: #2a6b47; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-size: 14px; font-weight: 700;">
                📍 Track Driver Location
              </a>
            </td>
          </tr>
        </table>
      `;
      return {
        subject: `🚚 Driver assigned to your order ${orderNumber} — CarlyFresh`,
        html: getEmailWrapper("Driver Assigned", content),
      };
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 4. ORDER IN TRANSIT / OUT FOR DELIVERY
    // ──────────────────────────────────────────────────────────────────────────
    case "order_in_transit": {
      const content = `
        <h2 style="color: #1a2e22; font-size: 20px; font-weight: 700; margin: 0 0 8px;">Out for Delivery! 🛵</h2>
        <p style="color: #4a5d50; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
          Hi ${buyerName}, your fresh produce for order <strong>${orderNumber}</strong> has been picked up by the driver and is on its way to your delivery address.
        </p>

        ${renderProgressStepper(2)}

        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 18px; margin-bottom: 24px;">
          <p style="margin: 0; color: #15803d; font-size: 13px; font-weight: 600;">
            🚀 Express Cold-Chain Transit
          </p>
          <p style="margin: 4px 0 0; color: #4a5d50; font-size: 12px;">
            Please ensure someone is available at <strong>${d.delivery_address || "the delivery location"}</strong> to receive your items.
          </p>
        </div>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="text-align: center;">
          <tr>
            <td align="center">
              <a href="${trackUrl}" style="display: inline-block; background-color: #2a6b47; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-size: 14px; font-weight: 700; box-shadow: 0 4px 12px rgba(42,107,71,0.25);">
                📍 Live Map & Driver ETA
              </a>
            </td>
          </tr>
        </table>
      `;
      return {
        subject: `🛵 Your order ${orderNumber} is out for delivery!`,
        html: getEmailWrapper("Out for Delivery", content),
      };
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 5. ORDER DELIVERED
    // ──────────────────────────────────────────────────────────────────────────
    case "order_delivered": {
      const content = `
        <h2 style="color: #1a2e22; font-size: 20px; font-weight: 700; margin: 0 0 8px;">Order Delivered! Enjoy Your Fresh Produce 🎉</h2>
        <p style="color: #4a5d50; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
          Hi ${buyerName}, order <strong>${orderNumber}</strong> has been successfully delivered. We hope you love the quality of your fresh items!
        </p>

        ${renderProgressStepper(3)}

        <div style="background-color: #f8faf8; border: 1px solid #e2ece4; border-radius: 12px; padding: 18px; margin-bottom: 24px; text-align: center;">
          <h4 style="margin: 0 0 6px; color: #1b432c; font-size: 14px;">How was your experience?</h4>
          <p style="margin: 0 0 14px; color: #64748b; font-size: 12px;">Your review helps support local Nigerian farmers and maintain quality service.</p>
          <a href="${trackUrl}" style="display: inline-block; background-color: #2a6b47; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 13px; font-weight: 600;">
            ⭐ Rate & Review Order
          </a>
        </div>
      `;
      return {
        subject: `🎉 Delivered: Order ${orderNumber} — Thank you for choosing CarlyFresh`,
        html: getEmailWrapper("Order Delivered", content),
      };
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 6. ADD PHONE NUMBER REMINDER
    // ──────────────────────────────────────────────────────────────────────────
    case "add_phone_number_reminder": {
      const name = String(d.name ?? "Valued Member");
      const profileUrl = `${APP_URL}/profile`;
      const content = `
        <h2 style="color: #1a2e22; font-size: 22px; font-weight: 700; margin: 0 0 16px;">Hello ${name}, 👋</h2>
        <p style="color: #4a5d50; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
          We noticed that your profile is currently missing an active phone number. To ensure smooth delivery, driver arrival calls, and WhatsApp order receipts, please take 30 seconds to update your profile.
        </p>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f0f7f2; border-radius: 14px; border: 1px solid #d3e7d9; margin-bottom: 28px;">
          <tr>
            <td style="padding: 20px 22px;">
              <p style="color: #1b432c; font-size: 14px; font-weight: 700; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 0.5px;">Why add your phone number?</p>
              <ul style="margin: 0; padding-left: 20px; color: #2e4a36; font-size: 14px; line-height: 1.8;">
                <li><b>⚡ Instant WhatsApp Order Receipts:</b> Get digital invoices straight to your WhatsApp.</li>
                <li><b>🚚 Real-Time Driver Arrival:</b> Live dispatch coordination and arrival calls.</li>
                <li><b>🏪 Direct Store DM:</b> 1-tap WhatsApp chat directly with local vendors.</li>
              </ul>
            </td>
          </tr>
        </table>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="text-align: center; margin-bottom: 20px;">
          <tr>
            <td align="center">
              <a href="${profileUrl}" style="display: inline-block; background-color: #2a6b47; color: #ffffff; text-decoration: none; padding: 16px 36px; border-radius: 12px; font-size: 15px; font-weight: 700; box-shadow: 0 4px 14px rgba(42,107,71,0.35);">
                👉 Add Phone Number to Profile
              </a>
            </td>
          </tr>
        </table>
      `;
      return {
        subject: `📱 Action Required: Add your phone number to your CarlyFresh profile`,
        html: getEmailWrapper("Add Phone Number", content),
      };
    }

    default: {
      return {
        subject: p.subject ?? `Order Update ${orderNumber}`,
        html: getEmailWrapper("Order Update", `<p>Your order status has been updated to: <b>${d.status ?? ""}</b>.</p>`),
      };
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

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

    console.log("[send-transactional-email]", {
      template: payload.template,
      recipients,
      subject,
      simulated: !RESEND_API_KEY,
    });

    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ ok: true, simulated: true, recipients, subject }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "CarlyFresh <orders@carlyfresh.com>",
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
