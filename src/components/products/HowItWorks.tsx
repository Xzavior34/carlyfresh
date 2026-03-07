import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Search, ShoppingBag, MapPin, Smile } from "lucide-react";

const howItWorksSteps = [
  { id: 1, title: "Discover", description: "Browse curated bundles and fresh produce from local farms.", icon: "Search" },
  { id: 2, title: "Order", description: "Add items to your cart and checkout in under 60 seconds.", icon: "ShoppingBag" },
  { id: 3, title: "Track", description: "Follow your order in real-time from farm to your doorstep.", icon: "MapPin" },
  { id: 4, title: "Enjoy", description: "Unbox the freshest food, delivered with care and love.", icon: "Smile" },
];

const iconMap: Record<string, React.ReactNode> = {
  Search: <Search size={28} />,
  ShoppingBag: <ShoppingBag size={28} />,
  MapPin: <MapPin size={28} />,
  Smile: <Smile size={28} />,
};

const HowItWorks = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="bg-secondary py-12 md:py-24 lg:py-32">
      <div className="container mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-8 md:mb-16 text-center"
        >
          <span className="mb-2 block font-body text-xs font-semibold uppercase tracking-widest text-accent">
            Simple & Easy
          </span>
          <h2 className="font-display text-4xl font-bold text-foreground md:text-5xl">
            Experience Freshness
          </h2>
        </motion.div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {howItWorksSteps.map((step, i) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="text-center"
            >
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                {iconMap[step.icon]}
              </div>
              <span className="mb-2 block font-body text-xs font-semibold uppercase tracking-widest text-accent">
                Step {step.id}
              </span>
              <h3 className="mb-2 font-display text-xl font-semibold text-foreground">{step.title}</h3>
              <p className="font-body text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
