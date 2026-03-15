// ─── Conversations.jsx — Production Communication Hub ────────────────────────
// Light/dark theme via CSS variables. Fully responsive. Zero Tailwind + framer-motion.
// Deps: @tanstack/react-query, react-hot-toast, react-icons/hi2, ../api/adminApi, ../utils/formatters

import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  HiOutlineChatBubbleLeftRight,
  HiOutlineMagnifyingGlass,
  HiOutlineXMark,
  HiOutlineEye,
  HiOutlineUser,
  HiOutlinePaperClip,
  HiOutlinePhoto,
  HiOutlineVideoCamera,
  HiOutlineArrowPath,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineFlag,
  HiOutlineChatBubbleOvalLeftEllipsis,
  HiOutlineHome,
  HiOutlineCheck,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
  HiOutlineNoSymbol,
  HiOutlineShieldExclamation,
  HiOutlineDocumentArrowDown,
  HiOutlineInformationCircle,
  HiOutlineClock,
  HiOutlineArrowDownTray,
  HiOutlineBriefcase,
  HiOutlineUserGroup,
  HiMiniCheck,
  HiOutlineHashtag,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineBellAlert,
  HiOutlineChartBarSquare,
} from "react-icons/hi2";
import { toast } from "react-hot-toast";
import { conversationsApi } from "../api/adminApi";
import { formatDate, formatRelativeTime } from "../utils/formatters";

// ─────────────────────────────────────────────────────────────────────────────
// Status config
// ─────────────────────────────────────────────────────────────────────────────
const STATUS = {
  new:         { label: "New",         dot: "#3b82f6", bg: "#eff6ff", text: "#1d4ed8", brd: "#bfdbfe", dark_bg: "#1e3a5f", dark_text: "#93c5fd" },
  accepted:    { label: "Accepted",    dot: "#22c55e", bg: "#f0fdf4", text: "#15803d", brd: "#bbf7d0", dark_bg: "#14532d", dark_text: "#86efac" },
  in_progress: { label: "In Progress", dot: "#8b5cf6", bg: "#f5f3ff", text: "#6d28d9", brd: "#ddd6fe", dark_bg: "#2e1065", dark_text: "#c4b5fd" },
  submitted:   { label: "Submitted",   dot: "#f97316", bg: "#fff7ed", text: "#c2410c", brd: "#fed7aa", dark_bg: "#431407", dark_text: "#fdba74" },
  completed:   { label: "Completed",   dot: "#22c55e", bg: "#f0fdf4", text: "#15803d", brd: "#bbf7d0", dark_bg: "#14532d", dark_text: "#86efac" },
  disputed:    { label: "Disputed",    dot: "#ef4444", bg: "#fef2f2", text: "#b91c1c", brd: "#fecaca", dark_bg: "#450a0a", dark_text: "#fca5a5" },
  cancelled:   { label: "Cancelled",   dot: "#9ca3af", bg: "#f9fafb", text: "#4b5563", brd: "#e5e7eb", dark_bg: "#1f2937", dark_text: "#9ca3af" },
  rejected:    { label: "Rejected",    dot: "#ef4444", bg: "#fef2f2", text: "#b91c1c", brd: "#fecaca", dark_bg: "#450a0a", dark_text: "#fca5a5" },
};

// ─────────────────────────────────────────────────────────────────────────────
// Atoms
// ─────────────────────────────────────────────────────────────────────────────
const UserAvatar = ({ src, name, size = 30, online }) => {
  const [err, setErr] = useState(false);
  const initials = (name || "??").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const palette  = ["#6d28d9","#1d4ed8","#0369a1","#15803d","#b45309","#c2410c"];
  const bg       = palette[(name || "").charCodeAt(0) % palette.length];
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      {!err && src
        ? <img src={src} alt={name} onError={() => setErr(true)} style={{ width: size, height: size, borderRadius: 8, objectFit: "cover", border: "2px solid var(--cv-surface)", display: "block" }} />
        : <div style={{ width: size, height: size, borderRadius: 8, background: bg, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.35, fontWeight: 700, border: "2px solid var(--cv-surface)" }}>{initials}</div>}
      {online !== undefined && (
        <span style={{ position: "absolute", bottom: -1, right: -1, width: 8, height: 8, borderRadius: "50%", background: online ? "#22c55e" : "#9ca3af", border: "2px solid var(--cv-surface)" }} />
      )}
    </div>
  );
};

