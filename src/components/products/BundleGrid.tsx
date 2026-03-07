import { useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { supabase } from "@/integrations/supabase/client";
import type { DBProduct } from "./ProductGrid";

const BundleGrid = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const scrollRef = useRef<HTMLDivElement>(null);
  const { addItem } = useCart();
  const [bundles, setBundles] = useState<DBProduct[]>([]);

  useEffect(() => {
    const fetchBundles = async () => {
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("category", "Bundles")
        .eq("in_stock", true);
      if (data) setBundles(data);
    };
    fetchBundles();
  }, []);

  const scroll = (dir: "left" | "right") => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === "left" ? -340 : 340, behavior: "smooth" });
    }
  };

  if (bundles.length === 0) return null;

  return (
    <section id="bundles" ref={ref} className="py-12 md:py-24 lg:py-32">
      <div className="container mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-8 md:mb-12 flex items-end justify-between"
        >
          <div>
            <span className="mb-2 block font-body text-xs font-semibold uppercase tracking-widest text-accent">
              Curated for you
            </span>
            <h2 className="font-display text-4xl font-bold text-foreground md:text-5xl">
              Fresh Bundles
            </h2>
          </div>
          <div className="hidden gap-2 md:flex">
            <button
              onClick={() => scroll("left")}
              className="rounded-full border border-border p-3 text-foreground/50 transition-colors hover:border-primary hover:text-primary"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => scroll("right")}
              className="rounded-full border border-border p-3 text-foreground/50 transition-colors hover:border-primary hover:text-primary"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </motion.div>

        <div
          ref={scrollRef}
          className="-mx-6 flex gap-6 overflow-x-auto px-6 pb-4 scrollbar-hide lg:-mx-0 lg:px-0"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {bundles.map((bundle, i) => (
            <motion.div
              key={bundle.id}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group relative min-w-[300px] flex-shrink-0 cursor-pointer overflow-hidden rounded-2xl bg-card shadow-md transition-shadow hover:shadow-xl"
              style={{ scrollSnapAlign: "start" }}
            >
              <div className="relative h-56 overflow-hidden">
                {bundle.image_url ? (
                  <img
                    src={bundle.image_url}
                    alt={bundle.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-secondary text-4xl text-muted-foreground">📦</div>
                )}
                <motion.button
                  onClick={() => addItem(bundle.id, bundle.name, bundle.price, bundle.vendor_id)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="absolute bottom-4 right-4 flex h-10 w-10 translate-y-4 items-center justify-center rounded-full bg-accent text-accent-foreground opacity-0 shadow-lg transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
                >
                  <Plus size={20} />
                </motion.button>
              </div>
              <div className="p-5">
                <h3 className="font-display text-lg font-semibold text-foreground">{bundle.name}</h3>
                <p className="mt-3 font-display text-xl font-bold text-primary">
                  ₦{bundle.price.toLocaleString("en-NG")}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BundleGrid;
