'use client';
import { listingsApi } from '@/features/listings/api';
import { wishlistApi } from '@/features/wishlist/api';
import { Listing } from '@/shared/types/domain';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import {
  ChevronLeft,
  Heart,
  MapPin,
  Medal,
  Share2,
  Star,
  Users,
  Wifi,
  Utensils,
  Car,
  Flame,
  TreePine,
} from 'lucide-react';
import Link from 'next/link';
import BookingBox from '@/features/listing/components/BookingBox';
import toast from 'react-hot-toast';
const amenityIcon = (name: string) =>
  name.toLowerCase().includes('wifi')
    ? Wifi
    : name.toLowerCase().includes('kitchen')
      ? Utensils
      : name.toLowerCase().includes('parking')
        ? Car
        : name.toLowerCase().includes('fire')
          ? Flame
          : TreePine;
function Page() {
  const { id } = useParams(),
    [x, setX] = useState<Listing | null>(null);
  useEffect(() => {
    listingsApi.getById(Number(id)).then(setX);
  }, [id]);
  if (!x) return <div className="detail-loading">Loading your stay…</div>;
  async function favorite() {
    const r = await wishlistApi.toggle(x!.id);
    setX({ ...x!, is_favorite: r.is_favorite });
    toast.success(r.is_favorite ? 'Saved to your wishlist' : 'Removed from wishlist');
  }
  return (
    <main className="detail">
      <div className="detail-top">
        <Link href="/">
          <ChevronLeft /> Explore
        </Link>
        <div>
          <button>
            <Share2 size={17} /> Share
          </button>
          <button onClick={favorite}>
            <Heart size={17} fill={x.is_favorite ? 'currentColor' : 'none'} />{' '}
            {x.is_favorite ? 'Saved' : 'Save'}
          </button>
        </div>
      </div>
      <h1>{x.title}</h1>
      <p className="detail-meta">
        <Star size={15} fill="currentColor" /> <b>{x.rating}</b> · <u>{x.review_count} reviews</u> ·{' '}
        <MapPin size={15} />{' '}
        <u>
          {x.city}, {x.country}
        </u>
      </p>
      <section className="gallery">
        {x.images.slice(0, 5).map((img, i) => (
          <div key={img} className={'gallery-' + i}>
            <Image
              src={img}
              alt={`${x.title} photo ${i + 1}`}
              fill
              sizes={i === 0 ? '50vw' : '25vw'}
            />
          </div>
        ))}
      </section>
      <div className="detail-columns">
        <article>
          <section className="host-summary">
            <div>
              <h2>
                {x.property_type} hosted by {x.host?.name}
              </h2>
              <p>
                {x.max_guests} guests · {x.bedrooms} bedrooms · {x.beds} beds · {x.baths} baths
              </p>
            </div>
            <Image src={x.host!.avatar} alt={x.host!.name} width={56} height={56} />
          </section>
          {x.host?.is_superhost === 1 && (
            <section className="feature">
              <Medal />
              <div>
                <b>{x.host.name} is a Superhost</b>
                <p>Experienced, highly rated hosts committed to great stays.</p>
              </div>
            </section>
          )}
          <section className="feature">
            <Users />
            <div>
              <b>Room for everyone</b>
              <p>Comfortably accommodates up to {x.max_guests} guests.</p>
            </div>
          </section>
          <p className="description">{x.description}</p>
          <section className="amenities">
            <h2>What this place offers</h2>
            <div>
              {x.amenities.map((a) => {
                const Icon = amenityIcon(a);
                return (
                  <span key={a}>
                    <Icon size={20} />
                    {a}
                  </span>
                );
              })}
            </div>
          </section>
          <section className="availability">
            <h2>Availability</h2>
            <p>Existing reservations are blocked automatically.</p>
            <div className="blocked-dates">
              {x.unavailable_dates?.map((d, i) => (
                <span key={i}>
                  {d.check_in} → {d.check_out}
                </span>
              ))}
            </div>
          </section>
        </article>
        <Suspense>
          <BookingBox listing={x} />
        </Suspense>
      </div>
      <section className="reviews">
        <h2>
          <Star size={20} fill="currentColor" /> {x.rating} · {x.review_count} reviews
        </h2>
        <div>
          {x.reviews?.map((r) => (
            <article key={r.id}>
              <header>
                <Image src={r.avatar} alt={r.user_name} width={44} height={44} />
                <span>
                  <b>{r.user_name}</b>
                  <small>{r.created_at}</small>
                </span>
              </header>
              <p>{r.body}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="location">
        <h2>Where you’ll be</h2>
        <p>
          {x.city}, {x.country}
        </p>
        <div className="static-map">
          <span>
            <MapPin size={28} fill="currentColor" />
          </span>
          <p>Exact location provided after booking</p>
        </div>
      </section>
    </main>
  );
}
export default function ListingDetail() {
  return (
    <Suspense>
      <Page />
    </Suspense>
  );
}
