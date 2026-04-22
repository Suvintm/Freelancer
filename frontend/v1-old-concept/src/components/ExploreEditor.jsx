/**
 * ExploreEditors_v2.jsx
 * ─────────────────────────────────────────────────────────────────
 * PRODUCTION-LEVEL REDESIGN — SuviX Freelance Platform
 * 
 * NEW SECTIONS vs OLD:
 *  ✅ Kept: CategoryBanner (ads), ExploreGigs, tab switcher, EditorCard grid,
 *           filters, Online Now, Browse by Specialty, Featured Editors
 *  🆕 Added: ExploreSearchBar (new powerful search, replaces AdvancedSearchBar)
 *             LiveStatsBar (animated live counters)
 *             EditorStories (Instagram-style showreel rings)
 *             TrendingSkills (hot skills with demand count)
 *             SmartMatchCTA (AI matching banner)
 *             TopRatedSection (podium + top-3 monthly)
 *             NewJoinersSection (fresh talent this week)
 *             Infinite Scroll (replaces pagination)
 * 
 * BACKEND TODOs (mark with // TODO:):
 *  - GET /api/explore/trending-skills  → [{ skill, count, growth }]
 *  - GET /api/explore/stories          → [{ userId, name, avatar, hasNew }]
 *  - GET /api/explore/top-rated        → top editors this month
 *  - GET /api/explore/new-joiners      → editors joined last 7 days
 *  Static fallback data is provided for all new sections.
 * ─────────────────────────────────────────────────────────────────
 */

import React, {
  useState, useEffect, useRef, useCallback, useMemo, memo
} from "react";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import axios from "axios";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import {
  FaSearch, FaTimes, FaFilter, FaHeart, FaRegHeart, FaStar,
  FaCheckCircle, FaMapMarkerAlt, FaGlobe, FaUsers, FaAward,
  FaBriefcase, FaFire, FaArrowRight, FaPlay, FaYoutube, FaMagic,
  FaFilm, FaPalette, FaRing, FaShoppingBag, FaBolt, FaMicrophone,
  FaVideo, FaChevronLeft, FaChevronRight, FaHistory,
  FaEye, FaBookmark, FaSortAmountDown, FaTv, FaGamepad, FaMobileAlt,
} from "react-icons/fa";
// Note: FaTrendingUp removed — use HiTrendingUp from 'hi' instead
import {
  HiSparkles, HiLightningBolt, HiCheckCircle, HiUserGroup,
  HiOutlineBadgeCheck, HiOutlineClock, HiOutlineChartBar, HiTrendingUp,
} from "react-icons/hi";
import { MdVerified, MdWorkspacePremium } from "react-icons/md";
import { IoFlashSharp } from "react-icons/io5";

import { useAppContext } from "../context/AppContext";
import { useHomeStore } from "../store/homeStore";
import EmptyState from "./EmptyState.jsx";
import ExploreGigs from "./ExploreGigs.jsx";
import CategoryBanner from "./CategoryBanner.jsx";
import SuvixScoreBadge from "./SuvixScoreBadge.jsx";
import SmartMatchBanner from "./AIWorkspace/SmartMatchBanner.jsx";

// ─────────────────────────────────────────────────────────────────
// CONSTANTS & HELPERS
// ─────────────────────────────────────────────────────────────────

const TIER_COLOR = {
  elite:        '#FFD700',
  expert:       '#9B59B6',
  professional: '#3498DB',
  established:  '#27AE60',
  rising:       '#1ABC9C',
  newcomer:     '#95A5A6',
};

const SPECIALTIES = [
  { label: "YouTube",   image: "/youtube_category_1766945669722.png",  color: "#FF0000" },
  { label: "Wedding",   image: "/wedding_category_1766945653582.png",   color: "#FF69B4" },
  { label: "Reels",     image: "/reels_category_1766945684333.png",     color: "#833AB4" },
  { label: "Color",     image: "/color_category_1766945743508.png",     color: "#F5A623" },
  { label: "Podcast",   image: "/podcast_category_1766945699811.png",   color: "#1DB954" },
  { label: "VFX",       image: "/vfx_category_1766945726102.png",       color: "#00D2FF" },
  { label: "Cinematic", image: "/cinematic_category_1766945761051.png", color: "#2ECC71" },
  { label: "Ads",       image: "/ads_category_1766945776646.png",       color: "#FF6B35" },
];

const CATEGORY_PILLS = [
  { id: "all",      label: "All",      Icon: HiSparkles,    active: "from-violet-500 to-purple-600",  color: "text-violet-400" },
  { id: "wedding",  label: "Wedding",  Icon: FaRing,        active: "from-pink-500 to-rose-600",      color: "text-pink-400",    hot: true },
  { id: "reels",    label: "Reels",    Icon: FaPlay,        active: "from-purple-500 to-fuchsia-600", color: "text-purple-400" },
  { id: "youtube",  label: "YouTube",  Icon: FaYoutube,     active: "from-red-500 to-orange-600",     color: "text-red-400" },
  { id: "podcast",  label: "Podcast",  Icon: FaMicrophone,  active: "from-blue-500 to-cyan-600",      color: "text-blue-400" },
  { id: "vfx",      label: "VFX",      Icon: FaMagic,       active: "from-cyan-500 to-teal-600",      color: "text-cyan-400" },
  { id: "color",    label: "Color",    Icon: FaPalette,     active: "from-amber-500 to-orange-600",   color: "text-amber-400" },
  { id: "cinematic",label: "Cinematic",Icon: FaFilm,        active: "from-emerald-500 to-green-600",  color: "text-emerald-400" },
  { id: "ads",      label: "Ads",      Icon: FaVideo,       active: "from-rose-500 to-pink-600",      color: "text-rose-400" },
];

// TODO: Replace with live API data from GET /api/explore/trending-skills
const STATIC_TRENDING_SKILLS = [
  { skill: "DaVinci Resolve", count: 142, growth: "+18%", hot: true },
  { skill: "Wedding Films",   count: 98,  growth: "+31%", hot: true },
  { skill: "YouTube Shorts",  count: 87,  growth: "+24%" },
  { skill: "Color Grading",   count: 76,  growth: "+12%" },
  { skill: "Motion Graphics", count: 64,  growth: "+9%"  },
  { skill: "Podcast Edit",    count: 55,  growth: "+22%" },
  { skill: "After Effects",   count: 49,  growth: "+7%"  },
  { skill: "Reel Cuts",       count: 44,  growth: "+19%" },
];

// TODO: Replace with real stories from GET /api/explore/stories
const STATIC_STORIES = [
  { id: "s1", name: "Riya",   avatar: null, hasNew: true,  gradient: "from-pink-500 to-orange-400" },
  { id: "s2", name: "Arjun",  avatar: null, hasNew: true,  gradient: "from-violet-500 to-purple-400" },
  { id: "s3", name: "Priya",  avatar: null, hasNew: false, gradient: "from-emerald-500 to-teal-400" },
  { id: "s4", name: "Kiran",  avatar: null, hasNew: true,  gradient: "from-blue-500 to-cyan-400" },
  { id: "s5", name: "Dev",    avatar: null, hasNew: false, gradient: "from-amber-500 to-yellow-400" },
  { id: "s6", name: "Sneha",  avatar: null, hasNew: true,  gradient: "from-red-500 to-pink-400" },
  { id: "s7", name: "Ajay",   avatar: null, hasNew: false, gradient: "from-indigo-500 to-violet-400" },
  { id: "s8", name: "Meera",  avatar: null, hasNew: true,  gradient: "from-teal-500 to-cyan-400" },
];

const highlightText = (text, query) => {
  if (!query?.trim() || !text) return text;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <mark key={i} className="bg-violet-500/20 text-violet-300 rounded px-0.5 not-italic">{part}</mark>
      : part
  );
};


