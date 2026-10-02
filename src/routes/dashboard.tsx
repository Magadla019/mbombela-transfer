import { createFileRoute } from '@tanstack/react-router';
import { ClientDashboard } from '@/components/ClientDashboard';

export const Route = createFileRoute('/dashboard')({
  head: () => ({ meta: [
    { title: 'My Orders | Mbombela Transfer' },
    { name: 'description', content: 'View your Mbombela Transfer orders and delivery spending.' },
    { property: 'og:title', content: 'My Orders | Mbombela Transfer' },
    { property: 'og:description', content: 'Your personal deliveries and order history.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
    { name: 'robots', content: 'noindex' },
  ] }),
  component: ClientDashboard,
});