export interface HomeCollection {
  slug: string;
  title: string;
  query: string;
}

export const HOME_COLLECTIONS: HomeCollection[] = [
  {
    slug: 'popular-north-goa',
    title: 'Popular homes in North Goa',
    query: 'location=North+Goa&page_size=12',
  },
  {
    slug: 'puducherry-weekend',
    title: 'Available in Puducherry this weekend',
    query: 'location=Puducherry&page_size=12',
  },
  {
    slug: 'guest-favorites',
    title: 'Guest favourites around the world',
    query: 'min_rating=4.9&page_size=12',
  },
  { slug: 'design-led-stays', title: 'Design-led stays', query: 'category=Design&page_size=12' },
];

export function getCollection(slug: string) {
  return HOME_COLLECTIONS.find((collection) => collection.slug === slug);
}
