'use client';

import type { Listing } from '@/shared/types/domain';
import { addDays, differenceInCalendarDays, format } from 'date-fns';
import { Minus, Plus, Star } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';

export default function BookingBox({ listing }: { listing: Listing }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [checkIn, setCheckIn] = useState(searchParams.get('check_in') || '');
  const [checkOut, setCheckOut] = useState(searchParams.get('check_out') || '');
  const [guests, setGuests] = useState(Number(searchParams.get('guests') || 1));
  const nights = useMemo(
    () =>
      checkIn && checkOut
        ? Math.max(
            0,
            differenceInCalendarDays(new Date(`${checkOut}T12:00`), new Date(`${checkIn}T12:00`)),
          )
        : 0,
    [checkIn, checkOut],
  );
  const minimumCheckout = checkIn
    ? format(addDays(new Date(`${checkIn}T12:00`), 1), 'yyyy-MM-dd')
    : format(addDays(new Date(), 1), 'yyyy-MM-dd');
  const subtotal = listing.price * nights;
  const total = subtotal + listing.cleaning_fee + listing.service_fee;

  function reserve() {
    if (!checkIn || !checkOut || nights < 1)
      return toast.error('Choose a stay of at least one night');
    const params = new URLSearchParams({
      listing: String(listing.id),
      check_in: checkIn,
      check_out: checkOut,
      guests: String(guests),
    });
    router.push(`/checkout?${params}`);
  }

  return (
    <aside className="booking-box">
      <div className="booking-price">
        <span>
          <strong>${listing.price}</strong> night
        </span>
        <span>
          <Star size={14} fill="currentColor" /> {listing.rating} &middot;{' '}
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
            onChange={(event) => {
              const value = event.target.value;
              setCheckIn(value);
              if (checkOut && value >= checkOut) setCheckOut('');
            }}
          />
        </label>
        <label>
          CHECKOUT
          <input
            type="date"
            min={minimumCheckout}
            value={checkOut}
            onChange={(event) => setCheckOut(event.target.value)}
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
      <button className="primary" onClick={reserve}>
        Reserve
      </button>
      <p className="no-charge">You won&apos;t be charged yet</p>
      {nights > 0 && (
        <div className="breakdown">
          <p>
            <u>
              ${listing.price} x {nights} nights
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
