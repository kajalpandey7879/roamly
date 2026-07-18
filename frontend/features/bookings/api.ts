import { apiRequest } from '@/shared/api/http-client';
import type { Trip } from '@/shared/types/domain';

export interface BookingInput {
  listing_id: number;
  guest_id: number;
  check_in: string;
  check_out: string;
  guests: number;
}

export interface BookingConfirmation {
  id: number;
  booking_uuid: string;
  status: string;
  total: number;
  nights: number;
}

export interface ReviewInput {
  rating: number;
  body: string;
}

export interface ReviewConfirmation {
  id: number;
  booking_id: number;
  listing_id: number;
  listing_rating: number;
  listing_review_count: number;
  host_is_superhost: number;
}

export const bookingsApi = {
  create: (payload: BookingInput) =>
    apiRequest<BookingConfirmation>('/bookings', { method: 'POST', body: JSON.stringify(payload) }),
  getTrips: (userId: number) => apiRequest<Trip[]>(`/trips?user_id=${userId}`),
  createReview: (bookingUuid: string, userId: number, payload: ReviewInput) =>
    apiRequest<ReviewConfirmation>(`/bookings/${bookingUuid}/review?user_id=${userId}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
