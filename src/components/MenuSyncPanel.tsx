import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { syncMenus } from '@/lib/menu-sync.functions';
import { getStaffToken } from '@/lib/transfer';

export function MenuSyncPanel() {
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<{ slug: string; status: string; message: string }[]>([]);
  const run = async () => {
    setBusy(true);
    try { const r = await syncMenus({ data: { token: getStaffToken() } }); setResults(r); toast.success(`${r.filter((x) => x.status === 'success').length} of ${r.length} menus updated`); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Sync failed'); } finally { setBusy(false); }
  };
  return <div className="panel max-w-2xl p-7">
    <h2 className="font-bold">Restaurant Menus</h2>
    <p className="mt-2 text-sm text-muted-foreground">Checks each restaurant’s official website. Items you added manually are never overwritten.</p>
    <Button className="red-gradient mt-5 rounded-full" disabled={busy} onClick={run}><RefreshCw className={busy ? 'animate-spin' : ''} /> {busy ? 'Syncing…' : '🔄 Sync Now All Menus'}</Button>
    {results.length > 0 && <ul className="mt-6 space-y-2 text-sm">{results.map((r) => <li key={r.slug} className="flex justify-between gap-4 border-b border-border pb-2"><b className="capitalize">{r.slug}</b><span className={r.status === 'success' ? 'text-[var(--chat-online)]' : 'text-muted-foreground'}>{r.message}</span></li>)}</ul>}
  </div>;
}
