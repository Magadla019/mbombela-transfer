import { useEffect, useRef, useState } from 'react';
import { useRouterState } from '@tanstack/react-router';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { choosePayment, clientOrders, confirmDelivery, markClientPopupShown } from '@/lib/orders.functions';
import { myOrderIds } from '@/lib/transfer';
import OrderDeliveredPopup from './OrderDeliveredPopup';

type O = Awaited<ReturnType<typeof clientOrders>>[number];
const STAFF = ['/partner-dashboard', '/driver-dashboard', '/driver-home', '/driver-control-center', '/login', '/'];

// Remembers order state on the server, so a client who was away still gets the right popup next visit.
export function GlobalClientPopups() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const staff = STAFF.includes(path);
  const [order, setOrder] = useState<O | null>(null);
  const [ready, setReady] = useState(false);
  const [pay, setPay] = useState<'Cash' | 'Card'>('Cash');
  const timer = useRef<ReturnType<typeof setTimeout>|undefined>(undefined);

  useEffect(() => {
    if (staff) return;
    const ch = supabase.channel('online-clients', { config: { presence: { key: crypto.randomUUID() } } });
    ch.subscribe((s) => { if (s === 'SUBSCRIBED') ch.track({ at: Date.now() }); });
    return () => { supabase.removeChannel(ch); };
  }, [staff]);

  useEffect(() => {
    if (staff) { setOrder(null); return; }
    let alive = true;
    const sync = async () => {
      const ids = myOrderIds();
      if (!ids.length) return;
      const rows = await clientOrders({ data: { ids } }).catch(() => []);
      if (!alive) return;
      const next = rows.find((o) => ['arrived', 'payment_pending', 'payment_verifying'].includes(o.status))
        ?? rows.find((o) => o.status === 'completed' && !o.client_popup_shown && !localStorage.getItem(`delivered_popup_shown_${o.order_number}`));
      setOrder((prev) => {
        if (next && (!prev || prev.id !== next.id)) { setReady(false); clearTimeout(timer.current); timer.current = setTimeout(() => setReady(true), 1500); }
        return next ?? null;
      });
    };
    sync();
    const t = setInterval(sync, 3000);
    return () => { alive = false; clearInterval(t); };
  }, [staff]);

  if (!order || !ready || staff) return null;
  const close = () => { localStorage.setItem(`delivered_popup_shown_${order.order_number}`, '1'); markClientPopupShown({ data: { id: order.id } }).catch(() => {}); setOrder(null); };
  const wrap = (c: React.ReactNode) => <div className="fixed inset-0 z-[3000] flex items-end justify-center bg-background/80 backdrop-blur-sm sm:items-center"><div className="panel w-full max-w-md rounded-b-none rounded-t-[32px] p-8 text-center sm:rounded-[32px]">{c}</div></div>;

  if (order.status === 'completed') return <OrderDeliveredPopup show orderNumber={order.order_number} onClose={close} />;
  if (order.status === 'arrived') return wrap(<>
    <span className="text-5xl">🎉</span><h2 className="display mt-4 text-4xl">Order Arrived!</h2>
    <p className="mt-4 text-sm leading-6 text-muted-foreground">Order #{order.order_number} was delivered to {order.delivery_address}. Please confirm.</p>
    <Button className="mt-7 h-12 w-full rounded-full bg-success text-background hover:bg-success/90" onClick={() => confirmDelivery({ data: { id: order.id } }).then(() => setOrder({ ...order, status: 'payment_pending' })).catch(() => toast.error('Could not confirm, try again'))}>Confirm</Button>
    <Button variant="ghost" className="mt-2 w-full text-muted-foreground" onClick={() => toast.info('Please contact Customer Care on WhatsApp to report an issue.')}>Report Issue</Button>
  </>);
  if (order.status === 'payment_pending') return wrap(<>
    <h2 className="display text-4xl">PAYMENT</h2>
    <p className="mt-2 text-sm text-muted-foreground">Amount due: <b className="text-foreground">R{Number(order.amount).toFixed(2)}</b></p>
    <div className="mt-6 space-y-3 text-left">{(['Cash', 'Card'] as const).map((m) => <label key={m} className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 ${pay === m ? 'border-primary bg-accent' : 'border-border'}`}><input type="radio" name="pay" className="accent-primary" checked={pay === m} onChange={() => setPay(m)} /><span className="font-bold">{m === 'Cash' ? 'Cash' : 'Card Machine'}</span></label>)}</div>
    <Button className="red-gradient mt-7 h-12 w-full rounded-full font-bold" onClick={() => choosePayment({ data: { id: order.id, method: pay } }).then(() => setOrder({ ...order, status: 'payment_verifying', payment_method: pay })).catch(() => toast.error('Could not save payment, try again'))}>Paid</Button>
  </>);
  return wrap(<>
    <div className="mx-auto mb-5 size-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    <h2 className="display text-3xl">Waiting for rider</h2>
    <p className="mt-3 text-sm text-muted-foreground">Your rider is confirming the {order.payment_method === 'Card' ? 'card' : 'cash'} payment of R{Number(order.amount).toFixed(2)}.</p>
  </>);
}
