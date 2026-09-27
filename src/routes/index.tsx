import { createFileRoute } from '@tanstack/react-router';
import { SplashPage } from '@/components/transfer-shared';
export const Route = createFileRoute('/')({
  head: () => ({ meta: [
    { title: 'Mbombela Transfer | Fast Local Delivery' },
    { name: 'description', content: 'Fast local delivery across Nelspruit and Mbombela. Send, receive and track with trusted riders.' },
    { property: 'og:title', content: 'Mbombela Transfer | Fast Local Delivery' },
    { property: 'og:description', content: 'Send, receive and track deliveries across Nelspruit and Mbombela.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: SplashPage,
});
