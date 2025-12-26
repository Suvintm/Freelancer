/**
 * JobDetailsPage - View single job listing with apply option
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  HiOutlineBriefcase,
  HiOutlineMapPin,
  HiOutlineCurrencyRupee,
  HiOutlineClock,
  HiOutlineArrowLeft,
  HiOutlineCheckBadge,
  HiOutlineUser,
  HiOutlineCalendar,
  HiOutlineEye,
  HiOutlinePaperAirplane,
  HiOutlineSparkles,
  HiOutlineExclamationTriangle,
} from "react-icons/hi2";
import { FaBolt, FaUsers } from "react-icons/fa";
import { useAppContext } from "../context/AppContext";
import Sidebar from "../components/Sidebar.jsx";
import EditorNavbar from "../components/EditorNavbar.jsx";
import ClientSidebar from "../components/ClientSidebar.jsx";
import ClientNavbar from "../components/ClientNavbar.jsx";
import axios from "axios";
import { toast } from "react-toastify";

// Skills mapping
const SKILL_LABELS = {
  "premiere-pro": "Premiere Pro",
  "after-effects": "After Effects",
  "davinci-resolve": "DaVinci Resolve",
  "final-cut": "Final Cut Pro",
  "capcut": "CapCut",
  "motion-graphics": "Motion Graphics",
  "color-grading": "Color Grading",
  "sound-design": "Sound Design",
  "vfx": "VFX",
  "3d-animation": "3D Animation",
  "thumbnail-design": "Thumbnail Design",
};

const JobDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, backendURL } = useAppContext();
  
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasApplied, setHasApplied] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Apply modal
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyData, setApplyData] = useState({
    coverMessage: "",
    expectedRate: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchJob();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchJob = async () => {
    try {
      setLoading(true);
      const headers = user?.token ? { Authorization: `Bearer ${user.token}` } : {};
      const res = await axios.get(`${backendURL}/api/jobs/${id}`, { headers });
      
      setJob(res.data.job);
      setHasApplied(res.data.hasApplied || false);
      setApplicationStatus(res.data.applicationStatus || null);
    } catch (err) {
      console.error("Failed to fetch job:", err);
      toast.error("Failed to load job details");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!user) {
      toast.error("Please login to apply");
      navigate("/login");
      return;
    }

    if (user.role !== "editor") {
      toast.error("Only editors can apply to jobs");
      return;
    }

    if (!applyData.expectedRate) {
      toast.error("Please enter your expected rate");
      return;
    }

    try {
      setSubmitting(true);
      await axios.post(
        `${backendURL}/api/jobs/${id}/apply`,
        applyData,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      
      toast.success("Application submitted successfully!");
      setShowApplyModal(false);
      setHasApplied(true);
      setApplicationStatus("applied");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  const getDaysAgo = (date) => {
    const days = Math.floor((new Date() - new Date(date)) / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
  };

  const getDeadlineText = (deadline) => {
    const days = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
    if (days < 0) return { text: "Closed", color: "text-red-400" };
    if (days === 0) return { text: "Last day!", color: "text-red-400" };
    if (days === 1) return { text: "1 day left", color: "text-amber-400" };
    if (days <= 3) return { text: `${days} days left`, color: "text-amber-400" };
    return { text: `${days} days left`, color: "text-emerald-400" };
  };

  const isEditor = user?.role === "editor";
  const SidebarComponent = isEditor ? Sidebar : ClientSidebar;
  const NavbarComponent = isEditor ? EditorNavbar : ClientNavbar;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090B]">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090B] text-white">
        <div className="text-center">
          <HiOutlineBriefcase className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">Job not found</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-indigo-500 rounded-lg text-sm"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const deadline = getDeadlineText(job.applicationDeadline);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#09090B] text-white">
      <SidebarComponent isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <NavbarComponent onMenuClick={() => setSidebarOpen(true)} />

      <main className="flex-1 px-4 md:px-8 py-6 pt-20 md:pt-6 md:ml-64 md:mt-16">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-zinc-400 hover:text-white mb-6 text-sm"
        >
          <HiOutlineArrowLeft className="w-4 h-4" /> Back to Jobs
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Header Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#111118] border border-zinc-800/50 rounded-xl p-6"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {job.isUrgent && (
                      <span className="px-2 py-0.5 bg-red-500/10 text-red-400 text-[10px] font-bold rounded-full flex items-center gap-1">
                        <FaBolt className="w-2 h-2" /> URGENT
                      </span>
                    )}
                    <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-[10px] font-medium rounded-full capitalize">
                      {job.category?.replace("-", " ")}
                    </span>
                  </div>
                  <h1 className="text-xl font-bold mb-2">{job.title}</h1>
                  <div className="flex items-center gap-3 text-sm text-zinc-400">
                    <span className="flex items-center gap-1">
                      <HiOutlineUser className="w-4 h-4" />
                      {job.postedBy?.name || "Unknown"}
                    </span>
                    <span className="flex items-center gap-1">
                      <HiOutlineCalendar className="w-4 h-4" />
                      Posted {getDaysAgo(job.createdAt)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-zinc-500 text-sm">
                  <HiOutlineEye className="w-4 h-4" />
                  {job.viewCount} views
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-zinc-800/50">
                <div className="text-center p-3 bg-zinc-800/30 rounded-lg">
                  <HiOutlineCurrencyRupee className="w-5 h-5 mx-auto mb-1 text-emerald-400" />
                  <p className="text-xs text-zinc-500">Budget</p>
                  <p className="text-sm font-semibold">₹{job.budget?.min?.toLocaleString()} - ₹{job.budget?.max?.toLocaleString()}</p>
                </div>
                <div className="text-center p-3 bg-zinc-800/30 rounded-lg">
                  <HiOutlineMapPin className="w-5 h-5 mx-auto mb-1 text-rose-400" />
                  <p className="text-xs text-zinc-500">Work Type</p>
                  <p className="text-sm font-semibold capitalize">{job.workType}</p>
                </div>
                <div className="text-center p-3 bg-zinc-800/30 rounded-lg">
                  <HiOutlineCheckBadge className="w-5 h-5 mx-auto mb-1 text-purple-400" />
                  <p className="text-xs text-zinc-500">Experience</p>
                  <p className="text-sm font-semibold capitalize">{job.experienceLevel?.replace("-", " ")}</p>
                </div>
                <div className="text-center p-3 bg-zinc-800/30 rounded-lg">
                  <FaUsers className="w-5 h-5 mx-auto mb-1 text-blue-400" />
                  <p className="text-xs text-zinc-500">Applicants</p>
                  <p className="text-sm font-semibold">{job.applicantCount}</p>
                </div>
              </div>
            </motion.div>

            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-[#111118] border border-zinc-800/50 rounded-xl p-6"
            >
              <h2 className="text-sm font-semibold uppercase text-zinc-500 mb-4">Job Description</h2>
              <div className="prose prose-invert prose-sm max-w-none">
                <p className="text-zinc-300 whitespace-pre-wrap">{job.description}</p>
              </div>
            </motion.div>

            {/* Skills Required */}
            {job.skillsRequired?.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-[#111118] border border-zinc-800/50 rounded-xl p-6"
              >
                <h2 className="text-sm font-semibold uppercase text-zinc-500 mb-4">Skills Required</h2>
                <div className="flex flex-wrap gap-2">
                  {job.skillsRequired.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1.5 bg-indigo-500/10 text-indigo-400 text-xs font-medium rounded-lg"
                    >
                      {SKILL_LABELS[skill] || skill}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Hiring Process */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-[#111118] border border-zinc-800/50 rounded-xl p-6"
            >
              <h2 className="text-sm font-semibold uppercase text-zinc-500 mb-4">Hiring Process</h2>
              <div className="flex items-center gap-2">
                {job.roundNames?.map((round, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="px-3 py-2 bg-zinc-800/50 rounded-lg">
                      <span className="text-xs text-zinc-400">Round {idx + 1}</span>
                      <p className="text-sm font-medium">{round}</p>
                    </div>
                    {idx < job.roundNames.length - 1 && (
                      <div className="w-8 h-0.5 bg-zinc-700" />
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Apply Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#111118] border border-zinc-800/50 rounded-xl p-6 sticky top-24"
            >
              <div className="mb-4">
                <p className="text-2xl font-bold text-emerald-400">
                  ₹{job.budget?.min?.toLocaleString()} - ₹{job.budget?.max?.toLocaleString()}
                </p>
                <p className="text-xs text-zinc-500 capitalize">{job.budget?.type || "Fixed"}</p>
              </div>

              <div className={`flex items-center gap-2 mb-4 text-sm ${deadline.color}`}>
                <HiOutlineClock className="w-4 h-4" />
                {deadline.text}
              </div>

              {job.location?.city && (
                <div className="flex items-center gap-2 mb-4 text-sm text-zinc-400">
                  <HiOutlineMapPin className="w-4 h-4" />
                  {job.location.city}{job.location.state && `, ${job.location.state}`}
                </div>
              )}

              {/* Apply Button */}
              {isEditor && (
                <>
                  {hasApplied ? (
                    <div className="w-full px-4 py-3 bg-zinc-800 rounded-xl text-center">
                      <p className="text-sm font-medium text-zinc-400">
                        Applied • {applicationStatus?.replace("-", " ")}
                      </p>
                    </div>
                  ) : new Date() > new Date(job.applicationDeadline) ? (
                    <div className="w-full px-4 py-3 bg-red-500/10 rounded-xl text-center">
                      <p className="text-sm font-medium text-red-400">Applications Closed</p>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowApplyModal(true)}
                      className="w-full px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-all"
                    >
                      <HiOutlinePaperAirplane className="w-4 h-4" /> Apply Now
                    </button>
                  )}
                </>
              )}

              {!isEditor && user?.role === "client" && job.postedBy?._id === user?._id && (
                <button
                  onClick={() => navigate(`/my-jobs/${job._id}/applicants`)}
                  className="w-full px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                >
                  View Applicants ({job.applicantCount})
                </button>
              )}
            </motion.div>

            {/* Posted By */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-[#111118] border border-zinc-800/50 rounded-xl p-6"
            >
              <h3 className="text-sm font-semibold uppercase text-zinc-500 mb-4">Posted By</h3>
              <div className="flex items-center gap-3">
                <img
                  src={job.postedBy?.profilePicture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                  alt=""
                  className="w-12 h-12 rounded-full object-cover border border-zinc-700"
                />
                <div>
                  <p className="font-medium">{job.postedBy?.name || "Unknown"}</p>
                  <p className="text-xs text-zinc-500">{job.postedBy?.email}</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Apply Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#111118] border border-zinc-800 rounded-xl p-6 max-w-md w-full"
          >
            <h3 className="text-lg font-bold mb-4">Apply for this Job</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Expected Rate (₹) *</label>
                <input
                  type="number"
                  value={applyData.expectedRate}
                  onChange={(e) => setApplyData({ ...applyData, expectedRate: e.target.value })}
                  placeholder="e.g., 5000"
                  className="w-full px-4 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-500 mb-1">Cover Message (Optional)</label>
                <textarea
                  value={applyData.coverMessage}
                  onChange={(e) => setApplyData({ ...applyData, coverMessage: e.target.value })}
                  placeholder="Why you're a good fit for this job..."
                  rows={4}
                  className="w-full px-4 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-3">
                <p className="text-xs text-indigo-400">
                  <HiOutlineSparkles className="w-3 h-3 inline mr-1" />
                  Your portfolio and Suvix profile will be automatically attached.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowApplyModal(false)}
                className="flex-1 px-4 py-2 bg-zinc-800 rounded-lg text-sm font-medium hover:bg-zinc-700"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-indigo-500 rounded-lg text-sm font-medium hover:bg-indigo-600 disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default JobDetailsPage;
