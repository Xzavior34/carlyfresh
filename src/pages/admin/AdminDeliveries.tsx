import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { formatNaira } from "@/lib/formatters";
import type { Tables } from "@/integrations/supabase/types";

type DeliveryJob = Tables<"delivery_jobs">;

const statusColors: Record<string, string> = {
  available: "bg-amber-100 text-amber-800",
  accepted: "bg-blue-100 text-blue-800",
  "in-transit": "bg-cyan-100 text-cyan-800",
  completed: "bg-emerald-100 text-emerald-800",
};

export default function AdminDeliveries() {
  const [jobs, setJobs] = useState<DeliveryJob[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    const { data } = await supabase.from("delivery_jobs").select("*").order("created_at", { ascending: false });
    if (data) setJobs(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchJobs();
    const channel = supabase.channel("admin-deliveries")
      .on("postgres_changes", { event: "*", schema: "public", table: "delivery_jobs" }, () => fetchJobs())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  if (loading) return <p className="text-muted-foreground font-body p-8">Loading deliveries…</p>;

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Deliveries</h1>
        <p className="text-muted-foreground font-body text-sm">{jobs.length} delivery jobs</p>
      </div>
      <Card className="border border-border">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="font-body text-xs uppercase tracking-wider">ID</TableHead>
                  <TableHead className="font-body text-xs uppercase tracking-wider">Pickup</TableHead>
                  <TableHead className="font-body text-xs uppercase tracking-wider">Dropoff</TableHead>
                  <TableHead className="font-body text-xs uppercase tracking-wider text-right">Payout</TableHead>
                  <TableHead className="font-body text-xs uppercase tracking-wider text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell className="font-body text-sm text-muted-foreground">{job.id.slice(0, 8)}</TableCell>
                    <TableCell className="font-body text-sm">{job.pickup_address}</TableCell>
                    <TableCell className="font-body text-sm">{job.dropoff_address}</TableCell>
                    <TableCell className="text-right font-body tabular-nums">{formatNaira(Number(job.payout_amount))}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className={`text-[10px] font-body ${statusColors[job.status] || ""}`}>{job.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {jobs.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground font-body">No delivery jobs yet.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
