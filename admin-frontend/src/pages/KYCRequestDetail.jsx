import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FaUser, FaUniversity, FaFileAlt, FaArrowLeft, FaCheck, FaTimes,
  FaMapMarkerAlt, FaSpinner, FaCloudDownloadAlt, FaShieldAlt,
  FaHistory, FaPhone, FaEnvelope, FaGlobe, FaMoneyBillWave,
  FaArrowRight, FaCalendarAlt
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import { kycApi } from "../api/adminApi";
import Badge from "../components/ui/Badge";
import PageHeader from "../components/ui/PageHeader";
import Skeleton from "../components/ui/Skeleton";

const KYCRequestDetail = () => {
  const { type, id } = useParams(); // type: 'client' | 'editor'
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  // ── Queries ──────────────────────────────────────────────────────────────

  const { data: res, isLoading, error } = useQuery({
    queryKey: ["kyc", "detail", type, id],
    queryFn: () => type === "client" 
      ? kycApi.getClientById(id) 
      : kycApi.getEditorById(id),
  });

  // ── Mutations ────────────────────────────────────────────────────────────

  const verifyMutation = useMutation({
    mutationFn: (data) => type === "client" 
      ? kycApi.verifyClient(id, data) 
      : kycApi.verifyEditor(id, data),
    onSuccess: (res) => {
      toast.success("KYC status updated successfully");
      queryClient.invalidateQueries(["kyc", "detail", type, id]);
      setShowRejectModal(false);
      setRejectReason("");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to update status");
    }
  });

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleAction = (action, reason = "") => {
    const data = type === "editor" 
      ? { action, rejectionReason: reason } 
      : { status: action === "approve" ? "verified" : "rejected", rejectionReason: reason };

    verifyMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <PageHeader title="Loading Details..." subtitle="Please wait..." />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-60 rounded-xl" />
          <Skeleton className="h-60 col-span-2 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !res?.data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-zinc-500">
        <FaTimes className="text-4xl mb-4 text-red-500/50" />
        <p>Application not found or session expired</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-blue-500 hover:underline">Go Back</button>
      </div>
    );
  }

  const d = res.data;
  const user = type === "client" ? d.kyc.user : d.user;
  const kyc = type === "client" ? d.kyc : d.user;
  const status = kyc.kycStatus || kyc.status || "pending";
  const bank = kyc.bankDetails || kyc; // Mapping differences

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-elevated rounded-lg text-muted transition"
          >
            <FaArrowLeft />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-primary flex items-center gap-3">
              KYC Application: {type.charAt(0).toUpperCase() + type.slice(1)}
              <Badge variant={status === "verified" ? "success" : status === "rejected" ? "error" : "warning"}>
                {status.toUpperCase()}
              </Badge>
            </h1>
            <p className="text-sm text-muted mt-1">Ref ID: {id}</p>
          </div>
        </div>

        {status === "pending" || status === "submitted" || status === "under_review" ? (
          <div className="flex items-center gap-3">
             <button 
                onClick={() => handleAction("approve")}
                disabled={verifyMutation.isLoading}
                className="bg-success hover:bg-success/90 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition shadow-lg shadow-success/10"
             >
                {verifyMutation.isLoading ? <FaSpinner className="animate-spin" /> : <FaCheck />}
                Verify & Approve
             </button>
             <button 
                onClick={() => setShowRejectModal(true)}
                disabled={verifyMutation.isLoading}
                className="bg-surface border border-border-default hover:border-danger/50 text-danger px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition"
             >
                <FaTimes />
                Reject
             </button>
          </div>
        ) : (
          <div className="text-sm text-muted bg-surface px-4 py-2 rounded-lg border border-border-default">
            {status === "verified" ? "This profile was verified on " : "This profile was rejected on "}
            <span className="text-primary font-medium">{new Date(kyc.kycVerifiedAt || kyc.verifiedAt || kyc.updatedAt).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: User Profile */}
        <div className="space-y-6">
          <div className="bg-surface border border-border-default rounded-2xl overflow-hidden shadow-sm">
            <div className="h-24 bg-gradient-to-br from-brand/20 to-info/20" />
            <div className="px-6 pb-6 relative">
              <img 
                src={user?.profilePicture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} 
                className="w-24 h-24 rounded-2xl border-4 border-surface object-cover absolute -top-12"
                alt=""
              />
              <div className="mt-14 space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-primary uppercase">{type === "client" ? kyc.fullName : user?.name}</h3>
                  <p className="text-muted text-sm">{user?.email}</p>
                </div>
                
                <div className="space-y-2 py-4 border-y border-border-default">
                  <div className="flex items-center gap-3 text-secondary text-sm font-medium">
                    <FaPhone className="text-muted" /> {kyc.phone || user?.phone || "No phone provided"}
                  </div>
                  <div className="flex items-center gap-3 text-secondary text-sm font-medium">
                    <FaGlobe className="text-muted" /> {user?.country || "IN"}
                  </div>
                  {type === "client" && kyc.preferredRefundMethod && (
                    <div className="flex items-center gap-3 text-secondary text-sm font-medium">
                      <FaMoneyBillWave className="text-muted" /> {kyc.preferredRefundMethod.replace("_", " ")}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                  <div className="text-muted">Account Created</div>
                  <div className="text-secondary">{new Date(user?.createdAt || Date.now()).toLocaleDateString()}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Address Card */}
          <div className="bg-surface border border-border-default rounded-2xl p-6 space-y-4 shadow-sm">
            <h4 className="text-[10px] font-bold text-muted uppercase tracking-widest flex items-center gap-2">
              <FaMapMarkerAlt className="text-danger" /> Address & Location
            </h4>
            <div className="space-y-1">
              <div className="text-primary text-sm font-medium">{bank?.address?.street || "No street provided"}</div>
              <div className="text-secondary text-xs">
                {[bank?.address?.city, bank?.address?.state, bank?.address?.postalCode].filter(Boolean).join(", ")}
              </div>
              <div className="text-secondary text-xs font-bold mt-2 uppercase tracking-tight">GSTIN: <span className="text-primary">{bank?.gstin || "N/A"}</span></div>
            </div>
          </div>
        </div>

        {/* Right Column: Documents and Bank Info */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bank Card */}
            <div className="bg-surface border border-border-default rounded-2xl p-6 space-y-4 shadow-sm">
              <h4 className="text-[10px] font-bold text-muted uppercase tracking-widest flex items-center gap-2">
                <FaUniversity className="text-info" /> Bank Account Details
              </h4>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] text-muted mb-1 font-bold uppercase tracking-tighter">Account Holder</p>
                  <p className="text-primary font-bold uppercase text-sm">{bank.accountHolderName || "N/A"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted mb-1 font-bold uppercase tracking-tighter">Bank Name</p>
                  <p className="text-secondary text-sm font-medium">{bank.bankName || "N/A"}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-muted mb-1 font-bold uppercase tracking-tighter">Account Number</p>
                    <p className="text-primary font-mono text-sm">{bank.accountNumber || bank.bankAccountNumberMasked || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted mb-1 font-bold uppercase tracking-tighter">IFSC Code</p>
                    <p className="text-primary font-mono text-sm">{bank.ifscCode || "N/A"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Identity Card */}
            <div className="bg-surface border border-border-default rounded-2xl p-6 space-y-4 shadow-sm">
              <h4 className="text-[10px] font-bold text-muted uppercase tracking-widest flex items-center gap-2">
                <FaShieldAlt className="text-success" /> Government ID
              </h4>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] text-muted mb-1 font-bold uppercase tracking-tighter">PAN Number</p>
                  <p className="text-primary font-mono bg-base p-2 rounded-lg border border-border-default inline-block text-sm">
                    {bank.panNumber || bank.panNumberMasked || "N/A"}
                  </p>
                </div>
                <div className="bg-success/5 border border-success/10 p-3 rounded-xl">
                  <p className="text-[10px] text-success/80 leading-relaxed italic font-medium">
                    All financial information is stored with high-grade encryption and only accessible by authorized compliance personnel.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Documents Grid */}
          <div className="bg-surface border border-border-default rounded-2xl p-6 space-y-6 shadow-sm shadow-black/5">
            <h4 className="text-[10px] font-bold text-muted uppercase tracking-widest flex items-center gap-2">
              <FaFileAlt className="text-brand" /> Identity Documents
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(type === "editor" ? kyc.kycDocuments : kyc.documents || []).map((doc, idx) => (
                <div key={idx} className="group relative bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden hover:border-blue-500/50 transition duration-300">
                  <div className="p-3 bg-zinc-900/50 border-b border-zinc-800 flex justify-between items-center text-[10px] font-bold uppercase text-zinc-500 tracking-wider">
                    <span>{doc.type.replace("_", " ")}</span>
                    <span className="text-zinc-600">{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="aspect-[16/10] bg-zinc-900 relative">
                    {doc.url.toLowerCase().endsWith(".pdf") ? (
                      <div className="w-full h-full flex flex-col items-center justify-center text-zinc-700">
                        <FaIdCard className="text-4xl mb-2 opacity-20" />
                        <span className="text-xs">PDF Document</span>
                      </div>
                    ) : (
                      <img src={doc.url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition duration-700" />
                    )}
                    <div className="absolute inset-0 bg-zinc-950/80 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition p-4">
                      <a 
                        href={doc.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="bg-white text-black px-4 py-2 rounded-lg font-bold flex items-center gap-2 text-xs shadow-2xl transition hover:bg-zinc-200"
                      >
                        <FaCloudDownloadAlt /> View Document
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Audit Log / History */}
          {d.logs?.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6 shadow-sm">
              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <FaHistory className="text-zinc-400" /> Moderation History
              </h4>
              <div className="space-y-4">
                {d.logs.map((log, idx) => (
                  <div key={idx} className="flex gap-4 group">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full mt-1.5 ring-4 ring-zinc-900 ${log.action === "verified" ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" : "bg-red-500"}`} />
                      {idx !== d.logs.length - 1 && <div className="w-px h-full bg-zinc-800 border-dashed border-l mt-1" />}
                    </div>
                    <div className="pb-6">
                      <div className="text-zinc-200 text-sm font-bold flex items-center gap-2">
                        Status Changed to {log.action.toUpperCase()}
                        <span className="text-xs font-normal text-zinc-500 ml-auto">{new Date(log.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-zinc-500 text-xs mt-1">Performed by {log.performedBy?.adminId?.name || "System"}</p>
                      {log.reason && (
                        <div className="mt-2 bg-zinc-950 border border-zinc-800/50 p-2 rounded text-xs text-red-400/80 italic">
                          "{log.reason}"
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-surface border border-border-default rounded-3xl w-full max-w-md p-8 shadow-2xl space-y-6">
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-primary flex items-center gap-3">
                  <FaShieldAlt className="text-danger" /> Reject Application
                </h3>
                <p className="text-muted text-sm leading-relaxed">Please provide a constructive reason for rejection. This will be sent to the user.</p>
              </div>
              
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Identity proof is expired, account holder name mismatch..."
                className="w-full bg-base border border-border-default rounded-2xl p-4 text-primary h-32 focus:border-danger outline-none resize-none transition text-sm"
              />
              
              <div className="flex justify-end gap-3 pt-2">
                 <button 
                   onClick={() => setShowRejectModal(false)}
                   className="px-6 py-2.5 text-secondary hover:text-primary transition font-bold text-sm"
                 >
                   Cancel
                 </button>
                 <button 
                   onClick={() => handleAction("reject", rejectReason)}
                   disabled={!rejectReason.trim() || verifyMutation.isLoading}
                   className="bg-danger hover:bg-danger/90 text-white px-8 py-2.5 rounded-xl font-bold disabled:opacity-50 transition text-sm shadow-lg shadow-danger/20"
                 >
                   {verifyMutation.isLoading ? "Rejecting..." : "Confirm Rejection"}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default KYCRequestDetail;
