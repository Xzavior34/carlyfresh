import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Check, Sparkles, Briefcase, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { useB2B, getEffectiveUnitPrice } from "@/hooks/useB2B";
import type { DBProduct } from "./ProductGrid";
import StarRating from "./StarRating";

const ProductCard = ({ product }: { product: DBProduct }) => {
  const { addItem } = useCart();
  const { isB2B } = useB2B();
  const hasBulk = Boolean(product.bulk_min_qty && product.bulk_price);
  const hasB2BPrice = isB2B && product.b2b_price != null;
  const effectivePrice = getEffectiveUnitPrice(product, isB2B);
  const [expanded, setExpanded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [added, setAdded] = useState(false);
  const description = product.description?.trim() || "";
  const isLong = description.length > 90;

  const handleAddToCart = () => {
    addItem(
      product.id,
      product.name,
      effectivePrice,
      product.vendor_id,
      product.unit_of_measurement || "piece",
      effectivePrice,
      product.bulk_min_qty ?? null,
      product.bulk_price ?? null,
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:shadow-xl hover:border-primary/30 flex flex-col justify-between"
    >
      <div>
        <Link to={`/shop/${product.id}`} className="block overflow-hidden relative">
          <div className="relative flex h-44 items-center justify-center bg-secondary/50 overflow-hidden">
            {product.image_url && !imgError ? (
              <img
                src={product.image_url}
                alt={product.name}
                loading="lazy"
                decoding="async"
                onError={() => setImgError(true)}
                className="h-full w-full object-cover group-hover:scale-108 transition-transform duration-500"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-muted-foreground/40">
                <ShoppingBag className="h-12 w-12 stroke-[1.2]" />
                <span className="text-[10px] font-body mt-1">Fresh Farm Product</span>
              </div>
            )}

            {/* Badges */}
            <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
              {hasBulk && (
                <span className="inline-flex items-center gap-1 rounded-full bg-accent/95 px-2.5 py-1 font-body text-[10px] font-bold text-accent-foreground shadow-sm backdrop-blur-md">
                  <Sparkles className="h-3 w-3 animate-pulse" /> Wholesale
                </span>
              )}
            </div>

            <span className="absolute top-2.5 right-2.5 rounded-full bg-background/85 backdrop-blur-md px-2.5 py-0.5 font-body text-[10px] font-semibold text-foreground shadow-sm">
              {product.category || "Grocery"}
            </span>
          </div>
        </Link>

        <div className="p-4">
          <Link to={`/shop/${product.id}`}>
            <h3 className="font-display text-base font-bold text-foreground hover:text-primary transition-colors line-clamp-1">
              {product.name}
            </h3>
          </Link>
          <div className="mt-1">
            <StarRating productId={product.id} />
          </div>

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
                    className="inline-flex min-h-[30px] items-center font-body text-xs font-medium text-primary underline-offset-2 hover:underline focus-visible:outline-none"
                  >
                    {expanded ? "Read less" : "Read more"}
                  </button>
                )}
              </div>
            </div>
          )}

          {hasBulk && (
            <p className="mt-1.5 font-body text-[11px] font-medium text-accent">
              ₦{Number(product.bulk_price).toLocaleString("en-NG")}/{product.unit_of_measurement} from {product.bulk_min_qty}+ units
            </p>
          )}
        </div>
      </div>

      <div className="p-4 pt-0 mt-auto">
        <div className="flex items-center justify-between pt-2 border-t border-border/40">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="font-display text-lg font-bold text-primary tabular-nums">
                ₦{effectivePrice.toLocaleString("en-NG")}
              </span>
              <span className="text-xs text-muted-foreground font-body">/{product.unit_of_measurement || "piece"}</span>
            </div>
            {hasB2BPrice && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 font-body text-[9px] font-semibold text-primary">
                <Briefcase className="h-2.5 w-2.5" /> B2B Price
              </span>
            )}
          </div>

          <motion.button
            onClick={handleAddToCart}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={`flex h-9 w-9 items-center justify-center rounded-full shadow-md transition-colors ${
              added
                ? "bg-emerald-600 text-white"
                : "bg-accent text-accent-foreground hover:bg-accent/90"
            }`}
            aria-label={`Add ${product.name} to cart`}
            title="Add to cart"
          >
            <AnimatePresence mode="wait">
              {added ? (
                <motion.div
                  key="check"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <Check size={18} className="stroke-[2.5]" />
                </motion.div>
              ) : (
                <motion.div
                  key="plus"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <Plus size={18} className="stroke-[2.5]" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
