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
import { HiOutlineSparkles, HiOutlineMapPin, HiOutlineArrowRight, HiOutlineChartBar } from "react-icons/hi2";
import { useAppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";
import EditorNavbar from "../components/EditorNavbar.jsx";
import ExploreEditor from "../components/ExploreEditor.jsx";
import ExploreGigs from "../components/ExploreGigs.jsx";
import Loader from "../components/Loader.jsx";
import ExploreJobs from "../components/ExploreJobs.jsx";
import EditorKYCForm from "../components/EditorKYCForm.jsx";
import ProfileCompletionBanner from "../components/ProfileCompletionBanner.jsx";
import VerifiedEditorBadge from "../components/VerifiedEditorBadge.jsx";
import EditorDashboard from "../components/EditorDashboard.jsx";
import HomeExploreContainer from "../components/HomeExploreContainer.jsx";
import UnifiedBannerSlider from "../components/UnifiedBannerSlider.jsx";
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
  const [searchQuery, setSearchQuery] = useState("");
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

  // Loading State with Minimum Delay
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);



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

  if (isLoading) {
    return <Loader />;
  }

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

      <main className="flex-1 px-1 md:px-8 py-2 lg:pt-20 md:pt-4 md:ml-64 md:mt-16">
        
        {/* Premium Banner at the Top - Responsive with Side Margins */}
        <div className="px-3 md:px-8 mb-8 max-w-7xl mx-auto">
          <UnifiedBannerSlider />
        </div>

        {/* Simple & Professional Tabbed Navigation - Enhanced for Light Theme */}
        <div className="flex justify-center mb-4 md:mb-6">
          <div className="flex items-center gap-1 bg-white/5 light:bg-zinc-100 border border-white/10 light:border-zinc-200 p-1 rounded-2xl w-fit backdrop-blur-xl shadow-sm">
            {[
              { id: 'home', label: 'Home', icon: HiOutlineSparkles },
              { id: 'dashboard', label: 'Dashboard', icon: HiOutlineChartBar }
            ].map((tab) => {
              const isActive = mainTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setMainTab(tab.id)}
                  className={`relative flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-bold transition-all duration-300 z-10 ${
                    isActive ? "text-white light:text-zinc-900" : "text-zinc-500 hover:text-zinc-300 light:text-zinc-400 light:hover:text-zinc-600"
                  }`}
                >
                  <tab.icon className={`w-3.5 h-3.5 ${isActive ? 'text-white light:text-zinc-900' : 'text-zinc-500'}`} />
                  {tab.label}
                  {isActive && (
                    <motion.div
                      layoutId="editorActivePill"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      className="absolute inset-0 bg-white/10 light:bg-white rounded-xl -z-10 shadow-sm"
                    />
                  )}
                </button>
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
              {/* New Unified Explore-First Experience */}
              <div className="mb-6">
                <HomeExploreContainer 
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  activeTab={exploreTab}
                  setActiveTab={setExploreTab}
                />
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
