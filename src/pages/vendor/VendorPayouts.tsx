import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Wallet } from "lucide-react";

export default function VendorPayouts() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Payouts</h1>
        <p className="text-muted-foreground font-body text-sm">Track your earnings and withdrawals</p>
      </div>
      <Card className="border border-border">
        <CardHeader>
          <CardTitle className="text-lg font-display flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" /> Payout History
          </CardTitle>
          <CardDescription className="font-body">Your payout history will appear here once payment integration is active.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="font-body text-sm text-muted-foreground">Paystack Integration Pending — Payout tracking coming soon.</p>
        </CardContent>
      </Card>
    </div>
  );
}
