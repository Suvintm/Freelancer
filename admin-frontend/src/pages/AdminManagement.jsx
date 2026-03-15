// ─── AdminManagement.jsx — Production Admin Team Management ──────────────────
// Light/dark theme via CSS variables. Fully responsive. Zero Tailwind dependency.
// Deps: @tanstack/react-query, react-hot-toast, react-icons/hi2, ../api/adminApi

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  HiOutlineUserPlus,
  HiOutlineLockClosed,
  HiOutlineEnvelope,
  HiOutlineUser,
  HiOutlineKey,
  HiOutlineIdentification,
  HiOutlineTrash,
  HiOutlinePencilSquare,
  HiOutlineShieldCheck,
  HiOutlineNoSymbol,
  HiOutlineCheckCircle,
  HiOutlineXMark,
  HiOutlineHome,
  HiOutlineArrowPath,
  HiOutlineCheck,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlineClock,
  HiOutlineUserGroup,
  HiOutlineShieldExclamation,
  HiOutlineStar,
  HiOutlineBriefcase,
  HiOutlineChartBarSquare,
  HiOutlineCog6Tooth,
  HiOutlineExclamationTriangle,
  HiMiniCheck,
} from "react-icons/hi2";
import { toast } from "react-hot-toast";
import { adminMgmtApi, authApi } from "../api/adminApi";
import { useIsSuperAdmin } from "../hooks/usePermission";
import { formatDate } from "../utils/formatters";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
import { PERMISSIONS_LIST } from "../components/RoleManagement";
import RoleManagement from "../components/RoleManagement";

const PERMISSIONS = PERMISSIONS_LIST.map(p => ({
  ...p,
  icon: HiOutlineCheckCircle // default placeholder
}));

const DEFAULT_FORM = {
  name: "", email: "", password: "", role: "",
  permissions: Object.fromEntries(PERMISSIONS_LIST.map(p => [p.key, false])),
};

