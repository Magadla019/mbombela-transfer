import { createFileRoute } from '@tanstack/react-router';
import { PaxiSendForm } from '@/components/transfer-client';
export const Route = createFileRoute('/paxi-send')({
  head: () => ({ meta: [
    { title: 'Send a PAXI Parcel | Mbombela Transfer' },
    { name: 'description', content: 'We collect your parcel and take it to any PEP store for PAXI sending.' },
    { property: 'og:title', content: 'Send a PAXI Parcel | Mbombela Transfer' },
    { property: 'og:description', content: 'We collect your parcel and take it to any PEP store for PAXI sending.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: () => <PaxiSendForm />,
});
