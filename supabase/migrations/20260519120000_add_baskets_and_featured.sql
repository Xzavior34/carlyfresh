-- Add dynamic placement columns to products table if they do not exist
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_buyer_favourite boolean DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_bundle boolean DEFAULT false;

-- Create baskets table
CREATE TABLE IF NOT EXISTS public.baskets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric NOT NULL,
  image text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create basket_items join table
CREATE TABLE IF NOT EXISTS public.basket_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  basket_id uuid REFERENCES public.baskets(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.baskets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.basket_items ENABLE ROW LEVEL SECURITY;

-- Baskets Policies
CREATE POLICY "baskets_select" ON public.baskets FOR SELECT TO public USING (true);
CREATE POLICY "baskets_admin_all" ON public.baskets TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Basket Items Policies
CREATE POLICY "basket_items_select" ON public.basket_items FOR SELECT TO public USING (true);
CREATE POLICY "basket_items_admin_all" ON public.basket_items TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add to Realtime Publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.baskets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.basket_items;
