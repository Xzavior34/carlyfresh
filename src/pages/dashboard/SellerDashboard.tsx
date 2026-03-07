/**
 * Seller Dashboard — Vendor Portal Overview
 * DATA SOURCE: Live Supabase — products, orders tables
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Package,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  Truck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { formatNaira, getStatusColor } from "@/lib/formatters";
import type { Tables } from "@/integrations/supabase/types";
import { DashboardSkeleton } from "@/components/ui/DashboardSkeleton";

type Product = Tables<"products">;
type Order = Tables<"orders">;

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: "easeOut" as const },
  }),
};

const statusIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  pending: AlertCircle,
  processing: Clock,
  packaged: Package,
  "in-transit": Truck,
  delivered: CheckCircle2,
};

export default function SellerDashboard() {
  const { user } = useAuth();
  const [inventory, setInventory] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [prodRes, ordRes] = await Promise.all([
        supabase.from("products").select("*").eq("vendor_id", user.id),
        supabase.from("orders").select("*").eq("vendor_id", user.id).order("created_at", { ascending: false }).limit(10),
      ]);
      if (prodRes.data) setInventory(prodRes.data);
      if (ordRes.data) setOrders(ordRes.data);
      setLoading(false);
    };
    fetchData();

    // Realtime subscription for new orders
    const channel = supabase
      .channel("seller-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `vendor_id=eq.${user.id}` },
        () => { fetchData(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const toggleStock = async (id: string, current: boolean) => {
    const { error } = await supabase
      .from("products")
      .update({ in_stock: !current })
      .eq("id", id);
    if (!error) {
      setInventory((prev) =>
        prev.map((item) => (item.id === id ? { ...item, in_stock: !current } : item))
      );
    }
  };

  const activeProducts = inventory.filter((p) => p.in_stock).length;
  const pendingOrders = orders.filter((o) => o.status === "pending").length;
  const totalSales = orders.reduce((sum, o) => sum + Number(o.total_amount), 0);

  const metricCards = [
    { label: "Total Sales", value: formatNaira(totalSales), icon: TrendingUp, accent: "text-primary" },
    { label: "Pending Orders", value: pendingOrders.toString(), icon: Clock, accent: "text-accent" },
    { label: "Active Products", value: activeProducts.toString(), icon: Package, accent: "text-primary" },
    { label: "Total Orders", value: orders.length.toString(), icon: Users, accent: "text-accent" },
  ];

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Page header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
          Vendor Dashboard
        </h1>
        <p className="text-muted-foreground font-body mt-1">
          Welcome back! Here's an overview of your store performance.
        </p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((metric, i) => (
          <motion.div
            key={metric.label}
            custom={i}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
          >
            <Card className="border border-border hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground font-body uppercase tracking-wide">
                      {metric.label}
                    </p>
                    <p className="text-2xl font-bold font-display mt-1 text-foreground">
                      {metric.value}
                    </p>
                  </div>
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center bg-primary/10 ${metric.accent}`}>
                    <metric.icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Two-column layout: Inventory + Recent Orders */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Inventory Management — 2 cols */}
        <motion.div
          className="xl:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          <Card className="border border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-display">Inventory Management</CardTitle>
              <CardDescription className="font-body text-sm">
                Manage your product stock levels and availability.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="font-body text-xs uppercase tracking-wider">Product</TableHead>
                      <TableHead className="font-body text-xs uppercase tracking-wider">Category</TableHead>
                      <TableHead className="font-body text-xs uppercase tracking-wider text-right">Price</TableHead>
                      <TableHead className="font-body text-xs uppercase tracking-wider text-center">Stock</TableHead>
                      <TableHead className="font-body text-xs uppercase tracking-wider text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventory.map((item) => (
                      <TableRow key={item.id} className="group hover:bg-muted/20 transition-colors">
                        <TableCell className="font-medium font-body text-foreground">
                          {item.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-body text-[11px] font-normal">
                            {item.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-body tabular-nums">
                          {formatNaira(Number(item.price))}
                        </TableCell>
                        <TableCell className="text-center">
                          <span
                            className={`font-body tabular-nums font-medium ${
                              item.stock_level === 0
                                ? "text-destructive"
                                : item.stock_level < 15
                                ? "text-accent"
                                : "text-primary"
                            }`}
                          >
                            {item.stock_level}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Switch
                              checked={item.in_stock}
                              onCheckedChange={() => toggleStock(item.id, item.in_stock)}
                              className="data-[state=checked]:bg-primary"
                            />
                            <span className="text-xs font-body text-muted-foreground w-16">
                              {item.in_stock ? "In Stock" : "Out"}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {inventory.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12">
                          <div className="flex flex-col items-center">
                            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                              <Package className="h-7 w-7 text-primary" />
                            </div>
                            <p className="font-display text-base font-semibold text-foreground mb-1">No products yet</p>
                            <p className="font-body text-sm text-muted-foreground max-w-xs">Head to "My Products" to add your first harvest and start selling!</p>
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

        {/* Recent Orders — 1 col */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <Card className="border border-border h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-display">Recent Orders</CardTitle>
              <CardDescription className="font-body text-sm">
                Incoming orders that need your attention.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {orders.length === 0 && (
                <p className="text-sm text-muted-foreground font-body text-center py-6">No orders yet.</p>
              )}
              {orders.map((order) => {
                const StatusIcon = statusIcons[order.status] || Clock;
                const items = Array.isArray(order.items) ? order.items : [];
                return (
                  <div
                    key={order.id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-border/50 hover:border-border hover:bg-muted/20 transition-all"
                  >
                    <div className="mt-0.5">
                      <StatusIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium font-body text-foreground truncate">
                          #{order.order_number}
                        </p>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] font-body shrink-0 ${getStatusColor(order.status as any)}`}
                        >
                          {order.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground font-body mt-0.5">
                        {items.length} item{items.length !== 1 ? "s" : ""}
                      </p>
                      <p className="text-sm font-semibold text-foreground font-body mt-1">
                        {formatNaira(Number(order.total_amount))}
                      </p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
