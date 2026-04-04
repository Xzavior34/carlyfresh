/**
 * Vendor Wallet & Earnings — Real-time data from Supabase
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Wallet, TrendingUp, ArrowDownToLine, Percent, Loader2, CheckCircle2, Clock, Ban, ReceiptText } from "lucide-react";
import { toast } from "sonner";
import { formatNaira } from "@/lib/formatters";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { DashboardSkeleton } from "@/components/ui/DashboardSkeleton";

interface WalletSummary {
  totalEarnings: number;
  totalCommission: number;
  totalWithdrawn: number;
  availableBalance: number;
  pendingWithdrawals: number;
}

export default function VendorPayouts() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ amount: 0, bankName: "", accountNumber: "" });

  const fetchData = async () => {
    if (!user) return;
    const [txRes, wdRes] = await Promise.all([
      supabase.from("transactions").select("*").eq("vendor_id", user.id).order("created_at", { ascending: false }),
      supabase.from("withdrawal_requests").select("*").eq("vendor_id", user.id).order("created_at", { ascending: false }),
    ]);
    setTransactions(txRes.data || []);
    setWithdrawals(wdRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Compute wallet summary from real data
  const wallet: WalletSummary = (() => {
    let totalEarnings = 0, totalCommission = 0;
    (transactions || []).forEach((t) => {
      if (t.type === "sale" && t.status === "completed") {
        totalEarnings += Number(t.gross_amount);
        totalCommission += Number(t.platform_fee);
      }
    });
    const completedWithdrawals = (withdrawals || []).filter((w) => w.status === "approved").reduce((s: number, w: any) => s + Number(w.amount), 0);
    const pendingWithdrawals = (withdrawals || []).filter((w) => w.status === "pending").reduce((s: number, w: any) => s + Number(w.amount), 0);
    const availableBalance = totalEarnings - totalCommission - completedWithdrawals - pendingWithdrawals;
    return { totalEarnings, totalCommission, totalWithdrawn: completedWithdrawals, availableBalance, pendingWithdrawals };
  })();

  const handleWithdraw = async () => {
    if (form.amount <= 0) return toast.error("Enter a valid amount");
    if (form.amount > wallet.availableBalance) return toast.error("Amount exceeds available balance");
    if (!form.bankName.trim()) return toast.error("Enter your bank name");
    if (form.accountNumber.length !== 10) return toast.error("Enter a valid 10-digit account number");

    setSubmitting(true);
    const { error } = await supabase.from("withdrawal_requests").insert({
      vendor_id: user!.id,
      amount: form.amount,
      bank_name: form.bankName,
      account_number: form.accountNumber,
    });
    setSubmitting(false);

    if (error) {
      toast.error("Failed to submit withdrawal request");
      return;
    }

    toast.success("Withdrawal request submitted! Admin will review shortly.");
    setWithdrawOpen(false);
    setForm({ amount: 0, bankName: "", accountNumber: "" });
    fetchData();
  };

  const metrics = [
    { label: "Available Balance", value: formatNaira(wallet.availableBalance), icon: Wallet, color: "text-primary" },
    { label: "Total Earnings (Gross)", value: formatNaira(wallet.totalEarnings), icon: TrendingUp, color: "text-emerald-600" },
    { label: "Commission Paid (15%)", value: formatNaira(wallet.totalCommission), icon: Percent, color: "text-orange-500" },
    { label: "Total Withdrawn", value: formatNaira(wallet.totalWithdrawn), icon: ArrowDownToLine, color: "text-blue-500" },
  ];

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Wallet & Earnings</h1>
          <p className="text-muted-foreground font-body text-sm">Track your earnings, commissions, and withdrawals</p>
        </div>
        <Button onClick={() => setWithdrawOpen(true)} className="gap-2 font-body">
          <ArrowDownToLine className="h-4 w-4" /> Request Withdrawal
        </Button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <Card key={m.label} className="border border-border">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-body text-muted-foreground uppercase tracking-wider">{m.label}</span>
                <m.icon className={`h-4 w-4 ${m.color}`} />
              </div>
              <p className="text-2xl font-display font-bold text-foreground">{m.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {wallet.pendingWithdrawals > 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800">
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="h-5 w-5 text-orange-500 shrink-0" />
            <p className="text-sm font-body text-orange-700 dark:text-orange-300">
              You have <strong>{formatNaira(wallet.pendingWithdrawals)}</strong> in pending withdrawal requests awaiting admin approval.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Transaction History */}
      <Card className="border border-border">
        <CardHeader>
          <CardTitle className="text-lg font-display">Transaction History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {transactions.length === 0 ? (
            <div className="py-16 text-center">
              <ReceiptText className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
              <p className="font-body text-muted-foreground">No transactions yet.</p>
              <p className="font-body text-xs text-muted-foreground mt-1">Sales will appear here once your orders are delivered.</p>
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-body">Date</TableHead>
                    <TableHead className="font-body">Description</TableHead>
                    <TableHead className="font-body text-right">Gross</TableHead>
                    <TableHead className="font-body text-right">Fee (15%)</TableHead>
                    <TableHead className="font-body text-right">Net</TableHead>
                    <TableHead className="font-body text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-body text-sm whitespace-nowrap">
                        {new Date(t.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                      </TableCell>
                      <TableCell className="font-body text-sm max-w-[200px] truncate">{t.description}</TableCell>
                      <TableCell className="font-body text-sm text-right">{t.type === "sale" ? formatNaira(t.gross_amount) : "—"}</TableCell>
                      <TableCell className="font-body text-sm text-right text-orange-500">{t.type === "sale" ? `-${formatNaira(t.platform_fee)}` : "—"}</TableCell>
                      <TableCell className={`font-body text-sm text-right font-semibold ${t.type === "withdrawal" ? "text-destructive" : "text-primary"}`}>
                        {t.type === "withdrawal" ? `-${formatNaira(Math.abs(t.net_amount))}` : formatNaira(t.net_amount)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={t.status === "completed" ? "default" : "secondary"} className="gap-1 text-xs">
                          {t.status === "completed" ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                          {t.status === "completed" ? "Completed" : "Pending"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Withdrawal History */}
      {withdrawals.length > 0 && (
        <Card className="border border-border">
          <CardHeader>
            <CardTitle className="text-lg font-display">Withdrawal Requests</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-body">Date</TableHead>
                    <TableHead className="font-body">Bank</TableHead>
                    <TableHead className="font-body text-right">Amount</TableHead>
                    <TableHead className="font-body text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {withdrawals.map((w) => (
                    <TableRow key={w.id}>
                      <TableCell className="font-body text-sm whitespace-nowrap">
                        {new Date(w.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                      </TableCell>
                      <TableCell className="font-body text-sm">{w.bank_name} ****{w.account_number.slice(-4)}</TableCell>
                      <TableCell className="font-body text-sm text-right font-semibold">{formatNaira(w.amount)}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={w.status === "approved" ? "default" : w.status === "rejected" ? "destructive" : "secondary"} className="gap-1 text-xs">
                          {w.status === "approved" ? <CheckCircle2 className="h-3 w-3" /> : w.status === "rejected" ? <Ban className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                          {w.status.charAt(0).toUpperCase() + w.status.slice(1)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Withdrawal Modal */}
      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Request Withdrawal</DialogTitle>
            <DialogDescription className="font-body">
              Available balance: <strong className="text-primary">{formatNaira(wallet.availableBalance)}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="font-body">Amount (₦)</Label>
              <Input type="number" placeholder="e.g. 50000" value={form.amount || ""} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} max={wallet.availableBalance} />
              {form.amount > wallet.availableBalance && <p className="text-xs text-destructive font-body">Exceeds available balance</p>}
            </div>
            <div className="space-y-2">
              <Label className="font-body">Bank Name</Label>
              <Input placeholder="e.g. GTBank, Access Bank" value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label className="font-body">Account Number</Label>
              <Input placeholder="10-digit account number" maxLength={10} value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value.replace(/\D/g, "") })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawOpen(false)} disabled={submitting} className="font-body">Cancel</Button>
            <Button onClick={handleWithdraw} disabled={submitting || form.amount > wallet.availableBalance} className="gap-2 font-body">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
