import { Listing } from '@/shared/types/domain';
import ListingCard from './ListingCard';
export default function ListingGrid({ items }: { items: Listing[] }) {
  if (!items.length)
    return (
      <div className="empty">
        <h2>No stays found</h2>
        <p>Try changing your destination or filters.</p>
      </div>
    );
  return (
    <div className="listing-grid">
      {items.map((x) => (
        <ListingCard key={x.id} listing={x} />
      ))}
    </div>
  );
}
