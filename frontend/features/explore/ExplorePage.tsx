'use client';
import SearchBar from '@/features/explore/components/SearchBar';
import ListingGrid from '@/features/explore/components/ListingGrid';
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
    [loading, setLoading] = useState(true),
    [filters, setFilters] = useState(false);
  const category = q.get('category') || '';
  useEffect(() => {
    setLoading(true);
    listingsApi
      .search(q.toString())
      .then((r) => {
        setItems(r.items);
        setMeta(r);
      })
      .finally(() => setLoading(false));
  }, [q]);
  function setParam(key: string, value: string) {
    const p = new URLSearchParams(q.toString());
    value ? p.set(key, value) : p.delete(key);
    p.delete('page');
    router.push('/?' + p);
  }
  return (
    <>
      <section className="intro">
        <p>CURATED HOMES, EVERYWHERE</p>
        <h1>
          Stay somewhere that
          <br />
          stays with you.
        </h1>
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
        <button className="filter-trigger" onClick={() => setFilters(!filters)}>
          <SlidersHorizontal size={17} /> Filters
        </button>
      </div>
      {filters && (
        <div className="filter-panel">
          <label>
            Property type
            <select
              value={q.get('property_type') || ''}
              onChange={(e) => setParam('property_type', e.target.value)}
            >
              <option value="">Any type</option>
              <option>Entire cabin</option>
              <option>Entire villa</option>
              <option>Entire apartment</option>
              <option>Treehouse</option>
            </select>
          </label>
          <label>
            Maximum nightly price
            <input
              type="range"
              min="100"
              max="400"
              step="10"
              value={q.get('max_price') || 400}
              onChange={(e) => setParam('max_price', e.target.value)}
            />
            <b>${q.get('max_price') || 400}</b>
          </label>
        </div>
      )}
      <main className="explore">
        <div className="section-title">
          <div>
            <span>{meta.total} handpicked homes</span>
            <h2>Places worth going for</h2>
          </div>
        </div>
        {loading ? (
          <div className="skeleton-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} />
            ))}
          </div>
        ) : (
          <ListingGrid items={items} />
        )}
        <div className="pagination">
          <button disabled={meta.page <= 1} onClick={() => setParam('page', String(meta.page - 1))}>
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
      </main>
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
