// Broadcast a new blog post to all newsletter subscribers via Resend.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";
import { Resend } from "npm:resend@4.0.1";

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
const FROM = "CarlyFresh <noreply@carlyfresh.com>";

function renderHtml(p: Payload): string {
  const url = `${APP_URL}/blog/${p.slug}`;
  const cover = p.image_url
    ? `<img src="${p.image_url}" alt="" style="width:100%;max-width:600px;height:auto;border-radius:12px;display:block;margin:0 auto 24px"/>`
    : "";
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f6f6f4;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a">
  <div style="max-width:600px;margin:0 auto;padding:32px 24px;background:#ffffff">
    <div style="text-align:center;margin-bottom:24px">
      <span style="display:inline-block;background:#1f5e3a;color:#fff;padding:6px 14px;border-radius:999px;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;font-weight:bold">CarlyFresh Blog</span>
    </div>
    ${cover}
    <h1 style="font-size:26px;line-height:1.25;color:#1f5e3a;margin:0 0 14px;text-align:center">${p.title}</h1>
    <p style="font-size:16px;line-height:1.65;color:#444;margin:0 0 28px;text-align:center">${p.excerpt ?? ""}</p>
    <div style="text-align:center;margin:30px 0">
      <a href="${url}" style="background:#8CB954;color:#0f2e1d;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;font-size:15px">Read More →</a>
    </div>
    <hr style="border:none;border-top:1px solid #e5e5e0;margin:32px 0"/>
    <p style="font-size:12px;color:#888;text-align:center;margin:0">
      Sent with 🌿 from CarlyFresh — Port Harcourt's freshest marketplace.<br/>
      <a href="${APP_URL}" style="color:#1f5e3a;text-decoration:none">carlyfresh.com</a>
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

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
        status: 500,
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

    const recipients = (subs ?? []).map((s) => s.email).filter(Boolean) as string[];
    if (recipients.length === 0) {
      return new Response(JSON.stringify({ ok: true, sent: 0, note: "No subscribers yet" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resend = new Resend(RESEND_API_KEY);
    const subject = `📰 New on CarlyFresh: ${payload.title}`;
    const html = renderHtml(payload);

    // Resend batch API limit: 100 emails per call
    let totalSent = 0;
    const errors: unknown[] = [];

    for (let i = 0; i < recipients.length; i += 100) {
      const batch = recipients.slice(i, i + 100).map((to) => ({
        from: FROM,
        to: [to],
        subject,
        html,
      }));

      const { data, error } = await resend.batch.send(batch);
      if (error) {
        console.error("[broadcast-blog] batch error:", error);
        errors.push(error);
      } else {
        totalSent += batch.length;
        console.log(`[broadcast-blog] batch sent: ${batch.length} (ids: ${data?.data?.length ?? 0})`);
      }
    }

    return new Response(
      JSON.stringify({
        ok: errors.length === 0,
        sent: totalSent,
        total: recipients.length,
        errors: errors.length ? errors : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("broadcast-blog error", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
