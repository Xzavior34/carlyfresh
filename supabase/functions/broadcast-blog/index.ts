// Broadcast a blog post to newsletter subscribers via Resend.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Payload {
  title: string;
  excerpt?: string;
  image_url?: string | null;
  slug: string;
}

const APP_URL = Deno.env.get("APP_URL") ?? "https://carlyfresh.com";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM = "CarlyFresh <noreply@carlyfresh.com>";

function renderHtml(p: Payload): string {
  const url = `${APP_URL}/blog/${p.slug}`;
  const cover = p.image_url
    ? `<img src="${p.image_url}" alt="${p.title}" style="width:100%;max-width:600px;height:auto;border-radius:12px;margin:0 0 20px"/>`
    : "";
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f6f6f4;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a">
  <div style="max-width:600px;margin:0 auto;padding:32px 20px;background:#ffffff">
    <div style="text-align:center;margin-bottom:24px">
      <span style="display:inline-block;background:#1f5e3a;color:#fff;padding:6px 14px;border-radius:999px;font-size:12px;letter-spacing:1px;text-transform:uppercase">CarlyFresh Blog</span>
    </div>
    ${cover}
    <h1 style="font-size:26px;line-height:1.2;color:#1f5e3a;margin:0 0 12px">${p.title}</h1>
    <p style="font-size:16px;line-height:1.6;color:#444;margin:0 0 28px">${p.excerpt ?? ""}</p>
    <div style="text-align:center;margin:30px 0">
      <a href="${url}" style="background:#8CB954;color:#0f2e1d;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">Read More →</a>
    </div>
    <p style="font-size:12px;color:#888;text-align:center;margin-top:40px">
      Sent with 🌿 from CarlyFresh — Port Harcourt's freshest marketplace.<br/>
      <a href="${APP_URL}" style="color:#1f5e3a">carlyfresh.com</a>
    </p>
  </div>
</body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const payload = (await req.json()) as Payload;
    if (!payload?.title || !payload?.slug) {
      return new Response(JSON.stringify({ error: "title and slug required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: subs, error: subsErr } = await supabase
      .from("newsletter_subscribers")
      .select("email");
    if (subsErr) throw subsErr;

    const recipients = (subs ?? []).map((s) => s.email).filter(Boolean);
    if (recipients.length === 0) {
      return new Response(JSON.stringify({ ok: true, sent: 0, note: "No subscribers" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const subject = `📰 New on CarlyFresh: ${payload.title}`;
    const html = renderHtml(payload);

    if (!RESEND_API_KEY) {
      console.log("[broadcast-blog] RESEND_API_KEY not set — simulated send", {
        recipients: recipients.length,
        subject,
      });
      return new Response(
        JSON.stringify({ ok: true, simulated: true, recipients: recipients.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Resend batch API: up to 100 emails per call
    const batches: string[][] = [];
    for (let i = 0; i < recipients.length; i += 100) batches.push(recipients.slice(i, i + 100));

    let totalSent = 0;
    for (const batch of batches) {
      const emails = batch.map((to) => ({ from: FROM, to: [to], subject, html }));
      const res = await fetch("https://api.resend.com/emails/batch", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emails),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error("[broadcast-blog] Resend batch failed", body);
      } else {
        totalSent += batch.length;
      }
    }

    return new Response(JSON.stringify({ ok: true, sent: totalSent, total: recipients.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("broadcast-blog error", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
