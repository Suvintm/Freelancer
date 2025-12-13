import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaUsers,
  FaBriefcase,
  FaPlayCircle,
  FaClipboardList,
  FaEnvelope,
  FaHeart,
  FaArrowRight,
  FaChartLine,
} from "react-icons/fa";
import axios from "axios";
import { useAppContext } from "../context/AppContext";
import ClientSidebar from "../components/ClientSidebar.jsx";
import ClientNavbar from "../components/ClientNavbar.jsx";
import ExploreEditor from "../components/ExploreEditor.jsx";
import ExploreGigs from "../components/ExploreGigs.jsx";
import reelIcon from "../assets/reelicon.png";

const ClientHome = () => {
  const { user, backendURL } = useAppContext();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("editors");
  const [stats, setStats] = useState({ totalOrders: 0 });

  // Fetch basic stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = user?.token;
        if (!token) return;

        const res = await axios.get(`${backendURL}/api/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const orders = res.data.orders || [];
        setStats({ totalOrders: orders.length });
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      }
    };

    fetchStats();
  }, [backendURL, user?.token]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#050509] text-white">
      <ClientSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <ClientNavbar onMenuClick={() => setSidebarOpen(true)} />

      <main className="flex-1 px-4 md:px-8 py-6 pt-20 md:pt-6 md:ml-64 md:mt-20">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/client-orders")}
            className="bg-[#111319] border border-[#262A3B] hover:border-emerald-500/30 rounded-2xl p-5 flex items-center gap-4 transition-all group"
          >
            <div className="p-3 rounded-xl bg-emerald-500/10">
              <FaClipboardList className="text-emerald-400 text-xl" />
            </div>
            <div className="text-left flex-1">
              <p className="text-white font-medium">My Orders</p>
              <p className="text-gray-500 text-sm">{stats.totalOrders} total</p>
            </div>
            <FaArrowRight className="text-gray-500 group-hover:text-emerald-400 transition-colors" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/client-messages")}
            className="bg-[#111319] border border-[#262A3B] hover:border-blue-500/30 rounded-2xl p-5 flex items-center gap-4 transition-all group"
          >
            <div className="p-3 rounded-xl bg-blue-500/10">
              <FaEnvelope className="text-blue-400 text-xl" />
            </div>
            <div className="text-left flex-1">
              <p className="text-white font-medium">Messages</p>
              <p className="text-gray-500 text-sm">Chat with editors</p>
            </div>
            <FaArrowRight className="text-gray-500 group-hover:text-blue-400 transition-colors" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/saved-editors")}
            className="bg-[#111319] border border-[#262A3B] hover:border-pink-500/30 rounded-2xl p-5 flex items-center gap-4 transition-all group"
          >
            <div className="p-3 rounded-xl bg-pink-500/10">
              <FaHeart className="text-pink-400 text-xl" />
            </div>
            <div className="text-left flex-1">
              <p className="text-white font-medium">Saved</p>
              <p className="text-gray-500 text-sm">Favorite editors</p>
            </div>
            <FaArrowRight className="text-gray-500 group-hover:text-pink-400 transition-colors" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/reels")}
            className="bg-[#111319] border border-[#262A3B] hover:border-purple-500/30 rounded-2xl p-5 flex items-center gap-4 transition-all group"
          >
            <div className="p-3 rounded-xl bg-purple-500/10">
              <img src={reelIcon} className="w-5 h-5" alt="Reels" />
            </div>
            <div className="text-left flex-1">
              <p className="text-white font-medium">Reels</p>
              <p className="text-gray-500 text-sm">Watch portfolios</p>
            </div>
            <FaArrowRight className="text-gray-500 group-hover:text-purple-400 transition-colors" />
          </motion.button>
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-center mb-8">
          <motion.div
            layout
            className="inline-flex p-1.5 bg-[#111319] border border-[#262A3B] rounded-2xl shadow-inner"
          >
            {[
              { id: "editors", label: "Explore Editors", icon: FaUsers },
              { id: "gigs", label: "Explore Gigs", icon: FaBriefcase },
              { id: "reels", label: "Reels", icon: FaPlayCircle },
            ].map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => tab.id === "reels" ? navigate("/reels") : setActiveTab(tab.id)}
                className={`relative px-5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                  activeTab === tab.id
                    ? "text-white"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="clientTabBg"
                    className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <tab.icon size={14} />
                  {tab.label}
                </span>
              </motion.button>
            ))}
          </motion.div>
        </div>

        {/* Explore Content */}
        <div className="bg-[#111319] border border-[#262A3B] rounded-3xl p-4 md:p-6">
          {/* Section Header */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">
              {activeTab === "editors" ? "Find Your Perfect Editor" : "Browse Services"}
            </h2>
            <p className="text-gray-400">
              {activeTab === "editors" 
                ? "Discover talented video editors ready to bring your vision to life"
                : "Find the perfect service for your project"
              }
            </p>
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === "editors" && (
              <motion.div
                key="editors"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <ExploreEditor />
              </motion.div>
            )}
            {activeTab === "gigs" && (
              <motion.div
                key="gigs"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <ExploreGigs />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Floating Reels Button */}
        <motion.button
          onClick={() => navigate("/reels")}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="fixed bottom-6 right-6 z-[200] w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/30"
        >
          <img src={reelIcon} alt="reels" className="w-6 h-6 object-contain" />
        </motion.button>
      </main>
    </div>
  );
};

export default ClientHome;
