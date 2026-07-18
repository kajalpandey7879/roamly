import { apiRequest } from '@/shared/api/http-client';
import type { Listing } from '@/shared/types/domain';

export const wishlistApi = {
  list: () => apiRequest<Listing[]>('/favorites'),
  toggle: (listingId: number) =>
    apiRequest<{ is_favorite: boolean }>(`/favorites/${listingId}`, { method: 'PUT' }),
};
