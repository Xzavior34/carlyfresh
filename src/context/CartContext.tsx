import React, { createContext, useContext, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  vendorId?: string;
  unit: string;
  pricePerUnit: number;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  total: number;
  isCheckingOut: boolean;
  addItem: (id: string, name: string, price: number, vendorId?: string, unit?: string, pricePerUnit?: number) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  checkout: (buyerId: string) => Promise<string | null>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const addItem = (id: string, name: string, price: number, vendorId?: string, unit: string = "piece", pricePerUnit: number = price) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.id === id);
      if (existing) {
        return prev.map((item) =>
          item.id === id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { id, name, price: pricePerUnit, quantity: 1, vendorId, unit, pricePerUnit }];
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((item) => item.id !== id));
      return;
    }
    setItems((prev) => prev.map((item) => item.id === id ? { ...item, quantity } : item));
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => setItems([]);

  const checkout = async (buyerId: string): Promise<string | null> => {
    if (items.length === 0 || isCheckingOut) return null;
    setIsCheckingOut(true);

    try {
      const vendorId = items[0]?.vendorId || buyerId;

      const orderItems = items.map((i) => ({
        product_id: i.id,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
      }));

      const { data, error } = await supabase.from("orders").insert({
        buyer_id: buyerId,
        vendor_id: vendorId,
        items: orderItems as any,
        total_amount: total,
        status: "pending",
      }).select("id").single();

      if (error) {
        toast({ title: "Checkout failed", description: error.message, variant: "destructive" });
        return null;
      }

      // Do NOT clear cart or show success here — that must only happen
      // after Paystack confirms payment via onSuccess callback
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
