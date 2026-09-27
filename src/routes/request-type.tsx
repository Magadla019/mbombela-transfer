import { createFileRoute } from '@tanstack/react-router';
import { RequestType } from '@/components/transfer-client';
export const Route = createFileRoute('/request-type')({
  head: () => ({ meta: [
    { title: 'Request a Delivery | Mbombela Transfer' },
    { name: 'description', content: 'Choose to send or receive a parcel with trusted local riders.' },
    { property: 'og:title', content: 'Request a Delivery | Mbombela Transfer' },
    { property: 'og:description', content: 'Choose to send or receive a parcel with trusted local riders.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: () => <RequestType />,
});
