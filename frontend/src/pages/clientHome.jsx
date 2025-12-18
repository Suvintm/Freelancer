/**
 * ClientHome - Professional Corporate Design
 * Dark base with light: variant overrides for theme toggle
 */

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
  FaSyncAlt,
} from "react-icons/fa";
import { HiOutlineSparkles } from "react-icons/hi";
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
  const [stats, setStats] = useState({ totalOrders: 0, activeOrders: 0 });
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Refresh page
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      window.location.reload();
    }, 300);
  };

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
        const activeOrders = orders.filter(o => 
          ["pending", "accepted", "in_progress"].includes(o.status)
        ).length;
        setStats({ totalOrders: orders.length, activeOrders });
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      }
    };

    fetchStats();
  }, [backendURL, user?.token]);

  const quickActions = [
    { 
      id: "orders", 
      label: "My Orders", 
      desc: `${stats.totalOrders} total`, 
      icon: FaClipboardList, 
      path: "/client-orders", 
      color: "emerald",
      bgColor: "bg-emerald-500/10 light:bg-emerald-50",
      iconColor: "text-emerald-500"
    },
    { 
      id: "messages", 
      label: "Messages", 
      desc: "Chat with editors", 
      icon: FaEnvelope, 
      path: "/client-messages", 
      color: "blue",
      bgColor: "bg-blue-500/10 light:bg-blue-50",
      iconColor: "text-blue-500"
    },
    { 
      id: "saved", 
      label: "Saved Editors", 
      desc: "Your favorites", 
      icon: FaHeart, 
      path: "/saved-editors", 
      color: "pink",
      bgColor: "bg-pink-500/10 light:bg-pink-50",
      iconColor: "text-pink-500"
    },
    { 
      id: "reels", 
      label: "Reels", 
      desc: "Watch portfolios", 
      icon: null, 
      path: "/reels", 
      color: "purple",
      bgColor: "bg-purple-500/10 light:bg-purple-50",
      iconColor: "text-purple-500",
      customIcon: reelIcon
    },
  ];

  const exploreTabs = [
    { id: "editors", label: "Explore Editors", icon: FaUsers },
    { id: "gigs", label: "Explore Gigs", icon: FaBriefcase },
    { id: "reels", label: "Reels", icon: FaPlayCircle },
  ];

  return (
    <div 
      className="min-h-screen flex flex-col md:flex-row bg-[#050509] light:bg-slate-50 text-white light:text-slate-900 transition-colors duration-200"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <ClientSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <ClientNavbar onMenuClick={() => setSidebarOpen(true)} />

      {/* Refresh Button */}
      <motion.button
        onClick={handleRefresh}
        disabled={isRefreshing}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed top-20 right-4 md:right-8 z-50 p-3 rounded-xl bg-[#0a0a0c] light:bg-white shadow-lg border border-white/10 light:border-slate-200 hover:shadow-xl transition-all"
        title="Refresh page"
      >
        <motion.div
          animate={isRefreshing ? { rotate: 360 } : { rotate: 0 }}
          transition={isRefreshing ? { repeat: Infinity, duration: 0.8, ease: "linear" } : { duration: 0.3 }}
        >
          <FaSyncAlt className="text-emerald-500 text-sm" />
        </motion.div>
      </motion.button>

      <main className="flex-1 px-4 md:px-8 py-6 pt-20 md:pt-6 md:ml-64 md:mt-20">
        
        {/* Welcome Banner */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-emerald-500/10 light:from-emerald-50 via-blue-500/5 light:via-blue-50/50 to-purple-500/10 light:to-purple-50 rounded-2xl p-5 md:p-6 mb-6 border border-emerald-500/20 light:border-emerald-200"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/20 light:bg-emerald-100 rounded-xl">
              <HiOutlineSparkles className="text-2xl text-emerald-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white light:text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Welcome back, {user?.name?.split(" ")[0] || "Client"}!
              </h2>
              <p className="text-gray-400 light:text-slate-600 text-sm">Find talented video editors to bring your vision to life</p>
            </div>
            {stats.activeOrders > 0 && (
              <div className="ml-auto hidden md:block px-4 py-2 bg-white/5 light:bg-white rounded-xl border border-white/10 light:border-slate-200">
                <p className="text-xs text-gray-500 light:text-slate-500">Active Orders</p>
                <p className="text-lg font-bold text-emerald-400 light:text-emerald-600">{stats.activeOrders}</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {quickActions.map((action, index) => (
            <motion.button
              key={action.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(action.path)}
              className="bg-[#0a0a0c] light:bg-white border border-white/10 light:border-slate-200 hover:border-emerald-500/30 light:hover:border-emerald-300 rounded-2xl p-5 flex items-center gap-4 transition-all group shadow-sm hover:shadow-lg"
            >
              <div className={`p-3 rounded-xl ${action.bgColor}`}>
                {action.customIcon ? (
                  <img src={action.customIcon} className="w-5 h-5" alt={action.label} />
                ) : (
                  <action.icon className={`text-xl ${action.iconColor}`} />
                )}
              </div>
              <div className="text-left flex-1 min-w-0">
                <p className="text-white light:text-slate-900 font-semibold text-sm">{action.label}</p>
                <p className="text-gray-500 light:text-slate-500 text-xs truncate">{action.desc}</p>
              </div>
              <FaArrowRight className="text-gray-600 light:text-slate-400 group-hover:text-emerald-500 transition-colors text-sm" />
            </motion.button>
          ))}
        </div>

        {/* Explore Tabs */}
        <div className="flex items-center justify-center mb-6">
          <div className="inline-flex p-1 bg-[#0a0a0c] light:bg-white border border-white/10 light:border-slate-200 rounded-2xl shadow-sm">
            {exploreTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => tab.id === "reels" ? navigate("/reels") : setActiveTab(tab.id)}
                  className={`relative px-5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                    isActive
                      ? "text-white bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg"
                      : "text-gray-400 light:text-slate-600 hover:text-white light:hover:text-slate-900 hover:bg-white/5 light:hover:bg-slate-50"
                  }`}
                >
                  <tab.icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Explore Content */}
        <div className="bg-[#0a0a0c] light:bg-white border border-white/10 light:border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm">
          {/* Section Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 light:bg-emerald-50 text-emerald-400 light:text-emerald-600 text-xs font-semibold rounded-full mb-3">
              <HiOutlineSparkles /> {activeTab === "editors" ? "Discover Talent" : "Browse Services"}
            </div>
            <h2 className="text-xl font-bold text-white light:text-slate-900 mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {activeTab === "editors" ? "Find Your Perfect Editor" : "Browse Available Services"}
            </h2>
            <p className="text-gray-500 light:text-slate-500 text-sm">
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
          whileHover={{ scale: 1.1 }}
          className="fixed bottom-6 right-6 z-[200] w-14 h-14 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 border-2 border-[#0a0a0c] light:border-white"
        >
          <img src={reelIcon} alt="reels" className="w-6 h-6 object-contain" />
        </motion.button>
      </main>
    </div>
  );
};

export default ClientHome;
