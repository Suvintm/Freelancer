/**
 * ExploreJobs - Job listing component for home page tabs
 * Similar to ExploreGigs but for job postings
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineBriefcase,
  HiOutlineMapPin,
  HiOutlineCurrencyRupee,
  HiOutlineClock,
  HiOutlineSparkles,
  HiOutlineFunnel,
  HiOutlineChevronDown,
  HiOutlineCheckBadge,
  HiOutlineXMark,
} from "react-icons/hi2";
import { FaBolt, FaFilter } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import axios from "axios";

// Category options
const CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "youtube", label: "YouTube" },
  { value: "instagram-reels", label: "Instagram Reels" },
  { value: "shorts", label: "Shorts" },
  { value: "wedding", label: "Wedding" },
  { value: "corporate", label: "Corporate" },
  { value: "music-video", label: "Music Video" },
  { value: "podcast", label: "Podcast" },
  { value: "ads", label: "Ads" },
  { value: "social-media", label: "Social Media" },
];

// Experience levels
const EXPERIENCE_LEVELS = [
  { value: "all", label: "All Levels" },
  { value: "fresher", label: "Fresher" },
  { value: "1-3-years", label: "1-3 Years" },
  { value: "3-5-years", label: "3-5 Years" },
  { value: "5-plus-years", label: "5+ Years" },
];

// Work types
const WORK_TYPES = [
  { value: "all", label: "All Types" },
  { value: "remote", label: "Remote" },
  { value: "onsite", label: "On-site" },
  { value: "hybrid", label: "Hybrid" },
];

const ExploreJobs = () => {
  const navigate = useNavigate();
  const { user, backendURL } = useAppContext();
  
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    category: "all",
    experienceLevel: "all",
    workType: "all",
    sortBy: "newest",
  });

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filters]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page,
        limit: 12,
        sortBy: filters.sortBy,
      });

      if (filters.category !== "all") params.append("category", filters.category);
      if (filters.experienceLevel !== "all") params.append("experienceLevel", filters.experienceLevel);
      if (filters.workType !== "all") params.append("workType", filters.workType);

      const res = await axios.get(`${backendURL}/api/jobs?${params.toString()}`);
      
      setJobs(res.data.jobs || []);
      setTotalPages(res.data.pagination?.pages || 1);
      setTotal(res.data.pagination?.total || 0);
    } catch (err) {
      console.error("Failed to fetch jobs:", err);
      setError("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({
      category: "all",
      experienceLevel: "all",
      workType: "all",
      sortBy: "newest",
    });
    setPage(1);
  };

  const getDaysAgo = (date) => {
    const days = Math.floor((new Date() - new Date(date)) / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
  };

  const getDeadlineText = (deadline) => {
    const days = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
    if (days < 0) return "Closed";
    if (days === 0) return "Last day!";
    if (days === 1) return "1 day left";
    return `${days} days left`;
  };

  return (
    <div>
      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {/* Category Dropdown */}
        <select
          value={filters.category}
          onChange={(e) => handleFilterChange("category", e.target.value)}
          className="px-3 py-2 bg-zinc-800/60 light:bg-zinc-100 border border-zinc-700 light:border-zinc-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {CATEGORIES.map(cat => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>

        {/* Experience Level */}
        <select
          value={filters.experienceLevel}
          onChange={(e) => handleFilterChange("experienceLevel", e.target.value)}
          className="px-3 py-2 bg-zinc-800/60 light:bg-zinc-100 border border-zinc-700 light:border-zinc-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {EXPERIENCE_LEVELS.map(exp => (
            <option key={exp.value} value={exp.value}>{exp.label}</option>
          ))}
        </select>

        {/* Work Type */}
        <select
          value={filters.workType}
          onChange={(e) => handleFilterChange("workType", e.target.value)}
          className="px-3 py-2 bg-zinc-800/60 light:bg-zinc-100 border border-zinc-700 light:border-zinc-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {WORK_TYPES.map(wt => (
            <option key={wt.value} value={wt.value}>{wt.label}</option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={filters.sortBy}
          onChange={(e) => handleFilterChange("sortBy", e.target.value)}
          className="px-3 py-2 bg-zinc-800/60 light:bg-zinc-100 border border-zinc-700 light:border-zinc-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="newest">Newest</option>
          <option value="budget-high">Budget: High to Low</option>
          <option value="budget-low">Budget: Low to High</option>
          <option value="urgent">Urgent First</option>
        </select>

        {/* Clear Filters */}
        {(filters.category !== "all" || filters.experienceLevel !== "all" || filters.workType !== "all") && (
          <button
            onClick={clearFilters}
            className="px-3 py-2 bg-red-500/10 text-red-400 rounded-lg text-xs flex items-center gap-1 hover:bg-red-500/20"
          >
            <HiOutlineXMark className="w-3 h-3" /> Clear
          </button>
        )}

        <span className="ml-auto text-xs text-zinc-500">
          {total} jobs found
        </span>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse bg-zinc-800/40 light:bg-zinc-100 rounded-xl p-4">
              <div className="h-4 bg-zinc-700/50 light:bg-zinc-200 rounded w-3/4 mb-3" />
              <div className="h-3 bg-zinc-700/50 light:bg-zinc-200 rounded w-1/2 mb-4" />
              <div className="flex gap-2">
                <div className="h-6 bg-zinc-700/50 light:bg-zinc-200 rounded w-16" />
                <div className="h-6 bg-zinc-700/50 light:bg-zinc-200 rounded w-20" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="text-center py-10 text-red-400">
          <p>{error}</p>
          <button onClick={fetchJobs} className="mt-2 text-indigo-400 hover:underline text-sm">
            Try again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && jobs.length === 0 && (
        <div className="text-center py-10 text-zinc-500">
          <HiOutlineBriefcase className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No jobs found</p>
          <p className="text-xs mt-1">Try adjusting your filters</p>
        </div>
      )}

      {/* Jobs Grid */}
      {!loading && !error && jobs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((job, idx) => (
            <motion.div
              key={job._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              onClick={() => navigate(`/jobs/${job._id}`)}
              className="bg-zinc-800/40 light:bg-white border border-zinc-700/50 light:border-zinc-200 rounded-xl p-4 cursor-pointer hover:border-indigo-500/30 transition-all group"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate group-hover:text-indigo-400 transition-colors">
                    {job.title}
                  </h3>
                  <p className="text-xs text-zinc-500 truncate">
                    by {job.postedBy?.name || "Unknown"}
                  </p>
                </div>
                {job.isUrgent && (
                  <span className="px-2 py-0.5 bg-red-500/10 text-red-400 text-[9px] font-bold rounded-full flex items-center gap-1 shrink-0">
                    <FaBolt className="w-2 h-2" /> URGENT
                  </span>
                )}
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-[10px] font-medium rounded-full capitalize">
                  {job.category?.replace("-", " ")}
                </span>
                <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 text-[10px] font-medium rounded-full capitalize">
                  {job.workType}
                </span>
                <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] font-medium rounded-full capitalize">
                  {job.experienceLevel?.replace("-", " ")}
                </span>
              </div>

              {/* Budget & Location */}
              <div className="flex items-center gap-3 text-xs text-zinc-400 mb-3">
                <span className="flex items-center gap-1">
                  <HiOutlineCurrencyRupee className="w-3.5 h-3.5 text-emerald-400" />
                  ₹{job.budget?.min?.toLocaleString()} - ₹{job.budget?.max?.toLocaleString()}
                </span>
                {job.location?.city && (
                  <span className="flex items-center gap-1 truncate">
                    <HiOutlineMapPin className="w-3.5 h-3.5 text-rose-400" />
                    {job.location.city}
                  </span>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-zinc-700/30 light:border-zinc-200">
                <span className="text-[10px] text-zinc-500">
                  {getDaysAgo(job.createdAt)}
                </span>
                <span className={`text-[10px] font-medium ${
                  new Date(job.applicationDeadline) < new Date() 
                    ? "text-red-400" 
                    : "text-amber-400"
                }`}>
                  <HiOutlineClock className="w-3 h-3 inline mr-0.5" />
                  {getDeadlineText(job.applicationDeadline)}
                </span>
              </div>

              {/* Applicants Count */}
              {job.applicantCount > 0 && (
                <div className="mt-2 text-[10px] text-zinc-500">
                  {job.applicantCount} applicant{job.applicantCount > 1 ? "s" : ""}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 bg-zinc-800 light:bg-zinc-100 border border-zinc-700 light:border-zinc-200 rounded-lg text-xs disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-3 py-1.5 text-xs text-zinc-400">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 bg-zinc-800 light:bg-zinc-100 border border-zinc-700 light:border-zinc-200 rounded-lg text-xs disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ExploreJobs;
