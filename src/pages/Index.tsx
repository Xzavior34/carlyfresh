import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/hero/Hero";
import FeaturesSection from "@/components/products/FeaturesSection";
import StorefrontFeeds from "@/components/products/StorefrontFeeds";
import HowItWorks from "@/components/products/HowItWorks";
import ReviewCarousel from "@/components/products/ReviewCarousel";
import Pricing from "@/components/products/Pricing";
import HealthyBanner from "@/components/products/HealthyBanner";
import ToSellBanner from "@/components/layout/ToSellBanner";
import AppDownloadBanner from "@/components/layout/AppDownloadBanner";
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

      {/* 4. Live Storefront Feeds (Featured & Trending) */}
      <StorefrontFeeds />

      {/* 5. Process Flow */}
      <HowItWorks />

      {/* 6. Social Proof & Reviews */}
      <ReviewCarousel />

      {/* 7. Pricing Packages */}
      <Pricing />

      {/* 8. Promotional Banners */}
      <HealthyBanner />
      <ToSellBanner />

      {/* 9. Mobile App QR Scan Banner */}
      <AppDownloadBanner />

      {/* 10. Global Footer */}
      <Footer />
    </div>
  );
};

export default Index;
