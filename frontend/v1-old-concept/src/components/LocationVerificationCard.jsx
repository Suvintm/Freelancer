import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineMapPin, HiOutlineSparkles, HiOutlineGlobeAlt } from "react-icons/hi2";
import { FaGlobeAmericas, FaHandPointDown } from "react-icons/fa";
import { HiOutlineCheckCircle } from "react-icons/hi2";
import axios from "axios";
import { toast } from "react-toastify";
import { useAppContext } from "../context/AppContext";
import { useTheme } from "../context/ThemeContext";

export const DiscoveryReachCard = ({ onUpdateSuccess }) => {
  const { user, setUser } = useAppContext();
  const { isDark } = useTheme();
  const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  const [isSavingRadius, setIsSavingRadius] = useState(false);
  const [serviceRadius, setServiceRadius] = useState(user?.serviceRadius || 25);
  const [radiusSaved, setRadiusSaved] = useState(false);

  const savedRadius = user?.serviceRadius || 25;
  const hasRadiusChanged = serviceRadius !== savedRadius && !radiusSaved;

  useEffect(() => {
    if (user?.serviceRadius) setServiceRadius(user.serviceRadius);
  }, [user?.serviceRadius]);

  const handleRadiusChange = (e) => {
    setServiceRadius(parseInt(e.target.value));
    setRadiusSaved(false);
  };

  const handleSaveRadius = async () => {
    setIsSavingRadius(true);
    try {
      const { data } = await axios.patch(
        `${backendURL}/api/location/radius`,
        { serviceRadius },
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      setUser(prev => ({ ...prev, serviceRadius: data.serviceRadius }));
      setRadiusSaved(true);
      toast.success(`📡 Discovery reach set to ${data.serviceRadius}km!`);
      if (onUpdateSuccess) onUpdateSuccess({ serviceRadius: data.serviceRadius });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save reach.");
    } finally {
      setIsSavingRadius(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className={`rounded-[1.5rem] p-4 shadow-sm transition-colors duration-300 relative overflow-hidden ${isDark ? "bg-black border border-white/10 shadow-none" : "bg-white outline outline-1 outline-gray-200"}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
            isDark ? "bg-purple-500/10 border border-purple-500/20" : "bg-purple-100"
          }`}>
            <HiOutlineGlobeAlt className="text-lg text-purple-500" />
          </div>
          <div>
            <h4 className={`text-sm font-black leading-tight transition-colors ${isDark ? "text-white" : "text-gray-900"}`}>Discovery Reach</h4>
            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Visibility Radius</p>
          </div>
        </div>
        <div className="text-right">
          <span className={`text-xl font-black transition-colors ${isDark ? "text-white" : "text-gray-900"}`}>{serviceRadius}</span>
          <span className="text-[10px] font-black text-gray-400 ml-0.5">km</span>
        </div>
      </div>

      <div className="relative mb-2">
        <input
          type="range"
          min="5"
          max="400"
          step="5"
          value={serviceRadius}
          onChange={handleRadiusChange}
          className="w-full h-1 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${((serviceRadius - 5) / 395) * 100}%, ${isDark ? '#374151' : '#e5e7eb'} ${((serviceRadius - 5) / 395) * 100}%, ${isDark ? '#374151' : '#e5e7eb'} 100%)`
          }}
        />
      </div>

      <div className="flex justify-between text-[7px] font-black text-gray-400 uppercase tracking-widest mb-3">
        <span>Local</span>
        <span>City</span>
        <span>Max</span>
      </div>

      <AnimatePresence>
        {hasRadiusChanged && (
          <motion.div
            key="save-reach"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="relative"
          >
            <motion.div
              className="absolute -top-6 right-10 pointer-events-none z-10"
              animate={{ y: [0, -5, 0], rotate: [0, -5, 0] }}
              transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
            >
              <FaHandPointDown className={`text-xl ${isDark ? "text-white" : "text-gray-800"}`} />
            </motion.div>

            <button
              onClick={handleSaveRadius}
              disabled={isSavingRadius}
              className="w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/10"
            >
              {isSavingRadius ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <HiOutlineSparkles className="text-xs" />
                  <span>Save Reach · {serviceRadius}km</span>
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {radiusSaved && serviceRadius === savedRadius && !hasRadiusChanged && (
          <motion.div
            key="saved-badge"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex items-center gap-1.5 justify-center mt-1"
          >
            <HiOutlineCheckCircle className="text-emerald-500 text-sm" />
            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Reach Saved</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export const GPSLocationCard = ({ onUpdateSuccess }) => {
  const { user } = useAppContext();
  const { isDark } = useTheme();
  const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  const [isDetecting, setIsDetecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [accuracy, setAccuracy] = useState(null);
  const [coords, setCoords] = useState(null);

  useEffect(() => {
    if (user?.locationUpdatedAt) {
      const lastUpdate = new Date(user.locationUpdatedAt).getTime();
      const now = new Date().getTime();
      const diff = 30 * 60 * 1000 - (now - lastUpdate);
      if (diff > 0) setCooldown(Math.ceil(diff / 1000));
    }
  }, [user?.locationUpdatedAt]);

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const formatCooldown = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleVerifyLocation = () => {
    if (!navigator.geolocation) { toast.error("Geolocation not supported."); return; }
    setIsDetecting(true);
    setAccuracy(null);
    setCoords(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        setAccuracy(position.coords.accuracy);
        setIsDetecting(false);
        if (position.coords.accuracy > 500) {
          toast.warning("Poor GPS Signal. Move to an open area.");
        } else {
          toast.success("Location pinpointed!");
        }
      },
      () => { setIsDetecting(false); toast.error("GPS Failed. Check permissions."); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const saveVerifiedLocation = async () => {
    if (!coords || accuracy > 500) return;
    setIsSaving(true);
    try {
      const { data } = await axios.patch(
        `${backendURL}/api/location/settings`,
        { coordinates: coords, accuracy },
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      toast.success("Work Location Updated!");
      if (onUpdateSuccess) onUpdateSuccess(data.data);
      setCoords(null);
      setAccuracy(null);
    } catch (error) {
      toast.error(error.response?.data?.message || "Verification Failed");
    } finally { setIsSaving(false); }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className={`rounded-[1.5rem] p-5 shadow-sm transition-colors duration-300 ${isDark ? "bg-black border border-white/10 shadow-none" : "bg-white outline outline-1 outline-gray-200"}`}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors ${
          isDark ? "bg-blue-500/10 border border-blue-500/20" : "bg-blue-50 border border-blue-100"
        }`}>
          <FaGlobeAmericas className="text-blue-500 text-base" />
        </div>
        <div>
          <h4 className={`text-sm font-black transition-colors ${isDark ? "text-white" : "text-gray-900"}`}>Update Work Location</h4>
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
            {cooldown > 0 ? `Cooldown: ${formatCooldown(cooldown)}` : "GPS Pinpointing"}
          </p>
        </div>
      </div>

      <button
        onClick={handleVerifyLocation}
        disabled={isDetecting || cooldown > 0}
        className={`w-full py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-40 ${
          isDark ? "bg-white text-black hover:bg-gray-200" : "bg-gray-900 text-white hover:bg-black"
        }`}
      >
        {isDetecting ? (
          <>
            <div className={`w-3.5 h-3.5 border-2 rounded-full animate-spin ${isDark ? "border-black/30 border-t-black" : "border-white/30 border-t-white"}`} />
            <span>Pinpointing GPS...</span>
          </>
        ) : (
          <>
            <FaGlobeAmericas className="text-sm" />
            <span>{coords ? "Recapture Signal" : "Capture My Location"}</span>
          </>
        )}
      </button>

      <AnimatePresence>
        {coords && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className={`mt-4 p-3.5 rounded-2xl border transition-colors ${
              isDark
                ? (accuracy <= 500 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-amber-500/10 border-amber-500/20')
                : (accuracy <= 500 ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100')
            }`}>
              <p className={`text-[9px] font-black uppercase tracking-widest mb-3 ${accuracy <= 500 ? 'text-emerald-500' : 'text-amber-500'}`}>
                {accuracy <= 500 ? `✓ Signal Locked — ±${Math.round(accuracy)}m` : `⚠ Poor Signal — ±${Math.round(accuracy)}m`}
              </p>
              {accuracy <= 500 && (
                <button
                  onClick={saveVerifiedLocation}
                  disabled={isSaving}
                  className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-500/10"
                >
                  {isSaving ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <HiOutlineSparkles />
                      <span>Broadcast Location</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
