import { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  FaCheckCircle,
  FaStar,
  FaSearch,
  FaMapMarkerAlt,
  FaCode,
  FaGlobe,
  FaUsers,
  FaChevronLeft,
  FaChevronRight,
  FaAward,
  FaBriefcase,
  FaFilter,
  FaTimes,
  FaSortAmountDown,
  FaHistory,
  FaArrowRight,
  FaRegHeart,
  FaHeart,
  FaYoutube,
  FaVideo,
  FaMicrophone,
  FaMagic,
  FaFilm,
  FaTv,
  FaPalette,
  FaRing,
  FaPlay,
  FaFire,
} from "react-icons/fa";
import { 
  HiSparkles, 
  HiTrendingUp, 
  HiCheckCircle, 
  HiUserGroup,
  HiVideoCamera,
  HiLightningBolt,
} from "react-icons/hi";
import { useAppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import EmptyState from "./EmptyState.jsx";
import { motion, AnimatePresence } from "framer-motion";
import SuvixScoreBadge from "./SuvixScoreBadge.jsx";
import { toast } from "react-toastify";

/**
 * ExploreEditors - Professional Design
 * Dark base with light: variant overrides for theme toggle
 */

// Helper function to get tier color
const getTierColor = (tier) => {
  const colors = {
    elite: '#FFD700',
    expert: '#9B59B6',
    professional: '#3498DB',
    established: '#27AE60',
    rising: '#1ABC9C',
    newcomer: '#95A5A6',
  };
  return colors[tier] || colors.newcomer;
};

const ExploreEditors = () => {
  const { backendURL, user } = useAppContext();
  const [editors, setEditors] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const searchInputRef = useRef(null);

  // Hero Banner Images for auto-transition
  const heroBanners = [
    "/hero_banner_1_1766946342128.png",
    "/hero_banner_2_1766946358435.png",
    "/hero_banner_3_1766946374802.png"
  ];

  // Auto-transition banner every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % heroBanners.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 1 });
  const [filterOptions, setFilterOptions] = useState({ skills: [], languages: [], countries: [], experience: [] });
  const [filters, setFilters] = useState({ skills: [], languages: [], experience: "", country: "", availability: [], sortBy: "relevance" });
  
  // Favorites Logic
  const [savedEditors, setSavedEditors] = useState([]); // Array of editor IDs

  const navigate = useNavigate();

  // Fetch saved editors on mount
  useEffect(() => {
    const fetchSavedEditors = async () => {
       if (!user?.token) return;
       try {
         const res = await axios.get(`${backendURL}/api/user/saved-editors`, {
            headers: { Authorization: `Bearer ${user.token}` }
         });
         if (res.data.success) {
            // Map to IDs for easy checking
            const ids = res.data.savedEditors.map(editor => editor._id);
            setSavedEditors(ids);
         }
       } catch (err) {
         console.error("Failed to fetch saved editors", err);
       }
    };
    fetchSavedEditors();
  }, [user, backendURL]);

  const toggleFavorite = async (e, editorId) => {
    e.stopPropagation(); // Prevent card click
    if (!user?.token) {
        toast.info("Please login to save editors");
        return;
    }
    
    // Optimistic update
    const isSaved = savedEditors.includes(editorId);
    setSavedEditors(prev => isSaved ? prev.filter(id => id !== editorId) : [...prev, editorId]);
    
    try {
        const res = await axios.post(`${backendURL}/api/user/saved-editors/${editorId}`, {}, {
            headers: { Authorization: `Bearer ${user.token}` }
        });
        toast.success(res.data.message);
    } catch (err) {
        toast.error("Failed to update favorites");
        // Revert on error
        setSavedEditors(prev => isSaved ? [...prev, editorId] : prev.filter(id => id !== editorId));
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("recentEditorSearches");
    if (saved) {
      try { setRecentSearches(JSON.parse(saved).slice(0, 5)); } catch { setRecentSearches([]); }
    }
  }, []);

  const saveToRecentSearches = (query) => {
    if (!query.trim()) return;
    const updated = [query, ...recentSearches.filter((s) => s !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("recentEditorSearches", JSON.stringify(updated));
  };

  const fetchEditors = async (page = 1, search = "", activeFilters = filters) => {
    try {
      setLoading(true);
      const token = user?.token || JSON.parse(localStorage.getItem("user"))?.token;

      const params = new URLSearchParams({
        page: page.toString(),
        limit: "12",
        ...(search && { search }),
        ...(activeFilters.availability.length > 0 && { availability: activeFilters.availability.join(",") }),
        ...(activeFilters.skills.length > 0 && { skills: activeFilters.skills.join(",") }),
        ...(activeFilters.languages.length > 0 && { languages: activeFilters.languages.join(",") }),
        ...(activeFilters.experience && { experience: activeFilters.experience }),
        ...(activeFilters.country && { country: activeFilters.country }),
        sortBy: activeFilters.sortBy,
      });

      const res = await axios.get(`${backendURL}/api/explore/editors?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      setEditors(res.data.editors || []);
      setPagination(res.data.pagination || { page: 1, limit: 12, total: 0, pages: 1 });
      if (res.data.filters) setFilterOptions(res.data.filters);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to fetch editors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEditors(1, "", filters); }, [backendURL, user]);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) saveToRecentSearches(searchQuery);
      fetchEditors(1, searchQuery, filters);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  useEffect(() => { fetchEditors(1, searchQuery, filters); }, [filters]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) fetchEditors(newPage, searchQuery, filters);
  };

  const toggleSkillFilter = (skill) => {
    setFilters((prev) => ({ ...prev, skills: prev.skills.includes(skill) ? prev.skills.filter((s) => s !== skill) : [...prev.skills, skill] }));
  };

  const toggleLanguageFilter = (lang) => {
    setFilters((prev) => ({ ...prev, languages: prev.languages.includes(lang) ? prev.languages.filter((l) => l !== lang) : [...prev.languages, lang] }));
  };

  const toggleAvailabilityFilter = (status) => {
    setFilters((prev) => ({ ...prev, availability: prev.availability.includes(status) ? prev.availability.filter((s) => s !== status) : [...prev.availability, status] }));
  };

  const clearAllFilters = () => {
    setFilters({ skills: [], languages: [], experience: "", country: "", availability: [], sortBy: "relevance" });
    setSearchQuery("");
  };

  const activeFilterCount = filters.skills.length + filters.languages.length + (filters.experience ? 1 : 0) + (filters.country ? 1 : 0) + filters.availability.length;

  if (error) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center max-w-md p-8 bg-[#0a0a0c] light:bg-white rounded-2xl border border-white/10 light:border-slate-200 shadow-lg">
          <div className="w-16 h-16 bg-red-500/10 light:bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h3 className="text-xl font-bold text-white light:text-slate-900 mb-2">Something went wrong</h3>
          <p className="text-gray-500 light:text-slate-500 mb-6">{error}</p>
          <button onClick={() => fetchEditors(1, "", filters)} className="inline-flex items-center gap-2 bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-emerald-600 transition-all">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[50vh] px-3 py-2" style={{ fontFamily: "'Inter', sans-serif" }}>
      
      {/* ============== HERO BANNER WITH IMAGE SLIDESHOW ============== */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 relative overflow-hidden rounded-2xl"
      >
        {/* Background Image Slideshow */}
        <div className="relative h-44 md:h-52">
          <AnimatePresence mode="wait">
            <motion.img
              key={currentBannerIndex}
              src={heroBanners[currentBannerIndex]}
              alt="Hero Banner"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </AnimatePresence>
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-violet-900/30" />
          
          {/* Banner Content */}
          <div className="absolute inset-0 flex flex-col justify-end p-4">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-violet-500/30 backdrop-blur-sm rounded-full mb-2 w-fit">
              <HiVideoCamera className="text-white text-[10px]" />
              <span className="text-white text-[9px] font-semibold uppercase tracking-wide">Discover Talent</span>
            </div>
            <h1 className="text-xl font-bold text-white mb-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Find Your Perfect Editor
            </h1>
            <p className="text-white/70 text-xs">
              Connect with {pagination.total || 0}+ skilled professionals
            </p>
          </div>
          
          {/* Banner Indicators */}
          <div className="absolute bottom-3 right-4 flex gap-1">
            {heroBanners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentBannerIndex(idx)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  idx === currentBannerIndex 
                    ? "bg-white w-4" 
                    : "bg-white/40 hover:bg-white/60"
                }`}
              />
            ))}
          </div>
        </div>
        
        {/* Stats Strip */}
        <div className="bg-[#0a0a0c] light:bg-white border-t border-white/10 light:border-slate-100 p-3">
          <div className="grid grid-cols-4 gap-2">
            {[
              { value: `${pagination.total || 0}+`, label: "Editors", icon: HiUserGroup, color: "text-violet-400" },
              { value: "850+", label: "Projects", icon: HiVideoCamera, color: "text-purple-400" },
              { value: "4.8", label: "Rating", icon: FaStar, color: "text-amber-400" },
              { value: "98%", label: "Success", icon: HiCheckCircle, color: "text-emerald-400" },
            ].map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <stat.icon className={`${stat.color} text-[10px]`} />
                  <span className="text-xs font-bold text-white light:text-slate-900">{stat.value}</span>
                </div>
                <div className="text-[8px] text-gray-500 light:text-slate-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ============== PROFESSIONAL SEARCH BAR ============== */}
      <div className="mb-4">
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-violet-400">
            <FaSearch className="text-sm" />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search editors, skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            className="w-full py-3 pl-10 pr-10 bg-white/5 light:bg-slate-50 border border-white/10 light:border-slate-200 rounded-full text-white light:text-slate-900 placeholder:text-gray-500 light:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/40 transition-all text-sm"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")} 
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white/10 light:bg-slate-200 rounded-full flex items-center justify-center text-gray-400 hover:bg-white/20 transition"
            >
              <FaTimes className="text-[10px]" />
            </button>
          )}

          {/* Search Suggestions Dropdown */}
          <AnimatePresence>
            {showSuggestions && !searchQuery && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="absolute top-full left-0 right-0 mt-2 bg-[#0a0a0c] light:bg-white rounded-2xl shadow-2xl border border-white/10 light:border-slate-200 py-3 z-20 overflow-hidden"
              >
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div className="mb-3">
                    <div className="px-4 py-2 text-xs text-gray-500 light:text-slate-500 uppercase tracking-wider flex items-center gap-2">
                      <FaHistory className="text-[10px]" /> Recent
                    </div>
                    <div className="flex flex-wrap gap-2 px-4">
                      {recentSearches.slice(0, 3).map((search, idx) => (
                        <button key={idx} onClick={() => setSearchQuery(search)} className="px-3 py-1.5 bg-white/5 light:bg-slate-50 hover:bg-white/10 light:hover:bg-slate-100 text-gray-300 light:text-slate-700 rounded-full text-xs font-medium transition border border-white/10 light:border-slate-200">
                          {search}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Popular Suggestions */}
                <div>
                  <div className="px-4 py-2 text-xs text-gray-500 light:text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    🔥 Popular
                  </div>
                  <div className="flex flex-wrap gap-2 px-4">
                    {["Wedding", "Reels", "YouTube", "Color Grading", "VFX", "Podcast"].map((suggestion, idx) => (
                      <button key={idx} onClick={() => setSearchQuery(suggestion)} className="px-3 py-1.5 bg-emerald-500/10 light:bg-emerald-50 hover:bg-emerald-500/20 light:hover:bg-emerald-100 text-emerald-400 light:text-emerald-700 rounded-full text-xs font-medium transition border border-emerald-500/20 light:border-emerald-200">
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ============== CATEGORY PILLS (Horizontal Scroll) ============== */}
      <div className="mb-4 relative">
        {/* Gradient Fade Edges */}
        <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-[#0a0a0c] light:from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-[#0a0a0c] light:from-white to-transparent z-10 pointer-events-none" />
        
        <div className="flex gap-2 overflow-x-auto pb-1 px-1 scrollbar-hide snap-x" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {[
            { id: "all", label: "All", Icon: HiSparkles, color: "text-violet-400", activeColor: "from-violet-500 to-purple-500" },
            { id: "wedding", label: "Wedding", Icon: FaRing, color: "text-pink-400", activeColor: "from-pink-500 to-rose-500", hot: true },
            { id: "reels", label: "Reels", Icon: FaPlay, color: "text-purple-400", activeColor: "from-purple-500 to-fuchsia-500" },
            { id: "youtube", label: "YouTube", Icon: FaYoutube, color: "text-red-400", activeColor: "from-red-500 to-orange-500" },
            { id: "podcast", label: "Podcast", Icon: FaMicrophone, color: "text-blue-400", activeColor: "from-blue-500 to-cyan-500" },
            { id: "vfx", label: "VFX", Icon: FaMagic, color: "text-cyan-400", activeColor: "from-cyan-500 to-teal-500" },
            { id: "color", label: "Color", Icon: FaPalette, color: "text-amber-400", activeColor: "from-amber-500 to-orange-500" },
            { id: "cinematic", label: "Cinematic", Icon: FaFilm, color: "text-emerald-400", activeColor: "from-emerald-500 to-green-500" },
          ].map((category) => {
            const isActive = filters.skills.includes(category.label) || (category.id === "all" && filters.skills.length === 0);
            return (
              <motion.button
                key={category.id}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => {
                  if (category.id === "all") {
                    setFilters(prev => ({ ...prev, skills: [] }));
                  } else {
                    toggleSkillFilter(category.label);
                  }
                }}
                className={`snap-start flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? `bg-gradient-to-r ${category.activeColor} text-white shadow-lg`
                    : "bg-white/5 light:bg-white text-gray-400 light:text-slate-600 border border-white/10 light:border-slate-200 hover:bg-white/10"
                }`}
              >
                <category.Icon className={`text-[10px] ${isActive ? "text-white" : category.color}`} />
                {category.label}
                {category.hot && !isActive && (
                  <span className="px-1 py-0.5 bg-orange-500 text-white text-[7px] rounded font-bold">
                    <FaFire className="text-[6px]" />
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
      {/* ============== BROWSE BY SPECIALTY - ZEPTO STYLE WITH IMAGES ============== */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-5 h-5 bg-violet-500/15 rounded-md flex items-center justify-center">
            <HiLightningBolt className="text-violet-400 text-[10px]" />
          </div>
          <h2 className="text-xs font-bold text-white light:text-slate-900">Browse by Specialty</h2>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "YouTube", image: "/youtube_category_1766945669722.png" },
            { label: "Wedding", image: "/wedding_category_1766945653582.png" },
            { label: "Reels", image: "/reels_category_1766945684333.png" },
            { label: "Color", image: "/color_category_1766945743508.png" },
            { label: "Podcast", image: "/podcast_category_1766945699811.png" },
            { label: "VFX", image: "/vfx_category_1766945726102.png" },
            { label: "Cinematic", image: "/cinematic_category_1766945761051.png" },
            { label: "Ads", image: "/ads_category_1766945776646.png" },
          ].map((specialty, idx) => (
            <motion.button
              key={specialty.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.03 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleSkillFilter(specialty.label)}
              className={`relative rounded-xl overflow-hidden transition-all aspect-square ${
                filters.skills.includes(specialty.label)
                  ? "ring-2 ring-violet-500 ring-offset-1 ring-offset-[#0a0a0c]"
                  : "hover:scale-105"
              }`}
            >
              <img 
                src={specialty.image} 
                alt={specialty.label}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-1 left-0 right-0 text-center">
                <span className="text-[9px] font-bold text-white drop-shadow-md">{specialty.label}</span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* ============== FEATURED EDITORS CAROUSEL ============== */}
      {!loading && editors.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-amber-500/10 rounded-lg flex items-center justify-center">
                <FaStar className="text-amber-500 text-xs" />
              </div>
              <h2 className="text-sm font-bold text-white light:text-slate-900">Featured Editors</h2>
            </div>
            <button className="text-xs text-emerald-500 hover:text-emerald-400 font-medium flex items-center gap-1">
              See all <FaArrowRight className="text-[8px]" />
            </button>
          </div>
          <div className="-mx-4 px-4">
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {editors.slice(0, 6).map((editor) => {
                const hasRatings = editor.ratingStats && editor.ratingStats.totalReviews > 0;
                const rating = hasRatings ? editor.ratingStats.averageRating?.toFixed(1) : "N/A";
                const isSaved = savedEditors.includes(editor.user?._id);
                return (
                  <motion.div
                    key={editor._id}
                    onClick={() => navigate(`/public-profile/${editor.user?._id}`)}
                    className="flex-shrink-0 w-40 bg-white/5 light:bg-white rounded-2xl border border-white/10 light:border-slate-200 overflow-hidden cursor-pointer hover:border-emerald-500/30 light:hover:border-emerald-200 transition-all group"
                    whileHover={{ y: -4 }}
                  >
                    {/* Cover Image / Gradient */}
                    <div className="h-16 bg-gradient-to-br from-emerald-500/20 via-teal-500/20 to-cyan-500/20 relative">
                      {/* Save Button */}
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(e, editor.user?._id); }}
                        className="absolute top-2 right-2 w-6 h-6 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center"
                      >
                        {isSaved ? <FaHeart className="text-pink-500 text-xs" /> : <FaRegHeart className="text-white/70 text-xs" />}
                      </button>
                    </div>
                    
                    <div className="p-3 pt-0 -mt-6 text-center">
                      {/* Avatar */}
                      <img 
                        src={editor.user?.profilePicture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} 
                        alt={editor.user?.name}
                        className="w-12 h-12 rounded-full border-2 border-[#0a0a0c] light:border-white mx-auto object-cover"
                      />
                      <h4 className="font-semibold text-white light:text-slate-900 text-sm mt-2 truncate">{editor.user?.name}</h4>
                      <p className="text-gray-500 light:text-slate-500 text-xs truncate">{editor.skills?.slice(0, 1).join(", ") || "Video Editor"}</p>
                      
                      <div className="flex items-center justify-center gap-1 mt-2">
                        <FaStar className="text-amber-400 text-xs" />
                        <span className="text-white light:text-slate-900 text-xs font-medium">{rating}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ============== ONLINE NOW STRIP ============== */}
      {!loading && editors.filter(e => e.user?.availability?.status !== 'busy').length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 bg-emerald-500/10 rounded-lg flex items-center justify-center">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            </div>
            <h2 className="text-sm font-bold text-white light:text-slate-900">Online Now</h2>
            <span className="text-[10px] text-gray-500 light:text-slate-500 bg-white/5 light:bg-slate-100 px-1.5 py-0.5 rounded">
              {editors.filter(e => e.user?.availability?.status !== 'busy').length}
            </span>
          </div>
          <div className="-mx-4 px-4">
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {editors.filter(e => e.user?.availability?.status !== 'busy').slice(0, 10).map((editor) => (
                <motion.div
                  key={editor._id}
                  onClick={() => navigate(`/public-profile/${editor.user?._id}`)}
                  className="flex-shrink-0 flex flex-col items-center cursor-pointer"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="relative">
                    <img 
                      src={editor.user?.profilePicture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} 
                      alt={editor.user?.name}
                      className="w-14 h-14 rounded-full border-2 border-emerald-500/30 light:border-emerald-200 object-cover"
                    />
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#0a0a0c] light:border-white" />
                  </div>
                  <span className="text-[10px] text-gray-400 light:text-slate-600 mt-1.5 w-14 text-center truncate font-medium">{editor.user?.name?.split(' ')[0]}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

       

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
              showFilters || activeFilterCount > 0
                ? "bg-emerald-500/10 light:bg-emerald-50 text-emerald-400 light:text-emerald-700 border-emerald-500/30 light:border-emerald-200"
                : "bg-white/5 light:bg-white text-gray-400 light:text-slate-600 border-white/10 light:border-slate-200 hover:bg-white/10 light:hover:bg-slate-50"
            }`}
          >
            <FaFilter className="text-xs" />
            Filters
            {activeFilterCount > 0 && <span className="bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full">{activeFilterCount}</span>}
          </button>
          {activeFilterCount > 0 && (
            <button onClick={clearAllFilters} className="text-sm text-gray-500 light:text-slate-500 hover:text-gray-300 light:hover:text-slate-700 underline">Clear all</button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 light:text-slate-500">
            <span className="font-semibold text-white light:text-slate-900">{pagination.total}</span> editors found
          </span>
          <select
            value={filters.sortBy}
            onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
            className="pl-3 pr-8 py-2.5 bg-white/5 light:bg-white border border-white/10 light:border-slate-200 rounded-xl text-sm text-gray-300 light:text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
          >
            <option value="relevance">Relevance</option>
            <option value="experience">Experience</option>
            <option value="newest">Newest</option>
          </select>
        </div>
      </div>

      {/* Expandable Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-6">
            <div className="bg-white/5 light:bg-slate-50 rounded-2xl p-5 border border-white/10 light:border-slate-200">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Availability Filter */}
                <div>
                   <label className="text-xs font-semibold text-gray-400 light:text-slate-600 uppercase tracking-wider mb-3 block">Availability</label>
                   <div className="flex flex-wrap gap-2">
                      {[
                          { id: 'available', label: 'Available Now', color: 'bg-emerald-500', border: 'border-emerald-500/50' },
                          { id: 'small_only', label: 'Small Projects', color: 'bg-blue-500', border: 'border-blue-500/50' },
                          { id: 'busy', label: 'Busy', color: 'bg-amber-500', border: 'border-amber-500/50' }
                      ].map(status => (
                         <button
                           key={status.id}
                           onClick={() => toggleAvailabilityFilter(status.id)}
                           className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
                              filters.availability.includes(status.id)
                                ? `${status.color} text-white`
                                : `bg-white/5 light:bg-white text-gray-400 light:text-slate-600 border border-white/10 light:border-slate-200 hover:${status.border}`
                           }`}
                         >
                            <span className={`w-2 h-2 rounded-full ${filters.availability.includes(status.id) ? 'bg-white' : status.color.replace('bg-', 'text-').replace('500', '400')}`} style={{backgroundColor: filters.availability.includes(status.id) ? 'white' : undefined}} />
                            {status.label}
                         </button>
                      ))}
                   </div>
                </div>
                {filterOptions.skills.length > 0 && (
                  <div>
                    <label className="text-xs font-semibold text-gray-400 light:text-slate-600 uppercase tracking-wider mb-3 block">Skills</label>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                      {filterOptions.skills.slice(0, 20).map((skill) => (
                        <button
                          key={skill}
                          onClick={() => toggleSkillFilter(skill)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            filters.skills.includes(skill)
                              ? "bg-emerald-500 text-white"
                              : "bg-white/5 light:bg-white text-gray-400 light:text-slate-600 border border-white/10 light:border-slate-200 hover:border-emerald-500/50 light:hover:border-emerald-300"
                          }`}
                        >
                          {skill}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {filterOptions.languages.length > 0 && (
                  <div>
                    <label className="text-xs font-semibold text-gray-400 light:text-slate-600 uppercase tracking-wider mb-3 block">Languages</label>
                    <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                      {filterOptions.languages.slice(0, 15).map((lang) => (
                        <button
                          key={lang}
                          onClick={() => toggleLanguageFilter(lang)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            filters.languages.includes(lang)
                              ? "bg-blue-500 text-white"
                              : "bg-white/5 light:bg-white text-gray-400 light:text-slate-600 border border-white/10 light:border-slate-200 hover:border-blue-500/50 light:hover:border-blue-300"
                          }`}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============== ALL EDITORS SECTION ============== */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-500/10 rounded-lg flex items-center justify-center">
            <FaUsers className="text-blue-500 text-xs" />
          </div>
          <h2 className="text-sm font-bold text-white light:text-slate-900">All Editors</h2>
        </div>
        <span className="text-[10px] text-gray-500 light:text-slate-500 bg-white/5 light:bg-slate-100 px-2 py-1 rounded">
          {editors.length} of {pagination.total}
        </span>
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-[#0a0a0c] light:bg-white rounded-2xl p-5 animate-pulse border border-white/10 light:border-slate-100">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-white/10 light:bg-slate-100 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-white/10 light:bg-slate-100 rounded" />
                  <div className="h-3 w-24 bg-white/10 light:bg-slate-100 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : editors.length === 0 ? (
        <EmptyState icon={FaUsers} title="No editors found" description={searchQuery || activeFilterCount > 0 ? "Try adjusting your search or filters" : "No editors have completed their profiles yet"} actionLabel={activeFilterCount > 0 ? "Clear Filters" : undefined} onAction={activeFilterCount > 0 ? clearAllFilters : undefined} />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {editors.map((editor) => (
              <EditorCard 
                key={editor._id} 
                editor={editor} 
                navigate={navigate} 
                searchQuery={searchQuery}
                isSaved={savedEditors.includes(editor.user?._id)}
                onToggleFavorite={(e) => toggleFavorite(e, editor.user?._id)}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-10">
              <button onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1} className="w-10 h-10 rounded-xl bg-white/5 light:bg-white border border-white/10 light:border-slate-200 flex items-center justify-center text-gray-500 light:text-slate-500 hover:bg-white/10 light:hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                <FaChevronLeft className="text-sm" />
              </button>
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  let pageNum;
                  if (pagination.pages <= 5) pageNum = i + 1;
                  else if (pagination.page <= 3) pageNum = i + 1;
                  else if (pagination.page >= pagination.pages - 2) pageNum = pagination.pages - 4 + i;
                  else pageNum = pagination.page - 2 + i;

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-10 h-10 rounded-xl text-sm font-semibold transition-all ${
                        pagination.page === pageNum
                          ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                          : "bg-white/5 light:bg-white border border-white/10 light:border-slate-200 text-gray-400 light:text-slate-600 hover:bg-white/10 light:hover:bg-slate-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page === pagination.pages} className="w-10 h-10 rounded-xl bg-white/5 light:bg-white border border-white/10 light:border-slate-200 flex items-center justify-center text-gray-500 light:text-slate-500 hover:bg-white/10 light:hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                <FaChevronRight className="text-sm" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

/* EditorCard - Clean Professional Design with theme support */
const EditorCard = ({ editor, navigate, searchQuery, isSaved, onToggleFavorite }) => {
  // Use real ratings from profile ratingStats, fallback to N/A
  const hasRatings = editor.ratingStats && editor.ratingStats.totalReviews > 0;
  const rating = hasRatings ? editor.ratingStats.averageRating?.toFixed(1) : null;
  const reviewCount = hasRatings ? editor.ratingStats.totalReviews : 0;

  // Get Suvix Score from user
  const suvixScore = editor.user?.suvixScore;
  const showSuvixScore = suvixScore?.isEligible && suvixScore?.total > 0;

  // Availability Logic
  const availability = editor.user?.availability || { status: 'available' };
  const isBusy = availability.status === 'busy';
  const isSmallOnly = availability.status === 'small_only';


  const highlightMatch = (text, query) => {
    if (!query || !text) return text;
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-emerald-500/20 light:bg-emerald-100 rounded px-0.5 text-emerald-400 light:text-emerald-700">{part}</mark>
      ) : (
        part
      )
    );
  };

  return (
    <motion.div
      onClick={() => navigate(`/public-profile/${editor.user?._id}`)}
      className="group relative bg-[#0a0a0c] light:bg-white rounded-2xl overflow-hidden border border-white/10 light:border-slate-200 hover:border-emerald-500/30 light:hover:border-emerald-300 hover:shadow-xl transition-all duration-300 cursor-pointer"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
    >
      {/* Heart Button */}
      <button 
        onClick={onToggleFavorite}
        className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full light:bg-black/20 bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center transition-all hover:bg-white/20 active:scale-95"
      >
        {isSaved ? (
            <FaHeart className="text-pink-500 text-sm" />
        ) : (
            <FaRegHeart className="text-white/70 text-sm hover:text-white" />
        )}
      </button>
      {/* Header with Avatar */}
      <div className="relative p-5 pb-4">
        <div className="flex items-start gap-4">
          <div className="relative flex-shrink-0">
            <img src={editor.user?.profilePicture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} alt={editor.user?.name} className="w-14 h-14 rounded-full object-cover border-2 border-white/10 light:border-slate-100 group-hover:border-emerald-500/30 light:group-hover:border-emerald-200 transition-colors" />
            <span className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-[#0a0a0c] light:border-white ${
                isBusy ? 'bg-amber-500' : isSmallOnly ? 'bg-blue-500' : 'bg-emerald-500'
            }`} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-white light:text-slate-900 truncate text-base" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {highlightMatch(editor.user?.name, searchQuery)}
              </h3>
              {editor.verified && <FaCheckCircle className="text-emerald-500 text-sm flex-shrink-0" />}
              
              {/* Availability Chip for Context */}
              {isBusy ? (
                availability.busyUntil && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 whitespace-nowrap">
                       Busy till {new Date(availability.busyUntil).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                    </span>
                )
              ) : isSmallOnly ? (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20 whitespace-nowrap">
                   Small Projects
                </span>
              ) : (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 whitespace-nowrap">
                   Available
                </span>
              )}
            </div>

            <p className="text-gray-500 light:text-slate-500 text-sm flex items-center gap-1.5">
              <FaBriefcase className="text-gray-600 light:text-slate-400 text-xs" />
              <span className="capitalize">{editor.user?.role || "Video Editor"}</span>
            </p>

            <div className="flex items-center gap-2 mt-2">
              {hasRatings ? (
                <>
                  <div className="flex items-center gap-1 bg-amber-500/10 light:bg-amber-50 px-2 py-0.5 rounded-md">
                    <FaStar className="text-amber-400 text-xs" />
                    <span className="font-semibold text-xs text-white light:text-slate-900">{rating}</span>
                  </div>
                  <span className="text-gray-500 light:text-slate-400 text-xs">({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})</span>
                </>
              ) : (
                <div className="flex items-center gap-1 bg-gray-500/10 light:bg-slate-100 px-2 py-0.5 rounded-md">
                  <FaStar className="text-gray-500 text-xs" />
                  <span className="font-medium text-xs text-gray-400 light:text-slate-500">N/A</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Premium Suvix Score Badge - Top Right Corner */}
        {showSuvixScore && (
          <div 
            className="absolute top-3 right-3 z-10"
            style={{
              filter: `drop-shadow(0 4px 12px ${getTierColor(suvixScore.tier)}40)`,
            }}
          >
            <div 
              className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg backdrop-blur-md"
              style={{ 
                background: `linear-gradient(135deg, ${getTierColor(suvixScore.tier)}20, ${getTierColor(suvixScore.tier)}10)`,
                border: `1px solid ${getTierColor(suvixScore.tier)}40`,
              }}
            >
              <div 
                className="w-5 h-5 rounded-full flex items-center justify-center"
                style={{ 
                  background: `linear-gradient(135deg, ${getTierColor(suvixScore.tier)}, ${getTierColor(suvixScore.tier)}CC)`,
                  boxShadow: `0 0 8px ${getTierColor(suvixScore.tier)}60`,
                }}
              >
                <span className="text-[10px] font-bold text-white">{suvixScore.tier?.charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex flex-col items-start leading-none">
                <span 
                  className="font-bold text-sm"
                  style={{ color: getTierColor(suvixScore.tier) }}
                >
                  {suvixScore.total}
                </span>
                <span className="text-[8px] font-medium text-gray-400 uppercase tracking-wider">Score</span>
              </div>
            </div>
          </div>
        )}
        
        {editor.location?.country && (
          <div className="flex items-center gap-1.5 text-gray-500 light:text-slate-500 text-xs mt-3">
            <FaMapMarkerAlt className="text-gray-600 light:text-slate-400" />
            <span>{highlightMatch(editor.location.country, searchQuery)}</span>
          </div>
        )}
      </div>

      {/* Skills & Languages */}
      <div className="px-5 pb-4 space-y-3">
        {editor.skills?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {editor.skills.filter(Boolean).slice(0, 3).map((skill, idx) => (
              <span key={idx} className="px-2.5 py-1 bg-emerald-500/10 light:bg-emerald-50 text-emerald-400 light:text-emerald-700 rounded-lg text-xs font-medium">{skill}</span>
            ))}
            {editor.skills.filter(Boolean).length > 3 && (
              <span className="px-2.5 py-1 bg-white/5 light:bg-slate-100 text-gray-500 light:text-slate-500 rounded-lg text-xs font-medium">+{editor.skills.filter(Boolean).length - 3}</span>
            )}
          </div>
        )}

        {editor.languages?.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-gray-500 light:text-slate-500">
            <FaGlobe className="text-gray-600 light:text-slate-400" />
            {editor.languages.filter(Boolean).slice(0, 2).join(", ")}
            {editor.languages.filter(Boolean).length > 2 && ` +${editor.languages.filter(Boolean).length - 2}`}
          </div>
        )}

        {editor.experience && (
          <div className="flex items-center gap-2 text-xs">
            <FaAward className="text-purple-500" />
            <span className="text-gray-300 light:text-slate-700 font-medium">{editor.experience}</span>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="px-5 pb-5">
        <button className="w-full py-2.5 bg-white/5 light:bg-slate-900 text-gray-300 light:text-white text-sm font-semibold rounded-xl group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300 flex items-center justify-center gap-2 border border-white/10 light:border-transparent group-hover:border-transparent">
          View Profile <FaArrowRight className="text-xs group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </motion.div>
  );
};

export default ExploreEditors;
