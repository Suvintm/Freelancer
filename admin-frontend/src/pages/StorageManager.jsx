// ─── StorageManager.jsx — Production Storage Configuration & Purchases ────────
// Light/dark theme via CSS variables. Fully responsive. Zero Tailwind + framer-motion dependency.
// Deps: react, react-hot-toast, react-icons/hi2, ../context/AdminContext, ../utils/formatters

import { useState, useEffect, useRef } from "react";
import {
  HiOutlineCircleStack,
  HiOutlinePencilSquare,
  HiOutlineCheck,
  HiOutlineXMark,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineInformationCircle,
  HiOutlineBanknotes,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineUser,
  HiOutlineArrowPath,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineHome,
  HiOutlineSparkles,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineStar,
  HiOutlineLockClosed,
  HiOutlineArrowDownTray,
  HiOutlineChartBar,
  HiOutlineShieldCheck,
} from "react-icons/hi2";
import { toast } from "react-hot-toast";
import { useAdmin } from "../context/AdminContext";
import { formatDate, formatCurrency } from "../utils/formatters";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const fmtBytes = (mb) => {
  if (!mb && mb !== 0) return "—";
  if (mb >= 1024) return `${(mb / 1024).toFixed(mb % 1024 === 0 ? 0 : 1)} GB`;
  return `${mb} MB`;
};

const pct = (used, total) =>
  total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;

// ─────────────────────────────────────────────────────────────────────────────
// Small atoms
// ─────────────────────────────────────────────────────────────────────────────
const UserAvatar = ({ src, name, size = 32 }) => {
  const [err, setErr] = useState(false);
  const initials = (name || "??").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const palette  = ["#6d28d9","#1d4ed8","#0369a1","#15803d","#b45309","#c2410c"];
  const bg       = palette[(name || "").charCodeAt(0) % palette.length];
  if (!err && src) return (
    <img src={src} alt={name} onError={() => setErr(true)} style={{
      width: size, height: size, borderRadius: "50%", objectFit: "cover",
      border: "2px solid var(--sm-surface)", flexShrink: 0,
    }} />
  );
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: bg, color: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.35, fontWeight: 700, flexShrink: 0,
      border: "2px solid var(--sm-surface)",
    }}>{initials}</div>
  );
};