// ─────────────────────────────────────────────────────────────────
// COMPONENT: ExploreSearchBar (NEW — replaces AdvancedSearchBar)
// ─────────────────────────────────────────────────────────────────
const ExploreSearchBar = memo(({ value, onChange, onSearch, activeFilterCount, onFilterToggle }) => {
  const { backendURL, user } = useAppContext();
  const [focused, setFocused] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  const trendingSearches = [
    { text: "Wedding Editor", Icon: FaRing, color: "text-pink-400" },
    { text: "DaVinci Resolve Expert", Icon: FaMagic, color: "text-cyan-400" },
    { text: "YouTube Specialist", Icon: FaYoutube, color: "text-red-400" },
    { text: "Reels & Shorts", Icon: FaPlay, color: "text-purple-400" },
    { text: "Color Grading Pro", Icon: FaPalette, color: "text-amber-400" },
  ];

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem("suvix_recent_editor_searches") || "[]");
      setRecentSearches(s.slice(0, 5));
    } catch { setRecentSearches([]); }
  }, []);

  const saveSearch = (q) => {
    if (!q.trim()) return;
    const updated = [q, ...recentSearches.filter(s => s !== q)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("suvix_recent_editor_searches", JSON.stringify(updated));
  };

  const deleteRecent = (e, term) => {
    e.stopPropagation();
    const updated = recentSearches.filter(s => s !== term);
    setRecentSearches(updated);
    localStorage.setItem("suvix_recent_editor_searches", JSON.stringify(updated));
  };

  // Live suggestions from backend
  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!value.trim() || value.length < 2) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const res = await axios.get(`${backendURL}/api/explore/suggestions?query=${encodeURIComponent(value)}`);
        setSuggestions(res.data.suggestions || []);
      } catch { setSuggestions([]); }
      finally { setLoadingSuggestions(false); }
    }, 280);
  }, [value, backendURL]);

  const handleSubmit = (q = value) => {
    if (q.trim()) { saveSearch(q.trim()); onSearch?.(q.trim()); }
    setFocused(false);
    inputRef.current?.blur();
  };

  const handleSelect = (text) => {
    onChange(text);
    handleSubmit(text);
  };

  const showDropdown = focused && (suggestions.length > 0 || recentSearches.length > 0 || !value.trim());

  return (
    <div className="relative z-40 mb-8 px-1">
      {/* Search Input Container */}
      <motion.div
        animate={{ 
          scale: focused ? 1.02 : 1,
          y: focused ? -4 : 0
        }}
        className={`relative flex items-center rounded-2xl transition-all duration-500 shadow-2xl will-change-transform transform-gpu ${
          focused
            ? "ring-2 ring-violet-500/30 shadow-violet-500/20"
            : "shadow-black/20"
        }`}
        style={{
          background: focused
            ? "rgba(255,255,255,0.08)"
            : "rgba(255,255,255,0.03)",
          border: focused
            ? "1px solid rgba(139,92,246,0.4)"
            : "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(12px) sm:blur(20px)",
          transform: "translateZ(0)",
          willChange: "transform, backdrop-filter"
        }}
      >
        {/* Left Icon with animated glow */}
        <div className={`absolute left-4 flex items-center justify-center transition-colors duration-300 ${focused ? "text-violet-400" : "text-gray-500"}`}>
          <motion.div animate={{ rotate: focused ? 90 : 0 }}>
            {loadingSuggestions
              ? <div className="w-5 h-5 rounded-full border-2 border-violet-400/30 border-t-violet-400 animate-spin" />
              : <FaSearch className="text-sm" />
            }
          </motion.div>
        </div>

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
            if (e.key === "Escape") { setFocused(false); inputRef.current?.blur(); }
          }}
          placeholder="Search for 'Wedding editor' or 'Davinci vfx'..."
          className="w-full py-4.5 pl-12 pr-40 bg-transparent text-white text-base placeholder-gray-500 focus:outline-none font-medium"
        />

        {/* Right Controls */}
        <div className="absolute right-3 flex items-center gap-2">
          {value && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              onClick={() => { onChange(""); inputRef.current?.focus(); }}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-gray-400 transition-all"
            >
              <FaTimes className="text-[10px]" />
            </motion.button>
          )}

          <button
            onClick={onFilterToggle}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
              activeFilterCount > 0
                ? "bg-violet-500 text-white shadow-lg shadow-violet-500/30"
                : "bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10"
            }`}
          >
            <FaFilter className="text-[9px]" />
            {activeFilterCount > 0 ? activeFilterCount : "Filters"}
          </button>

          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={() => handleSubmit()}
            className="hidden md:flex px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 via-purple-600 to-indigo-600 text-white text-[11px] font-black uppercase tracking-[0.15em] shadow-xl shadow-violet-500/25 hover:shadow-violet-500/50 hover:brightness-110 transition-all"
          >
            Find Talent
          </motion.button>
        </div>
      </motion.div>

      {/* Quick Trending Chips (Visible when focused or empty) */}
      {!value && focused && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 flex flex-wrap gap-2 px-1"
        >
          {trendingSearches.slice(0, 3).map((item, i) => (
            <button
               key={i}
               onClick={() => handleSelect(item.text)}
               className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-violet-500/30 hover:bg-violet-500/5 text-[10px] text-gray-400 hover:text-white transition-all font-bold uppercase tracking-wider"
            >
              <item.Icon className={item.color} />
              {item.text}
            </button>
          ))}
        </motion.div>
      )}

      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-1.5 mt-2 flex-wrap px-1">
          <span className="text-[10px] text-gray-500">Filtered by:</span>
        </div>
      )}

      {/* Dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="absolute top-full mt-2 left-0 right-0 rounded-2xl overflow-hidden z-50 border border-white/10 shadow-2xl shadow-black/60"
            style={{ 
              background: "rgba(10,10,14,0.97)", 
              backdropFilter: "blur(12px) sm:blur(20px)",
              transform: "translateZ(0)",
              willChange: "transform, opacity" 
            }}
          >
            {/* Live suggestions */}
            {value.trim() && suggestions.length > 0 && (
              <div className="px-3 pt-3 pb-2">
                <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold px-1 mb-2">Suggestions</p>
                {suggestions.map((s, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => handleSelect(s.text)}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all text-left group"
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                      s.type === "editor" ? "bg-violet-500/15" : "bg-emerald-500/15"
                    }`}>
                      {s.type === "editor"
                        ? <FaUsers className={`text-[10px] text-violet-400`} />
                        : <FaBolt className={`text-[10px] text-emerald-400`} />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate group-hover:text-violet-300 transition-colors">{s.text}</p>
                      <p className="text-[10px] text-gray-500">{s.type === "editor" ? "Editor" : "Skill"}</p>
                    </div>
                    <FaArrowRight className="text-gray-600 group-hover:text-gray-400 text-xs transition-colors" />
                  </motion.button>
                ))}
              </div>
            )}

            {/* No query: show trending + recent */}
            {!value.trim() && (
              <>
                {/* Trending */}
                <div className="px-3 pt-3 pb-1">
                  <div className="flex items-center gap-1.5 px-1 mb-2">
                    <HiTrendingUp className="text-orange-400 text-xs" />
                    <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Trending searches</p>
                  </div>
                  {trendingSearches.map((item, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => handleSelect(item.text)}
                      className="flex items-center gap-3 w-full px-3 py-2 rounded-xl hover:bg-white/5 transition-all text-left"
                    >
                      <item.Icon className={`text-sm ${item.color}`} />
                      <span className="text-sm text-gray-300">{item.text}</span>
                    </motion.button>
                  ))}
                </div>

                {/* Recent searches */}
                {recentSearches.length > 0 && (
                  <div className="px-3 pb-3 mt-1 border-t border-white/5 pt-3">
                    <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold px-1 mb-2">Recent</p>
                    {recentSearches.map((s, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/5 transition-all group">
                        <FaHistory className="text-gray-600 text-xs flex-shrink-0" />
                        <button className="flex-1 text-sm text-gray-400 text-left hover:text-white transition-colors truncate" onClick={() => handleSelect(s)}>{s}</button>
                        <button onClick={(e) => deleteRecent(e, s)} className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-white/10 transition-all">
                          <FaTimes className="text-gray-500 text-[10px]" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});


// ─────────────────────────────────────────────────────────────────
// HELPER: NumberCounter (Animated number increment)
// ─────────────────────────────────────────────────────────────────
const NumberCounter = ({ value, suffix = "" }) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    let start = 0;
    const end = parseInt(value) || 0;
    if (isNaN(end)) { setDisplayValue(value); return; }
    
    const duration = 1500;
    const increment = end / (duration / 16);
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(start));
      }
    }, 16);
    
    return () => clearInterval(timer);
  }, [value]);

  return <span>{displayValue}{suffix}</span>;
};

