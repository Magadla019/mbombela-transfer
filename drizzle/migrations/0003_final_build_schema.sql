ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS client_popup_state text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS driver_popup_state text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS client_popup_shown boolean NOT NULL DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS driver_popup_shown boolean NOT NULL DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'delivery';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS paxi_tracking text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS paxi_bag_type text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS assigned_at timestamptz;

CREATE TABLE IF NOT EXISTS public.app_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  sub_category text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  label text,
  is_active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (category, sub_category)
);
GRANT SELECT ON public.app_pricing TO anon, authenticated;
GRANT ALL ON public.app_pricing TO service_role;
ALTER TABLE public.app_pricing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Prices are public" ON public.app_pricing FOR SELECT TO anon, authenticated USING (is_active = true);

CREATE TABLE IF NOT EXISTS public.refresh_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type text NOT NULL,
  section text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.refresh_logs TO service_role;
ALTER TABLE public.refresh_logs ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.driver_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  password text UNIQUE NOT NULL,
  driver_name text,
  driver_phone text,
  first_login boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT true,
  total_completed int NOT NULL DEFAULT 0,
  total_income numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.driver_access TO service_role;
ALTER TABLE public.driver_access ENABLE ROW LEVEL SECURITY;

ALTER PUBLICATION supabase_realtime ADD TABLE public.app_pricing;