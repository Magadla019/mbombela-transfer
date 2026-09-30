import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type PriceRow = Tables<'app_pricing'>;
export type PriceMap = Record<string, PriceRow>;

export const priceName: Record<string, string> = {
  'paxi:small_bag': 'PAXI Small Bag', 'paxi:medium_bag': 'PAXI Medium Bag', 'paxi:large_bag': 'PAXI Large Bag', 'paxi:xl_bag': 'PAXI XL Bag', 'paxi:receive': 'PAXI Receive',
  'food_delivery:base': 'Food Delivery', 'receive_package:base': 'Receive Package', 'send_package:base': 'Send Package', 'speed_point:base': 'Speed Point', 'package_money_exchange:base': 'Package Money Exchange',
};

// Public prices, updated live when the partner changes them.
export function usePricing(notify = false) {
  const [map, setMap] = useState<PriceMap>({});
  useEffect(() => {
    let alive = true;
    supabase.from('app_pricing').select('*').eq('is_active', true).then(({ data }) => {
      if (alive && data) setMap(Object.fromEntries(data.map((r) => [`${r.category}:${r.sub_category}`, r])));
    });
    const ch = supabase.channel(`pricing-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'app_pricing' }, (payload) => {
        const r = payload.new as PriceRow;
        setMap((m) => ({ ...m, [`${r.category}:${r.sub_category}`]: r }));
        if (notify) toast.success(`🔥 New Price Live${r.label ? ' ' + r.label : ''} R${Number(r.price)}`, { description: priceName[`${r.category}:${r.sub_category}`] });
      })
      .subscribe();
    return () => { alive = false; supabase.removeChannel(ch); };
  }, [notify]);
  return map;
}

export function PriceBadge({ row }: { row?: PriceRow | undefined }) {
  if (!row?.label) return null;
  return <span className="ml-2 animate-pulse rounded-full bg-gold px-2 py-0.5 text-[11px] font-bold text-background">{row.label} R{Number(row.price)}</span>;
}
