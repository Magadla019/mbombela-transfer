import { createFileRoute } from '@tanstack/react-router';
import { ClientHome } from '@/components/transfer-client';
export const Route = createFileRoute('/client-home')({
  head: () => ({ meta: [
    { title: 'Fast Local Delivery | Mbombela Transfer' },
    { name: 'description', content: 'Send, receive and track parcels, food and PAXI across Nelspruit and Mbombela.' },
    { property: 'og:title', content: 'Fast Local Delivery | Mbombela Transfer' },
    { property: 'og:description', content: 'Send, receive and track parcels, food and PAXI across Nelspruit and Mbombela.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: () => <ClientHome />,
});
