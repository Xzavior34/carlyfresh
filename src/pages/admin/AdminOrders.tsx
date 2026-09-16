/**
 * Admin Orders — Complete list of all marketplace orders with
 * Buyer details, Vendor details, assigned Driver, and In-App direct messaging.
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  User,
  Store,
  Truck,
  MessageSquare,
  MapPin,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { formatNaira, getStatusColor } from "@/lib/formatters";
import type { Tables } from "@/integrations/supabase/types";

type Order = Tables<"orders">;
type Profile = Tables<"profiles">;

interface DetailedOrder extends Order {
  buyer?: Profile | null;
  vendor?: Profile | null;
  job?: Tables<"delivery_jobs"> | null;
  driver?: Profile | null;
}

export default function AdminOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<DetailedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const fetchOrders = async () => {
    // 1. Fetch Orders
    const { data: ordersData } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (!ordersData) {
      setLoading(false);
      return;
    }

    // 2. Fetch Profiles & Delivery Jobs
    const userIds = new Set<string>();
    ordersData.forEach((o) => {
      if (o.buyer_id) userIds.add(o.buyer_id);
      if (o.vendor_id) userIds.add(o.vendor_id);
    });

    const [profilesRes, jobsRes] = await Promise.all([
      supabase.from("profiles").select("*").in("user_id", Array.from(userIds)),
      supabase.from("delivery_jobs").select("*"),
    ]);

    const profileMap = new Map((profilesRes.data || []).map((p) => [p.user_id, p]));
    const jobMap = new Map((jobsRes.data || []).map((j) => [j.order_id, j]));

    // Fetch driver profiles
    const driverIds = Array.from(
      new Set(
        (jobsRes.data || [])
          .map((j) => j.driver_id)
          .filter((id): id is string => Boolean(id))
      )
    );

    let driverMap = new Map<string, Profile>();
    if (driverIds.length > 0) {
      const { data: driverProfiles } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", driverIds);
      driverMap = new Map((driverProfiles || []).map((p) => [p.user_id, p]));
    }

    const detailed: DetailedOrder[] = ordersData.map((ord) => {
      const job = jobMap.get(ord.id) || null;
      return {
        ...ord,
        buyer: profileMap.get(ord.buyer_id) || null,
        vendor: profileMap.get(ord.vendor_id) || null,
        job,
        driver: job?.driver_id ? driverMap.get(job.driver_id) || null : null,
      };
    });

    setOrders(detailed);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
    const channel = supabase
      .channel("admin-orders-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => fetchOrders())
      .on("postgres_changes", { event: "*", schema: "public", table: "delivery_jobs" }, () => fetchOrders());
    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const startChatWith = (userId: string, name?: string) => {
    navigate("/admin/chats", { state: { startChat: { userId, name } } });
  };

  if (loading) return <p className="text-muted-foreground font-body p-8">Loading orders…</p>;

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">All Orders</h1>
        <p className="text-muted-foreground font-body text-sm">
          {orders.length} total orders across all vendors
        </p>
      </div>

      <Card className="border border-border">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="font-body text-xs uppercase tracking-wider">#</TableHead>
                  <TableHead className="font-body text-xs uppercase tracking-wider">Customer / Buyer</TableHead>
                  <TableHead className="font-body text-xs uppercase tracking-wider">Vendor / Store</TableHead>
                  <TableHead className="font-body text-xs uppercase tracking-wider text-right">Amount</TableHead>
                  <TableHead className="font-body text-xs uppercase tracking-wider text-center">Status</TableHead>
                  <TableHead className="font-body text-xs uppercase tracking-wider">Driver</TableHead>
                  <TableHead className="font-body text-xs uppercase tracking-wider">Date</TableHead>
                  <TableHead className="font-body text-xs uppercase tracking-wider text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => {
                  const isExpanded = expandedRow === order.id;
                  const buyerName = order.buyer?.full_name || order.buyer?.business_name || "Buyer";
                  const vendorName = order.vendor?.business_name || order.vendor?.full_name || "Vendor";
                  const driverName = order.driver?.full_name || "Unassigned";
                  const items = Array.isArray(order.items) ? (order.items as any[]) : [];

                  return (
                    <>
                      <TableRow
                        key={order.id}
                        className="hover:bg-muted/20 transition-colors cursor-pointer"
                        onClick={() => setExpandedRow(isExpanded ? null : order.id)}
                      >
                        <TableCell className="font-medium font-body text-foreground">
                          #{order.order_number || order.id.slice(0, 8)}
                        </TableCell>
                        <TableCell className="font-body text-sm font-medium">
                          <div className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 text-primary" />
                            <span>{buyerName}</span>
                          </div>
                          {order.buyer?.phone && (
                            <span className="text-[11px] text-muted-foreground block">
                              {order.buyer.phone}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="font-body text-sm">
                          <div className="flex items-center gap-1.5">
                            <Store className="h-3.5 w-3.5 text-amber-600" />
                            <span>{vendorName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-body tabular-nums font-semibold">
                          {formatNaira(Number(order.total_amount))}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="secondary"
                            className={`text-[10px] font-body ${getStatusColor(order.status)}`}
                          >
                            {order.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-body text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Truck className="h-3 w-3 text-blue-600" />
                            <span>{driverName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-body text-xs text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString("en-NG", {
                            day: "numeric",
                            month: "short",
                          })}
                        </TableCell>
                        <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2 text-xs font-body gap-1 text-primary hover:bg-primary/10"
                              title="Message Buyer"
                              onClick={() => startChatWith(order.buyer_id, buyerName)}
                            >
                              <MessageSquare className="h-3.5 w-3.5" /> Chat
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => setExpandedRow(isExpanded ? null : order.id)}
                            >
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* Expanded Order Breakdown */}
                      {isExpanded && (
                        <TableRow key={`${order.id}-details`} className="bg-muted/10">
                          <TableCell colSpan={8} className="p-4 border-t border-border/40">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {/* Buyer Card */}
                              <div className="p-3 bg-card border rounded-lg space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                    <User className="h-3.5 w-3.5 text-primary" /> Buyer Details
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs font-body gap-1"
                                    onClick={() => startChatWith(order.buyer_id, buyerName)}
                                  >
                                    <MessageSquare className="h-3 w-3" /> Message Buyer
                                  </Button>
                                </div>
                                <p className="font-body text-sm font-semibold text-foreground">{buyerName}</p>
                                {order.buyer?.phone && <p className="font-body text-xs text-muted-foreground">Phone: {order.buyer.phone}</p>}
                                {order.delivery_address && (
                                  <p className="font-body text-xs text-muted-foreground flex items-start gap-1">
                                    <MapPin className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                                    <span>{order.delivery_address}</span>
                                  </p>
                                )}
                                {order.delivery_window && (
                                  <p className="font-body text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                                    <span>Slot: {order.delivery_window}</span>
                                  </p>
                                )}
                              </div>

                              {/* Vendor Card */}
                              <div className="p-3 bg-card border rounded-lg space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                    <Store className="h-3.5 w-3.5 text-amber-600" /> Vendor / Store
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs font-body gap-1"
                                    onClick={() => startChatWith(order.vendor_id, vendorName)}
                                  >
                                    <MessageSquare className="h-3 w-3" /> Message Vendor
                                  </Button>
                                </div>
                                <p className="font-body text-sm font-semibold text-foreground">{vendorName}</p>
                                {order.vendor?.phone && <p className="font-body text-xs text-muted-foreground">Phone: {order.vendor.phone}</p>}
                                {order.vendor?.farm_location && (
                                  <p className="font-body text-xs text-muted-foreground flex items-start gap-1">
                                    <MapPin className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
                                    <span>{order.vendor.farm_location}</span>
                                  </p>
                                )}
                              </div>

                              {/* Driver & Items Card */}
                              <div className="p-3 bg-card border rounded-lg space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                    <Package className="h-3.5 w-3.5 text-blue-600" /> Items & Logistics
                                  </span>
                                  {order.driver && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 text-xs font-body gap-1"
                                      onClick={() => startChatWith(order.driver!.user_id, driverName)}
                                    >
                                      <MessageSquare className="h-3 w-3" /> Message Driver
                                    </Button>
                                  )}
                                </div>
                                <div className="space-y-1 max-h-28 overflow-y-auto">
                                  {items.map((it, idx) => (
                                    <div key={idx} className="flex justify-between text-xs font-body">
                                      <span>{it.name || "Item"} × {it.quantity || 1}</span>
                                      <span className="font-medium">{formatNaira((it.price || 0) * (it.quantity || 1))}</span>
                                    </div>
                                  ))}
                                </div>
                                <div className="pt-2 border-t flex justify-between text-xs font-body font-semibold">
                                  <span>Total Amount</span>
                                  <span className="text-primary">{formatNaira(Number(order.total_amount))}</span>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  );
                })}

                {orders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground font-body">
                      No orders placed yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
