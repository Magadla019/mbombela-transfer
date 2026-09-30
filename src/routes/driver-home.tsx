import { createFileRoute } from '@tanstack/react-router';
import { Dashboard } from '@/components/transfer-dashboard';

export const Route = createFileRoute('/driver-home')({
  head: () => ({ meta: [
    { title: 'Driver Home | Mbombela Transfer' },
    { name: 'description', content: 'Accept new deliveries and track your own earnings as a Mbombela Transfer driver.' },
    { property: 'og:title', content: 'Driver Home | Mbombela Transfer' },
    { property: 'og:description', content: 'Accept new deliveries and track your own earnings.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
    { name: 'robots', content: 'noindex' },
  ] }),
  component: () => <Dashboard role="driver" />,
});
