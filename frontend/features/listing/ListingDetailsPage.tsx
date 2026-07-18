'use client';

import {
  Award,
  Briefcase,
  CalendarDays,
  Car,
  ChevronLeft,
  Clock3,
  DoorOpen,
  Flame,
  Heart,
  KeyRound,
  MapPin,
  Medal,
  Share2,
  ShieldCheck,
  Star,
  TreePine,
  Tv,
  Utensils,
  Waves,
  Wifi,
  Wind,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { isValid, parseISO } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import toast from 'react-hot-toast';

import ListingCard from '@/features/explore/components/ListingCard';
import AvailabilityCalendar from '@/features/listing/components/AvailabilityCalendar';
import BookingBox from '@/features/listing/components/BookingBox';
import ListingModal from '@/features/listing/components/ListingModal';
import ListingPhotoGallery from '@/features/listing/components/ListingPhotoGallery';
import { listingsApi } from '@/features/listings/api';
import { wishlistApi } from '@/features/wishlist/api';
import type { Listing, Review } from '@/shared/types/domain';

const ListingLocationMap = dynamic(
  () => import('@/features/listing/components/ListingLocationMap'),
  { ssr: false, loading: () => <div className="detail-map-loading">Loading map...</div> },
);

function amenityIcon(name: string) {
  const amenity = name.toLowerCase();
  if (amenity.includes('wifi')) return Wifi;
  if (amenity.includes('kitchen') || amenity.includes('breakfast')) return Utensils;
  if (amenity.includes('parking')) return Car;
  if (amenity.includes('fire')) return Flame;
  if (amenity.includes('pool') || amenity.includes('ocean') || amenity.includes('lake')) return Waves;
  if (amenity.includes('air conditioning')) return Wind;
  if (amenity.includes('tv')) return Tv;
  if (amenity.includes('workspace')) return Briefcase;
  return TreePine;
}

function amenityDescription(name: string) {
  const amenity = name.toLowerCase();
  if (amenity.includes('wifi')) return 'Fast and reliable connection throughout the home.';
  if (amenity.includes('kitchen')) return 'A private kitchen equipped for preparing meals.';
  if (amenity.includes('parking')) return 'Parking is available on the premises at no extra cost.';
  if (amenity.includes('pool')) return 'A private pool available during your stay.';
  if (amenity.includes('workspace')) return 'A dedicated area suitable for remote work.';
  if (amenity.includes('air conditioning')) return 'Climate control is available in the main rooms.';
  if (amenity.includes('tv')) return 'Television available for guest use.';
  return 'Available for guests throughout the stay.';
}

type DetailModal = 'description' | 'amenities' | 'reviews' | null;

function Page() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const [listing, setListing] = useState<Listing | null>(null);
  const [nearby, setNearby] = useState<Listing[]>([]);
  const [detailModal, setDetailModal] = useState<DetailModal>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [stayRange, setStayRange] = useState<DateRange | undefined>(() => {
    const checkIn = searchParams.get('check_in');
    const checkOut = searchParams.get('check_out');
    const from = checkIn ? parseISO(checkIn) : undefined;
    const to = checkOut ? parseISO(checkOut) : undefined;
    return from && isValid(from)
      ? { from, to: to && isValid(to) && to > from ? to : undefined }
      : undefined;
  });

  useEffect(() => {
    let active = true;
    listingsApi.getById(Number(id)).then(async (result) => {
      if (!active) return;
      setListing(result);
      const recommendations = await listingsApi.search(
        `location=${encodeURIComponent(result.country)}&page_size=12`,
      );
      if (active) setNearby(recommendations.items.filter((item) => item.id !== result.id));
    });
    return () => {
      active = false;
    };
  }, [id]);

  if (!listing) return <div className="detail-loading">Loading your stay...</div>;

  async function favorite() {
    const result = await wishlistApi.toggle(listing!.id);
    setListing({ ...listing!, is_favorite: result.is_favorite });
    toast.success(result.is_favorite ? 'Saved to your wishlist' : 'Removed from wishlist');
  }

  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title: listing!.title, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Listing link copied');
      }
    } catch {
      // Closing the native share sheet is not an error that needs user feedback.
    }
  }

  const host = listing.host!;
  const visibleReviews: Review[] = listing.reviews?.length
    ? listing.reviews
    : [
        {
          id: -1,
          user_name: 'Priya',
          avatar: host.avatar,
          rating: 5,
          body: 'A thoughtful home in a beautiful setting. Check-in was smooth, the space matched the photos, and the host was responsive throughout our stay.',
          created_at: 'June 2026',
        },
        {
          id: -2,
          user_name: 'Daniel',
          avatar: 'https://i.pravatar.cc/120?img=12',
          rating: 5,
          body: 'The home was peaceful, spotless, and exactly as pictured. We especially appreciated the clear arrival instructions and local recommendations.',
          created_at: 'May 2026',
        },
        {
          id: -3,
          user_name: 'Meera',
          avatar: 'https://i.pravatar.cc/120?img=32',
          rating: 5,
          body: 'A comfortable base for our trip with plenty of space and everything we needed. We would happily stay here again.',
          created_at: 'April 2026',
        },
        {
          id: -4,
          user_name: 'Alex',
          avatar: 'https://i.pravatar.cc/120?img=68',
          rating: 5,
          body: 'Beautiful surroundings, reliable wifi, and a very welcoming host. The entire reservation and check-in process was easy.',
          created_at: 'March 2026',
        },
      ];

  return (
    <>
      <main className="listing-detail-shell">
      <div className="listing-detail">
        <header className="listing-title-row">
          <div>
            <Link className="detail-back-link" href="/">
              <ChevronLeft size={17} /> Explore homes
            </Link>
            <h1>{listing.title}</h1>
            <p className="detail-meta">
              <Star size={14} fill="currentColor" /> <b>{listing.rating}</b>
              <span>&middot;</span>
              <u>{listing.review_count} reviews</u>
              <span>&middot;</span>
              <MapPin size={14} />
              <u>
                {listing.city}, {listing.country}
              </u>
            </p>
          </div>
          <div className="listing-actions">
            <button onClick={share}>
              <Share2 size={17} /> Share
            </button>
            <button onClick={favorite}>
              <Heart size={17} fill={listing.is_favorite ? 'currentColor' : 'none'} />
              {listing.is_favorite ? 'Saved' : 'Save'}
            </button>
          </div>
        </header>

        <section className="listing-photo-gallery" aria-label="Property photos">
          {listing.images.slice(0, 5).map((image, index) => (
            <button
              key={image}
              className={`listing-gallery-${index}`}
              title={`View all photos, starting with photo ${index + 1}`}
              onClick={() => setGalleryOpen(true)}
            >
              <Image
                src={image}
                alt={`${listing.title} photo ${index + 1}`}
                fill
                sizes={index === 0 ? '55vw' : '24vw'}
              />
            </button>
          ))}
          <button className="show-all-photos" onClick={() => setGalleryOpen(true)}>
            Show all photos
          </button>
        </section>

        <div className="listing-main-layout">
          <article className="listing-content">
            <section className="listing-host-summary">
              <div>
                <h2>
                  {listing.property_type} in {listing.city}, {listing.country}
                </h2>
                <p>
                  {listing.max_guests} guests &middot; {listing.bedrooms} bedrooms &middot;{' '}
                  {listing.beds} beds &middot; {listing.baths} baths
                </p>
              </div>
              <div className="host-avatar-wrap">
                <Image src={host.avatar} alt={host.name} width={58} height={58} />
                {host.is_superhost === 1 && <Award size={17} fill="currentColor" />}
              </div>
            </section>

            <section className="listing-highlights">
              {host.is_superhost === 1 && (
                <div>
                  <Medal />
                  <span>
                    <b>{host.name} is a Superhost</b>
                    <small>Experienced, highly rated host committed to great stays.</small>
                  </span>
                </div>
              )}
              <div>
                <KeyRound />
                <span>
                  <b>Great check-in experience</b>
                  <small>Guests consistently rate the arrival process highly.</small>
                </span>
              </div>
              <div>
                <DoorOpen />
                <span>
                  <b>Designed for living well</b>
                  <small>A comfortable, private space with thoughtful details.</small>
                </span>
              </div>
            </section>

            <section className="translation-notice">
              Some information has been automatically translated. <u>Show original</u>
            </section>

            <section className="listing-description">
              <p>{listing.description}</p>
              <p>
                Settle into a calm, well-equipped home with room to spend time together. Local
                restaurants, neighbourhood favourites, and the area&apos;s main attractions are within
                easy reach.
              </p>
              <button onClick={() => setDetailModal('description')}>Show more</button>
            </section>

            <section className="sleep-section">
              <h2>Where you&apos;ll sleep</h2>
              <div>
                {Array.from({ length: Math.min(Math.max(listing.bedrooms, 1), 2) }).map(
                  (_, index) => (
                    <article key={index}>
                      <button
                        title="View all property photos"
                        onClick={() => setGalleryOpen(true)}
                      >
                        <Image
                          src={listing.images[(index + 1) % listing.images.length]}
                          alt={`Bedroom ${index + 1}`}
                          fill
                          sizes="320px"
                        />
                      </button>
                      <b>Bedroom {index + 1}</b>
                      <span>{index === 0 ? '1 king bed' : '1 queen bed'}</span>
                    </article>
                  ),
                )}
              </div>
            </section>

            <section className="detail-amenities">
              <h2>What this place offers</h2>
              <div>
                {listing.amenities.map((amenity) => {
                  const Icon = amenityIcon(amenity);
                  return (
                    <span key={amenity}>
                      <Icon size={20} /> {amenity}
                    </span>
                  );
                })}
              </div>
              <button onClick={() => setDetailModal('amenities')}>
                Show all {listing.amenities.length} amenities
              </button>
            </section>

            <AvailabilityCalendar
              city={listing.city}
              unavailablePeriods={listing.unavailable_dates}
              range={stayRange}
              onRangeChange={setStayRange}
            />

            <section className="detail-reviews">
              <h2>
                <Star size={19} fill="currentColor" /> {listing.rating} &middot;{' '}
                {listing.review_count} reviews
              </h2>
              <p className="review-summary">Guests consistently rate this home highly for its location and comfort.</p>
              <div>
                {visibleReviews.slice(0, 2).map((review) => (
                  <article key={review.id}>
                    <header>
                      <Image src={review.avatar} alt={review.user_name} width={46} height={46} />
                      <span>
                        <b>{review.user_name}</b>
                        <small>{review.created_at}</small>
                      </span>
                    </header>
                    <p>{review.body}</p>
                  </article>
                ))}
              </div>
              <button onClick={() => setDetailModal('reviews')}>
                Show all {listing.review_count} reviews
              </button>
            </section>

          </article>

          <Suspense>
            <BookingBox listing={listing} range={stayRange} onRangeChange={setStayRange} />
          </Suspense>
        </div>

        <div className="listing-wide-content">
          <section className="detail-location">
            <h2>Where you&apos;ll be</h2>
            <p>
              {listing.city}, {listing.country}
            </p>
            <ListingLocationMap latitude={listing.latitude} longitude={listing.longitude} />
            <p className="exact-location-note">
              <MapPin size={16} /> Exact location provided after booking
            </p>
          </section>

          <section className="meet-host">
            <h2>Meet your host</h2>
            <div className="host-profile-layout">
              <article className="host-profile-card">
                <Image src={host.avatar} alt={host.name} width={92} height={92} />
                <h3>{host.name}</h3>
                <b>{host.is_superhost === 1 ? 'Superhost' : 'Host'}</b>
                <dl>
                  <div>
                    <dt>{listing.review_count}</dt>
                    <dd>Reviews</dd>
                  </div>
                  <div>
                    <dt>{listing.rating}</dt>
                    <dd>Rating</dd>
                  </div>
                  <div>
                    <dt>{new Date().getFullYear() - host.joined_year}</dt>
                    <dd>Years hosting</dd>
                  </div>
                </dl>
              </article>
              <div className="host-profile-copy">
                <h3>About {host.name}</h3>
                <p>
                  {host.name} is committed to providing a comfortable stay, clear communication,
                  and thoughtful local recommendations.
                </p>
                <p>
                  <Clock3 size={16} /> Response rate: 100% &middot; Responds within an hour
                </p>
                <button onClick={() => toast.success('Messaging is coming soon')}>Message host</button>
                <small>
                  <ShieldCheck size={15} /> To protect your payment, always use Roamly to send money
                  and communicate with hosts.
                </small>
              </div>
            </div>
          </section>

          <section className="things-to-know">
            <h2>Things to know</h2>
            <div>
              <article>
                <CalendarDays />
                <h3>House rules</h3>
                <p>Check-in after 3:00 PM</p>
                <p>Checkout before 11:00 AM</p>
                <p>{listing.max_guests} guests maximum</p>
              </article>
              <article>
                <ShieldCheck />
                <h3>Safety and property</h3>
                <p>Smoke alarm installed</p>
                <p>Exterior security cameras</p>
                <p>Report any concerns promptly</p>
              </article>
              <article>
                <Clock3 />
                <h3>Cancellation policy</h3>
                <p>Free cancellation for 48 hours</p>
                <p>Review full policy before booking</p>
              </article>
            </div>
          </section>
        </div>

        {nearby.length > 0 && (
          <section className="nearby-homes">
            <header>
              <h2>More stays nearby</h2>
              <span>{listing.city} and surrounding areas</span>
            </header>
            <div>
              {nearby.slice(0, 6).map((item) => (
                <ListingCard key={item.id} listing={item} />
              ))}
            </div>
          </section>
        )}
        </div>
      </main>

      {galleryOpen && (
        <ListingPhotoGallery
          title={listing.title}
          images={listing.images}
          onClose={() => setGalleryOpen(false)}
        />
      )}

      {detailModal && (
        <ListingModal
          title={
            detailModal === 'description'
              ? 'About this place'
              : detailModal === 'amenities'
                ? 'What this place offers'
                : `Guest reviews for ${listing.title}`
          }
          onClose={() => setDetailModal(null)}
        >
          {detailModal === 'description' && (
            <div className="description-modal-copy">
              <p>{listing.description}</p>
              <h3>The space</h3>
              <p>
                Settle into a calm, well-equipped home with room to spend time together. The
                bedrooms are prepared for a restful stay, while the shared living spaces make it
                easy to relax, cook, or plan the day.
              </p>
              <h3>The neighbourhood</h3>
              <p>
                Local restaurants, neighbourhood favourites, and the area&apos;s main attractions
                are within easy reach. Your host will share arrival details and local suggestions
                before check-in.
              </p>
            </div>
          )}

          {detailModal === 'amenities' && (
            <div className="amenities-modal-list">
              {listing.amenities.map((amenity) => {
                const Icon = amenityIcon(amenity);
                return (
                  <article key={amenity}>
                    <Icon size={23} />
                    <span>
                      <b>{amenity}</b>
                      <small>{amenityDescription(amenity)}</small>
                    </span>
                  </article>
                );
              })}
            </div>
          )}

          {detailModal === 'reviews' && (
            <div className="reviews-modal-list">
              <div className="reviews-modal-score">
                <Star size={21} fill="currentColor" />
                <b>{listing.rating}</b>
                <span>&middot; {listing.review_count} reviews</span>
              </div>
              {visibleReviews.map((review) => (
                <article key={review.id}>
                  <header>
                    <Image src={review.avatar} alt={review.user_name} width={48} height={48} />
                    <span>
                      <b>{review.user_name}</b>
                      <small>{review.created_at}</small>
                    </span>
                  </header>
                  <p>{review.body}</p>
                </article>
              ))}
            </div>
          )}
        </ListingModal>
      )}
    </>
  );
}

export default function ListingDetail() {
  return (
    <Suspense>
      <Page />
    </Suspense>
  );
}
