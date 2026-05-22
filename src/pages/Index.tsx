import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/hero/Hero";
import FeaturesSection from "@/components/products/FeaturesSection";
import HowItWorks from "@/components/products/HowItWorks";
import ReviewCarousel from "@/components/products/ReviewCarousel";
import Pricing from "@/components/products/Pricing";
import HealthyBanner from "@/components/products/HealthyBanner";
import ToSellBanner from "@/components/layout/ToSellBanner";
import Footer from "@/components/layout/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* 1. Top Navigation */}
      <Navbar />

      {/* 2. Hero Section */}
      <Hero />

      {/* 3. Core Value Features Strip */}
      <FeaturesSection />

      {/* 4. Process Flow */}
      <HowItWorks />

      {/* 5. Social Proof & Reviews */}
      <ReviewCarousel />

      {/* 6. Pricing Packages */}
      <Pricing />

      {/* 7. Promotional Banners */}
      <HealthyBanner />
      <ToSellBanner />

      {/* 8. Global Footer */}
      <Footer />
    </div>
  );
};

export default Index;
