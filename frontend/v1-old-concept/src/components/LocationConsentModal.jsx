import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  HiOutlineMapPin, 
  HiOutlineShieldCheck, 
  HiOutlineLockClosed, 
  HiOutlineXMark,
  HiOutlineLightBulb
} from "react-icons/hi2";
import { useTheme } from "../context/ThemeContext";

const LocationConsentModal = ({ isOpen, onClose, onAccept, onSkip }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { isDark } = useTheme();

  const handleAccept = async () => {
    setIsLoading(true);
    try {
      await onAccept();
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-50 ${isDark ? 'bg-black/70' : 'bg-black/40'} backdrop-blur-sm`}
            onClick={onSkip}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className={`rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden ${
              isDark 
                ? 'bg-black border border-green-900/40' 
                : 'bg-white border border-gray-200'
            }`}>
              {/* Header - Compact */}
              <div className={`px-5 py-4 flex items-center justify-between border-b ${
                isDark ? 'border-green-900/30' : 'border-gray-100'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    isDark ? 'bg-green-500/15' : 'bg-green-50'
                  }`}>
                    <HiOutlineMapPin className={`text-lg ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                  </div>
                  <div>
                    <h2 className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Find Local Editors
                    </h2>
                    <p className={`text-xs ${isDark ? 'text-green-500/70' : 'text-gray-500'}`}>
                      Privacy-first location
                    </p>
                  </div>
                </div>
                <button
                  onClick={onSkip}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isDark 
                      ? 'text-gray-500 hover:text-white hover:bg-green-900/30' 
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <HiOutlineXMark className="text-lg" />
                </button>
              </div>

              {/* Content - Compact */}
              <div className="px-5 py-4 space-y-3">
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Allow location to find trusted editors near you.
                </p>

                {/* Privacy Features - Compact Grid */}
                <div className="space-y-2">
                  {/* Feature 1 */}
                  <div className={`flex items-center gap-2.5 p-2.5 rounded-lg ${
                    isDark ? 'bg-green-950/40 border border-green-900/30' : 'bg-green-50/50 border border-green-100'
                  }`}>
                    <HiOutlineShieldCheck className={`text-base flex-shrink-0 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                    <div>
                      <p className={`text-xs font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Exact location never shared
                      </p>
                      <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        Only approximate region
                      </p>
                    </div>
                  </div>

                  {/* Feature 2 */}
                  <div className={`flex items-center gap-2.5 p-2.5 rounded-lg ${
                    isDark ? 'bg-green-950/40 border border-green-900/30' : 'bg-green-50/50 border border-green-100'
                  }`}>
                    <HiOutlineMapPin className={`text-base flex-shrink-0 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                    <div>
                      <p className={`text-xs font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        City-level only
                      </p>
                      <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        Rounded coordinates
                      </p>
                    </div>
                  </div>

                  {/* Feature 3 */}
                  <div className={`flex items-center gap-2.5 p-2.5 rounded-lg ${
                    isDark ? 'bg-green-950/40 border border-green-900/30' : 'bg-green-50/50 border border-green-100'
                  }`}>
                    <HiOutlineLockClosed className={`text-base flex-shrink-0 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                    <div>
                      <p className={`text-xs font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Revoke anytime
                      </p>
                      <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        Full control
                      </p>
                    </div>
                  </div>
                </div>

                {/* Disclaimer - Compact */}
                <div className={`flex items-start gap-2 p-2.5 rounded-lg ${
                  isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-100'
                }`}>
                  <HiOutlineLightBulb className={`text-sm flex-shrink-0 mt-0.5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                  <p className={`text-[10px] leading-relaxed ${isDark ? 'text-amber-300/80' : 'text-amber-700'}`}>
                    One-time request. Location is never stored.
                  </p>
                </div>
              </div>

              {/* Actions - Compact */}
              <div className={`px-5 py-4 flex gap-2 border-t ${
                isDark ? 'border-green-900/30 bg-green-950/20' : 'border-gray-100 bg-gray-50/50'
              }`}>
                <button
                  onClick={onSkip}
                  className={`flex-1 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    isDark 
                      ? 'bg-green-950/50 border border-green-900/40 text-gray-400 hover:text-white hover:bg-green-900/50' 
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Skip
                </button>
                <button
                  onClick={handleAccept}
                  disabled={isLoading}
                  className="flex-1 px-3 py-2.5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  {isLoading ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Getting...</span>
                    </>
                  ) : (
                    <>
                      <HiOutlineMapPin className="text-sm" />
                      <span>Allow Location</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default LocationConsentModal;
