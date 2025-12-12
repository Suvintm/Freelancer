import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaUsers,
  FaBriefcase,
  FaPlayCircle,
  FaClipboardList,
  FaEnvelope,
  FaCheckCircle,
  FaClock,
  FaRupeeSign,
  FaChartLine,
  FaStar,
  FaArrowRight,
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
  const [stats, setStats] = useState({
    totalOrders: 0,
    activeOrders: 0,
    completedOrders: 0,
    totalSpent: 0,
  });
  const [loading, setLoading] = useState(true);

  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = user?.token;
        if (!token) return;

        const res = await axios.get(`${backendURL}/api/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const orders = res.data.orders || [];
        const active = orders.filter(o => 
          ["new", "accepted", "in_progress", "submitted"].includes(o.status)
        ).length;
        const completed = orders.filter(o => o.status === "completed").length;
        const totalSpent = orders
          .filter(o => o.status === "completed")
          .reduce((sum, o) => sum + (o.amount || 0), 0);

        setStats({
          totalOrders: orders.length,
          activeOrders: active,
          completedOrders: completed,
          totalSpent,
        });
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [backendURL, user?.token]);

  const quickStats = [
    { 
      label: "Active Orders", 
      value: stats.activeOrders, 
      icon: FaClock, 
      color: "text-yellow-400", 
      bg: "bg-yellow-500/10" 
    },
    { 
      label: "Completed", 
      value: stats.completedOrders, 
      icon: FaCheckCircle, 
      color: "text-emerald-400", 
      bg: "bg-emerald-500/10" 
    },
    { 
      label: "Total Spent", 
      value: `₹${stats.totalSpent.toLocaleString()}`, 
      icon: FaRupeeSign, 
      color: "text-blue-400", 
      bg: "bg-blue-500/10" 
    },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#050509] text-white">
      {/* Sidebar */}
      <ClientSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Navbar */}
      <ClientNavbar onMenuClick={() => setSidebarOpen(true)} />

      {/* Main Content */}
      <main className="flex-1 px-4 md:px-8 py-6 md:ml-64 md:mt-20">
        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {quickStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`${stat.bg} border border-white/5 rounded-2xl p-5 backdrop-blur-sm`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-xs mb-1">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`text-2xl ${stat.color}`} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/client-orders")}
            className="bg-[#111319] border border-[#262A3B] hover:border-emerald-500/30 rounded-2xl p-4 flex items-center gap-3 transition-all group"
          >
            <div className="p-2.5 rounded-xl bg-emerald-500/10">
              <FaClipboardList className="text-emerald-400 text-lg" />
            </div>
            <div className="text-left">
              <p className="text-white text-sm font-medium">My Orders</p>
              <p className="text-gray-500 text-xs">{stats.totalOrders} total</p>
            </div>
            <FaArrowRight className="ml-auto text-gray-500 group-hover:text-emerald-400 transition-colors" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/client-messages")}
            className="bg-[#111319] border border-[#262A3B] hover:border-blue-500/30 rounded-2xl p-4 flex items-center gap-3 transition-all group"
          >
            <div className="p-2.5 rounded-xl bg-blue-500/10">
              <FaEnvelope className="text-blue-400 text-lg" />
            </div>
            <div className="text-left">
              <p className="text-white text-sm font-medium">Messages</p>
              <p className="text-gray-500 text-xs">View chats</p>
            </div>
            <FaArrowRight className="ml-auto text-gray-500 group-hover:text-blue-400 transition-colors" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/saved-editors")}
            className="bg-[#111319] border border-[#262A3B] hover:border-pink-500/30 rounded-2xl p-4 flex items-center gap-3 transition-all group"
          >
            <div className="p-2.5 rounded-xl bg-pink-500/10">
              <FaStar className="text-pink-400 text-lg" />
            </div>
            <div className="text-left">
              <p className="text-white text-sm font-medium">Saved</p>
              <p className="text-gray-500 text-xs">Favorite editors</p>
            </div>
            <FaArrowRight className="ml-auto text-gray-500 group-hover:text-pink-400 transition-colors" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/reels")}
            className="bg-gradient-to-r from-[#1E3A8A] to-[#1D4ED8] rounded-2xl p-4 flex items-center gap-3 transition-all group"
          >
            <div className="p-2.5 rounded-xl bg-white/10">
              <FaPlayCircle className="text-white text-lg" />
            </div>
            <div className="text-left">
              <p className="text-white text-sm font-medium">Watch Reels</p>
              <p className="text-blue-200 text-xs">Discover talent</p>
            </div>
            <FaArrowRight className="ml-auto text-white/60 group-hover:text-white transition-colors" />
          </motion.button>
        </div>

        {/* Explore Tabs */}
        <div className="flex items-center justify-center mb-8">
          <motion.div
            layout
            className="
              bg-[#111319] border border-white/10
              rounded-2xl p-2 flex gap-2 md:gap-4
              relative transition-all
              max-w-full overflow-x-auto scrollbar-hide
            "
          >
            {/* Explore Editors */}
            <button
              onClick={() => setActiveTab("editors")}
              className={`
                relative 
                px-4 py-3 
                md:px-6 md:py-3 
                rounded-xl 
                text-sm md:text-base 
                font-semibold 
                flex items-center gap-2 
                whitespace-nowrap
                transition-all
                ${activeTab === "editors"
                  ? "text-white"
                  : "text-[#9CA3AF] hover:bg-[#151823]"
                }
              `}
            >
              {activeTab === "editors" && (
                <motion.div
                  layoutId="clientTabBubble"
                  className="absolute inset-0 rounded-xl bg-emerald-500/20"
                  transition={{
                    type: "spring",
                    stiffness: 320,
                    damping: 26,
                    mass: 0.4,
                  }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <FaUsers className="text-sm md:text-base" />
                <span>Explore Editors</span>
              </span>
            </button>

            {/* Explore Gigs */}
            <button
              onClick={() => setActiveTab("gigs")}
              className={`
                relative 
                px-4 py-3 
                md:px-6 md:py-3 
                rounded-xl 
                text-sm md:text-base 
                font-semibold 
                flex items-center gap-2 
                whitespace-nowrap
                transition-all
                ${activeTab === "gigs"
                  ? "text-white"
                  : "text-[#9CA3AF] hover:bg-[#151823]"
                }
              `}
            >
              {activeTab === "gigs" && (
                <motion.div
                  layoutId="clientTabBubble"
                  className="absolute inset-0 rounded-xl bg-emerald-500/20"
                  transition={{
                    type: "spring",
                    stiffness: 320,
                    damping: 26,
                    mass: 0.4,
                  }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <FaBriefcase className="text-sm md:text-base" />
                <span>Explore Gigs</span>
              </span>
            </button>
          </motion.div>
        </div>

        {/* Tab Content */}
        <div className="bg-[#111319] border border-[#262A3B] rounded-3xl shadow-[0_18px_50px_rgba(0,0,0,0.7)] p-2 md:p-6">
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
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="
            fixed bottom-6 right-6 
            z-[200]
            w-14 h-14 
            rounded-full 
            bg-gradient-to-r from-purple-600 to-pink-600
            border-2 border-white/20
            flex items-center justify-center
            shadow-[0_8px_30px_rgba(147,51,234,0.5)]
            hover:scale-110
            active:scale-95
            transition-transform
          "
        >
          <img
            src={reelIcon}
            alt="reels"
            className="w-6 h-6 object-contain"
          />
        </motion.button>
      </main>
    </div>
  );
};

export default ClientHome;
