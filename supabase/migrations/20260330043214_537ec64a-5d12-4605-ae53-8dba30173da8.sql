ALTER TABLE public.products
  ADD COLUMN unit_of_measurement text NOT NULL DEFAULT 'piece',
  ADD COLUMN price_per_unit numeric NOT NULL DEFAULT 0;