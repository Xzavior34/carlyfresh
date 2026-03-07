import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Leaf, Truck, BadgeDollarSign } from "lucide-react";

const features = [
  { id: "f1", title: "Farm-Fresh", description: "Sourced directly from local farms. No middlemen, no stale produce.", icon: "Leaf" },
  { id: "f2", title: "Fast Delivery", description: "Same-day and next-day delivery to your doorstep.", icon: "Truck" },
  { id: "f3", title: "Affordable", description: "Wholesale pricing passed on to you. Save up to 30% vs retail.", icon: "BadgeDollarSign" },
];

const iconMap: Record<string, React.ReactNode> = {
  Leaf: <Leaf size={28} />,
  Truck: <Truck size={28} />,
  BadgeDollarSign: <BadgeDollarSign size={28} />,
};

const FeaturesSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-8 md:py-24 lg:py-32">
      <div className="container mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-8 md:mb-16 text-center"
        >
          <span className="mb-2 block font-body text-xs font-semibold uppercase tracking-widest text-accent">
            Our Promise
          </span>
          <h2 className="font-display text-4xl font-bold text-foreground md:text-5xl">
            Why Shop With Us?
          </h2>
        </motion.div>

        <div className="grid gap-8 sm:grid-cols-3">
          {features.map((feature, i) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="rounded-3xl border border-border bg-card p-8 text-center shadow-md transition-shadow hover:shadow-xl"
            >
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                {iconMap[feature.icon]}
              </div>
              <h3 className="mb-2 font-display text-xl font-semibold text-foreground">{feature.title}</h3>
              <p className="font-body text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
