import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";
import abstractArt from "@/assets/abstract-art.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen overflow-hidden">
      {/* Background image with overlay */}
      <div className="absolute inset-0">
        <img src={heroBg} alt="Fresh organic produce" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/90 via-foreground/70 to-foreground/40" />
        {/* Top gradient for navbar contrast */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent z-10" />
      </div>

      <div className="container relative mx-auto flex min-h-screen items-center px-6 lg:px-12">
        <div className="grid w-full items-center gap-12 lg:grid-cols-2">
          {/* Text */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-xl pt-20 lg:pt-0"
          >
            <span className="mb-4 inline-block rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 font-body text-xs font-semibold uppercase tracking-widest text-accent">
              Farm to Table
            </span>
            <h1 className="mb-6 font-display text-5xl font-bold leading-tight tracking-tight text-primary-foreground md:text-7xl">
              Fresh Food
              <br />
              <span className="italic">At Your</span>
              <br />
              Finger Tips.
            </h1>
            <p className="mb-8 max-w-md font-body text-lg leading-relaxed text-primary-foreground/70">
              Affordable and fast delivery. Direct from the farm to your door.
              Experience freshness like never before.
            </p>
            <Link to="/shop">
              <motion.span
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 rounded-full bg-accent px-8 py-4 font-body text-sm font-semibold text-accent-foreground shadow-lg transition-shadow hover:shadow-xl"
              >
                Buy Now
                <ArrowRight size={18} />
              </motion.span>
            </Link>
          </motion.div>

          {/* Abstract art */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="hidden lg:flex lg:justify-end"
          >
            <div className="relative">
              <div className="h-[500px] w-[420px] overflow-hidden rounded-3xl shadow-2xl">
                <img
                  src={abstractArt}
                  alt="Abstract geometric art"
                  className="h-full w-full object-cover"
                />
              </div>
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-6 -left-10 rounded-2xl bg-card p-5 shadow-xl"
              >
                <p className="font-display text-sm font-semibold text-foreground">🥬 100% Organic</p>
                <p className="font-body text-xs text-muted-foreground">Certified Fresh</p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
