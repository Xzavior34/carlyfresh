/**
 * Driver Dashboard - Real-time job feed with availability ranking,
 * automatic GPS location pinging, and Accept/Decline action buttons with cascading reassignment.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Navigation, Package, Wallet, CheckCircle2, TrendingUp, Zap, Loader2, XCircle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { formatNaira } from "@/lib/formatters";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { DashboardSkeleton } from "@/components/ui/DashboardSkeleton";

type DeliveryJob = Tables<"delivery_jobs">;

export default function DriverDashboard() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(true); // Default online for active drivers
  const [jobs, setJobs] = useState<any[]>([]);
  const [myJobs, setMyJobs] = useState<DeliveryJob[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [declining, setDeclining] = useState<string | null>(null);
  const hasHandledParams = useRef(false);

  // 1. Fetch available and assigned jobs
  const fetchAll = useCallback(async () => {
    if (!user) return;
    try {
      const [availRes, myRes, walletRes] = await Promise.all([
        supabase
          .from("delivery_jobs")
          .select("*, orders(order_number, delivery_window, delivery_address, total_amount, items, driver_assignment_deadline)")
          .or(`status.eq.available,and(status.eq.awaiting_driver,driver_id.eq.${user.id})`)
          .order("created_at", { ascending: false }),
        supabase
          .from("delivery_jobs")
          .select("*")
          .eq("driver_id", user.id)
          .order("created_at", { ascending: false }),
        supabase.from("driver_wallet").select("*").eq("driver_id", user.id).maybeSingle(),
      ]);

      if (availRes.data) {
        setJobs(
          availRes.data.map((job: any) => ({
            id: job.id,
            order_id: job.order_id,
            pickup_address: job.pickup_address || "Vendor Location",
            dropoff_address: job.dropoff_address || job.orders?.delivery_address || "Customer Address",
            payout_amount: Number(job.payout_amount || 1500),
            status: job.status,
            sla_deadline: job.sla_deadline || (job.orders as any)?.driver_assignment_deadline,
            created_at: job.created_at,
            orders: job.orders,
          }))
        );
      }
      if (myRes.data) setMyJobs(myRes.data);
      if (walletRes.data) setWalletBalance(Number((walletRes.data as any)?.balance || 0));
    } catch (err: any) {
      console.error("Driver dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 2. Periodic GPS / Availability Location Ping
  useEffect(() => {
    if (!user || !isOnline) return;

    const pingLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            await supabase.from("driver_locations").upsert(
              {
                driver_id: user.id,
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "driver_id" }
            );
          },
          async () => {
            // Fallback ping to keep last_active fresh
            await supabase.from("driver_locations").upsert(
              {
                driver_id: user.id,
                latitude: 6.5244, // Default Lagos/Nigeria coordinates
                longitude: 3.3792,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "driver_id" }
            );
          },
          { enableHighAccuracy: true, timeout: 5000 }
        );
      }
    };

    pingLocation();
    const locInterval = setInterval(pingLocation, 30000); // every 30s
    return () => clearInterval(locInterval);
  }, [user, isOnline]);

  // 3. Handle query params from push notifications (?accept=ID or ?decline=ID)
  useEffect(() => {
    if (!user || hasHandledParams.current) return;

    const acceptOrderId = searchParams.get("accept");
    const declineOrderId = searchParams.get("decline");

    if (acceptOrderId) {
      hasHandledParams.current = true;
      handleAcceptJob("", acceptOrderId);
      setSearchParams({}, { replace: true });
    } else if (declineOrderId) {
      hasHandledParams.current = true;
      handleDeclineJob("", declineOrderId);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, user]);

  useEffect(() => {
    if (!user) return;
    fetchAll();

    if (typeof window !== "undefined" && (window as any).OneSignal) {
      (window as any).OneSignal.User.addTag("role", "driver");
    }

    const ch = supabase
      .channel("driver-jobs-rt-v3")
      .on("postgres_changes", { event: "*", schema: "public", table: "delivery_jobs" }, () => fetchAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => fetchAll());

    ch.subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, fetchAll]);

  // 4. Accept Delivery Action Handler
  const handleAcceptJob = async (jobId: string, orderId: string) => {
    if (!user || accepting) return;
    setAccepting(jobId || orderId);

    try {
      const { data, error } = await supabase.functions.invoke("order-action", {
        body: {
          action: "driver_accept",
          order_id: orderId,
          driver_id: user.id,
        },
      });

      if (error || (data && !data.ok && data.error)) {
        throw new Error(error?.message || data?.error || "Another driver already claimed this delivery.");
      }

      toast.success("🚚 Delivery Accepted! Navigating to Active Route...");
      fetchAll();
      navigate("/driver/active");
    } catch (err: any) {
      toast.error(err.message || "Failed to accept job");
      fetchAll();
    } finally {
      setAccepting(null);
    }
  };

  // 5. Decline Delivery Action Handler (Cascades to next available driver)
  const handleDeclineJob = async (jobId: string, orderId: string) => {
    if (!user || declining) return;
    setDeclining(jobId || orderId);

    try {
      const { data, error } = await supabase.functions.invoke("order-action", {
        body: {
          action: "driver_decline",
          order_id: orderId,
          driver_id: user.id,
        },
      });

      if (error || (data && !data.ok && data.error)) {
        throw new Error(error?.message || data?.error || "Failed to decline job");
      }

      toast.info("Delivery passed. System has automatically re-assigned it to the next available driver.");
      setJobs((prev) => prev.filter((j) => j.order_id !== orderId));
      fetchAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to decline job");
    } finally {
      setDeclining(null);
    }
  };

  const completedJobs = myJobs?.filter((j) => j?.status === "completed") ?? [];
  const activeJobs = myJobs?.filter((j) => j?.status === "accepted" || j?.status === "in-transit") ?? [];

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">Driver Dashboard</h1>
        <p className="text-muted-foreground font-body mt-1">
          Accept deliveries in real time based on smart availability routing.
        </p>
      </div>

      {/* Online Status Card */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
        <Card
          className={`border-2 transition-all duration-300 ${
            isOnline ? "border-primary bg-gradient-to-br from-primary/5 to-primary/10" : "border-border bg-card"
          }`}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={`relative h-14 w-14 rounded-2xl flex items-center justify-center transition-all ${
                    isOnline ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Zap className="h-7 w-7" />
                  {isOnline && <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-emerald-400 border-2 border-card animate-pulse" />}
                </div>
                <div>
                  <p className="font-display text-xl font-bold text-foreground">{isOnline ? "Online & Ready" : "Offline"}</p>
                  <p className="font-body text-xs text-muted-foreground">
                    {isOnline ? "Broadcasting live GPS availability to receive express dispatch orders" : "Toggle on to receive delivery notifications"}
                  </p>
                </div>
              </div>
              <Switch checked={isOnline} onCheckedChange={setIsOnline} className="h-8 w-14 data-[state=checked]:bg-primary" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Wallet Balance", value: formatNaira(walletBalance), icon: Wallet, accent: "text-primary" },
          { label: "Completed", value: completedJobs.length.toString(), icon: CheckCircle2, accent: "text-emerald-500" },
          { label: "Active Route", value: activeJobs.length.toString(), icon: Package, accent: "text-amber-500" },
          { label: "Available Offers", value: (jobs?.length ?? 0).toString(), icon: TrendingUp, accent: "text-primary" },
        ].map((item) => (
          <Card key={item.label} className="border border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <item.icon className={`h-4 w-4 ${item.accent}`} />
                <span className="text-[10px] font-body uppercase tracking-wider text-muted-foreground">{item.label}</span>
              </div>
              <p className="font-display text-lg font-bold text-foreground">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Available Deliveries with Accept/Decline Action Buttons */}
      <Card className="border border-border shadow-sm">
        <CardHeader className="pb-3 border-b border-border/50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Navigation className="h-5 w-5 text-primary" />
              Incoming Delivery Requests
            </CardTitle>
            <Badge variant="secondary" className="font-body text-xs">
              {jobs.length} Available
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <AnimatePresence>
            {jobs?.map((job) => {
              const isMyOffer = job.status === "awaiting_driver";
              return (
                <motion.div
                  key={job.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`rounded-2xl border p-4 transition-all ${
                    isMyOffer
                      ? "border-primary/50 bg-primary/5 shadow-md"
                      : "border-border hover:border-primary/30 hover:bg-muted/30"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={isMyOffer ? "default" : "outline"} className="text-[11px] font-body capitalize">
                        {isMyOffer ? "🚨 Offered to You" : "Available"}
                      </Badge>
                      <span className="font-display text-xs font-bold text-foreground">
                        {job.orders?.order_number ? `Order #${job.orders.order_number}` : `Delivery #${job.id.slice(0, 8)}`}
                      </span>
                    </div>
                    <span className="font-display text-lg font-bold text-primary">
                      {formatNaira(Number(job.payout_amount ?? 1500))}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs font-body text-foreground">
                    <p className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-muted-foreground">Pickup:</strong> {job.pickup_address}
                      </span>
                    </p>
                    <p className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-muted-foreground">Dropoff:</strong> {job.dropoff_address}
                      </span>
                    </p>
                    {job.orders?.delivery_window && (
                      <p className="flex items-center gap-2 text-[11px] text-muted-foreground pt-1">
                        <Clock className="h-3.5 w-3.5 text-primary" />
                        <span>Window: <strong className="text-foreground">{job.orders.delivery_window}</strong></span>
                      </p>
                    )}
                  </div>

                  {/* Accept / Decline Action Buttons */}
                  <div className="flex items-center justify-end gap-2.5 mt-4 pt-3 border-t border-border/50">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs font-body text-muted-foreground hover:text-destructive hover:bg-destructive/10 border-border"
                      disabled={!isOnline || declining === job.id || accepting === job.id}
                      onClick={() => handleDeclineJob(job.id, job.order_id)}
                    >
                      {declining === job.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3.5 w-3.5 mr-1" />}
                      Decline
                    </Button>

                    <Button
                      size="sm"
                      className="h-8 text-xs font-body font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow gap-1.5"
                      disabled={!isOnline || accepting === job.id || declining === job.id}
                      onClick={() => handleAcceptJob(job.id, job.order_id)}
                    >
                      {accepting === job.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                      Accept Delivery
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {(jobs?.length ?? 0) === 0 && (
            <div className="flex flex-col items-center py-12 text-center">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3 text-primary">
                <Navigation className="h-7 w-7" />
              </div>
              <p className="font-display text-base font-semibold text-foreground mb-1">No available deliveries</p>
              <p className="font-body text-xs text-muted-foreground max-w-xs">
                As soon as a store marks an order ready, nearby drivers are ranked and offered the order in real time.
              </p>
            </div>
          )}

          {!isOnline && (
            <p className="text-center font-body text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-lg">
              ⚠️ You are currently offline. Switch on to accept deliveries and update your availability markers.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
