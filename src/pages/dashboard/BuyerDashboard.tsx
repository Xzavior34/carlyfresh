/**
 * Buyer Dashboard — Customer Portal
 * DATA SOURCE: Currently using mock data for UI approval. Awaiting DB connection.
 * TODO: Connect to Supabase tables: orders, subscriptions, order_history
 */

import { useRef } from "react";
import { motion } from "framer-motion";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  buyerActiveOrders,
  buyerOrderHistory,
  buyerSubscription,
  formatNaira,
  getStatusColor,
} from "@/lib/mockDashboardData";

// Timeline steps for order tracking
const trackingSteps = [
  { key: "confirmed", label: "Confirmed", icon: CheckCircle2 },
  { key: "preparing", label: "Preparing", icon: Package },
  { key: "out-for-delivery", label: "Out for Delivery", icon: Truck },
  { key: "delivered", label: "Delivered", icon: CheckCircle2 },
];

function getStepIndex(status: string): number {
  const map: Record<string, number> = {
    confirmed: 0,
    preparing: 1,
    "out-for-delivery": 2,
    delivered: 3,
  };
  return map[status] ?? 0;
}

export default function BuyerDashboard() {
  const activeOrder = buyerActiveOrders[0];
  const currentStep = activeOrder ? getStepIndex(activeOrder.status) : 0;

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
          My Orders
        </h1>
        <p className="text-muted-foreground font-body mt-1">
          Track your deliveries and manage your subscription.
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
                    Track Order — {activeOrder.id}
                  </CardTitle>
                  <CardDescription className="font-body mt-1">
                    {activeOrder.vendorName} · Arriving in {activeOrder.estimatedArrival}
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
                {/* Background line */}
                <div className="absolute top-5 left-0 right-0 h-0.5 bg-border" />
                {/* Progress line */}
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
                  <span className="text-foreground font-medium">{activeOrder.items.join(", ")}</span>
                </div>
                {activeOrder.driverName && (
                  <div className="font-body text-sm">
                    <span className="text-muted-foreground">Driver: </span>
                    <span className="text-foreground font-medium">{activeOrder.driverName}</span>
                  </div>
                )}
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
                {/* TODO: Fetch from orders table filtered by buyer_id */}
                Your past purchases and quick reorder options.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="font-body text-xs uppercase tracking-wider">Order</TableHead>
                      <TableHead className="font-body text-xs uppercase tracking-wider">Items</TableHead>
                      <TableHead className="font-body text-xs uppercase tracking-wider text-right">Total</TableHead>
                      <TableHead className="font-body text-xs uppercase tracking-wider text-center">Status</TableHead>
                      <TableHead className="font-body text-xs uppercase tracking-wider text-center">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {buyerOrderHistory.map((order) => (
                      <TableRow key={order.id} className="hover:bg-muted/20 transition-colors">
                        <TableCell className="font-medium font-body text-foreground">
                          {order.id}
                        </TableCell>
                        <TableCell className="font-body text-sm text-muted-foreground max-w-[200px] truncate">
                          {order.items.join(", ")}
                        </TableCell>
                        <TableCell className="text-right font-body tabular-nums font-medium">
                          {formatNaira(order.total)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className={`text-[10px] font-body ${getStatusColor(order.status)}`}>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs font-body gap-1"
                          >
                            <RotateCcw className="h-3 w-3" />
                            Reorder
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Subscription Card — 1 col */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <Card className="border border-border h-full bg-gradient-to-br from-card to-accent/[0.04]">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <Crown className="h-5 w-5 text-accent" />
                Subscription
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Plan name & status */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-display text-xl font-bold text-foreground">
                    {buyerSubscription.plan}
                  </p>
                  <p className="font-body text-sm text-muted-foreground mt-0.5">
                    ₦29,900/mo
                  </p>
                </div>
                <Badge className="bg-primary/10 text-primary border-0 font-body text-xs capitalize">
                  {buyerSubscription.status}
                </Badge>
              </div>

              <div className="space-y-3 pt-3 border-t border-border/50">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <CalendarDays className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-body">Next Delivery</p>
                    <p className="text-sm font-medium font-body text-foreground">{buyerSubscription.nextDelivery}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Wallet className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-body">Monthly Spend</p>
                    <p className="text-sm font-medium font-body text-foreground">{formatNaira(buyerSubscription.monthlySpend)}</p>
                  </div>
                </div>
              </div>

              <Button className="w-full mt-2 font-body" variant="outline" size="sm">
                Manage Subscription
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
