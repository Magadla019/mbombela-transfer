import { createFileRoute } from '@tanstack/react-router';
import { ClientNav } from '@/components/transfer-shared';
import { ClientMessages } from '@/components/Messages';

export const Route = createFileRoute('/messages')({
  head: () => ({ meta: [
    { title: 'Messages | Mbombela Transfer' },
    { name: 'description', content: 'Chat privately with the Mbombela Transfer team about your orders.' },
    { property: 'og:title', content: 'Messages | Mbombela Transfer' },
    { property: 'og:description', content: 'Chat privately with the Mbombela Transfer team about your orders.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
  ] }),
  ssr: false,
  component: () => <div className="min-h-screen bg-background"><ClientNav /><ClientMessages /></div>,
});
