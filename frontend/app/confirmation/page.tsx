'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Check, CalendarDays } from 'lucide-react';
function Confirmation() {
  const q = useSearchParams();
  return (
    <main className="confirmation">
      <div className="success-mark">
        <Check />
      </div>
      <p>BOOKING CONFIRMED</p>
      <h1>Your stay is all set.</h1>
      <span>
        We’ve saved this reservation to your trips. Your host will receive the details shortly.
      </span>
      <div className="confirmation-ref">
        <CalendarDays />
        <div>
          <small>CONFIRMATION</small>
          <b>RML-{String(q.get('booking') || '').padStart(6, '0')}</b>
        </div>
        <div>
          <small>TOTAL</small>
          <b>${q.get('total')}</b>
        </div>
      </div>
      <div>
        <Link className="primary-link" href="/trips">
          View my trips
        </Link>
        <Link className="secondary" href="/">
          Keep exploring
        </Link>
      </div>
    </main>
  );
}
export default function Page() {
  return (
    <Suspense>
      <Confirmation />
    </Suspense>
  );
}
