/**
 * Vendor Wallet & Earnings — Live wallet_balance + RPC withdrawal workflow
 * DATA SOURCE: profiles.wallet_balance, withdrawal_requests table, transactions table
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Wallet,
  TrendingUp,
  ArrowDownToLine,
  Percent,
  Loader2,
  CheckCircle2,
  Clock,
  Ban,
  ReceiptText,
  Landmark,
  User,
  Hash,
  PartyPopper,
} from "lucide-react";
import { toast } from "sonner";
import { formatNaira } from "@/lib/formatters";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { DashboardSkeleton } from "@/components/ui/DashboardSkeleton";

// ─── Types ────────────────────────────────────────────────────────────────────
interface WithdrawalForm {
  amount: number | "";
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
}

const EMPTY_FORM: WithdrawalForm = {
  amount: "",
  bankName: "",
  accountNumber: "",
  accountHolderName: "",
};

// ─── Metric card animation ────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.35, ease: "easeOut" as const },
  }),
};

// ─── Success Banner ───────────────────────────────────────────────────────────
function SuccessBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97, y: -8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.35 }}
      className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 dark:border-emerald-800 p-6"
    >
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0">
          <PartyPopper className="h-6 w-6 text-emerald-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-display font-bold text-emerald-800 dark:text-emerald-300 text-base">
            Withdrawal Requested Successfully
          </h3>
          <p className="font-body text-sm text-emerald-700 dark:text-emerald-400 mt-1">
            Your request is now <strong>Awaiting Settlement</strong>. Our finance team will
            process it within 1–3 business days and credit your bank account.
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="text-emerald-500 hover:text-emerald-700 transition-colors text-xs font-body"
        >
          Dismiss
        </button>
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function VendorPayouts() {
  const { user } = useAuth();
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<WithdrawalForm>(EMPTY_FORM);
  const [showSuccess, setShowSuccess] = useState(false);

  // ── Fetch all payout data ──
  const fetchData = useCallback(async () => {
    if (!user) return;

    const [profileRes, txRes, wdRes] = await Promise.all([
      supabase.from("profiles").select("wallet_balance").eq("user_id", user.id).maybeSingle(),
      supabase
        .from("transactions")
        .select("*")
        .eq("vendor_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("withdrawal_requests")
        .select("*")
        .eq("vendor_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

    if (profileRes.data?.wallet_balance != null) {
      setWalletBalance(Number(profileRes.data.wallet_balance));
    }
    setTransactions(txRes.data || []);
    setWithdrawals(wdRes.data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();

    if (!user) return;

    // Real-time: listen to wallet_balance changes on profiles
    const profileChannel = supabase
      .channel(`vendor-wallet-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updated = payload.new as any;
          if (updated?.wallet_balance != null) {
            setWalletBalance(Number(updated.wallet_balance));
          }
        }
      );
    profileChannel.subscribe();

    // Real-time: listen to withdrawal_requests changes
    const wdChannel = supabase
      .channel(`vendor-withdrawals-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "withdrawal_requests",
          filter: `vendor_id=eq.${user.id}`,
        },
        () => fetchData()
      );
    wdChannel.subscribe();

    return () => {
      supabase.removeChannel(profileChannel);
      supabase.removeChannel(wdChannel);
    };
  }, [user, fetchData]);

  // ── Computed values ──
  const totalEarnings = transactions
    .filter((t) => t.type === "sale" && t.status === "completed")
    .reduce((s, t) => s + Number(t.gross_amount), 0);

  const totalCommission = transactions
    .filter((t) => t.type === "sale" && t.status === "completed")
    .reduce((s, t) => s + Number(t.platform_fee), 0);

  const totalWithdrawn = withdrawals
    .filter((w) => w.status === "approved")
    .reduce((s, w) => s + Number(w.amount), 0);

  const pendingWithdrawals = withdrawals
    .filter((w) => w.status === "pending")
    .reduce((s, w) => s + Number(w.amount), 0);

  const amountNum = form.amount === "" ? 0 : Number(form.amount);
  const exceedsBalance = amountNum > walletBalance;

  // ── Handle withdraw via RPC ──
  const handleWithdraw = async () => {
    if (!amountNum || amountNum <= 0) return toast.error("Enter a valid amount");
    if (exceedsBalance) return toast.error("Amount exceeds available balance");
    if (!form.bankName.trim()) return toast.error("Enter your bank name");
    if (form.accountNumber.length !== 10) return toast.error("Enter a valid 10-digit account number");
    if (!form.accountHolderName.trim()) return toast.error("Enter the account holder name");

    setSubmitting(true);

    // Try the RPC first; fall back to direct insert if RPC not deployed yet
    const rpcResult = await (supabase.rpc as any)("create_withdrawal_request", {
      vendor_id: user!.id,
      amount: amountNum,
      bank_info: {
        bank_name: form.bankName,
        account_number: form.accountNumber,
        account_holder_name: form.accountHolderName,
      },
    });

    let finalError = rpcResult?.error;

    // Fallback: direct insert if RPC is not available
    if (finalError && finalError.code === "PGRST202") {
      const fallback = await supabase.from("withdrawal_requests").insert({
        vendor_id: user!.id,
        amount: amountNum,
        bank_name: form.bankName,
        account_number: form.accountNumber,
        account_holder_name: form.accountHolderName,
      });
      finalError = fallback.error;
    }

    setSubmitting(false);

    if (finalError) {
      toast.error("Failed to submit withdrawal request. Please try again.");
      return;
    }

    setWithdrawOpen(false);
    setForm(EMPTY_FORM);
    setShowSuccess(true);
    fetchData();
  };

  const metrics = [
    {
      label: "Available Balance",
      value: formatNaira(walletBalance),
      icon: Wallet,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Total Earnings (Gross)",
      value: formatNaira(totalEarnings),
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
    },
    {
      label: "Commission Paid (15%)",
      value: formatNaira(totalCommission),
      icon: Percent,
      color: "text-orange-500",
      bg: "bg-orange-50 dark:bg-orange-950/40",
    },
    {
      label: "Total Withdrawn",
      value: formatNaira(totalWithdrawn),
      icon: ArrowDownToLine,
      color: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-950/40",
    },
  ];

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Wallet & Earnings</h1>
          <p className="text-muted-foreground font-body text-sm">
            Track your earnings, commissions, and withdrawals in real-time
          </p>
        </div>
        <Button onClick={() => setWithdrawOpen(true)} className="gap-2 font-body">
          <ArrowDownToLine className="h-4 w-4" /> Request Withdrawal
        </Button>
      </div>

      {/* ── Success Banner ── */}
      <AnimatePresence>
        {showSuccess && <SuccessBanner onDismiss={() => setShowSuccess(false)} />}
      </AnimatePresence>

      {/* ── Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <motion.div key={m.label} custom={i} initial="hidden" animate="visible" variants={fadeUp}>
            <Card className="border border-border hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-body text-muted-foreground uppercase tracking-wider">
                    {m.label}
                  </span>
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${m.bg}`}>
                    <m.icon className={`h-4 w-4 ${m.color}`} />
                  </div>
                </div>
                <p className="text-2xl font-display font-bold text-foreground tabular-nums">
                  {m.value}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ── Pending withdrawals notice ── */}
      {pendingWithdrawals > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="h-5 w-5 text-amber-500 shrink-0" />
            <p className="text-sm font-body text-amber-700 dark:text-amber-300">
              You have <strong>{formatNaira(pendingWithdrawals)}</strong> in pending withdrawal
              requests awaiting admin approval.
            </p>
          </CardContent>
        </Card>
      )}

      {/* ── Transaction History ── */}
      <Card className="border border-border">
        <CardHeader>
          <CardTitle className="text-lg font-display">Transaction History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {transactions.length === 0 ? (
            <div className="py-16 text-center">
              <ReceiptText className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
              <p className="font-body text-muted-foreground">No transactions yet.</p>
              <p className="font-body text-xs text-muted-foreground mt-1">
                Sales will appear here once your orders are delivered.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
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
                    <TableRow key={t.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell className="font-body text-sm whitespace-nowrap">
                        {new Date(t.created_at).toLocaleDateString("en-NG", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="font-body text-sm max-w-[200px] truncate">
                        {t.description}
                      </TableCell>
                      <TableCell className="font-body text-sm text-right tabular-nums">
                        {t.type === "sale" ? formatNaira(t.gross_amount) : "—"}
                      </TableCell>
                      <TableCell className="font-body text-sm text-right text-orange-500 tabular-nums">
                        {t.type === "sale" ? `-${formatNaira(t.platform_fee)}` : "—"}
                      </TableCell>
                      <TableCell
                        className={`font-body text-sm text-right font-semibold tabular-nums ${
                          t.type === "withdrawal" ? "text-destructive" : "text-primary"
                        }`}
                      >
                        {t.type === "withdrawal"
                          ? `-${formatNaira(Math.abs(t.net_amount))}`
                          : formatNaira(t.net_amount)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={t.status === "completed" ? "default" : "secondary"}
                          className="gap-1 text-xs"
                        >
                          {t.status === "completed" ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <Clock className="h-3 w-3" />
                          )}
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

      {/* ── Withdrawal Requests History ── */}
      <Card className="border border-border">
        <CardHeader>
          <CardTitle className="text-lg font-display">Withdrawal Requests</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {withdrawals.length === 0 ? (
            <div className="py-10 text-center">
              <Landmark className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="font-body text-sm text-muted-foreground">No withdrawal requests yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="font-body">Date</TableHead>
                    <TableHead className="font-body">Bank</TableHead>
                    <TableHead className="font-body">Account Holder</TableHead>
                    <TableHead className="font-body text-right">Amount</TableHead>
                    <TableHead className="font-body text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {withdrawals.map((w) => (
                    <TableRow key={w.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell className="font-body text-sm whitespace-nowrap">
                        {new Date(w.created_at).toLocaleDateString("en-NG", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="font-body text-sm">
                        {w.bank_name} ****{w.account_number.slice(-4)}
                      </TableCell>
                      <TableCell className="font-body text-sm text-muted-foreground">
                        {w.account_holder_name || "—"}
                      </TableCell>
                      <TableCell className="font-body text-sm text-right font-semibold tabular-nums">
                        {formatNaira(w.amount)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={
                            w.status === "approved"
                              ? "default"
                              : w.status === "rejected"
                              ? "destructive"
                              : "secondary"
                          }
                          className="gap-1 text-xs"
                        >
                          {w.status === "approved" ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : w.status === "rejected" ? (
                            <Ban className="h-3 w-3" />
                          ) : (
                            <Clock className="h-3 w-3" />
                          )}
                          {w.status === "approved"
                            ? "Approved"
                            : w.status === "rejected"
                            ? "Rejected"
                            : "Awaiting Settlement"}
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

      {/* ── Withdrawal Modal ── */}
      <Dialog open={withdrawOpen} onOpenChange={(v) => { setWithdrawOpen(v); if (!v) setForm(EMPTY_FORM); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Landmark className="h-4 w-4 text-primary" />
              </div>
              <DialogTitle className="font-display">Request Withdrawal</DialogTitle>
            </div>
            <DialogDescription className="font-body">
              Available balance:{" "}
              <strong className="text-primary">{formatNaira(walletBalance)}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Amount */}
            <div className="space-y-1.5">
              <Label className="font-body flex items-center gap-1.5">
                <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                Amount (₦)
              </Label>
              <Input
                type="number"
                placeholder="e.g. 50000"
                value={form.amount}
                onChange={(e) =>
                  setForm({ ...form, amount: e.target.value === "" ? "" : Number(e.target.value) })
                }
                max={walletBalance}
                className="font-body"
              />
              {exceedsBalance && amountNum > 0 && (
                <p className="text-xs text-destructive font-body">Exceeds available balance</p>
              )}
            </div>

            {/* Bank Name */}
            <div className="space-y-1.5">
              <Label className="font-body flex items-center gap-1.5">
                <Landmark className="h-3.5 w-3.5 text-muted-foreground" />
                Bank Name
              </Label>
              <Input
                placeholder="e.g. GTBank, Access Bank, UBA"
                value={form.bankName}
                onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                className="font-body"
              />
            </div>

            {/* Account Number */}
            <div className="space-y-1.5">
              <Label className="font-body flex items-center gap-1.5">
                <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                Account Number
              </Label>
              <Input
                placeholder="10-digit account number"
                maxLength={10}
                value={form.accountNumber}
                onChange={(e) =>
                  setForm({ ...form, accountNumber: e.target.value.replace(/\D/g, "") })
                }
                className="font-body tracking-widest"
              />
              {form.accountNumber.length > 0 && form.accountNumber.length !== 10 && (
                <p className="text-xs text-destructive font-body">Must be exactly 10 digits</p>
              )}
            </div>

            {/* Account Holder Name */}
            <div className="space-y-1.5">
              <Label className="font-body flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                Account Holder Name
              </Label>
              <Input
                placeholder="Name on the bank account"
                value={form.accountHolderName}
                onChange={(e) => setForm({ ...form, accountHolderName: e.target.value })}
                className="font-body"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => { setWithdrawOpen(false); setForm(EMPTY_FORM); }}
              disabled={submitting}
              className="font-body"
            >
              Cancel
            </Button>
            <Button
              onClick={handleWithdraw}
              disabled={
                submitting ||
                exceedsBalance ||
                !amountNum ||
                form.accountNumber.length !== 10 ||
                !form.bankName.trim() ||
                !form.accountHolderName.trim()
              }
              className="gap-2 font-body"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? "Submitting…" : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
