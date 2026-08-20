-- ============================================================
-- Migration: 20260819000000_fix_project_ref_new_db.sql
-- Updates notify_order_robust() to use the new Supabase project
-- ref (nftdcfursazeeqaxbihs) instead of the old one.
-- This migration is applied only to the new database.
-- ============================================================

-- Update the trigger that had the old project ref hardcoded in it.
-- This function calls pg_net directly to OneSignal so no URL change is
-- needed for that call, but the supabase_project_ref default fallback
-- (used only by the onesignal-dispatcher variant, now replaced) is updated.

-- Drop any lingering version of the edge-function-based trigger
DROP TRIGGER IF EXISTS on_order_status_change_onesignal ON public.orders;
DROP TRIGGER IF EXISTS on_order_status_change_notify ON public.orders;

-- Recreate the final notification function with correct project ref
CREATE OR REPLACE FUNCTION public.notify_order_robust()
RETURNS trigger AS $$
DECLARE
  target_push_token text;
  msg_text text;
  target_user_id uuid;
BEGIN
  -- Map order status to recipient and message
  IF NEW.status = 'pending' THEN
    target_user_id := NEW.vendor_id;
    msg_text := 'New Order Received: #' || NEW.order_number || '! Please confirm.';
  ELSIF NEW.status = 'driver_assigned' THEN
    target_user_id := NEW.buyer_id;
    msg_text := 'Order #' || NEW.order_number || ' has been assigned to a driver!';
  ELSIF NEW.status = 'delivered' THEN
    target_user_id := NEW.buyer_id;
    msg_text := 'Your CarlyFresh order (#' || NEW.order_number || ') has arrived! Enjoy!';
  ELSE
    RETURN NEW;
  END IF;

  -- Find the OneSignal subscription UUID for that user
  SELECT push_token INTO target_push_token
  FROM public.profiles
  WHERE user_id = target_user_id;

  -- Exit silently if the user has no push token yet
  IF target_push_token IS NULL OR target_push_token = '' THEN
    RETURN NEW;
  END IF;

  -- Fire directly to OneSignal REST API via pg_net
  PERFORM net.http_post(
    url := 'https://onesignal.com/api/v1/notifications',
    headers := '{"Content-Type": "application/json", "Authorization": "Basic os_v2_app_4zcgwqaukngm3eu53dglrr77sfjjfhhadhmub4ven7fwzqhqlu2bbgmieg5ffyxr3suuejmvvdq7arhkybjvxnqterggwxmiwbcl3la"}'::jsonb,
    body := json_build_object(
      'app_id', 'e6446b40-1453-4ccd-929d-d8ccb8c7ff91',
      'include_subscription_ids', array[target_push_token],
      'headings', json_build_object('en', '🛒 CarlyFresh Update'),
      'contents', json_build_object('en', msg_text)
    )::jsonb,
    timeout_milliseconds := 5000
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger on the new database
CREATE TRIGGER on_order_status_change_notify
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.notify_order_robust();
