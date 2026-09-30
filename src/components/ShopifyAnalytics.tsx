import { useEffect, useMemo, useState } from 'react';
import { Area, ComposedChart as AreaChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChevronDown, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Order } from '@/lib/transfer';

export type RangeKey = 'Today' | 'Yesterday' | 'Last 7 days' | 'Last 30 days' | 'This month' | 'Last month' | 'This year' | 'Last year' | 'Custom range' | `Year ${number}`;
const presets: RangeKey[] = ['Today', 'Yesterday', 'Last 7 days', 'Last 30 days', 'This month', 'Last month', 'This year', 'Last year', 'Custom range'];
const years = Array.from({ length: 21 }, (_, i) => 2026 - i);
type Bucket = 'hour' | 'day' | 'month';

const sod = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export function getDateRange(key: RangeKey, from?: string, to?: string): { start: Date; end: Date; bucket: Bucket } {
  const n = new Date(); const t = sod(n); const day = 864e5;
  if (key.startsWith('Year ')) { const y = Number(key.slice(5)); return { start: new Date(y, 0, 1), end: new Date(y + 1, 0, 1), bucket: 'month' }; }
  switch (key) {
    case 'Today': return { start: t, end: new Date(+t + day), bucket: 'hour' };
    case 'Yesterday': return { start: new Date(+t - day), end: t, bucket: 'hour' };
    case 'Last 7 days': return { start: new Date(+t - 6 * day), end: new Date(+t + day), bucket: 'day' };
    case 'Last 30 days': return { start: new Date(+t - 29 * day), end: new Date(+t + day), bucket: 'day' };
    case 'This month': return { start: new Date(n.getFullYear(), n.getMonth(), 1), end: new Date(n.getFullYear(), n.getMonth() + 1, 1), bucket: 'day' };
    case 'Last month': return { start: new Date(n.getFullYear(), n.getMonth() - 1, 1), end: new Date(n.getFullYear(), n.getMonth(), 1), bucket: 'day' };
    case 'This year': return { start: new Date(n.getFullYear(), 0, 1), end: new Date(n.getFullYear() + 1, 0, 1), bucket: 'month' };
    case 'Last year': return { start: new Date(n.getFullYear() - 1, 0, 1), end: new Date(n.getFullYear(), 0, 1), bucket: 'month' };
    default: {
      const s = from ? sod(new Date(from)) : new Date(+t - 6 * day); const e = to ? new Date(+sod(new Date(to)) + day) : new Date(+t + day);
      return { start: s, end: e, bucket: +e - +s <= day ? 'hour' : +e - +s <= 92 * day ? 'day' : 'month' };
    }
  }
}

function buckets(start: Date, end: Date, b: Bucket) {
  const out: Date[] = []; const d = new Date(start);
  while (d < end && out.length < 400) { out.push(new Date(d)); if (b === 'hour') d.setHours(d.getHours() + 1); else if (b === 'day') d.setDate(d.getDate() + 1); else d.setMonth(d.getMonth() + 1); }
  return out;
}
const label = (d: Date, b: Bucket, days: number) => b === 'hour' ? d.toLocaleTimeString('en', { hour: 'numeric' }) : b === 'month' ? d.toLocaleString('en', { month: 'short' }) : days <= 7 ? d.toLocaleDateString('en', { weekday: 'short' }) : d.toLocaleDateString('en', { day: 'numeric', month: 'short' });

