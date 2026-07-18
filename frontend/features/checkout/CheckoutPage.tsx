'use client';

import { bookingsApi } from '@/features/bookings/api';
import { listingsApi } from '@/features/listings/api';
import type { Listing } from '@/shared/types/domain';
import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns';
import { Check, ChevronLeft, CreditCard, LockKeyhole, Star } from 'lucide-react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

type EditingField = 'dates' | 'guests' | null;

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const listingId = Number(searchParams.get('listing'));
  const [listing, setListing] = useState<Listing | null>(null);
  const [checkIn, setCheckIn] = useState(searchParams.get('check_in') ?? '');
  const [checkOut, setCheckOut] = useState(searchParams.get('check_out') ?? '');
  const [guests, setGuests] = useState(Number(searchParams.get('guests') ?? 1));
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [accepted, setAccepted] = useState(false);
  const [editing, setEditing] = useState<EditingField>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!listingId) {
      setLoadError(true);
      return;
    }

    listingsApi
      .getById(listingId)
      .then(setListing)
      .catch(() => setLoadError(true));
  }, [listingId]);

  const nights = useMemo(
    () =>
      checkIn && checkOut
        ? Math.max(0, differenceInCalendarDays(parseISO(checkOut), parseISO(checkIn)))
        : 0,
    [checkIn, checkOut],
  );

  const hasValidStay =
    Boolean(checkIn && checkOut) && Number.isFinite(nights) && nights >= 1;

  if (loadError || (!listing && !listingId)) {
    return (
      <main className="checkout-loading">
        <section>
          <h1>Reservation unavailable</h1>
          <p>Return to a listing and choose your dates before reserving.</p>
          <button onClick={() => router.push('/')}>Explore homes</button>
        </section>
      </main>
    );
  }

  if (!listing) {
    return <main className="checkout-loading">Preparing your reservation...</main>;
  }

  if (!hasValidStay) {
    return (
      <main className="checkout-loading">
        <section>
          <h1>Choose valid dates</h1>
          <p>A reservation must be for at least one night.</p>
          <button onClick={() => router.push(`/listings/${listing.id}`)}>
            Return to listing
          </button>
        </section>
      </main>
    );
  }

  const subtotal = listing.price * nights;
  const total = subtotal + listing.cleaning_fee + listing.service_fee;
  const minimumCheckout = checkIn
    ? format(addDays(parseISO(checkIn), 1), 'yyyy-MM-dd')
    : format(addDays(new Date(), 1), 'yyyy-MM-dd');

  async function confirmBooking() {
    if (!accepted) return toast.error('Accept the reservation terms to continue');
    if (!checkIn || !checkOut || nights < 1)
      return toast.error('Choose a stay of at least one night');
    setSubmitting(true);
    try {
      const booking = await bookingsApi.create({
        listing_id: listing!.id,
        check_in: checkIn,
        check_out: checkOut,
        guests,
      });
      toast.success('Your reservation is confirmed');
      router.push(
        `/confirmation?booking=${booking.id}&listing=${listing!.id}&total=${booking.total}`,
      );
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="checkout-page">
      <div className="checkout-container">
        <header className="checkout-title">
          <button title="Back to listing" onClick={() => router.back()}>
            <ChevronLeft size={23} />
          </button>
          <h1>Confirm and pay</h1>
        </header>

        <div className="checkout-layout">
          <section className="checkout-steps">
            <CheckoutStep number={1} title="Log in or sign up" open={step === 1} complete={step > 1} onEdit={() => setStep(1)}>
              <div className="checkout-login-row">
                <span>
                  <b>Continue as Alex Morgan</b>
                  <small>Your reservation will be saved to My Trips.</small>
                </span>
                <button onClick={() => setStep(2)}>Continue</button>
              </div>
            </CheckoutStep>

            <CheckoutStep number={2} title="Add a payment method" open={step === 2} complete={step > 2} onEdit={() => setStep(2)}>
              <div className="payment-options">
                <PaymentOption
                  value="card"
                  selected={paymentMethod}
                  onChange={setPaymentMethod}
                  icon={<CreditCard size={20} />}
                  title="Visa ending in 4242"
                  description="Mock payment method"
                />
                <PaymentOption
                  value="later"
                  selected={paymentMethod}
                  onChange={setPaymentMethod}
                  icon={<LockKeyhole size={20} />}
                  title="Pay later"
                  description="No real payment will be processed."
                />
                <button className="checkout-continue" onClick={() => setStep(3)}>
                  Continue
                </button>
              </div>
            </CheckoutStep>

            <CheckoutStep number={3} title="Review your reservation" open={step === 3} complete={false} onEdit={() => setStep(3)}>
              <div className="reservation-review">
                <p>Confirm your dates, guest count, cancellation policy, and total before completing this mocked checkout.</p>
                <label>
                  <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} />
                  I agree to the house rules and cancellation policy.
                </label>
                <button onClick={confirmBooking} disabled={submitting}>
                  {submitting ? 'Confirming...' : 'Confirm and pay'}
                </button>
              </div>
            </CheckoutStep>
          </section>

          <aside className="reservation-summary-card">
            <div className="reservation-home">
              <Image src={listing.images[0]} alt={listing.title} width={126} height={116} />
              <div>
                <h2>{listing.title}</h2>
                <p><Star size={14} fill="currentColor" /> {listing.rating} &middot; {listing.review_count} reviews</p>
              </div>
            </div>

            <section className="cancellation-summary">
              <b>Free cancellation</b>
              <p>Cancel within 24 hours for a full refund. <u>Full policy</u></p>
            </section>

            <section className="reservation-summary-row">
              <div>
                <b>Dates</b>
                {editing === 'dates' ? (
                  <div className="checkout-date-edit">
                    <input
                      type="date"
                      value={checkIn}
                      min={format(new Date(), 'yyyy-MM-dd')}
                      onChange={(event) => {
                        setCheckIn(event.target.value);
                        if (checkOut && event.target.value >= checkOut) setCheckOut('');
                      }}
                    />
                    <input type="date" value={checkOut} min={minimumCheckout} onChange={(event) => setCheckOut(event.target.value)} />
                  </div>
                ) : (
                  <p>{format(parseISO(checkIn), 'd MMM')} - {format(parseISO(checkOut), 'd MMM yyyy')}</p>
                )}
              </div>
              <button onClick={() => setEditing(editing === 'dates' ? null : 'dates')}>
                {editing === 'dates' ? 'Done' : 'Change'}
              </button>
            </section>

            <section className="reservation-summary-row">
              <div>
                <b>Guests</b>
                {editing === 'guests' ? (
                  <select value={guests} onChange={(event) => setGuests(Number(event.target.value))}>
                    {Array.from({ length: listing.max_guests }, (_, index) => index + 1).map((count) => (
                      <option key={count} value={count}>{count} guest{count === 1 ? '' : 's'}</option>
                    ))}
                  </select>
                ) : (
                  <p>{guests} guest{guests === 1 ? '' : 's'}</p>
                )}
              </div>
              <button onClick={() => setEditing(editing === 'guests' ? null : 'guests')}>
                {editing === 'guests' ? 'Done' : 'Change'}
              </button>
            </section>

            <section className="checkout-price-details">
              <h3>Price details</h3>
              <PriceRow label={`${nights} nights x $${listing.price}`} amount={subtotal} />
              {showBreakdown && (
                <>
                  <PriceRow label="Cleaning fee" amount={listing.cleaning_fee} />
                  <PriceRow label="Roamly service fee" amount={listing.service_fee} />
                </>
              )}
            </section>

            <section className="checkout-total">
              <p><b>Total USD</b><strong>${total}</strong></p>
              <button onClick={() => setShowBreakdown((shown) => !shown)}>
                {showBreakdown ? 'Hide price breakdown' : 'Price breakdown'}
              </button>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

function CheckoutStep({ number, title, open, complete, onEdit, children }: { number: number; title: string; open: boolean; complete: boolean; onEdit: () => void; children: React.ReactNode }) {
  return (
    <article className={`checkout-step${open ? ' open' : ''}`}>
      <header>
        <h2>{complete ? <Check size={20} /> : `${number}.`} {title}</h2>
        {complete && <button onClick={onEdit}>Edit</button>}
      </header>
      {open && <div className="checkout-step-content">{children}</div>}
    </article>
  );
}

function PaymentOption({ value, selected, onChange, icon, title, description }: { value: string; selected: string; onChange: (value: string) => void; icon: React.ReactNode; title: string; description: string }) {
  return (
    <label className={selected === value ? 'selected' : ''}>
      <input type="radio" name="payment" value={value} checked={selected === value} onChange={(event) => onChange(event.target.value)} />
      {icon}
      <span><b>{title}</b><small>{description}</small></span>
    </label>
  );
}

function PriceRow({ label, amount }: { label: string; amount: number }) {
  return <p><span>{label}</span><b>${amount}</b></p>;
}
