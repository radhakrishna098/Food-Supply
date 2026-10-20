import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Clock, MapPin, Package, Users } from 'lucide-react';
import { StatusBadge, CategoryBadge } from './Badge';
import { Link } from 'react-router-dom';

// Custom Leaflet DivIcons to avoid image asset path breaking in Vite
const createDonationIcon = () =>
  L.divIcon({
    className: 'custom-map-icon',
    html: `<div style="background-color: #1B4D3E; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3); color: white;">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });

const createOrgIcon = () =>
  L.divIcon({
    className: 'custom-map-icon-org',
    html: `<div style="background-color: #E06D3B; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3); color: white;">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 21h18"></path><path d="M5 21V7l8-4v18"></path><path d="M19 21V11l-6-4"></path></svg>
    </div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
  });

export default function MapView({
  donations = [],
  organizations = [],
  center = [28.6328, 77.2197], // Default to Delhi center
  zoom = 12,
  height = '420px',
  onSelectDonation,
}) {
  return (
    <div style={{ height }} className="w-full rounded-2xl overflow-hidden border border-stone-300 shadow-inner relative">
      <MapContainer center={center} zoom={zoom} scrollWheelZoom={false} className="w-full h-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Donation Markers */}
        {donations.map((d) => {
          const coords = d.location?.coordinates;
          if (!coords || coords.length < 2) return null;
          // GeoJSON is [longitude, latitude] -> Leaflet requires [latitude, longitude]
          const lat = coords[1];
          const lng = coords[0];

          return (
            <Marker key={d._id} position={[lat, lng]} icon={createDonationIcon()}>
              <Popup>
                <div className="p-1 max-w-[240px]">
                  <div className="flex items-center justify-between mb-1">
                    <StatusBadge status={d.status} />
                    <CategoryBadge category={d.category} />
                  </div>
                  <h4 className="font-bold text-sm text-stone-900 leading-tight mb-1">{d.foodTitle}</h4>
                  <p className="text-xs text-stone-600 mb-2">
                    <strong className="text-forest-900 font-semibold">{d.remainingQuantity} {d.unit}</strong> ({d.estimatedServings} servings)
                  </p>
                  <div className="flex items-center gap-1 text-[11px] text-stone-500 mb-2">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    <span>Deadline: {new Date(d.collectionWindow.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <Link
                    to={`/donations/${d._id}`}
                    className="block text-center w-full py-1.5 px-3 rounded-lg bg-forest-800 hover:bg-forest-900 text-white font-semibold text-xs shadow-sm transition-colors"
                  >
                    View Rescue Details
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Organization Markers */}
        {organizations.map((org) => {
          const coords = org.location?.coordinates;
          if (!coords || coords.length < 2) return null;
          const lat = coords[1];
          const lng = coords[0];

          return (
            <Marker key={org._id} position={[lat, lng]} icon={createOrgIcon()}>
              <Popup>
                <div className="p-1 max-w-[220px]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-terracotta-600">
                    {org.type?.replace(/_/g, ' ')}
                  </span>
                  <h4 className="font-bold text-sm text-stone-900 mb-1">{org.name}</h4>
                  <p className="text-xs text-stone-600 mb-1">
                    Capacity: {org.maxDailyCapacityServings} servings/day
                  </p>
                  <p className="text-[11px] text-stone-500">{org.address?.formattedAddress}</p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