function useLiveVisitors() {
  const [n, setN] = useState(0);
  useEffect(() => {
    const ch = supabase.channel('online-clients');
    ch.on('presence', { event: 'sync' }, () => setN(Object.keys(ch.presenceState()).length)).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);
  return n;
}

export function ShopifyAnalytics({ orders, onOpenOrder, title = 'Analytics' }: { orders: Order[]; onOpenOrder?: (o: Order) => void; title?: string }) {
  const [key, setKey] = useState<RangeKey>('Today');
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState(''); const [to, setTo] = useState('');
  const live = useLiveVisitors();
  const { start, end, bucket } = getDateRange(key, from, to);
  const span = +end - +start;
  const prevStart = new Date(+start - span);

  const data = useMemo(() => {
    const done = orders.filter((o) => o.status === 'completed' && o.completed_at);
    const inRange = (o: Order, s: Date, e: Date) => { const t = new Date(o.completed_at!); return t >= s && t < e; };
    const cur = done.filter((o) => inRange(o, start, end));
    const prev = done.filter((o) => inRange(o, prevStart, start));
    const created = orders.filter((o) => { const t = new Date(o.created_at); return t >= start && t < end; });
    const days = Math.round(span / 864e5);
    const bs = buckets(start, end, bucket);
    const next = (d: Date) => { const x = new Date(d); if (bucket === 'hour') x.setHours(x.getHours() + 1); else if (bucket === 'day') x.setDate(x.getDate() + 1); else x.setMonth(x.getMonth() + 1); return x; };
    const series = bs.map((b) => {
      const pb = new Date(+b - span);
      return { name: label(b, bucket, days), sales: cur.filter((o) => inRange(o, b, next(b))).reduce((n, o) => n + Number(o.amount), 0), previous: prev.filter((o) => inRange(o, pb, new Date(+next(b) - span))).reduce((n, o) => n + Number(o.amount), 0) };
    });
    const sales = cur.reduce((n, o) => n + Number(o.amount), 0);
    const prevSales = prev.reduce((n, o) => n + Number(o.amount), 0);
    return { cur, sales, prevSales, series, conversion: created.length ? (created.filter((o) => o.status === 'completed').length / created.length) * 100 : 0 };
  }, [orders, +start, +end, bucket]);

  const change = data.prevSales ? ((data.sales - data.prevSales) / data.prevSales) * 100 : data.sales ? 100 : 0;
  const toFulfill = orders.filter((o) => o.status === 'pending');
  const exportCsv = () => {
    const rows = [['Order', 'Completed', 'Amount', 'Payment', 'Driver'], ...data.cur.map((o) => [o.order_number, o.completed_at ?? '', String(o.amount), o.payment_method, o.driver_name ?? ''])];
    const url = URL.createObjectURL(new Blob([rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')], { type: 'text/csv' }));
    const a = document.createElement('a'); a.href = url; a.download = `mbombela-sales-${key.replace(/\s/g, '-')}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="relative">
        <button onClick={() => setOpen(!open)} className="flex items-center gap-2 rounded-full bg-sheet px-4 py-2 text-sm font-bold text-sheet-foreground shadow-lg">{key} <ChevronDown size={15} /></button>
        {open && <div className="absolute left-0 top-12 z-50 max-h-[70vh] w-64 overflow-y-auto rounded-2xl bg-sheet p-2 text-sm text-sheet-foreground shadow-2xl">
          {presets.map((p) => <button key={p} onClick={() => { setKey(p); if (p !== 'Custom range') setOpen(false); }} className={`block w-full rounded-lg px-3 py-2 text-left hover:bg-sheet-foreground/10 ${key === p ? 'font-bold' : ''}`}>{p}</button>)}
          {key === 'Custom range' && <div className="grid gap-2 p-2"><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-lg border border-sheet-foreground/20 bg-sheet p-2" /><input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-lg border border-sheet-foreground/20 bg-sheet p-2" /><button onClick={() => setOpen(false)} className="rounded-full bg-sheet-foreground py-2 font-bold text-sheet">Apply</button></div>}
          <p className="mt-2 border-t border-sheet-foreground/10 px-3 pt-2 text-xs opacity-60">Year</p>
          <div className="grid grid-cols-3 gap-1 p-1">{years.map((y) => <button key={y} onClick={() => { setKey(`Year ${y}`); setOpen(false); }} className="rounded-lg px-2 py-1.5 hover:bg-sheet-foreground/10">{y}</button>)}</div>
        </div>}
      </div>
      <span className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm"><span className="size-2 animate-pulse rounded-full bg-success" /> {live} live visitor{live === 1 ? '' : 's'}</span>
      <button onClick={exportCsv} className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-card"><Download size={15} /> Export CSV</button>
    </div>
    <div className="grid gap-4 md:grid-cols-3">
      {[['Total sales', `R${data.sales.toFixed(2)}`, `${change >= 0 ? '↑' : '↓'}${Math.abs(change).toFixed(0)}%`], ['Total orders', String(data.cur.length), ''], ['Conversion', `${data.conversion.toFixed(1)}%`, '']].map(([l, v, c]) => <div key={l} className="panel p-5"><p className="text-sm text-muted-foreground">{l}</p><div className="mt-3 flex items-end gap-2"><b className="display text-4xl">{v}</b>{c && <span className={`mb-1 text-xs ${change >= 0 ? 'text-success' : 'text-primary'}`}>{c}</span>}</div></div>)}
    </div>
    <div className="rounded-2xl bg-sheet p-5 text-sheet-foreground">
      <div className="mb-4 flex items-center justify-between"><h2 className="font-bold">{title} · Total sales over time</h2><span className="text-xs opacity-60">— current · · · previous period</span></div>
      <div className="relative h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data.series} margin={{ left: 0, right: 8, top: 8 }}>
            <defs><linearGradient id="teal" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--teal)" stopOpacity={0.2} /><stop offset="100%" stopColor="var(--teal)" stopOpacity={0} /></linearGradient></defs>
            <CartesianGrid stroke="#e5e5e5" vertical={false} />
            <XAxis dataKey="name" fontSize={11} stroke="#737373" interval="preserveStartEnd" minTickGap={24} />
            <YAxis fontSize={11} stroke="#737373" tickFormatter={(v) => `R${v}`} domain={[0, (max: number) => Math.max(800, Math.ceil(max / 100) * 100)]} width={48} />
            <Tooltip formatter={(v: number) => `R${Number(v).toFixed(2)}`} contentStyle={{ borderRadius: 12 }} />
            <Area type="monotone" dataKey="sales" name="Sales" stroke="var(--teal)" strokeWidth={2} fill="url(#teal)" />
            <Line type="monotone" dataKey="previous" name="Previous" stroke="#a3a3a3" strokeDasharray="3 4" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
        {!data.sales && <p className="pointer-events-none absolute inset-0 grid place-items-center text-sm opacity-60">No sales yet</p>}
      </div>
    </div>
    <div className="panel p-5">
      <h3 className="mb-3 font-bold">Orders to fulfill ({toFulfill.length})</h3>
      {toFulfill.length ? <div className="space-y-2">{toFulfill.slice(0, 10).map((o) => <button key={o.id} onClick={() => onOpenOrder?.(o)} className="flex w-full items-center justify-between rounded-xl bg-input p-3 text-left text-sm hover:bg-muted"><span>#{o.order_number} · {o.customer_name}</span><b>R{Number(o.amount).toFixed(2)}</b></button>)}</div> : <p className="text-sm text-muted-foreground">Nothing waiting.</p>}
    </div>
  </div>;
}
