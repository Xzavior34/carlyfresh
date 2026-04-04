
-- Trigger function: auto-create a transaction when order status becomes 'delivered'
CREATE OR REPLACE FUNCTION public.create_transaction_on_delivery()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only fire when status changes TO 'delivered'
  IF NEW.status = 'delivered' AND (OLD.status IS DISTINCT FROM 'delivered') THEN
    INSERT INTO public.transactions (vendor_id, type, gross_amount, platform_fee, net_amount, status, related_order_id, description)
    VALUES (
      NEW.vendor_id,
      'sale',
      NEW.total_amount,
      ROUND(NEW.total_amount * 0.15, 2),
      ROUND(NEW.total_amount * 0.85, 2),
      'completed',
      NEW.id,
      'Sale: Order #' || NEW.order_number
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Attach trigger to orders table
CREATE TRIGGER on_order_delivered
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.create_transaction_on_delivery();
