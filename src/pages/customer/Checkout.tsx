import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CreditCard, ShoppingCart } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { formatNaira } from "@/lib/formatters";
import { toast } from "@/hooks/use-toast";

export default function Checkout() {
  const { items, total, checkout, isCheckingOut } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);

  const handlePayment = async () => {
    if (!user || items.length === 0 || processing) return;
    setProcessing(true);

    // Log order as pending_payment
    const success = await checkout(user.id);

    if (success) {
      toast({ title: "Paystack Integration Pending", description: `Order of ${formatNaira(total)} logged as pending. Payment gateway coming soon!` });
      navigate("/orders");
    }
    setProcessing(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="pt-28 pb-24">
        <div className="container mx-auto px-6 lg:px-12 max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="font-display text-3xl font-bold text-foreground mb-8 flex items-center gap-3">
              <CreditCard className="h-8 w-8 text-primary" /> Checkout
            </h1>

            {items.length === 0 ? (
              <Card className="border border-border">
                <CardContent className="py-16 text-center">
                  <ShoppingCart className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
                  <p className="font-body text-muted-foreground">Your cart is empty. Nothing to checkout.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                <Card className="border border-border">
                  <CardHeader><CardTitle className="text-lg font-display">Order Summary</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between font-body text-sm">
                        <span className="text-foreground">{item.name} × {item.quantity}</span>
                        <span className="font-medium tabular-nums">{formatNaira(item.price * item.quantity)}</span>
                      </div>
                    ))}
                    <div className="pt-3 border-t border-border flex items-center justify-between">
                      <span className="font-display font-bold text-foreground">Total</span>
                      <span className="font-display text-xl font-bold text-primary">{formatNaira(total)}</span>
                    </div>
                  </CardContent>
                </Card>

                <Button
                  className="w-full h-14 font-body text-base font-semibold gap-2"
                  onClick={handlePayment}
                  disabled={processing || isCheckingOut}
                >
                  {processing || isCheckingOut ? (
                    <>
                      <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Processing…
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5" />
                      Proceed to Payment — {formatNaira(total)}
                    </>
                  )}
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
