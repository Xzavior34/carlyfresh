/**
 * Vendor Reviews — read buyer feedback for this vendor's products
 */
import { useEffect, useMemo, useState } from "react";
import { Star, MessageSquareText, PackageOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { DashboardSkeleton } from "@/components/ui/DashboardSkeleton";

interface ReviewRow {
  id: string;
  product_id: string;
  buyer_id: string;
  rating: number;
  comment: string;
  created_at: string;
  product_name?: string;
  buyer_name?: string;
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < rating ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"}`}
        />
      ))}
    </div>
  );
}

export default function VendorReviews() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchAll = async () => {
      const { data } = await supabase
        .from("product_reviews")
        .select("id, product_id, buyer_id, rating, comment, created_at")
        .eq("vendor_id", user.id)
        .order("created_at", { ascending: false });
      const rows = (data || []) as ReviewRow[];

      // hydrate names
      if (rows.length > 0) {
        const productIds = Array.from(new Set(rows.map((r) => r.product_id)));
        const buyerIds = Array.from(new Set(rows.map((r) => r.buyer_id)));
        const [{ data: products }, { data: buyers }] = await Promise.all([
          supabase.from("products").select("id, name").in("id", productIds),
          supabase.from("profiles").select("user_id, full_name").in("user_id", buyerIds),
        ]);
        const pMap = new Map((products || []).map((p: any) => [p.id, p.name]));
        const bMap = new Map((buyers || []).map((b: any) => [b.user_id, b.full_name]));
        rows.forEach((r) => {
          r.product_name = pMap.get(r.product_id) || "Product";
          r.buyer_name = bMap.get(r.buyer_id) || "Customer";
        });
      }
      setReviews(rows);
      setLoading(false);
    };
    fetchAll();

    const ch = supabase
      .channel("vendor-reviews-rt")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "product_reviews", filter: `vendor_id=eq.${user.id}` },
        () => fetchAll()
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const avg = useMemo(() => {
    if (reviews.length === 0) return 0;
    return Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10;
  }, [reviews]);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Customer Reviews</h1>
          <p className="text-muted-foreground font-body text-sm">Feedback left by buyers on your products</p>
        </div>
        {reviews.length > 0 && (
          <div className="rounded-xl border border-border bg-card px-4 py-3 flex items-center gap-3">
            <Stars rating={Math.round(avg)} />
            <div>
              <p className="font-display text-lg font-bold text-foreground leading-none">{avg.toFixed(1)}</p>
              <p className="font-body text-[11px] text-muted-foreground">{reviews.length} review{reviews.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
        )}
      </div>

      {reviews.length === 0 ? (
        <Card className="border border-border">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <MessageSquareText className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-display text-lg font-semibold text-foreground mb-1">No reviews yet</h3>
            <p className="font-body text-sm text-muted-foreground max-w-sm">
              Reviews from buyers will appear here once they receive and rate your products.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.map((r) => (
            <Card key={r.id} className="border border-border">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-display flex items-center gap-2">
                      <PackageOpen className="h-4 w-4 text-primary" /> {r.product_name}
                    </CardTitle>
                    <p className="font-body text-xs text-muted-foreground mt-1">
                      by {r.buyer_name} · {new Date(r.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="secondary" className="font-body text-[11px]">{r.rating}/5</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <Stars rating={r.rating} />
                {r.comment && <p className="font-body text-sm text-foreground whitespace-pre-wrap">{r.comment}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
