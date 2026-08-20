// admin-handler — service-role administrative operations.
// Security: caller MUST be an authenticated user holding the 'admin' role.
// The service-role key never leaves this function.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Whitelist of tables this endpoint may touch. Never allow arbitrary SQL.
const ALLOWED_TABLES = new Set([
  "products",
  "orders",
  "delivery_jobs",
  "profiles",
  "user_roles",
  "blog_posts",
  "notifications",
  "product_reviews",
  "newsletter_subscribers",
]);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // 1. Authenticate the caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) return json({ error: "Unauthorized" }, 401);

    const userId = claimsData.claims.sub as string;

    // 2. Authorize — admin role required
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: isAdmin, error: roleError } = await admin.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (roleError || !isAdmin) return json({ error: "Forbidden: admin role required" }, 403);

    // 3. Execute the requested operation
    const { action, table, payload, filters, id, limit } = await req.json();

    if (!action) return json({ error: "action is required" }, 400);
    if (!table || !ALLOWED_TABLES.has(table)) {
      return json({ error: `table must be one of: ${[...ALLOWED_TABLES].join(", ")}` }, 400);
    }

    let query;
    switch (action) {
      case "select": {
        query = admin.from(table).select("*").limit(Math.min(Number(limit) || 100, 1000));
        break;
      }
      case "insert": {
        if (!payload) return json({ error: "payload is required" }, 400);
        query = admin.from(table).insert(payload).select();
        break;
      }
      case "update": {
        if (!payload) return json({ error: "payload is required" }, 400);
        if (!id && !filters) return json({ error: "id or filters required for update" }, 400);
        query = admin.from(table).update(payload).select();
        break;
      }
      case "delete": {
        if (!id && !filters) return json({ error: "id or filters required for delete" }, 400);
        query = admin.from(table).delete().select();
        break;
      }
      default:
        return json({ error: `unsupported action: ${action}` }, 400);
    }

    if (id) query = query.eq("id", id);
    if (filters && typeof filters === "object") {
      for (const [col, val] of Object.entries(filters)) query = query.eq(col, val);
    }

    const { data, error } = await query;
    if (error) return json({ error: error.message }, 400);

    console.log(`[admin-handler] ${userId} ${action} ${table}`, { count: data?.length ?? 0 });
    return json({ ok: true, data });
  } catch (e) {
    console.error("[admin-handler]", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
