'use client';

import L from 'leaflet';
import { MapContainer, Marker, TileLayer, ZoomControl } from 'react-leaflet';

export default function ListingLocationMap({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  const marker = L.divIcon({
    className: 'detail-map-marker-shell',
    html: '<span class="detail-map-marker"></span>',
    iconSize: [42, 42],
    iconAnchor: [21, 21],
  });

  return (
    <MapContainer
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
  );
}
