import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import ProductCard from "@/components/products/ProductCard";
import type { Tables } from "@/integrations/supabase/types";
import { Loader2, Sparkles, Heart, ShoppingBag, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatNaira } from "@/lib/formatters";
import { motion } from "framer-motion";

type Product = Tables<"products">;

export default function StorefrontFeeds() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [buyersLove, setBuyersLove] = useState<Product[]>([]);
  const [baskets, setBaskets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();

  const featuredScrollRef = useRef<HTMLDivElement>(null);
  const buyersLoveScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;

    const fetchDynamicFeeds = async () => {
      setLoading(true);

      // Concurrently query Supabase for items matching placement flags & curated baskets
      const [featuredRes, buyersRes, basketsRes] = await Promise.all([
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
        supabase
          .from("baskets" as any)
          .select("*, basket_items(*, product:products(*))")
          .order("created_at", { ascending: false })
          .limit(6),
      ]);

      if (!mounted) return;

      if (featuredRes.data) setFeatured(featuredRes.data as Product[]);
      if (buyersRes.data) setBuyersLove(buyersRes.data as Product[]);
      if (basketsRes.data) setBaskets(basketsRes.data as any[]);
      setLoading(false);
    };

    fetchDynamicFeeds();

    return () => {
      mounted = false;
    };
  }, []);

  const scrollContainer = (ref: React.RefObject<HTMLDivElement>, direction: "left" | "right") => {
    if (ref.current) {
      const scrollAmount = 300; // card width (280) + gap (20)
      ref.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const handleAddBasket = (basket: any) => {
    addItem(
      basket.id,
      basket.name,
      basket.price,
      undefined,
      "basket",
      basket.price
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
        <p className="font-body text-sm">Loading curated store sections...</p>
      </div>
    );
  }

  // Gracefully collapse the section space if there is no data to show
  if (featured.length === 0 && buyersLove.length === 0 && baskets.length === 0) {
    return null;
  }

  return (
    <div className="space-y-16 py-12">
      <style>{`
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* SECTION 1: FEATURED PRODUCTS & BUNDLES (SLIDEABLE CAROUSEL) */}
      {featured.length > 0 && (
        <section className="container mx-auto px-6 lg:px-12 overflow-hidden">
          <div className="mb-6 flex items-end justify-between gap-4">
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
            
            {/* Scroll Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => scrollContainer(featuredScrollRef, "left")}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-secondary active:scale-95 shadow-sm"
                aria-label="Scroll featured products left"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => scrollContainer(featuredScrollRef, "right")}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-secondary active:scale-95 shadow-sm"
                aria-label="Scroll featured products right"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="relative">
            <div
              ref={featuredScrollRef}
              className="flex gap-5 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-6 -mx-6 px-6 lg:-mx-12 lg:px-12 scrollbar-none"
            >
              {featured.map((product) => (
                <div key={product.id} className="w-[280px] shrink-0 snap-start relative group">
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
          </div>
        </section>
      )}

      {/* SECTION 2: CURATED BASKETS */}
      {baskets.length > 0 && (
        <section className="container mx-auto px-6 lg:px-12">
          <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-1.5 text-primary mb-1">
                <ShoppingBag className="h-4 w-4" />
                <span className="font-body text-xs font-semibold uppercase tracking-widest">
                  Ready-made Combos
                </span>
              </div>
              <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
                Curated Kitchen Baskets
              </h2>
            </div>
            <p className="font-body text-sm text-muted-foreground max-w-sm">
              Pre-packed kitchen boxes and recipe crates. One-click adds the entire bundle to your cart!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {baskets.map((basket) => (
              <motion.div
                key={basket.id}
                whileHover={{ y: -4 }}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card shadow-sm hover:shadow-lg transition-all duration-300"
              >
                <div>
                  {/* Image wrapper */}
                  <div className="relative h-48 w-full overflow-hidden bg-secondary">
                    {basket.image ? (
                      <img
                        src={basket.image}
                        alt={basket.name}
                        loading="lazy"
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-muted-foreground/40">
                        <ShoppingBag className="h-16 w-16 stroke-[1.2]" />
                      </div>
                    )}
                    <span className="absolute top-3 right-3 rounded-full bg-background/85 backdrop-blur-md px-3 py-1 font-body text-xs font-bold text-foreground shadow-sm">
                      {basket.basket_items?.length || 0} Products
                    </span>
                  </div>

                  {/* Info content */}
                  <div className="p-5 space-y-3">
                    <div>
                      <h3 className="font-display text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                        {basket.name}
                      </h3>
                      <p className="font-body text-xs text-muted-foreground line-clamp-2 mt-1">
                        {basket.description || "Fresh combination basket for your household needs."}
                      </p>
                    </div>

                    {/* Basket items list preview */}
                    {basket.basket_items && basket.basket_items.length > 0 && (
                      <div className="rounded-xl bg-muted/30 border border-border/40 p-3 space-y-1.5">
                        <p className="font-body text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Includes
                        </p>
                        <div className="space-y-1 max-h-[80px] overflow-y-auto pr-1">
                          {basket.basket_items.map((item: any) => (
                            <div key={item.id} className="flex justify-between items-center text-xs font-body text-foreground/80">
                              <span className="truncate max-w-[150px]">
                                • {item.product?.name || "Product"}
                              </span>
                              <span className="text-muted-foreground text-[11px]">
                                qty: {item.quantity}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Price and Cart action */}
                <div className="p-5 pt-0 border-t border-border/30 mt-auto flex items-center justify-between">
                  <div>
                    <span className="font-display text-xl font-black text-primary">
                      {formatNaira(basket.price)}
                    </span>
                    <span className="font-body text-[10px] text-muted-foreground block -mt-1">
                      Bundle Price
                    </span>
                  </div>

                  <motion.button
                    onClick={() => handleAddBasket(basket)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 font-body text-xs font-bold text-accent-foreground shadow-sm transition-colors hover:bg-accent/90"
                    aria-label={`Add ${basket.name} to cart`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Basket</span>
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* SECTION 3: WHAT BUYERS LOVE (SLIDEABLE CAROUSEL) */}
      {buyersLove.length > 0 && (
        <section className="container mx-auto px-6 lg:px-12 overflow-hidden">
          <div className="rounded-3xl bg-secondary/40 border border-border p-8 sm:p-12">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
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

              {/* Scroll Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => scrollContainer(buyersLoveScrollRef, "left")}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-secondary active:scale-95 shadow-sm"
                  aria-label="Scroll buyer favorites left"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => scrollContainer(buyersLoveScrollRef, "right")}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-secondary active:scale-95 shadow-sm"
                  aria-label="Scroll buyer favorites right"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="relative">
              <div
                ref={buyersLoveScrollRef}
                className="flex gap-5 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-6 -mx-2 px-2 scrollbar-none"
              >
                {buyersLove.map((product) => (
                  <div key={product.id} className="w-[280px] shrink-0 snap-start">
                    <ProductCard product={product as any} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
