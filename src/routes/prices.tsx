import { createFileRoute, Link } from '@tanstack/react-router';
import { ClientLayout } from '@/components/transfer-shared';
import { priceName, usePricing } from '@/lib/pricing';

function Prices() { const prices = usePricing(true); return <ClientLayout><main className="mx-auto min-h-[70vh] max-w-5xl px-5 py-12"><h1 className="display mb-8 text-5xl">Price List</h1><div className="grid gap-3 sm:grid-cols-2">{Object.entries(priceName).map(([key, label]) => prices[key] && <div key={key} className="flex items-center justify-between border-b border-border py-5"><span>{label}</span><b className="text-xl text-primary">R{Number(prices[key].price).toFixed(2)}</b></div>)}</div><Link to="/request-type" className="mt-10 inline-block text-primary">Request a delivery →</Link></main></ClientLayout> }
export const Route = createFileRoute('/prices')({ head: () => ({ meta: [
  { title: 'Delivery Prices | Mbombela Transfer' }, { name: 'description', content: 'See current delivery prices for parcels, food and PAXI.' }, { property: 'og:title', content: 'Delivery Prices | Mbombela Transfer' }, { property: 'og:description', content: 'Current parcel, food and PAXI delivery prices.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' },
] }), component: Prices });