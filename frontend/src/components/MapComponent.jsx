import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { FaMap, FaSatellite, FaMountain } from 'react-icons/fa';

// Fix default marker icon issue with Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Map layer configurations
const MAP_LAYERS = {
  street: {
    name: 'Street',
    icon: FaMap,
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors',
  },
  satellite: {
    name: 'Satellite',
    icon: FaSatellite,
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '© Esri',
  },
  terrain: {
    name: 'Terrain',
    icon: FaMountain,
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '© OpenTopoMap',
  },
};

const MapComponent = ({ center, zoom = 12, markers = [], onMarkerClick }) => {
  const [mapLayer, setMapLayer] = useState('street');

  return (
    <div className="relative h-full w-full">
      <MapContainer 
        center={[center.lat, center.lng]} 
        zoom={zoom} 
        style={{ height: '100%', width: '100%' }}
        className="z-10"
      >
        {/* Active Tile Layer */}
        <TileLayer
          url={MAP_LAYERS[mapLayer].url}
          attribution={MAP_LAYERS[mapLayer].attribution}
        />
        
        {/* User's current location marker (blue) */}
        <Marker 
          position={[center.lat, center.lng]}
          icon={new L.Icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
          })}
        >
          <Popup>Your Location</Popup>
        </Marker>
        
        {/* Editor markers (violet/purple) */}
        {markers.map((editor) => (
          <Marker 
            key={editor._id}
            position={[
              editor.approxLocation?.lat || center.lat, 
              editor.approxLocation?.lng || center.lng
            ]}
            icon={new L.Icon({
              iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
              shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41]
            })}
            eventHandlers={{
              click: () => onMarkerClick && onMarkerClick(editor)
            }}
          >
            <Popup>
              <div className="text-center">
                <p className="font-semibold text-gray-900">{editor.name}</p>
                <p className="text-xs text-gray-600">{editor.approxLocation?.distance}km away</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Map Layer Switcher */}
      <div className="absolute bottom-6 right-6 z-[1000] bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-2">
        <div className="flex gap-2">
          {Object.entries(MAP_LAYERS).map(([key, layer]) => {
            const Icon = layer.icon;
            return (
              <button
                key={key}
                onClick={() => setMapLayer(key)}
                className={`px-4 py-2.5 rounded-lg flex items-center gap-2 text-sm font-medium transition-all ${
                  mapLayer === key
                    ? 'bg-violet-600 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                title={layer.name}
              >
                <Icon className="text-sm" />
                <span className="hidden sm:inline">{layer.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MapComponent;
