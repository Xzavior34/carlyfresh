import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { formatNaira } from "@/lib/formatters";
import type { Tables } from "@/integrations/supabase/types";

type DeliveryJob = Tables<"delivery_jobs">;

export default function DriverActive() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<DeliveryJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase.from("delivery_jobs").select("*").eq("driver_id", user.id).in("status", ["accepted", "in-transit"]).order("created_at", { ascending: false });
      if (data) setJobs(data);
      setLoading(false);
    };
    fetch();
  }, [user]);

  if (loading) return <p className="text-muted-foreground font-body p-8">Loading…</p>;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Active Route</h1>
        <p className="text-muted-foreground font-body text-sm">Your current deliveries in progress</p>
      </div>
      {jobs.length === 0 ? (
        <Card className="border border-border">
          <CardContent className="py-12 text-center">
            <MapPin className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="font-body text-muted-foreground">No active deliveries. Accept a job to get started!</p>
          </CardContent>
        </Card>
      ) : (
        jobs.map((job) => (
          <Card key={job.id} className="border border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-display">Delivery #{job.id.slice(0, 8)}</CardTitle>
                <Badge variant="secondary" className="font-body text-[10px] bg-blue-100 text-blue-800">{job.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-body text-sm"><span className="text-muted-foreground">Pickup:</span> {job.pickup_address}</p>
              <p className="font-body text-sm"><span className="text-muted-foreground">Dropoff:</span> {job.dropoff_address}</p>
              <p className="font-body text-sm font-semibold text-primary">{formatNaira(Number(job.payout_amount))}</p>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
