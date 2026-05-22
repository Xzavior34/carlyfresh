-- ============================================================
-- Migration: 20260522020000_update_onesignal_heading_emoji.sql
-- Updates the heading in notify_order_robust to include the
-- shopping cart emoji for a more engaging notification, matching
-- the requested production-ready OneSignal v16 format.
-- This is idempotent: safe to run even if already applied.
-- ============================================================

-- 1. Drop old triggers to prevent any double notifications
DROP TRIGGER IF EXISTS on_order_status_change_onesignal ON public.orders;
DROP TRIGGER IF EXISTS on_order_status_change_notify ON public.orders;

-- 2. Recreate the robust notification function (with emoji heading)
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
    target_user_id := COALESCE(NEW.buyer_id, NEW.customer_id);
    msg_text := 'Order #' || NEW.order_number || ' has been assigned to a driver!';
  ELSIF NEW.status = 'delivered' THEN
    target_user_id := COALESCE(NEW.buyer_id, NEW.customer_id);
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
  -- include_subscription_ids is the correct field for SDK v16 subscription UUIDs
  PERFORM net.http_post(
    url := 'https://onesignal.com/api/v1/notifications',
    headers := '{"Content-Type": "application/json", "Authorization": "Basic os_v2_app_4zcgwqaukngm3eu53dglrr77sfjjfhhadhmub4ven7fwzqhqlu2bbgmieg5ffyxr3suuejmvvdq7arhkybjvxnqterggwxmiwbcl3la"}'::jsonb,
    body := json_build_object(
      'app_id', 'e6446b40-1453-4ccd-929d-d8ccb8c7ff91',
      'include_subscription_ids', array[target_push_token],
      'headings', json_build_object('en', 'CarlyFresh Update'),
      'contents', json_build_object('en', msg_text)
    )::jsonb,
    timeout_milliseconds := 5000
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Recreate the trigger
CREATE TRIGGER on_order_status_change_notify
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.notify_order_robust();
