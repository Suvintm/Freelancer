import { useState, useRef, useMemo, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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

  // Map the URL param to our internal state, default to reelsfeed
  const activeTab = useMemo(() => {
    if (!tab) return "reelsfeed";
    return tab;
  }, [tab]);

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

  return (
    <div className="h-full flex flex-col md:flex-row bg-black text-white transition-colors duration-200 overflow-hidden">
      {/* Hide Sidebars/Navbars on mobile/medium as requested */}
      <div className="hidden lg:block h-full">
        <UnifiedNavigation sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      </div>

      <main 
        ref={scrollContainerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="flex-1 lg:ml-64 relative flex flex-col h-screen overflow-hidden"
      >
        <PullIndicator />
        
        {/* Sticky Tab Bar - Black & White Theme, Smaller Size */}
        <div className="sticky top-0 z-[100] bg-black/80 backdrop-blur-xl border-b border-white/[0.05]">
          <div className="max-w-5xl mx-auto px-4 py-2.5 flex justify-center">
             <div className="flex p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                {tabs.map((t) => {
                  const isActive = activeTab === t.id;
                  return (
                    <motion.button
                      key={t.id}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => handleTabChange(t.id)}
                      className={`
                        relative flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all
                        ${isActive ? "text-black" : "text-zinc-500 hover:text-zinc-300"}
                      `}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeTabBg"
                          className="absolute inset-0 bg-white rounded-lg shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                          transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                        />
                      )}
                      <span className="relative z-10 flex items-center gap-1.5">
                         <t.icon className={`text-[12px] ${isActive ? "text-black" : ""}`} />
                         {t.label}
                      </span>
                    </motion.button>
                  );
                })}
             </div>
          </div>
        </div>

        {/* Tab Content Container */}
        <div className="flex-1 overflow-y-auto scrollbar-hide pb-20">
          <AnimatePresence>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="h-full"
            >
              {activeTab === "reelsfeed" && <ReelsExplore isTab={true} />}
              {(activeTab === "editors" || activeTab === "gigs") && (
                <ExploreEditor initialTab={activeTab === "gigs" ? "gigs" : "editors"} isTab={true} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default ExplorePage;
