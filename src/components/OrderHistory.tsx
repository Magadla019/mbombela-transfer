import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { clientOrders } from '@/lib/orders.functions';
import { myOrderIds } from '@/lib/transfer';

type O = Awaited<ReturnType<typeof clientOrders>>[number];

export function OrderHistory() {
  const [rows, setRows] = useState<O[] | null>(null);
  useEffect(() => {
    const ids = myOrderIds();
    if (!ids.length) { setRows([]); return; }
    clientOrders({ data: { ids } }).then((r) => setRows(r.filter((o) => o.status === 'completed').sort((a, b) => (b.completed_at ?? '').localeCompare(a.completed_at ?? '')))).catch(() => setRows([]));
  }, []);
  return <section>
    <h2 className="display mb-5 text-4xl">Order <span className="text-primary">History</span></h2>
    {rows === null ? <div className="h-24" /> : !rows.length ? <p className="text-muted-foreground">No completed orders yet.</p> :
      <div className="grid gap-3 md:grid-cols-2">{rows.map((o) => <div key={o.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-5">
        <div><b>#{o.order_number}</b><p className="mt-1 text-xs text-muted-foreground">{new Date(o.completed_at ?? o.created_at).toLocaleString()}</p>
          <div className="mt-2 flex items-center gap-2"><b>R{Number(o.amount).toFixed(2)}</b><span className="rounded-full bg-success/15 px-2 py-0.5 text-xs text-success">{o.payment_method}</span></div></div>
        <Link to="/reviews" search={{ order: o.order_number }} className="rounded-full bg-primary px-4 py-2 text-sm font-bold">Rate Us</Link>
      </div>)}</div>}
  </section>;
}
