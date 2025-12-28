/**
 * ClientHome - Professional Corporate Dashboard
 * Indigo/Purple primary with Emerald accents for success states
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
  HiOutlineMusicalNote,
  HiOutlineBuildingOffice2,
  HiOutlineDevicePhoneMobile,
  HiOutlineMegaphone,
  HiOutlineMapPin,
  HiOutlineRocketLaunch,
  HiOutlineDocumentCheck,
  HiOutlineChatBubbleOvalLeft,
} from "react-icons/hi2";
import { FaUsers, FaBriefcase, FaPlayCircle, FaArrowRight } from "react-icons/fa";
import { PiHeartFill } from "react-icons/pi";
import axios from "axios";
import { useAppContext } from "../context/AppContext";
import { useSocket } from "../context/SocketContext";
import ClientSidebar from "../components/ClientSidebar.jsx";
import ClientNavbar from "../components/ClientNavbar.jsx";
import ExploreEditor from "../components/ExploreEditor.jsx";
import ExploreGigs from "../components/ExploreGigs.jsx";
import KYCPendingBanner from "../components/KYCPendingBanner.jsx";
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
  const [activeProjects, setActiveProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showHowItWorks, setShowHowItWorks] = useState(true);

  const socketContext = useSocket();
  const totalUnread = socketContext?.totalUnread || 0;

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
        const activeOrders = orders.filter(o => ["new", "accepted", "in_progress", "submitted"].includes(o.status));
        const completedOrders = orders.filter(o => o.status === "completed").length;
        const totalSpent = orders.filter(o => o.status === "completed").reduce((sum, o) => sum + (o.amount || 0), 0);
        
        setStats({ totalOrders: orders.length, activeOrders: activeOrders.length, completedOrders, totalSpent });
        setActiveProjects(activeOrders.slice(0, 5));
        
        // Hide "How It Works" if user has orders
        if (orders.length > 0) setShowHowItWorks(false);

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

  // Categories with professional gradients
  const categories = [
    { name: "Wedding", icon: PiHeartFill, gradient: "from-rose-500 to-pink-600" },
    { name: "YouTube", icon: HiOutlinePlayCircle, gradient: "from-red-500 to-orange-500" },
    { name: "Corporate", icon: HiOutlineBuildingOffice2, gradient: "from-indigo-500 to-blue-600" },
    { name: "Music", icon: HiOutlineMusicalNote, gradient: "from-violet-500 to-purple-600" },
    { name: "Social", icon: HiOutlineDevicePhoneMobile, gradient: "from-emerald-500 to-teal-600" },
    { name: "Ads", icon: HiOutlineMegaphone, gradient: "from-amber-500 to-orange-600" },
  ];

  // Status colors for active projects
  const getStatusStyle = (status) => {
    const styles = {
      new: { bg: "bg-amber-500/10", text: "text-amber-400", label: "Pending" },
      accepted: { bg: "bg-indigo-500/10", text: "text-indigo-400", label: "Accepted" },
      in_progress: { bg: "bg-blue-500/10", text: "text-blue-400", label: "In Progress" },
      submitted: { bg: "bg-purple-500/10", text: "text-purple-400", label: "Review" },
    };
    return styles[status] || { bg: "bg-zinc-500/10", text: "text-zinc-400", label: status };
  };

  return (
    <div 
      className="min-h-screen flex flex-col md:flex-row bg-[#09090B] light:bg-[#FAFAFA] text-white light:text-zinc-900"
      style={{ fontFamily: "'Manrope', sans-serif" }}
    >
      <ClientSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <ClientNavbar onMenuClick={() => setSidebarOpen(true)} />

      {/* Refresh Button */}
      <motion.button
        onClick={handleRefresh}
        disabled={isRefreshing}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed top-20 right-4 z-50 p-2 rounded-lg bg-zinc-900/90 light:bg-white/90 backdrop-blur border border-zinc-800 light:border-zinc-200"
      >
        <motion.div animate={isRefreshing ? { rotate: 360 } : {}} transition={isRefreshing ? { repeat: Infinity, duration: 0.8 } : {}}>
          <HiOutlineArrowPath className="text-indigo-400 w-4 h-4" />
        </motion.div>
      </motion.button>

      <main className="flex-1 px-4 md:px-6 py-4 pt-18 md:pt-4 md:ml-64 md:mt-16 overflow-x-hidden">
        
        {/* KYC Warning */}
        <KYCPendingBanner />
        
        {/* ===== HERO WELCOME SECTION ===== */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl mb-4"
        >
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700" />
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)' }} />
          
          <div className="relative p-4 md:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {/* User Avatar & Welcome */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="relative">
                  <img 
                    src={user?.profilePicture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} 
                    alt={user?.name} 
                    className="w-12 h-12 rounded-xl object-cover border-2 border-white/20"
                  />
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-violet-600" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="px-2 py-0.5 bg-white/15 backdrop-blur-sm rounded-full text-[9px] font-semibold text-white/90 uppercase tracking-wide">
                      Welcome Back
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-white truncate" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {user?.name?.split(" ")[0] || "there"}! 👋
                  </h2>
                  <p className="text-white/70 text-xs truncate">Find the perfect video editor for your project</p>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => scrollToExplore("editors")}
                  className="px-4 py-2.5 bg-white text-violet-600 text-xs font-semibold rounded-xl hover:bg-white/90 transition-all flex items-center gap-1.5 shadow-lg"
                >
                  <HiOutlineMagnifyingGlass className="w-4 h-4" /> Find Editors
                </button>
                <button
                  onClick={() => scrollToExplore("gigs")}
                  className="px-4 py-2.5 bg-white/15 backdrop-blur-sm text-white text-xs font-semibold rounded-xl hover:bg-white/25 transition-all flex items-center gap-1.5 border border-white/20"
                >
                  <HiOutlineBriefcase className="w-4 h-4" /> Gigs
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ===== STATS ROW ===== */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {[
            { label: "Total Orders", value: stats.totalOrders, icon: HiOutlineClipboardDocumentList, gradient: "from-violet-500/10 to-purple-500/5", iconBg: "bg-violet-500/15", color: "text-violet-400" },
            { label: "In Progress", value: stats.activeOrders, icon: HiOutlineClock, gradient: "from-blue-500/10 to-cyan-500/5", iconBg: "bg-blue-500/15", color: "text-blue-400" },
            { label: "Completed", value: stats.completedOrders, icon: HiOutlineCheckCircle, gradient: "from-emerald-500/10 to-teal-500/5", iconBg: "bg-emerald-500/15", color: "text-emerald-400" },
            { label: "Total Spent", value: `₹${stats.totalSpent >= 1000 ? (stats.totalSpent/1000).toFixed(1) + 'k' : stats.totalSpent}`, icon: HiOutlineCurrencyRupee, gradient: "from-amber-500/10 to-orange-500/5", iconBg: "bg-amber-500/15", color: "text-amber-400" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.02, y: -2 }}
              className={`relative overflow-hidden bg-gradient-to-br ${stat.gradient} border border-white/[0.06] light:border-zinc-200 rounded-xl p-3 cursor-pointer group`}
            >
              {/* Shimmer on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              
              <div className="relative flex items-center gap-2 mb-1.5">
                <div className={`p-1.5 ${stat.iconBg} rounded-lg`}>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <span className="text-[10px] text-zinc-400 light:text-zinc-500 font-semibold uppercase tracking-wider truncate">{stat.label}</span>
              </div>
              <p className="relative text-xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* ===== ACTIVE PROJECTS (NEW) ===== */}
        {activeProjects.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-br from-violet-500/20 to-purple-500/10 rounded-lg flex items-center justify-center">
                  <HiOutlineRocketLaunch className="w-3.5 h-3.5 text-violet-400" />
                </div>
                <h3 className="text-xs font-bold text-white light:text-zinc-900">Active Projects</h3>
              </div>
              <button onClick={() => navigate('/client-orders')} className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 font-semibold px-2.5 py-1 bg-violet-500/10 rounded-full hover:bg-violet-500/20 transition-all">
                View all <HiOutlineArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
              {activeProjects.map((project, idx) => {
                const statusStyle = getStatusStyle(project.status);
                return (
                  <motion.div
                    key={project._id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    onClick={() => navigate(`/chat/${project._id}`)}
                    className="snap-start flex-shrink-0 w-60 bg-gradient-to-br from-white/[0.03] to-transparent border border-white/[0.06] light:border-zinc-200 rounded-xl p-4 cursor-pointer hover:border-violet-500/30 transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <img 
                        src={project.editor?.profilePicture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} 
                        alt="" 
                        className="w-9 h-9 rounded-full object-cover border border-zinc-700 light:border-zinc-200"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{project.title}</p>
                        <p className="text-[10px] text-zinc-500 truncate">{project.editor?.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`px-2 py-0.5 text-[9px] font-semibold rounded-full ${statusStyle.bg} ${statusStyle.text}`}>
                        {statusStyle.label}
                      </span>
                      <span className="text-[10px] text-zinc-500">₹{project.amount}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ===== HOW IT WORKS (for new users) ===== */}
        {showHowItWorks && stats.totalOrders === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-indigo-500/5 to-purple-500/5 light:from-indigo-50/50 light:to-purple-50/50 border border-indigo-500/10 light:border-indigo-100 rounded-xl p-4 mb-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <HiOutlineSparkles className="w-4 h-4 text-indigo-400" /> How It Works
              </h3>
              <button onClick={() => setShowHowItWorks(false)} className="text-[10px] text-zinc-500 hover:text-zinc-400">Dismiss</button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { step: "1", icon: HiOutlineMagnifyingGlass, title: "Find", desc: "Browse editors" },
                { step: "2", icon: HiOutlineChatBubbleOvalLeft, title: "Discuss", desc: "Chat & negotiate" },
                { step: "3", icon: HiOutlineDocumentCheck, title: "Get Work", desc: "Receive quality" },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-10 h-10 mx-auto mb-2 bg-indigo-500/10 light:bg-indigo-100 rounded-xl flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-indigo-400 light:text-indigo-500" />
                  </div>
                  <p className="text-xs font-semibold">{item.title}</p>
                  <p className="text-[10px] text-zinc-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ===== EDITORS NEAR YOU - COMPACT ===== */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onClick={() => navigate('/editors-near-you')}
          className="relative mb-4 cursor-pointer group overflow-hidden rounded-xl"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-500 to-indigo-600" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="relative px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/20">
                <HiOutlineMapPin className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white">Editors Near You</h3>
                  <span className="px-1.5 py-0.5 bg-amber-400 text-amber-900 text-[8px] font-bold rounded-full uppercase">NEW</span>
                </div>
                <p className="text-white/70 text-xs">Find trusted video editors in your area • Map view</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="hidden sm:block text-white/70 text-xs font-medium">Explore</span>
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-all">
                <HiOutlineArrowRight className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* ===== MAIN GRID ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 mb-4">
          
          {/* Left Column */}
          <div className="lg:col-span-4 space-y-3">
            
            {/* Quick Actions */}
            <div className="bg-[#0d0d12] light:bg-white border border-white/[0.06] light:border-zinc-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-gradient-to-br from-amber-500/20 to-orange-500/10 rounded-lg flex items-center justify-center">
                  <HiOutlineBolt className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <h3 className="text-xs font-bold text-white light:text-zinc-900">Quick Actions</h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Orders", icon: HiOutlineClipboardDocumentList, path: "/client-orders", gradient: "from-violet-500/15 to-purple-500/5", color: "text-violet-400" },
                  { label: "Messages", icon: HiOutlineChatBubbleLeftRight, path: "/client-messages", gradient: "from-blue-500/15 to-cyan-500/5", color: "text-blue-400", badge: totalUnread },
                  { label: "Saved", icon: HiOutlineHeart, path: "/saved-editors", gradient: "from-rose-500/15 to-pink-500/5", color: "text-rose-400" },
                  { label: "Reels", icon: HiOutlinePlayCircle, path: "/reels", gradient: "from-purple-500/15 to-violet-500/5", color: "text-purple-400" },
                ].map((item) => (
                  <motion.button
                    key={item.label}
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(item.path)}
                    className={`bg-gradient-to-br ${item.gradient} rounded-xl p-3 flex items-center gap-2.5 transition-all relative border border-white/[0.04] light:border-zinc-100 hover:border-white/10`}
                  >
                    <item.icon className={`w-4 h-4 ${item.color} shrink-0`} />
                    <span className="text-sm font-semibold truncate">{item.label}</span>
                    {item.badge > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center text-[9px] font-bold bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-full animate-pulse shadow-lg">
                        {item.badge > 9 ? "9+" : item.badge}
                      </span>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div className="bg-[#0d0d12] light:bg-white border border-white/[0.06] light:border-zinc-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-gradient-to-br from-orange-500/20 to-red-500/10 rounded-lg flex items-center justify-center">
                  <HiOutlineFire className="w-3.5 h-3.5 text-orange-400" />
                </div>
                <h3 className="text-xs font-bold text-white light:text-zinc-900">Popular Categories</h3>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {categories.map((cat, idx) => (
                  <motion.button
                    key={cat.name}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.03 }}
                    whileHover={{ scale: 1.05, y: -3 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => scrollToExplore("gigs")}
                    className={`relative bg-gradient-to-br ${cat.gradient} rounded-xl p-3 text-center transition-all shadow-lg overflow-hidden group`}
                  >
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    <cat.icon className="w-5 h-5 text-white mx-auto mb-1.5 relative" />
                    <span className="text-[10px] font-bold text-white block truncate relative">{cat.name}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Featured Editors */}
          <div className="lg:col-span-8 bg-[#0d0d12] light:bg-white border border-white/[0.06] light:border-zinc-200 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-br from-amber-500/20 to-yellow-500/10 rounded-lg flex items-center justify-center">
                  <HiOutlineStar className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <h3 className="text-xs font-bold text-white light:text-zinc-900">Featured Editors</h3>
              </div>
              <button onClick={() => scrollToExplore("editors")} className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 font-semibold px-2.5 py-1 bg-violet-500/10 rounded-full hover:bg-violet-500/20 transition-all">
                View all <HiOutlineArrowRight className="w-3 h-3" />
              </button>
            </div>
            
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="animate-pulse p-4 bg-zinc-800/40 light:bg-zinc-50 rounded-xl">
                    <div className="w-10 h-10 bg-zinc-700/50 light:bg-zinc-200 rounded-full mx-auto mb-2" />
                    <div className="h-3 bg-zinc-700/50 light:bg-zinc-200 rounded w-14 mx-auto mb-1.5" />
                    <div className="h-2 bg-zinc-700/50 light:bg-zinc-200 rounded w-10 mx-auto" />
                  </div>
                ))}
              </div>
            ) : featuredEditors.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {featuredEditors.map((editor, idx) => (
                  <motion.div
                    key={editor._id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.04 }}
                    whileHover={{ scale: 1.03, y: -3 }}
                    onClick={() => navigate(`/public-profile/${editor.user?._id}`)}
                    className="relative p-4 bg-gradient-to-br from-white/[0.03] to-transparent rounded-xl cursor-pointer transition-all text-center group border border-white/[0.04] hover:border-violet-500/30 overflow-hidden"
                  >
                    {/* Hover glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/0 to-purple-500/0 group-hover:from-violet-500/5 group-hover:to-purple-500/10 transition-all duration-300" />
                    
                    <div className="relative w-12 h-12 mx-auto mb-2.5">
                      <img 
                        src={editor.user?.profilePicture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} 
                        alt=""
                        className="w-full h-full rounded-xl object-cover border-2 border-white/10 group-hover:border-violet-500/40 transition-all"
                      />
                      {/* Animated online indicator */}
                      <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#0d0d12] animate-pulse" />
                    </div>
                    <p className="text-sm font-bold truncate mb-0.5 group-hover:text-violet-400 transition-colors">{editor.user?.name?.split(" ")[0]}</p>
                    <p className="text-[10px] text-zinc-500 truncate mb-1.5">{editor.skills?.[0] || "Video Editor"}</p>
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 rounded-full">
                      <HiOutlineStar className="w-3 h-3 text-amber-400" />
                      <span className="text-[10px] font-semibold text-amber-400">{(4 + Math.random()).toFixed(1)}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-2xl flex items-center justify-center">
                  <HiOutlineUsers className="w-6 h-6 text-zinc-600" />
                </div>
                <p className="text-sm text-zinc-500 font-medium">No featured editors yet</p>
                <p className="text-xs text-zinc-600 mt-1">Check back soon!</p>
              </div>
            )}
          </div>
        </div>

        {/* ===== EXPLORE SECTION ===== */}
        <div ref={exploreRef} className="scroll-mt-20">
          {/* Tabs */}
          <div className="flex items-center justify-center mb-4">
            <div className="inline-flex p-0.5 bg-[#111118] light:bg-white border border-zinc-800/50 light:border-zinc-200 rounded-xl">
              {[
                { id: "editors", label: "Editors", icon: FaUsers },
                { id: "gigs", label: "Gigs", icon: FaBriefcase },
                { id: "reels", label: "Reels", icon: FaPlayCircle },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => tab.id === "reels" ? navigate("/reels") : setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                    activeTab === tab.id
                      ? "text-white bg-gradient-to-r from-indigo-500 to-purple-500 shadow-md"
                      : "text-zinc-400 light:text-zinc-500 hover:text-white light:hover:text-zinc-900"
                  }`}
                >
                  <tab.icon size={12} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="bg-[#111118] light:bg-white border border-zinc-800/50 light:border-zinc-200 rounded-xl p-4 md:p-5">
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500/10 light:bg-indigo-50 text-indigo-400 light:text-indigo-600 text-[10px] font-medium rounded-full mb-2">
                <HiOutlineSparkles className="w-3 h-3" /> 
                {activeTab === "editors" ? "Discover Talent" : "Browse Services"}
              </div>
              <h2 className="text-lg font-bold">
                {activeTab === "editors" ? "Find Your Perfect Editor" : "Explore Available Gigs"}
              </h2>
              <p className="text-zinc-500 text-xs mt-1">
                {activeTab === "editors" ? "Connect with skilled professionals" : "Find the right service"}
              </p>
            </div>

            <AnimatePresence mode="wait">
              {activeTab === "editors" && (
                <motion.div key="editors" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative">
                  {/* Content with max-height and overflow hidden */}
                  <div className="max-h-[400px] overflow-hidden relative">
                    <ExploreEditor />
                  </div>
                  {/* Gradient Fade Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#111118] via-[#111118]/90 to-transparent pointer-events-none light:from-white light:via-white/90" />
                  {/* See More Button - overlaid on fade */}
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center z-10">
                    <button 
                      onClick={() => navigate('/explore-editors')}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white text-sm font-semibold rounded-full hover:opacity-90 transition-all shadow-lg shadow-violet-500/25"
                    >
                      See More Editors <FaArrowRight className="text-xs" />
                    </button>
                  </div>
                </motion.div>
              )}
              {activeTab === "gigs" && (
                <motion.div key="gigs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative">
                  {/* Content with max-height and overflow hidden */}
                  <div className="max-h-[400px] overflow-hidden relative">
                    <ExploreGigs />
                  </div>
                  {/* Gradient Fade Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#111118] via-[#111118]/90 to-transparent pointer-events-none light:from-white light:via-white/90" />
                  {/* See More Button - overlaid on fade */}
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center z-10">
                    <button 
                      onClick={() => navigate('/explore-editors?tab=gigs')}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white text-sm font-semibold rounded-full hover:opacity-90 transition-all shadow-lg shadow-violet-500/25"
                    >
                      See More Gigs <FaArrowRight className="text-xs" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Floating Reels Button */}
        <motion.button
          onClick={() => navigate("/reels")}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          className="fixed bottom-5 right-5 z-[200] w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl shadow-indigo-500/25"
        >
          <img src={reelIcon} alt="reels" className="w-5 h-5" />
        </motion.button>
      </main>
    </div>
  );
};

export default ClientHome;
