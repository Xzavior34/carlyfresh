/**
 * Vendor Store Orders â€” Full order management with delivery tracking
 * DATA SOURCE: Live Supabase â€” orders, delivery_jobs, profiles tables
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  Truck,
  Clock,
  CheckCircle2,
  ShoppingBag,
  User,
  Star,
  MapPin,
  Navigation,
  UserCheck,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { formatNaira, getStatusColor } from "@/lib/formatters";
import type { Tables } from "@/integrations/supabase/types";
import { DashboardSkeleton } from "@/components/ui/DashboardSkeleton";
import { toast } from "sonner";

type Order = Tables<"orders">;
type DeliveryJob = Tables<"delivery_jobs">;
type Profile = Tables<"profiles">;

interface DeliveryInfo {
  job: DeliveryJob;
  driver: Profile | null;
  driverLocation: { latitude: number; longitude: number; updated_at: string } | null;
}

// â”€â”€â”€ Order milestone steps â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const MILESTONES = [
  { key: "pending", label: "Pending" },
  { key: "accepted", label: "Accepted" },
  { key: "preparing", label: "Preparing" },
  { key: "driver_assigned", label: "Driver Assigned" },
  { key: "in-transit", label: "In Transit" },
  { key: "delivered", label: "Delivered" },
];

function getMilestoneIndex(status: string): number {
  const map: Record<string, number> = {
    pending: 0,
    accepted: 1, preparing: 2, packaged: 3, driver_assigned: 4, "in-transit": 5, delivered: 6,
  };
  return map[status] ?? 0;
}

// â”€â”€â”€ Inline Progress Bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function MilestoneBar({ status }: { status: string }) {
  const idx = getMilestoneIndex(status);
  const pct = Math.round((idx / (MILESTONES.length - 1)) * 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {MILESTONES.map((m, i) => {
          const done = i <= idx;
          const current = i === idx;
          return (
            <div key={m.key} className="flex items-center gap-1 shrink-0">
              <div
                className={`h-2 w-2 rounded-full transition-all duration-300 ${
                  done ? "bg-primary" : "bg-border"
                } ${current ? "ring-2 ring-primary/30 scale-125" : ""}`}
              />
              {i < MILESTONES.length - 1 && (
                <div
                  className={`h-0.5 w-6 transition-all duration-500 ${
                    i < idx ? "bg-primary" : "bg-border"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between">
        <p className="font-body text-[10px] text-muted-foreground">{MILESTONES[0].label}</p>
        <p className="font-body text-[10px] text-primary font-medium">{pct}% complete</p>
        <p className="font-body text-[10px] text-muted-foreground">
          {MILESTONES[MILESTONES.length - 1].label}
        </p>
      </div>
    </div>
  );
}

// â”€â”€â”€ Driver Info Panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function DriverPanel({ info, loading }: { info: DeliveryInfo | null | undefined; loading: boolean }) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs font-body text-muted-foreground pt-2">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        <span>Loading delivery infoâ€¦</span>
      </div>
    );
  }

  if (!info) {
    return (
      <div className="flex items-center gap-2 pt-2 text-xs font-body text-muted-foreground">
        <div className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
        <span>Searching for nearby driversâ€¦</span>
      </div>
    );
  }

  const { driver, driverLocation } = info;

  if (!driver) {
    return (
      <div className="flex items-center gap-2 pt-2 text-xs font-body text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
        <span>Driver assignment in progressâ€¦</span>
      </div>
    );
  }

  const lastSeen = driverLocation?.updated_at
    ? new Date(driverLocation.updated_at).toLocaleTimeString("en-NG", { timeStyle: "short" })
    : null;

  return (
    <div className="mt-3 rounded-xl border border-border/60 bg-muted/20 p-3 space-y-3">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
          <User className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-body text-sm font-semibold text-foreground truncate">
            {driver.full_name || "Driver"}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
            <span className="font-body text-[10px] text-muted-foreground">
              {driver.driver_rating?.toFixed(1) || "N/A"} Â· {driver.phone || "No phone"}
            </span>
          </div>
        </div>
        <Badge variant="secondary" className="text-[10px] font-body bg-emerald-100 text-emerald-800 shrink-0">
          Active
        </Badge>
      </div>

      {driver.vehicle_info && (
        <div className="flex items-center gap-2 text-xs font-body text-muted-foreground">
          <Truck className="h-3.5 w-3.5 text-primary shrink-0" />
          <span>{driver.vehicle_info}</span>
        </div>
      )}

      {driverLocation ? (
        <div className="flex items-center justify-between text-[10px] font-body text-muted-foreground">
          <div className="flex items-center gap-1">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
            </span>
            <span className="tabular-nums">
              {driverLocation.latitude.toFixed(4)}Â°N, {driverLocation.longitude.toFixed(4)}Â°E
            </span>
          </div>
          {lastSeen && <span>Updated {lastSeen}</span>}
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-[10px] font-body text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span>Location not available</span>
        </div>
      )}
    </div>
  );
}

// â”€â”€â”€ Expandable Order Row â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface OrderRowProps {
  order: Order;
}

function OrderRow({ order }: OrderRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo | null | undefined>(undefined);

  useEffect(() => {
    if (!expanded || deliveryInfo !== undefined) return;

    const fetch = async () => {
      const { data: jobData } = await supabase
        .from("delivery_jobs")
        .select("*")
        .eq("order_id", order.id)
        .maybeSingle();

      if (!jobData) {
        setDeliveryInfo(null);
        return;
      }

      let driver: Profile | null = null;
      let driverLocation: { latitude: number; longitude: number; updated_at: string } | null = null;

      if (jobData.driver_id) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", jobData.driver_id)
          .maybeSingle();
        driver = profileData ?? null;

        const { data: locData } = await supabase
          .from("driver_locations")
          .select("latitude, longitude, updated_at")
          .eq("driver_id", jobData.driver_id)
          .maybeSingle();
        driverLocation = locData ?? null;
      }

      setDeliveryInfo({ job: jobData, driver, driverLocation });
    };

    fetch();
  }, [expanded, order.id, deliveryInfo]);

  const items = Array.isArray(order.items) ? (order.items as any[]) : [];
  const stepIdx = getMilestoneIndex(order.status);
  const showDriver = stepIdx >= 1; // show from 'confirmed' onward

  return (
    <>
      <TableRow
        className="hover:bg-muted/20 transition-colors cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        <TableCell className="font-medium font-body text-foreground">
          #{order.order_number}
        </TableCell>
        <TableCell className="text-right font-body tabular-nums">
          {formatNaira(Number(order.total_amount))}
        </TableCell>
        <TableCell className="text-center">
          <Badge
            variant="secondary"
            className={`text-[10px] font-body ${getStatusColor(order.status as string)}`}
          >
            {order.status.replace("_", " ")}
          </Badge>
        </TableCell>
        <TableCell className="font-body text-sm text-muted-foreground">
          {new Date(order.created_at).toLocaleDateString("en-NG", {
            day: "numeric",
            month: "short",
          })}
        </TableCell>
        <TableCell className="text-center">
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground mx-auto" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground mx-auto" />
          )}
        </TableCell>
      </TableRow>

      <AnimatePresence>
        {expanded && (
          <TableRow key={`${order.id}-expanded`}>
            <TableCell colSpan={5} className="p-0">
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="px-4 py-4 bg-muted/10 border-t border-border/30 space-y-4">
                  {/* Progress bar */}
                  <div>
                    <p className="font-body text-xs font-semibold text-foreground mb-2 uppercase tracking-wider">
                      Order Progress
                    </p>
                    <MilestoneBar status={order.status as string} />
                  </div>

                  {/* Items */}
                  {items.length > 0 && (
                    <div>
                      <p className="font-body text-xs font-semibold text-foreground mb-2 uppercase tracking-wider">
                        Items
                      </p>
                      <div className="space-y-1.5">
                        {items.map((item: any, i: number) => (
                          <div key={i} className="flex items-center justify-between font-body text-sm">
                            <span className="text-foreground">
                              {item?.name || "Item"} Ã— {item?.quantity || 1}
                            </span>
                            <span className="tabular-nums text-muted-foreground">
                              {formatNaira((item?.price || 0) * (item?.quantity || 1))}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Delivery address */}
                  {order.delivery_address && (
                    <div className="flex items-start gap-2 font-body text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
                      <span>{order.delivery_address}</span>
                    </div>
                  )}

                  {/* Driver panel */}
                  {showDriver && (
                    <div>
                      <p className="font-body text-xs font-semibold text-foreground mb-1 uppercase tracking-wider">
                        Assigned Driver
                      </p>
                      <DriverPanel info={deliveryInfo} loading={deliveryInfo === undefined} />
                    </div>

                  {/* Vendor Action Buttons */}
                  <div className="flex gap-3 pt-2 border-t border-border/30">
                    {order.status === "accepted" && (
                      <Button
                        size="sm"
                        onClick={async () => {
                          await supabase.from("orders").update({ status: "preparing" }).eq("id", order.id);
                        }}
                      >
                        Start Preparing
                      </Button>
                    )}
                    {order.status === "preparing" && (
                      <Button
                        size="sm"
                        onClick={async () => {
                          await supabase.from("orders").update({ status: "packaged" }).eq("id", order.id);
                        }}
                      >
                        Mark Ready & Request Driver
                      </Button>
                    )}
                  </div>
                  )}
                </div>
              </motion.div>
            </TableCell>
          </TableRow>
        )}
      </AnimatePresence>
    </>
  );
}

