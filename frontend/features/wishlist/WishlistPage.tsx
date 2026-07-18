'use client';
import { wishlistApi } from '@/features/wishlist/api';
import { Listing } from '@/shared/types/domain';
import ListingGrid from '@/features/explore/components/ListingGrid';
import { useEffect, useState } from 'react';
export default function Wishlists() {
  const [items, setItems] = useState<Listing[]>([]);
  useEffect(() => {
    wishlistApi.list().then(setItems);
  }, []);
  return (
    <main className="page">
      <div className="page-heading">
        <p>SAVED FOR LATER</p>
        <h1>Wishlists</h1>
        <span>Your collection of places worth remembering.</span>
      </div>
      <ListingGrid items={items} />
    </main>
  );
}
