import { useState, useRef, useMemo, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import { HiOutlineVideoCamera, HiOutlineUserGroup, HiOutlineShoppingBag } from "react-icons/hi2";

import UnifiedNavigation from "../components/UnifiedNavigation.jsx";
import ExploreEditor from "../components/ExploreEditor.jsx";
import ReelsExplore from "./ReelsExplore.jsx";
import useRefreshManager from "../hooks/useRefreshManager.js";
import usePullToRefresh from "../hooks/usePullToRefresh.jsx";

const ExplorePage = () => {
  const { tab } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const scrollContainerRef = useRef(null);
  const { triggerRefresh } = useRefreshManager();

  // Manual tab extraction from pathname for persistent TabSwitcher compatibility
  const activeTab = useMemo(() => {
    const parts = location.pathname.split("/");
    // URL format: /explore/:id
    const id = parts[2]; 
    if (!id || id === "explore") return "reelsfeed";
    return id;
  }, [location.pathname]);

  // If we are at /explore exactly, redirect to /explore/reelsfeed
  useEffect(() => {
    if (location.pathname === "/explore") {
      navigate("/explore/reelsfeed", { replace: true });
    }
  }, [location, navigate]);

  const tabs = [
    { id: "reelsfeed", label: "Reels", icon: HiOutlineVideoCamera },
    { id: "editors",   label: "Editors", icon: HiOutlineUserGroup },
    { id: "gigs",      label: "Gigs",    icon: HiOutlineShoppingBag },
  ];

  const handleTabChange = (tabId) => {
    navigate(`/explore/${tabId}`);
  };

  // Pull-to-Refresh Integration
  const { handleTouchStart, handleTouchEnd, PullIndicator } = usePullToRefresh(
    () => triggerRefresh(true, ['explore']), 
    scrollContainerRef
  );

  // Track window width for responsive swipe thresholds
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Motion value for horizontal scroll sync
  const x = useMotionValue(0);
  const activeIndex = tabs.findIndex(t => t.id === activeTab);
  
  // Transform x to tab indicator position (%)
  // Maps full container width movement to a percentage of the indicator's own width
  // Since each tab is 1/3 of the container, moving 100% of the indicator's width moves it to the next tab.
  const indicatorX = useTransform(
    x,
    [-(tabs.length - 1) * windowWidth, 0],
    [(tabs.length - 1) * 100, 0]
  );

  // Update x-offset when activeTab changes (for clicks & resize)
  useEffect(() => {
    animate(x, -(activeIndex * windowWidth), {
      type: "spring", stiffness: 300, damping: 30
    });
  }, [activeIndex, windowWidth, x]);

  const [isSwiping, setIsSwiping] = useState(false);

  return (
    <div className="h-full flex flex-col md:flex-row bg-black text-white transition-colors duration-200 overflow-hidden">
      {/* Hide Sidebars/Navbars on mobile/medium as requested */}
      <div className="hidden lg:block h-full">
        <UnifiedNavigation sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      </div>

      <main className="flex-1 lg:ml-64 relative flex flex-col h-screen overflow-hidden bg-[#050509]">
        <PullIndicator />
        
        {/* Sticky Tab Bar - Black & White Theme, Smaller Size */}
        <div className="sticky top-0 z-[100] bg-black/80 backdrop-blur-xl border-b border-white/[0.05]">
          <div className="max-w-5xl mx-auto px-4 py-2.5 flex justify-center">
             <div className="flex p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] relative w-fit min-w-[280px]">
                {/* Visual Indicator Background (Synced with swipe) */}
                <motion.div
                  className="absolute top-1 bottom-1 bg-white rounded-lg shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                  style={{ 
                    width: `calc(${100 / tabs.length}% - 4px)`,
                    left: "2px",
                    x: useTransform(indicatorX, v => `${v}%`),
                    transition: { type: "spring", stiffness: 500, damping: 50 } 
                  }}
                />

                {tabs.map((t, idx) => {
                  const isActive = activeTab === t.id;
                  return (
                    <motion.button
                      key={t.id}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => handleTabChange(t.id)}
                      className={`
                        relative flex-1 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all min-w-[80px]
                        ${isActive ? "text-white mix-blend-difference" : "text-zinc-500 hover:text-zinc-300"}
                      `}
                    >
                      <span className="relative z-10 flex items-center justify-center gap-1.5">
                         <t.icon className={`text-[12px] flex-shrink-0 ${isActive ? "text-white" : ""}`} />
                         <span>{t.label}</span>
                      </span>
                    </motion.button>
                  );
                })}
             </div>
          </div>
        </div>

        {/* Tab Content Container - Horizontal Slider */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-hidden relative pb-20"
        >
          <motion.div
            drag="x"
            dragConstraints={{ left: -((tabs.length - 1) * windowWidth), right: 0 }}
            dragElastic={0.05}
            onDragStart={() => setIsSwiping(true)}
            onDragEnd={(e, { offset, velocity }) => {
              setIsSwiping(false);
              const swipeThreshold = windowWidth * 0.25; // Lower distance threshold if flicked fast
              const currentIndex = tabs.findIndex(t => t.id === activeTab);
              let nextIndex = currentIndex;

              // Priority 1: High velocity flick
              if (velocity.x < -300) {
                nextIndex = Math.min(currentIndex + 1, tabs.length - 1);
              } else if (velocity.x > 300) {
                nextIndex = Math.max(currentIndex - 1, 0);
              } 
              // Priority 2: Absolute distance (30% instead of 38% for more responsiveness)
              else if (offset.x < -(windowWidth * 0.30)) {
                nextIndex = Math.min(currentIndex + 1, tabs.length - 1);
              } else if (offset.x > (windowWidth * 0.30)) {
                nextIndex = Math.max(currentIndex - 1, 0);
              }

              if (nextIndex !== currentIndex) {
                handleTabChange(tabs[nextIndex].id);
              } else {
                // Snap back
                animate(x, -(currentIndex * windowWidth), {
                  type: "spring", stiffness: 350, damping: 35
                });
              }
            }}
            className="flex h-full touch-pan-y"
            style={{ x, width: `${tabs.length * 100}%` }}
          >
            {tabs.map((t) => (
              <div 
                key={t.id} 
                className="h-full overflow-y-auto scrollbar-hide shrink-0"
                style={{ width: `${100 / tabs.length}%` }}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                {t.id === "reelsfeed" && <ReelsExplore isTab={true} isSwiping={isSwiping} />}
                {(t.id === "editors" || t.id === "gigs") && (
                  <ExploreEditor initialTab={t.id} isTab={true} isSwiping={isSwiping} />
                )}
              </div>
            ))}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default ExplorePage;
