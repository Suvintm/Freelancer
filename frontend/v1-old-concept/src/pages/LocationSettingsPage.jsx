import { motion } from "framer-motion";
import { FaArrowLeft, FaBell } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import LocationSettingsPanel from "../components/LocationSettingsPanel";

const LocationSettingsPage = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();

  return (
    <div className={`min-h-screen pb-20 transition-colors duration-300 ${isDark ? "bg-black" : "bg-gray-100"}`}>
      {/* Header */}
      <div className={`px-5 pt-6 pb-5 sticky top-0 z-10 shadow-sm transition-colors duration-300 ${isDark ? "bg-black border-b border-white/10" : "bg-white"}`}>
        <button
          onClick={() => navigate(-1)}
          className={`flex items-center gap-1.5 mb-4 group transition-colors ${isDark ? "text-gray-400" : "text-gray-500"}`}
        >
          <FaArrowLeft className="text-xs group-hover:-translate-x-0.5 transition-transform" />
          <span className="text-sm font-medium">Back</span>
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className={`text-3xl font-black tracking-tight leading-none ${isDark ? "text-white" : "text-gray-900"}`}>
              Location{" "}
              <span className="text-emerald-500">Hub</span>
            </h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1.5">
              Smart Presence &amp; Discovery Settings
            </p>
          </div>
          <button className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors mt-1 ${isDark ? "bg-white/5 text-gray-400 hover:bg-white/10" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
            <FaBell className="text-sm" />
          </button>
        </div>
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="px-4 pt-5"
      >
        <LocationSettingsPanel />
      </motion.div>
    </div>
  );
};

export default LocationSettingsPage;
