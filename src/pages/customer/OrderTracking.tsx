/**
 * Order Tracking Page — Real-time order status updates
 * Shows pending → processing → packaged → in-transit → delivered
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

const trackingSteps = [
  { key: "pending", label: "Order Confirmed", desc: "Your order has been placed", icon: CheckCircle2 },
  { key: "processing", label: "Preparing", desc: "Vendor is preparing your order", icon: Clock },
  { key: "packaged", label: "Packaged", desc: "Your order is ready for pickup", icon: Package },
  { key: "in-transit", label: "Out for Delivery", desc: "Driver is on the way", icon: Truck },
  { key: "delivered", label: "Delivered", desc: "Order has been delivered!", icon: CheckCircle2 },
];

function getStepIndex(status: string): number {
  const map: Record<string, number> = {
    pending: 0,
    processing: 1,
    packaged: 2,
    "in-transit": 3,
    delivered: 4,
  };
  return map[status] ?? 0;
}

export default function OrderTracking() {
  const { orderId } = useParams<{ orderId: string }>();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !orderId) return;

    const fetchOrder = async () => {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .eq("buyer_id", user.id)
        .maybeSingle();
      if (data) setOrder(data);
      setLoading(false);
    };
    fetchOrder();

    // Real-time subscription for this specific order
    const channel = supabase
      .channel(`order-track-${orderId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${orderId}` },
        (payload) => {
          setOrder(payload.new as Order);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, orderId]);

  const currentStep = order ? getStepIndex(order.status) : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="pt-28 pb-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12 max-w-2xl">
          <Link to="/orders" className="inline-flex items-center gap-2 text-sm font-body text-muted-foreground hover:text-foreground mb-6">
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
                      {order.status}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="font-body gap-2 text-xs"
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
                    Placed on {new Date(order.created_at).toLocaleDateString("en-NG", { dateStyle: "long" })}
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
                          {/* Icon + line */}
                          <div className="flex flex-col items-center">
                            <motion.div
                              initial={false}
                              animate={{
                                scale: isCurrent ? 1.15 : 1,
                                backgroundColor: isComplete ? "hsl(var(--primary))" : "hsl(var(--muted))",
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
                              <div
                                className={`w-0.5 h-10 transition-colors duration-500 ${
                                  i < currentStep ? "bg-primary" : "bg-border"
                                }`}
                              />
                            )}
                          </div>

                          {/* Text */}
                          <div className={`pb-8 ${isLast ? "pb-0" : ""}`}>
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

              {/* Order Items */}
              <Card className="border border-border">
                <CardHeader>
                  <CardTitle className="text-lg font-display">Items</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Array.isArray(order.items) ? (order.items as any[]).map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between font-body text-sm">
                      <span className="text-foreground">
                        {item?.name || "Item"} × {item?.quantity || 1}
                      </span>
                      <span className="font-medium tabular-nums">
                        {formatNaira((item?.price || 0) * (item?.quantity || 1))}
                      </span>
                    </div>
                  )) : null}
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
