import { createFileRoute } from '@tanstack/react-router';
import { Dashboard } from '@/components/transfer-dashboard';
export const Route = createFileRoute('/partner-dashboard')({
  head: () => ({ meta: [
    { title: 'Partner Dashboard | Mbombela Transfer' },
    { name: 'description', content: 'Manage deliveries, reviews and performance for Mbombela Transfer partners.' },
    { property: 'og:title', content: 'Partner Dashboard | Mbombela Transfer' },
    { property: 'og:description', content: 'Manage deliveries, reviews and performance for Mbombela Transfer partners.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: () => <Dashboard role="partner" />,
});