// ─────────────────────────────────────────────────────────────────
// COMPONENT: LiveStatsBar (NEW)
// ─────────────────────────────────────────────────────────────────
const LiveStatsBar = memo(({ totalEditors, onlineCount }) => {
  const stats = [
    { label: "Talent", value: totalEditors || 850, suffix: "+",  Icon: FaUsers,       color: "text-violet-400", bg: "bg-violet-500/10", glow: "shadow-violet-500/20" },
    { label: "Online Now", value: onlineCount || 43, suffix: "",  Icon: FaBolt,        color: "text-emerald-400", bg: "bg-emerald-500/10", pulse: true, glow: "shadow-emerald-500/20" },
    { label: "Avg Response", value: "< 2hr", suffix: "",         Icon: HiOutlineClock, color: "text-blue-400",   bg: "bg-blue-500/10", isText: true, glow: "shadow-blue-500/20" },
    { label: "Completed", value: 12, suffix: " today",    Icon: HiOutlineChartBar, color: "text-amber-400", bg: "bg-amber-500/10", glow: "shadow-amber-500/20" },
  ];

  return (
    <div className="grid grid-cols-4 gap-2.5 mb-6">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: i * 0.08, type: "spring", stiffness: 100 }}
          whileHover={{ y: -2, backgroundColor: "rgba(255,255,255,0.04)" }}
          className={`group rounded-2xl p-3 border border-white/5 text-center relative overflow-hidden backdrop-blur-md shadow-lg will-change-transform transform-gpu ${stat.glow}`}
          style={{ background: "rgba(255,255,255,0.02)", transform: "translateZ(0)", willChange: "transform" }}
        >
          {/* Subtle background glow */}
          <div className={`absolute top-0 right-0 w-12 h-12 rounded-full blur-xl sm:blur-2xl opacity-10 group-hover:opacity-20 transition-opacity ${stat.bg}`} style={{ transform: "translateZ(0)", willChange: "transform" }} />
          
          <div className={`w-8 h-8 rounded-xl ${stat.bg} flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform`}>
            <stat.Icon className={`text-xs ${stat.color}`} />
            {stat.pulse && (
              <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]">
                <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75" />
              </span>
            )}
          </div>
          <div className={`text-[13px] font-black tracking-tight ${stat.color} leading-none mb-1`}>
            {stat.isText ? stat.value : <NumberCounter value={stat.value} suffix={stat.suffix} />}
          </div>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black opacity-60 group-hover:opacity-100 transition-opacity">
            {stat.label}
          </p>
        </motion.div>
      ))}
    </div>
  );
});


