'use client';

import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useRef } from 'react';

import ListingCard from '@/features/explore/components/ListingCard';
import type { Listing } from '@/shared/types/domain';

interface ListingCarouselProps {
  title: string;
  slug: string;
  listings: Listing[];
}

export default function ListingCarousel({ title, slug, listings }: ListingCarouselProps) {
  const railRef = useRef<HTMLDivElement>(null);
  function scroll(direction: -1 | 1) {
    railRef.current?.scrollBy({
      left: direction * railRef.current.clientWidth * 0.82,
      behavior: 'smooth',
    });
  }

  return (
    <section className="collection-section">
      <header>
        <Link href={`/collections/${slug}`}>
          <h2>{title}</h2>
          <span>
            <ArrowRight size={18} />
          </span>
        </Link>
        <div className="carousel-controls">
          <button title="Scroll left" onClick={() => scroll(-1)}>
            <ChevronLeft size={18} />
          </button>
          <button title="Scroll right" onClick={() => scroll(1)}>
            <ChevronRight size={18} />
          </button>
        </div>
      </header>
      <div className="listing-carousel" ref={railRef}>
        {listings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </section>
  );
}
