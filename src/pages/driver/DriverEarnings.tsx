import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { formatNaira } from "@/lib/formatters";
import type { Tables } from "@/integrations/supabase/types";

type DeliveryJob = Tables<"delivery_jobs">;

export default function DriverEarnings() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<DeliveryJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase.from("delivery_jobs").select("*").eq("driver_id", user.id).eq("status", "completed").order("created_at", { ascending: false });
      if (data) setJobs(data);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const totalEarnings = jobs.reduce((sum, j) => sum + Number(j.payout_amount), 0);

  if (loading) return <p className="text-muted-foreground font-body p-8">Loading…</p>;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Earnings</h1>
        <p className="text-muted-foreground font-body text-sm">Track your completed deliveries and income</p>
      </div>

      <Card className="border-2 border-primary/20 bg-gradient-to-br from-card to-primary/[0.03]">
        <CardContent className="p-6 flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center">
            <Wallet className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <p className="text-xs font-body text-muted-foreground uppercase tracking-wide">Total Earnings</p>
            <p className="text-3xl font-display font-bold text-foreground">{formatNaira(totalEarnings)}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-display flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" /> Completed Deliveries
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {jobs.length === 0 ? (
            <p className="text-center font-body text-sm text-muted-foreground py-4">No completed deliveries yet.</p>
          ) : (
            jobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50">
                <div>
                  <p className="font-body text-sm font-medium text-foreground">#{job.id.slice(0, 8)}</p>
                  <p className="font-body text-xs text-muted-foreground">{new Date(job.created_at).toLocaleDateString()}</p>
                </div>
                <p className="font-display font-bold text-primary">{formatNaira(Number(job.payout_amount))}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