// ─────────────────────────────────────────────────────────────────
// COMPONENT: EditorStories (NEW — Instagram-style showreel rings)
// ─────────────────────────────────────────────────────────────────
const EditorStories = memo(({ editors, onViewStory, onSeeAll }) => {
  const storyItems = useMemo(() => {
    const realStories = (editors || []).slice(0, 10).map((ed, i) => ({
      id: ed._id,
      name: ed.user?.name?.split(' ')[0] || "Editor",
      avatar: ed.user?.profilePicture || null,
      hasNew: true,
      gradient: STATIC_STORIES[i % STATIC_STORIES.length].gradient,
      userId: ed.user?._id,
    }));
    const staticFill = STATIC_STORIES.slice(realStories.length, 8);
    return [...realStories, ...staticFill];
  }, [editors]);

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/20">
            <FaPlay className="text-white text-[9px] ml-0.5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-white leading-none">Editor Showreels</h2>
            <p className="text-[10px] text-gray-500 mt-1">Watch their latest masterpieces</p>
          </div>
        </div>
        <button onClick={onSeeAll} className="text-[10px] font-bold text-violet-400 hover:text-violet-300 transition-colors uppercase tracking-widest">
          See All
        </button>
      </div>
      
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-1 px-1" style={{ scrollbarWidth: "none" }}>
        {storyItems.map((story, i) => (
          <motion.button
            key={story.id}
            initial={{ opacity: 0, scale: 0.8, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ delay: i * 0.05, type: "spring", damping: 12 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onViewStory?.(story)}
            className="flex-shrink-0 flex flex-col items-center gap-2 group"
          >
            <div className="relative p-0.5">
              {/* Pulsing Outer Ring - Optimized with CSS animation for zero main-thread overhead */}
              {story.hasNew && (
                <div
                  className={`absolute inset-0 rounded-full bg-gradient-to-tr ${story.gradient} opacity-80 animate-spin-slow will-change-transform transform-gpu`}
                  style={{ transform: "translateZ(0)", animationDuration: "8s" }}
                />
              )}
              
              <div className="relative w-[72px] h-[72px] rounded-full p-[3px] bg-[#0a0a0c] z-10">
                <div className={`w-full h-full rounded-full p-0.5 ${story.hasNew ? `bg-gradient-to-br ${story.gradient}` : "bg-gray-800"}`}>
                  <div className="w-full h-full rounded-full border-[3px] border-[#0a0a0c] overflow-hidden bg-gray-900 group-hover:border-transparent transition-all duration-300">
                    {story.avatar
                      ? <img src={story.avatar} alt={story.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      : (
                        <div className={`w-full h-full flex items-center justify-center text-white font-black text-xl bg-gradient-to-br ${story.gradient} opacity-80`}>
                          {story.name.charAt(0)}
                        </div>
                      )
                    }
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              {story.hasNew && (
                <div className="absolute bottom-0 right-0 z-20 bg-gradient-to-r from-pink-500 to-rose-500 px-1.5 py-0.5 rounded-full border-2 border-[#0a0a0c] shadow-lg">
                  <span className="text-[7px] font-black text-white uppercase italic">Live</span>
                </div>
              )}
            </div>
            <span className="text-[11px] text-gray-400 font-bold group-hover:text-white transition-colors truncate w-20 text-center uppercase tracking-tighter">
              {story.name}
            </span>
          </motion.button>
        ))}
        
        {/* End Placeholder / See More */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onSeeAll}
          className="flex-shrink-0 flex flex-col items-center gap-2 group"
        >
          <div className="w-[76px] h-[76px] rounded-full border-2 border-dashed border-white/10 flex items-center justify-center group-hover:border-violet-500/40 group-hover:bg-violet-500/5 transition-all">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-violet-500 group-hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all">
              <FaChevronRight className="text-gray-500 group-hover:text-white text-sm" />
            </div>
          </div>
          <span className="text-[11px] text-gray-500 font-bold uppercase tracking-tighter">View All</span>
        </motion.button>
      </div>
    </div>
  );
});


// ─────────────────────────────────────────────────────────────────
// COMPONENT: TrendingSkills (NEW)
// ─────────────────────────────────────────────────────────────────
const TrendingSkills = memo(({ onSelectSkill, activeSkills }) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 bg-orange-500/20 rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/10">
            <FaFire className="text-orange-400 text-[10px]" />
          </div>
          <div>
            <h2 className="text-sm font-black text-white leading-none">Market Trends</h2>
            <p className="text-[10px] text-gray-500 mt-1">High demand skills right now</p>
          </div>
        </div>
        <motion.div
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="flex items-center gap-1.5 bg-orange-500/10 px-2.5 py-1 rounded-full border border-orange-500/20"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-orange-500 sm-pulse" />
          <span className="text-[9px] text-orange-400 font-black tracking-widest uppercase">Live data</span>
        </motion.div>
      </div>

      <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: "none" }}>
        {STATIC_TRENDING_SKILLS.map((item, i) => {
          const isActive = activeSkills?.includes(item.skill);
          return (
            <motion.button
              key={item.skill}
              initial={{ opacity: 0, scale: 0.9, x: 10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onSelectSkill?.(item.skill)}
              className={`flex-shrink-0 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-[12px] font-black transition-all border shadow-sm will-change-transform transform-gpu ${
                isActive
                  ? "bg-gradient-to-r from-orange-500 to-red-600 text-white border-transparent shadow-orange-500/40"
                  : "bg-white/5 text-gray-300 border-white/10 hover:border-orange-500/40 hover:bg-orange-500/5"
              }`}
            >
              <div className={`w-5 h-5 rounded-md flex items-center justify-center ${isActive ? "bg-white/20" : "bg-orange-500/10"}`}>
                <FaBolt className={isActive ? "text-white text-[10px]" : "text-orange-400 text-[10px]"} />
              </div>
              
              <div className="flex flex-col items-start leading-tight">
                <span>{item.skill}</span>
                <span className={`text-[9px] font-bold ${isActive ? "text-white/70" : "text-emerald-400"}`}>
                  {item.growth} <span className="opacity-60 text-[8px] font-medium text-gray-500 uppercase ml-0.5">Growth</span>
                </span>
              </div>
              
              {!isActive && item.hot && (
                <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                  <FaFire className="text-white text-[8px]" />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
});


// ─────────────────────────────────────────────────────────────────
// COMPONENT: SmartMatchCTA (NEW)
// ─────────────────────────────────────────────────────────────────
const SmartMatchCTA = memo(({ onClick }) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ scale: 1.01, y: -2 }}
    className="mb-8 relative overflow-hidden rounded-3xl cursor-pointer group shadow-2xl shadow-violet-500/10 will-change-transform transform-gpu"
    onClick={onClick}
    style={{
      background: "linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(59,130,246,0.1) 50%, rgba(16,185,129,0.12) 100%)",
      border: "1px solid rgba(139,92,246,0.25)",
      backdropFilter: "blur(8px) sm:blur(12px)",
      transform: "translateZ(0)",
      willChange: "transform"
    }}
  >
    {/* Moving Scan Line Animation - Optimized with CSS for GPU-only execution */}
    <div
      className="absolute inset-0 z-20 pointer-events-none overflow-hidden"
    >
      <div 
        className="w-full h-[2px] bg-gradient-to-r from-transparent via-violet-400/40 to-transparent animate-scan-line will-change-transform transform-gpu"
        style={{ boxShadow: "0 0 15px rgba(139,92,246,0.5)", transform: "translateZ(0)" }}
      />
    </div>

    {/* Animated Floating Orbs - CSS Optimized */}
    <div
      className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-violet-600/15 blur-xl sm:blur-3xl pointer-events-none animate-pulse-slow will-change-transform transform-gpu"
      style={{ transform: "translateZ(0)" }}
    />
    <div
      className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-emerald-500/15 blur-xl sm:blur-3xl pointer-events-none animate-pulse-slow will-change-transform transform-gpu"
      style={{ transform: "translateZ(0)", animationDelay: "2s", animationDuration: "12s" }}
    />

    <div className="relative p-6 flex items-center justify-between z-10">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-6 h-6 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-violet-500/30">
            <IoFlashSharp className="text-white text-[10px] animate-pulse" />
          </div>
          <span 
            className="text-[11px] font-black text-violet-400 uppercase tracking-[0.2em] animate-pulse will-change-opacity"
          >
            AI Matching Engine
          </span>
        </div>
        <h3 className="text-lg font-black text-white mb-1 tracking-tight">Meet your perfect editor in 60 seconds</h3>
        <p className="text-xs text-gray-400 font-medium">Our AI analyzes your project requirements and matches you with the top 1% of talent.</p>
        
        <div className="flex items-center gap-4 mt-4">
          <div className="flex -space-x-2">
            {[1,2,3].map(i => (
              <div key={i} className="w-6 h-6 rounded-full border-2 border-[#0a0a0c] bg-gray-800" />
            ))}
          </div>
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Matched 500+ times today</span>
        </div>
      </div>
      
      <div className="flex-shrink-0 ml-6">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-14 h-14 rounded-2xl bg-white text-black flex items-center justify-center shadow-2xl shadow-white/10 group-hover:bg-violet-500 group-hover:text-white transition-all duration-300"
        >
          <FaArrowRight className="text-xl" />
        </motion.button>
      </div>
    </div>
  </motion.div>
));


// ─────────────────────────────────────────────────────────────────
// COMPONENT: SpecialtyBrowse (NEW)
// ─────────────────────────────────────────────────────────────────
const SpecialtyBrowse = memo(({ onSelect }) => {
  const specialties = [
    { id: "youtube", label: "YouTube Growth", icon: FaYoutube, color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20" },
    { id: "commercial", label: "Commercial Ads", icon: FaTv, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
    { id: "wedding", label: "Wedding Films", icon: FaHeart, color: "text-pink-500", bg: "bg-pink-500/10", border: "border-pink-500/20" },
    { id: "gaming", label: "Gaming Edits", icon: FaGamepad, color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20" },
    { id: "vlog", label: "Travel Vlogs", icon: FaMapMarkerAlt, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    { id: "short", label: "Shorts/Reels", icon: FaMobileAlt, color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20" },
  ];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Browse by Specialty</h2>
        <button className="text-[10px] text-violet-400 font-bold hover:text-white transition-colors">See All categories</button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
        {specialties.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -5, scale: 1.02 }}
            onClick={() => onSelect(item.label)}
            className={`cursor-pointer rounded-2xl p-4 border ${item.bg} ${item.border} backdrop-blur-md transition-all group overflow-hidden relative shadow-lg hover:shadow-2xl hover:shadow-black/40 will-change-transform transform-gpu`}
            style={{ transform: "translateZ(0)", willChange: "transform" }}
          >
            {/* Glossy overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 -translate-x-full group-hover:translate-x-full transition-all duration-700" />
            
            <div className={`w-10 h-10 rounded-xl bg-black/40 flex items-center justify-center mb-3 shadow-inner ${item.color}`}>
              <item.icon className="text-xl group-hover:scale-120 transition-transform duration-500" />
            </div>
            <h3 className="text-[12px] font-black text-white leading-tight group-hover:text-violet-400 transition-colors">{item.label}</h3>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Explore</span>
              <FaChevronRight className="text-[8px] text-gray-600 group-hover:translate-x-1 group-hover:text-violet-400 transition-all font-black text-white leading-tight px-1" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
});

// ─────────────────────────────────────────────────────────────────
// COMPONENT: TopRatedSection (Enhanced)
// ─────────────────────────────────────────────────────────────────
const TopRatedSection = memo(({ editors, navigate }) => {
  const topEditors = useMemo(() => {
    return [...(editors || [])]
      .filter(e => e.ratingStats?.totalReviews > 0)
      .sort((a, b) => (b.ratingStats?.averageRating || 0) - (a.ratingStats?.averageRating || 0))
      .slice(0, 3);
  }, [editors]);

  if (topEditors.length < 2) return null;

  const medals = [
    { rank: 1, label: "🥇", bg: "from-yellow-400/20 to-yellow-600/10", border: "border-yellow-500/40", textColor: "text-yellow-400", shadow: "shadow-yellow-500/20" },
    { rank: 2, label: "🥈", bg: "from-slate-300/15 to-slate-500/10", border: "border-slate-400/30", textColor: "text-slate-300", shadow: "shadow-slate-400/20" },
    { rank: 3, label: "🥉", bg: "from-orange-500/15 to-amber-700/10", border: "border-orange-600/30", textColor: "text-orange-400", shadow: "shadow-orange-500/20" },
  ];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-yellow-500/10 rounded-xl flex items-center justify-center border border-yellow-500/20">
            <FaStar className="text-yellow-400 text-xs animate-pulse" />
          </div>
          <h2 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Hall of Fame</h2>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {topEditors.map((editor, i) => {
          const medal = medals[i];
          return (
            <motion.div
              key={editor._id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -5 }}
              onClick={() => navigate(`/public-profile/${editor.user?._id}`)}
              className={`relative rounded-3xl p-4 text-center cursor-pointer border bg-gradient-to-b ${medal.bg} ${medal.border} backdrop-blur-xl transition-all shadow-xl ${medal.shadow} group overflow-hidden will-change-transform transform-gpu`}
            >
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                 <FaStar className="text-4xl text-white rotate-12" />
              </div>
              <span className="text-2xl absolute -top-3 left-1/2 -translate-x-1/2 z-20 transition-transform group-hover:scale-125 duration-500">{medal.label}</span>
              <div className="relative mt-3 mb-3">
                <div className={`absolute -inset-1 rounded-full bg-gradient-to-b ${medal.bg} ${medal.border} opacity-50`} />
                <img
                  src={editor.user?.profilePicture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                  alt={editor.user?.name}
                  className="w-14 h-14 rounded-full object-cover mx-auto relative border-2 border-white/20 z-10"
                />
              </div>
              <p className="text-[12px] font-black text-white truncate group-hover:text-yellow-400 transition-colors tracking-tight">{editor.user?.name?.split(' ')[0]}</p>
              <div className="flex items-center justify-center gap-1.5 mt-2 bg-black/30 w-fit mx-auto px-2.5 py-1 rounded-full backdrop-blur-md border border-white/5">
                <FaStar className={`text-[9px] ${medal.textColor}`} />
                <span className={`text-[11px] font-black ${medal.textColor}`}>
                  {editor.ratingStats.averageRating.toFixed(1)}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
});

// ─────────────────────────────────────────────────────────────────
// COMPONENT: NewJoinersSection (Enhanced)
// ─────────────────────────────────────────────────────────────────
const NewJoinersSection = memo(({ editors, navigate }) => {
  const newJoiners = useMemo(() => {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return [...(editors || [])]
      .filter(e => new Date(e.user?.createdAt).getTime() > oneWeekAgo)
      .slice(0, 8);
  }, [editors]);

  if (newJoiners.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
            <HiSparkles className="text-emerald-400 text-xs" />
          </div>
          <h2 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Fresh Talent</h2>
          <span className="text-[9px] text-emerald-400 bg-emerald-500/5 px-2 py-0.5 rounded-lg font-black border border-emerald-500/10 uppercase tracking-tighter">
            {newJoiners.length} active
          </span>
        </div>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-1" style={{ scrollbarWidth: "none" }}>
        {newJoiners.map((editor, i) => (
          <motion.div
            key={editor._id}
            initial={{ opacity: 0, scale: 0.9, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -8 }}
            onClick={() => navigate(`/public-profile/${editor.user?._id}`)}
            className="flex-shrink-0 w-32 rounded-3xl p-3 text-center cursor-pointer border border-white/5 hover:border-emerald-500/40 transition-all hover:bg-emerald-500/5 shadow-lg group will-change-transform transform-gpu"
            style={{ background: "rgba(255,255,255,0.02)" }}
          >
            <div className="relative mb-3">
              <div className="absolute -inset-0.5 rounded-full bg-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity blur-sm" />
              <img
                src={editor.user?.profilePicture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                alt={editor.user?.name}
                className="w-16 h-16 rounded-full object-cover mx-auto relative border-2 border-emerald-500/30 group-hover:scale-105 transition-transform duration-500"
              />
              <span className="absolute -top-1 -right-1 text-[8px] font-black bg-emerald-500 text-white px-2 py-1 rounded-full leading-none shadow-lg shadow-emerald-500/30">NEW</span>
            </div>
            <p className="text-[12px] font-black text-white truncate leading-tight group-hover:text-emerald-400 transition-colors">{editor.user?.name?.split(' ')[0]}</p>
            <p className="text-[9px] text-gray-500 font-bold uppercase truncate mt-1 tracking-tighter">{editor.skills?.[0] || "Editor"}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
});


// ─────────────────────────────────────────────────────────────────
// COMPONENT: EditorCard (Enhanced)
// ─────────────────────────────────────────────────────────────────
const EditorCard = memo(({ editor, navigate, searchQuery, isSaved, onToggleFavorite }) => {
  const [hovered, setHovered] = useState(false);
  const hasRatings = editor.ratingStats?.totalReviews > 0;
  const rating = hasRatings ? editor.ratingStats.averageRating.toFixed(1) : null;
  const reviewCount = hasRatings ? editor.ratingStats.totalReviews : 0;
  const suvixScore = editor.user?.suvixScore;
  const showSuvixScore = suvixScore?.isEligible && suvixScore?.total > 0;
  const availability = editor.user?.availability || { status: "available" };
  const isBusy = availability.status === "busy";
  const isSmallOnly = availability.status === "small_only";
  
  const availabilityConfig = isBusy
    ? { label: "Busy", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", dot: "bg-amber-500", ring: "from-amber-500/0 via-amber-500/40 to-amber-500/0" }
    : isSmallOnly
    ? { label: "Limited", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", dot: "bg-blue-500", ring: "from-blue-500/0 via-blue-500/40 to-blue-500/0" }
    : { label: "Online", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", dot: "bg-emerald-500", ring: "from-emerald-500/0 via-emerald-400/60 to-emerald-500/0" };

  return (
    <motion.div
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={() => navigate(`/public-profile/${editor.user?._id}`)}
      className="group relative rounded-[2.5rem] overflow-hidden cursor-pointer border transition-all duration-500 will-change-transform transform-gpu"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8 }}
      style={{
        background: hovered
          ? "linear-gradient(165deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)"
          : "rgba(255,255,255,0.03)",
        borderColor: hovered ? "rgba(139,92,246,0.35)" : "rgba(255,255,255,0.08)",
        backdropFilter: "blur(20px)",
        boxShadow: hovered 
          ? "0 30px 60px -12px rgba(0,0,0,0.6), 0 0 0 1px rgba(139,92,246,0.15), inset 0 0 20px rgba(139,92,246,0.05)" 
          : "0 10px 30px -10px rgba(0,0,0,0.3)",
      }}
    >
      {/* Premium Suvix Score Badge (Floating Metallic) */}
      {showSuvixScore && (
        <div className="absolute top-4 left-4 z-20">
          <motion.div
            initial={false}
            animate={{ scale: hovered ? 1.05 : 1 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-2xl shadow-xl shadow-black/40 border border-white/20 overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${TIER_COLOR[suvixScore.tier]} 0%, ${TIER_COLOR[suvixScore.tier]}dd 100%)`,
            }}
          >
            {/* Glossy overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/30 to-white/0 opacity-40 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            
            <div className="w-5 h-5 rounded-full bg-black/20 flex items-center justify-center backdrop-blur-md">
              <span className="text-[10px] font-black text-white">{suvixScore.tier?.charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-black text-white leading-none">{suvixScore.total}</span>
              <span className="text-[7px] font-black text-white/70 uppercase tracking-tighter">SuviX Score</span>
            </div>
          </motion.div>
        </div>
      )}

      {/* Save Button (Glassmorphism) */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggleFavorite(e); }}
        className="absolute top-4 right-4 z-20 w-10 h-10 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center transition-all hover:bg-violet-500 hover:border-transparent active:scale-90 group/heart shadow-xl"
      >
        {isSaved
          ? <FaHeart className="text-pink-500 text-sm drop-shadow-[0_0_8px_rgba(236,72,153,0.6)]" />
          : <FaRegHeart className="text-white/60 text-sm group-hover/heart:text-white transition-colors" />
        }
      </button>

      {/* Header Visual */}
      <div className="h-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 via-indigo-600/10 to-transparent" />
        {/* Animated dynamic gradient shapes - CSS Optimized */}
        <div 
          className="absolute -top-10 -left-10 w-32 h-32 rounded-full bg-violet-500/20 blur-2xl animate-pulse-slow will-change-transform transform-gpu" 
          style={{ transform: "translateZ(0)" }}
        />
        <div 
          className="absolute -bottom-10 -right-10 w-28 h-28 rounded-full bg-emerald-500/15 blur-2xl animate-pulse-slow will-change-transform transform-gpu" 
          style={{ transform: "translateZ(0)", animationDelay: "1s", animationDuration: "8s" }}
        />
      </div>

      {/* Content Section */}
      <div className="px-5 pb-6 -mt-10 relative z-10">
        <div className="flex items-end justify-between mb-4">
          {/* Avatar with Status Ring - CSS Animated */}
          <div className="relative">
            {availability.status !== 'busy' && (
              <div
                className={`absolute -inset-[3px] rounded-[1.4rem] bg-gradient-to-r ${availabilityConfig.ring} opacity-80 animate-spin-slow will-change-transform transform-gpu`}
                style={{ transform: "translateZ(0)", animationDuration: "6s" }}
              />
            )}
            <div className="relative w-20 h-20 rounded-[1.2rem] p-0.5 bg-[#0a0a0c]">
              <div className="w-full h-full rounded-[1.1rem] overflow-hidden border-2 border-white/5">
                <img
                  src={editor.user?.profilePicture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                  alt={editor.user?.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
              </div>
            </div>
            {/* Status dot */}
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#0a0a0c] rounded-full flex items-center justify-center">
              <div className={`w-2.5 h-2.5 rounded-full ${availabilityConfig.dot} shadow-[0_0_8px_currentColor]`} />
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5">
             <div className="flex items-center gap-1.5 bg-white/5 backdrop-blur-sm border border-white/10 px-3 py-1.5 rounded-xl shadow-lg">
                <FaStar className="text-amber-400 text-[10px]" />
                <span className="text-[12px] font-black text-white">{rating || "New"}</span>
                {hasRatings && (
                  <span className="text-[9px] text-gray-500 font-bold ml-0.5">{reviewCount}</span>
                )}
             </div>
             {editor.experience && (
               <span className="text-[10px] font-black text-violet-400 bg-violet-500/10 px-2.5 py-1 rounded-lg border border-violet-500/20 uppercase tracking-tighter">
                 {editor.experience}
               </span>
             )}
          </div>
        </div>

        {/* Info Area */}
        <div className="space-y-1 mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-black text-white tracking-tight leading-none group-hover:text-violet-400 transition-colors">
              {highlightText(editor.user?.name, searchQuery)}
            </h3>
            {editor.verified && (
              <MdVerified className="text-blue-400 text-base" title="Verified Professional" />
            )}
          </div>
          
          <div className="flex items-center gap-2 text-gray-400 text-[11px] font-bold uppercase tracking-wider">
            <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">{editor.user?.role || "Video Editor"}</span>
            {editor.location?.country && (
              <div className="flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-gray-600" />
                <FaMapMarkerAlt className="text-gray-600 text-[10px]" />
                <span>{highlightText(editor.location.country, searchQuery)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Skills Strip */}
        {editor.skills?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {editor.skills.filter(Boolean).slice(0, 3).map((skill, idx) => (
              <span key={idx} className="px-3 py-1.5 bg-white/5 hover:bg-violet-500/10 hover:border-violet-500/30 text-gray-300 hover:text-violet-300 border border-white/8 rounded-xl text-[10px] font-black transition-all cursor-default uppercase">
                {skill}
              </span>
            ))}
            {editor.skills.filter(Boolean).length > 3 && (
              <span className="px-3 py-1.5 bg-white/5 text-gray-500 border border-white/8 rounded-xl text-[10px] font-bold">
                +{editor.skills.filter(Boolean).length - 3}
              </span>
            )}
          </div>
        )}

        {/* Bottom Action Area */}
        <div className="relative h-12">
          {/* Default Price/Stats (Optional placeholder) */}
          <div className={`absolute inset-0 flex items-center justify-between transition-all duration-300 ${hovered ? "opacity-0 -translate-y-2 pointer-events-none" : "opacity-100"}`}>
            <div className="flex flex-col">
              <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Starting from</span>
              <span className="text-sm font-black text-white">₹2,499<span className="text-[10px] text-gray-500 font-medium ml-1">/project</span></span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400">
               <HiOutlineBadgeCheck className="text-sm" />
               <span className="text-[10px] font-black uppercase">Top 1%</span>
            </div>
          </div>

          {/* Hover Button */}
          <motion.div
            initial={false}
            animate={{ 
              opacity: hovered ? 1 : 0,
              y: hovered ? 0 : 20
            }}
            className="absolute inset-0 pointer-events-none group-hover:pointer-events-auto"
          >
            <button className="w-full h-full bg-white text-black rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-white/10 hover:bg-violet-500 hover:text-white transition-all duration-300 flex items-center justify-center gap-2 overflow-hidden relative group/btn">
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
              
              <span>View Portfolio</span>
              <FaArrowRight className="text-xs group-hover/btn:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
});


// ─────────────────────────────────────────────────────────────────
// COMPONENT: ExpandableFilters (Enhanced)
// ─────────────────────────────────────────────────────────────────
const ExpandableFilters = memo(({ visible, filters, setFilters, filterOptions }) => {
  if (!visible) return null;
  return (
    <motion.div
      initial={{ height: 0, opacity: 0, y: -10 }}
      animate={{ height: "auto", opacity: 1, y: 0 }}
      exit={{ height: 0, opacity: 0, y: -10 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="overflow-hidden mb-6"
    >
      <div className="rounded-[2.5rem] p-8 border border-white/10 shadow-2xl overflow-hidden relative" style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(24px)" }}>
        {/* Decorative background blur */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-violet-500/10 blur-[80px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none" />

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
          {/* Availability */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] px-1">Availability</h3>
            <div className="flex flex-col gap-2">
              {[
                { id: "available",  label: "Online Now",  color: "bg-emerald-500", border: "border-emerald-500/20", active: "bg-emerald-500/20 border-emerald-500 text-emerald-400" },
                { id: "small_only", label: "Small Projects", color: "bg-blue-500",    border: "border-blue-500/20",    active: "bg-blue-500/20 border-blue-500 text-blue-400" },
                { id: "busy",       label: "Busy",           color: "bg-amber-500",   border: "border-amber-500/20",   active: "bg-amber-500/20 border-amber-500 text-amber-400" },
              ].map(s => {
                const isActive = filters.availability.includes(s.id);
                return (
                  <motion.button
                    key={s.id}
                    whileHover={{ x: 5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setFilters(prev => ({
                      ...prev,
                      availability: isActive ? prev.availability.filter(x => x !== s.id) : [...prev.availability, s.id]
                    }))}
                    className={`px-4 py-3 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-between border ${
                      isActive ? s.active : `bg-white/5 text-gray-400 border-white/5 hover:border-white/20 hover:text-white`
                    }`}
                  >
                    <div className="flex items-center gap-3">
                       <span className={`w-1.5 h-1.5 rounded-full ${isActive ? s.color : "bg-gray-600"} shadow-[0_0_8px_currentColor]`} />
                       {s.label}
                    </div>
                    {isActive && <div className={`w-1 h-1 rounded-full ${s.color}`} />}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Experience Level */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] px-1">Experience</h3>
            <div className="grid grid-cols-2 gap-2">
              {["0-6 mo","6-12 mo","1-2 yr","2-3 yr","3-5 yr","5+ yr"].map(exp => {
                const isActive = filters.experience === exp;
                return (
                  <motion.button
                    key={exp}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setFilters(prev => ({ ...prev, experience: isActive ? "" : exp }))}
                    className={`px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                      isActive ? "bg-violet-500 border-violet-400 text-white shadow-lg shadow-violet-500/30" : "bg-white/5 text-gray-500 border-white/5 hover:border-white/20"
                    }`}
                  >
                    {exp}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Popular Skills */}
          <div className="space-y-4 lg:col-span-2">
            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] px-1">Expertise Filters</h3>
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto scrollbar-hide pr-2">
              {(filterOptions.skills || ["Motion Graphics", "Color Grading", "Short-form", "Wedding", "E-learning", "Commercial", "YouTube", "Animation", "Logo Intro"]).map(skill => {
                const isActive = filters.skills.includes(skill);
                return (
                  <motion.button
                    key={skill}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setFilters(prev => ({
                      ...prev,
                      skills: isActive ? prev.skills.filter(s => s !== skill) : [...prev.skills, skill]
                    }))}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                      isActive ? "bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/20" : "bg-white/5 text-gray-500 border-white/5 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {skill}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});


// ─────────────────────────────────────────────────────────────────
// COMPONENT: EditorCardSkeleton
// ─────────────────────────────────────────────────────────────────
const EditorCardSkeleton = () => (
  <div className="rounded-[2.5rem] overflow-hidden border border-white/10 relative animate-pulse" style={{ background: "rgba(255,255,255,0.03)" }}>
    <div className="h-28 bg-white/5 relative overflow-hidden">
       <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
    </div>
    <div className="px-6 pb-6 -mt-10 relative z-10">
      <div className="flex items-end justify-between mb-4">
        <div className="w-20 h-20 rounded-[1.2rem] bg-[#0a0a0c] p-0.5">
          <div className="w-full h-full rounded-[1.1rem] bg-white/10" />
        </div>
        <div className="flex flex-col items-end gap-2">
           <div className="h-8 w-20 bg-white/5 rounded-xl" />
           <div className="h-5 w-16 bg-white/5 rounded-lg" />
        </div>
      </div>
      <div className="space-y-3 mb-6">
        <div className="h-6 w-3/4 bg-white/10 rounded-lg" />
        <div className="h-4 w-1/2 bg-white/5 rounded-md" />
      </div>
      <div className="flex gap-2 mb-6">
        <div className="h-8 w-20 bg-white/5 rounded-xl" />
        <div className="h-8 w-24 bg-white/5 rounded-xl" />
      </div>
      <div className="h-12 bg-white/10 rounded-2xl w-full" />
    </div>
  </div>
);


// ─────────────────────────────────────────────────────────────────
// MAIN COMPONENT: ExploreEditors
// ─────────────────────────────────────────────────────────────────
const ExploreEditors = ({ initialTab = "editors", isTab = false, isSwiping = false }) => {
  const { backendURL, user } = useAppContext();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setIsReady(true), 300);
    return () => clearTimeout(t);
  }, []);
  const navigate = useNavigate();

  // Tab state synchronization
  const activeTabInternal = useHomeStore(s => s.exploreTab);
  const setExploreTabInternal = useHomeStore(s => s.setExploreTab);

  // Sync with initialTab only once on mount to avoid infinite loops
  useEffect(() => {
    if (initialTab && activeTabInternal !== initialTab) {
      setExploreTabInternal(initialTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const activeTab = useMemo(() => isTab ? initialTab : activeTabInternal, [isTab, initialTab, activeTabInternal]);
  const setActiveTab = setExploreTabInternal;

  // Editors state
  const [editors, setEditors] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 1 });
  const [filterOptions, setFilterOptions] = useState({ skills: [], languages: [], countries: [] });
  const [filters, setFilters] = useState({
    skills: [], languages: [], experience: "", country: "", availability: [], sortBy: "relevance"
  });
  const [savedEditors, setSavedEditors] = useState([]);

  // Infinity scroll sentinel
  const sentinelRef = useRef(null);

  // Fetch saved editors
  useEffect(() => {
    if (!user?.token) return;
    axios.get(`${backendURL}/api/user/saved-editors`, {
      headers: { Authorization: `Bearer ${user.token}` }
    }).then(res => {
      if (res.data.success) setSavedEditors(res.data.savedEditors.map(e => e._id));
    }).catch(() => {});
  }, [user, backendURL]);

  // Main editors query
  const {
    data: editorsResponse,
    isLoading: editorsLoading,
    isFetching: editorsFetching,
    isError,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ["explore", "editors", { search: searchQuery, page: pagination.page, filters }],
    queryFn: async () => {
      const token = user?.token || JSON.parse(localStorage.getItem("user") || "{}").token;
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: "12",
        ...(searchQuery && { search: searchQuery }),
        ...(filters.availability.length > 0 && { availability: filters.availability.join(",") }),
        ...(filters.skills.length > 0 && { skills: filters.skills.join(",") }),
        ...(filters.languages.length > 0 && { languages: filters.languages.join(",") }),
        ...(filters.experience && { experience: filters.experience }),
        ...(filters.country && { country: filters.country }),
        sortBy: filters.sortBy,
      });
      const res = await axios.get(`${backendURL}/api/explore/editors?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      return res.data;
    },
    enabled: !!backendURL,
    keepPreviousData: true,
  });

  useEffect(() => {
    if (editorsResponse) {
      setEditors(editorsResponse.editors || []);
      setPagination(editorsResponse.pagination || { page: 1, limit: 12, total: 0, pages: 1 });
      if (editorsResponse.filters) setFilterOptions(editorsResponse.filters);
    }
  }, [editorsResponse]);

  const loading = editorsLoading || (editorsFetching && editors.length === 0);

  // Infinite scroll: load more when sentinel is visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !editorsFetching && pagination.page < pagination.pages) {
          setPagination(p => ({ ...p, page: p.page + 1 }));
        }
      },
      { threshold: 0.1 }
    );
    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [editorsFetching, pagination.page, pagination.pages]);

  // Accumulate editors across pages (infinite scroll)
  const [allEditors, setAllEditors] = useState([]);
  useEffect(() => {
    if (editorsResponse?.editors) {
      if (pagination.page === 1) {
        setAllEditors(editorsResponse.editors);
      } else {
        setAllEditors(prev => {
          const ids = new Set(prev.map(e => e._id));
          const newOnes = editorsResponse.editors.filter(e => !ids.has(e._id));
          return [...prev, ...newOnes];
        });
      }
    }
  }, [editorsResponse, pagination.page]);

  // Reset to page 1 when filters/search change
  useEffect(() => {
    setPagination(p => ({ ...p, page: 1 }));
    setAllEditors([]);
  }, [searchQuery, filters]);

  const toggleSkillFilter = useCallback((skill) => {
    setFilters(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  }, []);

  const toggleFavorite = useCallback(async (e, editorId) => {
    e.stopPropagation();
    if (!user?.token) { toast.info("Please login to save editors"); return; }
    const isSaved = savedEditors.includes(editorId);
    setSavedEditors(prev => isSaved ? prev.filter(id => id !== editorId) : [...prev, editorId]);
    try {
      const res = await axios.post(`${backendURL}/api/user/saved-editors/${editorId}`, {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      toast.success(res.data.message);
    } catch {
      toast.error("Failed to update favorites");
      setSavedEditors(prev => isSaved ? [...prev, editorId] : prev.filter(id => id !== editorId));
    }
  }, [user, backendURL, savedEditors]);

  const clearAllFilters = useCallback(() => {
    setFilters({ skills: [], languages: [], experience: "", country: "", availability: [], sortBy: "relevance" });
    setSearchQuery("");
  }, []);

  const activeFilterCount = useMemo(() => {
    return filters.skills.length + filters.languages.length +
      (filters.experience ? 1 : 0) + (filters.country ? 1 : 0) + filters.availability.length;
  }, [filters]);

  // ─── Error State ───
  if (isError) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center px-4">
        <div className="text-center max-w-sm p-8 rounded-2xl border border-white/10" style={{ background: "rgba(255,255,255,0.025)" }}>
          <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Something went wrong</h3>
          <p className="text-gray-500 text-sm mb-5">{queryError?.message || "Error loading editors"}</p>
          <button onClick={() => refetch()} className="inline-flex items-center gap-2 bg-violet-500 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-violet-600 transition-all text-sm">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ─── RENDER ───
  if (!isReady) {
    return (
      <div className={`p-5 space-y-8 animate-pulse ${isTab ? "" : "bg-black min-h-screen"}`}>
        {/* Banner Skeleton */}
        <div className="h-44 bg-white/5 rounded-[2rem] w-full" />
        
        {/* Category Pill Skeletons */}
        <div className="flex gap-2 overflow-hidden">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-8 w-24 bg-white/5 rounded-full shrink-0" />
          ))}
        </div>

        {/* Editor Cards Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-48 bg-white/5 rounded-[2.5rem] w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen px-3 py-2 pb-24 ${isSwiping ? "pointer-events-none" : ""}`} style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ═══ TAB SWITCHER (Hidden if in unified Explore tab) ═══ */}
      {!isTab && (
        <div className="flex justify-center mb-4">
          <div className="flex p-1 rounded-full" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)" }}>
            {[
              { id: "editors", label: "Editors",  Icon: FaUsers },
              { id: "gigs",    label: "Gigs",     Icon: FaShoppingBag },
            ].map(tab => (
              <motion.button
                key={tab.id}
                whileTap={{ scale: 0.94 }}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-bold transition-all ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/30"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <tab.Icon className="text-[10px]" />
                {tab.label}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* ═══ TAB CONTENT ═══ */}
      <AnimatePresence mode="wait">
        {activeTab === "gigs" ? (
          <motion.div key="gigs" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            <ExploreGigs />
          </motion.div>
        ) : (
          <motion.div key="editors" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>

            {/* 1. HERO ADS BANNER (Hidden in tab mode to reduce clutter) */}
            {!isTab && (
              <div className="mb-6">
                <CategoryBanner
                  location="banners:editors"
                  fallbackItems={[
                    { title: "Find Your Perfect Editor", description: "Connect with 850+ skilled professionals", mediaUrl: "/hero_banner_1_1766948130847.png", badge: "DISCOVER TALENT" },
                    { title: "Elite Pro Editors", description: "Hand-picked experts for premium projects", mediaUrl: "/hero_banner_2_1766948148873.png", badge: "PREMIUM" }
                  ]}
                />
              </div>
            )}

            {/* 2. AI SMART MATCH BANNER (Entry point) - Always visible */}
            <div className="mb-8 px-1">
               <SmartMatchBanner />
            </div>

            {/* 3. LIVE PLATFORM STATS */}
            <LiveStatsBar
              totalEditors={pagination.total}
              onlineCount={allEditors.filter(e => e.user?.availability?.status !== "busy").length}
            />

            {/* 4. DISCOVERY: BROWSE BY SPECIALTY */}
            {!searchQuery && activeFilterCount === 0 && (
              <SpecialtyBrowse onSelect={(skill) => toggleSkillFilter(skill)} />
            )}

            {/* 5. SEARCH & DISCOVERY ENGINE */}
            <div className="sticky top-0 z-40 bg-[#09090B]/80 backdrop-blur-md py-4 -mx-1 px-1">
              <ExploreSearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                onSearch={(q) => setSearchQuery(q)}
                activeFilterCount={activeFilterCount}
                onFilterToggle={() => setShowFilters(v => !v)}
              />
            </div>

            {/* 6. ADVANCED FILTERS (Sliding) */}
            <AnimatePresence>
              {showFilters && (
                <ExpandableFilters
                  visible={showFilters}
                  filters={filters}
                  setFilters={setFilters}
                  filterOptions={filterOptions}
                />
              )}
            </AnimatePresence>

            {/* 7. MARKET TRENDS (SKILLS) */}
            <TrendingSkills
              onSelectSkill={toggleSkillFilter}
              activeSkills={filters.skills}
            />

            {/* 8. TOP TALENT STORIES */}
            {!loading && allEditors.length > 0 && (
              <EditorStories
                editors={allEditors}
                onViewStory={(story) => story.userId && navigate(`/public-profile/${story.userId}`)}
              />
            )}

            {/* 9. HALL OF FAME (TOP RATED) */}
            {!searchQuery && activeFilterCount === 0 && (
              <TopRatedSection editors={allEditors} navigate={navigate} />
            )}

            {/* 10. CATEGORY QUICK-SWITCHER */}
            <div className="mb-8 relative mt-4">
              <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#09090B] to-transparent z-10 pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#09090B] to-transparent z-10 pointer-events-none" />
              <div className="flex gap-2.5 overflow-x-auto pb-4 px-1 scrollbar-hide snap-x" style={{ scrollbarWidth: "none" }}>
                {CATEGORY_PILLS.map((cat) => {
                  const isActive = cat.id === "all" ? filters.skills.length === 0 : filters.skills.includes(cat.label);
                  return (
                    <motion.button
                      key={cat.id}
                      whileTap={{ scale: 0.94 }}
                      onClick={() => {
                        if (cat.id === "all") setFilters(p => ({ ...p, skills: [] }));
                        else toggleSkillFilter(cat.label);
                      }}
                      className={`snap-start flex items-center gap-2 px-5 py-2.5 rounded-full text-[12px] font-black whitespace-nowrap transition-all border shadow-lg ${
                        isActive
                          ? `bg-gradient-to-r ${cat.active} text-white border-transparent shadow-violet-500/20`
                          : `bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white`
                      }`}
                    >
                      <cat.Icon className={`text-[10px] ${isActive ? "text-white" : cat.color}`} />
                      {cat.label}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* 11. FRESH TALENT SECTON */}
            {!searchQuery && activeFilterCount === 0 && (
              <NewJoinersSection editors={allEditors} navigate={navigate} />
            )}

            {/* 12. RESULTS HEADER */}
            <div className="flex items-center justify-between mb-6 px-1">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-violet-500/10 rounded-xl flex items-center justify-center border border-violet-500/20">
                  <FaUsers className="text-violet-400 text-xs" />
                </div>
                <div>
                  <h2 className="text-[12px] font-black text-white uppercase tracking-[0.1em]">
                    {searchQuery ? "Search Results" : "All Professionals"}
                  </h2>
                  <p className="text-[10px] text-gray-500 font-bold">{pagination.total} Available Now</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest hidden sm:block">Sort by:</span>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters(p => ({ ...p, sortBy: e.target.value }))}
                  className="pl-3 pr-8 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest text-white border border-white/10 focus:outline-none focus:ring-1 focus:ring-violet-500/30 cursor-pointer"
                  style={{ background: "rgba(255,255,255,0.05)" }}
                >
                  <option value="relevance">Relevance</option>
                  <option value="experience">Experience</option>
                  <option value="newest">Newest</option>
                </select>
              </div>
            </div>

            {/* 13. THE MAIN GRID (Infinite Scroll) */}
            {loading && allEditors.length === 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => <EditorCardSkeleton key={i} />)}
              </div>
            ) : allEditors.length === 0 ? (
              <EmptyState
                icon={FaUsers}
                title={searchQuery ? `No editors found for "${searchQuery}"` : "No editors found"}
                description="Try broadening your search or clearing filters to see more talent."
                actionLabel="Clear Search"
                onAction={clearAllFilters}
              />
            ) : (
              <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {allEditors.map((editor, i) => (
                      <React.Fragment key={editor._id}>
                        <EditorCard
                          editor={editor}
                          navigate={navigate}
                          searchQuery={searchQuery}
                          isSaved={savedEditors.includes(editor.user?._id)}
                          onToggleFavorite={(e) => toggleFavorite(e, editor.user?._id)}
                        />
                      </React.Fragment>
                    ))}
                  </div>

                {/* Infinite Scroll Sentinel */}
                <div ref={sentinelRef} className="mt-12 mb-8 flex flex-col items-center justify-center gap-4">
                  {editorsFetching && (
                    <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                      <div className="w-5 h-5 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
                      <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Loading talent pool...</span>
                    </div>
                  )}
                  {!editorsFetching && pagination.page >= pagination.pages && (
                    <div className="flex flex-col items-center opacity-40">
                      <div className="w-8 h-[1px] bg-gradient-to-r from-transparent via-gray-500 to-transparent mb-4" />
                      <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em]">End of Discoveries</p>
                    </div>
                  )}
                </div>
              </>
            )}

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default memo(ExploreEditors);