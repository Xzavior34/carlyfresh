// NOTE: All content is mocked for demo purposes.
// TODO: Connect to CMS or Backend for dynamic content.

import { motion } from "framer-motion";
import { Heart, Users, Truck, Sprout } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const stats = [
  { label: "Local Farms Partnered", value: "150+", icon: Sprout },
  { label: "Deliveries Completed", value: "50,000+", icon: Truck },
  { label: "Happy Customers", value: "12,000+", icon: Heart },
  { label: "Team Members", value: "45", icon: Users },
];

const About = () => {
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
              Our Story
            </span>
            <h1 className="font-display text-4xl font-bold text-primary-foreground md:text-5xl">
              About CarlyFresh
            </h1>
            <p className="mt-4 font-body text-lg text-primary-foreground/70">
              Bridging the gap between farmers and families since 2022.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-24">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="mx-auto max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="mb-6 font-display text-3xl font-bold text-foreground">Our Mission</h2>
              <div className="space-y-4 font-body text-base leading-relaxed text-foreground/80">
                <p>
                  Food is essential to life, yet the journey from farm to table is broken. Farmers struggle 
                  to reach buyers, while consumers settle for stale produce from long supply chains.
                </p>
                <p>
                  CarlyFresh was born to fix this. We connect local farmers directly to households, restaurants, 
                  and businesses — cutting out the middlemen and delivering food at peak freshness.
                </p>
                <p>
                  Our platform ensures fair pricing for farmers and affordable, fresh food for everyone. 
                  We believe transparency in food sourcing isn't a luxury — it's a right.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-secondary py-24">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="text-center"
              >
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <stat.icon size={26} />
                </div>
                <p className="font-display text-3xl font-bold text-foreground">{stat.value}</p>
                <p className="mt-1 font-body text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-6 font-display text-3xl font-bold text-foreground">Our Values</h2>
            <div className="grid gap-8 sm:grid-cols-3">
              {[
                { title: "Transparency", desc: "Every product traced from farm to fork." },
                { title: "Freshness", desc: "Harvested today, delivered tomorrow." },
                { title: "Community", desc: "Supporting local farmers and families." },
              ].map((v, i) => (
                <motion.div
                  key={v.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <h3 className="mb-2 font-display text-lg font-semibold text-foreground">{v.title}</h3>
                  <p className="font-body text-sm text-muted-foreground">{v.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
