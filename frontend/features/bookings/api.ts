import { apiRequest } from '@/shared/api/http-client';
import type { Trip } from '@/shared/types/domain';

export interface BookingInput {
  listing_id: number;
  check_in: string;
  check_out: string;
  guests: number;
}

export interface BookingConfirmation {
  id: number;
  status: string;
  total: number;
  nights: number;
}

export const bookingsApi = {
  create: (payload: BookingInput) =>
    apiRequest<BookingConfirmation>('/bookings', { method: 'POST', body: JSON.stringify(payload) }),
  getTrips: () => apiRequest<Trip[]>('/trips'),
};
