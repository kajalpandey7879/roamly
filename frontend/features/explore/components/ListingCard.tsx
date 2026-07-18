'use client';
import Link from 'next/link';
import { Heart, Star } from 'lucide-react';
import { Listing } from '@/shared/types/domain';
import { wishlistApi } from '@/features/wishlist/api';
import { useState } from 'react';
import toast from 'react-hot-toast';
import FallbackImage from '@/shared/ui/FallbackImage';
export default function ListingCard({ listing }: { listing: Listing }) {
  const [fav, setFav] = useState(listing.is_favorite);
  const [imageLoaded, setImageLoaded] = useState(false);
  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    try {
      const r = await wishlistApi.toggle(listing.id);
      setFav(r.is_favorite);
      toast.success(r.is_favorite ? 'Saved to your wishlist' : 'Removed from wishlist');
    } catch (e) {
      toast.error((e as Error).message);
    }
  }
  return (
    <Link
      className="listing-card"
      href={'/listings/' + listing.id}
      target="_blank"
      rel="noopener noreferrer"
    >
      <div className={`card-photo${imageLoaded ? ' image-loaded' : ''}`}>
        <FallbackImage
          src={listing.images[0]}
          alt={listing.title}
          fill
          sizes="(max-width: 760px) 100vw, 25vw"
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageLoaded(true)}
        />
        <button
          onClick={toggle}
          className={'heart ' + (fav ? 'active' : '')}
          title={fav ? 'Remove from wishlist' : 'Save to wishlist'}
        >
          <Heart size={22} fill={fav ? 'currentColor' : 'rgba(0,0,0,.35)'} />
        </button>
        <span className="category-tag">
          {listing.host_is_superhost ? 'Superhost' : listing.category}
        </span>
      </div>
      <div className="card-head">
        <strong>
          {listing.city}, {listing.country}
        </strong>
        <span>
          <Star size={14} fill="currentColor" /> {listing.rating}
        </span>
      </div>
      <p>{listing.title}</p>
      <p>Up to {listing.max_guests} guests</p>
      <div className="price">
        <strong>${listing.price}</strong> night
      </div>
    </Link>
  );
}
