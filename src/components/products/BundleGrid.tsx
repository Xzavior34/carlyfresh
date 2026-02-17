import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { bundles } from "@/data/mockData";
import { useCart } from "@/context/CartContext";
import bundleBreakfast from "@/assets/bundle-breakfast.jpg";
import bundleFamily from "@/assets/bundle-family.jpg";
import bundleFruits from "@/assets/bundle-fruits.jpg";
import bundleChef from "@/assets/bundle-chef.jpg";

const imageMap: Record<string, string> = {
  breakfast: bundleBreakfast,
  family: bundleFamily,
  fruits: bundleFruits,
  chef: bundleChef,
};

const BundleGrid = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const scrollRef = useRef<HTMLDivElement>(null);
  const { addItem } = useCart();

  const scroll = (dir: "left" | "right") => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === "left" ? -340 : 340, behavior: "smooth" });
    }
  };

  return (
    <section id="bundles" ref={ref} className="py-24 lg:py-32">
      <div className="container mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-12 flex items-end justify-between"
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
                <img
                  src={imageMap[bundle.image]}
                  alt={bundle.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                {bundle.tag && (
                  <span className="absolute left-4 top-4 rounded-full bg-primary px-3 py-1 font-body text-xs font-semibold text-primary-foreground">
                    {bundle.tag}
                  </span>
                )}
                <motion.button
                  onClick={() => addItem(bundle.id, bundle.name, bundle.price)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="absolute bottom-4 right-4 flex h-10 w-10 translate-y-4 items-center justify-center rounded-full bg-accent text-accent-foreground opacity-0 shadow-lg transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
                >
                  <Plus size={20} />
                </motion.button>
              </div>
              <div className="p-5">
                <h3 className="font-display text-lg font-semibold text-foreground">{bundle.name}</h3>
                <p className="mt-1 font-body text-sm leading-relaxed text-muted-foreground">
                  {bundle.description}
                </p>
                <p className="mt-3 font-display text-xl font-bold text-primary">
                  €{bundle.price.toFixed(2)}
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
