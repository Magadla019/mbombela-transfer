import { createFileRoute } from '@tanstack/react-router';
import { Dashboard } from '@/components/transfer-dashboard';
export const Route = createFileRoute('/driver-dashboard')({
  head: () => ({ meta: [
    { title: 'Driver Dashboard | Mbombela Transfer' },
    { name: 'description', content: 'Manage pickup and delivery orders as a Mbombela Transfer driver.' },
    { property: 'og:title', content: 'Driver Dashboard | Mbombela Transfer' },
    { property: 'og:description', content: 'Manage pickup and delivery orders as a Mbombela Transfer driver.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: () => <Dashboard role="driver" />,
});
