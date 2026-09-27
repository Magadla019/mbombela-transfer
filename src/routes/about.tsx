import { createFileRoute } from '@tanstack/react-router';
import { AboutPage } from '@/components/transfer-client';
export const Route = createFileRoute('/about')({
  head: () => ({ meta: [
    { title: 'About Us | Mbombela Transfer' },
    { name: 'description', content: 'Learn about local delivery services in Nelspruit and Mbombela.' },
    { property: 'og:title', content: 'About Us | Mbombela Transfer' },
    { property: 'og:description', content: 'Learn about local delivery services in Nelspruit and Mbombela.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: () => <AboutPage />,
});
