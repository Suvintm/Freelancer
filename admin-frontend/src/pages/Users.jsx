// ─── Users.jsx — Production User Management (Google Cloud Console style) ─────
// Light-theme, fully responsive, self-contained sub-components.
// Deps: @tanstack/react-query, react-hot-toast, react-icons/hi2, ../api/adminApi, ../utils/formatters

import { useState, useCallback, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  HiOutlineUser,
  HiOutlineEnvelope,
  HiOutlineShieldCheck,
  HiOutlineNoSymbol,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineMagnifyingGlass,
  HiOutlineUserGroup,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineArrowDownTray,
  HiOutlineXMark,
  HiOutlineExclamationCircle,
  HiOutlineIdentification,
  HiOutlineShoppingCart,
  HiOutlineGlobeAlt,
  HiOutlineArrowPath,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineFunnel,
  HiOutlineEllipsisVertical,
  HiOutlineEye,
  HiOutlineTrash,
  HiMiniCheck,
  HiOutlineBell,
  HiOutlineHome,
} from "react-icons/hi2";
import { toast } from "react-hot-toast";
import { usersApi } from "../api/adminApi";
import { formatDate, formatRelativeTime } from "../utils/formatters";

// ─────────────────────────────────────────────────────────────────────────────
// Design Tokens (Google Cloud–inspired, light mode)
// ─────────────────────────────────────────────────────────────────────────────
const T = {
  blue:       { bg: "#e8f0fe", text: "#1a73e8", border: "#c5d9f8", dot: "#1a73e8" },
  purple:     { bg: "#f3e8fd", text: "#7b2d8b", border: "#dbb8f5", dot: "#9334ea" },
  green:      { bg: "#e6f4ea", text: "#137333", border: "#b7dfbe", dot: "#34a853" },
  red:        { bg: "#fce8e6", text: "#c5221f", border: "#f5c6c2", dot: "#ea4335" },
  amber:      { bg: "#fef7e0", text: "#b06000", border: "#f9dfa0", dot: "#fbbc04" },
  gray:       { bg: "#f1f3f4", text: "#5f6368", border: "#dadce0", dot: "#9aa0a6" },
};

const ROLE_T   = { editor: T.purple, client: T.blue,  admin: T.green };
const KYC_T    = { verified: T.green, submitted: T.amber, rejected: T.red, not_submitted: T.gray };
const STATUS_T = { active: T.green, banned: T.red };

// ─────────────────────────────────────────────────────────────────────────────
// Sub-Components (inline, no external imports needed)
// ─────────────────────────────────────────────────────────────────────────────

/** Pill badge with dot indicator */
const Chip = ({ label, token, dot = true, sm = false }) => {
  const t = token || T.gray;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: sm ? "2px 8px" : "3px 10px",
      borderRadius: 999, fontSize: sm ? 11 : 12, fontWeight: 600,
      background: t.bg, color: t.text,
      border: `1px solid ${t.border}`, whiteSpace: "nowrap",
      lineHeight: 1.5,
    }}>
      {dot && (
        <span style={{
          width: 6, height: 6, borderRadius: "50%",
          background: t.dot, flexShrink: 0,
          ...(label === "Active" ? { animation: "pulse 2s infinite" } : {}),
        }} />
      )}
      {label}
    </span>
  );
};

/** User avatar with initials fallback */
const Avatar = ({ src, name, size = 36 }) => {
  const [err, setErr] = useState(false);
  const initials = (name || "??").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const colors   = ["#1a73e8","#9334ea","#34a853","#ea4335","#f29900","#00897b"];
  const color    = colors[(name || "").charCodeAt(0) % colors.length];

  if (!err && src) return (
    <img src={src} alt={name} onError={() => setErr(true)}
      style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover",
               border: "2px solid #fff", boxShadow: "0 1px 3px rgba(0,0,0,.12)", flexShrink: 0 }}
    />
  );
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: color, color: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.35, fontWeight: 700, flexShrink: 0,
      border: "2px solid #fff", boxShadow: "0 1px 3px rgba(0,0,0,.12)",
    }}>{initials}</div>
  );
};

/** Top-of-page stat card */
const StatCard = ({ label, value, icon: Icon, color, loading }) => (
  <div style={{
    background: "#fff", border: "1px solid #dadce0", borderRadius: 8,
    padding: "16px 20px", display: "flex", alignItems: "center", gap: 16,
    boxShadow: "0 1px 2px rgba(0,0,0,.06)", flex: 1, minWidth: 160,
  }}>
    <div style={{
      width: 40, height: 40, borderRadius: 8,
      background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>
      <Icon size={20} style={{ color }} />
    </div>
    {loading ? (
      <div>
        <div style={{ height: 22, width: 48, borderRadius: 4, background: "#f1f3f4", marginBottom: 4 }} />
        <div style={{ height: 13, width: 72, borderRadius: 4, background: "#f1f3f4" }} />
      </div>
    ) : (
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, color: "#202124", lineHeight: 1.2 }}>
          {(value ?? 0).toLocaleString()}
        </div>
        <div style={{ fontSize: 12, color: "#5f6368", marginTop: 1 }}>{label}</div>
      </div>
    )}
  </div>
);

/** Table skeleton row */
const SkeletonRow = () => (
  <tr style={{ borderBottom: "1px solid #f1f3f4" }}>
    {[12, 36, 100, 64, 64, 72, 64].map((w, i) => (
      <td key={i} style={{ padding: "14px 12px" }}>
        <div style={{ height: i === 1 ? 36 : 14, width: w, borderRadius: i === 1 ? 18 : 4,
                      background: "#f1f3f4", animation: "shimmer 1.4s ease infinite" }} />
      </td>
    ))}
  </tr>
);

/** Empty state */
const EmptyState = ({ filtered }) => (
  <tr>
    <td colSpan={7}>
      <div style={{ padding: "60px 0", textAlign: "center" }}>
        <div style={{
          width: 56, height: 56, borderRadius: 12, background: "#f1f3f4",
          border: "2px dashed #dadce0", display: "flex", alignItems: "center",
          justifyContent: "center", margin: "0 auto 16px",
        }}>
          <HiOutlineUserGroup size={24} style={{ color: "#bdc1c6" }} />
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#3c4043", marginBottom: 6 }}>
          {filtered ? "No users match your filters" : "No users yet"}
        </div>
        <div style={{ fontSize: 13, color: "#80868b", maxWidth: 260, margin: "0 auto" }}>
          {filtered ? "Try adjusting the search or filter settings." : "Users will appear here once they sign up."}
        </div>
      </div>
    </td>
  </tr>
);

/** Sortable column header */
const SortTH = ({ label, field, sortKey, sortDir, onSort, style = {} }) => (
  <th
    onClick={() => onSort(field)}
    style={{
      padding: "10px 12px", textAlign: "left", fontSize: 11, fontWeight: 600,
      color: "#5f6368", textTransform: "uppercase", letterSpacing: ".07em",
      whiteSpace: "nowrap", cursor: "pointer", userSelect: "none",
      background: "#f8f9fa", borderBottom: "1px solid #e8eaed",
      ...style,
    }}
  >
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      {label}
      {sortKey === field
        ? (sortDir === "asc"
            ? <HiOutlineChevronUp size={12} style={{ color: "#1a73e8" }} />
            : <HiOutlineChevronDown size={12} style={{ color: "#1a73e8" }} />)
        : <HiOutlineChevronDown size={12} style={{ opacity: 0.3 }} />}
    </span>
  </th>
);

/** Plain column header */
const TH = ({ children, style = {} }) => (
  <th style={{
    padding: "10px 12px", textAlign: "left", fontSize: 11, fontWeight: 600,
    color: "#5f6368", textTransform: "uppercase", letterSpacing: ".07em",
    background: "#f8f9fa", borderBottom: "1px solid #e8eaed",
    whiteSpace: "nowrap", ...style,
  }}>
    {children}
  </th>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
const Users = () => {
  const queryClient = useQueryClient();

  // ── State ──────────────────────────────────────────────────────────────────
  const [page,        setPage]        = useState(1);
  const [pageSize,    setPageSize]    = useState(25);
  const [search,      setSearch]      = useState("");
  const [role,        setRole]        = useState("all");
  const [sortKey,     setSortKey]     = useState("createdAt");
  const [sortDir,     setSortDir]     = useState("desc");
  const [selectedIds, setSelectedIds] = useState([]);
  const [panelUid,    setPanelUid]    = useState(null);   // slide-over
  const [banDialog,   setBanDialog]   = useState(null);   // { userId, name }
  const [banReason,   setBanReason]   = useState("");
  const [filterOpen,  setFilterOpen]  = useState(false);
  const searchRef = useRef(null);

  // ── Queries ─────────────────────────────────────────────────────────────────
  const { data: ud, isLoading, isFetching, error } = useQuery({
    queryKey: ["users", page, pageSize, role, search, sortKey, sortDir],
    queryFn: () => usersApi.getAll({
      page, limit: pageSize,
      role:   role !== "all" ? role : undefined,
      search: search || undefined,
      sort:   `${sortDir === "desc" ? "-" : ""}${sortKey}`,
    }).then(r => r.data),
    keepPreviousData: true,
    staleTime: 30_000,
  });

  const { data: statsData } = useQuery({
    queryKey: ["user-stats-summary"],
    queryFn: () => usersApi.getStats
      ? usersApi.getStats().then(r => r.data ?? null).catch(() => null)
      : Promise.resolve(null),
    staleTime: 60_000,
  });

  const { data: panelData, isLoading: panelLoading } = useQuery({
    queryKey: ["user-panel", panelUid],
    queryFn:  () => usersApi.getById(panelUid).then(r => r.data),
    enabled:  !!panelUid,
    staleTime: 30_000,
  });

  // ── Mutations ────────────────────────────────────────────────────────────────
  const toggleStatus = useMutation({
    mutationFn: ({ id, isBanned, reason }) =>
      usersApi.toggleStatus(id, { isBanned, banReason: reason }),
    onSuccess: res => {
      toast.success(res.data.message || "Status updated");
      queryClient.invalidateQueries(["users"]);
      if (panelUid) queryClient.invalidateQueries(["user-panel", panelUid]);
      queryClient.invalidateQueries(["user-stats-summary"]);
    },
    onError: err => toast.error(err.response?.data?.message || "Update failed"),
  });

  const bulkToggle = useMutation({
    mutationFn: data => usersApi.bulkStatusUpdate(data),
    onSuccess: res => {
      toast.success(res.data.message || `${selectedIds.length} users updated`);
      setSelectedIds([]);
      queryClient.invalidateQueries(["users"]);
    },
    onError: err => toast.error(err.response?.data?.message || "Bulk action failed"),
  });

  // ── Derived ───────────────────────────────────────────────────────────────
  const users      = ud?.users || [];
  const pagination = ud?.pagination || {};
  const hasFilter  = role !== "all" || !!search;
  const allSel     = users.length > 0 && selectedIds.length === users.length;
  const someSel    = selectedIds.length > 0 && !allSel;
  const totalPages = pagination.pages || 1;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSort = useCallback(field => {
    setSortKey(k => {
      if (k === field) setSortDir(d => d === "asc" ? "desc" : "asc");
      else { setSortKey(field); setSortDir("desc"); }
      return field;
    });
    setPage(1);
  }, []);

  const handleSelectAll = e =>
    setSelectedIds(e.target.checked ? users.map(u => u._id) : []);

  const handleSelectRow = (id, checked) =>
    setSelectedIds(p => checked ? [...p, id] : p.filter(x => x !== id));

  const openBanDialog = (userId, name) => {
    setBanDialog({ userId, name });
    setBanReason("");
  };

  const confirmBan = () => {
    if (!banReason.trim()) { toast.error("Please provide a reason"); return; }
    toggleStatus.mutate({ id: banDialog.userId, isBanned: true, reason: banReason });
    setBanDialog(null);
  };

  const handleExport = () => {
    toast.success("Preparing export…");
    const link = document.createElement("a");
    link.href = `/api/admin/users/export?role=${role !== "all" ? role : ""}&search=${search}`;
    link.download = `users-${Date.now()}.csv`;
    link.click();
  };

  // Close panel on Escape
  useEffect(() => {
    const h = e => { if (e.key === "Escape") { setPanelUid(null); setBanDialog(null); } };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, []);

  // ── Page numbers helper ────────────────────────────────────────────────────
  const visiblePages = () => {
    const pages = [];
    const delta = 2;
    const start = Math.max(2, page - delta);
    const end   = Math.min(totalPages - 1, page + delta);
    pages.push(1);
    if (start > 2) pages.push("...");
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages - 1) pages.push("...");
    if (totalPages > 1) pages.push(totalPages);
    return pages;
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Global styles for keyframes ─────────────────────────────────── */}
      <style>{`
        @keyframes shimmer { 0%,100%{opacity:1} 50%{opacity:.5} }
        @keyframes pulse   { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.7;transform:scale(.85)} }
        @keyframes slideIn { from{transform:translateX(100%);opacity:0} to{transform:translateX(0);opacity:1} }
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        .u-row:hover { background:#f8f9fa !important; }
        .u-row.selected { background:#e8f0fe !important; }
        .u-btn:hover  { background:#f1f3f4 !important; }
        .u-chip-btn:hover { opacity:.85; }
        .u-action-btn { opacity:0; transition:opacity .15s; }
        .u-row:hover .u-action-btn { opacity:1; }
        .panel-scroll::-webkit-scrollbar { width:4px; }
        .panel-scroll::-webkit-scrollbar-thumb { background:#dadce0; border-radius:2px; }
      `}</style>

      <div style={{ background: "#f8f9fa", minHeight: "100vh", fontFamily: "'Google Sans',Roboto,sans-serif" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* ── Breadcrumb ───────────────────────────────────────────────── */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#5f6368" }}>
            <HiOutlineHome size={15} style={{ color: "#5f6368" }} />
            <span style={{ color: "#dadce0" }}>/</span>
            <span>Admin</span>
            <span style={{ color: "#dadce0" }}>/</span>
            <span style={{ color: "#1a73e8", fontWeight: 500 }}>Users</span>
          </div>

          {/* ── Page header ──────────────────────────────────────────────── */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: "#202124", letterSpacing: "-.3px" }}>
                User Directory
              </h1>
              <p style={{ margin: "4px 0 0", fontSize: 14, color: "#5f6368" }}>
                Manage platform accounts, roles, and compliance status.
              </p>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button
                onClick={() => queryClient.invalidateQueries(["users"])}
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
                  background: "#fff", border: "1px solid #dadce0", borderRadius: 6,
                  fontSize: 13, color: "#3c4043", cursor: "pointer", fontWeight: 500,
                }}
                className="u-btn"
                title="Refresh"
              >
                <HiOutlineArrowPath size={15} style={{ ...(isFetching ? { animation: "shimmer .8s linear infinite" } : {}) }} />
                Refresh
              </button>
              <button
                onClick={handleExport}
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
                  background: "#1a73e8", border: "none", borderRadius: 6,
                  fontSize: 13, color: "#fff", cursor: "pointer", fontWeight: 500,
                  boxShadow: "0 1px 3px rgba(0,0,0,.2)",
                }}
              >
                <HiOutlineArrowDownTray size={15} />
                Export CSV
              </button>
            </div>
          </div>

          {/* ── Stat cards ───────────────────────────────────────────────── */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <StatCard label="Total Users"  value={pagination.total}      icon={HiOutlineUserGroup}    color="#1a73e8" loading={isLoading} />
            <StatCard label="Editors"      value={statsData?.editors}     icon={HiOutlineIdentification} color="#9334ea" loading={isLoading} />
            <StatCard label="Clients"      value={statsData?.clients}     icon={HiOutlineUser}         color="#1a73e8" loading={isLoading} />
            <StatCard label="Suspended"    value={statsData?.banned}      icon={HiOutlineNoSymbol}     color="#ea4335" loading={isLoading} />
          </div>

          {/* ── Main card ───────────────────────────────────────────────── */}
          <div style={{
            background: "#fff", border: "1px solid #dadce0", borderRadius: 8,
            boxShadow: "0 1px 2px rgba(0,0,0,.06)", overflow: "hidden",
          }}>

            {/* ── Toolbar ─────────────────────────────────────────────── */}
            <div style={{
              padding: "12px 16px", borderBottom: "1px solid #e8eaed",
              display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
            }}>
              {/* Search */}
              <div style={{ position: "relative", flex: 1, minWidth: 260 }}>
                <HiOutlineMagnifyingGlass size={16} style={{
                  position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#80868b",
                }} />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search by name, email or ID…"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                  style={{
                    width: "100%", boxSizing: "border-box",
                    padding: "9px 36px 9px 38px",
                    border: "1px solid #dadce0", borderRadius: 6,
                    fontSize: 13, color: "#202124", background: "#fff",
                    outline: "none", transition: "border .15s",
                  }}
                  onFocus={e => e.target.style.borderColor = "#1a73e8"}
                  onBlur={e => e.target.style.borderColor = "#dadce0"}
                />
                {search && (
                  <button
                    onClick={() => { setSearch(""); setPage(1); searchRef.current?.focus(); }}
                    style={{
                      position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                      background: "none", border: "none", cursor: "pointer", color: "#80868b", padding: 2,
                      display: "flex", alignItems: "center",
                    }}
                  >
                    <HiOutlineXMark size={16} />
                  </button>
                )}
              </div>

              {/* Role filter chips */}
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#5f6368", fontWeight: 500 }}>Role:</span>
                {[["all","All"],["editor","Editor"],["client","Client"]].map(([v,l]) => (
                  <button
                    key={v}
                    onClick={() => { setRole(v); setPage(1); }}
                    className="u-chip-btn"
                    style={{
                      padding: "5px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600,
                      cursor: "pointer", border: "1px solid",
                      background: role === v ? "#1a73e8" : "#fff",
                      color:      role === v ? "#fff"    : "#3c4043",
                      borderColor: role === v ? "#1a73e8" : "#dadce0",
                      transition: "all .15s",
                    }}
                  >{l}</button>
                ))}
              </div>

              {/* Page size */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
                <span style={{ fontSize: 12, color: "#5f6368" }}>Rows:</span>
                <select
                  value={pageSize}
                  onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                  style={{
                    padding: "5px 8px", border: "1px solid #dadce0", borderRadius: 6,
                    fontSize: 12, color: "#3c4043", background: "#fff", outline: "none",
                  }}
                >
                  {[10,25,50,100].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>

            {/* ── Bulk action bar ──────────────────────────────────────── */}
            {selectedIds.length > 0 && (
              <div style={{
                padding: "10px 16px", background: "#e8f0fe",
                borderBottom: "1px solid #c5d9f8",
                display: "flex", alignItems: "center", gap: 14,
                animation: "fadeIn .2s ease",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: 4, background: "#1a73e8",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <HiMiniCheck size={13} style={{ color: "#fff" }} />
                  </div>
                  <span style={{ fontSize: 13, color: "#1a73e8", fontWeight: 600 }}>
                    {selectedIds.length} {selectedIds.length === 1 ? "user" : "users"} selected
                  </span>
                </div>
                <div style={{ height: 18, width: 1, background: "#c5d9f8" }} />
                <button
                  onClick={() => { if (window.confirm(`Suspend ${selectedIds.length} users?`)) bulkToggle.mutate({ userIds: selectedIds, isBanned: true }); }}
                  disabled={bulkToggle.isPending}
                  style={{
                    padding: "5px 14px", background: "#fff", border: "1px solid #ea4335",
                    borderRadius: 6, fontSize: 12, fontWeight: 600, color: "#c5221f",
                    cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
                  }}
                >
                  <HiOutlineNoSymbol size={13} /> Suspend
                </button>
                <button
                  onClick={() => bulkToggle.mutate({ userIds: selectedIds, isBanned: false })}
                  disabled={bulkToggle.isPending}
                  style={{
                    padding: "5px 14px", background: "#fff", border: "1px solid #34a853",
                    borderRadius: 6, fontSize: 12, fontWeight: 600, color: "#137333",
                    cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
                  }}
                >
                  <HiOutlineCheckCircle size={13} /> Restore
                </button>
                <button
                  onClick={() => setSelectedIds([])}
                  style={{ marginLeft: "auto", background: "none", border: "none", fontSize: 12, color: "#5f6368", cursor: "pointer" }}
                >
                  Clear selection
                </button>
              </div>
            )}

            {/* ── Table ────────────────────────────────────────────────── */}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
                <thead>
                  <tr>
                    <th style={{ width: 44, padding: "10px 12px", background: "#f8f9fa", borderBottom: "1px solid #e8eaed" }}>
                      <input
                        type="checkbox"
                        checked={allSel}
                        ref={el => { if (el) el.indeterminate = someSel; }}
                        onChange={handleSelectAll}
                        style={{ width: 15, height: 15, cursor: "pointer", accentColor: "#1a73e8" }}
                      />
                    </th>
                    <SortTH label="User"    field="name"      sortKey={sortKey} sortDir={sortDir} onSort={handleSort} style={{ minWidth: 220 }} />
                    <TH>Role</TH>
                    <TH>Status</TH>
                    <TH style={{ display: "none", minWidth: 110 }}>KYC</TH>
                    <SortTH label="Joined"  field="createdAt" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} style={{ minWidth: 110 }} />
                    <TH style={{ textAlign: "right" }}>Actions</TH>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                  ) : error ? (
                    <tr>
                      <td colSpan={7} style={{ padding: 40, textAlign: "center" }}>
                        <HiOutlineExclamationCircle size={28} style={{ color: "#ea4335", display: "block", margin: "0 auto 10px" }} />
                        <div style={{ fontSize: 14, color: "#3c4043", fontWeight: 600, marginBottom: 4 }}>Failed to load users</div>
                        <div style={{ fontSize: 13, color: "#80868b", marginBottom: 16 }}>{error.message}</div>
                        <button
                          onClick={() => queryClient.invalidateQueries(["users"])}
                          style={{
                            padding: "8px 20px", background: "#1a73e8", border: "none",
                            borderRadius: 6, color: "#fff", fontSize: 13, cursor: "pointer", fontWeight: 500,
                          }}
                        >Try Again</button>
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <EmptyState filtered={hasFilter} />
                  ) : users.map(user => {
                    const isSel = selectedIds.includes(user._id);
                    return (
                      <tr
                        key={user._id}
                        className={`u-row${isSel ? " selected" : ""}`}
                        style={{ borderBottom: "1px solid #f1f3f4", background: isSel ? "#e8f0fe" : "#fff", cursor: "default", transition: "background .1s" }}
                      >
                        {/* Checkbox */}
                        <td style={{ padding: "12px 12px" }}>
                          <input
                            type="checkbox" checked={isSel}
                            onChange={e => handleSelectRow(user._id, e.target.checked)}
                            style={{ width: 15, height: 15, cursor: "pointer", accentColor: "#1a73e8" }}
                          />
                        </td>

                        {/* User */}
                        <td style={{ padding: "12px 12px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ position: "relative" }}>
                              <Avatar src={user.profilePicture} name={user.name} size={34} />
                              {user.isBanned && (
                                <span style={{
                                  position: "absolute", bottom: -2, right: -2,
                                  width: 14, height: 14, borderRadius: "50%",
                                  background: "#ea4335", border: "2px solid #fff",
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                }}>
                                  <HiOutlineNoSymbol size={7} style={{ color: "#fff" }} />
                                </span>
                              )}
                            </div>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 600, color: "#202124" }}>{user.name}</div>
                              <div style={{ fontSize: 12, color: "#80868b", display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                                <HiOutlineEnvelope size={11} />{user.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td style={{ padding: "12px 12px" }}>
                          <Chip label={user.role === "editor" ? "Editor" : "Client"} token={ROLE_T[user.role] || T.gray} />
                        </td>

                        {/* Status */}
                        <td style={{ padding: "12px 12px" }}>
                          <Chip
                            label={user.isBanned ? "Suspended" : "Active"}
                            token={user.isBanned ? T.red : T.green}
                          />
                        </td>

                        {/* KYC (hidden on smaller screens via overflow) */}
                        <td style={{ padding: "12px 12px", display: "none" }}>
                          <Chip
                            label={(user.kycStatus || "not_submitted").replace("_", " ")}
                            token={KYC_T[user.kycStatus] || T.gray}
                            sm
                          />
                        </td>

                        {/* Joined */}
                        <td style={{ padding: "12px 12px", fontSize: 12, color: "#5f6368", whiteSpace: "nowrap" }}>
                          {formatDate(user.createdAt)}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: "12px 12px", textAlign: "right" }}>
                          <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", alignItems: "center" }}>
                            <button
                              onClick={() => setPanelUid(user._id)}
                              style={{
                                padding: "5px 14px", background: "#fff",
                                border: "1px solid #dadce0", borderRadius: 6,
                                fontSize: 12, fontWeight: 600, color: "#3c4043",
                                cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
                              }}
                              className="u-btn"
                            >
                              <HiOutlineEye size={13} /> View
                            </button>
                            <button
                              className="u-action-btn u-btn"
                              onClick={() => user.isBanned
                                ? toggleStatus.mutate({ id: user._id, isBanned: false })
                                : openBanDialog(user._id, user.name)}
                              style={{
                                padding: "5px 10px", background: "#fff",
                                border: `1px solid ${user.isBanned ? "#34a853" : "#ea4335"}`,
                                borderRadius: 6, fontSize: 12, fontWeight: 600,
                                color: user.isBanned ? "#137333" : "#c5221f",
                                cursor: "pointer",
                              }}
                              title={user.isBanned ? "Restore" : "Suspend"}
                            >
                              {user.isBanned ? <HiOutlineCheckCircle size={13} /> : <HiOutlineNoSymbol size={13} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ── Pagination ───────────────────────────────────────────── */}
            {!isLoading && users.length > 0 && (
              <div style={{
                padding: "12px 16px", borderTop: "1px solid #e8eaed",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                flexWrap: "wrap", gap: 12,
              }}>
                <div style={{ fontSize: 13, color: "#5f6368" }}>
                  Showing{" "}
                  <b style={{ color: "#202124" }}>
                    {((pagination.page - 1) * pageSize) + 1}–{Math.min(pagination.page * pageSize, pagination.total)}
                  </b>
                  {" "}of{" "}
                  <b style={{ color: "#202124" }}>{pagination.total?.toLocaleString()}</b>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    style={{
                      width: 30, height: 30, borderRadius: 4, border: "1px solid #dadce0",
                      background: "#fff", cursor: page === 1 ? "default" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      opacity: page === 1 ? 0.4 : 1, color: "#5f6368",
                    }}
                  ><HiOutlineChevronLeft size={14} /></button>

                  {visiblePages().map((p, i) =>
                    p === "..." ? (
                      <span key={i} style={{ width: 30, textAlign: "center", fontSize: 13, color: "#80868b" }}>…</span>
                    ) : (
                      <button key={p} onClick={() => setPage(p)}
                        style={{
                          width: 30, height: 30, borderRadius: 4, border: "1px solid",
                          borderColor: page === p ? "#1a73e8" : "#dadce0",
                          background:  page === p ? "#1a73e8" : "#fff",
                          color:       page === p ? "#fff"    : "#3c4043",
                          fontSize: 13, fontWeight: page === p ? 600 : 400,
                          cursor: "pointer",
                        }}
                      >{p}</button>
                    )
                  )}

                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    style={{
                      width: 30, height: 30, borderRadius: 4, border: "1px solid #dadce0",
                      background: "#fff", cursor: page === totalPages ? "default" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      opacity: page === totalPages ? 0.4 : 1, color: "#5f6368",
                    }}
                  ><HiOutlineChevronRight size={14} /></button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  SLIDE-OVER PANEL                                                  */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {panelUid && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setPanelUid(null)}
            style={{
              position: "fixed", inset: 0, background: "rgba(32,33,36,.4)",
              zIndex: 1000, animation: "fadeIn .2s ease",
            }}
          />
          {/* Panel */}
          <div style={{
            position: "fixed", top: 0, right: 0, bottom: 0, width: 420,
            background: "#fff", zIndex: 1001, display: "flex", flexDirection: "column",
            boxShadow: "-4px 0 24px rgba(0,0,0,.12)",
            animation: "slideIn .25s cubic-bezier(.4,0,.2,1)",
          }}>
            {/* Panel header */}
            <div style={{
              padding: "16px 20px", borderBottom: "1px solid #e8eaed",
              display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0,
            }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: "#202124" }}>User Profile</div>
                <div style={{ fontSize: 12, color: "#80868b", marginTop: 2 }}>Account details and activity</div>
              </div>
              <button
                onClick={() => setPanelUid(null)}
                style={{
                  width: 32, height: 32, borderRadius: 6, border: "none", background: "#f1f3f4",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#5f6368",
                }}
              ><HiOutlineXMark size={18} /></button>
            </div>

            {/* Panel body */}
            <div className="panel-scroll" style={{ flex: 1, overflowY: "auto" }}>
              {panelLoading ? (
                <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
                  {[1,2,3,4,5].map(i => (
                    <div key={i} style={{ height: i === 1 ? 80 : 44, borderRadius: 8, background: "#f1f3f4", animation: "shimmer 1.4s ease infinite" }} />
                  ))}
                </div>
              ) : !panelData?.user ? (
                <div style={{ padding: 40, textAlign: "center" }}>
                  <HiOutlineExclamationCircle size={28} style={{ color: "#ea4335", display: "block", margin: "0 auto 12px" }} />
                  <div style={{ fontSize: 14, color: "#3c4043", fontWeight: 600 }}>Could not load profile</div>
                  <button
                    onClick={() => queryClient.invalidateQueries(["user-panel", panelUid])}
                    style={{
                      marginTop: 14, padding: "7px 18px", background: "#1a73e8",
                      border: "none", borderRadius: 6, color: "#fff", fontSize: 13, cursor: "pointer",
                    }}
                  >Retry</button>
                </div>
              ) : (
                <div>
                  {/* Profile header block */}
                  <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid #f1f3f4" }}>
                    <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                      <div style={{ position: "relative" }}>
                        <Avatar src={panelData.user.profilePicture} name={panelData.user.name} size={56} />
                        {panelData.user.isBanned && (
                          <span style={{
                            position: "absolute", bottom: -2, right: -2, width: 18, height: 18,
                            borderRadius: "50%", background: "#ea4335", border: "2px solid #fff",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            <HiOutlineNoSymbol size={9} style={{ color: "#fff" }} />
                          </span>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: "#202124" }}>{panelData.user.name}</div>
                        <div style={{ fontSize: 13, color: "#80868b", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis" }}>
                          {panelData.user.email}
                        </div>
                        <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                          <Chip label={panelData.user.role === "editor" ? "Editor" : "Client"} token={ROLE_T[panelData.user.role] || T.gray} />
                          {panelData.user.isBanned
                            ? <Chip label="Suspended" token={T.red} />
                            : <Chip label="Active" token={T.green} />}
                        </div>
                      </div>
                    </div>

                    {/* Quick stats */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 16 }}>
                      {[
                        { label: "Orders",  value: panelData.orders?.length || 0,    icon: HiOutlineShoppingCart, color: "#1a73e8" },
                        { label: "KYC",     value: (panelData.user.kycStatus || "N/A").replace("_"," "), icon: HiOutlineShieldCheck, color: "#34a853" },
                        { label: "Auth",    value: panelData.user.authProvider || "Email", icon: HiOutlineGlobeAlt,  color: "#9334ea" },
                      ].map((s, i) => (
                        <div key={i} style={{
                          background: "#f8f9fa", border: "1px solid #e8eaed",
                          borderRadius: 8, padding: "10px 8px", textAlign: "center",
                        }}>
                          <s.icon size={16} style={{ color: s.color, display: "block", margin: "0 auto 4px" }} />
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#202124" }}>{s.value}</div>
                          <div style={{ fontSize: 10, color: "#80868b", textTransform: "uppercase", letterSpacing: ".06em" }}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Account info rows */}
                  <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f3f4" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#80868b", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 12 }}>
                      Account Information
                    </div>
                    {[
                      { label: "User ID",          value: panelData.user._id, mono: true },
                      { label: "Joined",            value: formatDate(panelData.user.createdAt) },
                      { label: "Profile Complete",  value: panelData.user.profileCompleted ? "Yes" : "No" },
                      { label: "KYC Status",        value: (panelData.user.kycStatus || "not_submitted").replace(/_/g, " ") },
                    ].map((row, i) => (
                      <div key={i} style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "9px 0", borderBottom: "1px solid #f8f9fa",
                      }}>
                        <span style={{ fontSize: 13, color: "#5f6368" }}>{row.label}</span>
                        <span style={{
                          fontSize: row.mono ? 11 : 13, fontWeight: 600, color: "#202124",
                          fontFamily: row.mono ? "monospace" : "inherit",
                          maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {row.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Ban reason */}
                  {panelData.user.isBanned && (
                    <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f3f4" }}>
                      <div style={{
                        background: "#fce8e6", border: "1px solid #f5c6c2", borderRadius: 8, padding: 14,
                      }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                          <HiOutlineNoSymbol size={14} style={{ color: "#c5221f" }} />
                          <span style={{ fontSize: 12, fontWeight: 700, color: "#c5221f", textTransform: "uppercase", letterSpacing: ".06em" }}>
                            Account Suspended
                          </span>
                        </div>
                        <div style={{ fontSize: 13, color: "#c5221f" }}>
                          {panelData.user.banReason || "No reason recorded."}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Recent orders */}
                  <div style={{ padding: "16px 20px" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#80868b", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 12 }}>
                      Recent Orders ({panelData.orders?.length || 0})
                    </div>
                    {panelData.orders?.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {panelData.orders.slice(0, 5).map((order, i) => (
                          <div key={i} style={{
                            display: "flex", gap: 12, alignItems: "center",
                            padding: 12, background: "#f8f9fa", borderRadius: 8, border: "1px solid #e8eaed",
                          }}>
                            <div style={{
                              width: 34, height: 34, borderRadius: 6, background: "#e8f0fe",
                              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                            }}>
                              <HiOutlineShoppingCart size={16} style={{ color: "#1a73e8" }} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: "#202124", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {order.title}
                              </div>
                              <div style={{ fontSize: 11, color: "#80868b", marginTop: 1 }}>
                                {formatDate(order.createdAt)}
                              </div>
                            </div>
                            <div style={{ textAlign: "right", flexShrink: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: "#202124" }}>
                                ₹{order.amount?.toLocaleString()}
                              </div>
                              <Chip label={order.status} token={T.gray} sm dot={false} />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{
                        padding: "28px 16px", textAlign: "center", border: "2px dashed #e8eaed", borderRadius: 8,
                      }}>
                        <HiOutlineShoppingCart size={22} style={{ color: "#dadce0", display: "block", margin: "0 auto 8px" }} />
                        <div style={{ fontSize: 13, color: "#80868b" }}>No orders yet</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Panel footer */}
            {panelData?.user && (
              <div style={{ padding: "14px 20px", borderTop: "1px solid #e8eaed", background: "#f8f9fa", flexShrink: 0 }}>
                <div style={{ display: "flex", gap: 10 }}>
                  {panelData.user.isBanned ? (
                    <button
                      onClick={() => { toggleStatus.mutate({ id: panelUid, isBanned: false }); }}
                      disabled={toggleStatus.isPending}
                      style={{
                        flex: 1, padding: "9px 0", background: "#34a853", border: "none",
                        borderRadius: 6, color: "#fff", fontSize: 13, fontWeight: 600,
                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      }}
                    >
                      <HiOutlineCheckCircle size={15} />
                      {toggleStatus.isPending ? "Restoring…" : "Restore Account"}
                    </button>
                  ) : (
                    <button
                      onClick={() => { setPanelUid(null); openBanDialog(panelData.user._id, panelData.user.name); }}
                      style={{
                        flex: 1, padding: "9px 0", background: "#fff", border: "1px solid #ea4335",
                        borderRadius: 6, color: "#c5221f", fontSize: 13, fontWeight: 600,
                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      }}
                    >
                      <HiOutlineNoSymbol size={15} />
                      Suspend Account
                    </button>
                  )}
                  <button
                    onClick={() => setPanelUid(null)}
                    style={{
                      padding: "9px 20px", background: "#fff", border: "1px solid #dadce0",
                      borderRadius: 6, color: "#3c4043", fontSize: 13, fontWeight: 500, cursor: "pointer",
                    }}
                  >Close</button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  BAN REASON DIALOG                                                 */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {banDialog && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(32,33,36,.5)",
          zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
          animation: "fadeIn .15s ease",
        }}>
          <div style={{
            background: "#fff", borderRadius: 12, width: "100%", maxWidth: 420,
            boxShadow: "0 8px 40px rgba(0,0,0,.18)", overflow: "hidden",
          }}>
            {/* Dialog header */}
            <div style={{ padding: "20px 24px 0" }}>
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 8, background: "#fce8e6",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <HiOutlineNoSymbol size={20} style={{ color: "#ea4335" }} />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#202124" }}>Suspend Account</div>
                  <div style={{ fontSize: 13, color: "#5f6368", marginTop: 4, lineHeight: 1.5 }}>
                    <b style={{ color: "#202124" }}>{banDialog.name}</b> will be logged out immediately and blocked from accessing the platform.
                  </div>
                </div>
              </div>
            </div>

            {/* Dialog body */}
            <div style={{ padding: "20px 24px" }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#3c4043", marginBottom: 8 }}>
                Reason for suspension <span style={{ color: "#ea4335" }}>*</span>
              </label>
              <textarea
                value={banReason}
                onChange={e => setBanReason(e.target.value)}
                placeholder="e.g. Violation of Terms of Service, fraudulent activity, repeated policy breach…"
                rows={3}
                autoFocus
                style={{
                  width: "100%", boxSizing: "border-box", padding: "10px 12px",
                  border: "1px solid #dadce0", borderRadius: 8, fontSize: 13,
                  color: "#202124", resize: "none", outline: "none", lineHeight: 1.6,
                  fontFamily: "inherit", transition: "border .15s",
                }}
                onFocus={e => e.target.style.borderColor = "#1a73e8"}
                onBlur={e => e.target.style.borderColor = "#dadce0"}
              />
              <div style={{ fontSize: 11, color: "#80868b", marginTop: 6 }}>
                This reason is recorded in audit logs and may be shown to the user upon appeal.
              </div>
            </div>

            {/* Dialog footer */}
            <div style={{
              padding: "14px 24px", background: "#f8f9fa", borderTop: "1px solid #e8eaed",
              display: "flex", gap: 10, justifyContent: "flex-end",
            }}>
              <button
                onClick={() => { setBanDialog(null); setBanReason(""); }}
                style={{
                  padding: "8px 20px", background: "#fff", border: "1px solid #dadce0",
                  borderRadius: 6, fontSize: 13, color: "#3c4043", cursor: "pointer", fontWeight: 500,
                }}
              >Cancel</button>
              <button
                onClick={confirmBan}
                disabled={!banReason.trim() || toggleStatus.isPending}
                style={{
                  padding: "8px 20px", background: "#ea4335", border: "none",
                  borderRadius: 6, fontSize: 13, color: "#fff", cursor: "pointer", fontWeight: 600,
                  opacity: (!banReason.trim() || toggleStatus.isPending) ? 0.6 : 1,
                  transition: "opacity .15s",
                }}
              >
                {toggleStatus.isPending ? "Suspending…" : "Confirm Suspension"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Users;