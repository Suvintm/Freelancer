import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FaBan, FaEnvelope, FaSignOutAlt, FaCheckCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { io } from "socket.io-client";
import { toast } from "react-toastify";

const BannedPage = () => {
  const { logout, backendURL } = useAppContext();
  const navigate = useNavigate();
  const [isUnbanned, setIsUnbanned] = useState(false);

  // Get ban info from localStorage
  const banInfo = JSON.parse(localStorage.getItem("banInfo") || "{}");

  // Listen for unbanned event
  useEffect(() => {
    const baseUrl = backendURL?.replace("/api", "") || "http://localhost:5000";
    
    // Connect with minimal config (doesn't need auth since user is banned)
    const socket = io(baseUrl, {
      transports: ["polling", "websocket"],
      reconnection: true,
      autoConnect: true,
    });

    socket.on("admin:unbanned", ({ message }) => {
      console.log("✅ You have been unbanned!");
      setIsUnbanned(true);
      toast.success("Your account has been restored! Redirecting...", { autoClose: 3000 });
      
      // Clear ban info and redirect
      localStorage.removeItem("banInfo");
      
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    });

    return () => {
      socket.disconnect();
    };
  }, [backendURL]);

  const handleLogout = () => {
    localStorage.removeItem("banInfo");
    localStorage.removeItem("user");
    logout();
    navigate("/");
  };

  // Show unbanned success state
  if (isUnbanned) {
    return (
      <div className="min-h-screen bg-[#050509] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-emerald-500 to-green-600 rounded-3xl mb-8"
          >
            <FaCheckCircle className="text-4xl text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-4">Account Restored!</h1>
          <p className="text-gray-400 mb-8">Redirecting you to the homepage...</p>
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050509] flex items-center justify-center p-4">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-radial from-red-900/20 to-transparent rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-radial from-gray-900/30 to-transparent rounded-full blur-3xl"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 max-w-lg w-full text-center"
      >
        {/* Icon */}
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-red-600 to-red-800 rounded-3xl mb-8"
        >
          <FaBan className="text-4xl text-white" />
        </motion.div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-white mb-4">
          Account Suspended
        </h1>

        {/* Message */}
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 mb-8">
          <p className="text-red-400 text-lg mb-2">
            Your account has been suspended.
          </p>
          <p className="text-gray-400">
            {banInfo.banReason || "Violation of terms of service"}
          </p>
        </div>

        {/* What to do */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 text-left">
          <h3 className="text-white font-semibold mb-3">What can you do?</h3>
          <ul className="text-gray-400 space-y-2 text-sm">
            <li>• Review our Terms of Service and Community Guidelines</li>
            <li>• Contact support if you believe this was a mistake</li>
            <li>• Wait for the suspension period to end (if temporary)</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="mailto:support@suvix.com"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white/10 border border-white/20 text-white rounded-xl font-medium hover:bg-white/20 transition-colors"
          >
            <FaEnvelope />
            Contact Support
          </a>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-800 text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            <FaSignOutAlt />
            Logout
          </button>
        </div>

        {/* Footer */}
        <p className="text-gray-600 text-sm mt-12">
          Questions?{" "}
          <a href="mailto:support@suvix.com" className="text-purple-400 hover:underline">
            support@suvix.com
          </a>
        </p>
      </motion.div>
    </div>
  );
};

export default BannedPage;
