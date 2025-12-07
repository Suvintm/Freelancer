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

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 1,
  });

  // Filter options from API
  const [filterOptions, setFilterOptions] = useState({
    skills: [],
    languages: [],
    countries: [],
    experience: [],
  });

  // Active filters
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
      setRecentSearches(JSON.parse(saved).slice(0, 5));
    }
  }, []);

  // Save search to recent
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
  }, [backendURL, user]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        saveToRecentSearches(searchQuery);
      }
      fetchEditors(1, searchQuery, filters);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Re-fetch when filters change
  useEffect(() => {
    fetchEditors(1, searchQuery, filters);
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
      <div className="text-center py-16">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">⚠️</span>
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">
          Oops! Something went wrong
        </h3>
        <p className="text-[#9CA3AF] mb-6">{error}</p>
        <button
          onClick={() => fetchEditors(1, "", filters)}
          className="bg-[#1463FF] hover:bg-[#275DFF] text-white px-6 py-2.5 rounded-full font-medium shadow-[0_10px_30px_rgba(20,99,255,0.6)] transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh]">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
          Find Your Perfect Editor
        </h2>
        <p className="text-[#9CA3AF]">
          Discover talented video editors ready to bring your vision to life
        </p>
      </div>

      {/* Search and Filter Bar */}
      {/* Search + Filters Container */}
{/* MOBILE SEARCH + FILTERS */}
<div className="flex flex-col gap-3 md:hidden relative">

  {/* Search Bar */}
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
      className="w-full py-3 pl-12 pr-10 bg-[#151823] border border-[#262A3B] rounded-2xl text-white placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#1463FF]"
    />

    {searchQuery && (
      <button
        onClick={() => setSearchQuery("")}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#D1D5DB]"
      >
        <FaTimes />
      </button>
    )}

    {/* Recent Searches Dropdown */}
    <AnimatePresence>
      {showSuggestions &&
        recentSearches.length > 0 &&
        !searchQuery && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 bg-[#111319] rounded-2xl shadow-xl border border-[#262A3B] py-2 z-20 overflow-hidden"
          >
            <div className="px-4 py-2 text-xs text-[#6B7280] uppercase tracking-wider flex items-center gap-2">
              <FaHistory /> Recent Searches
            </div>

            {recentSearches.map((search, idx) => (
              <button
                key={idx}
                onClick={() => setSearchQuery(search)}
                className="w-full px-4 py-2 text-left text-[#E5E7EB] hover:bg-[#151823] flex items-center gap-3 text-sm"
              >
                <FaSearch className="text-[#6B7280] text-xs" />
                {search}
              </button>
            ))}
          </motion.div>
        )}
    </AnimatePresence>
  </div>

  {/* Buttons Row (Filters + Sort) */}
  <div className="flex items-center gap-3">

    {/* Filter Button */}
    <button
      onClick={() => setShowFilters(!showFilters)}
      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-medium border transition-all ${
        showFilters || activeFilterCount > 0
          ? "bg-[#111827] text-[#BFDBFE] border-[#1D4ED8]"
          : "bg-[#151823] text-[#9CA3AF] border-[#262A3B] hover:bg-[#181A29]"
      }`}
    >
      <FaFilter className="text-xs" />
      Filters
      {activeFilterCount > 0 && (
        <span className="bg-[#1463FF] text-white text-xs px-2 py-0.5 rounded-full">
          {activeFilterCount}
        </span>
      )}
    </button>

    {/* Sort Dropdown */}
    <div className="relative w-32">
      <FaSortAmountDown className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280] text-xs" />
      <select
        value={filters.sortBy}
        onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
        className="w-full pl-9 pr-4 py-3 bg-[#151823] border border-[#262A3B] rounded-2xl text-sm text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1463FF]"
      >
        <option value="relevance">Relevance</option>
        <option value="experience">Experience</option>
        <option value="newest">Newest</option>
      </select>
    </div>

  </div>

  {/* Animated Filters Section */}
  <AnimatePresence>
    {showFilters && (
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="overflow-hidden"
      >
        <div className="pt-4 border-t border-[#262A3B] space-y-4">

          {/* Skills Filter */}
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
                        ? "bg-[#1463FF] text-white"
                        : "bg-[#151823] text-[#9CA3AF] hover:bg-[#181A29]"
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Languages Filter */}
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
                        ? "bg-[#1D4ED8] text-white"
                        : "bg-[#151823] text-[#9CA3AF] hover:bg-[#181A29]"
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
      <div className="flex items-center justify-between mb-6 px-1">
        <p className="text-[#9CA3AF] text-sm">
          <span className="font-semibold text-white">
            {pagination.total}
          </span>{" "}
          editor{pagination.total !== 1 ? "s" : ""} found
          {searchQuery && (
            <span className="text-[#6B7280]"> for "{searchQuery}"</span>
          )}
        </p>
        {pagination.pages > 1 && (
          <p className="text-[#6B7280] text-xs sm:text-sm">
            Page {pagination.page} of {pagination.pages}
          </p>
        )}
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-[#111319] rounded-2xl p-5 animate-pulse shadow-[0_16px_35px_rgba(0,0,0,0.7)] border border-[#262A3B]"
            >
              <div className="h-20 bg-[#1F2933] rounded-t-xl -mx-5 -mt-5 mb-4" />
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-[#1F2933] rounded-xl -mt-12" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-28 bg-[#1F2933] rounded" />
                  <div className="h-3 w-20 bg-[#1F2933] rounded" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-3 w-full bg-[#1F2933] rounded" />
                <div className="h-3 w-3/4 bg-[#1F2933] rounded" />
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
          {/* Editor Cards Grid */}
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
                className="w-10 h-10 rounded-full bg-[#111319] border border-[#262A3B] flex items-center justify-center text-[#9CA3AF] hover:bg-[#151823] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-[0_10px_25px_rgba(0,0,0,0.7)]"
              >
                <FaChevronLeft className="text-sm" />
              </button>

              <div className="flex gap-1">
                {Array.from(
                  { length: Math.min(5, pagination.pages) },
                  (_, i) => {
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
                            ? "bg-[#1463FF] text-white shadow-[0_12px_30px_rgba(20,99,255,0.7)]"
                            : "bg-[#111319] border border-[#262A3B] text-[#9CA3AF] hover:bg-[#151823]"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                )}
              </div>

              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="w-10 h-10 rounded-full bg-[#111319] border border-[#262A3B] flex items-center justify-center text-[#9CA3AF] hover:bg-[#151823] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-[0_10px_25px_rgba(0,0,0,0.7)]"
              >
                <FaChevronRight className="text-sm" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Premium Editor Card Component
const EditorCard = ({ editor, navigate, searchQuery }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Generate consistent rating based on editor id
  const rating = (4 + (editor._id?.charCodeAt(0) % 10) / 10).toFixed(1);
  const reviewCount = 5 + (editor._id?.charCodeAt(1) % 50);

  // Highlight matching text
  const highlightMatch = (text, query) => {
    if (!query || !text) return text;
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-[#FACC15]/30 rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div
      className="group relative bg-[#111319] rounded-3xl overflow-hidden shadow-[0_18px_40px_rgba(0,0,0,0.8)] transition-all duration-300 border border-[#262A3B] hover:-translate-y-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Top Gradient Banner */}
      <div className="h-20 bg-gradient-to-br from-[#1463FF] via-[#2739FF] to-[#020617] relative">
        <div className="absolute inset-0 opacity-30">
          <svg
            className="w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <defs>
              <pattern
                id={`grid-${editor._id}`}
                width="10"
                height="10"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="5" cy="5" r="1" fill="white" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill={`url(#grid-${editor._id})`} />
          </svg>
        </div>

        {editor.verified && (
          <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-md px-2 py-1 rounded-full flex items-center gap-1 text-[10px] font-medium text-[#BFDBFE] border border-white/10">
            <FaCheckCircle className="text-[#22C55E]" /> Verified
          </div>
        )}
      </div>

      {/* Profile Picture */}
      <div className="relative px-5 -mt-10">
        <div className="relative inline-block">
          <img
            src={
              editor.user?.profilePicture ||
              "https://cdn-icons-png.flaticon.com/512/149/149071.png"
            }
            alt={editor.user?.name}
            className="w-20 h-20 rounded-2xl object-cover border-4 border-[#050509] shadow-[0_14px_40px_rgba(0,0,0,0.8)] group-hover:scale-105 transition-transform duration-300"
          />
          <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#22C55E] rounded-full border-4 border-[#050509] shadow-[0_0_12px_rgba(34,197,94,0.9)]" />
        </div>
      </div>

      {/* Content */}
      <div className="px-5 pt-3 pb-5 text-sm">
        <div className="mb-3">
          <h3 className="font-semibold text-base text-white group-hover:text-[#BFDBFE] transition-colors line-clamp-1">
            {highlightMatch(editor.user?.name, searchQuery)}
          </h3>
          <p className="text-[#9CA3AF] text-xs flex items-center gap-1.5 mt-0.5">
            <FaBriefcase className="text-[#60A5FA] text-[11px]" />
            <span className="capitalize">
              {editor.user?.role || "Video Editor"}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1 bg-[#1F2933] px-2 py-1 rounded-lg">
            <FaStar className="text-[#FACC15] text-xs" />
            <span className="font-semibold text-xs text-[#E5E7EB]">
              {rating}
            </span>
          </div>
          <span className="text-[#6B7280] text-[11px]">
            ({reviewCount} reviews)
          </span>
        </div>

        {editor.location?.country && (
          <div className="flex items-center gap-1.5 text-[#9CA3AF] text-xs mb-3">
            <FaMapMarkerAlt className="text-[#60A5FA] text-[11px]" />
            <span>{highlightMatch(editor.location.country, searchQuery)}</span>
          </div>
        )}

        {editor.skills?.length > 0 && (
          <div className="mb-3">
            <p className="text-[11px] text-[#6B7280] mb-1.5 flex items-center gap-1">
              <FaCode className="text-[#60A5FA] text-[11px]" /> Skills
            </p>
            <div className="flex flex-wrap gap-1.5">
              {editor.skills
                .filter(Boolean)
                .slice(0, 4)
                .map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 bg-[#111827] text-[#BFDBFE] rounded-xl text-[11px] font-medium border border-[#1D4ED8]/40"
                  >
                    {skill}
                  </span>
                ))}
              {editor.skills.filter(Boolean).length > 4 && (
                <span className="px-2.5 py-1 bg-[#111319] text-[#9CA3AF] rounded-xl text-[11px] font-medium border border-[#262A3B]">
                  +{editor.skills.filter(Boolean).length - 4}
                </span>
              )}
            </div>
          </div>
        )}

        {editor.languages?.length > 0 && (
          <div className="mb-4">
            <p className="text-[11px] text-[#6B7280] mb-1.5 flex items-center gap-1">
              <FaGlobe className="text-[#38BDF8] text-[11px]" /> Languages
            </p>
            <div className="flex flex-wrap gap-1.5">
              {editor.languages
                .filter(Boolean)
                .slice(0, 3)
                .map((lang, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 bg-[#020617] text-[#7DD3FC] rounded-xl text-[11px] font-medium border border-[#0EA5E9]/40"
                  >
                    {lang}
                  </span>
                ))}
              {editor.languages.filter(Boolean).length > 3 && (
                <span className="px-2.5 py-1 bg-[#111319] text-[#9CA3AF] rounded-xl text-[11px] font-medium border border-[#262A3B]">
                  +{editor.languages.filter(Boolean).length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        {editor.experience && (
          <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-gradient-to-r from-[#1E1B4B] via-[#312E81] to-[#111827] rounded-2xl border border-[#4C1D95]/60">
            <FaAward className="text-[#A855F7] text-sm" />
            <span className="text-[#E9D5FF] text-xs font-medium">
              {editor.experience}
            </span>
          </div>
        )}

        <button
          onClick={() => navigate(`/public-profile/${editor.user?._id}`)}
          className="w-full py-3 bg-[#1463FF] text-white text-sm font-semibold rounded-2xl hover:bg-[#275DFF] transition-all duration-300 shadow-[0_14px_40px_rgba(20,99,255,0.8)] hover:shadow-[0_18px_45px_rgba(20,99,255,0.95)] active:scale-[0.98]"
        >
          View Profile
        </button>
      </div>

      <div
        className={`absolute inset-0 rounded-3xl pointer-events-none transition-opacity duration-300 ${
          isHovered ? "opacity-100" : "opacity-0"
        }`}
        style={{ boxShadow: "inset 0 0 0 1px rgba(37, 99, 235, 0.35)" }}
      />
    </div>
  );
};

export default ExploreEditors;
