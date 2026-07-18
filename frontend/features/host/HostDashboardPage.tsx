'use client';

import { CalendarCheck, Edit3, Home, Plus, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { hostApi } from '@/features/host/api';
import ListingFormModal from '@/features/host/components/ListingFormModal';
import { emptyListingForm, formToListingInput, listingToForm } from '@/features/host/form-model';
import type { HostBooking, Listing } from '@/shared/types/domain';

type DashboardTab = 'listings' | 'bookings';

export default function HostDashboardPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [bookings, setBookings] = useState<HostBooking[]>([]);
  const [activeTab, setActiveTab] = useState<DashboardTab>('listings');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyListingForm);

  const loadDashboard = useCallback(async () => {
    const [ownedListings, reservations] = await Promise.all([
      hostApi.getListings(),
      hostApi.getBookings(),
    ]);
    setListings(ownedListings);
    setBookings(reservations);
  }, []);

  useEffect(() => {
    loadDashboard().catch((error) => toast.error((error as Error).message));
  }, [loadDashboard]);

  function openForm(listing?: Listing) {
    setEditingId(listing?.id ?? null);
    setForm(listingToForm(listing));
    setIsFormOpen(true);
  }

  async function saveListing(event: FormEvent) {
    event.preventDefault();
    try {
      const payload = formToListingInput(form);
      if (editingId) await hostApi.updateListing(editingId, payload);
      else await hostApi.createListing(payload);
      toast.success(editingId ? 'Listing updated' : 'Listing published');
      setIsFormOpen(false);
      await loadDashboard();
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  async function deleteListing(listingId: number) {
    if (!window.confirm('Delete this listing and its bookings?')) return;
    try {
      await hostApi.deleteListing(listingId);
      toast.success('Listing deleted');
      await loadDashboard();
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  const bookedRevenue = bookings.reduce((total, booking) => total + booking.total, 0);
  return (
    <main className="page host-page">
      <div className="host-header">
        <div>
          <p>HOST DASHBOARD</p>
          <h1>Welcome back, Maya</h1>
          <span>Manage your homes and keep an eye on upcoming stays.</span>
        </div>
        <button className="primary compact" onClick={() => openForm()}>
          <Plus size={18} /> Create listing
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
          <Image src={listing.images[0]} alt={listing.title} width={180} height={120} />
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
