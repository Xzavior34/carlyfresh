import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/context/CartContext";
import ScrollToTop from "@/components/layout/ScrollToTop";
import Index from "./pages/Index";
import Shop from "./pages/Shop";
import Business from "./pages/Business";
import PricingPage from "./pages/PricingPage";
import Contact from "./pages/Contact";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import SellerDashboard from "./pages/dashboard/SellerDashboard";
import BuyerDashboard from "./pages/dashboard/BuyerDashboard";
import DriverDashboard from "./pages/dashboard/DriverDashboard";
import SellerOnboarding from "./pages/onboarding/SellerOnboarding";
import DriverOnboarding from "./pages/onboarding/DriverOnboarding";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <CartProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/business" element={<Business />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/about" element={<About />} />

            {/* Dashboard portals */}
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route path="seller" element={<SellerDashboard />} />
              <Route path="buyer" element={<BuyerDashboard />} />
              <Route path="driver" element={<DriverDashboard />} />
            </Route>

            {/* Onboarding flows (standalone, no dashboard layout) */}
            <Route path="/onboarding/seller" element={<SellerOnboarding />} />
            <Route path="/onboarding/driver" element={<DriverOnboarding />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </CartProvider>
  </QueryClientProvider>
);

export default App;
