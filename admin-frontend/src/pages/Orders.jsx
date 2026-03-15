// ─── Orders.jsx — Production Order Management ────────────────────────────────
// Light/dark theme, self-contained CSS variables, zero Tailwind dependency.
// Deps: @tanstack/react-query, react-hot-toast, react-icons/hi2, ../api/adminApi, ../utils/formatters

import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  HiOutlineShoppingBag,
  HiOutlineMagnifyingGlass,
  HiOutlineArrowDownTray,
  HiOutlineArrowPath,
  HiOutlineXMark,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineExclamationTriangle,
  HiOutlineChatBubbleLeftRight,
  HiOutlineCurrencyRupee,
  HiOutlineUser,
  HiOutlineCalendarDays,
  HiOutlineFunnel,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineEye,
  HiOutlineBriefcase,
  HiOutlineHome,
  HiMiniCheck,
  HiOutlineNoSymbol,
  HiOutlineCheckBadge,
  HiOutlineReceiptPercent,
  HiOutlineBanknotes,
  HiOutlineUserGroup,
  HiOutlineDocumentText,
  HiOutlineShieldExclamation,
} from "react-icons/hi2";
import { toast } from "react-hot-toast";
import { ordersApi } from "../api/adminApi";
import { formatDate, formatCurrency, formatRelativeTime } from "../utils/formatters";

// ─────────────────────────────────────────────────────────────────────────────
// Status config
// ─────────────────────────────────────────────────────────────────────────────
const STATUS = {
  pending_payment:  { label: "Pending Payment",  color: "#b45309", bg: "#fffbeb", border: "#fde68a", dot: "#f59e0b", dark_color: "#fcd34d", dark_bg: "#451a03", dark_border: "#78350f" },
  awaiting_payment: { label: "Awaiting Payment", color: "#b45309", bg: "#fffbeb", border: "#fde68a", dot: "#f59e0b", dark_color: "#fcd34d", dark_bg: "#451a03", dark_border: "#78350f" },
  new:              { label: "New",              color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe", dot: "#3b82f6", dark_color: "#93c5fd", dark_bg: "#1e3a5f", dark_border: "#1e40af" },
  accepted:         { label: "Accepted",         color: "#0369a1", bg: "#f0f9ff", border: "#bae6fd", dot: "#0ea5e9", dark_color: "#7dd3fc", dark_bg: "#0c3b52", dark_border: "#0369a1" },
  in_progress:      { label: "In Progress",      color: "#6d28d9", bg: "#f5f3ff", border: "#ddd6fe", dot: "#8b5cf6", dark_color: "#c4b5fd", dark_bg: "#2e1065", dark_border: "#5b21b6" },
  submitted:        { label: "Submitted",         color: "#c2410c", bg: "#fff7ed", border: "#fed7aa", dot: "#f97316", dark_color: "#fdba74", dark_bg: "#431407", dark_border: "#9a3412" },
  completed:        { label: "Completed",         color: "#15803d", bg: "#f0fdf4", border: "#bbf7d0", dot: "#22c55e", dark_color: "#86efac", dark_bg: "#14532d", dark_border: "#166534" },
  rejected:         { label: "Rejected",          color: "#b91c1c", bg: "#fef2f2", border: "#fecaca", dot: "#ef4444", dark_color: "#fca5a5", dark_bg: "#450a0a", dark_border: "#7f1d1d" },
  cancelled:        { label: "Cancelled",         color: "#4b5563", bg: "#f9fafb", border: "#e5e7eb", dot: "#9ca3af", dark_color: "#9ca3af", dark_bg: "#1f2937", dark_border: "#374151" },
  disputed:         { label: "Disputed",          color: "#991b1b", bg: "#fef2f2", border: "#fca5a5", dot: "#dc2626", dark_color: "#f87171", dark_bg: "#450a0a", dark_border: "#991b1b", solid: true },
  expired:          { label: "Expired",           color: "#374151", bg: "#f3f4f6", border: "#d1d5db", dot: "#6b7280", dark_color: "#9ca3af", dark_bg: "#111827", dark_border: "#374151" },
};

// ─────────────────────────────────────────────────────────────────────────────
// Small reusable atoms
// ─────────────────────────────────────────────────────────────────────────────

/** Status chip */
const StatusChip = ({ status, sm }) => {
  const cfg = STATUS[status] || STATUS.cancelled;
  return (
    <span className="ord-chip" data-status={status} style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: sm ? "2px 8px" : "3px 10px",
      borderRadius: 999, fontSize: sm ? 10 : 11, fontWeight: 600,
      background: `var(--ord-chip-bg-${status}, ${cfg.bg})`,
      color: `var(--ord-chip-text-${status}, ${cfg.color})`,
      border: `1px solid var(--ord-chip-border-${status}, ${cfg.border})`,
      whiteSpace: "nowrap", lineHeight: 1.6,
    }}>
      <span style={{
        width: sm ? 5 : 6, height: sm ? 5 : 6, borderRadius: "50%",
        background: cfg.dot, flexShrink: 0,
        ...(status === "completed" ? { animation: "ord-pulse 2s infinite" } : {}),
      }} />
      {cfg.label}
    </span>
  );
};

/** User avatar with initials fallback */
const UserAvatar = ({ src, name, size = 30 }) => {
  const [err, setErr] = useState(false);
  const initials = (name || "??").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const palette  = ["#1d4ed8","#6d28d9","#0369a1","#15803d","#b45309","#c2410c"];
  const bg       = palette[(name || "").charCodeAt(0) % palette.length];
  if (!err && src) return (
    <img src={src} alt={name || "user"} onError={() => setErr(true)}
      style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover",
               border: "2px solid var(--ord-surface)", flexShrink: 0 }} />
  );
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: bg,
      color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.36, fontWeight: 700, flexShrink: 0,
      border: "2px solid var(--ord-surface)",
    }}>{initials}</div>
  );
};

