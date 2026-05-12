import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/hero/Hero";
import FeaturesSection from "@/components/products/FeaturesSection";
import StorefrontFeeds from "@/components/products/StorefrontFeeds";
import RecommendedCarousel from "@/components/products/RecommendedCarousel";
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

      {/* 2. Overhauled Hero Section (Search right, button tucked up, profile height compressed) */}
      <Hero />

      {/* 3. Core Value Features Strip */}
      <FeaturesSection />

      {/* 4. Live Dynamic CMS Storefront Feeds (Renders Tony's Featured items, Combo Bundles, and Loved products instantly) */}
      <StorefrontFeeds />

      {/* 5. Smart AI Customization Engine (Analyzes user history for personalized recommendations) */}
      <RecommendedCarousel />

      {/* 6. Process Flow */}
      <HowItWorks />

      {/* 7. Social Proof & Reviews */}
      <ReviewCarousel />

      {/* 8. Pricing Packages */}
      <Pricing />

      {/* 9. Promotional Banners */}
      <HealthyBanner />
      <ToSellBanner />

      {/* 10. Global Footer */}
      <Footer />
    </div>
  );
};

export default Index;
