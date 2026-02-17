import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useCart } from "@/context/CartContext";
import type { Product } from "@/data/mockData";

const ProductCard = ({ product }: { product: Product }) => {
  const { addItem } = useCart();

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-lg"
    >
      <div className="relative flex h-40 items-center justify-center bg-secondary text-6xl">
        {product.image}
        {product.tag && (
          <span className="absolute left-3 top-3 rounded-full bg-primary px-2.5 py-0.5 font-body text-[10px] font-semibold text-primary-foreground">
            {product.tag}
          </span>
        )}
      </div>
      <div className="p-4">
        <p className="font-body text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {product.category}
        </p>
        <h3 className="mt-1 font-display text-base font-semibold text-foreground">{product.name}</h3>
        <p className="mt-1 font-body text-xs leading-relaxed text-muted-foreground line-clamp-2">
          {product.description}
        </p>
        <div className="mt-3 flex items-center justify-between">
          <span className="font-display text-lg font-bold text-primary">€{product.price.toFixed(2)}</span>
          <motion.button
            onClick={() => addItem(product.id, product.name, product.price)}
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
