export interface Host {
  name: string;
  avatar: string;
  joined_year: number;
  is_superhost: number;
}

export interface Review {
  id: number;
  user_name: string;
  avatar: string;
  rating: number;
  body: string;
  created_at: string;
}

export interface UnavailablePeriod {
  check_in: string;
  check_out: string;
}

export interface Listing {
  id: number;
  host_id: number;
  title: string;
  description: string;
  city: string;
  country: string;
  property_type: string;
  category: string;
  price: number;
  cleaning_fee: number;
  service_fee: number;
  max_guests: number;
  bedrooms: number;
  beds: number;
  baths: number;
  rating: number;
  review_count: number;
  amenities: string[];
  images: string[];
  latitude: number;
  longitude: number;
  is_favorite: boolean;
  host?: Host;
  reviews?: Review[];
  unavailable_dates?: UnavailablePeriod[];
  booking_count?: number;
}

export interface Trip {
  id: number;
  listing_id: number;
  check_in: string;
  check_out: string;
  guests: number;
  nights: number;
  total: number;
  status: string;
  title: string;
  city: string;
  country: string;
  image: string;
}

export interface HostBooking {
  id: number;
  listing_id: number;
  guest_id: number;
  title: string;
  guest_name: string;
  check_in: string;
  check_out: string;
  guests: number;
  nights: number;
  total: number;
  status: string;
}

export interface ListingInput {
  title: string;
  description: string;
  city: string;
  country: string;
  property_type: string;
  category: string;
  price: number;
  max_guests: number;
  bedrooms: number;
  beds: number;
  baths: number;
  amenities: string[];
  images: string[];
  latitude: number;
  longitude: number;
}
