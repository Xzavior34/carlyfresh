import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Sprout } from "lucide-react";

const ToSellBanner = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="tosell" ref={ref} className="bg-primary py-20 lg:py-24">
      <div className="container mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center gap-6 text-center md:flex-row md:justify-between md:text-left"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-foreground/10">
              <Sprout size={28} className="text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-display text-2xl font-bold text-primary-foreground md:text-3xl">
                Are you a farmer?
              </h3>
              <p className="mt-1 font-body text-primary-foreground/70">
                Join our network and reach thousands of customers.
              </p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="rounded-full bg-accent px-8 py-3.5 font-body text-sm font-semibold text-accent-foreground shadow-lg transition-shadow hover:shadow-xl"
          >
            Partner With Us
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};

export default ToSellBanner;
