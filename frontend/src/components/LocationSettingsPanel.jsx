import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaShieldAlt, FaWifi, FaSatelliteDish } from "react-icons/fa";
import { HiOutlineMapPin } from "react-icons/hi2";
import { useAppContext } from "../context/AppContext";
import { useSocket } from "../context/SocketContext";
import LocationVerificationCard from "./LocationVerificationCard";

const LocationSettingsPanel = () => {
  const { user, setUser } = useAppContext();
  const { updateAvailability } = useSocket();

  const [isAvailable, setIsAvailable] = useState(user?.isAvailable || false);

  // Sync state if user changes
  useEffect(() => {
    if (user) {
      setIsAvailable(user.isAvailable);
    }
  }, [user?.isAvailable]);

  const handleToggleAvailability = () => {
    const newState = !isAvailable;
    setIsAvailable(newState);
    
    // 1. Update via Socket (Real-time pulse)
    updateAvailability(newState);
    
    // 2. Update local state
    setUser(prev => ({ ...prev, isAvailable: newState }));
    
    // Toast logic handled by context or here if needed
  };

  const handleLocationUpdate = (newLocationData) => {
    // Sync the user context with the new timestamps and radius
    setUser(prev => ({
      ...prev,
      locationUpdatedAt: newLocationData.locationUpdatedAt,
      serviceRadius: newLocationData.serviceRadius
    }));
  };

  return (
    <div className="space-y-6">
      {/* 1. Live Presence Toggle (Premium UI) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`p-1 rounded-[2.5rem] transition-all duration-500 ${
          isAvailable 
            ? "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_20px_50px_rgba(16,185,129,0.3)]" 
            : "bg-gray-200 dark:bg-gray-800"
        }`}
      >
        <div className="bg-white dark:bg-gray-900 rounded-[2.2rem] p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 ${
              isAvailable ? "bg-emerald-500 text-white animate-pulse" : "bg-gray-100 dark:bg-gray-800 text-gray-400"
            }`}>
              <FaWifi className="text-2xl" />
            </div>
            <div className="text-center sm:text-left">
              <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center justify-center sm:justify-start gap-2">
                Live Availability
                {isAvailable && (
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                )}
              </h3>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {isAvailable 
                  ? "You are visible to clients and ranked in search results!" 
                  : "You are currently hidden from the discovery map."}
              </p>
            </div>
          </div>

          <button
            id="availability-toggle"
            onClick={handleToggleAvailability}
            className={`group relative flex items-center justify-between px-6 py-4 rounded-full min-w-[160px] font-black tracking-tighter transition-all active:scale-95 ${
              isAvailable 
                ? "bg-emerald-500 text-white shadow-lg" 
                : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700"
            }`}
          >
            <span className="uppercase text-xs">{isAvailable ? "Online" : "Offline"}</span>
            <div className={`w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center transition-all duration-500 ${
              isAvailable ? "translate-x-2" : "-translate-x-2"
            }`}>
              <div className={`w-3 h-3 rounded-full ${isAvailable ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"}`} />
            </div>
          </button>
        </div>
      </motion.div>

      {/* 2. GPS Verification Section */}
      <LocationVerificationCard onUpdateSuccess={handleLocationUpdate} />

      {/* 3. Privacy Standards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3">
          <FaShieldAlt className="text-blue-500 text-xl" />
          <p className="text-xs text-gray-400 font-medium">Compliance: GPS accuracy is verified before every sync to prevent spoofing.</p>
        </div>
        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3">
          <FaSatelliteDish className="text-emerald-500 text-xl" />
          <p className="text-xs text-gray-400 font-medium">Auto-Fade: Status automatically fades to 'Inactive' after 7 days of no GPS pulse.</p>
        </div>
      </div>
    </div>
  );
};

export default LocationSettingsPanel;
