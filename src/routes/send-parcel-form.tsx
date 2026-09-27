import { createFileRoute } from '@tanstack/react-router';
import { ParcelForm } from '@/components/transfer-client';
export const Route = createFileRoute('/send-parcel-form')({
  head: () => ({ meta: [
    { title: 'Send a Parcel | Mbombela Transfer' },
    { name: 'description', content: 'Request a parcel pickup and delivery around Mbombela.' },
    { property: 'og:title', content: 'Send a Parcel | Mbombela Transfer' },
    { property: 'og:description', content: 'Request a parcel pickup and delivery around Mbombela.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: () => <ParcelForm type="send" />,
});
