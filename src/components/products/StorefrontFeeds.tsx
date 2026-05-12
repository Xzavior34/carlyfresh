import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import ProductCard from "@/components/products/ProductCard";
import type { Tables } from "@/integrations/supabase/types";
import { Loader2, Sparkles, Heart } from "lucide-react";

type Product = Tables<"products">;

export default function StorefrontFeeds() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [buyersLove, setBuyersLove] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchDynamicFeeds = async () => {
      setLoading(true);

      // Concurrently query Supabase for items matching Tony's Admin placement flags
      const [featuredRes, buyersRes] = await Promise.all([
        supabase
          .from("products")
          .select("*")
          .eq("is_featured", true)
          .eq("in_stock", true)
          .order("created_at", { ascending: false })
          .limit(8),
        supabase
          .from("products")
          .select("*")
          .eq("is_buyer_favourite", true)
          .eq("in_stock", true)
          .order("created_at", { ascending: false })
          .limit(8),
      ]);

      if (!mounted) return;

      if (featuredRes.data) setFeatured(featuredRes.data as Product[]);
      if (buyersRes.data) setBuyersLove(buyersRes.data as Product[]);
      setLoading(false);
    };

    fetchDynamicFeeds();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
        <p className="font-body text-sm">Loading curated store sections...</p>
      </div>
    );
  }

  // Gracefully collapse the section space if Tony hasn't flagged any products yet
  if (featured.length === 0 && buyersLove.length === 0) {
    return null;
  }

  return (
    <div className="space-y-16 py-12">
      {/* SECTION 1: FEATURED PRODUCTS & BUNDLES */}
      {featured.length > 0 && (
        <section className="container mx-auto px-6 lg:px-12">
          <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-1.5 text-accent mb-1">
                <Sparkles className="h-4 w-4" />
                <span className="font-body text-xs font-semibold uppercase tracking-widest">
                  Specially Curated
                </span>
              </div>
              <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
                Featured Products & Bundles
              </h2>
            </div>
            <p className="font-body text-sm text-muted-foreground max-w-sm">
              Handpicked fresh arrivals and multi-item basket bundles for your kitchen.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {featured.map((product) => (
              <div key={product.id} className="relative group">
                {/* Dynamically render a prominent tag if marked as a multi-item bundle */}
                {(product as any).is_bundle && (
                  <span className="absolute top-3 left-3 z-10 rounded-full bg-primary px-3 py-1 font-body text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow-md ring-1 ring-white/20">
                    📦 Combo Pack
                  </span>
                )}
                <ProductCard product={product as any} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SECTION 2: WHAT BUYERS LOVE */}
      {buyersLove.length > 0 && (
        <section className="container mx-auto px-6 lg:px-12">
          <div className="rounded-3xl bg-secondary/40 border border-border p-8 sm:p-12">
            <div className="mb-8">
              <div className="flex items-center gap-1.5 text-rose-500 mb-1">
                <Heart className="h-4 w-4 fill-rose-500" />
                <span className="font-body text-xs font-semibold uppercase tracking-widest text-rose-600">
                  Customer Favorites
                </span>
              </div>
              <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
                What Buyers Love
              </h2>
              <p className="font-body text-sm text-muted-foreground mt-1">
                Highly rated staples consistently ordered across our supply network.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {buyersLove.map((product) => (
                <ProductCard key={product.id} product={product as any} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
