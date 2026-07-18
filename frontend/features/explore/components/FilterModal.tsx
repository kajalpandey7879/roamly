'use client';

import { Minus, Plus, SlidersHorizontal, X } from 'lucide-react';
import { useState } from 'react';

const PROPERTY_TYPES = [
  'Entire home',
  'Entire apartment',
  'Entire cabin',
  'Entire villa',
  'Treehouse',
  'Cave house',
  'Entire loft',
];
const AMENITIES = [
  'Wifi',
  'Kitchen',
  'Free parking',
  'Air conditioning',
  'Fireplace',
  'Private pool',
  'Hot tub',
  'Dedicated workspace',
];
const PRICE_MIN = 50;
const PRICE_MAX = 400;

interface FilterModalProps {
  query: string;
  onApply: (params: URLSearchParams) => void;
  onClose: () => void;
}

export default function FilterModal({ query, onApply, onClose }: FilterModalProps) {
  const initial = new URLSearchParams(query);
  const [minPrice, setMinPrice] = useState(Number(initial.get('min_price') ?? PRICE_MIN));
  const [maxPrice, setMaxPrice] = useState(Number(initial.get('max_price') ?? PRICE_MAX));
  const [propertyType, setPropertyType] = useState(initial.get('property_type') ?? '');
  const [amenities, setAmenities] = useState(
    initial.get('amenities')?.split(',').filter(Boolean) ?? [],
  );
  const [bedrooms, setBedrooms] = useState(Number(initial.get('min_bedrooms') ?? 0));
  const [beds, setBeds] = useState(Number(initial.get('min_beds') ?? 0));
  const [baths, setBaths] = useState(Number(initial.get('min_baths') ?? 0));
  const [rating, setRating] = useState(Number(initial.get('min_rating') ?? 0));

  function toggleAmenity(amenity: string) {
    setAmenities((current) =>
      current.includes(amenity)
        ? current.filter((value) => value !== amenity)
        : [...current, amenity],
    );
  }

  function apply() {
    const params = new URLSearchParams(query);
    setOrDelete(params, 'min_price', minPrice > PRICE_MIN ? minPrice : 0);
    setOrDelete(params, 'max_price', maxPrice < PRICE_MAX ? maxPrice : 0);
    setOrDelete(params, 'property_type', propertyType);
    setOrDelete(params, 'amenities', amenities.join(','));
    setOrDelete(params, 'min_bedrooms', bedrooms);
    setOrDelete(params, 'min_beds', beds);
    setOrDelete(params, 'min_baths', baths);
    setOrDelete(params, 'min_rating', rating);
    params.delete('page');
    onApply(params);
  }

  function clearAll() {
    setMinPrice(PRICE_MIN);
    setMaxPrice(PRICE_MAX);
    setPropertyType('');
    setAmenities([]);
    setBedrooms(0);
    setBeds(0);
    setBaths(0);
    setRating(0);
  }

  return (
    <div
      className="filter-backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        className="filter-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Listing filters"
      >
        <header>
          <button title="Close filters" onClick={onClose}>
            <X size={20} />
          </button>
          <h2>Filters</h2>
          <span />
        </header>
        <div className="filter-scroll">
          <section className="filter-section price-filter">
            <h3>Price range</h3>
            <p>Nightly prices before fees and taxes</p>
            <div className="price-histogram" aria-hidden="true">
              {[12, 18, 25, 38, 48, 62, 76, 88, 96, 82, 70, 60, 52, 43, 35, 29, 24, 19, 14, 10].map(
                (height, index) => (
                  <i key={index} style={{ height: `${height}%` }} />
                ),
              )}
            </div>
            <div className="dual-range">
              <input
                aria-label="Minimum price"
                type="range"
                min={PRICE_MIN}
                max={PRICE_MAX}
                step="5"
                value={minPrice}
                onChange={(event) =>
                  setMinPrice(Math.min(Number(event.target.value), maxPrice - 5))
                }
              />
              <input
                aria-label="Maximum price"
                type="range"
                min={PRICE_MIN}
                max={PRICE_MAX}
                step="5"
                value={maxPrice}
                onChange={(event) =>
                  setMaxPrice(Math.max(Number(event.target.value), minPrice + 5))
                }
              />
            </div>
            <div className="price-inputs">
              <label>
                <span>Minimum</span>
                <div>
                  $
                  <input
                    type="number"
                    min={PRICE_MIN}
                    max={maxPrice - 5}
                    value={minPrice}
                    onChange={(event) =>
                      setMinPrice(Math.min(Number(event.target.value), maxPrice - 5))
                    }
                  />
                </div>
              </label>
              <em>-</em>
              <label>
                <span>Maximum</span>
                <div>
                  $
                  <input
                    type="number"
                    min={minPrice + 5}
                    max={PRICE_MAX}
                    value={maxPrice}
                    onChange={(event) =>
                      setMaxPrice(Math.max(Number(event.target.value), minPrice + 5))
                    }
                  />
                </div>
              </label>
            </div>
          </section>

          <section className="filter-section">
            <h3>Type of place</h3>
            <div className="property-options">
              <button className={!propertyType ? 'active' : ''} onClick={() => setPropertyType('')}>
                <SlidersHorizontal size={18} />
                Any type
              </button>
              {PROPERTY_TYPES.map((type) => (
                <button
                  key={type}
                  className={propertyType === type ? 'active' : ''}
                  onClick={() => setPropertyType(type)}
                >
                  {type}
                </button>
              ))}
            </div>
          </section>

          <section className="filter-section">
            <h3>Rooms and beds</h3>
            <div className="room-options">
              <Counter label="Bedrooms" value={bedrooms} onChange={setBedrooms} />
              <Counter label="Beds" value={beds} onChange={setBeds} />
              <Counter label="Bathrooms" value={baths} onChange={setBaths} />
            </div>
          </section>

          <section className="filter-section">
            <h3>Amenities</h3>
            <div className="amenity-options">
              {AMENITIES.map((amenity) => (
                <label key={amenity}>
                  <input
                    type="checkbox"
                    checked={amenities.includes(amenity)}
                    onChange={() => toggleAmenity(amenity)}
                  />
                  <span>{amenity}</span>
                </label>
              ))}
            </div>
          </section>

          <section className="filter-section">
            <h3>Guest rating</h3>
            <div className="rating-options">
              {(
                [
                  [0, 'Any'],
                  [4.8, '4.8+'],
                  [4.9, '4.9+'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={label}
                  className={rating === value ? 'active' : ''}
                  onClick={() => setRating(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>
        </div>
        <footer>
          <button className="clear-filters" onClick={clearAll}>
            Clear all
          </button>
          <button className="show-results" onClick={apply}>
            Show places
          </button>
        </footer>
      </section>
    </div>
  );
}

function Counter({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <span>{label}</span>
      <div>
        <button disabled={value === 0} onClick={() => onChange(Math.max(0, value - 1))}>
          <Minus size={15} />
        </button>
        <b>{value || 'Any'}</b>
        <button disabled={value === 10} onClick={() => onChange(Math.min(10, value + 1))}>
          <Plus size={15} />
        </button>
      </div>
    </div>
  );
}

function setOrDelete(params: URLSearchParams, key: string, value: string | number) {
  value ? params.set(key, String(value)) : params.delete(key);
}
