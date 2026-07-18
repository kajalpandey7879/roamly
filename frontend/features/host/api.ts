import { apiRequest } from '@/shared/api/http-client';
import type { HostBooking, Listing, ListingInput } from '@/shared/types/domain';

interface UploadSignature {
  configured: boolean;
  cloud_name?: string;
  api_key?: string;
  timestamp?: number;
  folder?: string;
  signature?: string;
}

interface CloudinaryUploadResult {
  secure_url?: string;
  error?: { message?: string };
}

export const hostApi = {
  getListings: (hostId: number) => apiRequest<Listing[]>(`/host/listings?host_id=${hostId}`),
  getBookings: (hostId: number) => apiRequest<HostBooking[]>(`/host/bookings?host_id=${hostId}`),
  createListing: (hostId: number, payload: ListingInput) =>
    apiRequest<{ id: number; role: 'host' }>(`/host/listings?host_id=${hostId}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateListing: (hostId: number, listingId: number, payload: ListingInput) =>
    apiRequest<{ id: number }>(`/host/listings/${listingId}?host_id=${hostId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteListing: (hostId: number, listingId: number) =>
    apiRequest<void>(`/host/listings/${listingId}?host_id=${hostId}`, { method: 'DELETE' }),
  uploadImages: async (files: File[]) => {
    const upload = await apiRequest<UploadSignature>('/uploads/signature');
    if (
      !upload.configured ||
      !upload.cloud_name ||
      !upload.api_key ||
      !upload.timestamp ||
      !upload.folder ||
      !upload.signature
    ) {
      throw new Error('Cloud uploads are not configured. Add Cloudinary credentials or use image URLs.');
    }

    return Promise.all(
      files.map(async (file) => {
        const body = new FormData();
        body.append('file', file);
        body.append('api_key', upload.api_key!);
        body.append('timestamp', String(upload.timestamp));
        body.append('folder', upload.folder!);
        body.append('signature', upload.signature!);
        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${upload.cloud_name}/image/upload`,
          { method: 'POST', body },
        );
        const result = (await response.json()) as CloudinaryUploadResult;
        if (!response.ok || !result.secure_url) {
          throw new Error(result.error?.message ?? 'Image upload failed');
        }
        return result.secure_url;
      }),
    );
  },
};