const StatusBadge = ({ status, sm }) => {
  const cfg = {
    completed: { bg: "var(--sm-badge-ok-bg)",   text: "var(--sm-badge-ok-text)",   brd: "var(--sm-badge-ok-brd)",   dot: "#22c55e" },
    pending:   { bg: "var(--sm-badge-wrn-bg)",  text: "var(--sm-badge-wrn-text)",  brd: "var(--sm-badge-wrn-brd)",  dot: "#f59e0b" },
    failed:    { bg: "var(--sm-badge-err-bg)",  text: "var(--sm-badge-err-text)",  brd: "var(--sm-badge-err-brd)",  dot: "#ef4444" },
  }[status] || { bg: "var(--sm-badge-wrn-bg)", text: "var(--sm-badge-wrn-text)", brd: "var(--sm-badge-wrn-brd)", dot: "#f59e0b" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: sm ? "2px 8px" : "3px 10px", borderRadius: 999,
      fontSize: sm ? 10 : 11, fontWeight: 600, whiteSpace: "nowrap", lineHeight: 1.6,
      background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.brd}`,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
      {status}
    </span>
  );
};

const Skeleton = ({ h = 14, w = "100%", r = 4 }) => (
  <div style={{ height: h, width: w, borderRadius: r, background: "var(--sm-shimmer)", animation: "sm-shimmer 1.4s ease infinite", flexShrink: 0 }} />
);

const SectionHeading = ({ children, action }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
    <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--sm-text-primary)" }}>{children}</h2>
    {action}
  </div>
);

/** Progress bar with color-aware fill */
const ProgressBar = ({ value, color = "#6d28d9", warn = 80, danger = 95, height = 8 }) => {
  const fill = value >= danger ? "#dc2626" : value >= warn ? "#f59e0b" : color;
  return (
    <div style={{ height, background: "var(--sm-shimmer)", borderRadius: 999, overflow: "hidden", width: "100%" }}>
      <div style={{ height: "100%", width: `${value}%`, background: fill, borderRadius: 999, transition: "width .6s cubic-bezier(.4,0,.2,1)" }} />
    </div>
  );
};

/** Labeled info row */
const InfoRow = ({ label, value, mono }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid var(--sm-row-brd)" }}>
    <span style={{ fontSize: 13, color: "var(--sm-text-muted)" }}>{label}</span>
    <span style={{ fontSize: mono ? 11 : 13, fontWeight: 600, color: "var(--sm-text-primary)", fontFamily: mono ? "monospace" : "inherit" }}>{value || "—"}</span>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Plan Card (view mode)
// ─────────────────────────────────────────────────────────────────────────────
const PlanCard = ({ plan, onEdit, onDelete, editMode }) => (
  <div style={{
    background: plan.popular ? "var(--sm-popular-bg)" : "var(--sm-card)",
    border: `1px solid ${plan.popular ? "var(--sm-popular-brd)" : "var(--sm-border)"}`,
    borderRadius: 10, padding: 18, position: "relative",
    boxShadow: plan.popular ? "0 0 0 2px var(--sm-popular-brd)" : "none",
    transition: "box-shadow .15s",
  }}>
    {plan.popular && (
      <div style={{
        position: "absolute", top: -1, right: 18,
        background: "#6d28d9", color: "#fff",
        fontSize: 9.5, fontWeight: 800, padding: "2px 10px",
        borderRadius: "0 0 6px 6px", letterSpacing: ".08em", textTransform: "uppercase",
        display: "flex", alignItems: "center", gap: 4,
      }}>
        <HiOutlineStar size={9} /> Popular
      </div>
    )}

    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--sm-text-primary)", marginBottom: 2 }}>{plan.name}</div>
        <div style={{ fontSize: 13, color: "var(--sm-text-muted)", marginBottom: 12 }}>{fmtBytes(plan.storageMB)} storage</div>

        {plan.features?.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {plan.features.map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "var(--sm-text-muted)" }}>
                <HiOutlineCheckCircle size={13} style={{ color: "#22c55e", flexShrink: 0 }} />
                {f}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: "var(--sm-text-primary)", letterSpacing: "-.3px" }}>
          ₹{(plan.price || 0).toLocaleString()}
        </div>
        <div style={{ fontSize: 11, color: "var(--sm-text-muted)", marginTop: 1 }}>one-time</div>
      </div>
    </div>

    {editMode && (
      <div style={{ display: "flex", gap: 8, marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--sm-border)" }}>
        <button onClick={() => onEdit(plan)} style={{
          flex: 1, padding: "6px 0", background: "var(--sm-btn-bg)", border: "1px solid var(--sm-btn-brd)",
          borderRadius: 7, fontSize: 12, fontWeight: 600, color: "var(--sm-btn-text)", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
        }}>
          <HiOutlinePencilSquare size={13} /> Edit
        </button>
        <button onClick={() => onDelete(plan.id)} style={{
          padding: "6px 12px", background: "#fef2f2", border: "1px solid #fecaca",
          borderRadius: 7, fontSize: 12, fontWeight: 600, color: "#b91c1c", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 5,
        }}>
          <HiOutlineTrash size={13} />
        </button>
      </div>
    )}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
const StorageManager = () => {
  const { adminAxios } = useAdmin();

  // ── Settings state ────────────────────────────────────────────────────
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [settings,    setSettings]    = useState(null);
  const [editMode,    setEditMode]    = useState(false);
  const [freeStorageMB, setFreeStorageMB] = useState(500);
  const [maxStorageMB,  setMaxStorageMB]  = useState(51200);
  const [plans,       setPlans]       = useState([]);

  // ── Plan modal state ──────────────────────────────────────────────────
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan,   setEditingPlan]   = useState(null); // null = new, object = edit
  const [planForm, setPlanForm] = useState({
    id: "", name: "", storageMB: 1024, price: 99, features: "", popular: false,
  });

  // ── Delete confirm ────────────────────────────────────────────────────
  const [deleteConfirm, setDeleteConfirm] = useState(null); // planId

  // ── Purchases state ───────────────────────────────────────────────────
  const [purchases,     setPurchases]    = useState([]);
  const [pLoading,      setPLoading]     = useState(false);
  const [stats,         setStats]        = useState({ totalRevenue: 0, totalCompleted: 0, totalPending: 0 });
  const [pPage,         setPPage]        = useState(1);
  const [pPagination,   setPPagination]  = useState({ total: 0, pages: 1 });
  const [pFilter,       setPFilter]      = useState("all");

  // ── Collapsible sections ──────────────────────────────────────────────
  const [showPurchases, setShowPurchases] = useState(true);

  // ── Fetch ─────────────────────────────────────────────────────────────
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data } = await adminAxios.get("/admin/storage-settings");
      if (data.success) {
        setSettings(data.settings);
        setFreeStorageMB(data.settings.freeStorageMB);
        setMaxStorageMB(data.settings.maxStorageMB);
        setPlans(data.settings.plans || []);
      }
    } catch { toast.error("Failed to load storage settings"); }
    finally { setLoading(false); }
  };

  const fetchPurchases = async () => {
    try {
      setPLoading(true);
      const params = new URLSearchParams({ page: pPage, limit: 10, status: pFilter });
      const { data } = await adminAxios.get(`/admin/storage-purchases?${params}`);
      if (data.success) {
        setPurchases(data.purchases || []);
        setPPagination(data.pagination || { total: 0, pages: 1 });
        setStats(data.stats || { totalRevenue: 0, totalCompleted: 0, totalPending: 0 });
      }
    } catch { /* silent */ }
    finally { setPLoading(false); }
  };

  useEffect(() => { fetchSettings(); }, []);
  useEffect(() => { fetchPurchases(); }, [pPage, pFilter]);

  // ── Escape key ────────────────────────────────────────────────────────
  useEffect(() => {
    const h = e => { if (e.key === "Escape") { setShowPlanModal(false); setDeleteConfirm(null); } };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────
  const handleSave = async () => {
    try {
      setSaving(true);
      const { data } = await adminAxios.put("/admin/storage-settings", { freeStorageMB, maxStorageMB, plans });
      if (data.success) {
        toast.success("Storage settings saved");
        setSettings(data.settings);
        setEditMode(false);
      }
    } catch (e) { toast.error(e.response?.data?.message || "Save failed"); }
    finally { setSaving(false); }
  };

  const openAddPlan = () => {
    setEditingPlan(null);
    setPlanForm({ id: "", name: "", storageMB: 1024, price: 99, features: "", popular: false });
    setShowPlanModal(true);
  };

  const openEditPlan = (plan) => {
    setEditingPlan(plan);
    setPlanForm({
      id: plan.id, name: plan.name, storageMB: plan.storageMB,
      price: plan.price, features: (plan.features || []).join("\n"), popular: plan.popular || false,
    });
    setShowPlanModal(true);
  };

  const handleSavePlan = async () => {
    if (!planForm.id || !planForm.name || !planForm.storageMB || planForm.price === undefined) {
      toast.error("Fill all required fields"); return;
    }
    try {
      setSaving(true);
      const features = planForm.features.split("\n").filter(f => f.trim());
      if (editingPlan) {
        // Update in-place
        setPlans(prev => prev.map(p => p.id === editingPlan.id
          ? { ...p, ...planForm, features }
          : p
        ));
        toast.success("Plan updated — click Save Settings to persist.");
        setShowPlanModal(false);
      } else {
        const { data } = await adminAxios.post("/admin/storage-settings/plans", { ...planForm, features });
        if (data.success) {
          toast.success("Plan added");
          setPlans(data.plans);
          setShowPlanModal(false);
        }
      }
    } catch (e) { toast.error(e.response?.data?.message || "Failed"); }
    finally { setSaving(false); }
  };

  const handleDeletePlan = async (planId) => {
    try {
      const { data } = await adminAxios.delete(`/admin/storage-settings/plans/${planId}`);
      if (data.success) { toast.success("Plan deleted"); setPlans(data.plans); }
    } catch { toast.error("Delete failed"); }
    finally { setDeleteConfirm(null); }
  };

  const cancelEdit = () => {
    setEditMode(false);
    fetchSettings();
  };

  // ─────────────────────────────────────────────────────────────────────
  // Derived
  // ─────────────────────────────────────────────────────────────────────
  const usedPct = pct(freeStorageMB, maxStorageMB);

  // ─────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        :root {
          --sm-page:          #f8f9fa;
          --sm-card:          #ffffff;
          --sm-surface:       #ffffff;
          --sm-border:        #e5e7eb;
          --sm-row-brd:       #f3f4f6;
          --sm-shadow:        rgba(0,0,0,.06);
          --sm-shimmer:       #f1f3f4;
          --sm-text-primary:  #111827;
          --sm-text-muted:    #6b7280;
          --sm-accent:        #111827;
          --sm-hover-row:     #f9fafb;
          --sm-input-brd:     #d1d5db;
          --sm-input-focus:   #111827;
          --sm-btn-bg:        #ffffff;
          --sm-btn-brd:       #d1d5db;
          --sm-btn-text:      #374151;
          --sm-popular-bg:    #f5f3ff;
          --sm-popular-brd:   #c4b5fd;
          --sm-badge-ok-bg:   #f0fdf4; --sm-badge-ok-text:  #15803d; --sm-badge-ok-brd:  #bbf7d0;
          --sm-badge-wrn-bg:  #fffbeb; --sm-badge-wrn-text: #b45309; --sm-badge-wrn-brd: #fde68a;
          --sm-badge-err-bg:  #fef2f2; --sm-badge-err-text: #b91c1c; --sm-badge-err-brd: #fecaca;
          --sm-thead:         #f8f9fa;
        }
        @media (prefers-color-scheme: dark) {
          :root {
            --sm-page: #0a0a0a; --sm-card: #111111; --sm-surface: #111111;
            --sm-border: #1f1f1f; --sm-row-brd: #191919;
            --sm-shadow: rgba(0,0,0,.3); --sm-shimmer: #1a1a1a;
            --sm-text-primary: #f3f4f6; --sm-text-muted: #6b7280; --sm-accent: #f3f4f6;
            --sm-hover-row: #161616;
            --sm-input-brd: #2a2a2a; --sm-input-focus: #f3f4f6;
            --sm-btn-bg: #161616; --sm-btn-brd: #2a2a2a; --sm-btn-text: #d1d5db;
            --sm-popular-bg: #2e1065; --sm-popular-brd: #5b21b6;
            --sm-badge-ok-bg: #14532d; --sm-badge-ok-text: #86efac; --sm-badge-ok-brd: #166534;
            --sm-badge-wrn-bg: #451a03; --sm-badge-wrn-text: #fcd34d; --sm-badge-wrn-brd: #78350f;
            --sm-badge-err-bg: #450a0a; --sm-badge-err-text: #fca5a5; --sm-badge-err-brd: #7f1d1d;
            --sm-thead: #161616;
          }
        }
        .dark {
          --sm-page: #0a0a0a; --sm-card: #111111; --sm-surface: #111111;
          --sm-border: #1f1f1f; --sm-row-brd: #191919;
          --sm-shadow: rgba(0,0,0,.3); --sm-shimmer: #1a1a1a;
          --sm-text-primary: #f3f4f6; --sm-text-muted: #6b7280; --sm-accent: #f3f4f6;
          --sm-hover-row: #161616;
          --sm-input-brd: #2a2a2a; --sm-input-focus: #f3f4f6;
          --sm-btn-bg: #161616; --sm-btn-brd: #2a2a2a; --sm-btn-text: #d1d5db;
          --sm-popular-bg: #2e1065; --sm-popular-brd: #5b21b6;
          --sm-badge-ok-bg: #14532d; --sm-badge-ok-text: #86efac; --sm-badge-ok-brd: #166534;
          --sm-badge-wrn-bg: #451a03; --sm-badge-wrn-text: #fcd34d; --sm-badge-wrn-brd: #78350f;
          --sm-badge-err-bg: #450a0a; --sm-badge-err-text: #fca5a5; --sm-badge-err-brd: #7f1d1d;
          --sm-thead: #161616;
        }

        @keyframes sm-shimmer { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes sm-fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes sm-fadeUp  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
        @keyframes sm-scaleIn { from{opacity:0;transform:scale(.95)} to{opacity:1;transform:scale(1)} }

        .sm-row:hover td { background: var(--sm-hover-row) !important; }
        .sm-tbtn { background: var(--sm-btn-bg); border: 1px solid var(--sm-btn-brd); color: var(--sm-btn-text); cursor: pointer; border-radius: 7px; font-size: 13px; display: flex; align-items: center; gap: 6px; padding: 7px 14px; font-weight: 500; transition: opacity .15s; }
        .sm-tbtn:hover { opacity: .8; }
        .sm-input { width: 100%; box-sizing: border-box; padding: 9px 12px; border: 1px solid var(--sm-input-brd); border-radius: 7px; font-size: 13px; color: var(--sm-text-primary); background: var(--sm-card); outline: none; transition: border .15s; font-family: inherit; }
        .sm-input:focus { border-color: var(--sm-input-focus); }
        .sm-scroll::-webkit-scrollbar { width: 4px; }
        .sm-scroll::-webkit-scrollbar-thumb { background: var(--sm-border); border-radius: 2px; }
        .sm-chip-btn { padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: 600; cursor: pointer; border: 1px solid; transition: all .15s; }
        .sm-plan-grid { display: grid; gap: 14px; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); }
        @media (max-width: 600px) { .sm-plan-grid { grid-template-columns: 1fr; } }
        .sm-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        @media (max-width: 640px) { .sm-two-col { grid-template-columns: 1fr; } }
        .sm-three-col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
        @media (max-width: 700px) { .sm-three-col { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 480px) { .sm-three-col { grid-template-columns: 1fr; } }
      `}</style>

      <div style={{ background: "var(--sm-page)", minHeight: "100vh", fontFamily: "system-ui,-apple-system,sans-serif" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 16px", display: "flex", flexDirection: "column", gap: 18 }}>

          {/* ── Breadcrumb ──────────────────────────────────────────────── */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--sm-text-muted)" }}>
            <HiOutlineHome size={14} />
            <span style={{ color: "var(--sm-border)" }}>/</span>
            <span>Admin</span>
            <span style={{ color: "var(--sm-border)" }}>/</span>
            <span style={{ color: "var(--sm-text-primary)", fontWeight: 600 }}>Storage Manager</span>
          </div>

          {/* ── Page header ──────────────────────────────────────────────── */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "var(--sm-text-primary)", letterSpacing: "-.3px" }}>
                Storage Manager
              </h1>
              <p style={{ margin: "3px 0 0", fontSize: 13, color: "var(--sm-text-muted)" }}>
                Configure free tiers, purchasable plans, and monitor storage purchases.
              </p>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              {!editMode ? (
                <>
                  <button onClick={() => { fetchSettings(); fetchPurchases(); }} className="sm-tbtn">
                    <HiOutlineArrowPath size={14} />
                    Refresh
                  </button>
                  <button onClick={() => setEditMode(true)} style={{
                    display: "flex", alignItems: "center", gap: 6, padding: "7px 16px",
                    background: "var(--sm-text-primary)", border: "none", borderRadius: 7,
                    fontSize: 13, color: "var(--sm-page)", cursor: "pointer", fontWeight: 600,
                  }}>
                    <HiOutlinePencilSquare size={14} /> Edit Settings
                  </button>
                </>
              ) : (
                <>
                  <button onClick={cancelEdit} className="sm-tbtn">
                    <HiOutlineXMark size={14} /> Cancel
                  </button>
                  <button onClick={handleSave} disabled={saving} style={{
                    display: "flex", alignItems: "center", gap: 6, padding: "7px 16px",
                    background: "#15803d", border: "none", borderRadius: 7,
                    fontSize: 13, color: "#fff", cursor: "pointer", fontWeight: 600,
                    opacity: saving ? .6 : 1,
                  }}>
                    <HiOutlineCheck size={14} />
                    {saving ? "Saving…" : "Save Settings"}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* ── Loading skeleton ─────────────────────────────────────────── */}
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[140, 220, 300].map((h, i) => (
                <div key={i} style={{ height: h, borderRadius: 10, background: "var(--sm-card)", border: "1px solid var(--sm-border)", animation: "sm-shimmer 1.4s ease infinite" }} />
              ))}
            </div>
          ) : (
            <>
              {/* ── Storage quota overview ─────────────────────────────── */}
              <div style={{
                background: "var(--sm-card)", border: "1px solid var(--sm-border)",
                borderRadius: 10, padding: "20px 22px",
                boxShadow: "0 1px 3px var(--sm-shadow)",
              }}>
                <SectionHeading>Storage Quota Configuration</SectionHeading>

                <div className="sm-two-col" style={{ marginBottom: 24 }}>
                  {/* Free tier */}
                  <div style={{ background: "var(--sm-page)", border: "1px solid var(--sm-border)", borderRadius: 8, padding: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <HiOutlineShieldCheck size={16} style={{ color: "#1d4ed8" }} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--sm-text-primary)" }}>Free Tier</span>
                    </div>
                    {editMode ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <input type="number" min="100" max="10240" value={freeStorageMB}
                          onChange={e => setFreeStorageMB(parseInt(e.target.value) || 100)}
                          className="sm-input" style={{ flex: 1 }} />
                        <span style={{ fontSize: 12, color: "var(--sm-text-muted)", whiteSpace: "nowrap" }}>MB</span>
                      </div>
                    ) : (
                      <div style={{ fontSize: 28, fontWeight: 800, color: "#1d4ed8", letterSpacing: "-.3px" }}>
                        {fmtBytes(freeStorageMB)}
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: "var(--sm-text-muted)", marginTop: 6 }}>
                      {editMode ? "Min 100 MB · Max 10 GB" : "Given to every new editor automatically"}
                    </div>
                  </div>

                  {/* Max purchasable */}
                  <div style={{ background: "var(--sm-page)", border: "1px solid var(--sm-border)", borderRadius: 8, padding: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: "#f5f3ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <HiOutlineCircleStack size={16} style={{ color: "#6d28d9" }} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--sm-text-primary)" }}>Maximum Cap</span>
                    </div>
                    {editMode ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <input type="number" min="1024" max="102400" value={maxStorageMB}
                          onChange={e => setMaxStorageMB(parseInt(e.target.value) || 1024)}
                          className="sm-input" style={{ flex: 1 }} />
                        <span style={{ fontSize: 12, color: "var(--sm-text-muted)", whiteSpace: "nowrap" }}>MB</span>
                      </div>
                    ) : (
                      <div style={{ fontSize: 28, fontWeight: 800, color: "#6d28d9", letterSpacing: "-.3px" }}>
                        {fmtBytes(maxStorageMB)}
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: "var(--sm-text-muted)", marginTop: 6 }}>
                      {editMode ? "Min 1 GB · Max 100 GB" : "Maximum any editor can accumulate"}
                    </div>
                  </div>
                </div>

                {/* Visual representation */}
                <div style={{ background: "var(--sm-page)", border: "1px solid var(--sm-border)", borderRadius: 8, padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--sm-text-muted)" }}>Free tier as % of max capacity</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--sm-text-primary)" }}>
                      {fmtBytes(freeStorageMB)} / {fmtBytes(maxStorageMB)} ({usedPct}%)
                    </span>
                  </div>
                  <ProgressBar value={usedPct} color="#1d4ed8" />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--sm-text-muted)", marginTop: 5 }}>
                    <span>0</span>
                    <span>{fmtBytes(maxStorageMB)}</span>
                  </div>
                </div>
              </div>

              {/* ── Plans section ──────────────────────────────────────── */}
              <div style={{
                background: "var(--sm-card)", border: "1px solid var(--sm-border)",
                borderRadius: 10, padding: "20px 22px",
                boxShadow: "0 1px 3px var(--sm-shadow)",
              }}>
                <SectionHeading
                  action={editMode && (
                    <button onClick={openAddPlan} style={{
                      display: "flex", alignItems: "center", gap: 6, padding: "6px 14px",
                      background: "var(--sm-text-primary)", border: "none", borderRadius: 7,
                      fontSize: 12, color: "var(--sm-page)", cursor: "pointer", fontWeight: 600,
                    }}>
                      <HiOutlinePlus size={13} /> Add Plan
                    </button>
                  )}
                >
                  Storage Plans
                </SectionHeading>

                {plans.length === 0 ? (
                  <div style={{ padding: "40px 0", textAlign: "center" }}>
                    <div style={{ width: 48, height: 48, borderRadius: 10, border: "2px dashed var(--sm-border)", background: "var(--sm-shimmer)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                      <HiOutlineCircleStack size={20} style={{ color: "var(--sm-text-muted)", opacity: .4 }} />
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--sm-text-primary)", marginBottom: 4 }}>No plans configured</div>
                    <div style={{ fontSize: 13, color: "var(--sm-text-muted)", marginBottom: editMode ? 14 : 0 }}>
                      Add purchasable storage plans for editors.
                    </div>
                    {editMode && (
                      <button onClick={openAddPlan} style={{
                        padding: "7px 18px", background: "var(--sm-text-primary)", border: "none",
                        borderRadius: 7, color: "var(--sm-page)", fontSize: 13, cursor: "pointer", fontWeight: 600,
                      }}>Add First Plan</button>
                    )}
                  </div>
                ) : (
                  <div className="sm-plan-grid">
                    {plans.map(plan => (
                      <PlanCard
                        key={plan.id} plan={plan}
                        onEdit={openEditPlan} onDelete={id => setDeleteConfirm(id)}
                        editMode={editMode}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* ── Purchase History ─────────────────────────────────────── */}
              <div style={{
                background: "var(--sm-card)", border: "1px solid var(--sm-border)",
                borderRadius: 10, overflow: "hidden",
                boxShadow: "0 1px 3px var(--sm-shadow)",
              }}>
                {/* Collapsible header */}
                <button
                  onClick={() => setShowPurchases(v => !v)}
                  style={{
                    width: "100%", padding: "16px 22px",
                    background: "none", border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    borderBottom: showPurchases ? "1px solid var(--sm-border)" : "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: "#f5f3ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <HiOutlineBanknotes size={16} style={{ color: "#6d28d9" }} />
                    </div>
                    <div style={{ textAlign: "left" }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--sm-text-primary)" }}>Purchase History</div>
                      <div style={{ fontSize: 12, color: "var(--sm-text-muted)" }}>Storage upgrade transactions from editors</div>
                    </div>
                  </div>
                  {showPurchases
                    ? <HiOutlineChevronUp size={16} style={{ color: "var(--sm-text-muted)" }} />
                    : <HiOutlineChevronDown size={16} style={{ color: "var(--sm-text-muted)" }} />}
                </button>

                {showPurchases && (
                  <div style={{ padding: "18px 22px", animation: "sm-fadeUp .2s ease" }}>

                    {/* Stat cards */}
                    <div className="sm-three-col" style={{ marginBottom: 18 }}>
                      {[
                        { label: "Total Revenue",     value: `₹${(stats.totalRevenue || 0).toLocaleString()}`, icon: HiOutlineBanknotes,  color: "#15803d", bg: "#f0fdf4", brd: "#bbf7d0" },
                        { label: "Completed",          value: stats.totalCompleted || 0,                        icon: HiOutlineCheckCircle, color: "#1d4ed8", bg: "#eff6ff", brd: "#bfdbfe" },
                        { label: "Pending",            value: stats.totalPending   || 0,                        icon: HiOutlineClock, color: "#b45309", bg: "#fffbeb", brd: "#fde68a" },
                      ].map((s, i) => (
                        <div key={i} style={{ background: s.bg, border: `1px solid ${s.brd}`, borderRadius: 8, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 8, background: s.color + "22", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <s.icon size={16} style={{ color: s.color }} />
                          </div>
                          <div>
                            <div style={{ fontSize: 20, fontWeight: 800, color: s.color, letterSpacing: "-.2px" }}>{s.value}</div>
                            <div style={{ fontSize: 11, color: s.color, opacity: .7, fontWeight: 600 }}>{s.label}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Filter + table */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 12, color: "var(--sm-text-muted)", fontWeight: 500 }}>Status:</span>
                      {[["all","All"],["completed","Completed"],["pending","Pending"],["failed","Failed"]].map(([v, l]) => (
                        <button key={v} onClick={() => { setPFilter(v); setPPage(1); }}
                          className="sm-chip-btn"
                          style={{
                            background:  pFilter === v ? "var(--sm-text-primary)" : "transparent",
                            color:       pFilter === v ? "var(--sm-page)"         : "var(--sm-text-muted)",
                            borderColor: pFilter === v ? "var(--sm-text-primary)" : "var(--sm-border)",
                          }}
                        >{l}</button>
                      ))}
                    </div>

                    {pLoading ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} style={{ height: 48, borderRadius: 7, background: "var(--sm-shimmer)", animation: "sm-shimmer 1.4s ease infinite" }} />
                        ))}
                      </div>
                    ) : purchases.length === 0 ? (
                      <div style={{ padding: "40px 0", textAlign: "center" }}>
                        <div style={{ width: 44, height: 44, borderRadius: 10, border: "2px dashed var(--sm-border)", background: "var(--sm-shimmer)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                          <HiOutlineBanknotes size={18} style={{ color: "var(--sm-text-muted)", opacity: .4 }} />
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--sm-text-primary)", marginBottom: 4 }}>No purchases found</div>
                        <div style={{ fontSize: 13, color: "var(--sm-text-muted)" }}>
                          {pFilter !== "all" ? "Try switching the status filter." : "Purchases will appear here when editors buy storage."}
                        </div>
                      </div>
                    ) : (
                      <>
                        <div style={{ overflowX: "auto" }}>
                          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
                            <thead>
                              <tr>
                                {["Editor","Plan","Storage","Amount","Status","Date"].map(h => (
                                  <th key={h} style={{
                                    padding: "9px 12px", fontSize: 11, fontWeight: 600, textAlign: "left",
                                    color: "var(--sm-text-muted)", textTransform: "uppercase", letterSpacing: ".07em",
                                    background: "var(--sm-thead)", borderBottom: "1px solid var(--sm-border)",
                                    whiteSpace: "nowrap",
                                  }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {purchases.map(p => (
                                <tr key={p._id} className="sm-row" style={{ borderBottom: "1px solid var(--sm-row-brd)", transition: "background .1s" }}>
                                  <td style={{ padding: "11px 12px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                      <UserAvatar src={p.user?.profilePic} name={p.user?.name} size={30} />
                                      <div style={{ minWidth: 0 }}>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--sm-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 140 }}>
                                          {p.user?.name || "Unknown"}
                                        </div>
                                        <div style={{ fontSize: 11, color: "var(--sm-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 140 }}>
                                          {p.user?.email || "—"}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td style={{ padding: "11px 12px" }}>
                                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--sm-text-primary)" }}>{p.planName}</span>
                                  </td>
                                  <td style={{ padding: "11px 12px" }}>
                                    <span style={{
                                      fontFamily: "monospace", fontSize: 11, fontWeight: 700,
                                      color: "var(--sm-text-primary)", background: "var(--sm-shimmer)",
                                      padding: "2px 6px", borderRadius: 4, border: "1px solid var(--sm-border)",
                                    }}>
                                      {fmtBytes(p.storageMB)}
                                    </span>
                                  </td>
                                  <td style={{ padding: "11px 12px" }}>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--sm-text-primary)" }}>
                                      ₹{p.amount?.toLocaleString()}
                                    </span>
                                  </td>
                                  <td style={{ padding: "11px 12px" }}>
                                    <StatusBadge status={p.status} sm />
                                  </td>
                                  <td style={{ padding: "11px 12px", fontSize: 12, color: "var(--sm-text-muted)", whiteSpace: "nowrap" }}>
                                    {p.purchasedAt
                                      ? new Date(p.purchasedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                                      : new Date(p.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Pagination */}
                        {pPagination.pages > 1 && (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--sm-border)", flexWrap: "wrap", gap: 10 }}>
                            <div style={{ fontSize: 13, color: "var(--sm-text-muted)" }}>
                              Showing{" "}
                              <b style={{ color: "var(--sm-text-primary)" }}>
                                {((pPage - 1) * 10) + 1}–{Math.min(pPage * 10, pPagination.total)}
                              </b>
                              {" "}of{" "}
                              <b style={{ color: "var(--sm-text-primary)" }}>{pPagination.total}</b>
                            </div>
                            <div style={{ display: "flex", gap: 4 }}>
                              <button onClick={() => setPPage(p => Math.max(1, p - 1))} disabled={pPage === 1}
                                style={{ width: 30, height: 30, borderRadius: 5, border: "1px solid var(--sm-border)", background: "var(--sm-card)", cursor: pPage === 1 ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: pPage === 1 ? .3 : 1, color: "var(--sm-text-muted)" }}>
                                <HiOutlineChevronLeft size={13} />
                              </button>
                              {Array.from({ length: pPagination.pages }).map((_, i) => {
                                const p = i + 1;
                                if (p === 1 || p === pPagination.pages || (p >= pPage - 1 && p <= pPage + 1)) return (
                                  <button key={p} onClick={() => setPPage(p)}
                                    style={{ width: 30, height: 30, borderRadius: 5, border: "1px solid", borderColor: pPage === p ? "var(--sm-text-primary)" : "var(--sm-border)", background: pPage === p ? "var(--sm-text-primary)" : "var(--sm-card)", color: pPage === p ? "var(--sm-page)" : "var(--sm-text-primary)", fontSize: 13, fontWeight: pPage === p ? 700 : 400, cursor: "pointer" }}>{p}</button>
                                );
                                if (p === pPage - 2 || p === pPage + 2) return (
                                  <span key={p} style={{ width: 30, textAlign: "center", fontSize: 13, color: "var(--sm-text-muted)", lineHeight: "30px" }}>…</span>
                                );
                                return null;
                              })}
                              <button onClick={() => setPPage(p => Math.min(pPagination.pages, p + 1))} disabled={pPage >= pPagination.pages}
                                style={{ width: 30, height: 30, borderRadius: 5, border: "1px solid var(--sm-border)", background: "var(--sm-card)", cursor: pPage >= pPagination.pages ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: pPage >= pPagination.pages ? .3 : 1, color: "var(--sm-text-muted)" }}>
                                <HiOutlineChevronRight size={13} />
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  PLAN MODAL (Add / Edit)                                            */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {showPlanModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", backdropFilter: "blur(2px)",
          zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
          animation: "sm-fadeIn .15s ease",
        }}>
          <div style={{
            background: "var(--sm-card)", borderRadius: 12, width: "100%", maxWidth: 480,
            overflow: "hidden", boxShadow: "0 12px 48px rgba(0,0,0,.22)",
            border: "1px solid var(--sm-border)", animation: "sm-scaleIn .2s ease",
          }}>
            {/* Modal header */}
            <div style={{
              padding: "16px 20px", borderBottom: "1px solid var(--sm-border)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "var(--sm-shimmer)",
            }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--sm-text-primary)" }}>
                {editingPlan ? "Edit Plan" : "Add Storage Plan"}
              </div>
              <button onClick={() => setShowPlanModal(false)} style={{ width: 28, height: 28, borderRadius: 6, border: "none", background: "var(--sm-btn-bg)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--sm-text-muted)" }}>
                <HiOutlineXMark size={16} />
              </button>
            </div>

            {/* Modal body */}
            <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--sm-text-muted)", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".06em" }}>
                  Plan ID <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <input
                  className="sm-input"
                  placeholder="e.g. basic_5gb"
                  value={planForm.id}
                  onChange={e => setPlanForm(f => ({ ...f, id: e.target.value.toLowerCase().replace(/\s/g, "_") }))}
                  disabled={!!editingPlan}
                  style={{ opacity: editingPlan ? .5 : 1 }}
                />
                <div style={{ fontSize: 11, color: "var(--sm-text-muted)", marginTop: 4 }}>Unique identifier. Cannot be changed after creation.</div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--sm-text-muted)", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".06em" }}>
                  Plan Name <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <input className="sm-input" placeholder="e.g. Starter — 5 GB"
                  value={planForm.name}
                  onChange={e => setPlanForm(f => ({ ...f, name: e.target.value }))} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--sm-text-muted)", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".06em" }}>
                    Storage (MB) <span style={{ color: "#dc2626" }}>*</span>
                  </label>
                  <input type="number" min="100" className="sm-input" placeholder="5120"
                    value={planForm.storageMB}
                    onChange={e => setPlanForm(f => ({ ...f, storageMB: parseInt(e.target.value) || 0 }))} />
                  <div style={{ fontSize: 10, color: "var(--sm-text-muted)", marginTop: 3 }}>
                    = {fmtBytes(planForm.storageMB)}
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--sm-text-muted)", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".06em" }}>
                    Price (₹) <span style={{ color: "#dc2626" }}>*</span>
                  </label>
                  <input type="number" min="0" className="sm-input" placeholder="99"
                    value={planForm.price}
                    onChange={e => setPlanForm(f => ({ ...f, price: parseInt(e.target.value) || 0 }))} />
                  <div style={{ fontSize: 10, color: "var(--sm-text-muted)", marginTop: 3 }}>One-time payment</div>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--sm-text-muted)", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".06em" }}>
                  Features
                </label>
                <textarea className="sm-input" rows={4} placeholder={"5 GB cloud storage\nProject file backup\nPriority uploader\nNo expiry"}
                  value={planForm.features}
                  onChange={e => setPlanForm(f => ({ ...f, features: e.target.value }))}
                  style={{ resize: "vertical", lineHeight: 1.5 }} />
                <div style={{ fontSize: 11, color: "var(--sm-text-muted)", marginTop: 4 }}>One feature per line.</div>
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                <div
                  onClick={() => setPlanForm(f => ({ ...f, popular: !f.popular }))}
                  style={{
                    width: 38, height: 22, borderRadius: 11, border: "none", cursor: "pointer",
                    background: planForm.popular ? "#6d28d9" : "var(--sm-shimmer)",
                    position: "relative", transition: "background .15s", flexShrink: 0,
                  }}
                >
                  <span style={{
                    position: "absolute", top: 2, left: planForm.popular ? 18 : 2, width: 18, height: 18,
                    borderRadius: "50%", background: "#fff", transition: "left .15s",
                    boxShadow: "0 1px 3px rgba(0,0,0,.2)",
                  }} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--sm-text-primary)" }}>Mark as Popular</div>
                  <div style={{ fontSize: 11, color: "var(--sm-text-muted)" }}>Shows a purple "Popular" badge on the plan card.</div>
                </div>
              </label>
            </div>

            {/* Modal footer */}
            <div style={{
              padding: "14px 20px", borderTop: "1px solid var(--sm-border)",
              background: "var(--sm-shimmer)", display: "flex", gap: 10, justifyContent: "flex-end",
            }}>
              <button onClick={() => setShowPlanModal(false)} className="sm-tbtn">Cancel</button>
              <button
                onClick={handleSavePlan} disabled={saving}
                style={{
                  padding: "8px 20px", background: "var(--sm-text-primary)", border: "none",
                  borderRadius: 7, fontSize: 13, color: "var(--sm-page)", cursor: "pointer", fontWeight: 600,
                  opacity: saving ? .6 : 1, display: "flex", alignItems: "center", gap: 6,
                }}
              >
                <HiOutlineCheck size={14} />
                {saving ? "Saving…" : editingPlan ? "Update Plan" : "Add Plan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  DELETE CONFIRMATION DIALOG                                          */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {deleteConfirm && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", backdropFilter: "blur(2px)",
          zIndex: 1001, display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
          animation: "sm-fadeIn .15s ease",
        }}>
          <div style={{
            background: "var(--sm-card)", borderRadius: 12, width: "100%", maxWidth: 380,
            overflow: "hidden", boxShadow: "0 12px 48px rgba(0,0,0,.22)",
            border: "1px solid var(--sm-border)", animation: "sm-scaleIn .2s ease",
          }}>
            <div style={{ padding: "20px 22px" }}>
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <HiOutlineTrash size={20} style={{ color: "#dc2626" }} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--sm-text-primary)", marginBottom: 6 }}>Delete Storage Plan</div>
                  <div style={{ fontSize: 13, color: "var(--sm-text-muted)", lineHeight: 1.6 }}>
                    This plan will be permanently removed. Editors who already purchased it will retain their storage.
                  </div>
                </div>
              </div>
            </div>
            <div style={{
              padding: "12px 22px 18px", display: "flex", gap: 10, justifyContent: "flex-end",
            }}>
              <button onClick={() => setDeleteConfirm(null)} className="sm-tbtn">Cancel</button>
              <button
                onClick={() => handleDeletePlan(deleteConfirm)}
                style={{
                  padding: "8px 20px", background: "#dc2626", border: "none", borderRadius: 7,
                  fontSize: 13, color: "#fff", cursor: "pointer", fontWeight: 600,
                  display: "flex", alignItems: "center", gap: 6,
                }}
              >
                <HiOutlineTrash size={13} /> Delete Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StorageManager;