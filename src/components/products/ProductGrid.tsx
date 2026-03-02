import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import ProductCard from "./ProductCard";
import CategoryFilter from "./CategoryFilter";

export interface DBProduct {
  id: string;
  name: string;
  price: number;
  category: string;
  image_url: string | null;
  in_stock: boolean;
  stock_level: number;
  vendor_id: string;
}

const ProductGrid = () => {
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<DBProduct[]>([]);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("in_stock", true);

      if (!error && data) {
        setProducts(data);
        const cats = ["All", ...Array.from(new Set(data.map((p) => p.category)))];
        setCategories(cats);
      }
      setLoading(false);
    };
    fetchProducts();
  }, []);

  const filtered = products.filter((p) => {
    const matchCat = category === "All" || p.category === category;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="flex flex-col gap-8 lg:flex-row">
      {/* Sidebar */}
      <div className="w-full shrink-0 lg:w-56">
        <CategoryFilter selected={category} onSelect={setCategory} search={search} onSearch={setSearch} categories={categories} />
      </div>

      {/* Grid */}
      <div className="flex-1">
        <p className="mb-6 font-body text-sm text-muted-foreground">
          {loading ? "Loading..." : `Showing ${filtered.length} product${filtered.length !== 1 ? "s" : ""}`}
        </p>
        <motion.div
          layout
          className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3"
        >
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </motion.div>
        {!loading && filtered.length === 0 && (
          <p className="py-20 text-center font-body text-muted-foreground">No products found.</p>
        )}
      </div>
    </div>
  );
};

export default ProductGrid;
