import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import ScrollToTop from "@/components/layout/ScrollToTop";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Public pages
import Index from "./pages/Index";
import Shop from "./pages/Shop";
import Business from "./pages/Business";
import PricingPage from "./pages/PricingPage";
import Contact from "./pages/Contact";
import About from "./pages/About";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import OrderTracking from "./pages/customer/OrderTracking";
import VerifyEmail from "./pages/VerifyEmail";

// Customer pages
import Cart from "./pages/customer/Cart";
import Checkout from "./pages/customer/Checkout";
import CustomerOrders from "./pages/customer/CustomerOrders";
import CustomerProfile from "./pages/customer/CustomerProfile";

// Dashboard layouts
import AdminLayout from "./components/dashboard/AdminLayout";
import VendorLayout from "./components/dashboard/VendorLayout";
import DriverLayout from "./components/dashboard/DriverLayout";

// Admin pages
import AdminOverview from "./pages/admin/AdminOverview";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminDeliveries from "./pages/admin/AdminDeliveries";
import AdminSettings from "./pages/admin/AdminSettings";

// Vendor pages
import VendorOverview from "./pages/vendor/VendorOverview";
import VendorProducts from "./pages/vendor/VendorProducts";
import VendorOrders from "./pages/vendor/VendorOrders";
import VendorPayouts from "./pages/vendor/VendorPayouts";

// Driver pages
import DriverAvailable from "./pages/driver/DriverAvailable";
import DriverActive from "./pages/driver/DriverActive";
import DriverEarnings from "./pages/driver/DriverEarnings";

const queryClient = new QueryClient();

/** Route guard: redirects unauthenticated users to /login */
const ProtectedRoute = ({ children, requiredRole }: { children: React.ReactNode; requiredRole?: string }) => {
  const { user, role, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center font-body text-muted-foreground">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (requiredRole && role !== requiredRole) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

/** Redirect authenticated users away from auth pages */
const GuestRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, role, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center font-body text-muted-foreground">Loading…</div>;
  if (user) {
    if (role === "admin") return <Navigate to="/admin" replace />;
    if (role === "seller") return <Navigate to="/vendor" replace />;
    if (role === "driver") return <Navigate to="/driver" replace />;
    return <Navigate to="/" replace />;
  }
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
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/business" element={<Business />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/about" element={<About />} />
              <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
              <Route path="/signup" element={<GuestRoute><Signup /></GuestRoute>} />

              {/* Customer routes (authenticated buyers) */}
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
              <Route path="/orders" element={<ProtectedRoute><CustomerOrders /></ProtectedRoute>} />
              <Route path="/orders/:orderId" element={<ProtectedRoute><OrderTracking /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><CustomerProfile /></ProtectedRoute>} />

              {/* Admin routes */}
              <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminLayout /></ProtectedRoute>}>
                <Route index element={<AdminOverview />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="deliveries" element={<AdminDeliveries />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>

              {/* Vendor routes */}
              <Route path="/vendor" element={<ProtectedRoute requiredRole="seller"><VendorLayout /></ProtectedRoute>}>
                <Route index element={<VendorOverview />} />
                <Route path="products" element={<VendorProducts />} />
                <Route path="orders" element={<VendorOrders />} />
                <Route path="payouts" element={<VendorPayouts />} />
              </Route>

              {/* Driver routes */}
              <Route path="/driver" element={<ProtectedRoute requiredRole="driver"><DriverLayout /></ProtectedRoute>}>
                <Route index element={<DriverAvailable />} />
                <Route path="active" element={<DriverActive />} />
                <Route path="earnings" element={<DriverEarnings />} />
              </Route>

              {/* Legacy redirects */}
              <Route path="/dashboard/admin" element={<Navigate to="/admin" replace />} />
              <Route path="/dashboard/seller" element={<Navigate to="/vendor" replace />} />
              <Route path="/dashboard/driver" element={<Navigate to="/driver" replace />} />
              <Route path="/dashboard/buyer" element={<Navigate to="/orders" replace />} />
              <Route path="/dashboard/*" element={<Navigate to="/" replace />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
