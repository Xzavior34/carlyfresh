import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import ScrollToTop from "@/components/layout/ScrollToTop";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useEffect } from "react";
import OneSignal from "react-onesignal";
import { supabase } from "@/integrations/supabase/client";

// Public pages
import Index from "./pages/Index";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Business from "./pages/Business";
import PricingPage from "./pages/PricingPage";
import Contact from "./pages/Contact";
import About from "./pages/About";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Refund from "./pages/Refund";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import OrderAction from "./pages/OrderAction";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import UpdatePassword from "./pages/UpdatePassword";
import NotFound from "./pages/NotFound";
import OrderTracking from "./pages/customer/OrderTracking";

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
import AdminBaskets from "./pages/admin/AdminBaskets";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminDeliveries from "./pages/admin/AdminDeliveries";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminWithdrawals from "./pages/admin/AdminWithdrawals";
import AdminDriverWithdrawals from "./pages/admin/AdminDriverWithdrawals";
import AdminBlog from "./pages/admin/AdminBlog";

// Vendor pages
import VendorOverview from "./pages/vendor/VendorOverview";
import VendorProducts from "./pages/vendor/VendorProducts";
import VendorOrders from "./pages/vendor/VendorOrders";
import VendorReviews from "./pages/vendor/VendorReviews";
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
    return <Navigate to="/shop" replace />;
  }
  return <>{children}</>;
};

const OneSignalInitializer = () => {
  const { user, role } = useAuth();

  const getOneSignal = () => {
    if (typeof window !== "undefined" && (window as any).OneSignal) {
      return (window as any).OneSignal;
    }
    return OneSignal;
  };

  useEffect(() => {
    const initOneSignal = async () => {
      try {
        const os = getOneSignal();
        if (os && typeof os.init === "function") {
          await os.init({
            appId: "e6446b40-1453-4ccd-929d-d8ccb8c7ff91",
            allowLocalhostAsSecureOrigin: true,
          });
        }
      } catch (error) {
        console.warn("OneSignal bypassed:", error);
      }
    };
    initOneSignal();
  }, []);

  useEffect(() => {
    if (!user || !role) return;

    const allowedRoles = ["buyer", "seller", "driver"];
    if (!allowedRoles.includes(role)) return;

    let handleSubscriptionChange: ((event: any) => void) | null = null;

    const setupPush = async () => {
      try {
        const os = getOneSignal();
        if (!os) return;

        if (os.User && typeof os.User.addAlias === "function") {
          await os.User.addAlias("external_id", user.id);
        }

        if (os.Slidedown && typeof os.Slidedown.promptPush === "function") {
          await os.Slidedown.promptPush();
        } else if (
          os.Notifications &&
          typeof os.Notifications.requestPermission === "function"
        ) {
          await os.Notifications.requestPermission();
        }

        const syncToken = async () => {
          try {
            const token: string | null | undefined =
              os?.User?.PushSubscription?.id;
            if (token) {
              const { error } = await supabase
                .from("profiles")
                .update({ push_token: token })
                .eq("user_id", user.id);
              if (error) {
                console.error("Error saving push token to Supabase:", error);
              }
            }
          } catch (err) {
            console.warn("OneSignal token sync bypassed:", err);
          }
        };

        await syncToken();

        handleSubscriptionChange = (_event: any) => {
          syncToken();
        };

        if (
          os.User?.PushSubscription &&
          typeof os.User.PushSubscription.addEventListener === "function"
        ) {
          os.User.PushSubscription.addEventListener(
            "change",
            handleSubscriptionChange
          );
        }
      } catch (error) {
        console.warn("OneSignal bypassed:", error);
      }
    };

    setupPush();

    return () => {
      try {
        const os = getOneSignal();
        if (
          handleSubscriptionChange &&
          os?.User?.PushSubscription &&
          typeof os.User.PushSubscription.removeEventListener === "function"
        ) {
          os.User.PushSubscription.removeEventListener(
            "change",
            handleSubscriptionChange
          );
        }
      } catch (err) {
        console.warn("OneSignal cleanup bypassed:", err);
      }
    };
  }, [user, role]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <TooltipProvider>
          <ErrorBoundary>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <OneSignalInitializer />
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/shop/:productId" element={<ProductDetail />} />
              <Route path="/business" element={<Business />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/about" element={<About />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/refund" element={<Refund />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/order-action/:token" element={<OrderAction />} />
              
              {/* Auth Routes */}
              <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
              <Route path="/signup" element={<GuestRoute><Signup /></GuestRoute>} />
              <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
              <Route path="/update-password" element={<UpdatePassword />} />
              
              {/* Customer routes (authenticated buyers) */}
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
              <Route path="/orders" element={<ProtectedRoute><CustomerOrders /></ProtectedRoute>} />
              <Route path="/orders/:orderId" element={<ProtectedRoute><OrderTracking /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><CustomerProfile /></ProtectedRoute>} />

              {/* Admin routes (Cleaned of missing files) */}
              <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminLayout /></ProtectedRoute>}>
                <Route index element={<AdminOverview />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="baskets" element={<AdminBaskets />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="deliveries" element={<AdminDeliveries />} />
                <Route path="withdrawals" element={<AdminWithdrawals />} />
                <Route path="driver-withdrawals" element={<AdminDriverWithdrawals />} />
                <Route path="blog" element={<AdminBlog />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>

              {/* Vendor routes */}
              <Route path="/vendor" element={<ProtectedRoute requiredRole="seller"><VendorLayout /></ProtectedRoute>}>
                <Route index element={<VendorOverview />} />
                <Route path="products" element={<VendorProducts />} />
                <Route path="orders" element={<VendorOrders />} />
                <Route path="reviews" element={<VendorReviews />} />
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
          </ErrorBoundary>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
