/**
 * My Proposals Page - Professional Corporate Design
 * For editors to track submitted proposals
 */
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  HiClipboardCheck,
  HiCurrencyRupee,
  HiClock,
  HiCheckCircle,
  HiXCircle,
  HiEye,
  HiExternalLink,
  HiStar,
  HiRefresh,
  HiChevronRight,
  HiInbox,
  HiTrendingUp,
} from "react-icons/hi";
import { useAppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import Sidebar from "../components/Sidebar.jsx";
import EditorNavbar from "../components/EditorNavbar.jsx";

const STATUS_TABS = [
  { value: "", label: "All", color: "gray" },
  { value: "pending", label: "Pending", color: "amber" },
  { value: "shortlisted", label: "Shortlisted", color: "purple" },
  { value: "accepted", label: "Accepted", color: "emerald" },
  { value: "rejected", label: "Rejected", color: "red" },
];

const MyProposalsPage = () => {
  const { backendURL, user } = useAppContext();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [proposals, setProposals] = useState([]);
  const [activeTab, setActiveTab] = useState("");
  const [stats, setStats] = useState(null);

  // Fetch proposals
  const fetchProposals = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeTab) params.append("status", activeTab);

      const [proposalsRes, statsRes] = await Promise.all([
        axios.get(`${backendURL}/api/proposals/my?${params.toString()}`, {
          headers: { Authorization: `Bearer ${user?.token}` },
        }),
        axios.get(`${backendURL}/api/proposals/stats`, {
          headers: { Authorization: `Bearer ${user?.token}` },
        }),
      ]);

      setProposals(proposalsRes.data.proposals || []);
      setStats(statsRes.data.stats);
    } catch (error) {
      toast.error("Failed to load proposals");
    } finally {
      setLoading(false);
    }
  }, [backendURL, user?.token, activeTab]);

  useEffect(() => {
    if (user?.token) {
      fetchProposals();
    }
  }, [user?.token, fetchProposals]);

  // Withdraw proposal
  const handleWithdraw = async (proposalId) => {
    if (!confirm("Withdraw this proposal? This cannot be undone.")) return;
    
    try {
      await axios.delete(`${backendURL}/api/proposals/${proposalId}`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      toast.success("Proposal withdrawn");
      fetchProposals();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to withdraw");
    }
  };

  // Get status styles
  const getStatusConfig = (status) => {
    const config = {
      pending: { 
        bg: "bg-amber-500/10", 
        text: "text-amber-400", 
        border: "border-amber-500/20",
        icon: <HiClock className="text-[10px]" />,
        label: "Pending"
      },
      shortlisted: { 
        bg: "bg-purple-500/10", 
        text: "text-purple-400", 
        border: "border-purple-500/20",
        icon: <HiStar className="text-[10px]" />,
        label: "Shortlisted"
      },
      accepted: { 
        bg: "bg-emerald-500/10", 
        text: "text-emerald-400", 
        border: "border-emerald-500/20",
        icon: <HiCheckCircle className="text-[10px]" />,
        label: "Accepted"
      },
      rejected: { 
        bg: "bg-red-500/10", 
        text: "text-red-400", 
        border: "border-red-500/20",
        icon: <HiXCircle className="text-[10px]" />,
        label: "Rejected"
      },
      withdrawn: { 
        bg: "bg-gray-500/10", 
        text: "text-gray-400", 
        border: "border-gray-500/20",
        icon: <HiXCircle className="text-[10px]" />,
        label: "Withdrawn"
      },
    };
    return config[status] || config.pending;
  };

  // Shimmer
  const ShimmerCard = () => (
    <div className="bg-[#0A0A0C] light:bg-white border border-[#1a1a1f] light:border-slate-200 rounded-xl p-4 animate-pulse">
      <div className="h-4 bg-[#151518] light:bg-slate-100 rounded w-1/2 mb-2" />
      <div className="h-3 bg-[#151518] light:bg-slate-100 rounded w-1/3" />
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
              <HiClipboardCheck className="text-blue-400 text-lg" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white light:text-slate-900">My Proposals</h1>
              <p className="text-gray-500 text-[10px]">Track your submitted proposals</p>
            </div>
          </div>
          <button
            onClick={() => fetchProposals()}
            className="p-2 rounded-lg bg-[#0A0A0C] light:bg-white border border-[#1a1a1f] light:border-slate-200 text-gray-400 hover:text-white transition-colors"
          >
            <HiRefresh className={`text-sm ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-5">
            <div className="bg-[#0A0A0C] light:bg-white border border-[#1a1a1f] light:border-slate-200 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-white light:text-slate-900">{stats.total}</p>
              <p className="text-[10px] text-gray-500">Total</p>
            </div>
            <div className="bg-[#0A0A0C] light:bg-white border border-[#1a1a1f] light:border-slate-200 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-amber-400">{stats.pending}</p>
              <p className="text-[10px] text-gray-500">Pending</p>
            </div>
            <div className="bg-[#0A0A0C] light:bg-white border border-[#1a1a1f] light:border-slate-200 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-purple-400">{stats.shortlisted}</p>
              <p className="text-[10px] text-gray-500">Shortlisted</p>
            </div>
            <div className="bg-[#0A0A0C] light:bg-white border border-[#1a1a1f] light:border-slate-200 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-emerald-400">{stats.accepted}</p>
              <p className="text-[10px] text-gray-500">Accepted</p>
            </div>
            <div className="bg-[#0A0A0C] light:bg-white border border-[#1a1a1f] light:border-slate-200 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-blue-400 flex items-center justify-center gap-1">
                <HiTrendingUp className="text-sm" />
                {stats.total > 0 ? Math.round((stats.accepted / stats.total) * 100) : 0}%
              </p>
              <p className="text-[10px] text-gray-500">Success</p>
            </div>
          </div>
        )}

        {/* Status Tabs */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {STATUS_TABS.map((tab) => {
            const isActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                  isActive
                    ? tab.color === "gray" 
                      ? "bg-white light:bg-slate-900 text-black light:text-white"
                      : `bg-${tab.color}-500/20 text-${tab.color}-400 border border-${tab.color}-500/30`
                    : "bg-[#0A0A0C] light:bg-white text-gray-500 border border-[#1a1a1f] light:border-slate-200 hover:border-[#2a2a30]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Proposals List */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <ShimmerCard key={i} />)}
          </div>
        ) : proposals.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#0A0A0C] light:bg-slate-100 flex items-center justify-center">
              <HiInbox className="text-2xl text-gray-500" />
            </div>
            <h3 className="text-sm font-medium text-white light:text-slate-900 mb-1">No Proposals Yet</h3>
            <p className="text-gray-500 text-xs mb-4">Browse open briefs and submit your first proposal</p>
            <button
              onClick={() => navigate("/briefs")}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-xs font-medium"
            >
              Browse Briefs
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {proposals.map((proposal, index) => {
              const statusConfig = getStatusConfig(proposal.status);
              return (
                <motion.div
                  key={proposal._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={`bg-[#0A0A0C] light:bg-white border rounded-xl p-4 ${
                    proposal.isShortlisted && proposal.status === "pending"
                      ? "border-purple-500/30"
                      : "border-[#1a1a1f] light:border-slate-200"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Status Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 mb-2">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium border flex items-center gap-0.5 ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                          {statusConfig.icon}
                          {statusConfig.label}
                        </span>
                        {proposal.isShortlisted && proposal.status === "pending" && (
                          <span className="px-1.5 py-0.5 bg-purple-500/10 border border-purple-500/20 rounded text-[9px] text-purple-400 flex items-center gap-0.5">
                            <HiStar className="text-[9px]" /> Shortlisted
                          </span>
                        )}
                        {!proposal.viewedByClient && proposal.status === "pending" && (
                          <span className="px-1.5 py-0.5 bg-[#151518] light:bg-slate-100 rounded text-[9px] text-gray-500">
                            Not viewed
                          </span>
                        )}
                      </div>

                      {/* Brief Title */}
                      <h3
                        onClick={() => navigate(`/brief/${proposal.brief?._id}`)}
                        className="text-sm font-medium text-white light:text-slate-900 hover:text-blue-400 cursor-pointer transition-colors line-clamp-1 mb-2"
                      >
                        {proposal.brief?.title || "Brief"}
                      </h3>

                      {/* Your Quote */}
                      <div className="flex flex-wrap items-center gap-3 text-[11px]">
                        <span className="flex items-center gap-1 text-emerald-400 font-medium">
                          <HiCurrencyRupee className="text-xs" />
                          ₹{proposal.proposedPrice?.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1 text-gray-500">
                          <HiClock className="text-xs" />
                          {proposal.proposedDeliveryDays} days
                        </span>
                        {proposal.agreedPrice && (
                          <span className="flex items-center gap-1 text-blue-400">
                            <HiCheckCircle className="text-xs" />
                            Final: ₹{proposal.agreedPrice.toLocaleString()}
                          </span>
                        )}
                      </div>

                      {/* Pitch Preview */}
                      <p className="text-gray-500 text-[11px] mt-2 line-clamp-1">{proposal.pitch}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => navigate(`/brief/${proposal.brief?._id}`)}
                        className="p-2 bg-[#050506] light:bg-slate-100 border border-[#1a1a1f] light:border-slate-200 rounded-lg text-gray-400 hover:text-white transition-all"
                        title="View Brief"
                      >
                        <HiEye className="text-sm" />
                      </button>
                      {proposal.status === "pending" && (
                        <button
                          onClick={() => handleWithdraw(proposal._id)}
                          className="px-2.5 py-2 text-red-400 hover:bg-red-500/10 rounded-lg text-[11px] transition-colors"
                        >
                          Withdraw
                        </button>
                      )}
                      {proposal.status === "accepted" && proposal.linkedOrder && (
                        <button
                          onClick={() => navigate(`/my-orders`)}
                          className="px-2.5 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[11px] text-emerald-400"
                        >
                          View Order
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Rejection Reason */}
                  {proposal.status === "rejected" && proposal.rejectionReason && (
                    <div className="mt-3 pt-3 border-t border-[#1a1a1f] light:border-slate-100">
                      <p className="text-[10px] text-gray-600 mb-0.5">Reason:</p>
                      <p className="text-[11px] text-gray-500">{proposal.rejectionReason}</p>
                    </div>
                  )}

                  {/* Submitted Date */}
                  <div className="mt-3 pt-3 border-t border-[#1a1a1f] light:border-slate-100">
                    <p className="text-[10px] text-gray-600">
                      Submitted {new Date(proposal.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
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

export default MyProposalsPage;
