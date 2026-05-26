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
      if (existing) {
        const newQty = existing.quantity + 1;
        return prev.map((item) => (item.id === id ? recompute(existing, newQty) : item));
      }
      return [...prev, recompute({ id, name, price: pricePerUnit, vendorId, unit, pricePerUnit, bulkMinQty, bulkPrice, quantity: 1 }, 1)];
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
      // Create the order with 'pending' - this matches your database ENUM exactly
      const { data, error } = await supabase
        .from("orders")
        .insert({
          user_id: buyerId, // Ensure this matches your table column name (user_id vs buyer_id)
          status: "pending", 
          total_amount: total,
          delivery_address: deliveryAddress || "",
          delivery_window: deliveryWindow || null,
        })
        .select("id")
        .single();

      if (error) {
        console.error("Checkout Error:", error);
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