/** Stat card */
const StatCard = ({ label, value, icon: Icon, color, loading, alert }) => (
  <div style={{
    background: "var(--ord-card)", border: "1px solid var(--ord-border)",
    borderRadius: 10, padding: "16px 20px",
    display: "flex", alignItems: "center", gap: 14,
    boxShadow: "0 1px 3px var(--ord-shadow)", flex: 1, minWidth: 150,
    ...(alert ? { borderColor: "#fca5a5", background: "var(--ord-card)" } : {}),
  }}>
    <div style={{
      width: 40, height: 40, borderRadius: 10, flexShrink: 0,
      background: color + "18",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <Icon size={19} style={{ color }} />
    </div>
    {loading ? (
      <div>
        <div style={{ height: 22, width: 44, borderRadius: 4, background: "var(--ord-shimmer)", marginBottom: 4, animation: "ord-shimmer 1.4s ease infinite" }} />
        <div style={{ height: 12, width: 70, borderRadius: 4, background: "var(--ord-shimmer)", animation: "ord-shimmer 1.4s ease infinite" }} />
      </div>
    ) : (
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, color: "var(--ord-text-primary)", lineHeight: 1.2 }}>
          {alert && <span style={{ color: "#dc2626" }}>⚑ </span>}
          {(value ?? 0).toLocaleString()}
        </div>
        <div style={{ fontSize: 12, color: "var(--ord-text-muted)", marginTop: 2 }}>{label}</div>
      </div>
    )}
  </div>
);

/** Table skeleton row */
const SkeletonRow = () => (
  <tr style={{ borderBottom: "1px solid var(--ord-row-border)" }}>
    {[20, 32, 140, 100, 100, 80, 80, 70].map((w, i) => (
      <td key={i} style={{ padding: "13px 12px" }}>
        <div style={{
          height: i === 1 ? 30 : 13, width: i === 1 ? 30 : w,
          borderRadius: i === 1 ? "50%" : 4,
          background: "var(--ord-shimmer)", animation: "ord-shimmer 1.4s ease infinite",
        }} />
      </td>
    ))}
  </tr>
);

/** Sort-able TH */
const SortTH = ({ label, field, sk, sd, onSort, style = {} }) => (
  <th onClick={() => onSort(field)} style={{
    padding: "10px 12px", fontSize: 11, fontWeight: 600, textAlign: "left",
    color: "var(--ord-text-muted)", textTransform: "uppercase", letterSpacing: ".07em",
    background: "var(--ord-thead)", borderBottom: "1px solid var(--ord-border)",
    cursor: "pointer", userSelect: "none", whiteSpace: "nowrap", ...style,
  }}>
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      {label}
      {sk === field
        ? sd === "asc"
          ? <HiOutlineChevronUp size={11} style={{ color: "var(--ord-accent)" }} />
          : <HiOutlineChevronDown size={11} style={{ color: "var(--ord-accent)" }} />
        : <HiOutlineChevronDown size={11} style={{ opacity: .25 }} />}
    </span>
  </th>
);

/** Plain TH */
const TH = ({ children, style = {} }) => (
  <th style={{
    padding: "10px 12px", fontSize: 11, fontWeight: 600, textAlign: "left",
    color: "var(--ord-text-muted)", textTransform: "uppercase", letterSpacing: ".07em",
    background: "var(--ord-thead)", borderBottom: "1px solid var(--ord-border)",
    whiteSpace: "nowrap", ...style,
  }}>{children}</th>
);

/** Section heading inside slide-over */
const SectionLabel = ({ children }) => (
  <div style={{
    fontSize: 10, fontWeight: 700, letterSpacing: ".1em",
    textTransform: "uppercase", color: "var(--ord-text-muted)",
    marginBottom: 10,
  }}>{children}</div>
);

