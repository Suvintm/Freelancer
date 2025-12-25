import { useState, useEffect } from "react";
import { FaCheckCircle, FaTimes } from "react-icons/fa";
import { HiOutlineShieldCheck } from "react-icons/hi2";
import { motion, AnimatePresence } from "framer-motion";
import { useAppContext } from "../context/AppContext";

const LegalBanner = () => {
  const { user } = useAppContext();
  const [isDismissed, setIsDismissed] = useState(false);

  // Check if already dismissed this session
  useEffect(() => {
    const dismissed = sessionStorage.getItem('legalBannerDismissed');
    if (dismissed) setIsDismissed(true);
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('legalBannerDismissed', 'true');
  };

  // Show ONLY if accepted and not dismissed
  if (!user?.legalAcceptance?.contentPolicyAccepted || isDismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10, height: 0 }}
        className="mb-4"
      >
        <div className="relative bg-[#111118] light:bg-white border border-indigo-500/20 light:border-indigo-100 rounded-xl px-4 py-3 flex items-center gap-3 group">
          {/* Icon */}
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-500/10 light:bg-indigo-50 flex items-center justify-center">
            <HiOutlineShieldCheck className="text-indigo-400 light:text-indigo-500 text-lg" />
          </div>
          
          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-zinc-300 light:text-slate-700 flex items-center gap-2 truncate">
              <FaCheckCircle className="text-indigo-400 light:text-indigo-500 text-xs flex-shrink-0" />
              <span className="truncate">
                You have accepted the Content Protection & Confidentiality Agreement
              </span>
            </p>
          </div>

          {/* Dismiss Button */}
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1.5 rounded-lg text-zinc-500 light:text-slate-400 hover:text-zinc-300 light:hover:text-slate-600 hover:bg-white/5 light:hover:bg-slate-100 transition-all opacity-0 group-hover:opacity-100"
            title="Dismiss"
          >
            <FaTimes className="text-xs" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LegalBanner;
