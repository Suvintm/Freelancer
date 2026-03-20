import { useState, useEffect, useRef } from "react";
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
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import reelIcon from "../assets/reelicon.png";
import LegalBanner from "../components/LegalBanner.jsx";
import { useHomeStore } from "../store/homeStore";
import useRefreshManager from "../hooks/useRefreshManager.js";
import usePullToRefresh from "../hooks/usePullToRefresh.jsx";

const EditorHome = () => {
  const { user, backendURL, refreshUser } = useAppContext();
  const mainContainerRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const hasLoadedOnce = useRef(false);
  const [stats, setStats] = useState({ totalOrders: 0, activeGigs: 0 });
  const [showKYC, setShowKYC] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [completionPercent, setCompletionPercent] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [storageData, setStorageData] = useState(null);
  const [storageBreakdown, setStorageBreakdown] = useState(null);
  const [storageExpanded, setStorageExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  // ── REFRESH SYSTEM ──────────────────────────────────────────────────
  const { triggerRefresh } = useRefreshManager();
  const { pullDistance, handleTouchStart, handleTouchEnd, PullIndicator } = usePullToRefresh(
    () => triggerRefresh(true, ['editorStats', 'editorGigStats', 'profile', 'profileCompletion', 'storageStatus']), 
    mainContainerRef
  );

  // Persistent tab state via Zustand — survives navigation
  const mainTab = useHomeStore((s) => s.editorMainTab);
  const setMainTab = useHomeStore((s) => s.setEditorMainTab);
  const exploreTab = useHomeStore((s) => s.exploreTab);
  const setExploreTab = useHomeStore((s) => s.setExploreTab);


  // ── DATA FETCHING ──────────────────────────────────────────────────
  const { data: editorStats, isLoading: statsLoading } = useQuery({
    queryKey: ['editorStats', { period: 30 }],
    queryFn: async () => {
      const { data } = await axios.get(`${backendURL}/api/editor/analytics/orders?period=30`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      return data.analytics || {};
    },
    enabled: !!user?.token,
  });

  const { data: gigStats, isLoading: gigStatsLoading } = useQuery({
    queryKey: ['editorGigStats'],
    queryFn: async () => {
      const { data } = await axios.get(`${backendURL}/api/editor/analytics/gigs`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      return data.analytics || {};
    },
    enabled: !!user?.token,
  });

  const { data: profileResponse, isLoading: profileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data } = await axios.get(`${backendURL}/api/profile/`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      return data;
    },
    enabled: !!user?.token,
  });

  const { data: completionResponse, isLoading: completionLoading } = useQuery({
    queryKey: ['profileCompletion'],
    queryFn: async () => {
      const { data } = await axios.get(`${backendURL}/api/profile/completion-status`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      return data;
    },
    enabled: !!user?.token,
  });

  const { data: storageResponse, isLoading: storageLoading } = useQuery({
    queryKey: ['storageStatus'],
    queryFn: async () => {
      const { data } = await axios.get(`${backendURL}/api/storage/status`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      return data;
    },
    enabled: !!user?.token && user?.role === "editor",
  });

  const { data: walletData, isLoading: walletLoading } = useQuery({
    queryKey: ['walletBalance'],
    queryFn: async () => {
      const { data } = await axios.get(`${backendURL}/api/wallet/balance`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      return data || { walletBalance: 0, pendingBalance: 0 };
    },
    enabled: !!user?.token && user?.role === "editor",
  });

  // Keep derived states in sync
  useEffect(() => {
    if (editorStats && gigStats) {
      setStats({
        totalOrders: editorStats.totalOrders || 0,
        activeGigs: gigStats.activeGigs || 0,
      });
    }
  }, [editorStats, gigStats]);

  useEffect(() => {
    if (profileResponse) setProfileData(profileResponse);
    if (completionResponse) setCompletionPercent(completionResponse.percent || 0);
  }, [profileResponse, completionResponse]);

  useEffect(() => {
    if (storageResponse) {
      setStorageData(storageResponse.storage || null);
      setStorageBreakdown(storageResponse.breakdown || null);
    }
  }, [storageResponse]);

  // Unified loading state for the skeleton/loader
  const isLoadingDerived = statsLoading || gigStatsLoading || profileLoading || completionLoading || walletLoading;

  useEffect(() => {
    if (!isLoadingDerived) {
      hasLoadedOnce.current = true;
    }
  }, [isLoadingDerived]);

  if (!hasLoadedOnce.current && isLoadingDerived) {
    return <Loader />;
  }

  return (
    <div className="h-full flex flex-col md:flex-row bg-[#050509] light:bg-slate-50 text-white light:text-slate-900 transition-colors duration-200" style={{ fontFamily: "'Inter', sans-serif" }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <EditorNavbar onMenuClick={() => setSidebarOpen(true)} />
      
      <main 
        ref={mainContainerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="flex-1 md:ml-64 md:mt-16 overflow-y-auto"
      >
        <PullIndicator />

        {/* Home Banner - Top Level */}
        <AnimatePresence>
          {mainTab === "home" && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
              className="mb-4 md:mb-5 px-4 pt-2"
            >
              <UnifiedBannerSlider pageName="home" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Simple & Professional Tabbed Navigation - Enhanced for Light Theme */}
        <div className="flex justify-center mb-2 md:mb-4">
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
                    <div className="absolute inset-0 bg-white/10 light:bg-white rounded-xl -z-10 shadow-sm" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <AnimatePresence>
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
              <EditorDashboard 
                user={user} 
                stats={stats} 
                walletBalance={walletData?.wallet?.available}
                pendingBalance={walletData?.wallet?.pending}
              />
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
