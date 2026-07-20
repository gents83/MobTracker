import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';

// Fix for default Leaflet icon paths in Vite/React
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

interface RegionMapProps {
  key?: string;
  lat: number;
  lng: number;
  countryName?: string;
  theme: 'terminal' | 'blueprint';
  privacyMode?: boolean;
  locations?: {lat: number, lng: number, timestamp: number}[];
}

export default function RegionMap({ lat, lng, countryName, theme, privacyMode, locations }: RegionMapProps) {
  const isDark = theme === 'terminal';
  const pathPositions = locations ? locations.map(loc => [loc.lat, loc.lng] as [number, number]) : undefined;

  // We use key prop on MapContainer in the parent to force remount when coords change
  return (
    <div className={`w-full h-full min-h-[300px] overflow-hidden relative z-0 transition-colors ${isDark ? 'bg-slate-900' : 'bg-blue-50'}`}>
      <MapContainer 
        center={[lat, lng]} 
        zoom={locations && locations.length > 0 ? 12 : 5} 
        scrollWheelZoom={true} 
        className="w-full h-full z-0"
        style={{ background: isDark ? '#0f172a' : '#eff6ff' }} // Matches tailwind colors
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className={isDark ? 'map-tiles-terminal' : 'map-tiles-blueprint'}
        />
        
        {locations && locations.length > 0 ? (
          <>
            <Polyline 
              positions={pathPositions!} 
              pathOptions={{ color: isDark ? '#10b981' : '#3b82f6', weight: 3, opacity: 0.7 }} 
            />
            {locations.map((loc, i) => (
              <Marker key={`${loc.lat}-${loc.lng}-${loc.timestamp}-${i}`} position={[loc.lat, loc.lng]} icon={icon}>
                <Popup className={isDark ? 'tech-popup-terminal' : 'tech-popup-blueprint'}>
                  <div className={`font-mono text-sm ${isDark ? 'text-slate-700' : 'text-blue-900'}`}>
                    <strong className="block mb-1">RECORD #{locations.length - i}</strong>
                    Lat: {privacyMode ? 'REDACTED' : loc.lat.toFixed(4)}<br/>
                    Lng: {privacyMode ? 'REDACTED' : loc.lng.toFixed(4)}<br/>
                    Time: {new Date(loc.timestamp).toLocaleTimeString()}
                  </div>
                </Popup>
              </Marker>
            ))}
          </>
        ) : (
          <>
            <Circle 
              center={[lat, lng]} 
              radius={200000} 
              pathOptions={{ 
                color: isDark ? '#10b981' : '#3b82f6', 
                fillColor: isDark ? '#10b981' : '#3b82f6', 
                fillOpacity: 0.2 
              }}
            />
            <Marker position={[lat, lng]} icon={icon}>
              <Popup className={isDark ? 'tech-popup-terminal' : 'tech-popup-blueprint'}>
                <div className={`font-mono text-sm ${isDark ? 'text-slate-700' : 'text-blue-900'}`}>
                  <strong className="block mb-1">REGION LOCKED</strong>
                  {countryName && <>Country: {countryName}<br/></>}
                  Lat: {privacyMode ? 'REDACTED' : lat.toFixed(4)}<br/>
                  Lng: {privacyMode ? 'REDACTED' : lng.toFixed(4)}
                </div>
              </Popup>
            </Marker>
          </>
        )}
      </MapContainer>
    </div>
  );
}
