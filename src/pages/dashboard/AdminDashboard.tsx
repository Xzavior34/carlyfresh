/**
 * Super Admin Portal — Unified Five-Layer Architecture Overview
 * DATA SOURCE: Live Supabase — Full cross-layer ecosystem control
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Users,
  ShoppingCart,
  Truck,
  ShoppingBag,
  ShieldCheck,
  BarChart3,
  TrendingUp as GrowthIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { formatNaira } from "@/lib/formatters";
import type { Tables } from "@/integrations/supabase/types";
import { DashboardSkeleton } from "@/components/ui/DashboardSkeleton";

// ==========================================
// DYNAMIC FUNCTIONAL TARGET MAPPINGS
// Synchronizes external file operations into the active master layout
// ==========================================
import AdminProducts from "@/pages/admin/AdminProducts";
import SupplyLayer from "@/components/admin/SupplyLayer";
import OpsLayer from "@/components/admin/OpsLayer";
import GrowthLayer from "@/components/admin/GrowthLayer";
import AnalyticsLayer from "@/components/admin/AnalyticsLayer";

type Order = Tables<"orders">;
type Profile = Tables<"profiles">;
type DeliveryJob = Tables<"delivery_jobs">;

interface UserWithRole extends Profile {
  role?: string;
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.35, ease: "easeOut" as const },
  }),
};

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [jobs, setJobs] = useState<DeliveryJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLayer, setActiveLayer] = useState("commerce");

  const fetchGlobalMetrics = async () => {
    const [ordRes, profRes, jobRes, rolesRes] = await Promise.all([
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*"),
      supabase.from("delivery_jobs").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("*"),
    ]);

    if (ordRes.data) setOrders(ordRes.data);
    if (jobRes.data) setJobs(jobRes.data);

    if (profRes.data && rolesRes.data) {
      const roleMap = new Map(rolesRes.data.map((r) => [r.user_id, r.role]));
      setUsers(profRes.data.map((p) => ({ ...p, role: roleMap.get(p.user_id) || "buyer" })));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchGlobalMetrics();

    // Core telemetry listeners dynamically tracking staging summary variables
    const ordersChannel = supabase
      .channel("admin-orders-metrics")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => { fetchGlobalMetrics(); });
    ordersChannel.subscribe();

    const jobsChannel = supabase
      .channel("admin-jobs-metrics")
      .on("postgres_changes", { event: "*", schema: "public", table: "delivery_jobs" }, () => { fetchGlobalMetrics(); });
    jobsChannel.subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(jobsChannel);
    };
  }, []);

  // System performance variables calculations
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
  const activeDeliveries = jobs.filter((j) => j.status === "available" || j.status === "accepted").length;
  const sellersCount = users.filter((u) => u.role === "seller").length;

  const metricCards = [
    { label: "Gross Platform Volume", value: formatNaira(totalRevenue), icon: TrendingUp, accent: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Active Suppliers", value: sellersCount.toString(), icon: Users, accent: "text-primary", bg: "bg-primary/10" },
    { label: "Total Marketplace Orders", value: orders.length.toString(), icon: ShoppingCart, accent: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Active Driver Dispatches", value: activeDeliveries.toString(), icon: Truck, accent: "text-indigo-500", bg: "bg-indigo-500/10" },
  ];

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Structural Overview Layout Profile */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary text-xs font-semibold py-0.5 px-2.5">
            Super Admin Access
          </Badge>
          <span className="text-xs text-muted-foreground font-body">• Multi-Sided Operations Framework</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
          Enterprise Command Center
        </h1>
        <p className="text-muted-foreground font-body text-sm mt-1">
          Unified administration controls spanning catalog logic, quality assurance, fulfillment mechanics, and analytics.
        </p>
      </div>

      {/* Dynamic Master Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((metric, i) => (
          <motion.div key={metric.label} custom={i} initial="hidden" animate="visible" variants={fadeUp}>
            <Card className="border border-border hover:shadow-md transition-shadow bg-card">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-semibold text-muted-foreground font-body uppercase tracking-wider">{metric.label}</p>
                    <p className="text-2xl font-bold font-display mt-1.5 text-foreground">{metric.value}</p>
                  </div>
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${metric.bg} ${metric.accent}`}>
                    <metric.icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Five-Layer Framework Navigation Nodes */}
      <Tabs value={activeLayer} onValueChange={setActiveLayer} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 h-auto p-1.5 bg-secondary/40 gap-1.5 rounded-xl">
          <TabsTrigger value="commerce" className="font-body text-xs sm:text-sm py-2.5 gap-2 font-medium">
            <ShoppingBag className="h-4 w-4 text-primary" />
            <span className="hidden sm:inline">1.</span> Commerce Layer
          </TabsTrigger>
          <TabsTrigger value="supply" className="font-body text-xs sm:text-sm py-2.5 gap-2 font-medium">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span className="hidden sm:inline">2.</span> Supply Layer
          </TabsTrigger>
          <TabsTrigger value="ops" className="font-body text-xs sm:text-sm py-2.5 gap-2 font-medium">
            <Truck className="h-4 w-4 text-amber-500" />
            <span className="hidden sm:inline">3.</span> Ops Layer
          </TabsTrigger>
          <TabsTrigger value="growth" className="font-body text-xs sm:text-sm py-2.5 gap-2 font-medium">
            <GrowthIcon className="h-4 w-4 text-rose-500" />
            <span className="hidden sm:inline">4.</span> Growth Layer
          </TabsTrigger>
          <TabsTrigger value="analytics" className="font-body text-xs sm:text-sm py-2.5 gap-2 font-medium">
            <BarChart3 className="h-4 w-4 text-indigo-500" />
            <span className="hidden sm:inline">5.</span> Analytics
          </TabsTrigger>
        </TabsList>

        {/* ========================================== */}
        {/* RUNTIME SYSTEM CONTROLLER EXECUTION */}
        {/* Invokes live dynamic components directly over UI layout blocks */}
        {/* ========================================== */}
        <TabsContent value="commerce" className="mt-6">
          <AdminProducts />
        </TabsContent>

        <TabsContent value="supply" className="mt-6">
          <SupplyLayer />
        </TabsContent>

        <TabsContent value="ops" className="mt-6">
          <OpsLayer />
        </TabsContent>

        <TabsContent value="growth" className="mt-6">
          <GrowthLayer />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <AnalyticsLayer />
        </TabsContent>
      </Tabs>
    </div>
  );
}
