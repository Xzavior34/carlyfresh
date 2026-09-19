import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Truck, BadgeDollarSign } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";

const features = [
  {
    id: "f1",
    title: "100% Farm-Fresh",
    description: "Harvested and packed fresh from trusted partner farms daily. Zero stale shelf time.",
    emoji: "🌱",
    badge: "Direct Harvest",
    bgGradient: "from-emerald-500/10 to-teal-500/5",
  },
  {
    id: "f2",
    title: "Express 45-Min Dispatch",
    description: "Smart algorithmic driver routing brings fresh groceries to your door in record time.",
    emoji: "⚡",
    badge: "Fast Dispatch",
    bgGradient: "from-amber-500/10 to-orange-500/5",
  },
  {
    id: "f3",
    title: "Wholesale & Farm Rates",
    description: "Direct-to-consumer farm pricing. Save up to 30% compared to local open-air markets.",
    emoji: "💰",
    badge: "Best Value",
    bgGradient: "from-primary/10 to-emerald-500/5",
  },
];

const FeaturesSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-12 md:py-20 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="container relative mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-10 md:mb-16 text-center max-w-2xl mx-auto"
        >
          <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3.5 py-1 font-body text-xs font-bold uppercase tracking-widest text-primary">
            ✨ The CarlyFresh Advantage
          </span>
          <h2 className="mt-2 font-display text-4xl font-extrabold tracking-tight text-foreground md:text-5xl">
            Why Foodies Love Us
          </h2>
          <p className="mt-3 font-body text-base text-muted-foreground">
            We cut out the middlemen and traffic stress so you get farm-fresh ingredients delivered at unbeatable prices.
          </p>
        </motion.div>

        <div className="grid gap-8 sm:grid-cols-3">
          {features.map((feature, i) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              whileHover={{ y: -6 }}
              className={`rounded-3xl border border-border/80 bg-gradient-to-b ${feature.bgGradient} p-8 text-center shadow-sm hover:shadow-2xl hover:border-primary/40 transition-all duration-300 relative group overflow-hidden`}
            >
              <div className="absolute top-4 right-4">
                <span className="rounded-full bg-background/80 backdrop-blur-md px-2.5 py-1 font-body text-[10px] font-bold text-foreground border border-border/50">
                  {feature.badge}
                </span>
              </div>

              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-background shadow-md group-hover:scale-110 transition-transform duration-300 text-3xl border border-border/50">
                {feature.emoji}
              </div>
              <h3 className="mb-2.5 font-display text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              <p className="font-body text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
