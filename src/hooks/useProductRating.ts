import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface RatingInfo {
  avg: number;
  count: number;
  loading: boolean;
}

/** Live average product rating from product_reviews. Falls back to deterministic placeholder when no reviews yet. */
export function useProductRating(productId: string): RatingInfo {
  const [info, setInfo] = useState<RatingInfo>({ avg: 0, count: 0, loading: true });

  useEffect(() => {
    let cancelled = false;
    const fetchRating = async () => {
      const { data } = await supabase
        .from("product_reviews")
        .select("rating")
        .eq("product_id", productId);
      if (cancelled) return;
      if (data && data.length > 0) {
        const avg = data.reduce((s, r: any) => s + r.rating, 0) / data.length;
        setInfo({ avg: Math.round(avg * 10) / 10, count: data.length, loading: false });
      } else {
        setInfo({ avg: 0, count: 0, loading: false });
      }
    };
    fetchRating();

    const channel = supabase
      .channel(`pr-rating-${productId}-${Math.random()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "product_reviews", filter: `product_id=eq.${productId}` },
        () => fetchRating()
      );

    channel.subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [productId]);

  return info;
}
