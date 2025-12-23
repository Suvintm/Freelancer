/**
 * My Briefs Page - Professional Corporate Design
 * Client dashboard for managing posted briefs
 */
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  HiPlus,
  HiClipboardList,
  HiEye,
  HiUserGroup,
  HiCurrencyRupee,
  HiClock,
  HiCheckCircle,
  HiXCircle,
  HiDotsCircleHorizontal,
  HiPencil,
  HiTrash,
  HiExternalLink,
  HiChevronRight,
  HiRefresh,
  HiFire,
} from "react-icons/hi";
import { useAppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import ClientSidebar from "../components/ClientSidebar.jsx";
import ClientNavbar from "../components/ClientNavbar.jsx";

const STATUS_TABS = [
  { value: "", label: "All", color: "gray" },
  { value: "open", label: "Open", color: "emerald" },
  { value: "in_review", label: "In Review", color: "amber" },
  { value: "accepted", label: "Accepted", color: "blue" },
  { value: "completed", label: "Completed", color: "green" },
  { value: "expired", label: "Expired", color: "red" },
];

const STATUS_CONFIG = {
  open: { label: "Open", bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", icon: HiDotsCircleHorizontal },
  in_review: { label: "In Review", bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20", icon: HiEye },
  accepted: { label: "Accepted", bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20", icon: HiCheckCircle },
  completed: { label: "Completed", bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/20", icon: HiCheckCircle },
  expired: { label: "Expired", bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20", icon: HiXCircle },
  cancelled: { label: "Cancelled", bg: "bg-gray-500/10", text: "text-gray-400", border: "border-gray-500/20", icon: HiXCircle },
};

const MyBriefsPage = () => {
  const { backendURL, user } = useAppContext();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [briefs, setBriefs] = useState([]);
  const [activeTab, setActiveTab] = useState("");
  const [stats, setStats] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(null);

  // Fetch briefs
  const fetchBriefs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeTab) params.append("status", activeTab);

      const [briefsRes, statsRes] = await Promise.all([
        axios.get(`${backendURL}/api/briefs/my?${params.toString()}`, {
          headers: { Authorization: `Bearer ${user?.token}` },
        }),
        axios.get(`${backendURL}/api/briefs/stats`, {
          headers: { Authorization: `Bearer ${user?.token}` },
        }),
      ]);

      setBriefs(briefsRes.data.briefs || []);
      setStats(statsRes.data.stats);
    } catch (error) {
      toast.error("Failed to load briefs");
    } finally {
      setLoading(false);
    }
  }, [backendURL, user?.token, activeTab]);

  useEffect(() => {
    if (user?.token) {
      fetchBriefs();
    }
  }, [user?.token, fetchBriefs]);

  // Cancel brief
  const handleCancelBrief = async (briefId) => {
    try {
      await axios.delete(`${backendURL}/api/briefs/${briefId}`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      toast.success("Brief cancelled");
      setShowDeleteModal(null);
      fetchBriefs();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to cancel");
    }
  };

  // Shimmer skeleton
  const ShimmerCard = () => (
    <div className="bg-[#0A0A0C] light:bg-white border border-[#1a1a1f] light:border-slate-200 rounded-xl p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-[#151518] light:bg-slate-100 rounded-lg" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-[#151518] light:bg-slate-100 rounded w-3/4" />
          <div className="h-3 bg-[#151518] light:bg-slate-100 rounded w-1/2" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#030303] light:bg-slate-50 text-white light:text-slate-900 transition-colors duration-300" style={{ fontFamily: "'Inter', sans-serif" }}>
      <ClientSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <ClientNavbar onMenuClick={() => setSidebarOpen(true)} />

      <main className="flex-1 px-4 md:px-8 py-5 md:ml-64 md:mt-20">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <HiClipboardList className="text-purple-400 text-lg" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-semibold text-white light:text-slate-900">My Briefs</h1>
              <p className="text-gray-500 light:text-slate-500 text-xs">Manage your posted projects</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/create-brief")}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <HiPlus className="text-sm" /> New Brief
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            {[
              { label: "Total", value: stats.total, color: "text-white light:text-slate-900" },
              { label: "Open", value: stats.open, color: "text-emerald-400" },
              { label: "Accepted", value: stats.accepted, color: "text-blue-400" },
              { label: "Completed", value: stats.completed, color: "text-green-400" },
              { label: "Proposals", value: stats.totalProposals, color: "text-purple-400" },
            ].map((stat) => (
              <div key={stat.label} className="bg-[#0A0A0C] light:bg-white border border-[#1a1a1f] light:border-slate-200 rounded-xl p-3 text-center">
                <p className={`text-xl font-semibold ${stat.color}`}>{stat.value}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wide">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Status Tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto scrollbar-hide pb-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === tab.value
                  ? "bg-white light:bg-slate-900 text-black light:text-white"
                  : "bg-[#0A0A0C] light:bg-white text-gray-400 light:text-slate-500 border border-[#1a1a1f] light:border-slate-200 hover:border-[#2a2a30]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Briefs List */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <ShimmerCard key={i} />)}
          </div>
        ) : briefs.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#0A0A0C] light:bg-slate-100 flex items-center justify-center">
              <HiClipboardList className="text-2xl text-gray-500" />
            </div>
            <h3 className="text-sm font-medium text-white light:text-slate-900 mb-1">No Briefs Yet</h3>
            <p className="text-gray-500 text-xs mb-4">Post your first project to receive proposals</p>
            <button
              onClick={() => navigate("/create-brief")}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white text-xs font-medium inline-flex items-center gap-1.5"
            >
              <HiPlus /> Post a Brief
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {briefs.map((brief, index) => {
              const config = STATUS_CONFIG[brief.status] || STATUS_CONFIG.open;
              const StatusIcon = config.icon;
              
              return (
                <motion.div
                  key={brief._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="bg-[#0A0A0C] light:bg-white border border-[#1a1a1f] light:border-slate-200 rounded-xl p-4 hover:border-[#2a2a30] light:hover:border-slate-300 transition-all group"
                >
                  <div className="flex items-start gap-3">
                    {/* Category Icon */}
                    <div className="w-10 h-10 rounded-lg bg-[#151518] light:bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <HiClipboardList className="text-gray-400" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${config.bg} ${config.text} border ${config.border} flex items-center gap-1`}>
                          <StatusIcon className="text-xs" />
                          {config.label}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] text-gray-500 bg-[#151518] light:bg-slate-100 capitalize">
                          {brief.category}
                        </span>
                        {brief.isUrgent && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center gap-0.5">
                            <HiFire className="text-[10px]" /> Urgent
                          </span>
                        )}
                      </div>
                      
                      <h3
                        onClick={() => navigate(`/manage-brief/${brief._id}`)}
                        className="text-sm font-medium text-white light:text-slate-900 hover:text-purple-400 cursor-pointer transition-colors truncate mb-1.5"
                      >
                        {brief.title}
                      </h3>

                      <div className="flex flex-wrap items-center gap-3 text-[10px] text-gray-500">
                        <span className="flex items-center gap-1 text-emerald-400">
                          <HiCurrencyRupee className="text-xs" />
                          ₹{brief.budget?.min?.toLocaleString()} - ₹{brief.budget?.max?.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <HiUserGroup className="text-xs" />
                          {brief.proposalCount} proposals
                        </span>
                        <span className="flex items-center gap-1">
                          <HiClock className="text-xs" />
                          {brief.expectedDeliveryDays} days
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {brief.status === "open" && (
                        <>
                          <button
                            onClick={() => navigate(`/manage-brief/${brief._id}`)}
                            className="px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-lg text-[10px] font-medium hover:bg-purple-500/20 transition-all flex items-center gap-1"
                          >
                            <HiUserGroup className="text-xs" /> Proposals
                          </button>
                          <button
                            onClick={() => setShowDeleteModal(brief._id)}
                            className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"
                          >
                            <HiTrash className="text-sm" />
                          </button>
                        </>
                      )}
                      {brief.status === "accepted" && (
                        <button
                          onClick={() => navigate(`/client-orders`)}
                          className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg text-[10px] font-medium flex items-center gap-1"
                        >
                          View Order <HiChevronRight className="text-xs" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Accepted Editor */}
                  {brief.acceptedEditor && (
                    <div className="mt-3 pt-3 border-t border-[#1a1a1f] light:border-slate-100 flex items-center gap-2">
                      <img
                        src={brief.acceptedEditor.profilePicture || "/default-avatar.png"}
                        alt=""
                        className="w-6 h-6 rounded-full object-cover"
                      />
                      <div>
                        <p className="text-xs text-gray-400">
                          Assigned to <span className="text-white light:text-slate-900 font-medium">{brief.acceptedEditor.name}</span>
                        </p>
                        {brief.finalPrice && (
                          <p className="text-[10px] text-emerald-400">Final: ₹{brief.finalPrice?.toLocaleString()}</p>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowDeleteModal(null)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-[#0A0A0C] light:bg-white border border-[#1a1a1f] light:border-slate-200 rounded-xl p-5 max-w-sm w-full"
              >
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-full bg-red-500/10 border border-red-500/20">
                  <HiTrash className="text-xl text-red-400" />
                </div>
                <h3 className="text-sm font-medium text-white light:text-slate-900 text-center mb-1">Cancel Brief?</h3>
                <p className="text-gray-500 text-xs text-center mb-5">
                  This will cancel the brief and notify all editors. This action cannot be undone.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowDeleteModal(null)}
                    className="flex-1 py-2.5 bg-[#151518] light:bg-slate-100 border border-[#1a1a1f] light:border-slate-200 rounded-lg text-gray-400 light:text-slate-600 text-xs font-medium"
                  >
                    Keep Brief
                  </button>
                  <button
                    onClick={() => handleCancelBrief(showDeleteModal)}
                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 rounded-lg text-white text-xs font-medium"
                  >
                    Cancel Brief
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default MyBriefsPage;
