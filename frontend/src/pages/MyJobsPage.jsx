/**
 * MyJobsPage - Client page to manage posted jobs
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  HiOutlineBriefcase,
  HiOutlinePlus,
  HiOutlineEye,
  HiOutlineUsers,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlinePause,
} from "react-icons/hi2";
import { FaBolt } from "react-icons/fa";
import { useAppContext } from "../context/AppContext";
import ClientSidebar from "../components/ClientSidebar.jsx";
import ClientNavbar from "../components/ClientNavbar.jsx";
import axios from "axios";
import { toast } from "react-toastify";

const STATUS_COLORS = {
  draft: "bg-gray-500/10 text-gray-400",
  active: "bg-emerald-500/10 text-emerald-400",
  paused: "bg-amber-500/10 text-amber-400",
  closed: "bg-red-500/10 text-red-400",
  filled: "bg-purple-500/10 text-purple-400",
};

const STATUS_ICONS = {
  draft: HiOutlinePencil,
  active: HiOutlineCheckCircle,
  paused: HiOutlinePause,
  closed: HiOutlineXCircle,
  filled: HiOutlineUsers,
};

const MyJobsPage = () => {
  const navigate = useNavigate();
  const { user, backendURL } = useAppContext();
  
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({ totalJobs: 0, activeJobs: 0, totalApplications: 0, hiredCount: 0 });

  useEffect(() => {
    fetchJobs();
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const params = filter !== "all" ? `?status=${filter}` : "";
      const res = await axios.get(`${backendURL}/api/jobs/my/posts${params}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setJobs(res.data.jobs || []);
    } catch (err) {
      console.error("Failed to fetch jobs:", err);
      toast.error("Failed to load your jobs");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${backendURL}/api/jobs/my/stats`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setStats(res.data.stats || {});
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  const handleStatusChange = async (jobId, newStatus) => {
    try {
      await axios.patch(
        `${backendURL}/api/jobs/${jobId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      toast.success(`Job ${newStatus}`);
      fetchJobs();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    }
  };

  const handleDelete = async (jobId) => {
    if (!window.confirm("Are you sure you want to delete this job? This will also delete all applications.")) {
      return;
    }
    
    try {
      await axios.delete(`${backendURL}/api/jobs/${jobId}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      toast.success("Job deleted");
      fetchJobs();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete job");
    }
  };

  const getDaysAgo = (date) => {
    const days = Math.floor((new Date() - new Date(date)) / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    return `${days}d ago`;
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#09090B] text-white">
      <ClientSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <ClientNavbar onMenuClick={() => setSidebarOpen(true)} />

      <main className="flex-1 px-4 md:px-8 py-6 pt-20 md:pt-6 md:ml-64 md:mt-16">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold">My Posted Jobs</h1>
            <p className="text-xs text-zinc-500">Manage your job postings and view applicants</p>
          </div>
          <button
            onClick={() => navigate("/post-job")}
            className="px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-all"
          >
            <HiOutlinePlus className="w-4 h-4" /> Post New Job
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-[#111118] border border-zinc-800/50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-indigo-400">{stats.totalJobs}</p>
            <p className="text-xs text-zinc-500">Total Jobs</p>
          </div>
          <div className="bg-[#111118] border border-zinc-800/50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-emerald-400">{stats.activeJobs}</p>
            <p className="text-xs text-zinc-500">Active</p>
          </div>
          <div className="bg-[#111118] border border-zinc-800/50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-blue-400">{stats.totalApplications}</p>
            <p className="text-xs text-zinc-500">Applications</p>
          </div>
          <div className="bg-[#111118] border border-zinc-800/50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-purple-400">{stats.hiredCount}</p>
            <p className="text-xs text-zinc-500">Hired</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          {["all", "active", "paused", "closed", "filled"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                filter === status
                  ? "bg-indigo-500 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Empty State */}
        {!loading && jobs.length === 0 && (
          <div className="text-center py-20">
            <HiOutlineBriefcase className="w-16 h-16 mx-auto mb-4 text-zinc-700" />
            <p className="text-zinc-400 mb-2">No jobs found</p>
            <button
              onClick={() => navigate("/post-job")}
              className="text-indigo-400 hover:underline text-sm"
            >
              Post your first job
            </button>
          </div>
        )}

        {/* Jobs List */}
        {!loading && jobs.length > 0 && (
          <div className="space-y-3">
            {jobs.map((job, idx) => {
              const StatusIcon = STATUS_ICONS[job.status] || HiOutlineBriefcase;
              
              return (
                <motion.div
                  key={job._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="bg-[#111118] border border-zinc-800/50 rounded-xl p-4 hover:border-indigo-500/30 transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Job Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 
                          onClick={() => navigate(`/jobs/${job._id}`)}
                          className="font-semibold text-sm hover:text-indigo-400 cursor-pointer truncate"
                        >
                          {job.title}
                        </h3>
                        {job.isUrgent && (
                          <span className="px-1.5 py-0.5 bg-red-500/10 text-red-400 text-[9px] font-bold rounded-full flex items-center gap-0.5">
                            <FaBolt className="w-2 h-2" /> URGENT
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                        <span className={`px-2 py-0.5 rounded-full capitalize flex items-center gap-1 ${STATUS_COLORS[job.status]}`}>
                          <StatusIcon className="w-3 h-3" /> {job.status}
                        </span>
                        <span className="flex items-center gap-1">
                          <HiOutlineClock className="w-3 h-3" /> {getDaysAgo(job.createdAt)}
                        </span>
                        <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-full capitalize">
                          {job.category?.replace("-", " ")}
                        </span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-xs">
                      <div className="text-center">
                        <p className="text-lg font-bold text-blue-400">{job.applicantCount || 0}</p>
                        <p className="text-zinc-500">Applicants</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-zinc-400">{job.viewCount || 0}</p>
                        <p className="text-zinc-500">Views</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/my-jobs/${job._id}/applicants`)}
                        className="px-3 py-2 bg-indigo-500/10 text-indigo-400 rounded-lg text-xs font-medium hover:bg-indigo-500/20 flex items-center gap-1"
                      >
                        <HiOutlineUsers className="w-3.5 h-3.5" /> View Applicants
                      </button>
                      <button
                        onClick={() => navigate(`/jobs/${job._id}`)}
                        className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700"
                        title="View"
                      >
                        <HiOutlineEye className="w-4 h-4" />
                      </button>
                      {job.status === "active" && (
                        <button
                          onClick={() => handleStatusChange(job._id, "paused")}
                          className="p-2 bg-amber-500/10 text-amber-400 rounded-lg hover:bg-amber-500/20"
                          title="Pause"
                        >
                          <HiOutlinePause className="w-4 h-4" />
                        </button>
                      )}
                      {job.status === "paused" && (
                        <button
                          onClick={() => handleStatusChange(job._id, "active")}
                          className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500/20"
                          title="Resume"
                        >
                          <HiOutlineCheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(job._id)}
                        className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20"
                        title="Delete"
                      >
                        <HiOutlineTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyJobsPage;
