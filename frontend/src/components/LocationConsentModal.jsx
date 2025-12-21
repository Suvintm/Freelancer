import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaMapMarkerAlt, FaLock, FaShieldAlt, FaTimes } from "react-icons/fa";
import { HiOutlineMapPin } from "react-icons/hi2";

const LocationConsentModal = ({ isOpen, onClose, onAccept, onSkip }) => {
  const [isLoading, setIsLoading] = useState(false);

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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onSkip}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-[#0f1115] border border-emerald-500/20 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border-b border-white/5 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 flex items-center justify-center">
                      <HiOutlineMapPin className="text-2xl text-emerald-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Discover Local Editors</h2>
                      <p className="text-xs text-gray-500">Privacy-first location service</p>
                    </div>
                  </div>
                  <button
                    onClick={onSkip}
                    className="text-gray-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg"
                  >
                    <FaTimes />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <p className="text-gray-300 text-sm leading-relaxed">
                  Allow location access to find trusted editors near you.
                </p>

                {/* Privacy Features */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
                    <FaShieldAlt className="text-emerald-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-white font-medium">Your exact location is never shared</p>
                      <p className="text-xs text-gray-500 mt-1">We only show your approximate region</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-blue-500/5 rounded-lg border border-blue-500/10">
                    <FaMapMarkerAlt className="text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-white font-medium">Editors see only city-level location</p>
                      <p className="text-xs text-gray-500 mt-1">Privacy-first design with rounded coordinates</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-purple-500/5 rounded-lg border border-purple-500/10">
                    <FaLock className="text-purple-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-white font-medium">You can revoke anytime</p>
                      <p className="text-xs text-gray-500 mt-1">Full control over your location permissions</p>
                    </div>
                  </div>
                </div>

                {/* Disclaimer */}
                <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg p-3">
                  <p className="text-xs text-amber-300">
                    💡 This is a one-time permission request. Your location is used only for finding nearby editors and is never stored on our servers.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="p-6 pt-0 flex gap-3">
                <button
                  onClick={onSkip}
                  className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-medium transition-all"
                >
                  Skip
                </button>
                <button
                  onClick={handleAccept}
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Getting Location...</span>
                    </>
                  ) : (
                    <>
                      <FaMapMarkerAlt />
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
