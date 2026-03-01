import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaMapMarkerAlt, 
  FaCrosshairs, 
  FaShieldAlt, 
  FaCheckCircle, 
  FaExclamationTriangle,
  FaClock,
  FaArrowRight
} from "react-icons/fa";
import { HiOutlineMapPin } from "react-icons/hi2";
import axios from "axios";
import { toast } from "react-toastify";
import { useAppContext } from "../context/AppContext";

const LocationVerificationCard = ({ onUpdateSuccess }) => {
  const { user } = useAppContext();
  const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  const [isDetecting, setIsDetecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [cooldown, setCooldown] = useState(0); // Cooldown in seconds
  const [accuracy, setAccuracy] = useState(null);
  const [serviceRadius, setServiceRadius] = useState(user?.serviceRadius || 25);
  const [coords, setCoords] = useState(null);

  // Handle countdown for anti-spam guard
  useEffect(() => {
    if (user?.locationUpdatedAt) {
      const lastUpdate = new Date(user.locationUpdatedAt).getTime();
      const now = new Date().getTime();
      const diff = 30 * 60 * 1000 - (now - lastUpdate);
      if (diff > 0) {
        setCooldown(Math.ceil(diff / 1000));
      }
    }
  }, [user?.locationUpdatedAt]);

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
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
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsDetecting(true);
    setAccuracy(null);
    setCoords(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const currentCoords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        const currentAccuracy = position.coords.accuracy;

        setCoords(currentCoords);
        setAccuracy(currentAccuracy);
        setIsDetecting(false);

        if (currentAccuracy > 500) {
          toast.warning(`Poor GPS Accuracy (${Math.round(currentAccuracy)}m). Please move to an open area or window and try again.`);
        } else {
          toast.success("Location pinpointed with high accuracy!");
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        toast.error("Failed to capture GPS. Please ensure location permissions are enabled.");
        setIsDetecting(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const saveVerifiedLocation = async () => {
    if (!coords || accuracy > 500) return;

    setIsSaving(true);
    try {
      const { data } = await axios.patch(
        `${backendURL}/api/location/settings`,
        {
          coordinates: coords,
          accuracy: accuracy,
          serviceRadius: serviceRadius,
        },
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );

      toast.success("✅ Work location verified and updated!");
      if (onUpdateSuccess) onUpdateSuccess(data.data);
      setCoords(null);
      setAccuracy(null);
    } catch (error) {
      console.error("Failed to save location:", error);
      toast.error(error.response?.data?.message || "Failed to verify location");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-xl">
      {/* Premium Gradient Header */}
      <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-600 p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
              <HiOutlineMapPin className="text-3xl text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white tracking-tight">Verified Static Presence</h3>
              <p className="text-white/80 text-sm font-medium">Uber-style marketplace discovery</p>
            </div>
          </div>
          <div className="hidden sm:block">
            <FaShieldAlt className="text-4xl text-white/20" />
          </div>
        </div>
      </div>

      <div className="p-8 space-y-8">
        {/* Status Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${user?.locationUpdatedAt ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
              <FaCheckCircle className="text-xl" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">Presence Status</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                {user?.locationUpdatedAt ? "Verified & Active" : "Not Verified Yet"}
              </p>
            </div>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <FaClock className="text-xl" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">Last Sync</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                {user?.locationUpdatedAt ? new Date(user.locationUpdatedAt).toLocaleDateString() : "Never"}
              </p>
            </div>
          </div>
        </div>

        {/* Verification Logic */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FaCrosshairs className="text-emerald-500" />
              Capture Work Location
            </label>
            {cooldown > 0 && (
              <span className="text-xs font-bold text-amber-500 flex items-center gap-1 bg-amber-500/10 px-3 py-1 rounded-full">
                <FaClock /> Cooldown: {formatCooldown(cooldown)}
              </span>
            )}
          </div>

          <button
            id="gps-capture-btn"
            onClick={handleVerifyLocation}
            disabled={isDetecting || cooldown > 0}
            className="w-full group relative overflow-hidden px-8 py-5 bg-gray-900 dark:bg-white rounded-2xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100 shadow-2xl"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-center gap-3">
              {isDetecting ? (
                <>
                  <div className="w-6 h-6 border-3 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                  <span className="text-white dark:text-black font-extrabold tracking-tight">Pinpointing GPS...</span>
                </>
              ) : (
                <>
                  <FaCrosshairs className="text-emerald-500 text-xl group-hover:rotate-90 transition-transform duration-500" />
                  <span className="text-white dark:text-black font-extrabold tracking-tight">
                    {coords ? "Recapture Location" : "Update My Static Work Location"}
                  </span>
                </>
              )}
            </div>
          </button>

          <AnimatePresence>
            {coords && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className={`p-6 rounded-2xl border ${accuracy <= 500 ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {accuracy <= 500 ? (
                        <FaCheckCircle className="text-2xl text-emerald-500" />
                      ) : (
                        <FaExclamationTriangle className="text-2xl text-amber-500" />
                      )}
                      <div>
                        <p className={`font-bold ${accuracy <= 500 ? 'text-emerald-900 dark:text-emerald-100' : 'text-amber-900 dark:text-amber-100'}`}>
                          GPS Signal Captured
                        </p>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          Accuracy: ±{Math.round(accuracy)} meters
                        </p>
                      </div>
                    </div>
                  </div>

                  {accuracy <= 500 && (
                    <button
                      onClick={saveVerifiedLocation}
                      disabled={isSaving}
                      className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl shadow-[0_8px_20px_-6px_rgba(16,185,129,0.4)] transition-all flex items-center justify-center gap-2"
                    >
                      {isSaving ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>Verify & Set Location</span>
                          <FaArrowRight />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Service Radius Slider */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FaMapMarkerAlt className="text-blue-500" />
              Service Radius (Discovery Area)
            </label>
            <span className="text-sm font-black text-blue-500 bg-blue-500/10 px-3 py-1 rounded-full">
              {serviceRadius} km
            </span>
          </div>
          <input
            id="radius-slider"
            type="range"
            min="5"
            max="100"
            step="5"
            value={serviceRadius}
            onChange={(e) => setServiceRadius(parseInt(e.target.value))}
            className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
            <span>Local (5km)</span>
            <span>City-wide (25km)</span>
            <span>State (100km)</span>
          </div>
        </div>

        {/* Privacy Note Overlay */}
        <div className="p-5 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-800/30">
          <div className="flex gap-4">
            <FaShieldAlt className="text-xl text-blue-500 flex-shrink-0 mt-1" />
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 leading-relaxed">
              We apply a randomized <span className="text-blue-600 dark:text-blue-400 font-bold">±200m offset</span> to your marker for safety. Your exact pinpoint is only shared after a client books a physical job.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationVerificationCard;
