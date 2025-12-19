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
} from "react-icons/fa";
import { useAppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import EmptyState from "./EmptyState.jsx";
import { motion, AnimatePresence } from "framer-motion";

/**
 * ExploreEditors - Professional Design
 * Dark base with light: variant overrides for theme toggle
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

  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 1 });
  const [filterOptions, setFilterOptions] = useState({ skills: [], languages: [], countries: [], experience: [] });
  const [filters, setFilters] = useState({ skills: [], languages: [], experience: "", country: "", sortBy: "relevance" });

  const navigate = useNavigate();

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

  const clearAllFilters = () => {
    setFilters({ skills: [], languages: [], experience: "", country: "", sortBy: "relevance" });
    setSearchQuery("");
  };

  const activeFilterCount = filters.skills.length + filters.languages.length + (filters.experience ? 1 : 0) + (filters.country ? 1 : 0);

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
    <div className="min-h-[50vh]" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-2xl mx-auto">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 light:text-slate-400" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search by name, skills, languages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            className="w-full py-3.5 pl-12 pr-12 bg-white/5 light:bg-slate-50 border border-white/10 light:border-slate-200 rounded-xl text-white light:text-slate-900 placeholder:text-gray-500 light:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 light:focus:border-emerald-300 transition-all"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 light:text-slate-400 hover:text-gray-300 light:hover:text-slate-600">
              <FaTimes />
            </button>
          )}

          <AnimatePresence>
            {showSuggestions && recentSearches.length > 0 && !searchQuery && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="absolute top-full left-0 right-0 mt-2 bg-[#0a0a0c] light:bg-white rounded-xl shadow-xl border border-white/10 light:border-slate-200 py-2 z-20 overflow-hidden"
              >
                <div className="px-4 py-2 text-xs text-gray-500 light:text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <FaHistory /> Recent Searches
                </div>
                {recentSearches.map((search, idx) => (
                  <button key={idx} onClick={() => setSearchQuery(search)} className="w-full px-4 py-2.5 text-left text-gray-300 light:text-slate-700 hover:bg-white/5 light:hover:bg-slate-50 flex items-center gap-3 text-sm">
                    <FaSearch className="text-gray-500 light:text-slate-400 text-xs" />
                    {search}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

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
              <EditorCard key={editor._id} editor={editor} navigate={navigate} searchQuery={searchQuery} />
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
const EditorCard = ({ editor, navigate, searchQuery }) => {
  // Use real ratings from profile ratingStats, fallback to N/A
  const hasRatings = editor.ratingStats && editor.ratingStats.totalReviews > 0;
  const rating = hasRatings ? editor.ratingStats.averageRating?.toFixed(1) : null;
  const reviewCount = hasRatings ? editor.ratingStats.totalReviews : 0;

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
      className="group bg-[#0a0a0c] light:bg-white rounded-2xl overflow-hidden border border-white/10 light:border-slate-200 hover:border-emerald-500/30 light:hover:border-emerald-300 hover:shadow-xl transition-all duration-300 cursor-pointer"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
    >
      {/* Header with Avatar */}
      <div className="p-5 pb-4">
        <div className="flex items-start gap-4">
          <div className="relative flex-shrink-0">
            <img src={editor.user?.profilePicture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} alt={editor.user?.name} className="w-14 h-14 rounded-full object-cover border-2 border-white/10 light:border-slate-100 group-hover:border-emerald-500/30 light:group-hover:border-emerald-200 transition-colors" />
            <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#0a0a0c] light:border-white" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-white light:text-slate-900 truncate text-base" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {highlightMatch(editor.user?.name, searchQuery)}
              </h3>
              {editor.verified && <FaCheckCircle className="text-emerald-500 text-sm flex-shrink-0" />}
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
