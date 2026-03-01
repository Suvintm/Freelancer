import { useRef } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { FaUserCircle, FaStar, FaMapMarkerAlt, FaWhatsapp, FaChevronUp, FaBolt, FaArrowRight, FaSmile } from "react-icons/fa";

const MobileEditorCard = ({ editor, onClick }) => {
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(editor)}
      className="p-4 bg-gray-50/50 border border-gray-100 rounded-3xl flex items-center gap-4 active:bg-gray-100 transition-colors"
    >
      <div className="relative">
        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gray-100 border-2 border-white shadow-sm">
          {editor.profilePicture ? (
            <img src={editor.profilePicture} alt={editor.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl text-gray-300">
              <FaUserCircle />
            </div>
          )}
        </div>
        {editor.isOnline && (
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h4 className="font-bold text-gray-900 truncate">{editor.name}</h4>
          <span className="text-[10px] font-black text-amber-500 flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
            <FaStar /> 4.9
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
            <FaMapMarkerAlt className="text-emerald-500" />
            {editor.distance} km
          </span>
          <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
            Top Match
          </span>
        </div>
      </div>
      
      <button className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-colors">
        <FaWhatsapp />
      </button>
    </motion.div>
  );
};

const MobileDiscoverySheet = ({ editors, isLoading, onEditorSelect, onAutoMatch, hasSearched }) => {
  const dragControls = useDragControls();
  const constraintsRef = useRef(null);

  return (
    <div className="md:hidden fixed inset-0 pointer-events-none z-[3000]">
      <div ref={constraintsRef} className="absolute inset-0" />
      
      <motion.div
        drag="y"
        dragControls={dragControls}
        dragConstraints={{ top: 80, bottom: window.innerHeight - 150 }}
        dragElastic={0.05}
        initial={{ y: window.innerHeight - 300 }} // Increased peek height
        animate={{ y: undefined }}
        whileDrag={{ cursor: "grabbing" }}
        className="absolute bottom-0 left-0 right-0 h-[90vh] bg-white/95 backdrop-blur-xl rounded-t-[2.5rem] shadow-[0_-20px_50px_rgba(0,0,0,0.1)] border-t border-gray-100 pointer-events-auto flex flex-col overflow-hidden"
      >
        {/* Handle Bar */}
        <div className="w-full pt-4 pb-4 flex flex-col items-center cursor-grab active:cursor-grabbing">
          <div className="w-12 h-1.5 bg-gray-200 rounded-full mb-2" />
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            <p className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.2em]">Live discovery</p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pb-32 pt-2">
          {/* Sheet Header Section */}
          <div className="px-6 mb-6">
            <AnimatePresence mode="wait">
              {hasSearched ? (
                <motion.h3 
                  key="results"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-2xl font-black text-gray-900 leading-tight"
                >
                  {editors.length} Professional <br/>
                  <span className="text-emerald-500">Editors </span> 
                  <span className="text-gray-300 font-medium text-lg">found</span>
                </motion.h3>
              ) : (
                <motion.h3 
                  key="idle"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-2xl font-black text-gray-900 leading-tight"
                >
                  Get your <br/>
                  <span className="text-emerald-500 font-black italic tracking-tighter uppercase mr-2">Pro</span>
                  <span className="text-gray-900 underline decoration-emerald-500 decoration-4 underline-offset-4 font-black">Editor</span> 
                </motion.h3>
              )}
            </AnimatePresence>
            
            {/* Embedded Category Filters (Always visible for context) */}
            <div className="flex gap-2 overflow-x-auto mt-6 pb-2 no-scrollbar">
              {["All", "Video Editor", "VFX Artist", "Colorist", "Animators"].map((chip, i) => (
                <button 
                  key={i} 
                  className={`px-5 py-2.5 rounded-2xl whitespace-nowrap text-[10px] font-black uppercase tracking-widest border transition-all ${
                    i === 0 
                      ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/10" 
                      : "bg-gray-50 border-gray-100 text-gray-400 hover:border-emerald-200 hover:text-emerald-500"
                  }`}
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Premium AI Match Card */}
            <motion.button 
              onClick={onAutoMatch}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gray-900 rounded-3xl p-5 mb-8 flex items-center justify-between shadow-2xl shadow-black/20 border border-white/5 mt-6"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                  <FaBolt className="text-xl" />
                </div>
                <div className="text-left">
                  <h4 className="text-sm font-black text-white">Smart AI Match</h4>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{hasSearched ? "Identify Best Professional" : "Auto-Identify Nearby"}</p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/50">
                <FaChevronUp className="text-xs" />
              </div>
            </motion.button>
          </div>

          <div className="px-6 space-y-4 pb-20">
            {isLoading ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="h-32 bg-gray-50 rounded-3xl animate-pulse" />
              ))
            ) : hasSearched ? (
              editors.length > 0 ? (
                editors.map((editor) => (
                  <MobileEditorCard 
                    key={editor._id} 
                    editor={editor} 
                    onClick={onEditorSelect}
                  />
                ))
              ) : (
                <div className="text-center py-20 px-10">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-100 shadow-sm">
                    <FaMapMarkerAlt className="text-3xl text-gray-200" />
                  </div>
                  <h4 className="text-lg font-black text-gray-900 mb-2">No Editors Nearby</h4>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
                     Try expanding your search radius to find more professionals
                  </p>
                  <button 
                     onClick={() => window.scrollTo(0, 0)}
                     className="mt-8 px-8 py-4 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-black/10 active:scale-95 transition-all"
                  >
                    Adjust Radius
                  </button>
                </div>
              )
            ) : (
              <div className="text-center py-20 px-10">
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-100 shadow-sm">
                  <FaSmile className="text-3xl text-emerald-500" />
                </div>
                <h4 className="text-lg font-black text-gray-900 mb-2">Ready to Start?</h4>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-relaxed mb-8">
                   Tap the button on the map <br/> or use the AI Smart Match to begin scouting
                </p>
                <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white mx-auto animate-bounce">
                  <FaArrowRight className="rotate-90" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Floating Quick Action Overlay (Bottom Shadow Fade - Light Mode) */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
      </motion.div>
    </div>
  );
};

export default MobileDiscoverySheet;
