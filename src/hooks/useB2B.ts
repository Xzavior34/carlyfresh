import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

/**
 * Returns whether the currently authenticated user is flagged as a B2B customer.
 * Returns false for guests or non-B2B users.
 */
export function useB2B() {
  const { user } = useAuth();
  const [isB2B, setIsB2B] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    if (!user) {
      setIsB2B(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from("profiles")
      .select("is_b2b_customer")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!mounted) return;
        setIsB2B(Boolean(data?.is_b2b_customer));
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [user]);

  return { isB2B, loading };
}

/**
 * Returns the effective per-unit price for a product based on B2B status.
 * Falls back to price_per_unit / price when no b2b_price is set or the user isn't B2B.
 */
export function getEffectiveUnitPrice(
  product: { price?: number | null; price_per_unit?: number | null; b2b_price?: number | null },
  isB2B: boolean,
): number {
  const regular = Number(product.price_per_unit ?? product.price ?? 0);
  if (isB2B && product.b2b_price != null) return Number(product.b2b_price);
  return regular;
}