const StatusChip = ({ status, sm }) => {
  const cfg = STATUS[status] || STATUS.cancelled;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: sm ? "2px 8px" : "3px 10px", borderRadius: 999,
      fontSize: sm ? 10 : 11, fontWeight: 600, whiteSpace: "nowrap", lineHeight: 1.6,
      background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.brd}`,
    }}>
      <span style={{ width: sm ? 5 : 6, height: sm ? 5 : 6, borderRadius: "50%", background: cfg.dot, flexShrink: 0,
        ...(status === "disputed" ? { animation: "cv-pulse 1.5s infinite" } : {}) }} />
      {cfg.label}
    </span>
  );
};

const SkeletonRow = () => (
  <tr style={{ borderBottom: "1px solid var(--cv-row-brd)" }}>
    {[60, 160, 200, 80, 90, 60].map((w, i) => (
      <td key={i} style={{ padding: "13px 12px" }}>
        <div style={{ height: 13, width: w, borderRadius: 4, background: "var(--cv-shimmer)", animation: "cv-shimmer 1.4s ease infinite" }} />
      </td>
    ))}
  </tr>
);

const SortTH = ({ label, field, sk, sd, onSort, style = {} }) => (
  <th onClick={() => onSort(field)} style={{ padding: "10px 12px", fontSize: 11, fontWeight: 600, textAlign: "left", color: "var(--cv-text-muted)", textTransform: "uppercase", letterSpacing: ".07em", background: "var(--cv-thead)", borderBottom: "1px solid var(--cv-border)", cursor: "pointer", userSelect: "none", whiteSpace: "nowrap", ...style }}>
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      {label}
      {sk === field ? sd === "asc" ? <HiOutlineChevronUp size={11} style={{ color: "var(--cv-accent)" }} /> : <HiOutlineChevronDown size={11} style={{ color: "var(--cv-accent)" }} /> : <HiOutlineChevronDown size={11} style={{ opacity: .22 }} />}
    </span>
  </th>
);
const TH = ({ children, style = {} }) => (
  <th style={{ padding: "10px 12px", fontSize: 11, fontWeight: 600, textAlign: "left", color: "var(--cv-text-muted)", textTransform: "uppercase", letterSpacing: ".07em", background: "var(--cv-thead)", borderBottom: "1px solid var(--cv-border)", whiteSpace: "nowrap", ...style }}>{children}</th>
);

// Message type icon
const MsgTypeIcon = ({ type }) => {
  if (type === "image")  return <HiOutlinePhoto    size={12} style={{ color: "#3b82f6", flexShrink: 0 }} />;
  if (type === "video")  return <HiOutlineVideoCamera size={12} style={{ color: "#8b5cf6", flexShrink: 0 }} />;
  if (type === "file")   return <HiOutlinePaperClip  size={12} style={{ color: "#f59e0b", flexShrink: 0 }} />;
  return null;
};

// KPI card
const KpiCard = ({ label, value, icon: Icon, color, loading }) => (
  <div style={{ background: "var(--cv-card)", border: "1px solid var(--cv-border)", borderRadius: 10, padding: "14px 18px", flex: 1, minWidth: 130, display: "flex", alignItems: "center", gap: 12, boxShadow: "0 1px 3px var(--cv-shadow)" }}>
    <div style={{ width: 36, height: 36, borderRadius: 9, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <Icon size={16} style={{ color }} />
    </div>
    {loading ? (
      <div>
        <div style={{ height: 20, width: 44, borderRadius: 4, background: "var(--cv-shimmer)", marginBottom: 4, animation: "cv-shimmer 1.4s ease infinite" }} />
        <div style={{ height: 11, width: 66, borderRadius: 4, background: "var(--cv-shimmer)", animation: "cv-shimmer 1.4s ease infinite" }} />
      </div>
    ) : (
      <div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "var(--cv-text-primary)", lineHeight: 1.1 }}>{value ?? 0}</div>
        <div style={{ fontSize: 11, color: "var(--cv-text-muted)", marginTop: 2 }}>{label}</div>
      </div>
    )}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Chat message bubble
// ─────────────────────────────────────────────────────────────────────────────
const MessageBubble = ({ msg, isClient, onFlag, flagging, highlight }) => {
  const [hovered, setHovered] = useState(false);

  if (msg.type === "system") {
    return (
      <div style={{ textAlign: "center", padding: "6px 0" }}>
        <span style={{ padding: "3px 14px", borderRadius: 999, fontSize: 10, fontWeight: 700, color: "var(--cv-text-muted)", background: "var(--cv-shimmer)", border: "1px solid var(--cv-border)", textTransform: "uppercase", letterSpacing: ".07em" }}>
          {msg.content}
        </span>
      </div>
    );
  }

  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ display: "flex", gap: 10, flexDirection: isClient ? "row" : "row-reverse", alignItems: "flex-end", position: "relative" }}>
      <UserAvatar src={msg.sender?.profilePicture} name={msg.sender?.name} size={28} />
      <div style={{ maxWidth: "75%", display: "flex", flexDirection: "column", alignItems: isClient ? "flex-start" : "flex-end" }}>
        {/* Name + time */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, flexDirection: isClient ? "row" : "row-reverse" }}>
          <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em", color: isClient ? "#1d4ed8" : "#6d28d9" }}>{msg.sender?.name}</span>
          <span style={{ fontSize: 10, color: "var(--cv-text-muted)" }}>{formatRelativeTime ? formatRelativeTime(msg.createdAt) : formatDate(msg.createdAt)}</span>
          {msg.isFlagged && <HiOutlineFlag size={10} style={{ color: "#dc2626" }} />}
        </div>
        {/* Bubble */}
        <div style={{
          padding: "10px 14px", borderRadius: isClient ? "12px 12px 12px 2px" : "12px 12px 2px 12px",
          background: highlight
            ? "#fffbeb"
            : isClient ? "var(--cv-bubble-client-bg)" : "var(--cv-bubble-editor-bg)",
          border: `1px solid ${highlight ? "#fde68a" : isClient ? "var(--cv-bubble-client-brd)" : "var(--cv-bubble-editor-brd)"}`,
          position: "relative", maxWidth: "100%",
          boxShadow: "0 1px 2px var(--cv-shadow)",
        }}>
          {/* Attachments */}
          {msg.type === "image" && msg.mediaUrl && (
            <img src={msg.mediaUrl} alt="" style={{ maxWidth: 220, maxHeight: 160, borderRadius: 8, display: "block", marginBottom: msg.content ? 8 : 0, objectFit: "cover", cursor: "pointer" }}
              onClick={() => window.open(msg.mediaUrl, "_blank")} />
          )}
          {msg.type === "video" && msg.mediaUrl && (
            <video src={msg.mediaUrl} controls style={{ maxWidth: 220, borderRadius: 8, display: "block", marginBottom: msg.content ? 8 : 0 }} />
          )}
          {msg.type === "file" && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: "var(--cv-card)", border: "1px solid var(--cv-border)", borderRadius: 8, marginBottom: msg.content ? 8 : 0 }}>
              <HiOutlinePaperClip size={16} style={{ color: "#f59e0b", flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--cv-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{msg.mediaName || "Attachment"}</div>
              </div>
              {msg.mediaUrl && <a href={msg.mediaUrl} target="_blank" rel="noopener noreferrer"><HiOutlineArrowTopRightOnSquare size={13} style={{ color: "var(--cv-text-muted)" }} /></a>}
            </div>
          )}
          {msg.content && <p style={{ fontSize: 13, color: "var(--cv-text-primary)", lineHeight: 1.55, margin: 0, wordBreak: "break-word", whiteSpace: "pre-wrap" }}>{msg.content}</p>}
        </div>
      </div>
      {/* Flag button */}
      <button onClick={() => onFlag(msg._id)} disabled={flagging}
        style={{ position: "absolute", top: 0, [isClient ? "right" : "left"]: -4, width: 22, height: 22, borderRadius: 6, border: "1px solid var(--cv-border)", background: "var(--cv-card)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: hovered ? 1 : 0, transition: "opacity .15s", color: msg.isFlagged ? "#dc2626" : "var(--cv-text-muted)" }}>
        <HiOutlineFlag size={11} />
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
const Conversations = () => {
  const queryClient = useQueryClient();

  // list state
  const [page,        setPage]        = useState(1);
  const [pageSize,    setPageSize]    = useState(25);
  const [search,      setSearch]      = useState("");
  const [statusFilter,setStatusFilter]= useState("all");
  const [sortKey,     setSortKey]     = useState("updatedAt");
  const [sortDir,     setSortDir]     = useState("desc");
  const [selectedIds, setSelectedIds] = useState([]);

  // panel state
  const [panelId,     setPanelId]     = useState(null);
  const [activeTab,   setActiveTab]   = useState("messages");
  const [chatSearch,  setChatSearch]  = useState("");
  const [adminNote,   setAdminNote]   = useState("");
  const [flagConfirm, setFlagConfirm] = useState(null); // msgId

  const searchRef   = useRef(null);
  const chatEndRef  = useRef(null);
  const noteRef     = useRef(null);

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: cvData, isLoading, isFetching } = useQuery({
    queryKey: ["conversations", page, pageSize, statusFilter, search, sortKey, sortDir],
    queryFn: () => conversationsApi.getAll({ page, limit: pageSize, status: statusFilter !== "all" ? statusFilter : undefined, search: search || undefined, sort: `${sortDir === "desc" ? "-" : ""}${sortKey}` }).then(r => r.data),
    keepPreviousData: true,
    staleTime: 30_000,
  });

  const { data: panel, isLoading: panelLoading } = useQuery({
    queryKey: ["chat-detail", panelId],
    queryFn: () => conversationsApi.getById(panelId).then(r => r.data),
    enabled: !!panelId,
    staleTime: 20_000,
  });

  // ── Mutations ──────────────────────────────────────────────────────────
  const flagMut = useMutation({
    mutationFn: (msgId) => conversationsApi.flagMsg(panelId, msgId),
    onSuccess: () => { toast.success("Message flagged"); setFlagConfirm(null); queryClient.invalidateQueries(["chat-detail", panelId]); },
    onError: err => toast.error(err.response?.data?.message || "Flag failed"),
  });

  const noteMut = useMutation({
    mutationFn: (note) => conversationsApi.addNote(panelId, note),
    onSuccess: () => { toast.success("Note pinned"); setAdminNote(""); queryClient.invalidateQueries(["chat-detail", panelId]); },
    onError: err => toast.error(err.response?.data?.message || "Note failed"),
  });

  // ── Derived ─────────────────────────────────────────────────────────────
  const conversations = cvData?.conversations || [];
  const pagination    = cvData?.pagination    || {};
  const totalPages    = pagination.pages || 1;
  const allSel        = conversations.length > 0 && selectedIds.length === conversations.length;
  const someSel       = selectedIds.length > 0 && !allSel;

  const chatMessages  = panel?.messages || [];
  const filteredMsgs  = chatSearch
    ? chatMessages.filter(m => m.content?.toLowerCase().includes(chatSearch.toLowerCase()))
    : chatMessages;
  const flaggedCount  = chatMessages.filter(m => m.isFlagged).length;
  const mediaCount    = chatMessages.filter(m => ["image","video","file"].includes(m.type)).length;

  const disputedCount = conversations.filter(c => c.status === "disputed").length;

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleSort = field => {
    if (sortKey === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(field); setSortDir("desc"); }
    setPage(1);
  };

  const visiblePages = () => {
    const ps = []; const s = Math.max(2, page - 1); const e = Math.min(totalPages - 1, page + 1);
    ps.push(1); if (s > 2) ps.push("…"); for (let i = s; i <= e; i++) ps.push(i); if (e < totalPages - 1) ps.push("…"); if (totalPages > 1) ps.push(totalPages);
    return ps;
  };

  const handleExportTranscript = () => {
    if (!panel) return;
    const lines = chatMessages.map(m => `[${formatDate(m.createdAt)}] ${m.sender?.name || "System"}: ${m.content || `[${m.type} attachment]`}`);
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a"); a.href = url; a.download = `transcript-${panelId?.slice(-8)}.txt`; a.click();
    toast.success("Transcript downloaded");
  };

  useEffect(() => {
    const h = e => { if (e.key === "Escape") { setPanelId(null); setFlagConfirm(null); } };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, []);

  // Auto-scroll chat to bottom when opened
  useEffect(() => {
    if (panel && activeTab === "messages") setTimeout(() => chatEndRef.current?.scrollIntoView(), 100);
  }, [panel, activeTab]);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        :root {
          --cv-page: #f8f9fa; --cv-card: #ffffff; --cv-surface: #ffffff;
          --cv-thead: #f8f9fa; --cv-border: #e5e7eb; --cv-row-brd: #f3f4f6;
          --cv-shadow: rgba(0,0,0,.06); --cv-shimmer: #f1f3f4;
          --cv-text-primary: #111827; --cv-text-muted: #6b7280; --cv-accent: #111827;
          --cv-hover: #f9fafb; --cv-input-brd: #d1d5db; --cv-input-focus: #111827;
          --cv-btn-bg: #ffffff; --cv-btn-brd: #d1d5db; --cv-btn-text: #374151;
          --cv-panel-bg: #ffffff; --cv-panel-hdr: #f8f9fa;
          --cv-sel-bar: #eff6ff; --cv-sel-text: #1d4ed8;
          --cv-bubble-client-bg:  #eff6ff; --cv-bubble-client-brd:  #bfdbfe;
          --cv-bubble-editor-bg:  #f5f3ff; --cv-bubble-editor-brd:  #ddd6fe;
        }
        @media (prefers-color-scheme: dark) {
          :root {
            --cv-page: #0a0a0a; --cv-card: #111111; --cv-surface: #111111;
            --cv-thead: #161616; --cv-border: #1f1f1f; --cv-row-brd: #191919;
            --cv-shadow: rgba(0,0,0,.3); --cv-shimmer: #1a1a1a;
            --cv-text-primary: #f3f4f6; --cv-text-muted: #6b7280; --cv-accent: #f3f4f6;
            --cv-hover: #161616; --cv-input-brd: #2a2a2a; --cv-input-focus: #f3f4f6;
            --cv-btn-bg: #161616; --cv-btn-brd: #2a2a2a; --cv-btn-text: #d1d5db;
            --cv-panel-bg: #111111; --cv-panel-hdr: #161616;
            --cv-sel-bar: #1e3a5f; --cv-sel-text: #93c5fd;
            --cv-bubble-client-bg:  #1e3a5f; --cv-bubble-client-brd:  #1e40af;
            --cv-bubble-editor-bg:  #2e1065; --cv-bubble-editor-brd:  #5b21b6;
          }
        }
        .dark {
          --cv-page: #0a0a0a; --cv-card: #111111; --cv-surface: #111111;
          --cv-thead: #161616; --cv-border: #1f1f1f; --cv-row-brd: #191919;
          --cv-shadow: rgba(0,0,0,.3); --cv-shimmer: #1a1a1a;
          --cv-text-primary: #f3f4f6; --cv-text-muted: #6b7280; --cv-accent: #f3f4f6;
          --cv-hover: #161616; --cv-input-brd: #2a2a2a; --cv-input-focus: #f3f4f6;
          --cv-btn-bg: #161616; --cv-btn-brd: #2a2a2a; --cv-btn-text: #d1d5db;
          --cv-panel-bg: #111111; --cv-panel-hdr: #161616;
          --cv-sel-bar: #1e3a5f; --cv-sel-text: #93c5fd;
          --cv-bubble-client-bg:  #1e3a5f; --cv-bubble-client-brd:  #1e40af;
          --cv-bubble-editor-bg:  #2e1065; --cv-bubble-editor-brd:  #5b21b6;
        }
        @keyframes cv-shimmer { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes cv-pulse   { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.8)} }
        @keyframes cv-slideIn { from{transform:translateX(100%);opacity:0} to{transform:translateX(0);opacity:1} }
        @keyframes cv-fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes cv-fadeUp  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
        @keyframes cv-scaleIn { from{opacity:0;transform:scale(.96)} to{opacity:1;transform:scale(1)} }

        .cv-row:hover td { background: var(--cv-hover) !important; }
        .cv-row.sel      td { background: var(--cv-sel-bar) !important; }
        .cv-tbtn { background:var(--cv-btn-bg); border:1px solid var(--cv-btn-brd); color:var(--cv-btn-text); cursor:pointer; border-radius:7px; font-size:13px; display:flex; align-items:center; gap:6px; padding:7px 14px; font-weight:500; transition:opacity .15s; }
        .cv-tbtn:hover { opacity:.8; }
        .cv-chip { padding:4px 11px; border-radius:999px; font-size:11px; font-weight:600; cursor:pointer; border:1px solid; transition:all .15s; white-space:nowrap; }
        .cv-input { width:100%; box-sizing:border-box; padding:9px 12px; border:1px solid var(--cv-input-brd); border-radius:7px; font-size:13px; color:var(--cv-text-primary); background:var(--cv-card); outline:none; transition:border .15s; font-family:inherit; }
        .cv-input:focus { border-color:var(--cv-input-focus); }
        .cv-chat-scroll::-webkit-scrollbar { width:4px; }
        .cv-chat-scroll::-webkit-scrollbar-thumb { background:var(--cv-border); border-radius:2px; }
        .cv-panel-scroll::-webkit-scrollbar { width:4px; }
        .cv-panel-scroll::-webkit-scrollbar-thumb { background:var(--cv-border); border-radius:2px; }

        /* Tab button */
        .cv-tab { padding:10px 16px; border:none; background:none; cursor:pointer; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.07em; border-bottom:2px solid transparent; transition:all .15s; color:var(--cv-text-muted); white-space:nowrap; }
        .cv-tab.active { color:var(--cv-text-primary); border-bottom-color:var(--cv-text-primary); }
        .cv-tab:hover:not(.active) { color:var(--cv-text-primary); }
      `}</style>

      <div style={{ background: "var(--cv-page)", minHeight: "100vh", fontFamily: "system-ui,-apple-system,sans-serif" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "20px 16px", display: "flex", flexDirection: "column", gap: 18 }}>

          {/* Breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--cv-text-muted)" }}>
            <HiOutlineHome size={14} /><span style={{ color: "var(--cv-border)" }}>/</span>
            <span>Admin</span><span style={{ color: "var(--cv-border)" }}>/</span>
            <span style={{ color: "var(--cv-text-primary)", fontWeight: 600 }}>Conversations</span>
          </div>

          {/* Page header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "var(--cv-text-primary)", letterSpacing: "-.3px" }}>Conversations</h1>
              <p style={{ margin: "3px 0 0", fontSize: 13, color: "var(--cv-text-muted)" }}>Monitor project chats, flag violations, and leave admin notes.</p>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button onClick={() => queryClient.invalidateQueries(["conversations"])} className="cv-tbtn">
                <HiOutlineArrowPath size={14} style={isFetching ? { animation: "cv-shimmer .6s linear infinite" } : {}} /> Refresh
              </button>
            </div>
          </div>

          {/* KPI row */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <KpiCard label="Total"      value={pagination.total}  icon={HiOutlineChatBubbleLeftRight} color="#6d28d9" loading={isLoading} />
            <KpiCard label="Disputed"   value={disputedCount}     icon={HiOutlineShieldExclamation}   color="#dc2626" loading={isLoading} />
            <KpiCard label="In Progress"value={conversations.filter(c => c.status === "in_progress").length} icon={HiOutlineClock} color="#b45309" loading={isLoading} />
            <KpiCard label="Completed"  value={conversations.filter(c => c.status === "completed").length}   icon={HiOutlineCheckCircle} color="#15803d" loading={isLoading} />
          </div>

          {/* Dispute alert */}
          {disputedCount > 0 && (
            <div style={{ padding: "11px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, display: "flex", alignItems: "center", gap: 12, animation: "cv-fadeUp .3s ease" }}>
              <HiOutlineExclamationTriangle size={17} style={{ color: "#dc2626", flexShrink: 0 }} />
              <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#991b1b" }}>
                {disputedCount} conversation{disputedCount > 1 ? "s" : ""} flagged as disputed — may require moderation action.
              </div>
              <button onClick={() => { setStatusFilter("disputed"); setPage(1); }}
                style={{ padding: "5px 14px", background: "#dc2626", border: "none", borderRadius: 6, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                View
              </button>
            </div>
          )}

          {/* Main table card */}
          <div style={{ background: "var(--cv-card)", border: "1px solid var(--cv-border)", borderRadius: 10, overflow: "hidden", boxShadow: "0 1px 3px var(--cv-shadow)" }}>

            {/* Toolbar */}
            <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--cv-border)", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div style={{ position: "relative", flex: 1, minWidth: 240 }}>
                <HiOutlineMagnifyingGlass size={15} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--cv-text-muted)", pointerEvents: "none" }} />
                <input ref={searchRef} type="text" placeholder="Search by participant name, order ID…"
                  className="cv-input" style={{ paddingLeft: 36 }} value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }} />
                {search && <button onClick={() => { setSearch(""); setPage(1); searchRef.current?.focus(); }}
                  style={{ position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--cv-text-muted)", padding: 2, display: "flex" }}><HiOutlineXMark size={14} /></button>}
              </div>

              <div style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "var(--cv-text-muted)", fontWeight: 500 }}>Status:</span>
                {[["all","All"],["new","New"],["in_progress","In Progress"],["disputed","Disputed"],["completed","Completed"]].map(([v, l]) => (
                  <button key={v} onClick={() => { setStatusFilter(v); setPage(1); }}
                    className="cv-chip"
                    style={{
                      background:  statusFilter === v ? "var(--cv-text-primary)" : "transparent",
                      color:       statusFilter === v ? "var(--cv-page)"         : "var(--cv-text-muted)",
                      borderColor: statusFilter === v ? "var(--cv-text-primary)" : "var(--cv-border)",
                      ...(v === "disputed" && statusFilter !== "disputed" && disputedCount > 0 ? { borderColor: "#fca5a5", color: "#dc2626" } : {}),
                    }}
                  >{l}{v === "disputed" && disputedCount > 0 && statusFilter !== "disputed" ? ` (${disputedCount})` : ""}</button>
                ))}
              </div>

              <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "var(--cv-text-muted)" }}>Rows:</span>
                <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                  style={{ background: "var(--cv-card)", border: "1px solid var(--cv-btn-brd)", color: "var(--cv-text-primary)", borderRadius: 6, padding: "5px 8px", fontSize: 12, outline: "none", cursor: "pointer" }}>
                  {[10,25,50].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>

            {/* Bulk bar */}
            {selectedIds.length > 0 && (
              <div style={{ padding: "9px 16px", background: "var(--cv-sel-bar)", borderBottom: "1px solid var(--cv-border)", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", animation: "cv-fadeIn .2s ease" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 20, height: 20, borderRadius: 4, background: "#1d4ed8", display: "flex", alignItems: "center", justifyContent: "center" }}><HiMiniCheck size={12} style={{ color: "#fff" }} /></div>
                  <span style={{ fontSize: 13, color: "var(--cv-sel-text)", fontWeight: 600 }}>{selectedIds.length} selected</span>
                </div>
                <button onClick={() => { toast.success(`${selectedIds.length} conversations exported`); setSelectedIds([]); }}
                  style={{ padding: "4px 12px", background: "var(--cv-card)", border: "1px solid var(--cv-border)", borderRadius: 6, fontSize: 12, fontWeight: 600, color: "var(--cv-text-primary)", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                  <HiOutlineArrowDownTray size={12} /> Export Selected
                </button>
                <button onClick={() => setSelectedIds([])} style={{ marginLeft: "auto", background: "none", border: "none", fontSize: 12, color: "var(--cv-text-muted)", cursor: "pointer" }}>Clear</button>
              </div>
            )}

            {/* Table */}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
                <thead>
                  <tr>
                    <th style={{ width: 44, padding: "10px 12px", background: "var(--cv-thead)", borderBottom: "1px solid var(--cv-border)" }}>
                      <input type="checkbox" checked={allSel} ref={el => { if (el) el.indeterminate = someSel; }}
                        onChange={e => setSelectedIds(e.target.checked ? conversations.map(c => c._id) : [])}
                        style={{ width: 15, height: 15, cursor: "pointer", accentColor: "#1d4ed8" }} />
                    </th>
                    <TH style={{ minWidth: 180 }}>Participants</TH>
                    <TH style={{ minWidth: 160 }}>Subject</TH>
                    <TH style={{ minWidth: 200 }}>Last Message</TH>
                    <TH>Status</TH>
                    <SortTH label="Last Activity" field="updatedAt" sk={sortKey} sd={sortDir} onSort={handleSort} style={{ minWidth: 110 }} />
                    <TH style={{ textAlign: "right" }}>Actions</TH>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                  ) : conversations.length === 0 ? (
                    <tr><td colSpan={7}>
                      <div style={{ padding: "56px 0", textAlign: "center" }}>
                        <div style={{ width: 52, height: 52, borderRadius: 12, border: "2px dashed var(--cv-border)", background: "var(--cv-shimmer)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                          <HiOutlineChatBubbleLeftRight size={22} style={{ color: "var(--cv-text-muted)", opacity: .4 }} />
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cv-text-primary)", marginBottom: 5 }}>
                          {search || statusFilter !== "all" ? "No conversations match your filters" : "No conversations yet"}
                        </div>
                        <div style={{ fontSize: 13, color: "var(--cv-text-muted)" }}>
                          {search || statusFilter !== "all" ? "Try adjusting the search or status filter." : "Conversations will appear here when orders are placed."}
                        </div>
                      </div>
                    </td></tr>
                  ) : conversations.map(cv => {
                    const isSel = selectedIds.includes(cv._id);
                    const isDisputed = cv.status === "disputed";
                    return (
                      <tr key={cv._id} className={`cv-row${isSel ? " sel" : ""}`}
                        style={{ borderBottom: "1px solid var(--cv-row-brd)", transition: "background .1s", ...(isDisputed ? { borderLeft: "3px solid #ef4444" } : {}) }}>
                        <td style={{ padding: "12px 12px" }}>
                          <input type="checkbox" checked={isSel}
                            onChange={e => setSelectedIds(p => e.target.checked ? [...p, cv._id] : p.filter(x => x !== cv._id))}
                            style={{ width: 15, height: 15, cursor: "pointer", accentColor: "#1d4ed8" }} />
                        </td>
                        <td style={{ padding: "12px 12px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                              <div style={{ display: "flex", gap: -4 }}>
                                <UserAvatar src={cv.client?.profilePicture}  name={cv.client?.name}  size={26} />
                                <UserAvatar src={cv.editor?.profilePicture}  name={cv.editor?.name}  size={26} />
                              </div>
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--cv-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 150 }}>
                                {cv.client?.name} ↔ {cv.editor?.name}
                              </div>
                              <div style={{ fontSize: 10, color: "var(--cv-text-muted)", fontFamily: "monospace", marginTop: 1 }}>
                                #{cv._id?.slice(-8)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "12px 12px" }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--cv-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }}>
                            {cv.gig?.title || cv.order?.title || "Direct Order"}
                          </div>
                          <div style={{ fontSize: 10, color: "var(--cv-text-muted)", textTransform: "uppercase", letterSpacing: ".05em", marginTop: 2, fontWeight: 600 }}>
                            {cv.messageCount || 0} messages
                          </div>
                        </td>
                        <td style={{ padding: "12px 12px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, maxWidth: 220 }}>
                            <MsgTypeIcon type={cv.lastMessage?.type} />
                            <span style={{ fontSize: 12, color: "var(--cv-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontStyle: "italic" }}>
                              {cv.lastMessage?.content || (cv.lastMessage ? `[${cv.lastMessage.type}]` : "No messages yet")}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: "12px 12px" }}>
                          <StatusChip status={cv.status} sm />
                        </td>
                        <td style={{ padding: "12px 12px", fontSize: 12, color: "var(--cv-text-muted)", whiteSpace: "nowrap" }}>
                          {formatDate(cv.updatedAt)}
                        </td>
                        <td style={{ padding: "12px 12px", textAlign: "right" }}>
                          <button onClick={() => { setPanelId(cv._id); setActiveTab("messages"); setChatSearch(""); }}
                            style={{ padding: "5px 12px", background: isDisputed ? "#fef2f2" : "var(--cv-card)", border: `1px solid ${isDisputed ? "#fecaca" : "var(--cv-border)"}`, borderRadius: 6, fontSize: 12, fontWeight: 600, color: isDisputed ? "#b91c1c" : "var(--cv-text-primary)", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}
                            className="cv-tbtn">
                            <HiOutlineEye size={13} /> {isDisputed ? "Review" : "View"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!isLoading && conversations.length > 0 && (
              <div style={{ padding: "12px 16px", borderTop: "1px solid var(--cv-border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                <div style={{ fontSize: 13, color: "var(--cv-text-muted)" }}>
                  Showing <b style={{ color: "var(--cv-text-primary)" }}>{((pagination.page - 1) * pageSize) + 1}–{Math.min(pagination.page * pageSize, pagination.total)}</b> of <b style={{ color: "var(--cv-text-primary)" }}>{pagination.total?.toLocaleString()}</b>
                </div>
                <div style={{ display: "flex", gap: 3 }}>
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    style={{ width: 30, height: 30, borderRadius: 5, border: "1px solid var(--cv-border)", background: "var(--cv-card)", cursor: page === 1 ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: page === 1 ? .3 : 1, color: "var(--cv-text-muted)" }}>
                    <HiOutlineChevronLeft size={13} />
                  </button>
                  {visiblePages().map((p, i) =>
                    p === "…" ? <span key={i} style={{ width: 30, textAlign: "center", fontSize: 13, color: "var(--cv-text-muted)", lineHeight: "30px" }}>…</span>
                    : <button key={p} onClick={() => setPage(p)} style={{ width: 30, height: 30, borderRadius: 5, border: "1px solid", borderColor: page === p ? "var(--cv-text-primary)" : "var(--cv-border)", background: page === p ? "var(--cv-text-primary)" : "var(--cv-card)", color: page === p ? "var(--cv-page)" : "var(--cv-text-primary)", fontSize: 13, fontWeight: page === p ? 700 : 400, cursor: "pointer" }}>{p}</button>
                  )}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    style={{ width: 30, height: 30, borderRadius: 5, border: "1px solid var(--cv-border)", background: "var(--cv-card)", cursor: page === totalPages ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: page === totalPages ? .3 : 1, color: "var(--cv-text-muted)" }}>
                    <HiOutlineChevronRight size={13} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  CHAT VIEWER SLIDE-OVER                                             */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {panelId && (
        <>
          <div onClick={() => setPanelId(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", backdropFilter: "blur(2px)", zIndex: 1000, animation: "cv-fadeIn .2s ease" }} />
          <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "min(560px, 100vw)", background: "var(--cv-panel-bg)", zIndex: 1001, display: "flex", flexDirection: "column", boxShadow: "-6px 0 32px rgba(0,0,0,.18)", animation: "cv-slideIn .25s cubic-bezier(.4,0,.2,1)", borderLeft: "1px solid var(--cv-border)" }}>

            {/* Panel header */}
            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--cv-border)", background: "var(--cv-panel-hdr)", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: panelLoading ? 0 : 10 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--cv-text-primary)" }}>
                  {panelLoading ? "Loading…" : "Chat Viewer"}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={handleExportTranscript} className="cv-tbtn" style={{ padding: "5px 10px", fontSize: 12 }} title="Export transcript">
                    <HiOutlineArrowDownTray size={13} />
                  </button>
                  <button onClick={() => setPanelId(null)} style={{ width: 30, height: 30, borderRadius: 6, border: "none", background: "var(--cv-shimmer)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--cv-text-muted)" }}>
                    <HiOutlineXMark size={16} />
                  </button>
                </div>
              </div>

              {!panelLoading && panel && (
                <>
                  {/* Participants row */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, padding: "10px 12px", background: "var(--cv-card)", borderRadius: 8, border: "1px solid var(--cv-border)" }}>
                    <div style={{ display: "flex", gap: 4 }}>
                      <UserAvatar src={panel.order?.client?.profilePicture} name={panel.order?.client?.name} size={30} />
                      <UserAvatar src={panel.order?.editor?.profilePicture} name={panel.order?.editor?.name} size={30} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--cv-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {panel.order?.client?.name} ↔ {panel.order?.editor?.name}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--cv-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {panel.order?.title || "Order conversation"}
                      </div>
                    </div>
                    <StatusChip status={panel.order?.status} sm />
                  </div>

                  {/* Chat mini-stats */}
                  <div style={{ display: "flex", gap: 8 }}>
                    {[
                      { label: "Messages",  value: chatMessages.length,                        icon: HiOutlineChatBubbleLeftRight },
                      { label: "Media",     value: mediaCount,                                  icon: HiOutlinePhoto },
                      { label: "Flagged",   value: flaggedCount, alert: flaggedCount > 0,       icon: HiOutlineFlag },
                      { label: "Notes",     value: panel.order?.adminNotes?.length || 0,        icon: HiOutlineChatBubbleOvalLeftEllipsis },
                    ].map((s, i) => (
                      <div key={i} style={{ flex: 1, textAlign: "center", padding: "7px 0", background: s.alert ? "#fef2f2" : "var(--cv-shimmer)", borderRadius: 7, border: `1px solid ${s.alert ? "#fecaca" : "var(--cv-border)"}` }}>
                        <s.icon size={12} style={{ color: s.alert ? "#dc2626" : "var(--cv-text-muted)", display: "block", margin: "0 auto 3px" }} />
                        <div style={{ fontSize: 13, fontWeight: 800, color: s.alert ? "#dc2626" : "var(--cv-text-primary)" }}>{s.value}</div>
                        <div style={{ fontSize: 9, color: s.alert ? "#dc2626" : "var(--cv-text-muted)", textTransform: "uppercase", letterSpacing: ".07em", fontWeight: 600 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Tabs */}
            {!panelLoading && panel && (
              <div style={{ borderBottom: "1px solid var(--cv-border)", background: "var(--cv-panel-hdr)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, paddingRight: 12 }}>
                <div style={{ display: "flex" }}>
                  {[
                    { id: "messages", label: "Messages" },
                    { id: "media",    label: `Media (${mediaCount})` },
                    { id: "flagged",  label: flaggedCount > 0 ? `Flagged (${flaggedCount})` : "Flagged", alert: flaggedCount > 0 },
                    { id: "notes",    label: `Notes (${panel.order?.adminNotes?.length || 0})` },
                  ].map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id)}
                      className={`cv-tab${activeTab === t.id ? " active" : ""}`}
                      style={{ color: t.alert && activeTab !== t.id ? "#dc2626" : undefined }}>
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Chat search (messages tab only) */}
                {activeTab === "messages" && (
                  <div style={{ position: "relative" }}>
                    <HiOutlineMagnifyingGlass size={12} style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: "var(--cv-text-muted)", pointerEvents: "none" }} />
                    <input type="text" placeholder="Search in chat…" value={chatSearch}
                      onChange={e => setChatSearch(e.target.value)}
                      style={{ padding: "5px 10px 5px 26px", border: "1px solid var(--cv-border)", borderRadius: 6, fontSize: 12, background: "var(--cv-card)", color: "var(--cv-text-primary)", outline: "none", width: 150 }}
                      onFocus={e => e.target.style.borderColor = "var(--cv-input-focus)"}
                      onBlur={e => e.target.style.borderColor = "var(--cv-border)"} />
                    {chatSearch && <button onClick={() => setChatSearch("")} style={{ position: "absolute", right: 5, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--cv-text-muted)", padding: 1, display: "flex" }}><HiOutlineXMark size={12} /></button>}
                  </div>
                )}
              </div>
            )}

            {/* Panel body */}
            <div className="cv-panel-scroll" style={{ flex: 1, overflowY: "auto" }}>
              {panelLoading ? (
                <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
                  {[60, 44, 44, 80, 44, 60].map((h, i) => (
                    <div key={i} style={{ height: h, borderRadius: 8, background: "var(--cv-shimmer)", animation: "cv-shimmer 1.4s ease infinite", ...(i % 2 === 0 ? {} : { marginLeft: "30%" }) }} />
                  ))}
                </div>
              ) : !panel ? (
                <div style={{ padding: 48, textAlign: "center" }}>
                  <HiOutlineExclamationTriangle size={28} style={{ color: "#dc2626", display: "block", margin: "0 auto 12px" }} />
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cv-text-primary)" }}>Failed to load conversation</div>
                </div>
              ) : (

                // ── Messages tab ──────────────────────────────────────────
                activeTab === "messages" ? (
                  <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14, animation: "cv-fadeUp .2s ease" }}>
                    {filteredMsgs.length === 0 ? (
                      <div style={{ padding: "40px 0", textAlign: "center", color: "var(--cv-text-muted)", fontSize: 13 }}>
                        {chatSearch ? `No messages containing "${chatSearch}"` : "No messages in this conversation yet."}
                      </div>
                    ) : filteredMsgs.map(msg => (
                      <MessageBubble
                        key={msg._id} msg={msg}
                        isClient={msg.sender?._id === panel.order?.client?._id}
                        onFlag={id => setFlagConfirm(id)}
                        flagging={flagMut.isPending}
                        highlight={chatSearch && msg.content?.toLowerCase().includes(chatSearch.toLowerCase())}
                      />
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                )

                // ── Media tab ─────────────────────────────────────────────
                : activeTab === "media" ? (
                  <div style={{ padding: "16px 20px", animation: "cv-fadeUp .2s ease" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 8 }}>
                      {chatMessages.filter(m => ["image","video"].includes(m.type)).map((m, i) => (
                        <div key={i} style={{ aspectRatio: "1", borderRadius: 8, overflow: "hidden", border: "1px solid var(--cv-border)", cursor: "pointer", background: "var(--cv-shimmer)" }}
                          onClick={() => m.mediaUrl && window.open(m.mediaUrl, "_blank")}>
                          {m.type === "video"
                            ? <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#000" }}><HiOutlineVideoCamera size={24} style={{ color: "#fff" }} /></div>
                            : <img src={m.mediaUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                        </div>
                      ))}
                      {chatMessages.filter(m => m.type === "file").map((m, i) => (
                        <a key={`f${i}`} href={m.mediaUrl} target="_blank" rel="noopener noreferrer"
                          style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, padding: "12px 8px", borderRadius: 8, border: "1px solid var(--cv-border)", background: "var(--cv-card)", textDecoration: "none", cursor: "pointer" }}>
                          <HiOutlinePaperClip size={20} style={{ color: "#f59e0b" }} />
                          <span style={{ fontSize: 10, color: "var(--cv-text-muted)", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>{m.mediaName || "File"}</span>
                        </a>
                      ))}
                      {mediaCount === 0 && <div style={{ gridColumn: "1/-1", padding: "40px 0", textAlign: "center", color: "var(--cv-text-muted)", fontSize: 13 }}>No media shared in this conversation.</div>}
                    </div>
                  </div>
                )

                // ── Flagged tab ───────────────────────────────────────────
                : activeTab === "flagged" ? (
                  <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12, animation: "cv-fadeUp .2s ease" }}>
                    {chatMessages.filter(m => m.isFlagged).length === 0 ? (
                      <div style={{ padding: "40px 0", textAlign: "center" }}>
                        <HiOutlineShieldExclamation size={28} style={{ color: "var(--cv-text-muted)", display: "block", margin: "0 auto 12px", opacity: .4 }} />
                        <div style={{ fontSize: 13, color: "var(--cv-text-muted)" }}>No flagged messages in this conversation.</div>
                      </div>
                    ) : chatMessages.filter(m => m.isFlagged).map(msg => (
                      <div key={msg._id} style={{ padding: "12px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 9 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                          <UserAvatar src={msg.sender?.profilePicture} name={msg.sender?.name} size={22} />
                          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--cv-text-primary)" }}>{msg.sender?.name}</span>
                          <span style={{ fontSize: 11, color: "var(--cv-text-muted)", marginLeft: "auto" }}>{formatDate(msg.createdAt)}</span>
                          <HiOutlineFlag size={12} style={{ color: "#dc2626" }} />
                        </div>
                        <p style={{ margin: 0, fontSize: 13, color: "var(--cv-text-primary)", lineHeight: 1.5 }}>{msg.content || `[${msg.type} attachment]`}</p>
                      </div>
                    ))}
                  </div>
                )

                // ── Notes tab ─────────────────────────────────────────────
                : activeTab === "notes" ? (
                  <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14, animation: "cv-fadeUp .2s ease" }}>
                    {/* Add note */}
                    <div style={{ background: "var(--cv-shimmer)", border: "1px solid var(--cv-border)", borderRadius: 9, padding: 14 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--cv-text-muted)", marginBottom: 10 }}>Add Internal Note</div>
                      <textarea ref={noteRef} className="cv-input" rows={3}
                        placeholder="Add internal notes about this order, user behavior, or moderation decisions…"
                        value={adminNote} onChange={e => setAdminNote(e.target.value)}
                        style={{ resize: "vertical", lineHeight: 1.55, marginBottom: 10 }} />
                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <button
                          onClick={() => { if (!adminNote.trim()) return; noteMut.mutate(adminNote); }}
                          disabled={!adminNote.trim() || noteMut.isPending}
                          style={{ padding: "7px 18px", background: "var(--cv-text-primary)", border: "none", borderRadius: 7, color: "var(--cv-page)", fontSize: 12, fontWeight: 700, cursor: "pointer", opacity: !adminNote.trim() || noteMut.isPending ? .5 : 1, display: "flex", alignItems: "center", gap: 6 }}>
                          <HiOutlineCheck size={13} />
                          {noteMut.isPending ? "Saving…" : "Pin Note"}
                        </button>
                      </div>
                    </div>

                    {/* Notes list */}
                    {(panel.order?.adminNotes?.length > 0)
                      ? [...panel.order.adminNotes].reverse().map((note, i) => (
                        <div key={i} style={{ padding: "12px 14px", background: "var(--cv-card)", border: "1px solid var(--cv-border)", borderRadius: 9, borderLeft: "3px solid #6d28d9" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                            <div style={{ width: 24, height: 24, borderRadius: 6, background: "#f5f3ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#6d28d9" }}>
                              {note.addedBy?.name?.[0] || "A"}
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--cv-text-primary)" }}>{note.addedBy?.name || "Admin"}</span>
                            <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--cv-text-muted)" }}>{formatDate(note.addedAt)}</span>
                          </div>
                          <p style={{ margin: 0, fontSize: 13, color: "var(--cv-text-primary)", lineHeight: 1.6 }}>{note.text}</p>
                        </div>
                      ))
                      : (
                        <div style={{ padding: "40px 0", textAlign: "center" }}>
                          <HiOutlineChatBubbleOvalLeftEllipsis size={28} style={{ color: "var(--cv-text-muted)", display: "block", margin: "0 auto 12px", opacity: .4 }} />
                          <div style={{ fontSize: 13, color: "var(--cv-text-muted)" }}>No internal notes yet. Add one above.</div>
                        </div>
                      )
                    }
                  </div>
                ) : null
              )}
            </div>

            {/* Panel footer */}
            <div style={{ padding: "12px 20px", borderTop: "1px solid var(--cv-border)", background: "var(--cv-panel-hdr)", display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap" }}>
              <button onClick={handleExportTranscript} className="cv-tbtn" style={{ flex: 1, justifyContent: "center", fontSize: 12 }}>
                <HiOutlineDocumentArrowDown size={13} /> Export Transcript
              </button>
              <button onClick={() => toast.info("Entering observer mode…")} style={{ flex: 1, padding: "8px 0", background: "var(--cv-text-primary)", border: "none", borderRadius: 7, color: "var(--cv-page)", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <HiOutlineChatBubbleOvalLeftEllipsis size={13} /> Join as Observer
              </button>
              <button onClick={() => setPanelId(null)} className="cv-tbtn" style={{ padding: "8px 14px" }}>Close</button>
            </div>
          </div>
        </>
      )}

      {/* Flag confirm dialog */}
      {flagConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 1200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, animation: "cv-fadeIn .15s ease" }}>
          <div style={{ background: "var(--cv-panel-bg)", borderRadius: 12, width: "100%", maxWidth: 360, overflow: "hidden", boxShadow: "0 12px 48px rgba(0,0,0,.22)", border: "1px solid var(--cv-border)", animation: "cv-scaleIn .2s ease" }}>
            <div style={{ padding: "20px 22px" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <HiOutlineFlag size={20} style={{ color: "#dc2626" }} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--cv-text-primary)", marginBottom: 6 }}>Flag Message</div>
                  <div style={{ fontSize: 13, color: "var(--cv-text-muted)", lineHeight: 1.6 }}>This message will be marked for policy review. Admins can review flagged messages in the Flagged tab.</div>
                </div>
              </div>
            </div>
            <div style={{ padding: "10px 22px 18px", display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setFlagConfirm(null)} className="cv-tbtn">Cancel</button>
              <button onClick={() => flagMut.mutate(flagConfirm)}
                style={{ padding: "8px 20px", background: "#dc2626", border: "none", borderRadius: 7, fontSize: 13, color: "#fff", cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                <HiOutlineFlag size={13} /> Flag Message
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Conversations;