import React, { createContext, useContext, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  vendorId?: string;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  total: number;
  addItem: (id: string, name: string, price: number, vendorId?: string) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  checkout: (buyerId: string) => Promise<boolean>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const addItem = (id: string, name: string, price: number, vendorId?: string) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.id === id);
      if (existing) {
        return prev.map((item) =>
          item.id === id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { id, name, price, quantity: 1, vendorId }];
    });
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => setItems([]);

  const checkout = async (buyerId: string): Promise<boolean> => {
    if (items.length === 0) return false;

    // Group items by vendor (use first vendor or a placeholder)
    const vendorId = items[0]?.vendorId || buyerId;

    const orderItems = items.map((i) => ({
      product_id: i.id,
      name: i.name,
      price: i.price,
      quantity: i.quantity,
    }));

    const { error } = await supabase.from("orders").insert({
      buyer_id: buyerId,
      vendor_id: vendorId,
      items: orderItems as any,
      total_amount: total,
      status: "pending",
    });

    if (error) {
      toast({ title: "Checkout failed", description: error.message, variant: "destructive" });
      return false;
    }

    clearCart();
    toast({ title: "Order placed!", description: "Your order has been submitted successfully." });
    return true;
  };

  return (
    <CartContext.Provider value={{ items, itemCount, total, addItem, removeItem, clearCart, checkout }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};
