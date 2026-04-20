import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/hero/Hero";
import FeaturesSection from "@/components/products/FeaturesSection";
import FeaturedProducts from "@/components/products/BundleGrid";
import HowItWorks from "@/components/products/HowItWorks";
import ReviewCarousel from "@/components/products/ReviewCarousel";
import Pricing from "@/components/products/Pricing";
import HealthyBanner from "@/components/products/HealthyBanner";
import ToSellBanner from "@/components/layout/ToSellBanner";
import Footer from "@/components/layout/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <FeaturesSection />
      <FeaturedProducts />
      <HowItWorks />
      <ReviewCarousel />
      <Pricing />
      <HealthyBanner />
      <ToSellBanner />
      <Footer />
    </div>
  );
};

export default Index;
