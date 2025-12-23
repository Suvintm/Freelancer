/**
 * Manage Brief Page - Professional Corporate Design
 * Client views proposals and accepts editors
 */
import { useState, useEffect } from "react";
import axios from "axios";
import {
  HiArrowLeft,
  HiCurrencyRupee,
  HiClock,
  HiUser,
  HiStar,
  HiCheck,
  HiX,
  HiBadgeCheck,
  HiExternalLink,
  HiUserGroup,
  HiChevronRight,
  HiShieldCheck,
  HiLightningBolt,
} from "react-icons/hi";
import { useAppContext } from "../context/AppContext";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import ClientSidebar from "../components/ClientSidebar.jsx";
import ClientNavbar from "../components/ClientNavbar.jsx";

const ManageBriefPage = () => {
  const { id } = useParams();
  const { backendURL, user } = useAppContext();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [brief, setBrief] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [accepting, setAccepting] = useState(null);
  
  // Accept modal
  const [showAcceptModal, setShowAcceptModal] = useState(null);
  const [acceptForm, setAcceptForm] = useState({
    agreedPrice: "",
    agreedDeliveryDays: "",
  });

  // Fetch brief and proposals
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [briefRes, proposalsRes] = await Promise.all([
          axios.get(`${backendURL}/api/briefs/${id}`, {
            headers: { Authorization: `Bearer ${user?.token}` },
          }),
          axios.get(`${backendURL}/api/proposals/brief/${id}`, {
            headers: { Authorization: `Bearer ${user?.token}` },
          }),
        ]);

        setBrief(briefRes.data.brief);
        setProposals(proposalsRes.data.proposals || []);
      } catch (error) {
        toast.error("Failed to load data");
        navigate("/my-briefs");
      } finally {
        setLoading(false);
      }
    };

    if (user?.token) {
      fetchData();
    }
  }, [id, backendURL, user?.token, navigate]);

  // Open accept modal
  const openAcceptModal = (proposal) => {
    setAcceptForm({
      agreedPrice: proposal.proposedPrice.toString(),
      agreedDeliveryDays: proposal.proposedDeliveryDays.toString(),
    });
    setShowAcceptModal(proposal);
  };

  // Accept proposal
  const handleAcceptProposal = async () => {
    if (!showAcceptModal) return;
    
    const agreedPrice = Number(acceptForm.agreedPrice);
    if (agreedPrice < showAcceptModal.proposedPrice) {
      toast.error("Price cannot be less than editor's proposed price");
      return;
    }

    try {
      setAccepting(showAcceptModal._id);
      
      const { data } = await axios.post(
        `${backendURL}/api/proposals/${showAcceptModal._id}/accept`,
        {
          agreedPrice,
          agreedDeliveryDays: Number(acceptForm.agreedDeliveryDays),
        },
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );

      if (!window.Razorpay) {
        toast.error("Payment gateway not loaded. Please refresh.");
        return;
      }

      const options = {
        key: data.razorpay.key,
        amount: data.razorpay.amount,
        currency: data.razorpay.currency,
        name: "SuviX",
        description: `Brief: ${brief.title}`,
        order_id: data.razorpay.orderId,
        handler: async function (response) {
          try {
            await axios.post(
              `${backendURL}/api/proposals/verify-payment`,
              {
                proposalId: showAcceptModal._id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
              { headers: { Authorization: `Bearer ${user?.token}` } }
            );
            
            toast.success("Editor accepted! Order created successfully.");
            navigate("/client-orders");
          } catch (error) {
            console.error("Payment verification error:", error);
            toast.error("Payment verification failed. Contact support.");
          }
        },
        modal: {
          ondismiss: function() {
            toast.info("Payment cancelled");
            setAccepting(null);
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
        },
        theme: {
          color: "#10B981",
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', function (response) {
        console.error("Payment failed:", response.error);
        toast.error(`Payment failed: ${response.error.description}`);
        setAccepting(null);
      });
      razorpay.open();
      setShowAcceptModal(null);
      
    } catch (error) {
      console.error("Accept proposal error:", error);
      toast.error(error.response?.data?.message || "Failed to accept");
      setAccepting(null);
    }
  };

  // Shortlist proposal
  const handleShortlist = async (proposalId) => {
    try {
      await axios.patch(
        `${backendURL}/api/proposals/${proposalId}/shortlist`,
        {},
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      
      setProposals(proposals.map(p => 
        p._id === proposalId 
          ? { ...p, isShortlisted: !p.isShortlisted }
          : p
      ));
      toast.success("Updated shortlist");
    } catch (error) {
      toast.error("Failed to update");
    }
  };

  // Reject proposal
  const handleReject = async (proposalId) => {
    if (!confirm("Reject this proposal?")) return;
    
    try {
      await axios.patch(
        `${backendURL}/api/proposals/${proposalId}/reject`,
        {},
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      
      setProposals(proposals.filter(p => p._id !== proposalId));
      toast.success("Proposal rejected");
    } catch (error) {
      toast.error("Failed to reject");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#030303] light:bg-slate-50">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!brief) return null;

  const shortlisted = proposals.filter(p => p.isShortlisted);
  const pending = proposals.filter(p => !p.isShortlisted);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#030303] light:bg-slate-50 text-white light:text-slate-900 transition-colors duration-300" style={{ fontFamily: "'Inter', sans-serif" }}>
      <ClientSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <ClientNavbar onMenuClick={() => setSidebarOpen(true)} />

      <main className="flex-1 px-4 md:px-8 py-5 md:ml-64 md:mt-20">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => navigate("/my-briefs")}
            className="p-2 rounded-lg bg-[#0A0A0C] light:bg-white border border-[#1a1a1f] light:border-slate-200 hover:border-[#2a2a30] transition-colors"
          >
            <HiArrowLeft className="text-gray-400 light:text-slate-500 text-sm" />
          </button>
          <div className="min-w-0">
            <h1 className="text-sm md:text-base font-semibold text-white light:text-slate-900 truncate">{brief.title}</h1>
            <p className="text-gray-500 text-[10px]">{proposals.length} proposals received</p>
          </div>
        </div>

        {/* Brief Summary */}
        <div className="bg-[#0A0A0C] light:bg-white border border-[#1a1a1f] light:border-slate-200 rounded-xl p-4 mb-5">
          <div className="flex flex-wrap gap-4 text-xs">
            <div>
              <p className="text-[10px] text-gray-500 uppercase mb-0.5">Budget</p>
              <p className="text-emerald-400 font-medium">₹{brief.budget.min.toLocaleString()} - ₹{brief.budget.max.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase mb-0.5">Delivery</p>
              <p className="text-white light:text-slate-900">{brief.expectedDeliveryDays} days</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase mb-0.5">Category</p>
              <p className="text-white light:text-slate-900 capitalize">{brief.category}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase mb-0.5">Status</p>
              <p className="text-white light:text-slate-900 capitalize">{brief.status.replace("_", " ")}</p>
            </div>
          </div>
        </div>

        {proposals.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#0A0A0C] light:bg-slate-100 flex items-center justify-center">
              <HiUserGroup className="text-xl text-gray-500" />
            </div>
            <h3 className="text-sm font-medium text-white light:text-slate-900 mb-1">No Proposals Yet</h3>
            <p className="text-gray-500 text-xs">Editors will start submitting soon</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Shortlisted Section */}
            {shortlisted.length > 0 && (
              <div>
                <h2 className="text-xs font-medium text-white light:text-slate-900 mb-3 flex items-center gap-2">
                  <HiStar className="text-amber-400" /> Shortlisted ({shortlisted.length})
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {shortlisted.map((proposal) => (
                    <ProposalCard
                      key={proposal._id}
                      proposal={proposal}
                      onAccept={() => openAcceptModal(proposal)}
                      onShortlist={() => handleShortlist(proposal._id)}
                      onReject={() => handleReject(proposal._id)}
                      accepting={accepting === proposal._id}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* All Proposals */}
            <div>
              <h2 className="text-xs font-medium text-white light:text-slate-900 mb-3">
                {shortlisted.length > 0 ? "Other Proposals" : "All Proposals"} ({pending.length})
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {pending.map((proposal) => (
                  <ProposalCard
                    key={proposal._id}
                    proposal={proposal}
                    onAccept={() => openAcceptModal(proposal)}
                    onShortlist={() => handleShortlist(proposal._id)}
                    onReject={() => handleReject(proposal._id)}
                    accepting={accepting === proposal._id}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Accept Modal */}
        <AnimatePresence>
          {showAcceptModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowAcceptModal(null)}
            >
              <motion.div
                initial={{ scale: 0.95, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 10 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-[#0A0A0C] light:bg-white border border-[#1a1a1f] light:border-slate-200 rounded-xl p-5 max-w-sm w-full"
              >
                <div className="flex items-center gap-2 mb-4">
                  <HiCheck className="text-emerald-400" />
                  <h3 className="text-sm font-medium text-white light:text-slate-900">Accept Proposal</h3>
                </div>

                <div className="flex items-center gap-3 mb-5 p-3 bg-[#050506] light:bg-slate-50 rounded-lg">
                  <img
                    src={showAcceptModal.editor?.profilePicture || "/default-avatar.png"}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-sm font-medium text-white light:text-slate-900">{showAcceptModal.editor?.name}</p>
                    <p className="text-[10px] text-gray-400">
                      ₹{showAcceptModal.proposedPrice.toLocaleString()} · {showAcceptModal.proposedDeliveryDays} days
                    </p>
                  </div>
                </div>

                <div className="space-y-3 mb-5">
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase mb-1 block">Final Price (₹)</label>
                    <input
                      type="number"
                      value={acceptForm.agreedPrice}
                      onChange={(e) => setAcceptForm({ ...acceptForm, agreedPrice: e.target.value })}
                      className="w-full bg-[#050506] light:bg-slate-50 border border-[#1a1a1f] light:border-slate-200 rounded-lg px-3 py-2.5 text-sm text-white light:text-slate-900"
                    />
                    <p className="text-[9px] text-gray-600 mt-1">Must be ≥ ₹{showAcceptModal.proposedPrice}</p>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase mb-1 block">Delivery Days</label>
                    <input
                      type="number"
                      value={acceptForm.agreedDeliveryDays}
                      onChange={(e) => setAcceptForm({ ...acceptForm, agreedDeliveryDays: e.target.value })}
                      className="w-full bg-[#050506] light:bg-slate-50 border border-[#1a1a1f] light:border-slate-200 rounded-lg px-3 py-2.5 text-sm text-white light:text-slate-900"
                    />
                  </div>
                </div>

                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3 mb-5">
                  <p className="text-emerald-400 text-xs flex items-center gap-1.5">
                    <HiShieldCheck /> ₹{Number(acceptForm.agreedPrice).toLocaleString()} held in escrow
                  </p>
                  <p className="text-gray-500 text-[9px] mt-0.5">Released after you approve the work</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAcceptModal(null)}
                    className="flex-1 py-2.5 bg-[#151518] light:bg-slate-100 border border-[#1a1a1f] light:border-slate-200 rounded-lg text-gray-400 text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAcceptProposal}
                    disabled={accepting}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white text-xs font-medium flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {accepting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <HiCheck /> Accept & Pay
                      </>
                    )}
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

// Proposal Card Component
const ProposalCard = ({ proposal, onAccept, onShortlist, onReject, accepting }) => (
  <motion.div
    initial={{ opacity: 0, y: 5 }}
    animate={{ opacity: 1, y: 0 }}
    className={`bg-[#0A0A0C] light:bg-white border rounded-xl p-4 ${
      proposal.isShortlisted ? "border-amber-500/30" : "border-[#1a1a1f] light:border-slate-200"
    }`}
  >
    {/* Editor Info */}
    <div className="flex items-start gap-3 mb-3">
      <img
        src={proposal.editor?.profilePicture || "/default-avatar.png"}
        alt=""
        className="w-9 h-9 rounded-full object-cover"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white light:text-slate-900 truncate">{proposal.editor?.name}</p>
        {proposal.editor?.rating && (
          <p className="text-[10px] text-gray-400 flex items-center gap-1">
            <HiStar className="text-amber-400" /> {proposal.editor.rating.toFixed(1)}
            <span className="text-gray-600">·</span>
            {proposal.editor.completedOrders || 0} jobs
          </p>
        )}
      </div>
      <button
        onClick={onShortlist}
        className={`p-1.5 rounded-lg transition-colors ${
          proposal.isShortlisted
            ? "text-amber-400 bg-amber-500/10"
            : "text-gray-500 hover:text-amber-400"
        }`}
      >
        <HiStar className="text-sm" />
      </button>
    </div>

    {/* Quote */}
    <div className="flex items-center gap-3 mb-3">
      <span className="flex items-center gap-1 text-emerald-400 text-xs font-medium">
        <HiCurrencyRupee className="text-sm" />
        {proposal.proposedPrice.toLocaleString()}
      </span>
      <span className="flex items-center gap-1 text-gray-400 text-xs">
        <HiClock className="text-sm" />
        {proposal.proposedDeliveryDays} days
      </span>
    </div>

    {/* Pitch */}
    <p className="text-gray-400 light:text-slate-500 text-xs mb-3 line-clamp-2">{proposal.pitch}</p>

    {/* Portfolio Links */}
    {proposal.relevantPortfolio?.length > 0 && (
      <div className="flex flex-wrap gap-2 mb-3">
        {proposal.relevantPortfolio.slice(0, 2).map((work, idx) => (
          <a
            key={idx}
            href={work.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            <HiExternalLink /> {work.title || "Portfolio"}
          </a>
        ))}
      </div>
    )}

    {/* Actions */}
    <div className="flex gap-2 pt-3 border-t border-[#1a1a1f] light:border-slate-100">
      <button
        onClick={onAccept}
        disabled={accepting}
        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white text-[10px] font-medium flex items-center justify-center gap-1 disabled:opacity-50"
      >
        {accepting ? (
          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <HiCheck /> Accept
          </>
        )}
      </button>
      <button
        onClick={onReject}
        className="px-3 py-2 bg-[#151518] light:bg-slate-100 border border-[#1a1a1f] light:border-slate-200 rounded-lg text-gray-400 text-[10px] font-medium hover:text-red-400 hover:border-red-500/20 transition-colors"
      >
        <HiX />
      </button>
    </div>
  </motion.div>
);

export default ManageBriefPage;
