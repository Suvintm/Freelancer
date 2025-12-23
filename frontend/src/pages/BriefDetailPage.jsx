/**
 * Brief Detail Page - Professional Corporate Design
 * View brief and submit proposal
 */
import { useState, useEffect } from "react";
import axios from "axios";
import {
  HiArrowLeft,
  HiCurrencyRupee,
  HiClock,
  HiCalendar,
  HiEye,
  HiUserGroup,
  HiVideoCamera,
  HiPaperAirplane,
  HiCheckCircle,
  HiInformationCircle,
  HiExclamation,
  HiClipboardCheck,
  HiFire,
  HiSparkles,
  HiPhotograph,
  HiDocumentText,
  HiLightBulb,
  HiStar,
} from "react-icons/hi";
import { useAppContext } from "../context/AppContext";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import Sidebar from "../components/Sidebar.jsx";
import EditorNavbar from "../components/EditorNavbar.jsx";

const BriefDetailPage = () => {
  const { id } = useParams();
  const { backendURL, user } = useAppContext();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [brief, setBrief] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [userProposal, setUserProposal] = useState(null);

  // Proposal form
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [proposalForm, setProposalForm] = useState({
    proposedPrice: "",
    proposedDeliveryDays: "",
    pitch: "",
    relevantPortfolio: [],
  });
  const [errors, setErrors] = useState({});

  // Fetch brief details
  useEffect(() => {
    const fetchBrief = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(
          `${backendURL}/api/briefs/${id}`,
          { headers: { Authorization: `Bearer ${user?.token}` } }
        );
        setBrief(data.brief);
        setIsOwner(data.isOwner);
        setUserProposal(data.userProposal);
        
        // Pre-fill form with brief's expected values
        if (data.brief) {
          setProposalForm(prev => ({
            ...prev,
            proposedPrice: data.brief.budget.min.toString(),
            proposedDeliveryDays: data.brief.expectedDeliveryDays.toString(),
          }));
        }
      } catch (error) {
        toast.error("Failed to load brief");
        navigate("/briefs");
      } finally {
        setLoading(false);
      }
    };

    if (user?.token) {
      fetchBrief();
    }
  }, [id, backendURL, user?.token, navigate]);

  // Validate proposal
  const validateProposal = () => {
    const newErrors = {};
    if (!proposalForm.proposedPrice || proposalForm.proposedPrice < 500) {
      newErrors.proposedPrice = "Minimum price is ₹500";
    }
    if (!proposalForm.proposedDeliveryDays || proposalForm.proposedDeliveryDays < 1) {
      newErrors.proposedDeliveryDays = "Minimum 1 day";
    }
    if (!proposalForm.pitch || proposalForm.pitch.length < 100) {
      newErrors.pitch = "Pitch must be at least 100 characters";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit proposal
  const handleSubmitProposal = async (e) => {
    e.preventDefault();
    if (!validateProposal()) return;

    try {
      setSubmitting(true);
      await axios.post(
        `${backendURL}/api/proposals`,
        {
          briefId: id,
          proposedPrice: Number(proposalForm.proposedPrice),
          proposedDeliveryDays: Number(proposalForm.proposedDeliveryDays),
          pitch: proposalForm.pitch,
          relevantPortfolio: proposalForm.relevantPortfolio,
        },
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      
      toast.success("Proposal submitted successfully!");
      setShowProposalForm(false);
      
      // Refresh to show submitted status
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit proposal");
    } finally {
      setSubmitting(false);
    }
  };

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Calculate days remaining
  const getDaysRemaining = (deadline) => {
    return Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#030303] light:bg-slate-50">
        <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!brief) return null;

  const daysRemaining = getDaysRemaining(brief.applicationDeadline);
  const canApply = user?.role === "editor" && !userProposal && brief.status === "open" && daysRemaining > 0;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#030303] light:bg-slate-50 text-white light:text-slate-900 transition-colors duration-300" style={{ fontFamily: "'Inter', sans-serif" }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <EditorNavbar onMenuClick={() => setSidebarOpen(true)} />

      <main className="flex-1 px-4 md:px-6 py-5 md:ml-64 md:mt-20">
        {/* Back Button & Header */}
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg bg-[#0A0A0C] light:bg-white border border-[#1a1a1f] light:border-slate-200 hover:border-[#2a2a30] transition-all"
          >
            <HiArrowLeft className="text-gray-400 text-sm" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-1.5 mb-1">
              {brief.isUrgent && (
                <span className="px-1.5 py-0.5 bg-orange-500/10 border border-orange-500/20 rounded text-[9px] text-orange-400 flex items-center gap-0.5">
                  <HiFire className="text-[9px]" /> Urgent
                </span>
              )}
              {brief.isBoosted && (
                <span className="px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded text-[9px] text-amber-400 flex items-center gap-0.5">
                  <HiSparkles className="text-[9px]" /> Featured
                </span>
              )}
            </div>
            <h1 className="text-lg md:text-xl font-semibold text-white light:text-slate-900">
              {brief.title}
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Description */}
            <div className="bg-[#0A0A0C] light:bg-white border border-[#1a1a1f] light:border-slate-200 rounded-xl p-4">
              <h2 className="text-sm font-semibold text-white light:text-slate-900 mb-3 flex items-center gap-2">
                <HiDocumentText className="text-gray-500" />
                Project Description
              </h2>
              <p className="text-gray-400 light:text-slate-600 text-xs whitespace-pre-wrap leading-relaxed">
                {brief.description}
              </p>
            </div>

            {/* Requirements */}
            <div className="bg-[#0A0A0C] light:bg-white border border-[#1a1a1f] light:border-slate-200 rounded-xl p-4">
              <h2 className="text-sm font-semibold text-white light:text-slate-900 mb-3 flex items-center gap-2">
                <HiClipboardCheck className="text-gray-500" />
                Requirements
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <div className="bg-[#050506] light:bg-slate-50 rounded-lg p-3">
                  <p className="text-[10px] text-gray-500 mb-0.5">Output Format</p>
                  <p className="text-white light:text-slate-900 text-xs font-medium">{brief.requirements?.outputFormat || "N/A"}</p>
                </div>
                <div className="bg-[#050506] light:bg-slate-50 rounded-lg p-3">
                  <p className="text-[10px] text-gray-500 mb-0.5">Aspect Ratio</p>
                  <p className="text-white light:text-slate-900 text-xs font-medium">{brief.requirements?.aspectRatio || "N/A"}</p>
                </div>
                <div className="bg-[#050506] light:bg-slate-50 rounded-lg p-3">
                  <p className="text-[10px] text-gray-500 mb-0.5">Revisions</p>
                  <p className="text-white light:text-slate-900 text-xs font-medium">{brief.requirements?.revisionsIncluded || 2}</p>
                </div>
                <div className="bg-[#050506] light:bg-slate-50 rounded-lg p-3">
                  <p className="text-[10px] text-gray-500 mb-0.5">Skill Level</p>
                  <p className="text-white light:text-slate-900 text-xs font-medium capitalize">{brief.requirements?.skillLevel || "Any"}</p>
                </div>
                {brief.requirements?.softwareNeeded?.length > 0 && (
                  <div className="bg-[#050506] light:bg-slate-50 rounded-lg p-3 col-span-2">
                    <p className="text-[10px] text-gray-500 mb-0.5">Software Preferred</p>
                    <p className="text-white light:text-slate-900 text-xs font-medium">
                      {brief.requirements.softwareNeeded.join(", ")}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Attachments */}
            {brief.attachments?.length > 0 && (
              <div className="bg-[#0A0A0C] light:bg-white border border-[#1a1a1f] light:border-slate-200 rounded-xl p-4">
                <h2 className="text-sm font-semibold text-white light:text-slate-900 mb-3">
                  Attachments
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {brief.attachments.map((file, idx) => (
                    <a
                      key={idx}
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2.5 bg-[#050506] light:bg-slate-50 rounded-lg hover:bg-[#0f0f12] transition-colors"
                    >
                      {file.type === "video" ? (
                        <HiVideoCamera className="text-blue-400 text-sm" />
                      ) : (
                        <HiPhotograph className="text-emerald-400 text-sm" />
                      )}
                      <span className="text-[11px] text-gray-400 truncate">
                        {file.name || `File ${idx + 1}`}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Proposal Form */}
            <AnimatePresence>
              {showProposalForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-[#0A0A0C] light:bg-white border border-blue-500/30 rounded-xl p-4 overflow-hidden"
                >
                  <h2 className="text-sm font-semibold text-white light:text-slate-900 mb-4 flex items-center gap-2">
                    <HiPaperAirplane className="text-blue-400" />
                    Submit Your Proposal
                  </h2>

                  <form onSubmit={handleSubmitProposal} className="space-y-4">
                    {/* Price & Delivery */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-gray-500 uppercase mb-1.5 block">
                          Your Price (₹) *
                        </label>
                        <div className="relative">
                          <HiCurrencyRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
                          <input
                            type="number"
                            value={proposalForm.proposedPrice}
                            onChange={(e) => setProposalForm({ ...proposalForm, proposedPrice: e.target.value })}
                            className={`w-full bg-[#050506] light:bg-slate-50 border ${errors.proposedPrice ? "border-red-500" : "border-[#1a1a1f] light:border-slate-200"} rounded-lg pl-8 pr-3 py-2.5 text-xs focus:border-blue-500/50 outline-none`}
                            placeholder="Enter your price"
                          />
                        </div>
                        {errors.proposedPrice && <p className="text-red-400 text-[10px] mt-1">{errors.proposedPrice}</p>}
                        <p className="text-gray-600 text-[10px] mt-1">Budget: ₹{brief.budget.min} - ₹{brief.budget.max}</p>
                      </div>

                      <div>
                        <label className="text-[11px] text-gray-500 uppercase mb-1.5 block">
                          Delivery Days *
                        </label>
                        <div className="relative">
                          <HiClock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
                          <input
                            type="number"
                            value={proposalForm.proposedDeliveryDays}
                            onChange={(e) => setProposalForm({ ...proposalForm, proposedDeliveryDays: e.target.value })}
                            className={`w-full bg-[#050506] light:bg-slate-50 border ${errors.proposedDeliveryDays ? "border-red-500" : "border-[#1a1a1f] light:border-slate-200"} rounded-lg pl-8 pr-3 py-2.5 text-xs focus:border-blue-500/50 outline-none`}
                            placeholder="Days to complete"
                          />
                        </div>
                        {errors.proposedDeliveryDays && <p className="text-red-400 text-[10px] mt-1">{errors.proposedDeliveryDays}</p>}
                        <p className="text-gray-600 text-[10px] mt-1">Expected: {brief.expectedDeliveryDays} days</p>
                      </div>
                    </div>

                    {/* Pitch */}
                    <div>
                      <label className="text-[11px] text-gray-500 uppercase mb-1.5 block">
                        Your Pitch * (Why are you the best fit?)
                      </label>
                      <textarea
                        value={proposalForm.pitch}
                        onChange={(e) => setProposalForm({ ...proposalForm, pitch: e.target.value })}
                        rows={4}
                        maxLength={2000}
                        className={`w-full bg-[#050506] light:bg-slate-50 border ${errors.pitch ? "border-red-500" : "border-[#1a1a1f] light:border-slate-200"} rounded-lg px-3 py-2.5 text-xs resize-none focus:border-blue-500/50 outline-none`}
                        placeholder="Explain why you're perfect for this project..."
                      />
                      {errors.pitch && <p className="text-red-400 text-[10px] mt-1">{errors.pitch}</p>}
                      <p className="text-gray-600 text-[10px] mt-1">{proposalForm.pitch.length}/2000 (min 100)</p>
                    </div>

                    {/* Tips */}
                    <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
                      <div className="flex gap-2">
                        <HiLightBulb className="text-blue-400 flex-shrink-0 mt-0.5 text-sm" />
                        <div>
                          <p className="text-blue-400 text-[11px] font-medium mb-1">Tips for a winning proposal</p>
                          <ul className="text-gray-500 text-[10px] space-y-0.5 list-disc list-inside">
                            <li>Read the requirements carefully</li>
                            <li>Be specific about your approach</li>
                            <li>Mention relevant experience</li>
                            <li>Price competitively but fairly</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowProposalForm(false)}
                        className="flex-1 py-2.5 bg-[#050506] light:bg-slate-100 border border-[#1a1a1f] light:border-slate-200 rounded-lg text-gray-400 text-xs font-medium hover:bg-[#0f0f12] transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-xs font-medium flex items-center justify-center gap-1.5 disabled:opacity-50 transition-all"
                      >
                        {submitting ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <HiPaperAirplane /> Submit Proposal
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar */}
          <div className="space-y-3">
            {/* Client Info */}
            <div className="bg-[#0A0A0C] light:bg-white border border-[#1a1a1f] light:border-slate-200 rounded-xl p-4">
              <h3 className="text-[10px] font-medium text-gray-500 uppercase mb-2">Posted By</h3>
              <div className="flex items-center gap-2.5">
                <img
                  src={brief.client?.profilePicture || "/default-avatar.png"}
                  alt={brief.client?.name}
                  className="w-9 h-9 rounded-full object-cover border border-[#1a1a1f]"
                />
                <div>
                  <p className="text-xs font-medium text-white light:text-slate-900">{brief.client?.name}</p>
                  <p className="text-[10px] text-gray-500">Client</p>
                </div>
              </div>
            </div>

            {/* Budget */}
            <div className="bg-[#0A0A0C] light:bg-white border border-[#1a1a1f] light:border-slate-200 rounded-xl p-4">
              <h3 className="text-[10px] font-medium text-gray-500 uppercase mb-2">Budget</h3>
              <p className="text-xl font-bold text-emerald-400">
                ₹{brief.budget.min.toLocaleString()} - ₹{brief.budget.max.toLocaleString()}
              </p>
              {brief.budget.isNegotiable && (
                <p className="text-[10px] text-gray-500 mt-1">Negotiable</p>
              )}
            </div>

            {/* Timeline */}
            <div className="bg-[#0A0A0C] light:bg-white border border-[#1a1a1f] light:border-slate-200 rounded-xl p-4">
              <h3 className="text-[10px] font-medium text-gray-500 uppercase mb-2">Timeline</h3>
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <HiCalendar className="text-gray-500 text-sm" />
                  <div>
                    <p className="text-[10px] text-gray-500">Apply By</p>
                    <p className="text-white light:text-slate-900 text-xs font-medium">
                      {formatDate(brief.applicationDeadline)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <HiClock className="text-gray-500 text-sm" />
                  <div>
                    <p className="text-[10px] text-gray-500">Expected Delivery</p>
                    <p className="text-white light:text-slate-900 text-xs font-medium">{brief.expectedDeliveryDays} days</p>
                  </div>
                </div>
              </div>
              
              {daysRemaining > 0 ? (
                <div className={`mt-3 px-2.5 py-1.5 rounded-lg text-center text-[11px] font-medium ${
                  daysRemaining <= 2 ? "bg-red-500/10 text-red-400" : daysRemaining <= 5 ? "bg-amber-500/10 text-amber-400" : "bg-emerald-500/10 text-emerald-400"
                }`}>
                  {daysRemaining} days left to apply
                </div>
              ) : (
                <div className="mt-3 px-2.5 py-1.5 rounded-lg text-center bg-red-500/10 text-red-400 text-[11px] font-medium">
                  Applications Closed
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="bg-[#0A0A0C] light:bg-white border border-[#1a1a1f] light:border-slate-200 rounded-xl p-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center">
                  <p className="text-xl font-bold text-white light:text-slate-900">{brief.proposalCount}</p>
                  <p className="text-[10px] text-gray-500">Proposals</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-white light:text-slate-900">{brief.views}</p>
                  <p className="text-[10px] text-gray-500">Views</p>
                </div>
              </div>
            </div>

            {/* Action Button */}
            {canApply && !showProposalForm && (
              <button
                onClick={() => setShowProposalForm(true)}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-blue-500/20"
              >
                <HiPaperAirplane /> Submit Proposal
              </button>
            )}

            {userProposal && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-center">
                <HiClipboardCheck className="text-2xl text-blue-400 mx-auto mb-2" />
                <p className="text-blue-400 text-xs font-semibold">Proposal Submitted</p>
                <p className="text-gray-500 text-[11px] mt-0.5">
                  Status: <span className="capitalize">{userProposal.status}</span>
                </p>
                <p className="text-gray-600 text-[10px] mt-1">
                  Your quote: ₹{userProposal.proposedPrice}
                </p>
              </div>
            )}

            {isOwner && (
              <button
                onClick={() => navigate(`/manage-brief/${id}`)}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded-xl text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
              >
                <HiEye /> Manage Proposals
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default BriefDetailPage;
