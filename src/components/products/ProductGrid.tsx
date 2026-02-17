import { useState } from "react";
import { motion } from "framer-motion";
import { products } from "@/data/mockData";
import ProductCard from "./ProductCard";
import CategoryFilter from "./CategoryFilter";

const ProductGrid = () => {
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = products.filter((p) => {
    const matchCat = category === "All" || p.category === category;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="flex flex-col gap-8 lg:flex-row">
      {/* Sidebar */}
      <div className="w-full shrink-0 lg:w-56">
        <CategoryFilter selected={category} onSelect={setCategory} search={search} onSearch={setSearch} />
      </div>

      {/* Grid */}
      <div className="flex-1">
        <p className="mb-6 font-body text-sm text-muted-foreground">
          Showing {filtered.length} product{filtered.length !== 1 ? "s" : ""}
        </p>
        <motion.div
          layout
          className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3"
        >
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </motion.div>
        {filtered.length === 0 && (
          <p className="py-20 text-center font-body text-muted-foreground">No products found.</p>
        )}
      </div>
    </div>
  );
};

export default ProductGrid;
