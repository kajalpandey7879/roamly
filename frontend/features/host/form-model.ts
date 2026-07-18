import type { Listing, ListingInput } from '@/shared/types/domain';

export type ListingFormState = Omit<ListingInput, 'amenities' | 'images'> & {
  amenities: string;
  images: string;
};

export const emptyListingForm: ListingFormState = {
  title: '',
  description: '',
  city: '',
  country: '',
  property_type: 'Entire home',
  category: 'Design',
  price: 150,
  max_guests: 2,
  bedrooms: 1,
  beds: 1,
  baths: 1,
  amenities: 'Wifi, Kitchen, Free parking',
  images:
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=85',
  latitude: 0,
  longitude: 0,
};

export function listingToForm(listing?: Listing): ListingFormState {
  if (!listing) return emptyListingForm;
  return {
    ...emptyListingForm,
    ...listing,
    amenities: listing.amenities.join(', '),
    images: listing.images.join(', '),
  };
}

export function formToListingInput(form: ListingFormState): ListingInput {
  return {
    ...form,
    amenities: form.amenities
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
    images: form.images
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
  };
}
