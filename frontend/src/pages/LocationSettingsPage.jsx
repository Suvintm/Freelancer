import { motion } from "framer-motion";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import LocationSettingsPanel from "../components/LocationSettingsPanel";

const LocationSettingsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050509] via-[#0a0a0f] to-[#050509] p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-white/5"
          >
            <FaArrowLeft /> Back
          </button>
        </div>

        {/* Location Settings Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <LocationSettingsPanel />
        </motion.div>

        {/* Info Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="mt-6 bg-blue-500/5 border border-blue-500/10 rounded-xl p-6"
        >
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            ℹ️ How It Works
          </h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>• Toggle visibility to appear on the "Editors Near You" map for clients</li>
            <li>• Your exact location is never shared - only approximate city-level location</li>
            <li>• Clients within your selected visibility radius can discover you</li>
            <li>• You can change or remove your location anytime</li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
};

export default LocationSettingsPage;
