
-- Driver wallet
CREATE TABLE public.driver_wallet (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL UNIQUE,
  balance numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.driver_wallet ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers view own wallet" ON public.driver_wallet FOR SELECT TO authenticated
  USING (auth.uid() = driver_id OR has_role(auth.uid(), 'admin'));
CREATE POLICY "System insert wallet" ON public.driver_wallet FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = driver_id);
CREATE POLICY "System update wallet" ON public.driver_wallet FOR UPDATE TO authenticated
  USING (auth.uid() = driver_id OR has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_driver_wallet_updated_at BEFORE UPDATE ON public.driver_wallet
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Driver transactions
CREATE TABLE public.driver_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'delivery',
  gross_amount numeric NOT NULL DEFAULT 0,
  platform_fee numeric NOT NULL DEFAULT 0,
  net_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'completed',
  related_job_id uuid REFERENCES public.delivery_jobs(id),
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.driver_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers view own transactions" ON public.driver_transactions FOR SELECT TO authenticated
  USING (auth.uid() = driver_id OR has_role(auth.uid(), 'admin'));
CREATE POLICY "System insert driver transactions" ON public.driver_transactions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = driver_id OR has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_driver_transactions_updated_at BEFORE UPDATE ON public.driver_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Driver withdrawals
CREATE TABLE public.driver_withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL,
  amount numeric NOT NULL,
  bank_name text NOT NULL,
  account_number text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.driver_withdrawals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers view own withdrawals" ON public.driver_withdrawals FOR SELECT TO authenticated
  USING (auth.uid() = driver_id OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Drivers create own withdrawals" ON public.driver_withdrawals FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = driver_id);
CREATE POLICY "Admins update driver withdrawals" ON public.driver_withdrawals FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_driver_withdrawals_updated_at BEFORE UPDATE ON public.driver_withdrawals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Driver locations (live GPS)
CREATE TABLE public.driver_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL UNIQUE,
  latitude double precision NOT NULL DEFAULT 0,
  longitude double precision NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.driver_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers update own location" ON public.driver_locations FOR ALL TO authenticated
  USING (auth.uid() = driver_id OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Drivers insert own location" ON public.driver_locations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = driver_id);

-- Enable realtime for driver tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_withdrawals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_locations;

-- Trigger: when delivery_job completed, create driver transaction + update wallet
CREATE OR REPLACE FUNCTION public.create_driver_transaction_on_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') AND NEW.driver_id IS NOT NULL THEN
    -- Insert driver transaction
    INSERT INTO public.driver_transactions (driver_id, type, gross_amount, platform_fee, net_amount, status, related_job_id, description)
    VALUES (
      NEW.driver_id,
      'delivery',
      NEW.payout_amount,
      ROUND(NEW.payout_amount * 0.10, 2),
      ROUND(NEW.payout_amount * 0.90, 2),
      'completed',
      NEW.id,
      'Delivery: Job #' || LEFT(NEW.id::text, 8)
    );
    -- Upsert wallet balance
    INSERT INTO public.driver_wallet (driver_id, balance)
    VALUES (NEW.driver_id, ROUND(NEW.payout_amount * 0.90, 2))
    ON CONFLICT (driver_id) DO UPDATE SET balance = driver_wallet.balance + ROUND(NEW.payout_amount * 0.90, 2);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_delivery_completed
  AFTER UPDATE ON public.delivery_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.create_driver_transaction_on_completion();

-- Storage bucket for product images
INSERT INTO storage.buckets (id, name, public) VALUES ('product_images', 'product_images', true);

CREATE POLICY "Anyone can view product images" ON storage.objects FOR SELECT USING (bucket_id = 'product_images');
CREATE POLICY "Sellers can upload product images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product_images' AND (has_role(auth.uid(), 'seller') OR has_role(auth.uid(), 'admin')));
CREATE POLICY "Sellers can delete own product images" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product_images' AND (has_role(auth.uid(), 'seller') OR has_role(auth.uid(), 'admin')));
