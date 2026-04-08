
-- Add delivery_address to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_address text NOT NULL DEFAULT '';

-- Update trigger to use real delivery address
CREATE OR REPLACE FUNCTION public.create_delivery_job_on_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  vendor_name text;
BEGIN
  SELECT COALESCE(business_name, full_name, 'Vendor') INTO vendor_name
  FROM public.profiles WHERE user_id = NEW.vendor_id LIMIT 1;

  INSERT INTO public.delivery_jobs (order_id, pickup_address, dropoff_address, payout_amount, status)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(vendor_name, ''), 'Vendor') || ' (Pickup)',
    CASE WHEN NEW.delivery_address <> '' THEN NEW.delivery_address ELSE 'Buyer Location' END,
    ROUND(NEW.total_amount * 0.1, 2),
    'available'
  );
  RETURN NEW;
END;
$function$;
