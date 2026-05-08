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
    const { user_id } = await req.json();
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Trending fallback: most recently in-stock products
    const { data: catalogue } = await supabase
      .from("products")
      .select("id,name,category,price,price_per_unit,unit_of_measurement,image_url,description,in_stock,b2b_price")
      .eq("in_stock", true)
      .limit(60);

    const all = catalogue ?? [];

    if (!user_id) {
      const trending = all.slice(0, 8);
      return new Response(JSON.stringify({ products: trending, personalized: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: orders } = await supabase
      .from("orders")
      .select("items, created_at")
      .eq("buyer_id", user_id)
      .order("created_at", { ascending: false })
      .limit(20);

    const history = (orders ?? []).flatMap((o: any) => {
      try {
        const items = Array.isArray(o.items) ? o.items : JSON.parse(o.items ?? "[]");
        return items.map((it: any) => ({
          name: it.name ?? it.product_name ?? "",
          category: it.category ?? "",
        }));
      } catch {
        return [];
      }
    });

    if (history.length === 0) {
      return new Response(JSON.stringify({ products: all.slice(0, 8), personalized: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      // No AI available, return category-overlap heuristic
      const cats = new Set(history.map((h) => h.category).filter(Boolean));
      const recs = all.filter((p) => cats.has(p.category)).slice(0, 8);
      return new Response(JSON.stringify({ products: recs.length ? recs : all.slice(0, 8), personalized: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "You recommend products from a catalogue based on a buyer's history. Always pick from the catalogue ids only.",
          },
          {
            role: "user",
            content: `Order history:\n${JSON.stringify(history)}\n\nCatalogue:\n${JSON.stringify(
              all.map((p) => ({ id: p.id, name: p.name, category: p.category })),
            )}\n\nReturn 8 best-fit catalogue product ids.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "recommend",
              description: "Return recommended product ids",
              parameters: {
                type: "object",
                properties: {
                  product_ids: { type: "array", items: { type: "string" } },
                },
                required: ["product_ids"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "recommend" } },
      }),
    });

    if (!aiResp.ok) {
      const cats = new Set(history.map((h) => h.category).filter(Boolean));
      const recs = all.filter((p) => cats.has(p.category)).slice(0, 8);
      return new Response(JSON.stringify({ products: recs.length ? recs : all.slice(0, 8), personalized: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiResp.json();
    const args = aiJson?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    let ids: string[] = [];
    try {
      ids = JSON.parse(args ?? "{}").product_ids ?? [];
    } catch {
      ids = [];
    }
    const byId = new Map(all.map((p) => [p.id, p]));
    const recs = ids.map((id) => byId.get(id)).filter(Boolean).slice(0, 8);

    return new Response(
      JSON.stringify({
        products: recs.length ? recs : all.slice(0, 8),
        personalized: true,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("generate-user-recommendations error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
