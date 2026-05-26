import React, { createContext, useContext, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  vendorId?: string;
  unit: string;
  pricePerUnit: number;
  bulkMinQty?: number | null;
  bulkPrice?: number | null;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  total: number;
  isCheckingOut: boolean;
  addItem: (id: string, name: string, price: number, vendorId?: string, unit?: string, pricePerUnit?: number, bulkMinQty?: number | null, bulkPrice?: number | null) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  checkout: (buyerId: string, deliveryAddress?: string, deliveryWindow?: string) => Promise<string | null>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function effectiveUnitPrice(item: Pick<CartItem, "pricePerUnit" | "bulkMinQty" | "bulkPrice">, qty: number): number {
  if (item.bulkMinQty && item.bulkPrice && qty >= item.bulkMinQty) return Number(item.bulkPrice);
  return Number(item.pricePerUnit);
}

export function isBulkActive(item: Pick<CartItem, "bulkMinQty" | "bulkPrice" | "quantity">) {
  return Boolean(item.bulkMinQty && item.bulkPrice && item.quantity >= item.bulkMinQty);
}

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const recompute = (item: CartItem, qty: number): CartItem => ({
    ...item,
    quantity: qty,
    price: effectiveUnitPrice(item, qty),
  });

  const addItem = async (id: string, name: string, price: number, vendorId?: string, unit: string = "piece", pricePerUnit: number = price, bulkMinQty: number | null = null, bulkPrice: number | null = null) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.id === id);
      if (existing) return prev.map((item) => (item.id === id ? recompute(existing, existing.quantity + 1) : item));
      return [...prev, recompute({ id, name, price: pricePerUnit, vendorId, unit, pricePerUnit, bulkMinQty, bulkPrice, quantity: 1 }, 1)];
    });

    const OneSignalDeferred = (window as any).OneSignalDeferred || [];
    OneSignalDeferred.push(async (OneSignal: any) => {
      const isSubscribed = OneSignal.User?.PushSubscription?.optedIn;
      if (!isSubscribed) {
        console.log("[OneSignal] Prompting user for push notifications on add to cart...");
        if (OneSignal.Slidedown && typeof OneSignal.Slidedown.promptPush === "function") {
          OneSignal.Slidedown.promptPush().catch(console.error);
        } else if (OneSignal.Notifications && typeof OneSignal.Notifications.requestPermission === "function") {
          OneSignal.Notifications.requestPermission().catch(console.error);
        }
      }
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) { setItems((prev) => prev.filter((item) => item.id !== id)); return; }
    setItems((prev) => prev.map((item) => (item.id === id ? recompute(item, quantity) : item)));
  };

  const removeItem = (id: string) => setItems((prev) => prev.filter((item) => item.id !== id));
  const clearCart = () => setItems([]);

  const checkout = async (buyerId: string, deliveryAddress?: string, deliveryWindow?: string): Promise<string | null> => {
    if (items.length === 0 || isCheckingOut) return null;
    setIsCheckingOut(true);

    try {
      // Correctly mapping to your database schema
      const { data, error } = await supabase
        .from("orders")
        .insert({
          buyer_id: buyerId,
          vendor_id: items[0]?.vendorId || buyerId,
          items: items as any,
          total_amount: total,
          status: "pending", // VALID database enum value
          delivery_address: deliveryAddress || "",
          delivery_window: deliveryWindow || null,
        })
        .select("id")
        .single();

      if (error) {
        console.error("Database Insert Error:", error);
        toast({ title: "Checkout failed", description: error.message, variant: "destructive" });
        return null;
      }

      return data.id;
    } finally {
      setIsCheckingOut(false);
    }
  };

  React.useEffect(() => {
    const OneSignalDeferred = (window as any).OneSignalDeferred || [];
    OneSignalDeferred.push(async (OneSignal: any) => {
      try {
        if (OneSignal.User && typeof OneSignal.User.addTags === "function") {
          if (items.length > 0) {
            OneSignal.User.addTags({
              cart_active: "true",
              cart_item_count: items.reduce((sum, item) => sum + item.quantity, 0).toString(),
              cart_updated_at: new Date().toISOString()
            });
          } else {
            OneSignal.User.addTags({
              cart_active: "false"
            });
          }
        }
      } catch (err) {
        console.error("[OneSignal] Tag error:", err);
      }
    });
  }, [items]);

  return (
    <CartContext.Provider value={{ items, itemCount, total, isCheckingOut, addItem, updateQuantity, removeItem, clearCart, checkout }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};
