CREATE TABLE public.restaurant_menus (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 restaurant_slug text NOT NULL,
 restaurant_name text NOT NULL,
 category text NOT NULL,
 item_name text NOT NULL,
 description text,
 price numeric NOT NULL CHECK (price >= 0),
 image_url text,
 is_available boolean NOT NULL DEFAULT true,
 is_new boolean NOT NULL DEFAULT false,
 source_url text NOT NULL DEFAULT 'manual',
 last_synced_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE (restaurant_slug, item_name)
);
GRANT SELECT ON public.restaurant_menus TO anon, authenticated;
GRANT ALL ON public.restaurant_menus TO service_role;
ALTER TABLE public.restaurant_menus ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published menu items are public" ON public.restaurant_menus FOR SELECT TO anon, authenticated USING (is_available = true);
CREATE INDEX restaurant_menus_slug_category ON public.restaurant_menus (restaurant_slug, category);
CREATE TABLE public.menu_sync_logs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 restaurant_slug text NOT NULL,
 status text NOT NULL,
 message text,
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.menu_sync_logs TO service_role;
ALTER TABLE public.menu_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER PUBLICATION supabase_realtime ADD TABLE public.restaurant_menus;