import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  HiOutlineShieldCheck, HiOutlineUserGroup, HiOutlineClock, 
  HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineMagnifyingGlass,
  HiOutlineEye, HiOutlineCheck, HiOutlineXMark,
  HiOutlineBanknotes, HiOutlineIdentification,
  HiOutlineArrowTopRightOnSquare, HiOutlineArrowPath,
  HiOutlineFingerPrint, HiOutlineDocumentCheck
} from "react-icons/hi2";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { kycApi } from "../api/adminApi";
import DataTable from "../components/ui/DataTable";
import SlideOver from "../components/ui/SlideOver";
import Skeleton from "../components/ui/Skeleton";
import { formatDate } from "../utils/formatters";

// ─────────────────────────────────────────────────────────────────────────────
// Atoms
// ─────────────────────────────────────────────────────────────────────────────

const UserAvatar = ({ src, name, size = 32 }) => {
  const [err, setErr] = useState(false);
  const initials = (name || "??").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const palette  = ["#6d28d9", "#1d4ed8", "#0369a1", "#15803d", "#b45309", "#c2410c"];
  const bg       = palette[(name || "").charCodeAt(0) % palette.length];
  
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      {!err && src ? (
        <img src={src} alt={name} onError={() => setErr(true)} style={{
          width: "100%", height: "100%", borderRadius: 10, objectFit: "cover",
          border: "1.5px solid var(--border-subtle)",
        }} />
      ) : (
        <div style={{
          width: "100%", height: "100%", borderRadius: 10, background: bg, color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: size * 0.38, fontWeight: 700, border: "1.5px solid var(--border-subtle)",
        }}>{initials}</div>
      )}
    </div>
  );
};

const StatusBadge = ({ status, submittedAt }) => {
  const isOverdue = status === "submitted" && submittedAt && (new Date() - new Date(submittedAt) > 24 * 60 * 60 * 1000);
  
  const cfg = {
    verified:     { label: "Verified",  color: "#15803d", bg: "rgba(21,128,61,0.1)",  border: "rgba(21,128,61,0.2)" },
    submitted:    { label: "Pending",   color: "#b45309", bg: "rgba(180,83,9,0.1)",   border: "rgba(180,83,9,0.2)" },
    pending:      { label: "Pending",   color: "#b45309", bg: "rgba(180,83,9,0.1)",   border: "rgba(180,83,9,0.2)" },
    under_review: { label: "Review",    color: "#0369a1", bg: "rgba(3,105,161,0.1)",  border: "rgba(3,105,161,0.2)" },
    rejected:     { label: "Rejected",  color: "#b91c1c", bg: "rgba(185,28,28,0.1)",  border: "rgba(185,28,28,0.2)" },
  }[status] || { label: status, color: "#4b5563", bg: "#f3f4f6", border: "#e5e7eb" };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        padding: "2px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700,
        background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
        textTransform: "uppercase", letterSpacing: "0.02em"
      }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.color }} />
        {cfg.label}
      </span>
      {isOverdue && (
        <span style={{
          padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 800,
          background: "rgba(185,28,28,0.1)", color: "#b91c1c", border: "1px solid rgba(185,28,28,0.2)",
          display: "flex", alignItems: "center", gap: 4
        }}>
          <HiOutlineClock size={12} /> SLA: OVERDUE
        </span>
      )}
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, color, loading }) => (
  <div className="card" style={{
    flex: 1, minWidth: 200, padding: "18px 24px",
    display: "flex", alignItems: "center", gap: 16,
    border: "1px solid var(--border-subtle)",
    background: "var(--bg-surface)",
  }}>
    <div style={{
      width: 44, height: 44, borderRadius: 12, flexShrink: 0,
      background: `${color}12`, color: color,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 20
    }}>
      <Icon />
    </div>
    {loading ? (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div className="skeleton" style={{ height: 24, width: 40 }} />
        <div className="skeleton" style={{ height: 12, width: 60 }} />
      </div>
    ) : (
      <div>
        <div style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.1 }}>
          {(value || 0).toLocaleString()}
        </div>
        <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4, fontWeight: 500 }}>
          {label}
        </div>
      </div>
    )}
  </div>
);

