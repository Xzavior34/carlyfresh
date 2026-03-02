import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import ScrollToTop from "@/components/layout/ScrollToTop";
import Index from "./pages/Index";
import Shop from "./pages/Shop";
import Business from "./pages/Business";
import PricingPage from "./pages/PricingPage";
import Contact from "./pages/Contact";
import About from "./pages/About";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import SellerDashboard from "./pages/dashboard/SellerDashboard";
import BuyerDashboard from "./pages/dashboard/BuyerDashboard";
import DriverDashboard from "./pages/dashboard/DriverDashboard";
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import SellerOnboarding from "./pages/onboarding/SellerOnboarding";
import DriverOnboarding from "./pages/onboarding/DriverOnboarding";

const queryClient = new QueryClient();

/** Route guard: redirects unauthenticated users to /login */
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center font-body text-muted-foreground">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

/** Redirect authenticated users away from auth pages */
const GuestRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, role, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center font-body text-muted-foreground">Loading…</div>;
  if (user) return <Navigate to={`/dashboard/${role || "buyer"}`} replace />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
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
              <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
              <Route path="/signup" element={<GuestRoute><Signup /></GuestRoute>} />

              {/* Dashboard portals — protected */}
              <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                <Route path="seller" element={<SellerDashboard />} />
                <Route path="buyer" element={<BuyerDashboard />} />
                <Route path="driver" element={<DriverDashboard />} />
                <Route path="admin" element={<AdminDashboard />} />
              </Route>

              {/* Onboarding flows (standalone, no dashboard layout) */}
              <Route path="/onboarding/seller" element={<SellerOnboarding />} />
              <Route path="/onboarding/driver" element={<DriverOnboarding />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
