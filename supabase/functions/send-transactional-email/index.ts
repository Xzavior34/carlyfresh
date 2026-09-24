// Transactional email dispatcher with rich, branded templates for all order progress milestones.
// Templates:
// - vendor_new_order: Sent to vendor when a customer purchases their products
// - driver_job_assigned: Sent to the nearest driver when a delivery offer is assigned
// - order_confirmed: Sent to customer when order is confirmed
// - order_preparing: Sent to customer when farm starts harvesting/preparing
// - order_packaged: Sent to customer when order is packaged for pickup
// - order_driver_assigned: Sent to customer when nearest driver is matched
// - order_in_transit: Sent to customer when order is on the road
// - order_delivered: Sent to customer when order is delivered
// - add_phone_number_reminder: Profile phone number reminder

import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Payload {
  template:
    | "vendor_new_order"
    | "driver_job_assigned"
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
                Need help? Contact support@carlyfresh.com or WhatsApp support.
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
  const vendorOrdersUrl = `${APP_URL}/vendor/orders?open=${d.order_id || ""}&accept=true`;
  const driverAcceptUrl = `${APP_URL}/driver?accept=${d.order_id || ""}`;
  const driverDeclineUrl = `${APP_URL}/driver?decline=${d.order_id || ""}`;
  const buyerName = String(d.buyer_name || "Valued Customer");
  const vendorName = String(d.vendor_name || "Vendor Partner");
  const driverName = String(d.driver_name || "Driver Partner");
  const totalAmount = Number(d.total_amount || 0).toLocaleString("en-NG");
  const payoutAmount = Number(d.payout_amount || 1500).toLocaleString("en-NG");

  switch (p.template) {
    // ──────────────────────────────────────────────────────────────────────────
    // 1. VENDOR: NEW CUSTOMER PURCHASE ORDER
    // ──────────────────────────────────────────────────────────────────────────
    case "vendor_new_order":
    case "supplier_new_order": {
      const items: any[] = Array.isArray(d.items) ? d.items : [];
      const itemRows = items
        .map(
          (item) => `<tr>
            <td style="padding: 10px 8px; border-bottom: 1px solid #eef2ee; font-size: 13px; color: #1e293b;">
              <strong>${item.name || "Produce Item"}</strong>
            </td>
            <td style="padding: 10px 8px; border-bottom: 1px solid #eef2ee; text-align: center; font-size: 13px; color: #475569;">
              ${item.quantity || 1} ${item.unit || ""}
            </td>
            <td style="padding: 10px 8px; border-bottom: 1px solid #eef2ee; text-align: right; font-size: 13px; color: #1e293b; font-weight: 600;">
              ₦${Number(item.price || 0).toLocaleString("en-NG")}
            </td>
          </tr>`
        )
        .join("");

      const content = `
        <h2 style="color: #1a2e22; font-size: 20px; font-weight: 700; margin: 0 0 8px;">🎉 New Customer Order Received!</h2>
        <p style="color: #4a5d50; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
          Hi ${vendorName}, a customer has just purchased fresh produce from your store! Order <strong>${orderNumber}</strong> is waiting for your confirmation.
        </p>

        <!-- Earnings Badge -->
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <span style="font-size: 11px; text-transform: uppercase; color: #15803d; font-weight: 700; letter-spacing: 0.5px;">Total Order Value</span>
            <p style="margin: 2px 0 0; font-size: 22px; font-weight: 800; color: #166534;">₦${totalAmount}</p>
          </div>
        </div>

        <!-- Items Table -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #f8faf8;">
              <th style="padding: 8px; text-align: left; font-size: 11px; text-transform: uppercase; color: #64748b;">Item</th>
              <th style="padding: 8px; text-align: center; font-size: 11px; text-transform: uppercase; color: #64748b;">Qty</th>
              <th style="padding: 8px; text-align: right; font-size: 11px; text-transform: uppercase; color: #64748b;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows || `<tr><td colspan="3" style="padding: 12px; text-align: center; color: #64748b; font-size: 13px;">Produce items included in order</td></tr>`}
          </tbody>
        </table>

        <!-- Delivery Destination -->
        <div style="background-color: #f8faf8; border: 1px solid #e2ece4; border-radius: 12px; padding: 14px 16px; margin-bottom: 24px; font-size: 12px; color: #475569;">
          <p style="margin: 0 0 4px;"><strong>Customer Destination:</strong> ${d.delivery_address || "Customer Delivery Address"}</p>
          ${d.delivery_window ? `<p style="margin: 0;"><strong>Delivery Window:</strong> ${d.delivery_window}</p>` : ""}
        </div>

        <!-- Accept Button CTA -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="text-align: center;">
          <tr>
            <td align="center">
              <a href="${vendorOrdersUrl}" style="display: inline-block; background-color: #2a6b47; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-size: 14px; font-weight: 700; box-shadow: 0 4px 12px rgba(42,107,71,0.25);">
                ✅ Accept Order & Start Preparing
              </a>
            </td>
          </tr>
        </table>
      `;
      return {
        subject: `🎉 New Customer Order ${orderNumber} — ₦${totalAmount}`,
        html: getEmailWrapper("New Customer Order", content),
      };
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 2. DRIVER: NEW DELIVERY ASSIGNED (NEAREST MATCH)
    // ──────────────────────────────────────────────────────────────────────────
    case "driver_job_assigned":
    case "driver_job_available": {
      const content = `
        <h2 style="color: #1a2e22; font-size: 20px; font-weight: 700; margin: 0 0 8px;">🚚 New Express Delivery Assigned!</h2>
        <p style="color: #4a5d50; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
          Hi ${driverName}, you were matched as the <strong>nearest available driver</strong> for order <strong>${orderNumber}</strong>!
        </p>

        <!-- Payout Box -->
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 18px; margin-bottom: 20px; text-align: center;">
          <span style="font-size: 11px; text-transform: uppercase; color: #15803d; font-weight: 700; letter-spacing: 0.5px;">Guaranteed Payout</span>
          <p style="margin: 4px 0 0; font-size: 26px; font-weight: 800; color: #166534;">₦${payoutAmount}</p>
        </div>

        <!-- Route Details -->
        <div style="background-color: #f8faf8; border: 1px solid #e2ece4; border-radius: 12px; padding: 18px; margin-bottom: 20px; font-size: 13px; color: #334155;">
          <p style="margin: 0 0 10px; display: flex; align-items: start;">
            <strong style="color: #2a6b47; min-width: 65px;">Pickup:</strong>
            <span>${d.pickup_address || "Vendor Farm / Store"}</span>
          </p>
          <p style="margin: 0; display: flex; align-items: start;">
            <strong style="color: #b91c1c; min-width: 65px;">Dropoff:</strong>
            <span>${d.dropoff_address || "Customer Location"}</span>
          </p>
        </div>

        <p style="color: #b45309; font-size: 12px; text-align: center; margin: 0 0 18px; font-weight: 600;">
          ⏱️ 90-Second SLA: Accept promptly before the system automatically passes this delivery to the next nearest driver.
        </p>

        <!-- Accept / Decline Action Buttons -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="text-align: center;">
          <tr>
            <td align="center">
              <a href="${driverAcceptUrl}" style="display: inline-block; background-color: #2a6b47; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-size: 14px; font-weight: 700; margin-right: 8px; box-shadow: 0 4px 12px rgba(42,107,71,0.25);">
                ✅ Accept Delivery
              </a>
              <a href="${driverDeclineUrl}" style="display: inline-block; background-color: #f1f5f9; color: #64748b; text-decoration: none; padding: 14px 20px; border-radius: 10px; font-size: 13px; font-weight: 600;">
                Decline
              </a>
            </td>
          </tr>
        </table>
      `;
      return {
        subject: `🚚 Delivery Assigned: ₦${payoutAmount} — Order ${orderNumber}`,
        html: getEmailWrapper("New Delivery Assigned", content),
      };
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 3. CUSTOMER: ORDER CONFIRMED
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
    // 4. CUSTOMER: ORDER PREPARING / HARVESTING
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
    // 5. CUSTOMER: ORDER PACKAGED & READY FOR DELIVERY
    // ──────────────────────────────────────────────────────────────────────────
    case "order_packaged": {
      const content = `
        <h2 style="color: #1a2e22; font-size: 20px; font-weight: 700; margin: 0 0 8px;">Order Packaged & Ready for Delivery! 📦</h2>
        <p style="color: #4a5d50; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
          Hi ${buyerName}, great news! The farm has finished harvesting and securely packaging order <strong>${orderNumber}</strong>. We are matching the nearest available express driver for rapid pickup.
        </p>

        ${renderProgressStepper(1)}

        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 18px; margin-bottom: 24px;">
          <h4 style="margin: 0 0 8px; color: #166534; font-size: 13px; text-transform: uppercase;">100% Farm-Fresh Sealed</h4>
          <p style="margin: 0; font-size: 13px; color: #1e293b;">
            All produce has passed quality inspection and is safely packed for pickup.
          </p>
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
        subject: `📦 Order ${orderNumber} is packaged & ready for delivery — CarlyFresh`,
        html: getEmailWrapper("Order Packaged", content),
      };
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 6. CUSTOMER: DRIVER ASSIGNED
    // ──────────────────────────────────────────────────────────────────────────
    case "order_driver_assigned": {
      const driverFullName = String(d.driver_name || "Assigned Driver");
      const driverPhone = d.driver_phone ? String(d.driver_phone) : null;
      const content = `
        <h2 style="color: #1a2e22; font-size: 20px; font-weight: 700; margin: 0 0 8px;">Driver Assigned & Heading to Pickup 🚚</h2>
        <p style="color: #4a5d50; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
          Hi ${buyerName}, our system matched the nearest available driver to order <strong>${orderNumber}</strong> based on live GPS location!
        </p>

        ${renderProgressStepper(2)}

        <div style="background-color: #f8faf8; border: 1px solid #e2ece4; border-radius: 12px; padding: 18px; margin-bottom: 24px;">
          <h4 style="margin: 0 0 8px; color: #1b432c; font-size: 13px; text-transform: uppercase;">Driver Information</h4>
          <p style="margin: 0 0 4px; font-size: 13px; color: #334155;"><strong>Driver:</strong> ${driverFullName}</p>
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
    // 6. CUSTOMER: IN TRANSIT
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
    // 7. CUSTOMER: DELIVERED
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
    // 8. ADD PHONE NUMBER REMINDER
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
