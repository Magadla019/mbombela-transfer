import { useEffect, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { Copy, Eye, EyeOff, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getStaffToken } from '@/lib/transfer';
import { listDrivers, refreshAction, saveDriver, setDriverActive, updatePrice } from '@/lib/staff.functions';
import { priceName, usePricing, type PriceRow } from '@/lib/pricing';

export function Sheet({ children, onClose, light = false }: { children: ReactNode; onClose: () => void; light?: boolean }) {
  return <div className="fixed inset-0 z-[2000] flex items-end justify-center bg-background/70 backdrop-blur-sm sm:items-center" onClick={onClose}>
    <div onClick={(e) => e.stopPropagation()} className={`relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-[32px] p-7 sm:rounded-[32px] ${light ? 'bg-sheet text-sheet-foreground' : 'border border-border bg-card'}`}>
      <button onClick={onClose} aria-label="Close" className="absolute right-5 top-5 opacity-60 hover:opacity-100"><X size={20} /></button>
      {children}
    </div>
  </div>;
}

const copy = (v: string) => navigator.clipboard.writeText(v).then(() => toast.success('Copied'));
const genPassword = () => { const c = 'abcdefghjkmnpqrstuvwxyz23456789'; return Array.from(crypto.getRandomValues(new Uint32Array(12)), (n) => c[n % c.length]).join(''); };

export type DriverRow = Awaited<ReturnType<typeof listDrivers>>[number];

export function useDrivers() {
  const [drivers, setDrivers] = useState<DriverRow[]>([]);
  const load = () => listDrivers({ data: { token: getStaffToken() } }).then(setDrivers).catch(() => {});
  useEffect(() => { void load(); const t = setInterval(load, 5000); return () => clearInterval(t); }, []);
  return { drivers, load };
}

function DriverForm({ driver, onDone }: { driver?: DriverRow | undefined; onDone: () => void }) {
  const [name, setName] = useState(driver?.driver_name ?? ''); const [phone, setPhone] = useState(driver?.driver_phone ?? ''); const [pw, setPw] = useState(driver?.password ?? ''); const [busy, setBusy] = useState(false);
  const save = async () => {
    if (pw.trim().length < 4) { toast.error('Password must be at least 4 characters'); return; }
    setBusy(true);
    try { await saveDriver({ data: { token: getStaffToken(), id: driver?.id, password: pw.trim(), name, phone } }); toast.success(driver ? 'Driver updated' : 'Driver added'); onDone(); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Could not save'); } finally { setBusy(false); }
  };
  return <Sheet onClose={onDone}>
    <h2 className="display text-3xl">{driver ? 'Change Driver' : 'Add New Driver'}</h2>
    <div className="mt-6 space-y-4">
      <label className="block text-sm">Driver Name <span className="text-muted-foreground">(optional)</span><input className="field mt-2" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} /></label>
      <label className="block text-sm">Phone <span className="text-muted-foreground">(optional)</span><input className="field mt-2" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} /></label>
      <label className="block text-sm">Create Password <span className="text-primary">*</span><input className="field mt-2" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="e.g. Blessing123 or 0927" maxLength={60} /></label>
      <p className="text-xs text-muted-foreground">Choose an easy password the driver can remember.</p>
      <div className="flex gap-2"><Button type="button" variant="outline" className="flex-1 rounded-full" onClick={() => setPw(genPassword())}>🎲 Generate</Button><Button type="button" variant="outline" className="flex-1 rounded-full" onClick={() => pw && copy(pw)}>📋 Copy Password</Button></div>
      <Button disabled={busy} className="red-gradient h-12 w-full rounded-full" onClick={save}>{busy ? 'Saving…' : 'Save'}</Button>
    </div>
  </Sheet>;
}

