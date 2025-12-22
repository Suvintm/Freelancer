import { useState, useEffect } from "react";
import MapComponent from "../components/MapComponent";
import DesktopSidebar from "../components/DesktopSidebar";
import MobileBottomSheet from "../components/MobileBottomSheet";
import FloatingSearchBar from "../components/FloatingSearchBar";
import { motion } from "framer-motion";
import { 
  HiOutlineMapPin, 
  HiOutlineMagnifyingGlass,
  HiOutlineStar,
  HiOutlineChevronRight,
  HiOutlineChevronDown,
  HiOutlineChevronLeft,
  HiOutlineAdjustmentsHorizontal
} from "react-icons/hi2";
import axios from "axios";
import { toast } from "react-toastify";
import { useAppContext } from "../context/AppContext";
import { useTheme } from "../context/ThemeContext";
import { useNavigate } from "react-router-dom";
import LocationConsentModal from "../components/LocationConsentModal";

const LocalEditorsNetworkPage = () => {
  const { user } = useAppContext();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  const [userLocation, setUserLocation] = useState(null);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [nearbyEditors, setNearbyEditors] = useState([]);
  const [selectedEditor, setSelectedEditor] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mobileSearch, setMobileSearch] = useState('');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [filters, setFilters] = useState({
    radius: 25,
    minRating: 0,
    availability: false,
    skills: '',
    sortBy: 'distance'
  });

  // Allow both clients and editors to view nearby editors
  // No role restriction needed - this feature is for everyone

  useEffect(() => {
    if (!userLocation) {
      setShowConsentModal(true);
    }
  }, []);

  const handleAcceptLocation = async () => {
    try {
      if (!navigator.geolocation) {
        toast.error("Geolocation is not supported by your browser");
        setShowConsentModal(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(location);
          setShowConsentModal(false);
          toast.success("Location access granted!");
          fetchNearbyEditors(location);
        },
        (error) => {
          console.error("Geolocation error:", error);
          toast.error("Failed to get your location");
          setShowConsentModal(false);
        }
      );
    } catch (error) {
      console.error("Location access error:", error);
      setShowConsentModal(false);
    }
  };

  const handleSkipLocation = () => {
    setShowConsentModal(false);
    const defaultLocation = { lat: 12.97, lng: 77.59 };
    setUserLocation(defaultLocation);
    toast.info("Using default location: Bangalore");
    fetchNearbyEditors(defaultLocation);
  };

  const fetchNearbyEditors = async (location) => {
    setIsLoading(true);
    try {
      const params = {
        lat: location.lat,
        lng: location.lng,
        radius: filters.radius,
        ...(filters.minRating > 0 && { minRating: filters.minRating }),
        ...(filters.availability && { availability: true }),
        ...(filters.skills && { skills: filters.skills }),
      };

      const { data } = await axios.get(`${backendURL}/api/location/nearby`, {
        params,
        headers: { Authorization: `Bearer ${user?.token}` },
      });

      let editors = data.editors || [];
      
      // Client-side sorting
      if (filters.sortBy === 'rating') {
        editors.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      } else if (filters.sortBy === 'distance') {
        editors.sort((a, b) => (a.approxLocation?.distance || 999) - (b.approxLocation?.distance || 999));
      }

      setNearbyEditors(editors);
      toast.success(`Found ${data.count} editors nearby`);
    } catch (error) {
      console.error("Failed to fetch nearby editors:", error);
      toast.error("Failed to fetch nearby editors");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyFilters = () => {
    if (userLocation) {
      fetchNearbyEditors(userLocation);
      setShowMobileFilters(false);
    }
  };

  const resetFilters = () => {
    setFilters({
      radius: 25,
      minRating: 0,
      availability: false,
      skills: '',
      sortBy: 'distance'
    });
  };

  // Filter editors by mobile search
  const filteredMobileEditors = nearbyEditors.filter(e => 
    e.name?.toLowerCase().includes(mobileSearch.toLowerCase())
  );

  return (
    <div className={`min-h-screen flex flex-col overflow-hidden ${isDark ? 'bg-black' : 'bg-gray-50'}`}>
      {/* Navigation Sidebar Overlay - Only shows when hamburger clicked, doesn't interfere with editors list */}
      {sidebarOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Sliding Panel */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`fixed top-0 left-0 h-full w-72 z-[70] shadow-2xl ${
              isDark ? 'bg-black border-r border-green-900/30' : 'bg-white border-r border-gray-200'
            }`}
          >
            {/* Overlay Sidebar Header */}
            <div className={`flex items-center justify-between p-4 border-b ${
              isDark ? 'border-green-900/30' : 'border-gray-200'
            }`}>
              <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Menu</h2>
              <button 
                onClick={() => setSidebarOpen(false)}
                className={`p-2 rounded-lg ${isDark ? 'hover:bg-green-900/30 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
              >
                <HiOutlineChevronLeft className="text-xl" />
              </button>
            </div>
            {/* Navigation Links */}
            <div className="p-4 space-y-2">
              {[
                { label: 'Home', path: '/client-home', icon: '🏠' },
                { label: 'My Orders', path: '/client-orders', icon: '📦' },
                { label: 'Messages', path: '/client-messages', icon: '💬' },
                { label: 'Saved Editors', path: '/saved-editors', icon: '❤️' },
                { label: 'KYC Verification', path: '/client-kyc', icon: '🛡️' },
                { label: 'Profile', path: '/client-profile', icon: '👤' },
              ].map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isDark 
                      ? 'hover:bg-green-900/30 text-gray-300 hover:text-white' 
                      : 'hover:bg-gray-100 text-gray-700 hover:text-gray-900'
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
      
      {/* ===== FULL WIDTH NAVBAR WITH LOGO ===== */}
      <div className={`w-full px-4 py-3 flex items-center justify-between border-b z-50 ${
        isDark ? 'bg-black border-green-900/30' : 'bg-white border-gray-200'
      }`}>
        {/* Left: Logo + Brand */}
        <div className="flex items-center gap-3">
          {/* Hamburger for mobile */}
          <button 
            onClick={() => setSidebarOpen(true)}
            className={`md:hidden p-2 rounded-lg ${isDark ? 'hover:bg-green-900/30 text-white' : 'hover:bg-gray-100 text-gray-700'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          {/* Logo */}
          <img 
            src="/logo.png" 
            alt="SuviX" 
            className="w-8 h-8 cursor-pointer"
            onClick={() => navigate('/client-home')}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          
          {/* Brand Name */}
          <h1 
            onClick={() => navigate('/client-home')}
            className={`text-xl font-bold cursor-pointer ${isDark ? 'text-white' : 'text-gray-900'}`}
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Suvi<span className="text-emerald-500">X</span>
          </h1>
          
          {/* Page Title - Desktop only */}
          <div className={`hidden md:flex items-center gap-2 ml-4 pl-4 border-l ${
            isDark ? 'border-green-900/50' : 'border-gray-200'
          }`}>
            <HiOutlineMapPin className={`text-lg ${isDark ? 'text-green-400' : 'text-green-600'}`} />
            <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Editors Near You
            </span>
          </div>
        </div>
        
        {/* Right: Back button + Editor count */}
        <div className="flex items-center gap-3">
          <div className={`hidden sm:flex px-3 py-1.5 rounded-full text-xs font-medium ${
            isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'
          }`}>
            {nearbyEditors.length} Found
          </div>
          
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isDark 
                ? 'bg-green-950/50 border border-green-800/50 text-green-400 hover:bg-green-900/50' 
                : 'bg-gray-100 border border-gray-200 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <HiOutlineChevronLeft className="text-lg" />
            <span className="hidden sm:inline">Back</span>
          </button>
        </div>
      </div>
      
      {/* ===== CONTENT AREA - Sidebar + Map ===== */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar - Editors list */}
        <div className={`hidden md:flex md:flex-col w-[320px] lg:w-[360px] border-r ${
          isDark ? 'bg-black border-green-900/30' : 'bg-white border-gray-200'
        }`}>
          {/* Search and Filters - No duplicate header */}
          <DesktopSidebar
            editors={nearbyEditors}
            isLoading={isLoading}
            onEditorClick={setSelectedEditor}
            onApplyFilters={handleApplyFilters}
            filters={filters}
            setFilters={setFilters}
          />
        </div>

        {/* Map - Takes remaining width */}
        <div className="flex-1 relative">
          {userLocation ? (
            <MapComponent
              center={userLocation}
              zoom={12}
              markers={nearbyEditors}
              onMarkerClick={(editor) => {
                setSelectedEditor(editor);
                navigate(`/editor/${editor._id}`);
              }}
            />
          ) : (
            <div className={`h-full flex items-center justify-center ${isDark ? 'bg-gray-950' : 'bg-gray-100'}`}>
              <div className="text-center">
                <div className={`w-16 h-16 border-4 rounded-full animate-spin mx-auto ${isDark ? 'border-green-900 border-t-green-500' : 'border-green-200 border-t-green-500'}`} />
                <p className={`mt-4 ${isDark ? 'text-green-500' : 'text-gray-600'}`}>Getting your location...</p>
              </div>
            </div>
          )}

          {/* Loading Overlay */}
          {isLoading && (
            <div className={`absolute inset-0 z-20 flex items-center justify-center ${isDark ? 'bg-black/80' : 'bg-white/80'} backdrop-blur-sm`}>
              <div className={`rounded-2xl p-6 shadow-2xl ${isDark ? 'bg-gray-900 border border-green-800/50' : 'bg-white border border-gray-200'}`}>
                <div className={`w-10 h-10 border-3 rounded-full animate-spin mx-auto ${isDark ? 'border-green-900 border-t-green-500' : 'border-green-200 border-t-green-500'}`} />
                <p className={`font-medium text-sm mt-4 ${isDark ? 'text-green-400' : 'text-gray-900'}`}>Finding editors...</p>
              </div>
            </div>
          )}
        </div>

        {/* Mobile: Floating Search Bar */}
        <FloatingSearchBar onSearchClick={() => {}} />

        {/* Mobile: Swipeable Bottom Sheet with Advanced Filters */}
        <MobileBottomSheet isOpen={true}>
          {/* Mobile Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <HiOutlineMapPin className={`text-lg ${isDark ? 'text-green-500' : 'text-green-600'}`} />
              <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Nearby Editors
              </h3>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'}`}>
                {filteredMobileEditors.length} found
              </span>
            </div>
          </div>

          {/* Mobile Search */}
          <div className="relative mb-3">
            <HiOutlineMagnifyingGlass className={`absolute left-3 top-1/2 -translate-y-1/2 text-lg ${isDark ? 'text-green-600' : 'text-gray-400'}`} />
            <input
              type="text"
              placeholder="Search editors..."
              value={mobileSearch}
              onChange={(e) => setMobileSearch(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none ${
                isDark 
                  ? 'bg-green-950/50 border border-green-800/50 text-white placeholder-green-700 focus:border-green-500' 
                  : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-green-500'
              }`}
            />
          </div>

          {/* Mobile Advanced Filters Toggle */}
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className={`w-full mb-3 px-4 py-2.5 rounded-xl flex items-center justify-between text-sm ${
              isDark 
                ? 'bg-green-950/50 border border-green-800/50 text-green-300' 
                : 'bg-gray-50 border border-gray-200 text-gray-700'
            }`}
          >
            <span className="flex items-center gap-2">
              <HiOutlineAdjustmentsHorizontal className={isDark ? 'text-green-400' : 'text-green-600'} />
              Advanced Filters
            </span>
            <HiOutlineChevronDown className={`transition-transform ${showMobileFilters ? 'rotate-180' : ''}`} />
          </button>

          {/* Mobile Advanced Filters Panel */}
          {showMobileFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className={`mb-4 p-4 rounded-xl space-y-4 ${
                isDark ? 'bg-green-950/30 border border-green-800/30' : 'bg-gray-50 border border-gray-200'
              }`}
            >
              {/* Distance */}
              <div>
                <label className={`text-xs font-medium mb-2 block ${isDark ? 'text-green-300' : 'text-gray-600'}`}>
                  Distance: <span className={isDark ? 'text-green-400' : 'text-green-600'}>{filters.radius}km</span>
                </label>
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={filters.radius}
                  onChange={(e) => setFilters({ ...filters, radius: parseInt(e.target.value) })}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-green-500"
                  style={{ background: isDark ? '#064e3b' : '#d1fae5' }}
                />
                <div className={`flex justify-between text-xs mt-1 ${isDark ? 'text-green-600' : 'text-gray-400'}`}>
                  <span>5km</span>
                  <span>100km</span>
                </div>
              </div>

              {/* Rating */}
              <div>
                <label className={`text-xs font-medium mb-2 block ${isDark ? 'text-green-300' : 'text-gray-600'}`}>
                  Min Rating: <span className="text-amber-500">{filters.minRating}★</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.5"
                  value={filters.minRating}
                  onChange={(e) => setFilters({ ...filters, minRating: parseFloat(e.target.value) })}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  style={{ background: isDark ? '#451a03' : '#fef3c7' }}
                />
              </div>

              {/* Skills */}
              <div>
                <label className={`text-xs font-medium mb-2 block ${isDark ? 'text-green-300' : 'text-gray-600'}`}>
                  Skills
                </label>
                <select
                  value={filters.skills}
                  onChange={(e) => setFilters({ ...filters, skills: e.target.value })}
                  className={`w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none ${
                    isDark 
                      ? 'bg-black border border-green-800/50 text-white' 
                      : 'bg-white border border-gray-200 text-gray-900'
                  }`}
                >
                  <option value="">All Skills</option>
                  <option value="reels">Reels</option>
                  <option value="youtube">YouTube</option>
                  <option value="shorts">Shorts</option>
                  <option value="wedding">Wedding</option>
                  <option value="corporate">Corporate</option>
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className={`text-xs font-medium mb-2 block ${isDark ? 'text-green-300' : 'text-gray-600'}`}>
                  Sort By
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                  className={`w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none ${
                    isDark 
                      ? 'bg-black border border-green-800/50 text-white' 
                      : 'bg-white border border-gray-200 text-gray-900'
                  }`}
                >
                  <option value="distance">Nearest First</option>
                  <option value="rating">Highest Rated</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                </select>
              </div>

              {/* Availability Toggle */}
              <div className="flex items-center justify-between">
                <span className={`text-xs font-medium ${isDark ? 'text-green-300' : 'text-gray-600'}`}>Available Now Only</span>
                <button
                  onClick={() => setFilters({ ...filters, availability: !filters.availability })}
                  className={`w-11 h-6 rounded-full transition-colors relative ${
                    filters.availability 
                      ? 'bg-green-500' 
                      : isDark ? 'bg-green-900/50' : 'bg-gray-300'
                  }`}
                >
                  <motion.div
                    animate={{ x: filters.availability ? 22 : 2 }}
                    className="absolute top-1 w-4 h-4 bg-white rounded-full shadow"
                  />
                </button>
              </div>

              {/* Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={resetFilters}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium ${
                    isDark 
                      ? 'bg-green-900/30 text-green-400' 
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  Reset
                </button>
                <button
                  onClick={handleApplyFilters}
                  className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-semibold"
                >
                  Apply
                </button>
              </div>
            </motion.div>
          )}

          {/* Mobile Editors List */}
          {isLoading ? (
            <div className="text-center py-8">
              <div className={`w-8 h-8 border-2 rounded-full animate-spin mx-auto ${isDark ? 'border-green-900 border-t-green-500' : 'border-green-200 border-t-green-500'}`} />
            </div>
          ) : filteredMobileEditors.length === 0 ? (
            <div className="text-center py-8">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${isDark ? 'bg-green-950/50' : 'bg-gray-100'}`}>
                <HiOutlineMapPin className={`text-2xl ${isDark ? 'text-green-700' : 'text-gray-400'}`} />
              </div>
              <p className={`text-sm ${isDark ? 'text-green-600' : 'text-gray-500'}`}>No editors found nearby</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredMobileEditors.map((editor) => (
                <motion.button
                  key={editor._id}
                  onClick={() => navigate(`/editor/${editor._id}`)}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full p-3 rounded-xl flex items-center gap-3 ${
                    isDark 
                      ? 'bg-green-950/30 border border-green-800/30 active:bg-green-900/50' 
                      : 'bg-gray-50 border border-gray-200 active:bg-gray-100'
                  }`}
                >
                  <img
                    src={editor.profilePicture && editor.profilePicture.trim() !== '' 
                      ? editor.profilePicture 
                      : 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}
                    alt={editor.name}
                    className={`w-10 h-10 rounded-full object-cover border-2 ${isDark ? 'border-green-600/50' : 'border-green-500/30'}`}
                    onError={(e) => { e.target.src = 'https://cdn-icons-png.flaticon.com/512/149/149071.png'; }}
                  />
                  <div className="flex-1 text-left">
                    <p className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{editor.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-amber-500 flex items-center gap-0.5">
                        <HiOutlineStar /> {editor.rating?.toFixed(1) || 'N/A'}
                      </span>
                      <span className={`text-xs ${isDark ? 'text-green-500' : 'text-green-600'}`}>{editor.approxLocation?.distance}km</span>
                    </div>
                  </div>
                  <HiOutlineChevronRight className={`text-lg ${isDark ? 'text-green-700' : 'text-gray-400'}`} />
                </motion.button>
              ))}
            </div>
          )}
        </MobileBottomSheet>
      </div>

      {/* Location Consent Modal */}
      <LocationConsentModal
        isOpen={showConsentModal}
        onAccept={handleAcceptLocation}
        onSkip={handleSkipLocation}
        onClose={handleSkipLocation}
      />
    </div>
  );
};

export default LocalEditorsNetworkPage;
