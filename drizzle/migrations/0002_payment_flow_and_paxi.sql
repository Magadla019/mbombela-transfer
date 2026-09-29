ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS extra jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS completed_at timestamptz;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS proof_deleted_at timestamptz;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS status_times jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS order_number text;