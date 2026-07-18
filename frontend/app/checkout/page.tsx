import { Suspense } from 'react';

import CheckoutPage from '@/features/checkout/CheckoutPage';

export default function Page() {
  return (
    <Suspense>
      <CheckoutPage />
    </Suspense>
  );
}
