import { apiRequest } from '@/shared/api/http-client';
import type { Listing } from '@/shared/types/domain';

export interface ListingPage {
  items: Listing[];
  total: number;
  page: number;
  pages: number;
}

export const listingsApi = {
  search: (query = '') => apiRequest<ListingPage>(`/listings?${query}`),
  getById: (listingId: number) => apiRequest<Listing>(`/listings/${listingId}`),
};
