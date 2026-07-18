'use client';
import { Listing } from '@/shared/types/domain';
import { bookingsApi } from '@/features/bookings/api';
import { differenceInCalendarDays, format } from 'date-fns';
import { useSearchParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Minus, Plus, Star } from 'lucide-react';
export default function BookingBox({ listing }: { listing: Listing }) {
  const q = useSearchParams(),
    router = useRouter();
  const [checkIn, setCheckIn] = useState(q.get('checkin') || ''),
    [checkOut, setCheckOut] = useState(q.get('checkout') || ''),
    [guests, setGuests] = useState(Number(q.get('guests') || 1)),
    [loading, setLoading] = useState(false);
  const nights = useMemo(
    () =>
      checkIn && checkOut
        ? Math.max(
            0,
            differenceInCalendarDays(new Date(checkOut + 'T12:00'), new Date(checkIn + 'T12:00')),
          )
        : 0,
    [checkIn, checkOut],
  );
  const subtotal = listing.price * nights,
    total = subtotal + listing.cleaning_fee + listing.service_fee;
  async function reserve() {
    if (!checkIn || !checkOut || !nights)
      return toast.error('Choose valid check-in and check-out dates');
    setLoading(true);
    try {
      const b = await bookingsApi.create({
        listing_id: listing.id,
        check_in: checkIn,
        check_out: checkOut,
        guests,
      });
      toast.success('Your stay is confirmed');
      router.push('/confirmation?booking=' + b.id + '&listing=' + listing.id + '&total=' + b.total);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  return (
    <aside className="booking-box">
      <div className="booking-price">
        <span>
          <strong>${listing.price}</strong> night
        </span>
        <span>
          <Star size={14} fill="currentColor" /> {listing.rating} ·{' '}
          <u>{listing.review_count} reviews</u>
        </span>
      </div>
      <div className="date-grid">
        <label>
          CHECK-IN
          <input
            type="date"
            min={format(new Date(), 'yyyy-MM-dd')}
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
          />
        </label>
        <label>
          CHECKOUT
          <input
            type="date"
            min={checkIn || format(new Date(), 'yyyy-MM-dd')}
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
          />
        </label>
        <div className="guest-select">
          <span>
            <b>GUESTS</b>
            <small>
              {guests} guest{guests !== 1 ? 's' : ''}
            </small>
          </span>
          <div>
            <button title="Remove guest" onClick={() => setGuests(Math.max(1, guests - 1))}>
              <Minus size={15} />
            </button>
            <button
              title="Add guest"
              onClick={() => setGuests(Math.min(listing.max_guests, guests + 1))}
            >
              <Plus size={15} />
            </button>
          </div>
        </div>
      </div>
      <button className="primary" onClick={reserve} disabled={loading}>
        {loading ? 'Confirming…' : 'Reserve'}
      </button>
      <p className="no-charge">You won’t be charged yet</p>
      {nights > 0 && (
        <div className="breakdown">
          <p>
            <u>
              ${listing.price} × {nights} nights
            </u>
            <span>${subtotal}</span>
          </p>
          <p>
            <u>Cleaning fee</u>
            <span>${listing.cleaning_fee}</span>
          </p>
          <p>
            <u>Roamly service fee</u>
            <span>${listing.service_fee}</span>
          </p>
          <div>
            <b>Total before taxes</b>
            <b>${total}</b>
          </div>
        </div>
      )}
    </aside>
  );
}
