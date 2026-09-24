import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const record = body.record ?? body;
    const oldRecord = body.old_record ?? null;

    const status: string = record?.status;
    if (!status || !record?.id) {
      return new Response(JSON.stringify({ skipped: true, reason: "No status or order ID" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (oldRecord && oldRecord.status === status) {
      return new Response(JSON.stringify({ skipped: true, reason: "No status change" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Fetch full order data, buyer profile, driver profile, and vendor profile
    const { data: order } = await supabase
      .from("orders")
      .select("*, profiles!orders_buyer_id_fkey(full_name, phone), driver:profiles!orders_assigned_driver_id_fkey(full_name, phone, vehicle_info)")
      .eq("id", record.id)
      .maybeSingle();

    const orderData = order ?? record;
    const buyerId = orderData.buyer_id;
    const vendorId = orderData.vendor_id;
    const driverId = orderData.assigned_driver_id;
    const orderNumber = orderData.order_number ?? orderData.id.slice(0, 8);
    const link = `/orders/${orderData.id}`;

    // 1. Get Buyer Email from auth.users
    let buyerEmail: string | null = null;
    if (buyerId) {
      const { data: userRes } = await supabase.auth.admin.getUserById(buyerId);
      buyerEmail = userRes?.user?.email ?? null;
    }

    // 2. Map status to In-App notifications and Transactional Email templates
    let emailTemplate: string | null = null;
    let emailSubject: string | null = null;
    const inAppRows: any[] = [];

    const buyerName = (orderData as any)?.profiles?.full_name || "Valued Customer";
    const driverName = (orderData as any)?.driver?.full_name || "CarlyFresh Rider";
    const driverPhone = (orderData as any)?.driver?.phone || null;

    if (status === "paid" || status === "confirmed") {
      emailTemplate = "order_confirmed";
      if (buyerId) {
        inAppRows.push({
          user_id: buyerId,
          type: "order_confirmed",
          title: "Payment Confirmed 🎉",
          message: `Your payment for order #${orderNumber} was confirmed. We are preparing your fresh items!`,
          link,
        });
      }
      if (vendorId) {
        inAppRows.push({
          user_id: vendorId,
          type: "new_order",
          title: "New Paid Order 🛒",
          message: `New paid order #${orderNumber} received. Tap to Accept and start preparation.`,
          link: `/vendor/orders?open=${orderData.id}`,
        });
      }
    } else if (status === "preparing") {
      emailTemplate = "order_preparing";
      if (buyerId) {
        inAppRows.push({
          user_id: buyerId,
          type: "order_preparing",
          title: "Produce Being Prepared 🥦",
          message: `The farm has accepted order #${orderNumber} and is currently packing your items.`,
          link,
        });
      }
    } else if (status === "packaged") {
      if (buyerId) {
        inAppRows.push({
          user_id: buyerId,
          type: "order_packaged",
          title: "Order Ready & Packaged 📦",
          message: `Order #${orderNumber} is packaged and waiting for driver pickup.`,
          link,
        });
      }
    } else if (status === "driver_assigned" || status === "awaiting_driver") {
      if (status === "driver_assigned") {
        emailTemplate = "order_driver_assigned";
        if (buyerId) {
          inAppRows.push({
            user_id: buyerId,
            type: "order_driver_assigned",
            title: "Driver Assigned 🚚",
            message: `Driver ${driverName} is on the way to pick up your order #${orderNumber}.`,
            link,
          });
        }
      }
    } else if (status === "in-transit" || status === "in_transit") {
      emailTemplate = "order_in_transit";
      if (buyerId) {
        inAppRows.push({
          user_id: buyerId,
          type: "order_in_transit",
          title: "Out for Delivery 🛵",
          message: `Your order #${orderNumber} is on the way to your delivery address.`,
          link,
        });
      }
    } else if (status === "delivered") {
      emailTemplate = "order_delivered";
      if (buyerId) {
        inAppRows.push({
          user_id: buyerId,
          type: "order_delivered",
          title: "Delivered! 🎉",
          message: `Order #${orderNumber} was delivered successfully. Enjoy your fresh produce!`,
          link,
        });
      }
      if (vendorId) {
        inAppRows.push({
          user_id: vendorId,
          type: "order_delivered",
          title: "Order Delivered 📦",
          message: `Order #${orderNumber} has been delivered to the customer.`,
          link: `/vendor/orders`,
        });
      }
    }

    // 3. Insert In-App Notifications
    if (inAppRows.length > 0) {
      await supabase.from("notifications").insert(inAppRows);
    }

    // 4. Send Email Progress Update to Buyer
    let emailResult = null;
    if (emailTemplate && buyerEmail) {
      try {
        const emailUrl = `${SUPABASE_URL}/functions/v1/send-transactional-email`;
        const emailRes = await fetch(emailUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({
            template: emailTemplate,
            to: buyerEmail,
            data: {
              order_id: orderData.id,
              order_number: orderNumber,
              buyer_name: buyerName,
              total_amount: orderData.total_amount,
              delivery_address: orderData.delivery_address,
              delivery_window: orderData.delivery_window,
              driver_name: driverName,
              driver_phone: driverPhone,
              status: status,
            },
          }),
        });
        emailResult = await emailRes.json();
      } catch (err) {
        console.error("[notify-order-status] Email dispatch error:", err);
      }
    }

    // 4b. Send Email to Vendor when customer purchases their products
    if ((status === "paid" || status === "confirmed") && vendorId) {
      try {
        const { data: vendorUser } = await supabase.auth.admin.getUserById(vendorId);
        const vendorEmail = vendorUser?.user?.email;
        if (vendorEmail) {
          const emailUrl = `${SUPABASE_URL}/functions/v1/send-transactional-email`;
          await fetch(emailUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
            },
            body: JSON.stringify({
              template: "vendor_new_order",
              to: vendorEmail,
              data: {
                order_id: orderData.id,
                order_number: orderNumber,
                vendor_name: (orderData as any)?.vendor?.business_name || "Vendor Partner",
                items: orderData.items,
                total_amount: orderData.total_amount,
                delivery_address: orderData.delivery_address,
                delivery_window: orderData.delivery_window,
              },
            }),
          });
        }
      } catch (vendorEmailErr) {
        console.error("[notify-order-status] Vendor email error:", vendorEmailErr);
      }
    }

    // 5. Trigger Push Notification via OneSignal
    try {
      const pushUrl = `${SUPABASE_URL}/functions/v1/onesignal-dispatcher`;
      await fetch(pushUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({ record: orderData }),
      });
    } catch (err) {
      console.error("[notify-order-status] Push dispatch error:", err);
    }

    return new Response(
      JSON.stringify({
        ok: true,
        status,
        in_app_inserted: inAppRows.length,
        buyer_email: buyerEmail,
        email_template: emailTemplate,
        email_result: emailResult,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("notify-order-status error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
