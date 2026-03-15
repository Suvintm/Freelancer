// ─── Advertisements.jsx — Production Ad Management ───────────────────────────
// Light/dark theme via CSS variables. Fully responsive. Zero Tailwind + framer-motion.
// Deps: react, react-hot-toast, react-icons/hi2, ../context/AdminContext

import { useState, useEffect, useCallback } from "react";
import { BsToggleOn, BsToggleOff } from "react-icons/bs";
import {
  HiOutlineSpeakerWave,
  HiOutlinePlus,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlinePhoto,
  HiOutlineVideoCamera,
  HiOutlineEye,
  HiOutlineCursorArrowRays,
  HiOutlineGlobeAlt,
  HiOutlineLink,
  HiOutlineArrowPath,
  HiOutlineXMark,
  HiOutlineCheck,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineClock,
  HiOutlineUser,
  HiOutlineBuildingOffice,
  HiOutlineMegaphone,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineHome,
  HiOutlineCloudArrowUp,
  HiOutlineMapPin,
  HiOutlineBell,
  HiOutlineMagnifyingGlass,
  HiOutlineCalendarDays,
  HiOutlineArrowDownTray,
  HiOutlineChartBarSquare,
  HiOutlineSparkles,
  HiOutlineShieldCheck,
  HiOutlineNoSymbol,
  HiMiniCheck,
  HiOutlineBoltSlash,
  HiOutlineFunnel,
} from "react-icons/hi2";
import { toast } from "react-hot-toast";
import { useAdmin } from "../context/AdminContext";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const LOCATIONS = [
  { value: "home_banner",  label: "Home Banner",      icon: "🏠", desc: "Full-width hero carousel" },
  { value: "reels_feed",  label: "Reels Feed",        icon: "🎬", desc: "Between video reels" },
  { value: "explore_page",label: "Explore Page",      icon: "🔍", desc: "Discovery section" },
];

const PRIORITY = {
  low:    { label: "Low",    bg: "#f1f5f9", text: "#475569", dot: "#94a3b8" },
  medium: { label: "Medium", bg: "#eff6ff", text: "#1d4ed8", dot: "#3b82f6" },
  high:   { label: "High",   bg: "#fff7ed", text: "#c2410c", dot: "#f97316" },
  urgent: { label: "Urgent", bg: "#fef2f2", text: "#b91c1c", dot: "#ef4444" },
};

const STEPS = [
  { id: 1, label: "Advertiser", icon: HiOutlineUser },
  { id: 2, label: "Content",    icon: HiOutlineMegaphone },
  { id: 3, label: "Media",      icon: HiOutlinePhoto },
  { id: 4, label: "Links",      icon: HiOutlineLink },
  { id: 5, label: "Display",    icon: HiOutlineEye },
];

const INIT = {
  advertiserName: "", advertiserEmail: "", advertiserPhone: "", companyName: "",
  title: "", tagline: "", description: "", longDescription: "",
  mediaType: "image", mediaUrl: "", thumbnailUrl: "", galleryImages: [],
  websiteUrl: "", instagramUrl: "", facebookUrl: "", youtubeUrl: "", otherUrl: "",
  ctaText: "Learn More", isActive: false, isDefault: false,
  displayLocations: ["home_banner"], badge: "SPONSOR",
  startDate: "", endDate: "", priority: "medium", adminNotes: "",
  approvalStatus: "pending",
};

