import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaUser,
  FaUniversity,
  FaFileAlt,
  FaArrowLeft,
  FaCheck,
  FaTimes,
  FaMapMarkerAlt,
  FaBuilding,
  FaSpinner,
  FaCloudDownloadAlt,
  FaShieldAlt,
  FaHistory,
  FaPhone,
  FaEnvelope,
  FaGlobe,
  FaMoneyBillWave,
} from "react-icons/fa";
import axios from "axios";
import { toast } from "react-toastify";

const KYCRequestDetail = () => {
  const { type, id } = useParams(); // type: 'client' | 'editor'
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null); // URL of doc to preview

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("adminToken");
        const baseURL = "http://localhost:5000"; // Should come from config

        let url;
        if (type === "client") {
          url = `${baseURL}/api/client-kyc/admin/${id}`;
        } else {
          url = `${baseURL}/api/admin/users/${id}`; // Editor ID
        }

        const res = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (type === "client") {
          setData(res.data.kyc);
        } else {
          setData(res.data.user);
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load KYC details");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [type, id]);

  // Handle Approve
  const handleApprove = async () => {
    if (!window.confirm("Are you sure you want to verify this user?")) return;

    try {
      setProcessing(true);
      const token = localStorage.getItem("adminToken");
      const baseURL = "http://localhost:5000";

      let url;
      if (type === "client") {
        url = `${baseURL}/api/client-kyc/admin/verify/${id}`;
      } else {
        url = `${baseURL}/api/profile/verify-kyc/${id}`;
      }

      const res = await axios.post(
        url,
        { approve: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        toast.success("KYC Verified Successfully");
        setData((prev) => ({ ...prev, status: "verified", kycStatus: "verified" }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to verify");
    } finally {
      setProcessing(false);
    }
  };

  // Handle Reject
  const handleReject = async () => {
    if (!rejectReason.trim()) return toast.error("Rejection reason is required");

    try {
      setProcessing(true);
      const token = localStorage.getItem("adminToken");
      const baseURL = "http://localhost:5000";

      let url;
      if (type === "client") {
        url = `${baseURL}/api/client-kyc/admin/verify/${id}`;
      } else {
        url = `${baseURL}/api/profile/verify-kyc/${id}`;
      }

      const res = await axios.post(
        url,
        { approve: false, rejectionReason: rejectReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        toast.info("KYC Rejected");
        setData((prev) => ({
          ...prev,
          status: "rejected",
          kycStatus: "rejected",
          rejectionReason: rejectReason,
        }));
        setShowRejectModal(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reject");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-zinc-400">
        <FaSpinner className="animate-spin text-4xl mb-4" />
        <p>Loading Details...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-zinc-400">
        <FaTimes className="text-4xl mb-4 text-red-500" />
        <p>Data not found</p>
        <button className="mt-4 text-blue-500 hover:underline" onClick={() => navigate(-1)}>
          Go Back
        </button>
      </div>
    );
  }

  // Normalize Data (Client vs Editor structure)
  const isClient = type === "client";
  const userObj = isClient ? data.user : data; // Editor data is the user object itself
  const kycStatus = isClient ? data.status : data.kycStatus;
  const bankDetails = isClient
    ? {
        accountHolderName: data.accountHolderName,
        accountNumber: data.bankAccountNumberMasked || data.bankAccountNumber,
        ifscCode: data.ifscCode,
        bankName: data.bankName,
        panNumber: data.panNumberMasked || data.panNumber,
        gstin: data.gstin,
        address: data.address,
      }
    : {
        accountHolderName: data.bankDetails?.accountHolderName,
        accountNumber: data.bankDetails?.accountNumber, // Might be encrypted/masked
        ifscCode: data.bankDetails?.ifscCode,
        bankName: data.bankDetails?.bankName,
        panNumber: data.bankDetails?.panNumber,
        gstin: data.bankDetails?.gstin,
        address: data.bankDetails?.address || {},
      };

  const documents = isClient ? data.documents : data.kycDocuments;
  const auditLogs = isClient ? data.logs : []; // Requires fetching audit logs for editors separately if not populated

  // Status Badge Helper
  const getStatusBadge = (status) => {
    switch (status) {
      case "verified":
        return <span className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-sm font-medium border border-emerald-500/20 flex items-center gap-2"><FaCheck /> Verified</span>;
      case "rejected":
        return <span className="bg-red-500/10 text-red-500 px-3 py-1 rounded-full text-sm font-medium border border-red-500/20 flex items-center gap-2"><FaTimes /> Rejected</span>;
      default:
        return <span className="bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full text-sm font-medium border border-amber-500/20 flex items-center gap-2"><FaSpinner className="animate-spin" /> Pending Review</span>;
    }
  };

  return (
    <div className="bg-zinc-950 min-h-screen text-zinc-100 pb-10">
      {/* Top Bar */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-6 py-4 sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition">
            <FaArrowLeft />
          </button>
          <div>
            <h1 className="text-lg font-semibold flex items-center gap-2">
              {isClient ? "Client" : "Editor"} KYC Application
              {getStatusBadge(kycStatus)}
            </h1>
            <p className="text-xs text-zinc-500">ID: {id}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {kycStatus !== "verified" && (
             <button 
                onClick={handleApprove} 
                disabled={processing}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition disabled:opacity-50"
             >
                {processing ? <FaSpinner className="animate-spin" /> : <FaCheck />} Verify & Approve
             </button>
          )}
          {kycStatus !== "rejected" && (
             <button 
                onClick={() => setShowRejectModal(true)} 
                disabled={processing}
                className="bg-red-600/20 hover:bg-red-600/40 text-red-500 border border-red-600/50 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition disabled:opacity-50"
             >
                <FaTimes /> Reject
             </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Profile & Data */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
           {/* Profile Card */}
           <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-lg">
             <div className="h-20 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-b border-zinc-800/50"></div>
             <div className="px-6 pb-6 relative">
                 <div className="absolute -top-10 left-6">
                    <img 
                      src={userObj?.profilePicture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} 
                      alt="Profile" 
                      className="w-20 h-20 rounded-xl border-4 border-zinc-900 object-cover shadow-md"
                    />
                 </div>
                 <div className="mt-12">
                   <h2 className="text-xl font-bold">{isClient ? data.fullName : userObj?.name}</h2>
                   <p className="text-zinc-500 text-sm flex items-center gap-2 mt-1">
                     <FaEnvelope className="text-zinc-600" /> {userObj?.email}
                   </p>
                   {isClient && (
                     <p className="text-zinc-500 text-sm flex items-center gap-2 mt-1">
                       <FaPhone className="text-zinc-600" /> {data.phone}
                     </p>
                   )}
                   <p className="text-zinc-500 text-sm flex items-center gap-2 mt-1">
                     <FaGlobe className="text-zinc-600" /> {userObj?.country || "IN"}
                   </p>
                 </div>

                 <div className="mt-6 pt-6 border-t border-zinc-800 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-zinc-500">Submitted</p>
                      <p className="font-mono text-sm">{new Date(isClient ? data.submittedAt : data.kycSubmittedAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Updated</p>
                      <p className="font-mono text-sm">{new Date(isClient ? data.updatedAt : data.updatedAt).toLocaleDateString()}</p>
                    </div>
                 </div>
             </div>
           </div>

           {/* Address Details (New) */}
           <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-lg">
              <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <FaMapMarkerAlt /> Address & Tax
              </h3>
              
              <div className="space-y-4">
                 <div className="group">
                   <p className="text-xs text-zinc-500 mb-1">Street Address</p>
                   <p className="text-zinc-200">{bankDetails?.address?.street || "N/A"}</p>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">City</p>
                      <p className="text-zinc-200">{bankDetails?.address?.city || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">State</p>
                      <p className="text-zinc-200">{bankDetails?.address?.state || "N/A"}</p>
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Postal Code</p>
                      <p className="text-zinc-200">{bankDetails?.address?.postalCode || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">GSTIN</p>
                      <p className="text-zinc-200 font-mono tracking-wide">{bankDetails?.gstin || "N/A"}</p>
                    </div>
                 </div>
              </div>
           </div>

           {/* Bank Details */}
           <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-lg">
              <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <FaUniversity /> Banking Details
              </h3>
              
              <div className="space-y-4">
                 <div>
                   <p className="text-xs text-zinc-500 mb-1">Account Holder</p>
                   <p className="text-zinc-200 font-medium">{bankDetails?.accountHolderName || "N/A"}</p>
                 </div>
                 <div>
                   <p className="text-xs text-zinc-500 mb-1">Bank Name</p>
                   <p className="text-zinc-200">{bankDetails?.bankName || "N/A"}</p>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Account Number</p>
                      <p className="text-zinc-200 font-mono">
                         {bankDetails?.accountNumber || "****"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">IFSC Code</p>
                      <p className="text-zinc-200 font-mono">{bankDetails?.ifscCode || "N/A"}</p>
                    </div>
                 </div>
                 <div>
                    <p className="text-xs text-zinc-500 mb-1">PAN Number</p>
                    <p className="text-zinc-200 font-mono tracking-wide bg-zinc-950 p-2 rounded border border-zinc-800 inline-block">
                      {bankDetails?.panNumber || "N/A"}
                    </p>
                 </div>
              </div>
           </div>
        </div>

        {/* RIGHT COLUMN: Documents & Actions */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
            
            {/* Documents Grid */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-lg">
               <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                  <FaFileAlt /> Submitted Documents
               </h3>

               {(!documents || documents.length === 0) ? (
                 <div className="text-center py-12 border-2 border-dashed border-zinc-800 rounded-xl text-zinc-500">
                    <FaFileAlt className="text-4xl mx-auto mb-2 opacity-50" />
                    <p>No documents uploaded</p>
                 </div>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {documents.map((doc, idx) => (
                       <div key={idx} className="group relative bg-zinc-950 border border-zinc-800 rounded-xl p-4 hover:border-blue-500/50 transition">
                          <div className="flex items-center justify-between mb-3">
                             <span className="text-sm font-medium text-zinc-300 capitalize bg-zinc-900 px-2 py-1 rounded">
                                {doc.type.replace('_', ' ')}
                             </span>
                             {doc.verified && <FaCheck className="text-emerald-500" />}
                          </div>
                          
                          <div 
                             className="aspect-video bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 relative cursor-pointer"
                             onClick={() => setPreviewDoc(doc.url)}
                          >
                             {doc.url.endsWith('.pdf') ? (
                                <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 group-hover:text-blue-400 transition">
                                   <FaFileAlt className="text-4xl mb-2" />
                                   <span className="text-xs">PDF Document</span>
                                </div>
                             ) : (
                                <img src={doc.url} alt={doc.type} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                             )}
                             
                             <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                                <span className="text-white text-sm font-medium flex items-center gap-2">
                                  <FaCloudDownloadAlt /> View / Download
                                </span>
                             </div>
                          </div>
                          
                          <div className="mt-3 flex justify-between items-center">
                             <span className="text-xs text-zinc-500">{new Date(doc.uploadedAt).toLocaleString()}</span>
                             <a href={doc.url} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:text-blue-400">Open Original</a>
                          </div>
                       </div>
                    ))}
                 </div>
               )}
            </div>

            {/* Audit Log (Optional/Future) */}
            {auditLogs && auditLogs.length > 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-lg">
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                   <FaHistory /> Audit Log
                </h3>
                <div className="space-y-4 border-l-2 border-zinc-800 ml-2 pl-6">
                   {/* Map logs here if available */}
                   <p className="text-sm text-zinc-500 italic">Audit logs available in future update</p>
                </div>
              </div>
            )}
        </div>

      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-md p-6 shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-4">Reject Application</h3>
              <p className="text-zinc-400 mb-4 text-sm">Please provide a reason for rejection. This will be sent to the user.</p>
              
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reason for rejection (e.g., Unclear ID proof, Mismatched name)"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white mb-4 h-32 focus:border-red-500 outline-none resize-none"
              />
              
              <div className="flex justify-end gap-3">
                 <button 
                   onClick={() => setShowRejectModal(false)}
                   className="px-4 py-2 text-zinc-400 hover:text-white transition"
                 >
                   Cancel
                 </button>
                 <button 
                   onClick={handleReject}
                   disabled={!rejectReason.trim() || processing}
                   className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
                 >
                   {processing ? "Rejecting..." : "Confirm Rejection"}
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Image Preview Modal (Lightbox) */}
      {previewDoc && (
         <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 backdrop-blur-md" onClick={() => setPreviewDoc(null)}>
            <button className="absolute top-4 right-4 text-zinc-400 hover:text-white text-2xl p-2 z-50">
               <FaTimes />
            </button>
            <div className="relative max-w-6xl max-h-[95vh] w-full flex flex-col items-center justify-center bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800" onClick={(e) => e.stopPropagation()}>
               <div className="w-full h-12 bg-zinc-950 flex items-center justify-between px-4 border-b border-zinc-800">
                  <span className="text-zinc-400 text-sm font-medium">Document Preview</span>
                  <a href={previewDoc} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-400 text-sm flex items-center gap-2">
                     <FaCloudDownloadAlt /> Open External
                  </a>
               </div>
               
               <div className="w-full flex-1 bg-zinc-900 flex items-center justify-center relative">
                   {/* Loader behind content */}
                   <div className="absolute inset-0 flex items-center justify-center z-0">
                       <FaSpinner className="animate-spin text-zinc-700 text-3xl" />
                   </div>

                   {previewDoc.endsWith('.pdf') ? (
                      <iframe 
                          src={previewDoc}
                          className="w-full h-[80vh] z-10"
                          title="PDF Preview"
                      />
                   ) : (
                      <img src={previewDoc} alt="Preview" className="max-w-full max-h-[85vh] z-10" />
                   )}
               </div>
            </div>
         </div>
      )}

    </div>
  );
};

export default KYCRequestDetail;
