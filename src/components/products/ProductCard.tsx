import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import type { DBProduct } from "./ProductGrid";
import StarRating from "./StarRating";

const ProductCard = ({ product }: { product: DBProduct }) => {
  const { addItem } = useCart();
  const hasBulk = Boolean(product.bulk_min_qty && product.bulk_price);
  const [expanded, setExpanded] = useState(false);
  const description = product.description?.trim() || "";
  const isLong = description.length > 90;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-lg"
    >
      <Link to={`/shop/${product.id}`} className="block">
        <div className="relative flex h-40 items-center justify-center bg-secondary text-6xl">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} loading="lazy" decoding="async" className="h-full w-full object-cover" />
          ) : (
            <span className="text-4xl text-muted-foreground">📦</span>
          )}
          {hasBulk && (
            <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-accent/95 px-2 py-1 font-body text-[10px] font-semibold text-accent-foreground shadow-sm">
              <Sparkles className="h-3 w-3" /> Wholesale Available!
            </span>
          )}
        </div>
      </Link>
      <div className="p-4">
        <p className="font-body text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {product.category}
        </p>
        <Link to={`/shop/${product.id}`}>
          <h3 className="mt-1 font-display text-base font-semibold text-foreground hover:text-primary transition-colors">{product.name}</h3>
        </Link>
        <StarRating productId={product.id} />
        {description && (
          <div className="mt-1.5">
            <p
              id={`product-desc-${product.id}`}
              className={`font-body text-xs leading-relaxed text-muted-foreground ${expanded ? "" : "line-clamp-2"}`}
            >
              {description}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              {isLong && (
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  aria-expanded={expanded}
                  aria-controls={`product-desc-${product.id}`}
                  className="inline-flex min-h-[36px] items-center font-body text-xs font-medium text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm py-1.5 -my-1.5"
                >
                  {expanded ? "Read less" : "Read more"}
                </button>
              )}
              <Link
                to={`/shop/${product.id}`}
                className="inline-flex min-h-[36px] items-center font-body text-xs font-medium text-muted-foreground underline-offset-2 hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm py-1.5 -my-1.5"
                aria-label={`View full details for ${product.name}`}
              >
                View details →
              </Link>
            </div>
          </div>
        )}
        {hasBulk && (
          <p className="mt-1 font-body text-[11px] text-accent">
            ₦{Number(product.bulk_price).toLocaleString("en-NG")}/{product.unit_of_measurement} when buying {product.bulk_min_qty}+
          </p>
        )}
        <div className="mt-2 flex items-center justify-between">
          <div>
            <span className="font-display text-lg font-bold text-primary">₦{(product.price_per_unit || product.price).toLocaleString("en-NG")}</span>
            <span className="text-xs text-muted-foreground font-body">/{product.unit_of_measurement || "piece"}</span>
          </div>
          <motion.button
            onClick={() =>
              addItem(
                product.id,
                product.name,
                product.price_per_unit || product.price,
                product.vendor_id,
                product.unit_of_measurement || "piece",
                product.price_per_unit || product.price,
                product.bulk_min_qty ?? null,
                product.bulk_price ?? null,
              )
            }
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-md"
            aria-label={`Add ${product.name} to cart`}
          >
            <Plus size={18} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
