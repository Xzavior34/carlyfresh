/**
 * Public Product Detail Page — /shop/:productId
 * Shows full product, bulk pricing, and all written reviews.
 */
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Sparkles, Star, ArrowLeft, MessageSquareText } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/context/CartContext";
import { formatNaira } from "@/lib/formatters";

interface Product {
  id: string;
  name: string;
  category: string;
  image_url: string | null;
  price: number;
  price_per_unit: number;
  unit_of_measurement: string;
  vendor_id: string;
  in_stock: boolean;
  bulk_min_qty: number | null;
  bulk_price: number | null;
  description?: string | null;
}

interface Review {
  id: string;
  buyer_id: string;
  rating: number;
  comment: string;
  created_at: string;
  buyer_name?: string;
}

function Stars({ rating, size = 4 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`h-${size} w-${size} ${i < rating ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"}`}
        />
      ))}
    </div>
  );
}

export default function ProductDetail() {
  const { productId } = useParams<{ productId: string }>();
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId) return;
    const fetchAll = async () => {
      const [{ data: p }, { data: r }] = await Promise.all([
        supabase.from("products").select("*").eq("id", productId).maybeSingle(),
        supabase.from("product_reviews").select("id, buyer_id, rating, comment, created_at").eq("product_id", productId).order("created_at", { ascending: false }),
      ]);
      if (p) setProduct(p as any);

      const reviewRows = (r || []) as Review[];
      if (reviewRows.length > 0) {
        const buyerIds = Array.from(new Set(reviewRows.map((x) => x.buyer_id)));
        const { data: buyers } = await supabase.from("profiles").select("user_id, full_name").in("user_id", buyerIds);
        const bMap = new Map((buyers || []).map((b: any) => [b.user_id, b.full_name]));
        reviewRows.forEach((row) => { row.buyer_name = bMap.get(row.buyer_id) || "Customer"; });
      }
      setReviews(reviewRows);
      setLoading(false);
    };
    fetchAll();

    const ch = supabase
      .channel(`product-detail-${productId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "product_reviews", filter: `product_id=eq.${productId}` }, () => fetchAll())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [productId]);

  const avg = reviews.length === 0 ? 0 : Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10;
  const hasBulk = product && product.bulk_min_qty && product.bulk_price;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="pt-28 pb-24">
        <div className="container mx-auto px-6 lg:px-12 max-w-4xl">
          <Link to="/shop" className="inline-flex items-center gap-1 font-body text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" /> Back to shop
          </Link>

          {loading ? (
            <div className="grid md:grid-cols-2 gap-8">
              <div className="h-80 rounded-2xl bg-muted animate-pulse" />
              <div className="space-y-4">
                <div className="h-6 w-48 bg-muted animate-pulse rounded" />
                <div className="h-10 w-72 bg-muted animate-pulse rounded" />
                <div className="h-4 w-40 bg-muted animate-pulse rounded" />
              </div>
            </div>
          ) : !product ? (
            <p className="font-body text-center text-muted-foreground py-20">Product not found.</p>
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid md:grid-cols-2 gap-8">
              {/* Image */}
              <div className="relative rounded-2xl overflow-hidden bg-secondary aspect-square">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-6xl">📦</div>
                )}
                {hasBulk && (
                  <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-accent/95 px-3 py-1 font-body text-xs font-semibold text-accent-foreground shadow-sm">
                    <Sparkles className="h-3.5 w-3.5" /> Wholesale Available!
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="space-y-4">
                <Badge variant="secondary" className="font-body text-[11px]">{product.category}</Badge>
                <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">{product.name}</h1>

                <div className="flex items-center gap-3">
                  <Stars rating={Math.round(avg)} />
                  <span className="font-body text-sm text-muted-foreground">
                    {reviews.length > 0 ? `${avg.toFixed(1)} · ${reviews.length} review${reviews.length !== 1 ? "s" : ""}` : "No reviews yet"}
                  </span>
                </div>

                <div className="space-y-1">
                  <p>
                    <span className="font-display text-3xl font-bold text-primary">{formatNaira(product.price_per_unit || product.price)}</span>
                    <span className="text-sm text-muted-foreground font-body ml-1">/ {product.unit_of_measurement}</span>
                  </p>
                  {hasBulk && (
                    <p className="font-body text-sm text-accent">
                      Buy {product.bulk_min_qty}+ → {formatNaira(Number(product.bulk_price))}/{product.unit_of_measurement}
                    </p>
                  )}
                </div>

                <Button
                  size="lg"
                  className="font-body gap-2 w-full sm:w-auto"
                  disabled={!product.in_stock}
                  onClick={() =>
                    addItem(
                      product.id,
                      product.name,
                      product.price_per_unit || product.price,
                      product.vendor_id,
                      product.unit_of_measurement,
                      product.price_per_unit || product.price,
                      product.bulk_min_qty,
                      product.bulk_price,
                    )
                  }
                >
                  <Plus className="h-4 w-4" /> {product.in_stock ? "Add to Cart" : "Out of Stock"}
                </Button>
              </div>
            </motion.div>
          )}

          {/* Description */}
          {!loading && product && product.description && product.description.trim().length > 0 && (
            <div className="mt-12">
              <h2 className="font-display text-xl font-bold text-foreground mb-3">About this product</h2>
              <Card className="border border-border">
                <CardContent className="p-5">
                  <p className="font-body text-sm leading-relaxed text-foreground whitespace-pre-wrap">{product.description}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Reviews */}
          {!loading && product && (
            <div className="mt-16">
              <div className="flex items-center gap-2 mb-6">
                <MessageSquareText className="h-5 w-5 text-primary" />
                <h2 className="font-display text-xl font-bold text-foreground">Customer Reviews</h2>
              </div>
              {reviews.length === 0 ? (
                <Card className="border border-border">
                  <CardContent className="py-12 text-center">
                    <p className="font-body text-muted-foreground">No reviews yet. Be the first to review this product after purchase.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {reviews.map((r) => (
                    <Card key={r.id} className="border border-border">
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="font-body text-sm font-semibold text-foreground">{r.buyer_name}</p>
                          <span className="font-body text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                        </div>
                        <Stars rating={r.rating} />
                        {r.comment && <p className="font-body text-sm text-foreground whitespace-pre-wrap">{r.comment}</p>}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}
