'use client';

import L from 'leaflet';
import { useEffect, useMemo } from 'react';
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  ZoomControl,
  useMap,
  useMapEvents,
} from 'react-leaflet';

import type { Listing } from '@/shared/types/domain';

interface ListingMapProps {
  listings: Listing[];
  selectedId: number | null;
  onSelect: (listingId: number | null) => void;
  onResize: () => void;
  onInteractionStart: () => void;
  onInteractionEnd: () => void;
  onBoundsChange: (bounds: { north: number; south: number; east: number; west: number }) => void;
}

function MapInteractionObserver({ onStart, onEnd }: { onStart: () => void; onEnd: () => void }) {
  useMapEvents({
    movestart: onStart,
    zoomstart: onStart,
    dragstart: onStart,
    moveend: onEnd,
    zoomend: onEnd,
    dragend: onEnd,
  });
  return null;
}

function MapResizeObserver({ onResize }: { onResize: () => void }) {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    let previous = { width: container.clientWidth, height: container.clientHeight };
    const observer = new ResizeObserver(([entry]) => {
      const width = Math.round(entry.contentRect.width);
      const height = Math.round(entry.contentRect.height);
      map.invalidateSize({ animate: false });
      if (previous.width && (width !== previous.width || height !== previous.height)) onResize();
      previous = { width, height };
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [map, onResize]);

  return null;
}

function MapBoundsReporter({
  onChange,
}: {
  onChange: (bounds: { north: number; south: number; east: number; west: number }) => void;
}) {
  const map = useMapEvents({
    dragend: report,
    zoomend: (event) => {
      if ((event as L.LeafletEvent & { originalEvent?: Event }).originalEvent) report();
    },
  });

  function report() {
    const bounds = map.getBounds();
    onChange({
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest(),
    });
  }

  return null;
}

function MapBounds({ listings }: { listings: Listing[] }) {
  const map = useMap();

  useEffect(() => {
    if (!listings.length) return;
    const bounds = L.latLngBounds(listings.map((listing) => [listing.latitude, listing.longitude]));
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
  }, [listings, map]);

  return null;
}

function MapMarker({
  listing,
  selected,
  onSelect,
}: {
  listing: Listing;
  selected: boolean;
  onSelect: (listingId: number | null) => void;
}) {
  const icon = useMemo(
    () =>
      L.divIcon({
        className: 'listing-price-marker-shell',
        html: `<span class="listing-price-marker${selected ? ' selected' : ''}">$${Math.round(listing.price)}</span>`,
        iconSize: [64, 34],
        iconAnchor: [32, 17],
      }),
    [listing.price, selected],
  );

  return (
    <Marker
      position={[listing.latitude, listing.longitude]}
      icon={icon}
      eventHandlers={{
        click: () => onSelect(listing.id),
        mouseover: () => onSelect(listing.id),
        mouseout: () => onSelect(null),
      }}
    >
      <Popup closeButton={false} offset={[0, -10]}>
        <a
          className="map-popup-card"
          href={`/listings/${listing.id}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {/* The URL is controlled by seeded or host-entered listing data. */}
          <img src={listing.images[0]} alt="" />
          <div>
            {listing.host_is_superhost ? <em>Superhost</em> : null}
            <strong>{listing.title}</strong>
            <span>
              {listing.city}, {listing.country}
            </span>
            <b>${listing.price} night</b>
          </div>
        </a>
      </Popup>
    </Marker>
  );
}

export default function ListingMap({
  listings,
  selectedId,
  onSelect,
  onResize,
  onInteractionStart,
  onInteractionEnd,
  onBoundsChange,
}: ListingMapProps) {
  const mappedListings = listings.filter(
    (listing) => Number.isFinite(listing.latitude) && Number.isFinite(listing.longitude),
  );
  const center: [number, number] = mappedListings.length
    ? [mappedListings[0].latitude, mappedListings[0].longitude]
    : [20.5937, 78.9629];

  return (
    <MapContainer
      className="collection-map-canvas"
      center={center}
      zoom={5}
      zoomControl={false}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ZoomControl position="topright" />
      <MapResizeObserver onResize={onResize} />
      <MapInteractionObserver onStart={onInteractionStart} onEnd={onInteractionEnd} />
      <MapBoundsReporter onChange={onBoundsChange} />
      <MapBounds listings={mappedListings} />
      {mappedListings.map((listing) => (
        <MapMarker
          key={listing.id}
          listing={listing}
          selected={selectedId === listing.id}
          onSelect={onSelect}
        />
      ))}
    </MapContainer>
  );
}
