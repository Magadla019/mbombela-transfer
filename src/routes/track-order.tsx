import { createFileRoute } from '@tanstack/react-router';
import { TrackPage } from '@/components/transfer-track';
export const Route = createFileRoute('/track-order')({
  head: () => ({ meta: [
    { title: 'Track Your Parcel | Mbombela Transfer' },
    { name: 'description', content: 'Follow your active Mbombela Transfer delivery and rider.' },
    { property: 'og:title', content: 'Track Your Parcel | Mbombela Transfer' },
    { property: 'og:description', content: 'Follow your active Mbombela Transfer delivery and rider.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  validateSearch: (s: Record<string, unknown>): { orderId?: string } => ({ orderId: typeof s.orderId === 'string' ? s.orderId : undefined }),
  component: () => <TrackPage />,
});
