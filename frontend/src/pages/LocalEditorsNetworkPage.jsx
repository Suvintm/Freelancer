import { useState, useEffect } from "react";
import MapComponent from "../components/MapComponent";
import EditorListSidebar from "../components/EditorListSidebar";
import TopHeader from "../components/TopHeader";
import CompactProfileCard from "../components/CompactProfileCard";
import { motion, AnimatePresence } from "framer-motion";
import { FaBars, FaTimes } from "react-icons/fa";
import axios from "axios";
import { toast } from "react-toastify";
import { useAppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import LocationConsentModal from "../components/LocationConsentModal";

const LocalEditorsNetworkPage = () => {
  const { user } = useAppContext();
  const navigate = useNavigate();
  const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  const [userLocation, setUserLocation] = useState(null);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [nearbyEditors, setNearbyEditors] = useState([]);
  const [selectedEditor, setSelectedEditor] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); // Start closed on mobile

  useEffect(() => {
    if (user?.role !== "client") {
      toast.error("This feature is only available for clients");
      navigate("/");
    }
  }, [user, navigate]);

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

          try {
            await axios.post(
              `${backendURL}/api/location/consent`,
              { consentGiven: true, userLocation: location },
              { headers: { Authorization: `Bearer ${user?.token}` } }
            );
          } catch (error) {
            console.error("Failed to log consent:", error);
          }

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
        radius: 25,
      };

      console.log("🔍 Searching for editors:", params);

      const { data } = await axios.get(`${backendURL}/api/location/nearby`, {
        params,
        headers: { Authorization: `Bearer ${user?.token}` },
      });

      console.log("📡 API Response:", data);
      setNearbyEditors(data.editors || []);
      toast.success(`Found ${data.count} editors nearby`);
    } catch (error) {
      console.error("❌ Failed to fetch nearby editors:", error);
      toast.error(error.response?.data?.message || "Failed to fetch nearby editors");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Top Header */}
      <TopHeader currentView="map" />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile Sidebar Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden fixed bottom-6 left-6 z-50 w-12 h-12 bg-violet-600 hover:bg-violet-700 rounded-full shadow-2xl flex items-center justify-center text-white transition-transform hover:scale-110"
        >
          {sidebarOpen ? <FaTimes /> : <FaBars />}
        </button>

        {/* Left Sidebar - Editor List */}
        <div className={`w-80 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 ${sidebarOpen ? 'block' : 'hidden'} lg:block absolute lg:relative inset-y-0 left-0 z-40`}>
          <EditorListSidebar
            editors={nearbyEditors}
            selectedEditor={selectedEditor}
            onSelectEditor={(editor) => {
              setSelectedEditor(editor);
              // Close sidebar on mobile after selection
              if (window.innerWidth < 1024) {
                setSidebarOpen(false);
              }
            }}
            isLoading={isLoading}
          />
        </div>

        {/* Right Side - Map */}
        <div className="flex-1 relative">
          {userLocation ? (
            <MapComponent
              center={userLocation}
              zoom={12}
              markers={nearbyEditors}
              onMarkerClick={setSelectedEditor}
            />
          ) : (
            <div className="h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
              <div className="text-center">
                <div className="w-16 h-16 bg-violet-100 dark:bg-violet-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaBars className="text-violet-600 dark:text-violet-400 text-2xl" />
                </div>
                <p className="text-gray-600 dark:text-gray-400">Waiting for location access...</p>
              </div>
            </div>
          )}

          {/* Compact Profile Card Overlay */}
          <AnimatePresence>
            {selectedEditor && (
              <div className="absolute top-4 right-4 z-30">
                <CompactProfileCard
                  editor={selectedEditor}
                  onClose={() => setSelectedEditor(null)}
                />
              </div>
            )}
          </AnimatePresence>

          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-20 flex items-center justify-center">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl border border-gray-200 dark:border-gray-700">
                <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-900 dark:text-white font-semibold">Searching nearby editors...</p>
              </div>
            </div>
          )}
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
