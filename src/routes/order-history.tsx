import { createFileRoute } from '@tanstack/react-router';
import { ClientLayout } from '@/components/transfer-shared';
import { OrderHistory } from '@/components/OrderHistory';

export const Route = createFileRoute('/order-history')({
  head: () => ({ meta: [
    { title: 'Order History | Mbombela Transfer' },
    { name: 'description', content: 'See your completed Mbombela Transfer deliveries and rate them.' },
    { property: 'og:title', content: 'Order History | Mbombela Transfer' },
    { property: 'og:description', content: 'See your completed Mbombela Transfer deliveries and rate them.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
  ] }),
  component: () => <ClientLayout><main className="mx-auto min-h-[70vh] max-w-7xl px-5 py-12"><OrderHistory /></main></ClientLayout>,
});
