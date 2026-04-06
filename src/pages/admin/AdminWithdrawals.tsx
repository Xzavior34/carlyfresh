/**
 * Admin Withdrawal Manager — Approve/Reject pending withdrawal requests
 */

import { useState, useEffect } from "react";
import { Check, X, Loader2, Banknote, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { formatNaira } from "@/lib/formatters";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { DashboardSkeleton } from "@/components/ui/DashboardSkeleton";

type Withdrawal = Tables<"withdrawal_requests">;

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
};

export default function AdminWithdrawals() {
  const [withdrawals, setWithdrawals] = useState<(Withdrawal & { vendor_name?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<Withdrawal | null>(null);
  const [rejectNotes, setRejectNotes] = useState("");

  const fetchData = async () => {
    const [wRes, profRes] = await Promise.all([
      supabase.from("withdrawal_requests").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("user_id, full_name, business_name"),
    ]);
    if (wRes.data && profRes.data) {
      const nameMap = new Map(profRes.data.map((p) => [p.user_id, p.business_name || p.full_name || "Unknown"]));
      setWithdrawals(wRes.data.map((w) => ({ ...w, vendor_name: nameMap.get(w.vendor_id) })));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel("admin-withdrawals")
      .on("postgres_changes", { event: "*", schema: "public", table: "withdrawal_requests" }, () => {
        fetchData();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleApprove = async (w: Withdrawal) => {
    setProcessing(w.id);
    // Update withdrawal status
    const { error: wErr } = await supabase
      .from("withdrawal_requests")
      .update({ status: "approved", admin_notes: "Approved by admin" })
      .eq("id", w.id);

    if (wErr) {
      toast.error("Failed to approve withdrawal");
      setProcessing(null);
      return;
    }

    // Create a withdrawal transaction in ledger
    const { error: tErr } = await supabase.from("transactions").insert([{
      vendor_id: w.vendor_id,
      type: "withdrawal" as const,
      gross_amount: Number(w.amount),
      platform_fee: 0,
      net_amount: Number(w.amount),
      status: "completed" as const,
      description: `Withdrawal to ${w.bank_name} - ${w.account_number}`,
    }]);

    if (tErr) {
      toast.error("Withdrawal approved but ledger entry failed");
    } else {
      toast.success("Withdrawal approved & ledger updated");
    }
    setProcessing(null);
    fetchData();
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setProcessing(rejectModal.id);
    const { error } = await supabase
      .from("withdrawal_requests")
      .update({ status: "rejected", admin_notes: rejectNotes || "Rejected by admin" })
      .eq("id", rejectModal.id);

    if (error) {
      toast.error("Failed to reject withdrawal");
    } else {
      toast.success("Withdrawal rejected");
    }
    setProcessing(null);
    setRejectModal(null);
    setRejectNotes("");
    fetchData();
  };

  const pendingCount = withdrawals.filter((w) => w.status === "pending").length;
  const totalPending = withdrawals.filter((w) => w.status === "pending").reduce((s, w) => s + Number(w.amount), 0);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Withdrawal Requests</h1>
        <p className="text-muted-foreground font-body text-sm">{withdrawals.length} total requests</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border border-border">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-700" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground font-body uppercase tracking-wide">Pending</p>
              <p className="text-xl font-bold font-display text-foreground">{pendingCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Banknote className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground font-body uppercase tracking-wide">Pending Amount</p>
              <p className="text-xl font-bold font-display text-foreground">{formatNaira(totalPending)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="border border-border">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="font-body text-xs uppercase tracking-wider">Vendor</TableHead>
                  <TableHead className="font-body text-xs uppercase tracking-wider text-right">Amount</TableHead>
                  <TableHead className="font-body text-xs uppercase tracking-wider">Bank</TableHead>
                  <TableHead className="font-body text-xs uppercase tracking-wider">Account</TableHead>
                  <TableHead className="font-body text-xs uppercase tracking-wider text-center">Status</TableHead>
                  <TableHead className="font-body text-xs uppercase tracking-wider">Date</TableHead>
                  <TableHead className="font-body text-xs uppercase tracking-wider text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withdrawals.map((w) => (
                  <TableRow key={w.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell className="font-medium font-body text-foreground">{w.vendor_name || "—"}</TableCell>
                    <TableCell className="text-right font-body tabular-nums font-medium">{formatNaira(Number(w.amount))}</TableCell>
                    <TableCell className="font-body text-sm">{w.bank_name}</TableCell>
                    <TableCell className="font-body text-sm text-muted-foreground">{w.account_number}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className={`text-[10px] font-body capitalize ${statusColors[w.status] || ""}`}>{w.status}</Badge>
                    </TableCell>
                    <TableCell className="font-body text-sm text-muted-foreground">{new Date(w.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-center">
                      {w.status === "pending" ? (
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-emerald-700 hover:bg-emerald-50 font-body text-xs gap-1"
                            onClick={() => handleApprove(w)}
                            disabled={processing === w.id}
                          >
                            {processing === w.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-destructive hover:bg-red-50 font-body text-xs gap-1"
                            onClick={() => { setRejectModal(w); setRejectNotes(""); }}
                            disabled={processing === w.id}
                          >
                            <X className="h-3.5 w-3.5" /> Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="font-body text-xs text-muted-foreground">{w.admin_notes || "—"}</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {withdrawals.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center">
                        <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                          <Banknote className="h-7 w-7 text-primary" />
                        </div>
                        <p className="font-display text-base font-semibold text-foreground mb-1">No withdrawal requests</p>
                        <p className="font-body text-sm text-muted-foreground">Vendor withdrawal requests will appear here.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Reject Modal */}
      <Dialog open={!!rejectModal} onOpenChange={() => setRejectModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Reject Withdrawal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="font-body text-sm text-muted-foreground">
              Rejecting {formatNaira(Number(rejectModal?.amount || 0))} for {rejectModal?.bank_name} — {rejectModal?.account_number}
            </p>
            <Textarea
              placeholder="Reason for rejection (optional)..."
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              className="font-body"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectModal(null)} className="font-body">Cancel</Button>
            <Button variant="destructive" onClick={handleReject} className="font-body gap-2" disabled={!!processing}>
              {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Reject Withdrawal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