export function DriverAccessPanel({ onPick }: { onPick?: (d: DriverRow) => void }) {
  const { drivers, load } = useDrivers();
  const [shown, setShown] = useState<Record<string, boolean>>({});
  const [edit, setEdit] = useState<DriverRow | 'new' | null>(null);
  return <div className="panel p-6">
    <div className="mb-5 flex items-center justify-between"><h2 className="font-bold">Driver Access Codes</h2><Button size="sm" className="red-gradient rounded-full" onClick={() => setEdit('new')}><Plus /> Add Driver</Button></div>
    {!drivers.length && <p className="text-sm text-muted-foreground">No drivers yet. Add your first driver.</p>}
    <div className="grid gap-3 md:grid-cols-2">{drivers.map((d) => <div key={d.id} className={`rounded-2xl bg-input p-4 ${d.is_active ? '' : 'opacity-50'}`}>
      <button className="text-left" onClick={() => onPick?.(d)}><b>{d.driver_name || 'New driver (profile pending)'}</b><p className="text-xs text-muted-foreground">{d.driver_phone || '—'} · {d.completed} done · R{d.income.toFixed(2)}</p></button>
      <p className="mt-2 font-mono text-sm">Password: {shown[d.id] ? d.password : '•'.repeat(Math.min(10, d.password.length))}</p>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <Button size="sm" variant="outline" className="rounded-full" onClick={() => setShown((s) => ({ ...s, [d.id]: !s[d.id] }))}>{shown[d.id] ? <EyeOff /> : <Eye />} {shown[d.id] ? 'Hide' : 'Show'}</Button>
        <Button size="sm" variant="outline" className="rounded-full" onClick={() => copy(d.password)}><Copy /> Copy</Button>
        <Button size="sm" variant="outline" className="rounded-full" onClick={() => setEdit(d)}>Change</Button>
        <Button size="sm" variant="outline" className="rounded-full border-primary text-primary" onClick={() => setDriverActive({ data: { token: getStaffToken(), id: d.id, active: !d.is_active } }).then(load)}>{d.is_active ? 'Deactivate' : 'Activate'}</Button>
      </div>
    </div>)}</div>
    {edit && <DriverForm driver={edit === 'new' ? undefined : edit} onDone={() => { setEdit(null); load(); }} />}
  </div>;
}

