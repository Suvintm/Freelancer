import React from "react";
import { motion } from "framer-motion";
import { FaGlobeAsia, FaShieldAlt, FaMapMarkerAlt } from "react-icons/fa";

const RestrictedAccess = ({ type = "REGION_BLOCKED" }) => {
  const isVPN = type === "VPN_DETECTED";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white dark:bg-[#09090B]">
      {/* Dynamic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-green-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative max-w-md w-full mx-4 p-8 text-center bg-white/40 dark:bg-black/40 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden"
      >
        <div className="relative mb-8">
          <div className="w-24 h-24 mx-auto bg-green-500/10 dark:bg-green-500/20 rounded-3xl flex items-center justify-center">
            {isVPN ? (
              <FaShieldAlt className="text-4xl text-green-500" />
            ) : (
              <FaGlobeAsia className="text-4xl text-green-500" />
            )}
          </div>
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute inset-0 bg-green-500/20 blur-2xl rounded-full"
          />
        </div>

        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
          {isVPN ? "Disable Your VPN" : "Regional Restricted"}
        </h1>

        <div className="space-y-4 mb-8">
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            {isVPN ? (
              <>
                Our security system detected a <strong>VPN or Proxy</strong> connection. To ensure a safe experience for everyone, please disable it and try again.
              </>
            ) : (
              <>
                SuviX is currently available for users in <strong>India only</strong> as part of our exclusive production rollout.
              </>
            )}
          </p>

          <div className="flex items-center justify-center gap-3 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
            <FaMapMarkerAlt className="text-green-500" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-widest">
              Location: INDIA ONLY
            </span>
          </div>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="w-full py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-2xl shadow-lg shadow-green-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          Check Again
        </button>

        <p className="mt-8 text-xs text-gray-400 dark:text-gray-500 italic">
          Error Code: {type}
        </p>
      </motion.div>
    </div>
  );
};

export default RestrictedAccess;
