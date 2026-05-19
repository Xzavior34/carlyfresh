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
  ShoppingBag,
  Sparkles,
  Plus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { formatNaira, getStatusColor } from "@/lib/formatters";
import type { Tables } from "@/integrations/supabase/types";
import { DashboardSkeleton } from "@/components/ui/DashboardSkeleton";
import LeaveReviewModal from "@/components/products/LeaveReviewModal";
import ProductCard from "@/components/products/ProductCard";
import { toast } from "@/hooks/use-toast";

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
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [curatedBaskets, setCuratedBaskets] = useState<any[]>([]);

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

  useEffect(() => {
    const fetchFeatures = async () => {
      try {
        const [prodRes, basketRes] = await Promise.all([
          supabase
            .from("products")
            .select("*")
            .eq("is_featured", true)
            .eq("in_stock", true)
            .limit(8),
          supabase
            .from("baskets" as any)
            .select("*, basket_items(*, product:products(*))")
            .limit(6),
        ]);

        if (prodRes.data) setFeaturedProducts(prodRes.data);
        if (basketRes.data) setCuratedBaskets(basketRes.data);
      } catch (err) {
        console.error("Error fetching homepage features:", err);
      }
    };
    fetchFeatures();
  }, []);

  const handleAddBasketToCart = (basket: any) => {
    const firstProductVendorId = basket.basket_items?.[0]?.product?.vendor_id || user?.id;

    addItem(
      basket.id,
      `${basket.name} (Basket)`,
      Number(basket.price),
      firstProductVendorId,
      "basket",
      Number(basket.price),
      null,
      null
    );
    toast({
      title: "Basket added to cart!",
      description: `${basket.name} combo pack is now in your cart.`,
    });
  };

  const activeOrders = orders.filter((o) => o.status !== "delivered");
  const deliveredOrders = orders.filter((o) => o.status === "delivered");
  const activeOrder = activeOrders[0];
  const currentStep = activeOrder ? getStepIndex(activeOrder.status) : 0;
  const totalSpent = orders.reduce((sum, o) => sum + Number(o.total_amount), 0);

  if (loading) return <DashboardSkeleton />;

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

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <h2 className="text-xl font-display font-bold text-foreground">🌟 Featured Products</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}

      {/* Curated Baskets */}
      {curatedBaskets.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-display font-bold text-foreground">🧺 Curated Baskets</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {curatedBaskets.map((basket) => (
              <Card key={basket.id} className="overflow-hidden border border-border group flex flex-col justify-between hover:shadow-lg transition-all duration-300">
                <div>
                  <div className="h-44 w-full overflow-hidden bg-muted relative">
                    {basket.image ? (
                      <img
                        src={basket.image}
                        alt={basket.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                        <ShoppingBag className="h-10 w-10 stroke-[1.2]" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3 bg-background/80 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-semibold text-foreground font-body shadow-sm">
                      {basket.basket_items?.length || 0} items
                    </div>
                  </div>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start gap-2">
                      <CardTitle className="text-base font-display font-bold group-hover:text-primary transition-colors">
                        {basket.name}
                      </CardTitle>
                      <span className="font-body font-bold text-base text-primary tabular-nums">
                        {formatNaira(basket.price)}
                      </span>
                    </div>
                    <CardDescription className="font-body text-xs line-clamp-2 mt-1">
                      {basket.description || "No description provided for this combo pack."}
                    </CardDescription>
                    
                    {/* Basket items list */}
                    {basket.basket_items && basket.basket_items.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border/50 space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Contents:</p>
                        <div className="space-y-1 max-h-[100px] overflow-y-auto pr-1">
                          {basket.basket_items.map((item: any) => (
                            <div key={item.id} className="flex justify-between items-center text-xs font-body text-foreground">
                              <span className="truncate pr-2">• {item.product?.name || "Product"}</span>
                              <span className="text-muted-foreground font-semibold shrink-0">x{item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardHeader>
                </div>
                <div className="p-6 pt-0 mt-auto border-t border-border/40 pt-4">
                  <Button
                    className="w-full font-body text-xs gap-1.5"
                    onClick={() => handleAddBasketToCart(basket)}
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Basket to Cart
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
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
                      <TableHead className="font-body text-xs uppercase tracking-wider text-right">Action</TableHead>
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
                        <TableCell className="text-right">
                          {order.status === "delivered" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 font-body text-xs gap-1"
                              onClick={(e) => { e.stopPropagation(); setReviewOrder(order); }}
                            >
                              ★ Leave a Review
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {orders.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-12">
                          <div className="flex flex-col items-center">
                            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                              <Package className="h-7 w-7 text-primary" />
                            </div>
                            <p className="font-display text-base font-semibold text-foreground mb-1">No orders yet</p>
                            <p className="font-body text-sm text-muted-foreground max-w-xs">Browse our marketplace and place your first order to see it tracked here.</p>
                          </div>
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

      {reviewOrder && (
        <LeaveReviewModal
          open={!!reviewOrder}
          onOpenChange={(o) => { if (!o) setReviewOrder(null); }}
          orderItems={
            (Array.isArray(reviewOrder.items) ? (reviewOrder.items as any[]) : [])
              .filter((i) => i?.product_id)
              .map((i) => ({ product_id: i.product_id, name: i.name }))
          }
          vendorId={reviewOrder.vendor_id}
        />
      )}
    </div>
  );
}
