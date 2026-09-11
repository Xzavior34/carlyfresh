import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  CircleDashed,
  Clock3,
  Package,
  RefreshCw,
  Truck,
  UserRound,
  Warehouse,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatNaira, getStatusColor } from "@/lib/formatters";

type Order = Tables<"orders">;
type DeliveryJob = Tables<"delivery_jobs">;
type Profile = Tables<"profiles">;

type FulfillmentRecord = {
  order: Order;
  job: DeliveryJob | null;
  supplier: Profile | null;
  buyer: Profile | null;
  driver: Profile | null;
};

const stageLabels = ["Order placed", "Supplier preparing", "Driver assigned", "In transit", "Delivered"];

function displayName(profile: Profile | null, fallback: string) {
  return profile?.business_name || profile?.full_name || fallback;
}

function getStageIndex(record: FulfillmentRecord) {
  const status = record.order.status;
  if (status === "delivered" || record.job?.status === "completed") return 4;
  if (status === "in-transit" || record.job?.status === "in-transit" || record.job?.status === "in_transit") return 3;
  if (status === "driver_assigned" || record.job?.driver_id) return 2;
  if (["preparing", "packaged", "processing", "accepted", "confirmed", "paid"].includes(status)) return 1;
  return 0;
}

function stageText(record: FulfillmentRecord) {
  const index = getStageIndex(record);
  return stageLabels[index];
}

function Assignment({ icon: Icon, label, value, muted = false }: {
  icon: typeof UserRound;
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="font-body text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className={`truncate font-body text-sm font-semibold ${muted ? "text-muted-foreground" : "text-foreground"}`}>{value}</p>
      </div>
    </div>
  );
}

