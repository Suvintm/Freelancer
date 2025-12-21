import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaMapMarkerAlt, FaGlobe, FaCity, FaShieldAlt, FaSave, FaCheckCircle } from "react-icons/fa";
import { HiOutlineMapPin } from "react-icons/hi2";
import axios from "axios";
import { toast } from "react-toastify";
import { useAppContext } from "../context/AppContext";
import { useTheme } from "../context/ThemeContext";

const LocationSettingsPanel = () => {
  const { user } = useAppContext();
  const { theme } = useTheme();
  const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  const [settings, setSettings] = useState({
    city: "",
    state: "",
    country: "India",
    coordinates: null,
    visibility: {
      enabled: false,
      level: "city",
    },
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);

  useEffect(() => {
    fetchLocationSettings();
  }, []);

  const fetchLocationSettings = async () => {
    try {
      const { data } = await axios.get(`${backendURL}/api/location/settings`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });

      if (data.location) {
        setSettings({
          city: data.location.city || "",
          state: data.location.state || "",
          country: data.location.country || "India",
          coordinates: null,
          visibility: data.location.visibility || { enabled: false, level: "city" },
        });
      }
    } catch (error) {
      console.error("Failed to fetch location settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDetectLocation = async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsDetecting(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        
        console.log("📍 Detected coordinates:", coords);
        
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${coords.lat}&lon=${coords.lng}&format=json`
          );
          
          const data = await response.json();
          console.log("🗺️ Reverse geocoding result:", data);
          
          const address = data.address || {};
          const city = address.city || address.town || address.village || address.county || "";
          const state = address.state || "";
          
          setSettings(prev => ({
            ...prev,
            city: city,
            state: state,
            coordinates: coords,
          }));
          
          toast.success(`✅ Location detected: ${city}, ${state}!`);
          console.log("✅ Auto-filled:", { city, state, coords });
          
        } catch (error) {
          console.error("Reverse geocoding error:", error);
          setSettings(prev => ({
            ...prev,
            coordinates: coords,
          }));
          toast.info("📍 Location detected! Please enter your city and state manually.");
        }
        
        setIsDetecting(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        toast.error("Failed to detect location. Please enter manually.");
        setIsDetecting(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleSave = async () => {
    if (!settings.city || !settings.state) {
      toast.error("Please enter your city and state");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        city: settings.city,
        state: settings.state,
        country: settings.country,
        visibility: settings.visibility,
        ...(settings.coordinates && { coordinates: settings.coordinates }),
      };

      console.log("💾 Saving location:", payload);

      const { data } = await axios.patch(
        `${backendURL}/api/location/settings`,
        payload,
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );

      toast.success("Location settings saved successfully!");
      console.log("Location saved:", data);
    } catch (error) {
      console.error("Failed to save location settings:", error);
      toast.error(error.response?.data?.message || "Failed to save location settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-8 text-center shadow-lg">
        <div className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto" />
        <p className="text-gray-600 dark:text-gray-400 text-sm mt-4">Loading location settings...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20 p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center shadow-lg">
            <HiOutlineMapPin className="text-2xl text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Location Visibility</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Appear on the local editors network map</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Visibility Toggle Card */}
        <div className="p-5 bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <FaShieldAlt className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-gray-900 dark:text-white font-semibold">Show me in Local Editors Network</p>
                <p className="text-gray-600 dark:text-gray-400 text-xs mt-0.5">Clients can find you on the map</p>
              </div>
            </div>
            <button
              onClick={() =>
                setSettings({
                  ...settings,
                  visibility: { ...settings.visibility, enabled: !settings.visibility.enabled },
                })
              }
              className={`relative w-14 h-7 rounded-full transition-all duration-300 ${
                settings.visibility.enabled ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"
              }`}
            >
              <motion.div
                animate={{ x: settings.visibility.enabled ? 28 : 2 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-md"
              />
            </button>
          </div>
        </div>

        {/* Auto-Detect Location Card */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <FaMapMarkerAlt className="text-emerald-500" />
            Your Location
          </label>
          
          <button
            onClick={handleDetectLocation}
            disabled={isDetecting}
            className="w-full px-5 py-3.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-gray-400 disabled:to-gray-500 rounded-xl text-white font-semibold shadow-lg transition-all flex items-center justify-center gap-2"
          >
            {isDetecting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Detecting Location...
              </>
            ) : (
              <>
                <HiOutlineMapPin className="text-lg" />
                📍 Auto-Detect My Current Location
              </>
            )}
          </button>

          {settings.coordinates && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
              <div className="flex items-start gap-2">
                <FaCheckCircle className="text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-emerald-700 dark:text-emerald-300 font-semibold text-sm">Location Auto-Detected!</p>
                  {settings.city && settings.state && (
                    <p className="text-emerald-600 dark:text-emerald-400 text-sm mt-1">
                      📍 {settings.city}, {settings.state}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* City & State Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">City *</label>
            <input
              type="text"
              value={settings.city}
              onChange={(e) => setSettings({ ...settings, city: e.target.value })}
              placeholder="e.g., Mumbai"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:border-emerald-500 dark:focus:border-emerald-400 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">State *</label>
            <input
              type="text"
              value={settings.state}
              onChange={(e) => setSettings({ ...settings, state: e.target.value })}
              placeholder="e.g., Maharashtra"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:border-emerald-500 dark:focus:border-emerald-400 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Country Input */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Country</label>
          <input
            type="text"
            value={settings.country}
            onChange={(e) => setSettings({ ...settings, country: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:border-emerald-500 dark:focus:border-emerald-400 focus:outline-none transition-colors"
          />
        </div>

        {/* Visibility Level */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <FaGlobe className="text-blue-500" />
            Visibility Level
          </label>

          <div className="space-y-2">
            {[
              { value: "city", label: "City-level", desc: "Visible within ~25km", icon: FaCity },
              { value: "region", label: "Region-level", desc: "Visible within ~100km", icon: FaGlobe },
              { value: "country", label: "Country-level", desc: "Visible nationwide", icon: FaGlobe },
            ].map((option) => {
              const Icon = option.icon;
              const isSelected = settings.visibility.level === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() =>
                    setSettings({
                      ...settings,
                      visibility: { ...settings.visibility, level: option.value },
                    })
                  }
                  className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                    isSelected
                      ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 dark:border-emerald-400"
                      : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? "border-emerald-500 dark:border-emerald-400" : "border-gray-300 dark:border-gray-600"
                    }`}
                  >
                    {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />}
                  </div>
                  <Icon className={`text-lg ${isSelected ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400"}`} />
                  <div className="text-left flex-1">
                    <p className={`text-sm font-medium ${isSelected ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"}`}>
                      {option.label}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{option.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
          <p className="text-sm text-amber-800 dark:text-amber-300 flex items-start gap-2">
            <FaShieldAlt className="mt-0.5 flex-shrink-0" />
            <span>
              <strong>Privacy Protected:</strong> Your exact address is never shown. We only display approximate location rounded to ~1km accuracy.
            </span>
          </p>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={isSaving || !settings.city || !settings.state}
          className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white font-bold text-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <FaSave />
              <span>Save Location Settings</span>
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
};

export default LocationSettingsPanel;
