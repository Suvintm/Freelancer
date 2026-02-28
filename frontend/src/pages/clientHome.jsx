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
import Loader from "../components/Loader.jsx";
import KYCPendingBanner from "../components/KYCPendingBanner.jsx";
import HomeExploreContainer from "../components/HomeExploreContainer.jsx";
import ClientDashboard from "../components/ClientDashboard.jsx";
import UnifiedBannerSlider from "../components/UnifiedBannerSlider.jsx";
import reelIcon from "../assets/reelicon.png";

const ClientHome = () => {
  const { user, backendURL } = useAppContext();
  const navigate = useNavigate();
  const exploreRef = useRef(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mainTab, setMainTab] = useState("home");
  const [activeTab, setActiveTab] = useState("editors");
  const [stats, setStats] = useState({ totalOrders: 0, activeOrders: 0, completedOrders: 0, totalSpent: 0 });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [featuredEditors, setFeaturedEditors] = useState([]);
  const [activeProjects, setActiveProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showHowItWorks, setShowHowItWorks] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState([]);

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

  // Loading State with Minimum Delay
  const [isPageLoading, setIsPageLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);



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

  if (loading) {
    return <Loader />;
  }

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

      <main className="flex-1 px-0 md:ml-64 md:mt-16 overflow-x-hidden">
        {/* Premium Banner at the Top - Responsive with Side Margins */}
        <div className="px-3 md:px-8 mb-1.5 md:mb-4 max-w-7xl mx-auto">
          <UnifiedBannerSlider />
        </div>
        
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
                  className={`relative flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-bold transition-all duration-300 z-10 ${
                    isActive ? "text-white light:text-zinc-900" : "text-zinc-500 hover:text-zinc-300 light:text-zinc-400 light:hover:text-zinc-600"
                  }`}
                >
                  <tab.icon className={`w-3.5 h-3.5 ${isActive ? 'text-white light:text-zinc-900' : 'text-zinc-500'}`} />
                  {tab.label}
                  {isActive && (
                    <motion.div
                      layoutId="activePill"
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
          {mainTab === "home" ? (
            <motion.div
              key="home"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
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
