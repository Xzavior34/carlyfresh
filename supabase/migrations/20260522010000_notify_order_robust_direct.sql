-- Drop the old edge-function-based trigger to prevent double notifications
DROP TRIGGER IF EXISTS on_order_status_change_onesignal ON public.orders;

-- 1. Create the direct-to-OneSignal trigger function
CREATE OR REPLACE FUNCTION public.notify_order_robust()
RETURNS trigger AS $$
DECLARE
  target_push_token text;
  msg_text text;
  target_user_id uuid;
BEGIN
  -- A. Determine who gets the message based on order status
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
    RETURN NEW; -- Stop if status is anything else
  END IF;

  -- B. Find the push token for that user
  SELECT push_token INTO target_push_token
  FROM public.profiles
  WHERE user_id = target_user_id;

  -- C. Stop if they don't have push notifications enabled
  IF target_push_token IS NULL OR target_push_token = '' THEN
    RETURN NEW;
  END IF;

  -- D. Fire the notification directly to OneSignal
  --    include_subscription_ids is the correct field for SDK v16 subscription UUIDs
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

-- 2. Attach the trigger to the orders table
DROP TRIGGER IF EXISTS on_order_status_change_notify ON public.orders;
CREATE TRIGGER on_order_status_change_notify
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.notify_order_robust();
