import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import ProductCard from "./ProductCard";
import type { DBProduct } from "./ProductGrid";

const RecommendedCarousel = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<DBProduct[]>([]);
  const [personalized, setPersonalized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    supabase.functions
      .invoke("generate-user-recommendations", {
        body: { user_id: user?.id ?? null },
      })
      .then(({ data }) => {
        if (!mounted) return;
        setProducts((data?.products as DBProduct[]) ?? []);
        setPersonalized(Boolean(data?.personalized));
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [user]);

  if (!loading && products.length === 0) return null;

  return (
    <section className="py-16 sm:py-20">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <span className="font-body text-xs font-semibold uppercase tracking-widest text-accent">
              {personalized ? "Picked for you" : "Trending now"}
            </span>
            <h2 className="mt-1 font-display text-2xl font-bold text-foreground sm:text-3xl">
              {personalized ? "Recommended for you" : "What buyers love"}
            </h2>
          </div>
        </div>

        {loading ? (
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-72 w-64 shrink-0 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="-mx-6 flex snap-x snap-mandatory gap-5 overflow-x-auto px-6 pb-4 lg:-mx-12 lg:px-12"
          >
            {products.map((p) => (
              <div key={p.id} className="w-[260px] shrink-0 snap-start sm:w-[280px]">
                <ProductCard product={p} />
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default RecommendedCarousel;
