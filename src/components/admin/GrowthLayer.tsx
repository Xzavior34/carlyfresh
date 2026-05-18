import { useState, useEffect } from "react";
import { TrendingUp, MessageSquareText, Trash2, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Review {
  id: string;
  reviewer_name: string;
  rating: number;
  comment: string;
  created_at: string;
  products?: { name: string };
}

export default function GrowthLayer() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchGrowthData = async () => {
    setLoading(true);
    // Fetch live user metrics alongside incoming social proof arrays
    const [reviewsRes, usersRes] = await Promise.all([
      supabase.from("product_reviews").select("*, products(name)").order("created_at", { ascending: false }).limit(10),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
    ]);

    if (reviewsRes.data) setReviews(reviewsRes.data as any);
    if (usersRes.count !== null) setTotalUsers(usersRes.count);
    setLoading(false);
  };

  useEffect(() => {
    fetchGrowthData();
  }, []);

  const deleteReview = async (id: string) => {
    const { error } = await supabase.from("product_reviews").delete().eq("id", id);
    if (error) {
      toast({ title: "Deletion Failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Review Purged", description: "Feedback entry permanently removed from production UI." });
    setReviews((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Consumer Reach Endpoint */}
      <Card className="border-border bg-card">
        <CardContent className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground font-body">Verified Consumer Profiles</p>
              <p className="text-xs text-muted-foreground font-body">Audited endpoint accounts active for lifecycle targeting</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold font-display block text-foreground tabular-nums">{totalUsers}</span>
            <span className="text-[10px] text-muted-foreground uppercase font-semibold">Registered Nodes</span>
          </div>
        </CardContent>
      </Card>

      {/* Live Social Proof Engine */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="font-display text-lg text-rose-600 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" /> Active Review Streams & Social Proof Feed
          </CardTitle>
          <CardDescription className="font-body text-sm mt-1">
            Real-time management of product evaluations feeding the storefront review frameworks.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-xs font-body text-muted-foreground animate-pulse">
              Loading user feedback sequences...
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((rev) => (
                <div key={rev.id} className="p-4 border border-border rounded-xl bg-background flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold font-body text-sm text-foreground">{rev.reviewer_name}</span>
                      <Badge variant="outline" className="text-[10px] font-body text-amber-600 bg-amber-500/5 border-amber-500/20">
                        {rev.rating} ★
                      </Badge>
                      <span className="text-xs text-muted-foreground font-body">• {rev.products?.name || "General Catalog"}</span>
                    </div>
                    <p className="font-body text-xs text-muted-foreground/90 italic leading-relaxed">
                      "{rev.comment}"
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => deleteReview(rev.id)} className="text-destructive hover:bg-destructive/10 shrink-0 h-8 w-8 p-0 self-end sm:self-center">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {reviews.length === 0 && (
                <div className="py-8 text-center border rounded-xl bg-secondary/10 flex flex-col items-center justify-center text-muted-foreground">
                  <MessageSquareText className="h-6 w-6 mb-2 text-muted-foreground/60" />
                  <p className="font-body text-xs">No user feedback entries available in the database yet.</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
