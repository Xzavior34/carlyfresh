/**
 * Order Tracking Page — Real-time order status updates
 * Milestones: pending → confirmed → preparing → driver_assigned → in-transit → delivered
 * Includes: Driver profile card, delivery_jobs joined with profiles
 */

import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Package,
  Truck,
  Clock,
  ArrowLeft,
  ShoppingBag,
  Loader2,
  Share2,
  User,
  MapPin,
  Star,
  Navigation,
  UserCheck,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { formatNaira, getStatusColor } from "@/lib/formatters";
import type { Tables } from "@/integrations/supabase/types";

type Order = Tables<"orders">;
type DeliveryJob = Tables<"delivery_jobs">;
type Profile = Tables<"profiles">;

interface DeliveryInfo {
  job: DeliveryJob;
  driver: Profile | null;
  driverLocation: { latitude: number; longitude: number; updated_at: string } | null;
}

// ─── Tracking steps with the full canonical pipeline ────────────────────────
const trackingSteps = [
  {
    key: "pending",
    label: "Order Placed",
    desc: "Your order has been received",
    icon: ShoppingBag,
  },
  {
    key: "confirmed",
    label: "Order Confirmed",
    desc: "Payment confirmed, awaiting vendor",
    icon: CheckCircle2,
  },
  {
    key: "preparing",
    label: "Preparing",
    desc: "Vendor is preparing your order",
    icon: Package,
  },
  {
    key: "driver_assigned",
    label: "Driver Assigned",
    desc: "A driver has picked up your order",
    icon: UserCheck,
  },
  {
    key: "in-transit",
    label: "Out for Delivery",
    desc: "Driver is on the way to you",
    icon: Truck,
  },
  {
    key: "delivered",
    label: "Delivered",
    desc: "Order has been delivered!",
    icon: CheckCircle2,
  },
];

function getStepIndex(status: string): number {
  const map: Record<string, number> = {
    pending: 0,
    confirmed: 1,
    processing: 1, // legacy mapping
    preparing: 2,
    packaged: 2,   // legacy mapping
    driver_assigned: 3,
    "in-transit": 4,
    delivered: 5,
  };
  return map[status] ?? 0;
}

