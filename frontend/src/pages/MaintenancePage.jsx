import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaTools, FaClock } from "react-icons/fa";
import { useAppContext } from "../context/AppContext";

const MaintenancePage = () => {
  const { backendURL } = useAppContext();
  const [maintenance, setMaintenance] = useState({ isActive: false });
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState("");

  useEffect(() => {
    checkMaintenance();
    const interval = setInterval(checkMaintenance, 60000); // Check every minute
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (maintenance.endTime) {
      const updateTimer = () => {
        const now = new Date();
        const end = new Date(maintenance.endTime);
        const diff = end - now;

        if (diff <= 0) {
          setTimeRemaining("Ending soon...");
          checkMaintenance();
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          setTimeRemaining(`${hours}h ${minutes}m remaining`);
        }
      };

      updateTimer();
      const timer = setInterval(updateTimer, 60000);
      return () => clearInterval(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maintenance.endTime]);

  const checkMaintenance = async () => {
    try {
      const res = await fetch(`${backendURL}/api/maintenance-status`);
      const data = await res.json();
      setMaintenance(data.maintenance || { isActive: false });

      // If maintenance is off, redirect to home
      if (!data.maintenance?.isActive) {
        window.location.href = "/";
      }
    } catch (err) {
      console.error("Failed to check maintenance:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050509] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
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
          className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-radial from-purple-900/20 to-transparent rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-radial from-orange-900/20 to-transparent rounded-full blur-3xl"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 max-w-lg w-full text-center"
      >
        {/* Icon */}
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-3xl mb-8"
        >
          <FaTools className="text-4xl text-white" />
        </motion.div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-white mb-4">
          Under Maintenance
        </h1>

        {/* Message */}
        <p className="text-gray-400 text-lg mb-8">
          {maintenance.message || "We're currently performing scheduled maintenance. Please check back soon."}
        </p>

        {/* Time Remaining */}
        {timeRemaining && (
          <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-6 py-3 text-gray-300">
            <FaClock className="text-purple-400" />
            <span>{timeRemaining}</span>
          </div>
        )}

        {/* Refresh Button */}
        <div className="mt-8">
          <button
            onClick={checkMaintenance}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            Check Again
          </button>
        </div>

        {/* Contact Info */}
        <p className="text-gray-600 text-sm mt-12">
          Questions? Contact{" "}
          <a href="mailto:support@suvix.com" className="text-purple-400 hover:underline">
            support@suvix.com
          </a>
        </p>
      </motion.div>
    </div>
  );
};

export default MaintenancePage;
