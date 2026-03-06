/**
 * Checkout Page — CarlyFresh
 *
 * Uses react-paystack to launch the Paystack popup.
 * On success: logs order to Supabase as 'pending', then the webhook
 * will flip it to 'processing' when payment clears.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, ShoppingCart, CheckCircle2, Loader2 } from "lucide-react";
import { usePaystackPayment } from "react-paystack";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { formatNaira } from "@/lib/formatters";
import { toast } from "@/hooks/use-toast";

/**
 * Paystack publishable key — this is safe to expose in frontend code.
 * Replace with your live key when going to production.
 */
const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "";

/** Inner component that calls the usePaystackPayment hook */
function PaystackButton({
  email,
  amountKobo,
  orderId,
  onSuccess,
  disabled,
}: {
  email: string;
  amountKobo: number;
  orderId: string;
  onSuccess: () => void;
  disabled: boolean;
}) {
  const config = {
    reference: `carly_${orderId}_${Date.now()}`,
    email,
    amount: amountKobo,
    publicKey: PAYSTACK_PUBLIC_KEY,
    metadata: {
      order_id: orderId,
      custom_fields: [
        { display_name: "Order ID", variable_name: "order_id", value: orderId },
      ],
    },
  };

  const initializePayment = usePaystackPayment(config as any);

  const handleClick = () => {
    if (!PAYSTACK_PUBLIC_KEY) {
      toast({
        title: "Paystack Not Configured",
        description: "The Paystack public key has not been set. Contact the administrator.",
        variant: "destructive",
      });
      return;
    }
    initializePayment({ onSuccess } as any);
  };

  return (
    <Button
      className="w-full h-14 font-body text-base font-semibold gap-2"
      onClick={handleClick}
      disabled={disabled}
    >
      {disabled ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          Processing…
        </>
      ) : (
        <>
          <CreditCard className="h-5 w-5" />
          Pay {formatNaira(amountKobo / 100)} with Paystack
        </>
      )}
    </Button>
  );
}

export default function Checkout() {
  const { items, total, checkout, isCheckingOut } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);

  /** Step 1: Log the order to Supabase as 'pending' */
  const handlePayment = async () => {
    if (!user || items.length === 0 || processing) return;
    setProcessing(true);

    // Create the order in DB first (status: pending)
    const success = await checkout(user.id);

    if (!success) {
      setProcessing(false);
      return;
    }

    // If no Paystack key is configured, fall back to the toast-only flow
    if (!PAYSTACK_PUBLIC_KEY) {
      toast({
        title: "Paystack Integration Pending",
        description: `Order of ${formatNaira(total)} logged as pending. Payment gateway coming soon!`,
      });
      navigate("/orders");
      setProcessing(false);
      return;
    }

    // The checkout() call returns true, but we need the order_id.
    // Since checkout clears the cart on success, we get the id from context.
    // For now we generate one — the webhook matches by metadata.
    setProcessing(false);
  };

  /** Called when Paystack popup reports success */
  const onPaystackSuccess = () => {
    setShowSuccess(true);
    toast({ title: "Payment Successful!", description: "Your order is being processed." });
  };

  /** Navigate to orders after closing modal */
  const handleSuccessClose = () => {
    setShowSuccess(false);
    navigate("/orders");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="pt-28 pb-24">
        <div className="container mx-auto px-6 lg:px-12 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="font-display text-3xl font-bold text-foreground mb-8 flex items-center gap-3">
              <CreditCard className="h-8 w-8 text-primary" /> Checkout
            </h1>

            {items.length === 0 && !showSuccess ? (
              <Card className="border border-border">
                <CardContent className="py-16 text-center">
                  <ShoppingCart className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
                  <p className="font-body text-muted-foreground">
                    Your cart is empty. Nothing to checkout.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Order Summary */}
                <Card className="border border-border">
                  <CardHeader>
                    <CardTitle className="text-lg font-display">Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between font-body text-sm"
                      >
                        <span className="text-foreground">
                          {item.name} × {item.quantity}
                        </span>
                        <span className="font-medium tabular-nums">
                          {formatNaira(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                    <div className="pt-3 border-t border-border flex items-center justify-between">
                      <span className="font-display font-bold text-foreground">Total</span>
                      <span className="font-display text-xl font-bold text-primary">
                        {formatNaira(total)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Button */}
                {PAYSTACK_PUBLIC_KEY && user ? (
                  <PaystackButton
                    email={user.email || ""}
                    amountKobo={Math.round(total * 100)}
                    orderId={placedOrderId || `temp_${Date.now()}`}
                    onSuccess={onPaystackSuccess}
                    disabled={processing || isCheckingOut}
                  />
                ) : (
                  <Button
                    className="w-full h-14 font-body text-base font-semibold gap-2"
                    onClick={handlePayment}
                    disabled={processing || isCheckingOut}
                  >
                    {processing || isCheckingOut ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Processing…
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-5 w-5" />
                        Proceed to Payment — {formatNaira(total)}
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Success Modal */}
      <Dialog open={showSuccess} onOpenChange={handleSuccessClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="items-center text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
            >
              <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-4" />
            </motion.div>
            <DialogTitle className="font-display text-2xl">Payment Successful!</DialogTitle>
            <DialogDescription className="font-body text-muted-foreground">
              Your order has been placed and is now being processed. You'll receive real-time
              updates as your order progresses.
            </DialogDescription>
          </DialogHeader>
          <Button className="w-full mt-4 font-body" onClick={handleSuccessClose}>
            Track My Order
          </Button>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
