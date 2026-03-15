// ─── Gigs.jsx — Production Gig / Catalog Management ─────────────────────────
// Light/dark theme via CSS variables. Fully responsive: mobile card view → desktop table.
// Deps: @tanstack/react-query, react-hot-toast, react-icons/hi2, ../api/adminApi, ../utils/formatters

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  HiOutlineBriefcase,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineMagnifyingGlass,
  HiOutlineArrowDownTray,
  HiOutlineArrowPath,
  HiOutlineXMark,
  HiOutlineEye,
  HiOutlineChartBar,
  HiOutlineStar,
  HiOutlineLockClosed,
  HiOutlineLockOpen,
  HiOutlineFire,
  HiOutlineShoppingBag,
  HiOutlineUser,
  HiOutlineClock,
  HiOutlineCurrencyRupee,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineHome,
  HiOutlineExclamationCircle,
  HiOutlinePhoto,
  HiMiniCheck,
  HiOutlineTag,
  HiOutlineEllipsisVertical,
  HiOutlineCalendarDays,
  HiOutlineArrowTopRightOnSquare,
} from "react-icons/hi2";
import { toast } from "react-hot-toast";
import { gigsApi } from "../api/adminApi";
import { formatDate, formatCurrency, formatNumber } from "../utils/formatters";

// ─────────────────────────────────────────────────────────────────────────────
// Atoms
// ─────────────────────────────────────────────────────────────────────────────

const UserAvatar = ({ src, name, size = 28 }) => {
  const [err, setErr] = useState(false);
  const initials = (name || "??").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const palette  = ["#6d28d9", "#1d4ed8", "#0369a1", "#15803d", "#b45309", "#c2410c"];
  const bg       = palette[(name || "").charCodeAt(0) % palette.length];
  if (!err && src) return (
    <img src={src} alt={name} onError={() => setErr(true)} style={{
      width: size, height: size, borderRadius: "50%", objectFit: "cover",
      border: "2px solid var(--gig-surface)", flexShrink: 0,
    }} />
  );
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: bg, color: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.35, fontWeight: 700, flexShrink: 0,
      border: "2px solid var(--gig-surface)",
    }}>{initials}</div>
  );
};

const StatusChip = ({ active, sm }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: 5,
    padding: sm ? "2px 8px" : "3px 10px", borderRadius: 999,
    fontSize: sm ? 10 : 11, fontWeight: 600, whiteSpace: "nowrap", lineHeight: 1.6,
    background: active ? "var(--gig-active-bg)"   : "var(--gig-inactive-bg)",
    color:      active ? "var(--gig-active-text)"  : "var(--gig-inactive-text)",
    border:     `1px solid ${active ? "var(--gig-active-brd)" : "var(--gig-inactive-brd)"}`,
  }}>
    <span style={{
      width: sm ? 5 : 6, height: sm ? 5 : 6, borderRadius: "50%", flexShrink: 0,
      background: active ? "#22c55e" : "#9ca3af",
      ...(active ? { animation: "gig-pulse 2s infinite" } : {}),
    }} />
    {active ? "Active" : "Archived"}
  </span>
);

const StarRating = ({ value }) => {
  const v = Number(value) || 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
      <HiOutlineStar size={12} style={{ color: "#f59e0b", fill: "#f59e0b" }} />
      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--gig-text-primary)" }}>
        {v ? v.toFixed(1) : "—"}
      </span>
    </div>
  );
};

const GigThumbnail = ({ src, title, size = 56 }) => {
  const [err, setErr] = useState(false);
  return err || !src ? (
    <div style={{
      width: size, height: size * 0.65, borderRadius: 6, background: "var(--gig-shimmer)",
      border: "1px solid var(--gig-border)", display: "flex", alignItems: "center",
      justifyContent: "center", flexShrink: 0,
    }}>
      <HiOutlinePhoto size={14} style={{ color: "var(--gig-text-muted)", opacity: .5 }} />
    </div>
  ) : (
    <img src={src} alt={title} onError={() => setErr(true)} style={{
      width: size, height: size * 0.65, borderRadius: 6, objectFit: "cover", flexShrink: 0,
      border: "1px solid var(--gig-border)",
    }} />
  );
};

const KpiCard = ({ label, value, icon: Icon, iconColor, sub, loading }) => (
  <div style={{
    background: "var(--gig-card)", border: "1px solid var(--gig-border)",
    borderRadius: 10, padding: "16px 20px", flex: 1, minWidth: 160,
    display: "flex", alignItems: "center", gap: 14,
    boxShadow: "0 1px 3px var(--gig-shadow)",
  }}>
    <div style={{
      width: 40, height: 40, borderRadius: 10, background: iconColor + "18", flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <Icon size={19} style={{ color: iconColor }} />
    </div>
    {loading ? (
      <div>
        <div style={{ height: 22, width: 48, borderRadius: 4, background: "var(--gig-shimmer)", marginBottom: 4, animation: "gig-shimmer 1.4s ease infinite" }} />
        <div style={{ height: 12, width: 70, borderRadius: 4, background: "var(--gig-shimmer)", animation: "gig-shimmer 1.4s ease infinite" }} />
      </div>
    ) : (
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, color: "var(--gig-text-primary)", lineHeight: 1.1, letterSpacing: "-.2px" }}>
          {value}
        </div>
        <div style={{ fontSize: 12, color: "var(--gig-text-muted)", marginTop: 3 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: "var(--gig-text-muted)", opacity: .7, marginTop: 1 }}>{sub}</div>}
      </div>
    )}
  </div>
);

