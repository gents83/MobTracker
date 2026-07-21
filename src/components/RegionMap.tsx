import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useState } from 'react';
import { Plus, Minus, Target, Camera } from 'lucide-react';
import html2canvas from 'html2canvas';

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

function CustomControls({ isDark, showRadius, setShowRadius }: { isDark: boolean, showRadius: boolean, setShowRadius: (v: boolean) => void }) {
  const map = useMap();
  
  const handleSnapshot = async (e: any) => {
    e.preventDefault();
    const container = map.getContainer();
    if (!container) return;
    
    // Temporarily hide controls before snapshot
    const controls = document.getElementById('map-custom-controls');
    if (controls) controls.style.visibility = 'hidden';
    
    try {
      const canvas = await html2canvas(container, {
        useCORS: true,
        allowTaint: false, // allowTaint: true might break toDataURL
        backgroundColor: null
      });
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `mobtrack_snapshot_${new Date().toISOString().split('T')[0]}.png`;
      link.href = url;
      link.click();
    } catch (err) {
      console.error("Failed to take snapshot:", err);
    } finally {
      // Restore controls visibility
      if (controls) controls.style.visibility = 'visible';
    }
  };

  return (
    <div id="map-custom-controls" className="absolute bottom-4 right-4 z-[400] flex flex-col gap-2">
      <div className={`flex flex-col rounded-lg shadow-lg overflow-hidden border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-blue-200 text-blue-700'}`}>
        <button onClick={(e) => { e.preventDefault(); map.zoomIn(); }} className={`p-2 transition-colors border-b ${isDark ? 'hover:bg-slate-700 border-slate-700' : 'hover:bg-blue-50 border-blue-100'}`} title="Zoom In">
          <Plus className="w-5 h-5" />
        </button>
        <button onClick={(e) => { e.preventDefault(); map.zoomOut(); }} className={`p-2 transition-colors ${isDark ? 'hover:bg-slate-700' : 'hover:bg-blue-50'}`} title="Zoom Out">
          <Minus className="w-5 h-5" />
        </button>
      </div>
      <button 
        onClick={handleSnapshot} 
        className={`p-2 rounded-lg shadow-lg border transition-colors flex items-center justify-center ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700' : 'bg-white border-blue-200 text-blue-500 hover:bg-blue-50'}`}
        title="Take Snapshot"
      >
        <Camera className="w-5 h-5" />
      </button>
      <button 
        onClick={(e) => { e.preventDefault(); setShowRadius(!showRadius); }} 
        className={`p-2 rounded-lg shadow-lg border transition-colors flex items-center justify-center ${isDark ? (showRadius ? 'bg-emerald-900/50 border-emerald-500 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700') : (showRadius ? 'bg-blue-100 border-blue-400 text-blue-700' : 'bg-white border-blue-200 text-blue-500 hover:bg-blue-50')}`}
        title="Toggle Accuracy Radius"
      >
        <Target className="w-5 h-5" />
      </button>
    </div>
  );
}

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
  const [showRadius, setShowRadius] = useState(false);

  // We use key prop on MapContainer in the parent to force remount when coords change
  return (
    <div className={`w-full h-full min-h-[300px] overflow-hidden relative z-0 transition-colors ${isDark ? 'bg-slate-900' : 'bg-blue-50'}`}>
      <MapContainer 
        center={[lat, lng]} 
        zoom={locations && locations.length > 0 ? 12 : 5} 
        scrollWheelZoom={true} 
        zoomControl={false}
        className="w-full h-full z-0"
        style={{ background: isDark ? '#0f172a' : '#eff6ff' }} // Matches tailwind colors
      >
        <CustomControls isDark={isDark} showRadius={showRadius} setShowRadius={setShowRadius} />
        
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
            {showRadius && locations.map((loc, i) => (
              <Circle 
                key={`radius-${loc.lat}-${loc.lng}-${loc.timestamp}-${i}`}
                center={[loc.lat, loc.lng]} 
                radius={2000} // 2km accuracy radius
                pathOptions={{ 
                  color: isDark ? '#10b981' : '#3b82f6', 
                  fillColor: isDark ? '#10b981' : '#3b82f6', 
                  fillOpacity: 0.1,
                  dashArray: '5, 5'
                }}
              />
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
                fillOpacity: 0.1 
              }}
            />
            {showRadius && (
              <Circle 
                center={[lat, lng]} 
                radius={15000} // 15km accuracy radius
                pathOptions={{ 
                  color: isDark ? '#34d399' : '#60a5fa', 
                  fillColor: isDark ? '#34d399' : '#60a5fa', 
                  fillOpacity: 0.2,
                  dashArray: '5, 5'
                }}
              />
            )}
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
