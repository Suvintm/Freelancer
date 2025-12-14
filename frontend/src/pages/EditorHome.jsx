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
  const { user, backendURL } = useAppContext();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mainTab, setMainTab] = useState("home");
  const [exploreTab, setExploreTab] = useState("editors");
  const [stats, setStats] = useState({ totalOrders: 0, activeGigs: 0 });
  const [showKYC, setShowKYC] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [completionPercent, setCompletionPercent] = useState(0);
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
                />
              ) : (
                <ProfileCompletionBanner minPercent={80} />
              )}

              {/* KYC Banner - Show when KYC not verified */}
              {user?.kycStatus !== "verified" && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-amber-500/5 to-orange-500/5 border border-amber-500/20 rounded-2xl p-5 md:p-6 mb-6"
                >
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                    <div className="p-3 rounded-xl bg-amber-500/10">
                      <FaUniversity className="text-amber-400 text-xl" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-base">
                        Link Bank Account
                      </h3>
                      <p className="text-gray-400 text-sm mt-0.5">
                        Complete KYC verification to receive payouts from orders.
                      </p>
                    </div>
                    <button
                      onClick={() => navigate('/kyc-details')}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-amber-500/20 transition-all"
                    >
                      Complete KYC <FaArrowRight className="text-xs" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Earnings Enabled Badge - Show when KYC is verified */}
              {user?.kycStatus === "verified" && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-emerald-500/5 to-green-500/5 border border-emerald-500/20 rounded-2xl p-4 md:p-5 mb-6"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-emerald-500/10">
                      <FaCheckCircle className="text-emerald-400 text-xl" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-emerald-400 font-semibold text-base">
                          Earnings Enabled
                        </h3>
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-full">
                          VERIFIED
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm mt-0.5">
                        You can now receive payments directly to your bank account.
                      </p>
                    </div>
                    <FaMoneyBillWave className="text-emerald-400/50 text-3xl hidden md:block" />
                  </div>
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
