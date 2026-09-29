import { createFileRoute } from '@tanstack/react-router';
import { PaxiReceiveForm } from '@/components/transfer-client';
export const Route = createFileRoute('/paxi-receive')({
  head: () => ({ meta: [
    { title: 'Receive a PAXI Parcel | Mbombela Transfer' },
    { name: 'description', content: 'We collect your PEP PAXI parcel and deliver it to your door in Mbombela.' },
    { property: 'og:title', content: 'Receive a PAXI Parcel | Mbombela Transfer' },
    { property: 'og:description', content: 'We collect your PEP PAXI parcel and deliver it to your door in Mbombela.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: () => <PaxiReceiveForm />,
});
