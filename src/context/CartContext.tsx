import React, { createContext, useContext, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

interface CartItem {
  id: string;
  name: string;
  /** Effective unit price (may switch to bulk_price when qty >= bulk_min_qty) */
  price: number;
  quantity: number;
  vendorId?: string;
  unit: string;
  /** Original (regular) per-unit price */
  pricePerUnit: number;
  /** Bulk pricing config */
  bulkMinQty?: number | null;
  bulkPrice?: number | null;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  total: number;
  isCheckingOut: boolean;
  addItem: (
    id: string,
    name: string,
    price: number,
    vendorId?: string,
    unit?: string,
    pricePerUnit?: number,
    bulkMinQty?: number | null,
    bulkPrice?: number | null,
  ) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  checkout: (buyerId: string, deliveryAddress?: string, deliveryWindow?: string) => Promise<string | null>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

/** Returns the effective unit price given qty + bulk config */
function effectiveUnitPrice(item: Pick<CartItem, "pricePerUnit" | "bulkMinQty" | "bulkPrice">, qty: number): number {
  if (item.bulkMinQty && item.bulkPrice && qty >= item.bulkMinQty) return Number(item.bulkPrice);
  return Number(item.pricePerUnit);
}

/** Whether bulk discount is active for this item right now */
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

  const addItem = (
    id: string,
    name: string,
    price: number,
    vendorId?: string,
    unit: string = "piece",
    pricePerUnit: number = price,
    bulkMinQty: number | null = null,
    bulkPrice: number | null = null,
  ) => {
    if (user?.id) {
      supabase.rpc('send_cart_notification', { p_user_id: user.id, p_message: `${name} has been added to your cart! 🛒` }).catch(console.error);
    }

    setItems((prev) => {
      const existing = prev.find((item) => item.id === id);
      if (existing) {
        const newQty = existing.quantity + 1;
        const wasBulk = isBulkActive(existing);
        const updated = recompute(existing, newQty);
        if (!wasBulk && isBulkActive(updated)) {
          toast({ title: "Bulk Discount Applied!", description: `${name} is now at wholesale price.` });
        }
        return prev.map((item) => (item.id === id ? updated : item));
      }
      const base: CartItem = {
        id,
        name,
        price: pricePerUnit,
        quantity: 1,
        vendorId,
        unit,
        pricePerUnit,
        bulkMinQty,
        bulkPrice,
      };
      return [...prev, recompute(base, 1)];
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((item) => item.id !== id));
      return;
    }
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const wasBulk = isBulkActive(item);
        const next = recompute(item, quantity);
        if (!wasBulk && isBulkActive(next)) {
          toast({ title: "Bulk Discount Applied!", description: `${item.name} is now at wholesale price.` });
        }
        return next;
      })
    );
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => setItems([]);

  const checkout = async (buyerId: string, deliveryAddress?: string, deliveryWindow?: string): Promise<string | null> => {
    if (items.length === 0 || isCheckingOut) return null;
    setIsCheckingOut(true);

    try {
      const vendorId = items[0]?.vendorId || buyerId;

      const orderItems = items.map((i) => ({
        product_id: i.id,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        unit: i.unit,
      }));

      const { data, error } = await supabase
        .from("orders")
        .insert({
          buyer_id: buyerId,
          vendor_id: vendorId,
          items: orderItems as any,
          total_amount: total,
          status: "pending",
          delivery_address: deliveryAddress || "",
          delivery_window: deliveryWindow || null,
        } as any)
        .select("id")
        .single();

      if (error) {
        toast({ title: "Checkout failed", description: error.message, variant: "destructive" });
        return null;
      }

      return data.id;
    } finally {
      setIsCheckingOut(false);
    }
  };

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