// ─────────────────────────────────────────────────────────────────────────────
// URL repair (cloudinary mangled dots→underscores)
// ─────────────────────────────────────────────────────────────────────────────
const repairUrl = (url) => {
  if (!url || typeof url !== "string") return url;
  if (!url.includes("cloudinary") && !url.includes("res_")) return url;
  let f = url;
  f = f.replace(/^(https?):?\/*_+/gi, "$1://");
  f = f.replace(/_+res_+cloudinary_+com/g, "res.cloudinary.com").replace(/res_cloudinary_com/g, "res.cloudinary.com");
  if (f.includes("res.cloudinary.com")) {
    f = f.replace(/res\.cloudinary\.com_+/g, "res.cloudinary.com/");
    f = f.replace(/image_upload_+/g, "image/upload/").replace(/video_upload_+/g, "video/upload/");
    f = f.replace(/([/_]?v\d+)_+/g, "$1/");
    f = f.replace(/advertisements_images_+/g, "advertisements/images/").replace(/advertisements_videos_+/g, "advertisements/videos/");
    f = f.replace(/_([a-z0-9\-_]+\.(webp|jpg|jpeg|png|mp4|mov))/gi, "/$1");
    f = f.replace(/([^:])\/\/+/g, "$1/");
  }
  f = f.replace(/_jpg([/_?#]|$)/gi, ".jpg$1").replace(/_png([/_?#]|$)/gi, ".png$1").replace(/_mp4([/_?#]|$)/gi, ".mp4$1").replace(/_webp([/_?#]|$)/gi, ".webp$1");
  return f;
};

// ─────────────────────────────────────────────────────────────────────────────
// Atoms
// ─────────────────────────────────────────────────────────────────────────────
const UserAvatar = ({ src, name, size = 30 }) => {
  const [err, setErr] = useState(false);
  const initials = (name || "??").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const palette  = ["#6d28d9","#1d4ed8","#0369a1","#15803d","#b45309","#c2410c"];
  const bg       = palette[(name || "").charCodeAt(0) % palette.length];
  if (!err && src) return (
    <img src={src} alt={name} onError={() => setErr(true)} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--ad-surface)", flexShrink: 0 }} />
  );
  return <div style={{ width: size, height: size, borderRadius: "50%", background: bg, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.36, fontWeight: 700, flexShrink: 0 }}>{initials}</div>;
};

const AdThumbnail = ({ src, type, size = 80 }) => {
  const [err, setErr] = useState(false);
  const h = Math.round(size * 0.6);
  if (!err && src) return (
    <div style={{ width: size, height: h, borderRadius: 8, overflow: "hidden", flexShrink: 0, position: "relative", background: "var(--ad-shimmer)" }}>
      <img src={repairUrl(src)} alt="" onError={() => setErr(true)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      {type === "video" && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <HiOutlineVideoCamera size={16} style={{ color: "#fff" }} />
        </div>
      )}
    </div>
  );
  return (
    <div style={{ width: size, height: h, borderRadius: 8, background: "var(--ad-shimmer)", border: "1px solid var(--ad-border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <HiOutlinePhoto size={18} style={{ color: "var(--ad-text-muted)", opacity: .4 }} />
    </div>
  );
};

const StatusBadge = ({ ad }) => {
  if (ad.approvalStatus === "approved" && ad.isActive)
    return <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 9px", borderRadius: 999, fontSize: 10, fontWeight: 700, background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0" }}><span style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e", animation: "ad-pulse 2s infinite" }} />LIVE</span>;
  if (ad.approvalStatus === "rejected")
    return <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 9px", borderRadius: 999, fontSize: 10, fontWeight: 700, background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca" }}><HiOutlineXMark size={10} />REJECTED</span>;
  if (ad.approvalStatus === "pending")
    return <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 9px", borderRadius: 999, fontSize: 10, fontWeight: 700, background: "#fffbeb", color: "#b45309", border: "1px solid #fde68a" }}><HiOutlineClock size={10} />PENDING</span>;
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 9px", borderRadius: 999, fontSize: 10, fontWeight: 700, background: "var(--ad-shimmer)", color: "var(--ad-text-muted)", border: "1px solid var(--ad-border)" }}>INACTIVE</span>;
};

const PriorityBadge = ({ value }) => {
  const cfg = PRIORITY[value] || PRIORITY.medium;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 999, fontSize: 10, fontWeight: 700, background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.dot}33` }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.dot }} />{cfg.label}
    </span>
  );
};

const KpiCard = ({ label, value, icon: Icon, color, loading }) => (
  <div style={{ background: "var(--ad-card)", border: "1px solid var(--ad-border)", borderRadius: 10, padding: "16px 18px", flex: 1, minWidth: 140, display: "flex", alignItems: "center", gap: 12, boxShadow: "0 1px 3px var(--ad-shadow)" }}>
    <div style={{ width: 38, height: 38, borderRadius: 9, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <Icon size={17} style={{ color }} />
    </div>
    {loading ? (
      <div>
        <div style={{ height: 22, width: 44, borderRadius: 4, background: "var(--ad-shimmer)", marginBottom: 4, animation: "ad-shimmer 1.4s ease infinite" }} />
        <div style={{ height: 11, width: 66, borderRadius: 4, background: "var(--ad-shimmer)", animation: "ad-shimmer 1.4s ease infinite" }} />
      </div>
    ) : (
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, color: "var(--ad-text-primary)", lineHeight: 1.1 }}>{value ?? 0}</div>
        <div style={{ fontSize: 11, color: "var(--ad-text-muted)", marginTop: 2 }}>{label}</div>
      </div>
    )}
  </div>
);

const GlobalToggle = ({ on, loading, onToggle }) => (
  <div style={{ background: "var(--ad-card)", border: `1px solid ${on ? "#bbf7d0" : "var(--ad-border)"}`, borderRadius: 10, padding: "18px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", boxShadow: "0 1px 3px var(--ad-shadow)", transition: "border-color .2s" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: on ? "#f0fdf4" : "var(--ad-shimmer)", display: "flex", alignItems: "center", justifyContent: "center", transition: "background .2s" }}>
        <HiOutlineSparkles size={18} style={{ color: on ? "#15803d" : "var(--ad-text-muted)" }} />
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ad-text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
          Internal Ads (Level 0)
          {on && <span style={{ fontSize: 10, fontWeight: 800, padding: "1px 7px", borderRadius: 999, background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0" }}>BROADCASTING</span>}
        </div>
        <div style={{ fontSize: 12, color: "var(--ad-text-muted)", marginTop: 2 }}>
          When OFF, the home banner shows only Editor and Service levels.
        </div>
      </div>
    </div>
    <button onClick={onToggle} disabled={loading} style={{
      display: "flex", alignItems: "center", gap: 8, padding: "8px 18px",
      borderRadius: 8, border: "none", cursor: loading ? "default" : "pointer", fontWeight: 700, fontSize: 13,
      background: on ? "#15803d" : "#6b7280", color: "#fff",
      opacity: loading ? .7 : 1, transition: "background .2s",
      minWidth: 80,
    }}>
      {loading ? (
        <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,.4)", borderTopColor: "#fff", animation: "ad-spin 0.7s linear infinite" }} />
      ) : on ? <BsToggleOn size={18} /> : <BsToggleOff size={18} />}
      {on ? "ON" : "OFF"}
    </button>
  </div>
);

// CTR bar
const CtrBar = ({ clicks, views }) => {
  const v = views > 0 ? Math.min(100, Math.round((clicks / views) * 100)) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 4, background: "var(--ad-shimmer)", borderRadius: 999, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${v}%`, background: "#6d28d9", borderRadius: 999, transition: "width .5s" }} />
      </div>
      <span style={{ fontSize: 10, fontWeight: 700, color: "var(--ad-text-muted)", whiteSpace: "nowrap" }}>{v}% CTR</span>
    </div>
  );
};

// Upload dropzone
const Dropzone = ({ onFile, accept, loading, label, sublabel }) => {
  const [drag, setDrag] = useState(false);
  return (
    <label
      onDragOver={e => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={e => { e.preventDefault(); setDrag(false); if (e.dataTransfer.files[0]) onFile({ target: { files: e.dataTransfer.files } }); }}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        height: 140, borderRadius: 10, cursor: loading ? "default" : "pointer",
        border: `2px dashed ${drag ? "var(--ad-accent)" : "var(--ad-border)"}`,
        background: drag ? "var(--ad-sel-bar)" : "var(--ad-page)",
        transition: "all .15s",
      }}
    >
      {loading ? (
        <div style={{ width: 28, height: 28, borderRadius: "50%", border: "3px solid var(--ad-border)", borderTopColor: "var(--ad-accent)", animation: "ad-spin 0.7s linear infinite" }} />
      ) : (
        <>
          <HiOutlineCloudArrowUp size={28} style={{ color: "var(--ad-text-muted)", marginBottom: 8 }} />
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ad-text-primary)" }}>{label}</div>
          <div style={{ fontSize: 11, color: "var(--ad-text-muted)", marginTop: 3 }}>{sublabel}</div>
        </>
      )}
      <input type="file" accept={accept} onChange={onFile} disabled={loading} style={{ display: "none" }} />
    </label>
  );
};

// Form input
const FInput = ({ label, required, ...props }) => (
  <div>
    {label && <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ad-text-muted)", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".06em" }}>{label}{required && <span style={{ color: "#dc2626" }}> *</span>}</label>}
    <input {...props} style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", border: "1px solid var(--ad-input-brd)", borderRadius: 7, fontSize: 13, color: "var(--ad-text-primary)", background: "var(--ad-card)", outline: "none", fontFamily: "inherit", transition: "border .15s", ...props.style }}
      onFocus={e => e.target.style.borderColor = "var(--ad-input-focus)"}
      onBlur={e => e.target.style.borderColor = "var(--ad-input-brd)"} />
  </div>
);
const FTextarea = ({ label, ...props }) => (
  <div>
    {label && <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ad-text-muted)", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".06em" }}>{label}</label>}
    <textarea {...props} style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", border: "1px solid var(--ad-input-brd)", borderRadius: 7, fontSize: 13, color: "var(--ad-text-primary)", background: "var(--ad-card)", outline: "none", fontFamily: "inherit", resize: "vertical", lineHeight: 1.55, transition: "border .15s", ...props.style }}
      onFocus={e => e.target.style.borderColor = "var(--ad-input-focus)"}
      onBlur={e => e.target.style.borderColor = "var(--ad-input-brd)"} />
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
const Advertisements = () => {
  const { adminAxios } = useAdmin();

  const [ads,          setAds]          = useState([]);
  const [analytics,    setAnalytics]    = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [aLoading,     setALoading]     = useState(true);
  const [showSuvixAds, setShowSuvixAds] = useState(true);
  const [toggling,     setToggling]     = useState(false);

  // list state
  const [search,       setSearch]       = useState("");
  const [filter,       setFilter]       = useState("all");
  const [selectedIds,  setSelectedIds]  = useState([]);

  // modal state
  const [showModal,    setShowModal]    = useState(false);
  const [editingAd,    setEditingAd]    = useState(null);
  const [step,         setStep]         = useState(1);
  const [form,         setForm]         = useState(INIT);
  const [uploading,    setUploading]    = useState(false);
  const [uploadingGal, setUploadingGal] = useState(false);

  // delete confirm
  const [delConfirm,   setDelConfirm]   = useState(null);

  // detail panel
  const [detailAd,     setDetailAd]     = useState(null);

  // ── Fetch ───────────────────────────────────────────────────────────
  const loadAll = async () => {
    setLoading(true); setALoading(true);
    try {
      const [adsRes, analyticsRes, settingsRes] = await Promise.allSettled([
        adminAxios.get("/admin/ads"),
        adminAxios.get("/admin/ads/analytics"),
        adminAxios.get("/admin/ads/settings"),
      ]);
      if (adsRes.status === "fulfilled")       setAds(adsRes.value.data.ads || []);
      if (analyticsRes.status === "fulfilled") setAnalytics(analyticsRes.value.data.analytics);
      if (settingsRes.status === "fulfilled")  setShowSuvixAds(settingsRes.value.data.settings?.showSuvixAds ?? true);
    } catch { toast.error("Failed to load ads"); }
    finally { setLoading(false); setALoading(false); }
  };

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    const h = e => { if (e.key === "Escape") { setShowModal(false); setDelConfirm(null); setDetailAd(null); } };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────
  const handleGlobalToggle = async () => {
    setToggling(true);
    try {
      const res = await adminAxios.post("/admin/ads/toggle-suvix-ads", { showSuvixAds: !showSuvixAds });
      setShowSuvixAds(res.data.showSuvixAds);
      toast.success(res.data.message || "Setting updated");
    } catch { toast.error("Failed to update setting"); }
    finally { setToggling(false); }
  };

  const handleApprovalToggle = async (ad) => {
    const newStatus = ad.approvalStatus === "approved" ? "pending" : "approved";
    try {
      await adminAxios.patch(`/admin/ads/${ad._id}`, { approvalStatus: newStatus, isActive: newStatus === "approved" });
      toast.success(newStatus === "approved" ? "Ad approved & activated" : "Ad set to pending");
      loadAll();
    } catch { toast.error("Failed to update approval"); }
  };

  const handleDelete = async (id) => {
    try {
      await adminAxios.delete(`/admin/ads/${id}`);
      toast.success("Ad deleted");
      setDelConfirm(null);
      setDetailAd(null);
      loadAll();
    } catch { toast.error("Delete failed"); }
  };

  const handleBulkApprove = async () => {
    try {
      await Promise.all(selectedIds.map(id => adminAxios.patch(`/admin/ads/${id}`, { approvalStatus: "approved", isActive: true })));
      toast.success(`${selectedIds.length} ads approved`);
      setSelectedIds([]);
      loadAll();
    } catch { toast.error("Bulk approve failed"); }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedIds.length} ads?`)) return;
    try {
      await Promise.all(selectedIds.map(id => adminAxios.delete(`/admin/ads/${id}`)));
      toast.success(`${selectedIds.length} ads deleted`);
      setSelectedIds([]);
      loadAll();
    } catch { toast.error("Bulk delete failed"); }
  };

  const handleMediaUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const isVideo = file.type.startsWith("video/");
    if (file.size > (isVideo ? 200 * 1024 * 1024 : 10 * 1024 * 1024)) { toast.error(isVideo ? "Max 200MB for video" : "Max 10MB for image"); return; }
    setUploading(true);
    const fd = new FormData(); fd.append("media", file);
    try {
      const res = await adminAxios.post("/admin/ads/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      if (res.data.success) {
        setForm(p => ({ ...p, mediaType: res.data.mediaType, mediaUrl: repairUrl(res.data.mediaUrl), thumbnailUrl: repairUrl(res.data.thumbnailUrl || "") }));
        toast.success("Media uploaded");
      }
    } catch (e) { toast.error(e.response?.data?.message || "Upload failed"); }
    finally { setUploading(false); }
  };

  const handleGalleryUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    if (files.length > 5 - form.galleryImages.length) { toast.error(`Max 5 gallery images total`); return; }
    setUploadingGal(true);
    const fd = new FormData(); files.forEach(f => fd.append("images", f));
    try {
      const res = await adminAxios.post("/admin/ads/upload-gallery", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setForm(p => ({ ...p, galleryImages: [...p.galleryImages, ...res.data.galleryImages.map(repairUrl)] }));
      toast.success(`${res.data.galleryImages.length} image(s) uploaded`);
    } catch (e) { toast.error(e.response?.data?.message || "Gallery upload failed"); }
    finally { setUploadingGal(false); }
  };

  const handleSubmit = async () => {
    if (!form.title || !form.mediaUrl || !form.advertiserName) { toast.error("Advertiser, title and media are required"); return; }
    try {
      if (editingAd) await adminAxios.patch(`/admin/ads/${editingAd._id}`, form);
      else           await adminAxios.post("/admin/ads", form);
      toast.success(editingAd ? "Ad updated!" : "Ad created!");
      setShowModal(false); resetForm(); loadAll();
    } catch (e) { toast.error(e.response?.data?.message || "Save failed"); }
  };

  const openCreate = () => { resetForm(); setShowModal(true); };
  const openEdit   = (ad) => {
    setEditingAd(ad);
    setForm({
      advertiserName: ad.advertiserName || "", advertiserEmail: ad.advertiserEmail || "",
      advertiserPhone: ad.advertiserPhone || "", companyName: ad.companyName || "",
      title: ad.title || "", tagline: ad.tagline || "",
      description: ad.description || "", longDescription: ad.longDescription || "",
      mediaType: ad.mediaType || "image", mediaUrl: ad.mediaUrl || "",
      thumbnailUrl: ad.thumbnailUrl || "", galleryImages: ad.galleryImages || [],
      websiteUrl: ad.websiteUrl || "", instagramUrl: ad.instagramUrl || "",
      facebookUrl: ad.facebookUrl || "", youtubeUrl: ad.youtubeUrl || "", otherUrl: ad.otherUrl || "",
      ctaText: ad.ctaText || "Learn More", isActive: ad.isActive || false,
      isDefault: ad.isDefault || false, displayLocations: ad.displayLocations || ["home_banner"],
      badge: ad.badge || "SPONSOR", startDate: ad.startDate?.slice(0, 16) || "",
      endDate: ad.endDate?.slice(0, 16) || "", priority: ad.priority || "medium",
      adminNotes: ad.adminNotes || "", approvalStatus: ad.approvalStatus || "pending",
    });
    setStep(1); setShowModal(true);
  };
  const resetForm = () => { setForm(INIT); setEditingAd(null); setStep(1); };

  // ── Derived ──────────────────────────────────────────────────────────
  const filtered = ads.filter(ad => {
    const matchFilter =
      filter === "all"      ? true :
      filter === "live"     ? (ad.approvalStatus === "approved" && ad.isActive) :
      filter === "pending"  ? ad.approvalStatus === "pending" :
      filter === "inactive" ? !ad.isActive :
      filter === "default"  ? ad.isDefault : true;
    const matchSearch = !search || [ad.title, ad.advertiserName, ad.companyName].some(v => v?.toLowerCase().includes(search.toLowerCase()));
    return matchFilter && matchSearch;
  });
  const allSel = filtered.length > 0 && selectedIds.length === filtered.length;
  const someSel = selectedIds.length > 0 && !allSel;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        :root {
          --ad-page:         #f8f9fa;
          --ad-card:         #ffffff;
          --ad-surface:      #ffffff;
          --ad-border:       #e5e7eb;
          --ad-row-brd:      #f3f4f6;
          --ad-shadow:       rgba(0,0,0,.06);
          --ad-shimmer:      #f1f3f4;
          --ad-text-primary: #111827;
          --ad-text-muted:   #6b7280;
          --ad-accent:       #111827;
          --ad-hover:        #f9fafb;
          --ad-input-brd:    #d1d5db;
          --ad-input-focus:  #111827;
          --ad-btn-bg:       #ffffff;
          --ad-btn-brd:      #d1d5db;
          --ad-btn-text:     #374151;
          --ad-panel-bg:     #ffffff;
          --ad-panel-hdr:    #f8f9fa;
          --ad-sel-bar:      #eff6ff;
          --ad-sel-brd:      #93c5fd;
          --ad-sel-text:     #1d4ed8;
        }
        @media (prefers-color-scheme: dark) {
          :root {
            --ad-page: #0a0a0a; --ad-card: #111111; --ad-surface: #111111;
            --ad-border: #1f1f1f; --ad-row-brd: #191919;
            --ad-shadow: rgba(0,0,0,.3); --ad-shimmer: #1a1a1a;
            --ad-text-primary: #f3f4f6; --ad-text-muted: #6b7280; --ad-accent: #f3f4f6;
            --ad-hover: #161616;
            --ad-input-brd: #2a2a2a; --ad-input-focus: #f3f4f6;
            --ad-btn-bg: #161616; --ad-btn-brd: #2a2a2a; --ad-btn-text: #d1d5db;
            --ad-panel-bg: #111111; --ad-panel-hdr: #161616;
            --ad-sel-bar: #1e3a5f; --ad-sel-brd: #1e40af; --ad-sel-text: #93c5fd;
          }
        }
        .dark {
          --ad-page: #0a0a0a; --ad-card: #111111; --ad-surface: #111111;
          --ad-border: #1f1f1f; --ad-row-brd: #191919;
          --ad-shadow: rgba(0,0,0,.3); --ad-shimmer: #1a1a1a;
          --ad-text-primary: #f3f4f6; --ad-text-muted: #6b7280; --ad-accent: #f3f4f6;
          --ad-hover: #161616;
          --ad-input-brd: #2a2a2a; --ad-input-focus: #f3f4f6;
          --ad-btn-bg: #161616; --ad-btn-brd: #2a2a2a; --ad-btn-text: #d1d5db;
          --ad-panel-bg: #111111; --ad-panel-hdr: #161616;
          --ad-sel-bar: #1e3a5f; --ad-sel-brd: #1e40af; --ad-sel-text: #93c5fd;
        }

        @keyframes ad-shimmer { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes ad-pulse   { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.8)} }
        @keyframes ad-spin    { to{transform:rotate(360deg)} }
        @keyframes ad-fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes ad-fadeUp  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
        @keyframes ad-slideIn { from{transform:translateX(100%);opacity:0} to{transform:translateX(0);opacity:1} }
        @keyframes ad-scaleIn { from{opacity:0;transform:scale(.95)} to{opacity:1;transform:scale(1)} }

        .ad-row:hover { background: var(--ad-hover) !important; }
        .ad-row.sel   { background: var(--ad-sel-bar) !important; }
        .ad-act { opacity:0; transition:opacity .15s; }
        .ad-row:hover .ad-act { opacity:1; }
        .ad-tbtn { background:var(--ad-btn-bg); border:1px solid var(--ad-btn-brd); color:var(--ad-btn-text); cursor:pointer; border-radius:7px; font-size:13px; display:flex; align-items:center; gap:6px; padding:7px 14px; font-weight:500; transition:opacity .15s; }
        .ad-tbtn:hover { opacity:.8; }
        .ad-chip { padding:4px 11px; border-radius:999px; font-size:11px; font-weight:600; cursor:pointer; border:1px solid; transition:all .15s; }
        .ad-scroll::-webkit-scrollbar { width:4px; }
        .ad-scroll::-webkit-scrollbar-thumb { background:var(--ad-border); border-radius:2px; }
        .ad-grid { display:grid; gap:12px; }
        @media (max-width:480px) { .ad-two { grid-template-columns:1fr !important; } }
      `}</style>

      <div style={{ background: "var(--ad-page)", minHeight: "100vh", fontFamily: "system-ui,-apple-system,sans-serif" }}>
        <div style={{ maxWidth: 1300, margin: "0 auto", padding: "20px 16px", display: "flex", flexDirection: "column", gap: 18 }}>

          {/* Breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--ad-text-muted)" }}>
            <HiOutlineHome size={14} /><span style={{ color: "var(--ad-border)" }}>/</span>
            <span>Admin</span><span style={{ color: "var(--ad-border)" }}>/</span>
            <span style={{ color: "var(--ad-text-primary)", fontWeight: 600 }}>Advertisements</span>
          </div>

          {/* Page header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "var(--ad-text-primary)", letterSpacing: "-.3px" }}>Advertisements</h1>
              <p style={{ margin: "3px 0 0", fontSize: 13, color: "var(--ad-text-muted)" }}>
                Manage commercial ads across home banner, reels feed, and explore page.
              </p>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button onClick={loadAll} className="ad-tbtn"><HiOutlineArrowPath size={14} style={loading ? { animation: "ad-spin .7s linear infinite" } : {}} />Refresh</button>
              <button onClick={openCreate} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", background: "var(--ad-text-primary)", border: "none", borderRadius: 7, fontSize: 13, color: "var(--ad-page)", cursor: "pointer", fontWeight: 600 }}>
                <HiOutlinePlus size={14} /> New Ad
              </button>
            </div>
          </div>

          {/* Global toggle */}
          <GlobalToggle on={showSuvixAds} loading={toggling} onToggle={handleGlobalToggle} />

          {/* KPI cards */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <KpiCard label="Total Ads"     value={analytics?.totalAds   ?? ads.length}     icon={HiOutlineSpeakerWave}     color="#6d28d9" loading={aLoading} />
            <KpiCard label="Live"          value={analytics?.activeAds  ?? ads.filter(a => a.isActive && a.approvalStatus === "approved").length} icon={HiOutlineCheckCircle} color="#15803d" loading={aLoading} />
            <KpiCard label="Pending"       value={analytics?.pendingAds ?? ads.filter(a => a.approvalStatus === "pending").length} icon={HiOutlineClock} color="#b45309" loading={aLoading} />
            <KpiCard label="Total Views"   value={(analytics?.totalViews ?? 0).toLocaleString()} icon={HiOutlineEye}  color="#0369a1" loading={aLoading} />
            <KpiCard label="Total Clicks"  value={(analytics?.totalClicks ?? 0).toLocaleString()} icon={HiOutlineCursorArrowRays} color="#1d4ed8" loading={aLoading} />
          </div>

          {/* Main card */}
          <div style={{ background: "var(--ad-card)", border: "1px solid var(--ad-border)", borderRadius: 10, overflow: "hidden", boxShadow: "0 1px 3px var(--ad-shadow)" }}>

            {/* Toolbar */}
            <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--ad-border)", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
                <HiOutlineMagnifyingGlass size={15} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--ad-text-muted)", pointerEvents: "none" }} />
                <input type="text" placeholder="Search by title, advertiser or company…"
                  value={search} onChange={e => setSearch(e.target.value)}
                  style={{ width: "100%", boxSizing: "border-box", padding: "8px 12px 8px 36px", border: "1px solid var(--ad-input-brd)", borderRadius: 7, fontSize: 13, color: "var(--ad-text-primary)", background: "var(--ad-card)", outline: "none" }}
                  onFocus={e => e.target.style.borderColor = "var(--ad-input-focus)"}
                  onBlur={e => e.target.style.borderColor = "var(--ad-input-brd)"} />
                {search && <button onClick={() => { setSearch(""); }} style={{ position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--ad-text-muted)", padding: 2, display: "flex" }}><HiOutlineXMark size={14} /></button>}
              </div>

              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {[["all","All"],["live","Live"],["pending","Pending"],["inactive","Inactive"],["default","⭐ Default"]].map(([v, l]) => (
                  <button key={v} onClick={() => setFilter(v)} className="ad-chip"
                    style={{ background: filter === v ? "var(--ad-text-primary)" : "transparent", color: filter === v ? "var(--ad-page)" : "var(--ad-text-muted)", borderColor: filter === v ? "var(--ad-text-primary)" : "var(--ad-border)" }}>
                    {l}{v === "all" ? ` (${ads.length})` : ""}
                  </button>
                ))}
              </div>
            </div>

            {/* Bulk bar */}
            {selectedIds.length > 0 && (
              <div style={{ padding: "9px 16px", background: "var(--ad-sel-bar)", borderBottom: `1px solid var(--ad-sel-brd)`, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", animation: "ad-fadeIn .2s ease" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 20, height: 20, borderRadius: 4, background: "#1d4ed8", display: "flex", alignItems: "center", justifyContent: "center" }}><HiMiniCheck size={12} style={{ color: "#fff" }} /></div>
                  <span style={{ fontSize: 13, color: "var(--ad-sel-text)", fontWeight: 600 }}>{selectedIds.length} selected</span>
                </div>
                <button onClick={handleBulkApprove} style={{ padding: "4px 12px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 6, fontSize: 12, fontWeight: 600, color: "#15803d", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}><HiOutlineCheck size={12} /> Approve All</button>
                <button onClick={handleBulkDelete} style={{ padding: "4px 12px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, fontSize: 12, fontWeight: 600, color: "#b91c1c", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}><HiOutlineTrash size={12} /> Delete All</button>
                <button onClick={() => setSelectedIds([])} style={{ marginLeft: "auto", background: "none", border: "none", fontSize: 12, color: "var(--ad-text-muted)", cursor: "pointer" }}>Clear</button>
              </div>
            )}

            {/* Select-all row */}
            {filtered.length > 0 && (
              <div style={{ padding: "8px 16px", borderBottom: "1px solid var(--ad-row-brd)", display: "flex", alignItems: "center", gap: 10, background: "var(--ad-panel-hdr)" }}>
                <input type="checkbox" checked={allSel} ref={el => { if (el) el.indeterminate = someSel; }}
                  onChange={e => setSelectedIds(e.target.checked ? filtered.map(a => a._id) : [])}
                  style={{ width: 15, height: 15, accentColor: "#1d4ed8", cursor: "pointer" }} />
                <span style={{ fontSize: 12, color: "var(--ad-text-muted)" }}>
                  {allSel ? "Deselect all" : `Select all ${filtered.length}`}
                </span>
              </div>
            )}

            {/* Ad list */}
            {loading ? (
              <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} style={{ height: 88, borderRadius: 9, background: "var(--ad-shimmer)", animation: "ad-shimmer 1.4s ease infinite" }} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: "56px 0", textAlign: "center" }}>
                <div style={{ width: 52, height: 52, borderRadius: 12, border: "2px dashed var(--ad-border)", background: "var(--ad-shimmer)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                  <HiOutlineSpeakerWave size={22} style={{ color: "var(--ad-text-muted)", opacity: .4 }} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ad-text-primary)", marginBottom: 5 }}>
                  {search || filter !== "all" ? "No ads match your filters" : "No advertisements yet"}
                </div>
                <div style={{ fontSize: 13, color: "var(--ad-text-muted)", marginBottom: filter === "all" && !search ? 14 : 0 }}>
                  {search || filter !== "all" ? "Try adjusting the search or status filter." : "Create your first ad campaign."}
                </div>
                {filter === "all" && !search && (
                  <button onClick={openCreate} style={{ padding: "7px 18px", background: "var(--ad-text-primary)", border: "none", borderRadius: 7, color: "var(--ad-page)", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>Create Ad</button>
                )}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {filtered.map((ad, _idx) => {
                  const isSel = selectedIds.includes(ad._id);
                  return (
                    <div key={ad._id} className={`ad-row${isSel ? " sel" : ""}`}
                      style={{ padding: "14px 16px", borderBottom: "1px solid var(--ad-row-brd)", display: "flex", alignItems: "center", gap: 14, transition: "background .1s", cursor: "default" }}>
                      
                      {/* Checkbox */}
                      <input type="checkbox" checked={isSel}
                        onChange={e => setSelectedIds(p => e.target.checked ? [...p, ad._id] : p.filter(x => x !== ad._id))}
                        style={{ width: 15, height: 15, accentColor: "#1d4ed8", cursor: "pointer", flexShrink: 0 }} />

                      {/* Thumbnail */}
                      <AdThumbnail src={ad.thumbnailUrl || ad.mediaUrl} type={ad.mediaType} size={88} />

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap", marginBottom: 4 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--ad-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 260 }}>{ad.title}</span>
                          <StatusBadge ad={ad} />
                          {ad.isDefault && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 999, background: "#fffbeb", color: "#b45309", border: "1px solid #fde68a" }}>DEFAULT</span>}
                          <PriorityBadge value={ad.priority} />
                        </div>
                        <div style={{ fontSize: 12, color: "var(--ad-text-muted)", marginBottom: 6 }}>
                          {ad.companyName || ad.advertiserName}
                          {ad.displayLocations?.length > 0 && <span> · {ad.displayLocations.map(l => LOCATIONS.find(x => x.value === l)?.icon || "📍").join(" ")}</span>}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--ad-text-muted)" }}>
                            <HiOutlineEye size={12} /> {(ad.views || 0).toLocaleString()}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--ad-text-muted)" }}>
                            <HiOutlineCursorArrowRays size={12} /> {(ad.clicks || 0).toLocaleString()}
                          </div>
                          {ad.views > 0 && (
                            <div style={{ minWidth: 100 }}>
                              <CtrBar views={ad.views} clicks={ad.clicks} />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="ad-act" style={{ display: "flex", gap: 5, alignItems: "center", flexShrink: 0 }}>
                        <button onClick={() => setDetailAd(ad)} style={{ padding: "6px 12px", background: "var(--ad-card)", border: "1px solid var(--ad-border)", borderRadius: 7, fontSize: 12, fontWeight: 600, color: "var(--ad-text-primary)", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }} className="ad-tbtn">
                          <HiOutlineEye size={13} />
                        </button>
                        <button onClick={() => handleApprovalToggle(ad)} title={ad.approvalStatus === "approved" ? "Revoke" : "Approve"}
                          style={{ padding: "6px 10px", background: ad.approvalStatus === "approved" ? "#fffbeb" : "#f0fdf4", border: `1px solid ${ad.approvalStatus === "approved" ? "#fde68a" : "#bbf7d0"}`, borderRadius: 7, fontSize: 12, cursor: "pointer", color: ad.approvalStatus === "approved" ? "#b45309" : "#15803d" }} className="ad-tbtn">
                          {ad.approvalStatus === "approved" ? <HiOutlineClock size={13} /> : <HiOutlineCheck size={13} />}
                        </button>
                        <button onClick={() => openEdit(ad)} className="ad-tbtn" style={{ padding: "6px 10px" }} title="Edit"><HiOutlinePencilSquare size={13} /></button>
                        <button onClick={() => setDelConfirm(ad._id)} style={{ padding: "6px 10px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 7, color: "#b91c1c", cursor: "pointer" }} className="ad-tbtn" title="Delete"><HiOutlineTrash size={13} /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/*  AD DETAIL SLIDE-OVER                                           */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {detailAd && (
        <>
          <div onClick={() => setDetailAd(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", backdropFilter: "blur(2px)", zIndex: 1000, animation: "ad-fadeIn .2s ease" }} />
          <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "min(480px, 100vw)", background: "var(--ad-panel-bg)", zIndex: 1001, display: "flex", flexDirection: "column", boxShadow: "-6px 0 32px rgba(0,0,0,.18)", animation: "ad-slideIn .25s cubic-bezier(.4,0,.2,1)", borderLeft: "1px solid var(--ad-border)" }}>
            {/* Header */}
            <div style={{ padding: "15px 20px", borderBottom: "1px solid var(--ad-border)", background: "var(--ad-panel-hdr)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ad-text-primary)" }}>Ad Details</div>
                <div style={{ fontSize: 12, color: "var(--ad-text-muted)", marginTop: 1 }}>{detailAd.companyName || detailAd.advertiserName}</div>
              </div>
              <button onClick={() => setDetailAd(null)} style={{ width: 30, height: 30, borderRadius: 6, border: "none", background: "var(--ad-shimmer)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ad-text-muted)" }}><HiOutlineXMark size={16} /></button>
            </div>

            {/* Body */}
            <div className="ad-scroll" style={{ flex: 1, overflowY: "auto" }}>
              <div style={{ animation: "ad-fadeUp .25s ease" }}>
                {/* Media */}
                {detailAd.mediaUrl && (
                  <div style={{ borderBottom: "1px solid var(--ad-border)" }}>
                    {detailAd.mediaType === "video"
                      ? <video src={repairUrl(detailAd.mediaUrl)} controls style={{ width: "100%", maxHeight: 220, background: "#000", display: "block" }} />
                      : <img src={repairUrl(detailAd.thumbnailUrl || detailAd.mediaUrl)} style={{ width: "100%", maxHeight: 220, objectFit: "cover", display: "block" }} alt="" />}
                  </div>
                )}

                {/* Status + badges */}
                <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--ad-border)", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <StatusBadge ad={detailAd} />
                  <PriorityBadge value={detailAd.priority} />
                  {detailAd.isDefault && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 999, background: "#fffbeb", color: "#b45309", border: "1px solid #fde68a" }}>DEFAULT FALLBACK</span>}
                  {detailAd.badge && <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 9px", borderRadius: 999, background: "var(--ad-shimmer)", color: "var(--ad-text-muted)", border: "1px solid var(--ad-border)", letterSpacing: ".06em" }}>{detailAd.badge}</span>}
                </div>

                {/* Title + desc */}
                <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--ad-border)" }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "var(--ad-text-primary)", marginBottom: 4, letterSpacing: "-.2px" }}>{detailAd.title}</div>
                  {detailAd.tagline && <div style={{ fontSize: 13, color: "#6d28d9", fontWeight: 600, marginBottom: 8 }}>{detailAd.tagline}</div>}
                  {detailAd.description && <div style={{ fontSize: 13, color: "var(--ad-text-muted)", lineHeight: 1.6 }}>{detailAd.description}</div>}
                </div>

                {/* Performance */}
                <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--ad-border)" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--ad-text-muted)", marginBottom: 12 }}>Performance</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                    {[
                      { label: "Views",   value: (detailAd.views  || 0).toLocaleString(), icon: HiOutlineEye,            color: "#0369a1" },
                      { label: "Clicks",  value: (detailAd.clicks || 0).toLocaleString(), icon: HiOutlineCursorArrowRays, color: "#6d28d9" },
                      { label: "CTR",     value: detailAd.views > 0 ? `${Math.round((detailAd.clicks / detailAd.views) * 100)}%` : "0%", icon: HiOutlineChartBarSquare, color: "#15803d" },
                    ].map((s, i) => (
                      <div key={i} style={{ background: "var(--ad-shimmer)", border: "1px solid var(--ad-border)", borderRadius: 8, padding: "10px 8px", textAlign: "center" }}>
                        <s.icon size={15} style={{ color: s.color, display: "block", margin: "0 auto 4px" }} />
                        <div style={{ fontSize: 15, fontWeight: 800, color: "var(--ad-text-primary)" }}>{s.value}</div>
                        <div style={{ fontSize: 10, color: "var(--ad-text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em" }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Advertiser */}
                <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--ad-border)" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--ad-text-muted)", marginBottom: 10 }}>Advertiser</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 12, background: "var(--ad-shimmer)", border: "1px solid var(--ad-border)", borderRadius: 8 }}>
                    <UserAvatar name={detailAd.advertiserName} size={36} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ad-text-primary)" }}>{detailAd.advertiserName}</div>
                      {detailAd.companyName && <div style={{ fontSize: 12, color: "var(--ad-text-muted)" }}>{detailAd.companyName}</div>}
                      {detailAd.advertiserEmail && <div style={{ fontSize: 11, color: "var(--ad-text-muted)" }}>{detailAd.advertiserEmail}</div>}
                    </div>
                  </div>
                </div>

                {/* Display locations */}
                <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--ad-border)" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--ad-text-muted)", marginBottom: 10 }}>Display Locations</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {(detailAd.displayLocations || []).map(loc => {
                      const l = LOCATIONS.find(x => x.value === loc);
                      return l ? (
                        <div key={loc} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 7, background: "var(--ad-shimmer)", border: "1px solid var(--ad-border)", fontSize: 12, fontWeight: 600, color: "var(--ad-text-primary)" }}>
                          <span>{l.icon}</span> {l.label}
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>

                {/* Links */}
                {(detailAd.websiteUrl || detailAd.instagramUrl || detailAd.facebookUrl) && (
                  <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--ad-border)" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--ad-text-muted)", marginBottom: 10 }}>Links</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {[["🌐","Website",detailAd.websiteUrl],["📸","Instagram",detailAd.instagramUrl],["📘","Facebook",detailAd.facebookUrl],["▶️","YouTube",detailAd.youtubeUrl]].map(([icon, label, url]) => url ? (
                        <a key={label} href={url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 11px", borderRadius: 7, background: "var(--ad-shimmer)", border: "1px solid var(--ad-border)", fontSize: 11, fontWeight: 600, color: "var(--ad-text-primary)", textDecoration: "none" }}>
                          {icon} {label}
                        </a>
                      ) : null)}
                    </div>
                  </div>
                )}

                {/* Gallery */}
                {detailAd.galleryImages?.length > 0 && (
                  <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--ad-border)" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--ad-text-muted)", marginBottom: 10 }}>Gallery ({detailAd.galleryImages.length})</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: 6 }}>
                      {detailAd.galleryImages.map((url, i) => (
                        <div key={i} style={{ aspectRatio: "1", borderRadius: 7, overflow: "hidden", border: "1px solid var(--ad-border)" }}>
                          <img src={repairUrl(url)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Schedule + metadata */}
                <div style={{ padding: "14px 20px 20px" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--ad-text-muted)", marginBottom: 10 }}>Schedule & Details</div>
                  {[
                    { label: "Start Date",  value: detailAd.startDate ? new Date(detailAd.startDate).toLocaleString("en-IN") : "No start date" },
                    { label: "End Date",    value: detailAd.endDate   ? new Date(detailAd.endDate).toLocaleString("en-IN")   : "No end date"   },
                    { label: "CTA Text",    value: detailAd.ctaText || "Learn More" },
                    { label: "Ad ID",       value: detailAd._id,   mono: true },
                  ].map((r, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--ad-row-brd)" }}>
                      <span style={{ fontSize: 13, color: "var(--ad-text-muted)" }}>{r.label}</span>
                      <span style={{ fontSize: r.mono ? 11 : 13, fontWeight: 600, color: "var(--ad-text-primary)", fontFamily: r.mono ? "monospace" : "inherit", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: "12px 20px", borderTop: "1px solid var(--ad-border)", background: "var(--ad-panel-hdr)", display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap" }}>
              <button onClick={() => { openEdit(detailAd); setDetailAd(null); }} style={{ flex: 1, padding: "8px 0", background: "var(--ad-text-primary)", border: "none", borderRadius: 7, color: "var(--ad-page)", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <HiOutlinePencilSquare size={14} /> Edit Ad
              </button>
              <button onClick={() => setDelConfirm(detailAd._id)} style={{ padding: "8px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 7, color: "#b91c1c", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }} className="ad-tbtn">
                <HiOutlineTrash size={13} />
              </button>
              <button onClick={() => setDetailAd(null)} className="ad-tbtn" style={{ padding: "8px 16px" }}>Close</button>
            </div>
          </div>
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/*  CREATE/EDIT WIZARD MODAL                                       */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", backdropFilter: "blur(2px)", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, animation: "ad-fadeIn .15s ease" }}>
          <div style={{ background: "var(--ad-panel-bg)", borderRadius: 14, width: "100%", maxWidth: 680, maxHeight: "92vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,.28)", border: "1px solid var(--ad-border)", animation: "ad-scaleIn .2s ease" }}>

            {/* Modal header */}
            <div style={{ padding: "16px 22px", borderBottom: "1px solid var(--ad-border)", background: "var(--ad-panel-hdr)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ad-text-primary)" }}>{editingAd ? "Edit Advertisement" : "Create Advertisement"}</div>
                <div style={{ fontSize: 12, color: "var(--ad-text-muted)", marginTop: 2 }}>Step {step} of {STEPS.length} — {STEPS[step - 1]?.label}</div>
              </div>
              <button onClick={() => setShowModal(false)} style={{ width: 30, height: 30, borderRadius: 6, border: "none", background: "var(--ad-shimmer)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ad-text-muted)" }}><HiOutlineXMark size={16} /></button>
            </div>

            {/* Step progress */}
            <div style={{ padding: "14px 22px 0", display: "flex", alignItems: "center", gap: 0, flexShrink: 0 }}>
              {STEPS.map((s, idx) => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                  <button onClick={() => setStep(s.id)} style={{
                    width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                    border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 800,
                    background: step === s.id ? "var(--ad-text-primary)" : step > s.id ? "#15803d" : "var(--ad-shimmer)",
                    color: step >= s.id ? "var(--ad-page)" : "var(--ad-text-muted)",
                    boxShadow: step === s.id ? "0 0 0 3px var(--ad-sel-bar)" : "none",
                    transition: "all .15s",
                  }}>
                    {step > s.id ? <HiMiniCheck size={12} /> : s.id}
                  </button>
                  {idx < STEPS.length - 1 && (
                    <div style={{ flex: 1, height: 2, margin: "0 4px", borderRadius: 1, background: step > s.id ? "#15803d" : "var(--ad-border)", transition: "background .2s" }} />
                  )}
                </div>
              ))}
            </div>

            {/* Step labels (desktop only) */}
            <div style={{ padding: "6px 22px 12px", display: "flex" }}>
              {STEPS.map(s => (
                <div key={s.id} style={{ flex: 1, textAlign: "center", fontSize: 9.5, fontWeight: 600, color: step === s.id ? "var(--ad-text-primary)" : "var(--ad-text-muted)", textTransform: "uppercase", letterSpacing: ".07em", transition: "color .15s" }}>{s.label}</div>
              ))}
            </div>

            {/* Step content */}
            <div className="ad-scroll" style={{ flex: 1, overflowY: "auto", padding: "0 22px 16px" }}>
              <div style={{ animation: "ad-fadeUp .2s ease" }}>

                {/* Step 1: Advertiser */}
                {step === 1 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }} className="ad-two">
                      <FInput label="Advertiser Name" required placeholder="e.g. John Smith" value={form.advertiserName} onChange={e => setForm(p => ({ ...p, advertiserName: e.target.value }))} />
                      <FInput label="Company Name"    placeholder="e.g. Nike India"    value={form.companyName}    onChange={e => setForm(p => ({ ...p, companyName: e.target.value }))} />
                      <FInput label="Email"           type="email" placeholder="contact@company.com" value={form.advertiserEmail} onChange={e => setForm(p => ({ ...p, advertiserEmail: e.target.value }))} />
                      <FInput label="Phone"           placeholder="+91 98765 43210"    value={form.advertiserPhone} onChange={e => setForm(p => ({ ...p, advertiserPhone: e.target.value }))} />
                    </div>
                    <FTextarea label="Admin Notes (internal)" rows={2} placeholder="Internal notes about this campaign…" value={form.adminNotes} onChange={e => setForm(p => ({ ...p, adminNotes: e.target.value }))} />
                  </div>
                )}

                {/* Step 2: Content */}
                {step === 2 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <FInput label="Ad Title" required placeholder="e.g. Summer Sale — 50% Off" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
                    <FInput label="Tagline"  placeholder="Short hook line"               value={form.tagline} onChange={e => setForm(p => ({ ...p, tagline: e.target.value }))} />
                    <FTextarea label="Short Description" rows={2} placeholder="Brief banner description (max 300 chars)…" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                    <div style={{ fontSize: 11, color: "var(--ad-text-muted)", marginTop: -8, textAlign: "right" }}>{form.description.length}/300</div>
                    <FTextarea label="Full Description (ad detail page)" rows={4} placeholder="Rich content shown on the ad detail page…" value={form.longDescription} onChange={e => setForm(p => ({ ...p, longDescription: e.target.value }))} />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }} className="ad-two">
                      <FInput label="CTA Button Text" placeholder="Learn More" value={form.ctaText} onChange={e => setForm(p => ({ ...p, ctaText: e.target.value }))} />
                      <FInput label="Badge Text"      placeholder="SPONSOR"    value={form.badge}    onChange={e => setForm(p => ({ ...p, badge: e.target.value }))} />
                    </div>
                  </div>
                )}

                {/* Step 3: Media */}
                {step === 3 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ad-text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: ".06em" }}>Primary Media <span style={{ color: "#dc2626" }}>*</span></div>
                      {form.mediaUrl ? (
                        <div style={{ position: "relative", borderRadius: 10, overflow: "hidden" }}>
                          {form.mediaType === "video"
                            ? <video src={repairUrl(form.mediaUrl)} controls style={{ width: "100%", maxHeight: 200, background: "#000", display: "block" }} />
                            : <img src={repairUrl(form.mediaUrl)} style={{ width: "100%", maxHeight: 200, objectFit: "cover", display: "block" }} alt="" />}
                          <button onClick={() => setForm(p => ({ ...p, mediaUrl: "", thumbnailUrl: "" }))} style={{ position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: "50%", background: "#dc2626", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                            <HiOutlineXMark size={14} />
                          </button>
                        </div>
                      ) : (
                        <Dropzone onFile={handleMediaUpload} accept="image/*,video/*" loading={uploading} label="Click or drag to upload" sublabel="Max: 10 MB image · 200 MB video" />
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ad-text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: ".06em" }}>Gallery Images ({form.galleryImages.length}/5)</div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
                        {form.galleryImages.map((url, i) => (
                          <div key={i} style={{ aspectRatio: "1", borderRadius: 7, overflow: "hidden", position: "relative", border: "1px solid var(--ad-border)" }}>
                            <img src={repairUrl(url)} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                            <button onClick={() => setForm(p => ({ ...p, galleryImages: p.galleryImages.filter((_, j) => j !== i) }))}
                              style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer", opacity: 0 }}
                              onMouseEnter={e => e.currentTarget.style.opacity = 1}
                              onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                              <HiOutlineXMark size={14} style={{ color: "#fff" }} />
                            </button>
                          </div>
                        ))}
                        {form.galleryImages.length < 5 && (
                          <label style={{ aspectRatio: "1", borderRadius: 7, border: "2px dashed var(--ad-border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                            {uploadingGal ? <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid var(--ad-border)", borderTopColor: "var(--ad-accent)", animation: "ad-spin .7s linear infinite" }} /> : <HiOutlinePlus size={16} style={{ color: "var(--ad-text-muted)" }} />}
                            <input type="file" accept="image/*" multiple onChange={handleGalleryUpload} disabled={uploadingGal} style={{ display: "none" }} />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Links */}
                {step === 4 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {[
                      { key: "websiteUrl",   label: "Website URL",   icon: "🌐", placeholder: "https://yourwebsite.com" },
                      { key: "instagramUrl", label: "Instagram",     icon: "📸", placeholder: "https://instagram.com/..." },
                      { key: "facebookUrl",  label: "Facebook",      icon: "📘", placeholder: "https://facebook.com/..." },
                      { key: "youtubeUrl",   label: "YouTube",       icon: "▶️", placeholder: "https://youtube.com/..." },
                      { key: "otherUrl",     label: "Other Link",    icon: "🔗", placeholder: "https://..." },
                    ].map(f => (
                      <div key={f.key}>
                        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "var(--ad-text-muted)", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".06em" }}>
                          <span>{f.icon}</span> {f.label}
                        </label>
                        <input type="url" placeholder={f.placeholder} value={form[f.key]}
                          onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                          style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", border: "1px solid var(--ad-input-brd)", borderRadius: 7, fontSize: 13, color: "var(--ad-text-primary)", background: "var(--ad-card)", outline: "none", fontFamily: "inherit" }}
                          onFocus={e => e.target.style.borderColor = "var(--ad-input-focus)"}
                          onBlur={e => e.target.style.borderColor = "var(--ad-input-brd)"} />
                      </div>
                    ))}
                  </div>
                )}

                {/* Step 5: Display */}
                {step === 5 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {/* Locations */}
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ad-text-muted)", marginBottom: 10, textTransform: "uppercase", letterSpacing: ".06em" }}>Display Locations</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {LOCATIONS.map((loc) => {
                          const checked = form.displayLocations.includes(loc.value);
                          return (
                            <label key={loc.value} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 9, cursor: "pointer", border: `2px solid ${checked ? "var(--ad-text-primary)" : "var(--ad-border)"}`, background: checked ? "var(--ad-sel-bar)" : "var(--ad-page)", transition: "all .15s" }}>
                              <input type="checkbox" checked={checked} onChange={e => setForm(p => ({ ...p, displayLocations: e.target.checked ? [...p.displayLocations, loc.value] : p.displayLocations.filter(l => l !== loc.value) }))} style={{ width: 15, height: 15, accentColor: "#1d4ed8", cursor: "pointer" }} />
                              <span style={{ fontSize: 18 }}>{loc.icon}</span>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ad-text-primary)" }}>{loc.label}</div>
                                <div style={{ fontSize: 11, color: "var(--ad-text-muted)" }}>{loc.desc}</div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* Priority + Approval */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }} className="ad-two">
                      <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ad-text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>Priority</label>
                        <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
                          style={{ width: "100%", padding: "9px 12px", border: "1px solid var(--ad-input-brd)", borderRadius: 7, fontSize: 13, color: "var(--ad-text-primary)", background: "var(--ad-card)", outline: "none", cursor: "pointer" }}>
                          {Object.entries(PRIORITY).map(([v, cfg]) => <option key={v} value={v}>{cfg.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ad-text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>Approval Status</label>
                        <select value={form.approvalStatus} onChange={e => setForm(p => ({ ...p, approvalStatus: e.target.value, isActive: e.target.value === "approved" }))}
                          style={{ width: "100%", padding: "9px 12px", border: "1px solid var(--ad-input-brd)", borderRadius: 7, fontSize: 13, color: "var(--ad-text-primary)", background: "var(--ad-card)", outline: "none", cursor: "pointer" }}>
                          <option value="pending">Pending Review</option>
                          <option value="approved">Approved — Goes Live</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
                    </div>

                    {/* Schedule */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }} className="ad-two">
                      <FInput label="Start Date" type="datetime-local" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} />
                      <FInput label="End Date"   type="datetime-local" value={form.endDate}   onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} />
                    </div>

                    {/* Default toggle */}
                    <div onClick={() => setForm(p => ({ ...p, isDefault: !p.isDefault }))}
                      style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px", borderRadius: 9, cursor: "pointer", border: `2px solid ${form.isDefault ? "#f59e0b" : "var(--ad-border)"}`, background: form.isDefault ? "#fffbeb" : "var(--ad-page)", transition: "all .15s" }}>
                      <div style={{ width: 38, height: 22, borderRadius: 11, background: form.isDefault ? "#f59e0b" : "var(--ad-shimmer)", position: "relative", flexShrink: 0, marginTop: 1, transition: "background .15s" }}>
                        <span style={{ position: "absolute", top: 2, left: form.isDefault ? 18 : 2, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left .15s", boxShadow: "0 1px 3px rgba(0,0,0,.2)" }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ad-text-primary)" }}>Default Fallback Banner</div>
                        <div style={{ fontSize: 12, color: "var(--ad-text-muted)", marginTop: 2 }}>Shown when no live ads are active for this location.</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal footer */}
            <div style={{ padding: "14px 22px", borderTop: "1px solid var(--ad-border)", background: "var(--ad-panel-hdr)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
              <button onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "none", border: "none", fontSize: 13, color: "var(--ad-text-muted)", cursor: step === 1 ? "default" : "pointer", opacity: step === 1 ? .3 : 1 }}>
                <HiOutlineChevronLeft size={14} /> Previous
              </button>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setShowModal(false)} className="ad-tbtn">Cancel</button>
                {step < STEPS.length ? (
                  <button onClick={() => setStep(s => Math.min(STEPS.length, s + 1))} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 20px", background: "var(--ad-text-primary)", border: "none", borderRadius: 7, fontSize: 13, color: "var(--ad-page)", cursor: "pointer", fontWeight: 600 }}>
                    Next <HiOutlineChevronRight size={14} />
                  </button>
                ) : (
                  <button onClick={handleSubmit} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 20px", background: "#15803d", border: "none", borderRadius: 7, fontSize: 13, color: "#fff", cursor: "pointer", fontWeight: 700 }}>
                    <HiOutlineCheck size={14} /> {editingAd ? "Save Changes" : "Create Ad"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm dialog */}
      {delConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 1200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, animation: "ad-fadeIn .15s ease" }}>
          <div style={{ background: "var(--ad-panel-bg)", borderRadius: 12, width: "100%", maxWidth: 360, overflow: "hidden", boxShadow: "0 12px 48px rgba(0,0,0,.22)", border: "1px solid var(--ad-border)", animation: "ad-scaleIn .2s ease" }}>
            <div style={{ padding: "20px 22px" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <HiOutlineTrash size={20} style={{ color: "#dc2626" }} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ad-text-primary)", marginBottom: 6 }}>Delete Advertisement</div>
                  <div style={{ fontSize: 13, color: "var(--ad-text-muted)", lineHeight: 1.6 }}>This ad will be permanently removed. This action cannot be undone.</div>
                </div>
              </div>
            </div>
            <div style={{ padding: "10px 22px 18px", display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setDelConfirm(null)} className="ad-tbtn">Cancel</button>
              <button onClick={() => handleDelete(delConfirm)} style={{ padding: "8px 20px", background: "#dc2626", border: "none", borderRadius: 7, fontSize: 13, color: "#fff", cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                <HiOutlineTrash size={13} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Advertisements;