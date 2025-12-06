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
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">⚠️</span>
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Oops! Something went wrong</h3>
        <p className="text-gray-500 mb-6">{error}</p>
        <button
          onClick={() => fetchEditors(1, "", filters)}
          className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2.5 rounded-full font-medium hover:shadow-lg transition-all"
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
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
          Find Your Perfect Editor
        </h2>
        <p className="text-gray-500">
          Discover talented video editors ready to bring your vision to life
        </p>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
        {/* Search Input */}
        <div className="relative mb-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search by name, skills, languages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="w-full py-3 pl-12 pr-10 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent focus:bg-white transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                >
                  <FaTimes />
                </button>
              )}
            </div>

            {/* Filter Toggle Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${showFilters || activeFilterCount > 0
                  ? "bg-green-100 text-green-700 border border-green-200"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200"
                }`}
            >
              <FaFilter />
              <span className="hidden sm:inline">Filters</span>
              {activeFilterCount > 0 && (
                <span className="bg-green-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Sort Dropdown */}
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
              className="px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-600 focus:outline-none focus:ring-2 focus:ring-green-400 cursor-pointer"
            >
              <option value="relevance">Relevance</option>
              <option value="experience">Experience</option>
              <option value="newest">Newest</option>
            </select>
          </div>

          {/* Recent Searches Dropdown */}
          {showSuggestions && recentSearches.length > 0 && !searchQuery && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-20">
              <div className="px-4 py-2 text-xs text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <FaHistory /> Recent Searches
              </div>
              {recentSearches.map((search, idx) => (
                <button
                  key={idx}
                  onClick={() => setSearchQuery(search)}
                  className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                >
                  <FaSearch className="text-gray-400 text-sm" />
                  {search}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="pt-4 border-t border-gray-100 space-y-4 animate-in slide-in-from-top duration-200">
            {/* Skills Filter */}
            {filterOptions.skills.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Skills</label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto scrollbar-hide">
                  {filterOptions.skills.slice(0, 20).map((skill) => (
                    <button
                      key={skill}
                      onClick={() => toggleSkillFilter(skill)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filters.skills.includes(skill)
                          ? "bg-green-500 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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
                <label className="text-sm font-medium text-gray-700 mb-2 block">Languages</label>
                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto scrollbar-hide">
                  {filterOptions.languages.slice(0, 15).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => toggleLanguageFilter(lang)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filters.languages.includes(lang)
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Experience and Country Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Experience Dropdown */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Experience</label>
                <select
                  value={filters.experience}
                  onChange={(e) => setFilters({ ...filters, experience: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-400"
                >
                  <option value="">Any experience</option>
                  {filterOptions.experience.map((exp) => (
                    <option key={exp} value={exp}>
                      {exp}
                    </option>
                  ))}
                </select>
              </div>

              {/* Country Dropdown */}
              {filterOptions.countries.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Country</label>
                  <select
                    value={filters.country}
                    onChange={(e) => setFilters({ ...filters, country: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-400"
                  >
                    <option value="">Any country</option>
                    {filterOptions.countries.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Clear Filters Button */}
            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-red-500 hover:text-red-600 text-sm font-medium flex items-center gap-2"
              >
                <FaTimes /> Clear all filters
              </button>
            )}
          </div>
        )}

        {/* Active Filter Tags */}
        {!showFilters && activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2 pt-3">
            {filters.skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
              >
                {skill}
                <button onClick={() => toggleSkillFilter(skill)} className="hover:text-green-900">
                  <FaTimes className="text-xs" />
                </button>
              </span>
            ))}
            {filters.languages.map((lang) => (
              <span
                key={lang}
                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
              >
                {lang}
                <button onClick={() => toggleLanguageFilter(lang)} className="hover:text-blue-900">
                  <FaTimes className="text-xs" />
                </button>
              </span>
            ))}
            {filters.experience && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                {filters.experience}
                <button
                  onClick={() => setFilters({ ...filters, experience: "" })}
                  className="hover:text-purple-900"
                >
                  <FaTimes className="text-xs" />
                </button>
              </span>
            )}
            {filters.country && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                {filters.country}
                <button
                  onClick={() => setFilters({ ...filters, country: "" })}
                  className="hover:text-orange-900"
                >
                  <FaTimes className="text-xs" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Results Info */}
      <div className="flex items-center justify-between mb-6 px-1">
        <p className="text-gray-500 text-sm">
          <span className="font-semibold text-gray-700">{pagination.total}</span> editor
          {pagination.total !== 1 ? "s" : ""} found
          {searchQuery && <span className="text-gray-400"> for "{searchQuery}"</span>}
        </p>
        {pagination.pages > 1 && (
          <p className="text-gray-400 text-sm">
            Page {pagination.page} of {pagination.pages}
          </p>
        )}
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 animate-pulse shadow-sm border border-gray-100">
              <div className="h-20 bg-gray-200 rounded-t-xl -mx-5 -mt-5 mb-4" />
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gray-200 rounded-xl -mt-12" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-28 bg-gray-200 rounded" />
                  <div className="h-3 w-20 bg-gray-200 rounded" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-3 w-full bg-gray-200 rounded" />
                <div className="h-3 w-3/4 bg-gray-200 rounded" />
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
              <EditorCard key={editor._id} editor={editor} navigate={navigate} searchQuery={searchQuery} />
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-10">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
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
                      className={`w-10 h-10 rounded-full font-medium transition-all ${pagination.page === pageNum
                          ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md"
                          : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
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
                className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
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
        <mark key={i} className="bg-yellow-200 rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div
      className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 card-hover"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Top Gradient Banner */}
      <div className="h-20 bg-gradient-to-br from-green-400 via-emerald-500 to-teal-500 relative">
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id={`grid-${editor._id}`} width="10" height="10" patternUnits="userSpaceOnUse">
                <circle cx="5" cy="5" r="1" fill="white" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill={`url(#grid-${editor._id})`} />
          </svg>
        </div>

        {editor.verified && (
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 text-xs font-medium text-green-600">
            <FaCheckCircle /> Verified
          </div>
        )}
      </div>

      {/* Profile Picture */}
      <div className="relative px-5 -mt-10">
        <div className="relative inline-block">
          <img
            src={editor.user?.profilePicture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
            alt={editor.user?.name}
            className="w-20 h-20 rounded-xl object-cover border-4 border-white shadow-lg group-hover:scale-105 transition-transform duration-300"
          />
          <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-3 border-white shadow-sm" />
        </div>
      </div>

      {/* Content */}
      <div className="px-5 pt-3 pb-5">
        <div className="mb-3">
          <h3 className="font-bold text-lg text-gray-800 group-hover:text-green-600 transition-colors line-clamp-1">
            {highlightMatch(editor.user?.name, searchQuery)}
          </h3>
          <p className="text-gray-500 text-sm flex items-center gap-1.5">
            <FaBriefcase className="text-green-500 text-xs" />
            <span className="capitalize">{editor.user?.role || "Video Editor"}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg">
            <FaStar className="text-amber-400 text-sm" />
            <span className="font-semibold text-gray-800 text-sm">{rating}</span>
          </div>
          <span className="text-gray-400 text-xs">({reviewCount} reviews)</span>
        </div>

        {editor.location?.country && (
          <div className="flex items-center gap-1.5 text-gray-500 text-sm mb-3">
            <FaMapMarkerAlt className="text-green-500 text-xs" />
            <span>{highlightMatch(editor.location.country, searchQuery)}</span>
          </div>
        )}

        {editor.skills?.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-gray-400 mb-1.5 flex items-center gap-1">
              <FaCode className="text-green-500" /> Skills
            </p>
            <div className="flex flex-wrap gap-1.5">
              {editor.skills.filter(Boolean).slice(0, 4).map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 rounded-lg text-xs font-medium border border-green-100"
                >
                  {skill}
                </span>
              ))}
              {editor.skills.filter(Boolean).length > 4 && (
                <span className="px-2.5 py-1 bg-gray-100 text-gray-500 rounded-lg text-xs font-medium">
                  +{editor.skills.filter(Boolean).length - 4}
                </span>
              )}
            </div>
          </div>
        )}

        {editor.languages?.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-400 mb-1.5 flex items-center gap-1">
              <FaGlobe className="text-blue-500" /> Languages
            </p>
            <div className="flex flex-wrap gap-1.5">
              {editor.languages.filter(Boolean).slice(0, 3).map((lang, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium border border-blue-100"
                >
                  {lang}
                </span>
              ))}
              {editor.languages.filter(Boolean).length > 3 && (
                <span className="px-2.5 py-1 bg-gray-100 text-gray-500 rounded-lg text-xs font-medium">
                  +{editor.languages.filter(Boolean).length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        {editor.experience && (
          <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
            <FaAward className="text-purple-500" />
            <span className="text-purple-700 text-sm font-medium">{editor.experience}</span>
          </div>
        )}

        <button
          onClick={() => navigate(`/editor/${editor.user?._id}`)}
          className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-sm hover:shadow-lg active:scale-[0.98]"
        >
          View Profile
        </button>
      </div>

      <div
        className={`absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-300 ${isHovered ? "opacity-100" : "opacity-0"
          }`}
        style={{ boxShadow: "inset 0 0 0 2px rgba(34, 197, 94, 0.3)" }}
      />
    </div>
  );
};

export default ExploreEditors;
