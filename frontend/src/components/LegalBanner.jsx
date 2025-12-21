import { useState } from "react";
import { FaShieldAlt, FaLock, FaChevronDown } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useAppContext } from "../context/AppContext";

const LegalBanner = () => {
  const { user } = useAppContext();
  const [isExpanded, setIsExpanded] = useState(false);

  // Show ONLY if accepted
  if (!user?.legalAcceptance?.contentPolicyAccepted) return null;

  return (
    <div className="bg-[#0f1115] border border-emerald-900/40 rounded-xl overflow-hidden mb-6 relative group">
      <div className="absolute top-0 right-0 p-3 opacity-10">
        <FaShieldAlt className="text-6xl text-emerald-500" />
      </div>

      <div className="relative z-10">
        {/* Collapsible Header - Always Visible */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-4 md:p-5 flex items-center justify-between hover:bg-emerald-500/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <FaLock className="text-emerald-500 text-sm" />
            </div>
            <h3 className="font-bold text-emerald-400 text-sm md:text-base text-left">
              You have accepted the Content Protection & Confidentiality Agreement
            </h3>
          </div>

          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0 ml-3"
          >
            <FaChevronDown className="text-emerald-500 text-sm" />
          </motion.div>
        </button>

        {/* Expandable Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="px-4 md:px-5 pb-4 pt-2">
                {/* Agreement Details */}
                <div className="bg-emerald-500/5 rounded-lg p-4 mb-3 border border-emerald-500/10">
                  <p className="text-gray-300 text-xs md:text-sm leading-relaxed mb-3">
                    ✅ This confirms that you understand:
                  </p>
                  <ul className="list-disc pl-5 space-y-2 text-gray-400 text-xs md:text-sm">
                    <li>All client content is <strong className="text-gray-300">confidential</strong></li>
                    <li>Any misuse, sharing, or unauthorized use is <strong className="text-red-400">strictly prohibited</strong></li>
                    <li>You are <strong className="text-amber-400">fully responsible</strong> for all actions taken after accessing client content</li>
                    <li>Content must be <strong className="text-gray-300">deleted</strong> after project completion</li>
                  </ul>
                </div>

                {/* Footer Section */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-emerald-500/10">
                  <span className="text-[10px] md:text-xs text-red-400/80 font-medium flex items-center gap-1">
                    ⚠️ Any violation may result in account suspension or legal action.
                  </span>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open('mailto:legal@suvix.com?subject=Content Misuse Report', '_blank');
                      }}
                      className="text-[10px] md:text-xs text-gray-500 hover:text-red-400 font-medium transition-colors underline"
                    >
                      Report Content Misuse
                    </button>

                    {user.legalAcceptance.acceptedAt && (
                      <div className="text-[10px] md:text-xs text-gray-600 font-mono">
                        Accepted: {new Date(user.legalAcceptance.acceptedAt).toLocaleDateString()} • v{user.legalAcceptance.agreementVersion}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default LegalBanner;