const KYCManagement = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("editors"); // "editors" | "clients"
  const [params, setParams] = useState({ page: 1, limit: 12, status: "submitted" });
  const [selectedId, setSelectedId] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  // ── Queries ──────────────────────────────────────────────────────────────

  const editorStatsQuery = useQuery({
    queryKey: ["kyc", "stats", "editors"],
    queryFn: kycApi.getEditorStats,
    enabled: activeTab === "editors"
  });

  const clientStatsQuery = useQuery({
    queryKey: ["kyc", "stats", "clients"],
    queryFn: kycApi.getClientStats,
    enabled: activeTab === "clients"
  });

  const requestsQuery = useQuery({
    queryKey: ["kyc", "requests", activeTab, params],
    queryFn: () => activeTab === "editors" 
      ? kycApi.getEditorRequests(params) 
      : kycApi.getClientRequests(params),
    keepPreviousData: true
  });

  const detailQuery = useQuery({
    queryKey: ["kyc", "detail", activeTab, selectedId],
    queryFn: () => activeTab === "editors"
      ? kycApi.getEditorById(selectedId)
      : kycApi.getClientById(selectedId),
    enabled: !!selectedId && isDetailOpen
  });

  // ── Mutations ────────────────────────────────────────────────────────────

  const verifyMutation = useMutation({
    mutationFn: ({ id, data }) => activeTab === "editors"
      ? kycApi.verifyEditor(id, data)
      : kycApi.verifyClient(id, data),
    onSuccess: (res) => {
      toast.success(res.data.message || "Action successful");
      queryClient.invalidateQueries(["kyc"]);
      setIsDetailOpen(false);
      setIsRejecting(false);
      setRejectionReason("");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Action failed");
    }
  });

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleAction = (action, reason = "") => {
    if (!selectedId) return;
    const data = activeTab === "editors" 
      ? { action, rejectionReason: reason } 
      : { status: action === "approve" ? "verified" : "rejected", rejectionReason: reason };
    verifyMutation.mutate({ id: selectedId, data });
  };

  const openDetails = (id) => {
    setSelectedId(id);
    setIsDetailOpen(true);
  };

  // ── Columns ──────────────────────────────────────────────────────────────

  const columns = useMemo(() => [
    {
      header: activeTab === "editors" ? "Editor" : "Client",
      accessorKey: activeTab === "editors" ? "name" : "user",
      cell: (row, cellValue) => {
        const user = activeTab === "editors" ? row : cellValue;
        const name = activeTab === "editors" ? user?.name : row?.fullName || user?.name;
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <UserAvatar src={user?.profilePicture} name={name} />
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontWeight: 700, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {name}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user?.email}
              </div>
            </div>
          </div>
        );
      }
    },
    {
      header: "Submitted",
      cell: (row, date) => (
        <div style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--text-secondary)", fontSize: 13 }}>
          <HiOutlineClock size={14} />
          {date ? formatDate(date) : "N/A"}
        </div>
      )
    },
    {
      header: "KYC Status",
      accessorKey: activeTab === "editors" ? "kycStatus" : "status",
      cell: (row, status) => (
        <StatusBadge 
          status={status} 
          submittedAt={activeTab === "editors" ? row.kycSubmittedAt : row.submittedAt} 
        />
      )
    },
    {
      header: "Bank Proof",
      accessorKey: activeTab === "editors" ? "bankDetails" : "bankName",
      cell: (row, bank) => (
        <div style={{ fontSize: 12, color: "var(--text-secondary)", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis" }}>
          {activeTab === "editors" ? bank?.bankName : bank || "—"}
        </div>
      )
    },
    {
      id: "actions",
      header: "",
      align: "right",
      cell: (row) => (
        <button 
          onClick={() => openDetails(row._id)}
          style={{
            padding: "6px 14px", borderRadius: 8, background: "var(--bg-elevated)",
            border: "1px solid var(--border-subtle)", color: "var(--text-primary)",
            fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
            transition: "all var(--transition)"
          }}
          onMouseOver={(e) => { e.currentTarget.style.borderColor = "var(--brand)"; e.currentTarget.style.color = "var(--brand)"; }}
          onMouseOut={(e) => { e.currentTarget.style.borderColor = "var(--border-subtle)"; e.currentTarget.style.color = "var(--text-primary)"; }}
        >
          <HiOutlineEye size={14} /> View Details
        </button>
      )
    }
  ], [activeTab]);

  const stats = activeTab === "editors" ? editorStatsQuery.data?.data?.stats : clientStatsQuery.data?.data?.stats;
  const isStatsLoading = activeTab === "editors" ? editorStatsQuery.isLoading : clientStatsQuery.isLoading;

  return (
    <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 24, background: "var(--bg-page)", minHeight: "100vh" }}>
      
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.03em", margin: 0 }}>
            KYC Management
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 4 }}>
            Review and verify user identity & banking records.
          </p>
        </div>
        <button 
          onClick={() => queryClient.invalidateQueries(["kyc"])}
          style={{
            display: "flex", alignItems: "center", gap: 8, padding: "8px 16px",
            background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)",
            borderRadius: 10, color: "var(--text-secondary)", fontSize: 13, fontWeight: 600, cursor: "pointer"
          }}
        >
          <HiOutlineArrowPath size={16} /> Refresh
        </button>
      </div>

      {/* Tabs Layout */}
      <div style={{ display: "flex", gap: 8, padding: 4, background: "var(--bg-card)", borderRadius: 12, width: "fit-content", border: "1px solid var(--border-subtle)" }}>
        {[["editors", "Editor Verifications", HiOutlineFingerPrint], ["clients", "Client Verifications", HiOutlineShieldCheck]].map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => { setActiveTab(id); setParams({ ...params, page: 1 }); }}
            style={{
              display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 10,
              fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", transition: "all 0.2s",
              background: activeTab === id ? "var(--text-primary)" : "transparent",
              color: activeTab === id ? "var(--bg-page)" : "var(--text-secondary)",
            }}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {/* Stats Overview */}
      <div style={{ display: "flex", gap: 16, marginBottom: 28, flexWrap: "wrap", alignItems: "stretch" }}>
        {(activeTab === "editors" ? [
          { label: "Pending Reviews", value: editorStatsQuery.data?.data?.pendingCount, icon: HiOutlineClock, color: "#b45309" },
          { label: "Verified Partners", value: editorStatsQuery.data?.data?.verifiedCount, icon: HiOutlineCheckCircle, color: "#15803d" },
          { label: "Rejected Issues", value: editorStatsQuery.data?.data?.rejectedCount, icon: HiOutlineXCircle, color: "#b91c1c" },
          { label: "Total Pool", value: editorStatsQuery.data?.data?.totalCount, icon: HiOutlineUserGroup, color: "#6d28d9" },
        ] : [
          { label: "New Submissions", value: clientStatsQuery.data?.data?.submitted, icon: HiOutlineClock, color: "#b45309" },
          { label: "Verified Clients", value: clientStatsQuery.data?.data?.verified, icon: HiOutlineCheckCircle, color: "#15803d" },
          { label: "Rejected Cases", value: clientStatsQuery.data?.data?.rejected, icon: HiOutlineXCircle, color: "#b91c1c" },
          { label: "Grand Total", value: clientStatsQuery.data?.data?.total, icon: HiOutlineUserGroup, color: "#6d28d9" },
        ]).map((s, idx) => (
          <StatCard key={idx} {...s} loading={activeTab === "editors" ? editorStatsQuery.isLoading : clientStatsQuery.isLoading} />
        ))}
      </div>

      {/* Main Content Area */}
      <div className="card" style={{ border: "1px solid var(--border-subtle)", background: "var(--bg-surface)", overflow: "hidden" }}>
        {/* Table Controls */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", background: "rgba(0,0,0,0.01)" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 280, maxWidth: 400 }}>
            <HiOutlineMagnifyingGlass size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input 
              type="text" 
              placeholder={`Search ${activeTab === 'editors' ? 'editors' : 'clients'} by name or email...`}
              value={params.search || ""}
              onChange={(e) => setParams(prev => ({ ...prev, search: e.target.value, page: 1 }))}
              style={{
                width: "100%", padding: "10px 14px 10px 42px", borderRadius: 10, background: "var(--bg-elevated)",
                border: "1px solid var(--border-default)", color: "var(--text-primary)", fontSize: 13, outline: "none"
              }}
            />
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Status Filter:</span>
            <select 
              value={params.status}
              onChange={(e) => setParams({ ...params, status: e.target.value, page: 1 })}
              style={{
                padding: "8px 12px", borderRadius: 8, background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)",
                color: "var(--text-primary)", fontSize: 13, cursor: "pointer", outline: "none"
              }}
            >
              <option value="submitted">Pending Action</option>
              <option value="verified">Verified Records</option>
              <option value="rejected">Rejected Issues</option>
              <option value="all">Full History</option>
            </select>
          </div>
        </div>

        <DataTable 
          columns={columns}
          data={activeTab === "editors" ? requestsQuery.data?.data?.users : requestsQuery.data?.data?.kycList || []}
          loading={requestsQuery.isLoading}
          pagination={{
            page: params.page,
            pageSize: params.limit,
            total: requestsQuery.data?.data?.pagination?.total || 0,
            onPageChange: (page) => setParams({ ...params, page })
          }}
        />
      </div>

      {/* Enhanced Detail SlideOver */}
      <SlideOver
        isOpen={isDetailOpen}
        onClose={() => { setIsDetailOpen(false); setRejectionReason(""); setIsRejecting(false); }}
        title="Verification Terminal"
      >
        {detailQuery.isLoading ? (
          <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="skeleton" style={{ height: 100, borderRadius: 16 }} />
            <div className="skeleton" style={{ height: 200, borderRadius: 16 }} />
            <div className="skeleton" style={{ height: 300, borderRadius: 16 }} />
          </div>
        ) : detailQuery.data?.data ? (
          <div style={{ padding: "24px 30px", paddingBottom: 140 }}>
            {(() => {
              const d = detailQuery.data.data;
              const user = activeTab === "editors" ? d.user : d.kyc.user;
              const kyc = activeTab === "editors" ? d.user : d.kyc;
              const status = kyc.kycStatus || kyc.status || "pending";
              const submittedAt = activeTab === "editors" ? kyc.kycSubmittedAt : kyc.submittedAt;
              const name = activeTab === "editors" ? user?.name : kyc?.fullName || user?.name;
              
              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                  {/* Profile Section */}
                  <div style={{ display: "flex", alignItems: "center", gap: 20, padding: 20, background: "var(--bg-elevated)", borderRadius: 16, border: "1px solid var(--border-subtle)" }}>
                    <UserAvatar src={user?.profilePicture} name={name} size={64} />
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.02em" }}>{name}</h3>
                      <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "2px 0 8px" }}>{user?.email}</p>
                      <StatusBadge status={status} submittedAt={submittedAt} />
                    </div>
                  </div>

                  {/* Financial Intelligence */}
                  <section>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                      <HiOutlineBanknotes size={18} style={{ color: "var(--brand)" }} />
                      <h4 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", margin: 0 }}>Banking Intelligence</h4>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      {[
                        ["Account Holder", kyc.bankDetails?.accountHolderName || kyc.accountHolderName],
                        ["Bank Association", kyc.bankDetails?.bankName || kyc.bankName],
                        ["IFSC Identifier", kyc.bankDetails?.ifscCode || kyc.ifscCode],
                        ["Account Number", kyc.bankDetails?.accountNumber || kyc.bankAccountNumberMasked || "•••• •••• ••••"]
                      ].map(([label, val]) => (
                        <div key={label} style={{ padding: 14, background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border-subtle)" }}>
                          <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>{label}</span>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginTop: 4, fontFamily: label.includes("Number") ? "monospace" : "inherit" }}>
                            {val || "Unavailable"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Evidence Vault */}
                  <section>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                      <HiOutlineIdentification size={18} style={{ color: "var(--brand)" }} />
                      <h4 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", margin: 0 }}>Document Evidence</h4>
                    </div>
                    
                    {(() => {
                      const docs = (activeTab === "editors" ? kyc.kycDocuments : kyc.documents) || [];
                      const required = [
                        { type: "id_proof", label: "Identity Proof (Aadhar/PAN/Passport)" },
                        { type: "bank_proof", label: "Banking Proof (Passbook/Statement)" }
                      ];
                      
                      return (
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                          {required.map((req, idx) => {
                            const doc = docs.find(d => d.type === req.type);
                            
                            if (!doc) {
                              return (
                                <div key={idx} style={{ 
                                  padding: 16, borderRadius: 16, border: "1.5px dashed var(--border-subtle)", 
                                  background: "rgba(185,28,28,0.03)", display: "flex", alignItems: "center", gap: 16 
                                }}>
                                  <div style={{ 
                                    width: 48, height: 48, borderRadius: 12, background: "rgba(185,28,28,0.1)", 
                                    color: "var(--danger)", display: "flex", alignItems: "center", justifyContent: "center" 
                                  }}>
                                    <HiOutlineXCircle size={24} />
                                  </div>
                                  <div>
                                    <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary)" }}>{req.label}</div>
                                    <div style={{ fontSize: 12, color: "var(--danger)", marginTop: 2, fontWeight: 600 }}>MISSING DOCUMENT</div>
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <motion.div 
                                key={idx} 
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                                style={{
                                  borderRadius: 16, overflow: "hidden", border: "1px solid var(--border-subtle)", background: "var(--bg-elevated)"
                                }}
                              >
                                <div style={{ 
                                  padding: "12px 16px", background: "var(--bg-card)", borderBottom: "1px solid var(--border-subtle)", 
                                  display: "flex", justifyContent: "space-between", alignItems: "center" 
                                }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <HiOutlineCheckCircle size={16} style={{ color: "var(--success)" }} />
                                    <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--text-primary)" }}>{req.label}</span>
                                  </div>
                                  <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>
                                    Update: {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : "N/A"}
                                  </span>
                                </div>
                                
                                <div style={{ position: "relative", aspectRatio: "16/6", background: "#000" }}>
                                  {doc.url?.toLowerCase().endsWith(".pdf") ? (
                                    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
                                      <HiOutlineIdentification size={48} style={{ color: "var(--text-muted)" }} />
                                      <span style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 600 }}>PDF Document</span>
                                    </div>
                                  ) : (
                                    <img src={doc.url} alt={req.label} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.6 }} />
                                  )}
                                  
                                  <div style={{ 
                                    position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", 
                                    background: "rgba(0,0,0,0.3)", backdropFilter: "blur(2px)" 
                                  }}>
                                    <a 
                                      href={doc.url} target="_blank" rel="noreferrer"
                                      style={{
                                        padding: "10px 20px", background: "var(--brand)", color: "#fff", borderRadius: 10,
                                        fontSize: 13, fontWeight: 800, textDecoration: "none", display: "flex", alignItems: "center", gap: 8,
                                        boxShadow: "0 10px 25px rgba(0,0,0,0.3)", border: "none", transition: "all 0.2s"
                                      }}
                                    >
                                      <HiOutlineArrowTopRightOnSquare size={16} /> Open Proof
                                    </a>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}

                          {/* Handle other documents if any */}
                          {docs.filter(d => !required.find(r => r.type === d.type)).map((doc, idx) => (
                            <div key={`other-${idx}`} style={{ padding: 14, borderRadius: 12, border: "1px solid var(--border-subtle)", background: "var(--bg-card)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                               <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                  <HiOutlineFingerPrint size={18} style={{ color: "var(--text-muted)" }} />
                                  <span style={{ fontSize: 13, fontWeight: 600 }}>{doc.type || "Other Document"}</span>
                               </div>
                               <a href={doc.url} target="_blank" rel="noreferrer" style={{ color: "var(--brand)", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>View File</a>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </section>

                  {/* Operational History */}
                  {d.logs?.length > 0 && (
                    <section>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                        <HiOutlineClock size={18} style={{ color: "var(--text-muted)" }} />
                        <h4 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", margin: 0 }}>Audit History</h4>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {d.logs.slice(0, 3).map((log, idx) => (
                          <div key={idx} style={{ padding: 14, background: "var(--bg-elevated)", borderRadius: 12, border: "1px solid var(--border-subtle)", fontSize: 12 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div style={{ width: 8, height: 8, borderRadius: "50%", background: log.action === "verified" ? "var(--success)" : "var(--danger)" }} />
                              <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>Record {log.action}</span>
                            </div>
                            <div style={{ color: "var(--text-secondary)", marginTop: 4 }}>
                              By {log.performedBy?.adminId?.name || "System"} • {new Date(log.createdAt).toLocaleString()}
                            </div>
                            {log.reason && (
                              <div style={{ marginTop: 8, padding: 8, background: "rgba(185,28,28,0.05)", borderRadius: 6, color: "var(--danger)", fontWeight: 500 }}>
                                Reason: {log.reason}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Terminal Action Bar */}
                  <div style={{
                    position: "absolute", bottom: 0, left: 0, right: 0, padding: "24px 30px",
                    background: "var(--bg-panel)", borderTop: "1px solid var(--border-subtle)",
                    display: "flex", gap: 12, backdropFilter: "blur(12px)"
                  }}>
                    {!isRejecting ? (
                      <>
                        <button 
                          onClick={() => handleAction("approve")}
                          disabled={verifyMutation.isPending}
                          style={{
                            flex: 1, padding: "14px", borderRadius: 12, background: "var(--success)",
                            color: "#fff", border: "none", fontSize: 14, fontWeight: 800,
                            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                            boxShadow: "0 4px 12px rgba(21,128,61,0.2)"
                          }}
                        >
                          {verifyMutation.isPending ? <div className="spinner-sm" /> : <HiOutlineCheck size={18} />} Verify Account
                        </button>
                        <button 
                          onClick={() => setIsRejecting(true)}
                          disabled={verifyMutation.isPending}
                          style={{
                            flex: 1, padding: "14px", borderRadius: 12, background: "var(--bg-elevated)",
                            color: "var(--danger)", border: "1px solid var(--border-subtle)", fontSize: 14, fontWeight: 800,
                            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8
                          }}
                        >
                          <HiOutlineXMark size={18} /> Flag for Rejection
                        </button>
                      </>
                    ) : (
                      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
                        <textarea
                          placeholder="Provide detailed feedback for the user..."
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          style={{
                            width: "100%", padding: 14, borderRadius: 12, background: "var(--bg-card)",
                            border: "1px solid var(--danger)", color: "var(--text-primary)", fontSize: 13,
                            minHeight: 100, outline: "none"
                          }}
                        />
                        <div style={{ display: "flex", gap: 10 }}>
                          <button 
                            onClick={() => handleAction("reject", rejectionReason)}
                            disabled={!rejectionReason.trim() || verifyMutation.isPending}
                            style={{ flex: 1, padding: 12, borderRadius: 10, background: "var(--danger)", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer" }}
                          >
                            Execute Rejection
                          </button>
                          <button 
                            onClick={() => setIsRejecting(false)}
                            style={{ flex: 1, padding: 12, borderRadius: 10, background: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)", fontWeight: 700, cursor: "pointer" }}
                          >
                            Abort
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        ) : null}
      </SlideOver>
    </div>
  );
};

export default KYCManagement;