// ─── Driver Card ──────────────────────────────────────────────────────────────
function DriverCard({ info }: { info: DeliveryInfo }) {
  const { driver, driverLocation } = info;

  if (!driver) {
    return (
      <Card className="border border-border">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 animate-pulse">
            <Truck className="h-6 w-6 text-primary/50" />
          </div>
          <div>
            <p className="font-body text-sm font-semibold text-foreground">Searching for nearby drivers…</p>
            <p className="font-body text-xs text-muted-foreground mt-0.5">
              A driver will be assigned shortly
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const lastSeen = driverLocation?.updated_at
    ? new Date(driverLocation.updated_at).toLocaleTimeString("en-NG", { timeStyle: "short" })
    : null;

  return (
    <Card className="border border-border bg-gradient-to-br from-background to-primary/3">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-display flex items-center gap-2">
          <Truck className="h-4 w-4 text-primary" />
          Your Driver
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Driver profile row */}
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center shrink-0">
            <User className="h-7 w-7 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-foreground text-base leading-snug truncate">
              {driver.full_name || "Driver"}
            </p>
            {driver.phone && (
              <p className="font-body text-xs text-muted-foreground mt-0.5">{driver.phone}</p>
            )}
            <div className="flex items-center gap-1 mt-1">
              <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
              <span className="font-body text-xs text-muted-foreground">
                {driver.driver_rating?.toFixed(1) || "N/A"} rating
              </span>
            </div>
          </div>
          <Badge variant="secondary" className="font-body text-[10px] bg-emerald-100 text-emerald-800 shrink-0">
            Active
          </Badge>
        </div>

        {/* Vehicle info */}
        {driver.vehicle_info && (
          <div className="flex items-center gap-2 text-sm font-body text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
            <Truck className="h-4 w-4 text-primary shrink-0" />
            <span>{driver.vehicle_info}</span>
          </div>
        )}

        {/* Real-time location */}
        {driverLocation ? (
          <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                </span>
                <p className="font-body text-xs font-semibold text-foreground">Live Location</p>
              </div>
              {lastSeen && (
                <p className="font-body text-[10px] text-muted-foreground">Updated {lastSeen}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-1.5">
                <Navigation className="h-3 w-3 text-muted-foreground" />
                <span className="font-body text-xs text-muted-foreground tabular-nums">
                  {driverLocation.latitude.toFixed(5)}°N
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3 w-3 text-muted-foreground" />
                <span className="font-body text-xs text-muted-foreground tabular-nums">
                  {driverLocation.longitude.toFixed(5)}°E
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs font-body text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            <span>Location tracking not available</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Searching for Driver Indicator ──────────────────────────────────────────
function SearchingDriverCard() {
  return (
    <Card className="border border-dashed border-primary/30 bg-primary/3">
      <CardContent className="p-5">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full border-2 border-primary/30 border-dashed flex items-center justify-center shrink-0">
            <Loader2 className="h-5 w-5 text-primary animate-spin" />
          </div>
          <div>
            <p className="font-body text-sm font-semibold text-foreground">
              Searching for nearby drivers…
            </p>
            <p className="font-body text-xs text-muted-foreground mt-0.5">
              This usually takes 2–5 minutes
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function OrderTracking() {
  const { orderId } = useParams<{ orderId: string }>();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo | null>(null);
  const [deliveryLoading, setDeliveryLoading] = useState(false);

  const fetchDeliveryInfo = async (currentOrder: Order) => {
    if (!currentOrder) return;
    setDeliveryLoading(true);

    // Fetch delivery job for this order
    const { data: jobData } = await supabase
      .from("delivery_jobs")
      .select("*")
      .eq("order_id", currentOrder.id)
      .maybeSingle();

    if (!jobData) {
      setDeliveryInfo(null);
      setDeliveryLoading(false);
      return;
    }

    // Fetch driver profile if assigned
    let driver: Profile | null = null;
    let driverLocation: { latitude: number; longitude: number; updated_at: string } | null = null;

    if (jobData.driver_id) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", jobData.driver_id)
        .maybeSingle();
      driver = profileData ?? null;

      // Fetch latest driver location
      const { data: locData } = await supabase
        .from("driver_locations")
        .select("latitude, longitude, updated_at")
        .eq("driver_id", jobData.driver_id)
        .maybeSingle();
      driverLocation = locData ?? null;
    }

    setDeliveryInfo({ job: jobData, driver, driverLocation });
    setDeliveryLoading(false);
  };

  useEffect(() => {
    if (!user || !orderId) return;

    const fetchOrder = async () => {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .eq("buyer_id", user.id)
        .maybeSingle();
      if (data) {
        setOrder(data);
        fetchDeliveryInfo(data);
      }
      setLoading(false);
    };
    fetchOrder();

    // Real-time: order status changes
    const orderChannel = supabase
      .channel(`order-track-${orderId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${orderId}` },
        (payload) => {
          const updated = payload.new as Order;
          setOrder(updated);
          fetchDeliveryInfo(updated);
        }
      )
      .subscribe();

    // Real-time: delivery job changes
    const deliveryChannel = supabase
      .channel(`delivery-track-${orderId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "delivery_jobs", filter: `order_id=eq.${orderId}` },
        () => {
          if (order) fetchDeliveryInfo(order);
          else fetchOrder();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(orderChannel);
      supabase.removeChannel(deliveryChannel);
    };
  }, [user, orderId]);

  const currentStep = order ? getStepIndex(order.status) : 0;

  // Determine when to show driver-related UI
  const showDriverSearch =
    order &&
    ["confirmed", "preparing", "driver_assigned", "in-transit"].includes(order.status) &&
    !deliveryLoading;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="pt-28 pb-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12 max-w-2xl">
          <Link
            to="/orders"
            className="inline-flex items-center gap-2 text-sm font-body text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Orders
          </Link>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !order ? (
            <Card className="border border-border">
              <CardContent className="py-16 text-center">
                <ShoppingBag className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
                <p className="font-body text-muted-foreground">Order not found.</p>
              </CardContent>
            </Card>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              {/* Order Header */}
              <Card className="border-2 border-primary/20">
                <CardHeader>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle className="text-xl font-display">
                      Order #{order.order_number}
                    </CardTitle>
                    <Badge className={`font-body text-xs ${getStatusColor(order.status)}`}>
                      {order.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="font-body gap-2 text-xs w-fit"
                    onClick={() => {
                      const msg = encodeURIComponent(
                        `Track my CarlyFresh grocery order #${order.order_number} here: ${window.location.href}`
                      );
                      window.open(`https://wa.me/?text=${msg}`, "_blank");
                    }}
                  >
                    <Share2 className="h-3.5 w-3.5" /> Share via WhatsApp
                  </Button>
                  <p className="font-body text-sm text-muted-foreground">
                    Placed on{" "}
                    {new Date(order.created_at).toLocaleDateString("en-NG", { dateStyle: "long" })}
                  </p>
                </CardHeader>
              </Card>

              {/* Vertical Timeline */}
              <Card className="border border-border">
                <CardHeader>
                  <CardTitle className="text-lg font-display">Delivery Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-0">
                    {trackingSteps.map((step, i) => {
                      const isComplete = i <= currentStep;
                      const isCurrent = i === currentStep;
                      const StepIcon = step.icon;
                      const isLast = i === trackingSteps.length - 1;

                      return (
                        <div key={step.key} className="flex gap-4">
                          {/* Icon + connector line */}
                          <div className="flex flex-col items-center">
                            <motion.div
                              initial={false}
                              animate={{
                                scale: isCurrent ? 1.15 : 1,
                                backgroundColor: isComplete
                                  ? "hsl(var(--primary))"
                                  : "hsl(var(--muted))",
                              }}
                              transition={{ duration: 0.3 }}
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                                isComplete
                                  ? "text-primary-foreground"
                                  : "text-muted-foreground"
                              } ${isCurrent ? "ring-4 ring-primary/20" : ""}`}
                            >
                              <StepIcon className="h-4 w-4" />
                            </motion.div>
                            {!isLast && (
                              <motion.div
                                initial={false}
                                animate={{
                                  backgroundColor:
                                    i < currentStep
                                      ? "hsl(var(--primary))"
                                      : "hsl(var(--border))",
                                }}
                                transition={{ duration: 0.5, delay: 0.1 }}
                                className="w-0.5 h-10"
                              />
                            )}
                          </div>

                          {/* Text */}
                          <div className={`pb-0 pt-1 ${!isLast ? "pb-4" : ""}`}>
                            <p
                              className={`font-body text-sm font-semibold ${
                                isComplete ? "text-foreground" : "text-muted-foreground"
                              }`}
                            >
                              {step.label}
                            </p>
                            <p className="font-body text-xs text-muted-foreground mt-0.5">
                              {step.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Driver / Delivery Card */}
              {deliveryLoading ? (
                <Card className="border border-border">
                  <CardContent className="p-5 flex items-center gap-3">
                    <Loader2 className="h-5 w-5 text-primary animate-spin" />
                    <p className="font-body text-sm text-muted-foreground">Loading driver info…</p>
                  </CardContent>
                </Card>
              ) : deliveryInfo ? (
                <DriverCard info={deliveryInfo} />
              ) : showDriverSearch ? (
                <SearchingDriverCard />
              ) : null}

              {/* Order Items */}
              <Card className="border border-border">
                <CardHeader>
                  <CardTitle className="text-lg font-display">Items</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Array.isArray(order.items)
                    ? (order.items as any[]).map((item: any, i: number) => (
                        <div
                          key={i}
                          className="flex items-center justify-between font-body text-sm"
                        >
                          <span className="text-foreground">
                            {item?.name || "Item"} ({item?.quantity || 1}{" "}
                            {item?.unit || "piece"})
                          </span>
                          <span className="font-medium tabular-nums">
                            {formatNaira((item?.price || 0) * (item?.quantity || 1))}
                          </span>
                        </div>
                      ))
                    : null}
                  <div className="pt-3 border-t border-border flex items-center justify-between">
                    <span className="font-display font-bold text-foreground">Total</span>
                    <span className="font-display text-xl font-bold text-primary">
                      {formatNaira(Number(order.total_amount))}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}
