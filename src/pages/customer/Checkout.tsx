/**
 * Checkout Page — CarlyFresh
 * Delivery address + Paystack payment integration
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, ShoppingCart, CheckCircle2, Loader2, MapPin } from "lucide-react";
import { usePaystackPayment } from "react-paystack";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { formatNaira } from "@/lib/formatters";
import { toast } from "@/hooks/use-toast";

const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY as string;

if (!PAYSTACK_PUBLIC_KEY) {
  console.error("CRITICAL: VITE_PAYSTACK_PUBLIC_KEY is not set in environment variables. Paystack payments will fail.");
}

/** Delivery address validation schema */
const addressSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required").max(100),
  phone: z.string().trim().min(7, "Valid phone number required").max(20),
  address: z.string().trim().min(5, "Delivery address is required").max(500),
  landmark: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(500).optional(),
});

type AddressFormValues = z.infer<typeof addressSchema>;

/** Paystack popup button */
function PaystackButton({
  email, amountKobo, orderId, onSuccess, disabled,
}: {
  email: string; amountKobo: number; orderId: string; onSuccess: () => void; disabled: boolean;
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
      toast({ title: "Paystack Not Configured", description: "Contact the administrator.", variant: "destructive" });
      return;
    }
    initializePayment({ onSuccess } as any);
  };

  return (
    <Button className="w-full h-14 font-body text-base font-semibold gap-2" onClick={handleClick} disabled={disabled}>
      {disabled ? (
        <><Loader2 className="h-5 w-5 animate-spin" /> Processing…</>
      ) : (
        <><CreditCard className="h-5 w-5" /> Pay {formatNaira(amountKobo / 100)} with Paystack</>
      )}
    </Button>
  );
}

export default function Checkout() {
  const { items, total, checkout, isCheckingOut, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
  const [addressConfirmed, setAddressConfirmed] = useState(false);
  const [orderCreated, setOrderCreated] = useState(false);

  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: { fullName: "", phone: "", address: "", landmark: "", notes: "" },
  });

  const onAddressSubmit = (data: AddressFormValues) => {
    setAddressConfirmed(true);
    toast({ title: "Delivery address saved", description: data.address });
  };

  /** Create order in DB first, then let Paystack button appear with real order ID */
  const handleCreateOrder = async () => {
    if (!user || items.length === 0 || processing) return;
    setProcessing(true);
    const orderId = await checkout(user.id);
    if (!orderId) { setProcessing(false); return; }
    setPlacedOrderId(orderId);
    setOrderCreated(true);
    setProcessing(false);
  };

  

  const onPaystackSuccess = () => {
    clearCart();
    setShowSuccess(true);
    toast({ title: "Payment Successful!", description: "Your order is being processed." });
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    navigate("/orders");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="pt-28 pb-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12 max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="font-display text-3xl font-bold text-foreground mb-8 flex items-center gap-3">
              <CreditCard className="h-8 w-8 text-primary" /> Checkout
            </h1>

            {items.length === 0 && !showSuccess ? (
              <Card className="border border-border">
                <CardContent className="py-16 text-center">
                  <ShoppingCart className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
                  <p className="font-body text-muted-foreground">Your cart is empty.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Delivery Address */}
                <Card className="border border-border">
                  <CardHeader>
                    <CardTitle className="text-lg font-display flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" /> Delivery Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {addressConfirmed ? (
                      <div className="space-y-1">
                        <p className="font-body text-sm font-medium text-foreground">{form.getValues("fullName")}</p>
                        <p className="font-body text-sm text-muted-foreground">{form.getValues("phone")}</p>
                        <p className="font-body text-sm text-muted-foreground">{form.getValues("address")}</p>
                        {form.getValues("landmark") && (
                          <p className="font-body text-xs text-muted-foreground">Landmark: {form.getValues("landmark")}</p>
                        )}
                        <Button variant="link" className="p-0 h-auto text-primary font-body text-sm" onClick={() => setAddressConfirmed(false)}>
                          Change address
                        </Button>
                      </div>
                    ) : (
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onAddressSubmit)} className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField control={form.control} name="fullName" render={({ field }) => (
                              <FormItem>
                                <FormLabel className="font-body text-sm">Full Name *</FormLabel>
                                <FormControl><Input placeholder="John Doe" {...field} className="font-body" /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                            <FormField control={form.control} name="phone" render={({ field }) => (
                              <FormItem>
                                <FormLabel className="font-body text-sm">Phone *</FormLabel>
                                <FormControl><Input placeholder="+234 800 123 4567" {...field} className="font-body" /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                          </div>
                          <FormField control={form.control} name="address" render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-body text-sm">Delivery Address *</FormLabel>
                              <FormControl><Textarea placeholder="Enter your full delivery address in Port Harcourt" rows={2} {...field} className="font-body" /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="landmark" render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-body text-sm">Nearest Landmark</FormLabel>
                              <FormControl><Input placeholder="e.g. Opposite First Bank" {...field} className="font-body" /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="notes" render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-body text-sm">Delivery Notes</FormLabel>
                              <FormControl><Input placeholder="e.g. Call before delivery" {...field} className="font-body" /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <Button type="submit" className="w-full font-body">
                            Confirm Address
                          </Button>
                        </form>
                      </Form>
                    )}
                  </CardContent>
                </Card>

                {/* Order Summary */}
                <Card className="border border-border">
                  <CardHeader>
                    <CardTitle className="text-lg font-display">Order Summary</CardTitle>
                  </CardHeader>
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

                {/* Payment */}
                {!addressConfirmed ? (
                  <Button className="w-full h-14 font-body text-base font-semibold" disabled>
                    Enter delivery address to continue
                  </Button>
                ) : !orderCreated ? (
                  <Button
                    className="w-full h-14 font-body text-base font-semibold gap-2"
                    onClick={handleCreateOrder}
                    disabled={processing || isCheckingOut}
                  >
                    {processing || isCheckingOut ? (
                      <><Loader2 className="h-5 w-5 animate-spin" /> Creating order…</>
                    ) : (
                      <><CreditCard className="h-5 w-5" /> Place Order — {formatNaira(total)}</>
                    )}
                  </Button>
                ) : user ? (
                  <PaystackButton
                    email={user.email || ""}
                    amountKobo={Math.round(total * 100)}
                    orderId={placedOrderId!}
                    onSuccess={onPaystackSuccess}
                    disabled={processing}
                  />
                ) : null}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Success Modal */}
      <Dialog open={showSuccess} onOpenChange={handleSuccessClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="items-center text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15 }}>
              <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-4" />
            </motion.div>
            <DialogTitle className="font-display text-2xl">Payment Successful!</DialogTitle>
            <DialogDescription className="font-body text-muted-foreground">
              Your order has been placed. You'll receive real-time updates as it progresses.
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
