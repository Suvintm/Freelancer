import { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { 
  FaMap, FaSatellite, FaMountain, FaStar, 
  FaPlus, FaMinus, FaLocationArrow, FaExpand,
  FaChevronUp, FaChevronDown, FaChevronLeft, FaChevronRight
} from 'react-icons/fa';
import { HiOutlineMapPin } from 'react-icons/hi2';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

// Map layer configurations
const MAP_LAYERS = {
  street: {
    name: 'Street',
    icon: FaMap,
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap',
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

// Custom GREEN marker with "You" label for user's location
const createUserLocationIcon = () => {
  return L.divIcon({
    className: 'custom-user-marker',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
        <div style="
          background: linear-gradient(135deg, #10B981, #059669);
          color: white;
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 10px;
          font-weight: 700;
          margin-bottom: 2px;
          box-shadow: 0 2px 6px rgba(16, 185, 129, 0.4);
          white-space: nowrap;
        ">📍 You</div>
        <div style="
          width: 16px;
          height: 16px;
          background: linear-gradient(135deg, #10B981, #059669);
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        "></div>
        <div style="
          width: 0;
          height: 0;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-top: 7px solid #059669;
          margin-top: -2px;
        "></div>
      </div>
    `,
    iconSize: [40, 45],
    iconAnchor: [20, 45],
    popupAnchor: [0, -45],
  });
};

// Custom WHITE + GREEN professional marker with editor's photo and name
const createEditorMarkerIcon = (editor, offsetIndex = 0) => {
  // Use the actual profile picture or a default placeholder
  const photoUrl = editor.profilePicture && editor.profilePicture.trim() !== '' 
    ? editor.profilePicture 
    : 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
  const name = editor.name?.split(' ')[0] || 'Editor';
  
  // Add slight offset for overlapping markers (Snapchat-style fan out)
  const offsetX = offsetIndex * 8;
  
  return L.divIcon({
    className: 'custom-editor-marker',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; transform: translateX(${offsetX}px);">
        <div style="
          background: linear-gradient(135deg, #10B981, #059669);
          color: white;
          padding: 2px 8px;
          border-radius: 8px;
          font-size: 9px;
          font-weight: 600;
          margin-bottom: 2px;
          box-shadow: 0 1px 4px rgba(16, 185, 129, 0.4);
          white-space: nowrap;
          max-width: 70px;
          overflow: hidden;
          text-overflow: ellipsis;
        ">${name}</div>
        <div style="
          position: relative;
          width: 36px;
          height: 36px;
          background: white;
          border-radius: 50%;
          padding: 2px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
          border: 2px solid #10B981;
        ">
          <img 
            src="${photoUrl}" 
            alt="${name}"
            style="
              width: 100%;
              height: 100%;
              border-radius: 50%;
              object-fit: cover;
            "
            onerror="this.src='https://cdn-icons-png.flaticon.com/512/149/149071.png'"
          />
        </div>
        <div style="
          width: 0;
          height: 0;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-top: 6px solid #10B981;
          margin-top: -1px;
        "></div>
      </div>
    `,
    iconSize: [80, 60],
    iconAnchor: [40 - offsetX, 60],
    popupAnchor: [offsetX, -55],
    tooltipAnchor: [offsetX, -50],
  });
};

// Map Controls Component
const MapControls = ({ isDark }) => {
  const map = useMap();

  const handleZoomIn = () => map.zoomIn();
  const handleZoomOut = () => map.zoomOut();
  const handlePanUp = () => map.panBy([0, -100]);
  const handlePanDown = () => map.panBy([0, 100]);
  const handlePanLeft = () => map.panBy([-100, 0]);
  const handlePanRight = () => map.panBy([100, 0]);
  const handleResetView = () => map.setView(map.getCenter(), 12);
  const handleLocate = () => {
    navigator.geolocation?.getCurrentPosition((pos) => {
      map.flyTo([pos.coords.latitude, pos.coords.longitude], 14);
    });
  };

  const btnClass = `w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all ${
    isDark 
      ? 'bg-black/80 border border-green-800/50 text-green-400 hover:bg-green-900/50 hover:text-white' 
      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-green-600'
  }`;

  return (
    <div className="absolute top-4 right-4 z-[1000] hidden md:flex flex-col gap-2">
      {/* Zoom Controls */}
      <div className={`rounded-xl p-1 flex flex-col gap-1 ${isDark ? 'bg-black/90 border border-green-900/50' : 'bg-white border border-gray-200 shadow-lg'}`}>
        <button onClick={handleZoomIn} className={btnClass} title="Zoom In">
          <FaPlus />
        </button>
        <button onClick={handleZoomOut} className={btnClass} title="Zoom Out">
          <FaMinus />
        </button>
      </div>

      {/* Pan Controls */}
      <div className={`rounded-xl p-1 ${isDark ? 'bg-black/90 border border-green-900/50' : 'bg-white border border-gray-200 shadow-lg'}`}>
        <div className="grid grid-cols-3 gap-0.5">
          <div></div>
          <button onClick={handlePanUp} className={btnClass} title="Pan Up">
            <FaChevronUp />
          </button>
          <div></div>
          <button onClick={handlePanLeft} className={btnClass} title="Pan Left">
            <FaChevronLeft />
          </button>
          <button onClick={handleResetView} className={`${btnClass} !w-7 !h-7`} title="Reset View">
            <FaExpand className="text-xs" />
          </button>
          <button onClick={handlePanRight} className={btnClass} title="Pan Right">
            <FaChevronRight />
          </button>
          <div></div>
          <button onClick={handlePanDown} className={btnClass} title="Pan Down">
            <FaChevronDown />
          </button>
          <div></div>
        </div>
      </div>

      {/* Locate Me Button */}
      <button 
        onClick={handleLocate} 
        className={`rounded-xl p-2 ${btnClass} !w-10 !h-10`}
        title="My Location"
      >
        <FaLocationArrow />
      </button>
    </div>
  );
};

// Distance Label Component on Path
const createDistanceIcon = (distance) => {
  return L.divIcon({
    className: 'distance-label',
    html: `
      <div style="
        background: linear-gradient(135deg, #10B981, #059669);
        color: white;
        padding: 3px 8px;
        border-radius: 10px;
        font-size: 10px;
        font-weight: 700;
        box-shadow: 0 2px 6px rgba(16, 185, 129, 0.4);
        white-space: nowrap;
        border: 2px solid white;
      ">${distance}km</div>
    `,
    iconSize: [50, 20],
    iconAnchor: [25, 10],
  });
};

// Calculate offset index for overlapping markers
const getOffsetIndex = (editor, allEditors, index) => {
  const lat = editor.approxLocation?.lat;
  const lng = editor.approxLocation?.lng;
  
  let sameLocationIndex = 0;
  for (let i = 0; i < index; i++) {
    const other = allEditors[i];
    const otherLat = other.approxLocation?.lat;
    const otherLng = other.approxLocation?.lng;
    
    // Check if approximately same location (within ~100 meters)
    if (Math.abs(lat - otherLat) < 0.001 && Math.abs(lng - otherLng) < 0.001) {
      sameLocationIndex++;
    }
  }
  
  return sameLocationIndex;
};

const MapComponent = ({ center, zoom = 12, markers = [], onMarkerClick, selectedEditor }) => {
  const [mapLayer, setMapLayer] = useState('street');
  const [searchRadius, setSearchRadius] = useState(5); // km - for display circle
  const { isDark } = useTheme();
  const navigate = useNavigate();

  // Debug: Log markers to check profilePicture
  useEffect(() => {
    console.log('📍 Map Markers:', markers.map(m => ({ 
      name: m.name, 
      profilePicture: m.profilePicture,
      hasPhoto: !!m.profilePicture 
    })));
  }, [markers]);

  const handleEditorClick = (editor) => {
    navigate(`/editor/${editor._id}`);
    if (onMarkerClick) onMarkerClick(editor);
  };

  // Randomize editor position within a region for privacy
  // Each editor gets a consistent random offset based on their ID
  const getRandomizedPosition = (editor, index) => {
    const baseLat = center.lat;
    const baseLng = center.lng;
    
    // Use editor ID to generate consistent random offset
    const seed = editor._id ? 
      editor._id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : 
      index * 1234;
    
    // Generate pseudo-random angle and distance
    const angle = ((seed * 137.508) % 360) * (Math.PI / 180); // Golden angle in radians
    const distanceRatio = 0.3 + ((seed % 100) / 100) * 0.5; // 30-80% of radius
    const distance = searchRadius * distanceRatio;
    
    // Convert km to lat/lng offset (approximate)
    const latOffset = (distance / 111) * Math.cos(angle);
    const lngOffset = (distance / (111 * Math.cos(baseLat * Math.PI / 180))) * Math.sin(angle);
    
    return [baseLat + latOffset, baseLng + lngOffset];
  };

  return (
    <div className="relative h-full w-full">
      <MapContainer 
        center={[center.lat, center.lng]} 
        zoom={zoom} 
        style={{ height: '100%', width: '100%' }}
        className="z-10"
        zoomControl={false}
      >
        {/* Active Tile Layer */}
        <TileLayer
          url={MAP_LAYERS[mapLayer].url}
          attribution={MAP_LAYERS[mapLayer].attribution}
        />

        {/* Map Controls */}
        <MapControls isDark={isDark} />
        
        {/* Search Radius Circle - Visual region indicator */}
        <Circle
          center={[center.lat, center.lng]}
          radius={searchRadius * 1000} // Convert km to meters
          pathOptions={{
            color: '#10B981',
            weight: 2,
            opacity: 0.6,
            fillColor: '#10B981',
            fillOpacity: 0.08,
            dashArray: '5, 5',
          }}
        />
        
        {/* User's current location marker (GREEN with "You" badge) */}
        <Marker 
          position={[center.lat, center.lng]}
          icon={createUserLocationIcon()}
          zIndexOffset={1000}
        >
          <Popup>
            <div className="text-center font-semibold text-green-600 py-1">Your Current Location</div>
          </Popup>
        </Marker>
        
        {/* Editor markers at RANDOMIZED positions within region (for privacy) */}
        {markers.map((editor, index) => {
          const photoUrl = editor.profilePicture && editor.profilePicture.trim() !== ''
            ? editor.profilePicture
            : 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
          
          // Get randomized position within the search radius
          const randomizedPos = getRandomizedPosition(editor, index);
          
          return (
            <Marker 
              key={editor._id}
              position={randomizedPos}
              icon={createEditorMarkerIcon(editor, 0)} // No offset needed with random positions
              zIndexOffset={500 + index}
              eventHandlers={{
                click: () => handleEditorClick(editor)
              }}
            >
              {/* Hover Tooltip */}
              <Tooltip 
                direction="top" 
                offset={[0, -55]} 
                opacity={1}
                permanent={false}
                className="custom-tooltip"
              >
                <div style={{
                  background: isDark ? '#000' : 'white',
                  borderRadius: '12px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                  padding: '12px',
                  minWidth: '180px',
                  border: isDark ? '1px solid #14532d' : '1px solid #e5e7eb'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img 
                      src={photoUrl}
                      alt={editor.name}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '2px solid #10B981'
                      }}
                      onError={(e) => { e.target.src = 'https://cdn-icons-png.flaticon.com/512/149/149071.png'; }}
                    />
                    <div>
                      <p style={{ fontWeight: '600', color: isDark ? '#fff' : '#111827', fontSize: '13px', margin: 0 }}>{editor.name}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                        <span style={{ color: '#F59E0B', fontSize: '11px' }}>★ {editor.rating?.toFixed(1) || 'N/A'}</span>
                        <span style={{ color: '#10B981', fontSize: '11px', fontWeight: '500' }}>In this area</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: '8px', textAlign: 'center' }}>
                    <span style={{ color: '#10B981', fontSize: '10px', fontWeight: '500' }}>Click to view profile →</span>
                  </div>
                </div>
              </Tooltip>
              
              {/* Click Popup */}
              <Popup>
                <div style={{ textAlign: 'center', padding: '8px', background: isDark ? '#000' : '#fff' }}>
                  <img 
                    src={photoUrl}
                    alt={editor.name}
                    style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid #10B981',
                      margin: '0 auto 8px'
                    }}
                    onError={(e) => { e.target.src = 'https://cdn-icons-png.flaticon.com/512/149/149071.png'; }}
                  />
                  <p style={{ fontWeight: '700', color: isDark ? '#fff' : '#111827', fontSize: '14px', margin: '0 0 4px' }}>{editor.name}</p>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '8px' }}>
                    <span style={{ color: '#F59E0B', fontSize: '12px' }}>★ {editor.rating?.toFixed(1) || 'N/A'}</span>
                    <span style={{ color: '#10B981', fontSize: '12px' }}>{editor.approxLocation?.distance}km</span>
                  </div>
                  <button
                    onClick={() => handleEditorClick(editor)}
                    style={{
                      width: '100%',
                      padding: '6px 12px',
                      background: 'linear-gradient(135deg, #10B981, #059669)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    View Profile
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Radius Control */}
      <div className={`absolute top-6 right-6 z-[1000] rounded-xl shadow-2xl p-3 ${
        isDark ? 'bg-black border border-green-900/50' : 'bg-white border border-gray-200'
      }`}>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Search Area
            </span>
            <span className={`text-sm font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
              {searchRadius} km
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchRadius(prev => Math.max(1, prev - 1))}
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold ${
                isDark 
                  ? 'bg-green-950/50 text-green-400 hover:bg-green-900/50' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              -
            </button>
            <input
              type="range"
              min="1"
              max="25"
              value={searchRadius}
              onChange={(e) => setSearchRadius(parseInt(e.target.value))}
              className="flex-1 h-2 rounded-lg appearance-none cursor-pointer accent-green-500"
              style={{
                background: `linear-gradient(to right, #10B981 0%, #10B981 ${(searchRadius / 25) * 100}%, ${isDark ? '#0a0a0a' : '#e5e7eb'} ${(searchRadius / 25) * 100}%, ${isDark ? '#0a0a0a' : '#e5e7eb'} 100%)`
              }}
            />
            <button
              onClick={() => setSearchRadius(prev => Math.min(25, prev + 1))}
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold ${
                isDark 
                  ? 'bg-green-950/50 text-green-400 hover:bg-green-900/50' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Map Layer Switcher */}
      <div className={`absolute bottom-6 right-6 z-[1000] rounded-xl shadow-2xl p-2 ${
        isDark ? 'bg-black border border-green-900/50' : 'bg-white border border-gray-200'
      }`}>
        <div className="flex gap-2">
          {Object.entries(MAP_LAYERS).map(([key, layer]) => {
            const Icon = layer.icon;
            return (
              <button
                key={key}
                onClick={() => setMapLayer(key)}
                className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all ${
                  mapLayer === key
                    ? 'bg-green-500 text-white shadow-lg'
                    : isDark 
                      ? 'bg-green-950/50 text-green-400 hover:bg-green-900/50' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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

      {/* Custom CSS */}
      <style>{`
        .custom-tooltip {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .custom-tooltip::before {
          display: none !important;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 12px !important;
          padding: 0 !important;
          background: ${isDark ? '#000' : '#fff'} !important;
        }
        .leaflet-popup-content {
          margin: 0 !important;
        }
        .leaflet-popup-tip {
          background: ${isDark ? '#000' : '#fff'} !important;
        }
        .distance-label {
          background: transparent !important;
          border: none !important;
        }
      `}</style>
    </div>
  );
};

export default MapComponent;
