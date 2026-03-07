import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // 1. Create mock vendor user
  const vendorEmail = "vendor@carlyfresh.com";
  const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
  let vendorId: string;
  const existing = existingUsers?.users?.find((u) => u.email === vendorEmail);

  if (existing) {
    vendorId = existing.id;
  } else {
    const { data: newUser, error: userErr } = await supabaseAdmin.auth.admin.createUser({
      email: vendorEmail,
      password: "vendor123456",
      email_confirm: true,
      user_metadata: { full_name: "CarlyFresh Farm", role: "seller" },
    });
    if (userErr) return new Response(JSON.stringify({ error: userErr.message }), { status: 400, headers: corsHeaders });
    vendorId = newUser.user.id;
  }

  // Update profile with business name
  await supabaseAdmin.from("profiles").update({ business_name: "CarlyFresh Farm", full_name: "CarlyFresh Farm" }).eq("user_id", vendorId);

  // 2. Seed products
  const products = [
    { name: "Organic Bell Peppers", category: "Fresh Produce", price: 2500, stock_level: 45, in_stock: true, image_url: "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=600&q=80", vendor_id: vendorId },
    { name: "Farm-Fresh Eggs (Crate)", category: "Fresh Produce", price: 3800, stock_level: 30, in_stock: true, image_url: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=600&q=80", vendor_id: vendorId },
    { name: "Premium Steak Cut", category: "Fresh Produce", price: 8500, stock_level: 12, in_stock: true, image_url: "https://images.unsplash.com/photo-1603048297172-c92544798d5a?w=600&q=80", vendor_id: vendorId },
    { name: "Ripe Plantain Bunch", category: "Fruits", price: 1800, stock_level: 60, in_stock: true, image_url: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&q=80", vendor_id: vendorId },
    { name: "Organic Tomatoes (Basket)", category: "Vegetables", price: 3200, stock_level: 40, in_stock: true, image_url: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&q=80", vendor_id: vendorId },
    { name: "Cold-Pressed Palm Oil (1L)", category: "Oils & Spices", price: 4500, stock_level: 25, in_stock: true, image_url: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&q=80", vendor_id: vendorId },
    { name: "Fresh Spinach Bundle", category: "Vegetables", price: 1200, stock_level: 55, in_stock: true, image_url: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=600&q=80", vendor_id: vendorId },
    { name: "Watermelon (Whole)", category: "Fruits", price: 5000, stock_level: 18, in_stock: true, image_url: "https://images.unsplash.com/photo-1589984662742-a3bfee5f4524?w=600&q=80", vendor_id: vendorId },
    { name: "Dried Cameroon Pepper (500g)", category: "Oils & Spices", price: 2800, stock_level: 35, in_stock: true, image_url: "https://images.unsplash.com/photo-1583119022894-919a68a3d0e3?w=600&q=80", vendor_id: vendorId },
    { name: "Family Bundle Box", category: "Bundles", price: 15000, stock_level: 10, in_stock: true, image_url: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80", vendor_id: vendorId },
  ];

  // Delete existing mock products for this vendor to avoid duplicates
  await supabaseAdmin.from("products").delete().eq("vendor_id", vendorId);

  const { error: insertErr } = await supabaseAdmin.from("products").insert(products);
  if (insertErr) return new Response(JSON.stringify({ error: insertErr.message }), { status: 400, headers: corsHeaders });

  return new Response(JSON.stringify({ success: true, vendorId, productsSeeded: products.length }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
