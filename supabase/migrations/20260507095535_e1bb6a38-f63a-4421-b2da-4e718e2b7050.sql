
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS b2b_price numeric;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_b2b_customer boolean NOT NULL DEFAULT false;

-- Allow admins to update any profile (already covered by Profiles update policy via has_role)
-- Add a restrictive trigger to prevent non-admins from toggling is_b2b_customer on their own profile
CREATE OR REPLACE FUNCTION public.prevent_b2b_self_toggle()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_b2b_customer IS DISTINCT FROM OLD.is_b2b_customer THEN
    IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
      RAISE EXCEPTION 'Only admins can change B2B customer status';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_prevent_b2b_self_toggle ON public.profiles;
CREATE TRIGGER profiles_prevent_b2b_self_toggle
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_b2b_self_toggle();
