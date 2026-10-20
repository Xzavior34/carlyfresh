CREATE INDEX IF NOT EXISTS idx_orders_pending_created_at ON public.orders (created_at) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_delivery_jobs_awaiting_driver_deadline ON public.delivery_jobs (sla_deadline) WHERE status = 'awaiting_driver' AND sla_deadline IS NOT NULL;