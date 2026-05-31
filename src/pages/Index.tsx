import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { X, Smartphone, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Show guide if URL contains ?install=true
    if (searchParams.get("install") === "true") {
      setShowInstallGuide(true);
    }

    // Detect if iOS
    if (typeof window !== "undefined") {
      const userAgent = window.navigator.userAgent.toLowerCase();
      setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, [searchParams]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        console.log("User installed PWA");
      }
      setDeferredPrompt(null);
      setShowInstallGuide(false);
      
      // Clean query parameter
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("install");
      setSearchParams(newParams);
    }
  };

  const handleCloseGuide = () => {
    setShowInstallGuide(false);
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("install");
    setSearchParams(newParams);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 1. Top Navigation */}
      <Navbar />

      {/* 2. Hero Section */}
      <Hero />

      {/* 3. Core Value Features Strip */}
      <FeaturesSection />

      {/* 4. Live Storefront Feeds (Featured & Trending in slideable carousels) */}
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

      {/* 11. PWA Install Guide Bottom Card */}
      <AnimatePresence>
        {showInstallGuide && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:max-w-md z-50 rounded-2xl border border-primary/20 bg-card p-5 shadow-2xl font-body"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Smartphone size={20} />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-foreground">
                    Install CarlyFresh App
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Add to your home screen for the best mobile experience
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseGuide}
                className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-4 space-y-3 border-t border-border/60 pt-3">
              {deferredPrompt ? (
                <div>
                  <p className="text-xs text-muted-foreground mb-3 font-medium">
                    Install the application directly onto your mobile device with one click.
                  </p>
                  <button
                    onClick={handleInstallClick}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98]"
                  >
                    <Download size={16} />
                    Install App Now
                  </button>
                </div>
              ) : isIOS ? (
                <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
                  <p className="font-semibold text-foreground">Safari on iOS instructions:</p>
                  <ol className="list-decimal pl-4 space-y-1">
                    <li>Tap the <strong className="text-foreground">Share</strong> button at the bottom of Safari.</li>
                    <li>Scroll down and tap <strong className="text-foreground">Add to Home Screen</strong>.</li>
                    <li>Name it "CarlyFresh" and tap <strong className="text-foreground">Add</strong>.</li>
                  </ol>
                </div>
              ) : (
                <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
                  <p className="font-semibold text-foreground">Chrome on Android instructions:</p>
                  <ol className="list-decimal pl-4 space-y-1">
                    <li>Tap the <strong className="text-foreground">Menu</strong> button (three dots) in Chrome.</li>
                    <li>Select <strong className="text-foreground">Install app</strong> or <strong className="text-foreground">Add to Home Screen</strong>.</li>
                  </ol>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
