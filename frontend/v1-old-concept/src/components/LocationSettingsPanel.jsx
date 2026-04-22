import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaShieldAlt, FaWifi, FaSatelliteDish, FaBolt } from "react-icons/fa";
import { HiOutlineShieldCheck, HiOutlineSignal } from "react-icons/hi2";
import axios from "axios";
import { toast } from "react-toastify";
import { useAppContext } from "../context/AppContext";
import { useSocket } from "../context/SocketContext";
import { useTheme } from "../context/ThemeContext";
import { DiscoveryReachCard, GPSLocationCard } from "./LocationVerificationCard";

const LocationSettingsPanel = () => {
  const { user, setUser } = useAppContext();
  const { updateAvailability } = useSocket();
  const { isDark } = useTheme();
  const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  const [isAvailable, setIsAvailable] = useState(user?.isAvailable || false);
  const [isPersisting, setIsPersisting] = useState(false);

  useEffect(() => {
    if (user) {
      setIsAvailable(user.isAvailable || false);
    }
  }, [user?.isAvailable]);

  const handleToggleAvailability = async () => {
    const newState = !isAvailable;
    setIsAvailable(newState);
    setUser(prev => ({ ...prev, isAvailable: newState }));
    updateAvailability(newState);

    setIsPersisting(true);
    try {
      await axios.patch(
        `${backendURL}/api/location/visibility`,
        { isAvailable: newState },
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      toast.success(newState ? "🟢 You're now Live on the Discovery Map!" : "⚫ You're now hidden from the map.");
    } catch (error) {
      setIsAvailable(!newState);
      setUser(prev => ({ ...prev, isAvailable: !newState }));
      updateAvailability(!newState);
      toast.error("Failed to update visibility. Please try again.");
    } finally {
      setIsPersisting(false);
    }
  };

  const handleLocationUpdate = (newLocationData) => {
    setUser(prev => ({
      ...prev,
      ...newLocationData
    }));
  };

  return (
    <div className="space-y-4">
      {/* Discovery Reach - MOVED TO TOP */}
      <DiscoveryReachCard onUpdateSuccess={handleLocationUpdate} />

      {/* Row 1: Live Presence + Visibility Heat */}
      <div className="grid grid-cols-2 gap-4">

        {/* Live Presence Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className={`rounded-[1.5rem] p-5 shadow-sm flex flex-col justify-between gap-4 transition-colors duration-300 ${isDark ? "bg-black border border-white/10 shadow-none" : "bg-white outline outline-1 outline-gray-200"}`}
        >
          {/* Icon + Toggle Row */}
          <div className="flex items-start justify-between">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-colors ${
              isDark ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-emerald-50"
            }`}>
              <FaWifi className={`text-xl ${isAvailable ? 'text-emerald-500' : 'text-gray-300'}`} />
            </div>
            {/* Toggle Switch */}
            <button
              onClick={handleToggleAvailability}
              disabled={isPersisting}
              className="relative w-12 h-6 rounded-full transition-colors duration-300 flex items-center px-0.5 disabled:opacity-60"
              style={{ backgroundColor: isAvailable ? '#10b981' : isDark ? '#374151' : '#d1d5db' }}
            >
              <motion.div
                layout
                transition={{ type: "spring", stiffness: 700, damping: 30 }}
                className="w-5 h-5 rounded-full bg-white shadow-md"
                style={{ marginLeft: isAvailable ? 'auto' : '0' }}
              />
            </button>
          </div>

          <div>
            <h3 className={`text-base font-black leading-tight transition-colors ${isDark ? "text-white" : "text-gray-900"}`}>Live Presence</h3>
            <div className="flex items-center gap-1.5 mt-1">
              <div className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-emerald-500' : 'bg-gray-400'}`} />
              <span className={`text-[10px] font-black uppercase tracking-widest ${isAvailable ? 'text-emerald-500' : 'text-gray-400'}`}>
                {isPersisting ? 'Saving...' : isAvailable ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Visibility Heat Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`rounded-[1.5rem] p-5 shadow-sm flex flex-col justify-between transition-colors duration-300 ${isDark ? "bg-black border border-white/10 shadow-none text-white" : "bg-[#1e2248]"}`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[9px] font-black uppercase tracking-widest ${isDark ? "text-blue-400" : "text-blue-300"}`}>Visibility Heat</span>
            <FaBolt className="text-amber-400 text-xs" />
          </div>

          <div>
            <div className={`text-3xl font-black tracking-tight ${isDark ? "text-white" : "text-white"}`}>High</div>
            <div className={`text-[10px] font-medium mt-0.5 ${isDark ? "text-blue-400" : "text-blue-300"}`}>Ranking Health</div>
          </div>

          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mt-2">
            <div className="h-full w-[80%] bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full" />
          </div>
        </motion.div>
      </div>

      {/* Row 2: GPS Accuracy + Presence Level */}
      <div className="grid grid-cols-2 gap-4">

        {/* GPS Accuracy */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className={`rounded-[1.5rem] p-5 shadow-sm flex items-center gap-3 transition-colors duration-300 ${isDark ? "bg-black border border-white/10 shadow-none" : "bg-white outline outline-1 outline-gray-200"}`}
        >
          <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
            isDark ? "bg-blue-500/10 border border-blue-500/20" : "bg-blue-50 border border-blue-100"
          }`}>
            <HiOutlineSignal className="text-xl text-blue-500" />
          </div>
          <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-tight">GPS<br />Accuracy</p>
            <p className={`text-sm font-black flex items-center gap-1 mt-1 transition-colors ${isDark ? "text-white" : "text-gray-900"}`}>
              {user?.locationUpdatedAt ? (
                <>Excellent <span className="text-blue-500">📶</span></>
              ) : (
                <span className="text-amber-500">Not Set</span>
              )}
            </p>
          </div>
        </motion.div>

        {/* Presence Level */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`rounded-[1.5rem] p-5 shadow-sm flex items-center gap-3 transition-colors duration-300 ${isDark ? "bg-black border border-white/10 shadow-none" : "bg-white outline outline-1 outline-gray-200"}`}
        >
          <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
            isDark ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-emerald-50 border border-emerald-100"
          }`}>
            <HiOutlineShieldCheck className="text-xl text-emerald-500" />
          </div>
          <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-tight">Presence<br />Level</p>
            <p className={`text-sm font-black mt-1 ${user?.locationUpdatedAt ? (isDark ? "text-white" : "text-gray-900") : "text-amber-500"}`}>
              {user?.locationUpdatedAt ? 'Verified' : 'Unverified'}
            </p>
          </div>
        </motion.div>
      </div>

      {/* GPS Location Verification Section */}
      <GPSLocationCard onUpdateSuccess={handleLocationUpdate} />

      {/* Row 3: Safe Radius + Auto-Fading */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`rounded-[1.5rem] p-5 shadow-sm relative overflow-hidden transition-colors duration-300 ${isDark ? "bg-black border border-white/10 shadow-none" : "bg-[#2a2e45]"}`}
        >
          <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-emerald-400" />
          <div className={`w-9 h-9 rounded-xl border flex items-center justify-center mb-4 transition-colors ${
            isDark ? "border-blue-500/30 bg-blue-500/10" : "border-blue-400/30"
          }`}>
            <FaShieldAlt className="text-blue-400 text-sm" />
          </div>
          <h4 className={`text-sm font-black mb-1 ${isDark ? "text-white" : "text-white"}`}>Safe Radius</h4>
          <p className={`text-[10px] font-medium leading-tight ${isDark ? "text-gray-400" : "text-gray-400"}`}>GPS Spoofing protection enabled with dynamic ping verification.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className={`rounded-[1.5rem] p-5 shadow-sm relative overflow-hidden transition-colors duration-300 ${isDark ? "bg-black border border-white/10 shadow-none" : "bg-[#2a2e45]"}`}
        >
          <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-emerald-400" />
          <div className={`w-9 h-9 rounded-xl border flex items-center justify-center mb-4 transition-colors ${
            isDark ? "border-emerald-500/30 bg-emerald-500/10" : "border-emerald-400/30"
          }`}>
            <FaSatelliteDish className="text-emerald-400 text-sm" />
          </div>
          <h4 className={`text-sm font-black mb-1 ${isDark ? "text-white" : "text-white"}`}>Auto-Fading</h4>
          <p className={`text-[10px] font-medium leading-tight ${isDark ? "text-gray-400" : "text-gray-400"}`}>Inactive locations auto-removed from map after 7 days for fairness.</p>
        </motion.div>
      </div>
    </div>
  );
};

export default LocationSettingsPanel;
