import { useState, useEffect } from "react";
import {
  FaExclamationCircle,
  FaArrowRight,
  FaFacebookMessenger,
  FaPlayCircle,
  FaUsers,
  FaBriefcase,
  FaClipboardList,
  FaChartLine,
  FaUniversity,
  FaHome,
  FaTachometerAlt,
  FaCheckCircle,
  FaClock,
  FaMoneyBillWave,
  FaSpinner,
  FaSyncAlt,
  FaDatabase,
  FaCloudUploadAlt,
  FaChevronDown,
  FaChevronUp,
  FaVideo,
  FaImages,
  FaComments,
  FaRocket,
  FaGem,
  FaStar,
} from "react-icons/fa";
import { HiOutlineSparkles, HiOutlineMapPin, HiOutlineArrowRight } from "react-icons/hi2";
import { useAppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";
import EditorNavbar from "../components/EditorNavbar.jsx";
import ExploreEditor from "../components/ExploreEditor.jsx";
import ExploreGigs from "../components/ExploreGigs.jsx";
import ExploreJobs from "../components/ExploreJobs.jsx";
import EditorKYCForm from "../components/EditorKYCForm.jsx";
import ProfileCompletionBanner from "../components/ProfileCompletionBanner.jsx";
import VerifiedEditorBadge from "../components/VerifiedEditorBadge.jsx";
import EditorDashboard from "../components/EditorDashboard.jsx";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import reelIcon from "../assets/reelicon.png";

import LegalBanner from "../components/LegalBanner.jsx";

const EditorHome = () => {
  const { user, backendURL, refreshUser } = useAppContext();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mainTab, setMainTab] = useState("home");
  const [exploreTab, setExploreTab] = useState("editors");
  const [stats, setStats] = useState({ totalOrders: 0, activeGigs: 0 });
  const [showKYC, setShowKYC] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [completionPercent, setCompletionPercent] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [storageData, setStorageData] = useState(null);
  const [storageBreakdown, setStorageBreakdown] = useState(null);
  const [storageExpanded, setStorageExpanded] = useState(false);
  const navigate = useNavigate();

  // Fetch basic stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = user?.token;
        if (!token) return;

        const [ordersRes, gigsRes] = await Promise.all([
          axios.get(`${backendURL}/api/editor/analytics/orders?period=30`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${backendURL}/api/editor/analytics/gigs`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setStats({
          totalOrders: ordersRes.data.analytics?.totalOrders || 0,
          activeGigs: gigsRes.data.analytics?.activeGigs || 0,
        });
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      }
    };

    const fetchProfileData = async () => {
      try {
        const token = user?.token;
        if (!token) return;

        const [profileRes, completionRes] = await Promise.all([
          axios.get(`${backendURL}/api/profile/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${backendURL}/api/profile/completion-status`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setProfileData(profileRes.data);
        setCompletionPercent(completionRes.data?.percent || 0);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      }
    };

    fetchStats();
    fetchProfileData();
  }, [backendURL, user?.token]);

  // Fetch storage status
  useEffect(() => {
    const fetchStorage = async () => {
      try {
        const token = user?.token;
        if (!token || user?.role !== "editor") return;

        const res = await axios.get(`${backendURL}/api/storage/status`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStorageData(res.data?.storage || null);
        setStorageBreakdown(res.data?.breakdown || null);
      } catch (err) {
        console.error("Failed to fetch storage:", err);
      }
    };

    fetchStorage();
  }, [backendURL, user?.token, user?.role]);

  // Refresh page
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      window.location.reload();
    }, 300);
  };

  // Main tabs configuration
  const mainTabs = [
    { id: "home", label: "Home", icon: FaHome },
    { id: "dashboard", label: "Dashboard", icon: FaTachometerAlt },
  ];

  // Explore tabs configuration  
  const exploreTabs = [
    { id: "editors", label: "Explore Editors", icon: FaUsers },
    { id: "gigs", label: "Explore Gigs", icon: FaBriefcase },
    { id: "jobs", label: "Find Jobs", icon: FaClipboardList },
    { id: "reels", label: "Reels", icon: FaPlayCircle },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#050509] light:bg-slate-50 text-white light:text-slate-900 transition-colors duration-200" style={{ fontFamily: "'Inter', sans-serif" }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <EditorNavbar onMenuClick={() => setSidebarOpen(true)} />

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

      <main className="flex-1 px-4 md:px-8 py-6 lg:pt-24 md:pt-6 md:ml-64 md:mt-16">
        
        {/* Legal Banner */}
        <LegalBanner />

        {/* ============ MAIN TABS ============ */}
        <div className="flex justify-center mb-4">
          <div className="inline-flex p-1 bg-[#0d0d12] light:bg-white rounded-2xl shadow-lg border border-white/[0.06] light:border-slate-200">
            {mainTabs.map((tab) => {
              const isActive = mainTab === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setMainTab(tab.id)}
                  whileHover={{ scale: isActive ? 1 : 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative px-6 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2
                    ${isActive 
                      ? "bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg shadow-violet-500/25" 
                      : "text-zinc-400 light:text-slate-500 hover:text-white light:hover:text-slate-900 hover:bg-white/5"
                    }
                  `}
                >
                  <tab.icon className="text-sm" />
                  {tab.label}
                </motion.button>
              );
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* ============ HOME TAB CONTENT ============ */}
          {mainTab === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {/* Profile & Storage Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
                {/* Left: Profile Status */}
                <div className="min-w-0">
                  {completionPercent >= 80 ? (
                    <VerifiedEditorBadge 
                      user={user} 
                      profile={profileData} 
                      kycStatus={user?.kycStatus}
                      completionPercent={completionPercent}
                    />
                  ) : (
                    <ProfileCompletionBanner minPercent={80} />
                  )}
                </div>

                {/* Right: Storage Card */}
                {storageData && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.01 }}
                    className={`bg-[#0d0d12] light:bg-white rounded-2xl p-4 border shadow-lg transition-all h-full ${
                      storageData.isFull 
                        ? 'border-red-500/30 light:border-red-200' 
                        : storageData.isLowStorage 
                          ? 'border-amber-500/30 light:border-amber-200'
                          : 'border-white/[0.06] light:border-slate-200'
                    }`}
                  >
                    {/* Storage Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        storageData.isFull ? 'bg-gradient-to-br from-red-500/20 to-rose-500/10' : storageData.isLowStorage ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/10' : 'bg-gradient-to-br from-violet-500/20 to-purple-500/10'
                      }`}>
                        <FaDatabase className={`text-lg ${
                          storageData.isFull ? 'text-red-400' : storageData.isLowStorage ? 'text-amber-400' : 'text-violet-400'
                        }`} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-white light:text-slate-900 text-sm">Cloud Storage</h3>
                          <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase ${
                            storageData.plan === 'free' ? 'bg-zinc-800 light:bg-slate-100 text-zinc-400 light:text-slate-600' :
                            storageData.plan === 'pro' ? 'bg-violet-500/20 light:bg-violet-100 text-violet-400 light:text-violet-600' :
                            'bg-purple-500/20 light:bg-purple-100 text-purple-400 light:text-purple-600'
                          }`}>
                            {storageData.plan}
                          </span>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="h-2 bg-white/[0.06] light:bg-slate-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(storageData.usedPercent, 100)}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className={`h-full rounded-full ${
                              storageData.isFull ? 'bg-gradient-to-r from-red-500 to-rose-400' :
                              storageData.isLowStorage ? 'bg-gradient-to-r from-amber-500 to-orange-400' :
                              'bg-gradient-to-r from-violet-500 to-purple-500'
                            }`}
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setStorageExpanded(!storageExpanded)}
                          className="p-2 rounded-lg bg-white/5 light:bg-slate-50 hover:bg-white/10 light:hover:bg-slate-100 text-gray-400 light:text-slate-500 transition-all"
                        >
                          {storageExpanded ? <FaChevronUp className="text-xs" /> : <FaChevronDown className="text-xs" />}
                        </button>
                        <button
                          onClick={() => navigate('/storage-plans')}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-500 text-white hover:bg-indigo-600 transition-all flex items-center gap-1"
                        >
                          <FaCloudUploadAlt className="text-[10px]" /> Upgrade
                        </button>
                      </div>
                    </div>
                    
                    {/* Storage Stats */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 light:text-slate-500">
                        {storageData.usedFormatted} / {storageData.limitFormatted}
                      </span>
                      <span className={`font-medium ${
                        storageData.isFull ? 'text-red-500' : 
                        storageData.isLowStorage ? 'text-amber-500' : 'text-emerald-500'
                      }`}>
                        {storageData.remainingFormatted} free
                      </span>
                    </div>
                    
                    {/* Warning */}
                    {storageData.isFull && (
                      <div className="mt-3 p-2 bg-red-500/10 light:bg-red-50 rounded-lg flex items-center gap-2 text-red-400 light:text-red-600 text-xs">
                        <FaExclamationCircle /> Storage full! Upgrade or delete files.
                      </div>
                    )}
                    
                    {/* Breakdown Dropdown */}
                    <AnimatePresence>
                      {storageExpanded && storageBreakdown && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-4 pt-4 border-t border-white/10 light:border-slate-100">
                            <p className="text-gray-500 light:text-slate-500 text-xs font-medium mb-3">Storage Breakdown</p>
                            <div className="grid grid-cols-3 gap-3">
                              <div className="bg-white/5 light:bg-slate-50 rounded-xl p-3 text-center">
                                <FaVideo className="text-purple-500 mx-auto mb-1" />
                                <p className="font-bold text-white light:text-slate-900">{storageBreakdown.portfolios || 0}</p>
                                <p className="text-gray-500 light:text-slate-500 text-[10px]">Portfolios</p>
                              </div>
                              <div className="bg-white/5 light:bg-slate-50 rounded-xl p-3 text-center">
                                <FaImages className="text-blue-500 mx-auto mb-1" />
                                <p className="font-bold text-white light:text-slate-900">{storageBreakdown.reels || 0}</p>
                                <p className="text-gray-500 light:text-slate-500 text-[10px]">Reels</p>
                              </div>
                              <div className="bg-white/5 light:bg-slate-50 rounded-xl p-3 text-center">
                                <FaComments className="text-emerald-500 mx-auto mb-1" />
                                <p className="font-bold text-white light:text-slate-900">{storageBreakdown.chatFiles || 0}</p>
                                <p className="text-gray-500 light:text-slate-500 text-[10px]">Chat Files</p>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </div>

              {/* ===== EDITORS NEAR YOU - COMPACT BANNER ===== */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                onClick={() => navigate('/editors-near-you')}
                className="relative mb-4 cursor-pointer group overflow-hidden rounded-xl"
              >
                {/* Gradient background */}
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-500 to-indigo-600" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Content */}
                <div className="relative px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Icon */}
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/20">
                      <HiOutlineMapPin className="w-5 h-5 text-white" />
                    </div>
                    
                    {/* Text */}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-white">
                          Editors Near You
                        </h3>
                        <span className="px-1.5 py-0.5 bg-amber-400 text-amber-900 text-[8px] font-bold rounded-full uppercase">
                          NEW
                        </span>
                      </div>
                      <p className="text-white/70 text-xs">
                        Connect with other editors in your area • Map view
                      </p>
                    </div>
                  </div>
                  
                  {/* Arrow */}
                  <div className="flex items-center gap-2">
                    <span className="hidden sm:block text-white/70 text-xs font-medium">Explore</span>
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-all">
                      <HiOutlineArrowRight className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* KYC Banners */}
              {(!user?.kycStatus || user?.kycStatus === 'not_submitted' || user?.kycStatus === 'rejected') && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-[#0a0a0c] light:bg-white rounded-2xl p-5 md:p-6 mb-6 border shadow-sm ${
                    user?.kycStatus === 'rejected' 
                      ? 'border-red-500/30 light:border-red-200'
                      : 'border-amber-500/30 light:border-amber-200'
                  }`}
                >
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                    <div className={`p-3 rounded-xl ${user?.kycStatus === 'rejected' ? 'bg-red-500/10 light:bg-red-50' : 'bg-amber-500/10 light:bg-amber-50'}`}>
                      <FaUniversity className={`text-xl ${user?.kycStatus === 'rejected' ? 'text-red-500' : 'text-amber-500'}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-semibold text-base ${user?.kycStatus === 'rejected' ? 'text-red-400 light:text-red-600' : 'text-white light:text-slate-900'}`}>
                        {user?.kycStatus === 'rejected' ? 'KYC Verification Failed' : 'Complete KYC Verification'}
                      </h3>
                      <p className="text-gray-500 light:text-slate-500 text-sm mt-1">
                        {user?.kycStatus === 'rejected' 
                          ? (user?.kycRejectionReason || 'Your documents could not be verified. Please update and resubmit.')
                          : 'Link your bank account to receive payouts from completed orders.'}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate('/kyc-details')}
                      className={`flex items-center gap-2 px-5 py-2.5 text-white text-sm font-semibold rounded-xl transition-all ${
                        user?.kycStatus === 'rejected'
                          ? 'bg-red-500 hover:bg-red-600'
                          : 'bg-amber-500 hover:bg-amber-600'
                      }`}
                    >
                      {user?.kycStatus === 'rejected' ? 'Resubmit KYC' : 'Complete KYC'} <FaArrowRight className="text-xs" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* KYC Under Review */}
              {(user?.kycStatus === 'submitted' || user?.kycStatus === 'pending') && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#0a0a0c] light:bg-white border border-blue-500/30 light:border-blue-200 rounded-2xl p-5 md:p-6 mb-6 shadow-sm"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 rounded-xl bg-blue-500/10 light:bg-blue-50">
                      <FaClock className="text-blue-500 text-xl" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-blue-400 light:text-blue-600 font-semibold">KYC Under Review</h3>
                        <span className="px-2 py-0.5 bg-blue-500/20 light:bg-blue-100 text-blue-400 light:text-blue-600 text-xs font-bold rounded-full">
                          IN PROGRESS
                        </span>
                      </div>
                      <p className="text-gray-500 light:text-slate-500 text-sm mt-1">
                        Your documents are being verified. This usually takes 24-48 hours.
                      </p>
                    </div>
                  </div>

                  {/* Progress Steps */}
                  <div className="flex items-center justify-between gap-2 bg-white/5 light:bg-slate-50 rounded-xl p-4">
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                        <FaCheckCircle className="text-white text-xs" />
                      </div>
                      <span className="text-[10px] text-emerald-400 light:text-emerald-600 font-medium">Submitted</span>
                    </div>
                    <div className="flex-1 h-1 bg-blue-500 rounded-full mx-1 relative overflow-hidden">
                      <motion.div 
                        className="absolute inset-0 bg-gradient-to-r from-blue-400 to-emerald-400"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                      />
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                        <FaSpinner className="text-white text-xs animate-spin" />
                      </div>
                      <span className="text-[10px] text-blue-400 light:text-blue-600 font-medium">Reviewing</span>
                    </div>
                    <div className="flex-1 h-1 bg-white/10 light:bg-slate-200 rounded-full mx-1" />
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-8 h-8 rounded-full bg-white/10 light:bg-slate-200 flex items-center justify-center">
                        <FaCheckCircle className="text-gray-500 light:text-slate-400 text-xs" />
                      </div>
                      <span className="text-[10px] text-gray-500 light:text-slate-400 font-medium">Verified</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Profile Listed Successfully */}
              {user?.isVerified && user?.kycStatus === "verified" && (user?.profileCompletionPercent >= 80 || completionPercent >= 80) && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="relative overflow-hidden bg-gradient-to-r from-emerald-500/10 light:from-emerald-50 via-blue-500/10 light:via-blue-50 to-purple-500/10 light:to-purple-50 border border-emerald-500/30 light:border-emerald-200 rounded-2xl p-5 md:p-6 mb-6"
                >
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                    <motion.div 
                      className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/20 light:from-emerald-100 to-blue-500/20 light:to-blue-100"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    >
                      <span className="text-3xl">🎉</span>
                    </motion.div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-emerald-400 light:text-emerald-600">
                          Congratulations! You're Live!
                        </h3>
                        <span className="px-2.5 py-1 bg-emerald-500/20 light:bg-emerald-100 text-emerald-400 light:text-emerald-600 text-xs font-bold rounded-full flex items-center gap-1">
                          <FaCheckCircle className="text-[10px]" /> LISTED
                        </span>
                      </div>
                      <p className="text-gray-400 light:text-slate-600 text-sm">
                        Your profile is now visible in the <span className="text-emerald-400 light:text-emerald-600 font-medium">Explore Editors</span> page. Clients can discover and hire you!
                      </p>
                    </div>
                    
                    <div className="hidden md:flex gap-3">
                      <div className="flex flex-col items-center gap-1 px-4 py-3 bg-white/5 light:bg-white rounded-xl border border-white/10 light:border-slate-200">
                        <FaMoneyBillWave className="text-emerald-500 text-xl" />
                        <span className="text-[10px] text-gray-500 light:text-slate-500">Earnings</span>
                        <span className="text-emerald-400 light:text-emerald-600 text-xs font-bold">Enabled</span>
                      </div>
                      <div className="flex flex-col items-center gap-1 px-4 py-3 bg-white/5 light:bg-white rounded-xl border border-white/10 light:border-slate-200">
                        <FaUsers className="text-blue-500 text-xl" />
                        <span className="text-[10px] text-gray-500 light:text-slate-500">Status</span>
                        <span className="text-blue-400 light:text-blue-600 text-xs font-bold">Discoverable</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500" />
                </motion.div>
              )}

              {/* Explore Tabs */}
              <div className="flex items-center justify-center mb-4">
                <div className="inline-flex p-0.5 bg-[#111118] light:bg-white border border-white/[0.06] light:border-slate-200 rounded-xl shadow-sm">
                  {exploreTabs.map((tab) => {
                    const isActive = exploreTab === tab.id;
                    return (
                      <motion.button
                        key={tab.id}
                        onClick={() => tab.id === "reels" ? navigate("/reels") : setExploreTab(tab.id)}
                        whileHover={{ scale: isActive ? 1 : 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className={`relative px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                          isActive
                            ? "text-white bg-gradient-to-r from-violet-500 to-purple-500 shadow-lg shadow-violet-500/25"
                            : "text-zinc-400 light:text-slate-500 hover:text-white light:hover:text-slate-900 hover:bg-white/5"
                        }`}
                      >
                        <tab.icon size={13} />
                        {tab.label}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Explore Content */}
              <div className="bg-[#0d0d12] light:bg-white border border-white/[0.06] light:border-slate-200 rounded-2xl p-4 md:p-5 shadow-lg">
                <div className="text-center mb-4">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-violet-500/10 to-purple-500/10 light:from-violet-50 light:to-purple-50 text-violet-400 light:text-violet-600 text-[10px] font-semibold rounded-full mb-2 border border-violet-500/20">
                    <HiOutlineSparkles className="text-xs" /> {exploreTab === "editors" ? "Discover Talent" : "Browse Services"}
                  </div>
                  <h2 className="text-lg font-bold text-white light:text-slate-900 mb-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {exploreTab === "editors" ? "Explore Other Editors" : "Browse Available Gigs"}
                  </h2>
                  <p className="text-zinc-500 light:text-slate-500 text-xs">
                    {exploreTab === "editors" 
                      ? "See what other editors are offering and get inspired"
                      : "Find services that complement your skills"
                    }
                  </p>
                </div>

                <AnimatePresence mode="wait">
                  {exploreTab === "editors" && (
                    <motion.div
                      key="editors"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="relative"
                    >
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
                  {exploreTab === "gigs" && (
                    <motion.div
                      key="gigs"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="relative"
                    >
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
                  {exploreTab === "jobs" && (
                    <motion.div
                      key="jobs"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="relative"
                    >
                      {/* Content with max-height and overflow hidden */}
                      <div className="max-h-[400px] overflow-hidden relative">
                        <ExploreJobs />
                      </div>
                      {/* Gradient Fade Overlay */}
                      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#111118] via-[#111118]/90 to-transparent pointer-events-none light:from-white light:via-white/90" />
                      {/* See More Button - overlaid on fade */}
                      <div className="absolute bottom-4 left-0 right-0 flex justify-center z-10">
                        <button 
                          onClick={() => navigate('/explore-jobs')}
                          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white text-sm font-semibold rounded-full hover:opacity-90 transition-all shadow-lg shadow-violet-500/25"
                        >
                          See More Jobs <FaArrowRight className="text-xs" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* ============ DASHBOARD TAB CONTENT ============ */}
          {mainTab === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <EditorDashboard user={user} stats={stats} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Reels Button */}
        {/* <motion.button
          onClick={() => navigate("/reels")}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          className="fixed bottom-6 right-6 z-[200] w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 border-2 border-[#0a0a0c] light:border-white"
        >
          <img src={reelIcon} alt="reels" className="w-5 h-5 object-contain" />
        </motion.button> */}
      </main>

      {/* KYC Form Modal */}
      {showKYC && (
        <EditorKYCForm
          onSuccess={() => setShowKYC(false)}
          onClose={() => setShowKYC(false)}
        />
      )}
    </div>
  );
};

export default EditorHome;
