import { motion } from "framer-motion";
import { FaStar, FaCheckCircle, FaTrophy, FaMapMarkerAlt, FaEye } from "react-icons/fa";
import { HiOutlineMapPin } from "react-icons/hi2";
import { useNavigate } from "react-router-dom";

const MiniProfileCard = ({ editor, onClose }) => {
  const navigate = useNavigate();

  if (!editor) return null;

  const handleViewProfile = () => {
    navigate(`/editor/${editor._id}`);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="bg-[#0f1115] border border-emerald-500/20 rounded-xl shadow-2xl overflow-hidden w-80"
    >
      {/* Header with distance badge */}
      <div className="relative bg-gradient-to-r from-emerald-500/10 to-blue-500/10 p-4 border-b border-white/5">
        <div className="absolute top-3 right-3 bg-emerald-500/20 border border-emerald-500/30 px-2 py-1 rounded-full">
          <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
            <HiOutlineMapPin className="text-sm" />
            {editor.approxLocation?.distance ? `${editor.approxLocation.distance}km away` : "Nearby"}
          </p>
        </div>

        <div className="flex items-start gap-3">
          {/* Profile Photo */}
          <div className="relative flex-shrink-0">
            <img
              src={editor.profilePhoto || "https://via.placeholder.com/64"}
              alt={editor.name}
              className="w-16 h-16 rounded-full border-2 border-emerald-500/30 object-cover"
            />
            {editor.badges?.includes("verified") && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-[#0f1115]">
                <FaCheckCircle className="text-white text-xs" />
              </div>
            )}
          </div>

          {/* Name & Location */}
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold text-lg truncate">{editor.name}</h3>
            <p className="text-gray-400 text-xs flex items-center gap-1 mt-1">
              <FaMapMarkerAlt className="text-emerald-400" />
              {editor.approxLocation?.city}, {editor.approxLocation?.state}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="p-4 space-y-3">
        {/* Skills */}
        <div>
          <p className="text-xs text-gray-500 mb-2">Specialization</p>
          <div className="flex flex-wrap gap-2">
            {editor.skills?.map((skill, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded-md text-xs text-blue-400 font-medium"
              >
                {skill}
              </span>
            )) || <span className="text-gray-600 text-xs">No skills listed</span>}
          </div>
        </div>

        {/* Rating & Score */}
        <div className="grid grid-cols-2 gap-3">
          {/* Rating */}
          <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg p-3">
            <div className="flex items-center gap-1 mb-1">
              <FaStar className="text-amber-400 text-sm" />
              <span className="text-white font-bold text-lg">{editor.rating?.toFixed(1) || "N/A"}</span>
            </div>
            <p className="text-xs text-gray-500">Rating</p>
          </div>

          {/* Suvix Score */}
          <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-3">
            <div className="flex items-center gap-1 mb-1">
              <FaTrophy className="text-emerald-400 text-sm" />
              <span className="text-white font-bold text-lg">{editor.suvixScore || 0}</span>
            </div>
            <p className="text-xs text-gray-500">Suvix Score</p>
          </div>
        </div>

        {/* Availability */}
        <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-gray-700/30">
          <span className="text-xs text-gray-400">Availability</span>
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                editor.availability === "available" ? "bg-emerald-500 animate-pulse" : "bg-gray-500"
              }`}
            />
            <span className={`text-xs font-medium ${editor.availability === "available" ? "text-emerald-400" : "text-gray-500"}`}>
              {editor.availability === "available" ? "Available Now" : "Busy"}
            </span>
          </div>
        </div>

        {/* Completed Orders */}
        <div className="text-center p-2 bg-purple-500/5 border border-purple-500/10 rounded-lg">
          <p className="text-xs text-gray-500">
            <strong className="text-white font-semibold">{editor.completedOrders || 0}</strong> orders completed
          </p>
        </div>

        {/* Local Verified Badge */}
        <div className="flex items-center justify-center gap-2 p-2 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 rounded-lg">
          <FaCheckCircle className="text-emerald-400" />
          <span className="text-xs text-emerald-300 font-semibold">📍 Local Verified Editor</span>
        </div>
      </div>

      {/* Action Button */}
      <div className="p-4 pt-0">
        <button
          onClick={handleViewProfile}
          className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white font-semibold transition-all flex items-center justify-center gap-2"
        >
          <FaEye />
          <span>View Full Profile</span>
        </button>
      </div>
    </motion.div>
  );
};

export default MiniProfileCard;
