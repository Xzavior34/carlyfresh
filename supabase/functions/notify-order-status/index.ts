import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    // Accept both database-webhook payload {record, old_record} and direct calls
    const record = body.record ?? body;
    const oldRecord = body.old_record ?? null;

    const status: string = record?.status;
    const newStatuses = ["paid", "driver_assigned"];
    if (!newStatuses.includes(status)) {
      return new Response(JSON.stringify({ skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (oldRecord && oldRecord.status === status) {
      return new Response(JSON.stringify({ skipped: true, reason: "no status change" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const orderNumber = record.order_number ?? record.id;
    const link = `/orders/${record.id}`;

    const messages: Record<string, { vendor: string; buyer: string }> = {
      paid: {
        vendor: `New paid order #${orderNumber} — start preparing.`,
        buyer: `Payment confirmed for order #${orderNumber}.`,
      },
      driver_assigned: {
        vendor: `A driver was assigned to order #${orderNumber}.`,
        buyer: `Your driver is on the way for order #${orderNumber}.`,
      },
    };

    const m = messages[status];
    const rows = [
      { user_id: record.vendor_id, type: `order_${status}`, message: m.vendor, link },
      { user_id: record.buyer_id, type: `order_${status}`, message: m.buyer, link },
    ];

    const { error } = await supabase.from("notifications").insert(rows);
    if (error) throw error;

    return new Response(JSON.stringify({ ok: true, inserted: rows.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("notify-order-status error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
