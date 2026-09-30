import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { Copy, LogOut, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Brand } from '@/components/transfer-shared';
import { ShopifyAnalytics } from '@/components/ShopifyAnalytics';
import { DriverAccessPanel, useDrivers, type DriverRow } from '@/components/staff-panels';
import { staffData } from '@/lib/orders.functions';
import { clearStaff, getStaffToken, type Order } from '@/lib/transfer';

export const Route = createFileRoute('/driver-control-center')({
  head: () => ({ meta: [
    { title: 'Driver Control Center | Mbombela Transfer' },
    { name: 'description', content: 'Manage Mbombela Transfer drivers, access passwords and earnings.' },
    { property: 'og:title', content: 'Driver Control Center | Mbombela Transfer' },
    { property: 'og:description', content: 'Manage drivers, access passwords and earnings.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
    { name: 'robots', content: 'noindex' },
  ] }),
  component: ControlCenter,
});

const tabs = ['Overview', 'Drivers', 'Driver Detail', 'Passwords', 'Leaderboard'] as const;

function ControlCenter() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<(typeof tabs)[number]>('Overview');
  const [orders, setOrders] = useState<Order[]>([]);
  const [ready, setReady] = useState(false);
  const [pick, setPick] = useState<DriverRow | null>(null);
  const { drivers } = useDrivers();
  useEffect(() => {
    if (!getStaffToken()) { navigate({ to: '/login' }); return; }
    const load = () => staffData({ data: { token: getStaffToken() } }).then((d) => { if (d.role !== 'master') throw new Error(); setOrders(d.orders); setReady(true); }).catch(() => { clearStaff(); navigate({ to: '/login' }); });
    load(); const t = setInterval(load, 4000); return () => clearInterval(t);
  }, []);
  if (!ready) return <main className="min-h-screen bg-background" />;
  const done = orders.filter((o) => o.status === 'completed');
  const ranked = [...drivers].sort((a, b) => b.income - a.income);
  const open = (d: DriverRow) => { setPick(d); setTab('Driver Detail'); };
  return <div className="min-h-screen bg-background">
    <header className="flex h-16 items-center justify-between border-b border-border px-5 md:px-10"><Brand /><Button variant="ghost" onClick={() => { clearStaff(); localStorage.removeItem('master_access'); navigate({ to: '/login' }); }}><LogOut /> Log out</Button></header>
    <main className="mx-auto max-w-[1400px] p-5 md:p-10">
      <h1 className="display text-5xl">Driver <span className="text-primary">Control Center</span></h1>
      <div className="my-6 flex gap-2 overflow-x-auto">{tabs.map((t) => <Button key={t} variant="ghost" onClick={() => setTab(t)} className={`shrink-0 rounded-full ${tab === t ? 'bg-primary text-foreground' : 'text-muted-foreground'}`}>{t}</Button>)}</div>
      {tab === 'Overview' && <>
        <div className="mb-6 grid gap-4 md:grid-cols-3">{[['Drivers', drivers.length], ['Completed orders', done.length], ['Total income (all drivers)', `R${done.reduce((n, o) => n + Number(o.amount), 0).toFixed(2)}`]].map(([l, v]) => <div key={l} className="panel p-5"><p className="text-sm text-muted-foreground">{l}</p><b className="display mt-3 block text-4xl">{v}</b></div>)}</div>
        <ShopifyAnalytics orders={orders} title="All drivers" />
      </>}
      {tab === 'Drivers' && <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{drivers.map((d) => <div key={d.id} className="rounded-2xl border border-border bg-card p-5">
        <button className="text-left" onClick={() => open(d)}><b>{d.driver_name || 'Profile pending'}</b><p className="text-xs text-muted-foreground">{d.driver_phone || '—'} · {d.is_active ? 'Active' : 'Deactivated'}</p><p className="mt-2 text-sm">{d.completed} orders · R{d.income.toFixed(2)}</p></button>
        <Button size="sm" variant="outline" className="mt-3 rounded-full" onClick={() => navigator.clipboard.writeText(d.password).then(() => toast.success('Copied'))}><Copy /> Copy password</Button>
      </div>)}{!drivers.length && <p className="text-muted-foreground">No drivers yet. Add one under Passwords.</p>}</div>}
      {tab === 'Driver Detail' && (pick ? <>
        <div className="mb-5 flex flex-wrap items-center gap-3"><select className="field !w-auto" value={pick.id} onChange={(e) => setPick(drivers.find((d) => d.id === e.target.value) ?? pick)}>{drivers.map((d) => <option key={d.id} value={d.id}>{d.driver_name || d.password}</option>)}</select></div>
        <ShopifyAnalytics orders={orders.filter((o) => o.driver_id === pick.id)} title={pick.driver_name || 'Driver'} />
        <div className="panel mt-5 overflow-x-auto"><table className="w-full min-w-[520px] text-left text-sm"><thead className="text-xs text-muted-foreground"><tr><th className="p-4">Order</th><th>Status</th><th>Amount</th><th>Date</th></tr></thead><tbody>{orders.filter((o) => o.driver_id === pick.id).map((o) => <tr key={o.id} className="border-t border-border"><td className="p-4">#{o.order_number}</td><td className="capitalize">{o.status.replace('_', ' ')}</td><td>R{Number(o.amount).toFixed(2)}</td><td>{new Date(o.completed_at ?? o.created_at).toLocaleDateString()}</td></tr>)}</tbody></table></div>
      </> : <p className="text-muted-foreground">Pick a driver from the Drivers tab.</p>)}
      {tab === 'Passwords' && <DriverAccessPanel onPick={open} />}
      {tab === 'Leaderboard' && <div className="space-y-3">{ranked.map((d, i) => <div key={d.id} className={`flex items-center gap-4 rounded-2xl border p-5 ${i === 0 ? 'border-gold bg-card' : 'border-border bg-card'}`}><span className="display w-10 text-3xl">{i === 0 ? <Trophy className="text-gold" /> : i + 1}</span><div className="flex-1"><b>{d.driver_name || 'Profile pending'}</b><p className="text-xs text-muted-foreground">{d.completed} orders</p></div><b>R{d.income.toFixed(2)}</b></div>)}{!ranked.length && <p className="text-muted-foreground">No drivers yet.</p>}</div>}
    </main>
  </div>;
}
