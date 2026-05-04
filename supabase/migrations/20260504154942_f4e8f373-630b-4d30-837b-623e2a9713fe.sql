-- PART 1: products bulk pricing
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS bulk_min_qty integer,
  ADD COLUMN IF NOT EXISTS bulk_price numeric;

-- PART 1: orders delivery window
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivery_window text;

-- PART 1: product_reviews table
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL,
  buyer_id uuid NOT NULL,
  vendor_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (product_id, buyer_id)
);

CREATE INDEX IF NOT EXISTS idx_product_reviews_product ON public.product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_vendor  ON public.product_reviews(vendor_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_buyer   ON public.product_reviews(buyer_id);

ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- Public can read all reviews
CREATE POLICY "Reviews public read"
ON public.product_reviews
FOR SELECT
TO public
USING (true);

-- Buyers may insert reviews only for products they actually received in a delivered order
CREATE POLICY "Buyers insert review for delivered orders"
ON public.product_reviews
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = buyer_id
  AND EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.buyer_id = auth.uid()
      AND o.vendor_id = product_reviews.vendor_id
      AND o.status = 'delivered'
      AND EXISTS (
        SELECT 1 FROM jsonb_array_elements(o.items) item
        WHERE (item->>'product_id')::uuid = product_reviews.product_id
      )
  )
);

-- Buyers update own; admin update any
CREATE POLICY "Reviews update own or admin"
ON public.product_reviews
FOR UPDATE
TO authenticated
USING (auth.uid() = buyer_id OR public.has_role(auth.uid(), 'admin'::app_role));

-- Buyers delete own; admin delete any
CREATE POLICY "Reviews delete own or admin"
ON public.product_reviews
FOR DELETE
TO authenticated
USING (auth.uid() = buyer_id OR public.has_role(auth.uid(), 'admin'::app_role));

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_product_reviews_updated_at ON public.product_reviews;
CREATE TRIGGER trg_product_reviews_updated_at
BEFORE UPDATE ON public.product_reviews
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.product_reviews;