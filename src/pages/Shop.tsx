// NOTE: Product data is mocked locally.
// TODO: Connect to Supabase Backend for real product catalog.

import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductGrid from "@/components/products/ProductGrid";

const Shop = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="pt-28 pb-24">
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <span className="mb-2 block font-body text-xs font-semibold uppercase tracking-widest text-accent">
              Marketplace
            </span>
            <h1 className="font-display text-4xl font-bold text-foreground md:text-5xl">
              Fresh Produce
            </h1>
            <p className="mt-3 max-w-lg font-body text-muted-foreground">
              Browse our full catalog of farm-fresh vegetables, fruits, curated bundles, and premium oils.
            </p>
          </motion.div>
          <ProductGrid />
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Shop;
