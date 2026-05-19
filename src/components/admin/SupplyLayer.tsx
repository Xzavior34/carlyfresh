import { useState, useEffect } from "react";
import { ShieldCheck, MapPin, Award, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;

interface SupplierProfile extends Profile {
  role?: string;
}

export default function SupplyLayer() {
  const [suppliers, setSuppliers] = useState<SupplierProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLiveSuppliers = async () => {
    setLoading(true);
    // Fetch profiles and roles concurrently to identify true sellers
    const [profRes, rolesRes] = await Promise.all([
      supabase.from("profiles").select("*").order("business_name", { ascending: true }),
      supabase.from("user_roles").select("*"),
    ]);

    if (profRes.data && rolesRes.data) {
      const roleMap = new Map(rolesRes.data.map((r) => [r.user_id, r.role]));
      // Filter strictly for profiles carrying the 'seller' operational role
      const liveSellers = profRes.data
        .map((p) => ({ ...p, role: roleMap.get(p.user_id) }))
        .filter((p) => p.role === "seller");

      setSuppliers(liveSellers);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLiveSuppliers();
  }, []);

  // Live database mutation trigger to prove backend connectivity to Tony
  const toggleColdChain = async (userId: string, currentState: boolean) => {
    const { error } = await supabase
      .from("profiles")
      .update({ cold_chain_verified: !currentState })
      .eq("user_id", userId);

    if (error) {
      toast({ title: "Database Error", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Audit Updated", description: "Supplier cold-chain parameters updated live." });
    // Instantly update local array state for crisp UI response
    setSuppliers((prev) =>
      prev.map((s) => (s.user_id === userId ? { ...s, cold_chain_verified: !currentState } : s))
    );
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
        <div>
          <CardTitle className="font-display text-lg text-emerald-600 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" /> Verified Supplier Governance & Audits
          </CardTitle>
          <CardDescription className="font-body text-sm mt-1">
            Live querying of authed vendor endpoints. Toggle statuses to run real-time server mutations.
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={fetchLiveSuppliers} disabled={loading} className="w-max gap-2.5">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Sync Database
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-12 text-center text-xs font-body text-muted-foreground animate-pulse">
            Querying live supplier network arrays...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="font-body text-xs uppercase tracking-wider">Supplier Profile</TableHead>
                  <TableHead className="font-body text-xs uppercase tracking-wider">Fulfillment Hub</TableHead>
                  <TableHead className="font-body text-xs uppercase tracking-wider text-center">Quality Score</TableHead>
                  <TableHead className="font-body text-xs uppercase tracking-wider text-center">Cold-Chain Status</TableHead>
                  <TableHead className="font-body text-xs uppercase tracking-wider text-center">Live Controls</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((v) => (
                  <TableRow key={v.user_id} className="hover:bg-muted/20">
                    <TableCell className="font-medium font-body text-foreground">
                      {v.business_name || v.full_name || `Vendor (${v.user_id.slice(0, 8)})`}
                    </TableCell>
                    <TableCell className="font-body text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
                        <span>{(v as any).farm_location || "Port Harcourt Core"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-body tabular-nums text-sm">
                      <Badge variant="secondary" className="font-semibold bg-amber-500/10 text-amber-600 border-0">
                        <Award className="h-3 w-3 mr-1 inline" />
                        {(v as any).supplier_rating ? Number((v as any).supplier_rating).toFixed(2) : "5.00"} ★
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={`font-body text-[10px] uppercase font-bold border-0 ${
                          (v as any).cold_chain_verified
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {(v as any).cold_chain_verified ? "Certified Active" : "Unverified"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleColdChain(v.user_id, !!(v as any).cold_chain_verified)}
                        className="h-8 font-body text-xs px-2.5 hover:bg-muted"
                      >
                        {(v as any).cold_chain_verified ? (
                          <span className="flex items-center gap-1 text-destructive"><XCircle className="h-3.5 w-3.5" /> Revoke</span>
                        ) : (
                          <span className="flex items-center gap-1 text-emerald-600"><CheckCircle className="h-3.5 w-3.5" /> Certify</span>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {suppliers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground font-body text-sm">
                      No active vendor accounts found in the database layer.
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
