-- Create trigger function to invoke onesignal-dispatcher Edge Function on status change
CREATE OR REPLACE FUNCTION public.trg_on_order_status_change_onesignal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  supabase_project_ref text := 'YOUR_SUPABASE_PROJECT_REF'; -- Replace with your project ref if vault query fails
  supabase_service_key text := 'YOUR_SUPABASE_SERVICE_ROLE_KEY'; -- Replace with your service role key if vault query fails
  vault_project_ref text;
  vault_service_key text;
BEGIN
  -- Try to retrieve keys dynamically from Supabase Vault (if present)
  BEGIN
    SELECT decrypted_secret INTO vault_service_key 
    FROM vault.decrypted_secrets 
    WHERE name = 'service_role_key' 
    LIMIT 1;

    SELECT decrypted_secret INTO vault_project_ref 
    FROM vault.decrypted_secrets 
    WHERE name = 'supabase_url' 
    LIMIT 1;
    
    IF vault_project_ref IS NOT NULL THEN
      vault_project_ref := substring(vault_project_ref from 'https://([^.]+)\.supabase');
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Ignore errors if vault schema doesn't exist or is inaccessible
  END;

  -- Use vault values if found, otherwise fall back to default values
  IF vault_service_key IS NOT NULL THEN
    supabase_service_key := vault_service_key;
  END IF;
  IF vault_project_ref IS NOT NULL THEN
    supabase_project_ref := vault_project_ref;
  END IF;

  -- Send request to onesignal-dispatcher
  PERFORM net.http_post(
    url := 'https://' || supabase_project_ref || '.supabase.co/functions/v1/onesignal-dispatcher',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || supabase_service_key
    ),
    body := jsonb_build_object(
      'record', row_to_json(NEW)::jsonb,
      'old_record', row_to_json(OLD)::jsonb
    )
  );

  RETURN NEW;
END;
$$;

-- Create the trigger on public.orders table
DROP TRIGGER IF EXISTS on_order_status_change_onesignal ON public.orders;
CREATE TRIGGER on_order_status_change_onesignal
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.trg_on_order_status_change_onesignal();
