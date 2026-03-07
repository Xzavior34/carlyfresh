import { Star } from "lucide-react";

/** Deterministic pseudo-random rating from product id */
function getRating(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  const base = 3.5 + (Math.abs(hash) % 15) / 10; // 3.5–5.0
  return Math.round(base * 10) / 10;
}

export default function StarRating({ productId }: { productId: string }) {
  const rating = getRating(productId);
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i < full
              ? "fill-amber-400 text-amber-400"
              : i === full && half
              ? "fill-amber-400/50 text-amber-400"
              : "fill-muted text-muted"
          }`}
        />
      ))}
      <span className="font-body text-[11px] text-muted-foreground ml-0.5">{rating}</span>
    </div>
  );
}