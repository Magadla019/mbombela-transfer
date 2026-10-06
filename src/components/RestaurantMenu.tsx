import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { MapPin, Minus, Plus, ShoppingCart, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

const FALLBACK = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&h=200&fit=crop&q=70';
type Item = Tables<'restaurant_menus'>;
const categories = ['All', 'Burgers', 'Wraps', 'Meals', 'Sides', 'Drinks', 'Desserts'];
const slugs: Record<string, string> = { KFC: 'kfc', "Nando's": 'nandos', Panarottis: 'panarottis', RocoMamas: 'rocomamas', Spur: 'spur', 'Debonairs Pizza': 'debonairs', Fishaways: 'fishaways', "Galito's": 'galitos', 'Mugg & Bean': 'muggbean', "McDonald's": 'mcdonalds' };

export function RestaurantMenu({ brand, logo, onClose }: { brand: string; logo: string; onClose: () => void }) {
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('All');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  useEffect(() => {
    const slug = slugs[brand];
    if (!slug) return;
    let alive = true;
    const load = async () => {
      const { data, error: readError } = await supabase.from('restaurant_menus').select('*').eq('restaurant_slug', slug).eq('is_available', true).order('category').order('item_name');
      if (alive) { setItems(data ?? []); setError(readError?.message ?? ''); setLoading(false); }
    };
    void load();
    const channel = supabase.channel(`menu-${slug}-${crypto.randomUUID()}`).on('postgres_changes', { event: '*', schema: 'public', table: 'restaurant_menus', filter: `restaurant_slug=eq.${slug}` }, () => { void load(); }).subscribe();
    return () => { alive = false; void supabase.removeChannel(channel); };
  }, [brand]);
  const chosen = useMemo(() => items.filter(item => (quantities[item.id] ?? 0) > 0), [items, quantities]);
  const total = chosen.reduce((sum, item) => sum + Number(item.price) * (quantities[item.id] ?? 0), 0);
  const count = chosen.reduce((sum, item) => sum + (quantities[item.id] ?? 0), 0);
  const add = () => {
    const selection = chosen.map(item => `${quantities[item.id] ?? 0}× ${item.item_name}`).join(', ');
    onClose();
    navigate({ to: '/food-order-form', search: { brand, items: selection, itemPrice: total.toFixed(2) } });
  };
  return <div className="fixed inset-0 z-[1200] flex items-end justify-center bg-background/80" onClick={onClose} role="presentation">
    <section role="dialog" aria-modal="true" aria-label={`${brand} menu`} onClick={event => event.stopPropagation()} className="flex max-h-[94dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[32px] bg-sheet text-sheet-foreground shadow-2xl sm:max-h-[90dvh] sm:rounded-[32px]">
      <div className="mx-auto mt-4 h-1.5 w-12 shrink-0 rounded-full bg-sheet-foreground/20" />
      <div className="flex items-center gap-4 px-6 pb-4 pt-7"><img src={logo} alt="" className="size-14 rounded-full bg-sheet object-contain" /><div className="min-w-0 flex-1"><h2 className="truncate text-2xl font-bold">{brand}</h2><p className="text-xs text-sheet-foreground/60">Mbombela Transfer · Menu</p></div><Button variant="ghost" size="icon" onClick={onClose} aria-label="Close menu" className="shrink-0 rounded-full bg-sheet-foreground/10"><X /></Button></div>
      <div className="flex gap-2 overflow-x-auto border-y border-sheet-foreground/10 px-5 py-3">{categories.map(name => <Button key={name} variant="ghost" onClick={() => setCategory(name)} className={`h-9 shrink-0 rounded-full px-4 text-xs ${category === name ? 'bg-sheet-foreground text-sheet' : 'bg-sheet-foreground/5 text-sheet-foreground'}`}>{name}</Button>)}</div>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-8">{loading ? <p className="py-12 text-center">Loading menu…</p> : error ? <p className="py-12 text-center">Menu unavailable: {error}</p> : items.length === 0 ? <p className="py-12 text-center">No menu items available yet.</p> : items.filter(item => category === 'All' || item.category === category).map(item => <article key={item.id} className="flex items-center gap-3 border-b border-sheet-foreground/10 py-4">
        <img src={item.image_url || FALLBACK} alt={item.item_name} loading="lazy" onError={e => { if (e.currentTarget.src !== FALLBACK) e.currentTarget.src = FALLBACK; }} className="size-[70px] shrink-0 rounded-xl object-cover" />
        <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h3 className="font-bold leading-tight">{item.item_name}</h3>{item.is_new && item.created_at && Date.now() - new Date(item.created_at).getTime() < 7 * 86400000 && <span className="rounded bg-gold px-1.5 py-0.5 text-[10px] font-bold text-sheet-foreground">NEW</span>}</div>{item.description && <p className="mt-1 line-clamp-2 text-xs text-sheet-foreground/60">{item.description}</p>}<p className="mt-1 font-bold">R{Number(item.price).toFixed(2)}</p></div>
        <div className="flex shrink-0 items-center gap-1"><Button variant="ghost" size="icon" aria-label={`Remove ${item.item_name}`} disabled={!quantities[item.id]} onClick={() => setQuantities(q => ({ ...q, [item.id]: Math.max(0, (q[item.id] ?? 0) - 1) }))} className="rounded-full bg-sheet-foreground/10"><Minus size={15} /></Button><span className="w-5 text-center text-sm font-bold">{quantities[item.id] ?? 0}</span><Button size="icon" aria-label={`Add ${item.item_name}`} onClick={() => setQuantities(q => ({ ...q, [item.id]: (q[item.id] ?? 0) + 1 }))} className="rounded-full"><Plus size={15} /></Button></div>
      </article>)}</div>
      <div className="shrink-0 border-t border-sheet-foreground/10 bg-sheet p-5 shadow-lg"><div className="mb-3 flex items-baseline justify-between"><span className="font-bold">Food subtotal <span className="text-sm font-normal text-sheet-foreground/60">({count} items)</span></span><b className="text-2xl">R{total.toFixed(2)}</b></div><Button disabled={!count} onClick={add} className="h-12 w-full rounded-lg font-bold"><ShoppingCart size={18} /> Continue to delivery</Button></div>
    </section>
  </div>;
}