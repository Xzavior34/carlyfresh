/**
 * Vendor Store Orders — Complete order management with buyer details,
 * live 15-minute prep timer, OneSignal push sync, in-app messaging, Accept/Decline flow,
 * and Proximity Driver Dispatch.
 * DATA SOURCE: Live Supabase — orders, delivery_jobs, profiles tables
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
  ChevronDown,
  ChevronUp,
  Loader2,
  Bell,
  XCircle,
  AlertCircle,
  Send,
  Phone,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { formatNaira, getStatusColor } from "@/lib/formatters";
import type { Tables } from "@/integrations/supabase/types";
import { DashboardSkeleton } from "@/components/ui/DashboardSkeleton";
import MiniChat from "@/components/chat/MiniChat";
import WhatsAppOrderButton from "@/components/common/WhatsAppOrderButton";
import { toast } from "sonner";

type Order = Tables<"orders">;
type DeliveryJob = Tables<"delivery_jobs">;
type Profile = Tables<"profiles">;

interface DetailedOrder extends Order {
  buyer?: Profile | null;
  job?: DeliveryJob | null;
  driver?: Profile | null;
  driverLocation?: { latitude: number; longitude: number; updated_at: string } | null;
}

// ─── Order milestone steps ───────────────────────────────────────────────────
const MILESTONES = [
  { key: "pending", label: "Pending" },
  { key: "preparing", label: "Preparing (15m)" },
  { key: "packaged", label: "Ready / Packaged" },
  { key: "driver_assigned", label: "Driver Assigned" },
  { key: "in-transit", label: "In Transit" },
  { key: "delivered", label: "Delivered" },
];

function getMilestoneIndex(status: string): number {
  const map: Record<string, number> = {
    pending: 0,
    confirmed: 0,
    accepted: 1,
    preparing: 1,
    packaged: 2,
    driver_assigned: 3,
    "in-transit": 4,
    delivered: 5,
  };
  return map[status] ?? 0;
}

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

// ─── Helpers for Persistent 15-Minute Prep Timer ──────────────────────────────
const getPrepDeadline = (orderId: string): number | null => {
  const saved = localStorage.getItem(`carlyfresh_prep_deadline_${orderId}`);
  if (saved) {
    const parsed = parseInt(saved, 10);
    if (!isNaN(parsed)) return parsed;
  }
  return null;
};

const setPrepDeadline = (orderId: string, secondsFromNow: number) => {
  const deadline = Date.now() + secondsFromNow * 1000;
  localStorage.setItem(`carlyfresh_prep_deadline_${orderId}`, deadline.toString());
  return deadline;
};

const clearPrepDeadline = (orderId: string) => {
  localStorage.removeItem(`carlyfresh_prep_deadline_${orderId}`);
  localStorage.removeItem(`carlyfresh_prep_extended_${orderId}`);
  localStorage.removeItem(`carlyfresh_delay_alert_sent_${orderId}`);
};

export default function VendorOrders() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<DetailedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Preparation countdown timers (orderId -> remaining seconds)
  const [prepTimers, setPrepTimers] = useState<Record<string, number>>({});

  // Incoming Order Modal state
  const [incomingOrder, setIncomingOrder] = useState<DetailedOrder | null>(null);
  const [showIncomingModal, setShowIncomingModal] = useState(false);

  // Preparation finished prompt modal state ("Ready or Not Ready")
  const [prepPromptOrder, setPrepPromptOrder] = useState<DetailedOrder | null>(null);
  const [showPrepModal, setShowPrepModal] = useState(false);
  const [is20MinOverdue, setIs20MinOverdue] = useState(false);
  const [dispatching, setDispatching] = useState(false);

  // Decline confirmation modal
  const [declineOrder, setDeclineOrder] = useState<DetailedOrder | null>(null);
  const [showDeclineModal, setShowDeclineModal] = useState(false);

  const prevOrderIdsRef = useRef<Set<string>>(new Set());

  // ── Fetch orders and joined profiles/jobs ──────────────────────────────────
  const fetchOrders = useCallback(async () => {
    if (!user) return;
    const { data: rawOrders } = await supabase
      .from("orders")
      .select("*")
      .eq("vendor_id", user.id)
      .order("created_at", { ascending: false });

    if (!rawOrders) {
      setLoading(false);
      return;
    }

    const buyerIds = Array.from(new Set(rawOrders.map((o) => o.buyer_id).filter(Boolean)));
    const orderIds = rawOrders.map((o) => o.id);

    const [profilesRes, jobsRes] = await Promise.all([
      buyerIds.length > 0
        ? supabase.from("profiles").select("*").in("user_id", buyerIds)
        : Promise.resolve({ data: [] }),
      orderIds.length > 0
        ? supabase.from("delivery_jobs").select("*").in("order_id", orderIds)
        : Promise.resolve({ data: [] }),
    ]);

    const profileMap = new Map((profilesRes.data || []).map((p) => [p.user_id, p]));
    const jobMap = new Map((jobsRes.data || []).map((j) => [j.order_id, j]));

    // Fetch assigned drivers if any
    const driverIds = Array.from(
      new Set(
        (jobsRes.data || [])
          .map((j) => j.driver_id)
          .filter((id): id is string => Boolean(id))
      )
    );

    let driverMap = new Map<string, Profile>();
    let locMap = new Map<string, { latitude: number; longitude: number; updated_at: string }>();

    if (driverIds.length > 0) {
      const [driverProfilesRes, driverLocsRes] = await Promise.all([
        supabase.from("profiles").select("*").in("user_id", driverIds),
        supabase.from("driver_locations").select("driver_id, latitude, longitude, updated_at").in("driver_id", driverIds),
      ]);
      driverMap = new Map((driverProfilesRes.data || []).map((p) => [p.user_id, p]));
      locMap = new Map((driverLocsRes.data || []).map((l) => [l.driver_id, l]));
    }

    const detailed: DetailedOrder[] = rawOrders.map((ord) => {
      const job = jobMap.get(ord.id) || null;
      const driver = job?.driver_id ? driverMap.get(job.driver_id) || null : null;
      const driverLocation = job?.driver_id ? locMap.get(job.driver_id) || null : null;
      return {
        ...ord,
        buyer: profileMap.get(ord.buyer_id) || null,
        job,
        driver,
        driverLocation,
      };
    });

    // Check for new incoming orders
    if (prevOrderIdsRef.current.size > 0) {
      const newlyArrived = detailed.find(
        (o) =>
          (o.status === "pending" || o.status === "confirmed") &&
          !prevOrderIdsRef.current.has(o.id)
      );
      if (newlyArrived) {
        setIncomingOrder(newlyArrived);
        setShowIncomingModal(true);
      }
    }

    prevOrderIdsRef.current = new Set(detailed.map((o) => o.id));
    setOrders(detailed);
    setLoading(false);
  }, [user]);

  // ── 15-Minute Countdown & 20-Minute Email Urgency Timer Loop ────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setPrepTimers((prev) => {
        let changed = false;
        const next: Record<string, number> = {};

        orders.forEach((o) => {
          if (o.status === "preparing") {
            let deadline = getPrepDeadline(o.id);
            if (!deadline) {
              deadline = setPrepDeadline(o.id, 15 * 60); // start 15m default
            }
            const remaining = Math.max(0, Math.ceil((deadline - now) / 1000));
            next[o.id] = remaining;

            if (prev[o.id] !== remaining) changed = true;

            // Trigger prompt when countdown reaches 0
            if (remaining === 0 && prev[o.id] !== 0 && prev[o.id] !== undefined) {
              const wasExtended = localStorage.getItem(`carlyfresh_prep_extended_${o.id}`) === "true";
              const alertSent = localStorage.getItem(`carlyfresh_delay_alert_sent_${o.id}`) === "true";

              setPrepPromptOrder(o);
              setShowPrepModal(true);
              setIs20MinOverdue(wasExtended);

              if (wasExtended && !alertSent) {
                // 20 minutes elapsed total (15m initial + 5m extension)
                localStorage.setItem(`carlyfresh_delay_alert_sent_${o.id}`, "true");
                toast.error(`⚠️ Order #${o.order_number || o.id.slice(0, 8)} has reached 20 mins prep time! Urgent email & push notification sent.`);

                // 1. Send Email Notification via Edge Function
                supabase.functions.invoke("send-transactional-email", {
                  body: {
                    template: "vendor_prep_delay",
                    to: user?.email || "vendor@carlyfresh.com",
                    data: {
                      order_id: o.id,
                      order_number: o.order_number || o.id.slice(0, 8),
                      vendor_name: user?.email || "Vendor Store",
                      buyer_name: o.buyer?.full_name || "Customer",
                    },
                  },
                }).catch(console.error);

                // 2. Dispatch Push Notification to Vendor Phone via OneSignal
                supabase.functions.invoke("onesignal-dispatcher", {
                  body: {
                    record: {
                      ...o,
                      status: "pending",
                      order_number: o.order_number || o.id.slice(0, 8),
                      vendor_id: user?.id,
                    },
                  },
                }).catch(console.error);
              } else {
                toast.info(`⏱️ Order #${o.order_number || o.id.slice(0, 8)} 15m prep time elapsed. Ready or Not Ready?`);
              }
            }
          }
        });

        return changed ? next : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [orders, user]);

  // ── Realtime Order Listeners ────────────────────────────────────────────────
  useEffect(() => {
    fetchOrders();
    if (!user) return;

    const channel = supabase
      .channel(`vendor-orders-live-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `vendor_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newOrd = payload.new as Order;
            toast.info(`🚨 New Order #${newOrd.order_number || newOrd.id.slice(0, 8)} received! Accept or Reject.`);
          }
          fetchOrders();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "delivery_jobs" },
        () => fetchOrders()
      );

    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchOrders]);

  // ── Action Handlers ────────────────────────────────────────────────────────
  const handleAcceptOrder = async (order: DetailedOrder) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: "preparing" })
        .eq("id", order.id);

      if (error) throw error;

      // Start 15-minute countdown (900 seconds)
      setPrepDeadline(order.id, 15 * 60);
      setPrepTimers((prev) => ({ ...prev, [order.id]: 15 * 60 }));

      toast.success(`Order #${order.order_number || order.id.slice(0, 8)} accepted! 15-minute preparation started.`);
      setShowIncomingModal(false);
      setIncomingOrder(null);
      fetchOrders();

      // Notify customer via edge function
      supabase.functions.invoke("notify-order-status", {
        body: { record: { ...order, status: "preparing" } },
      }).catch(console.error);
    } catch (err: any) {
      toast.error(err.message || "Failed to accept order");
    }
  };

  const handleDeclineOrder = async () => {
    if (!declineOrder) return;
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: "cancelled" })
        .eq("id", declineOrder.id);

      if (error) throw error;

      clearPrepDeadline(declineOrder.id);
      toast.info(`Order #${declineOrder.order_number || declineOrder.id.slice(0, 8)} declined.`);
      setShowDeclineModal(false);
      setDeclineOrder(null);
      fetchOrders();
    } catch (err: any) {
      toast.error(err.message || "Failed to decline order");
    }
  };

  const handleConfirmPreparedAndSend = async (order: DetailedOrder) => {
    setDispatching(true);
    try {
      // 1. Update order status to packaged (ready for pickup)
      const { error } = await supabase
        .from("orders")
        .update({ status: "packaged" })
        .eq("id", order.id);

      if (error) throw error;

      clearPrepDeadline(order.id);

      // 2. Query Vendor Farm Location Coordinates (if available)
      let vendorLat: number | undefined;
      let vendorLon: number | undefined;

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            vendorLat = pos.coords.latitude;
            vendorLon = pos.coords.longitude;
          },
          () => console.log("GPS not enabled, using address matching"),
          { timeout: 3000 }
        );
      }

      // 3. Trigger Driver Proximity Edge Function to Alert Nearby Available Drivers
      await supabase.functions.invoke("dispatch-driver-proximity", {
        body: {
          order_id: order.id,
          vendor_lat: vendorLat,
          vendor_lon: vendorLon,
          pickup_address: order.delivery_address ? "Vendor Location" : "Vendor Farm / Kitchen",
          dropoff_address: order.delivery_address,
          payout_amount: 1500,
        },
      });

      toast.success("Order marked Ready! 🚚 Nearby available drivers alerted to pick up.");
      setShowPrepModal(false);
      setPrepPromptOrder(null);
      fetchOrders();
    } catch (err: any) {
      toast.error(err.message || "Failed to dispatch drivers");
    } finally {
      setDispatching(false);
    }
  };

  const handleExtendPrepTime = (order: DetailedOrder) => {
    // Add extra 5 minutes (300 seconds) - total prep will reach 20 minutes
    localStorage.setItem(`carlyfresh_prep_extended_${order.id}`, "true");
    setPrepDeadline(order.id, 5 * 60);
    setPrepTimers((prev) => ({ ...prev, [order.id]: 5 * 60 }));
    toast.info(`Preparation for Order #${order.order_number || order.id.slice(0, 8)} extended by 5 minutes (20 min total).`);
    setShowPrepModal(false);
    setPrepPromptOrder(null);
  };

  const statusFilters = [
    "all",
    "pending",
    "confirmed",
    "preparing",
    "packaged",
    "driver_assigned",
    "in-transit",
    "delivered",
  ];

  const filtered = filterStatus === "all"
    ? orders
    : orders.filter((o) => o.status === filterStatus);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Store Orders & Fulfillment</h1>
          <p className="text-muted-foreground font-body text-sm">
            {orders.length} total orders received • Real-time in-app buyer messaging and 15m driver dispatch
          </p>
        </div>
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

      {/* Orders List */}
      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <h3 className="font-display font-semibold text-lg text-foreground">No orders found</h3>
            <p className="font-body text-sm text-muted-foreground mt-1">
              {filterStatus === "all"
                ? "You haven't received any customer orders yet."
                : `No orders currently in '${filterStatus}' status.`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((order) => {
            const isExpanded = expandedRow === order.id;
            const prepSeconds = prepTimers[order.id] ?? 0;
            const prepMins = Math.floor(prepSeconds / 60);
            const prepSecs = prepSeconds % 60;
            const items = Array.isArray(order.items) ? (order.items as any[]) : [];
            const buyerName =
              order.buyer?.full_name ||
              order.buyer?.business_name ||
              `Buyer (${order.buyer_id?.slice(0, 6) || "Guest"})`;
            const buyerPhone = order.buyer?.phone || "";

            return (
              <Card
                key={order.id}
                className="overflow-hidden border-border/70 hover:border-primary/40 transition-colors shadow-sm"
              >
                <CardContent className="p-0">
                  {/* Order Summary Header */}
                  <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-display font-bold text-base sm:text-lg text-foreground">
                          #{order.order_number || order.id.slice(0, 8)}
                        </span>
                        <Badge className={`${getStatusColor(order.status)} font-body text-xs capitalize`}>
                          {order.status.replace("_", " ")}
                        </Badge>
                        {order.status === "preparing" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20 animate-pulse">
                            <Clock className="h-3 w-3" />
                            {prepMins}:{prepSecs < 10 ? `0${prepSecs}` : prepSecs} left
                          </span>
                        )}
                      </div>
                      <p className="font-body text-xs text-muted-foreground">
                        Placed on {new Date(order.created_at).toLocaleString()} • {items.length} items
                      </p>
                    </div>

                    {/* Buyer & Payout snapshot */}
                    <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-3 md:pt-0 border-border/40">
                      <div className="text-left md:text-right">
                        <p className="font-display font-bold text-lg text-emerald-700">
                          {formatNaira(Number(order.total_amount))}
                        </p>
                        <p className="font-body text-xs text-muted-foreground">
                          Buyer: <span className="font-medium text-foreground">{buyerName}</span>
                        </p>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedRow(isExpanded ? null : order.id)}
                        className="gap-1 font-body text-xs"
                      >
                        {isExpanded ? "Hide Details" : "View Details"}
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* Progress Milestone Bar */}
                  <div className="px-4 sm:px-5 py-2.5 bg-muted/20 border-y border-border/50">
                    <MilestoneBar status={order.status} />
                  </div>

                  {/* Quick Action Bar */}
                  <div className="p-4 sm:p-5 bg-card/60 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Accept / Reject if pending */}
                      {(order.status === "pending" || order.status === "confirmed") && (
                        <>
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-body text-xs gap-1.5 font-semibold"
                            onClick={() => handleAcceptOrder(order)}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" /> Accept (Start 15m Prep)
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:bg-destructive/10 border-destructive/30 font-body text-xs gap-1.5"
                            onClick={() => {
                              setDeclineOrder(order);
                              setShowDeclineModal(true);
                            }}
                          >
                            <XCircle className="h-3.5 w-3.5" /> Decline
                          </Button>
                        </>
                      )}

                      {/* 15-Minute Countdown Actions if preparing */}
                      {order.status === "preparing" && (
                        <>
                          <Button
                            size="sm"
                            className="bg-primary text-primary-foreground font-body text-xs gap-1.5 font-semibold shadow-sm"
                            disabled={dispatching}
                            onClick={() => handleConfirmPreparedAndSend(order)}
                          >
                            {dispatching ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Send className="h-3.5 w-3.5" />
                            )}
                            Ready (Link Driver)
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="font-body text-xs gap-1.5"
                            onClick={() => handleExtendPrepTime(order)}
                          >
                            <Clock className="h-3.5 w-3.5" /> Not Ready (+5 Mins)
                          </Button>
                        </>
                      )}

                      {/* Ready / Packaged state */}
                      {order.status === "packaged" && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-body text-emerald-700 font-medium flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Packaged & ready for pickup
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="font-body text-xs gap-1"
                            disabled={dispatching}
                            onClick={() => handleConfirmPreparedAndSend(order)}
                          >
                            <Truck className="h-3.5 w-3.5 text-primary" /> Re-dispatch Drivers
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <WhatsAppOrderButton
                        order={{
                          id: order.id,
                          order_number: order.order_number,
                          created_at: order.created_at,
                          status: order.status,
                          total_amount: order.total_amount,
                          delivery_address: order.delivery_address,
                          delivery_window: order.delivery_window,
                          items: items,
                          buyer: order.buyer,
                          driver: order.driver,
                        }}
                        recipientPhone={buyerPhone}
                        label="WhatsApp Buyer"
                        size="sm"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="font-body text-xs gap-1.5"
                        onClick={() => setExpandedRow(isExpanded ? null : order.id)}
                      >
                        <User className="h-3.5 w-3.5" /> Buyer Info & In-App Chat
                      </Button>
                    </div>
                  </div>

                  {/* Expanded Order & Customer Details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-border/70 p-4 sm:p-5 bg-muted/10 space-y-6"
                      >
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Left Column: Customer & Delivery Details */}
                          <div className="space-y-4">
                            <div className="bg-card p-4 rounded-xl border border-border/70 space-y-3">
                              <h4 className="font-display font-bold text-sm text-foreground flex items-center gap-2">
                                <User className="h-4 w-4 text-primary" /> Customer Profile & Order Info
                              </h4>
                              <div className="grid grid-cols-2 gap-3 text-xs font-body">
                                <div>
                                  <p className="text-muted-foreground">Buyer Name</p>
                                  <p className="font-semibold text-foreground">{buyerName}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Phone Number</p>
                                  <p className="font-medium text-foreground">{buyerPhone || "Not provided"}</p>
                                </div>
                                <div className="col-span-2">
                                  <p className="text-muted-foreground">Delivery Address</p>
                                  <p className="font-medium text-foreground flex items-start gap-1 mt-0.5">
                                    <MapPin className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                                    {order.delivery_address || "Standard Store Pickup"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Delivery Window</p>
                                  <p className="font-medium text-foreground">{order.delivery_window || "Immediate"}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Payment Status</p>
                                  <p className="font-semibold text-emerald-700">
                                    Paid
                                  </p>
                                </div>
                              </div>
                              <div className="pt-2 border-t border-border/50 flex justify-end">
                                <WhatsAppOrderButton
                                  order={{
                                    id: order.id,
                                    order_number: order.order_number,
                                    created_at: order.created_at,
                                    status: order.status,
                                    total_amount: order.total_amount,
                                    delivery_address: order.delivery_address,
                                    delivery_window: order.delivery_window,
                                    items: items,
                                    buyer: order.buyer,
                                    driver: order.driver,
                                  }}
                                  recipientPhone={buyerPhone}
                                  label="Send Receipt to Customer WhatsApp"
                                  size="sm"
                                />
                              </div>
                            </div>

                            {/* Driver info if assigned */}
                            {order.driver && (
                              <div className="bg-card p-4 rounded-xl border border-border/70 space-y-2">
                                <h4 className="font-display font-bold text-sm text-foreground flex items-center gap-2">
                                  <Truck className="h-4 w-4 text-primary" /> Assigned Driver
                                </h4>
                                <div className="text-xs font-body flex justify-between items-center">
                                  <div>
                                    <p className="font-semibold text-foreground">
                                      {order.driver.full_name || "Driver"}
                                    </p>
                                    <p className="text-muted-foreground">{order.driver.phone || "No phone"}</p>
                                  </div>
                                  <Badge variant="outline" className="text-xs font-body">
                                    {order.job?.status || "Assigned"}
                                  </Badge>
                                </div>
                              </div>
                            )}

                            {/* Items Purchased Table */}
                            <div className="bg-card p-4 rounded-xl border border-border/70 space-y-3">
                              <h4 className="font-display font-bold text-sm text-foreground flex items-center gap-2">
                                <ShoppingBag className="h-4 w-4 text-primary" /> Items Ordered ({items.length})
                              </h4>
                              <div className="space-y-2">
                                {items.map((item: any, idx: number) => (
                                  <div
                                    key={idx}
                                    className="flex justify-between items-center text-xs font-body py-1.5 border-b border-border/40 last:border-0"
                                  >
                                    <div>
                                      <p className="font-semibold text-foreground">
                                        {item.product_name || item.title || item.name || `Item ${idx + 1}`}
                                      </p>
                                      <p className="text-muted-foreground">Qty: {item.quantity || 1}</p>
                                    </div>
                                    <span className="font-semibold text-foreground">
                                      {formatNaira(Number(item.price || item.unit_price || 0) * (item.quantity || 1))}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Right Column: In-App Chat with Customer */}
                          <div className="space-y-3">
                            <h4 className="font-display font-bold text-sm text-foreground flex items-center gap-2">
                              <Send className="h-4 w-4 text-primary" /> Built-In In-App Chat (Push-Synced via OneSignal)
                            </h4>
                            <p className="text-xs font-body text-muted-foreground">
                              Communicate in real time with the buyer without leaving the app. Notifications are sent straight to their device.
                            </p>
                            <div className="h-[380px] bg-card rounded-xl border border-border/70 overflow-hidden shadow-sm">
                              {order.buyer_id ? (
                                <MiniChat
                                  orderId={order.id}
                                  receiverId={order.buyer_id}
                                  triggerLabel="Open buyer chat"
                                />
                              ) : (
                                <div className="h-full flex items-center justify-center p-4 text-center text-xs text-muted-foreground">
                                  No buyer account attached to chat with.
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── 1. INCOMING ORDER ACCEPT / REJECT DIALOG ── */}
      <Dialog open={showIncomingModal} onOpenChange={setShowIncomingModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-primary font-display font-bold">
              <Bell className="h-5 w-5 text-amber-500 animate-bounce" />
              <DialogTitle className="text-xl">🚨 New Order: Accept or Reject?</DialogTitle>
            </div>
            <DialogDescription className="font-body">
              A customer has placed an order from your store. Accept to start the 15-minute preparation countdown or reject.
            </DialogDescription>
          </DialogHeader>

          {incomingOrder && (
            <div className="space-y-3 py-3 border-y border-border/60">
              <div className="flex justify-between items-center">
                <span className="font-body text-sm text-muted-foreground">Order ID</span>
                <span className="font-display font-bold text-foreground">
                  #{incomingOrder.order_number || incomingOrder.id.slice(0, 8)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-body text-sm text-muted-foreground">Customer</span>
                <span className="font-body text-sm font-semibold text-foreground">
                  {incomingOrder.buyer?.full_name || incomingOrder.buyer?.business_name || "Customer"}
                </span>
              </div>
              {incomingOrder.buyer?.phone && (
                <div className="flex justify-between items-center">
                  <span className="font-body text-sm text-muted-foreground">Phone</span>
                  <span className="font-body text-sm text-foreground">
                    {incomingOrder.buyer.phone}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="font-body text-sm text-muted-foreground">Total Payout</span>
                <span className="font-display font-bold text-emerald-700 text-lg">
                  {formatNaira(Number(incomingOrder.total_amount))}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-body text-sm text-muted-foreground">Delivery Slot</span>
                <span className="font-body text-sm font-medium text-foreground">
                  {incomingOrder.delivery_window || "As soon as possible"}
                </span>
              </div>
              {incomingOrder.delivery_address && (
                <div className="text-xs text-muted-foreground font-body bg-muted/40 p-2.5 rounded-lg">
                  <p className="font-semibold text-foreground mb-0.5">Dropoff Address:</p>
                  <p>{incomingOrder.delivery_address}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="destructive"
              className="font-body"
              onClick={() => {
                if (incomingOrder) {
                  setDeclineOrder(incomingOrder);
                  setShowDeclineModal(true);
                }
                setShowIncomingModal(false);
              }}
            >
              Reject Order
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-body gap-1.5 flex-1 font-semibold"
              onClick={() => incomingOrder && handleAcceptOrder(incomingOrder)}
            >
              <CheckCircle2 className="h-4 w-4" /> Accept (Start 15m Prep)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── 2. PREPARATION FINISHED: READY OR NOT READY DIALOG ── */}
      <Dialog open={showPrepModal} onOpenChange={setShowPrepModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-primary font-display font-bold">
              {is20MinOverdue ? (
                <AlertCircle className="h-5 w-5 text-red-600 animate-pulse" />
              ) : (
                <Clock className="h-5 w-5 text-amber-600" />
              )}
              <DialogTitle className={`text-lg ${is20MinOverdue ? "text-red-700 font-bold" : ""}`}>
                Order #{prepPromptOrder?.order_number || prepPromptOrder?.id.slice(0, 8)}: {is20MinOverdue ? "20-Min Overdue Alert!" : "Ready or Not Ready?"}
              </DialogTitle>
            </div>
            <DialogDescription className="font-body">
              {is20MinOverdue ? (
                <span className="block p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-xs mt-2 space-y-1">
                  <strong className="block font-semibold">⚠️ 20-minute preparation threshold reached.</strong>
                  Urgent notification emails and push alerts have been dispatched. Please click <strong>Ready (Link Driver)</strong> immediately so nearby drivers can pick up.
                </span>
              ) : (
                <span>Preparation time has elapsed (15 mins). Click <strong>Ready</strong> to link available nearby drivers for pickup, or <strong>Not Ready</strong> for an extra 5 minutes.</span>
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
            {!is20MinOverdue && (
              <Button
                variant="outline"
                className="font-body"
                onClick={() => prepPromptOrder && handleExtendPrepTime(prepPromptOrder)}
              >
                Not Ready (+5 mins)
              </Button>
            )}
            <Button
              className={`${is20MinOverdue ? "bg-red-600 hover:bg-red-700" : "bg-primary"} text-primary-foreground font-body gap-1.5 flex-1 font-semibold`}
              disabled={dispatching}
              onClick={() => prepPromptOrder && handleConfirmPreparedAndSend(prepPromptOrder)}
            >
              {dispatching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Ready (Link Driver Now)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── 3. DECLINE ORDER DIALOG ── */}
      <Dialog open={showDeclineModal} onOpenChange={setShowDeclineModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive font-display font-bold">
              <AlertCircle className="h-5 w-5" />
              <DialogTitle className="text-lg">Decline Order</DialogTitle>
            </div>
            <DialogDescription className="font-body">
              Are you sure you want to decline Order #{declineOrder?.order_number || declineOrder?.id.slice(0, 8)}?
              The buyer will be notified.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button variant="outline" className="font-body" onClick={() => setShowDeclineModal(false)}>
              Cancel
            </Button>
            <Button variant="destructive" className="font-body" onClick={handleDeclineOrder}>
              Confirm Decline
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
