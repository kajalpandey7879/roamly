'use client';

import type { Listing } from '@/shared/types/domain';
import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns';
import { Flag, Minus, Plus, Star } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import type { DateRange } from 'react-day-picker';
import toast from 'react-hot-toast';

export default function BookingBox({
  listing,
  range,
  onRangeChange,
}: {
  listing: Listing;
  range?: DateRange;
  onRangeChange: (range: DateRange | undefined) => void;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [guests, setGuests] = useState(Number(searchParams.get('guests') || 1));
  const checkIn = range?.from ? format(range.from, 'yyyy-MM-dd') : '';
  const checkOut = range?.to ? format(range.to, 'yyyy-MM-dd') : '';
  const nights =
    range?.from && range.to ? Math.max(0, differenceInCalendarDays(range.to, range.from)) : 0;
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
    <div className="booking-card-column">
      <aside className="booking-box">
        <div className="booking-price">
          <span>
            <strong>${nights ? total : listing.price}</strong>{' '}
            {nights ? `for ${nights} night${nights === 1 ? '' : 's'}` : 'night'}
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
                onRangeChange({
                  from: value ? parseISO(value) : undefined,
                  to: checkOut && value < checkOut ? range?.to : undefined,
                });
              }}
            />
          </label>
          <label>
            CHECKOUT
            <input
              type="date"
              min={minimumCheckout}
              value={checkOut}
              onChange={(event) =>
                onRangeChange({
                  from: range?.from,
                  to: event.target.value ? parseISO(event.target.value) : undefined,
                })
              }
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
      <button className="booking-report" onClick={() => toast.success('Listing report opened')}>
        <Flag size={14} /> Report this listing
      </button>
      <div className="mobile-booking-dock">
        <span>
          <b>${listing.price}</b> night
          <small>
            {nights
              ? `${format(range!.from!, 'MMM d')} - ${format(range!.to!, 'MMM d')}`
              : 'Add dates for prices'}
          </small>
        </span>
        <button onClick={reserve}>Reserve</button>
      </div>
    </div>
  );
}
