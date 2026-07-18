import { Suspense } from 'react';

import MockLoginPage from '@/features/auth/MockLoginPage';

export default function Page() {
  return (
    <Suspense fallback={<main className="mock-login-page">Preparing login...</main>}>
      <MockLoginPage />
    </Suspense>
  );
}
