import { createFileRoute } from '@tanstack/react-router';
import { PaxiForm } from '@/components/transfer-client';
export const Route = createFileRoute('/paxi-form')({
  head: () => ({ meta: [
    { title: 'PEP PAXI Collection | Mbombela Transfer' },
    { name: 'description', content: 'Request collection and delivery of your PEP PAXI parcel.' },
    { property: 'og:title', content: 'PEP PAXI Collection | Mbombela Transfer' },
    { property: 'og:description', content: 'Request collection and delivery of your PEP PAXI parcel.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: () => <PaxiForm />,
});
