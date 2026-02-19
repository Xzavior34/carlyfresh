/**
 * Seller Dashboard — Vendor Portal Overview
 * DATA SOURCE: Currently using mock data for UI approval. Awaiting DB connection.
 * TODO: Connect to Supabase tables: seller_metrics, products, orders
 */

import { useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Package,
  ShoppingCart,
  Users,
  Clock,
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
import {
  sellerMetrics,
  sellerInventory,
  sellerRecentOrders,
  formatNaira,
  getStatusColor,
  type InventoryItem,
} from "@/lib/mockDashboardData";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: "easeOut" as const },
  }),
};

const metricCards = [
  { label: "Total Sales", value: formatNaira(sellerMetrics.totalSales), icon: TrendingUp, accent: "text-primary" },
  { label: "Pending Orders", value: sellerMetrics.pendingOrders.toString(), icon: Clock, accent: "text-accent" },
  { label: "Active Products", value: sellerMetrics.activeProducts.toString(), icon: Package, accent: "text-primary" },
  { label: "Total Customers", value: sellerMetrics.totalCustomers.toString(), icon: Users, accent: "text-accent" },
];

const statusIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  pending: AlertCircle,
  processing: Clock,
  packaged: Package,
  "in-transit": Truck,
  delivered: CheckCircle2,
};

export default function SellerDashboard() {
  // TODO: Replace with real-time inventory state from Supabase
  const [inventory, setInventory] = useState<InventoryItem[]>(sellerInventory);

  const toggleStock = (id: string) => {
    // TODO: PATCH /api/products/:id { inStock: !current }
    setInventory((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, inStock: !item.inStock } : item
      )
    );
  };

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
                {/* DATA SOURCE: Mock inventory list. TODO: Fetch from products table */}
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
                          {formatNaira(item.price)}
                        </TableCell>
                        <TableCell className="text-center">
                          <span
                            className={`font-body tabular-nums font-medium ${
                              item.stockLevel === 0
                                ? "text-destructive"
                                : item.stockLevel < 15
                                ? "text-accent"
                                : "text-primary"
                            }`}
                          >
                            {item.stockLevel}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Switch
                              checked={item.inStock}
                              onCheckedChange={() => toggleStock(item.id)}
                              className="data-[state=checked]:bg-primary"
                            />
                            <span className="text-xs font-body text-muted-foreground w-16">
                              {item.inStock ? "In Stock" : "Out"}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
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
                {/* DATA SOURCE: Mock orders. TODO: Real-time subscription on orders table */}
                Incoming orders that need your attention.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {sellerRecentOrders.map((order) => {
                const StatusIcon = statusIcons[order.status] || Clock;
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
                          {order.id}
                        </p>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] font-body shrink-0 ${getStatusColor(order.status)}`}
                        >
                          {order.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground font-body mt-0.5">
                        {order.customerName} · {order.items.length} item{order.items.length > 1 ? "s" : ""}
                      </p>
                      <p className="text-sm font-semibold text-foreground font-body mt-1">
                        {formatNaira(order.total)}
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
