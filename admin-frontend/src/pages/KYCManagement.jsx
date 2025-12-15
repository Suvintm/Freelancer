// KYCManagement.jsx - Admin KYC verification page
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaShieldAlt,
  FaSearch,
  FaCheck,
  FaTimes,
  FaSpinner,
  FaUser,
  FaUniversity,
  FaIdCard,
  FaEye,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { useAdmin } from "../context/AdminContext";
import { toast } from "react-toastify";

const KYCManagement = () => {
  const { adminAxios } = useAdmin();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ pending: 0, verified: 0, rejected: 0 });
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [statusFilter, setStatusFilter] = useState("submitted");
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Fetch KYC stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await adminAxios.get("/admin/kyc/stats/summary");
      if (res.data.success) {
        setStats(res.data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  }, [adminAxios]);

  // Fetch KYC submissions
  const fetchKYC = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAxios.get("/admin/kyc/pending", {
        params: { status: statusFilter, page: pagination.page, limit: 20 }
      });
      if (res.data.success) {
        setUsers(res.data.users);
        setPagination(res.data.pagination);
      }
    } catch (error) {
      toast.error("Failed to load KYC submissions");
    } finally {
      setLoading(false);
    }
  }, [adminAxios, statusFilter, pagination.page]);

  useEffect(() => {
    fetchStats();
    fetchKYC();
  }, [fetchStats, fetchKYC]);

  // View user details
  const viewDetails = async (userId) => {
    setDetailsLoading(true);
    try {
      const res = await adminAxios.get(`/admin/kyc/${userId}`);
      if (res.data.success) {
        setSelectedUser(res.data);
      }
    } catch (error) {
      toast.error("Failed to load user details");
    } finally {
      setDetailsLoading(false);
    }
  };

  // Approve KYC
  const approveKYC = async (userId) => {
    setActionLoading(true);
    try {
      const res = await adminAxios.post(`/admin/kyc/${userId}/verify`, { action: "approve" });
      if (res.data.success) {
        toast.success("KYC approved successfully!");
        setSelectedUser(null);
        fetchKYC();
        fetchStats();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to approve KYC");
    } finally {
      setActionLoading(false);
    }
  };

  // Reject KYC
  const rejectKYC = async () => {
    if (!rejectReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    setActionLoading(true);
    try {
      const res = await adminAxios.post(`/admin/kyc/${selectedUser.user._id}/verify`, {
        action: "reject",
        rejectionReason: rejectReason,
      });
      if (res.data.success) {
        toast.success("KYC rejected");
        setSelectedUser(null);
        setShowRejectModal(false);
        setRejectReason("");
        fetchKYC();
        fetchStats();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reject KYC");
    } finally {
      setActionLoading(false);
    }
  };

  // Filter users by search
  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(search.toLowerCase()) ||
    user.email?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status) => {
    switch (status) {
      case "verified":
        return <span className="px-2 py-1 text-xs font-semibold bg-emerald-500/20 text-emerald-400 rounded-full">Verified</span>;
      case "submitted":
      case "pending":
        return <span className="px-2 py-1 text-xs font-semibold bg-amber-500/20 text-amber-400 rounded-full">Pending</span>;
      case "rejected":
        return <span className="px-2 py-1 text-xs font-semibold bg-red-500/20 text-red-400 rounded-full">Rejected</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold bg-zinc-500/20 text-zinc-400 rounded-full">Not Submitted</span>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <FaShieldAlt className="text-blue-500" />
          KYC Verification
        </h1>
        <p className="text-zinc-400 text-sm mt-1">Verify editor bank accounts and identity</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <FaClock className="text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.pending}</p>
              <p className="text-xs text-zinc-400">Pending Review</p>
            </div>
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <FaCheckCircle className="text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.verified}</p>
              <p className="text-xs text-zinc-400">Verified</p>
            </div>
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <FaTimesCircle className="text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.rejected}</p>
              <p className="text-xs text-zinc-400">Rejected</p>
            </div>
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-zinc-500/10 flex items-center justify-center">
              <FaUser className="text-zinc-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.notSubmitted}</p>
              <p className="text-xs text-zinc-400">Not Submitted</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        {/* Status Tabs */}
        <div className="flex gap-2">
          {[
            { value: "submitted", label: "Pending", count: stats.pending },
            { value: "verified", label: "Verified", count: stats.verified },
            { value: "rejected", label: "Rejected", count: stats.rejected },
            { value: "all", label: "All", count: stats.pending + stats.verified + stats.rejected },
          ].map(tab => (
            <button
              key={tab.value}
              onClick={() => { setStatusFilter(tab.value); setPagination(p => ({ ...p, page: 1 })); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                statusFilter === tab.value
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex-1 relative">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left text-xs font-medium text-zinc-400 uppercase px-4 py-3">Editor</th>
              <th className="text-left text-xs font-medium text-zinc-400 uppercase px-4 py-3 hidden md:table-cell">Bank Details</th>
              <th className="text-left text-xs font-medium text-zinc-400 uppercase px-4 py-3">Status</th>
              <th className="text-left text-xs font-medium text-zinc-400 uppercase px-4 py-3 hidden md:table-cell">Submitted</th>
              <th className="text-center text-xs font-medium text-zinc-400 uppercase px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-zinc-800/50 animate-pulse">
                  <td className="px-4 py-4"><div className="h-4 bg-zinc-800 rounded w-32" /></td>
                  <td className="px-4 py-4 hidden md:table-cell"><div className="h-4 bg-zinc-800 rounded w-40" /></td>
                  <td className="px-4 py-4"><div className="h-4 bg-zinc-800 rounded w-20" /></td>
                  <td className="px-4 py-4 hidden md:table-cell"><div className="h-4 bg-zinc-800 rounded w-24" /></td>
                  <td className="px-4 py-4"><div className="h-8 bg-zinc-800 rounded w-20 mx-auto" /></td>
                </tr>
              ))
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-zinc-500">
                  No KYC submissions found
                </td>
              </tr>
            ) : (
              filteredUsers.map(user => (
                <tr key={user._id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={user.profilePicture || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"}
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <p className="text-white font-medium text-sm">{user.name}</p>
                        <p className="text-zinc-500 text-xs">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div>
                      <p className="text-zinc-300 text-sm">{user.bankDetails?.accountHolderName || "-"}</p>
                      <p className="text-zinc-500 text-xs">{user.bankDetails?.bankName} • {user.bankDetails?.ifscCode}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {getStatusBadge(user.kycStatus)}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <p className="text-zinc-400 text-sm">
                      {user.kycSubmittedAt ? new Date(user.kycSubmittedAt).toLocaleDateString() : "-"}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => viewDetails(user._id)}
                        className="p-2 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-all"
                        title="View Details"
                      >
                        <FaEye />
                      </button>
                      {user.kycStatus === "submitted" && (
                        <>
                          <button
                            onClick={() => approveKYC(user._id)}
                            className="p-2 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 transition-all"
                            title="Approve"
                          >
                            <FaCheck />
                          </button>
                          <button
                            onClick={() => { viewDetails(user._id); setShowRejectModal(true); }}
                            className="p-2 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-all"
                            title="Reject"
                          >
                            <FaTimes />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800">
            <p className="text-sm text-zinc-400">
              Page {pagination.page} of {pagination.pages} ({pagination.total} total)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                disabled={pagination.page === 1}
                className="p-2 rounded-lg bg-zinc-800 text-zinc-400 disabled:opacity-50 hover:bg-zinc-700"
              >
                <FaChevronLeft />
              </button>
              <button
                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                disabled={pagination.page === pagination.pages}
                className="p-2 rounded-lg bg-zinc-800 text-zinc-400 disabled:opacity-50 hover:bg-zinc-700"
              >
                <FaChevronRight />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {selectedUser && !showRejectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedUser(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {detailsLoading ? (
                <div className="p-8 flex items-center justify-center">
                  <FaSpinner className="animate-spin text-2xl text-blue-500" />
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="p-5 border-b border-zinc-800 flex items-center gap-4">
                    <img
                      src={selectedUser.user.profilePicture || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"}
                      alt={selectedUser.user.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white">{selectedUser.user.name}</h3>
                      <p className="text-zinc-400 text-sm">{selectedUser.user.email}</p>
                      {getStatusBadge(selectedUser.user.kycStatus)}
                    </div>
                    <button onClick={() => setSelectedUser(null)} className="text-zinc-500 hover:text-white">
                      <FaTimes />
                    </button>
                  </div>

                  {/* Bank Details */}
                  <div className="p-5 space-y-4">
                    <h4 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                      <FaUniversity className="text-blue-400" /> Bank Details
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { label: "Account Holder", value: selectedUser.user.bankDetails?.accountHolderName },
                        { label: "Bank Name", value: selectedUser.user.bankDetails?.bankName },
                        { label: "Account Number", value: selectedUser.user.bankDetails?.accountNumber },
                        { label: "IFSC Code", value: selectedUser.user.bankDetails?.ifscCode },
                        { label: "PAN Number", value: selectedUser.user.bankDetails?.panNumber },
                      ].map((item, idx) => (
                        <div key={idx} className="bg-zinc-800 rounded-lg p-3">
                          <p className="text-[10px] text-zinc-500 uppercase tracking-wide">{item.label}</p>
                          <p className="text-white text-sm font-medium">{item.value || "-"}</p>
                        </div>
                      ))}
                    </div>

                    {selectedUser.user.kycRejectionReason && (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                        <p className="text-red-400 text-sm">
                          <strong>Rejection Reason:</strong> {selectedUser.user.kycRejectionReason}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {selectedUser.user.kycStatus === "submitted" && (
                    <div className="p-5 border-t border-zinc-800 flex gap-3">
                      <button
                        onClick={() => { setShowRejectModal(true); }}
                        className="flex-1 py-2.5 bg-red-600/20 text-red-400 rounded-lg font-medium hover:bg-red-600/30 transition-all"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => approveKYC(selectedUser.user._id)}
                        disabled={actionLoading}
                        className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {actionLoading ? <FaSpinner className="animate-spin" /> : <FaCheck />}
                        Approve KYC
                      </button>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reject Modal */}
      <AnimatePresence>
        {showRejectModal && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={() => { setShowRejectModal(false); setRejectReason(""); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b border-zinc-800">
                <h3 className="text-lg font-bold text-white">Reject KYC</h3>
                <p className="text-zinc-400 text-sm">Provide a reason for rejection</p>
              </div>
              <div className="p-5">
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g., Bank details do not match the provided name..."
                  rows={4}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white placeholder:text-zinc-500 outline-none focus:border-red-500"
                />
              </div>
              <div className="p-5 border-t border-zinc-800 flex gap-3">
                <button
                  onClick={() => { setShowRejectModal(false); setRejectReason(""); }}
                  className="flex-1 py-2.5 bg-zinc-800 text-zinc-400 rounded-lg font-medium hover:bg-zinc-700"
                >
                  Cancel
                </button>
                <button
                  onClick={rejectKYC}
                  disabled={actionLoading || !rejectReason.trim()}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading ? <FaSpinner className="animate-spin" /> : <FaTimes />}
                  Reject KYC
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default KYCManagement;
