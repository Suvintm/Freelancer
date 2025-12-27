/**
 * Open Briefs Page - Professional Corporate Design
 * Editors browse available client projects
 */
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  HiSearch,
  HiAdjustments,
  HiCurrencyRupee,
  HiClock,
  HiEye,
  HiUserGroup,
  HiFire,
  HiExternalLink,
  HiChevronRight,
  HiChevronDown,
  HiRefresh,
  HiClipboardList,
  HiVideoCamera,
  HiPhotograph,
  HiSparkles,
  HiDeviceMobile,
  HiFilm,
  HiFolder,
  HiCollection,
} from "react-icons/hi";
import { useAppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import Sidebar from "../components/Sidebar.jsx";
import EditorNavbar from "../components/EditorNavbar.jsx";

const CATEGORIES = [
  { value: "", label: "All Categories" },
  { value: "video", label: "Video Editing" },
  { value: "image", label: "Image Editing" },
  { value: "thumbnail", label: "Thumbnails" },
  { value: "motion-graphics", label: "Motion Graphics" },
  { value: "reel", label: "Reels" },
  { value: "short", label: "Shorts" },
  { value: "other", label: "Other" },
];

const SKILL_LEVELS = [
  { value: "", label: "All Levels" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "expert", label: "Expert" },
];

const SORT_OPTIONS = [
  { value: "-createdAt", label: "Newest First" },
  { value: "deadline", label: "Ending Soon" },
  { value: "budget_high", label: "Budget: High" },
  { value: "budget_low", label: "Budget: Low" },
  { value: "popular", label: "Most Popular" },
];

const OpenBriefsPage = () => {
  const { backendURL, user } = useAppContext();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [briefs, setBriefs] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filters
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [skillLevel, setSkillLevel] = useState("");
  const [sortBy, setSortBy] = useState("-createdAt");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Fetch briefs
  const fetchBriefs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "12",
        sort: sortBy,
      });

      if (search) params.append("search", search);
      if (category) params.append("category", category);
      if (skillLevel) params.append("skillLevel", skillLevel);
      if (budgetMin) params.append("budgetMin", budgetMin);
      if (budgetMax) params.append("budgetMax", budgetMax);

      const res = await axios.get(`${backendURL}/api/briefs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });

      setBriefs(res.data.briefs || []);
      setTotalPages(res.data.pagination?.pages || 1);
      setTotal(res.data.pagination?.total || 0);
    } catch (_) {
      toast.error("Failed to load briefs");
    } finally {
      setLoading(false);
    }
  }, [backendURL, user?.token, page, sortBy, search, category, skillLevel, budgetMin, budgetMax]);

  useEffect(() => {
    if (user?.token) {
      fetchBriefs();
    }
  }, [user?.token, fetchBriefs]);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchBriefs();
  };

  // Days remaining
  const getDaysRemaining = (deadline) => {
    const days = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  };

  // Format budget
  const formatBudget = (min, max) => {
    if (min >= 1000 || max >= 1000) {
      return `₹${Math.round(min/1000)}k - ₹${Math.round(max/1000)}k`;
    }
    return `₹${min} - ₹${max}`;
  };

  // Get category icon
  const getCategoryIcon = (cat) => {
    const icons = {
      video: HiVideoCamera,
      image: HiPhotograph,
      thumbnail: HiCollection,
      "motion-graphics": HiSparkles,
      reel: HiDeviceMobile,
      short: HiFilm,
      other: HiFolder,
    };
    return icons[cat] || HiClipboardList;
  };

  // Shimmer
  const ShimmerCard = () => (
    <div className="bg-[#0A0A0C] light:bg-white border border-[#1a1a1f] light:border-slate-200 rounded-xl p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 bg-[#151518] light:bg-slate-100 rounded-lg" />
        <div className="flex-1">
          <div className="h-4 bg-[#151518] light:bg-slate-100 rounded w-3/4 mb-2" />
          <div className="h-3 bg-[#151518] light:bg-slate-100 rounded w-1/2" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#030303] light:bg-slate-50 text-white light:text-slate-900 transition-colors duration-300" style={{ fontFamily: "'Inter', sans-serif" }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <EditorNavbar onMenuClick={() => setSidebarOpen(true)} />

      <main className="flex-1 px-4 md:px-6 py-5 md:ml-64 md:mt-20">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <HiClipboardList className="text-blue-400 text-lg" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white light:text-slate-900">Open Briefs</h1>
              <p className="text-gray-500 text-[10px]">{total} projects available</p>
            </div>
          </div>
          <button
            onClick={() => fetchBriefs()}
            className="p-2 rounded-lg bg-[#0A0A0C] light:bg-white border border-[#1a1a1f] light:border-slate-200 text-gray-400 hover:text-white transition-colors"
          >
            <HiRefresh className={`text-sm ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Search & Filters */}
        <div className="mb-5 space-y-3">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search briefs..."
                className="w-full bg-[#0A0A0C] light:bg-white border border-[#1a1a1f] light:border-slate-200 rounded-lg pl-9 pr-4 py-2.5 text-xs text-white light:text-slate-900 placeholder:text-gray-600 focus:border-[#2a2a30] outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-2.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                showFilters 
                  ? "bg-white light:bg-slate-900 text-black light:text-white border-white"
                  : "bg-[#0A0A0C] light:bg-white text-gray-400 border-[#1a1a1f] light:border-slate-200"
              }`}
            >
              <HiAdjustments /> Filters
            </button>
          </form>

          {/* Filters Panel */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="bg-[#0A0A0C] light:bg-white border border-[#1a1a1f] light:border-slate-200 rounded-xl p-4"
            >
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div>
                  <label className="text-[10px] text-gray-500 uppercase mb-1 block">Category</label>
                  <select
                    value={category}
                    onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                    className="w-full bg-[#050506] light:bg-slate-50 border border-[#1a1a1f] light:border-slate-200 rounded-lg px-3 py-2 text-xs text-white light:text-slate-900"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase mb-1 block">Skill Level</label>
                  <select
                    value={skillLevel}
                    onChange={(e) => { setSkillLevel(e.target.value); setPage(1); }}
                    className="w-full bg-[#050506] light:bg-slate-50 border border-[#1a1a1f] light:border-slate-200 rounded-lg px-3 py-2 text-xs text-white light:text-slate-900"
                  >
                    {SKILL_LEVELS.map((level) => (
                      <option key={level.value} value={level.value}>{level.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase mb-1 block">Min Budget</label>
                  <input
                    type="number"
                    value={budgetMin}
                    onChange={(e) => setBudgetMin(e.target.value)}
                    placeholder="₹500"
                    className="w-full bg-[#050506] light:bg-slate-50 border border-[#1a1a1f] light:border-slate-200 rounded-lg px-3 py-2 text-xs text-white light:text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase mb-1 block">Max Budget</label>
                  <input
                    type="number"
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(e.target.value)}
                    placeholder="₹50000"
                    className="w-full bg-[#050506] light:bg-slate-50 border border-[#1a1a1f] light:border-slate-200 rounded-lg px-3 py-2 text-xs text-white light:text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase mb-1 block">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                    className="w-full bg-[#050506] light:bg-slate-50 border border-[#1a1a1f] light:border-slate-200 rounded-lg px-3 py-2 text-xs text-white light:text-slate-900"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Briefs Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => <ShimmerCard key={i} />)}
          </div>
        ) : briefs.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#0A0A0C] light:bg-slate-100 flex items-center justify-center">
              <HiClipboardList className="text-2xl text-gray-500" />
            </div>
            <h3 className="text-sm font-medium text-white light:text-slate-900 mb-1">No Briefs Found</h3>
            <p className="text-gray-500 text-xs">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {briefs.map((brief, index) => {
              const daysLeft = getDaysRemaining(brief.applicationDeadline);
              const CategoryIcon = getCategoryIcon(brief.category);
              
              return (
                <motion.div
                  key={brief._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => navigate(`/brief/${brief._id}`)}
                  className="bg-[#0A0A0C] light:bg-white border border-[#1a1a1f] light:border-slate-200 rounded-xl p-4 cursor-pointer hover:border-[#2a2a30] light:hover:border-slate-300 transition-all group"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-9 h-9 rounded-lg bg-[#151518] light:bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <CategoryIcon className="text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        {brief.isUrgent && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center gap-0.5">
                            <HiFire className="text-[9px]" /> Urgent
                          </span>
                        )}
                        <span className="px-1.5 py-0.5 rounded text-[9px] text-gray-500 bg-[#151518] light:bg-slate-100 capitalize">
                          {brief.category}
                        </span>
                      </div>
                      <h3 className="text-sm font-medium text-white light:text-slate-900 group-hover:text-blue-400 transition-colors line-clamp-1">
                        {brief.title}
                      </h3>
                    </div>
                  </div>

                  <p className="text-gray-500 text-[11px] line-clamp-2 mb-3">{brief.description}</p>

                  <div className="flex flex-wrap items-center gap-2 mb-3 text-[10px]">
                    <span className="flex items-center gap-1 text-emerald-400 font-medium">
                      <HiCurrencyRupee />
                      {formatBudget(brief.budget.min, brief.budget.max)}
                    </span>
                    <span className="flex items-center gap-1 text-gray-500">
                      <HiClock />
                      {brief.expectedDeliveryDays}d delivery
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[#1a1a1f] light:border-slate-100">
                    <div className="flex items-center gap-3 text-[10px] text-gray-500">
                      <span className="flex items-center gap-1">
                        <HiUserGroup /> {brief.proposalCount} bids
                      </span>
                      <span className={`flex items-center gap-1 ${daysLeft <= 2 ? "text-red-400" : ""}`}>
                        <HiClock /> {daysLeft}d left
                      </span>
                    </div>
                    <HiChevronRight className="text-gray-500 group-hover:text-blue-400 transition-colors" />
                  </div>

                  {/* Client */}
                  {brief.client && (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#1a1a1f] light:border-slate-100">
                      <img
                        src={brief.client.profilePicture || "/default-avatar.png"}
                        alt=""
                        className="w-5 h-5 rounded-full object-cover"
                      />
                      <span className="text-[10px] text-gray-400">{brief.client.name}</span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-2 rounded-lg bg-[#0A0A0C] light:bg-white border border-[#1a1a1f] light:border-slate-200 text-xs text-gray-400 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-xs text-gray-500">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-3 py-2 rounded-lg bg-[#0A0A0C] light:bg-white border border-[#1a1a1f] light:border-slate-200 text-xs text-gray-400 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default OpenBriefsPage;