const applyOptions = [['self', 'This item only'], ['paxi', 'PAXI only'], ['food_delivery', 'Food'], ['receive_package', 'Receive'], ['send_package', 'Send'], ['all', 'All']] as const;
export function PricingPanel() {
  const map = usePricing();
  const [edit, setEdit] = useState<PriceRow | null>(null);
  const [price, setPrice] = useState(''); const [lbl, setLbl] = useState(''); const [apply, setApply] = useState<(typeof applyOptions)[number][0]>('self');
  const rows = Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  const open = (r: PriceRow) => { setEdit(r); setPrice(String(r.price)); setLbl(r.label ?? ''); setApply('self'); };
  const save = async () => {
    if (!edit) return;
    try { await updatePrice({ data: { token: getStaffToken(), id: edit.id, price: Number(price), label: lbl || null, applyTo: apply } }); toast.success('Price is now LIVE'); setEdit(null); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Could not update'); }
  };
  return <div>
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{rows.map(([k, r]) => <button key={k} onClick={() => open(r)} className="rounded-2xl border border-border bg-input p-5 text-left hover:border-primary">
      <p className="text-sm text-muted-foreground">{priceName[k] ?? k}</p>
      <b className="display mt-2 block text-3xl">R{Number(r.price)}</b>
      {r.label && <span className="mt-2 inline-block rounded-full bg-gold px-2 py-0.5 text-xs font-bold text-background">{r.label} R{Number(r.price)}</span>}
    </button>)}</div>
    {edit && <Sheet onClose={() => setEdit(null)}>
      <h2 className="display text-3xl">{priceName[`${edit.category}:${edit.sub_category}`]}</h2>
      <div className="mt-6 space-y-4">
        <label className="block text-sm">Price (R)<input className="field mt-2" type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} /></label>
        <label className="block text-sm">Custom Label<input className="field mt-2" value={lbl} onChange={(e) => setLbl(e.target.value)} placeholder="September Special Price" maxLength={60} /></label>
        <label className="block text-sm">Where to apply the label<select className="field mt-2" value={apply} onChange={(e) => setApply(e.target.value as typeof apply)}>{applyOptions.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
        <div className="flex gap-2"><Button variant="ghost" className="flex-1" onClick={() => setEdit(null)}>Cancel</Button><Button className="red-gradient flex-1 rounded-full" onClick={save}>Update</Button></div>
      </div>
    </Sheet>}
  </div>;
}

type Section = 'orders_new' | 'orders_completed' | 'orders_canceled' | 'orders_paid' | 'orders_all' | 'clients' | 'drivers' | 'reviews' | 'revenue' | 'all';
const groups: { icon: string; label: string; section?: Section; sub?: [string, Section][] }[] = [
  { icon: '📦', label: 'Orders', sub: [['New', 'orders_new'], ['Completed', 'orders_completed'], ['Canceled', 'orders_canceled'], ['Paid', 'orders_paid'], ['All', 'orders_all']] },
  { icon: '👥', label: 'Clients', section: 'clients' }, { icon: '🚗', label: 'Drivers', section: 'drivers' },
  { icon: '⭐', label: 'Reviews', section: 'reviews' }, { icon: '💰', label: 'Revenue', section: 'revenue' },
  { icon: '🗄️', label: 'All Dashboard FULL RESET', section: 'all' },
];
export function RefreshCenter({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = useState(false); const [group, setGroup] = useState<(typeof groups)[number] | null>(null);
  const [confirm, setConfirm] = useState<[string, Section] | null>(null); const [typed, setTyped] = useState(''); const [busy, setBusy] = useState(false);
  const close = () => { setOpen(false); setGroup(null); setConfirm(null); setTyped(''); };
  const run = async () => {
    if (!confirm) return; setBusy(true);
    try { await refreshAction({ data: { token: getStaffToken(), section: confirm[1], confirm: typed } }); toast.success(confirm[1] === 'all' ? 'Fresh start' : `${confirm[0]} cleared`); close(); onDone(); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Failed'); } finally { setBusy(false); }
  };
  return <div className="rounded-2xl border border-primary bg-accent p-6">
    <h2 className="font-bold">🔄 Dashboard Refresh Center</h2>
    <p className="mt-2 text-sm text-muted-foreground">Permanently clear data. This cannot be undone.</p>
    <Button variant="outline" className="mt-5 rounded-full border-primary text-primary" onClick={() => setOpen(true)}>Refresh Dashboard</Button>
    {open && <Sheet onClose={close}>
      {!confirm ? <>
        <h2 className="display text-3xl">{group ? `${group.icon} ${group.label}` : 'What do you want to clear?'}</h2>
        <div className="mt-6 grid grid-cols-2 gap-3">
          {!group ? groups.map((g) => <button key={g.label} onClick={() => g.sub ? setGroup(g) : setConfirm([g.label, g.section!])} className={`rounded-2xl border p-4 text-left text-sm font-bold hover:border-primary ${g.section === 'all' ? 'col-span-2 border-primary text-primary' : 'border-border bg-input'}`}><span className="text-2xl">{g.icon}</span><br />{g.label}</button>)
            : group.sub!.map(([l, s]) => <button key={s} onClick={() => setConfirm([`${l} orders`, s])} className="rounded-2xl border border-border bg-input p-4 text-sm font-bold hover:border-primary">{l}</button>)}
        </div>
        {group && <Button variant="ghost" className="mt-4" onClick={() => setGroup(null)}>← Back</Button>}
      </> : <>
        <h2 className="display text-3xl">Are you sure?</h2>
        <p className="mt-3 text-sm text-muted-foreground">This will permanently delete: <b className="text-foreground">{confirm[0]}</b>.</p>
        {confirm[1] === 'all' && <label className="mt-4 block text-sm">Type DELETE ALL to confirm<input className="field mt-2" value={typed} onChange={(e) => setTyped(e.target.value)} /></label>}
        <Button disabled={busy || (confirm[1] === 'all' && typed !== 'DELETE ALL')} className="red-gradient mt-6 h-12 w-full rounded-full" onClick={run}>{busy ? 'Clearing…' : 'Confirm'}</Button>
        <Button variant="ghost" className="mt-2 w-full" onClick={() => setConfirm(null)}>Go back</Button>
      </>}
    </Sheet>}
  </div>;
}
