import { useState, useEffect } from "react";
import { Truck, Clock, PackageCheck, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { formatNaira } from "@/lib/formatters";

type Order = Tables<"orders">;

export default function OpsLayer() {
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchFulfillmentPipelines() {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .neq("status", "delivered")
      .order("created_at", { ascending: false });
    
    if (data) setActiveOrders(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchFulfillmentPipelines();

    const sub = supabase
      .channel(`ops-layer-sync-${Math.random().toString(36).substring(2, 9)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        fetchFulfillmentPipelines();
      });
    sub.subscribe();

    return () => { supabase.removeChannel(sub); };
  }, []);

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="font-display text-lg text-amber-600 flex items-center gap-2">
          <Truck className="h-5 w-5" /> Live Fulfillment Pipelines & Dispatch States
        </CardTitle>
        <CardDescription className="font-body text-sm">
          Real-time order progression routing engine synchronizing preparation states straight to field drivers.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Dynamic Process Pipeline Mapping */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-secondary/20 text-center font-body">
          <div className="p-3 border rounded-lg bg-background">
            <span className="text-xs text-muted-foreground font-semibold block">Stage 1</span>
            <span className="text-xs font-bold block mt-1">Pending Prep</span>
          </div>
          <div className="p-3 border rounded-lg bg-background">
            <span className="text-xs text-muted-foreground font-semibold block">Stage 2</span>
            <span className="text-xs font-bold block mt-1">Packaging Active</span>
          </div>
          <div className="p-3 border rounded-lg bg-background">
            <span className="text-xs text-muted-foreground font-semibold block">Stage 3</span>
            <span className="text-xs font-bold block mt-1 text-primary">Driver Assigned</span>
          </div>
          <div className="p-3 border rounded-lg bg-background border-amber-500/30 bg-amber-500/5">
            <span className="text-xs text-amber-600 font-semibold block">Stage 4</span>
            <span className="text-xs font-bold block mt-1 text-amber-600">On The Way</span>
          </div>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs font-body text-muted-foreground animate-pulse">
            Syncing order nodes...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="font-body text-xs uppercase tracking-wider">Order ID</TableHead>
                  <TableHead className="font-body text-xs uppercase tracking-wider">Volume</TableHead>
                  <TableHead className="font-body text-xs uppercase tracking-wider text-center">Fulfillment Node</TableHead>
                  <TableHead className="font-body text-xs uppercase tracking-wider text-center">Dispatch Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeOrders.map((o) => (
                  <TableRow key={o.id} className="hover:bg-muted/20">
                    <TableCell className="font-medium font-body text-foreground">
                      #{o.order_number}
                    </TableCell>
                    <TableCell className="font-body tabular-nums text-sm">
                      {formatNaira(Number(o.total_amount || 0))}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="font-body text-[10px] capitalize bg-secondary border-0">
                        {(o as any).fulfillment_stage ? String((o as any).fulfillment_stage).replace(/_/g, " ") : "Pending Vendor Prep"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="font-body text-[10px] uppercase font-bold border-0 bg-amber-500/10 text-amber-600">
                        {o.status === "processing" ? "On The Way" : o.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {activeOrders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground font-body text-sm">
                      No active processing dispatches mapped.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
