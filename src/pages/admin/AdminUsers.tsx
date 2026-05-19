import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { formatNaira } from "@/lib/formatters";
import { Users, Store } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { DashboardSkeleton } from "@/components/ui/DashboardSkeleton";
import { toast } from "@/hooks/use-toast";

type Profile = Tables<"profiles">;

export default function AdminUsers() {
  const [users, setUsers] = useState<(Profile & { role?: string; totalSales?: number })[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    const [profRes, rolesRes, ordersRes] = await Promise.all([
      supabase.from("profiles").select("*"),
      supabase.from("user_roles").select("*"),
      supabase.from("orders").select("vendor_id, total_amount"),
    ]);
    if (profRes.data && rolesRes.data) {
      const roleMap = new Map(rolesRes.data.map((r) => [r.user_id, r.role]));
      const salesMap = new Map<string, number>();
      if (ordersRes.data) {
        ordersRes.data.forEach((o) => {
          salesMap.set(o.vendor_id, (salesMap.get(o.vendor_id) || 0) + Number(o.total_amount));
        });
      }
      setUsers(profRes.data.map((p) => ({
        ...p,
        role: roleMap.get(p.user_id) || "buyer",
        totalSales: salesMap.get(p.user_id) || 0,
      })));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
    const channel = supabase
      .channel("admin-users")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => fetchAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => fetchAll());
    channel.subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  if (loading) return <DashboardSkeleton />;

  const vendors = users.filter((u) => u.role === "seller");
  const totalVendorSales = vendors.reduce((s, v) => s + (v.totalSales || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">User Management</h1>
        <p className="text-muted-foreground font-body text-sm">{users.length} registered users</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-border">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground font-body uppercase tracking-wide">Total Users</p>
              <p className="text-xl font-bold font-display text-foreground">{users.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Store className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground font-body uppercase tracking-wide">Active Vendors</p>
              <p className="text-xl font-bold font-display text-foreground">{vendors.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Store className="h-5 w-5 text-emerald-700" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground font-body uppercase tracking-wide">Total Vendor Sales</p>
              <p className="text-xl font-bold font-display text-foreground">{formatNaira(totalVendorSales)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vendor Sales Overview */}
      {vendors.length > 0 && (
        <Card className="border border-border">
          <CardContent className="p-0">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="font-display text-lg font-semibold text-foreground">Vendor Sales Overview</h2>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="font-body text-xs uppercase tracking-wider">Vendor</TableHead>
                    <TableHead className="font-body text-xs uppercase tracking-wider">Business</TableHead>
                    <TableHead className="font-body text-xs uppercase tracking-wider text-right">Total Sales</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendors.sort((a, b) => (b.totalSales || 0) - (a.totalSales || 0)).map((v) => (
                    <TableRow key={v.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell className="font-medium font-body text-foreground">{v.full_name || "—"}</TableCell>
                      <TableCell className="font-body text-sm text-muted-foreground">{v.business_name || "—"}</TableCell>
                      <TableCell className="text-right font-body tabular-nums font-medium">{formatNaira(v.totalSales || 0)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Users */}
      <Card className="border border-border">
        <CardContent className="p-0">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="font-display text-lg font-semibold text-foreground">All Users</h2>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="font-body text-xs uppercase tracking-wider">Name</TableHead>
                  <TableHead className="font-body text-xs uppercase tracking-wider">Role</TableHead>
                  <TableHead className="font-body text-xs uppercase tracking-wider">Business</TableHead>
                  <TableHead className="font-body text-xs uppercase tracking-wider">Phone</TableHead>
                  <TableHead className="font-body text-xs uppercase tracking-wider text-center">B2B Customer</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell className="font-medium font-body text-foreground">{u.full_name || "—"}</TableCell>
                    <TableCell><Badge variant="secondary" className="font-body text-[11px] capitalize">{u.role}</Badge></TableCell>
                    <TableCell className="font-body text-sm text-muted-foreground">{u.business_name || "—"}</TableCell>
                    <TableCell className="font-body text-sm text-muted-foreground">{u.phone || "—"}</TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={Boolean((u as any).is_b2b_customer)}
                        onCheckedChange={async (val) => {
                          const { error } = await supabase
                            .from("profiles")
                            .update({ is_b2b_customer: val } as any)
                            .eq("user_id", u.user_id);
                          if (error) {
                            toast({ title: "Failed", description: error.message, variant: "destructive" });
                          } else {
                            toast({ title: val ? "Marked as B2B customer" : "B2B status removed" });
                            setUsers((prev) => prev.map((x) => x.user_id === u.user_id ? { ...x, is_b2b_customer: val } as any : x));
                          }
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <div className="flex flex-col items-center">
                        <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                          <Users className="h-7 w-7 text-primary" />
                        </div>
                        <p className="font-display text-base font-semibold text-foreground mb-1">No users yet</p>
                        <p className="font-body text-sm text-muted-foreground">Registered users will appear here.</p>
                      </div>
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
