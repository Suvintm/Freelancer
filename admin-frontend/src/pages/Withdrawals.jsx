import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  HiOutlineBanknotes, 
  HiOutlineClock, 
  HiOutlineCheckCircle, 
  HiOutlineXCircle,
  HiOutlineMagnifyingGlass,
  HiOutlineFunnel,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineExclamationCircle
} from "react-icons/hi2";
import { withdrawalsApi } from "../api/adminApi";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

// Components
import SlideOver from "../components/ui/SlideOver";
// Local Loader Component
const Loader = () => (
  <div className="flex flex-col items-center justify-center gap-3">
    <div className="w-10 h-10 border-4 border-brand/20 border-t-brand rounded-full animate-spin" />
    <span className="text-xs font-bold text-muted uppercase tracking-widest animate-pulse">
      Syncing Ledger...
    </span>
  </div>
);

const Withdrawals = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Queries
  const { data, isLoading, error } = useQuery({
    queryKey: ["withdrawals", { page, status, search }],
    queryFn: () => withdrawalsApi.getAll({ page, status, search }),
    keepPreviousData: true,
  });

  const { data: statsData } = useQuery({
    queryKey: ["withdrawal-stats"],
    queryFn: () => withdrawalsApi.getStats(),
  });

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, failureReason, adminNote }) => 
      withdrawalsApi.updateStatus(id, { status, failureReason, adminNote }),
    onSuccess: (data) => {
      toast.success(data.message || "Status updated successfully");
      queryClient.invalidateQueries(["withdrawals"]);
      queryClient.invalidateQueries(["withdrawal-stats"]);
      setSelectedWithdrawal(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to update status");
    },
  });

  const handleUpdateStatus = (id, newStatus) => {
    if (newStatus === "failed") {
      const reason = prompt("Enter rejection/failure reason:");
      if (!reason) return;
      updateStatusMutation.mutate({ id, status: newStatus, failureReason: reason });
    } else {
      if (!confirm(`Are you sure you want to mark this as ${newStatus}?`)) return;
      updateStatusMutation.mutate({ id, status: newStatus });
    }
  };

  const statusColors = {
    pending: { bg: "#fffbeb", text: "#b45309", dark_bg: "#451a03", dark_text: "#fcd34d", icon: HiOutlineClock },
    processing: { bg: "#eff6ff", text: "#2563eb", dark_bg: "#172554", dark_text: "#93c5fd", icon: HiOutlineArrowTopRightOnSquare },
    completed: { bg: "#f0fdf4", text: "#166534", dark_bg: "#052e16", dark_text: "#86efac", icon: HiOutlineCheckCircle },
    failed: { bg: "#fef2f2", text: "#991b1b", dark_bg: "#450a0a", dark_text: "#fca5a5", icon: HiOutlineXCircle },
    cancelled: { bg: "#f9fafb", text: "#4b5563", dark_bg: "#1f2937", dark_text: "#d1d5db", icon: HiOutlineXCircle },
  };

  const stats = [
    { label: "Pending", value: statsData?.stats?.pending?.count || 0, amount: statsData?.stats?.pending?.amount || 0, icon: HiOutlineClock, color: "#f59e0b" },
    { label: "Processing", value: statsData?.stats?.processing?.count || 0, amount: statsData?.stats?.processing?.amount || 0, icon: HiOutlineArrowTopRightOnSquare, color: "#3b82f6" },
    { label: "Completed", value: statsData?.stats?.completed?.count || 0, amount: statsData?.stats?.completed?.amount || 0, icon: HiOutlineCheckCircle, color: "#10b981" },
    { label: "Failed", value: statsData?.stats?.failed?.count || 0, amount: statsData?.stats?.failed?.amount || 0, icon: HiOutlineXCircle, color: "#ef4444" },
  ];

  if (error) return <div className="p-8 text-red-500">Error loading withdrawals</div>;

  return (
    <div style={{ padding: "1.5rem", maxWidth: 1400, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
          Payout Management
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
          Review and process editor withdrawal requests.
        </p>
      </div>

      {/* Stats Grid */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", 
        gap: "1rem", 
        marginBottom: "2rem" 
      }}>
        {stats.map((stat, idx) => (
          <div key={idx} style={{
            background: "var(--bg-elevated)",
            padding: "1.25rem",
            borderRadius: 12,
            border: "1px solid var(--border-default)",
            display: "flex",
            alignItems: "center",
            gap: "1rem"
          }}>
            <div style={{ 
              width: 48, height: 48, borderRadius: 10, 
              background: `${stat.color}15`, 
              display: "flex", alignItems: "center", justifyContent: "center", 
              color: stat.color 
            }}>
              <stat.icon size={24} />
            </div>
            <div>
              <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.025em" }}>
                {stat.label}
              </p>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)" }}>
                {stat.value}
              </h3>
              <p style={{ fontSize: "0.875rem", color: stat.color, fontWeight: 600 }}>
                ₹{stat.amount.toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Table Section */}
      <div style={{
        background: "var(--bg-elevated)",
        borderRadius: 12,
        border: "1px solid var(--border-default)",
        overflow: "hidden"
      }}>
        {/* Toolbar */}
        <div style={{ 
          padding: "1rem", 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          borderBottom: "1px solid var(--border-default)",
          gap: "1rem",
          flexWrap: "wrap"
        }}>
          <div style={{ display: "flex", gap: "0.5rem", flex: 1, maxWidth: 400 }}>
            <div style={{ position: "relative", flex: 1 }}>
              <HiOutlineMagnifyingGlass 
                style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} 
              />
              <input 
                type="text"
                placeholder="Search editor name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.5rem 0.75rem 0.5rem 2.25rem",
                  borderRadius: 8,
                  background: "var(--bg-main)",
                  border: "1px solid var(--border-default)",
                  fontSize: "0.875rem",
                  color: "var(--text-primary)"
                }}
              />
            </div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{
                padding: "0.5rem 0.75rem",
                borderRadius: 8,
                background: "var(--bg-main)",
                border: "1px solid var(--border-default)",
                fontSize: "0.875rem",
                color: "var(--text-primary)"
              }}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-default)", background: "var(--bg-main)" }}>
                <th style={{ padding: "1rem", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase" }}>Editor</th>
                <th style={{ padding: "1rem", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase" }}>Amount</th>
                <th style={{ padding: "1rem", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase" }}>Requested</th>
                <th style={{ padding: "1rem", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase" }}>Status</th>
                <th style={{ padding: "1rem", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {isLoading ? (
                  <tr>
                    <td colSpan="5" style={{ padding: "4rem", textAlign: "center" }}>
                      <Loader />
                    </td>
                  </tr>
                ) : data?.withdrawals?.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: "4rem", textAlign: "center", color: "var(--text-secondary)" }}>
                      No withdrawal requests found.
                    </td>
                  </tr>
                ) : (
                  data?.withdrawals?.map((w) => (
                    <motion.tr
                      key={w._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      style={{ borderBottom: "1px solid var(--border-default)", cursor: "pointer" }}
                      onClick={() => setSelectedWithdrawal(w)}
                      onMouseEnter={e => e.currentTarget.style.background = "var(--bg-main)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <td style={{ padding: "1rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <img 
                            src={w.editor?.profilePicture || "https://ui-avatars.com/api/?name=" + w.editor?.name} 
                            alt={w.editor?.name}
                            style={{ width: 32, height: 32, borderRadius: "50%", background: "#f3f4f6" }}
                          />
                          <div>
                            <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)" }}>{w.editor?.name}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{w.editor?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "1rem" }}>
                        <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text-primary)" }}>₹{w.amount.toLocaleString()}</div>
                      </td>
                      <td style={{ padding: "1rem", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                        {new Date(w.requestedAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: "1rem" }}>
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.375rem",
                          padding: "0.25rem 0.625rem",
                          borderRadius: 20,
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          background: statusColors[w.status]?.bg,
                          color: statusColors[w.status]?.text
                        }}>
                          {React.createElement(statusColors[w.status]?.icon, { size: 12 })}
                          {w.status.charAt(0).toUpperCase() + w.status.slice(1)}
                        </span>
                      </td>
                      <td style={{ padding: "1rem" }}>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setSelectedWithdrawal(w); }}
                          style={{
                            padding: "6px 12px",
                            borderRadius: 6,
                            border: "1px solid var(--border-default)",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            color: "var(--text-primary)",
                            background: "transparent",
                            cursor: "pointer"
                          }}
                        >
                          Details
                        </button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Pagination placeholder */}
        <div style={{ padding: "1rem", borderTop: "1px solid var(--border-default)", display: "flex", justifyContent: "flex-end" }}>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button 
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid var(--border-default)", opacity: page === 1 ? 0.5 : 1 }}
            >
              Prev
            </button>
            <button 
              disabled={page >= (data?.pagination?.pages || 1)}
              onClick={() => setPage(p => p + 1)}
              style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid var(--border-default)", opacity: page >= (data?.pagination?.pages || 1) ? 0.5 : 1 }}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Detail SlideOver */}
      <SlideOver
        isOpen={!!selectedWithdrawal}
        onClose={() => setSelectedWithdrawal(null)}
        title="Withdrawal Details"
      >
        {selectedWithdrawal && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Summary Card */}
            <div style={{ background: "var(--bg-main)", padding: "1rem", borderRadius: 12, border: "1px solid var(--border-default)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Status</span>
                <span style={{
                  padding: "0.25rem 0.75rem",
                  borderRadius: 20,
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  background: statusColors[selectedWithdrawal.status]?.bg,
                  color: statusColors[selectedWithdrawal.status]?.text
                }}>
                  {selectedWithdrawal.status.toUpperCase()}
                </span>
              </div>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text-primary)", textAlign: "center" }}>
                ₹{selectedWithdrawal.amount.toLocaleString()}
              </div>
              <p style={{ textAlign: "center", fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                Request ID: {selectedWithdrawal._id}
              </p>
            </div>

            {/* Editor Info */}
            <section>
              <h3 style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: "0.75rem" }}>Editor Info</h3>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", background: "var(--bg-main)", padding: "1rem", borderRadius: 12 }}>
                <img src={selectedWithdrawal.editor?.profilePicture} alt="" style={{ width: 44, height: 44, borderRadius: "50%" }} />
                <div>
                  <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{selectedWithdrawal.editor?.name}</div>
                  <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>{selectedWithdrawal.editor?.email}</div>
                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.25rem" }}>
                    <span style={{ fontSize: "0.75rem", color: "#10b981", fontWeight: 600 }}>Wallet: ₹{selectedWithdrawal.editor?.walletBalance || 0}</span>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>•</span>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>KYC: {selectedWithdrawal.editor?.kycStatus}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Bank Snapshot */}
            <section>
              <h3 style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: "0.75rem" }}>Payout Bank Details</h3>
              <div style={{ background: "var(--bg-main)", padding: "1rem", borderRadius: 12, display: "grid", gap: "0.75rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Account Holder</span>
                  <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>{selectedWithdrawal.bankSnapshot?.accountHolderName}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Bank Name</span>
                  <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>{selectedWithdrawal.bankSnapshot?.bankName}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Account Number</span>
                  <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>****{selectedWithdrawal.bankSnapshot?.accountNumberMasked}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>IFSC Code</span>
                  <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>{selectedWithdrawal.bankSnapshot?.ifscCode}</span>
                </div>
              </div>
            </section>

            {/* Timings */}
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontStyle: "italic" }}>
              Requested on {new Date(selectedWithdrawal.requestedAt).toLocaleString()}
              {selectedWithdrawal.processedAt && ` • Processed on ${new Date(selectedWithdrawal.processedAt).toLocaleString()}`}
            </div>

            {/* Action Buttons */}
            {selectedWithdrawal.status === "pending" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
                <button
                  onClick={() => handleUpdateStatus(selectedWithdrawal._id, "failed")}
                  style={{
                    padding: "0.75rem",
                    borderRadius: 10,
                    border: "1px solid #ef4444",
                    color: "#ef4444",
                    background: "transparent",
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  Reject & Refund
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedWithdrawal._id, "completed")}
                  style={{
                    padding: "0.75rem",
                    borderRadius: 10,
                    background: "#10b981",
                    color: "#fff",
                    border: "none",
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  Mark as Paid
                </button>
              </div>
            )}
            
            {selectedWithdrawal.status === "processing" && (
              <button
                onClick={() => handleUpdateStatus(selectedWithdrawal._id, "completed")}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: 10,
                  background: "#10b981",
                  color: "#fff",
                  border: "none",
                  fontWeight: 700,
                  cursor: "pointer",
                  marginTop: "1rem"
                }}
              >
                Confirm Payout Success
              </button>
            )}

            {selectedWithdrawal.failureReason && (
              <div style={{ background: "#fef2f2", padding: "1rem", borderRadius: 12, border: "1px solid #fca5a5", display: "flex", gap: "0.75rem" }}>
                <HiOutlineExclamationCircle size={18} style={{ color: "#ef4444", flexShrink: 0 }} />
                <div style={{ color: "#991b1b", fontSize: "0.875rem" }}>
                  <div style={{ fontWeight: 700, marginBottom: "0.25rem" }}>Rejection Reason</div>
                  {selectedWithdrawal.failureReason}
                </div>
              </div>
            )}
          </div>
        )}
      </SlideOver>
    </div>
  );
};

export default Withdrawals;
