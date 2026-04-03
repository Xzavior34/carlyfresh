import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet, TrendingUp, ArrowDownToLine, Percent, Loader2, CheckCircle2, Clock, Receipt } from "lucide-react";
import { toast } from "sonner";
import { formatNaira } from "@/lib/formatters";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

const COMMISSION_RATE = 0.15;

interface Transaction {
  id: string;
  vendor_id: string;
  type: string;
  description: string;
  gross_amount: number;
  platform_fee: number;
  net_amount: number;
  status: string;
  created_at: string;
}

interface WalletSummary {
  totalEarnings: number;
  totalCommission: number;
  totalWithdrawn: number;
  availableBalance: number;
  pendingWithdrawals: number;
}

const computeWallet = (txns: Transaction[], pendingWd: number): WalletSummary => {
  let totalEarnings = 0;
  let totalCommission = 0;
  let totalWithdrawn = 0;

  txns.forEach((t) => {
    if (t.type === "sale" && t.status === "completed") {
      totalEarnings += Number(t.gross_amount);
      totalCommission += Number(t.platform_fee);
    }
    if (t.type === "withdrawal" && t.status === "completed") {
      totalWithdrawn += Math.abs(Number(t.net_amount));
    }
  });

  const availableBalance = totalEarnings - totalCommission - totalWithdrawn - pendingWd;
  return { totalEarnings, totalCommission, totalWithdrawn, availableBalance, pendingWithdrawals: pendingWd };
};

function WalletSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-44" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border border-border">
            <CardContent className="p-5 space-y-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="border border-border">
        <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export default function VendorPayouts() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState(0);
  const [loading, setLoading] = useState(true);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [txnRes, wdRes] = await Promise.all([
        supabase
          .from("transactions")
          .select("*")
          .eq("vendor_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("withdrawal_requests")
          .select("amount")
          .eq("vendor_id", user.id)
          .eq("status", "pending"),
      ]);

      if (txnRes.error) throw txnRes.error;
      if (wdRes.error) throw wdRes.error;

      setTransactions((txnRes.data as unknown as Transaction[]) || []);
      const totalPending = (wdRes.data || []).reduce((s: number, r: { amount: number }) => s + Number(r.amount), 0);
      setPendingWithdrawals(totalPending);
    } catch {
      toast.error("Failed to load wallet data. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const wallet = computeWallet(transactions, pendingWithdrawals);

  const amountNum = Number(amount) || 0;
  const isFormValid =
    amountNum > 0 &&
    amountNum <= wallet.availableBalance &&
    bankName.trim().length > 0 &&
    /^\d{10}$/.test(accountNumber);

  const handleWithdraw = async () => {
    if (!isFormValid || !user) return;

    setSubmitting(true);
    try {
      // Insert withdrawal request
      const { error: wdError } = await supabase.from("withdrawal_requests").insert({
        vendor_id: user.id,
        amount: amountNum,
        bank_name: bankName.trim(),
        account_number: accountNumber,
      });
      if (wdError) throw wdError;

      // Also log as a transaction
      const { error: txError } = await supabase.from("transactions").insert({
        vendor_id: user.id,
        type: "withdrawal" as any,
        description: `Withdrawal to ${bankName.trim()} ****${accountNumber.slice(-4)}`,
        gross_amount: 0,
        platform_fee: 0,
        net_amount: -amountNum,
        status: "pending" as any,
      });
      if (txError) throw txError;

      toast.success("Withdrawal request submitted! Admin will review shortly.");
      setWithdrawOpen(false);
      setAmount("");
      setBankName("");
      setAccountNumber("");
      fetchData();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <WalletSkeleton />;

  const metrics = [
    { label: "Available Balance", value: formatNaira(wallet.availableBalance), icon: Wallet, color: "text-primary" },
    { label: "Total Earnings (Gross)", value: formatNaira(wallet.totalEarnings), icon: TrendingUp, color: "text-primary" },
    { label: "Commission Paid (15%)", value: formatNaira(wallet.totalCommission), icon: Percent, color: "text-muted-foreground" },
    { label: "Total Withdrawn", value: formatNaira(wallet.totalWithdrawn), icon: ArrowDownToLine, color: "text-muted-foreground" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Wallet & Earnings</h1>
          <p className="text-muted-foreground font-body text-sm">Track your earnings, commissions, and withdrawals</p>
        </div>
        <Button onClick={() => setWithdrawOpen(true)} className="gap-2 font-body" disabled={wallet.availableBalance <= 0}>
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
        <Card className="border-border bg-muted/50">
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="h-5 w-5 text-muted-foreground shrink-0" />
            <p className="text-sm font-body text-muted-foreground">
              You have <strong className="text-foreground">{formatNaira(wallet.pendingWithdrawals)}</strong> in pending withdrawal requests awaiting admin approval.
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
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Receipt className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-display font-semibold text-foreground mb-1">No transactions yet</h3>
              <p className="text-sm text-muted-foreground font-body max-w-xs">
                Your sales and withdrawal history will appear here once you start receiving orders.
              </p>
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
                      <TableCell className="font-body text-sm text-right">
                        {t.type === "sale" ? formatNaira(Number(t.gross_amount)) : "—"}
                      </TableCell>
                      <TableCell className="font-body text-sm text-right text-muted-foreground">
                        {t.type === "sale" ? `-${formatNaira(Number(t.platform_fee))}` : "—"}
                      </TableCell>
                      <TableCell className={`font-body text-sm text-right font-semibold ${t.type === "withdrawal" ? "text-destructive" : "text-primary"}`}>
                        {t.type === "withdrawal" ? `-${formatNaira(Math.abs(Number(t.net_amount)))}` : formatNaira(Number(t.net_amount))}
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

      {/* Withdrawal Modal */}
      <Dialog open={withdrawOpen} onOpenChange={(o) => { if (!submitting) setWithdrawOpen(o); }}>
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
              <Input
                type="number"
                min={1}
                placeholder="e.g. 50000"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              />
              {amountNum > wallet.availableBalance && (
                <p className="text-xs text-destructive font-body">Exceeds available balance</p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="font-body">Bank Name</Label>
              <Input placeholder="e.g. GTBank, Access Bank" value={bankName} onChange={(e) => setBankName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="font-body">Account Number</Label>
              <Input
                placeholder="10-digit account number"
                maxLength={10}
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
              />
              {accountNumber.length > 0 && accountNumber.length < 10 && (
                <p className="text-xs text-destructive font-body">Must be exactly 10 digits</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawOpen(false)} disabled={submitting} className="font-body">Cancel</Button>
            <Button onClick={handleWithdraw} disabled={!isFormValid || submitting} className="gap-2 font-body">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
