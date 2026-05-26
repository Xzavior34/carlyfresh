/**
 * Checkout Page — CarlyFresh
 * Delivery address + Paystack payment integration
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CreditCard,
  ShoppingCart,
  Loader2,
  MapPin,
  Clock,
} from "lucide-react";
import { usePaystackPayment } from "react-paystack";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import Navbar from "@/components/layout/Navbar";
import PersistentSubscribe from "@/components/PersistentSubscribe";
import Footer from "@/components/layout/Footer";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";

import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

import { formatNaira } from "@/lib/formatters";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const PAYSTACK_PUBLIC_KEY = import.meta.env
  .VITE_PAYSTACK_PUBLIC_KEY as string;

if (!PAYSTACK_PUBLIC_KEY) {
  console.error(
    "CRITICAL: VITE_PAYSTACK_PUBLIC_KEY is not set in environment variables. Paystack payments will fail."
  );
}

/** Delivery address validation schema */
const addressSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required").max(100),
  phone: z.string().trim().min(7, "Valid phone number required").max(20),
  address: z
    .string()
    .trim()
    .min(5, "Delivery address is required")
    .max(500),
  landmark: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(500).optional(),
});

type AddressFormValues = z.infer<typeof addressSchema>;

/** Paystack popup button */
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
  onSuccess: (response: any) => void;
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
        {
          display_name: "Order ID",
          variable_name: "order_id",
          value: orderId,
        },
      ],
    },
  };

  const initializePayment = usePaystackPayment(config as any);

  const handleClick = () => {
    if (!PAYSTACK_PUBLIC_KEY) {
      toast({
        title: "Paystack Not Configured",
        description: "Contact the administrator.",
        variant: "destructive",
      });
      return;
    }

    initializePayment({
      onSuccess,
    } as any);
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
  const { items, total, checkout, clearCart } = useCart();

  const { user } = useAuth();

  const navigate = useNavigate();

  const [processing, setProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
  const [addressConfirmed, setAddressConfirmed] = useState(false);
  const [orderCreated, setOrderCreated] = useState(false);

  const [deliveryWindow, setDeliveryWindow] = useState<string>(
    "As soon as possible"
  );

  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      address: "",
      landmark: "",
      notes: "",
    },
  });

  const onAddressSubmit = (data: AddressFormValues) => {
    setAddressConfirmed(true);

    toast({
      title: "Delivery address saved",
      description: data.address,
    });
  };

  /**
   * Create order in DB first,
   * then let Paystack button appear with real order ID
   */
  const handleCreateOrder = async () => {
    if (!user || items.length === 0 || processing) return;

    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission !== "granted"
    ) {
      toast({
        title: "Enable Notifications First",
        description:
          "Please tap the Enable Notifications button (bottom-right) to receive live order updates before placing your order.",
        variant: "destructive",
      });

      return;
    }

    setProcessing(true);

    // checkout() already sets status = pending
    const orderId = await checkout(
      user.id,
      form.getValues("address"),
      deliveryWindow
    );

    if (!orderId) {
      setProcessing(false);
      return;
    }

    // REMOVED REDUNDANT STATUS UPDATE

    setPlacedOrderId(orderId);
    setOrderCreated(true);
    setProcessing(false);
  };

  const onPaystackSuccess = async (response: any) => {
    clearCart();

    toast({
      title: "Payment Successful!",
      description: "Your order is being processed.",
    });

    let currentOrderNumber = "";

    if (placedOrderId) {
      // Mark confirmed immediately
      await supabase
        .from("orders")
        .update({ status: "confirmed" })
        .eq("id", placedOrderId);

      const { data: orderData } = await supabase
        .from("orders")
        .select("order_number")
        .eq("id", placedOrderId)
        .single();

      if (orderData) {
        currentOrderNumber = orderData.order_number;
      }
    }

    const { error: rpcError } = await supabase.rpc(
      "confirm_order_via_client",
      {
        target_order_identifier: currentOrderNumber.toString(),
        gateway_reference: response.reference,
        amount_paid: total,
      }
    );

    if (rpcError) {
      console.error("Fulfillment engine error:", rpcError);
    } else {
      navigate(`/orders/${placedOrderId}`);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    navigate("/orders");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <PersistentSubscribe />

      <section className="pt-28 pb-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="font-display text-3xl font-bold text-foreground mb-8 flex items-center gap-3">
              <CreditCard className="h-8 w-8 text-primary" />
              Checkout
            </h1>

            {items.length === 0 && !showSuccess ? (
              <Card className="border border-border">
                <CardContent className="py-16 text-center">
                  <ShoppingCart className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />

                  <p className="font-body text-muted-foreground">
                    Your cart is empty.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* DELIVERY ADDRESS */}
                <Card className="border border-border">
                  <CardHeader>
                    <CardTitle className="text-lg font-display flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      Delivery Address
                    </CardTitle>
                  </CardHeader>

                  <CardContent>
                    {addressConfirmed ? (
                      <div className="space-y-1">
                        <p className="font-body text-sm font-medium text-foreground">
                          {form.getValues("fullName")}
                        </p>

                        <p className="font-body text-sm text-muted-foreground">
                          {form.getValues("phone")}
                        </p>

                        <p className="font-body text-sm text-muted-foreground">
                          {form.getValues("address")}
                        </p>

                        <Button
                          variant="link"
                          className="p-0 h-auto text-primary font-body text-sm"
                          onClick={() => setAddressConfirmed(false)}
                        >
                          Change address
                        </Button>
                      </div>
                    ) : (
                      <Form {...form}>
                        <form
                          onSubmit={form.handleSubmit(onAddressSubmit)}
                          className="space-y-4"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="fullName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="font-body text-sm">
                                    Full Name *
                                  </FormLabel>

                                  <FormControl>
                                    <Input
                                      placeholder="John Doe"
                                      {...field}
                                      className="font-body"
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="phone"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="font-body text-sm">
                                    Phone *
                                  </FormLabel>

                                  <FormControl>
                                    <Input
                                      placeholder="+234..."
                                      {...field}
                                      className="font-body"
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="font-body text-sm">
                                  Delivery Address *
                                </FormLabel>

                                <FormControl>
                                  <Textarea
                                    placeholder="Enter full address"
                                    rows={2}
                                    {...field}
                                    className="font-body"
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          <Button type="submit" className="w-full font-body">
                            Confirm Address
                          </Button>
                        </form>
                      </Form>
                    )}
                  </CardContent>
                </Card>

                {/* DELIVERY SLOT */}
                <Card className="border border-border">
                  <CardHeader>
                    <CardTitle className="text-lg font-display flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" />
                      Delivery Time Slot
                    </CardTitle>
                  </CardHeader>

                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        "As soon as possible",
                        "Today: Morning",
                        "Today: Afternoon",
                        "Today: Evening",
                        "Tomorrow",
                      ].map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setDeliveryWindow(slot)}
                          className={`rounded-lg border px-3 py-2 text-left font-body text-sm ${
                            deliveryWindow === slot
                              ? "border-primary bg-primary/10"
                              : "border-border"
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* ORDER SUMMARY */}
                <Card className="border border-border">
                  <CardHeader>
                    <CardTitle className="text-lg font-display">
                      Order Summary
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between font-body text-sm"
                      >
                        <span className="text-foreground">
                          {item.name} × {item.quantity}
                        </span>

                        <span className="font-medium">
                          {formatNaira(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}

                    <div className="pt-3 border-t border-border flex justify-between">
                      <span className="font-display font-bold">Total</span>

                      <span className="font-display text-xl font-bold text-primary">
                        {formatNaira(total)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* ACTION BUTTONS */}
                {!addressConfirmed ? (
                  <Button className="w-full h-14" disabled>
                    Enter delivery address to continue
                  </Button>
                ) : !orderCreated ? (
                  <Button
                    className="w-full h-14"
                    onClick={handleCreateOrder}
                    disabled={processing}
                  >
                    {processing
                      ? "Creating order…"
                      : `Place Order — ${formatNaira(total)}`}
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

      <Footer />
    </div>
  );
  }
