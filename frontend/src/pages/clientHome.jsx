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
import { FaUsers, FaBriefcase, FaPlayCircle } from "react-icons/fa";
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
        
        {/* ===== WELCOME HEADER ===== */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-indigo-500/8 via-purple-500/5 to-blue-500/8 light:from-indigo-50 light:via-purple-50/50 light:to-blue-50 rounded-xl p-4 mb-4 border border-indigo-500/10 light:border-indigo-200/50"
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="p-2.5 bg-indigo-500/15 light:bg-indigo-100 rounded-xl shrink-0">
                <HiOutlineSparkles className="w-5 h-5 text-indigo-400 light:text-indigo-500" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-bold truncate">Welcome back, {user?.name?.split(" ")[0] || "there"}!</h2>
                <p className="text-zinc-400 light:text-zinc-500 text-xs truncate">Find the perfect video editor for your project</p>
              </div>
            </div>
            
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => scrollToExplore("editors")}
                className="px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-medium rounded-lg transition-all flex items-center gap-1.5"
              >
                <HiOutlineMagnifyingGlass className="w-3.5 h-3.5" /> Find Editors
              </button>
              <button
                onClick={() => scrollToExplore("gigs")}
                className="px-3 py-2 bg-zinc-800/80 light:bg-white hover:bg-zinc-700 light:hover:bg-zinc-50 border border-zinc-700 light:border-zinc-200 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5"
              >
                <HiOutlineBriefcase className="w-3.5 h-3.5" /> Browse Gigs
              </button>
            </div>
          </div>
        </motion.div>

        {/* ===== STATS ROW ===== */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {[
            { label: "Total Orders", value: stats.totalOrders, icon: HiOutlineClipboardDocumentList, color: "text-indigo-400", bg: "bg-indigo-500/10" },
            { label: "In Progress", value: stats.activeOrders, icon: HiOutlineClock, color: "text-blue-400", bg: "bg-blue-500/10" },
            { label: "Completed", value: stats.completedOrders, icon: HiOutlineCheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10" },
            { label: "Total Spent", value: `₹${stats.totalSpent >= 1000 ? (stats.totalSpent/1000).toFixed(1) + 'k' : stats.totalSpent}`, icon: HiOutlineCurrencyRupee, color: "text-purple-400", bg: "bg-purple-500/10" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-[#111118] light:bg-white border border-zinc-800/50 light:border-zinc-200 rounded-xl p-3 hover:border-indigo-500/30 transition-all"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className={`p-1.5 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
                </div>
                <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider truncate">{stat.label}</span>
              </div>
              <p className="text-lg font-bold">{stat.value}</p>
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
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                <HiOutlineRocketLaunch className="w-3.5 h-3.5 text-indigo-400" /> Active Projects
              </h3>
              <button onClick={() => navigate('/client-orders')} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium">
                View all <HiOutlineArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {activeProjects.map((project) => {
                const statusStyle = getStatusStyle(project.status);
                return (
                  <motion.div
                    key={project._id}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => navigate(`/chat/${project._id}`)}
                    className="flex-shrink-0 w-56 bg-[#111118] light:bg-white border border-zinc-800/50 light:border-zinc-200 rounded-xl p-3 cursor-pointer hover:border-indigo-500/30 transition-all"
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
            <div className="bg-[#111118] light:bg-white border border-zinc-800/50 light:border-zinc-200 rounded-xl p-4">
              <h3 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <HiOutlineBolt className="w-3.5 h-3.5 text-amber-400" /> Quick Actions
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Orders", icon: HiOutlineClipboardDocumentList, path: "/client-orders", color: "text-indigo-400", bg: "bg-indigo-500/10 light:bg-indigo-50" },
                  { label: "Messages", icon: HiOutlineChatBubbleLeftRight, path: "/client-messages", color: "text-blue-400", bg: "bg-blue-500/10 light:bg-blue-50", badge: totalUnread },
                  { label: "Saved", icon: HiOutlineHeart, path: "/saved-editors", color: "text-rose-400", bg: "bg-rose-500/10 light:bg-rose-50" },
                  { label: "Reels", icon: HiOutlinePlayCircle, path: "/reels", color: "text-purple-400", bg: "bg-purple-500/10 light:bg-purple-50" },
                ].map((item) => (
                  <motion.button
                    key={item.label}
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(item.path)}
                    className={`${item.bg} rounded-xl p-3 flex items-center gap-2.5 transition-all relative`}
                  >
                    <item.icon className={`w-4 h-4 ${item.color} shrink-0`} />
                    <span className="text-sm font-medium truncate">{item.label}</span>
                    {item.badge > 0 && (
                      <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[9px] font-bold bg-red-500 text-white rounded-full animate-pulse shadow-sm">
                        {item.badge > 9 ? "9+" : item.badge}
                      </span>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div className="bg-[#111118] light:bg-white border border-zinc-800/50 light:border-zinc-200 rounded-xl p-4">
              <h3 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <HiOutlineFire className="w-3.5 h-3.5 text-orange-400" /> Popular Categories
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {categories.map((cat) => (
                  <motion.button
                    key={cat.name}
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => scrollToExplore("gigs")}
                    className={`bg-gradient-to-br ${cat.gradient} rounded-xl p-2.5 text-center transition-all shadow-lg`}
                  >
                    <cat.icon className="w-4 h-4 text-white mx-auto mb-1" />
                    <span className="text-[10px] font-semibold text-white block truncate">{cat.name}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Featured Editors */}
          <div className="lg:col-span-8 bg-[#111118] light:bg-white border border-zinc-800/50 light:border-zinc-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                <HiOutlineStar className="w-3.5 h-3.5 text-amber-400" /> Featured Editors
              </h3>
              <button onClick={() => scrollToExplore("editors")} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium">
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
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    onClick={() => navigate(`/public-profile/${editor.user?._id}`)}
                    className="p-3 bg-zinc-800/40 light:bg-zinc-50 rounded-xl hover:bg-zinc-800/60 light:hover:bg-zinc-100 cursor-pointer transition-all text-center group hover:border-indigo-500/30 border border-transparent"
                  >
                    <div className="relative w-10 h-10 mx-auto mb-2">
                      <img 
                        src={editor.user?.profilePicture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} 
                        alt=""
                        className="w-full h-full rounded-full object-cover border-2 border-zinc-700 light:border-zinc-200 group-hover:border-indigo-500/50 transition-all"
                      />
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#111118] light:border-white" />
                    </div>
                    <p className="text-xs font-semibold truncate mb-0.5">{editor.user?.name?.split(" ")[0]}</p>
                    <p className="text-[10px] text-zinc-500 truncate mb-1">{editor.skills?.[0] || "Editor"}</p>
                    <div className="flex items-center justify-center gap-1">
                      <HiOutlineStar className="w-3 h-3 text-amber-400" />
                      <span className="text-[10px] font-medium text-zinc-400">{(4 + Math.random()).toFixed(1)}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-zinc-500">
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
