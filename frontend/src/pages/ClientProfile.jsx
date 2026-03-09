// ClientProfile.jsx - Client's profile and settings page
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaArrowLeft,
  FaUser,
  FaEnvelope,
  FaCalendarAlt,
  FaEdit,
  FaCheck,
  FaTimes,
  FaClipboardList,
  FaClock,
  FaRupeeSign,
  FaChartLine,
  FaCog,
  FaBell,
  FaLock,
  FaSignOutAlt,
  FaUserFriends,
  FaUserPlus,
  FaStar,
  FaEye,
  FaFilm,
  FaRocket,
  FaMapMarkerAlt,
} from "react-icons/fa";
import { MdVerified } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import ClientSidebar from "../components/ClientSidebar.jsx";
import ClientNavbar from "../components/ClientNavbar.jsx";
import PortfolioSection from "../components/PortfolioSection.jsx";
 import useRefreshManager from "../hooks/useRefreshManager.js";
import usePullToRefresh from "../hooks/usePullToRefresh.jsx";

const ClientProfile = () => {
  const navigate = useNavigate();
  const { user, backendURL, logout } = useAppContext();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    totalOrders: 0,
    completedOrders: 0,
    totalSpent: 0,
    averageRating: 4.8,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });
  const [privacySettings, setPrivacySettings] = useState({
    manualApproval: user?.followSettings?.manualApproval || false,
  });
  const [updatingPrivacy, setUpdatingPrivacy] = useState(false);
  


  // ── DATA FETCHING ──────────────────────────────────────────────────
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['orders', 'client'],
    queryFn: async () => {
      const { data } = await axios.get(`${backendURL}/api/orders`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      return data.orders || [];
    },
    enabled: !!user?.token,
  });

  const loading = ordersLoading;
  
  const hasLoadedOnce = useRef(false);

  useEffect(() => {
    if (!loading) hasLoadedOnce.current = true;
  }, [loading]);

  // Sync state with query data
  useEffect(() => {
    if (ordersData) {
      const orders = ordersData;
      const completed = orders.filter(o => o.status === "completed").length;
      const totalSpent = orders
        .filter(o => o.status === "completed")
        .reduce((sum, o) => sum + (o.amount || 0), 0);

      setStats({
        totalOrders: orders.length,
        completedOrders: completed,
        totalSpent,
        averageRating: 4.8,
      });

      setRecentOrders(orders.slice(0, 5));
    }
  }, [ordersData]);

  const scrollContainerRef = useRef(null);
  const { triggerRefresh } = useRefreshManager();

  // Pull-to-Refresh Integration
  const { handleTouchStart, handleTouchEnd, PullIndicator } = usePullToRefresh(
    () => triggerRefresh(true, ['orders', 'profile']), 
    scrollContainerRef
  );



  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const tabs = [
    { id: "portfolio", label: "Reels", icon: FaFilm },
    { id: "about", label: "About", icon: FaUser },
  ];

  // Progress ring config
  const size = 100;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const completionPercent = 95; // Clients usually high
  const strokeDashoffset = circumference - (completionPercent / 100) * circumference;
  const progressColor = "#8B5CF6"; // Purple for clients

  if (loading && !hasLoadedOnce.current) {
    return (
      <div className="min-h-screen flex flex-col md:flex-row bg-[#050509] text-white">
        <ClientSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <ClientNavbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 flex items-center justify-center md:ml-64 md:mt-20">
          <div className="flex flex-col items-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full"
            />
            <p className="mt-4 text-gray-400 text-sm">Loading your profile...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-black light:bg-slate-50 text-white light:text-slate-900 transition-colors duration-200">
      <ClientSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <ClientNavbar onMenuClick={() => setSidebarOpen(true)} />

      <main 
        ref={scrollContainerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="flex-1 md:ml-64 md:mt-16 overflow-y-auto"
      >
        <PullIndicator />
        <div className="max-w-5xl mx-auto">
          
          {/* ==================== PROFILE HEADER (HYPER-COMPACT) ==================== */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl mb-2 bg-black border border-zinc-800/40 p-3 md:p-10"
          >
            <div className="flex flex-col md:flex-row gap-4 md:gap-14 items-center md:items-start">
              
              {/* Desktop Avatar Profile (Hidden on Mobile) */}
              <div className="hidden md:block shrink-0">
                <div className="relative">
                  <svg
                    className="absolute -top-1.5 -left-1.5 w-[116px] h-[116px] -rotate-90 pointer-events-none"
                    viewBox={`0 0 ${size + 8} ${size + 8}`}
                  >
                    <circle cx={(size + 8) / 2} cy={(size + 8) / 2} r={radius + 4} fill="none" stroke="#1a1a1a" strokeWidth={strokeWidth} />
                    <circle cx={(size + 8) / 2} cy={(size + 8) / 2} r={radius + 4} fill="none" stroke={progressColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={circumference + 25} strokeDashoffset={strokeDashoffset + 12} />
                  </svg>
                  <div className="relative rounded-full p-[4px] bg-zinc-900 ring-2 ring-black w-[108px] h-[108px]">
                    <div className="w-full h-full rounded-full overflow-hidden bg-zinc-950">
                      <img src={user?.profilePicture || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} alt="Profile" className="w-full h-full object-cover" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Info & Stats Section */}
              <div className="flex-1 w-full min-w-0">
                
                {/* Mobile Header Split: [Left: Avatar+Name+Edit] | [Right: Followers+Following] */}
                <div className="flex md:hidden w-full gap-3 items-stretch mb-3">
                  {/* Left Column (50%): Avatar + Name + Edit (Centered) */}
                  <div className="w-1/2 flex flex-col items-center gap-1.5">
                    <div className="relative shrink-0 mb-1">
                      <svg
                        className="absolute -top-1 -left-1 w-20 h-20 -rotate-90 pointer-events-none"
                        viewBox={`0 0 ${size + 8} ${size + 8}`}
                      >
                        <circle cx={(size + 8) / 2} cy={(size + 8) / 2} r={radius + 4} fill="none" stroke="#1a1a1a" strokeWidth={strokeWidth + 2} />
                        <circle cx={(size + 8) / 2} cy={(size + 8) / 2} r={radius + 4} fill="none" stroke={progressColor} strokeWidth={strokeWidth + 2} strokeLinecap="round" strokeDasharray={circumference + 25} strokeDashoffset={strokeDashoffset + 12} />
                      </svg>
                      <div className="relative rounded-full p-[2px] bg-zinc-900 ring-1 ring-black w-18 h-18">
                        <div className="w-full h-full rounded-full overflow-hidden bg-zinc-950">
                          <img src={user?.profilePicture || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} alt="Profile" className="w-full h-full object-cover" />
                        </div>
                      </div>
                    </div>
                    <div className="w-full text-center">
                      <h1 className="text-base font-black text-white tracking-tight flex items-center justify-center gap-1 leading-none mb-2.5 break-all">
                        {user?.name || "Your Name"}
                        <MdVerified className="text-blue-500 text-sm shrink-0" />
                      </h1>
                      <button
                        onClick={() => navigate("/editor-profile-update")}
                        className="w-full py-2 bg-white text-black text-[10px] font-black rounded-md uppercase tracking-wide flex items-center justify-center gap-1"
                      >
                        <FaEdit size={8} /> EDIT
                      </button>
                    </div>
                  </div>

                  {/* Right Column (50%): Followers + Following */}
                  <div className="w-1/2 flex flex-col justify-center gap-5 pt-1 border-l border-zinc-900 ml-1 pl-3">
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1.5 mb-1">
                        <FaUserFriends className="text-[8px] text-zinc-600" />
                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Followers</span>
                      </div>
                      <span className="text-2xl font-black text-white leading-none tracking-tighter">{user?.followers?.length || 0}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1.5 mb-1">
                        <FaUserPlus className="text-[8px] text-zinc-600" />
                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Following</span>
                      </div>
                      <span className="text-2xl font-black text-white leading-none tracking-tighter">{user?.following?.length || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Desktop Name Row */}
                <div className="hidden md:flex items-center gap-5 mb-6">
                  <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
                    {user?.name}
                    <MdVerified className="text-blue-500" />
                  </h1>
                  <button
                    onClick={() => navigate("/editor-profile-update")}
                    className="flex items-center gap-2 px-6 py-2 bg-white text-black text-xs font-black rounded-full uppercase tracking-widest hover:bg-zinc-200 transition-all hover:scale-105 active:scale-95"
                  >
                    <FaEdit className="text-[12px]" /> Edit Profile
                  </button>
                </div>

                {/* Subsidiary Stats Row */}
                <div className="flex justify-between gap-1 mb-3 bg-zinc-950/40 rounded-lg py-2 px-1 border border-zinc-900/30">
                  {[
                    { label: "Orders", value: stats.totalOrders, icon: <FaClipboardList className="text-[7px]" /> },
                    { label: "Spent", value: `₹${stats.totalSpent.toLocaleString()}`, icon: <FaRupeeSign className="text-[7px] text-green-500" /> },
                    { label: "Reels", value: user?.portfolios?.length || 0, icon: <FaFilm className="text-[7px] text-violet-500" /> },
                    { label: "Rating", value: "4.9", icon: <FaStar className="text-[7px] text-amber-500" /> }
                  ].map((stat) => (
                    <div key={stat.label} className="flex flex-col items-center flex-1">
                      <div className="flex items-center gap-0.5 mb-0.5">
                        {stat.icon}
                        <span className="hidden xs:inline text-[7px] font-black text-zinc-600 uppercase">{stat.label}</span>
                      </div>
                      <div className="text-[10px] md:text-xl font-black text-white">{stat.value}</div>
                    </div>
                  ))}
                </div>

                {/* Bio & Metadata */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] md:text-base font-black text-zinc-300 uppercase tracking-tight">PREMIUM CLIENT</span>
                    <span className="px-1.5 py-0.5 bg-zinc-900/50 text-zinc-500 text-[7px] md:text-[10px] font-black rounded border border-zinc-800 uppercase tracking-widest">ELITE</span>
                  </div>
                  
                  <div className="text-[10px] md:text-sm font-medium text-zinc-400 leading-tight">
                    {user?.about || "I am a content creator looking for top editors."}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2 mt-2 border-t border-zinc-900/50 text-zinc-500 text-[8px] md:text-[11px] font-black uppercase tracking-tight">
                    <div className="flex items-center gap-1">
                      <FaMapMarkerAlt size={7} /> <span>INDIA</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FaEnvelope size={7} /> <span className="normal-case">{user?.email}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FaCalendarAlt size={7} /> <span>Member since 2024</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ==================== TABS ==================== */}
          <div className="flex justify-center mb-2.5">
            <div className="inline-flex bg-zinc-950/80 border border-zinc-900 rounded-lg p-1 relative">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      relative px-6 py-1.5 rounded-md text-[10px] md:text-sm font-black uppercase tracking-widest transition-all flex items-center gap-1.5 z-10
                      ${isActive ? "text-black" : "text-zinc-500 hover:text-zinc-300"}
                    `}
                  >
                    {isActive && (
                      <div className="absolute inset-0 bg-white rounded-md -z-10" />
                    )}
                    <tab.icon className="text-[10px] md:text-xs" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ==================== TAB CONTENT ==================== */}
          <AnimatePresence mode="wait">
            {activeTab === "portfolio" && (
              <motion.div
                key="portfolio"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-zinc-950 border border-zinc-800/50 rounded-xl p-4 md:p-5"
              >
                <PortfolioSection portfolios={user?.portfolios || []} />
              </motion.div>
            )}

            {activeTab === "about" && (
              <motion.div
                key="about"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="bg-zinc-950 border border-zinc-800/50 rounded-xl p-6">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4">About the Client</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    {user?.about || "No additional information provided."}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default ClientProfile;
