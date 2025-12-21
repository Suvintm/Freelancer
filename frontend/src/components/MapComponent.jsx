import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icon issue with Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapComponent = ({ center, zoom = 12, markers = [], onMarkerClick }) => {
  return (
    <MapContainer 
      center={[center.lat, center.lng]} 
      zoom={zoom} 
      style={{ height: '100%', width: '100%', borderRadius: '12px' }}
      className="z-10"
    >
      {/* OpenStreetMap tiles - Free, no API key needed */}
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
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
      
      {/* Editor markers (green) */}
      {markers.map((editor) => (
        <Marker 
          key={editor._id}
          position={[
            editor.approxLocation?.lat || center.lat, 
            editor.approxLocation?.lng || center.lng
          ]}
          icon={new L.Icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
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
  );
};

export default MapComponent;
