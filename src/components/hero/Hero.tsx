import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";
import HomeSearchBar from "@/components/HomeSearchBar";

const Hero = () => {
  return (
    {/* COMPRESSED HEIGHT: Removed md:min-h-screen to achieve Tony's exact requested 15-20% height reduction */}
    <section className="relative overflow-hidden pt-24 pb-14 md:pt-28 md:pb-16">
      {/* Background image with overlay */}
      <div className="absolute inset-0">
        <img 
          src={heroBg} 
          alt="Fresh organic produce" 
          loading="eager" 
          decoding="async" 
          fetchPriority="high" 
          className="h-full w-full object-cover" 
        />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/90 via-foreground/70 to-foreground/40" />
        {/* Top gradient for navbar contrast */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent z-10" />
      </div>

      <div className="container relative mx-auto px-6 lg:px-12">
        {/* DESKTOP VIEW: 12-Column Grid splits the screen exactly as Tony illustrated */}
        <div className="grid gap-8 lg:grid-cols-12 items-center">
          
          {/* LEFT COLUMN (Span 7): Badge, Title, Subtitle, and shifted-up Buy button */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-7 max-w-2xl text-left"
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
            <p className="mb-6 max-w-md font-body text-lg leading-relaxed text-primary-foreground/70">
              Affordable and fast delivery. Direct from the farm to your door.
              Experience freshness like never before.
            </p>
            
            {/* TUCKED UPWARD: The Buy Now button sits snugly right beneath the description text */}
            <div className="pt-1">
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
            </div>
          </motion.div>

          {/* RIGHT COLUMN (Span 5): HomeSearchBar shifted perfectly to the right side */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="lg:col-span-5 w-full max-w-md mx-auto lg:mx-0 lg:ml-auto pt-6 lg:pt-0 z-20"
          >
            <HomeSearchBar />
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default Hero;
