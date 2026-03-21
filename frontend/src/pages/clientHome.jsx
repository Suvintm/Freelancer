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
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useAppContext } from "../context/AppContext";
import { useSocket } from "../context/SocketContext";
import UnifiedNavigation from "../components/UnifiedNavigation.jsx";
import ExploreEditor from "../components/ExploreEditor.jsx";
import ExploreGigs from "../components/ExploreGigs.jsx";
import Loader from "../components/Loader.jsx";
import KYCPendingBanner from "../components/KYCPendingBanner.jsx";
import HomeExploreContainer from "../components/HomeExploreContainer.jsx";
import ClientDashboard from "../components/ClientDashboard.jsx";
import UnifiedBannerSlider from "../components/UnifiedBannerSlider.jsx";
import SuvixHeroIntro from "../components/SuvixHeroIntro.jsx";
import reelIcon from "../assets/reelicon.png";
import { useHomeStore } from "../store/homeStore";
import useRefreshManager from "../hooks/useRefreshManager.js";
import usePullToRefresh from "../hooks/usePullToRefresh.jsx";

const ClientHome = () => {
  const { user, backendURL } = useAppContext();
  const navigate = useNavigate();
  const exploreRef = useRef(null);
  const mainContainerRef = useRef(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const hasLoadedOnce = useRef(false);
  const [stats, setStats] = useState({ totalOrders: 0, activeOrders: 0, completedOrders: 0, totalSpent: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [featuredEditors, setFeaturedEditors] = useState([]);
  const [activeProjects, setActiveProjects] = useState([]);
  const [showHowItWorks, setShowHowItWorks] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState([]);

  // ── REFRESH SYSTEM ──────────────────────────────────────────────────
  const { triggerRefresh } = useRefreshManager();
  const { pullDistance, handleTouchStart, handleTouchEnd, PullIndicator } = usePullToRefresh(
    () => triggerRefresh(true, ['homeData', 'orders']), 
    mainContainerRef
  );

  // Persistent tab state via Zustand — survives navigation
  const mainTab = useHomeStore((s) => s.clientMainTab);
  const setMainTab = useHomeStore((s) => s.setClientMainTab);
  const activeTab = useHomeStore((s) => s.exploreTab);
  const setActiveTab = useHomeStore((s) => s.setExploreTab);


  const socketContext = useSocket();
  const totalUnread = socketContext?.totalUnread || 0;

  const scrollToExplore = (tab = "editors") => {
    setActiveTab(tab);
    setTimeout(() => {
      exploreRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };


  // ── DATA FETCHING ──────────────────────────────────────────────────
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data } = await axios.get(`${backendURL}/api/orders`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      return data.orders || [];
    },
    enabled: !!user?.token,
  });

  const { data: editorsData, isLoading: editorsLoading } = useQuery({
    queryKey: ['explore', 'editors', { limit: 6, sortBy: 'popular' }],
    queryFn: async () => {
      const { data } = await axios.get(`${backendURL}/api/explore/editors?limit=6&sortBy=popular`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      return data.editors || [];
    },
    enabled: !!user?.token,
  });

  // Derived stats and data
  useEffect(() => {
    if (ordersData) {
      const orders = ordersData;
      const activeOrders = orders.filter(o => ["new", "accepted", "in_progress", "submitted"].includes(o.status));
      const completedOrders = orders.filter(o => o.status === "completed").length;
      const totalSpent = orders.filter(o => o.status === "completed").reduce((sum, o) => sum + (o.amount || 0), 0);
      
      setStats({ 
        totalOrders: orders.length, 
        activeOrders: activeOrders.length, 
        completedOrders, 
        totalSpent 
      });
      setActiveProjects(activeOrders.slice(0, 5));
      
      if (orders.length > 0) setShowHowItWorks(false);
    }
  }, [ordersData]);

  useEffect(() => {
    if (editorsData) {
      setFeaturedEditors(editorsData.slice(0, 6));
    }
  }, [editorsData]);

  // Combined loading state
  const loading = ordersLoading || editorsLoading;

  useEffect(() => {
    if (!ordersLoading && !editorsLoading) {
      hasLoadedOnce.current = true;
    }
  }, [ordersLoading, editorsLoading]);



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

  if (!hasLoadedOnce.current && loading) {
    return <Loader />;
  }

  return (
    <div 
      className="h-full flex flex-col md:flex-row bg-[#09090B] light:bg-[#FAFAFA] text-white light:text-zinc-900"
      style={{ fontFamily: "'Manrope', sans-serif" }}
    >
      <UnifiedNavigation sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <main 
        ref={mainContainerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="flex-1 md:ml-64 md:mt-16 overflow-y-auto"
      >
        <PullIndicator />
        
        {/* SuviX Hero Section - Two Column Grid */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-2 md:mb-8 px-4 pt-0 md:pt-2"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Side: Suvix Introduction */}
            <div className="hidden lg:block lg:col-span-5">
              <SuvixHeroIntro userType="client" userName={user?.name} />
            </div>

            {/* Right Side: Featured Showcase */}
            <div className="lg:col-span-7 flex flex-col">
              <UnifiedBannerSlider pageName="home" />
            </div>
          </div>
        </motion.div>

        {/* Simple & Professional Tabbed Navigation - Enhanced for Light Theme */}
        <div className="px-4 mb-1.5 md:mb-4 flex justify-center">
          <div className="flex items-center gap-1 bg-white/5 light:bg-zinc-100 border border-white/10 light:border-zinc-200 p-1 rounded-2xl w-fit backdrop-blur-xl shadow-sm">
            {[
              { id: 'home', label: 'Discover', icon: HiOutlineSparkles },
              { id: 'dashboard', label: 'Dashboard', icon: HiOutlineChartBar }
            ].map((tab) => {
              const isActive = mainTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setMainTab(tab.id)}
                  className={`relative flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-black transition-all duration-300 z-10 ${
                    isActive ? "text-zinc-900 light:text-white" : "text-zinc-500 hover:text-zinc-300 light:text-zinc-400 light:hover:text-zinc-600"
                  }`}
                >
                  <tab.icon className={`w-3.5 h-3.5 ${isActive ? 'text-zinc-900 light:text-white' : 'text-zinc-500'}`} />
                  {tab.label}
                  {isActive && (
                    <motion.div 
                      layoutId="clientActiveTab"
                      className="absolute inset-0 bg-white light:bg-zinc-950 rounded-xl -z-10 shadow-sm" 
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <AnimatePresence>
          {mainTab === "home" ? (
            <motion.div
              key="home"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.1 }}
            >
              <HomeExploreContainer 
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                recentSearches={recentSearches}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
              />
            </motion.div>
          ) : (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.1 }}
            >
              <ClientDashboard 
                user={user}
                stats={stats}
                activeProjects={activeProjects}
                getStatusStyle={getStatusStyle}
              />
            </motion.div>
          )}
        </AnimatePresence>



      </main>
    </div>
  );
};

export default ClientHome;
