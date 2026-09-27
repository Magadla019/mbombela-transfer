import { createFileRoute } from '@tanstack/react-router';
import { LoginPage } from '@/components/transfer-shared';
export const Route = createFileRoute('/login')({
  head: () => ({ meta: [
    { title: 'Login | Mbombela Transfer' },
    { name: 'description', content: 'Sign in to Mbombela Transfer or access your partner and driver dashboard.' },
    { property: 'og:title', content: 'Login | Mbombela Transfer' },
    { property: 'og:description', content: 'Sign in to Mbombela Transfer or access your partner and driver dashboard.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: () => <LoginPage />,
});
