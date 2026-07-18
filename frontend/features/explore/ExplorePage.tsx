'use client';
import SearchBar from '@/features/explore/components/SearchBar';
import ListingGrid from '@/features/explore/components/ListingGrid';
import FilterModal from '@/features/explore/components/FilterModal';
import ListingCarousel from '@/features/explore/components/ListingCarousel';
import { HOME_COLLECTIONS } from '@/features/explore/collections';
import { listingsApi } from '@/features/listings/api';
import { Listing } from '@/shared/types/domain';
import {
  SlidersHorizontal,
  Mountain,
  Palmtree,
  Building2,
  Trees,
  Landmark,
  House,
} from 'lucide-react';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
const cats = [
  ['', House, 'All stays'],
  ['Amazing views', Mountain, 'Amazing views'],
  ['Beachfront', Palmtree, 'Beachfront'],
  ['Iconic cities', Building2, 'Iconic cities'],
  ['Treehouses', Trees, 'Treehouses'],
  ['Design', Landmark, 'Design'],
] as const;
function Explore() {
  const q = useSearchParams(),
    router = useRouter();
  const [items, setItems] = useState<Listing[]>([]),
    [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 }),
    [collectionItems, setCollectionItems] = useState<Record<string, Listing[]>>({}),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(false),
    [filters, setFilters] = useState(false);
  const category = q.get('category') || '';
  const isSearchView = [
    'location',
    'check_in',
    'check_out',
    'guests',
    'category',
    'property_type',
    'amenities',
    'min_price',
    'max_price',
    'min_bedrooms',
    'min_beds',
    'min_baths',
    'min_rating',
  ].some((key) => q.has(key));
  const activeFilterCount = [
    'min_price',
    'max_price',
    'property_type',
    'amenities',
    'min_bedrooms',
    'min_beds',
    'min_baths',
    'min_rating',
  ].filter((key) => q.has(key)).length;
  useEffect(() => {
    setLoading(true);
    setError(false);
    if (isSearchView) {
      listingsApi
        .search(q.toString())
        .then((result) => {
          setItems(result.items);
          setMeta(result);
        })
        .catch(() => setError(true))
        .finally(() => setLoading(false));
      return;
    }
    Promise.all(
      HOME_COLLECTIONS.map(
        async (collection) =>
          [collection.slug, (await listingsApi.search(collection.query)).items] as const,
      ),
    )
      .then((entries) => setCollectionItems(Object.fromEntries(entries)))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [q, isSearchView]);
  function setParam(key: string, value: string) {
    const p = new URLSearchParams(q.toString());
    value ? p.set(key, value) : p.delete(key);
    p.delete('page');
    router.push('/?' + p);
  }
  return (
    <>
      <section className="intro home-search-band">
        <SearchBar />
      </section>
      <div className="category-row">
        <div>
          {cats.map(([value, Icon, label]) => (
            <button
              key={label}
              onClick={() => setParam('category', value)}
              className={category === value ? 'selected' : ''}
            >
              <Icon size={22} />
              <span>{label}</span>
            </button>
          ))}
        </div>
        <button className="filter-trigger" onClick={() => setFilters(true)}>
          <SlidersHorizontal size={17} /> Filters
          {activeFilterCount > 0 && <b>{activeFilterCount}</b>}
        </button>
      </div>
      {filters && (
        <FilterModal
          key={q.toString()}
          query={q.toString()}
          onClose={() => setFilters(false)}
          onApply={(params) => {
            router.push(`/?${params}`);
            setFilters(false);
          }}
        />
      )}
      {isSearchView ? (
        <main className="explore">
          <div className="section-title">
            <div>
              <span>{meta.total} stays match your search</span>
              <h2>Homes for your trip</h2>
            </div>
          </div>
          {loading ? <LoadingGrid /> : error ? <DataLoadError /> : <ListingGrid items={items} />}
          {!loading && !error && meta.total > 0 && (
            <div className="pagination">
              <button
                disabled={meta.page <= 1}
                onClick={() => setParam('page', String(meta.page - 1))}
              >
                Previous
              </button>
              <span>
                Page {meta.page} of {meta.pages}
              </span>
              <button
                disabled={meta.page >= meta.pages}
                onClick={() => setParam('page', String(meta.page + 1))}
              >
                Next
              </button>
            </div>
          )}
        </main>
      ) : (
        <main className="home-collections">
          {loading ? (
            <LoadingCarousels />
          ) : error ? (
            <DataLoadError />
          ) : Object.values(collectionItems).every((listings) => listings.length === 0) ? (
            <div className="empty inventory-empty">
              <House size={36} />
              <h2>No homes are available yet</h2>
              <p>New listings will appear here as soon as hosts publish them.</p>
            </div>
          ) : (
            HOME_COLLECTIONS.map((collection) => (
              <ListingCarousel
                key={collection.slug}
                title={collection.title}
                slug={collection.slug}
                listings={collectionItems[collection.slug] ?? []}
              />
            ))
          )}
        </main>
      )}
    </>
  );
}

function DataLoadError() {
  return (
    <div className="empty inventory-empty" role="alert">
      <House size={36} />
      <h2>We couldn&apos;t load these homes</h2>
      <p>Check that the API is running, then refresh the page.</p>
    </div>
  );
}

function LoadingGrid() {
  return (
    <div className="skeleton-grid">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} />
      ))}
    </div>
  );
}

function LoadingCarousels() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, section) => (
        <section className="collection-section" key={section}>
          <div className="collection-title-skeleton" />
          <div className="carousel-skeleton">
            {Array.from({ length: 6 }).map((__, card) => (
              <div key={card} />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
export default function Home() {
  return (
    <Suspense>
      <Explore />
    </Suspense>
  );
}