// ─────────────────────────────────────────────────────────────────────────────
// Atoms
// ─────────────────────────────────────────────────────────────────────────────
const AdminAvatar = ({ name, size = 38, role, src }) => {
  if (src) {
    return (
      <div style={{ width: size, height: size, borderRadius: 10, flexShrink: 0, position: "relative", border: "2px solid var(--am-surface)", overflow: "hidden" }}>
         <img src={src} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    );
  }
  const initial  = (name || "?").charAt(0).toUpperCase();
  const isSup    = role === "superadmin";
  const palette  = ["#6d28d9","#1d4ed8","#0369a1","#15803d","#b45309","#c2410c"];
  const bg       = isSup ? "#6d28d9" : palette[(name || "").charCodeAt(0) % palette.length];
  return (
    <div style={{ width: size, height: size, borderRadius: 10, background: bg, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.4, fontWeight: 800, flexShrink: 0, position: "relative", border: "2px solid var(--am-surface)" }}>
      {initial}
      {isSup && (
        <span style={{ position: "absolute", bottom: -3, right: -3, width: 14, height: 14, borderRadius: "50%", background: "#fbbf24", border: "2px solid var(--am-surface)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <HiOutlineStar size={7} style={{ color: "#78350f" }} />
        </span>
      )}
    </div>
  );
};

const RoleBadge = ({ role }) => {
  const cfg = {
    superadmin: { label: "Superadmin", bg: "#fdf4ff", text: "#7e22ce", brd: "#e9d5ff", dot: "#a855f7" },
    admin:      { label: "Admin",      bg: "#eff6ff", text: "#1d4ed8", brd: "#bfdbfe", dot: "#3b82f6" },
    moderator:  { label: "Moderator",  bg: "#f0fdf4", text: "#15803d", brd: "#bbf7d0", dot: "#22c55e" },
  }[role] || { label: role, bg: "var(--am-shimmer)", text: "var(--am-text-muted)", brd: "var(--am-border)", dot: "#9ca3af" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.brd}`, whiteSpace: "nowrap" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot }} />
      {cfg.label}
    </span>
  );
};

const StatusBadge = ({ active }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 999, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap",
    background: active ? "#f0fdf4" : "#fef2f2",
    color:      active ? "#15803d" : "#b91c1c",
    border:     `1px solid ${active ? "#bbf7d0" : "#fecaca"}`,
  }}>
    <span style={{ width: 6, height: 6, borderRadius: "50%", background: active ? "#22c55e" : "#ef4444", ...(active ? { animation: "am-pulse 2s infinite" } : {}) }} />
    {active ? "Active" : "Revoked"}
  </span>
);

const PermDots = ({ permissions }) => {
  const active = Object.values(permissions || {}).filter(Boolean).length;
  const total  = PERMISSIONS.length;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <div style={{ display: "flex", gap: 3 }}>
        {PERMISSIONS.map((p, i) => (
          <div key={p.key} title={p.label} style={{ width: 8, height: 8, borderRadius: "50%", background: permissions?.[p.key] ? "#6d28d9" : "var(--am-shimmer)", border: `1px solid ${permissions?.[p.key] ? "#8b5cf6" : "var(--am-border)"}`, transition: "background .15s" }} />
        ))}
      </div>
      <span style={{ fontSize: 11, color: "var(--am-text-muted)", fontWeight: 600 }}>{active}/{total}</span>
    </div>
  );
};

const KpiCard = ({ label, value, icon: Icon, color, loading }) => (
  <div style={{ background: "var(--am-card)", border: "1px solid var(--am-border)", borderRadius: 10, padding: "14px 18px", flex: 1, minWidth: 130, display: "flex", alignItems: "center", gap: 12, boxShadow: "0 1px 3px var(--am-shadow)" }}>
    <div style={{ width: 36, height: 36, borderRadius: 9, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <Icon size={16} style={{ color }} />
    </div>
    {loading ? (
      <div>
        <div style={{ height: 20, width: 36, borderRadius: 4, background: "var(--am-shimmer)", marginBottom: 4, animation: "am-shimmer 1.4s ease infinite" }} />
        <div style={{ height: 11, width: 60, borderRadius: 4, background: "var(--am-shimmer)", animation: "am-shimmer 1.4s ease infinite" }} />
      </div>
    ) : (
      <div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "var(--am-text-primary)", lineHeight: 1.1 }}>{value ?? 0}</div>
        <div style={{ fontSize: 11, color: "var(--am-text-muted)", marginTop: 2 }}>{label}</div>
      </div>
    )}
  </div>
);

const SkeletonRow = () => (
  <tr style={{ borderBottom: "1px solid var(--am-row-brd)" }}>
    {[44, 160, 80, 80, 80, 90, 60].map((w, i) => (
      <td key={i} style={{ padding: "14px 14px" }}>
        <div style={{ height: i === 0 ? 38 : 13, width: i === 0 ? 38 : w, borderRadius: i === 0 ? 10 : 4, background: "var(--am-shimmer)", animation: "am-shimmer 1.4s ease infinite" }} />
      </td>
    ))}
  </tr>
);

// Labeled form field
const FLabel = ({ children, required }) => (
  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--am-text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>
    {children}{required && <span style={{ color: "#dc2626" }}> *</span>}
  </label>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
const AdminManagement = () => {
  const isSuperAdmin = useIsSuperAdmin();
  const queryClient  = useQueryClient();

  const [showPanel,  setShowPanel]  = useState(false);
  const [editing,    setEditing]    = useState(null);
  const [form,       setForm]       = useState(DEFAULT_FORM);
  const [customRole, setCustomRole] = useState("");
  const [imageFile,  setImageFile]  = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showPwd,    setShowPwd]    = useState(false);
  const [delConfirm, setDelConfirm] = useState(null);
  const [search,     setSearch]     = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [activeTab,  setActiveTab]  = useState("admins");
  const nameRef  = useRef(null);
  const searchRef = useRef(null);

  // ── Queries ───────────────────────────────────────────────────────────────
  const { data, isLoading, isFetching } = useQuery({
    queryKey:  ["admin-management"],
    queryFn:   () => adminMgmtApi.getAll().then(r => r.data),
    enabled:   isSuperAdmin,
    staleTime: 30_000,
  });

  // Fetch dynamic roles
  const { data: rolesRes } = useQuery({
    queryKey: ["roles"],
    queryFn: () => authApi.getRoles().then(r => r.data),
    enabled: isSuperAdmin,
  });

  const dynamicRoles = rolesRes?.roles || [];
  const mappedRoles = dynamicRoles.map(r => {
    const isObj = typeof r === "object";
    const val = isObj ? r.value : r;
    const name = isObj ? r.name : (val.charAt(0).toUpperCase() + val.slice(1));
    const desc = (isObj && r.description) ? r.description : `${name} access`;
    const color = (isObj && r.color) ? r.color : "#1d4ed8";
    
    // Check if the backend gave us a memberCount, otherwise default to "new" or blank
    const countLabel = (isObj && typeof r.memberCount === "number") ? `(${r.memberCount})` : "";
    const explicitLabel = countLabel ? `${name} ${countLabel}` : name;
    
    return {
      value: val,
      label: explicitLabel,
      desc: desc,
      color: color,
      bg: color + "15",
      brd: color + "40",
      permissions: isObj ? r.permissions : undefined
    };
  });

  const admins = data?.admins || [];

  // ── Mutations ─────────────────────────────────────────────────────────────
  const createMut = useMutation({
    mutationFn: d => adminMgmtApi.create(d),
    onSuccess:  () => { toast.success("Admin account created"); queryClient.invalidateQueries(["admin-management"]); closePanel(); },
    onError:    e  => toast.error(e.response?.data?.message || "Create failed"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, d }) => adminMgmtApi.update(id, d),
    onSuccess:  () => { toast.success("Admin updated"); queryClient.invalidateQueries(["admin-management"]); closePanel(); },
    onError:    e  => toast.error(e.response?.data?.message || "Update failed"),
  });

  const deleteMut = useMutation({
    mutationFn: id => adminMgmtApi.delete(id),
    onSuccess:  () => { toast.success("Access revoked"); queryClient.invalidateQueries(["admin-management"]); setDelConfirm(null); },
    onError:    () => toast.error("Delete failed"),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, isActive }) => adminMgmtApi.update(id, { isActive }),
    onSuccess:  () => queryClient.invalidateQueries(["admin-management"]),
    onError:    () => toast.error("Toggle failed"),
  });

  // ── Handlers ─────────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditing(null);
    setForm(DEFAULT_FORM);
    setCustomRole("");
    setImageFile(null);
    setImagePreview(null);
    setShowPwd(false);
    setShowPanel(true);
    setTimeout(() => nameRef.current?.focus(), 100);
  };

  const openEdit = (admin) => {
    setEditing(admin);
    setForm({ name: admin.name, email: admin.email, password: "", role: admin.role, permissions: admin.permissions || DEFAULT_FORM.permissions });
    
    // Check if the current role is one of the predefined ones, if not, put it in customRole
    const isCustom = !mappedRoles.some(r => r.value === admin.role) && admin.role !== "superadmin" && admin.role !== "admin" && admin.role !== "moderator";
    setCustomRole(isCustom ? admin.role : "");

    setImageFile(null);
    setImagePreview(admin.profileImage || null);
    setShowPwd(false);
    setShowPanel(true);
    setTimeout(() => nameRef.current?.focus(), 100);
  };

  const closePanel = () => { setShowPanel(false); setEditing(null); setImageFile(null); setImagePreview(null); setCustomRole(""); };

  const handleSubmit = e => {
    e.preventDefault();
    if (!form.name.trim())  return toast.error("Name is required");
    if (!form.email.trim()) return toast.error("Email is required");
    if (!editing && !form.password) return toast.error("Password is required for new admins");
    if (form.password && form.password.length < 8) return toast.error("Password must be at least 8 characters");

    const finalRole = customRole.trim() ? customRole.trim() : form.role;

    const payload = new FormData();
    payload.append("name", form.name);
    payload.append("email", form.email);
    if (form.password) payload.append("password", form.password);
    payload.append("role", finalRole);
    payload.append("permissions", JSON.stringify(form.permissions));
    if (imageFile) {
        payload.append("profileImage", imageFile);
    }

    if (editing) {
      updateMut.mutate({ id: editing._id, d: payload });
    } else {
      createMut.mutate(payload);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const togglePermission = key => setForm(p => ({ ...p, permissions: { ...p.permissions, [key]: !p.permissions[key] } }));

  // ── Derived ───────────────────────────────────────────────────────────────
  const filtered = admins.filter(a => {
    const matchSearch = !search || [a.name, a.email].some(v => v?.toLowerCase().includes(search.toLowerCase()));
    const matchRole   = roleFilter === "all" || a.role === roleFilter;
    return matchSearch && matchRole;
  });

  const superCount = admins.filter(a => a.role === "superadmin").length;
  const activeCount = admins.filter(a => a.isActive !== false).length;

  useEffect(() => {
    const h = e => { if (e.key === "Escape") { setShowPanel(false); setDelConfirm(null); } };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Access denied screen
  // ─────────────────────────────────────────────────────────────────────────
  if (!isSuperAdmin) {
    return (
      <>
        <style>{`@keyframes am-fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }`}</style>
        <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "system-ui,-apple-system,sans-serif" }}>
          <div style={{ textAlign: "center", animation: "am-fadeUp .3s ease", maxWidth: 340 }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: "#fef2f2", border: "1px solid #fecaca", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <HiOutlineLockClosed size={28} style={{ color: "#dc2626" }} />
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#111827", marginBottom: 8 }}>Access Restricted</div>
            <div style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.6 }}>Only Superadmins can manage the administrator team and system permissions.</div>
          </div>
        </div>
      </>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        :root {
          --am-page:         #f8f9fa;
          --am-card:         #ffffff;
          --am-surface:      #ffffff;
          --am-thead:        #f8f9fa;
          --am-border:       #e5e7eb;
          --am-row-brd:      #f3f4f6;
          --am-shadow:       rgba(0,0,0,.06);
          --am-shimmer:      #f1f3f4;
          --am-text-primary: #111827;
          --am-text-muted:   #6b7280;
          --am-accent:       #111827;
          --am-hover:        #f9fafb;
          --am-input-brd:    #d1d5db;
          --am-input-focus:  #111827;
          --am-btn-bg:       #ffffff;
          --am-btn-brd:      #d1d5db;
          --am-btn-text:     #374151;
          --am-panel-bg:     #ffffff;
          --am-panel-hdr:    #f8f9fa;
        }
        @media (prefers-color-scheme: dark) {
          :root {
            --am-page: #0a0a0a; --am-card: #111111; --am-surface: #111111;
            --am-thead: #161616; --am-border: #1f1f1f; --am-row-brd: #191919;
            --am-shadow: rgba(0,0,0,.3); --am-shimmer: #1a1a1a;
            --am-text-primary: #f3f4f6; --am-text-muted: #6b7280; --am-accent: #f3f4f6;
            --am-hover: #161616; --am-input-brd: #2a2a2a; --am-input-focus: #f3f4f6;
            --am-btn-bg: #161616; --am-btn-brd: #2a2a2a; --am-btn-text: #d1d5db;
            --am-panel-bg: #111111; --am-panel-hdr: #161616;
          }
        }
        .dark {
          --am-page: #0a0a0a; --am-card: #111111; --am-surface: #111111;
          --am-thead: #161616; --am-border: #1f1f1f; --am-row-brd: #191919;
          --am-shadow: rgba(0,0,0,.3); --am-shimmer: #1a1a1a;
          --am-text-primary: #f3f4f6; --am-text-muted: #6b7280; --am-accent: #f3f4f6;
          --am-hover: #161616; --am-input-brd: #2a2a2a; --am-input-focus: #f3f4f6;
          --am-btn-bg: #161616; --am-btn-brd: #2a2a2a; --am-btn-text: #d1d5db;
          --am-panel-bg: #111111; --am-panel-hdr: #161616;
        }
        @keyframes am-shimmer { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes am-pulse   { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.8)} }
        @keyframes am-slideIn { from{transform:translateX(100%);opacity:0} to{transform:translateX(0);opacity:1} }
        @keyframes am-fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes am-fadeUp  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
        @keyframes am-scaleIn { from{opacity:0;transform:scale(.96)} to{opacity:1;transform:scale(1)} }
        @keyframes am-spin    { to{transform:rotate(360deg)} }

        .am-row:hover td   { background: var(--am-hover) !important; }
        .am-tbtn           { background:var(--am-btn-bg); border:1px solid var(--am-btn-brd); color:var(--am-btn-text); cursor:pointer; border-radius:7px; font-size:13px; display:flex; align-items:center; gap:6px; padding:7px 14px; font-weight:500; transition:opacity .15s; }
        .am-tbtn:hover     { opacity:.8; }
        .am-input          { width:100%; box-sizing:border-box; padding:10px 12px; border:1px solid var(--am-input-brd); border-radius:8px; font-size:13px; color:var(--am-text-primary); background:var(--am-card); outline:none; transition:border .15s; font-family:inherit; }
        .am-input:focus    { border-color:var(--am-input-focus); box-shadow:0 0 0 3px rgba(17,24,39,.08); }
        .am-chip           { padding:4px 11px; border-radius:999px; font-size:11px; font-weight:600; cursor:pointer; border:1px solid; transition:all .15s; }
        .am-panel-scroll::-webkit-scrollbar { width:4px; }
        .am-panel-scroll::-webkit-scrollbar-thumb { background:var(--am-border); border-radius:2px; }
      `}</style>

      <div style={{ background: "var(--am-page)", minHeight: "100vh", fontFamily: "system-ui,-apple-system,sans-serif" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 16px", display: "flex", flexDirection: "column", gap: 18 }}>

          {/* Breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--am-text-muted)" }}>
            <HiOutlineHome size={14} /><span style={{ color: "var(--am-border)" }}>/</span>
            <span>Admin</span><span style={{ color: "var(--am-border)" }}>/</span>
            <span style={{ color: "var(--am-text-primary)", fontWeight: 600 }}>Team Management</span>
          </div>

          {/* Page header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "var(--am-text-primary)", letterSpacing: "-.3px" }}>Admin Team</h1>
              <p style={{ margin: "3px 0 0", fontSize: 13, color: "var(--am-text-muted)" }}>
                Provision accounts, assign roles, and manage module permissions.
              </p>
            </div>
            {/* Tabs for Admins vs Roles */}
            <div style={{ display: "flex", gap: 10, background: "var(--am-card)", padding: 4, borderRadius: 10, border: "1px solid var(--am-border)" }}>
              <button 
                onClick={() => setActiveTab("admins")}
                style={{ padding: "8px 16px", background: activeTab === "admins" ? "var(--am-shimmer)" : "transparent", borderRadius: 6, fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", color: activeTab === "admins" ? "var(--am-text-primary)" : "var(--am-text-muted)" }}
              >
                Admins
              </button>
              <button 
                onClick={() => setActiveTab("roles")}
                style={{ padding: "8px 16px", background: activeTab === "roles" ? "var(--am-shimmer)" : "transparent", borderRadius: 6, fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", color: activeTab === "roles" ? "var(--am-text-primary)" : "var(--am-text-muted)" }}
              >
                Roles Config
              </button>
            </div>
            
            {activeTab === "admins" && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button onClick={() => queryClient.invalidateQueries(["admin-management"])} className="am-tbtn">
                <HiOutlineArrowPath size={14} style={isFetching ? { animation: "am-spin .7s linear infinite" } : {}} /> Refresh
              </button>
              <button onClick={openCreate} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", background: "var(--am-text-primary)", border: "none", borderRadius: 7, fontSize: 13, color: "var(--am-page)", cursor: "pointer", fontWeight: 600 }}>
                <HiOutlineUserPlus size={15} /> Add Admin
              </button>
            </div>
            )}
          </div>

          {activeTab === "admins" && (
            <>
          {/* KPI cards */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <KpiCard label="Total Admins"  value={admins.length}  icon={HiOutlineUserGroup}      color="#6d28d9" loading={isLoading} />
            <KpiCard label="Active"        value={activeCount}    icon={HiOutlineCheckCircle}    color="#15803d" loading={isLoading} />
            <KpiCard label="Superadmins"   value={superCount}     icon={HiOutlineShieldCheck}    color="#b45309" loading={isLoading} />
            <KpiCard label="Custom Roles"  value={dynamicRoles.length} icon={HiOutlineShieldExclamation} color="#0369a1" loading={rolesRes?.isLoading} />
          </div>

          {/* Main table card */}
          <div style={{ background: "var(--am-card)", border: "1px solid var(--am-border)", borderRadius: 10, overflow: "hidden", boxShadow: "0 1px 3px var(--am-shadow)" }}>

            {/* Toolbar */}
            <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--am-border)", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
                <HiOutlineUser size={14} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--am-text-muted)", pointerEvents: "none" }} />
                <input ref={searchRef} type="text" placeholder="Search by name or email…"
                  className="am-input" style={{ paddingLeft: 34 }} value={search}
                  onChange={e => setSearch(e.target.value)} />
                {search && <button onClick={() => { setSearch(""); searchRef.current?.focus(); }}
                  style={{ position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--am-text-muted)", padding: 2, display: "flex" }}>
                  <HiOutlineXMark size={14} />
                </button>}
              </div>

              <div style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "var(--am-text-muted)", fontWeight: 500 }}>Role:</span>
                <button 
                    onClick={() => setRoleFilter("all")} className="am-chip"
                    style={{ background: roleFilter === "all" ? "var(--am-text-primary)" : "transparent", color: roleFilter === "all" ? "var(--am-page)" : "var(--am-text-muted)", borderColor: roleFilter === "all" ? "var(--am-text-primary)" : "var(--am-border)" }}>
                    All
                  </button>
                {mappedRoles.map((r, i) => (
                  <button key={r.value || i} onClick={() => setRoleFilter(r.value)} className="am-chip"
                    style={{ background: roleFilter === r.value ? "var(--am-text-primary)" : "transparent", color: roleFilter === r.value ? "var(--am-page)" : "var(--am-text-muted)", borderColor: roleFilter === r.value ? "var(--am-text-primary)" : "var(--am-border)" }}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
                <thead>
                  <tr>
                    {["Admin","Role","Permissions","Status","Last Login",""].map((h, i) => (
                      <th key={i} style={{ padding: "10px 14px", fontSize: 11, fontWeight: 600, textAlign: "left", color: "var(--am-text-muted)", textTransform: "uppercase", letterSpacing: ".07em", background: "var(--am-thead)", borderBottom: "1px solid var(--am-border)", whiteSpace: "nowrap", ...(i === 5 ? { textAlign: "right" } : {}) }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={6}>
                      <div style={{ padding: "52px 0", textAlign: "center" }}>
                        <div style={{ width: 48, height: 48, borderRadius: 12, border: "2px dashed var(--am-border)", background: "var(--am-shimmer)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                          <HiOutlineUserGroup size={20} style={{ color: "var(--am-text-muted)", opacity: .4 }} />
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--am-text-primary)", marginBottom: 4 }}>
                          {search || roleFilter !== "all" ? "No admins match your filters" : "No admins yet"}
                        </div>
                        <div style={{ fontSize: 13, color: "var(--am-text-muted)", marginBottom: (!search && roleFilter === "all") ? 14 : 0 }}>
                          {search || roleFilter !== "all" ? "Try adjusting the search or role filter." : "Create your first admin account."}
                        </div>
                        {!search && roleFilter === "all" && (
                          <button onClick={openCreate} style={{ padding: "7px 18px", background: "var(--am-text-primary)", border: "none", borderRadius: 7, color: "var(--am-page)", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>Add Admin</button>
                        )}
                      </div>
                    </td></tr>
                  ) : filtered.map(admin => (
                    <tr key={admin._id || admin.id} className="am-row" style={{ borderBottom: "1px solid var(--am-row-brd)", transition: "background .1s" }}>
                      {/* Identity */}
                      <td style={{ padding: "14px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <AdminAvatar name={admin.name} role={admin.role} size={38} src={admin.profileImage} />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--am-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }}>{admin.name}</div>
                            <div style={{ fontSize: 11, color: "var(--am-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }}>{admin.email}</div>
                          </div>
                        </div>
                      </td>
                      {/* Role */}
                      <td style={{ padding: "14px 14px" }}><RoleBadge role={admin.role} /></td>
                      {/* Permissions dots */}
                      <td style={{ padding: "14px 14px" }}><PermDots permissions={admin.permissions} /></td>
                      {/* Status */}
                      <td style={{ padding: "14px 14px" }}><StatusBadge active={admin.isActive !== false} /></td>
                      {/* Last login */}
                      <td style={{ padding: "14px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--am-text-muted)" }}>
                          <HiOutlineClock size={13} />
                          {admin.lastLogin ? formatDate(admin.lastLogin) : "Never"}
                        </div>
                      </td>
                      {/* Actions */}
                      <td style={{ padding: "14px 14px", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: 5, justifyContent: "flex-end" }}>
                          {admin.role !== "superadmin" && (
                            <button
                              onClick={() => toggleMut.mutate({ id: admin._id, isActive: !(admin.isActive !== false) })}
                              title={admin.isActive !== false ? "Deactivate" : "Activate"}
                              style={{ padding: "5px 8px", background: admin.isActive !== false ? "#fef2f2" : "#f0fdf4", border: `1px solid ${admin.isActive !== false ? "#fecaca" : "#bbf7d0"}`, borderRadius: 6, color: admin.isActive !== false ? "#b91c1c" : "#15803d", cursor: "pointer", display: "flex", alignItems: "center" }}
                              className="am-tbtn"
                            >
                              {admin.isActive !== false ? <HiOutlineNoSymbol size={13} /> : <HiOutlineCheckCircle size={13} />}
                            </button>
                          )}
                          <button onClick={() => openEdit(admin)} className="am-tbtn" style={{ padding: "5px 10px" }} title="Edit">
                            <HiOutlinePencilSquare size={13} />
                          </button>
                          {admin.role !== "superadmin" && (
                            <button onClick={() => setDelConfirm(admin._id)}
                              style={{ padding: "5px 8px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, color: "#b91c1c", cursor: "pointer", display: "flex", alignItems: "center" }}
                              className="am-tbtn" title="Delete">
                              <HiOutlineTrash size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer count */}
            {!isLoading && filtered.length > 0 && (
              <div style={{ padding: "10px 16px", borderTop: "1px solid var(--am-border)", fontSize: 13, color: "var(--am-text-muted)" }}>
                Showing <b style={{ color: "var(--am-text-primary)" }}>{filtered.length}</b> of <b style={{ color: "var(--am-text-primary)" }}>{admins.length}</b> administrators
              </div>
            )}
          </div>
            </>
          )}

          {activeTab === "roles" && <RoleManagement />}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  CREATE / EDIT SLIDE-OVER                                          */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {showPanel && (
        <>
          <div onClick={closePanel} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", backdropFilter: "blur(2px)", zIndex: 1000, animation: "am-fadeIn .2s ease" }} />
          <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "min(480px, 100vw)", background: "var(--am-panel-bg)", zIndex: 1001, display: "flex", flexDirection: "column", boxShadow: "-6px 0 32px rgba(0,0,0,.18)", animation: "am-slideIn .25s cubic-bezier(.4,0,.2,1)", borderLeft: "1px solid var(--am-border)" }}>

            {/* Panel header */}
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--am-border)", background: "var(--am-panel-hdr)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--am-text-primary)" }}>
                  {editing ? "Edit Administrator" : "Add Administrator"}
                </div>
                <div style={{ fontSize: 12, color: "var(--am-text-muted)", marginTop: 2 }}>
                  {editing ? `Editing ${editing.name}` : "Create a new admin account with custom permissions"}
                </div>
              </div>
              <button onClick={closePanel} style={{ width: 30, height: 30, borderRadius: 6, border: "none", background: "var(--am-shimmer)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--am-text-muted)" }}>
                <HiOutlineXMark size={16} />
              </button>
            </div>

            {/* Form */}
            <div className="am-panel-scroll" style={{ flex: 1, overflowY: "auto" }}>
              <form onSubmit={handleSubmit} id="admin-form">
                <div style={{ padding: "20px 20px 0", display: "flex", flexDirection: "column", gap: 18 }}>

                  {/* ── Identity section ─────────────────────────────────── */}
                  <div style={{ background: "var(--am-shimmer)", border: "1px solid var(--am-border)", borderRadius: 9, padding: "16px 16px" }}>
                    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--am-text-muted)", marginBottom: 14 }}>Identity</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                      {/* Profile Image Upload */}
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <label style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 16 }}>
                          <div style={{ 
                            width: 64, height: 64, borderRadius: 16, background: "var(--am-card)", border: "2px dashed var(--am-border)", 
                            display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative" 
                          }}>
                            {imagePreview ? (
                              <img src={imagePreview} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              <HiOutlineUser size={24} style={{ color: "var(--am-text-muted)" }} />
                            )}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--am-text-primary)", marginBottom: 4 }}>Profile Image</div>
                            <div style={{ fontSize: 11, color: "var(--am-text-muted)" }}>JPG, PNG up to 2MB</div>
                          </div>
                          <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
                        </label>
                      </div>

                      {/* Name */}
                      <div>
                        <FLabel required>Full Name</FLabel>
                        <div style={{ position: "relative" }}>
                          <HiOutlineUser size={15} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--am-text-muted)", pointerEvents: "none" }} />
                          <input ref={nameRef} type="text" required className="am-input" style={{ paddingLeft: 34 }}
                            placeholder="e.g. Sarah Johnson"
                            value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                        </div>
                      </div>

                      {/* Email */}
                      <div>
                        <FLabel required>Email Address</FLabel>
                        <div style={{ position: "relative" }}>
                          <HiOutlineEnvelope size={15} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--am-text-muted)", pointerEvents: "none" }} />
                          <input type="email" required className="am-input" style={{ paddingLeft: 34 }}
                            placeholder="admin@yourplatform.com"
                            value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                        </div>
                      </div>

                      {/* Password */}
                      <div>
                        <FLabel required={!editing}>
                          {editing ? "New Password" : "Password"}
                        </FLabel>
                        <div style={{ position: "relative" }}>
                          <HiOutlineKey size={15} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--am-text-muted)", pointerEvents: "none" }} />
                          <input type={showPwd ? "text" : "password"} required={!editing}
                            className="am-input" style={{ paddingLeft: 34, paddingRight: 40, fontFamily: form.password ? "monospace" : "inherit" }}
                            placeholder={editing ? "Leave blank to keep current" : "Min. 8 characters"}
                            value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
                          <button type="button" onClick={() => setShowPwd(v => !v)}
                            style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--am-text-muted)", padding: 2, display: "flex" }}>
                            {showPwd ? <HiOutlineEyeSlash size={15} /> : <HiOutlineEye size={15} />}
                          </button>
                        </div>
                        {form.password && form.password.length < 8 && (
                          <div style={{ fontSize: 11, color: "#dc2626", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                            <HiOutlineExclamationTriangle size={11} /> At least 8 characters required
                          </div>
                        )}
                        {form.password && form.password.length >= 8 && (
                          <div style={{ fontSize: 11, color: "#15803d", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                            <HiOutlineCheckCircle size={11} /> Password looks good
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ── Role section ──────────────────────────────────────── */}
                  <div style={{ background: "var(--am-shimmer)", border: "1px solid var(--am-border)", borderRadius: 9, padding: "16px 16px" }}>
                    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--am-text-muted)", marginBottom: 14 }}>Role & Clearance</div>
                    
                    <div style={{ marginBottom: 16 }}>
                      <FLabel>Custom Role Name (Optional)</FLabel>
                      <input type="text" className="am-input" placeholder="e.g. FINANCE ANALYST"
                        value={customRole} onChange={e => {
                           setCustomRole(e.target.value.toUpperCase());
                           if(e.target.value) { setForm(p => ({ ...p, role: "" })); }
                        }} />
                      <div style={{ fontSize: 11, color: "var(--am-text-muted)", marginTop: 6 }}>
                        Type a custom title over here, or select one of the existing defined roles below.
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      {mappedRoles.map((r, i) => (
                        <button key={r.value || i} type="button" onClick={() => {
                            setCustomRole("");
                            setForm(p => ({ 
                                ...p, 
                                role: r.value, 
                                permissions: r.permissions || p.permissions 
                            }))
                        }}
                          style={{
                            padding: "12px 14px", borderRadius: 9, textAlign: "left", cursor: "pointer",
                            border: `2px solid ${(!customRole && form.role === r.value) ? r.color : "var(--am-border)"}`,
                            background: (!customRole && form.role === r.value) ? r.bg : "var(--am-card)",
                            transition: "all .15s",
                          }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: (!customRole && form.role === r.value) ? r.color : "var(--am-text-primary)", marginBottom: 2 }}>{r.label}</div>
                          <div style={{ fontSize: 11, color: "var(--am-text-muted)" }}>{r.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ── Permissions section ───────────────────────────────── */}
                  <div style={{ background: "var(--am-shimmer)", border: "1px solid var(--am-border)", borderRadius: 9, padding: "16px 16px", marginBottom: 20 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--am-text-muted)" }}>Module Permissions</div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button type="button" onClick={() => setForm(p => ({ ...p, permissions: Object.fromEntries(PERMISSIONS.map(k => [k.key, true])) }))}
                          style={{ fontSize: 11, fontWeight: 600, color: "#15803d", background: "none", border: "none", cursor: "pointer", padding: 0 }}>Enable all</button>
                        <span style={{ color: "var(--am-border)" }}>·</span>
                        <button type="button" onClick={() => setForm(p => ({ ...p, permissions: Object.fromEntries(PERMISSIONS.map(k => [k.key, false])) }))}
                          style={{ fontSize: 11, fontWeight: 600, color: "#b91c1c", background: "none", border: "none", cursor: "pointer", padding: 0 }}>Disable all</button>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {PERMISSIONS.map(perm => {
                        const on = form.permissions[perm.key];
                        return (
                          <button key={perm.key} type="button" onClick={() => togglePermission(perm.key)}
                            style={{
                              display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 8,
                              border: `1px solid ${on ? "#6d28d9" : "var(--am-border)"}`,
                              background: on ? "#faf5ff" : "var(--am-card)", cursor: "pointer", textAlign: "left",
                              transition: "all .15s",
                            }}>
                            {/* Toggle switch */}
                            <div style={{ width: 36, height: 20, borderRadius: 10, background: on ? "#6d28d9" : "var(--am-border)", position: "relative", flexShrink: 0, transition: "background .15s" }}>
                              <span style={{ position: "absolute", top: 2, left: on ? 18 : 2, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left .15s", boxShadow: "0 1px 3px rgba(0,0,0,.2)" }} />
                            </div>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: on ? "#6d28d9" + "18" : "var(--am-shimmer)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background .15s" }}>
                              <perm.icon size={15} style={{ color: on ? "#6d28d9" : "var(--am-text-muted)", transition: "color .15s" }} />
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: on ? "#6d28d9" : "var(--am-text-primary)", transition: "color .15s" }}>{perm.label}</div>
                              <div style={{ fontSize: 11, color: "var(--am-text-muted)", marginTop: 1 }}>{perm.desc}</div>
                            </div>
                            <div style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: on ? "#f0fdf4" : "#fef2f2", color: on ? "#15803d" : "#b91c1c", border: `1px solid ${on ? "#bbf7d0" : "#fecaca"}`, flexShrink: 0 }}>
                              {on ? "ON" : "OFF"}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Panel footer */}
            <div style={{ padding: "14px 20px", borderTop: "1px solid var(--am-border)", background: "var(--am-panel-hdr)", display: "flex", gap: 10, flexShrink: 0 }}>
              <button form="admin-form" type="submit"
                disabled={createMut.isPending || updateMut.isPending}
                style={{ flex: 1, padding: "10px 0", background: "var(--am-text-primary)", border: "none", borderRadius: 8, color: "var(--am-page)", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, opacity: (createMut.isPending || updateMut.isPending) ? .7 : 1 }}>
                {(createMut.isPending || updateMut.isPending) ? (
                  <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,.4)", borderTopColor: "#fff", animation: "am-spin .7s linear infinite" }} />
                ) : <HiOutlineCheck size={14} />}
                {createMut.isPending || updateMut.isPending ? "Saving…" : editing ? "Save Changes" : "Create Admin"}
              </button>
              <button onClick={closePanel} className="am-tbtn" style={{ padding: "10px 20px" }}>Cancel</button>
            </div>
          </div>
        </>
      )}

      {/* Delete confirm dialog */}
      {delConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 1200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, animation: "am-fadeIn .15s ease" }}>
          <div style={{ background: "var(--am-panel-bg)", borderRadius: 12, width: "100%", maxWidth: 380, overflow: "hidden", boxShadow: "0 12px 48px rgba(0,0,0,.22)", border: "1px solid var(--am-border)", animation: "am-scaleIn .2s ease" }}>
            <div style={{ padding: "22px 24px" }}>
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <HiOutlineShieldExclamation size={22} style={{ color: "#dc2626" }} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--am-text-primary)", marginBottom: 6 }}>Revoke Admin Access</div>
                  <div style={{ fontSize: 13, color: "var(--am-text-muted)", lineHeight: 1.6 }}>
                    This admin's account will be permanently deleted and they will lose all access immediately. This action cannot be undone.
                  </div>
                </div>
              </div>
            </div>
            <div style={{ padding: "10px 24px 20px", display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setDelConfirm(null)} className="am-tbtn">Cancel</button>
              <button onClick={() => deleteMut.mutate(delConfirm)} disabled={deleteMut.isPending}
                style={{ padding: "8px 20px", background: "#dc2626", border: "none", borderRadius: 7, fontSize: 13, color: "#fff", cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: 6, opacity: deleteMut.isPending ? .7 : 1 }}>
                {deleteMut.isPending ? <div style={{ width: 12, height: 12, borderRadius: "50%", border: "2px solid rgba(255,255,255,.4)", borderTopColor: "#fff", animation: "am-spin .7s linear infinite" }} /> : <HiOutlineTrash size={13} />}
                {deleteMut.isPending ? "Revoking…" : "Revoke Access"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminManagement;