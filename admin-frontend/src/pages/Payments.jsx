// ─── Payments.jsx — Production Financial Dashboard ───────────────────────────
// Light/dark theme via CSS variables, self-contained, zero Tailwind dependency.
// Deps: @tanstack/react-query, react-hot-toast, react-icons/hi2, ../api/adminApi, ../utils/formatters

import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  HiOutlineBanknotes,
  HiOutlineCurrencyRupee,
  HiOutlineArrowUpRight,
  HiOutlineArrowDownLeft,
  HiOutlineShieldCheck,
  HiOutlineMagnifyingGlass,
  HiOutlineArrowDownTray,
  HiOutlineArrowPath,
  HiOutlineXMark,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineExclamationCircle,
  HiOutlineUser,
  HiOutlineUserGroup,
  HiOutlineDocumentText,
  HiOutlineReceiptPercent,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineHome,
  HiOutlineCalendarDays,
  HiOutlineEye,
  HiOutlineInformationCircle,
  HiOutlineArrowTrendingUp,
  HiOutlineArrowTrendingDown,
  HiMiniCheck,
} from "react-icons/hi2";
import { toast } from "react-hot-toast";
import { paymentsApi } from "../api/adminApi";
import { formatDate, formatCurrency, formatRelativeTime } from "../utils/formatters";

// ─────────────────────────────────────────────────────────────────────────────
// Status configs
// ─────────────────────────────────────────────────────────────────────────────
const TXN_STATUS = {
  completed: { label: "Completed", dot: "#22c55e", bg_l: "#f0fdf4", text_l: "#15803d", brd_l: "#bbf7d0", bg_d: "#14532d", text_d: "#86efac", brd_d: "#166534" },
  pending:   { label: "Pending",   dot: "#f59e0b", bg_l: "#fffbeb", text_l: "#b45309", brd_l: "#fde68a", bg_d: "#451a03", text_d: "#fcd34d", brd_d: "#78350f" },
  escrow:    { label: "In Escrow", dot: "#3b82f6", bg_l: "#eff6ff", text_l: "#1d4ed8", brd_l: "#bfdbfe", bg_d: "#1e3a5f", text_d: "#93c5fd", brd_d: "#1e40af" },
  refunded:  { label: "Refunded",  dot: "#ef4444", bg_l: "#fef2f2", text_l: "#b91c1c", brd_l: "#fecaca", bg_d: "#450a0a", text_d: "#fca5a5", brd_d: "#7f1d1d" },
  released:  { label: "Released",  dot: "#8b5cf6", bg_l: "#f5f3ff", text_l: "#6d28d9", brd_l: "#ddd6fe", bg_d: "#2e1065", text_d: "#c4b5fd", brd_d: "#5b21b6" },
  failed:    { label: "Failed",    dot: "#9ca3af", bg_l: "#f9fafb", text_l: "#374151", brd_l: "#e5e7eb", bg_d: "#111827", text_d: "#9ca3af", brd_d: "#374151" },
};

const PERIOD_OPTIONS = [
  { label: "7 days",  value: "7"  },
  { label: "30 days", value: "30" },
  { label: "90 days", value: "90" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Mini bar chart (pure SVG, no library needed)
// ─────────────────────────────────────────────────────────────────────────────
const MiniBarChart = ({ data = [], color = "#18181b", height = 44 }) => {
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  const w   = 100 / data.length;
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${data.length * 12} ${height}`} preserveAspectRatio="none"
      style={{ display: "block" }}>
      {data.map((d, i) => {
        const h = Math.max(2, (d.value / max) * (height - 4));
        return (
          <rect key={i} x={i * 12 + 2} y={height - h} width={9} height={h}
            rx="2" fill={color} opacity={i === data.length - 1 ? 1 : 0.35} />
        );
      })}
    </svg>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Small atoms
// ─────────────────────────────────────────────────────────────────────────────
const StatusBadge = ({ status, sm }) => {
  const cfg = TXN_STATUS[status] || TXN_STATUS.failed;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: sm ? "2px 8px" : "3px 10px", borderRadius: 999,
      fontSize: sm ? 10 : 11, fontWeight: 600, whiteSpace: "nowrap", lineHeight: 1.6,
      background: `var(--pay-badge-bg-${status}, ${cfg.bg_l})`,
      color:      `var(--pay-badge-text-${status}, ${cfg.text_l})`,
      border:     `1px solid var(--pay-badge-brd-${status}, ${cfg.brd_l})`,
    }}>
      <span style={{ width: sm ? 5 : 6, height: sm ? 5 : 6, borderRadius: "50%", background: cfg.dot, flexShrink: 0,
        ...(status === "completed" ? { animation: "pay-pulse 2s infinite" } : {}),
      }} />
      {cfg.label}
    </span>
  );
};

const UserAvatar = ({ src, name, size = 30 }) => {
  const [err, setErr] = useState(false);
  const initials = (name || "??").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const palette  = ["#1d4ed8","#6d28d9","#0369a1","#15803d","#b45309","#c2410c"];
  const bg       = palette[(name || "").charCodeAt(0) % palette.length];
  if (!err && src) return (
    <img src={src} alt={name} onError={() => setErr(true)} style={{
      width: size, height: size, borderRadius: "50%", objectFit: "cover",
      border: "2px solid var(--pay-surface)", flexShrink: 0,
    }} />
  );
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: bg, color: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.35, fontWeight: 700, flexShrink: 0,
      border: "2px solid var(--pay-surface)",
    }}>{initials}</div>
  );
};

const SkeletonRow = () => (
  <tr style={{ borderBottom: "1px solid var(--pay-row-brd)" }}>
    {[90, 80, 70, 70, 100, 70, 70].map((w, i) => (
      <td key={i} style={{ padding: "13px 12px" }}>
        <div style={{ height: 13, width: w, borderRadius: 4, background: "var(--pay-shimmer)",
          animation: "pay-shimmer 1.4s ease infinite" }} />
      </td>
    ))}
  </tr>
);

const SortTH = ({ label, field, sk, sd, onSort, style = {} }) => (
  <th onClick={() => onSort(field)} style={{
    padding: "10px 12px", fontSize: 11, fontWeight: 600, textAlign: "left",
    color: "var(--pay-text-muted)", textTransform: "uppercase", letterSpacing: ".07em",
    background: "var(--pay-thead)", borderBottom: "1px solid var(--pay-border)",
    cursor: "pointer", userSelect: "none", whiteSpace: "nowrap", ...style,
  }}>
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      {label}
      {sk === field
        ? sd === "asc"
          ? <HiOutlineChevronUp   size={11} style={{ color: "var(--pay-accent)" }} />
          : <HiOutlineChevronDown size={11} style={{ color: "var(--pay-accent)" }} />
        : <HiOutlineChevronDown size={11} style={{ opacity: .22 }} />}
    </span>
  </th>
);

const TH = ({ children, style = {} }) => (
  <th style={{
    padding: "10px 12px", fontSize: 11, fontWeight: 600, textAlign: "left",
    color: "var(--pay-text-muted)", textTransform: "uppercase", letterSpacing: ".07em",
    background: "var(--pay-thead)", borderBottom: "1px solid var(--pay-border)",
    whiteSpace: "nowrap", ...style,
  }}>{children}</th>
);

const InfoRow = ({ label, value, mono, accent, bold }) => (
  <div style={{
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "9px 0", borderBottom: "1px solid var(--pay-row-brd)",
  }}>
    <span style={{ fontSize: 13, color: "var(--pay-text-muted)" }}>{label}</span>
    <span style={{
      fontSize: mono ? 11 : 13, fontWeight: bold ? 700 : 600,
      color: accent || "var(--pay-text-primary)",
      fontFamily: mono ? "monospace" : "inherit",
      maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
    }}>{value || "—"}</span>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// KPI Card with optional sparkline
// ─────────────────────────────────────────────────────────────────────────────
const KpiCard = ({ label, value, sub, icon: Icon, iconColor, trend, trendLabel, sparkData, loading }) => (
  <div style={{
    background: "var(--pay-card)", border: "1px solid var(--pay-border)",
    borderRadius: 10, padding: "18px 20px",
    boxShadow: "0 1px 3px var(--pay-shadow)", flex: 1, minWidth: 180,
    display: "flex", flexDirection: "column", gap: 12,
  }}>
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
      <div style={{
        width: 38, height: 38, borderRadius: 9, background: iconColor + "18", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon size={18} style={{ color: iconColor }} />
      </div>
      {trend !== undefined && !loading && (
        <div style={{
          display: "flex", alignItems: "center", gap: 4,
          fontSize: 11, fontWeight: 700,
          color: trend >= 0 ? "#15803d" : "#b91c1c",
          background: trend >= 0 ? "#f0fdf4" : "#fef2f2",
          padding: "3px 8px", borderRadius: 999,
          border: `1px solid ${trend >= 0 ? "#bbf7d0" : "#fecaca"}`,
        }}>
          {trend >= 0
            ? <HiOutlineArrowTrendingUp size={12} />
            : <HiOutlineArrowTrendingDown size={12} />}
          {Math.abs(trend).toFixed(1)}%
        </div>
      )}
    </div>
    {loading ? (
      <div>
        <div style={{ height: 26, width: 100, borderRadius: 4, background: "var(--pay-shimmer)", marginBottom: 6, animation: "pay-shimmer 1.4s ease infinite" }} />
        <div style={{ height: 12, width: 70, borderRadius: 4, background: "var(--pay-shimmer)", animation: "pay-shimmer 1.4s ease infinite" }} />
      </div>
    ) : (
      <div>
        <div style={{ fontSize: 23, fontWeight: 800, color: "var(--pay-text-primary)", lineHeight: 1, letterSpacing: "-.3px" }}>
          {value}
        </div>
        <div style={{ fontSize: 12, color: "var(--pay-text-muted)", marginTop: 4 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: "var(--pay-text-muted)", marginTop: 2, opacity: .7 }}>{sub}</div>}
      </div>
    )}
    {sparkData && sparkData.length > 0 && !loading && (
      <div style={{ marginTop: -4 }}>
        <MiniBarChart data={sparkData} color={iconColor} height={36} />
      </div>
    )}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Top Earner row (reused for editors + clients)
// ─────────────────────────────────────────────────────────────────────────────
const TopRow = ({ rank, user, amount, sub }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: 12,
    padding: "10px 0", borderBottom: "1px solid var(--pay-row-brd)",
  }}>
    <div style={{
      width: 22, height: 22, borderRadius: 6, flexShrink: 0, fontSize: 11, fontWeight: 800,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: rank <= 3 ? ["#fef3c7","#f1f5f9","#fff7ed"][rank - 1] : "var(--pay-shimmer)",
      color: rank <= 3 ? ["#b45309","#475569","#c2410c"][rank - 1] : "var(--pay-text-muted)",
      border: "1px solid var(--pay-border)",
    }}>{rank}</div>
    <UserAvatar src={user?.profilePicture} name={user?.name} size={28} />
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--pay-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {user?.name}
      </div>
      <div style={{ fontSize: 11, color: "var(--pay-text-muted)" }}>{sub}</div>
    </div>
    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--pay-text-primary)", whiteSpace: "nowrap" }}>
      {formatCurrency(amount)}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
const Payments = () => {
  const queryClient = useQueryClient();

  const [page,        setPage]        = useState(1);
  const [pageSize,    setPageSize]    = useState(25);
  const [search,      setSearch]      = useState("");
  const [status,      setStatus]      = useState("all");
  const [sortKey,     setSortKey]     = useState("createdAt");
  const [sortDir,     setSortDir]     = useState("desc");
  const [period,      setPeriod]      = useState("30");
  const [panelId,     setPanelId]     = useState(null);
  const [activeLeader, setActiveLeader] = useState("editors"); // "editors" | "clients"
  const searchRef = useRef(null);

  // ── Queries ───────────────────────────────────────────────────────────────
  const { data: analytics, isLoading: aLoading } = useQuery({
    queryKey: ["payment-analytics", period],
    queryFn:  () => paymentsApi.getAnalytics({ period }).then(r => r.data.data ?? r.data),
    staleTime: 60_000,
  });

  const { data: txnData, isLoading: tLoading, isFetching } = useQuery({
    queryKey: ["transactions", page, pageSize, status, search, sortKey, sortDir],
    queryFn:  () => paymentsApi.getAll({
      page, limit: pageSize,
      status: status !== "all" ? status : undefined,
      search: search || undefined,
      sort: `${sortDir === "desc" ? "-" : ""}${sortKey}`,
    }).then(r => r.data),
    keepPreviousData: true,
    staleTime: 30_000,
  });

  const { data: panelData, isLoading: panelLoading } = useQuery({
    queryKey: ["txn-detail", panelId],
    queryFn:  () => paymentsApi.getById(panelId).then(r => r.data),
    enabled:  !!panelId,
    staleTime: 30_000,
  });

  // ── Derived ───────────────────────────────────────────────────────────────
  const txns       = txnData?.payments || [];
  const pagination = txnData?.pagination || {};
  const totalPages = pagination.pages || 1;
  const txn        = panelData;

  // Build sparkline data from daily revenue if available
  const sparkRevenue = analytics?.monthlyTrend?.slice(-14).map((m, i) => ({
    value: m.revenue || 0, label: m.month,
  })) || [];
  const sparkTxns = analytics?.monthlyTrend?.slice(-14).map(m => ({
    value: m.transactions || 0,
  })) || [];

  const handleSort = field => {
    if (sortKey === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(field); setSortDir("desc"); }
    setPage(1);
  };

  const handleExport = () => {
    toast.success("Preparing transaction export…");
  };

  const visiblePages = () => {
    const ps = [];
    const s  = Math.max(2, page - 1);
    const e  = Math.min(totalPages - 1, page + 1);
    ps.push(1);
    if (s > 2) ps.push("…");
    for (let i = s; i <= e; i++) ps.push(i);
    if (e < totalPages - 1) ps.push("…");
    if (totalPages > 1) ps.push(totalPages);
    return ps;
  };

  useEffect(() => {
    const h = e => { if (e.key === "Escape") setPanelId(null); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── CSS variables + keyframes ──────────────────────────────────── */}
      <style>{`
        :root {
          --pay-page:         #f8f9fa;
          --pay-card:         #ffffff;
          --pay-surface:      #ffffff;
          --pay-thead:        #f8f9fa;
          --pay-border:       #e5e7eb;
          --pay-row-brd:      #f3f4f6;
          --pay-shadow:       rgba(0,0,0,.06);
          --pay-shimmer:      #f1f3f4;
          --pay-text-primary: #111827;
          --pay-text-muted:   #6b7280;
          --pay-accent:       #111827;
          --pay-hover-row:    #f9fafb;
          --pay-input-brd:    #d1d5db;
          --pay-input-focus:  #111827;
          --pay-btn-bg:       #ffffff;
          --pay-btn-brd:      #d1d5db;
          --pay-btn-text:     #374151;
          --pay-panel-bg:     #ffffff;
          --pay-panel-hdr:    #f8f9fa;
          --pay-divider:      #f3f4f6;
        }
        @media (prefers-color-scheme: dark) {
          :root {
            --pay-page: #0a0a0a; --pay-card: #111111; --pay-surface: #111111;
            --pay-thead: #161616; --pay-border: #1f1f1f; --pay-row-brd: #191919;
            --pay-shadow: rgba(0,0,0,.3); --pay-shimmer: #1a1a1a;
            --pay-text-primary: #f3f4f6; --pay-text-muted: #6b7280; --pay-accent: #f3f4f6;
            --pay-hover-row: #161616;
            --pay-input-brd: #2a2a2a; --pay-input-focus: #f3f4f6;
            --pay-btn-bg: #161616; --pay-btn-brd: #2a2a2a; --pay-btn-text: #d1d5db;
            --pay-panel-bg: #111111; --pay-panel-hdr: #161616; --pay-divider: #191919;
          }
        }
        .dark {
          --pay-page: #0a0a0a; --pay-card: #111111; --pay-surface: #111111;
          --pay-thead: #161616; --pay-border: #1f1f1f; --pay-row-brd: #191919;
          --pay-shadow: rgba(0,0,0,.3); --pay-shimmer: #1a1a1a;
          --pay-text-primary: #f3f4f6; --pay-text-muted: #6b7280; --pay-accent: #f3f4f6;
          --pay-hover-row: #161616;
          --pay-input-brd: #2a2a2a; --pay-input-focus: #f3f4f6;
          --pay-btn-bg: #161616; --pay-btn-brd: #2a2a2a; --pay-btn-text: #d1d5db;
          --pay-panel-bg: #111111; --pay-panel-hdr: #161616; --pay-divider: #191919;
        }

        @keyframes pay-shimmer { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes pay-pulse   { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.6;transform:scale(.8)} }
        @keyframes pay-slideIn { from{transform:translateX(100%);opacity:0} to{transform:translateX(0);opacity:1} }
        @keyframes pay-fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes pay-fadeUp  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }

        .pay-row:hover td { background: var(--pay-hover-row) !important; }
        .pay-act { opacity:0; transition: opacity .15s; }
        .pay-row:hover .pay-act { opacity:1; }
        .pay-tbtn { background: var(--pay-btn-bg); border: 1px solid var(--pay-btn-brd); color: var(--pay-btn-text); cursor: pointer; border-radius: 6px; font-size: 13px; display:flex; align-items:center; gap:6px; padding:7px 14px; font-weight:500; transition:opacity .15s; }
        .pay-tbtn:hover { opacity:.8; }
        .pay-input { width:100%; box-sizing:border-box; padding:9px 12px 9px 38px; border:1px solid var(--pay-input-brd); border-radius:6px; font-size:13px; color:var(--pay-text-primary); background:var(--pay-card); outline:none; transition:border .15s; }
        .pay-input:focus { border-color: var(--pay-input-focus); }
        .pay-scroll::-webkit-scrollbar { width:4px; }
        .pay-scroll::-webkit-scrollbar-thumb { background:var(--pay-border); border-radius:2px; }
        .pay-seg-btn { padding:5px 14px; border-radius:999px; font-size:11px; font-weight:700; cursor:pointer; border:1px solid; transition:all .15s; }
        .pay-chip-btn { padding:4px 11px; border-radius:999px; font-size:11px; font-weight:600; cursor:pointer; border:1px solid; transition:all .15s; }
      `}</style>

      <div style={{ background: "var(--pay-page)", minHeight: "100vh", fontFamily: "system-ui,-apple-system,sans-serif" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* ── Breadcrumb ─────────────────────────────────────────────── */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--pay-text-muted)" }}>
            <HiOutlineHome size={14} />
            <span style={{ color: "var(--pay-border)" }}>/</span>
            <span>Admin</span>
            <span style={{ color: "var(--pay-border)" }}>/</span>
            <span style={{ color: "var(--pay-text-primary)", fontWeight: 600 }}>Payments</span>
          </div>

          {/* ── Page header ──────────────────────────────────────────────── */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "var(--pay-text-primary)", letterSpacing: "-.3px" }}>
                Payments
              </h1>
              <p style={{ margin: "4px 0 0", fontSize: 14, color: "var(--pay-text-muted)" }}>
                Platform revenue, escrow flows, and transaction audit logs.
              </p>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              {/* Period selector */}
              <div style={{ display: "flex", gap: 4, background: "var(--pay-card)", border: "1px solid var(--pay-border)", borderRadius: 8, padding: 3 }}>
                {PERIOD_OPTIONS.map(p => (
                  <button key={p.value} onClick={() => setPeriod(p.value)}
                    className="pay-seg-btn"
                    style={{
                      background: period === p.value ? "var(--pay-text-primary)" : "transparent",
                      color:      period === p.value ? "var(--pay-page)"         : "var(--pay-text-muted)",
                      borderColor: period === p.value ? "transparent"            : "transparent",
                    }}
                  >{p.label}</button>
                ))}
              </div>
              <button onClick={() => queryClient.invalidateQueries(["payment-analytics"])} className="pay-tbtn">
                <HiOutlineArrowPath size={15} style={isFetching ? { animation: "pay-shimmer .6s linear infinite" } : {}} />
                Refresh
              </button>
              <button onClick={handleExport} style={{
                display: "flex", alignItems: "center", gap: 6, padding: "7px 14px",
                background: "var(--pay-text-primary)", border: "none", borderRadius: 6,
                fontSize: 13, color: "var(--pay-page)", cursor: "pointer", fontWeight: 600,
              }}>
                <HiOutlineArrowDownTray size={15} /> Export
              </button>
            </div>
          </div>

          {/* ── KPI cards ─────────────────────────────────────────────────── */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <KpiCard
              label="Gross Revenue"
              value={formatCurrency(analytics?.revenue?.total || 0)}
              sub={`${period}-day period`}
              icon={HiOutlineCurrencyRupee}
              iconColor="#6d28d9"
              trend={analytics?.summary?.revenueGrowth}
              sparkData={sparkRevenue}
              loading={aLoading}
            />
            <KpiCard
              label="Platform Fees"
              value={formatCurrency(analytics?.platformFees?.total || analytics?.revenue?.platformFees || 0)}
              sub="Net platform earnings"
              icon={HiOutlineReceiptPercent}
              iconColor="#15803d"
              trend={analytics?.summary?.feeGrowth}
              loading={aLoading}
            />
            <KpiCard
              label="In Escrow"
              value={formatCurrency(analytics?.paymentsByStatus?.escrow?.amount || analytics?.inEscrow?.amount || 0)}
              sub={`${analytics?.paymentsByStatus?.escrow?.count || analytics?.inEscrow?.count || 0} transactions held`}
              icon={HiOutlineShieldCheck}
              iconColor="#0369a1"
              loading={aLoading}
            />
            <KpiCard
              label="Total Refunds"
              value={formatCurrency(analytics?.refunds?.totalAmount || analytics?.refunded?.amount || 0)}
              sub={`${analytics?.refunds?.count || analytics?.refunded?.count || 0} refund events`}
              icon={HiOutlineArrowDownLeft}
              iconColor="#b91c1c"
              loading={aLoading}
            />
          </div>

          {/* ── Two-column: Leaderboard + Flow Summary ─────────────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, flexWrap: "wrap" }}>

            {/* Leaderboard */}
            <div style={{
              background: "var(--pay-card)", border: "1px solid var(--pay-border)",
              borderRadius: 10, overflow: "hidden", boxShadow: "0 1px 3px var(--pay-shadow)",
            }}>
              {/* Tab header */}
              <div style={{
                padding: "14px 18px", borderBottom: "1px solid var(--pay-border)",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--pay-text-primary)" }}>
                  Top Performers
                </span>
                <div style={{ display: "flex", gap: 4, background: "var(--pay-page)", borderRadius: 8, padding: 3, border: "1px solid var(--pay-border)" }}>
                  {[["editors","Editors"],["clients","Clients"]].map(([v, l]) => (
                    <button key={v} onClick={() => setActiveLeader(v)}
                      className="pay-seg-btn"
                      style={{
                        background:  activeLeader === v ? "var(--pay-text-primary)" : "transparent",
                        color:       activeLeader === v ? "var(--pay-page)"         : "var(--pay-text-muted)",
                        borderColor: "transparent",
                        fontSize: 11,
                      }}
                    >{l}</button>
                  ))}
                </div>
              </div>
              <div style={{ padding: "4px 18px 14px" }}>
                {aLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} style={{ padding: "12px 0", borderBottom: "1px solid var(--pay-row-brd)", display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 22, height: 22, borderRadius: 6, background: "var(--pay-shimmer)", animation: "pay-shimmer 1.4s ease infinite" }} />
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--pay-shimmer)", animation: "pay-shimmer 1.4s ease infinite" }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ height: 13, width: 100, borderRadius: 4, background: "var(--pay-shimmer)", marginBottom: 4, animation: "pay-shimmer 1.4s ease infinite" }} />
                        <div style={{ height: 10, width: 60, borderRadius: 4, background: "var(--pay-shimmer)", animation: "pay-shimmer 1.4s ease infinite" }} />
                      </div>
                      <div style={{ height: 13, width: 60, borderRadius: 4, background: "var(--pay-shimmer)", animation: "pay-shimmer 1.4s ease infinite" }} />
                    </div>
                  ))
                ) : activeLeader === "editors" ? (
                  (analytics?.topEditors || []).slice(0, 6).map((e, i) => (
                    <TopRow key={i} rank={i + 1} user={e} amount={e.totalEarnings || e.earnings} sub={`${e.orderCount || e.orders || 0} orders`} />
                  ))
                ) : (
                  (analytics?.topClients || []).slice(0, 6).map((c, i) => (
                    <TopRow key={i} rank={i + 1} user={c} amount={c.totalSpent || c.spent} sub={`${c.orderCount || c.orders || 0} orders`} />
                  ))
                )}
                {!aLoading && (activeLeader === "editors" ? analytics?.topEditors : analytics?.topClients)?.length === 0 && (
                  <div style={{ padding: "28px 0", textAlign: "center", color: "var(--pay-text-muted)", fontSize: 13 }}>
                    No data available for this period.
                  </div>
                )}
              </div>
            </div>

            {/* Flow summary */}
            <div style={{
              background: "var(--pay-card)", border: "1px solid var(--pay-border)",
              borderRadius: 10, overflow: "hidden", boxShadow: "0 1px 3px var(--pay-shadow)",
            }}>
              <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--pay-border)" }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--pay-text-primary)" }}>Payment Flow</span>
              </div>
              <div style={{ padding: "14px 18px" }}>
                {/* Flow diagram — simple visual breakdown */}
                {aLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} style={{ padding: "10px 0", borderBottom: "1px solid var(--pay-row-brd)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ height: 13, width: 80, borderRadius: 4, background: "var(--pay-shimmer)", animation: "pay-shimmer 1.4s ease infinite" }} />
                      <div style={{ height: 13, width: 60, borderRadius: 4, background: "var(--pay-shimmer)", animation: "pay-shimmer 1.4s ease infinite" }} />
                    </div>
                  ))
                ) : (
                  <>
                    {/* Visual funnel bars */}
                    {[
                      { label: "Total Collected",   value: analytics?.revenue?.total    || 0, color: "#6d28d9", width: 100 },
                      { label: "Held in Escrow",    value: analytics?.inEscrow?.amount  || analytics?.paymentsByStatus?.escrow?.amount || 0,  color: "#0369a1", width: 72 },
                      { label: "Released to Editors", value: analytics?.released?.amount || analytics?.paymentsByStatus?.released?.amount || 0, color: "#15803d", width: 58 },
                      { label: "Platform Revenue",  value: analytics?.platformFees?.total || 0, color: "#b45309", width: 22 },
                      { label: "Refunded",          value: analytics?.refunds?.totalAmount || analytics?.refunded?.amount || 0, color: "#b91c1c", width: 10 },
                    ].map((item, i) => (
                      <div key={i} style={{ marginBottom: 14 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                          <span style={{ fontSize: 12, color: "var(--pay-text-muted)", fontWeight: 500 }}>{item.label}</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--pay-text-primary)" }}>
                            {formatCurrency(item.value)}
                          </span>
                        </div>
                        <div style={{ height: 6, background: "var(--pay-shimmer)", borderRadius: 999, overflow: "hidden" }}>
                          <div style={{
                            height: "100%", width: `${item.width}%`, borderRadius: 999,
                            background: item.color, transition: "width .6s cubic-bezier(.4,0,.2,1)",
                          }} />
                        </div>
                      </div>
                    ))}

                    {/* Quick stats grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 18, paddingTop: 14, borderTop: "1px solid var(--pay-border)" }}>
                      {[
                        { label: "Total Transactions", value: (analytics?.transactions?.total || analytics?.revenue?.totalTransactions || 0).toLocaleString() },
                        { label: "Avg Order Value",    value: formatCurrency(analytics?.summary?.avgOrderValue || 0) },
                        { label: "Completed Rate",     value: analytics?.summary?.completionRate ? `${analytics.summary.completionRate}%` : "—" },
                        { label: "This Month",         value: formatCurrency(analytics?.revenue?.monthly || analytics?.revenue?.month || 0) },
                      ].map((s, i) => (
                        <div key={i} style={{
                          background: "var(--pay-page)", border: "1px solid var(--pay-border)",
                          borderRadius: 8, padding: "10px 12px",
                        }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--pay-text-primary)" }}>{s.value}</div>
                          <div style={{ fontSize: 11, color: "var(--pay-text-muted)", marginTop: 2 }}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ── Transactions table ─────────────────────────────────────────── */}
          <div style={{
            background: "var(--pay-card)", border: "1px solid var(--pay-border)",
            borderRadius: 10, overflow: "hidden", boxShadow: "0 1px 3px var(--pay-shadow)",
          }}>
            {/* Toolbar */}
            <div style={{
              padding: "12px 16px", borderBottom: "1px solid var(--pay-border)",
              display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
            }}>
              <div style={{ flex: 1, position: "relative", minWidth: 260 }}>
                <HiOutlineMagnifyingGlass size={15} style={{
                  position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)",
                  color: "var(--pay-text-muted)", pointerEvents: "none",
                }} />
                <input ref={searchRef} type="text" placeholder="Search by receipt, transaction ID or client…"
                  className="pay-input" value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }} />
                {search && (
                  <button onClick={() => { setSearch(""); setPage(1); searchRef.current?.focus(); }}
                    style={{ position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--pay-text-muted)", display: "flex", alignItems: "center", padding: 2 }}>
                    <HiOutlineXMark size={14} />
                  </button>
                )}
              </div>

              {/* Status chips */}
              <div style={{ display: "flex", gap: 5, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, color: "var(--pay-text-muted)", fontWeight: 500 }}>Status:</span>
                {[
                  ["all","All"],
                  ["completed","Completed"],
                  ["pending","Pending"],
                  ["escrow","Escrow"],
                  ["refunded","Refunded"],
                ].map(([v, l]) => (
                  <button key={v} onClick={() => { setStatus(v); setPage(1); }}
                    className="pay-chip-btn"
                    style={{
                      background:  status === v ? "var(--pay-text-primary)" : "transparent",
                      color:       status === v ? "var(--pay-page)"         : "var(--pay-text-muted)",
                      borderColor: status === v ? "var(--pay-text-primary)" : "var(--pay-border)",
                    }}
                  >{l}</button>
                ))}
              </div>

              {/* Page size */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
                <span style={{ fontSize: 12, color: "var(--pay-text-muted)" }}>Rows:</span>
                <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                  style={{ background: "var(--pay-card)", border: "1px solid var(--pay-btn-brd)", color: "var(--pay-text-primary)", borderRadius: 6, padding: "5px 8px", fontSize: 12, outline: "none", cursor: "pointer" }}>
                  {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 780 }}>
                <thead>
                  <tr>
                    <SortTH label="Receipt"      field="receiptNumber" sk={sortKey} sd={sortDir} onSort={handleSort} style={{ minWidth: 120 }} />
                    <SortTH label="Gross Amount" field="amount"        sk={sortKey} sd={sortDir} onSort={handleSort} />
                    <TH>Platform Fee</TH>
                    <TH>Editor Payout</TH>
                    <TH style={{ minWidth: 140 }}>Client</TH>
                    <TH>Status</TH>
                    <SortTH label="Date"         field="createdAt"     sk={sortKey} sd={sortDir} onSort={handleSort} style={{ minWidth: 110 }} />
                    <TH style={{ textAlign: "right" }}>Actions</TH>
                  </tr>
                </thead>
                <tbody>
                  {tLoading ? (
                    Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                  ) : txns.length === 0 ? (
                    <tr>
                      <td colSpan={8}>
                        <div style={{ padding: "56px 0", textAlign: "center" }}>
                          <div style={{ width: 48, height: 48, borderRadius: 10, border: "2px dashed var(--pay-border)", background: "var(--pay-shimmer)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                            <HiOutlineBanknotes size={20} style={{ color: "var(--pay-text-muted)", opacity: .5 }} />
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--pay-text-primary)", marginBottom: 5 }}>
                            No transactions found
                          </div>
                          <div style={{ fontSize: 13, color: "var(--pay-text-muted)" }}>
                            {status !== "all" || search ? "Try adjusting the search or status filter." : "Transactions will appear here once orders are paid."}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : txns.map(t => (
                    <tr key={t._id} className="pay-row" style={{ borderBottom: "1px solid var(--pay-row-brd)", transition: "background .1s" }}>
                      <td style={{ padding: "12px 12px" }}>
                        <span style={{
                          fontFamily: "monospace", fontSize: 11, fontWeight: 700,
                          color: "var(--pay-text-primary)", background: "var(--pay-shimmer)",
                          padding: "2px 6px", borderRadius: 4, border: "1px solid var(--pay-border)",
                        }}>
                          {t.receiptNumber || t.transactionId?.substring(0, 10) || "—"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 12px" }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--pay-text-primary)" }}>
                          {formatCurrency(t.amount)}
                        </span>
                      </td>
                      <td style={{ padding: "12px 12px" }}>
                        <span style={{ fontSize: 12, color: "var(--pay-text-muted)", fontWeight: 600 }}>
                          {formatCurrency(t.platformFee)}
                        </span>
                      </td>
                      <td style={{ padding: "12px 12px" }}>
                        <span style={{ fontSize: 12, color: "#15803d", fontWeight: 700 }}>
                          {formatCurrency(t.editorEarning || (t.amount - (t.platformFee || 0)))}
                        </span>
                      </td>
                      <td style={{ padding: "12px 12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <UserAvatar src={t.client?.profilePicture} name={t.client?.name} size={24} />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--pay-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 120 }}>
                              {t.client?.name || "—"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "12px 12px" }}>
                        <StatusBadge status={t.status || t.paymentStatus || "pending"} />
                      </td>
                      <td style={{ padding: "12px 12px", fontSize: 12, color: "var(--pay-text-muted)", whiteSpace: "nowrap" }}>
                        {formatDate(t.createdAt)}
                      </td>
                      <td style={{ padding: "12px 12px", textAlign: "right" }}>
                        <button
                          onClick={() => setPanelId(t._id)}
                          className="pay-act pay-tbtn"
                          style={{ padding: "5px 12px", fontSize: 12, fontWeight: 600 }}
                        >
                          <HiOutlineEye size={13} /> Audit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!tLoading && txns.length > 0 && (
              <div style={{
                padding: "12px 16px", borderTop: "1px solid var(--pay-border)",
                display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
              }}>
                <div style={{ fontSize: 13, color: "var(--pay-text-muted)" }}>
                  Showing{" "}
                  <b style={{ color: "var(--pay-text-primary)" }}>
                    {((pagination.page - 1) * pageSize) + 1}–{Math.min(pagination.page * pageSize, pagination.total)}
                  </b>
                  {" "}of{" "}
                  <b style={{ color: "var(--pay-text-primary)" }}>{pagination.total?.toLocaleString()}</b>
                </div>
                <div style={{ display: "flex", gap: 3 }}>
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    style={{ width: 30, height: 30, borderRadius: 5, border: "1px solid var(--pay-border)", background: "var(--pay-card)", cursor: page === 1 ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: page === 1 ? .3 : 1, color: "var(--pay-text-muted)" }}>
                    <HiOutlineChevronLeft size={13} />
                  </button>
                  {visiblePages().map((p, i) =>
                    p === "…" ? (
                      <span key={i} style={{ width: 30, textAlign: "center", fontSize: 13, color: "var(--pay-text-muted)", lineHeight: "30px" }}>…</span>
                    ) : (
                      <button key={p} onClick={() => setPage(p)}
                        style={{ width: 30, height: 30, borderRadius: 5, border: "1px solid", borderColor: page === p ? "var(--pay-text-primary)" : "var(--pay-border)", background: page === p ? "var(--pay-text-primary)" : "var(--pay-card)", color: page === p ? "var(--pay-page)" : "var(--pay-text-primary)", fontSize: 13, fontWeight: page === p ? 700 : 400, cursor: "pointer" }}>
                        {p}
                      </button>
                    )
                  )}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    style={{ width: 30, height: 30, borderRadius: 5, border: "1px solid var(--pay-border)", background: "var(--pay-card)", cursor: page === totalPages ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: page === totalPages ? .3 : 1, color: "var(--pay-text-muted)" }}>
                    <HiOutlineChevronRight size={13} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  TRANSACTION AUDIT SLIDE-OVER                                       */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {panelId && (
        <>
          <div onClick={() => setPanelId(null)} style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", backdropFilter: "blur(2px)",
            zIndex: 1000, animation: "pay-fadeIn .2s ease",
          }} />
          <div style={{
            position: "fixed", top: 0, right: 0, bottom: 0, width: "min(480px, 100vw)",
            background: "var(--pay-panel-bg)", zIndex: 1001,
            display: "flex", flexDirection: "column",
            boxShadow: "-6px 0 32px rgba(0,0,0,.2)",
            animation: "pay-slideIn .25s cubic-bezier(.4,0,.2,1)",
            borderLeft: "1px solid var(--pay-border)",
          }}>
            {/* Header */}
            <div style={{
              padding: "16px 20px", borderBottom: "1px solid var(--pay-border)",
              background: "var(--pay-panel-hdr)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0,
            }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--pay-text-primary)" }}>Transaction Audit</div>
                <div style={{ fontSize: 12, color: "var(--pay-text-muted)", marginTop: 2, fontFamily: "monospace" }}>
                  {panelLoading ? "Loading…" : txn?.receiptNumber || txn?.transactionId?.slice(0, 14) || "—"}
                </div>
              </div>
              <button onClick={() => setPanelId(null)} style={{ width: 32, height: 32, borderRadius: 6, border: "none", background: "var(--pay-shimmer)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--pay-text-muted)" }}>
                <HiOutlineXMark size={17} />
              </button>
            </div>

            {/* Body */}
            <div className="pay-scroll" style={{ flex: 1, overflowY: "auto" }}>
              {panelLoading ? (
                <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
                  {[80, 48, 48, 120, 48, 48, 80].map((h, i) => (
                    <div key={i} style={{ height: h, borderRadius: 8, background: "var(--pay-shimmer)", animation: "pay-shimmer 1.4s ease infinite" }} />
                  ))}
                </div>
              ) : !txn ? (
                <div style={{ padding: 48, textAlign: "center" }}>
                  <HiOutlineExclamationCircle size={28} style={{ color: "#dc2626", display: "block", margin: "0 auto 12px" }} />
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--pay-text-primary)", marginBottom: 6 }}>Transaction not found</div>
                  <button onClick={() => queryClient.invalidateQueries(["txn-detail", panelId])}
                    style={{ padding: "7px 18px", background: "var(--pay-text-primary)", border: "none", borderRadius: 6, color: "var(--pay-page)", fontSize: 13, cursor: "pointer" }}>
                    Retry
                  </button>
                </div>
              ) : (
                <div style={{ animation: "pay-fadeUp .25s ease" }}>

                  {/* ── Receipt hero ─────────────────────────────────── */}
                  <div style={{
                    margin: 16, borderRadius: 10, padding: "20px 20px 16px",
                    background: "var(--pay-page)", border: "1px solid var(--pay-border)",
                    position: "relative", overflow: "hidden",
                  }}>
                    {/* Watermark */}
                    <HiOutlineBanknotes size={100} style={{
                      position: "absolute", right: -10, top: -10, opacity: .04,
                      color: "var(--pay-text-primary)",
                    }} />
                    <div style={{ textAlign: "center", position: "relative" }}>
                      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--pay-text-muted)", marginBottom: 6 }}>
                        Settlement Receipt
                      </div>
                      <div style={{ fontSize: 32, fontWeight: 800, color: "var(--pay-text-primary)", letterSpacing: "-.5px", marginBottom: 8 }}>
                        {formatCurrency(txn.amount)}
                      </div>
                      <StatusBadge status={txn.status || txn.paymentStatus || "pending"} />
                    </div>

                    {/* 3-way split */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 18, paddingTop: 16, borderTop: "1px dashed var(--pay-border)" }}>
                      {[
                        { label: "Platform",  value: txn.platformFee,    color: "#b45309" },
                        { label: "Editor",    value: txn.editorEarning || (txn.amount - (txn.platformFee || 0)), color: "#15803d" },
                        { label: "Tax / GST", value: txn.tax || 0,       color: "var(--pay-text-muted)" },
                      ].map((s, i) => (
                        <div key={i} style={{ textAlign: "center", padding: "8px 4px", background: "var(--pay-card)", borderRadius: 7, border: "1px solid var(--pay-border)" }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{formatCurrency(s.value)}</div>
                          <div style={{ fontSize: 10, color: "var(--pay-text-muted)", marginTop: 2, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em" }}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── Technical details ─────────────────────────────── */}
                  <div style={{ padding: "0 20px 16px" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--pay-text-muted)", marginBottom: 10, marginTop: 4 }}>
                      Transaction Details
                    </div>
                    <InfoRow label="Transaction ID"  value={txn.transactionId}        mono />
                    <InfoRow label="Receipt Number"  value={txn.receiptNumber}         mono />
                    <InfoRow label="Razorpay Order"  value={txn.razorpayOrderId}        mono />
                    <InfoRow label="Razorpay Pay ID" value={txn.razorpayPaymentId}      mono />
                    <InfoRow label="Payment Method"  value={txn.paymentMethod}              />
                    <InfoRow label="Currency"        value={txn.currency || "INR"}          />
                    <InfoRow label="Settled On"      value={formatDate(txn.createdAt)}      />
                  </div>

                  {/* ── Parties ──────────────────────────────────────── */}
                  <div style={{ padding: "14px 20px", borderTop: "1px solid var(--pay-divider)" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--pay-text-muted)", marginBottom: 12 }}>
                      Counterparties
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      {[
                        { role: "Originator (Client)", user: txn.client },
                        { role: "Beneficiary (Editor)", user: txn.editor },
                      ].map((p, i) => (
                        <div key={i} style={{
                          background: "var(--pay-page)", border: "1px solid var(--pay-border)", borderRadius: 8, padding: 12,
                        }}>
                          <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--pay-text-muted)", marginBottom: 8 }}>{p.role}</div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <UserAvatar src={p.user?.profilePicture} name={p.user?.name} size={28} />
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--pay-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.user?.name}</div>
                              <div style={{ fontSize: 11, color: "var(--pay-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.user?.email}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── Linked order ─────────────────────────────────── */}
                  {(txn.order || txn.orderSnapshot) && (
                    <div style={{ padding: "14px 20px", borderTop: "1px solid var(--pay-divider)" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--pay-text-muted)", marginBottom: 10 }}>
                        Linked Order
                      </div>
                      <div style={{ background: "var(--pay-page)", border: "1px solid var(--pay-border)", borderRadius: 8, padding: 14 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                          <HiOutlineDocumentText size={14} style={{ color: "var(--pay-text-muted)" }} />
                          <span style={{ fontFamily: "monospace", fontSize: 11, fontWeight: 700, color: "var(--pay-text-primary)", background: "var(--pay-shimmer)", padding: "1px 6px", borderRadius: 4, border: "1px solid var(--pay-border)" }}>
                            {(txn.order || txn.orderSnapshot)?.orderNumber || "—"}
                          </span>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--pay-text-primary)" }}>
                          {(txn.order || txn.orderSnapshot)?.title}
                        </div>
                        {(txn.order || txn.orderSnapshot)?.description && (
                          <div style={{ fontSize: 12, color: "var(--pay-text-muted)", marginTop: 4, fontStyle: "italic", lineHeight: 1.5,
                            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                            {(txn.order || txn.orderSnapshot).description}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ── Integrity note ───────────────────────────────── */}
                  <div style={{ padding: "14px 20px 24px", borderTop: "1px solid var(--pay-divider)" }}>
                    <div style={{
                      background: "#eff6ff", border: "1px solid #bfdbfe",
                      borderRadius: 8, padding: "12px 14px",
                      display: "flex", gap: 10, alignItems: "flex-start",
                    }}>
                      <HiOutlineInformationCircle size={16} style={{ color: "#1d4ed8", flexShrink: 0, marginTop: 1 }} />
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#1d4ed8", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 3 }}>
                          Audit Record
                        </div>
                        <div style={{ fontSize: 12, color: "#1e40af", lineHeight: 1.6 }}>
                          This transaction is immutably recorded. Discrepancies should be escalated to finance for manual ledger reconciliation.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: "13px 20px", borderTop: "1px solid var(--pay-border)",
              background: "var(--pay-panel-hdr)", display: "flex", gap: 10, flexShrink: 0,
            }}>
              <button
                onClick={() => { toast.success("Receipt download initiated"); }}
                style={{
                  flex: 1, padding: "9px 0", background: "var(--pay-text-primary)",
                  border: "none", borderRadius: 7, color: "var(--pay-page)",
                  fontSize: 13, fontWeight: 600, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}
              >
                <HiOutlineArrowDownTray size={14} /> Download Receipt
              </button>
              <button onClick={() => setPanelId(null)} className="pay-tbtn"
                style={{ padding: "9px 20px" }}>Close</button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Payments;