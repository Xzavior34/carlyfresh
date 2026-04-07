/**
 * Driver Active Route — shows accepted/in-transit jobs with status update buttons
 */
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2, Navigation, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { formatNaira } from "@/lib/formatters";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "@/hooks/use-toast";
import { DashboardSkeleton } from "@/components/ui/DashboardSkeleton";

type DeliveryJob = Tables<"delivery_jobs">;

export default function DriverActive() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<DeliveryJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchJobs = async () => {
    if (!user) return;
    const { data } = await supabase.from("delivery_jobs").select("*").eq("driver_id", user.id).in("status", ["accepted", "in-transit"]).order("created_at", { ascending: false });
    if (data) setJobs(data);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    fetchJobs();
    const ch = supabase.channel("driver-active-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "delivery_jobs", filter: `driver_id=eq.${user.id}` }, () => fetchJobs())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const updateStatus = async (jobId: string, newStatus: string) => {
    setUpdating(jobId);
    const { error } = await supabase.from("delivery_jobs").update({ status: newStatus as any }).eq("id", jobId);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: `Status updated to ${newStatus}` });
    setUpdating(null);
  };

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Active Route</h1>
        <p className="text-muted-foreground font-body text-sm">Your current deliveries in progress</p>
      </div>
      {jobs.length === 0 ? (
        <Card className="border border-border">
          <CardContent className="py-12 text-center">
            <Navigation className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="font-body text-muted-foreground">No active deliveries. Accept a job to get started!</p>
          </CardContent>
        </Card>
      ) : (
        jobs.map(job => (
          <Card key={job.id} className="border border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-display">Delivery #{job.id.slice(0, 8)}</CardTitle>
                <Badge variant="secondary" className="font-body text-[10px] capitalize">{job.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="font-body text-sm"><span className="text-muted-foreground">Pickup:</span> {job.pickup_address}</p>
              <p className="font-body text-sm"><span className="text-muted-foreground">Dropoff:</span> {job.dropoff_address}</p>
              <p className="font-body text-sm font-semibold text-primary">{formatNaira(Number(job.payout_amount))}</p>
              <div className="flex gap-2 pt-2">
                {job.status === "accepted" && (
                  <Button size="sm" className="font-body gap-1" onClick={() => updateStatus(job.id, "in-transit")} disabled={updating === job.id}>
                    {updating === job.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <MapPin className="h-3 w-3" />} Start Delivery
                  </Button>
                )}
                {job.status === "in-transit" && (
                  <Button size="sm" className="font-body gap-1 bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => updateStatus(job.id, "completed")} disabled={updating === job.id}>
                    {updating === job.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />} Mark Delivered
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
