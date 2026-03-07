import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { toast } from "@/hooks/use-toast";

const pricingPlans = [
  {
    id: "starter", name: "Starter", price: 0, period: "mo", recommended: false,
    features: ["Pay per delivery", "Standard delivery (2-3 days)", "Access to all bundles", "Basic order tracking"],
  },
  {
    id: "fresh-premium", name: "Fresh Premium", price: 9900, period: "mo", recommended: true,
    features: ["Free unlimited delivery", "Priority delivery (same day)", "Exclusive premium bundles", "Advanced order tracking", "Priority customer support", "Early access to new products"],
  },
  {
    id: "premium-plus", name: "Premium Plus", price: 19900, period: "mo", recommended: false,
    features: ["Everything in Fresh Premium", "Dedicated account manager", "Custom bundle builder", "Bulk order discounts", "API access for businesses", "White-glove onboarding", "24/7 priority support"],
  },
];

const PricingPage = () => {
  const [yearly, setYearly] = useState(false);
  const cardsRef = useRef<HTMLDivElement>(null);
  const cardsInView = useInView(cardsRef, { once: true, margin: "-80px" });
  const navigate = useNavigate();

  const handleSubscribe = (plan: typeof pricingPlans[number]) => {
    if (plan.price === 0) {
      navigate("/signup");
      return;
    }
    toast({
      title: "Subscription initiated!",
      description: `You selected ${plan.name} — ${yearly ? "yearly" : "monthly"}. Redirecting to payment…`,
    });
    // TODO: integrate real payment flow
    setTimeout(() => navigate("/signup"), 1500);
  };

  const getPrice = (monthlyPrice: number) => {
    if (monthlyPrice === 0) return 0;
    return yearly ? +(monthlyPrice * 12 * 0.8).toFixed(2) : monthlyPrice;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-28 pb-24">
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12 sm:mb-16 text-center"
          >
            <span className="mb-2 block font-body text-xs font-semibold uppercase tracking-widest text-accent">
              Plans
            </span>
            <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl md:text-5xl">
              Choose Your Plan
            </h1>
            <p className="mx-auto mt-4 max-w-md font-body text-muted-foreground">
              Start for free or unlock premium benefits with our subscription plans.
            </p>

            <div className="mt-8 flex items-center justify-center gap-3">
              <span className={`font-body text-sm ${!yearly ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                Monthly
              </span>
              <button
                onClick={() => setYearly(!yearly)}
                className={`relative h-7 w-12 rounded-full transition-colors ${yearly ? "bg-primary" : "bg-border"}`}
              >
                <span
                  className={`absolute top-0.5 h-6 w-6 rounded-full bg-card shadow-md transition-transform ${
                    yearly ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
              <span className={`font-body text-sm ${yearly ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                Yearly <span className="text-primary">(20% off)</span>
              </span>
            </div>
          </motion.div>

          <div ref={cardsRef} className="mx-auto grid max-w-5xl gap-6 sm:gap-8 md:grid-cols-3">
            {pricingPlans.map((plan, i) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={cardsInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className={`relative rounded-3xl p-6 sm:p-8 transition-shadow ${
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
                <h3 className="font-display text-xl sm:text-2xl font-bold text-foreground">{plan.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="font-display text-4xl sm:text-5xl font-bold text-foreground">
                    ₦{getPrice(plan.price).toLocaleString("en-NG")}
                  </span>
                  <span className="font-body text-muted-foreground">
                    /{yearly ? "yr" : "mo"}
                  </span>
                </div>
                <ul className="mt-6 sm:mt-8 space-y-3">
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
                  className={`mt-6 sm:mt-8 w-full rounded-full py-3.5 font-body text-sm font-semibold transition-colors ${
                    plan.recommended
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "border border-border bg-secondary text-foreground hover:bg-muted"
                  }`}
                >
                  {plan.price === 0 ? "Get Started" : "Subscribe"}
                </motion.button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PricingPage;