/** Info row in slide-over */
const InfoRow = ({ label, value, mono, accent }) => (
  <div style={{
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "9px 0", borderBottom: "1px solid var(--ord-row-border)",
  }}>
    <span style={{ fontSize: 13, color: "var(--ord-text-muted)" }}>{label}</span>
    <span style={{
      fontSize: mono ? 11 : 13, fontWeight: 600,
      color: accent || "var(--ord-text-primary)",
      fontFamily: mono ? "monospace" : "inherit",
      maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
    }}>{value || "—"}</span>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
const Orders = () => {
  const queryClient = useQueryClient();

  // ── State ──────────────────────────────────────────────────────────────
  const [page,        setPage]        = useState(1);
  const [pageSize,    setPageSize]    = useState(25);
  const [search,      setSearch]      = useState("");
  const [status,      setStatus]      = useState("all");
  const [sortKey,     setSortKey]     = useState("createdAt");
  const [sortDir,     setSortDir]     = useState("desc");
  const [selectedIds, setSelectedIds] = useState([]);
  const [panelId,     setPanelId]     = useState(null);
  const [disputeConf, setDisputeConf] = useState(null); // { orderId, resolution }
  const searchRef = useRef(null);

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: od, isLoading, isFetching } = useQuery({
    queryKey: ["orders", page, pageSize, status, search, sortKey, sortDir],
    queryFn: () => ordersApi.getAll({
      page, limit: pageSize,
      status: status !== "all" ? status : undefined,
      search: search || undefined,
      sort: `${sortDir === "desc" ? "-" : ""}${sortKey}`,
    }).then(r => r.data),
    keepPreviousData: true,
    staleTime: 30_000,
  });

  const { data: panel, isLoading: panelLoading } = useQuery({
    queryKey: ["order-detail", panelId],
    queryFn: () => ordersApi.getById(panelId).then(r => r.data),
    enabled: !!panelId,
    staleTime: 30_000,
  });

  // Quick stat counts
  const { data: statCounts } = useQuery({
    queryKey: ["order-stat-counts"],
    queryFn: async () => {
      const res = await ordersApi.getStats();
      return res.data?.stats?.orders || null;
    },
    staleTime: 60_000,
  });

  // ── Mutations ─────────────────────────────────────────────────────────
  const statusMutation = useMutation({
    mutationFn: ({ id, newStatus }) => ordersApi.updateStatus(id, newStatus),
    onSuccess: () => {
      toast.success("Order status updated");
      queryClient.invalidateQueries(["orders"]);
      queryClient.invalidateQueries(["order-detail", panelId]);
    },
    onError: err => toast.error(err.response?.data?.message || "Update failed"),
  });

  const disputeMutation = useMutation({
    mutationFn: ({ id, resolution }) => ordersApi.resolveDispute(id, { resolution }),
    onSuccess: res => {
      toast.success(res.data?.message || "Dispute resolved");
      setDisputeConf(null);
      queryClient.invalidateQueries(["orders"]);
      queryClient.invalidateQueries(["order-detail", panelId]);
    },
    onError: err => toast.error(err.response?.data?.message || "Dispute resolution failed"),
  });

  // ── Derived ─────────────────────────────────────────────────────────────
  const orders     = od?.orders || [];
  const pagination = od?.pagination || {};
  const totalPages = pagination.pages || 1;
  const allSel     = orders.length > 0 && selectedIds.length === orders.length;
  const someSel    = selectedIds.length > 0 && !allSel;
  const order      = panel?.order;

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleSort = field => {
    if (sortKey === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(field); setSortDir("desc"); }
    setPage(1);
  };

  const handleExport = () => {
    toast.success("Preparing export…");
    ordersApi.export?.({ status: status !== "all" ? status : undefined, search });
  };

  const visiblePages = () => {
    const ps = [];
    const delta = 1;
    const start = Math.max(2, page - delta);
    const end   = Math.min(totalPages - 1, page + delta);
    ps.push(1);
    if (start > 2) ps.push("…");
    for (let i = start; i <= end; i++) ps.push(i);
    if (end < totalPages - 1) ps.push("…");
    if (totalPages > 1) ps.push(totalPages);
    return ps;
  };

  // Timeline events for the slide-over
  const timelineEvents = order ? [
    { label: "Order placed",      date: order.createdAt,   icon: HiOutlineShoppingBag,  color: "#3b82f6" },
    { label: "Accepted by editor", date: order.acceptedAt,  icon: HiOutlineCheckCircle,  color: "#0ea5e9" },
    { label: "Work submitted",    date: order.submittedAt, icon: HiOutlineDocumentText, color: "#8b5cf6" },
    { label: "Disputed",          date: order.disputedAt,  icon: HiOutlineExclamationTriangle, color: "#ef4444" },
    { label: "Completed",         date: order.completedAt, icon: HiOutlineCheckBadge,   color: "#22c55e" },
    { label: "Cancelled",         date: order.cancelledAt, icon: HiOutlineNoSymbol,     color: "#9ca3af" },
  ].filter(e => e.date) : [];

  // Close on Escape
  useEffect(() => {
    const h = e => { if (e.key === "Escape") { setPanelId(null); setDisputeConf(null); } };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── CSS variables + keyframes ───────────────────────────────────── */}
      <style>{`
        /* ── Light ─────────────────────────────────────────── */
        :root {
          --ord-page:         #f8f9fa;
          --ord-card:         #ffffff;
          --ord-surface:      #ffffff;
          --ord-thead:        #f8f9fa;
          --ord-border:       #e5e7eb;
          --ord-row-border:   #f3f4f6;
          --ord-shadow:       rgba(0,0,0,.06);
          --ord-shimmer:      #f1f3f4;
          --ord-text-primary: #111827;
          --ord-text-muted:   #6b7280;
          --ord-accent:       #111827;
          --ord-hover-row:    #f9fafb;
          --ord-sel-row:      #eff6ff;
          --ord-sel-bar-bg:   #eff6ff;
          --ord-sel-bar-brd:  #bfdbfe;
          --ord-sel-text:     #1d4ed8;
          --ord-input-brd:    #d1d5db;
          --ord-input-focus:  #111827;
          --ord-btn-bg:       #ffffff;
          --ord-btn-brd:      #d1d5db;
          --ord-btn-text:     #374151;
          --ord-chip-bg:      #f3f4f6;
          --ord-chip-text:    #374151;
          --ord-panel-bg:     #ffffff;
          --ord-panel-border: #e5e7eb;
          --ord-panel-header: #f8f9fa;
        }

        /* ── Dark ──────────────────────────────────────────── */
        @media (prefers-color-scheme: dark) {
          :root {
            --ord-page:         #0a0a0a;
            --ord-card:         #111111;
            --ord-surface:      #111111;
            --ord-thead:        #161616;
            --ord-border:       #1f1f1f;
            --ord-row-border:   #191919;
            --ord-shadow:       rgba(0,0,0,.3);
            --ord-shimmer:      #1a1a1a;
            --ord-text-primary: #f3f4f6;
            --ord-text-muted:   #6b7280;
            --ord-accent:       #f3f4f6;
            --ord-hover-row:    #161616;
            --ord-sel-row:      #1e3a5f;
            --ord-sel-bar-bg:   #1e3a5f;
            --ord-sel-bar-brd:  #1e40af;
            --ord-sel-text:     #93c5fd;
            --ord-input-brd:    #2a2a2a;
            --ord-input-focus:  #f3f4f6;
            --ord-btn-bg:       #161616;
            --ord-btn-brd:      #2a2a2a;
            --ord-btn-text:     #d1d5db;
            --ord-chip-bg:      #1f1f1f;
            --ord-chip-text:    #9ca3af;
            --ord-panel-bg:     #111111;
            --ord-panel-border: #1f1f1f;
            --ord-panel-header: #161616;
          }
        }
        .dark {
          --ord-page: #0a0a0a; --ord-card: #111111; --ord-surface: #111111;
          --ord-thead: #161616; --ord-border: #1f1f1f; --ord-row-border: #191919;
          --ord-shadow: rgba(0,0,0,.3); --ord-shimmer: #1a1a1a;
          --ord-text-primary: #f3f4f6; --ord-text-muted: #6b7280; --ord-accent: #f3f4f6;
          --ord-hover-row: #161616; --ord-sel-row: #1e3a5f;
          --ord-sel-bar-bg: #1e3a5f; --ord-sel-bar-brd: #1e40af; --ord-sel-text: #93c5fd;
          --ord-input-brd: #2a2a2a; --ord-input-focus: #f3f4f6;
          --ord-btn-bg: #161616; --ord-btn-brd: #2a2a2a; --ord-btn-text: #d1d5db;
          --ord-chip-bg: #1f1f1f; --ord-chip-text: #9ca3af;
          --ord-panel-bg: #111111; --ord-panel-border: #1f1f1f; --ord-panel-header: #161616;
        }

        @keyframes ord-shimmer { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes ord-pulse   { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.6;transform:scale(.8)} }
        @keyframes ord-slideIn { from{transform:translateX(100%);opacity:0} to{transform:translateX(0);opacity:1} }
        @keyframes ord-fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes ord-fadeUp  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }

        .ord-row:hover td { background: var(--ord-hover-row) !important; }
        .ord-row.ord-sel  td { background: var(--ord-sel-row)  !important; }
        .ord-action { opacity: 0; transition: opacity .15s; }
        .ord-row:hover .ord-action { opacity: 1; }
        .ord-btn:hover { opacity: .85; }
        .ord-panel-scroll::-webkit-scrollbar { width: 4px; }
        .ord-panel-scroll::-webkit-scrollbar-thumb { background: var(--ord-border); border-radius: 2px; }
        .ord-tbtn { background: var(--ord-btn-bg); border: 1px solid var(--ord-btn-brd); color: var(--ord-btn-text); cursor: pointer; border-radius: 6px; font-size: 13px; display: flex; align-items: center; gap: 6px; padding: 7px 14px; font-weight: 500; transition: opacity .15s; }
        .ord-tbtn:hover { opacity: .8; }
        .ord-input { width: 100%; box-sizing: border-box; padding: 9px 12px 9px 38px; border: 1px solid var(--ord-input-brd); border-radius: 6px; font-size: 13px; color: var(--ord-text-primary); background: var(--ord-card); outline: none; transition: border .15s; }
        .ord-input:focus { border-color: var(--ord-input-focus); }
        .ord-select { background: var(--ord-card); border: 1px solid var(--ord-btn-brd); color: var(--ord-text-primary); border-radius: 6px; padding: 8px 12px; font-size: 12px; outline: none; cursor: pointer; }
      `}</style>

      <div style={{ background: "var(--ord-page)", minHeight: "100vh", fontFamily: "system-ui,-apple-system,sans-serif" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* ── Breadcrumb ─────────────────────────────────────────────── */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--ord-text-muted)" }}>
            <HiOutlineHome size={14} />
            <span style={{ color: "var(--ord-border)" }}>/</span>
            <span>Admin</span>
            <span style={{ color: "var(--ord-border)" }}>/</span>
            <span style={{ color: "var(--ord-text-primary)", fontWeight: 600 }}>Orders</span>
          </div>

          {/* ── Page header ──────────────────────────────────────────────── */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "var(--ord-text-primary)", letterSpacing: "-.3px" }}>
                Orders
              </h1>
              <p style={{ margin: "4px 0 0", fontSize: 14, color: "var(--ord-text-muted)" }}>
                Track project lifecycles, escrow status, and dispute resolution.
              </p>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button
                onClick={() => queryClient.invalidateQueries(["orders"])}
                className="ord-tbtn"
                title="Refresh"
              >
                <HiOutlineArrowPath size={15} style={isFetching ? { animation: "ord-shimmer .6s linear infinite" } : {}} />
                Refresh
              </button>
              <button onClick={handleExport} style={{
                display: "flex", alignItems: "center", gap: 6, padding: "7px 14px",
                background: "var(--ord-text-primary)", border: "none", borderRadius: 6,
                fontSize: 13, color: "var(--ord-page)", cursor: "pointer", fontWeight: 600,
              }}>
                <HiOutlineArrowDownTray size={15} />
                Export CSV
              </button>
            </div>
          </div>

          {/* ── Stat cards ────────────────────────────────────────────────── */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <StatCard label="Total Orders"     value={pagination.total}         icon={HiOutlineShoppingBag}        color="#6d28d9" loading={isLoading} />
            <StatCard label="Active"           value={statCounts?.active}       icon={HiOutlineClock}              color="#0369a1" loading={isLoading} />
            <StatCard label="Completed"        value={statCounts?.completed}    icon={HiOutlineCheckBadge}         color="#15803d" loading={isLoading} />
            <StatCard label="Disputed"         value={statCounts?.disputed}     icon={HiOutlineShieldExclamation}  color="#dc2626" loading={isLoading} alert={statCounts?.disputed > 0} />
          </div>

          {/* ── Dispute alert banner (shows only when disputed > 0) ─────── */}
          {statCounts?.disputed > 0 && (
            <div style={{
              padding: "12px 16px", background: "#fef2f2", border: "1px solid #fecaca",
              borderRadius: 8, display: "flex", alignItems: "center", gap: 12,
              animation: "ord-fadeUp .3s ease",
            }}>
              <HiOutlineExclamationTriangle size={18} style={{ color: "#dc2626", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#991b1b" }}>
                  {statCounts.disputed} order{statCounts.disputed > 1 ? "s" : ""} require dispute mediation
                </span>
                <span style={{ fontSize: 12, color: "#b91c1c", marginLeft: 8 }}>
                  — action required to release or refund funds.
                </span>
              </div>
              <button
                onClick={() => { setStatus("disputed"); setPage(1); }}
                style={{
                  padding: "5px 14px", background: "#dc2626", border: "none",
                  borderRadius: 6, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer",
                }}
              >
                View Disputes
              </button>
            </div>
          )}

          {/* ── Main card ─────────────────────────────────────────────────── */}
          <div style={{
            background: "var(--ord-card)", border: "1px solid var(--ord-border)",
            borderRadius: 10, boxShadow: "0 1px 3px var(--ord-shadow)", overflow: "hidden",
          }}>

            {/* ── Toolbar ──────────────────────────────────────────────── */}
            <div style={{
              padding: "12px 16px", borderBottom: "1px solid var(--ord-border)",
              display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
            }}>
              {/* Search */}
              <div style={{ position: "relative", flex: 1, minWidth: 260 }}>
                <HiOutlineMagnifyingGlass size={15} style={{
                  position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)",
                  color: "var(--ord-text-muted)", pointerEvents: "none",
                }} />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search by order ID, title, or client name…"
                  className="ord-input"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                />
                {search && (
                  <button onClick={() => { setSearch(""); setPage(1); searchRef.current?.focus(); }}
                    style={{
                      position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)",
                      background: "none", border: "none", cursor: "pointer",
                      color: "var(--ord-text-muted)", display: "flex", alignItems: "center", padding: 2,
                    }}>
                    <HiOutlineXMark size={15} />
                  </button>
                )}
              </div>

              {/* Status filter chips */}
              <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, color: "var(--ord-text-muted)", fontWeight: 500 }}>Status:</span>
                {[
                  ["all", "All"],
                  ["new", "New"],
                  ["in_progress", "In Progress"],
                  ["submitted", "Submitted"],
                  ["completed", "Completed"],
                  ["disputed", "Disputed"],
                  ["cancelled", "Cancelled"],
                ].map(([v, l]) => (
                  <button key={v} onClick={() => { setStatus(v); setPage(1); }}
                    className="ord-btn"
                    style={{
                      padding: "4px 11px", borderRadius: 999, fontSize: 11, fontWeight: 600,
                      cursor: "pointer", border: "1px solid",
                      background: status === v ? "var(--ord-text-primary)" : "transparent",
                      color: status === v ? "var(--ord-page)" : "var(--ord-text-muted)",
                      borderColor: status === v ? "var(--ord-text-primary)" : "var(--ord-border)",
                      transition: "all .15s",
                      ...(v === "disputed" && status !== "disputed" && statCounts?.disputed > 0
                        ? { borderColor: "#fca5a5", color: "#dc2626" } : {}),
                    }}
                  >{l}{v === "disputed" && statCounts?.disputed > 0 && status !== "disputed"
                      ? ` (${statCounts.disputed})` : ""}</button>
                ))}
              </div>

              {/* Page size */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
                <span style={{ fontSize: 12, color: "var(--ord-text-muted)" }}>Rows:</span>
                <select
                  className="ord-select"
                  value={pageSize}
                  onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                >
                  {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>

            {/* ── Bulk action bar ──────────────────────────────────────── */}
            {selectedIds.length > 0 && (
              <div style={{
                padding: "9px 16px",
                background: "var(--ord-sel-bar-bg)", borderBottom: `1px solid var(--ord-sel-bar-brd)`,
                display: "flex", alignItems: "center", gap: 14,
                animation: "ord-fadeIn .2s ease",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: 4, background: "#1d4ed8",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <HiMiniCheck size={12} style={{ color: "#fff" }} />
                  </div>
                  <span style={{ fontSize: 13, color: "var(--ord-sel-text)", fontWeight: 600 }}>
                    {selectedIds.length} selected
                  </span>
                </div>
                <div style={{ height: 16, width: 1, background: "var(--ord-sel-bar-brd)" }} />
                <button
                  onClick={() => { toast.success(`${selectedIds.length} orders flagged for audit`); setSelectedIds([]); }}
                  style={{
                    padding: "4px 12px", background: "var(--ord-card)", border: "1px solid var(--ord-border)",
                    borderRadius: 6, fontSize: 12, fontWeight: 600, color: "var(--ord-text-primary)",
                    cursor: "pointer",
                  }}
                >
                  Flag for Audit
                </button>
                <button
                  onClick={() => setSelectedIds([])}
                  style={{ marginLeft: "auto", background: "none", border: "none", fontSize: 12, color: "var(--ord-text-muted)", cursor: "pointer" }}
                >
                  Clear
                </button>
              </div>
            )}

            {/* ── Table ────────────────────────────────────────────────── */}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 820 }}>
                <thead>
                  <tr>
                    <th style={{ width: 44, padding: "10px 12px", background: "var(--ord-thead)", borderBottom: "1px solid var(--ord-border)" }}>
                      <input
                        type="checkbox" checked={allSel}
                        ref={el => { if (el) el.indeterminate = someSel; }}
                        onChange={e => setSelectedIds(e.target.checked ? orders.map(o => o._id) : [])}
                        style={{ width: 15, height: 15, cursor: "pointer", accentColor: "#1d4ed8" }}
                      />
                    </th>
                    <SortTH label="Order ID"  field="orderNumber" sk={sortKey} sd={sortDir} onSort={handleSort} style={{ minWidth: 120 }} />
                    <TH style={{ minWidth: 180 }}>Project</TH>
                    <TH>Client</TH>
                    <TH>Editor</TH>
                    <SortTH label="Amount"    field="amount"      sk={sortKey} sd={sortDir} onSort={handleSort} />
                    <TH>Status</TH>
                    <SortTH label="Created"   field="createdAt"   sk={sortKey} sd={sortDir} onSort={handleSort} style={{ minWidth: 110 }} />
                    <TH style={{ textAlign: "right" }}>Actions</TH>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                  ) : orders.length === 0 ? (
                    <tr>
                      <td colSpan={9}>
                        <div style={{ padding: "60px 0", textAlign: "center" }}>
                          <div style={{
                            width: 52, height: 52, borderRadius: 12,
                            border: "2px dashed var(--ord-border)", background: "var(--ord-shimmer)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            margin: "0 auto 14px",
                          }}>
                            <HiOutlineShoppingBag size={22} style={{ color: "var(--ord-text-muted)", opacity: .5 }} />
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ord-text-primary)", marginBottom: 5 }}>
                            {status !== "all" || search ? "No orders match your filters" : "No orders yet"}
                          </div>
                          <div style={{ fontSize: 13, color: "var(--ord-text-muted)" }}>
                            {status !== "all" || search ? "Try adjusting the search or status filter." : "Orders will appear here when clients place them."}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : orders.map(o => {
                    const isSel = selectedIds.includes(o._id);
                    const isDisputed = o.status === "disputed";
                    return (
                      <tr
                        key={o._id}
                        className={`ord-row${isSel ? " ord-sel" : ""}`}
                        style={{ borderBottom: "1px solid var(--ord-row-border)", transition: "background .1s" }}
                      >
                        <td style={{ padding: "12px 12px" }}>
                          <input type="checkbox" checked={isSel}
                            onChange={e => setSelectedIds(p => e.target.checked ? [...p, o._id] : p.filter(x => x !== o._id))}
                            style={{ width: 15, height: 15, cursor: "pointer", accentColor: "#1d4ed8" }} />
                        </td>
                        <td style={{ padding: "12px 12px" }}>
                          <span style={{
                            fontFamily: "monospace", fontSize: 12, fontWeight: 700,
                            color: "var(--ord-text-primary)",
                            background: "var(--ord-shimmer)", padding: "2px 6px",
                            borderRadius: 4, border: "1px solid var(--ord-border)",
                          }}>
                            {o.orderNumber}
                          </span>
                        </td>
                        <td style={{ padding: "12px 12px", maxWidth: 200 }}>
                          <div style={{
                            fontSize: 13, fontWeight: 600, color: "var(--ord-text-primary)",
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          }}>{o.title}</div>
                          {o.type && (
                            <div style={{
                              fontSize: 10, color: "var(--ord-text-muted)",
                              textTransform: "uppercase", letterSpacing: ".06em", marginTop: 2, fontWeight: 600,
                            }}>{o.type}</div>
                          )}
                        </td>
                        <td style={{ padding: "12px 12px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <UserAvatar src={o.client?.profilePicture} name={o.client?.name} size={26} />
                            <span style={{ fontSize: 12, fontWeight: 500, color: "var(--ord-text-primary)", whiteSpace: "nowrap" }}>
                              {o.client?.name}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: "12px 12px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <UserAvatar src={o.editor?.profilePicture} name={o.editor?.name} size={26} />
                            <span style={{ fontSize: 12, fontWeight: 500, color: "var(--ord-text-primary)", whiteSpace: "nowrap" }}>
                              {o.editor?.name}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: "12px 12px", whiteSpace: "nowrap" }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ord-text-primary)" }}>
                            {formatCurrency(o.amount)}
                          </span>
                        </td>
                        <td style={{ padding: "12px 12px" }}>
                          <StatusChip status={o.status} />
                        </td>
                        <td style={{ padding: "12px 12px", fontSize: 12, color: "var(--ord-text-muted)", whiteSpace: "nowrap" }}>
                          {formatDate(o.createdAt)}
                        </td>
                        <td style={{ padding: "12px 12px", textAlign: "right" }}>
                          <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                            <button
                              onClick={() => setPanelId(o._id)}
                              style={{
                                padding: "5px 12px", background: "var(--ord-card)",
                                border: "1px solid var(--ord-border)", borderRadius: 6,
                                fontSize: 12, fontWeight: 600, color: "var(--ord-text-primary)",
                                cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
                              }}
                              className="ord-btn"
                            >
                              <HiOutlineEye size={13} /> View
                            </button>
                            {isDisputed && (
                              <button
                                onClick={() => setPanelId(o._id)}
                                className="ord-action ord-btn"
                                style={{
                                  padding: "5px 10px", background: "#fef2f2",
                                  border: "1px solid #fca5a5", borderRadius: 6,
                                  fontSize: 11, fontWeight: 700, color: "#dc2626",
                                  cursor: "pointer", whiteSpace: "nowrap",
                                }}
                              >
                                Mediate
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ── Pagination ───────────────────────────────────────────── */}
            {!isLoading && orders.length > 0 && (
              <div style={{
                padding: "12px 16px", borderTop: "1px solid var(--ord-border)",
                display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
              }}>
                <div style={{ fontSize: 13, color: "var(--ord-text-muted)" }}>
                  Showing{" "}
                  <b style={{ color: "var(--ord-text-primary)" }}>
                    {((pagination.page - 1) * pageSize) + 1}–{Math.min(pagination.page * pageSize, pagination.total)}
                  </b>
                  {" "}of{" "}
                  <b style={{ color: "var(--ord-text-primary)" }}>{pagination.total?.toLocaleString()}</b>
                </div>
                <div style={{ display: "flex", gap: 3 }}>
                  {[
                    <button key="prev" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                      style={{ width: 30, height: 30, borderRadius: 5, border: "1px solid var(--ord-border)", background: "var(--ord-card)", cursor: page === 1 ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: page === 1 ? .3 : 1, color: "var(--ord-text-muted)" }}>
                      <HiOutlineChevronLeft size={13} />
                    </button>,
                    ...visiblePages().map((p, i) =>
                      p === "…" ? (
                        <span key={i} style={{ width: 30, textAlign: "center", fontSize: 13, color: "var(--ord-text-muted)", lineHeight: "30px" }}>…</span>
                      ) : (
                        <button key={p} onClick={() => setPage(p)}
                          style={{
                            width: 30, height: 30, borderRadius: 5, border: "1px solid",
                            borderColor: page === p ? "var(--ord-text-primary)" : "var(--ord-border)",
                            background: page === p ? "var(--ord-text-primary)" : "var(--ord-card)",
                            color: page === p ? "var(--ord-page)" : "var(--ord-text-primary)",
                            fontSize: 13, fontWeight: page === p ? 700 : 400, cursor: "pointer",
                          }}
                        >{p}</button>
                      )
                    ),
                    <button key="next" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                      style={{ width: 30, height: 30, borderRadius: 5, border: "1px solid var(--ord-border)", background: "var(--ord-card)", cursor: page === totalPages ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: page === totalPages ? .3 : 1, color: "var(--ord-text-muted)" }}>
                      <HiOutlineChevronRight size={13} />
                    </button>
                  ]}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  ORDER DETAIL SLIDE-OVER                                           */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {panelId && (
        <>
          {/* Backdrop */}
          <div onClick={() => setPanelId(null)} style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,.45)",
            backdropFilter: "blur(2px)", zIndex: 1000, animation: "ord-fadeIn .2s ease",
          }} />

          {/* Panel */}
          <div style={{
            position: "fixed", top: 0, right: 0, bottom: 0, width: "min(520px, 100vw)",
            background: "var(--ord-panel-bg)", zIndex: 1001,
            display: "flex", flexDirection: "column",
            boxShadow: "-6px 0 32px rgba(0,0,0,.2)",
            animation: "ord-slideIn .25s cubic-bezier(.4,0,.2,1)",
            borderLeft: "1px solid var(--ord-panel-border)",
          }}>
            {/* Panel header */}
            <div style={{
              padding: "16px 20px", borderBottom: "1px solid var(--ord-panel-border)",
              background: "var(--ord-panel-header)",
              display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0,
            }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ord-text-primary)" }}>Order Details</div>
                <div style={{ fontSize: 12, color: "var(--ord-text-muted)", marginTop: 2 }}>
                  {panelLoading ? "Loading…" : order?.orderNumber || "—"}
                </div>
              </div>
              <button
                onClick={() => setPanelId(null)}
                style={{
                  width: 32, height: 32, borderRadius: 6, border: "none",
                  background: "var(--ord-shimmer)", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--ord-text-muted)",
                }}
              ><HiOutlineXMark size={17} /></button>
            </div>

            {/* Panel body */}
            <div className="ord-panel-scroll" style={{ flex: 1, overflowY: "auto" }}>
              {panelLoading ? (
                <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
                  {[80, 48, 48, 100, 48, 160].map((h, i) => (
                    <div key={i} style={{ height: h, borderRadius: 8, background: "var(--ord-shimmer)", animation: "ord-shimmer 1.4s ease infinite" }} />
                  ))}
                </div>
              ) : !order ? (
                <div style={{ padding: 48, textAlign: "center" }}>
                  <HiOutlineExclamationTriangle size={28} style={{ color: "#dc2626", display: "block", margin: "0 auto 12px" }} />
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ord-text-primary)" }}>Failed to load order</div>
                  <button
                    onClick={() => queryClient.invalidateQueries(["order-detail", panelId])}
                    style={{
                      marginTop: 14, padding: "7px 18px", background: "var(--ord-text-primary)",
                      border: "none", borderRadius: 6, color: "var(--ord-page)", fontSize: 13, cursor: "pointer",
                    }}
                  >Retry</button>
                </div>
              ) : (
                <div style={{ animation: "ord-fadeUp .25s ease" }}>

                  {/* ── Status banner ────────────────────────────────── */}
                  <div style={{
                    padding: "16px 20px",
                    background: order.status === "disputed"
                      ? "linear-gradient(135deg, #fef2f2, #fff5f5)"
                      : "linear-gradient(135deg, var(--ord-panel-header), var(--ord-panel-bg))",
                    borderBottom: "1px solid var(--ord-panel-border)",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                        background: order.status === "disputed" ? "#dc2626" : "var(--ord-text-primary)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: "0 2px 8px rgba(0,0,0,.15)",
                      }}>
                        {order.status === "disputed"
                          ? <HiOutlineShieldExclamation size={22} style={{ color: "#fff" }} />
                          : <HiOutlineShoppingBag size={22} style={{ color: "var(--ord-page)" }} />}
                      </div>
                      <div>
                        <StatusChip status={order.status} />
                        <div style={{ fontSize: 11, color: "var(--ord-text-muted)", marginTop: 4 }}>
                          Updated {formatRelativeTime(order.updatedAt)}
                        </div>
                      </div>
                    </div>
                    {/* Inline status change */}
                    <select
                      value={order.status}
                      onChange={e => statusMutation.mutate({ id: panelId, newStatus: e.target.value })}
                      className="ord-select"
                      style={{ fontSize: 11 }}
                    >
                      {Object.entries(STATUS).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* ── Financial split ──────────────────────────────── */}
                  <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--ord-panel-border)" }}>
                    <SectionLabel>Financial Breakdown</SectionLabel>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                      {[
                        { label: "Client Paid",     value: order.amount,        color: "var(--ord-text-primary)", icon: HiOutlineBanknotes },
                        { label: "Platform Fee",    value: order.platformFee,   color: "#6b7280",                 icon: HiOutlineReceiptPercent },
                        { label: "Editor Earns",    value: order.editorEarning, color: "#15803d",                 icon: HiOutlineCurrencyRupee },
                      ].map((f, i) => (
                        <div key={i} style={{
                          background: "var(--ord-shimmer)", border: "1px solid var(--ord-border)",
                          borderRadius: 8, padding: "12px 10px", textAlign: "center",
                        }}>
                          <f.icon size={16} style={{ color: f.color, display: "block", margin: "0 auto 6px" }} />
                          <div style={{ fontSize: 13, fontWeight: 700, color: f.color }}>
                            {formatCurrency(f.value)}
                          </div>
                          <div style={{ fontSize: 10, color: "var(--ord-text-muted)", marginTop: 2, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em" }}>
                            {f.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── Project info ─────────────────────────────────── */}
                  <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--ord-panel-border)" }}>
                    <SectionLabel>Project Information</SectionLabel>
                    <div style={{
                      background: "var(--ord-shimmer)", border: "1px solid var(--ord-border)",
                      borderRadius: 8, padding: 14,
                    }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ord-text-primary)", marginBottom: 6 }}>
                        {order.title}
                      </div>
                      {order.description && (
                        <div style={{
                          fontSize: 13, color: "var(--ord-text-muted)", lineHeight: 1.6,
                          borderLeft: "2px solid var(--ord-border)", paddingLeft: 10, marginBottom: 10,
                          fontStyle: "italic",
                        }}>
                          {order.description.length > 160 ? order.description.slice(0, 160) + "…" : order.description}
                        </div>
                      )}
                      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                        {order.type && (
                          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--ord-text-muted)" }}>
                            <HiOutlineBriefcase size={13} />
                            <span style={{ fontWeight: 600, textTransform: "capitalize" }}>{order.type}</span>
                          </div>
                        )}
                        {order.deadline && (
                          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--ord-text-muted)" }}>
                            <HiOutlineCalendarDays size={13} />
                            <span>Due: {formatDate(order.deadline)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ── Parties ──────────────────────────────────────── */}
                  <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--ord-panel-border)" }}>
                    <SectionLabel>Parties Involved</SectionLabel>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      {[
                        { role: "Client",  user: order.client,  icon: HiOutlineUser },
                        { role: "Editor",  user: order.editor,  icon: HiOutlineUserGroup },
                      ].map((p, i) => (
                        <div key={i} style={{
                          background: "var(--ord-shimmer)", border: "1px solid var(--ord-border)",
                          borderRadius: 8, padding: 12,
                        }}>
                          <div style={{ fontSize: 9.5, fontWeight: 700, color: "var(--ord-text-muted)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>
                            {p.role}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <UserAvatar src={p.user?.profilePicture} name={p.user?.name} size={30} />
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ord-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {p.user?.name}
                              </div>
                              <div style={{ fontSize: 11, color: "var(--ord-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {p.user?.email}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── Dispute resolution ───────────────────────────── */}
                  {order.status === "disputed" && (
                    <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--ord-panel-border)" }}>
                      <div style={{
                        background: "#fef2f2", border: "1px solid #fecaca",
                        borderRadius: 10, padding: 16,
                      }}>
                        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
                          <HiOutlineShieldExclamation size={18} style={{ color: "#dc2626" }} />
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#991b1b", textTransform: "uppercase", letterSpacing: ".05em" }}>
                            Active Dispute
                          </span>
                        </div>
                        {order.disputeReason && (
                          <div style={{
                            background: "#fff", border: "1px solid #fecaca", borderRadius: 6,
                            padding: "10px 12px", fontSize: 13, color: "#7f1d1d", marginBottom: 14,
                            lineHeight: 1.5,
                          }}>
                            <b style={{ display: "block", marginBottom: 4, fontSize: 11, textTransform: "uppercase", letterSpacing: ".06em" }}>Client reason:</b>
                            {order.disputeReason}
                          </div>
                        )}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                          <button
                            onClick={() => setDisputeConf({ orderId: panelId, resolution: "refunded_to_client" })}
                            disabled={disputeMutation.isPending}
                            style={{
                              padding: "9px 8px", background: "#dc2626", border: "none",
                              borderRadius: 7, color: "#fff", fontSize: 12, fontWeight: 700,
                              cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                            }}
                          >
                            <HiOutlineBanknotes size={16} />
                            Refund to Client
                          </button>
                          <button
                            onClick={() => setDisputeConf({ orderId: panelId, resolution: "released_to_editor" })}
                            disabled={disputeMutation.isPending}
                            style={{
                              padding: "9px 8px", background: "var(--ord-text-primary)", border: "none",
                              borderRadius: 7, color: "var(--ord-page)", fontSize: 12, fontWeight: 700,
                              cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                            }}
                          >
                            <HiOutlineCurrencyRupee size={16} />
                            Release to Editor
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── Timeline ─────────────────────────────────────── */}
                  {timelineEvents.length > 0 && (
                    <div style={{ padding: "16px 20px" }}>
                      <SectionLabel>Order Timeline</SectionLabel>
                      <div style={{ position: "relative", paddingLeft: 20 }}>
                        <div style={{
                          position: "absolute", left: 7, top: 8, bottom: 8, width: 2,
                          background: "var(--ord-border)", borderRadius: 1,
                        }} />
                        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                          {timelineEvents.map((ev, i) => (
                            <div key={i} style={{
                              position: "relative", paddingBottom: i < timelineEvents.length - 1 ? 20 : 0,
                            }}>
                              <div style={{
                                position: "absolute", left: -17, top: 2,
                                width: 14, height: 14, borderRadius: "50%",
                                background: ev.color, border: "2px solid var(--ord-panel-bg)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                              }}>
                                <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#fff" }} />
                              </div>
                              <div style={{
                                background: "var(--ord-shimmer)", border: "1px solid var(--ord-border)",
                                borderRadius: 7, padding: "9px 12px",
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                              }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <ev.icon size={14} style={{ color: ev.color, flexShrink: 0 }} />
                                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ord-text-primary)" }}>
                                    {ev.label}
                                  </span>
                                </div>
                                <span style={{ fontSize: 11, color: "var(--ord-text-muted)", whiteSpace: "nowrap" }}>
                                  {formatDate(ev.date)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── Metadata rows ─────────────────────────────────── */}
                  <div style={{ padding: "0 20px 20px" }}>
                    <SectionLabel>Technical Details</SectionLabel>
                    <InfoRow label="Order ID"     value={order._id}          mono />
                    <InfoRow label="Razorpay ID"  value={order.razorpayOrderId} mono />
                    <InfoRow label="Payment"      value={order.paymentStatus} />
                    <InfoRow label="Created"      value={formatDate(order.createdAt)} />
                    <InfoRow label="Last updated" value={formatDate(order.updatedAt)} />
                  </div>
                </div>
              )}
            </div>

            {/* Panel footer */}
            {order && (
              <div style={{
                padding: "13px 20px", borderTop: "1px solid var(--ord-panel-border)",
                background: "var(--ord-panel-header)", display: "flex", gap: 10, flexShrink: 0,
              }}>
                <button
                  onClick={() => { /* navigate to conversation */ }}
                  style={{
                    flex: 1, padding: "9px 0", background: "var(--ord-card)",
                    border: "1px solid var(--ord-border)", borderRadius: 7,
                    color: "var(--ord-text-primary)", fontSize: 13, fontWeight: 600,
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  }}
                  className="ord-btn"
                >
                  <HiOutlineChatBubbleLeftRight size={15} />
                  View Chat
                </button>
                <button
                  onClick={() => setPanelId(null)}
                  style={{
                    padding: "9px 20px", background: "transparent",
                    border: "1px solid var(--ord-border)", borderRadius: 7,
                    color: "var(--ord-text-muted)", fontSize: 13, cursor: "pointer",
                  }}
                  className="ord-btn"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  DISPUTE CONFIRMATION DIALOG                                        */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {disputeConf && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,.55)",
          zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
          animation: "ord-fadeIn .15s ease",
        }}>
          <div style={{
            background: "var(--ord-card)", borderRadius: 12, width: "100%", maxWidth: 400,
            overflow: "hidden", boxShadow: "0 12px 48px rgba(0,0,0,.24)",
            border: "1px solid var(--ord-border)",
          }}>
            <div style={{ padding: "20px 24px 16px" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  background: disputeConf.resolution === "refunded_to_client" ? "#fef2f2" : "#f0fdf4",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {disputeConf.resolution === "refunded_to_client"
                    ? <HiOutlineBanknotes size={20} style={{ color: "#dc2626" }} />
                    : <HiOutlineCurrencyRupee size={20} style={{ color: "#15803d" }} />}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ord-text-primary)", marginBottom: 6 }}>
                    {disputeConf.resolution === "refunded_to_client"
                      ? "Confirm Full Refund to Client"
                      : "Confirm Release to Editor"}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--ord-text-muted)", lineHeight: 1.6 }}>
                    {disputeConf.resolution === "refunded_to_client"
                      ? "The full order amount will be refunded to the client's original payment method. This action cannot be undone."
                      : "The escrowed amount will be released to the editor's account. This action cannot be undone."}
                  </div>
                </div>
              </div>
            </div>
            <div style={{
              padding: "12px 24px 20px",
              display: "flex", gap: 10, justifyContent: "flex-end",
            }}>
              <button
                onClick={() => setDisputeConf(null)}
                style={{
                  padding: "8px 18px", background: "var(--ord-card)",
                  border: "1px solid var(--ord-border)", borderRadius: 7,
                  fontSize: 13, color: "var(--ord-text-primary)", cursor: "pointer", fontWeight: 500,
                }}
                className="ord-btn"
              >Cancel</button>
              <button
                onClick={() => disputeMutation.mutate(disputeConf)}
                disabled={disputeMutation.isPending}
                style={{
                  padding: "8px 20px", border: "none", borderRadius: 7,
                  fontSize: 13, fontWeight: 700, cursor: "pointer",
                  background: disputeConf.resolution === "refunded_to_client" ? "#dc2626" : "#15803d",
                  color: "#fff",
                  opacity: disputeMutation.isPending ? .6 : 1,
                }}
              >
                {disputeMutation.isPending
                  ? "Processing…"
                  : disputeConf.resolution === "refunded_to_client"
                    ? "Confirm Refund"
                    : "Confirm Release"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Orders;