const SkeletonRow = () => (
  <tr style={{ borderBottom: "1px solid var(--gig-row-brd)" }}>
    {[56, 20, 160, 100, 64, 72, 56, 80].map((w, i) => (
      <td key={i} style={{ padding: "13px 12px" }}>
        <div style={{
          height: i === 0 ? 36 : i === 1 ? 15 : 13, width: i === 0 ? 60 : i === 1 ? 15 : w,
          borderRadius: i === 0 ? 6 : i === 1 ? "50%" : 4,
          background: "var(--gig-shimmer)", animation: "gig-shimmer 1.4s ease infinite",
        }} />
      </td>
    ))}
  </tr>
);

// Mobile gig card
const GigCard = ({ gig, onView, onToggle, selected, onSelect, toggling }) => (
  <div style={{
    background: "var(--gig-card)", border: `1px solid ${selected ? "var(--gig-sel-brd)" : "var(--gig-border)"}`,
    borderRadius: 10, overflow: "hidden",
    boxShadow: selected ? "0 0 0 2px var(--gig-sel-brd)" : "0 1px 3px var(--gig-shadow)",
    transition: "box-shadow .15s, border-color .15s",
  }}>
    {/* Thumbnail row */}
    <div style={{ position: "relative" }}>
      {gig.images?.[0] || gig.thumbnail ? (
        <img src={gig.images?.[0] || gig.thumbnail} alt={gig.title}
          style={{ width: "100%", height: 140, objectFit: "cover", display: "block" }}
          onError={e => { e.target.style.display = "none"; }} />
      ) : (
        <div style={{ width: "100%", height: 100, background: "var(--gig-shimmer)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <HiOutlinePhoto size={28} style={{ color: "var(--gig-text-muted)", opacity: .3 }} />
        </div>
      )}
      {/* Overlay chips */}
      <div style={{ position: "absolute", top: 8, left: 8, right: 8, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <StatusChip active={gig.isActive} sm />
        <label style={{ width: 22, height: 22, background: "rgba(0,0,0,.55)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
          <input type="checkbox" checked={selected} onChange={e => onSelect(gig._id, e.target.checked)}
            style={{ width: 12, height: 12, accentColor: "#fff", cursor: "pointer" }} />
        </label>
      </div>
    </div>

    {/* Body */}
    <div style={{ padding: "12px 14px" }}>
      {gig.category && (
        <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--gig-text-muted)", marginBottom: 4 }}>
          {gig.category}
        </div>
      )}
      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--gig-text-primary)", lineHeight: 1.35, marginBottom: 8,
        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
        {gig.title}
      </div>

      {/* Editor row */}
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
        <UserAvatar src={gig.editor?.profilePicture} name={gig.editor?.name} size={22} />
        <span style={{ fontSize: 12, color: "var(--gig-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {gig.editor?.name}
        </span>
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTop: "1px solid var(--gig-row-brd)" }}>
        <div style={{ display: "flex", gap: 14 }}>
          <StarRating value={gig.rating} />
          <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <HiOutlineShoppingBag size={12} style={{ color: "var(--gig-text-muted)" }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--gig-text-primary)" }}>
              {formatNumber(gig.totalOrders || 0)}
            </span>
          </div>
        </div>
        <span style={{ fontSize: 14, fontWeight: 800, color: "var(--gig-text-primary)" }}>
          {formatCurrency(gig.price)}
        </span>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button onClick={() => onView(gig)} style={{
          flex: 1, padding: "7px 0", background: "var(--gig-btn-bg)", border: "1px solid var(--gig-btn-brd)",
          borderRadius: 7, fontSize: 12, fontWeight: 600, color: "var(--gig-btn-text)",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
        }}>
          <HiOutlineEye size={13} /> Details
        </button>
        <button onClick={() => onToggle(gig)} disabled={toggling} style={{
          flex: 1, padding: "7px 0", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
          background: gig.isActive ? "#fef2f2" : "#f0fdf4",
          border: `1px solid ${gig.isActive ? "#fecaca" : "#bbf7d0"}`,
          color: gig.isActive ? "#b91c1c" : "#15803d",
          opacity: toggling ? .6 : 1,
        }}>
          {gig.isActive
            ? <><HiOutlineLockClosed size={13} /> Deactivate</>
            : <><HiOutlineLockOpen size={13} /> Activate</>}
        </button>
      </div>
    </div>
  </div>
);

const SortTH = ({ label, field, sk, sd, onSort, style = {} }) => (
  <th onClick={() => onSort(field)} style={{
    padding: "10px 12px", fontSize: 11, fontWeight: 600, textAlign: "left",
    color: "var(--gig-text-muted)", textTransform: "uppercase", letterSpacing: ".07em",
    background: "var(--gig-thead)", borderBottom: "1px solid var(--gig-border)",
    cursor: "pointer", userSelect: "none", whiteSpace: "nowrap", ...style,
  }}>
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      {label}
      {sk === field
        ? sd === "asc"
          ? <HiOutlineChevronUp   size={11} style={{ color: "var(--gig-accent)" }} />
          : <HiOutlineChevronDown size={11} style={{ color: "var(--gig-accent)" }} />
        : <HiOutlineChevronDown size={11} style={{ opacity: .22 }} />}
    </span>
  </th>
);
const TH = ({ children, style = {} }) => (
  <th style={{
    padding: "10px 12px", fontSize: 11, fontWeight: 600, textAlign: "left",
    color: "var(--gig-text-muted)", textTransform: "uppercase", letterSpacing: ".07em",
    background: "var(--gig-thead)", borderBottom: "1px solid var(--gig-border)",
    whiteSpace: "nowrap", ...style,
  }}>{children}</th>
);

// ─────────────────────────────────────────────────────────────────────────────
// Panel image gallery
// ─────────────────────────────────────────────────────────────────────────────
const ImageGallery = ({ images = [] }) => {
  const [active, setActive] = useState(0);
  if (!images.length) return null;
  return (
    <div>
      {/* Hero */}
      <div style={{ borderRadius: 10, overflow: "hidden", background: "var(--gig-shimmer)", aspectRatio: "16/9", marginBottom: 8 }}>
        <img src={images[active]} alt="gig preview" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          onError={e => e.target.style.opacity = 0} />
      </div>
      {/* Thumbnails */}
      {images.length > 1 && (
        <div style={{ display: "flex", gap: 6, overflowX: "auto" }}>
          {images.map((img, i) => (
            <button key={i} onClick={() => setActive(i)} style={{
              flexShrink: 0, width: 56, height: 40, borderRadius: 6, overflow: "hidden",
              border: `2px solid ${i === active ? "var(--gig-accent)" : "var(--gig-border)"}`,
              padding: 0, cursor: "pointer", background: "var(--gig-shimmer)",
            }}>
              <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={e => e.target.style.opacity = 0} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
const Gigs = () => {
  const queryClient = useQueryClient();

  const [page,        setPage]        = useState(1);
  const [pageSize,    setPageSize]    = useState(24);
  const [search,      setSearch]      = useState("");
  const [status,      setStatus]      = useState("all");
  const [sortKey,     setSortKey]     = useState("createdAt");
  const [sortDir,     setSortDir]     = useState("desc");
  const [selectedIds, setSelectedIds] = useState([]);
  const [panelGig,    setPanelGig]    = useState(null);
  const [viewMode,    setViewMode]    = useState("auto"); // "auto" | "table" | "grid"
  const [isMobile,    setIsMobile]    = useState(false);
  const searchRef = useRef(null);

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const showGrid  = viewMode === "grid" || (viewMode === "auto" && isMobile);
  const showTable = !showGrid;

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: analytics, isLoading: aLoading } = useQuery({
    queryKey: ["gig-analytics"],
    queryFn:  () => gigsApi.getAnalytics?.().then(r => r.data?.analytics ?? r.data).catch(() => null),
    staleTime: 60_000,
  });

  const { data: gd, isLoading, isFetching } = useQuery({
    queryKey: ["gigs", page, pageSize, status, search, sortKey, sortDir],
    queryFn:  () => gigsApi.getAll({
      page, limit: pageSize,
      isActive: status !== "all" ? status : undefined,
      search:   search || undefined,
      sort:     `${sortDir === "desc" ? "-" : ""}${sortKey}`,
    }).then(r => r.data),
    keepPreviousData: true,
    staleTime: 30_000,
  });

  // ── Mutations ────────────────────────────────────────────────────────────
  const statusMut = useMutation({
    mutationFn: ({ id, isActive }) => gigsApi.updateStatus(id, isActive),
    onSuccess: res => {
      toast.success(res.data?.message || "Status updated");
      queryClient.invalidateQueries(["gigs"]);
      queryClient.invalidateQueries(["gig-analytics"]);
      if (panelGig) setPanelGig(g => ({ ...g, isActive: !g.isActive }));
    },
    onError: () => toast.error("Failed to update status"),
  });

  const bulkMut = useMutation({
    mutationFn: data => gigsApi.bulkStatusUpdate(data),
    onSuccess: res => {
      toast.success(res.data?.message || `${selectedIds.length} gigs updated`);
      setSelectedIds([]);
      queryClient.invalidateQueries(["gigs"]);
      queryClient.invalidateQueries(["gig-analytics"]);
    },
    onError: () => toast.error("Bulk update failed"),
  });

  // ── Derived ────────────────────────────────────────────────────────────
  const gigs       = gd?.gigs || [];
  const pagination = gd?.pagination || {};
  const totalPages = pagination.pages || 1;
  const allSel     = gigs.length > 0 && selectedIds.length === gigs.length;
  const someSel    = selectedIds.length > 0 && !allSel;

  const handleSort = field => {
    if (sortKey === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(field); setSortDir("desc"); }
    setPage(1);
  };

  const handleToggle = gig => statusMut.mutate({ id: gig._id, isActive: !gig.isActive });

  const handleBulk = isActive => {
    if (!window.confirm(`${isActive ? "Activate" : "Deactivate"} ${selectedIds.length} gig(s)?`)) return;
    bulkMut.mutate({ gigIds: selectedIds, isActive });
  };

  const handleExport = () => {
    toast.success("Preparing gig catalog export…");
    gigsApi.export?.({ isActive: status !== "all" ? status : undefined, search });
  };

  const visiblePages = () => {
    const ps = [];
    const s = Math.max(2, page - 1);
    const e = Math.min(totalPages - 1, page + 1);
    ps.push(1);
    if (s > 2) ps.push("…");
    for (let i = s; i <= e; i++) ps.push(i);
    if (e < totalPages - 1) ps.push("…");
    if (totalPages > 1) ps.push(totalPages);
    return ps;
  };

  useEffect(() => {
    const h = e => { if (e.key === "Escape") setPanelGig(null); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        :root {
          --gig-page:          #f8f9fa;
          --gig-card:          #ffffff;
          --gig-surface:       #ffffff;
          --gig-thead:         #f8f9fa;
          --gig-border:        #e5e7eb;
          --gig-row-brd:       #f3f4f6;
          --gig-shadow:        rgba(0,0,0,.06);
          --gig-shimmer:       #f1f3f4;
          --gig-text-primary:  #111827;
          --gig-text-muted:    #6b7280;
          --gig-accent:        #111827;
          --gig-hover-row:     #f9fafb;
          --gig-input-brd:     #d1d5db;
          --gig-input-focus:   #111827;
          --gig-btn-bg:        #ffffff;
          --gig-btn-brd:       #d1d5db;
          --gig-btn-text:      #374151;
          --gig-panel-bg:      #ffffff;
          --gig-panel-hdr:     #f8f9fa;
          --gig-sel-brd:       #93c5fd;
          --gig-sel-bar-bg:    #eff6ff;
          --gig-sel-text:      #1d4ed8;
          --gig-active-bg:     #f0fdf4;
          --gig-active-text:   #15803d;
          --gig-active-brd:    #bbf7d0;
          --gig-inactive-bg:   #f9fafb;
          --gig-inactive-text: #6b7280;
          --gig-inactive-brd:  #e5e7eb;
        }
        @media (prefers-color-scheme: dark) {
          :root {
            --gig-page: #0a0a0a; --gig-card: #111111; --gig-surface: #111111;
            --gig-thead: #161616; --gig-border: #1f1f1f; --gig-row-brd: #191919;
            --gig-shadow: rgba(0,0,0,.3); --gig-shimmer: #1a1a1a;
            --gig-text-primary: #f3f4f6; --gig-text-muted: #6b7280; --gig-accent: #f3f4f6;
            --gig-hover-row: #161616;
            --gig-input-brd: #2a2a2a; --gig-input-focus: #f3f4f6;
            --gig-btn-bg: #161616; --gig-btn-brd: #2a2a2a; --gig-btn-text: #d1d5db;
            --gig-panel-bg: #111111; --gig-panel-hdr: #161616;
            --gig-sel-brd: #1e40af; --gig-sel-bar-bg: #1e3a5f; --gig-sel-text: #93c5fd;
            --gig-active-bg: #14532d; --gig-active-text: #86efac; --gig-active-brd: #166534;
            --gig-inactive-bg: #1f2937; --gig-inactive-text: #9ca3af; --gig-inactive-brd: #374151;
          }
        }
        .dark {
          --gig-page: #0a0a0a; --gig-card: #111111; --gig-surface: #111111;
          --gig-thead: #161616; --gig-border: #1f1f1f; --gig-row-brd: #191919;
          --gig-shadow: rgba(0,0,0,.3); --gig-shimmer: #1a1a1a;
          --gig-text-primary: #f3f4f6; --gig-text-muted: #6b7280; --gig-accent: #f3f4f6;
          --gig-hover-row: #161616;
          --gig-input-brd: #2a2a2a; --gig-input-focus: #f3f4f6;
          --gig-btn-bg: #161616; --gig-btn-brd: #2a2a2a; --gig-btn-text: #d1d5db;
          --gig-panel-bg: #111111; --gig-panel-hdr: #161616;
          --gig-sel-brd: #1e40af; --gig-sel-bar-bg: #1e3a5f; --gig-sel-text: #93c5fd;
          --gig-active-bg: #14532d; --gig-active-text: #86efac; --gig-active-brd: #166534;
          --gig-inactive-bg: #1f2937; --gig-inactive-text: #9ca3af; --gig-inactive-brd: #374151;
        }

        @keyframes gig-shimmer { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes gig-pulse   { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.6;transform:scale(.8)} }
        @keyframes gig-slideIn { from{transform:translateX(100%);opacity:0} to{transform:translateX(0);opacity:1} }
        @keyframes gig-fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes gig-fadeUp  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }

        .gig-row:hover td { background: var(--gig-hover-row) !important; }
        .gig-row.gig-sel  td { background: var(--gig-sel-bar-bg) !important; }
        .gig-act { opacity:0; transition: opacity .15s; }
        .gig-row:hover .gig-act { opacity:1; }
        .gig-tbtn { background: var(--gig-btn-bg); border: 1px solid var(--gig-btn-brd); color: var(--gig-btn-text); cursor: pointer; border-radius: 6px; font-size: 13px; display: flex; align-items: center; gap: 6px; padding: 7px 14px; font-weight: 500; transition: opacity .15s; }
        .gig-tbtn:hover { opacity: .8; }
        .gig-input { width:100%; box-sizing:border-box; padding:9px 12px 9px 38px; border:1px solid var(--gig-input-brd); border-radius:6px; font-size:13px; color:var(--gig-text-primary); background:var(--gig-card); outline:none; transition:border .15s; }
        .gig-input:focus { border-color: var(--gig-input-focus); }
        .gig-panel-scroll::-webkit-scrollbar { width:4px; }
        .gig-panel-scroll::-webkit-scrollbar-thumb { background:var(--gig-border); border-radius:2px; }
        .gig-chip-btn { padding:4px 11px; border-radius:999px; font-size:11px; font-weight:600; cursor:pointer; border:1px solid; transition:all .15s; }
        .gig-vm-btn { width:30px; height:30px; border-radius:6px; border:1px solid var(--gig-btn-brd); background:var(--gig-btn-bg); color:var(--gig-text-muted); cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all .15s; }
        .gig-vm-btn.active { background:var(--gig-text-primary); color:var(--gig-page); border-color:var(--gig-text-primary); }
        .gig-vm-btn:hover:not(.active) { background:var(--gig-hover-row); }

        /* Responsive grid */
        .gig-grid { display:grid; gap:14px; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); }
        @media (max-width: 480px) {
          .gig-grid { grid-template-columns: 1fr; }
        }
        @media (min-width: 640px) and (max-width: 900px) {
          .gig-grid { grid-template-columns: 1fr 1fr; }
        }
      `}</style>

      <div style={{ background: "var(--gig-page)", minHeight: "100vh", fontFamily: "system-ui,-apple-system,sans-serif" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "20px 16px", display: "flex", flexDirection: "column", gap: 18 }}>

          {/* ── Breadcrumb ──────────────────────────────────────────────── */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--gig-text-muted)" }}>
            <HiOutlineHome size={14} />
            <span style={{ color: "var(--gig-border)" }}>/</span>
            <span>Admin</span>
            <span style={{ color: "var(--gig-border)" }}>/</span>
            <span style={{ color: "var(--gig-text-primary)", fontWeight: 600 }}>Gigs</span>
          </div>

          {/* ── Page header ───────────────────────────────────────────────── */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "var(--gig-text-primary)", letterSpacing: "-.3px" }}>
                Gigs Catalog
              </h1>
              <p style={{ margin: "3px 0 0", fontSize: 13, color: "var(--gig-text-muted)" }}>
                Moderate service listings, verify quality, and manage visibility.
              </p>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <button onClick={() => queryClient.invalidateQueries(["gigs"])} className="gig-tbtn">
                <HiOutlineArrowPath size={14} style={isFetching ? { animation: "gig-shimmer .6s linear infinite" } : {}} />
                <span style={{ display: isMobile ? "none" : "inline" }}>Refresh</span>
              </button>
              <button onClick={handleExport} style={{
                display: "flex", alignItems: "center", gap: 6, padding: "7px 14px",
                background: "var(--gig-text-primary)", border: "none", borderRadius: 6,
                fontSize: 13, color: "var(--gig-page)", cursor: "pointer", fontWeight: 600,
              }}>
                <HiOutlineArrowDownTray size={14} />
                <span style={{ display: isMobile ? "none" : "inline" }}>Export</span>
              </button>
            </div>
          </div>

          {/* ── KPI cards ──────────────────────────────────────────────────── */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <KpiCard
              label="Total Listings"   value={(analytics?.summary?.totalGigs ?? pagination.total ?? 0).toLocaleString()}
              icon={HiOutlineBriefcase} iconColor="#6d28d9" loading={aLoading}
            />
            <KpiCard
              label="Active"    value={(analytics?.summary?.activeGigs ?? 0).toLocaleString()}
              icon={HiOutlineCheckCircle} iconColor="#15803d" loading={aLoading}
            />
            <KpiCard
              label="Archived"  value={(analytics?.summary?.pausedGigs ?? 0).toLocaleString()}
              icon={HiOutlineXCircle} iconColor="#6b7280" loading={aLoading}
            />
            <KpiCard
              label="Top Revenue Gig"
              value={formatCurrency(analytics?.topGigsByRevenue?.[0]?.revenue || 0)}
              sub={analytics?.topGigsByRevenue?.[0]?.title?.slice(0, 24) + "…" || ""}
              icon={HiOutlineFire} iconColor="#b45309" loading={aLoading}
            />
          </div>

          {/* ── Main card ──────────────────────────────────────────────────── */}
          <div style={{
            background: "var(--gig-card)", border: "1px solid var(--gig-border)",
            borderRadius: 10, overflow: "hidden", boxShadow: "0 1px 3px var(--gig-shadow)",
          }}>
            {/* Toolbar */}
            <div style={{
              padding: "12px 16px", borderBottom: "1px solid var(--gig-border)",
              display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
            }}>
              {/* Search */}
              <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
                <HiOutlineMagnifyingGlass size={15} style={{
                  position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)",
                  color: "var(--gig-text-muted)", pointerEvents: "none",
                }} />
                <input ref={searchRef} type="text" placeholder="Search by title, category or editor…"
                  className="gig-input" value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }} />
                {search && (
                  <button onClick={() => { setSearch(""); setPage(1); searchRef.current?.focus(); }}
                    style={{ position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--gig-text-muted)", padding: 2, display: "flex" }}>
                    <HiOutlineXMark size={14} />
                  </button>
                )}
              </div>

              {/* Status chips */}
              <div style={{ display: "flex", gap: 5, alignItems: "center", flexWrap: "wrap" }}>
                {[["all","All"],["true","Active"],["false","Archived"]].map(([v, l]) => (
                  <button key={v} onClick={() => { setStatus(v); setPage(1); }}
                    className="gig-chip-btn"
                    style={{
                      background:  status === v ? "var(--gig-text-primary)" : "transparent",
                      color:       status === v ? "var(--gig-page)"         : "var(--gig-text-muted)",
                      borderColor: status === v ? "var(--gig-text-primary)" : "var(--gig-border)",
                    }}
                  >{l}</button>
                ))}
              </div>

              {/* View mode + page size */}
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginLeft: "auto" }}>
                {/* View toggle */}
                <div style={{ display: "flex", gap: 3 }}>
                  {[["auto","≡"],["table","☰"],["grid","⊞"]].map(([v, icon]) => (
                    <button key={v} onClick={() => setViewMode(v)}
                      className={`gig-vm-btn${viewMode === v ? " active" : ""}`}
                      title={v === "auto" ? "Responsive" : v === "table" ? "Table view" : "Grid view"}
                      style={{ fontSize: 14 }}
                    >{icon}</button>
                  ))}
                </div>
                <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                  style={{ background: "var(--gig-card)", border: "1px solid var(--gig-btn-brd)", color: "var(--gig-text-primary)", borderRadius: 6, padding: "5px 8px", fontSize: 12, outline: "none", cursor: "pointer" }}>
                  {[12, 24, 48, 100].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>

            {/* Bulk bar */}
            {selectedIds.length > 0 && (
              <div style={{
                padding: "9px 16px", background: "var(--gig-sel-bar-bg)",
                borderBottom: `1px solid var(--gig-sel-brd)`,
                display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
                animation: "gig-fadeIn .2s ease",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 20, height: 20, borderRadius: 4, background: "#1d4ed8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <HiMiniCheck size={12} style={{ color: "#fff" }} />
                  </div>
                  <span style={{ fontSize: 13, color: "var(--gig-sel-text)", fontWeight: 600 }}>
                    {selectedIds.length} selected
                  </span>
                </div>
                <button onClick={() => handleBulk(true)} disabled={bulkMut.isPending}
                  style={{ padding: "4px 12px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 6, fontSize: 12, fontWeight: 600, color: "#15803d", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                  <HiOutlineLockOpen size={12} /> Activate
                </button>
                <button onClick={() => handleBulk(false)} disabled={bulkMut.isPending}
                  style={{ padding: "4px 12px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, fontSize: 12, fontWeight: 600, color: "#b91c1c", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                  <HiOutlineLockClosed size={12} /> Archive
                </button>
                <button onClick={() => setSelectedIds([])}
                  style={{ marginLeft: "auto", background: "none", border: "none", fontSize: 12, color: "var(--gig-text-muted)", cursor: "pointer" }}>
                  Clear
                </button>
              </div>
            )}

            {/* ── Grid view ─────────────────────────────────────────────── */}
            {showGrid && (
              <div style={{ padding: "16px" }}>
                {isLoading ? (
                  <div className="gig-grid">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} style={{ borderRadius: 10, overflow: "hidden", border: "1px solid var(--gig-border)", background: "var(--gig-card)" }}>
                        <div style={{ height: 130, background: "var(--gig-shimmer)", animation: "gig-shimmer 1.4s ease infinite" }} />
                        <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                          <div style={{ height: 14, width: "80%", borderRadius: 4, background: "var(--gig-shimmer)", animation: "gig-shimmer 1.4s ease infinite" }} />
                          <div style={{ height: 12, width: "55%", borderRadius: 4, background: "var(--gig-shimmer)", animation: "gig-shimmer 1.4s ease infinite" }} />
                          <div style={{ height: 32, borderRadius: 6, background: "var(--gig-shimmer)", animation: "gig-shimmer 1.4s ease infinite" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : gigs.length === 0 ? (
                  <div style={{ padding: "60px 0", textAlign: "center" }}>
                    <div style={{ width: 52, height: 52, borderRadius: 12, border: "2px dashed var(--gig-border)", background: "var(--gig-shimmer)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                      <HiOutlineBriefcase size={22} style={{ color: "var(--gig-text-muted)", opacity: .4 }} />
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--gig-text-primary)", marginBottom: 5 }}>No gigs found</div>
                    <div style={{ fontSize: 13, color: "var(--gig-text-muted)" }}>Try adjusting the search or filters.</div>
                  </div>
                ) : (
                  <div className="gig-grid">
                    {gigs.map(gig => (
                      <GigCard
                        key={gig._id} gig={gig}
                        onView={g => setPanelGig(g)}
                        onToggle={handleToggle}
                        selected={selectedIds.includes(gig._id)}
                        onSelect={(id, checked) => setSelectedIds(p => checked ? [...p, id] : p.filter(x => x !== id))}
                        toggling={statusMut.isPending}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Table view ────────────────────────────────────────────── */}
            {showTable && (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 820 }}>
                  <thead>
                    <tr>
                      <th style={{ width: 44, padding: "10px 12px", background: "var(--gig-thead)", borderBottom: "1px solid var(--gig-border)" }}>
                        <input type="checkbox" checked={allSel}
                          ref={el => { if (el) el.indeterminate = someSel; }}
                          onChange={e => setSelectedIds(e.target.checked ? gigs.map(g => g._id) : [])}
                          style={{ width: 15, height: 15, cursor: "pointer", accentColor: "#1d4ed8" }} />
                      </th>
                      <TH style={{ minWidth: 70 }}>Preview</TH>
                      <SortTH label="Title"     field="title"       sk={sortKey} sd={sortDir} onSort={handleSort} style={{ minWidth: 200 }} />
                      <TH>Editor</TH>
                      <SortTH label="Price"     field="price"       sk={sortKey} sd={sortDir} onSort={handleSort} />
                      <TH>Rating</TH>
                      <SortTH label="Orders"    field="totalOrders" sk={sortKey} sd={sortDir} onSort={handleSort} />
                      <TH>Status</TH>
                      <SortTH label="Created"   field="createdAt"   sk={sortKey} sd={sortDir} onSort={handleSort} style={{ minWidth: 110 }} />
                      <TH style={{ textAlign: "right" }}>Actions</TH>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                    ) : gigs.length === 0 ? (
                      <tr>
                        <td colSpan={10}>
                          <div style={{ padding: "60px 0", textAlign: "center" }}>
                            <div style={{ width: 52, height: 52, borderRadius: 12, border: "2px dashed var(--gig-border)", background: "var(--gig-shimmer)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                              <HiOutlineBriefcase size={22} style={{ color: "var(--gig-text-muted)", opacity: .4 }} />
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--gig-text-primary)", marginBottom: 5 }}>
                              {search || status !== "all" ? "No gigs match your filters" : "No gigs yet"}
                            </div>
                            <div style={{ fontSize: 13, color: "var(--gig-text-muted)" }}>
                              {search || status !== "all" ? "Try adjusting the search or status filter." : "Gigs will appear here once editors create them."}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : gigs.map(gig => {
                      const isSel = selectedIds.includes(gig._id);
                      return (
                        <tr key={gig._id} className={`gig-row${isSel ? " gig-sel" : ""}`}
                          style={{ borderBottom: "1px solid var(--gig-row-brd)", transition: "background .1s" }}>
                          <td style={{ padding: "11px 12px" }}>
                            <input type="checkbox" checked={isSel}
                              onChange={e => setSelectedIds(p => e.target.checked ? [...p, gig._id] : p.filter(x => x !== gig._id))}
                              style={{ width: 15, height: 15, cursor: "pointer", accentColor: "#1d4ed8" }} />
                          </td>
                          <td style={{ padding: "11px 12px" }}>
                            <GigThumbnail src={gig.images?.[0] || gig.thumbnail} title={gig.title} size={64} />
                          </td>
                          <td style={{ padding: "11px 12px", maxWidth: 240 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--gig-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {gig.title}
                            </div>
                            {gig.category && (
                              <div style={{ fontSize: 10, fontWeight: 600, color: "var(--gig-text-muted)", textTransform: "uppercase", letterSpacing: ".07em", marginTop: 2 }}>
                                {gig.category}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: "11px 12px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <UserAvatar src={gig.editor?.profilePicture} name={gig.editor?.name} size={24} />
                              <span style={{ fontSize: 12, fontWeight: 500, color: "var(--gig-text-primary)", whiteSpace: "nowrap", maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis" }}>
                                {gig.editor?.name}
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: "11px 12px", whiteSpace: "nowrap" }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--gig-text-primary)" }}>
                              {formatCurrency(gig.price)}
                            </span>
                          </td>
                          <td style={{ padding: "11px 12px" }}>
                            <StarRating value={gig.rating} />
                          </td>
                          <td style={{ padding: "11px 12px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <HiOutlineShoppingBag size={12} style={{ color: "var(--gig-text-muted)" }} />
                              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--gig-text-primary)" }}>
                                {formatNumber(gig.totalOrders || 0)}
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: "11px 12px" }}>
                            <StatusChip active={gig.isActive} sm />
                          </td>
                          <td style={{ padding: "11px 12px", fontSize: 12, color: "var(--gig-text-muted)", whiteSpace: "nowrap" }}>
                            {formatDate(gig.createdAt)}
                          </td>
                          <td style={{ padding: "11px 12px", textAlign: "right" }}>
                            <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", alignItems: "center" }}>
                              <button onClick={() => setPanelGig(gig)}
                                style={{ padding: "5px 12px", background: "var(--gig-card)", border: "1px solid var(--gig-border)", borderRadius: 6, fontSize: 12, fontWeight: 600, color: "var(--gig-text-primary)", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}
                                className="gig-tbtn"
                              >
                                <HiOutlineEye size={13} /> View
                              </button>
                              <button
                                onClick={() => handleToggle(gig)} disabled={statusMut.isPending}
                                className="gig-act gig-tbtn"
                                style={{
                                  padding: "5px 10px", fontSize: 12,
                                  background: gig.isActive ? "#fef2f2" : "#f0fdf4",
                                  border: `1px solid ${gig.isActive ? "#fecaca" : "#bbf7d0"}`,
                                  color: gig.isActive ? "#b91c1c" : "#15803d",
                                }}
                                title={gig.isActive ? "Archive" : "Activate"}
                              >
                                {gig.isActive ? <HiOutlineLockClosed size={13} /> : <HiOutlineLockOpen size={13} />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {!isLoading && gigs.length > 0 && (
              <div style={{
                padding: "12px 16px", borderTop: "1px solid var(--gig-border)",
                display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10,
              }}>
                <div style={{ fontSize: 13, color: "var(--gig-text-muted)" }}>
                  Showing{" "}
                  <b style={{ color: "var(--gig-text-primary)" }}>
                    {((pagination.page - 1) * pageSize) + 1}–{Math.min(pagination.page * pageSize, pagination.total)}
                  </b>
                  {" "}of{" "}
                  <b style={{ color: "var(--gig-text-primary)" }}>{pagination.total?.toLocaleString()}</b>
                </div>
                <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    style={{ width: 30, height: 30, borderRadius: 5, border: "1px solid var(--gig-border)", background: "var(--gig-card)", cursor: page === 1 ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: page === 1 ? .3 : 1, color: "var(--gig-text-muted)" }}>
                    <HiOutlineChevronLeft size={13} />
                  </button>
                  {visiblePages().map((p, i) =>
                    p === "…" ? (
                      <span key={i} style={{ width: 30, textAlign: "center", fontSize: 13, color: "var(--gig-text-muted)", lineHeight: "30px" }}>…</span>
                    ) : (
                      <button key={p} onClick={() => setPage(p)}
                        style={{ width: 30, height: 30, borderRadius: 5, border: "1px solid", borderColor: page === p ? "var(--gig-text-primary)" : "var(--gig-border)", background: page === p ? "var(--gig-text-primary)" : "var(--gig-card)", color: page === p ? "var(--gig-page)" : "var(--gig-text-primary)", fontSize: 13, fontWeight: page === p ? 700 : 400, cursor: "pointer" }}>
                        {p}
                      </button>
                    )
                  )}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    style={{ width: 30, height: 30, borderRadius: 5, border: "1px solid var(--gig-border)", background: "var(--gig-card)", cursor: page === totalPages ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: page === totalPages ? .3 : 1, color: "var(--gig-text-muted)" }}>
                    <HiOutlineChevronRight size={13} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  GIG DETAIL SLIDE-OVER                                              */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {panelGig && (
        <>
          <div onClick={() => setPanelGig(null)} style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", backdropFilter: "blur(2px)",
            zIndex: 1000, animation: "gig-fadeIn .2s ease",
          }} />
          <div style={{
            position: "fixed", top: 0, right: 0, bottom: 0, width: "min(500px, 100vw)",
            background: "var(--gig-panel-bg)", zIndex: 1001,
            display: "flex", flexDirection: "column",
            boxShadow: "-6px 0 32px rgba(0,0,0,.18)",
            animation: "gig-slideIn .25s cubic-bezier(.4,0,.2,1)",
            borderLeft: "1px solid var(--gig-border)",
          }}>
            {/* Header */}
            <div style={{
              padding: "15px 20px", borderBottom: "1px solid var(--gig-border)",
              background: "var(--gig-panel-hdr)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0,
            }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--gig-text-primary)" }}>Gig Details</div>
                <div style={{ fontSize: 12, color: "var(--gig-text-muted)", marginTop: 2 }}>Moderation & quality review</div>
              </div>
              <button onClick={() => setPanelGig(null)} style={{ width: 32, height: 32, borderRadius: 6, border: "none", background: "var(--gig-shimmer)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--gig-text-muted)" }}>
                <HiOutlineXMark size={17} />
              </button>
            </div>

            {/* Body */}
            <div className="gig-panel-scroll" style={{ flex: 1, overflowY: "auto" }}>
              <div style={{ animation: "gig-fadeUp .25s ease" }}>

                {/* Image gallery */}
                {panelGig.images?.length > 0 && (
                  <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--gig-border)" }}>
                    <ImageGallery images={panelGig.images} />
                  </div>
                )}

                {/* Title block */}
                <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--gig-border)" }}>
                  {panelGig.category && (
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 10px", borderRadius: 999, background: "var(--gig-shimmer)", border: "1px solid var(--gig-border)", fontSize: 10, fontWeight: 700, color: "var(--gig-text-muted)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 8 }}>
                      <HiOutlineTag size={10} /> {panelGig.category}
                    </div>
                  )}
                  <h2 style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 700, color: "var(--gig-text-primary)", lineHeight: 1.35 }}>
                    {panelGig.title}
                  </h2>
                  <StatusChip active={panelGig.isActive} />
                </div>

                {/* Quick stats */}
                <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--gig-border)" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
                    {[
                      { label: "Price",    value: formatCurrency(panelGig.price), icon: HiOutlineCurrencyRupee, color: "#6d28d9" },
                      { label: "Rating",   value: panelGig.rating ? panelGig.rating.toFixed(1) : "—", icon: HiOutlineStar, color: "#b45309" },
                      { label: "Orders",   value: formatNumber(panelGig.totalOrders || 0), icon: HiOutlineShoppingBag, color: "#0369a1" },
                      { label: "Delivery", value: panelGig.deliveryDays ? `${panelGig.deliveryDays}d` : "—", icon: HiOutlineClock, color: "#15803d" },
                    ].map((s, i) => (
                      <div key={i} style={{ background: "var(--gig-shimmer)", border: "1px solid var(--gig-border)", borderRadius: 8, padding: "10px 8px", textAlign: "center" }}>
                        <s.icon size={15} style={{ color: s.color, display: "block", margin: "0 auto 4px" }} />
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--gig-text-primary)" }}>{s.value}</div>
                        <div style={{ fontSize: 10, color: "var(--gig-text-muted)", marginTop: 1, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em" }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--gig-border)" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--gig-text-muted)", marginBottom: 10 }}>
                    Service Description
                  </div>
                  <div style={{ fontSize: 13, color: "var(--gig-text-primary)", lineHeight: 1.7, background: "var(--gig-shimmer)", border: "1px solid var(--gig-border)", borderRadius: 8, padding: 14 }}>
                    {panelGig.description || "No description provided."}
                  </div>
                </div>

                {/* Tags */}
                {panelGig.tags?.length > 0 && (
                  <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--gig-border)" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--gig-text-muted)", marginBottom: 10 }}>
                      Tags
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {panelGig.tags.map((tag, i) => (
                        <span key={i} style={{ padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: "var(--gig-shimmer)", border: "1px solid var(--gig-border)", color: "var(--gig-text-muted)" }}>
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Editor */}
                <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--gig-border)" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--gig-text-muted)", marginBottom: 10 }}>
                    Service Provider
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, background: "var(--gig-shimmer)", border: "1px solid var(--gig-border)", borderRadius: 8 }}>
                    <UserAvatar src={panelGig.editor?.profilePicture} name={panelGig.editor?.name} size={44} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--gig-text-primary)" }}>{panelGig.editor?.name}</div>
                      <div style={{ fontSize: 12, color: "var(--gig-text-muted)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{panelGig.editor?.email}</div>
                    </div>
                    <HiOutlineArrowTopRightOnSquare size={16} style={{ color: "var(--gig-text-muted)", flexShrink: 0 }} />
                  </div>
                </div>

                {/* Metadata */}
                <div style={{ padding: "14px 20px" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--gig-text-muted)", marginBottom: 10 }}>
                    Technical Details
                  </div>
                  {[
                    { label: "Gig ID",       value: panelGig._id,         mono: true },
                    { label: "Created",      value: formatDate(panelGig.createdAt) },
                    { label: "Last Updated", value: formatDate(panelGig.updatedAt) },
                    { label: "Revisions",    value: panelGig.revisions ?? "—" },
                  ].map((row, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid var(--gig-row-brd)" }}>
                      <span style={{ fontSize: 13, color: "var(--gig-text-muted)" }}>{row.label}</span>
                      <span style={{ fontSize: row.mono ? 11 : 13, fontWeight: 600, color: "var(--gig-text-primary)", fontFamily: row.mono ? "monospace" : "inherit", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: "13px 20px", borderTop: "1px solid var(--gig-border)", background: "var(--gig-panel-hdr)", display: "flex", gap: 10, flexShrink: 0 }}>
              <button
                onClick={() => handleToggle(panelGig)}
                disabled={statusMut.isPending}
                style={{
                  flex: 1, padding: "9px 0", borderRadius: 7, border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  background: panelGig.isActive ? "#dc2626" : "#15803d",
                  color: "#fff",
                  opacity: statusMut.isPending ? .6 : 1,
                }}
              >
                {panelGig.isActive
                  ? <><HiOutlineLockClosed size={14} />{statusMut.isPending ? "Archiving…" : "Archive Gig"}</>
                  : <><HiOutlineLockOpen size={14} />{statusMut.isPending ? "Activating…" : "Activate Gig"}</>}
              </button>
              <button onClick={() => setPanelGig(null)} className="gig-tbtn" style={{ padding: "9px 20px" }}>Close</button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Gigs;