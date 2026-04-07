/**
 * Driver Earnings & Wallet — Real-time with withdrawal requests
 */
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Wallet, CheckCircle2, ArrowDownToLine, Loader2, Banknote } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { formatNaira } from "@/lib/formatters";
import { toast } from "@/hooks/use-toast";
import { DashboardSkeleton } from "@/components/ui/DashboardSkeleton";

interface DriverTx {
  id: string;
  driver_id: string;
  type: string;
  gross_amount: number;
  platform_fee: number;
  net_amount: number;
  status: string;
  description: string;
  created_at: string;
}

interface DriverWithdrawal {
  id: string;
  amount: number;
  bank_name: string;
  account_number: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

export default function DriverEarnings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<DriverTx[]>([]);
  const [withdrawals, setWithdrawals] = useState<DriverWithdrawal[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [wForm, setWForm] = useState({ amount: "", bank_name: "", account_number: "" });

  const fetchData = async () => {
    if (!user) return;
    const [txRes, wRes, walletRes] = await Promise.all([
      supabase.from("driver_transactions").select("*").eq("driver_id", user.id).order("created_at", { ascending: false }),
      supabase.from("driver_withdrawals").select("*").eq("driver_id", user.id).order("created_at", { ascending: false }),
      supabase.from("driver_wallet").select("*").eq("driver_id", user.id).maybeSingle(),
    ]);
    if (txRes.data) setTransactions(txRes.data as any);
    if (wRes.data) setWithdrawals(wRes.data as any);
    if (walletRes.data) setWalletBalance(Number((walletRes.data as any).balance || 0));
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    if (!user) return;
    const ch = supabase
      .channel("driver-earnings")
      .on("postgres_changes", { event: "*", schema: "public", table: "driver_transactions", filter: `driver_id=eq.${user.id}` }, () => fetchData())
      .on("postgres_changes", { event: "*", schema: "public", table: "driver_withdrawals", filter: `driver_id=eq.${user.id}` }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const pendingWithdrawals = withdrawals.filter(w => w.status === "pending" || w.status === "approved").reduce((s, w) => s + Number(w.amount), 0);
  const available = walletBalance - pendingWithdrawals;
  const totalEarnings = transactions.reduce((s, t) => s + Number(t.gross_amount), 0);
  const totalFees = transactions.reduce((s, t) => s + Number(t.platform_fee), 0);

  const submitWithdrawal = async () => {
    if (!user) return;
    const amt = Number(wForm.amount);
    if (!amt || amt <= 0 || amt > available) { toast({ title: "Invalid amount", variant: "destructive" }); return; }
    if (!wForm.bank_name.trim()) { toast({ title: "Bank name required", variant: "destructive" }); return; }
    if (!/^\d{10}$/.test(wForm.account_number)) { toast({ title: "Enter valid 10-digit account number", variant: "destructive" }); return; }
    setSubmitting(true);
    const { error } = await supabase.from("driver_withdrawals").insert([{
      driver_id: user.id, amount: amt, bank_name: wForm.bank_name.trim(), account_number: wForm.account_number
    }] as any);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Withdrawal requested!" }); setShowWithdraw(false); setWForm({ amount: "", bank_name: "", account_number: "" }); fetchData(); }
    setSubmitting(false);
  };

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Earnings & Wallet</h1>
        <p className="text-muted-foreground font-body text-sm">Track income and request payouts</p>
      </div>

      {/* Wallet cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-card to-primary/[0.03]">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center"><Wallet className="h-5 w-5 text-primary-foreground" /></div>
              <span className="text-[10px] font-body uppercase tracking-wider text-muted-foreground">Available</span>
            </div>
            <p className="text-2xl font-display font-bold text-foreground">{formatNaira(Math.max(available, 0))}</p>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="p-5">
            <span className="text-[10px] font-body uppercase tracking-wider text-muted-foreground">Total Earned</span>
            <p className="text-xl font-display font-bold text-foreground mt-1">{formatNaira(totalEarnings)}</p>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="p-5">
            <span className="text-[10px] font-body uppercase tracking-wider text-muted-foreground">Platform Fees</span>
            <p className="text-xl font-display font-bold text-foreground mt-1">{formatNaira(totalFees)}</p>
          </CardContent>
        </Card>
      </div>

      <Button className="font-body gap-2" onClick={() => setShowWithdraw(true)} disabled={available <= 0}>
        <ArrowDownToLine className="h-4 w-4" /> Request Withdrawal
      </Button>

      {/* Transactions */}
      <Card className="border border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-display flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-primary" /> Transaction History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <Banknote className="h-12 w-12 mx-auto text-muted-foreground/20 mb-3" />
              <p className="font-body text-sm text-muted-foreground">No transactions yet. Complete deliveries to earn!</p>
            </div>
          ) : transactions.map(tx => (
            <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50">
              <div>
                <p className="font-body text-sm font-medium text-foreground">{tx.description}</p>
                <p className="font-body text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className="font-display font-bold text-primary">{formatNaira(Number(tx.net_amount))}</p>
                <p className="font-body text-[10px] text-muted-foreground">Fee: {formatNaira(Number(tx.platform_fee))}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Withdrawal history */}
      {withdrawals.length > 0 && (
        <Card className="border border-border">
          <CardHeader className="pb-3"><CardTitle className="text-lg font-display">Withdrawal Requests</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {withdrawals.map(w => (
              <div key={w.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50">
                <div>
                  <p className="font-body text-sm font-medium text-foreground">{formatNaira(Number(w.amount))}</p>
                  <p className="font-body text-xs text-muted-foreground">{w.bank_name} · {w.account_number}</p>
                </div>
                <Badge variant={w.status === "approved" ? "default" : w.status === "rejected" ? "destructive" : "secondary"} className="font-body text-[10px] capitalize">{w.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Withdrawal modal */}
      <Dialog open={showWithdraw} onOpenChange={setShowWithdraw}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="font-display">Request Withdrawal</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <p className="font-body text-sm text-muted-foreground">Available: <span className="font-bold text-foreground">{formatNaira(Math.max(available, 0))}</span></p>
            <div className="space-y-2">
              <Label className="font-body">Amount (₦)</Label>
              <Input type="number" min="1" max={available} value={wForm.amount} onChange={e => setWForm(p => ({ ...p, amount: e.target.value }))} className="font-body" />
            </div>
            <div className="space-y-2">
              <Label className="font-body">Bank Name</Label>
              <Input value={wForm.bank_name} onChange={e => setWForm(p => ({ ...p, bank_name: e.target.value }))} className="font-body" placeholder="e.g. GTBank" />
            </div>
            <div className="space-y-2">
              <Label className="font-body">Account Number (10 digits)</Label>
              <Input value={wForm.account_number} maxLength={10} onChange={e => setWForm(p => ({ ...p, account_number: e.target.value.replace(/\D/g, "") }))} className="font-body" placeholder="0123456789" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWithdraw(false)} className="font-body" disabled={submitting}>Cancel</Button>
            <Button onClick={submitWithdrawal} className="font-body gap-2" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />} Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
