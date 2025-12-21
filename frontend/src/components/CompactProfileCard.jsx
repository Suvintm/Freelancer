import { motion } from "framer-motion";
import { FaStar, FaTrophy, FaEye, FaTimes } from "react-icons/fa";
import { HiOutlineMapPin } from "react-icons/hi2";
import { useNavigate } from "react-router-dom";

const CompactProfileCard = ({ editor, onClose }) => {
  const navigate = useNavigate();

  if (!editor) return null;

  const handleViewProfile = () => {
    navigate(`/editor/${editor._id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden w-72"
    >
      {/* Header with Distance Badge */}
      <div className="relative bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 p-4">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/80 dark:bg-gray-700/80 hover:bg-white dark:hover:bg-gray-600 flex items-center justify-center transition-colors"
        >
          <FaTimes className="text-gray-600 dark:text-gray-300 text-xs" />
        </button>

        <div className="flex items-center gap-3">
          <img
            src={editor.profilePhoto || "https://via.placeholder.com/56"}
            alt={editor.name}
            className="w-14 h-14 rounded-full border-2 border-white dark:border-gray-700 object-cover shadow-md"
          />
          <div className="flex-1">
            <h4 className="text-gray-900 dark:text-white font-bold text-base">{editor.name}</h4>
            <p className="text-gray-600 dark:text-gray-400 text-xs flex items-center gap-1 mt-1">
              <HiOutlineMapPin className="text-violet-600 dark:text-violet-400" />
              {editor.approxLocation?.city}, {editor.approxLocation?.state}
            </p>
          </div>
        </div>

        {/* Distance Badge */}
        {editor.approxLocation?.distance && (
          <div className="absolute top-4 right-4 px-2.5 py-1 bg-cyan-500 rounded-full">
            <span className="text-white text-xs font-bold">{editor.approxLocation.distance}km</span>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="p-4 grid grid-cols-2 gap-3">
        {/* Rating */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <FaStar className="text-amber-500 text-sm" />
            <span className="text-gray-900 dark:text-white font-bold text-lg">{editor.rating?.toFixed(1) || "N/A"}</span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">Rating</p>
        </div>

        {/* Suvix Score */}
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <FaTrophy className="text-emerald-500 text-sm" />
            <span className="text-gray-900 dark:text-white font-bold text-lg">{editor.suvixScore || 0}</span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">Score</p>
        </div>
      </div>

      {/* Skills */}
      {editor.skills && editor.skills.length > 0 && (
        <div className="px-4 pb-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Skills</p>
          <div className="flex flex-wrap gap-1.5">
            {editor.skills.slice(0, 3).map((skill, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-violet-100 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-md text-xs text-violet-700 dark:text-violet-300 font-medium"
              >
                {skill}
              </span>
            ))}
            {editor.skills.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md text-xs text-gray-600 dark:text-gray-400">
                +{editor.skills.length - 3}
              </span>
            )}
          </div>
        </div>
      )}

      {/* View Profile Button */}
      <div className="p-4 pt-0">
        <button
          onClick={handleViewProfile}
          className="w-full px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 rounded-xl text-white font-semibold text-sm transition-all flex items-center justify-center gap-2"
        >
          <FaEye />
          View Full Profile
        </button>
      </div>
    </motion.div>
  );
};

export default CompactProfileCard;
