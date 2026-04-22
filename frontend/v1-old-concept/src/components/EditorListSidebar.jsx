import { useState } from "react";
import { motion } from "framer-motion";
import { FaSearch, FaMapMarkerAlt, FaStar } from "react-icons/fa";
import { HiOutlineMapPin } from "react-icons/hi2";

const EditorListSidebar = ({ editors, selectedEditor, onSelectEditor, isLoading }) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredEditors = editors.filter(editor =>
    editor.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full bg-gradient-to-b from-violet-600 to-indigo-600 flex flex-col">
      {/* Search Box */}
      <div className="p-5 border-b border-white/10">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 text-sm" />
          <input
            type="text"
            placeholder="Filter Editors"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 text-sm focus:outline-none focus:border-white/40 transition-colors"
          />
        </div>
      </div>

      {/* Editor List */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {isLoading ? (
          <div className="p-5 text-center">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
            <p className="text-white/60 text-sm mt-2">Loading...</p>
          </div>
        ) : filteredEditors.length === 0 ? (
          <div className="p-5 text-center">
            <p className="text-white/60 text-sm">No editors found</p>
          </div>
        ) : (
          <div className="p-3">
            {filteredEditors.map((editor) => (
              <motion.button
                key={editor._id}
                onClick={() => onSelectEditor(editor)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full p-3 rounded-lg mb-2 flex items-center gap-3 transition-all ${
                  selectedEditor?._id === editor._id
                    ? "bg-white/20 border border-white/30"
                    : "bg-white/5 border border-transparent hover:bg-white/10"
                }`}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <img
                    src={editor.profilePhoto || "https://via.placeholder.com/40"}
                    alt={editor.name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-white/30"
                  />
                  {editor.availability === "available" && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-violet-600 rounded-full" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 text-left min-w-0">
                  <p className="text-white font-semibold text-sm truncate">{editor.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex items-center gap-1">
                      <FaStar className="text-amber-400 text-xs" />
                      <span className="text-white/70 text-xs">{editor.rating?.toFixed(1) || "N/A"}</span>
                    </div>
                    {editor.approxLocation?.distance && (
                      <>
                        <span className="text-white/40">•</span>
                        <span className="text-white/70 text-xs">{editor.approxLocation.distance}km</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Distance Badge */}
                {editor.approxLocation?.distance && (
                  <div className="flex-shrink-0 px-2 py-1 bg-cyan-500/20 border border-cyan-400/30 rounded-md">
                    <span className="text-cyan-300 text-xs font-semibold">
                      {editor.approxLocation.distance}km
                    </span>
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="p-4 border-t border-white/10">
        <div className="text-center">
          <p className="text-white/90 font-bold text-lg">{filteredEditors.length}</p>
          <p className="text-white/60 text-xs">Editors Found</p>
        </div>
      </div>
    </div>
  );
};

export default EditorListSidebar;
