import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Check } from "lucide-react";

const pricingPlans = [
  {
    id: "starter", name: "Starter", price: 0, period: "mo", recommended: false,
    features: ["Pay per delivery", "Standard delivery (2-3 days)", "Access to all bundles", "Basic order tracking"],
  },
  {
    id: "fresh-premium", name: "Fresh Premium", price: 9900, period: "mo", recommended: true,
    features: ["Free unlimited delivery", "Priority delivery (same day)", "Exclusive premium bundles", "Advanced order tracking", "Priority customer support", "Early access to new products"],
  },
];

const Pricing = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="pricing" ref={ref} className="py-12 md:py-24 lg:py-32">
      <div className="container mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-8 md:mb-16 text-center"
        >
          <span className="mb-2 block font-body text-xs font-semibold uppercase tracking-widest text-accent">
            Plans
          </span>
          <h2 className="font-display text-4xl font-bold text-foreground md:text-5xl">
            Choose Your Plan
          </h2>
          <p className="mx-auto mt-4 max-w-md font-body text-muted-foreground">
            Start for free or unlock unlimited deliveries with Fresh Premium.
          </p>
        </motion.div>

        <div className="mx-auto grid max-w-3xl gap-8 md:grid-cols-2">
          {pricingPlans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className={`relative rounded-3xl p-8 transition-shadow ${
                plan.recommended
                  ? "border-2 border-primary bg-card shadow-xl"
                  : "border border-border bg-card shadow-md"
              }`}
            >
              {plan.recommended && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 font-body text-xs font-semibold text-primary-foreground">
                  Recommended
                </span>
              )}
              <h3 className="font-display text-2xl font-bold text-foreground">{plan.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-display text-5xl font-bold text-foreground">₦{plan.price.toLocaleString("en-NG")}</span>
                <span className="font-body text-muted-foreground">/{plan.period}</span>
              </div>
              <ul className="mt-8 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 font-body text-sm text-foreground/80">
                    <Check size={18} className="mt-0.5 shrink-0 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className={`mt-8 w-full rounded-full py-3.5 font-body text-sm font-semibold transition-colors ${
                  plan.recommended
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "border border-border bg-secondary text-foreground hover:bg-muted"
                }`}
              >
                {plan.recommended ? "Get Premium" : "Get Started"}
              </motion.button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
