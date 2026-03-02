/**
 * Driver Dashboard — Mobile-Optimized Portal
 * DATA SOURCE: Live Supabase — delivery_jobs table
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Navigation,
  Package,
  Wallet,
  CheckCircle2,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { formatNaira } from "@/lib/mockDashboardData";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "@/hooks/use-toast";

type DeliveryJob = Tables<"delivery_jobs">;

export default function DriverDashboard() {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(false);
  const [jobs, setJobs] = useState<DeliveryJob[]>([]);
  const [myJobs, setMyJobs] = useState<DeliveryJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchJobs = async () => {
      const [availRes, myRes] = await Promise.all([
        supabase.from("delivery_jobs").select("*").eq("status", "available").order("created_at", { ascending: false }),
        supabase.from("delivery_jobs").select("*").eq("driver_id", user.id).order("created_at", { ascending: false }),
      ]);
      if (availRes.data) setJobs(availRes.data);
      if (myRes.data) setMyJobs(myRes.data);
      setLoading(false);
    };
    fetchJobs();
  }, [user]);

  const handleAcceptJob = async (jobId: string) => {
    if (!user) return;
    const { error } = await supabase
      .from("delivery_jobs")
      .update({ driver_id: user.id, status: "accepted" as any })
      .eq("id", jobId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    // Move from available to my jobs
    const accepted = jobs.find((j) => j.id === jobId);
    if (accepted) {
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
      setMyJobs((prev) => [{ ...accepted, driver_id: user.id, status: "accepted" }, ...prev]);
    }
    toast({ title: "Job accepted!" });
  };

  // Earnings from completed jobs
  const completedJobs = myJobs.filter((j) => j.status === "completed");
  const todayEarnings = completedJobs.reduce((sum, j) => sum + Number(j.payout_amount), 0);
  const totalTrips = completedJobs.length;

  if (loading) return <p className="text-muted-foreground font-body p-8">Loading dashboard…</p>;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
          Driver Dashboard
        </h1>
        <p className="text-muted-foreground font-body mt-1">
          Manage your deliveries and track earnings.
        </p>
      </div>

      {/* STATUS TOGGLE */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <Card
          className={`border-2 transition-all duration-500 ${
            isOnline
              ? "border-primary bg-gradient-to-br from-primary/5 to-primary/10"
              : "border-border bg-card"
          }`}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={`relative h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                    isOnline ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Zap className="h-7 w-7" />
                  {isOnline && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-accent border-2 border-card animate-pulse" />
                  )}
                </div>
                <div>
                  <p className="font-display text-xl font-bold text-foreground">
                    {isOnline ? "Online" : "Offline"}
                  </p>
                  <p className="font-body text-sm text-muted-foreground">
                    {isOnline ? "Accepting deliveries" : "Toggle to start accepting jobs"}
                  </p>
                </div>
              </div>
              <Switch
                checked={isOnline}
                onCheckedChange={setIsOnline}
                className="h-8 w-14 data-[state=checked]:bg-primary"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Earnings Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Earnings", value: formatNaira(todayEarnings), icon: Wallet, accent: "text-primary" },
            { label: "Completed", value: totalTrips.toString(), icon: CheckCircle2, accent: "text-accent" },
            { label: "Available", value: jobs.length.toString(), icon: TrendingUp, accent: "text-primary" },
            { label: "Accepted", value: myJobs.filter((j) => j.status === "accepted").length.toString(), icon: Package, accent: "text-accent" },
          ].map((item) => (
            <Card key={item.label} className="border border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <item.icon className={`h-4 w-4 ${item.accent}`} />
                  <span className="text-[10px] font-body uppercase tracking-wider text-muted-foreground">
                    {item.label}
                  </span>
                </div>
                <p className="font-display text-lg font-bold text-foreground">{item.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>

      {/* Available Jobs Feed */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <Card className="border border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Navigation className="h-5 w-5 text-primary" />
              Available Jobs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <AnimatePresence>
              {jobs.map((job) => (
                <motion.div
                  key={job.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className="rounded-xl border p-4 transition-all border-border hover:border-primary/20 hover:bg-muted/20"
                >
                  {/* Route */}
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center gap-1 pt-1">
                      <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                      <div className="w-px h-8 bg-border" />
                      <div className="h-2.5 w-2.5 rounded-full bg-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-body uppercase text-muted-foreground">Pickup</span>
                        <Badge variant="secondary" className="text-[10px] font-body">{job.id.slice(0, 8)}</Badge>
                      </div>
                      <p className="font-body text-sm font-medium text-foreground truncate">
                        {job.pickup_address}
                      </p>

                      <div className="mt-3">
                        <span className="text-[10px] font-body uppercase text-muted-foreground">Dropoff</span>
                        <p className="font-body text-sm font-medium text-foreground">
                          {job.dropoff_address}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 text-xs font-body text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        Delivery
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-display text-lg font-bold text-primary">
                        {formatNaira(Number(job.payout_amount))}
                      </span>
                      <Button
                        size="sm"
                        className="font-body text-xs bg-primary hover:bg-primary/90"
                        onClick={() => handleAcceptJob(job.id)}
                        disabled={!isOnline}
                      >
                        Accept Job
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {jobs.length === 0 && (
              <p className="text-center font-body text-sm text-muted-foreground py-4">
                No available jobs right now.
              </p>
            )}

            {!isOnline && jobs.length > 0 && (
              <p className="text-center font-body text-sm text-muted-foreground py-2">
                Go online to accept delivery jobs.
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
