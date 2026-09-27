import { createFileRoute } from '@tanstack/react-router';
import { ParcelForm } from '@/components/transfer-client';
export const Route = createFileRoute('/receive-parcel-form')({
  head: () => ({ meta: [
    { title: 'Receive a Parcel | Mbombela Transfer' },
    { name: 'description', content: 'Have a local rider collect and deliver your parcel.' },
    { property: 'og:title', content: 'Receive a Parcel | Mbombela Transfer' },
    { property: 'og:description', content: 'Have a local rider collect and deliver your parcel.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: () => <ParcelForm type="receive" />,
});