// â”€â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function VendorOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("vendor_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setOrders(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchOrders();
    if (!user) return;
    const channel = supabase
      .channel("vendor-orders-page")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `vendor_id=eq.${user.id}` },
        () => fetchOrders()
      );
    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchOrders]);

  const statusFilters = ["all", "accepted", "preparing", "packaged", "driver_assigned", "in-transit", "delivered"];

  const filtered = filterStatus === "all"
    ? orders
    : orders.filter((o) => o.status === filterStatus);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Store Orders</h1>
        <p className="text-muted-foreground font-body text-sm">{orders.length} orders received</p>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {statusFilters.map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1 rounded-full text-xs font-body font-medium transition-all ${
              filterStatus === s
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/70"
            }`}
          >
            {s === "all" ? "All Orders" : s.replace("_", " ")}
            {s !== "all" && (
              <span className="ml-1.5 opacity-70">
                ({orders.filter((o) => o.status === s).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Orders table */}
      <Card className="border border-border">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="font-body text-xs uppercase tracking-wider">#</TableHead>
                  <TableHead className="font-body text-xs uppercase tracking-wider text-right">Amount</TableHead>
                  <TableHead className="font-body text-xs uppercase tracking-wider text-center">Status</TableHead>
                  <TableHead className="font-body text-xs uppercase tracking-wider">Date</TableHead>
                  <TableHead className="font-body text-xs uppercase tracking-wider text-center">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((order) => (
                  <OrderRow key={order.id} order={order} />
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center">
                          <ShoppingBag className="h-7 w-7 text-muted-foreground/50" />
                        </div>
                        <p className="font-body text-sm text-muted-foreground">
                          {filterStatus === "all"
                            ? "No orders yet. Share your store to start getting orders!"
                            : `No "${filterStatus.replace("_", " ")}" orders.`}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

