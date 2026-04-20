/**
 * Featured Products grid — replaces the previous "Bundles only" carousel.
 * Shows up to 8 in-stock products so the section is always meaningful and
 * never collapses into an empty gap on the homepage.
 */
import { useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ProductCard from "./ProductCard";
import type { DBProduct } from "./ProductGrid";

const FeaturedProducts = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [products, setProducts] = useState<DBProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("in_stock", true)
        .order("created_at", { ascending: false })
        .limit(8);
      if (data) setProducts(data as DBProduct[]);
      setLoading(false);
    };
    fetch();
  }, []);

  if (!loading && products.length === 0) return null;

  return (
    <section id="featured" ref={ref} className="py-10 md:py-16 bg-secondary/30">
      <div className="container mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-8 flex items-end justify-between gap-4"
        >
          <div>
            <span className="mb-2 block font-body text-xs font-semibold uppercase tracking-widest text-accent">
              Fresh Picks
            </span>
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">
              Featured Products
            </h2>
          </div>
          <Link
            to="/shop"
            className="hidden items-center gap-1.5 rounded-full border border-border px-4 py-2 font-body text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary md:inline-flex"
          >
            Shop all <ArrowRight size={16} />
          </Link>
        </motion.div>

        {loading ? (
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-64 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {products.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <ProductCard product={p} />
              </motion.div>
            ))}
          </div>
        )}

        <div className="mt-8 text-center md:hidden">
          <Link
            to="/shop"
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-6 py-3 font-body text-sm font-semibold text-primary-foreground"
          >
            Shop all <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
