import { useState, useEffect } from "react";
import {
  FaExclamationCircle,
  FaArrowAltCircleRight,
  FaFacebookMessenger,
  FaPlayCircle,
  FaUsers,
  FaBriefcase,
  FaClipboardList,
  FaChartLine,
  FaArrowRight,
  FaUniversity,
  FaHome,
  FaTachometerAlt,
  FaCheckCircle,
  FaClock,
  FaMoneyBillWave,
  FaSpinner,
  FaSyncAlt,
} from "react-icons/fa";
import { useAppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";
import EditorNavbar from "../components/EditorNavbar.jsx";
import ExploreEditor from "../components/ExploreEditor.jsx";
import ExploreGigs from "../components/ExploreGigs.jsx";
import EditorKYCForm from "../components/EditorKYCForm.jsx";
import ProfileCompletionBanner from "../components/ProfileCompletionBanner.jsx";
import VerifiedEditorBadge from "../components/VerifiedEditorBadge.jsx";
import EditorDashboard from "../components/EditorDashboard.jsx";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import reelIcon from "../assets/reelicon.png";

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

  // Refresh page
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      window.location.reload();
    }, 300); // Small delay for animation
  };

  // Main tabs with colors
  const mainTabs = [
    { id: "home", label: "Home", icon: FaHome, color: "#22C55E", gradient: "from-emerald-500/20 to-green-500/10" },
    { id: "dashboard", label: "Dashboard", icon: FaTachometerAlt, color: "#3B82F6", gradient: "from-blue-500/20 to-cyan-500/10" },
  ];

  // Explore tabs configuration  
  const exploreTabs = [
    { id: "editors", label: "Explore Editors", icon: FaUsers },
    { id: "gigs", label: "Explore Gigs", icon: FaBriefcase },
    { id: "reels", label: "Reels", icon: FaPlayCircle },
  ];

  // Dashboard box configs with colors
  const dashboardBoxes = [
    { 
      id: "orders", 
      path: "/editor-my-orders", 
      icon: FaClipboardList, 
      label: "My Orders", 
      stat: `${stats.totalOrders} total`,
      color: "#22C55E",
      bgColor: "rgba(34, 197, 94, 0.08)",
      borderColor: "rgba(34, 197, 94, 0.2)"
    },
    { 
      id: "gigs", 
      path: "/my-gigs", 
      icon: FaBriefcase, 
      label: "My Gigs", 
      stat: `${stats.activeGigs} active`,
      color: "#3B82F6",
      bgColor: "rgba(59, 130, 246, 0.08)",
      borderColor: "rgba(59, 130, 246, 0.2)"
    },
    { 
      id: "messages", 
      path: "/chats", 
      icon: FaFacebookMessenger, 
      label: "Messages", 
      stat: "Chat with clients",
      color: "#A855F7",
      bgColor: "rgba(168, 85, 247, 0.08)",
      borderColor: "rgba(168, 85, 247, 0.2)"
    },
    { 
      id: "analytics", 
      path: "/editor-analytics", 
      icon: FaChartLine, 
      label: "Analytics", 
      stat: "View insights",
      color: "#F59E0B",
      bgColor: "rgba(245, 158, 11, 0.08)",
      borderColor: "rgba(245, 158, 11, 0.2)"
    },
  ];

  const activeTabConfig = mainTabs.find(t => t.id === mainTab);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#050509] text-white">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <EditorNavbar onMenuClick={() => setSidebarOpen(true)} />

      {/* Professional Refresh Button */}
      <motion.button
        onClick={handleRefresh}
        disabled={isRefreshing}
        whileHover={{ scale: 1.02, backgroundColor: "rgba(59, 131, 246, 0)" }}
        whileTap={{ scale: 0.98 }}
        className="fixed top-17 animate-spin bg-gradient-to-r from-green-500/20 to-green-500/10 md:top- right-2 md:right-8 z-50 px-2 py-2 rounded-full hover:border-green-500/40 flex items-center gap-2.5 text-white transition-all disabled:opacity-70 shadow-lg"
        title="Refresh page"
      >
        <motion.div
          animate={isRefreshing ? { rotate: 360 } : { rotate: 0 }}
          transition={isRefreshing ? { repeat: Infinity, duration: 0.8, ease: "linear" } : { duration: 0.3 }}
          className="text-green-400"
        >
          <FaSyncAlt className="text-sm" />
        </motion.div>
        {/* <span className="text-sm font-medium text-gray-300">Refresh</span> */}
      </motion.button>

      <main className="flex-1 px-4 md:px-8 py-6 lg:pt-20 md:pt-6 md:ml-64 md:mt-20">
        
        {/* ============ MAIN TABS (Home / Dashboard) ============ */}
        <div className="flex justify-center items-center gap-2 mb-6">
          {mainTabs.map((tab) => {
            const isActive = mainTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                onClick={() => setMainTab(tab.id)}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  relative px-5 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-2.5
                  ${isActive 
                    ? `bg-gradient-to-r ${tab.gradient} border-2/20` 
                    : "bg-[#0a0a0c] border border-[#1a1a1f] hover:border-[#2a2a2f]"
                  }
                `}
                style={{
                  borderColor: isActive ? tab.color : undefined,
                  boxShadow: isActive ? `0 0 20px ${tab.color}20` : undefined
                }}
              >
                <tab.icon 
                  style={{ color: isActive ? tab.color : '#6b7280' }}
                  className="text-base"
                />
                <span style={{ color: isActive ? '#fff' : '#9ca3af' }}>
                  {tab.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="mainTabDot"
                    className="w-2 h-2 rounded-full ml-1"
                    style={{ backgroundColor: tab.color }}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {/* ============ HOME TAB CONTENT ============ */}
          {mainTab === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Show Verified Badge when >= 80%, otherwise show Completion Banner */}
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

              {/* KYC Banner - Show based on status */}
              {!user?.kycStatus || user?.kycStatus === 'not_submitted' || user?.kycStatus === 'rejected' ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`border rounded-2xl p-5 md:p-6 mb-6 ${
                    user?.kycStatus === 'rejected' 
                      ? 'bg-gradient-to-r from-red-500/5 to-rose-500/5 border-red-500/20'
                      : 'bg-gradient-to-r from-amber-500/5 to-orange-500/5 border-amber-500/20'
                  }`}
                >
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                    <div className={`p-3 rounded-xl ${user?.kycStatus === 'rejected' ? 'bg-red-500/10' : 'bg-amber-500/10'}`}>
                      <FaUniversity className={`text-xl ${user?.kycStatus === 'rejected' ? 'text-red-400' : 'text-amber-400'}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-semibold text-base ${user?.kycStatus === 'rejected' ? 'text-red-400' : 'text-white'}`}>
                        {user?.kycStatus === 'rejected' ? 'KYC Verification Failed' : 'Link Bank Account'}
                      </h3>
                      <p className="text-gray-400 text-sm mt-0.5">
                        {user?.kycStatus === 'rejected' 
                          ? (user?.kycRejectionReason || 'Your documents could not be verified. Please update and resubmit.')
                          : 'Complete KYC verification to receive payouts from orders.'}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate('/kyc-details')}
                      className={`flex items-center gap-2 px-5 py-2.5 text-white text-sm font-semibold rounded-xl transition-all ${
                        user?.kycStatus === 'rejected'
                          ? 'bg-gradient-to-r from-red-500 to-rose-500 hover:shadow-lg hover:shadow-red-500/20'
                          : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:shadow-lg hover:shadow-amber-500/20'
                      }`}
                    >
                      {user?.kycStatus === 'rejected' ? 'Resubmit KYC' : 'Complete KYC'} <FaArrowRight className="text-xs" />
                    </button>
                  </div>
                </motion.div>
              ) : (user?.kycStatus === 'submitted' || user?.kycStatus === 'pending') && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-blue-500/5 to-cyan-500/5 border border-blue-500/20 rounded-2xl p-5 md:p-6 mb-6"
                >
                  {/* Header */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 rounded-xl bg-blue-500/10">
                      <FaClock className="text-blue-400 text-xl" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-blue-400 font-semibold text-base">
                          KYC Under Review
                        </h3>
                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs font-bold rounded-full">
                          IN PROGRESS
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm mt-0.5">
                        Your documents are being verified. This usually takes 24-48 hours.
                      </p>
                    </div>
                  </div>

                  {/* Progress Stages */}
                  <div className="flex items-center justify-between gap-2 bg-black/20 rounded-xl p-4">
                    {/* Stage 1: Submitted */}
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                        <FaCheckCircle className="text-white text-xs" />
                      </div>
                      <span className="text-[10px] text-emerald-400 font-medium">Submitted</span>
                    </div>
                    
                    {/* Progress Line */}
                    <div className="flex-1 h-1 bg-blue-500 rounded-full mx-1 relative overflow-hidden">
                      <motion.div 
                        className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                      />
                    </div>
                    
                    {/* Stage 2: Reviewing */}
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center relative">
                        <FaSpinner className="text-white text-xs animate-spin" />
                      </div>
                      <span className="text-[10px] text-blue-400 font-medium">Reviewing</span>
                    </div>
                    
                    {/* Progress Line */}
                    <div className="flex-1 h-1 bg-zinc-700 rounded-full mx-1" />
                    
                    {/* Stage 3: Verified */}
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center">
                        <FaCheckCircle className="text-zinc-500 text-xs" />
                      </div>
                      <span className="text-[10px] text-zinc-500 font-medium">Verified</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ✅ KYC Verified Banner - Show when KYC done but profile < 80% */}
              {user?.kycStatus === "verified" && (user?.profileCompletionPercent < 80 && completionPercent < 80) && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative overflow-hidden bg-gradient-to-r from-emerald-500/10 to-green-500/5 border border-emerald-500/20 rounded-2xl p-5 md:p-6 mb-6"
                >
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                    <div className="p-3 rounded-xl bg-emerald-500/15">
                      <FaCheckCircle className="text-emerald-400 text-2xl" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="text-emerald-400 font-semibold text-base">
                          KYC Verified Successfully!
                        </h3>
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-full">
                          ✓ VERIFIED
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm">
                        Great! Your identity has been verified. Complete your profile to <span className="text-emerald-400 font-medium">{80 - Math.max(user?.profileCompletionPercent || 0, completionPercent)}%</span> more to appear in the <span className="text-white font-medium">Explore Editors</span> page.
                      </p>
                    </div>
                    
                    <div className="hidden md:flex flex-col items-center gap-1 px-4 py-3 bg-black/20 rounded-xl border border-emerald-500/10">
                      <span className="text-2xl font-bold text-emerald-400">{Math.max(user?.profileCompletionPercent || 0, completionPercent)}%</span>
                      <span className="text-[10px] text-gray-400 uppercase tracking-wide">Profile</span>
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="mt-4 h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(user?.profileCompletionPercent || 0, completionPercent)}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Complete 80% profile + KYC = Visible to clients in Explore page
                  </p>
                </motion.div>
              )}

              {/* 🎉 Profile Listed in Explore - Show when: verified + KYC done + 80%+ profile */}
              {user?.isVerified && user?.kycStatus === "verified" && (user?.profileCompletionPercent >= 80 || completionPercent >= 80) && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="relative overflow-hidden bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-emerald-500/10 border border-purple-500/20 rounded-2xl p-5 md:p-6 mb-6"
                >
                  {/* Sparkle animations */}
                  <motion.div 
                    className="absolute top-3 right-10 text-yellow-400 text-lg"
                    animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  >
                    ✨
                  </motion.div>
                  <motion.div 
                    className="absolute bottom-4 right-24 text-purple-400 text-sm"
                    animate={{ y: [-2, 2, -2], opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                  >
                    🌟
                  </motion.div>
                  
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                    <div className="relative">
                      <motion.div 
                        className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20"
                        animate={{ boxShadow: ["0 0 20px rgba(139, 92, 246, 0.3)", "0 0 30px rgba(139, 92, 246, 0.5)", "0 0 20px rgba(139, 92, 246, 0.3)"] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                      >
                        <span className="text-3xl">🎉</span>
                      </motion.div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent">
                          Congratulations! You're Live!
                        </h3>
                        <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-full flex items-center gap-1">
                          <FaCheckCircle className="text-[10px]" /> LISTED
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm">
                        Your profile is now visible in the <span className="text-purple-400 font-medium">Explore Editors</span> page. Clients can discover and hire you!
                      </p>
                    </div>
                    
                    <div className="flex gap-3">
                      <motion.div 
                        className="hidden md:flex flex-col items-center gap-1 px-4 py-3 bg-black/20 rounded-xl border border-white/5"
                        whileHover={{ scale: 1.05 }}
                      >
                        <FaMoneyBillWave className="text-emerald-400 text-xl" />
                        <span className="text-[10px] text-gray-400 uppercase tracking-wide">Earnings</span>
                        <span className="text-emerald-400 text-xs font-bold">Enabled</span>
                      </motion.div>
                      <motion.div 
                        className="hidden md:flex flex-col items-center gap-1 px-4 py-3 bg-black/20 rounded-xl border border-white/5"
                        whileHover={{ scale: 1.05 }}
                      >
                        <FaUsers className="text-blue-400 text-xl" />
                        <span className="text-[10px] text-gray-400 uppercase tracking-wide">Status</span>
                        <span className="text-blue-400 text-xs font-bold">Explored</span>
                      </motion.div>
                    </div>
                  </div>
                  
                  {/* Bottom gradient accent */}
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500 via-blue-500 to-emerald-500" />
                </motion.div>
              )}

              {/* Explore Tabs */}
              <div className="flex items-center justify-center mb-6">
                <div className="inline-flex p-1.5 bg-[#0a0a0c] border border-[#1a1a1f] rounded-2xl">
                  {exploreTabs.map((tab) => {
                    const isActive = exploreTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => tab.id === "reels" ? navigate("/reels") : setExploreTab(tab.id)}
                        className={`
                          relative px-5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2
                          ${isActive
                            ? "text-white bg-gradient-to-r from-blue-900/40 to-blue-600"
                            : "text-[#6b7280] hover:text-white hover:bg-[#18181b]"
                          }
                        `}
                      >
                        <tab.icon size={14} />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Explore Content */}
              <div className="bg-[#0a0a0c] border border-[#1a1a1f] rounded-2xl p-4 md:p-6">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-semibold text-white mb-1">
                    {exploreTab === "editors" ? "Explore Other Editors" : "Browse Services"}
                  </h2>
                  <p className="text-gray-500 text-sm">
                    {exploreTab === "editors" 
                      ? "See what other editors are offering"
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
                    >
                      <ExploreEditor />
                    </motion.div>
                  )}
                  {exploreTab === "gigs" && (
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
            </motion.div>
          )}

          {/* ============ DASHBOARD TAB CONTENT ============ */}
          {mainTab === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <EditorDashboard user={user} stats={stats} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Reels Button */}
        <motion.button
          onClick={() => navigate("/reels")}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          className="fixed bottom-6 right-6 z-[200] w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/30"
        >
          <img src={reelIcon} alt="reels" className="w-6 h-6 object-contain" />
        </motion.button>
      </main>

      {/* KYC Form Modal */}
      {showKYC && (
        <EditorKYCForm
          onSuccess={() => {
            setShowKYC(false);
          }}
          onClose={() => setShowKYC(false)}
        />
      )}
    </div>
  );
};

export default EditorHome;
