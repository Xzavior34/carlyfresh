import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useCart } from "@/context/CartContext";
import type { DBProduct } from "./ProductGrid";
import StarRating from "./StarRating";

const ProductCard = ({ product }: { product: DBProduct }) => {
  const { addItem } = useCart();

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-lg"
    >
      <div className="relative flex h-40 items-center justify-center bg-secondary text-6xl">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} loading="lazy" decoding="async" className="h-full w-full object-cover" />
        ) : (
          <span className="text-4xl text-muted-foreground">📦</span>
        )}
      </div>
      <div className="p-4">
        <p className="font-body text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {product.category}
        </p>
        <h3 className="mt-1 font-display text-base font-semibold text-foreground">{product.name}</h3>
        <StarRating productId={product.id} />
        <div className="mt-2 flex items-center justify-between">
          <div>
            <span className="font-display text-lg font-bold text-primary">₦{(product.price_per_unit || product.price).toLocaleString("en-NG")}</span>
            <span className="text-xs text-muted-foreground font-body">/{product.unit_of_measurement || "piece"}</span>
          </div>
          <motion.button
            onClick={() => addItem(product.id, product.name, product.price_per_unit || product.price, product.vendor_id, product.unit_of_measurement || "piece", product.price_per_unit || product.price)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-md"
          >
            <Plus size={18} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
