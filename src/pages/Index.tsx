import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/hero/Hero";
import BundleGrid from "@/components/products/BundleGrid";
import HowItWorks from "@/components/products/HowItWorks";
import Pricing from "@/components/products/Pricing";
import ToSellBanner from "@/components/layout/ToSellBanner";
import Footer from "@/components/layout/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <BundleGrid />
      <HowItWorks />
      <Pricing />
      <ToSellBanner />
      <Footer />
    </div>
  );
};

export default Index;
