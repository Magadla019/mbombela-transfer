import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Package, Clock3, CheckCircle2, Wallet } from 'lucide-react';
import { ClientLayout } from './transfer-shared';
import { clientOrders } from '@/lib/orders.functions';
import { myOrderIds } from '@/lib/transfer';

type Order = Awaited<ReturnType<typeof clientOrders>>[number];
export function ClientDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  useEffect(() => { let alive = true; const load = async () => { const ids = myOrderIds(); if (!ids.length) return; try { const rows = await clientOrders({ data: { ids } }); if (alive) setOrders(rows); } catch { /* Keep the last known list while offline. */ } }; void load(); const timer = setInterval(load, 3000); return () => { alive = false; clearInterval(timer); }; }, []);
  const pending = orders.filter(o => !['completed', 'canceled'].includes(o.status)).length;
  const delivered = orders.filter(o => o.status === 'completed');
  return <ClientLayout><main className="mx-auto min-h-[70vh] max-w-6xl px-5 py-12"><h1 className="display text-5xl">My Orders</h1><div className="mt-9 grid grid-cols-2 gap-3 lg:grid-cols-4">{([[Package, 'Total Orders', orders.length], [Clock3, 'Pending', pending], [CheckCircle2, 'Delivered', delivered.length], [Wallet, 'Spent', `R${delivered.reduce((n,o)=>n+Number(o.amount),0).toFixed(2)}`]] as const).map(([Icon,label,value]) => <div key={label} className="panel p-5"><Icon size={21} className="text-primary"/><p className="mt-5 text-sm text-muted-foreground">{label}</p><b className="display mt-2 block text-3xl">{value}</b></div>)}</div><h2 className="display mb-5 mt-12 text-3xl">Recent orders</h2>{!orders.length ? <p className="text-muted-foreground">No orders yet - 0</p> : <div className="space-y-3">{orders.map(order => <Link key={order.id} to="/track-order" search={{orderId:order.id}} className="panel flex flex-wrap items-center justify-between gap-4 p-5 transition-colors hover:border-primary"><div><b>#{order.order_number}</b><p className="mt-1 text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString()} · {order.order_type}</p></div><div className="text-right"><b>R{Number(order.amount).toFixed(2)}</b><p className="mt-1 text-xs capitalize text-primary">{order.status.replaceAll('_',' ')}</p></div></Link>)}</div>}</main></ClientLayout>;
}