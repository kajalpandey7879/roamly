'use client';

import { bookingsApi } from '@/features/bookings/api';
import { useAuth } from '@/features/auth/AuthProvider';
import ReviewModal from '@/features/trips/ReviewModal';
import type { Trip } from '@/shared/types/domain';
import FallbackImage from '@/shared/ui/FallbackImage';
import { CalendarDays, MapPin } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export default function Trips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [reviewing, setReviewing] = useState<Trip | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const { user, isLoggedIn, isHydrating, requestLogin } = useAuth();

  useEffect(() => {
    if (isHydrating) return;
    if (!user) {
      setTrips([]);
      return;
    }
    bookingsApi.getTrips(user.id).then(setTrips);
  }, [isHydrating, user]);

  function startReview(event: React.MouseEvent, trip: Trip) {
    event.preventDefault();
    event.stopPropagation();
    if (!isLoggedIn) {
      requestLogin('/trips');
      return;
    }
    setReviewing(trip);
  }

  async function publishReview(rating: number, body: string) {
    if (!reviewing) return;
    setSubmittingReview(true);
    try {
      if (!user) return;
      const review = await bookingsApi.createReview(reviewing.booking_uuid, user.id, { rating, body });
      setTrips((current) =>
        current.map((trip) =>
          trip.id === reviewing.id ? { ...trip, review_id: review.id } : trip,
        ),
      );
      setReviewing(null);
      toast.success('Your review is now live');
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSubmittingReview(false);
    }
  }

  return (
    <main className="page">
      <div className="page-heading">
        <p>YOUR JOURNEYS</p>
        <h1>Trips</h1>
        <span>Everything you&apos;ve booked, all in one place.</span>
      </div>
      {!trips.length ? (
        <div className="empty">
          <CalendarDays size={36} />
          <h2>No trips booked yet</h2>
          <p>Time to dust off your bags and start planning.</p>
          <Link className="secondary" href="/">
            Start searching
          </Link>
        </div>
      ) : (
        <div className="trip-grid">
          {trips.map((trip) => (
            <article className="trip-card" key={trip.id}>
              <Link className="trip-image-link" href={`/listings/${trip.listing_id}`}>
                <FallbackImage src={trip.image} alt={trip.title} width={520} height={300} />
              </Link>
              <div>
                <span className="confirmed">{trip.status}</span>
                <h2>
                  <Link href={`/listings/${trip.listing_id}`}>{trip.title}</Link>
                </h2>
                <p>
                  <MapPin size={15} />
                  {trip.city}, {trip.country}
                </p>
                <hr />
                <p>
                  <CalendarDays size={15} />
                  {trip.check_in} to {trip.check_out}
                </p>
                <b>
                  {trip.guests} guests &middot; ${trip.total}
                </b>
                {new Date(`${trip.check_out}T12:00:00`) < new Date() && (
                  <button
                    className="trip-review-button"
                    disabled={Boolean(trip.review_id)}
                    onClick={(event) => startReview(event, trip)}
                  >
                    {trip.review_id ? 'Review published' : 'Write a review'}
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
      {reviewing && (
        <ReviewModal
          trip={reviewing}
          submitting={submittingReview}
          onClose={() => setReviewing(null)}
          onSubmit={publishReview}
        />
      )}
    </main>
  );
}
