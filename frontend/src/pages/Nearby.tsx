import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, Search, Navigation, SlidersHorizontal, MessageSquare, 
  Star, RefreshCw, X, Radio, ArrowLeft, Layers, Compass,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useTheme } from '../hooks/useTheme';

// Mock Avatars
const MOCK_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=250',
];

interface Talent {
  id: string;
  name: string;
  category: string;
  profilePicture: string;
  distance: number;
  isOnline: boolean;
  rating: number;
  reviews: number;
  skills: string[];
  lat: number;
  lng: number;
}

interface GeocodeResult {
  display_name: string;
  lat: string;
  lon: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LeafletAny = any;

export default function Nearby() {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  // --- STATE ENGINE ---
  const [viewState, setViewState] = useState<'landing' | 'map'>('landing');
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied' | 'checking'>('checking');

  // --- SLIDESHOW STATE ---
  const [bgImageIndex, setBgImageIndex] = useState(0);
  const darkImages = ['/assets/nearby_hero_dark_wide.png', '/assets/nearby_hero_dark.png'];
  const lightImages = ['/assets/nearby_hero_light_wide.png', '/assets/nearby_hero_light.png'];
  const activeImages = isDarkMode ? darkImages : lightImages;

  useEffect(() => {
    if (viewState !== 'landing') return;
    const timer = setInterval(() => {
      setBgImageIndex((prev) => (prev + 1) % activeImages.length);
    }, 4500); // Crossfade every 4.5 seconds
    return () => clearInterval(timer);
  }, [viewState, activeImages.length, isDarkMode]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [addressName, setAddressName] = useState('Locating address...');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);

  // Filters
  const [radius, setRadius] = useState(15); // in km
  const [activeCategory, setActiveCategory] = useState('All');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [selectedTalent, setSelectedTalent] = useState<Talent | null>(null);

  // Leaflet Load State
  const [leafletLoaded, setLeafletLoaded] = useState(() => typeof window !== 'undefined' && !!(window as LeafletAny).L);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<LeafletAny>(null);
  const markersGroupRef = useRef<LeafletAny>(null);
  const userMarkerRef = useRef<LeafletAny>(null);
  const userCircleRef = useRef<LeafletAny>(null);
  const tileLayerRef = useRef<LeafletAny>(null);

  // Talents State
  const [talents, setTalents] = useState<Talent[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Mobile Bottom Sheet Snap State (framer-motion)
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);

  // Premium Features States
  const [activeLayer, setActiveLayer] = useState<'street' | 'satellite' | 'terrain'>('street');
  const [showLayerDropdown, setShowLayerDropdown] = useState(false);
  const activeRouteRef = useRef<LeafletAny>(null);

  // --- 1. DYNAMIC LEAFLET LOADER ---
  useEffect(() => {
    if ((window as LeafletAny).L) {
      return;
    }

    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(cssLink);

    const jsScript = document.createElement('script');
    jsScript.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    jsScript.onload = () => setLeafletLoaded(true);
    document.body.appendChild(jsScript);
  }, []);

  const fetchUserLocation = useCallback(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      () => {
        // Fallback default
        setUserLocation((prev) => {
          if (!prev) return { lat: 19.0760, lng: 72.8777 };
          return prev;
        });
      }
    );
  }, []);

  const requestPermission = () => {
    setPermissionStatus('checking');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setPermissionStatus('granted');
      },
      (error) => {
        console.error('Location error:', error);
        setPermissionStatus('denied');
        // Fallback default: Mumbai coordinates
        setUserLocation({ lat: 19.0760, lng: 72.8777 });
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // --- 2. LOCATION PERMISSION HANDLER ---
  useEffect(() => {
    let active = true;
    const checkPermission = async () => {
      // Force execution to be asynchronous to avoid React cascading render warnings
      await Promise.resolve();
      if (!active) return;

      if (navigator.permissions && navigator.permissions.query) {
        try {
          const result = await navigator.permissions.query({ name: 'geolocation' });
          if (active) {
            setPermissionStatus(result.state === 'granted' ? 'granted' : result.state === 'denied' ? 'denied' : 'prompt');
            if (result.state === 'granted' && viewState === 'map') {
              fetchUserLocation();
            }
          }
        } catch {
          if (active) {
            setPermissionStatus('prompt');
          }
        }
      } else {
        if (active) {
          setPermissionStatus('prompt');
        }
      }
    };

    checkPermission();

    return () => {
      active = false;
    };
  }, [fetchUserLocation, viewState]);

  // --- 3. REVERSE GEODECOING (Get address name) ---
  useEffect(() => {
    if (!userLocation) return;

    const getAddress = async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLocation.lat}&lon=${userLocation.lng}&zoom=14`
        );
        const data = await response.json();
        if (data && data.display_name) {
          const parts = data.display_name.split(',');
          // Extract city/suburb for cleaner name
          const shortAddress = parts.slice(0, 2).join(',').trim();
          setAddressName(shortAddress || 'Custom Location');
        } else {
          setAddressName('Custom Coordinates');
        }
      } catch {
        setAddressName(`${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`);
      }
    };
    getAddress();
  }, [userLocation]);

  // --- 4. MOCK DATA GENERATOR ENGINE ---
  useEffect(() => {
    if (!userLocation) return;

    const generateMockTalents = () => {
      const names = [
        'Aarav Patel', 'Priya Sharma', 'Ishaan Sen', 'Ananya Roy', 
        'Vikram Malhotra', 'Saira Khan', 'Rohan Das', 'Meera Rao', 
        'Arjun Verma', 'Aditi Kapoor', 'Kabir Nair', 'Zara Sheikh'
      ];
      const categories = ['Video Editor', 'VFX Artist', 'Cinematographer', 'Sound Designer', 'Colorist'];
      const skillPool: Record<string, string[]> = {
        'Video Editor': ['Premiere Pro', 'DaVinci Resolve', 'Final Cut', 'Storytelling', 'Sound Mix'],
        'VFX Artist': ['After Effects', 'Nuke', 'Blender', 'CGI Integration', 'Green Screen'],
        'Cinematographer': ['4K Shooting', 'Lighting Setup', 'Gimbal Rigging', 'Composition', 'Color Sync'],
        'Sound Designer': ['ProTools', 'Audio Restoration', 'Foley Capture', 'Spatial Audio', 'SFX Library'],
        'Colorist': ['DaVinci Resolve', 'HDR Grading', 'LUT Creation', 'Skin Tone Correction', 'ACES Workflow']
      };

      const mockData: Talent[] = names.map((name, index) => {
        const category = categories[index % categories.length];
        
        // Random offsets within 50km radius
        // 0.1 degrees difference is roughly 11.1km
        const angle = Math.random() * Math.PI * 2;
        // Distribute distance within current radius setting
        const distanceVal = 0.5 + Math.random() * (radius - 0.5);
        const latOffset = (distanceVal / 111.32) * Math.sin(angle);
        const lngOffset = (distanceVal / (111.32 * Math.cos(userLocation.lat * Math.PI / 180))) * Math.cos(angle);

        return {
          id: `talent_${index}`,
          name,
          category,
          profilePicture: MOCK_AVATARS[index % MOCK_AVATARS.length],
          distance: parseFloat(distanceVal.toFixed(1)),
          isOnline: Math.random() > 0.4,
          rating: parseFloat((4.5 + Math.random() * 0.5).toFixed(1)),
          reviews: Math.floor(5 + Math.random() * 45),
          skills: skillPool[category] || [],
          lat: userLocation.lat + latOffset,
          lng: userLocation.lng + lngOffset
        };
      });

      setTalents(mockData);
    };

    generateMockTalents();
  }, [userLocation, radius]);

  // --- 5. INITIALIZE MAP, USER MARKER & RANGE CIRCLE ---
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || !userLocation) return;
    const L = (window as LeafletAny).L;

    if (!mapInstance.current) {
      // Map instance setup
      mapInstance.current = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([userLocation.lat, userLocation.lng], 13);

      // Add Zoom Controls to bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(mapInstance.current);

      // Group for talent markers
      markersGroupRef.current = L.layerGroup().addTo(mapInstance.current);
    } else {
      // If map exists, pan to new coordinates
      mapInstance.current.setView([userLocation.lat, userLocation.lng]);
    }

    // Dynamic tile layer swap
    if (tileLayerRef.current) {
      mapInstance.current.removeLayer(tileLayerRef.current);
    }
    
    let tileUrl = '';
    let maxZoomVal = 20;
    if (activeLayer === 'satellite') {
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      maxZoomVal = 19;
    } else if (activeLayer === 'terrain') {
      tileUrl = 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
      maxZoomVal = 17;
    } else {
      tileUrl = isDarkMode
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
    }
    
    tileLayerRef.current = L.tileLayer(tileUrl, {
      maxZoom: maxZoomVal
    }).addTo(mapInstance.current);

    // Set or Update User Location Pin
    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
      userMarkerRef.current.unbindTooltip();
      userMarkerRef.current.bindTooltip('You are here (drag me!)', { 
        permanent: false, 
        direction: 'top', 
        className: isDarkMode 
          ? 'bg-[#0F0F10] border border-zinc-800 text-white text-[10px] rounded-lg px-2 py-1 shadow-xl' 
          : 'bg-white border border-zinc-200 text-zinc-950 text-[10px] rounded-lg px-2 py-1 shadow-xl' 
      });
    } else {
      const userIcon = L.divIcon({
        className: 'user-pulse-marker',
        html: `
          <div class="relative flex items-center justify-center">
            <div class="absolute w-8 h-8 rounded-full bg-[#FF3040]/30 animate-ping"></div>
            <div class="w-4 h-4 rounded-full bg-[#FF3040] border-2 border-white shadow-xl"></div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon, draggable: true })
        .addTo(mapInstance.current);

      userMarkerRef.current.on('dragend', (event: LeafletAny) => {
        const marker = event.target;
        const position = marker.getLatLng();
        setUserLocation({ lat: position.lat, lng: position.lng });
      });
      
      userMarkerRef.current.bindTooltip('You are here (drag me!)', { 
        permanent: false, 
        direction: 'top', 
        className: isDarkMode 
          ? 'bg-[#0F0F10] border border-zinc-800 text-white text-[10px] rounded-lg px-2 py-1 shadow-xl' 
          : 'bg-white border border-zinc-200 text-zinc-950 text-[10px] rounded-lg px-2 py-1 shadow-xl' 
      });
    }

    // Set or Update Radius Circle Overlay
    if (userCircleRef.current) {
      userCircleRef.current.setLatLng([userLocation.lat, userLocation.lng]);
      userCircleRef.current.setRadius(radius * 1000);
    } else {
      userCircleRef.current = L.circle([userLocation.lat, userLocation.lng], {
        color: '#FF3040',
        fillColor: '#FF3040',
        fillOpacity: 0.05,
        radius: radius * 1000,
        weight: 1.5,
        dashArray: '5, 5' // Elegant dashed line indicating search boundaries
      }).addTo(mapInstance.current);
    }

    // Auto-fit bounds to the circle area
    const bounds = userCircleRef.current.getBounds();
    mapInstance.current.fitBounds(bounds, { padding: [30, 30] });

  }, [leafletLoaded, userLocation, radius, isDarkMode, activeLayer]);

  // --- 6. UPDATE TALENT MAP PINS ---
  useEffect(() => {
    if (!leafletLoaded || !mapInstance.current || !markersGroupRef.current) return;
    const L = (window as LeafletAny).L;

    // Clear old markers
    markersGroupRef.current.clearLayers();

    // Add new markers for visible talents matching current category filters
    const filteredTalents = talents.filter(
      (t) => activeCategory === 'All' || t.category === activeCategory
    );

    filteredTalents.forEach((talent) => {
      const customIcon = L.divIcon({
        className: 'talent-avatar-marker',
        html: `
          <div class="relative group cursor-pointer">
            <div class="w-[38px] h-[38px] rounded-full border-[2.5px] ${selectedTalent?.id === talent.id ? 'border-[#FF3040] scale-110' : (isDarkMode ? 'border-zinc-800 bg-zinc-900' : 'border-white bg-white')} overflow-hidden shadow-2xl transition-all duration-300">
              <img src="${talent.profilePicture}" class="w-full h-full object-cover" />
            </div>
            <div class="absolute -bottom-0.5 -right-0.5 w-[11px] h-[11px] rounded-full border-2 ${isDarkMode ? 'border-black' : 'border-white'} ${talent.isOnline ? 'bg-[#22C55E]' : 'bg-zinc-500'}"></div>
          </div>
        `,
        iconSize: [38, 38],
        iconAnchor: [19, 19]
      });

      const marker = L.marker([talent.lat, talent.lng], { icon: customIcon })
        .addTo(markersGroupRef.current)
        .on('click', () => {
          setSelectedTalent(talent);
          mapInstance.current.flyTo([talent.lat - 0.005, talent.lng], 14, { duration: 1.5 });
          // Open bottom sheet on mobile if clicked
          setBottomSheetOpen(true);
        });

      // Bind tooltip for hover previews
      marker.bindTooltip(
        `<div class="flex flex-col gap-0.5"><span class="font-bold ${isDarkMode ? 'text-white' : 'text-zinc-950'} text-[11px]">${talent.name}</span><span class="${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'} text-[9px] uppercase tracking-wider font-semibold">${talent.category}</span></div>`,
        { 
          direction: 'top', 
          className: `border rounded-xl px-2.5 py-1.5 shadow-2xl opacity-95 ${isDarkMode ? 'bg-[#0F0F10] border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-950'}` 
        }
      );
    });
  }, [leafletLoaded, talents, activeCategory, selectedTalent, isDarkMode]);

  // --- 6a. DRAW DYNAMIC ANIMATED ROUTE POLYLINE PATH TO SELECTED TALENT ---
  useEffect(() => {
    if (!leafletLoaded || !mapInstance.current) return;
    const L = (window as LeafletAny).L;

    // Clear old route if exists
    if (activeRouteRef.current) {
      mapInstance.current.removeLayer(activeRouteRef.current);
      activeRouteRef.current = null;
    }

    if (!selectedTalent || !userLocation) return;

    // Draw realistic looking path (wavy intermediate curve points)
    const start: [number, number] = [userLocation.lat, userLocation.lng];
    const end: [number, number] = [selectedTalent.lat, selectedTalent.lng];
    
    // Calculate simulated intermediate street curve points
    const mid1: [number, number] = [
      userLocation.lat + (selectedTalent.lat - userLocation.lat) * 0.45 + (selectedTalent.lat > userLocation.lat ? 0.001 : -0.001),
      userLocation.lng + (selectedTalent.lng - userLocation.lng) * 0.25 - (selectedTalent.lng > userLocation.lng ? 0.001 : -0.001)
    ];
    const mid2: [number, number] = [
      userLocation.lat + (selectedTalent.lat - userLocation.lat) * 0.75 - (selectedTalent.lat > userLocation.lat ? 0.001 : -0.001),
      userLocation.lng + (selectedTalent.lng - userLocation.lng) * 0.85 + (selectedTalent.lng > userLocation.lng ? 0.001 : -0.001)
    ];

    const routeCoordinates = [start, mid1, mid2, end];

    // Create animated dash polyline
    activeRouteRef.current = L.polyline(routeCoordinates, {
      color: '#FF3040',
      weight: 3,
      opacity: 0.85,
      dashArray: '8, 8', // Dashed line styling
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(mapInstance.current);

    // Animate the route path offset
    let offset = 0;
    const animateInterval = setInterval(() => {
      offset = (offset + 1) % 16;
      if (activeRouteRef.current) {
        activeRouteRef.current.setStyle({
          dashOffset: `${-offset}`
        });
      }
    }, 100);

    return () => {
      clearInterval(animateInterval);
      if (activeRouteRef.current && mapInstance.current) {
        mapInstance.current.removeLayer(activeRouteRef.current);
        activeRouteRef.current = null;
      }
    };
  }, [leafletLoaded, selectedTalent, userLocation]);

  // --- 7. ADDRESS SEARCH (Nominatim Geocoding API) ---
  const handleAddressSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearchingAddress(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();
      if (data && data.length > 0) {
        setSearchResults(data);
        setShowSearchResults(true);
      } else {
        setSearchResults([]);
        alert('Location not found. Try search with city/suburb name.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearchingAddress(false);
    }
  };

  const handleSelectResult = (result: GeocodeResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    
    // Set map focus and location state
    setUserLocation({ lat, lng });
    setShowSearchResults(false);
    setSearchQuery('');
  };

  // --- 8. UTILITIES ---
  const getTravelTimes = (distance: number) => {
    const driveTime = Math.round((distance / 35) * 60) || 2;
    const walkTime = Math.round((distance / 5) * 60) || 5;
    return { driveTime, walkTime };
  };

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserLocation({ lat, lng });
        if (mapInstance.current) {
          mapInstance.current.flyTo([lat, lng], 14, { duration: 1.5 });
        }
      }, (err) => {
        console.error("GPS Locate failed:", err);
      });
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      // Re-trigger talent calculations
      if (userLocation) {
        setUserLocation({ ...userLocation });
      }
      setIsRefreshing(false);
    }, 1200);
  };

  const handleFocusTalent = (talent: Talent) => {
    setSelectedTalent(talent);
    if (mapInstance.current) {
      mapInstance.current.flyTo([talent.lat - 0.005, talent.lng], 14, { duration: 1.5 });
    }
  };

  const handleNextTalent = () => {
    if (!selectedTalent || filteredTalentsList.length === 0) return;
    const currentIndex = filteredTalentsList.findIndex(t => t.id === selectedTalent.id);
    const nextIndex = (currentIndex + 1) % filteredTalentsList.length;
    handleFocusTalent(filteredTalentsList[nextIndex]);
  };

  const handlePrevTalent = () => {
    if (!selectedTalent || filteredTalentsList.length === 0) return;
    const currentIndex = filteredTalentsList.findIndex(t => t.id === selectedTalent.id);
    const prevIndex = (currentIndex - 1 + filteredTalentsList.length) % filteredTalentsList.length;
    handleFocusTalent(filteredTalentsList[prevIndex]);
  };

  const filteredTalentsList = talents.filter(
    (t) => activeCategory === 'All' || t.category === activeCategory
  );

  // Categories list
  const CATEGORIES = ['All', 'Video Editor', 'VFX Artist', 'Cinematographer', 'Sound Designer', 'Colorist'];

  // --- RENDER LANDING PAGE ---
  if (viewState === 'landing') {
    return (
      <div className={`h-full w-full overflow-y-auto scrollbar-hide flex flex-col items-center pb-20 transition-colors duration-300 ${isDarkMode ? 'bg-black text-white' : 'bg-zinc-50 text-zinc-950'}`}>
        {/* Header Action */}
        <div className="w-full absolute top-4 left-4 z-10">
          <button 
            onClick={() => navigate('/home')}
            className={`w-10 h-10 rounded-2xl backdrop-blur-md border flex items-center justify-center active:scale-90 shadow-xl transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-black/80 border-[#1A1A1B] text-white hover:text-[#FF3040]' 
                : 'bg-white/90 border-zinc-200 text-zinc-950 hover:text-[#FF3040]'
            }`}
          >
            <ArrowLeft size={16} />
          </button>
        </div>

        {/* Hero Image */}
        <div className={`w-full relative overflow-hidden shrink-0 h-[350px] md:h-[450px] flex justify-center items-center ${isDarkMode ? 'bg-black' : 'bg-zinc-100'}`}>
          {/* Slideshow Images */}
          {activeImages.map((src, idx) => (
            <img 
              key={src}
              src={src} 
              alt="Nearby Creators Network" 
              className={`absolute inset-0 w-full h-full object-cover z-10 transition-opacity duration-[1500ms] ease-in-out ${
                idx === bgImageIndex ? 'opacity-85' : 'opacity-0'
              }`}
            />
          ))}
          
          {/* Gradient Overlay for Text Readability */}
          <div className={`absolute inset-0 z-20 bg-gradient-to-t ${isDarkMode ? 'from-black via-black/40 to-transparent' : 'from-zinc-50 via-zinc-50/40 to-transparent'}`} />
          
          <div className="absolute bottom-8 left-6 right-6 lg:left-12 z-30">
            <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-2 max-w-2xl">Discover the Local Creator Network.</h1>
            <p className={`text-sm md:text-base max-w-lg ${isDarkMode ? 'text-zinc-300' : 'text-zinc-600'}`}>
              Connect with verified YouTube creators, top-tier video editors, and VFX artists in your city.
            </p>
          </div>
        </div>

        {/* Intent Selection */}
        <div className="w-full max-w-5xl px-6 lg:px-12 mt-8 flex flex-col gap-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-[#FF3040]">What are you looking for?</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {CATEGORIES.filter(c => c !== 'All').map(cat => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  setViewState('map');
                  if (permissionStatus === 'prompt') {
                    requestPermission();
                  } else if (permissionStatus === 'granted') {
                    fetchUserLocation();
                  }
                }}
                className={`p-5 rounded-3xl border flex flex-col items-start gap-4 text-left transition-all hover:scale-[1.02] active:scale-95 shadow-lg ${
                  isDarkMode 
                    ? 'bg-zinc-900/30 border-[#1A1A1B] hover:border-[#FF3040]/50 hover:bg-[#FF3040]/5' 
                    : 'bg-white border-zinc-200 hover:border-[#FF3040]/50 hover:bg-[#FF3040]/5'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-[#FF3040]/10 flex items-center justify-center text-[#FF3040]">
                  <Search size={20} />
                </div>
                <div>
                  <h3 className={`text-lg font-bold mb-0.5 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Find {cat}s</h3>
                  <p className={`text-[11px] leading-tight ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Search the map for local professionals.</p>
                </div>
              </button>
            ))}
            
            {/* "Explore All" card */}
            <button
              onClick={() => {
                setActiveCategory('All');
                setViewState('map');
                if (permissionStatus === 'prompt') {
                  requestPermission();
                } else if (permissionStatus === 'granted') {
                  fetchUserLocation();
                }
              }}
              className={`p-5 rounded-3xl border flex flex-col items-start gap-4 text-left transition-all hover:scale-[1.02] active:scale-95 shadow-lg ${
                isDarkMode 
                  ? 'bg-zinc-900/30 border-[#1A1A1B] hover:border-zinc-700 hover:bg-zinc-800/50' 
                  : 'bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDarkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-100 text-zinc-600'}`}>
                <Compass size={20} />
              </div>
              <div>
                <h3 className={`text-lg font-bold mb-0.5 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Explore All</h3>
                <p className={`text-[11px] leading-tight ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>View everyone around you on the radar.</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER ONBOARDING/RADAR IF PERMISSION NOT GRANTED ---
  if (permissionStatus === 'checking') {
    return (
      <div className={`h-screen w-full flex flex-col items-center justify-center transition-colors duration-300 ${isDarkMode ? 'bg-black text-white' : 'bg-zinc-50 text-zinc-950'}`}>
        <RefreshCw className="w-8 h-8 text-[#FF3040] animate-spin mb-4" />
        <span className={`text-[12px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>Checking Geolocation State...</span>
      </div>
    );
  }

  if (permissionStatus === 'prompt' || permissionStatus === 'denied') {
    return (
      <div className={`relative h-screen w-full overflow-hidden flex flex-col items-center justify-center p-4 transition-colors duration-300 ${isDarkMode ? 'bg-black' : 'bg-zinc-50'}`}>
        {/* Animated Background Radar Ring */}
        <div className={`absolute inset-0 flex items-center justify-center pointer-events-none opacity-20`}>
          <div className="w-[180px] h-[180px] rounded-full border border-[#FF3040] animate-[ping_3s_infinite]" />
          <div className="absolute w-[360px] h-[360px] rounded-full border border-[#FF3040]/50 animate-[ping_4.5s_infinite]" />
          <div className="absolute w-[560px] h-[560px] rounded-full border border-[#FF3040]/30 animate-[ping_6s_infinite]" />
        </div>

        {/* glassmorphic permissions card */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className={`relative max-w-sm w-full backdrop-blur-2xl border rounded-3xl p-6 text-center flex flex-col items-center z-10 ${
            isDarkMode 
              ? 'bg-zinc-950/80 border-zinc-900 text-white shadow-[0_20px_50px_rgba(0,0,0,0.8)]' 
              : 'bg-white/80 border-zinc-200 text-zinc-950 shadow-xl'
          }`}
        >
          <div className="w-14 h-14 bg-[#FF3040]/10 border border-[#FF3040]/20 rounded-2xl flex items-center justify-center text-[#FF3040] mb-5">
            <Compass size={28} className="animate-pulse" />
          </div>
          
          <h2 className={`text-xl font-bold tracking-tight mb-2 ${isDarkMode ? 'text-white' : 'text-zinc-950'}`}>Find Local Collaborators</h2>
          
          <p className={`text-[12px] font-medium leading-relaxed mb-6 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
            {permissionStatus === 'denied' 
              ? 'Access to location was blocked. You can still search for creative talent using standard search bar fallbacks.'
              : 'Discover editors, VFX artists, and cinematographers working around you. Optimize workflow and collaborate in real-time.'
            }
          </p>

          {permissionStatus === 'denied' ? (
            <button
              onClick={() => setPermissionStatus('granted')} // Override with defaults
              className="w-full h-11 bg-[#FF3040] rounded-xl text-white text-[11px] font-bold flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all shadow-lg shadow-[#FF3040]/20 hover:bg-[#E02434]"
            >
              <Search size={14} />
              Use Default Location
            </button>
          ) : (
            <button
              onClick={requestPermission}
              className="w-full h-11 bg-[#FF3040] rounded-xl text-white text-[11px] font-bold flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all shadow-lg shadow-[#FF3040]/20 hover:bg-[#E02434]"
            >
              <Navigation size={14} />
              Enable Nearby Search
            </button>
          )}

          <button 
            onClick={() => navigate('/home')}
            className={`mt-4 text-[10px] font-bold uppercase tracking-widest transition-colors cursor-pointer ${
              isDarkMode ? 'text-zinc-500 hover:text-white' : 'text-zinc-400 hover:text-zinc-950'
            }`}
          >
            Back to Home
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`h-full w-full flex flex-col overflow-hidden relative select-none transition-colors duration-300 ${isDarkMode ? 'bg-black text-white' : 'bg-zinc-50 text-zinc-950'}`}>
      
      {/* ─────────────────────────────────────────────────────────────
          SPLIT SCREEN LAYOUT
      ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* ── LEFT PANEL: FILTERS & TALENT LIST (Desktop Only) ── */}
        <div className={`hidden lg:flex flex-col w-[390px] xl:w-[430px] border-r shrink-0 relative h-full transition-colors duration-300 ${isDarkMode ? 'border-[#1A1A1B] bg-black' : 'border-zinc-200 bg-white'}`}>
          
          {/* Header & Back Action */}
          <div className={`px-5 pt-4 pb-3 border-b transition-colors duration-300 ${isDarkMode ? 'border-[#1A1A1B]' : 'border-zinc-200'}`}>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate('/home')}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-90 ${isDarkMode ? 'bg-[#0B0B0B] border border-[#1A1A1B] text-zinc-400 hover:text-white' : 'bg-zinc-100 border border-zinc-200 text-zinc-600 hover:text-zinc-950'}`}
              >
                <ArrowLeft size={14} />
              </button>
              <div className="flex flex-col min-w-0">
                <span className={`text-[13px] font-bold leading-tight ${isDarkMode ? 'text-white' : 'text-zinc-950'}`}>Nearby Discovery</span>
                <span className={`text-[10px] font-semibold line-clamp-1 mt-0.5 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>{addressName}</span>
              </div>
            </div>
          </div>

          {/* Search Panel */}
          <div className={`p-4 border-b relative transition-colors duration-300 ${isDarkMode ? 'border-[#1A1A1B]' : 'border-zinc-200'}`}>
            <form onSubmit={handleAddressSearch} className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search city, state, or area..."
                className={`w-full h-9 text-[13px] rounded-full pl-9 pr-10 focus:outline-none focus:ring-2 focus:ring-[#FF3040]/20 focus:border-[#FF3040]/40 transition-colors duration-300 border ${
                  isDarkMode 
                    ? 'bg-white/90 border-zinc-200 text-black placeholder-zinc-500' 
                    : 'bg-black border-zinc-950 text-white placeholder-zinc-500'
                }`}
              />
              <Search size={14} className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-300 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`} />
              {isSearchingAddress ? (
                <RefreshCw size={13} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 animate-spin" />
              ) : searchQuery && (
                <button 
                  type="button" 
                  onClick={() => setSearchQuery('')}
                  className={`absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors ${isDarkMode ? 'text-zinc-500 hover:text-zinc-900' : 'text-zinc-400 hover:text-white'}`}
                >
                  <X size={13} />
                </button>
              )}
            </form>

            {/* Nominatim Search Dropdown Suggestions */}
            <AnimatePresence>
              {showSearchResults && searchResults.length > 0 && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowSearchResults(false)} />
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className={`absolute left-4 right-4 top-16 rounded-2xl p-1.5 shadow-2xl max-h-56 overflow-y-auto scrollbar-hide z-40 transition-colors duration-300 ${
                      isDarkMode ? 'bg-[#0B0B0B] border border-[#1A1A1B]' : 'bg-white border border-zinc-250'
                    }`}
                  >
                    {searchResults.map((res, index) => (
                      <button
                        key={index}
                        onClick={() => handleSelectResult(res)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-[11px] transition-all truncate last:border-b-0 cursor-pointer flex items-center gap-2 ${
                          isDarkMode 
                            ? 'text-zinc-400 hover:text-white hover:bg-white/5 border-b border-[#1A1A1B]/5' 
                            : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50 border-b border-zinc-100'
                        }`}
                      >
                        <MapPin size={11} className="text-[#FF3040]" />
                        {res.display_name}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Filters (Radius slider & Category chips) */}
          <div className={`px-5 py-4 border-b flex flex-col gap-4 transition-colors duration-300 ${isDarkMode ? 'border-[#1A1A1B]' : 'border-zinc-200'}`}>
            {/* Radius Slider */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider">
                <span className={isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}>Discovery Range</span>
                <span className={`font-black ${isDarkMode ? 'text-white' : 'text-zinc-950'}`}>{radius} km</span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                step="5"
                value={radius}
                onChange={(e) => setRadius(parseInt(e.target.value))}
                className={`w-full accent-[#FF3040] h-1 rounded-lg appearance-none cursor-pointer ${isDarkMode ? 'bg-[#1A1A1B]' : 'bg-zinc-200'}`}
              />
            </div>

            {/* Category selection row */}
            <div className="flex flex-wrap gap-2 pt-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                    activeCategory === cat 
                      ? 'bg-[#FF3040] text-white shadow-sm' 
                      : (isDarkMode ? 'bg-[#0B0B0B] border border-[#1A1A1B] text-zinc-400 hover:text-white' : 'bg-zinc-100 border border-zinc-200 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-950')
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* List Results */}
          <div className="flex-1 overflow-y-auto scrollbar-hide p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between px-1 mb-1">
              <span className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                Talents in range ({filteredTalentsList.length})
              </span>
              <button 
                onClick={handleRefresh}
                className={`cursor-pointer active:scale-95 transition-all ${isDarkMode ? 'text-zinc-500 hover:text-white' : 'text-zinc-400 hover:text-zinc-900'}`}
              >
                <RefreshCw size={11} className={isRefreshing ? 'animate-spin text-[#FF3040]' : ''} />
              </button>
            </div>

            {filteredTalentsList.length > 0 ? (
              filteredTalentsList.map((talent) => (
                <motion.div
                  key={talent.id}
                  onClick={() => handleFocusTalent(talent)}
                  className={`p-3 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col gap-3 relative ${
                    selectedTalent?.id === talent.id 
                      ? (isDarkMode ? 'bg-[#0B0B0B] border-[#FF3040]/40' : 'bg-zinc-50 border-[#FF3040]/40 shadow-sm') 
                      : (isDarkMode ? 'bg-[#0A0A0B] border-[#1A1A1B] hover:border-zinc-800' : 'bg-white border-zinc-200 hover:border-zinc-350 shadow-sm')
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <img src={talent.profilePicture} alt={talent.name} className={`w-[42px] h-[42px] rounded-full object-cover border ${isDarkMode ? 'border-[#1A1A1B]' : 'border-zinc-200'}`} />
                      <div className={`absolute -bottom-0.5 -right-0.5 w-[11px] h-[11px] rounded-full border-2 ${isDarkMode ? 'border-black' : 'border-white'} ${talent.isOnline ? 'bg-[#22C55E]' : 'bg-zinc-500'}`} />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[12px] font-bold leading-tight truncate ${isDarkMode ? 'text-white' : 'text-zinc-950'}`}>{talent.name}</span>
                        <div className="flex items-center gap-0.5 text-yellow-500 shrink-0">
                          <Star size={10} fill="currentColor" />
                          <span className={`text-[10px] font-bold ${isDarkMode ? 'text-zinc-300' : 'text-zinc-600'}`}>{talent.rating}</span>
                        </div>
                      </div>
                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mt-0.5 block">{talent.category}</span>
                      <span className="text-[10px] font-semibold text-[#FF3040] mt-1.5 block">{talent.distance} km away</span>
                    </div>
                  </div>

                  {/* Skills Grid */}
                  <div className="flex flex-wrap gap-1">
                    {talent.skills.slice(0, 3).map((s) => (
                      <span 
                        key={s} 
                        className={`px-2 py-0.5 rounded-md text-[8px] font-bold border transition-colors duration-300 ${
                          isDarkMode 
                            ? 'bg-[#0B0B0B] border-[#1A1A1B]/50 text-zinc-400' 
                            : 'bg-zinc-150 border-zinc-200 text-zinc-650'
                        }`}
                      >
                        {s}
                      </span>
                    ))}
                  </div>

                  {/* Highlight bar */}
                  {selectedTalent?.id === talent.id && (
                    <div className="absolute left-0 top-3 bottom-3 w-1 bg-[#FF3040] rounded-r-full" />
                  )}
                </motion.div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center gap-2">
                <Compass size={24} className={`animate-spin ${isDarkMode ? 'text-zinc-600' : 'text-zinc-400'}`} />
                <span className={`text-[11px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-zinc-500' : 'text-zinc-405'}`}>No talent found in radius</span>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL: MAP CONTAINER (Desktop & Mobile) ── */}
        <div className="flex-1 h-full relative">
          
          {/* Leaflet Map Div */}
          <div ref={mapRef} className="w-full h-full z-0" />

          {/* Floating Actions on Map (Back, Refresh, Filters for Mobile) */}
          <div className="absolute top-4 left-4 z-10 flex flex-col gap-3">
            {/* Back button (Mobile view only) */}
            <button 
              onClick={() => navigate('/home')}
              className={`lg:hidden w-10 h-10 rounded-2xl backdrop-blur-md border flex items-center justify-center active:scale-90 shadow-xl transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-black/80 border-[#1A1A1B] text-white' 
                  : 'bg-white/90 border-zinc-200 text-zinc-950'
              }`}
            >
              <ArrowLeft size={16} />
            </button>

            {/* Address Name Overlay */}
            <div className={`backdrop-blur-md border rounded-2xl px-4 py-2 flex items-center gap-2 shadow-xl transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-black/80 border-[#1A1A1B] text-white' 
                : 'bg-white/90 border-zinc-200 text-zinc-950'
            }`}>
              <MapPin size={13} className="text-[#FF3040]" />
              <span className={`text-[11px] font-bold max-w-[140px] md:max-w-xs truncate ${isDarkMode ? 'text-white' : 'text-zinc-950'}`}>{addressName}</span>
            </div>
          </div>

          {/* Floating Action Buttons */}
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            {/* Layer switcher button */}
            <div className="relative">
              <button 
                onClick={() => setShowLayerDropdown(!showLayerDropdown)}
                className={`w-10 h-10 rounded-2xl backdrop-blur-md border flex items-center justify-center active:scale-90 shadow-xl transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-black/80 border-[#1A1A1B] text-white' 
                    : 'bg-white/90 border-zinc-200 text-zinc-950'
                }`}
                title="Change Map Style"
              >
                <Layers size={14} />
              </button>

              <AnimatePresence>
                {showLayerDropdown && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setShowLayerDropdown(false)} />
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className={`absolute right-0 mt-2 w-32 rounded-2xl p-1.5 shadow-2xl z-30 flex flex-col gap-1 border transition-colors duration-300 ${
                        isDarkMode ? 'bg-[#0B0B0B] border-[#1A1A1B] text-white' : 'bg-white border-zinc-200 text-zinc-950'
                      }`}
                    >
                      {([
                        { id: 'street', label: 'Default Map', icon: Compass },
                        { id: 'satellite', label: 'Satellite', icon: Radio },
                        { id: 'terrain', label: 'Terrain', icon: MapPin }
                      ] as const).map((layerOpt) => (
                        <button
                          type="button"
                          key={layerOpt.id}
                          onClick={() => {
                            setActiveLayer(layerOpt.id);
                            setShowLayerDropdown(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-2 cursor-pointer transition-all ${
                            activeLayer === layerOpt.id
                              ? 'bg-[#FF3040] text-white shadow-sm'
                              : (isDarkMode ? 'hover:bg-white/5 text-zinc-400' : 'hover:bg-zinc-50 text-zinc-650')
                          }`}
                        >
                          <layerOpt.icon size={11} />
                          {layerOpt.label}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <button 
              onClick={handleRefresh}
              className={`w-10 h-10 rounded-2xl backdrop-blur-md border flex items-center justify-center active:scale-90 shadow-xl transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-black/80 border-[#1A1A1B] text-white' 
                  : 'bg-white/90 border-zinc-200 text-zinc-950'
              }`}
              title="Refresh Nearby Search"
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-[#FF3040]' : ''} />
            </button>

            {/* Filters trigger button (Mobile only) */}
            <button 
              onClick={() => setShowMobileFilters(true)}
              className={`lg:hidden w-10 h-10 rounded-2xl backdrop-blur-md border flex items-center justify-center active:scale-90 shadow-xl transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-black/80 border-[#1A1A1B] text-white' 
                  : 'bg-white/90 border-zinc-200 text-zinc-950'
              }`}
              title="Filter Search"
            >
              <SlidersHorizontal size={14} />
            </button>
          </div>

          {/* GPS Locate Me Button */}
          <div className="absolute bottom-6 right-4 z-10">
            <button 
              onClick={handleLocateMe}
              className={`w-10 h-10 rounded-2xl backdrop-blur-md border flex items-center justify-center active:scale-90 shadow-xl transition-all duration-300 ${
                isDarkMode 
                  ? 'bg-black/80 border-[#1A1A1B] text-white hover:text-[#FF3040]' 
                  : 'bg-white/90 border-zinc-200 text-zinc-950 hover:text-[#FF3040]'
              }`}
              title="Center to my GPS Location"
            >
              <Navigation size={14} className="rotate-45" />
            </button>
          </div>

          {/* Mini-Popup Card overlay at bottom of screen on Desktop when talent selected */}
          {selectedTalent && (
            <div className={`hidden lg:block absolute bottom-6 left-6 w-[280px] backdrop-blur-2xl border rounded-2xl p-4 shadow-2xl z-10 transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-zinc-950/95 border-[#1A1A1B] text-white' 
                : 'bg-white/95 border-zinc-200 text-zinc-950'
            }`}>
              <button 
                onClick={() => setSelectedTalent(null)}
                className={`absolute top-3 right-3 text-zinc-500 ${isDarkMode ? 'hover:text-white' : 'hover:text-zinc-900'}`}
              >
                <X size={14} />
              </button>
              
              <div className="flex items-center gap-3">
                <img src={selectedTalent.profilePicture} alt={selectedTalent.name} className={`w-11 h-11 rounded-full object-cover border ${isDarkMode ? 'border-[#1A1A1B]' : 'border-zinc-200'}`} />
                <div className="min-w-0 flex-1">
                  <span className={`text-[12px] font-bold leading-tight block truncate ${isDarkMode ? 'text-white' : 'text-zinc-950'}`}>{selectedTalent.name}</span>
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block mt-0.5">{selectedTalent.category}</span>
                </div>
              </div>

              {/* Travel Times estimates */}
              <div className={`flex items-center gap-3 mt-2.5 py-1 px-2 rounded-xl border text-[9px] font-bold ${
                isDarkMode ? 'bg-[#0B0B0B] border-[#1A1A1B] text-zinc-400' : 'bg-zinc-50 border-zinc-200 text-zinc-655'
              }`}>
                <span className="flex items-center gap-1">🚗 {getTravelTimes(selectedTalent.distance).driveTime} min</span>
                <span className="flex items-center gap-1">🏃 {getTravelTimes(selectedTalent.distance).walkTime} min</span>
              </div>

              <div className="flex items-center justify-between mt-3.5 pt-2 border-t border-zinc-200 dark:border-[#1A1A1B]/50">
                <span className="text-[10px] font-bold text-[#FF3040]">{selectedTalent.distance} km away</span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => navigate(`/profile`)} // Dynamic routing later
                    className={`px-2.5 h-[24px] rounded-lg border text-[9px] font-bold active:scale-95 ${
                      isDarkMode 
                        ? 'bg-[#0B0B0B] border-[#1A1A1B] text-white hover:bg-zinc-900' 
                        : 'bg-zinc-100 border-zinc-200 text-zinc-800 hover:bg-zinc-200'
                    }`}
                  >
                    View
                  </button>
                  <button 
                    onClick={() => alert(`Redirecting to chat with ${selectedTalent.name}`)}
                    className="px-2.5 h-[24px] rounded-lg bg-[#FF3040] text-white text-[9px] font-bold flex items-center gap-1 active:scale-95"
                  >
                    <MessageSquare size={8} />
                    Chat
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MOBILE BOTTOM SHEET (Interactive Slide-up)
      ───────────────────────────────────────────────────────────── */}
      {!selectedTalent && (
        <div className="lg:hidden absolute bottom-24 left-0 right-0 z-20 pointer-events-none flex flex-col items-center">
          {/* Toggle pull tab */}
          <button
            onClick={() => setBottomSheetOpen(!bottomSheetOpen)}
            className={`w-12 h-6 rounded-t-xl border-t border-l border-r flex items-center justify-center pointer-events-auto active:scale-95 transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-[#0B0B0B] border-[#1A1A1B] text-zinc-500 hover:text-white' 
                : 'bg-white border-zinc-200 text-zinc-400 hover:text-zinc-700'
            }`}
          >
            <div className={`w-6 h-1 rounded-full ${isDarkMode ? 'bg-zinc-700' : 'bg-zinc-300'}`} />
          </button>

          {/* Sliding Panel */}
          <AnimatePresence>
            {bottomSheetOpen && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 360 }}
                exit={{ height: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className={`w-full border-t pointer-events-auto flex flex-col overflow-hidden px-4 pt-3 transition-colors duration-300 shadow-[0_-10px_25px_rgba(0,0,0,0.3)] ${
                  isDarkMode ? 'bg-[#0B0B0B] border-[#1A1A1B]' : 'bg-white border-zinc-200'
                }`}
              >
                {/* Active Category Chips */}
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 shrink-0">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-[9px] font-bold transition-all shrink-0 cursor-pointer ${
                        activeCategory === cat 
                          ? 'bg-[#FF3040] text-white' 
                          : (isDarkMode ? 'bg-black border border-[#1A1A1B] text-zinc-400' : 'bg-zinc-100 border border-zinc-200 text-zinc-650 hover:bg-zinc-200 hover:text-zinc-950')
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Talent Cards Horizontal Scroll or Vertical List */}
                <div className="flex-1 overflow-y-auto scrollbar-hide pb-5 flex flex-col gap-2 mt-2">
                  {filteredTalentsList.length > 0 ? (
                    filteredTalentsList.map((talent) => (
                      <div
                        key={talent.id}
                        onClick={() => handleFocusTalent(talent)}
                        className={`p-3 rounded-xl border flex items-center gap-3 active:scale-98 transition-all ${
                          (selectedTalent as LeafletAny)?.id === talent.id 
                            ? (isDarkMode ? 'bg-[#0B0B0B] border-[#FF3040]' : 'bg-zinc-50 border-[#FF3040]') 
                            : (isDarkMode ? 'bg-black border-[#1A1A1B]' : 'bg-white border-zinc-200 shadow-sm')
                        }`}
                      >
                        <img src={talent.profilePicture} alt={talent.name} className="w-[36px] h-[36px] rounded-full object-cover shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className={`text-[11px] font-bold truncate block ${isDarkMode ? 'text-white' : 'text-zinc-950'}`}>{talent.name}</span>
                          <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider block mt-0.5">{talent.category}</span>
                          <span className="text-[9px] font-semibold text-[#FF3040] mt-1 block">{talent.distance} km away</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button 
                            onClick={(e) => { e.stopPropagation(); navigate('/profile'); }}
                            className={`px-2 h-6 rounded-lg border text-[8px] font-bold ${
                              isDarkMode 
                                ? 'bg-black border-[#1A1A1B] text-white hover:bg-zinc-900' 
                                : 'bg-zinc-100 border-zinc-200 text-zinc-800 hover:bg-zinc-200'
                            }`}
                          >
                            View
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); alert(`Chat with ${talent.name}`); }}
                            className="px-2 h-6 rounded-lg bg-[#FF3040] text-white text-[8px] font-bold flex items-center gap-0.5"
                          >
                            <MessageSquare size={7} />
                            Chat
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center gap-1.5">
                      <Compass size={20} className={`animate-pulse ${isDarkMode ? 'text-zinc-650' : 'text-zinc-400'}`} />
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>No talent matching query</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── MOBILE HORIZONTAL TALENT CARD CAROUSEL (Airbnb style overlay) ── */}
      <AnimatePresence>
        {selectedTalent && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`lg:hidden absolute bottom-28 left-4 right-4 z-20 p-4 rounded-3xl border shadow-2xl flex flex-col gap-3 pointer-events-auto transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-zinc-950/95 border-[#1A1A1B] text-white shadow-[0_15px_30px_rgba(0,0,0,0.8)]' 
                : 'bg-white/95 border-zinc-200 text-zinc-950 shadow-xl'
            }`}
          >
            <button 
              onClick={() => setSelectedTalent(null)}
              className={`absolute top-3.5 right-3.5 text-zinc-500 ${isDarkMode ? 'hover:text-white' : 'hover:text-zinc-900'}`}
              title="Close Panel"
            >
              <X size={16} />
            </button>

            {/* Left and Right Nav chevrons overlaying details */}
            <div className="relative flex items-center gap-2 pr-6">
              {filteredTalentsList.length > 1 && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col gap-2">
                  <button 
                    onClick={handlePrevTalent}
                    className={`w-6 h-6 rounded-full border flex items-center justify-center active:scale-90 transition-all ${
                      isDarkMode ? 'bg-[#0B0B0B] border-[#1A1A1B] text-zinc-400' : 'bg-zinc-100 border-zinc-200 text-zinc-650'
                    }`}
                  >
                    <ChevronLeft size={10} />
                  </button>
                  <button 
                    onClick={handleNextTalent}
                    className={`w-6 h-6 rounded-full border flex items-center justify-center active:scale-90 transition-all ${
                      isDarkMode ? 'bg-[#0B0B0B] border-[#1A1A1B] text-zinc-400' : 'bg-zinc-100 border-zinc-200 text-zinc-650'
                    }`}
                  >
                    <ChevronRight size={10} />
                  </button>
                </div>
              )}

              <div className="relative shrink-0">
                <img src={selectedTalent.profilePicture} alt={selectedTalent.name} className={`w-[48px] h-[48px] rounded-full object-cover border ${isDarkMode ? 'border-[#1A1A1B]' : 'border-zinc-200'}`} />
                <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 ${isDarkMode ? 'border-zinc-950' : 'border-white'} ${selectedTalent.isOnline ? 'bg-[#22C55E]' : 'bg-zinc-500'}`} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className={`text-[13px] font-bold leading-tight truncate ${isDarkMode ? 'text-white' : 'text-zinc-950'}`}>{selectedTalent.name}</span>
                  <div className="flex items-center gap-0.5 text-yellow-500 shrink-0">
                    <Star size={11} fill="currentColor" />
                    <span className={`text-[10px] font-bold ${isDarkMode ? 'text-zinc-350' : 'text-zinc-650'}`}>{selectedTalent.rating}</span>
                  </div>
                </div>
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block mt-0.5">{selectedTalent.category}</span>
                <span className="text-[10px] font-semibold text-[#FF3040] mt-1 block">{selectedTalent.distance} km away</span>
              </div>
            </div>

            {/* Travel Times & Actions */}
            <div className="flex items-center justify-between border-t pt-3 mt-1 transition-colors duration-300 border-zinc-200 dark:border-[#1A1A1B]/50">
              <div className={`flex items-center gap-2 px-2 py-1 rounded-lg border text-[9px] font-bold ${
                isDarkMode ? 'bg-[#0B0B0B] border-[#1A1A1B] text-zinc-400' : 'bg-zinc-50 border-zinc-200 text-zinc-600'
              }`}>
                <span>🚗 {getTravelTimes(selectedTalent.distance).driveTime} min</span>
                <span>🏃 {getTravelTimes(selectedTalent.distance).walkTime} min</span>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => navigate('/profile')}
                  className={`px-3 h-8 rounded-xl border text-[10px] font-bold ${
                    isDarkMode 
                      ? 'bg-black border-[#1A1A1B] text-white hover:bg-zinc-900' 
                      : 'bg-zinc-100 border-zinc-200 text-zinc-800 hover:bg-zinc-200'
                  }`}
                >
                  View
                </button>
                <button 
                  onClick={() => alert(`Chat with ${selectedTalent.name}`)}
                  className="px-3 h-8 rounded-xl bg-[#FF3040] text-white text-[10px] font-bold flex items-center gap-1 active:scale-95"
                >
                  <MessageSquare size={10} />
                  Chat
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
          MOBILE SEARCH & FILTER PANEL OVERLAY
      ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showMobileFilters && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 backdrop-blur-2xl z-50 p-6 flex flex-col gap-6 transition-colors duration-300 ${
              isDarkMode ? 'bg-black/90 text-white' : 'bg-white/95 text-zinc-950 shadow-2xl'
            }`}
          >
            <div className={`flex items-center justify-between border-b pb-4 transition-colors duration-300 ${isDarkMode ? 'border-[#1A1A1B]' : 'border-zinc-200'}`}>
              <span className={`text-[13px] font-bold ${isDarkMode ? 'text-white' : 'text-zinc-950'}`}>Search Filters</span>
              <button 
                onClick={() => setShowMobileFilters(false)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isDarkMode 
                    ? 'bg-[#0B0B0B] border border-[#1A1A1B] text-zinc-400 hover:text-white' 
                    : 'bg-zinc-100 border border-zinc-200 text-zinc-600 hover:text-zinc-950'
                }`}
              >
                <X size={14} />
              </button>
            </div>

            {/* Address Search */}
            <div className="flex flex-col gap-2">
              <span className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>Search Area</span>
              <form onSubmit={(e) => { handleAddressSearch(e); setShowMobileFilters(false); }} className="relative w-full">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type city, state, or location..."
                  className={`w-full h-9 text-[13px] rounded-full pl-9 pr-10 focus:outline-none focus:ring-2 focus:ring-[#FF3040]/20 focus:border-[#FF3040]/40 transition-colors duration-300 border ${
                    isDarkMode 
                      ? 'bg-white/90 border-zinc-200 text-black placeholder-zinc-500' 
                      : 'bg-black border-zinc-950 text-white placeholder-zinc-500'
                  }`}
                />
                <Search size={14} className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-300 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`} />
              </form>
            </div>

            {/* Radius Slider */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider">
                <span className={isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}>Discovery Range</span>
                <span className={`font-black ${isDarkMode ? 'text-white' : 'text-zinc-950'}`}>{radius} km</span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                step="5"
                value={radius}
                onChange={(e) => setRadius(parseInt(e.target.value))}
                className={`w-full accent-[#FF3040] h-1 rounded-lg appearance-none cursor-pointer ${isDarkMode ? 'bg-[#1A1A1B]' : 'bg-zinc-200'}`}
              />
            </div>

            <button
              onClick={() => setShowMobileFilters(false)}
              className="mt-auto w-full h-11 bg-[#FF3040] rounded-xl text-white text-[11px] font-bold flex items-center justify-center hover:bg-[#E02434]"
            >
              Apply Filters
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
