-- Newsletter subscribers
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Admins can read all
CREATE POLICY "Admins read all subscribers"
ON public.newsletter_subscribers
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Authenticated users can insert (their own email or via trigger)
CREATE POLICY "Authenticated insert subscribers"
ON public.newsletter_subscribers
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Public (anon) can subscribe themselves via signup forms
CREATE POLICY "Anon insert subscribers"
ON public.newsletter_subscribers
FOR INSERT
TO anon
WITH CHECK (true);

-- Admins can delete
CREATE POLICY "Admins delete subscribers"
ON public.newsletter_subscribers
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger function: copy new auth.users emails into subscribers
CREATE OR REPLACE FUNCTION public.add_user_to_newsletter()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NOT NULL THEN
    INSERT INTO public.newsletter_subscribers (email)
    VALUES (NEW.email)
    ON CONFLICT (email) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_newsletter ON auth.users;
CREATE TRIGGER on_auth_user_created_newsletter
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.add_user_to_newsletter();