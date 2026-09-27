import { createFileRoute } from '@tanstack/react-router';
import { FoodForm } from '@/components/transfer-client';
export const Route = createFileRoute('/food-order-form')({
  head: () => ({ meta: [
    { title: 'Food Delivery | Mbombela Transfer' },
    { name: 'description', content: 'Order food from your favourite local restaurants for delivery.' },
    { property: 'og:title', content: 'Food Delivery | Mbombela Transfer' },
    { property: 'og:description', content: 'Order food from your favourite local restaurants for delivery.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: () => <FoodForm />,
});
