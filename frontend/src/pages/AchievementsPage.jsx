/**
 * Achievements Page
 * Displays all badges with progress, responsive layout
 * Desktop: Table on left, details on right
 * Mobile: Compact card view
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineLockClosed,
  HiOutlineLockOpen,
  HiOutlineTrophy,
  HiOutlineStar,
  HiOutlineBolt,
  HiOutlineFilm,
  HiOutlinePlayCircle,
  HiOutlineCheckBadge,
  HiOutlineCurrencyRupee,
  HiOutlineUserGroup,
  HiOutlineSparkles,
  HiOutlineChevronLeft,
  HiOutlineArrowPath,
} from "react-icons/hi2";
import { FaCrown } from "react-icons/fa";
import axios from "axios";
import { useAppContext } from "../context/AppContext";
import { useTheme } from "../context/ThemeContext";
import Sidebar from "../components/Sidebar";
import EditorNavbar from "../components/EditorNavbar";

// Map badge icons to components
const BADGE_ICONS = {
  star: HiOutlineStar,
  trophy: HiOutlineTrophy,
  crown: FaCrown,
  "star-badge": HiOutlineStar,
  bolt: HiOutlineBolt,
  film: HiOutlineFilm,
  "play-circle": HiOutlinePlayCircle,
  "check-badge": HiOutlineCheckBadge,
  currency: HiOutlineCurrencyRupee,
  users: HiOutlineUserGroup,
};

const AchievementsPage = () => {
  const { user, backendURL } = useAppContext();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [badges, setBadges] = useState([]);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Stats summary
  const earnedCount = badges.filter(b => b.earned).length;
  const totalCount = badges.length;

  useEffect(() => {
    fetchBadges();
  }, []);

  const fetchBadges = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(`${backendURL}/api/badges/progress`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      setBadges(res.data.progress || []);
    } catch (error) {
      console.error("Failed to fetch badges:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEvaluate = async () => {
    try {
      setIsEvaluating(true);
      const res = await axios.post(
        `${backendURL}/api/badges/evaluate`,
        {},
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      
      if (res.data.results?.newBadges?.length > 0) {
        alert(`🎉 Congratulations! You earned ${res.data.results.newBadges.length} new badge(s)!`);
      }
      
      // Refresh badges
      await fetchBadges();
    } catch (error) {
      console.error("Failed to evaluate badges:", error);
    } finally {
      setIsEvaluating(false);
    }
  };

  const getBadgeIcon = (iconName) => {
    return BADGE_ICONS[iconName] || HiOutlineTrophy;
  };

  const formatProgress = (badge) => {
    if (badge.earned) return "Completed!";
    return `${badge.current} / ${badge.target}`;
  };

  return (
    <div 
      className={`min-h-screen flex flex-col md:flex-row transition-colors ${
        isDark ? 'bg-[#050509] text-white' : 'bg-slate-50 text-slate-900'
      }`}
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <EditorNavbar onMenuClick={() => setSidebarOpen(true)} />

      <main className="flex-1 px-4 md:px-8 py-6 md:ml-64 md:mt-16">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className={`p-2 rounded-xl transition-colors ${
                isDark 
                  ? 'hover:bg-white/5 text-gray-400' 
                  : 'hover:bg-slate-100 text-slate-600'
              }`}
            >
              <HiOutlineChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <HiOutlineTrophy className="text-amber-500" />
                Achievements
              </h1>
              <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>
                Track your progress and unlock badges
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Earned Count Badge */}
            <div className={`px-4 py-2 rounded-xl border ${
              isDark 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-emerald-50 border-emerald-200 text-emerald-600'
            }`}>
              <span className="font-bold">{earnedCount}</span>
              <span className="opacity-70"> / {totalCount} Unlocked</span>
            </div>

            {/* Check for New Badges */}
            <button
              onClick={handleEvaluate}
              disabled={isEvaluating}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                isDark
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white'
              }`}
            >
              <HiOutlineArrowPath className={`w-4 h-4 ${isEvaluating ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Check Progress</span>
            </button>
          </div>
        </div>

        {/* Main Content - Responsive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Badge Table/Grid */}
          <div className={`lg:col-span-7 rounded-2xl p-5 border ${
            isDark 
              ? 'bg-[#0a0a0c] border-white/10' 
              : 'bg-white border-slate-200'
          }`}>
            <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              <HiOutlineSparkles className="text-amber-500" />
              All Badges
            </h2>

            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className={`animate-pulse rounded-xl p-4 ${
                    isDark ? 'bg-white/5' : 'bg-slate-100'
                  }`}>
                    <div className="w-12 h-12 rounded-full mx-auto mb-3 bg-gray-700/50" />
                    <div className="h-4 rounded w-20 mx-auto bg-gray-700/50" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {badges.map((badge) => {
                  const IconComponent = getBadgeIcon(badge.icon);
                  const isSelected = selectedBadge?.id === badge.id;
                  
                  return (
                    <motion.button
                      key={badge.id}
                      onClick={() => setSelectedBadge(badge)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`relative p-4 rounded-xl border transition-all text-center ${
                        isSelected
                          ? isDark 
                            ? 'bg-emerald-500/20 border-emerald-500/50' 
                            : 'bg-emerald-50 border-emerald-300'
                          : badge.earned
                            ? isDark 
                              ? 'bg-white/5 border-white/10 hover:border-white/20' 
                              : 'bg-white border-slate-200 hover:border-slate-300'
                            : isDark 
                              ? 'bg-white/[0.02] border-white/5 hover:border-white/10' 
                              : 'bg-slate-50 border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      {/* Lock Icon */}
                      <div className="absolute top-2 right-2">
                        {badge.earned ? (
                          <HiOutlineLockOpen className={`w-4 h-4 ${
                            isDark ? 'text-emerald-400' : 'text-emerald-500'
                          }`} />
                        ) : (
                          <HiOutlineLockClosed className={`w-4 h-4 ${
                            isDark ? 'text-gray-600' : 'text-slate-400'
                          }`} />
                        )}
                      </div>

                      {/* Badge Icon */}
                      <div 
                        className={`w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center ${
                          badge.earned 
                            ? '' 
                            : 'opacity-40 grayscale'
                        }`}
                        style={{ 
                          backgroundColor: badge.earned ? `${badge.color}20` : undefined,
                          border: badge.earned ? `2px solid ${badge.color}` : undefined,
                        }}
                      >
                        <IconComponent 
                          className="w-6 h-6" 
                          style={{ color: badge.earned ? badge.color : undefined }}
                        />
                      </div>

                      {/* Badge Name */}
                      <h3 className={`font-semibold text-sm mb-1 ${
                        badge.earned 
                          ? isDark ? 'text-white' : 'text-slate-900'
                          : isDark ? 'text-gray-500' : 'text-slate-400'
                      }`}>
                        {badge.name}
                      </h3>

                      {/* Progress */}
                      <div className="mt-2">
                        <div className={`h-1.5 rounded-full overflow-hidden ${
                          isDark ? 'bg-white/10' : 'bg-slate-200'
                        }`}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${badge.percentage}%` }}
                            transition={{ duration: 0.5 }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: badge.color }}
                          />
                        </div>
                        <p className={`text-xs mt-1 ${
                          isDark ? 'text-gray-500' : 'text-slate-500'
                        }`}>
                          {formatProgress(badge)}
                        </p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Selected Badge Details */}
          <div className={`lg:col-span-5 rounded-2xl p-5 border h-fit sticky top-24 ${
            isDark 
              ? 'bg-[#0a0a0c] border-white/10' 
              : 'bg-white border-slate-200'
          }`}>
            <h2 className={`text-lg font-semibold mb-4 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              Badge Details
            </h2>

            {selectedBadge ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedBadge.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-center"
                >
                  {/* Badge Icon Large */}
                  <div 
                    className={`w-24 h-24 rounded-2xl mx-auto mb-4 flex items-center justify-center ${
                      selectedBadge.earned ? '' : 'opacity-40 grayscale'
                    }`}
                    style={{ 
                      backgroundColor: selectedBadge.earned ? `${selectedBadge.color}20` : undefined,
                      border: selectedBadge.earned ? `3px solid ${selectedBadge.color}` : `2px dashed ${isDark ? '#374151' : '#cbd5e1'}`,
                    }}
                  >
                    {(() => {
                      const IconComponent = getBadgeIcon(selectedBadge.icon);
                      return <IconComponent 
                        className="w-10 h-10" 
                        style={{ color: selectedBadge.earned ? selectedBadge.color : undefined }}
                      />;
                    })()}
                  </div>

                  {/* Status */}
                  {selectedBadge.earned ? (
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium mb-3 ${
                      isDark 
                        ? 'bg-emerald-500/20 text-emerald-400' 
                        : 'bg-emerald-100 text-emerald-600'
                    }`}>
                      <HiOutlineLockOpen className="w-4 h-4" />
                      Unlocked!
                    </span>
                  ) : (
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium mb-3 ${
                      isDark 
                        ? 'bg-gray-800 text-gray-400' 
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      <HiOutlineLockClosed className="w-4 h-4" />
                      Locked
                    </span>
                  )}

                  {/* Name & Description */}
                  <h3 className={`text-xl font-bold mb-2 ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    {selectedBadge.name}
                  </h3>
                  <p className={`text-sm mb-4 ${
                    isDark ? 'text-gray-400' : 'text-slate-600'
                  }`}>
                    {selectedBadge.description}
                  </p>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className={isDark ? 'text-gray-500' : 'text-slate-500'}>Progress</span>
                      <span className="font-semibold" style={{ color: selectedBadge.color }}>
                        {selectedBadge.percentage}%
                      </span>
                    </div>
                    <div className={`h-3 rounded-full overflow-hidden ${
                      isDark ? 'bg-white/10' : 'bg-slate-200'
                    }`}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${selectedBadge.percentage}%` }}
                        transition={{ duration: 0.8 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: selectedBadge.color }}
                      />
                    </div>
                    <p className={`text-sm mt-2 ${
                      isDark ? 'text-gray-500' : 'text-slate-500'
                    }`}>
                      {selectedBadge.current} of {selectedBadge.target} completed
                    </p>
                  </div>

                  {/* Category */}
                  <div className={`inline-block px-3 py-1 rounded-lg text-xs font-medium uppercase tracking-wider ${
                    isDark ? 'bg-white/5 text-gray-400' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {selectedBadge.category}
                  </div>

                  {/* Earned Date */}
                  {selectedBadge.earnedAt && (
                    <p className={`text-xs mt-4 ${isDark ? 'text-gray-600' : 'text-slate-400'}`}>
                      Earned on {new Date(selectedBadge.earnedAt).toLocaleDateString()}
                    </p>
                  )}
                </motion.div>
              </AnimatePresence>
            ) : (
              <div className={`text-center py-10 ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
                <HiOutlineTrophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Select a badge to see details</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AchievementsPage;
