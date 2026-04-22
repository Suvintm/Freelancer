import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaBolt, FaCrosshairs } from "react-icons/fa";

// Fix for default marker icons in Leaflet + React
const defaultIcon = L.icon({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const createEditorIcon = (editor) => {
  const photoUrl = editor.profilePicture || 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
  const name = editor.name?.split(' ')[0] || 'Editor';

  return L.divIcon({
    className: "editor-marker-custom",
    html: `
      <div class="flex flex-col items-center group cursor-pointer">
        <div class="relative">
          <div class="w-10 h-10 rounded-2xl overflow-hidden border-2 border-white shadow-[0_4px_15px_rgba(0,0,0,0.15)] bg-white transition-transform group-hover:scale-110">
            <img src="${photoUrl}" class="w-full h-full object-cover" onerror="this.src='https://cdn-icons-png.flaticon.com/512/149/149071.png'" />
          </div>
          ${editor.isOnline ? '<div class="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></div>' : ''}
        </div>
        <div class="mt-1 px-2 py-0.5 bg-white/95 backdrop-blur-md rounded-lg shadow-sm border border-gray-100">
          <p class="text-[10px] font-black text-gray-800 whitespace-nowrap">${name}</p>
        </div>
      </div>
    `,
    iconSize: [60, 60],
    iconAnchor: [30, 60],
  });
};

const userIcon = L.divIcon({
  className: "user-marker",
  html: `<div class="relative flex items-center justify-center">
          <div class="absolute w-12 h-12 bg-blue-500/20 rounded-full animate-pulse"></div>
          <div class="w-6 h-6 bg-blue-500 border-2 border-white rounded-full shadow-[0_0_20px_rgba(59,130,246,0.5)]"></div>
          <div class="absolute -top-1.5 -right-1.5 w-4 h-4 bg-white rounded-full flex items-center justify-center border border-blue-500/20 shadow-sm">
             <div class="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
          </div>
        </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

// Component to handle map center updates
const ChangeView = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

const NearbyMapView = ({ 
  editors, 
  userLocation, 
  onEditorSelect, 
  selectedEditorId, 
  onAutoMatch, 
  searchRadius, 
  onRadiusChange,
  hasSearched,
  onStartDiscovery
}) => {
  const [mapCenter, setMapCenter] = useState([12.9716, 77.5946]); // Bangalore default
  const [zoom, setZoom] = useState(13);

  useEffect(() => {
    if (userLocation) {
      setMapCenter([userLocation.lat, userLocation.lng]);
    }
  }, [userLocation]);

  // Effect to pan to selected editor
  useEffect(() => {
    if (selectedEditorId && editors.length > 0) {
      const selected = editors.find(e => e._id === selectedEditorId);
      if (selected && selected.approxLocation) {
        setMapCenter([selected.approxLocation.lat, selected.approxLocation.lng]);
        setZoom(15);
      }
    }
  }, [selectedEditorId, editors]);

  return (
    <div className="relative w-full h-full bg-[#f8f9fa]">
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        zoomControl={false}
        className="w-full h-full z-0"
        attributionControl={false}
      >
        <ChangeView center={mapCenter} zoom={zoom} />
        
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
        />

        {/* User Marker & Radius Circle */}
        {userLocation && (
          <>
            <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
              <Popup className="custom-popup">
                <div className="font-bold text-gray-800">Your Location</div>
              </Popup>
            </Marker>

            {/* Dynamic Discovery Radius Circle (Only show after search) */}
            {hasSearched && (
              <Circle 
                center={[userLocation.lat, userLocation.lng]}
                radius={searchRadius * 1000} // Convert km to meters
                pathOptions={{
                  fillColor: '#10b981',
                  fillOpacity: 0.2,
                  color: '#10b981',
                  weight: 4,
                  className: "radius-pulse-anim"
                }}
              />
            )}
          </>
        )}

        {/* Editor Markers (Only show after search) */}
        <AnimatePresence mode="popLayout">
          {hasSearched && editors.map((editor) => (
            <Marker
              key={editor._id}
              position={[editor.approxLocation.lat, editor.approxLocation.lng]}
              icon={createEditorIcon(editor)}
              eventHandlers={{
                click: () => onEditorSelect(editor),
              }}
            >
              <Popup className="custom-popup">
                <div className="p-1">
                  <p className="font-bold text-gray-900">{editor.name}</p>
                  <p className="text-xs text-gray-500">{editor.distance} km away</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </AnimatePresence>
      </MapContainer>

      {/* Visual Enhancements */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.02)] z-[1]" />
      
      <style>{`
        .custom-popup .leaflet-popup-content-wrapper {
          background: white !important;
          color: #1a1a1a !important;
          border-radius: 20px !important;
          padding: 8px !important;
          box-shadow: 0 10px 40px rgba(0,0,0,0.1) !important;
        }
        .custom-popup .leaflet-popup-tip {
          background: white !important;
        }
        .editor-marker-custom {
          background: transparent !important;
          border: none !important;
        }
        .radius-pulse-anim {
          animation: radiusPulse 3s infinite ease-in-out;
          stroke-dasharray: 10, 10;
        }
        @keyframes radiusPulse {
          0% { stroke-opacity: 0.9; stroke-width: 4; fill-opacity: 0.2; }
          50% { stroke-opacity: 0.4; stroke-width: 8; fill-opacity: 0.25; }
          100% { stroke-opacity: 0.9; stroke-width: 4; fill-opacity: 0.2; }
        }
      `}</style>
    </div>
  );
};

export default NearbyMapView;
