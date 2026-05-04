import { useEffect, useState } from "react";
import { Star, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";

interface OrderItem {
  product_id: string;
  name: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderItems: OrderItem[];
  vendorId: string;
}

export default function LeaveReviewModal({ open, onOpenChange, orderItems, vendorId }: Props) {
  const { user } = useAuth();
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && orderItems.length > 0) {
      setSelectedProductId(orderItems[0].product_id);
      setRating(5);
      setComment("");
    }
  }, [open, orderItems]);

  const submit = async () => {
    if (!user || !selectedProductId) return;
    setSubmitting(true);
    const { error } = await supabase.from("product_reviews").insert({
      product_id: selectedProductId,
      buyer_id: user.id,
      vendor_id: vendorId,
      rating,
      comment: comment.trim(),
    } as any);
    setSubmitting(false);

    if (error) {
      const msg = error.message.includes("duplicate")
        ? "You have already reviewed this product."
        : error.message;
      toast({ title: "Could not submit review", description: msg, variant: "destructive" });
      return;
    }
    toast({ title: "Review submitted", description: "Thanks for your feedback!" });
    onOpenChange(false);
  };

  const selected = orderItems.find((i) => i.product_id === selectedProductId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Leave a Review</DialogTitle>
          <DialogDescription className="font-body">
            Share your experience to help other buyers.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Product picker */}
          <div className="space-y-2">
            <p className="font-body text-xs font-medium text-muted-foreground uppercase tracking-wider">Product</p>
            <div className="flex flex-wrap gap-2">
              {orderItems.map((it) => (
                <button
                  key={it.product_id}
                  type="button"
                  onClick={() => setSelectedProductId(it.product_id)}
                  className={`rounded-full border px-3 py-1 font-body text-xs transition-colors ${
                    selectedProductId === it.product_id
                      ? "border-primary bg-primary/10 text-foreground font-semibold"
                      : "border-border bg-card text-muted-foreground hover:bg-muted/30"
                  }`}
                >
                  {it.name}
                </button>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div className="space-y-2">
            <p className="font-body text-xs font-medium text-muted-foreground uppercase tracking-wider">Rating</p>
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  aria-label={`${n} star${n > 1 ? "s" : ""}`}
                >
                  <Star className={`h-7 w-7 transition-colors ${n <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"}`} />
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <p className="font-body text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Comment <span className="text-muted-foreground/60 normal-case">(optional)</span>
            </p>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder={selected ? `How was your ${selected.name}?` : "How was your order?"}
              className="font-body"
              maxLength={1000}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="font-body" disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={submit} className="font-body gap-2" disabled={submitting || !selectedProductId}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />} Submit Review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
