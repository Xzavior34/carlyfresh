/**
 * Driver Dashboard - Real-time job feed with atomic claim_order RPC
 * FIXED: handleAcceptJob calls claim_order RPC (race-condition safe fastest-finger)
 * Realtime channel watches delivery_jobs for live updates
 */
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Navigation, Package, Wallet, CheckCircle2, TrendingUp, Zap, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { formatNaira } from "@/lib/formatters";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "@/hooks/use-toast";
import { DashboardSkeleton } from "@/components/ui/DashboardSkeleton";

type DeliveryJob = Tables<"delivery_jobs">;

export default function DriverDashboard() {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [myJobs, setMyJobs] = useState<DeliveryJob[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    try {
      const [availRes, myRes, walletRes] = await Promise.all([
        supabase.from("delivery_jobs")
          .select("*, orders(order_number, delivery_window, delivery_address, total_amount, items)")
          .eq("status", "available").is("driver_id", null).order("created_at", { ascending: false }),
        supabase.from("delivery_jobs").select("*").eq("driver_id", user.id).order("created_at", { ascending: false }),
        supabase.from("driver_wallet").select("*").eq("driver_id", user.id).maybeSingle(),
      ]);
      if (availRes.data) {
        setJobs(availRes.data.map((job: any) => ({
          id: job.id, order_id: job.order_id,
          pickup_address: job.pickup_address || "Vendor Location",
          dropoff_address: job.dropoff_address || job.orders?.delivery_address || "Customer Address",
          payout_amount: Number(job.payout_amount || 1500),
          status: "available", created_at: job.created_at, orders: job.orders,
        })));
      }
      if (myRes.data) setMyJobs(myRes.data);
      if (walletRes.data) setWalletBalance(Number((walletRes.data as any)?.balance || 0));
    } catch (err: any) { console.error("Driver dashboard fetch error:", err); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchAll();
    const ch = supabase.channel("driver-jobs-rt-v2")
      .on("postgres_changes", { event: "*", schema: "public", table: "delivery_jobs" }, () => fetchAll());
    ch.subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, fetchAll]);

  // Atomic claim via RPC - only the first driver wins, no double-booking
  const handleAcceptJob = async (jobId: string, orderId: string) => {
    if (!user || accepting) return;
    setAccepting(jobId);
    try {
      const { data: claimed, error } = await supabase.rpc("claim_order" as any, {
        p_order_id: orderId,
        p_driver_id: user.id,
      });
      if (error) throw error;
      if (claimed) {
        toast({ title: "Job Accepted! 🚚", description: "Head to the pickup address." });
        fetchAll();
      } else {
        toast({ title: "Too Slow! ⚡", description: "Another driver already claimed this delivery.", variant: "destructive" });
        setJobs(prev => prev.filter(j => j.order_id !== orderId));
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to accept job", variant: "destructive" });
    } finally { setAccepting(null); }
  };

  const completedJobs = myJobs?.filter(j => j?.status === "completed") ?? [];
  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">Driver Dashboard</h1>
        <p className="text-muted-foreground font-body mt-1">Manage your deliveries and track earnings.</p>
      </div>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
        <Card className={`border-2 transition-all duration-500 ${isOnline ? "border-primary bg-gradient-to-br from-primary/5 to-primary/10" : "border-border bg-card"}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`relative h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${isOnline ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  <Zap className="h-7 w-7" />
                  {isOnline && <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-accent border-2 border-card animate-pulse" />}
                </div>
                <div>
                  <p className="font-display text-xl font-bold text-foreground">{isOnline ? "Online" : "Offline"}</p>
                  <p className="font-body text-sm text-muted-foreground">{isOnline ? "Accepting deliveries" : "Toggle to start"}</p>
                </div>
              </div>
              <Switch checked={isOnline} onCheckedChange={setIsOnline} className="h-8 w-14 data-[state=checked]:bg-primary" />
            </div>
          </CardContent>
        </Card>
      </motion.div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Wallet", value: formatNaira(walletBalance), icon: Wallet, accent: "text-primary" },
          { label: "Completed", value: completedJobs.length.toString(), icon: CheckCircle2, accent: "text-accent" },
          { label: "Available", value: (jobs?.length ?? 0).toString(), icon: TrendingUp, accent: "text-primary" },
          { label: "Accepted", value: (myJobs?.filter(j => j?.status === "accepted")?.length ?? 0).toString(), icon: Package, accent: "text-accent" },
        ].map(item => (
          <Card key={item.label} className="border border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2"><item.icon className={`h-4 w-4 ${item.accent}`} /><span className="text-[10px] font-body uppercase tracking-wider text-muted-foreground">{item.label}</span></div>
              <p className="font-display text-lg font-bold text-foreground">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="border border-border">
        <CardHeader className="pb-3"><CardTitle className="text-lg font-display flex items-center gap-2"><Navigation className="h-5 w-5 text-primary" /> Available Jobs</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <AnimatePresence>
            {jobs?.map(job => (
              <motion.div key={job.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -100 }}
                className="rounded-xl border p-4 transition-all border-border hover:border-primary/20 hover:bg-muted/20">
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center gap-1 pt-1">
                    <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                    <div className="w-px h-8 bg-border" />
                    <div className="h-2.5 w-2.5 rounded-full bg-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2"><span className="text-[10px] font-body uppercase text-muted-foreground">Pickup</span><Badge variant="secondary" className="text-[10px] font-body">{job?.id?.slice(0, 8) || "N/A"}</Badge></div>
                    <p className="font-body text-sm font-medium text-foreground truncate">{job?.pickup_address || "N/A"}</p>
                    <div className="mt-3"><span className="text-[10px] font-body uppercase text-muted-foreground">Dropoff</span><p className="font-body text-sm font-medium text-foreground">{job?.dropoff_address || "N/A"}</p></div>
                    {(job as any)?.orders?.delivery_window && <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 font-body text-[11px] font-semibold text-primary"><Navigation className="h-3 w-3" /> {(job as any).orders.delivery_window}</p>}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
                  <div className="flex items-center gap-1 text-xs font-body text-muted-foreground"><MapPin className="h-3 w-3" /> Delivery</div>
                  <div className="flex items-center gap-3">
                    <span className="font-display text-lg font-bold text-primary">{formatNaira(Number(job?.payout_amount ?? 0))}</span>
                    <Button size="sm" className="font-body text-xs bg-primary hover:bg-primary/90 gap-1" onClick={() => handleAcceptJob(job.id, job.order_id)} disabled={!isOnline || accepting === job.id}>
                      {accepting === job.id ? <Loader2 className="h-3 w-3 animate-spin" /> : null} Accept Delivery
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {(jobs?.length ?? 0) === 0 && (
            <div className="flex flex-col items-center py-10">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3"><Navigation className="h-7 w-7 text-primary" /></div>
              <p className="font-display text-base font-semibold text-foreground mb-1">No available jobs</p>
              <p className="font-body text-sm text-muted-foreground max-w-xs text-center">New delivery requests appear here in real time.</p>
            </div>
          )}
          {!isOnline && (jobs?.length ?? 0) > 0 && <p className="text-center font-body text-sm text-muted-foreground py-2">Go online to accept delivery jobs.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
