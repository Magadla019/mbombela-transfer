import { createFileRoute } from '@tanstack/react-router';
import { ReviewsPage } from '@/components/transfer-client';
export const Route = createFileRoute('/reviews')({
  head: () => ({ meta: [
    { title: 'Customer Reviews | Mbombela Transfer' },
    { name: 'description', content: 'Share and read delivery reviews from Mbombela Transfer customers.' },
    { property: 'og:title', content: 'Customer Reviews | Mbombela Transfer' },
    { property: 'og:description', content: 'Share and read delivery reviews from Mbombela Transfer customers.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  validateSearch: (s: Record<string, unknown>): { order?: string } => (typeof s['order'] === 'string' ? { order: s['order'].slice(0, 60) } : {}),
  component: () => <ReviewsPage />,
});
