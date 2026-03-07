/**
 * Buyer Dashboard — Customer Portal
 * DATA SOURCE: Live Supabase — orders table
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  RotateCcw,
  Crown,
  CalendarDays,
  Wallet,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { formatNaira, getStatusColor } from "@/lib/formatters";
import type { Tables } from "@/integrations/supabase/types";

type Order = Tables<"orders">;

// Timeline steps for order tracking
const trackingSteps = [
  { key: "pending", label: "Confirmed", icon: CheckCircle2 },
  { key: "processing", label: "Preparing", icon: Package },
  { key: "in-transit", label: "Out for Delivery", icon: Truck },
  { key: "delivered", label: "Delivered", icon: CheckCircle2 },
];

function getStepIndex(status: string): number {
  const map: Record<string, number> = {
    pending: 0,
    processing: 1,
    packaged: 1,
    "in-transit": 2,
    delivered: 3,
  };
  return map[status] ?? 0;
}

export default function BuyerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchOrders = async () => {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("buyer_id", user.id)
        .order("created_at", { ascending: false });
      if (data) setOrders(data);
      setLoading(false);
    };
    fetchOrders();

    // Realtime subscription for order status updates
    const channel = supabase
      .channel("buyer-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `buyer_id=eq.${user.id}` },
        () => { fetchOrders(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const activeOrders = orders.filter((o) => o.status !== "delivered");
  const deliveredOrders = orders.filter((o) => o.status === "delivered");
  const activeOrder = activeOrders[0];
  const currentStep = activeOrder ? getStepIndex(activeOrder.status) : 0;
  const totalSpent = orders.reduce((sum, o) => sum + Number(o.total_amount), 0);

  if (loading) return <p className="text-muted-foreground font-body p-8">Loading orders…</p>;

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
          My Orders
        </h1>
        <p className="text-muted-foreground font-body mt-1">
          Track your deliveries and view order history.
        </p>
      </div>

      {/* Active Order Tracking */}
      {activeOrder && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-card to-primary/[0.03]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-display">
                    Track Order — #{activeOrder.order_number}
                  </CardTitle>
                  <CardDescription className="font-body mt-1">
                    {formatNaira(Number(activeOrder.total_amount))}
                  </CardDescription>
                </div>
                <Badge className="bg-primary/10 text-primary font-body border-0">
                  <Truck className="h-3 w-3 mr-1" />
                  Live
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {/* Progress timeline */}
              <div className="relative flex items-center justify-between mt-2 mb-6">
                <div className="absolute top-5 left-0 right-0 h-0.5 bg-border" />
                <div
                  className="absolute top-5 left-0 h-0.5 bg-primary transition-all duration-500"
                  style={{ width: `${(currentStep / (trackingSteps.length - 1)) * 100}%` }}
                />
                {trackingSteps.map((step, i) => {
                  const isComplete = i <= currentStep;
                  const isCurrent = i === currentStep;
                  const StepIcon = step.icon;
                  return (
                    <div key={step.key} className="relative z-10 flex flex-col items-center">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                          isComplete
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card text-muted-foreground"
                        } ${isCurrent ? "ring-4 ring-primary/20" : ""}`}
                      >
                        <StepIcon className="h-4 w-4" />
                      </div>
                      <span
                        className={`mt-2 text-xs font-body ${
                          isComplete ? "text-foreground font-medium" : "text-muted-foreground"
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Order details */}
              <div className="flex flex-wrap gap-4 pt-4 border-t border-border/50">
                <div className="font-body text-sm">
                  <span className="text-muted-foreground">Items: </span>
                  <span className="text-foreground font-medium">
                    {Array.isArray(activeOrder.items) ? (activeOrder.items as any[]).length : 0} item(s)
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Order History — 2 cols */}
        <motion.div
          className="xl:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <Card className="border border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-display">Order History</CardTitle>
              <CardDescription className="font-body text-sm">
                Your past purchases and their statuses.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="font-body text-xs uppercase tracking-wider">Order</TableHead>
                      <TableHead className="font-body text-xs uppercase tracking-wider text-right">Total</TableHead>
                      <TableHead className="font-body text-xs uppercase tracking-wider text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders?.map((order) => (
                      <TableRow key={order.id} className="hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => navigate(`/orders/${order.id}`)}>
                        <TableCell className="font-medium font-body text-foreground">
                          #{order.order_number}
                        </TableCell>
                        <TableCell className="text-right font-body tabular-nums font-medium">
                          {formatNaira(Number(order.total_amount))}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className={`text-[10px] font-body ${getStatusColor(order.status as any)}`}>
                            {order.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {orders.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-muted-foreground font-body">
                          No orders yet. Start shopping!
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Spending Summary — 1 col */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <Card className="border border-border h-full bg-gradient-to-br from-card to-accent/[0.04]">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <Crown className="h-5 w-5 text-accent" />
                Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-3 pt-3 border-t border-border/50">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <CalendarDays className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-body">Total Orders</p>
                    <p className="text-sm font-medium font-body text-foreground">{orders.length}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Wallet className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-body">Total Spent</p>
                    <p className="text-sm font-medium font-body text-foreground">{formatNaira(totalSpent)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
