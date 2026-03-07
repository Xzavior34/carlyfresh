import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const HealthyBanner = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-12 md:py-24 lg:py-32">
      <div className="container mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="rounded-3xl bg-primary p-12 text-center md:p-20"
        >
          <h2 className="mb-4 font-display text-4xl font-bold text-primary-foreground md:text-5xl">
            Join To Eat Healthy
          </h2>
          <p className="mx-auto mb-8 max-w-lg font-body text-primary-foreground/70">
            Subscribe to a plan and get farm-fresh produce delivered to your doorstep every week.
          </p>
          <Link to="/pricing">
            <motion.span
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-8 py-4 font-body text-sm font-semibold text-accent-foreground shadow-lg transition-shadow hover:shadow-xl"
            >
              Subscribe Now
              <ArrowRight size={18} />
            </motion.span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default HealthyBanner;
