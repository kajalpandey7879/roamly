'use client';

import L from 'leaflet';
import { House, LocateFixed, Maximize2 } from 'lucide-react';
import { MapContainer, Marker, TileLayer, ZoomControl } from 'react-leaflet';
import { useEffect, useRef, useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

export default function ListingLocationMap({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const marker = L.divIcon({
    className: 'detail-map-marker-shell',
    html: renderToStaticMarkup(
      <span className="detail-map-marker">
        <House size={18} strokeWidth={2.4} />
      </span>,
    ),
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  });

  useEffect(() => {
    const resizeMap = () => window.setTimeout(() => map?.invalidateSize(), 120);
    document.addEventListener('fullscreenchange', resizeMap);
    return () => document.removeEventListener('fullscreenchange', resizeMap);
  }, [map]);

  return (
    <div className="detail-map-frame" ref={frameRef}>
      <MapContainer
        ref={setMap}
        className="detail-location-map"
        center={[latitude, longitude]}
        zoom={12}
        zoomControl={false}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ZoomControl position="topright" />
        <Marker position={[latitude, longitude]} icon={marker} />
      </MapContainer>
      <button
        className="detail-map-locate"
        title="Recenter map"
        onClick={() => map?.setView([latitude, longitude], 12, { animate: true })}
      >
        <LocateFixed size={18} />
      </button>
      <button
        className="detail-map-expand"
        title="Expand map"
        onClick={() => frameRef.current?.requestFullscreen()}
      >
        <Maximize2 size={18} />
      </button>
    </div>
  );
}
