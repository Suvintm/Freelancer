import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaCheck, FaChevronDown, FaArrowRight } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const getProgressColor = (percent) => {
  if (percent >= 100) return '#10b981'; // Success Green
  if (percent >= 80) return '#00c348ff'; // Green
  if (percent >= 60) return '#61e609ff'; // Blue
  if (percent >= 40) return '#ffa200ff'; // Amber
  return '#EF4444'; // Red
};

const ProfileChecklist = ({ completionData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  if (!completionData) return null;

  const { percent, breakdown } = completionData;
  const isComplete = percent >= 100;

  const handleGo = (id) => {
    if (id === 'portfolio') {
      navigate('/editor-profile-update');
      return;
    }
    if (id === 'kycVerified') {
      navigate('/kyc-details');
      return;
    }
    navigate('/editor-profile-update');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-950/40 border border-zinc-800/40 rounded-2xl overflow-hidden mb-2 md:mb-6 backdrop-blur-sm"
    >
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="p-3 md:p-5 flex items-center justify-between cursor-pointer hover:bg-zinc-900/30 transition-all"
      >
        <div className="flex items-center gap-3 md:gap-4">
          <div className="relative w-10 h-10 md:w-12 md:h-12 flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="21" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                <circle 
                  cx="24" 
                  cy="24" 
                  r="21" 
                  fill="none" 
                  stroke={getProgressColor(percent)} 
                  strokeWidth="4" 
                  strokeDasharray="131.9" 
                  strokeDashoffset={131.9 - (131.9 * percent) / 100} 
                  strokeLinecap="round" 
                  className="transition-all duration-1000 ease-out"
                />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white">{percent}%</span>
          </div>
          <div>
            <h3 className="text-xs md:text-sm font-black text-white uppercase tracking-widest">Profile Health</h3>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight mt-0.5">
                {isComplete ? "Everything looks perfect!" : `${breakdown.filter(i => i.required && !i.complete).length} mission-critical tasks pending`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!isOpen && !isComplete && (
            <div className="hidden sm:flex gap-1">
              {breakdown.filter(i => i.required && !i.complete).slice(0, 2).map(item => (
                <div key={item.id} className="bg-zinc-900 border border-zinc-800 px-2 py-1 rounded text-[8px] font-black text-zinc-400 uppercase">
                  {item.label.split(' ')[0]}
                </div>
              ))}
            </div>
          )}
          <motion.div animate={{ rotate: isOpen ? 180 : 0 }} className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800">
              <FaChevronDown className="text-zinc-500 text-[10px]" />
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-zinc-900/50 bg-black/40"
          >
            <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {breakdown.filter(i => i.required).map((item) => (
                <div 
                  key={item.id} 
                  className={`flex items-center justify-between gap-4 p-3 rounded-xl border transition-all ${
                    item.complete ? "bg-emerald-500/5 border-emerald-500/10" : "bg-zinc-900/40 border-zinc-800/50 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      item.complete ? "bg-emerald-500 text-white" : "bg-zinc-800 text-zinc-600"
                    }`}>
                        {item.complete ? <FaCheck className="text-xs" /> : <FaArrowRight className="text-[10px] opacity-20" />}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-[11px] font-black uppercase tracking-wider ${item.complete ? "text-emerald-400" : "text-zinc-400"}`}>
                        {item.label}
                      </p>
                      <p className="text-[9px] text-zinc-500 font-bold uppercase truncate">
                        {item.complete ? "Task Secured" : "Required for 100%"}
                      </p>
                    </div>
                  </div>
                  {!item.complete && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleGo(item.id); }}
                        className="flex-shrink-0 px-4 py-2 bg-white text-black text-[9px] font-black rounded-lg uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all active:scale-95 shadow-lg shadow-black/20"
                    >
                        Fix Now
                    </button>
                  )}
                  {item.complete && (
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
                  )}
                </div>
              ))}
            </div>
            
            {/* Optional Bonus Tasks */}
            {breakdown.filter(i => !i.required && !i.complete).length > 0 && (
              <div className="px-6 pb-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-px flex-1 bg-zinc-900" />
                  <span className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.2em]">Bonus Tasks</span>
                  <div className="h-px flex-1 bg-zinc-900" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {breakdown.filter(i => !i.required && !i.complete).map(item => (
                    <button 
                      key={item.id}
                      onClick={() => navigate('/editor-profile-update')}
                      className="px-3 py-1.5 bg-zinc-950 border border-zinc-900 rounded-lg text-[9px] font-black text-zinc-500 hover:text-zinc-300 hover:border-zinc-800 transition-all uppercase"
                    >
                      + {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ProfileChecklist;
