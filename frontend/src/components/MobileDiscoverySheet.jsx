import { useRef, useEffect } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { FaUserCircle, FaStar, FaMapMarkerAlt, FaWhatsapp, FaChevronUp, FaBolt, FaArrowRight, FaSmile, FaPlay } from "react-icons/fa";

// Premium Mobile Editor Card for Discovery Sheet
const MobileEditorCard = ({ editor, onClick }) => {
  const photoUrl = editor.profilePicture || 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(editor)}
      className="p-5 bg-gray-50/80 backdrop-blur-md rounded-[2rem] border border-gray-100 flex gap-4 cursor-pointer active:bg-gray-100 transition-all group"
    >
      <div className="relative flex-shrink-0">
        <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-white shadow-sm">
          <img src={photoUrl} className="w-full h-full object-cover" />
        </div>
        {editor.isOnline && (
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <h4 className="font-bold text-gray-900 truncate">{editor.name}</h4>
          <div className="flex items-center gap-1">
            <FaStar className="text-amber-500 text-[10px]" />
            <span className="text-[10px] font-black text-gray-900">4.9</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3 mb-3">
          <span className="flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
            <FaMapMarkerAlt className="text-emerald-500" />
            {editor.distance} km
          </span>
          <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
             Available
          </span>
        </div>

        <div className="flex items-center justify-between">
           <div className="flex -space-x-1.5 overflow-hidden">
             {['PR', 'AE', 'VFX'].map((tag, i) => (
               <div key={i} className="px-2 py-0.5 rounded-lg bg-white border border-gray-100 text-[8px] font-black text-gray-400">
                 {tag}
               </div>
             ))}
           </div>
           <button className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 active:bg-emerald-600">
             <FaWhatsapp className="text-xs" />
           </button>
        </div>
      </div>
    </motion.div>
  );
};

const MobileDiscoverySheet = ({ editors, isLoading, onEditorSelect, onAutoMatch, hasSearched, onStartDiscovery }) => {
  const dragControls = useDragControls();
  const constraintsRef = useRef(null);

  // Dynamic Height Logic: Expand more when editors are found
  const getInitialY = () => {
    if (!hasSearched) return window.innerHeight - 220; // Default peek
    if (isLoading) return window.innerHeight - 320; // Searching state
    if (editors.length > 0) return window.innerHeight - 500; // Found state
    return window.innerHeight - 320;
  };

  return (
    <div className="md:hidden fixed inset-0 pointer-events-none z-[3000]">
      <div ref={constraintsRef} className="absolute inset-0" />
      
      <motion.div
        drag="y"
        dragControls={dragControls}
        dragConstraints={{ 
          top: 200, // Limit top height so map is visible
          bottom: window.innerHeight - 150 
        }}
        dragElastic={0.05}
        initial={false}
        animate={{ y: getInitialY() }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        whileDrag={{ cursor: "grabbing" }}
        className="absolute bottom-0 left-0 right-0 h-[90vh] bg-white/95 backdrop-blur-xl rounded-t-[2.5rem] shadow-[0_-20px_50px_rgba(0,0,0,0.1)] border-t border-gray-100 pointer-events-auto flex flex-col overflow-hidden"
      >
        {/* Handle Bar & Searching Status */}
        <div className="w-full pt-4 pb-4 flex flex-col items-center cursor-grab active:cursor-grabbing relative">
          <div className="w-12 h-1.5 bg-gray-200 rounded-full mb-2" />
          
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.2em]">Live discovery</p>
            </div>

            <AnimatePresence>
              {isLoading && hasSearched && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex items-center gap-1.5"
                >
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] animate-pulse">Searching...</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pb-32 pt-2">
          {/* Sheet Header Section */}
          <div className="px-6 mb-6">
            <div className="flex items-start justify-between gap-4">
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

              {/* Start Button (Visible when not searched) */}
              {!hasSearched && (
                <motion.button
                  onClick={onStartDiscovery}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center shadow-lg group-hover:bg-emerald-600 transition-colors">
                    <FaPlay className="text-xs ml-0.5" />
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 group-hover:text-emerald-600 transition-colors">Start</span>
                </motion.button>
              )}
            </div>
            
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
            {isLoading && hasSearched ? (
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
                   Tap the Start button above <br/> or use the AI Smart Match to begin scouting
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
