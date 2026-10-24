import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface RatingInfo {
  avg: number;
  count: number;
  loading: boolean;
}

type Entry = { avg: number; count: number };

/**
 * Shared rating store — the whole page makes ONE review fetch and keeps ONE
 * realtime channel, instead of one query + one channel per product card.
 * Aggregates live in a single module-level map, keeping memory small on long
 * product grids while ratings still update live for every card.
 */
const cache = new Map<string, Entry>();
const listeners = new Set<() => void>();
let loaded = false;
let inflight: Promise<void> | null = null;

const notify = () => listeners.forEach((l) => l());

function aggregate(rows: { product_id: string; rating: number }[]) {
  const sums = new Map<string, { sum: number; count: number }>();
  for (const r of rows) {
    const cur = sums.get(r.product_id) ?? { sum: 0, count: 0 };
    cur.sum += Number(r.rating) || 0;
    cur.count += 1;
    sums.set(r.product_id, cur);
  }
  cache.clear();
  sums.forEach((v, k) =>
    cache.set(k, { avg: Math.round((v.sum / v.count) * 10) / 10, count: v.count })
  );
}

function load(): Promise<void> {
  if (inflight) return inflight;
  inflight = (async () => {
    const { data } = await supabase
      .from("product_reviews")
      .select("product_id, rating");
    aggregate((data as { product_id: string; rating: number }[]) ?? []);
    loaded = true;
    inflight = null;
    notify();
  })();
  return inflight;
}

let channelReady = false;
function ensureChannel() {
  if (channelReady) return;
  channelReady = true;
  supabase
    .channel("product-ratings-live")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "product_reviews" },
      () => { load(); }
    )
    .subscribe();
}

/** Live average product rating from product_reviews. Falls back to deterministic placeholder when no reviews yet. */
export function useProductRating(productId: string): RatingInfo {
  const [, bump] = useState(0);

  useEffect(() => {
    const listener = () => bump((n) => n + 1);
    listeners.add(listener);
    ensureChannel();
    if (!loaded) load();
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const entry = cache.get(productId);
  return {
    avg: entry?.avg ?? 0,
    count: entry?.count ?? 0,
    loading: !loaded,
  };
}
