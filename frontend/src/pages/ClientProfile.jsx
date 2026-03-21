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
  FaYoutube,
  FaInstagram,
  FaTiktok,
  FaTwitter,
  FaLinkedin,
  FaGlobe,
  FaSearch,
} from "react-icons/fa";
import { MdVerified } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import UnifiedNavigation from "../components/UnifiedNavigation.jsx";
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
  const [activeTab, setActiveTab] = useState("portfolio");
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });
  const [privacySettings, setPrivacySettings] = useState({
    manualApproval: user?.followSettings?.manualApproval || false,
  });
  const [updatingPrivacy, setUpdatingPrivacy] = useState(false);
  
  // Followers/Following Modal State
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [usersModalTitle, setUsersModalTitle] = useState("");
  const [usersModalList, setUsersModalList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  


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

  const { data: profileResult, isLoading: profileLoading, refetch: refetchProfile } = useQuery({
    queryKey: ['profile', user?._id],
    queryFn: async () => {
      const { data } = await axios.get(`${backendURL}/api/profile`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      return data.profile;
    },
    enabled: !!user?.token,
  });

  const loading = ordersLoading || profileLoading;
  
  const hasLoadedOnce = useRef(false);

  useEffect(() => {
    if (!loading) hasLoadedOnce.current = true;
  }, [loading]);

  useEffect(() => {
    if (user?._id && !activeTab) {
      setActiveTab("portfolio");
    }
  }, [user?._id, activeTab]);

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

  // Removed handleFetchUsers as modal is removed
  // const handleFetchUsers = async (type) => {
  //   try {
  //     setLoadingUsers(true);
  //     setUsersModalTitle(type === 'followers' ? 'Followers' : 'Following');
  //     setShowUsersModal(true);
      
  //     const endpoint = type === 'followers' 
  //       ? `${backendURL}/api/user/followers/${user?._id}` 
  //       : `${backendURL}/api/user/following/${user?._id}`;
      
  //     const { data } = await axios.get(endpoint);
  //     setUsersModalList(data[type] || []);
  //   } catch (error) {
  //     console.error(`Error fetching ${type}:`, error);
  //     toast.error(`Failed to load ${type}`);
  //   } finally {
  //     setLoadingUsers(false);
  //   }
  // };



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

  // Progress ring config for full circle
  const size = 100;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progressColor = "#c084fc"; // Light Purple
  // For a full circle border:
  const strokeDashoffset = 0;
  const strokeDasharray = circumference; // Solid circle

  if (loading && !hasLoadedOnce.current) {
    return (
      <div className="min-h-screen flex flex-col bg-[#050509] text-white">
        <UnifiedNavigation sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
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
      <UnifiedNavigation sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

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
                    <circle cx={(size + 8) / 2} cy={(size + 8) / 2} r={radius + 4} fill="none" stroke={progressColor} strokeWidth={strokeWidth} />
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
                        <circle cx={(size + 8) / 2} cy={(size + 8) / 2} r={radius + 4} fill="none" stroke={progressColor} strokeWidth={strokeWidth + 2} />
                      </svg>
                      <div className="relative rounded-full p-[2px] bg-zinc-900 ring-1 ring-black w-18 h-18">
                        <div className="w-full h-full rounded-full overflow-hidden bg-zinc-950">
                          <img src={user?.profilePicture || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} alt="Profile" className="w-full h-full object-cover" />
                        </div>
                      </div>
                    </div>
                    <div className="w-full text-center">
                      <h1 className="text-base font-bold text-white tracking-tight flex items-center justify-center gap-1 leading-none mb-2.5 break-all">
                        {user?.name || "Your Name"}
                        <MdVerified className="text-purple-500 text-sm shrink-0" />
                      </h1>
                      <button
                        onClick={() => navigate("/client/profile-update")}
                        className="w-full py-2 bg-white text-black text-[10px] font-normal rounded-md uppercase tracking-wide flex items-center justify-center gap-1"
                      >
                        <FaEdit size={8} /> EDIT
                      </button>
                    </div>
                  </div>

                  {/* Right Column (50%): Followers + Following */}
                  <div className="w-1/2 flex flex-col justify-center gap-5 pt-1 border-l border-zinc-900 ml-1 pl-3">
                    <button 
                      onClick={() => navigate(`/connections/${user?._id}?tab=followers`)}
                      className="flex flex-col items-center hover:opacity-80 transition-all"
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <FaUserFriends className="text-[8px] text-zinc-600" />
                        <span className="text-[9px] font-normal text-zinc-500 uppercase tracking-widest">Followers</span>
                      </div>
                      <span className="text-2xl font-normal text-white leading-none tracking-tighter">{user?.followers?.length || 0}</span>
                    </button>
                    <button 
                      onClick={() => navigate(`/connections/${user?._id}?tab=following`)}
                      className="flex flex-col items-center hover:opacity-80 transition-all"
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <FaUserPlus className="text-[8px] text-zinc-600" />
                        <span className="text-[9px] font-normal text-zinc-500 uppercase tracking-widest">Following</span>
                      </div>
                      <span className="text-2xl font-normal text-white leading-none tracking-tighter">{user?.following?.length || 0}</span>
                    </button>
                  </div>
                </div>

                {/* Mobile Bio Section - NEW */}
                <div className="flex md:hidden flex-col gap-3 px-1 mt-1 mb-4">
                  <div className="text-[11px] font-normal text-zinc-400 leading-tight whitespace-pre-wrap">
                    {profileResult?.about || user?.about || "I am a content creator looking for top editors."}
                  </div>
                  
                  {/* Mobile Social Icons */}
                  {profileResult?.socialLinks && Object.values(profileResult.socialLinks).some(link => link) && (
                    <div className="flex flex-wrap gap-2.5 pt-1">
                      {profileResult.socialLinks.youtube && (
                        <a href={profileResult.socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-zinc-900/50 border border-white/5 text-[#FF0000] hover:bg-[#FF0000]/10 transition-all">
                          <FaYoutube size={14} />
                        </a>
                      )}
                      {profileResult.socialLinks.instagram && (
                        <a href={profileResult.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-zinc-900/50 border border-white/5 text-[#E4405F] hover:bg-[#E4405F]/10 transition-all">
                          <FaInstagram size={14} />
                        </a>
                      )}
                      {profileResult.socialLinks.tiktok && (
                        <a href={profileResult.socialLinks.tiktok} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-zinc-900/50 border border-white/5 text-white hover:bg-white/10 transition-all">
                          <FaTiktok size={14} />
                        </a>
                      )}
                      {profileResult.socialLinks.twitter && (
                        <a href={profileResult.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-zinc-900/50 border border-white/5 text-[#1DA1F2] hover:bg-[#1DA1F2]/10 transition-all">
                          <FaTwitter size={14} />
                        </a>
                      )}
                      {profileResult.socialLinks.linkedin && (
                        <a href={profileResult.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-zinc-900/50 border border-white/5 text-[#0077B5] hover:bg-[#0077B5]/10 transition-all">
                          <FaLinkedin size={14} />
                        </a>
                      )}
                      {profileResult.socialLinks.website && (
                        <a href={profileResult.socialLinks.website} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-zinc-900/50 border border-white/5 text-[#10B981] hover:bg-[#10B981]/10 transition-all">
                          <FaGlobe size={14} />
                        </a>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3 pt-2 mt-1 border-t border-zinc-900/50 text-zinc-600 text-[9px] font-normal uppercase tracking-tight">
                    <div className="flex items-center gap-1">
                      <FaMapMarkerAlt size={8} /> <span>INDIA</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FaCalendarAlt size={8} /> <span>Joined {new Date(user?.createdAt || Date.now()).getFullYear()}</span>
                    </div>
                  </div>
                </div>

                {/* Desktop Name & Follow Counts Row */}
                <div className="hidden md:flex items-center gap-8 mb-6">
                  <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
                    {user?.name}
                    <MdVerified className="text-purple-500" />
                  </h1>
                  <div className="flex gap-8">
                    <button onClick={() => navigate(`/connections/${user?._id}?tab=followers`)} className="hover:opacity-80 transition-all flex items-center gap-2">
                       <span className="text-lg font-normal text-white">{user?.followers?.length || 0}</span>
                       <span className="text-zinc-500 text-sm uppercase tracking-widest font-normal">Followers</span>
                    </button>
                    <button onClick={() => navigate(`/connections/${user?._id}?tab=following`)} className="hover:opacity-80 transition-all flex items-center gap-2">
                       <span className="text-lg font-normal text-white">{user?.following?.length || 0}</span>
                       <span className="text-zinc-500 text-sm uppercase tracking-widest font-normal">Following</span>
                    </button>
                  </div>
                </div>

                <div className="hidden md:flex gap-3 mb-6">
                  <button
                    onClick={() => navigate("/client/profile-update")}
                    className="flex items-center gap-2 px-8 py-2.5 bg-white text-black text-xs font-normal rounded-lg uppercase tracking-widest hover:bg-zinc-200 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-white/5"
                  >
                    <FaEdit className="text-[12px]" /> Edit Profile
                  </button>
                </div>

                {/* Bio & Social Links - Desktop Only */}
                <div className="hidden md:block space-y-4 mt-6">
                  <div className="text-sm md:text-base font-normal text-zinc-300 leading-relaxed max-w-2xl whitespace-pre-wrap">
                    {profileResult?.about || user?.about || "I am a content creator looking for top editors."}
                  </div>

                  {/* Social Icons Strip */}
                  {profileResult?.socialLinks && Object.values(profileResult.socialLinks).some(link => link) && (
                    <div className="flex flex-wrap gap-4 pt-2">
                      {profileResult.socialLinks.youtube && (
                        <a href={profileResult.socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-zinc-900/50 border border-white/5 text-[#FF0000] hover:bg-[#FF0000]/10 transition-all">
                          <FaYoutube size={18} />
                        </a>
                      )}
                      {profileResult.socialLinks.instagram && (
                        <a href={profileResult.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-zinc-900/50 border border-white/5 text-[#E4405F] hover:bg-[#E4405F]/10 transition-all">
                          <FaInstagram size={18} />
                        </a>
                      )}
                      {profileResult.socialLinks.tiktok && (
                        <a href={profileResult.socialLinks.tiktok} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-zinc-900/50 border border-white/5 text-white hover:bg-white/10 transition-all">
                          <FaTiktok size={18} />
                        </a>
                      )}
                      {profileResult.socialLinks.twitter && (
                        <a href={profileResult.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-zinc-900/50 border border-white/5 text-[#1DA1F2] hover:bg-[#1DA1F2]/10 transition-all">
                          <FaTwitter size={18} />
                        </a>
                      )}
                      {profileResult.socialLinks.linkedin && (
                        <a href={profileResult.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-zinc-900/50 border border-white/5 text-[#0077B5] hover:bg-[#0077B5]/10 transition-all">
                          <FaLinkedin size={18} />
                        </a>
                      )}
                      {profileResult.socialLinks.website && (
                        <a href={profileResult.socialLinks.website} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-zinc-900/50 border border-white/5 text-[#10B981] hover:bg-[#10B981]/10 transition-all">
                          <FaGlobe size={18} />
                        </a>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-4 pt-4 mt-2 border-t border-zinc-900/50 text-zinc-500 text-[10px] md:text-xs font-normal uppercase tracking-widest">
                    <div className="flex items-center gap-1.5">
                      <FaMapMarkerAlt size={10} className="text-zinc-600" /> <span>INDIA</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <FaEnvelope size={10} className="text-zinc-600" /> <span className="normal-case">{user?.email}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <FaCalendarAlt size={10} className="text-zinc-600" /> <span>Joined {new Date(user?.createdAt || Date.now()).getFullYear()}</span>
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
                      relative px-6 py-1.5 rounded-md text-[10px] md:text-sm font-normal uppercase tracking-widest transition-all flex items-center gap-1.5 z-10
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
                  <h3 className="text-sm font-normal text-white uppercase tracking-widest mb-4">About the Client</h3>
                  <div className="space-y-6">
                    <div>
                      <p className="text-zinc-400 text-sm leading-relaxed whitespace-pre-wrap">
                        {profileResult?.about || user?.about || "No additional information provided."}
                      </p>
                    </div>

                    {profileResult?.languages && profileResult.languages.length > 0 && (
                      <div className="pt-4 border-t border-zinc-900">
                        <h4 className="text-[10px] font-normal text-zinc-500 uppercase tracking-widest mb-3">Languages</h4>
                        <div className="flex flex-wrap gap-2">
                          {profileResult.languages.map((lang, idx) => (
                            <span key={idx} className="px-3 py-1 rounded-full bg-zinc-900 border border-white/5 text-zinc-300 text-xs font-normal">
                              {lang}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* ==================== FOLLOWERS/FOLLOWING MODAL - REMOVED ==================== */}
      {/* <AnimatePresence>
        {showUsersModal && (
          <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUsersModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="relative w-full max-w-md bg-[#0A0A0B] border-t md:border border-white/10 rounded-t-[32px] md:rounded-[32px] overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-lg font-normal text-white uppercase tracking-widest">{usersModalTitle}</h3>
                <button 
                  onClick={() => setShowUsersModal(false)}
                  className="p-2 rounded-full bg-white/5 text-zinc-400 hover:text-white transition-all"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {loadingUsers ? (
                  <div className="flex flex-col items-center py-12 gap-4">
                    <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-zinc-500 text-xs uppercase tracking-widest font-normal">Loading...</p>
                  </div>
                ) : usersModalList.length > 0 ? (
                  <div className="space-y-4">
                    {usersModalList.map((listUser) => (
                      <div 
                        key={listUser._id}
                        className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <img 
                            src={listUser.profilePicture || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} 
                            alt={listUser.name}
                            className="w-12 h-12 rounded-full object-cover ring-2 ring-white/10 group-hover:ring-emerald-500/50 transition-all"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-sm font-normal text-white">{listUser.name}</h4>
                              {listUser.role === 'editor' && <MdVerified className="text-blue-500 text-xs" />}
                            </div>
                            <p className="text-[10px] text-zinc-500 uppercase font-normal tracking-tight">{listUser.role}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            setShowUsersModal(false);
                            navigate(`/public-profile/${listUser._id}`);
                          }}
                          className="px-4 py-1.5 rounded-full bg-white text-black text-[10px] font-normal uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all"
                        >
                          View
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                      <FaUserFriends className="text-zinc-700 text-2xl" />
                    </div>
                    <p className="text-zinc-400 text-sm font-normal uppercase tracking-tight">No {usersModalTitle.toLowerCase()} yet</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence> */}
    </div>
  );
};

export default ClientProfile;
