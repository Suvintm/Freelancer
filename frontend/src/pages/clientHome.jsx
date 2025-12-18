/**
 * ClientHome - Professional Dashboard
 * Clean design with proper icons and text handling
 */

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineClipboardDocumentList,
  HiOutlineChatBubbleLeftRight,
  HiOutlineHeart,
  HiOutlineSparkles,
  HiOutlineBolt,
  HiOutlineUsers,
  HiOutlineBriefcase,
  HiOutlineStar,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineCurrencyRupee,
  HiOutlineFire,
  HiOutlineMagnifyingGlass,
  HiOutlineArrowRight,
  HiOutlineArrowPath,
  HiOutlineChartBar,
  HiOutlinePlayCircle,
  HiOutlineGlobeAlt,
  HiOutlineMusicalNote,
  HiOutlineFilm,
  HiOutlineBuildingOffice2,
  HiOutlineDevicePhoneMobile,
  HiOutlineMegaphone,
} from "react-icons/hi2";
import { FaUsers, FaBriefcase, FaPlayCircle } from "react-icons/fa";
import { PiHeartFill } from "react-icons/pi";
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
  const exploreRef = useRef(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("editors");
  const [stats, setStats] = useState({ totalOrders: 0, activeOrders: 0, completedOrders: 0, totalSpent: 0 });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [featuredEditors, setFeaturedEditors] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  const scrollToExplore = (tab = "editors") => {
    setActiveTab(tab);
    setTimeout(() => {
      exploreRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => window.location.reload(), 300);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = user?.token;
        if (!token) return;

        const ordersRes = await axios.get(`${backendURL}/api/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const orders = ordersRes.data.orders || [];
        const activeOrders = orders.filter(o => ["pending", "accepted", "in_progress"].includes(o.status)).length;
        const completedOrders = orders.filter(o => o.status === "completed").length;
        const totalSpent = orders.filter(o => o.status === "completed").reduce((sum, o) => sum + (o.amount || 0), 0);
        
        setStats({ totalOrders: orders.length, activeOrders, completedOrders, totalSpent });

        const activity = orders.slice(0, 3).map(order => ({
          id: order._id,
          type: order.status,
          text: order.title || "Order",
          time: new Date(order.updatedAt).toLocaleDateString(),
          icon: order.status === "completed" ? HiOutlineCheckCircle : order.status === "in_progress" ? HiOutlineClock : HiOutlineClipboardDocumentList,
          color: order.status === "completed" ? "#10B981" : order.status === "in_progress" ? "#3B82F6" : "#F59E0B"
        }));
        setRecentActivity(activity);

        try {
          const editorsRes = await axios.get(`${backendURL}/api/explore/editors?limit=6&sortBy=popular`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setFeaturedEditors(editorsRes.data.editors?.slice(0, 6) || []);
        } catch (err) {
          console.error("Failed to fetch editors:", err);
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [backendURL, user?.token]);

  // Categories with proper outline icons
  const categories = [
    { name: "Wedding", icon: PiHeartFill, gradient: "from-rose-500 to-pink-600" },
    { name: "YouTube", icon: HiOutlinePlayCircle, gradient: "from-red-500 to-orange-500" },
    { name: "Corporate", icon: HiOutlineBuildingOffice2, gradient: "from-blue-500 to-indigo-600" },
    { name: "Music", icon: HiOutlineMusicalNote, gradient: "from-violet-500 to-purple-600" },
    { name: "Social", icon: HiOutlineDevicePhoneMobile, gradient: "from-emerald-500 to-teal-600" },
    { name: "Ads", icon: HiOutlineMegaphone, gradient: "from-amber-500 to-orange-600" },
  ];

  return (
    <div 
      className="min-h-screen flex flex-col md:flex-row bg-[#09090B] light:bg-[#FAFAFA] text-white light:text-zinc-900"
      style={{ fontFamily: "'Manrope', sans-serif" }}
    >
      <ClientSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <ClientNavbar onMenuClick={() => setSidebarOpen(true)} />

      {/* Refresh */}
      <motion.button
        onClick={handleRefresh}
        disabled={isRefreshing}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed top-20 right-4 z-50 p-2 rounded-lg bg-zinc-900/90 light:bg-white/90 backdrop-blur border border-zinc-800 light:border-zinc-200"
      >
        <motion.div animate={isRefreshing ? { rotate: 360 } : {}} transition={isRefreshing ? { repeat: Infinity, duration: 0.8 } : {}}>
          <HiOutlineArrowPath className="text-emerald-500 w-4 h-4" />
        </motion.div>
      </motion.button>

      <main className="flex-1 px-4 md:px-6 py-4 pt-18 md:pt-4 md:ml-64 md:mt-16 overflow-x-hidden">
        
        {/* ===== WELCOME CARD ===== */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-emerald-500/8 via-teal-500/5 to-cyan-500/8 light:from-emerald-50 light:via-teal-50/50 light:to-cyan-50 rounded-2xl p-5 mb-5 border border-emerald-500/15 light:border-emerald-200/50"
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="p-3 bg-emerald-500/15 light:bg-emerald-100 rounded-xl shrink-0">
                <HiOutlineBolt className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold truncate" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  Welcome, {user?.name?.split(" ")[0] || "there"}
                </h2>
                <p className="text-zinc-400 light:text-zinc-500 text-sm truncate">Find the perfect editor</p>
              </div>
            </div>
            
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => scrollToExplore("editors")}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-xl transition-all flex items-center gap-2"
              >
                <HiOutlineMagnifyingGlass className="w-4 h-4" /> Find Editors
              </button>
              <button
                onClick={() => scrollToExplore("gigs")}
                className="px-4 py-2 bg-zinc-800/80 light:bg-white hover:bg-zinc-700 light:hover:bg-zinc-50 border border-zinc-700 light:border-zinc-200 text-sm font-medium rounded-xl transition-all flex items-center gap-2"
              >
                <HiOutlineBriefcase className="w-4 h-4" /> Gigs
              </button>
            </div>
          </div>
        </motion.div>

        {/* ===== STATS ROW ===== */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {[
            { label: "Total Orders", value: stats.totalOrders, icon: HiOutlineClipboardDocumentList, color: "text-emerald-500", bg: "bg-emerald-500/10" },
            { label: "In Progress", value: stats.activeOrders, icon: HiOutlineClock, color: "text-blue-500", bg: "bg-blue-500/10" },
            { label: "Completed", value: stats.completedOrders, icon: HiOutlineCheckCircle, color: "text-green-500", bg: "bg-green-500/10" },
            { label: "Total Spent", value: `₹${stats.totalSpent >= 1000 ? (stats.totalSpent/1000).toFixed(1) + 'k' : stats.totalSpent}`, icon: HiOutlineCurrencyRupee, color: "text-violet-500", bg: "bg-violet-500/10" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-zinc-900/60 light:bg-white border border-zinc-800/60 light:border-zinc-200 rounded-xl p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-1.5 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
                </div>
                <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider truncate">{stat.label}</span>
              </div>
              <p className="text-xl font-bold" style={{ fontFamily: "'Outfit', sans-serif" }}>{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* ===== MAIN GRID ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-5">
          
          {/* Left Column */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Quick Actions */}
            <div className="bg-zinc-900/60 light:bg-white border border-zinc-800/60 light:border-zinc-200 rounded-xl p-4">
              <h3 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <HiOutlineBolt className="w-3.5 h-3.5 text-amber-500" /> Quick Actions
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Orders", icon: HiOutlineClipboardDocumentList, path: "/client-orders", color: "text-emerald-500", bg: "bg-emerald-500/10 light:bg-emerald-50" },
                  { label: "Messages", icon: HiOutlineChatBubbleLeftRight, path: "/client-messages", color: "text-blue-500", bg: "bg-blue-500/10 light:bg-blue-50" },
                  { label: "Saved", icon: HiOutlineHeart, path: "/saved-editors", color: "text-rose-500", bg: "bg-rose-500/10 light:bg-rose-50" },
                  { label: "Reels", icon: HiOutlinePlayCircle, path: "/reels", color: "text-violet-500", bg: "bg-violet-500/10 light:bg-violet-50" },
                ].map((item) => (
                  <motion.button
                    key={item.label}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(item.path)}
                    className={`${item.bg} rounded-xl p-3 flex items-center gap-2.5 transition-all`}
                  >
                    <item.icon className={`w-4 h-4 ${item.color} shrink-0`} />
                    <span className="text-sm font-medium truncate">{item.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Categories with Professional Icons */}
            <div className="bg-zinc-900/60 light:bg-white border border-zinc-800/60 light:border-zinc-200 rounded-xl p-4">
              <h3 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <HiOutlineFire className="w-3.5 h-3.5 text-orange-500" /> Popular Categories
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {categories.map((cat) => (
                  <motion.button
                    key={cat.name}
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => scrollToExplore("gigs")}
                    className={`bg-gradient-to-br ${cat.gradient} rounded-xl p-3 text-center transition-all shadow-lg`}
                  >
                    <cat.icon className="w-5 h-5 text-white mx-auto mb-1.5" />
                    <span className="text-[11px] font-semibold text-white block truncate">{cat.name}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Activity */}
            {recentActivity.length > 0 && (
              <div className="bg-zinc-900/60 light:bg-white border border-zinc-800/60 light:border-zinc-200 rounded-xl p-4">
                <h3 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <HiOutlineChartBar className="w-3.5 h-3.5 text-cyan-500" /> Recent Activity
                </h3>
                <div className="space-y-2">
                  {recentActivity.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-2.5 bg-zinc-800/40 light:bg-zinc-50 rounded-lg">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${item.color}15` }}>
                        <item.icon className="w-4 h-4" style={{ color: item.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.text}</p>
                        <p className="text-[11px] text-zinc-500">{item.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Featured Editors */}
          <div className="lg:col-span-8 bg-zinc-900/60 light:bg-white border border-zinc-800/60 light:border-zinc-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                <HiOutlineStar className="w-3.5 h-3.5 text-amber-500" /> Featured Editors
              </h3>
              <button onClick={() => scrollToExplore("editors")} className="text-xs text-emerald-500 hover:text-emerald-400 flex items-center gap-1 font-medium">
                View all <HiOutlineArrowRight className="w-3 h-3" />
              </button>
            </div>
            
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="animate-pulse p-4 bg-zinc-800/40 light:bg-zinc-50 rounded-xl">
                    <div className="w-12 h-12 bg-zinc-700/50 light:bg-zinc-200 rounded-full mx-auto mb-3" />
                    <div className="h-3 bg-zinc-700/50 light:bg-zinc-200 rounded w-16 mx-auto mb-2" />
                    <div className="h-2 bg-zinc-700/50 light:bg-zinc-200 rounded w-12 mx-auto" />
                  </div>
                ))}
              </div>
            ) : featuredEditors.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {featuredEditors.map((editor, idx) => (
                  <motion.div
                    key={editor._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    onClick={() => navigate(`/public-profile/${editor.user?._id}`)}
                    className="p-4 bg-zinc-800/40 light:bg-zinc-50 rounded-xl hover:bg-zinc-800/60 light:hover:bg-zinc-100 cursor-pointer transition-all text-center group"
                  >
                    <div className="relative w-12 h-12 mx-auto mb-3">
                      <img 
                        src={editor.user?.profilePicture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} 
                        alt=""
                        className="w-full h-full rounded-full object-cover border-2 border-zinc-700 light:border-zinc-200 group-hover:border-emerald-500/50 transition-all"
                      />
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-zinc-900 light:border-white" />
                    </div>
                    <p className="text-sm font-semibold truncate mb-0.5">{editor.user?.name?.split(" ")[0]}</p>
                    <p className="text-[11px] text-zinc-500 truncate mb-1.5">{editor.skills?.[0] || "Editor"}</p>
                    <div className="flex items-center justify-center gap-1">
                      <HiOutlineStar className="w-3 h-3 text-amber-500" />
                      <span className="text-[11px] font-medium text-zinc-400">{(4 + Math.random()).toFixed(1)}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-zinc-500">
                <HiOutlineUsers className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No featured editors</p>
              </div>
            )}
          </div>
        </div>

        {/* ===== EXPLORE SECTION ===== */}
        <div ref={exploreRef} className="scroll-mt-20">
          {/* Tabs */}
          <div className="flex items-center justify-center mb-4">
            <div className="inline-flex p-1 bg-zinc-900/80 light:bg-white border border-zinc-800 light:border-zinc-200 rounded-xl">
              {[
                { id: "editors", label: "Editors", icon: FaUsers },
                { id: "gigs", label: "Gigs", icon: FaBriefcase },
                { id: "reels", label: "Reels", icon: FaPlayCircle },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => tab.id === "reels" ? navigate("/reels") : setActiveTab(tab.id)}
                  className={`px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    activeTab === tab.id
                      ? "text-white bg-emerald-500"
                      : "text-zinc-400 light:text-zinc-500 hover:text-white light:hover:text-zinc-900"
                  }`}
                >
                  <tab.icon size={13} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="bg-zinc-900/60 light:bg-white border border-zinc-800/60 light:border-zinc-200 rounded-xl p-5">
            <div className="text-center mb-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 light:bg-emerald-50 text-emerald-500 text-xs font-medium rounded-full mb-2">
                <HiOutlineSparkles className="w-3 h-3" /> 
                {activeTab === "editors" ? "Discover Talent" : "Browse Services"}
              </div>
              <h2 className="text-lg font-bold" style={{ fontFamily: "'Outfit', sans-serif" }}>
                {activeTab === "editors" ? "Find Your Perfect Editor" : "Explore Available Gigs"}
              </h2>
              <p className="text-zinc-500 text-sm mt-1">
                {activeTab === "editors" ? "Connect with skilled professionals" : "Find the right service"}
              </p>
            </div>

            <AnimatePresence mode="wait">
              {activeTab === "editors" && (
                <motion.div key="editors" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <ExploreEditor />
                </motion.div>
              )}
              {activeTab === "gigs" && (
                <motion.div key="gigs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <ExploreGigs />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Floating Reels */}
        <motion.button
          onClick={() => navigate("/reels")}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          className="fixed bottom-5 right-5 z-[200] w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-xl"
        >
          <img src={reelIcon} alt="reels" className="w-5 h-5" />
        </motion.button>
      </main>
    </div>
  );
};

export default ClientHome;
