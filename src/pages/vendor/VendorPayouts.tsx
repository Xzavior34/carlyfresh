import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Wallet, TrendingUp, ArrowDownToLine, Percent, Loader2, CheckCircle2, Clock, Ban } from "lucide-react";
import { toast } from "sonner";
import { formatNaira } from "@/lib/formatters";

// ── Types ──
interface Transaction {
  id: string;
  date: string;
  description: string;
  grossAmount: number;
  platformFee: number;
  netAmount: number;
  status: "completed" | "pending";
  type: "sale" | "withdrawal";
}

interface WithdrawalRequest {
  amount: number;
  bankName: string;
  accountNumber: string;
}

interface WalletSummary {
  totalEarnings: number;
  totalCommission: number;
  totalWithdrawn: number;
  availableBalance: number;
  pendingWithdrawals: number;
}

// ── Mock Data ──
const COMMISSION_RATE = 0.15;

const mockTransactions: Transaction[] = [
  { id: "t1", date: "2026-04-02", description: "Sale: 50 Baskets of Tomatoes", grossAmount: 125000, platformFee: 18750, netAmount: 106250, status: "completed", type: "sale" },
  { id: "t2", date: "2026-04-01", description: "Sale: 20kg Fresh Spinach", grossAmount: 34000, platformFee: 5100, netAmount: 28900, status: "completed", type: "sale" },
  { id: "t3", date: "2026-03-30", description: "Sale: 100 Pieces of Plantain", grossAmount: 45000, platformFee: 6750, netAmount: 38250, status: "completed", type: "sale" },
  { id: "t4", date: "2026-03-28", description: "Withdrawal to GTBank ****4521", grossAmount: 0, platformFee: 0, netAmount: -80000, status: "completed", type: "withdrawal" },
  { id: "t5", date: "2026-03-25", description: "Sale: 30 Baskets of Peppers", grossAmount: 90000, platformFee: 13500, netAmount: 76500, status: "completed", type: "sale" },
  { id: "t6", date: "2026-03-22", description: "Sale: 15kg Yam Flour", grossAmount: 22500, platformFee: 3375, netAmount: 19125, status: "completed", type: "sale" },
  { id: "t7", date: "2026-04-03", description: "Sale: 200 Pieces of Oranges", grossAmount: 60000, platformFee: 9000, netAmount: 51000, status: "pending", type: "sale" },
  { id: "t8", date: "2026-04-03", description: "Withdrawal Request", grossAmount: 0, platformFee: 0, netAmount: -50000, status: "pending", type: "withdrawal" },
];

const computeWallet = (txns: Transaction[]): WalletSummary => {
  let totalEarnings = 0;
  let totalCommission = 0;
  let totalWithdrawn = 0;
  let pendingWithdrawals = 0;

  txns.forEach((t) => {
    if (t.type === "sale" && t.status === "completed") {
      totalEarnings += t.grossAmount;
      totalCommission += t.platformFee;
    }
    if (t.type === "withdrawal" && t.status === "completed") {
      totalWithdrawn += Math.abs(t.netAmount);
    }
    if (t.type === "withdrawal" && t.status === "pending") {
      pendingWithdrawals += Math.abs(t.netAmount);
    }
  });

  const availableBalance = totalEarnings - totalCommission - totalWithdrawn - pendingWithdrawals;
  return { totalEarnings, totalCommission, totalWithdrawn, availableBalance, pendingWithdrawals };
};

export default function VendorPayouts() {
  const [transactions] = useState<Transaction[]>(mockTransactions);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<WithdrawalRequest>({ amount: 0, bankName: "", accountNumber: "" });

  const wallet = computeWallet(transactions);

  const handleWithdraw = async () => {
    if (form.amount <= 0) return toast.error("Enter a valid amount");
    if (form.amount > wallet.availableBalance) return toast.error("Amount exceeds available balance");
    if (!form.bankName.trim()) return toast.error("Enter your bank name");
    if (form.accountNumber.length < 10) return toast.error("Enter a valid 10-digit account number");

    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1500));
    toast.success("Withdrawal request submitted! Admin will review shortly.");
    setSubmitting(false);
    setWithdrawOpen(false);
    setForm({ amount: 0, bankName: "", accountNumber: "" });
  };

  const metrics = [
    { label: "Available Balance", value: formatNaira(wallet.availableBalance), icon: Wallet, color: "text-primary" },
    { label: "Total Earnings (Gross)", value: formatNaira(wallet.totalEarnings), icon: TrendingUp, color: "text-emerald-600" },
    { label: "Commission Paid (15%)", value: formatNaira(wallet.totalCommission), icon: Percent, color: "text-orange-500" },
    { label: "Total Withdrawn", value: formatNaira(wallet.totalWithdrawn), icon: ArrowDownToLine, color: "text-blue-500" },
  ];

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
                    <TableCell className="font-body text-sm whitespace-nowrap">{new Date(t.date).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</TableCell>
                    <TableCell className="font-body text-sm max-w-[200px] truncate">{t.description}</TableCell>
                    <TableCell className="font-body text-sm text-right">{t.type === "sale" ? formatNaira(t.grossAmount) : "—"}</TableCell>
                    <TableCell className="font-body text-sm text-right text-orange-500">{t.type === "sale" ? `-${formatNaira(t.platformFee)}` : "—"}</TableCell>
                    <TableCell className={`font-body text-sm text-right font-semibold ${t.type === "withdrawal" ? "text-red-500" : "text-primary"}`}>
                      {t.type === "withdrawal" ? `-${formatNaira(Math.abs(t.netAmount))}` : formatNaira(t.netAmount)}
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
        </CardContent>
      </Card>

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
              <Input
                type="number"
                placeholder="e.g. 50000"
                value={form.amount || ""}
                onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                max={wallet.availableBalance}
              />
              {form.amount > wallet.availableBalance && (
                <p className="text-xs text-destructive font-body">Exceeds available balance</p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="font-body">Bank Name</Label>
              <Input
                placeholder="e.g. GTBank, Access Bank"
                value={form.bankName}
                onChange={(e) => setForm({ ...form, bankName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="font-body">Account Number</Label>
              <Input
                placeholder="10-digit account number"
                maxLength={10}
                value={form.accountNumber}
                onChange={(e) => setForm({ ...form, accountNumber: e.target.value.replace(/\D/g, "") })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawOpen(false)} disabled={submitting} className="font-body">
              Cancel
            </Button>
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
