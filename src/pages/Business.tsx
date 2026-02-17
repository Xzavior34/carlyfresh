// NOTE: Business inquiry form is simulated.
// TODO: Connect to Backend API for processing bulk orders.

import { motion } from "framer-motion";
import { TrendingDown, UserCheck, CalendarClock } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BusinessForm from "@/components/forms/BusinessForm";
import { businessBenefits } from "@/data/mockData";

const iconMap: Record<string, React.ReactNode> = {
  TrendingDown: <TrendingDown size={28} />,
  UserCheck: <UserCheck size={28} />,
  CalendarClock: <CalendarClock size={28} />,
};

const Business = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
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
            <h1 className="font-display text-4xl font-bold text-primary-foreground md:text-5xl">
              Wholesale Prices for Restaurants, Hotels & Caterers
            </h1>
            <p className="mt-4 font-body text-lg text-primary-foreground/70">
              Partner with CarlyFresh for reliable, farm-fresh supply at scale.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid gap-8 md:grid-cols-3">
            {businessBenefits.map((benefit, i) => (
              <motion.div
                key={benefit.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="rounded-3xl border border-border bg-card p-8 text-center shadow-md"
              >
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  {iconMap[benefit.icon]}
                </div>
                <h3 className="mb-2 font-display text-xl font-semibold text-foreground">{benefit.title}</h3>
                <p className="font-body text-sm leading-relaxed text-muted-foreground">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Inquiry Form */}
      <section className="bg-secondary py-24">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="mx-auto max-w-2xl">
            <h2 className="mb-2 font-display text-3xl font-bold text-foreground">Bulk Order Inquiry</h2>
            <p className="mb-8 font-body text-muted-foreground">
              Fill in the form below and our business team will reach out within 48 hours.
            </p>
            <div className="rounded-3xl bg-card p-8 shadow-lg">
              <BusinessForm />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Business;
