import { apiRequest } from '@/shared/api/http-client';
import type { HostBooking, Listing, ListingInput } from '@/shared/types/domain';

export const hostApi = {
  getListings: () => apiRequest<Listing[]>('/host/listings'),
  getBookings: () => apiRequest<HostBooking[]>('/host/bookings'),
  createListing: (payload: ListingInput) =>
    apiRequest<{ id: number }>('/host/listings', { method: 'POST', body: JSON.stringify(payload) }),
  updateListing: (listingId: number, payload: ListingInput) =>
    apiRequest<{ id: number }>(`/host/listings/${listingId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteListing: (listingId: number) =>
    apiRequest<void>(`/host/listings/${listingId}`, { method: 'DELETE' }),
};
