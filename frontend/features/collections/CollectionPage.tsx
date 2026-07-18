'use client';

import {
  ChevronLeft,
  List,
  Map,
  Maximize2,
  Minimize2,
  SlidersHorizontal,
  Tag,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import FilterModal from '@/features/explore/components/FilterModal';
import ListingCard from '@/features/explore/components/ListingCard';
import { getCollection } from '@/features/explore/collections';
import { listingsApi } from '@/features/listings/api';
import type { Listing } from '@/shared/types/domain';

const ListingMap = dynamic(() => import('./ListingMap'), {
  ssr: false,
  loading: () => <div className="collection-map-loading">Loading map...</div>,
});

const QUICK_FILTERS = [
  ['Allows pets', 'amenities', 'Pets allowed'],
  ['Free parking', 'amenities', 'Free parking'],
  ['1+ bathrooms', 'min_baths', '1'],
  ['Wifi', 'amenities', 'Wifi'],
  ['Air conditioning', 'amenities', 'Air conditioning'],
  ['TV', 'amenities', 'TV'],
  ['Self check-in', 'amenities', 'Self check-in'],
  ['Hot tub', 'amenities', 'Hot tub'],
  ['Kitchen', 'amenities', 'Kitchen'],
] as const;

export default function CollectionPage() {
  const { slug } = useParams<{ slug: string }>();
  const collection = getCollection(slug);
  const [listings, setListings] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(collection?.query ?? '');
  const [mapExpanded, setMapExpanded] = useState(false);
  const [imagesRefreshing, setImagesRefreshing] = useState(false);
  const [imageVersion, setImageVersion] = useState(0);
  const imageRefreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSearchQuery(collection?.query ?? '');
  }, [collection]);

  useEffect(() => {
    if (!collection) return;
    setLoading(true);
    listingsApi
      .search(searchQuery)
      .then((result) => {
        setListings(result.items);
        setTotal(result.total);
      })
      .finally(() => setLoading(false));
  }, [collection, searchQuery]);

  useEffect(
    () => () => {
      if (imageRefreshTimer.current) clearTimeout(imageRefreshTimer.current);
    },
    [],
  );

  const beginImageRefresh = useCallback(() => {
    setImagesRefreshing(true);
    if (imageRefreshTimer.current) clearTimeout(imageRefreshTimer.current);
  }, []);

  const finishImageRefresh = useCallback(() => {
    if (imageRefreshTimer.current) clearTimeout(imageRefreshTimer.current);
    imageRefreshTimer.current = setTimeout(() => {
      setImageVersion((version) => version + 1);
      setImagesRefreshing(false);
    }, 700);
  }, []);

  const handleMapResize = useCallback(() => {
    beginImageRefresh();
    finishImageRefresh();
  }, [beginImageRefresh, finishImageRefresh]);

  function toggleQuickFilter(key: string, value: string) {
    const params = new URLSearchParams(searchQuery);
    if (key === 'amenities') {
      const amenities = params.get('amenities')?.split(',').filter(Boolean) ?? [];
      const nextAmenities = amenities.includes(value)
        ? amenities.filter((amenity) => amenity !== value)
        : [...amenities, value];
      nextAmenities.length
        ? params.set('amenities', nextAmenities.join(','))
        : params.delete('amenities');
    } else {
      params.get(key) === value ? params.delete(key) : params.set(key, value);
    }
    params.delete('page');
    setSearchQuery(params.toString());
  }

  function isQuickFilterActive(key: string, value: string) {
    const params = new URLSearchParams(searchQuery);
    return key === 'amenities'
      ? Boolean(params.get('amenities')?.split(',').includes(value))
      : params.get(key) === value;
  }

  if (!collection)
    return (
      <main className="page empty">
        <h1>Collection not found</h1>
        <Link href="/">Return home</Link>
      </main>
    );

  return (
    <main
      className={`collection-page mobile-${mobileView}${mapExpanded ? ' map-expanded' : ''}`}
    >
      <nav className="collection-quick-filters" aria-label="Quick filters">
        <button className="all-filters-button" onClick={() => setFiltersOpen(true)}>
          <SlidersHorizontal size={16} /> Filters
        </button>
        {QUICK_FILTERS.map(([label, key, value]) => (
          <button
            key={label}
            className={isQuickFilterActive(key, value) ? 'active' : ''}
            onClick={() => toggleQuickFilter(key, value)}
          >
            {label}
          </button>
        ))}
      </nav>

      <header className="collection-results-header">
        <Link className="back-link" href="/">
          <ChevronLeft size={18} />
          Home
        </Link>
        <div>
          <span>{loading ? 'Finding homes...' : `${total} homes within this area`}</span>
          <h1>{collection.title}</h1>
        </div>
        <p className="fees-note">
          <Tag size={17} fill="currentColor" /> Prices include all fees
        </p>
      </header>

      <div className="collection-split-view">
        <section className="collection-results" aria-label="Search results">
          {loading ? (
            <div className="collection-results-grid collection-results-skeleton">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} />
              ))}
            </div>
          ) : listings.length ? (
            <div
              className={`collection-results-grid${imagesRefreshing ? ' images-refreshing' : ''}`}
            >
              {listings.map((listing) => (
                <div
                  className={selectedId === listing.id ? 'map-result-card selected' : 'map-result-card'}
                  key={listing.id}
                  onMouseEnter={() => setSelectedId(listing.id)}
                  onMouseLeave={() => setSelectedId(null)}
                >
                  <ListingCard key={`${listing.id}-${imageVersion}`} listing={listing} />
                  <p className="result-room-summary">
                    {listing.bedrooms} bedroom{listing.bedrooms === 1 ? '' : 's'} &middot;{' '}
                    {listing.beds} bed{listing.beds === 1 ? '' : 's'} &middot; {listing.baths}{' '}
                    bath{listing.baths === 1 ? '' : 's'}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty">
              <h2>No stays found</h2>
              <p>Try another collection or change your filters.</p>
            </div>
          )}
        </section>

        <aside className="collection-map" aria-label="Map of stays">
          <button
            className="map-expand-button"
            title={mapExpanded ? 'Restore map size' : 'Expand map'}
            onClick={() => {
              beginImageRefresh();
              setMapExpanded((expanded) => !expanded);
              finishImageRefresh();
            }}
          >
            {mapExpanded ? <Minimize2 size={19} /> : <Maximize2 size={19} />}
          </button>
          <ListingMap
            listings={listings}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onResize={handleMapResize}
            onInteractionStart={beginImageRefresh}
            onInteractionEnd={finishImageRefresh}
          />
        </aside>
      </div>

      {filtersOpen && (
        <FilterModal
          key={searchQuery}
          query={searchQuery}
          onClose={() => setFiltersOpen(false)}
          onApply={(params) => {
            setSearchQuery(params.toString());
            setFiltersOpen(false);
          }}
        />
      )}

      <button
        className="collection-view-toggle"
        onClick={() => {
          beginImageRefresh();
          setMobileView(mobileView === 'list' ? 'map' : 'list');
          finishImageRefresh();
        }}
      >
        {mobileView === 'list' ? <Map size={17} /> : <List size={17} />}
        {mobileView === 'list' ? 'Show map' : 'Show list'}
      </button>
    </main>
  );
}
