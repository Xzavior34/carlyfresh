-- Fix onesignal trigger: replace placeholder project ref with the real Supabase project ref.
-- The previous migration used 'YOUR_SUPABASE_PROJECT_REF' as a fallback which breaks
-- if vault secrets are not configured. This migration uses the correct hardcoded ref.

CREATE OR REPLACE FUNCTION public.trg_on_order_status_change_onesignal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  -- Hardcoded project ref as reliable fallback (overridden by vault if configured)
  supabase_project_ref text := 'thldkqfacwfievhziepc';
  supabase_service_key text := '';
  vault_project_ref text;
  vault_service_key text;
BEGIN
  -- Only fire on statuses that have push notification logic
  IF NEW.status NOT IN ('pending', 'driver_assigned', 'delivered') THEN
    RETURN NEW;
  END IF;

  -- Try to retrieve credentials from Supabase Vault (if configured)
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
    NULL; -- Ignore vault errors
  END;

  -- Override defaults with vault values if present
  IF vault_service_key IS NOT NULL AND vault_service_key <> '' THEN
    supabase_service_key := vault_service_key;
  END IF;
  IF vault_project_ref IS NOT NULL AND vault_project_ref <> '' THEN
    supabase_project_ref := vault_project_ref;
  END IF;

  PERFORM net.http_post(
    url := 'https://' || supabase_project_ref || '.supabase.co/functions/v1/onesignal-dispatcher',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(NULLIF(supabase_service_key, ''), current_setting('app.service_role_key', true), '')
    ),
    body := jsonb_build_object(
      'record', row_to_json(NEW)::jsonb,
      'old_record', row_to_json(OLD)::jsonb
    )
  );

  RETURN NEW;
END;
$$;

-- Re-create the trigger
DROP TRIGGER IF EXISTS on_order_status_change_onesignal ON public.orders;
CREATE TRIGGER on_order_status_change_onesignal
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.trg_on_order_status_change_onesignal();
