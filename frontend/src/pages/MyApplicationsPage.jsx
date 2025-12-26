/**
 * MyApplicationsPage - Editor page to track job applications
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  HiOutlineBriefcase,
  HiOutlineClock,
  HiOutlineCurrencyRupee,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineArrowPath,
  HiArrowTopRightOnSquare,
} from "react-icons/hi2";
import { FaBolt } from "react-icons/fa";
import { useAppContext } from "../context/AppContext";
import Sidebar from "../components/Sidebar.jsx";
import EditorNavbar from "../components/EditorNavbar.jsx";
import axios from "axios";
import { toast } from "react-toastify";

const STATUS_CONFIG = {
  applied: { color: "bg-blue-500/10 text-blue-400 border-blue-500/20", label: "Applied", icon: HiOutlineClock },
  shortlisted: { color: "bg-amber-500/10 text-amber-400 border-amber-500/20", label: "Shortlisted", icon: HiOutlineCheckCircle },
  round1: { color: "bg-purple-500/10 text-purple-400 border-purple-500/20", label: "Round 1", icon: HiOutlineArrowPath },
  round2: { color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20", label: "Round 2", icon: HiOutlineArrowPath },
  round3: { color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20", label: "Final Round", icon: HiOutlineArrowPath },
  hired: { color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", label: "Hired! 🎉", icon: HiOutlineCheckCircle },
  rejected: { color: "bg-red-500/10 text-red-400 border-red-500/20", label: "Not Selected", icon: HiOutlineXCircle },
  withdrawn: { color: "bg-gray-500/10 text-gray-400 border-gray-500/20", label: "Withdrawn", icon: HiOutlineXCircle },
};

const MyApplicationsPage = () => {
  const navigate = useNavigate();
  const { user, backendURL } = useAppContext();
  
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const params = filter !== "all" ? `?status=${filter}` : "";
      const res = await axios.get(`${backendURL}/api/jobs/my/applications${params}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setApplications(res.data.applications || []);
    } catch (err) {
      console.error("Failed to fetch applications:", err);
      toast.error("Failed to load your applications");
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (applicationId) => {
    if (!window.confirm("Are you sure you want to withdraw this application?")) return;
    
    try {
      await axios.patch(
        `${backendURL}/api/jobs/applications/${applicationId}/withdraw`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      toast.success("Application withdrawn");
      fetchApplications();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to withdraw");
    }
  };

  const getDaysAgo = (date) => {
    const days = Math.floor((new Date() - new Date(date)) / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    return `${days}d ago`;
  };

  const stats = {
    total: applications.length,
    pending: applications.filter(a => ["applied", "shortlisted", "round1", "round2", "round3"].includes(a.status)).length,
    hired: applications.filter(a => a.status === "hired").length,
    rejected: applications.filter(a => a.status === "rejected").length,
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#09090B] text-white">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <EditorNavbar onMenuClick={() => setSidebarOpen(true)} />

      <main className="flex-1 px-4 md:px-8 py-6 pt-20 md:pt-6 md:ml-64 md:mt-16">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold">My Applications</h1>
          <p className="text-xs text-zinc-500">Track the status of your job applications</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-[#111118] border border-zinc-800/50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-indigo-400">{stats.total}</p>
            <p className="text-xs text-zinc-500">Total Applied</p>
          </div>
          <div className="bg-[#111118] border border-zinc-800/50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-amber-400">{stats.pending}</p>
            <p className="text-xs text-zinc-500">In Progress</p>
          </div>
          <div className="bg-[#111118] border border-zinc-800/50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-emerald-400">{stats.hired}</p>
            <p className="text-xs text-zinc-500">Hired</p>
          </div>
          <div className="bg-[#111118] border border-zinc-800/50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-red-400">{stats.rejected}</p>
            <p className="text-xs text-zinc-500">Not Selected</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          {["all", "applied", "shortlisted", "hired", "rejected"].map((status) => (
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
        {!loading && applications.length === 0 && (
          <div className="text-center py-20">
            <HiOutlineBriefcase className="w-16 h-16 mx-auto mb-4 text-zinc-700" />
            <p className="text-zinc-400 mb-2">No applications yet</p>
            <button
              onClick={() => navigate("/editor-home")}
              className="text-indigo-400 hover:underline text-sm"
            >
              Browse Jobs
            </button>
          </div>
        )}

        {/* Applications List */}
        {!loading && applications.length > 0 && (
          <div className="space-y-3">
            {applications.map((app, idx) => {
              const status = STATUS_CONFIG[app.status] || STATUS_CONFIG.applied;
              const StatusIcon = status.icon;
              const job = app.job;
              
              return (
                <motion.div
                  key={app._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className={`bg-[#111118] border rounded-xl p-4 hover:border-indigo-500/30 transition-all ${
                    app.status === "hired" ? "border-emerald-500/30" : "border-zinc-800/50"
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Job Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 
                          onClick={() => navigate(`/jobs/${job?._id}`)}
                          className="font-semibold text-sm hover:text-indigo-400 cursor-pointer truncate"
                        >
                          {job?.title || "Unknown Job"}
                        </h3>
                        {job?.isUrgent && (
                          <span className="px-1.5 py-0.5 bg-red-500/10 text-red-400 text-[9px] font-bold rounded-full flex items-center gap-0.5">
                            <FaBolt className="w-2 h-2" /> URGENT
                          </span>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 mb-2">
                        <span className="flex items-center gap-1">
                          <img
                            src={job?.postedBy?.profilePicture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                            alt=""
                            className="w-4 h-4 rounded-full"
                          />
                          {job?.postedBy?.name || "Unknown"}
                        </span>
                        <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-full capitalize">
                          {job?.category?.replace("-", " ")}
                        </span>
                        <span className="flex items-center gap-1">
                          <HiOutlineCurrencyRupee className="w-3 h-3" />
                          ₹{job?.budget?.min?.toLocaleString()} - ₹{job?.budget?.max?.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <span className="flex items-center gap-1">
                          <HiOutlineClock className="w-3 h-3" /> Applied {getDaysAgo(app.createdAt)}
                        </span>
                        <span className="text-emerald-400">
                          Your Quote: ₹{app.expectedRate?.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-3">
                      <div className={`px-4 py-2 rounded-xl border ${status.color} flex items-center gap-2`}>
                        <StatusIcon className="w-4 h-4" />
                        <span className="text-sm font-medium">{status.label}</span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/jobs/${job?._id}`)}
                          className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700"
                          title="View Job"
                        >
                          <HiArrowTopRightOnSquare className="w-4 h-4" />
                        </button>
                        
                        {["applied", "shortlisted"].includes(app.status) && (
                          <button
                            onClick={() => handleWithdraw(app._id)}
                            className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20"
                            title="Withdraw"
                          >
                            <HiOutlineXCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status Progress (for in-progress applications) */}
                  {["shortlisted", "round1", "round2", "round3"].includes(app.status) && (
                    <div className="mt-4 pt-4 border-t border-zinc-800/50">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
                            style={{ 
                              width: app.status === "shortlisted" ? "25%" 
                                : app.status === "round1" ? "50%" 
                                : app.status === "round2" ? "75%" 
                                : "100%"
                            }}
                          />
                        </div>
                        <span className="text-[10px] text-zinc-500">
                          {app.status === "shortlisted" && "Shortlisted"}
                          {app.status === "round1" && "Round 1"}
                          {app.status === "round2" && "Round 2"}
                          {app.status === "round3" && "Final Round"}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Hired - Show client contact */}
                  {app.status === "hired" && app.hiredAt && (
                    <div className="mt-4 pt-4 border-t border-emerald-500/20 bg-emerald-500/5 -mx-4 -mb-4 px-4 py-3 rounded-b-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-emerald-400">
                          <HiOutlineCheckCircle className="w-5 h-5" />
                          <span className="text-sm font-medium">You were hired on {new Date(app.hiredAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs text-zinc-400">Check your email for client contact details</p>
                      </div>
                    </div>
                  )}

                  {/* Rejected */}
                  {app.status === "rejected" && (
                    <div className="mt-4 pt-4 border-t border-red-500/20 bg-red-500/5 -mx-4 -mb-4 px-4 py-3 rounded-b-xl">
                      <div className="flex items-center gap-2 text-red-400/70">
                        <HiOutlineXCircle className="w-4 h-4" />
                        <span className="text-xs">
                          {app.rejectionReason || "The client selected another candidate"}
                        </span>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyApplicationsPage;
