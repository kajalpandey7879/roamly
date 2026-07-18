'use client';
import { bookingsApi } from '@/features/bookings/api';
import { Trip } from '@/shared/types/domain';
import { CalendarDays, MapPin } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
export default function Trips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  useEffect(() => {
    bookingsApi.getTrips().then(setTrips);
  }, []);
  return (
    <main className="page">
      <div className="page-heading">
        <p>YOUR JOURNEYS</p>
        <h1>Trips</h1>
        <span>Everything you’ve booked, all in one place.</span>
      </div>
      {!trips.length ? (
        <div className="empty">
          <CalendarDays size={36} />
          <h2>No trips booked… yet</h2>
          <p>Time to dust off your bags and start planning.</p>
          <Link className="secondary" href="/">
            Start searching
          </Link>
        </div>
      ) : (
        <div className="trip-grid">
          {trips.map((t) => (
            <Link href={'/listings/' + t.listing_id} className="trip-card" key={t.id}>
              <Image src={t.image} alt={t.title} width={520} height={300} />
              <div>
                <span className="confirmed">{t.status}</span>
                <h2>{t.title}</h2>
                <p>
                  <MapPin size={15} />
                  {t.city}, {t.country}
                </p>
                <hr />
                <p>
                  <CalendarDays size={15} />
                  {t.check_in} → {t.check_out}
                </p>
                <b>
                  {t.guests} guests · ${t.total}
                </b>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
