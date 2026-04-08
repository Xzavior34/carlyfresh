/**
 * Driver Active Route — shows accepted/in-transit jobs with status update buttons
 */
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2, Navigation, CheckCircle2, ExternalLink, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { formatNaira } from "@/lib/formatters";
import { toast } from "@/hooks/use-toast";
import { DashboardSkeleton } from "@/components/ui/DashboardSkeleton";

interface OrderItem {
  name: string;
  quantity: number;
  unit?: string;
  price: number;
}

interface JobWithOrder {
  id: string;
  order_id: string;
  pickup_address: string;
  dropoff_address: string;
  payout_amount: number;
  status: string;
  created_at: string;
  order_items: OrderItem[];
  order_number: number | null;
  order_total: number;
}

export default function DriverActive() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<JobWithOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchJobs = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("delivery_jobs")
      .select("*, orders(order_number, total_amount, items)")
      .eq("driver_id", user.id)
      .in("status", ["accepted", "in-transit"])
      .order("created_at", { ascending: false });

    if (data) {
      const mapped: JobWithOrder[] = data.map((job: any) => ({
        id: job.id,
        order_id: job.order_id,
        pickup_address: job.pickup_address,
        dropoff_address: job.dropoff_address,
        payout_amount: job.payout_amount,
        status: job.status,
        created_at: job.created_at,
        order_items: Array.isArray(job.orders?.items) ? job.orders.items : [],
        order_number: job.orders?.order_number ?? null,
        order_total: job.orders?.total_amount ?? 0,
      }));
      setJobs(mapped);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    fetchJobs();
    const ch = supabase
      .channel("driver-active-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "delivery_jobs", filter: `driver_id=eq.${user.id}` }, () => fetchJobs())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const updateStatus = async (jobId: string, newStatus: string) => {
    setUpdating(jobId);
    const { error } = await supabase.from("delivery_jobs").update({ status: newStatus as any }).eq("id", jobId);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: newStatus === "completed" ? "Delivery completed! Payment added to wallet." : `Status updated to ${newStatus}` });
    setUpdating(null);
  };

  const openNavigation = (address: string) => {
    const encoded = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encoded}`, "_blank");
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
                <CardTitle className="text-base font-display">
                  {job.order_number ? `Order #${job.order_number}` : `Delivery #${job.id.slice(0, 8)}`}
                </CardTitle>
                <Badge variant="secondary" className="font-body text-[10px] capitalize">{job.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Addresses */}
              <div className="space-y-1.5">
                <p className="font-body text-sm flex items-start gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  <span><span className="text-muted-foreground font-medium">Pickup:</span> {job.pickup_address}</span>
                </p>
                <p className="font-body text-sm flex items-start gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />
                  <span><span className="text-muted-foreground font-medium">Dropoff:</span> {job.dropoff_address}</span>
                </p>
              </div>

              {/* Order Items */}
              {job.order_items.length > 0 && (
                <div className="bg-muted/50 rounded-md p-3 space-y-1">
                  <p className="font-body text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Package className="h-3 w-3" /> Items
                  </p>
                  {job.order_items.map((item, idx) => (
                    <p key={idx} className="font-body text-sm text-foreground">
                      {item.name} ({item.quantity} {item.unit || "pc"})
                    </p>
                  ))}
                </div>
              )}

              {/* Payout */}
              <p className="font-body text-sm font-semibold text-primary">{formatNaira(Number(job.payout_amount))} payout</p>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-2">
                {/* Navigate */}
                <Button
                  size="sm"
                  variant="outline"
                  className="font-body gap-1"
                  onClick={() => openNavigation(job.status === "accepted" ? job.pickup_address : job.dropoff_address)}
                >
                  <ExternalLink className="h-3 w-3" /> View Route
                </Button>

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
