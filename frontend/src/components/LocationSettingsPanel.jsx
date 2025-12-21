import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaMapMarkerAlt, FaGlobe, FaCity, FaShieldAlt, FaSave } from "react-icons/fa";
import { HiOutlineMapPin } from "react-icons/hi2";
import axios from "axios";
import { toast } from "react-toastify";
import { useAppContext } from "../context/AppContext";

const LocationSettingsPanel = () => {
  const { user } = useAppContext();
  const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  const [settings, setSettings] = useState({
    city: "",
    state: "",
    country: "India",
    visibility: {
      enabled: false,
      level: "city",
    },
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch existing settings
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
          visibility: data.location.visibility || {
            enabled: false,
            level: "city",
          },
        });
      }
    } catch (error) {
      console.error("Failed to fetch location settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings.city || !settings.state) {
      toast.error("Please enter your city and state");
      return;
    }

    setIsSaving(true);
    try {
      const { data } = await axios.patch(
        `${backendURL}/api/location/settings`,
        settings,
        {
          headers: { Authorization: `Bearer ${user?.token}` },
        }
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
      <div className="bg-[#0f1115] border border-gray-700/30 rounded-xl p-8 text-center">
        <div className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto" />
        <p className="text-gray-500 text-sm mt-4">Loading location settings...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#0f1115] border border-gray-700/30 rounded-xl p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-white/5">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 flex items-center justify-center">
          <HiOutlineMapPin className="text-2xl text-emerald-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Local Network Visibility</h3>
          <p className="text-xs text-gray-500">Appear on the map for nearby clients</p>
        </div>
      </div>

      {/* Visibility Toggle */}
      <div className="bg-gradient-to-r from-emerald-500/5 to-blue-500/5 border border-emerald-500/10 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FaShieldAlt className="text-emerald-400 text-lg" />
            <div>
              <p className="text-white font-medium text-sm">Show me in Local Editors Network</p>
              <p className="text-gray-500 text-xs mt-0.5">Clients can find you on the map</p>
            </div>
          </div>
          <button
            onClick={() =>
              setSettings({
                ...settings,
                visibility: { ...settings.visibility, enabled: !settings.visibility.enabled },
              })
            }
            className={`relative w-14 h-7 rounded-full transition-colors ${
              settings.visibility.enabled ? "bg-emerald-500" : "bg-gray-600"
            }`}
          >
            <motion.div
              animate={{ x: settings.visibility.enabled ? 28 : 2 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg"
            />
          </button>
        </div>
      </div>

      {/* Location Details */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-white flex items-center gap-2">
          <FaMapMarkerAlt className="text-emerald-400" />
          Your Location
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500 mb-2 block">City *</label>
            <input
              type="text"
              value={settings.city}
              onChange={(e) => setSettings({ ...settings, city: e.target.value })}
              placeholder="e.g., Mumbai"
              className="w-full px-4 py-2.5 bg-black/30 border border-gray-700 rounded-lg text-white text-sm focus:border-emerald-500 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-2 block">State *</label>
            <input
              type="text"
              value={settings.state}
              onChange={(e) => setSettings({ ...settings, state: e.target.value })}
              placeholder="e.g., Maharashtra"
              className="w-full px-4 py-2.5 bg-black/30 border border-gray-700 rounded-lg text-white text-sm focus:border-emerald-500 focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-2 block">Country</label>
          <input
            type="text"
            value={settings.country}
            onChange={(e) => setSettings({ ...settings, country: e.target.value })}
            className="w-full px-4 py-2.5 bg-black/30 border border-gray-700 rounded-lg text-white text-sm focus:border-emerald-500 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Visibility Level */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-white flex items-center gap-2">
          <FaGlobe className="text-blue-400" />
          Visibility Level
        </h4>

        <div className="space-y-2">
          {[
            { value: "city", label: "City-level", desc: "Visible within ~25km", icon: FaCity },
            { value: "region", label: "Region-level", desc: "Visible within ~100km", icon: FaGlobe },
            { value: "country", label: "Country-level", desc: "Visible nationwide", icon: FaGlobe },
          ].map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                onClick={() =>
                  setSettings({
                    ...settings,
                    visibility: { ...settings.visibility, level: option.value },
                  })
                }
                className={`w-full p-3 rounded-lg border transition-all flex items-center gap-3 ${
                  settings.visibility.level === option.value
                    ? "bg-emerald-500/10 border-emerald-500/30 text-white"
                    : "bg-black/20 border-gray-700/50 text-gray-400 hover:border-gray-600"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    settings.visibility.level === option.value
                      ? "border-emerald-500"
                      : "border-gray-600"
                  }`}
                >
                  {settings.visibility.level === option.value && (
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  )}
                </div>
                <Icon className="text-lg" />
                <div className="text-left flex-1">
                  <p className="text-sm font-medium">{option.label}</p>
                  <p className="text-xs text-gray-500">{option.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg p-4">
        <p className="text-xs text-amber-300 flex items-start gap-2">
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
        className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
    </motion.div>
  );
};

export default LocationSettingsPanel;
