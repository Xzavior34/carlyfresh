import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { TrendingDown, UserCheck, CalendarClock } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BusinessForm from "@/components/forms/BusinessForm";

const businessBenefits = [
  { id: "b1", title: "Bulk Pricing", description: "Volume discounts that scale with your order size. Save more when you buy more.", icon: "TrendingDown" },
  { id: "b2", title: "Dedicated Account Manager", description: "A single point of contact who understands your business needs.", icon: "UserCheck" },
  { id: "b3", title: "Flexible Delivery", description: "Schedule deliveries that fit your business hours. Daily, weekly, or custom.", icon: "CalendarClock" },
];

const iconMap: Record<string, React.ReactNode> = {
  TrendingDown: <TrendingDown size={28} />,
  UserCheck: <UserCheck size={28} />,
  CalendarClock: <CalendarClock size={28} />,
};

const Business = () => {
  const benefitsRef = useRef<HTMLDivElement>(null);
  const benefitsInView = useInView(benefitsRef, { once: true, margin: "-80px" });
  const formRef = useRef<HTMLDivElement>(null);
  const formInView = useInView(formRef, { once: true, margin: "-80px" });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="bg-primary pt-28 pb-20">
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl"
          >
            <span className="mb-2 block font-body text-xs font-semibold uppercase tracking-widest text-accent">
              B2B Solutions
            </span>
            <h1 className="font-display text-3xl font-bold text-primary-foreground sm:text-4xl md:text-5xl">
              Wholesale Prices for Restaurants, Hotels & Caterers
            </h1>
            <p className="mt-4 font-body text-base text-primary-foreground/70 sm:text-lg">
              Partner with CarlyFresh for reliable, farm-fresh supply at scale.
            </p>
          </motion.div>
        </div>
      </section>

      <section ref={benefitsRef} className="py-16 sm:py-24">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid gap-6 sm:gap-8 sm:grid-cols-2 md:grid-cols-3">
            {businessBenefits.map((benefit, i) => (
              <motion.div
                key={benefit.id}
                initial={{ opacity: 0, y: 30 }}
                animate={benefitsInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="rounded-3xl border border-border bg-card p-6 sm:p-8 text-center shadow-md"
              >
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  {iconMap[benefit.icon]}
                </div>
                <h3 className="mb-2 font-display text-lg sm:text-xl font-semibold text-foreground">{benefit.title}</h3>
                <p className="font-body text-sm leading-relaxed text-muted-foreground">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section ref={formRef} className="bg-secondary py-16 sm:py-24">
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={formInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-2xl"
          >
            <h2 className="mb-2 font-display text-2xl sm:text-3xl font-bold text-foreground">Bulk Order Inquiry</h2>
            <p className="mb-8 font-body text-muted-foreground">
              Fill in the form below and our business team will reach out within 48 hours.
            </p>
            <div className="rounded-3xl bg-card p-6 sm:p-8 shadow-lg">
              <BusinessForm />
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Business;
