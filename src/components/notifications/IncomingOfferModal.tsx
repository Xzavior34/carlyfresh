import React, { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navigation, ShoppingBag, MapPin, Clock, CheckCircle2, XCircle, Loader2, AlertTriangle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { formatNaira } from "@/lib/formatters";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface OfferDetails {
  id: string;
  order_id: string;
  order_number: number | null;
  type: "driver_delivery" | "vendor_order";
  payout_amount?: number;
  total_amount?: number;
  pickup_address?: string;
  dropoff_address?: string;
  items_summary?: string;
  timeout_seconds: number;
  deadline_timestamp: number;
}

export default function IncomingOfferModal() {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [currentOffer, setCurrentOffer] = useState<OfferDetails | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Play subtle sound alert when offer arrives
  const playAlertSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch (e) {
      // Ignore audio error if user hasn't interacted with document
    }
  };

  const handleDeclineOffer = useCallback(async (isTimeout = false) => {
    if (!currentOffer || !user || isProcessing) return;
    setIsProcessing(true);

    try {
      const isDriver = currentOffer.type === "driver_delivery";
      const edgeAction = isDriver ? "driver_decline" : "vendor_decline";

      await supabase.functions.invoke("order-action", {
        body: {
          action: edgeAction,
          order_id: currentOffer.order_id,
          driver_id: isDriver ? user.id : undefined,
          vendor_id: !isDriver ? user.id : undefined,
          reason: isTimeout ? "sla_timeout" : "declined_by_user",
        },
      });

      if (isTimeout) {
        toast.info("⏳ Offer expired. The order has been automatically assigned to the next available provider.");
      } else {
        toast.info("Offer declined. System is assigning to the next available candidate.");
      }
    } catch (err: any) {
      console.error("Error declining offer:", err);
    } finally {
      setIsProcessing(false);
      setCurrentOffer(null);
      setIsExpired(false);
    }
  }, [currentOffer, user, isProcessing]);

  // Real-time countdown timer loop
  useEffect(() => {
    if (!currentOffer) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((currentOffer.deadline_timestamp - now) / 1000));
      setSecondsRemaining(remaining);

      if (remaining === 0) {
        clearInterval(interval);
        setIsExpired(true);
        // Automatically cascade to next candidate upon expiry
        handleDeclineOffer(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentOffer, handleDeclineOffer]);

  // Real-time subscriptions for Drivers & Vendors
  useEffect(() => {
    if (!user) return;

    // 1. Check for pending delivery offers (Drivers)
    const checkDriverOffers = async () => {
      const { data: job } = await supabase
        .from("delivery_jobs")
        .select("*, orders(order_number, total_amount, items, delivery_address, driver_assignment_deadline)")
        .eq("driver_id", user.id)
        .eq("status", "awaiting_driver")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (job) {
        const deadlineIso = job.sla_deadline || (job.orders as any)?.driver_assignment_deadline;
        const deadlineTs = deadlineIso ? new Date(deadlineIso).getTime() : Date.now() + 90000;
        if (deadlineTs > Date.now()) {
          playAlertSound();
          setCurrentOffer({
            id: job.id,
            order_id: job.order_id,
            order_number: (job.orders as any)?.order_number || null,
            type: "driver_delivery",
            payout_amount: Number(job.payout_amount || 1500),
            pickup_address: job.pickup_address,
            dropoff_address: job.dropoff_address || (job.orders as any)?.delivery_address,
            timeout_seconds: Math.ceil((deadlineTs - Date.now()) / 1000),
            deadline_timestamp: deadlineTs,
          });
        }
      }
    };

    // 2. Check for pending orders (Vendors)
    const checkVendorOffers = async () => {
      const { data: ord } = await supabase
        .from("orders")
        .select("id, order_number, total_amount, items, supplier_response_deadline, status, delivery_address")
        .eq("vendor_id", user.id)
        .in("status", ["pending", "awaiting_supplier"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (ord) {
        const deadlineIso = ord.supplier_response_deadline;
        const deadlineTs = deadlineIso ? new Date(deadlineIso).getTime() : Date.now() + 300000; // 5m default
        if (deadlineTs > Date.now()) {
          const itemsArr = Array.isArray(ord.items) ? ord.items : [];
          const itemsSummary = itemsArr.map((i: any) => `${i.quantity || 1}x ${i.name || "Item"}`).join(", ");
          playAlertSound();
          setCurrentOffer({
            id: ord.id,
            order_id: ord.id,
            order_number: ord.order_number,
            type: "vendor_order",
            total_amount: Number(ord.total_amount || 0),
            items_summary: itemsSummary || "Fresh Produce Bundle",
            dropoff_address: ord.delivery_address,
            timeout_seconds: Math.ceil((deadlineTs - Date.now()) / 1000),
            deadline_timestamp: deadlineTs,
          });
        }
      }
    };

    checkDriverOffers();
    checkVendorOffers();

    // Listen for real-time delivery_jobs updates
    const channel = supabase
      .channel(`incoming-offers-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "delivery_jobs", filter: `driver_id=eq.${user.id}` },
        (payload) => {
          if (payload.new && (payload.new as any).status === "awaiting_driver") {
            checkDriverOffers();
          } else if (payload.new && (payload.new as any).status !== "awaiting_driver") {
            setCurrentOffer((prev) => (prev?.id === (payload.new as any).id ? null : prev));
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `vendor_id=eq.${user.id}` },
        (payload) => {
          if (payload.new && ["pending", "awaiting_supplier"].includes((payload.new as any).status)) {
            checkVendorOffers();
          } else if (payload.new && !["pending", "awaiting_supplier"].includes((payload.new as any).status)) {
            setCurrentOffer((prev) => (prev?.order_id === (payload.new as any).id ? null : prev));
          }
        }
      );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleAcceptOffer = async () => {
    if (!currentOffer || !user || isProcessing) return;
    setIsProcessing(true);

    try {
      const isDriver = currentOffer.type === "driver_delivery";
      const edgeAction = isDriver ? "driver_accept" : "vendor_accept";

      const { data, error } = await supabase.functions.invoke("order-action", {
        body: {
          action: edgeAction,
          order_id: currentOffer.order_id,
          driver_id: isDriver ? user.id : undefined,
          vendor_id: !isDriver ? user.id : undefined,
        },
      });

      if (error || (data && !data.ok && data.error)) {
        throw new Error(error?.message || data?.error || "Failed to confirm acceptance");
      }

      if (isDriver) {
        toast.success("🎉 Delivery Accepted! Navigating to Active Route...");
        navigate("/driver/active");
      } else {
        toast.success("🎉 Order Accepted! 15-minute preparation window started.");
        navigate("/vendor/orders");
      }

      setCurrentOffer(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to accept offer");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!currentOffer) return null;

  const orderLabel = currentOffer.order_number
    ? `#${currentOffer.order_number}`
    : `#${currentOffer.order_id.slice(0, 8)}`;

  const maxDuration = currentOffer.timeout_seconds || 90;
  const progressPct = Math.max(0, Math.min(100, (secondsRemaining / maxDuration) * 100));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="relative w-full max-w-lg bg-card rounded-2xl border-2 border-primary shadow-2xl overflow-hidden"
        >
          {/* Top Countdown Progress Bar */}
          <div className="w-full bg-muted h-2">
            <motion.div
              className={`h-full transition-all duration-1000 ${
                secondsRemaining <= 15 ? "bg-destructive animate-pulse" : "bg-primary"
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <div className="p-6 space-y-5">
            {/* Header with Live Pulse */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  {currentOffer.type === "driver_delivery" ? (
                    <Navigation className="h-6 w-6 animate-pulse" />
                  ) : (
                    <ShoppingBag className="h-6 w-6 animate-pulse" />
                  )}
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
                  </span>
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-foreground">
                    {currentOffer.type === "driver_delivery"
                      ? "🚨 Incoming Delivery Offer"
                      : "🎉 Incoming Store Order"}
                  </h3>
                  <p className="font-body text-xs text-muted-foreground">
                    Assigned to you based on your availability markers
                  </p>
                </div>
              </div>

              {/* Timer Badge */}
              <Badge
                variant={secondsRemaining <= 15 ? "destructive" : "secondary"}
                className="font-body text-xs font-semibold px-2.5 py-1 gap-1"
              >
                <Clock className="h-3.5 w-3.5" />
                <span>{secondsRemaining}s</span>
              </Badge>
            </div>

            {/* Order Card Summary */}
            <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <span className="font-display text-sm font-semibold text-foreground">
                  Order {orderLabel}
                </span>
                <span className="font-display text-lg font-bold text-primary">
                  {currentOffer.type === "driver_delivery"
                    ? formatNaira(currentOffer.payout_amount || 1500)
                    : formatNaira(currentOffer.total_amount || 0)}
                </span>
              </div>

              {currentOffer.type === "driver_delivery" ? (
                <div className="space-y-2 text-xs font-body">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <span className="text-muted-foreground font-medium">Pickup: </span>
                      <span className="text-foreground font-semibold">{currentOffer.pickup_address || "Vendor Farm / Store"}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                    <div>
                      <span className="text-muted-foreground font-medium">Dropoff: </span>
                      <span className="text-foreground font-semibold">{currentOffer.dropoff_address || "Customer Location"}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5 text-xs font-body">
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Items: </span>
                    {currentOffer.items_summary}
                  </p>
                  {currentOffer.dropoff_address && (
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">Delivery to: </span>
                      {currentOffer.dropoff_address}
                    </p>
                  )}
                </div>
              )}
            </div>

            <p className="text-[11px] font-body text-center text-muted-foreground">
              ⚠️ If you do not confirm within <strong className="text-foreground">{secondsRemaining} seconds</strong>, the system will automatically reassign this order to the next available candidate.
            </p>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                variant="outline"
                size="lg"
                disabled={isProcessing}
                onClick={() => handleDeclineOffer(false)}
                className="font-body text-sm font-medium border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 gap-1.5"
              >
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                Decline (Pass)
              </Button>

              <Button
                size="lg"
                disabled={isProcessing}
                onClick={handleAcceptOffer}
                className="font-body text-sm font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg gap-1.5"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                {currentOffer.type === "driver_delivery" ? "Accept Delivery" : "Accept Order"}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
