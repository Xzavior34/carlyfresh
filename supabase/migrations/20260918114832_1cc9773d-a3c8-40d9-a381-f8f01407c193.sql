ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS preparation_deadline TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS preparation_reminder_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS preparation_extension_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vendor_decision_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS vendor_decision_source TEXT,
  ADD COLUMN IF NOT EXISTS ready_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS driver_dispatch_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS whatsapp_new_order_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS whatsapp_prep_reminder_sent_at TIMESTAMPTZ;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_preparation_extension_count_nonnegative
  CHECK (preparation_extension_count >= 0);