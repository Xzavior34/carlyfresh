import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { formatNaira, getStatusColor } from "@/lib/formatters";
import type { Tables } from "@/integrations/supabase/types";
import { DashboardSkeleton } from "@/components/ui/DashboardSkeleton";

type Order = Tables<"orders">;

export default function VendorOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    if (!user) return;
    const { data } = await supabase.from("orders").select("*").eq("vendor_id", user.id).order("created_at", { ascending: false });
    if (data) setOrders(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
    if (!user) return;
    const channel = supabase.channel("vendor-orders-page")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `vendor_id=eq.${user.id}` }, () => fetchOrders())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Store Orders</h1>
        <p className="text-muted-foreground font-body text-sm">{orders.length} orders received</p>
      </div>
      <Card className="border border-border">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="font-body text-xs uppercase tracking-wider">#</TableHead>
                  <TableHead className="font-body text-xs uppercase tracking-wider text-right">Amount</TableHead>
                  <TableHead className="font-body text-xs uppercase tracking-wider text-center">Status</TableHead>
                  <TableHead className="font-body text-xs uppercase tracking-wider">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell className="font-medium font-body text-foreground">#{order.order_number}</TableCell>
                    <TableCell className="text-right font-body tabular-nums">{formatNaira(Number(order.total_amount))}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className={`text-[10px] font-body ${getStatusColor(order.status)}`}>{order.status}</Badge>
                    </TableCell>
                    <TableCell className="font-body text-sm text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
                {orders.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground font-body">No orders yet. Share your store to start getting orders!</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
