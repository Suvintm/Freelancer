import { useState, useEffect } from "react";
// TEMPORARY: Using free OpenStreetMap instead of Google Maps (no billing required)
// import { GoogleMap, LoadScript, Marker, InfoWindow } from "@react-google-maps/api";
import MapComponent from "../components/MapComponent";
import { motion } from "framer-motion";
import {
  FaMapMarkerAlt,
  FaFilter,
  FaStar,
  FaUndo,
  FaExclamationTriangle,
} from "react-icons/fa";
import { HiOutlineMapPin } from "react-icons/hi2";
import axios from "axios";
import { toast } from "react-toastify";
import { useAppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import LocationConsentModal from "../components/LocationConsentModal";
import MiniProfileCard from "../components/MiniProfileCard";

const LocalEditorsNetworkPage = () => {
  const { user } = useAppContext();
  const navigate = useNavigate();
  const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

  const [userLocation, setUserLocation] = useState(null);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [nearbyEditors, setNearbyEditors] = useState([]);
  const [selectedEditor, setSelectedEditor] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    radius: 25,
    skills: "",
    minRating: 0,
    availability: false,
  });

  // Check if user is a client
  useEffect(() => {
    if (user?.role !== "client") {
      toast.error("This feature is only available for clients");
      navigate("/");
    }
  }, [user, navigate]);

  // Show consent modal on mount
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

          // Log consent
          try {
            await axios.post(
              `${backendURL}/api/location/consent`,
              {
                consentGiven: true,
                userLocation: location,
              },
              {
                headers: { Authorization: `Bearer ${user?.token}` },
              }
            );
          } catch (error) {
            console.error("Failed to log consent:", error);
          }

          // Fetch nearby editors
          fetchNearbyEditors(location);
        },
        (error) => {
          console.error("Geolocation error:", error);
          toast.error("Failed to get your location. Please enable location services.");
          setShowConsentModal(false);
        }
      );
    } catch (error) {
      console.error("Location access error:", error);
      toast.error("Failed to access location");
      setShowConsentModal(false);
    }
  };

  const handleSkipLocation = () => {
    setShowConsentModal(false);
    // Set default location (Mumbai)
    const defaultLocation = { lat: 19.076, lng: 72.877 };
    setUserLocation(defaultLocation);
    toast.info("Using default location: Mumbai");
    fetchNearbyEditors(defaultLocation);
  };

  const fetchNearbyEditors = async (location) => {
    setIsLoading(true);
    try {
      const params = {
        lat: location.lat,
        lng: location.lng,
        radius: filters.radius,
        ...(filters.skills && { skills: filters.skills }),
        ...(filters.minRating > 0 && { minRating: filters.minRating }),
        ...(filters.availability && { availability: true }),
      };

      const { data } = await axios.get(`${backendURL}/api/location/nearby`, {
        params,
        headers: { Authorization: `Bearer ${user?.token}` },
      });

      setNearbyEditors(data.editors || []);
      toast.success(`Found ${data.count} editors nearby`);
    } catch (error) {
      console.error("Failed to fetch nearby editors:", error);
      toast.error(error.response?.data?.message || "Failed to fetch nearby editors");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyFilters = () => {
    if (userLocation) {
      fetchNearbyEditors(userLocation);
    }
  };

  const handleResetFilters = () => {
    setFilters({
      radius: 25,
      skills: "",
      minRating: 0,
      availability: false,
    });
    if (userLocation) {
      fetchNearbyEditors(userLocation);
    }
  };

  // Map styles
  const mapContainerStyle = {
    width: "100%",
    height: "100%",
  };

  const mapOptions = {
    disableDefaultUI: false,
    zoomControl: true,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: true,
  };

  // If no API key, show placeholder
  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#050509] via-[#0a0a0f] to-[#050509] p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#0f1115] border border-amber-500/20 rounded-2xl p-8 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
              <FaExclamationTriangle className="text-4xl text-amber-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Google Maps API Key Required</h2>
            <p className="text-gray-400 mb-6">
              To enable the map feature, please add your Google Maps API key to the environment variables.
            </p>
            
            {/* Step-by-step instructions */}
            <div className="bg-black/30 border border-gray-700 rounded-lg p-6 text-left space-y-4 mb-6">
              <div>
                <p className="text-xs text-gray-500 mb-2">Step 1: Get API Key</p>
                <p className="text-sm text-gray-300">Go to Google Cloud Console → APIs & Services → Credentials</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-2">Step 2: Enable Billing</p>
                <p className="text-sm text-gray-300">⚠️ <strong className="text-amber-400">Important:</strong> Enable billing on your project ($200 free credit/month)</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-2">Step 3: Add to .env file</p>
                <code className="text-emerald-400 text-sm block bg-black/50 p-2 rounded">
                  VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
                </code>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-2">Step 4: Restart frontend</p>
                <code className="text-blue-400 text-sm block bg-black/50 p-2 rounded">
                  npm run dev
                </code>
              </div>
            </div>

            <button
              onClick={() => navigate(-1)}
              className="mt-6 px-6 py-3 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-xl text-white font-semibold hover:from-emerald-600 hover:to-blue-600 transition-all"
            >
              Go Back
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050509] via-[#0a0a0f] to-[#050509]">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#0a0a0f]/95 backdrop-blur-md border-b border-emerald-500/10 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 flex items-center justify-center">
              <HiOutlineMapPin className="text-xl text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Local Editors Network</h1>
              <p className="text-xs text-gray-500">Discover trusted editors nearby</p>
            </div>
          </div>
          <span className="text-xs text-emerald-400 font-semibold">
            {nearbyEditors.length} editors found
          </span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row h-[calc(100vh-80px)]">
        {/* Filters Sidebar */}
        <div className="w-full md:w-80 bg-[#0f1115] border-r border-white/5 p-4 overflow-y-auto">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-emerald-400 mb-4">
              <FaFilter />
              <h2 className="font-semibold">Filters</h2>
            </div>

            {/* Radius */}
            <div>
              <label className="text-xs text-gray-500 mb-2 block">
                Distance: {filters.radius}km
              </label>
              <input
                type="range"
                min="5"
                max="100"
                step="5"
                value={filters.radius}
                onChange={(e) => setFilters({ ...filters, radius: parseInt(e.target.value) })}
                className="w-full accent-emerald-500"
              />
            </div>

            {/* Skills */}
            <div>
              <label className="text-xs text-gray-500 mb-2 block">Skills</label>
              <select
                value={filters.skills}
                onChange={(e) => setFilters({ ...filters, skills: e.target.value })}
                className="w-full px-3 py-2 bg-black/30 border border-gray-700 rounded-lg text-white text-sm focus:border-emerald-500 focus:outline-none"
              >
                <option value="">All Skills</option>
                <option value="reels">Reels</option>
                <option value="youtube">YouTube</option>
                <option value="shorts">Shorts</option>
              </select>
            </div>

            {/* Min Rating */}
            <div>
              <label className="text-xs text-gray-500 mb-2 block flex items-center gap-1">
                <FaStar className="text-amber-400" />
                Minimum Rating: {filters.minRating || "Any"}
              </label>
              <input
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={filters.minRating}
                onChange={(e) => setFilters({ ...filters, minRating: parseFloat(e.target.value) })}
                className="w-full accent-amber-500"
              />
            </div>

            {/* Availability */}
            <div className="flex items-center justify-between p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
              <span className="text-sm text-white">Available Now Only</span>
              <button
                onClick={() => setFilters({ ...filters, availability: !filters.availability })}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  filters.availability ? "bg-emerald-500" : "bg-gray-600"
                }`}
              >
                <motion.div
                  animate={{ x: filters.availability ? 24 : 2 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="absolute top-1 w-4 h-4 bg-white rounded-full"
                />
              </button>
            </div>

            {/* Apply/Reset */}
            <div className="flex gap-2">
              <button
                onClick={handleApplyFilters}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 rounded-lg text-white font-semibold text-sm disabled:opacity-50 transition-all"
              >
                Apply
              </button>
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white text-sm transition-all"
              >
                <FaUndo />
              </button>
            </div>
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative">
          {isLoading && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-20 flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-white font-semibold">Searching nearby editors...</p>
              </div>
            </div>
          )}

          {/* TEMPORARY: Free OpenStreetMap (no billing required) */}
          <MapComponent
            center={userLocation || { lat: 19.076, lng: 72.877 }}
            zoom={12}
            markers={nearbyEditors}
            onMarkerClick={setSelectedEditor}
          />

          {/* Mini Profile Card Overlay */}
          {selectedEditor && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-30">
              <MiniProfileCard
                editor={selectedEditor}
                onClose={() => setSelectedEditor(null)}
              />
            </div>
          )}

          {/* GOOGLE MAPS (commented out - uncomment when billing is enabled)
          <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={userLocation || { lat: 19.076, lng: 72.877 }}
              zoom={12}
              options={mapOptions}
            >
              {userLocation && (
                <Marker
                  position={userLocation}
                  icon={{
                    path: window.google?.maps?.SymbolPath?.CIRCLE || 0,
                    scale: 8,
                    fillColor: "#10b981",
                    fillOpacity: 1,
                    strokeColor: "#fff",
                    strokeWeight: 2,
                  }}
                />
              )}

              {nearbyEditors.map((editor) => (
                <Marker
                  key={editor._id}
                  position={{
                    lat: editor.approxLocation?.lat || 0,
                    lng: editor.approxLocation?.lng || 0,
                  }}
                  onClick={() => setSelectedEditor(editor)}
                  icon={{
                    url: editor.profilePhoto || "https://via.placeholder.com/40",
                    scaledSize: new window.google.maps.Size(40, 40),
                  }}
                />
              ))}

              {selectedEditor && (
                <InfoWindow
                  position={{
                    lat: selectedEditor.approxLocation?.lat || 0,
                    lng: selectedEditor.approxLocation?.lng || 0,
                  }}
                  onCloseClick={() => setSelectedEditor(null)}
                >
                  <div className="p-0">
                    <MiniProfileCard
                      editor={selectedEditor}
                      onClose={() => setSelectedEditor(null)}
                    />
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          </LoadScript>
          */}
        </div>
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
