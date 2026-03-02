import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  FaStar, 
  FaMapMarkerAlt, 
  FaCheckCircle, 
  FaWhatsapp, 
  FaUserCircle,
  FaSearch,
  FaFilter
} from "react-icons/fa";

const EditorCard = ({ editor, isSelected, onClick }) => {
  const navigate = useNavigate();
  const rating = editor.ratingStats?.averageRating?.toFixed(1) || "N/A";
  const displaySkills = editor.skills?.slice(0, 2) || [];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      onClick={() => onClick(editor)}
      className={`group relative p-5 rounded-3xl cursor-pointer transition-all duration-300 border ${
        isSelected 
          ? "bg-white border-emerald-500/50 shadow-2xl shadow-emerald-500/10" 
          : "bg-gray-50/50 border-gray-100 hover:border-emerald-200 hover:bg-white"
      }`}
    >
      <div className="flex gap-4">
        {/* Profile Picture with Online Glow */}
        <div className="relative flex-shrink-0">
          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 border-2 border-white group-hover:border-emerald-500/30 transition-colors shadow-sm">
            {editor.profilePicture ? (
              <img src={editor.profilePicture} alt={editor.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl text-gray-300">
                <FaUserCircle />
              </div>
            )}
          </div>
          {editor.isOnline && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-4 border-white rounded-full shadow-lg"></div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h4 className="font-bold text-gray-900 truncate group-hover:text-emerald-600 transition-colors">
              {editor.name}
            </h4>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 rounded-full border border-amber-100">
              <FaStar className="text-amber-500 text-[10px]" />
              <span className="text-[10px] font-black text-amber-700">{rating}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-3">
            <span className="flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              <FaMapMarkerAlt className="text-emerald-500" />
              {editor.distance} km
            </span>
            <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
              Available Now
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {displaySkills.length > 0 ? displaySkills.map((skill, i) => (
              <span key={i} className="px-2 py-0.5 bg-gray-100 rounded-md text-[9px] font-bold text-gray-600 border border-gray-200">
                {skill}
              </span>
            )) : (
              <span className="px-2 py-0.5 bg-gray-100 rounded-md text-[9px] font-bold text-gray-400 border border-gray-200 uppercase tracking-tighter">
                Verified Pro
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons overlay when selected */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-5 flex gap-2"
          >
            <button className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black rounded-xl shadow-lg transition-all flex items-center justify-center gap-2">
              <FaWhatsapp className="text-sm" />
              WhatsApp
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/editor/${editor._id}`);
              }}
              className="flex-1 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-black rounded-xl transition-all"
            >
              View Profile
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Relevance Tag */}
      {editor.relevanceScore > 80 && (
        <div className="absolute top-0 right-8 -translate-y-1/2 px-3 py-1 bg-emerald-500 text-[9px] font-black text-white rounded-full shadow-lg">
          {Math.round(editor.relevanceScore)}% MATCH
        </div>
      )}
    </motion.div>
  );
};

const NearbyEditorList = ({ editors, isLoading, selectedEditorId, onEditorSelect }) => {
  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-100 shadow-2xl">
      {/* Sidebar Header */}
      <div className="p-8 pb-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-gray-900 tracking-tighter">Locals <span className="text-emerald-500">Nearby</span></h2>
          <div className="flex gap-2">
            <button className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 transition-all">
              <FaSearch className="text-sm" />
            </button>
            <button className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20">
              <FaFilter className="text-sm" />
            </button>
          </div>
        </div>

        {/* Info Pill */}
        <div className="px-4 py-2 bg-blue-50 border border-blue-100 rounded-2xl flex items-center gap-3">
          <FaCheckCircle className="text-blue-500 text-xs" />
          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
            {editors.length} Verified Professionals found
          </p>
        </div>
      </div>

      {/* Editor List */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 custom-scrollbar">
        {isLoading ? (
          Array(5).fill(0).map((_, i) => (
            <div key={i} className="h-28 bg-gray-50 rounded-3xl animate-pulse" />
          ))
        ) : (
          <AnimatePresence mode="popLayout">
            {editors.map((editor) => (
              <EditorCard
                key={editor._id}
                editor={editor}
                isSelected={selectedEditorId === editor._id}
                onClick={onEditorSelect}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Sticky Bottom Actions? */}
      <div className="p-6 border-t border-gray-100 bg-white shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
        <button className="w-full py-4 bg-gray-900 text-white font-black text-xs rounded-2xl hover:bg-black transition-all shadow-xl">
          Search in different area
        </button>
      </div>
    </div>
  );
};

export default NearbyEditorList;
