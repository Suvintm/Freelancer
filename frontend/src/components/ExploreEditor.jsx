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
} from "react-icons/fa";
import { useAppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import EmptyState from "./EmptyState.jsx";
import { motion, AnimatePresence } from "framer-motion";

/**
 * ExploreEditors — UI upgraded to "Apple-like Elegant Black"
 * - Soft black background (#0B0B0D)
 * - Clean cards with subtle borders, rounded corners, shadow
 * - Typography tuned for T1 (bold headings, medium labels)
 * - Smooth animations (A3)
 *
 * NOTE: Logic (API calls, filters, pagination) is preserved exactly.
 */

const ExploreEditors = () => {
  const { backendURL, user } = useAppContext();
  const [editors, setEditors] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const searchInputRef = useRef(null);

  // Pagination state (unchanged)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 1,
  });

  // Filter options from API (unchanged)
  const [filterOptions, setFilterOptions] = useState({
    skills: [],
    languages: [],
    countries: [],
    experience: [],
  });

  // Active filters (unchanged)
  const [filters, setFilters] = useState({
    skills: [],
    languages: [],
    experience: "",
    country: "",
    sortBy: "relevance",
  });

  const navigate = useNavigate();

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("recentEditorSearches");
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved).slice(0, 5));
      } catch {
        setRecentSearches([]);
      }
    }
  }, []);

  // Save search to recent
  const saveToRecentSearches = (query) => {
    if (!query.trim()) return;
    const updated = [query, ...recentSearches.filter((s) => s !== query)].slice(
      0,
      5
    );
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
        ...(activeFilters.skills.length > 0 && {
          skills: activeFilters.skills.join(","),
        }),
        ...(activeFilters.languages.length > 0 && {
          languages: activeFilters.languages.join(","),
        }),
        ...(activeFilters.experience && { experience: activeFilters.experience }),
        ...(activeFilters.country && { country: activeFilters.country }),
        sortBy: activeFilters.sortBy,
      });

      const res = await axios.get(`${backendURL}/api/explore/editors?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      setEditors(res.data.editors || []);
      setPagination(
        res.data.pagination || { page: 1, limit: 12, total: 0, pages: 1 }
      );
      if (res.data.filters) {
        setFilterOptions(res.data.filters);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to fetch editors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEditors(1, "", filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backendURL, user]);

  // Debounced search (unchanged behavior)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        saveToRecentSearches(searchQuery);
      }
      fetchEditors(1, searchQuery, filters);
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // Re-fetch when filters change
  useEffect(() => {
    fetchEditors(1, searchQuery, filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      fetchEditors(newPage, searchQuery, filters);
    }
  };

  const toggleSkillFilter = (skill) => {
    setFilters((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }));
  };

  const toggleLanguageFilter = (lang) => {
    setFilters((prev) => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter((l) => l !== lang)
        : [...prev.languages, lang],
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      skills: [],
      languages: [],
      experience: "",
      country: "",
      sortBy: "relevance",
    });
    setSearchQuery("");
  };

  const activeFilterCount =
    filters.skills.length +
    filters.languages.length +
    (filters.experience ? 1 : 0) +
    (filters.country ? 1 : 0);

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md p-6 bg-[#0f1112] rounded-2xl border border-[#1b1d1f] shadow-[0_10px_40px_rgba(0,0,0,0.7)]">
          <div className="w-20 h-20 bg-[#131315] rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Oops! Something went wrong
          </h3>
          <p className="text-[#9CA3AF] mb-6">{error}</p>
          <button
            onClick={() => fetchEditors(1, "", filters)}
            className="inline-flex items-center gap-2 bg-white/8 text-white px-6 py-2.5 rounded-full font-medium shadow hover:brightness-110 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] px-4 rounded-2xl py-6 bg-[#0B0B0D] text-white">
      {/* Header */}
      <div className="text-center mb-6 max-w-4xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-2">
          Find Your Perfect Editor
        </h2>
        <p className="text-[#9CA3AF]">
          Discover talented video editors ready to bring your vision to life
        </p>
      </div>

      {/* Search + Filters Container */}
      <div className="max-w-6xl mx-auto">
        {/* MOBILE SEARCH + FILTERS (responsive) */}
        <div className="flex flex-col gap-3 md:hidden relative mb-4">
          <div className="relative">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B7280]" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search by name, skills, languages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="w-full py-3 pl-12 pr-10 bg-[#0f1112] border border-[#2b2f31] rounded-2xl text-white placeholder:text-[#6B7280] focus:outline-none focus:ring-1 focus:ring-[#2b2f31]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#D1D5DB]"
              >
                <FaTimes />
              </button>
            )}

            <AnimatePresence>
              {showSuggestions && recentSearches.length > 0 && !searchQuery && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.16 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-[#0f1112] rounded-2xl shadow-xl border border-[#151718] py-2 z-20 overflow-hidden"
                >
                  <div className="px-4 py-2 text-xs text-[#6B7280] uppercase tracking-wider flex items-center gap-2">
                    <FaHistory /> Recent Searches
                  </div>
                  {recentSearches.map((search, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSearchQuery(search)}
                      className="w-full px-4 py-2 text-left text-[#E5E7EB] hover:bg-[#0b0c0d] flex items-center gap-3 text-sm"
                    >
                      <FaSearch className="text-[#6B7280] text-xs" />
                      {search}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-medium border transition-all ${
                showFilters || activeFilterCount > 0
                  ? "bg-[#111315] text-white border-green-600"
                  : "bg-[#0f1112] text-[#9CA3AF] border-[#2b2f31] hover:bg-[#0b0c0d]"
              }`}
            >
              <FaFilter className="text-xs" />
              Filters
              {activeFilterCount > 0 && (
                <span className="bg-[#111315] text-white text-xs px-2 py-0.5 rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </button>

            <div className="relative w-32">
              <FaSortAmountDown className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280] text-xs" />
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                className="w-full pl-9 pr-4 py-3 bg-[#0f1112] border border-[#2b2f31] rounded-2xl text-sm text-[#9CA3AF] focus:outline-none"
              >
                <option value="relevance">Relevance</option>
                <option value="experience">Experience</option>
                <option value="newest">Newest</option>
              </select>
            </div>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22 }}
                className="overflow-hidden"
              >
                <div className="pt-4 border-t border-[#151718] space-y-4">
                  {filterOptions.skills.length > 0 && (
                    <div>
                      <label className="text-xs font-medium text-[#9CA3AF] mb-2 block">
                        Skills
                      </label>
                      <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto scrollbar-hide">
                        {filterOptions.skills.slice(0, 20).map((skill) => (
                          <button
                            key={skill}
                            onClick={() => toggleSkillFilter(skill)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                              filters.skills.includes(skill)
                                ? "bg-white text-black"
                                : "bg-[#0b0c0d] text-[#9CA3AF] hover:bg-[#0b0c0d]"
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
                      <label className="text-xs font-medium text-[#9CA3AF] mb-2 block">
                        Languages
                      </label>
                      <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto scrollbar-hide">
                        {filterOptions.languages.slice(0, 15).map((lang) => (
                          <button
                            key={lang}
                            onClick={() => toggleLanguageFilter(lang)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                              filters.languages.includes(lang)
                                ? "bg-white text-black"
                                : "bg-[#0b0c0d] text-[#9CA3AF] hover:bg-[#0b0c0d]"
                            }`}
                          >
                            {lang}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between mb-6 px-1 max-w-6xl mx-auto">
          <p className="text-[#9CA3AF] text-sm">
            <span className="font-semibold text-white">{pagination.total}</span>{" "}
            editor{pagination.total !== 1 ? "s" : ""} found
            {searchQuery && <span className="text-[#6B7280]"> for "{searchQuery}"</span>}
          </p>
          {pagination.pages > 1 && (
            <p className="text-[#6B7280] text-xs sm:text-sm">
              Page {pagination.page} of {pagination.pages}
            </p>
          )}
        </div>

        {/* Results Grid / Loading / Empty */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-[#0f1112] rounded-2xl p-5 animate-pulse shadow-[0_16px_50px_rgba(0,0,0,0.8)] border border-[#151718]"
              >
                <div className="h-20 bg-[#0b0c0d] rounded-t-xl -mx-5 -mt-5 mb-4" />
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-[#0b0c0d] rounded-xl -mt-12" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-28 bg-[#0b0c0d] rounded" />
                    <div className="h-3 w-20 bg-[#0b0c0d] rounded" />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-3 w-full bg-[#0b0c0d] rounded" />
                  <div className="h-3 w-3/4 bg-[#0b0c0d] rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : editors.length === 0 ? (
          <EmptyState
            icon={FaUsers}
            title="No editors found"
            description={
              searchQuery || activeFilterCount > 0
                ? "Try adjusting your search or filters"
                : "No editors have completed their profiles yet"
            }
            actionLabel={activeFilterCount > 0 ? "Clear Filters" : undefined}
            onAction={activeFilterCount > 0 ? clearAllFilters : undefined}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {editors.map((editor) => (
                <EditorCard
                  key={editor._id}
                  editor={editor}
                  navigate={navigate}
                  searchQuery={searchQuery}
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-10">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="w-10 h-10 rounded-full bg-[#0f1112] border border-[#151718] flex items-center justify-center text-[#9CA3AF] hover:bg-[#0b0c0d] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <FaChevronLeft className="text-sm" />
                </button>

                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    let pageNum;
                    if (pagination.pages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.pages - 2) {
                      pageNum = pagination.pages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-10 h-10 rounded-full text-sm font-medium transition-all ${
                          pagination.page === pageNum
                            ? "bg-white text-black shadow-[0_12px_30px_rgba(255,255,255,0.06)]"
                            : "bg-[#0f1112] border border-[#151718] text-[#9CA3AF] hover:bg-[#0b0c0d]"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="w-10 h-10 rounded-full bg-[#0f1112] border border-[#151718] flex items-center justify-center text-[#9CA3AF] hover:bg-[#0b0c0d] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <FaChevronRight className="text-sm" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

/* =========================
   EditorCard — redesigned
   Apple-like minimal black
   Preserve click navigation and content
   ========================= */
const EditorCard = ({ editor, navigate, searchQuery }) => {
  const [isHovered, setIsHovered] = useState(false);

  const rating = (4 + (editor._id?.charCodeAt(0) % 10) / 10).toFixed(1);
  const reviewCount = 5 + (editor._id?.charCodeAt(1) % 50);

  const highlightMatch = (text, query) => {
    if (!query || !text) return text;
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-[#f2f3f4]/5 rounded px-0.5 text-white">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <motion.div
      onClick={() => navigate(`/public-profile/${editor.user?._id}`)}
      className="group relative bg-[#0f1112] rounded-2xl overflow-hidden shadow-[0_18px_40px_rgba(0,0,0,0.8)] transition-all duration-300 border border-white/20 cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6 }}
    >
      {/* Top subtle banner */}
      <div className="h-16 bg-gradient-to-r from-[#0b0c0d] to-[#0b0c0d] relative">
        <div className="absolute inset-0 opacity-7">
          <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
            <defs>
              <pattern id={`p-${editor._id}`} width="10" height="10" patternUnits="userSpaceOnUse">
                <circle cx="5" cy="5" r="0.8" fill="#ffffff" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill={`url(#p-${editor._id})`} />
          </svg>
        </div>
        {editor.verified && (
          <div className="absolute top-3 right-3 bg-[#0b0c0d] px-2 py-1 rounded-full flex items-center gap-1 text-[11px] font-medium text-[#D1FAE5] border border-[#0f1712]">
            <FaCheckCircle className="text-[#22C55E]" />
            Verified
          </div>
        )}
      </div>

      {/* Avatar */}
      <div className="relative px-5 -mt-10">
        <div className="relative inline-block">
          <img
            src={
              editor.user?.profilePicture ||
              "https://cdn-icons-png.flaticon.com/512/149/149071.png"
            }
            alt={editor.user?.name}
            className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-[0_14px_40px_rgba(0,0,0,0.6)] group-hover:scale-105 transition-transform duration-300"
          />
          <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#22C55E] rounded-full border-2 border-[#0b0c0d]" />
        </div>
      </div>

      {/* Content */}
      <div className="px-5 pb-6 pt-3 text-sm">
        <div className="mb-2">
          <h3 className="font-semibold text-base text-white group-hover:text-[#eaf2ff] transition-colors line-clamp-1">
            {highlightMatch(editor.user?.name, searchQuery)}
          </h3>
          <p className="text-[#9CA3AF] text-xs flex items-center gap-1.5 mt-1">
            <FaBriefcase className="text-[#6b7280] text-[11px]" />
            <span className="capitalize">
              {editor.user?.role || "Video Editor"}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1 bg-[#0b0c0d] px-2 py-1 rounded-lg">
            <FaStar className="text-[#FACC15] text-xs" />
            <span className="font-semibold text-xs text-white">{rating}</span>
          </div>
          <span className="text-[#6B7280] text-[11px]">({reviewCount} reviews)</span>
        </div>

        {editor.location?.country && (
          <div className="flex items-center gap-1.5 text-[#9CA3AF] text-xs mb-3">
            <FaMapMarkerAlt className="text-[#6b7280] text-[11px]" />
            <span>{highlightMatch(editor.location.country, searchQuery)}</span>
          </div>
        )}

        {editor.skills?.length > 0 && (
          <div className="mb-3">
            <p className="text-[11px] text-[#6B7280] mb-1.5 flex items-center gap-1">
              <FaCode className="text-[#6b7280] text-[11px]" /> Skills
            </p>
            <div className="flex flex-wrap gap-1.5">
              {editor.skills.filter(Boolean).slice(0, 4).map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-[#0b0c0d] text-[#E5E7EB] rounded-lg text-[11px] font-medium border border-[#151718]"
                >
                  {skill}
                </span>
              ))}
              {editor.skills.filter(Boolean).length > 4 && (
                <span className="px-2 py-1 bg-[#0b0c0d] text-[#9CA3AF] rounded-lg text-[11px] font-medium border border-[#151718]">
                  +{editor.skills.filter(Boolean).length - 4}
                </span>
              )}
            </div>
          </div>
        )}

        {editor.languages?.length > 0 && (
          <div className="mb-4">
            <p className="text-[11px] text-[#6B7280] mb-1.5 flex items-center gap-1">
              <FaGlobe className="text-[#6b7280] text-[11px]" /> Languages
            </p>
            <div className="flex flex-wrap gap-1.5">
              {editor.languages.filter(Boolean).slice(0, 3).map((lang, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-[#0b0c0d] text-[#9CA3AF] rounded-lg text-[11px] font-medium border border-[#151718]"
                >
                  {lang}
                </span>
              ))}
              {editor.languages.filter(Boolean).length > 3 && (
                <span className="px-2 py-1 bg-[#0b0c0d] text-[#9CA3AF] rounded-lg text-[11px] font-medium border border-[#151718]">
                  +{editor.languages.filter(Boolean).length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        {editor.experience && (
          <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-gradient-to-r from-black to-blue-800 via-zinc-900 rounded-xl border border-[#151718]">
            <FaAward className="text-[#A855F7] text-sm" />
            <span className="text-[#E5E7EB] text-xs font-medium">{editor.experience}</span>
          </div>
        )}

        <button
          onClick={() => navigate(`/public-profile/${editor.user?._id}`)}
          className="w-full py-3 bg-white text-black text-sm font-semibold rounded-2xl hover:brightness-95 transition-all duration-200 shadow-[0_8px_30px_rgba(255,255,255,0.04)]"
        >
          View Profile
        </button>
      </div>

      {/* Focus ring on hover */}
      <div
        className={`absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-300`}
        style={{
          boxShadow: isHovered
            ? "inset 0 0 0 1px rgba(255,255,255,0.03), 0 8px 30px rgba(2,6,23,0.6)"
            : "inset 0 0 0 1px rgba(255,255,255,0.01)",
          opacity: isHovered ? 1 : 0.6,
        }}
      />
    </motion.div>
  );
};

export default ExploreEditors;
