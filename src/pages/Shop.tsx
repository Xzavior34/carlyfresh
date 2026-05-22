/**
 * Shop Page -- CarlyFresh Marketplace
 * All Products shown first, then curated sections below.
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/products/ProductCard";
import CategoryFilter from "@/components/products/CategoryFilter";
import type { DBProduct } from "@/components/products/ProductGrid";
import {
  Sparkles, ShoppingBag, Heart, TrendingUp, Layers, Search,
  Plus, Loader2, Tag, Package,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatNaira } from "@/lib/formatters";

type Product = DBProduct & {
  is_featured?: boolean;
  is_buyer_favourite?: boolean;
  is_bundle?: boolean;
};

const TABS = [
  { id: "all",      label: "All Products", icon: Layers },
  { id: "featured", label: "Featured",     icon: Sparkles },
  { id: "baskets",  label: "Baskets",      icon: ShoppingBag },
  { id: "trending", label: "Trending",     icon: TrendingUp },
  { id: "bulk",     label: "Bulk Deals",   icon: Tag },
] as const;

type TabId = typeof TABS[number]["id"];

function SectionHeader({
  icon: Icon, accent, title, sub, color = "text-primary",
}: {
  icon: React.ElementType; accent: string; title: string; sub: string; color?: string;
}) {
  return (
    <div className="mb-8">
      <div className={`flex items-center gap-1.5 mb-1.5 ${color}`}>
        <Icon className="h-4 w-4" />
        <span className="font-body text-[11px] font-bold uppercase tracking-widest">{accent}</span>
      </div>
      <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">{title}</h2>
      <p className="mt-1 font-body text-sm text-muted-foreground max-w-lg">{sub}</p>
    </div>
  );
}

function BasketCard({ basket, onAdd }: { basket: any; onAdd: (b: any) => void }) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card shadow-sm hover:shadow-xl transition-all duration-300"
    >
      <div>
        <div className="relative h-48 w-full overflow-hidden bg-secondary">
          {basket.image ? (
            <img src={basket.image} alt={basket.name} loading="lazy"
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <ShoppingBag className="h-16 w-16 text-muted-foreground/20 stroke-[1.2]" />
            </div>
          )}
          <span className="absolute top-3 right-3 rounded-full bg-background/90 backdrop-blur-md px-3 py-1 font-body text-xs font-bold text-foreground shadow-sm">
            {basket.basket_items?.length || 0} items
          </span>
          <span className="absolute top-3 left-3 rounded-full bg-primary px-3 py-1 font-body text-[10px] font-bold uppercase tracking-wide text-primary-foreground shadow">
            Bundle
          </span>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <h3 className="font-display text-lg font-bold text-foreground group-hover:text-primary transition-colors">
              {basket.name}
            </h3>
            <p className="font-body text-xs text-muted-foreground line-clamp-2 mt-1">
              {basket.description || "Fresh combination basket for your household needs."}
            </p>
          </div>
          {basket.basket_items && basket.basket_items.length > 0 && (
            <div className="rounded-xl bg-muted/40 border border-border/40 p-3">
              <p className="font-body text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Includes</p>
              <div className="space-y-1 max-h-[72px] overflow-y-auto pr-1">
                {basket.basket_items.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-center text-xs font-body text-foreground/80">
                    <span className="truncate max-w-[150px]">• {item.product?.name || "Product"}</span>
                    <span className="text-muted-foreground text-[11px] shrink-0 ml-2">qty: {item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="px-5 pb-5 pt-3 border-t border-border/30 flex items-center justify-between">
        <div>
          <span className="font-display text-xl font-black text-primary">{formatNaira(basket.price)}</span>
          <span className="font-body text-[10px] text-muted-foreground block -mt-0.5">Bundle Price</span>
        </div>
        <motion.button
          onClick={() => onAdd(basket)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 font-body text-xs font-bold text-accent-foreground shadow hover:bg-accent/90 transition-colors"
          aria-label={`Add ${basket.name} basket to cart`}
        >
          <Plus className="h-3.5 w-3.5" />
          Add Basket
        </motion.button>
      </div>
    </motion.div>
  );
}

const Shop = () => {
  const [searchParams] = useSearchParams();
  const { addItem } = useCart();

  const [activeTab, setActiveTab] = useState<TabId>("all");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [featured, setFeatured] = useState<Product[]>([]);
  const [buyersLove, setBuyersLove] = useState<Product[]>([]);
  const [baskets, setBaskets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { setSearch(searchParams.get("q") || ""); }, [searchParams]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    Promise.all([
      supabase.from("products").select("*").eq("in_stock", true).order("created_at", { ascending: false }),
      supabase.from("products").select("*").eq("is_featured", true).eq("in_stock", true).order("created_at", { ascending: false }).limit(8),
      supabase.from("products").select("*").eq("is_buyer_favourite", true).eq("in_stock", true).order("created_at", { ascending: false }).limit(8),
      supabase.from("baskets" as any).select("*, basket_items(*, product:products(*))").order("created_at", { ascending: false }).limit(6),
    ]).then(([allRes, featRes, loveRes, basketsRes]) => {
      if (!mounted) return;
      if (allRes.data) {
        setProducts(allRes.data as Product[]);
        setCategories(["All", ...Array.from(new Set(allRes.data.map((p: any) => p.category).filter(Boolean)))]);
      }
      if (featRes.data) setFeatured(featRes.data as Product[]);
      if (loveRes.data) setBuyersLove(loveRes.data as Product[]);
      if (basketsRes.data) setBaskets(basketsRes.data as any[]);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const handleAddBasket = (basket: any) => {
    addItem(basket.id, basket.name, basket.price, undefined, "basket", basket.price);
  };

  const bulkProducts = products.filter(p => p.bulk_min_qty && p.bulk_price);

  const filteredProducts = products.filter(p => {
    const matchCat = category === "All" || p.category === category;
    const q = search.toLowerCase().trim();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || (p.description || "").toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const scrollToSection = (id: TabId) => {
    setActiveTab(id);
    setTimeout(() => {
      const el = document.getElementById(`shop-section-${id}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
  };
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden pt-24 pb-8">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-accent/8 pointer-events-none" />
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col md:flex-row md:items-end md:justify-between gap-6"
          >
            <div>
              <span className="mb-2 block font-body text-xs font-bold uppercase tracking-widest text-accent">
                CarlyFresh Marketplace
              </span>
              <h1 className="font-display text-4xl font-black text-foreground sm:text-5xl leading-tight">
                Fresh Produce,<br className="hidden sm:block" />
                <span className="text-primary"> Straight to You</span>
              </h1>
              <p className="mt-3 max-w-lg font-body text-muted-foreground">
                Browse featured picks, curated baskets, trending staples, and wholesale deals.
              </p>
            </div>
            <div className="relative md:w-72 shrink-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                id="shop-search"
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={e => { setSearch(e.target.value); setActiveTab("all"); }}
                className="w-full rounded-2xl border border-input bg-card pl-10 pr-4 py-3 font-body text-sm text-foreground placeholder:text-muted-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* STICKY TABS */}
      <div className="sticky top-16 z-30 bg-background/95 backdrop-blur-md border-b border-border shadow-sm">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-none">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                id={`tab-${id}`}
                onClick={() => scrollToSection(id)}
                className={[
                  "flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2 font-body text-sm font-semibold transition-all duration-200",
                  activeTab === id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                ].join(" ")}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="pb-24">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="font-body text-sm">Loading marketplace...</p>
          </div>
        ) : (
          <>
            {/* === ALL PRODUCTS (first) === */}
            <section id="shop-section-all" className="container mx-auto px-6 lg:px-12 pt-12">
              <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-1.5 text-foreground/50 mb-1">
                    <Layers className="h-4 w-4" />
                    <span className="font-body text-[11px] font-bold uppercase tracking-widest">Full Catalog</span>
                  </div>
                  <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">All Products</h2>
                </div>
                <p className="font-body text-sm text-muted-foreground">
                  {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""}
                  {category !== "All" ? ` in ${category}` : ""}
                  {search ? ` matching "${search}"` : ""}
                </p>
              </div>

              <div className="flex flex-col gap-8 lg:flex-row">
                <div className="w-full shrink-0 lg:w-56">
                  <div className="sticky top-32">
                    <CategoryFilter
                      selected={category}
                      onSelect={setCategory}
                      search={search}
                      onSearch={setSearch}
                      categories={categories}
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`${category}-${search}`}
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
                    >
                      {filteredProducts.map(product => (
                        <motion.div key={product.id} variants={cardVariants}>
                          <ProductCard product={product} />
                        </motion.div>
                      ))}
                    </motion.div>
                  </AnimatePresence>
                  {filteredProducts.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                      <Package className="h-16 w-16 text-muted-foreground/20 mb-4" />
                      <p className="font-display text-lg font-semibold text-foreground">No products found</p>
                      <p className="font-body text-sm text-muted-foreground mt-1">Try adjusting your search or category filter.</p>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* DIVIDER */}
            {(featured.length > 0 || baskets.length > 0 || buyersLove.length > 0 || bulkProducts.length > 0) && (
              <div className="container mx-auto px-6 lg:px-12 pt-16 pb-2">
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-border" />
                  <span className="font-body text-xs font-bold uppercase tracking-widest text-muted-foreground">Curated Sections</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
              </div>
            )}

            {/* === FEATURED === */}
            {featured.length > 0 && (
              <section id="shop-section-featured" className="container mx-auto px-6 lg:px-12 pt-12">
                <SectionHeader
                  icon={Sparkles}
                  accent="Handpicked"
                  title="Featured Products"
                  sub="Top picks selected by the CarlyFresh team — freshest arrivals and curated bundles."
                  color="text-accent"
                />
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.1 }}
                  className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4"
                >
                  {featured.map(product => (
                    <motion.div key={product.id} variants={cardVariants} className="relative">
                      {product.is_bundle && (
                        <span className="absolute top-3 left-3 z-10 rounded-full bg-primary px-2.5 py-1 font-body text-[10px] font-bold uppercase tracking-wide text-primary-foreground shadow">
                          Bundle
                        </span>
                      )}
                      <ProductCard product={product} />
                    </motion.div>
                  ))}
                </motion.div>
              </section>
            )}

            {/* === BASKETS === */}
            {baskets.length > 0 && (
              <section id="shop-section-baskets" className="container mx-auto px-6 lg:px-12 pt-14">
                <SectionHeader
                  icon={ShoppingBag}
                  accent="Ready-Made Combos"
                  title="Curated Kitchen Baskets"
                  sub="Pre-packed recipe crates and household kitchen boxes. One tap adds the entire bundle."
                  color="text-primary"
                />
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.1 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {baskets.map(basket => (
                    <motion.div key={basket.id} variants={cardVariants}>
                      <BasketCard basket={basket} onAdd={handleAddBasket} />
                    </motion.div>
                  ))}
                </motion.div>
              </section>
            )}

            {/* === TRENDING / BUYERS LOVE === */}
            {buyersLove.length > 0 && (
              <section id="shop-section-trending" className="pt-14">
                <div className="container mx-auto px-6 lg:px-12">
                  <div className="rounded-3xl bg-gradient-to-br from-rose-500/5 via-background to-accent/5 border border-border p-8 sm:p-10">
                    <SectionHeader
                      icon={Heart}
                      accent="Customer Favorites"
                      title="What Buyers Love"
                      sub="Consistently ordered staples that buyers keep coming back for across our supply network."
                      color="text-rose-500"
                    />
                    <motion.div
                      variants={containerVariants}
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true, amount: 0.1 }}
                      className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4"
                    >
                      {buyersLove.map(product => (
                        <motion.div key={product.id} variants={cardVariants}>
                          <ProductCard product={product} />
                        </motion.div>
                      ))}
                    </motion.div>
                  </div>
                </div>
              </section>
            )}

            {/* === BULK DEALS === */}
            {bulkProducts.length > 0 && (
              <section id="shop-section-bulk" className="container mx-auto px-6 lg:px-12 pt-14">
                <SectionHeader
                  icon={Tag}
                  accent="Wholesale Pricing"
                  title="Bulk Deals"
                  sub="Buy more, save more. Hit the minimum quantity to unlock a lower price per unit."
                  color="text-emerald-600"
                />
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.1 }}
                  className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4"
                >
                  {bulkProducts.map(product => (
                    <motion.div key={product.id} variants={cardVariants}>
                      <ProductCard product={product} />
                    </motion.div>
                  ))}
                </motion.div>
              </section>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Shop;