function FulfillmentTimeline({ record }: { record: FulfillmentRecord }) {
  const activeStage = getStageIndex(record);

  return (
    <div className="space-y-2" aria-label={`Fulfillment stage: ${stageText(record)}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-body text-xs font-semibold text-foreground">{stageText(record)}</span>
        <span className="font-body text-[11px] text-muted-foreground">{activeStage + 1} of {stageLabels.length}</span>
      </div>
      <div className="grid grid-cols-5 gap-1">
        {stageLabels.map((stage, index) => (
          <div key={stage} className="space-y-1">
            <div className={`h-1.5 rounded-full ${index <= activeStage ? "bg-primary" : "bg-muted"}`} />
            <span className={`block truncate font-body text-[10px] ${index <= activeStage ? "text-foreground" : "text-muted-foreground"}`} title={stage}>
              {stage}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminFulfillment() {
  const [records, setRecords] = useState<FulfillmentRecord[]>([]);
  const [drivers, setDrivers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const requestId = useRef(0);

  const fetchFulfillment = useCallback(async (background = false) => {
    const currentRequest = ++requestId.current;
    if (background) setRefreshing(true);
    else setLoading(true);
    setError(null);

    const [ordersResult, jobsResult, profilesResult, rolesResult] = await Promise.all([
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("delivery_jobs").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*"),
      supabase.from("user_roles").select("user_id").eq("role", "driver")
    ]);

    if (currentRequest !== requestId.current) return;

    const firstError = ordersResult.error || jobsResult.error || profilesResult.error || rolesResult.error;
    if (firstError) {
      setError("Some fulfillment data could not be loaded. Try refreshing to reconnect.");
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const orders = ordersResult.data || [];
    const jobs = jobsResult.data || [];
    const profiles = profilesResult.data || [];
    const profileMap = new Map(profiles.map((profile) => [profile.user_id, profile]));
    const jobsByOrder = new Map(jobs.map((job) => [job.order_id, job]));
    
    const driverIds = new Set((rolesResult.data || []).map(r => r.user_id));
    const availableDrivers = profiles.filter(p => driverIds.has(p.user_id));
    setDrivers(availableDrivers);

    setRecords(orders.map((order) => {
      const job = jobsByOrder.get(order.id) || null;
      const driverId = job?.driver_id || order.assigned_driver_id;
      return {
        order,
        job,
        supplier: profileMap.get(order.vendor_id) || null,
        buyer: profileMap.get(order.buyer_id) || null,
        driver: driverId ? profileMap.get(driverId) || null : null,
      };
    }));
    setLastSynced(new Date());
    setLoading(false);
    setRefreshing(false);
  }, []);

  const assignDriver = async (orderId: string, driverId: string) => {
    try {
      setRefreshing(true);
      const { error: orderError } = await supabase
        .from("orders")
        .update({ assigned_driver_id: driverId, status: "driver_assigned" })
        .eq("id", orderId);
        
      if (orderError) throw orderError;
      
      const record = records.find(r => r.order.id === orderId);
      if (record?.job) {
        await supabase
          .from("delivery_jobs")
          .update({ driver_id: driverId, status: "assigned" })
          .eq("id", record.job.id);
      }
      
      await fetchFulfillment(true);
    } catch (err: any) {
      setError(err.message || "Failed to assign driver");
      setRefreshing(false);
    }
  };


  useEffect(() => {
    fetchFulfillment();

    const channel = supabase
      .channel("admin-fulfillment-tracker")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => fetchFulfillment(true))
      .on("postgres_changes", { event: "*", schema: "public", table: "delivery_jobs" }, () => fetchFulfillment(true))
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => fetchFulfillment(true));

    channel.subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchFulfillment]);

  const summary = useMemo(() => ({
    total: records.length,
    waitingForDriver: records.filter((record) => !record.driver && record.order.status !== "delivered").length,
    inTransit: records.filter((record) => getStageIndex(record) === 3).length,
    delivered: records.filter((record) => getStageIndex(record) === 4).length,
  }), [records]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="space-y-2"><Skeleton className="h-8 w-64" /><Skeleton className="h-4 w-96 max-w-full" /></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-24" />)}</div>
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
            <span className="font-body text-xs font-semibold uppercase tracking-wider text-primary">Live operations</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">Fulfillment tracker</h1>
          <p className="mt-1 max-w-2xl font-body text-sm text-muted-foreground">See every order connection in one place: customer, supplier, driver, route, and current handoff.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchFulfillment(true)} disabled={refreshing} className="font-body">
          <RefreshCw className={refreshing ? "animate-spin" : ""} /> Refresh
        </Button>
      </div>

      {error && (
        <div className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between" role="alert">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <p className="font-body text-sm text-foreground">{error}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => fetchFulfillment(true)} className="font-body">Try again</Button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="flex items-center justify-between p-4"><div><p className="font-body text-xs uppercase tracking-wider text-muted-foreground">Total orders</p><p className="mt-1 font-display text-2xl font-bold">{summary.total}</p></div><Package className="h-5 w-5 text-primary" /></CardContent></Card>
        <Card><CardContent className="flex items-center justify-between p-4"><div><p className="font-body text-xs uppercase tracking-wider text-muted-foreground">Awaiting driver</p><p className="mt-1 font-display text-2xl font-bold">{summary.waitingForDriver}</p></div><CircleDashed className="h-5 w-5 text-muted-foreground" /></CardContent></Card>
        <Card><CardContent className="flex items-center justify-between p-4"><div><p className="font-body text-xs uppercase tracking-wider text-muted-foreground">In transit</p><p className="mt-1 font-display text-2xl font-bold">{summary.inTransit}</p></div><Truck className="h-5 w-5 text-primary" /></CardContent></Card>
        <Card><CardContent className="flex items-center justify-between p-4"><div><p className="font-body text-xs uppercase tracking-wider text-muted-foreground">Delivered</p><p className="mt-1 font-display text-2xl font-bold">{summary.delivered}</p></div><CheckCircle2 className="h-5 w-5 text-primary" /></CardContent></Card>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div><h2 className="font-display text-lg font-semibold text-foreground">Order connections</h2><p className="font-body text-sm text-muted-foreground">Supplier and driver assignments update automatically.</p></div>
        {lastSynced && <span className="hidden font-body text-xs text-muted-foreground sm:inline">Synced {lastSynced.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}
      </div>

      {records.length === 0 ? (
        <Card><CardContent className="py-16 text-center"><Package className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" /><p className="font-body text-sm text-muted-foreground">No orders have been placed yet.</p></CardContent></Card>
      ) : (
        <div className="space-y-4">
          {records.map((record) => {
            const { order, job } = record;
            const driverMissing = !record.driver && order.status !== "delivered";
            return (
              <Card key={order.id} className="overflow-hidden">
                <CardHeader className="border-b border-border bg-muted/20 px-4 py-4 md:px-6">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary"><Package className="h-5 w-5" /></div>
                      <div><CardTitle className="font-display text-base">Order #{order.order_number}</CardTitle><p className="font-body text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString()}</p></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={`font-body text-[10px] capitalize ${getStatusColor(order.status)}`}>{String(order.status).replace(/_/g, " ")}</Badge>
                      <span className="font-body text-sm font-semibold text-foreground">{formatNaira(Number(order.total_amount))}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5 p-4 md:p-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <Assignment icon={Warehouse} label="Supplier" value={displayName(record.supplier, "Supplier not identified")} muted={!record.supplier} />
                    <Assignment icon={UserRound} label="Customer" value={displayName(record.buyer, "Customer not identified")} muted={!record.buyer} />
                    
                    {driverMissing ? (
                      <div className="flex flex-col gap-2">
                        <Assignment icon={Truck} label="Driver" value="Waiting for driver assignment" muted={true} />
                        <Select onValueChange={(val) => assignDriver(order.id, val)} disabled={refreshing}>
                          <SelectTrigger className="h-8 text-xs font-body w-full max-w-[200px]">
                            <SelectValue placeholder="Assign a driver..." />
                          </SelectTrigger>
                          <SelectContent>
                            {drivers.map(d => (
                              <SelectItem key={d.user_id} value={d.user_id} className="text-xs">
                                {displayName(d, "Unnamed Driver")}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <Assignment icon={Truck} label="Driver" value={displayName(record.driver, "Driver")} muted={false} />
                    )}
                  </div>

                  <FulfillmentTimeline record={record} />

                  <div className="grid gap-3 border-t border-border pt-4 md:grid-cols-2">
                    <div className="flex items-start gap-2 font-body text-sm"><Warehouse className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><div><p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Pickup</p><p className="text-foreground">{job?.pickup_address || "Pickup details pending"}</p></div></div>
                    <div className="flex items-start gap-2 font-body text-sm"><Truck className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><div><p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Drop-off</p><p className="text-foreground">{order.delivery_address || job?.dropoff_address || "Delivery address pending"}</p></div></div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-3 font-body text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> Job: {job ? String(job.status).replace(/_/g, " ") : "Not created"}</span>
                    {record.driver && <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Driver linked</span>}
                    {job?.payout_amount != null && <span className="inline-flex items-center gap-1">Driver payout: {formatNaira(Number(job.payout_amount))}</span>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}