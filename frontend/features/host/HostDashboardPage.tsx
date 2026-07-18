'use client';

import { CalendarCheck, Edit3, Home, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';

import { useAuth } from '@/features/auth/AuthProvider';
import { hostApi } from '@/features/host/api';
import ListingFormModal from '@/features/host/components/ListingFormModal';
import { emptyListingForm, formToListingInput, listingToForm } from '@/features/host/form-model';
import type { HostBooking, Listing } from '@/shared/types/domain';
import FallbackImage from '@/shared/ui/FallbackImage';

type DashboardTab = 'listings' | 'bookings';

export default function HostDashboardPage() {
  const router = useRouter();
  const { user, isLoggedIn, isHydrating, requestLogin, promoteToHost } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [bookings, setBookings] = useState<HostBooking[]>([]);
  const [activeTab, setActiveTab] = useState<DashboardTab>('listings');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyListingForm);
  const onboardingOpened = useRef(false);

  const loadDashboard = useCallback(async () => {
    if (!user) return;
    const [ownedListings, reservations] = await Promise.all([
      hostApi.getListings(user.id),
      hostApi.getBookings(user.id),
    ]);
    setListings(ownedListings);
    setBookings(reservations);
  }, [user]);

  useEffect(() => {
    if (isHydrating) return;
    if (!isLoggedIn) {
      requestLogin('/host?create=1');
      return;
    }
    loadDashboard().catch((error) => toast.error((error as Error).message));
  }, [isHydrating, isLoggedIn, loadDashboard, requestLogin]);

  useEffect(() => {
    if (!user || onboardingOpened.current) return;
    const shouldCreate = new URLSearchParams(window.location.search).get('create') === '1';
    if (shouldCreate && user.role === 'guest') {
      onboardingOpened.current = true;
      setEditingId(null);
      setForm(emptyListingForm);
      setIsFormOpen(true);
    }
  }, [user]);

  function openForm(listing?: Listing) {
    setEditingId(listing?.id ?? null);
    setForm(listingToForm(listing));
    setIsFormOpen(true);
  }

  async function saveListing(event: FormEvent) {
    event.preventDefault();
    if (!user) return;
    try {
      const payload = formToListingInput(form);
      if (editingId) await hostApi.updateListing(user.id, editingId, payload);
      else {
        await hostApi.createListing(user.id, payload);
        promoteToHost();
      }
      toast.success(editingId ? 'Listing updated' : 'Listing published');
      setIsFormOpen(false);
      router.replace('/host');
      await loadDashboard();
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  async function deleteListing(listingId: number) {
    if (!user) return;
    if (
      !window.confirm('Remove this listing from search? Existing trip records will be preserved.')
    )
      return;
    try {
      await hostApi.deleteListing(user.id, listingId);
      toast.success('Listing removed from search');
      await loadDashboard();
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  const bookedRevenue = bookings.reduce((total, booking) => total + booking.total, 0);
  if (isHydrating) return <main className="page host-auth-loading">Loading your account...</main>;
  if (!user) {
    return (
      <main className="page host-auth-loading">
        <h1>Log in to start hosting</h1>
        <button className="primary compact" onClick={() => requestLogin('/host?create=1')}>
          Log in or sign up
        </button>
      </main>
    );
  }

  const firstName = user.name.split(' ')[0];
  return (
    <main className="page host-page">
      <div className="host-header">
        <div>
          <p>{user.role === 'host' ? 'HOST DASHBOARD' : 'START HOSTING'}</p>
          <h1>
            {user.role === 'host' ? `Welcome back, ${firstName}` : 'Create your first listing'}
          </h1>
          <span>
            {user.role === 'host'
              ? 'Manage your homes and keep an eye on upcoming stays.'
              : `${user.name}, share your space and start welcoming guests.`}
          </span>
        </div>
        <button className="primary compact" onClick={() => openForm()}>
          <Plus size={18} /> {user.role === 'host' ? 'Create listing' : 'Create your first listing'}
        </button>
      </div>
      <div className="stats">
        <div>
          <Home />
          <span>
            <b>{listings.length}</b>Active listings
          </span>
        </div>
        <div>
          <CalendarCheck />
          <span>
            <b>{bookings.length}</b>Total reservations
          </span>
        </div>
        <div>
          <b>${bookedRevenue.toLocaleString()}</b>
          <span>Booked revenue</span>
        </div>
      </div>
      <div className="tabs">
        <button
          className={activeTab === 'listings' ? 'active' : ''}
          onClick={() => setActiveTab('listings')}
        >
          Listings
        </button>
        <button
          className={activeTab === 'bookings' ? 'active' : ''}
          onClick={() => setActiveTab('bookings')}
        >
          Reservations
        </button>
      </div>
      {activeTab === 'listings' ? (
        <ListingTable listings={listings} onEdit={openForm} onDelete={deleteListing} />
      ) : (
        <ReservationTable bookings={bookings} />
      )}
      {isFormOpen && (
        <ListingFormModal
          editing={editingId !== null}
          form={form}
          setForm={setForm}
          onClose={() => setIsFormOpen(false)}
          onSubmit={saveListing}
        />
      )}
    </main>
  );
}

function ListingTable({
  listings,
  onEdit,
  onDelete,
}: {
  listings: Listing[];
  onEdit: (listing: Listing) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <div className="host-list">
      {listings.map((listing) => (
        <article key={listing.id}>
          <FallbackImage src={listing.images[0]} alt={listing.title} width={180} height={120} />
          <div>
            <small>{listing.category}</small>
            <h2>{listing.title}</h2>
            <p>
              {listing.city}, {listing.country} &middot; ${listing.price}/night
            </p>
            <span>{listing.booking_count ?? 0} reservations</span>
          </div>
          <div className="row-actions">
            <button title="Edit listing" onClick={() => onEdit(listing)}>
              <Edit3 />
            </button>
            <button className="danger" title="Delete listing" onClick={() => onDelete(listing.id)}>
              <Trash2 />
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

function ReservationTable({ bookings }: { bookings: HostBooking[] }) {
  return (
    <div className="reservation-table">
      <div>
        <b>Guest</b>
        <b>Listing</b>
        <b>Dates</b>
        <b>Total</b>
        <b>Status</b>
      </div>
      {bookings.map((booking) => (
        <div key={booking.id}>
          <span>
            {booking.guest_name}
            <small>{booking.guests} guests</small>
          </span>
          <span>{booking.title}</span>
          <span>
            {booking.check_in}
            <small>to {booking.check_out}</small>
          </span>
          <b>${booking.total}</b>
          <span className="confirmed">{booking.status}</span>
        </div>
      ))}
    </div>
  );
}
