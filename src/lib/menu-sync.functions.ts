import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { verifyStaff } from './staff-token.server';

// Official menu pages per restaurant. Items are only updated when a page is reachable and
// exposes structured product data (JSON-LD MenuItem/Product with name, price, image).
const SOURCES: Record<string, string> = {
  kfc: 'https://order.kfc.co.za/menu', nandos: 'https://www.nandos.co.za/eat/menu', panarottis: 'https://www.panarottis.co.za/menu',
  rocomamas: 'https://www.rocomamas.com/menu', spur: 'https://www.spursteakranches.com/za/menu', debonairs: 'https://www.debonairspizza.co.za/menu',
  fishaways: 'https://www.fishaways.co.za/menu', galitos: 'https://www.galitos.co.za/menu', muggbean: 'https://www.muggandbean.co.za/menu',
  mcdonalds: 'https://www.mcdonalds.co.za/menu',
};

type Found = { name: string; price: number; image?: string | undefined; description?: string | undefined };
function parse(html: string): Found[] {
  const out: Found[] = [];
  for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const walk = (n: unknown): void => {
        if (Array.isArray(n)) return n.forEach(walk);
        if (!n || typeof n !== 'object') return;
        const o = n as Record<string, unknown>;
        const offer = (Array.isArray(o['offers']) ? o['offers'][0] : o['offers']) as Record<string, unknown> | undefined;
        const price = Number(offer?.['price']);
        if (typeof o['name'] === 'string' && price > 0) out.push({ name: o['name'].slice(0, 120), price, image: typeof o['image'] === 'string' ? o['image'] : undefined, description: typeof o['description'] === 'string' ? o['description'].slice(0, 300) : undefined });
        Object.values(o).forEach(walk);
      };
      walk(JSON.parse(m[1]!));
    } catch { /* ignore malformed blocks */ }
  }
  return out;
}

export const syncMenus = createServerFn({ method: 'POST' })
  .inputValidator((d) => z.object({ token: z.string().min(10).max(500) }).parse(d))
  .handler(async ({ data }) => {
    verifyStaff(data.token, ['partner', 'master']);
    const db = (await import('@/integrations/supabase/client.server')).supabaseAdmin;
    const results: { slug: string; status: string; message: string }[] = [];
    for (const [slug, url] of Object.entries(SOURCES)) {
      let status = 'failed', message = '';
      try {
        const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 MbombelaTransferMenuSync' }, signal: AbortSignal.timeout(12000) });
        if (!res.ok) throw new Error(`Official site returned ${res.status}`);
        const items = parse(await res.text());
        if (!items.length) throw new Error('No readable menu data on official page');
        const { data: existing } = await db.from('restaurant_menus').select('item_name, restaurant_name, source_url').eq('restaurant_slug', slug);
        const name = existing?.[0]?.restaurant_name ?? slug;
        const manual = new Set((existing ?? []).filter((e) => e.source_url === 'manual').map((e) => e.item_name));
        const known = new Set((existing ?? []).map((e) => e.item_name));
        const rows = items.filter((i) => !manual.has(i.name)).map((i) => ({ restaurant_slug: slug, restaurant_name: name, category: 'Meals', item_name: i.name, description: i.description ?? null, price: i.price, image_url: i.image ?? null, is_available: true, is_new: !known.has(i.name), source_url: url, last_synced_at: new Date().toISOString() }));
        if (rows.length) await db.from('restaurant_menus').upsert(rows, { onConflict: 'restaurant_slug,item_name' });
        status = 'success'; message = `${rows.length} items updated`;
      } catch (e) { message = e instanceof Error ? e.message : 'Failed'; }
      await db.from('menu_sync_logs').insert({ restaurant_slug: slug, status, message });
      results.push({ slug, status, message });
    }
    return results;
  });
