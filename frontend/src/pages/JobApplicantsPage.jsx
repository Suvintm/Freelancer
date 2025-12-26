/**
 * JobApplicantsPage - View and manage applicants for a specific job
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  HiOutlineArrowLeft,
  HiOutlineUser,
  HiOutlineEnvelope,
  HiOutlinePhone,
  HiOutlineCurrencyRupee,
  HiArrowTopRightOnSquare,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineClock,
  HiOutlineSparkles,
} from "react-icons/hi2";
import { FaStar, FaUserCheck } from "react-icons/fa";
import { useAppContext } from "../context/AppContext";
import ClientSidebar from "../components/ClientSidebar.jsx";
import ClientNavbar from "../components/ClientNavbar.jsx";
import axios from "axios";
import { toast } from "react-toastify";

const STATUS_COLORS = {
  applied: "bg-blue-500/10 text-blue-400",
  shortlisted: "bg-amber-500/10 text-amber-400",
  round1: "bg-purple-500/10 text-purple-400",
  round2: "bg-indigo-500/10 text-indigo-400",
  round3: "bg-cyan-500/10 text-cyan-400",
  hired: "bg-emerald-500/10 text-emerald-400",
  rejected: "bg-red-500/10 text-red-400",
  withdrawn: "bg-gray-500/10 text-gray-400",
};

const JobApplicantsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, backendURL } = useAppContext();
  
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${backendURL}/api/jobs/${id}/applications`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setApplications(res.data.applications || []);
      setJob(res.data.job || null);
    } catch (err) {
      console.error("Failed to fetch applications:", err);
      toast.error(err.response?.data?.message || "Failed to load applicants");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (applicationId, newStatus, note = "") => {
    try {
      setActionLoading(true);
      await axios.patch(
        `${backendURL}/api/jobs/applications/${applicationId}`,
        { status: newStatus, note },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      toast.success(`Application ${newStatus}`);
      fetchApplications();
      setSelectedApp(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleHire = async (applicationId) => {
    if (!window.confirm("Are you sure you want to hire this editor? They will receive your contact details via email.")) {
      return;
    }
    
    try {
      setActionLoading(true);
      const res = await axios.post(
        `${backendURL}/api/jobs/applications/${applicationId}/hire`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      toast.success("Editor hired successfully! They have been notified.");
      
      // Show contact info
      const contact = res.data.editorContact;
      if (contact) {
        toast.info(`Contact: ${contact.email}`);
      }
      
      fetchApplications();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to hire editor");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredApps = filter === "all" 
    ? applications 
    : applications.filter(app => app.status === filter);

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
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate("/my-jobs")}
            className="p-2 bg-zinc-800/50 rounded-lg hover:bg-zinc-700 transition-all"
          >
            <HiOutlineArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Applicants</h1>
            {job && <p className="text-xs text-zinc-500">{job.title}</p>}
          </div>
        </div>

        {/* Stats Bar */}
        {job && (
          <div className="bg-[#111118] border border-zinc-800/50 rounded-xl p-4 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-2xl font-bold text-blue-400">{applications.length}</p>
                  <p className="text-xs text-zinc-500">Total Applicants</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-400">
                    {applications.filter(a => a.status === "shortlisted").length}
                  </p>
                  <p className="text-xs text-zinc-500">Shortlisted</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-400">
                    {applications.filter(a => a.status === "hired").length}
                  </p>
                  <p className="text-xs text-zinc-500">Hired</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-zinc-500">Hiring Rounds</p>
                <div className="flex gap-2 mt-1">
                  {job.roundNames?.map((round, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-zinc-800 rounded text-[10px]">
                      {round}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          {["all", "applied", "shortlisted", "round1", "round2", "hired", "rejected"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                filter === status
                  ? "bg-indigo-500 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              {status.replace("round", "Round ")}
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
        {!loading && filteredApps.length === 0 && (
          <div className="text-center py-20">
            <HiOutlineUser className="w-16 h-16 mx-auto mb-4 text-zinc-700" />
            <p className="text-zinc-400">No applicants found</p>
          </div>
        )}

        {/* Applicants Grid */}
        {!loading && filteredApps.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredApps.map((app, idx) => (
              <motion.div
                key={app._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="bg-[#111118] border border-zinc-800/50 rounded-xl p-4 hover:border-indigo-500/30 transition-all"
              >
                {/* Applicant Header */}
                <div className="flex items-start gap-3 mb-3">
                  <img
                    src={app.applicant?.profilePicture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                    alt=""
                    className="w-12 h-12 rounded-full object-cover border border-zinc-700"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm truncate">{app.applicant?.name || "Unknown"}</p>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-medium capitalize ${STATUS_COLORS[app.status]}`}>
                        {app.status?.replace("round", "Round ")}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 truncate">{app.applicant?.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-zinc-400 flex items-center gap-1">
                        <HiOutlineClock className="w-3 h-3" /> Applied {getDaysAgo(app.createdAt)}
                      </span>
                      <span className="text-xs text-emerald-400 flex items-center gap-1">
                        <HiOutlineCurrencyRupee className="w-3 h-3" /> ₹{app.expectedRate?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Profile Info */}
                {app.editorProfile && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {app.editorProfile.skills?.slice(0, 3).map((skill, i) => (
                      <span key={i} className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-[10px] rounded">
                        {skill}
                      </span>
                    ))}
                    {app.editorProfile.ratingStats?.averageRating > 0 && (
                      <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 text-[10px] rounded flex items-center gap-1">
                        <FaStar className="w-2 h-2" /> {app.editorProfile.ratingStats.averageRating.toFixed(1)}
                      </span>
                    )}
                  </div>
                )}

                {/* Cover Message */}
                {app.coverMessage && (
                  <div className="bg-zinc-900/50 rounded-lg p-3 mb-3">
                    <p className="text-xs text-zinc-400 line-clamp-2">{app.coverMessage}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <a
                    href={app.suvixProfileUrl || `/public-profile/${app.applicant?._id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-zinc-800 rounded-lg text-xs hover:bg-zinc-700 flex items-center gap-1"
                  >
                    <HiArrowTopRightOnSquare className="w-3 h-3" /> View Profile
                  </a>
                  
                  {app.status === "applied" && (
                    <>
                      <button
                        onClick={() => handleStatusUpdate(app._id, "shortlisted")}
                        disabled={actionLoading}
                        className="px-3 py-1.5 bg-amber-500/10 text-amber-400 rounded-lg text-xs hover:bg-amber-500/20 flex items-center gap-1"
                      >
                        <HiOutlineSparkles className="w-3 h-3" /> Shortlist
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(app._id, "rejected", "Not a good fit")}
                        disabled={actionLoading}
                        className="px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg text-xs hover:bg-red-500/20 flex items-center gap-1"
                      >
                        <HiOutlineXCircle className="w-3 h-3" /> Reject
                      </button>
                    </>
                  )}
                  
                  {app.status === "shortlisted" && (
                    <>
                      <button
                        onClick={() => handleStatusUpdate(app._id, "round1")}
                        disabled={actionLoading}
                        className="px-3 py-1.5 bg-purple-500/10 text-purple-400 rounded-lg text-xs hover:bg-purple-500/20"
                      >
                        Move to Round 1
                      </button>
                      <button
                        onClick={() => handleHire(app._id)}
                        disabled={actionLoading}
                        className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs hover:bg-emerald-600 flex items-center gap-1"
                      >
                        <FaUserCheck className="w-3 h-3" /> Hire
                      </button>
                    </>
                  )}
                  
                  {["round1", "round2", "round3"].includes(app.status) && (
                    <>
                      {app.status !== "round3" && (
                        <button
                          onClick={() => handleStatusUpdate(app._id, app.status === "round1" ? "round2" : "round3")}
                          disabled={actionLoading}
                          className="px-3 py-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg text-xs hover:bg-indigo-500/20"
                        >
                          Next Round
                        </button>
                      )}
                      <button
                        onClick={() => handleHire(app._id)}
                        disabled={actionLoading}
                        className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs hover:bg-emerald-600 flex items-center gap-1"
                      >
                        <FaUserCheck className="w-3 h-3" /> Hire
                      </button>
                    </>
                  )}
                  
                  {app.status === "hired" && (
                    <div className="flex items-center gap-2 text-emerald-400 text-xs">
                      <HiOutlineCheckCircle className="w-4 h-4" />
                      <span>Hired on {new Date(app.hiredAt).toLocaleDateString()}</span>
                      {app.applicant?.phone && (
                        <span className="flex items-center gap-1 text-zinc-400">
                          <HiOutlinePhone className="w-3 h-3" /> {app.applicant.phone}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default JobApplicantsPage;
