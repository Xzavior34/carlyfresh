import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Search, ShoppingBag, MapPin, Smile } from "lucide-react";

const howItWorksSteps = [
  {
    id: 1,
    title: "1. Discover & Pick",
    description: "Browse 130+ farm-fresh veggies, proteins, and curated family baskets at wholesale rates.",
    emoji: "🛒",
  },
  {
    id: 2,
    title: "2. Fast & Secure Checkout",
    description: "Checkout seamlessly with card, bank transfer, or Paystack in under 60 seconds.",
    emoji: "💳",
  },
  {
    id: 3,
    title: "3. Live Driver Tracking",
    description: "Track your delivery driver with live updates, WhatsApp receipt, and ETA notifications.",
    emoji: "🚚",
  },
  {
    id: 4,
    title: "4. Unbox Freshness",
    description: "Enjoy pristine organic produce, farm eggs, and fresh meats delivered straight to your door.",
    emoji: "✨",
  },
];

const HowItWorks = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="bg-secondary/40 py-14 md:py-24 border-y border-border/60 relative overflow-hidden">
      <div className="container mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-12 md:mb-16 text-center max-w-2xl mx-auto"
        >
          <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-accent/15 border border-accent/25 px-3.5 py-1 font-body text-xs font-bold uppercase tracking-widest text-accent-foreground">
            ⚡ Quick & Seamless
          </span>
          <h2 className="mt-2 font-display text-4xl font-extrabold tracking-tight text-foreground md:text-5xl">
            How CarlyFresh Works
          </h2>
          <p className="mt-3 font-body text-base text-muted-foreground">
            From the farm gate to your kitchen table in four effortless steps.
          </p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 relative">
          {howItWorksSteps.map((step, i) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              whileHover={{ y: -6 }}
              className="rounded-3xl border border-border bg-card p-6 text-center shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300 flex flex-col justify-between relative group"
            >
              <div>
                <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-3xl shadow-inner group-hover:scale-110 transition-transform duration-300">
                  {step.emoji}
                  <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-accent text-accent-foreground font-display text-xs font-bold flex items-center justify-center shadow">
                    {step.id}
                  </span>
                </div>
                <h3 className="mb-2 font-display text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                  {step.title}
                </h3>
                <p className="font-body text-xs leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
