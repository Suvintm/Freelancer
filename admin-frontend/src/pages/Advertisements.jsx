/**
 * AdManagerPage.jsx
 * Production admin panel — dark black theme, white/green accents only.
 * Ad Requests is a top-level page tab, not buried in the form editor.
 *
 * ENV: VITE_BACKEND_URL=http://localhost:5052/api  (already includes /api)
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Cropper from "react-easy-crop";
import {
  HiOutlinePlus, HiOutlineTrash, HiOutlinePencil, HiOutlineEye,
  HiOutlineEyeSlash, HiOutlineCheck, HiOutlineXMark, HiOutlinePhoto,
  HiOutlineVideoCamera, HiOutlineArrowPath, HiOutlineCloudArrowUp,
  HiOutlineAdjustmentsHorizontal, HiOutlineRectangleGroup,
  HiOutlineSparkles, HiOutlineCalendarDays, HiOutlineUser, HiArrowRight,
  HiSpeakerXMark, HiOutlineCursorArrowRipple,
  HiOutlineSquare3Stack3D, HiOutlineClipboardDocumentList,
  HiOutlineChartBarSquare,
} from "react-icons/hi2";
import { FaAd, FaInstagram, FaGlobe, FaChevronRight } from "react-icons/fa";
import axios from "axios";
import TemplateSelector from "./TemplateSelector";
import AdRequestsTab from "./AdRequestsTab";
import AdPreviewTab from "./AdPreviewTab";

// ─── Constants ────────────────────────────────────────────────────────────────
const BANNER_ASPECT = 375 / 192;

// ─── Default form ─────────────────────────────────────────────────────────────
const defaultForm = () => ({
  advertiserName: "", advertiserEmail: "", advertiserPhone: "", companyName: "",
  title: "", tagline: "", description: "", longDescription: "",
  mediaType: "image", mediaUrl: "", thumbnailUrl: "",
  websiteUrl: "", instagramUrl: "", facebookUrl: "", youtubeUrl: "", otherUrl: "",
  ctaText: "Learn More", badge: "SPONSOR",
  isActive: true, isDefault: false,
  displayLocations: ["banners:home_0"],
  approvalStatus: "approved", priority: "medium", adminNotes: "",
  startDate: "", endDate: "",
  cropData: { x: 0, y: 0, width: 100, height: 100, zoom: 1 },
  layoutConfig: {
    textPosition: "bl", overlayDirection: "to-top", overlayOpacity: 75,
    overlayColor: "#040408", titleSize: "md", titleWeight: "black",
    titleColor: "#ffffff", descColor: "rgba(212,212,216,0.75)",
    showBadge: true, showSponsorTag: true, showDescription: true,
    showProgressBar: true, showDetailsBtn: true, showMuteBtn: true,
    slideDuration: 5000, badgeText: "", badgeColor: "rgba(255,255,255,0.12)",
  },
  buttonStyle: {
    variant: "filled", bgColor: "#ffffff", textColor: "#000000",
    borderColor: "#ffffff", radius: "md", icon: "chevron", iconPosition: "right",
  },
});

// ─── URL repair ───────────────────────────────────────────────────────────────
const repairUrl = (url) => {
  if (!url || typeof url !== "string") return url;
  if (!url.includes("cloudinary") && !url.includes("res_") && !url.includes("_com")) return url;
  let fixed = url;
  fixed = fixed.replace(/^(https?):?\/*_+/gi, "$1://");
  fixed = fixed.replace(/_+res_+cloudinary_+com/g, "res.cloudinary.com").replace(/res_cloudinary_com/g, "res.cloudinary.com").replace(/cloudinary_com/g, "cloudinary.com");
  if (fixed.includes("res.cloudinary.com")) {
    fixed = fixed.replace(/res\.cloudinary\.com_+/g, "res.cloudinary.com/");
    fixed = fixed.replace(/image_upload_+/g, "image/upload/").replace(/video_upload_+/g, "video/upload/");
    fixed = fixed.replace(/([/_]?v\d+)_+/g, "$1/");
    fixed = fixed.replace(/advertisements_images_+/g, "advertisements/images/").replace(/advertisements_videos_+/g, "advertisements/videos/");
    fixed = fixed.replace(/([^:])\/\/+/g, "$1/");
  }
  fixed = fixed.replace(/_jpg([/_?#]|$)/gi, ".jpg$1").replace(/_png([/_?#]|$)/gi, ".png$1").replace(/_mp4([/_?#]|$)/gi, ".mp4$1");
  return fixed;
};

// ─── Shared styles ────────────────────────────────────────────────────────────
const labelStyle   = { fontSize: 11, fontWeight: 600, color: "#71717a", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 5 };
const inputStyle   = { width: "100%", background: "#0a0a0a", border: "1px solid #222", borderRadius: 8, padding: "8px 10px", color: "#f4f4f5", fontSize: 13, outline: "none", boxSizing: "border-box" };
const actionBtn    = { display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, background: "#fff", color: "#000", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700 };
const dangerBtn    = { display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, background: "transparent", color: "#ef4444", border: "1px solid #3f0f0f", cursor: "pointer", fontSize: 13, fontWeight: 600 };
const secondaryBtn = { display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, background: "#111", color: "#a1a1aa", border: "1px solid #222", cursor: "pointer", fontSize: 13, fontWeight: 600 };
const fieldGroup   = { marginBottom: 14 };
const toggleBtn    = (active) => ({ padding: "5px 12px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer", border: active ? "1px solid rgba(255,255,255,0.3)" : "1px solid #222", background: active ? "#fff" : "#111", color: active ? "#000" : "#52525b" });

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 20 }}>
    <div style={{ fontSize: 10, fontWeight: 700, color: "#3f3f46", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10, paddingBottom: 6, borderBottom: "1px solid #111" }}>{title}</div>
    {children}
  </div>
);

const ColorInput = ({ label, value, onChange }) => (
  <div style={fieldGroup}>
    <label style={labelStyle}>{label}</label>
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <input type="color" value={value?.startsWith("rgba") ? "#ffffff" : (value || "#ffffff")} onChange={e => onChange(e.target.value)} style={{ width: 36, height: 36, borderRadius: 8, border: "1px solid #222", background: "none", cursor: "pointer", padding: 2 }} />
      <input value={value || ""} onChange={e => onChange(e.target.value)} style={{ ...inputStyle, flex: 1 }} placeholder="rgba(...) or #hex" />
    </div>
  </div>
);

const ToggleRow = ({ label, value, onChange, hint }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid #111" }}>
    <div>
      <div style={{ fontSize: 13, color: "#d4d4d8", fontWeight: 500 }}>{label}</div>
      {hint && <div style={{ fontSize: 10, color: "#3f3f46", marginTop: 1 }}>{hint}</div>}
    </div>
    <button onClick={() => onChange(!value)} style={{ width: 40, height: 22, borderRadius: 11, border: "none", cursor: "pointer", position: "relative", background: value ? "#22c55e" : "#222", transition: "background 0.2s", flexShrink: 0 }}>
      <span style={{ position: "absolute", top: 3, left: value ? 21 : 3, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
    </button>
  </div>
);

// ─── Live Banner Preview ──────────────────────────────────────────────────────
const LiveBannerPreview = ({ form, localMediaUrl }) => {
  const lc = form.layoutConfig;
  const bs = form.buttonStyle;
  const cd = form.cropData;

  const overlayGradient = useMemo(() => {
    const rgba = (hex, opacity) => {
      try {
        const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r},${g},${b},${(opacity / 100).toFixed(2)})`;
      } catch { return `rgba(4,4,8,${(opacity/100).toFixed(2)})`; }
    };
    const color = lc.overlayColor || "#040408";
    const op = lc.overlayOpacity ?? 75;
    const dirs = {
      "to-top":    `linear-gradient(to top, ${rgba(color, op)} 0%, ${rgba(color, Math.round(op * 0.4))} 42%, transparent 75%)`,
      "to-bottom": `linear-gradient(to bottom, ${rgba(color, op)} 0%, transparent 75%)`,
      "to-left":   `linear-gradient(to left, ${rgba(color, op)} 0%, transparent 75%)`,
      "to-right":  `linear-gradient(to right, ${rgba(color, op)} 0%, transparent 75%)`,
      "radial":    `radial-gradient(ellipse at center, transparent 30%, ${rgba(color, op)} 100%)`,
      "none":      "none",
    };
    return dirs[lc.overlayDirection] || dirs["to-top"];
  }, [lc.overlayDirection, lc.overlayOpacity, lc.overlayColor]);

  const posMap = useMemo(() => ({
    tl: { alignItems: "flex-start", justifyContent: "flex-start" },
    tc: { alignItems: "center",     justifyContent: "flex-start" },
    tr: { alignItems: "flex-end",   justifyContent: "flex-start" },
    ml: { alignItems: "flex-start", justifyContent: "center" },
    mc: { alignItems: "center",     justifyContent: "center" },
    mr: { alignItems: "flex-end",   justifyContent: "center" },
    bl: { alignItems: "flex-start", justifyContent: "flex-end" },
    bc: { alignItems: "center",     justifyContent: "flex-end" },
    br: { alignItems: "flex-end",   justifyContent: "flex-end" },
  }), []);
  const textPos = posMap[lc.textPosition] || posMap["bl"];

  const titleFontSize   = { sm: "13px", md: "16px", lg: "20px", xl: "24px" }[lc.titleSize] || "16px";
  const titleFontWeight = { bold: 700, black: 900, extrabold: 800 }[lc.titleWeight] || 900;
  const btnRadius       = { sm: "6px", md: "8px", lg: "12px", full: "999px" }[bs.radius] || "8px";

  const btnStyle = useMemo(() => {
    const base = { borderRadius: btnRadius, display: "flex", alignItems: "center", gap: "6px", padding: "6px 14px", fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", cursor: "pointer", border: "none" };
    if (bs.variant === "filled")  return { ...base, background: bs.bgColor, color: bs.textColor };
    if (bs.variant === "outline") return { ...base, background: "transparent", color: bs.borderColor, border: `1.5px solid ${bs.borderColor}` };
    if (bs.variant === "ghost")   return { ...base, background: "rgba(255,255,255,0.1)", color: "#fff" };
    return base;
  }, [bs, btnRadius]);

  const mediaUrl = localMediaUrl || repairUrl(form.mediaUrl);

  const cropStyle = useMemo(() => {
    if (!cd || (cd.x === 0 && cd.y === 0 && cd.width === 100 && cd.height === 100))
      return { width: "100%", height: "100%", objectFit: "cover" };
    const scale = Math.max(100 / cd.width, 100 / cd.height);
    return { position: "absolute", width: `${scale * 100}%`, height: `${scale * 100}%`, objectFit: "cover", transform: `translate(${-(cd.x / 100) * 100 * scale}%, ${-(cd.y / 100) * 100 * scale}%)`, top: 0, left: 0 };
  }, [cd]);

  const btnIcon = useMemo(() => {
    const icons = { arrow: <HiArrowRight style={{ fontSize: "10px" }} />, globe: <FaGlobe style={{ fontSize: "9px" }} />, instagram: <FaInstagram style={{ fontSize: "9px" }} />, chevron: <FaChevronRight style={{ fontSize: "8px" }} />, none: null };
    return icons[bs.icon] || icons.chevron;
  }, [bs.icon]);

  return (
    <div style={{ width: "100%", maxWidth: 375, margin: "0 auto" }}>
      <div style={{ fontSize: "10px", color: "#3f3f46", marginBottom: "8px", textAlign: "center", letterSpacing: "0.05em", textTransform: "uppercase", fontWeight: 600 }}>Live Preview · 375×192px</div>
      <div style={{ position: "relative", width: "100%", height: 192, borderRadius: "1rem", overflow: "hidden", background: "#111", border: "1px solid #1c1c1c" }}>
        {mediaUrl ? (
          <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
            {form.mediaType === "video"
              ? <video src={mediaUrl} autoPlay loop muted playsInline style={{ ...cropStyle, objectFit: "cover" }} />
              : <img src={mediaUrl} alt="preview" style={{ ...cropStyle, objectFit: "cover" }} />
            }
          </div>
        ) : (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8 }}>
            <HiOutlinePhoto style={{ fontSize: 28, color: "#222" }} />
            <span style={{ fontSize: 11, color: "#3f3f46" }}>Upload media to preview</span>
          </div>
        )}
        <div style={{ position: "absolute", inset: 0, background: overlayGradient, pointerEvents: "none" }} />
        {lc.showProgressBar && (
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: "rgba(255,255,255,0.06)", zIndex: 50 }}>
            <div style={{ width: "40%", height: "100%", background: "rgba(255,255,255,0.5)" }} />
          </div>
        )}
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", padding: "14px 14px 12px", zIndex: 20, pointerEvents: "none", justifyContent: textPos.justifyContent, alignItems: textPos.alignItems }}>
          {lc.showBadge && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 7px", borderRadius: 5, background: lc.badgeColor || "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.08)", fontSize: "7px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.14em", color: "#fff" }}>
                <FaAd style={{ color: "#fbbf24", fontSize: 8 }} />
                {(lc.badgeText || form.badge || "SPONSOR").toUpperCase()}
              </span>
              {lc.showSponsorTag && <span style={{ padding: "2px 5px", borderRadius: 4, background: "rgba(245,158,11,0.8)", fontSize: "6px", fontWeight: 900, textTransform: "uppercase", color: "#fff" }}>SPONSOR</span>}
            </div>
          )}
          <h2 style={{ fontSize: titleFontSize, fontWeight: titleFontWeight, color: lc.titleColor || "#fff", lineHeight: 1.2, letterSpacing: "-0.02em", margin: "0 0 3px", maxWidth: "80%", textAlign: textPos.alignItems === "flex-end" ? "right" : textPos.alignItems === "center" ? "center" : "left" }}>
            {form.title || "Your Ad Title"}
          </h2>
          {lc.showDescription && (
            <p style={{ fontSize: "9px", color: lc.descColor || "rgba(212,212,216,0.75)", fontWeight: 500, lineHeight: 1.5, margin: "0 0 8px", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", maxWidth: "72%" }}>
              {form.description || form.tagline || "Your description"}
            </p>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 5, pointerEvents: "auto" }}>
            <button style={btnStyle}>
              {bs.iconPosition === "left" && btnIcon}
              {form.ctaText || "Learn More"}
              {bs.iconPosition === "right" && btnIcon}
            </button>
            {lc.showDetailsBtn && (
              <button style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: btnRadius, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.08)", color: "#fff", fontSize: "8px", fontWeight: 700, cursor: "pointer" }}>
                Details <HiArrowRight style={{ fontSize: 9 }} />
              </button>
            )}
            {lc.showMuteBtn && form.mediaType === "video" && (
              <button style={{ width: 24, height: 24, borderRadius: btnRadius, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.08)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <HiSpeakerXMark style={{ fontSize: 12 }} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Crop Panel ───────────────────────────────────────────────────────────────
const CropPanel = ({ localMediaUrl, form, onChange }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState(null);
  const onCropComplete = useCallback((_, area) => setCroppedArea(area), []);

  if (!localMediaUrl) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 160, gap: 8, color: "#3f3f46" }}>
      <HiOutlinePhoto style={{ fontSize: 28 }} />
      <span style={{ fontSize: 12 }}>Upload media first to crop</span>
    </div>
  );

  return (
    <div>
      <div style={{ position: "relative", width: "100%", height: 200, background: "#000", borderRadius: 10, overflow: "hidden", marginBottom: 12 }}>
        <Cropper image={localMediaUrl} crop={crop} zoom={zoom} aspect={BANNER_ASPECT} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} />
      </div>
      <label style={labelStyle}>Zoom</label>
      <input type="range" min={1} max={3} step={0.01} value={zoom} onChange={e => setZoom(parseFloat(e.target.value))} style={{ width: "100%", marginBottom: 12, accentColor: "#22c55e" }} />
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => croppedArea && onChange("cropData", { x: crop.x, y: crop.y, width: 100, height: 100, zoom })} style={{ ...actionBtn, flex: 1 }}><HiOutlineCheck /> Apply</button>
        <button onClick={() => { setCrop({ x: 0, y: 0 }); setZoom(1); onChange("cropData", { x: 0, y: 0, width: 100, height: 100, zoom: 1 }); }} style={{ ...secondaryBtn, flex: 1 }}><HiOutlineArrowPath /> Reset</button>
      </div>
    </div>
  );
};

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ ad }) => {
  const now = new Date();
  const start = ad.startDate ? new Date(ad.startDate) : null;
  const end = ad.endDate ? new Date(ad.endDate) : null;

  const isApproved = ad.approvalStatus === "approved";
  const isRejected = ad.approvalStatus === "rejected";
  const isPending  = ad.approvalStatus === "pending";

  const hasStarted = !start || isNaN(start.getTime()) || start <= now;
  const notEnded   = !end || isNaN(end.getTime()) || end >= now;
  const isLive     = ad.isActive && isApproved && hasStarted && notEnded;

  if (isLive) {
    return <span style={{ padding: "2px 8px", borderRadius: 5, fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", background: "rgba(34,197,94,0.12)", color: "#22c55e" }}>LIVE</span>;
  }

  if (!ad.isActive) {
    return <span style={{ padding: "2px 8px", borderRadius: 5, fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", background: "rgba(113,113,122,0.1)", color: "#52525b" }}>INACTIVE</span>;
  }

  if (isRejected) {
    return <span style={{ padding: "2px 8px", borderRadius: 5, fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>REJECTED</span>;
  }

  if (isPending) {
    return <span style={{ padding: "2px 8px", borderRadius: 5, fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", background: "rgba(245,158,11,0.1)", color: "#f59e0b" }}>PENDING</span>;
  }

  // If approved and active but not live
  if (isApproved) {
    if (!hasStarted) {
      return <span style={{ padding: "2px 8px", borderRadius: 5, fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", background: "rgba(96,165,250,0.1)", color: "#60a5fa" }}>SCHEDULED</span>;
    }
    if (!notEnded) {
      return <span style={{ padding: "2px 8px", borderRadius: 5, fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>EXPIRED</span>;
    }
  }

  return <span style={{ padding: "2px 8px", borderRadius: 5, fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", background: "rgba(245,158,11,0.1)", color: "#f59e0b" }}>PENDING</span>;
};

// ─── Main Component ───────────────────────────────────────────────────────────
const AdManagerPage = ({ adminURL, token }) => {
  const [ads, setAds]               = useState([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [editingId, setEditingId]   = useState(null);
  const [showForm, setShowForm]     = useState(false);
  const [pageTab, setPageTab]       = useState("ads");      // top-level: "ads" | "requests"
  const [activeTab, setActiveTab]   = useState("templates"); // form editor tabs
  const [form, setForm]             = useState(defaultForm());
  const [localMediaFile, setLocalMediaFile] = useState(null);
  const [localMediaUrl, setLocalMediaUrl]   = useState("");
  const [galleryFiles, setGalleryFiles]     = useState([]);
  const [toast, setToast]                   = useState(null);
  const [analyticsData, setAnalyticsData]   = useState(null);
  const fileInputRef = useRef(null);

  const API           = adminURL || import.meta.env.VITE_BACKEND_URL || "http://localhost:5052/api";
  const resolvedToken = token || localStorage.getItem("adminToken");
  const authHeader    = { Authorization: `Bearer ${resolvedToken}` };

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchAds = useCallback(async () => {
    try { setLoading(true); const { data } = await axios.get(`${API}/admin/ads`, { headers: authHeader }); setAds(data.ads || []); }
    catch { showToast("Failed to load ads", "error"); }
    finally { setLoading(false); }
  }, [API, resolvedToken]);

  const fetchAnalytics = useCallback(async () => {
    try { const { data } = await axios.get(`${API}/admin/ads/analytics`, { headers: authHeader }); setAnalyticsData(data.analytics); }
    catch {}
  }, [API, resolvedToken]);

  useEffect(() => { fetchAds(); fetchAnalytics(); }, []);

  // ── Toast ──────────────────────────────────────────────────────────────────
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  // ── Form helpers ───────────────────────────────────────────────────────────
  const setField  = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setLayout = (k, v) => setForm(f => ({ ...f, layoutConfig: { ...f.layoutConfig, [k]: v } }));
  const setButton = (k, v) => setForm(f => ({ ...f, buttonStyle:  { ...f.buttonStyle,  [k]: v } }));

  const openCreate = () => {
    setForm(defaultForm()); setLocalMediaFile(null); setLocalMediaUrl(""); setGalleryFiles([]);
    setEditingId(null); setActiveTab("templates"); setShowForm(true);
  };

  const openEdit = (ad) => {
    setForm({
      advertiserName: ad.advertiserName || "", advertiserEmail: ad.advertiserEmail || "",
      advertiserPhone: ad.advertiserPhone || "", companyName: ad.companyName || "",
      title: ad.title || "", tagline: ad.tagline || "", description: ad.description || "",
      longDescription: ad.longDescription || "", mediaType: ad.mediaType || "image",
      mediaUrl: ad.mediaUrl || "", thumbnailUrl: ad.thumbnailUrl || "",
      websiteUrl: ad.websiteUrl || "", instagramUrl: ad.instagramUrl || "",
      facebookUrl: ad.facebookUrl || "", youtubeUrl: ad.youtubeUrl || "", otherUrl: ad.otherUrl || "",
      ctaText: ad.ctaText || "Learn More", badge: ad.badge || "SPONSOR",
      isActive: ad.isActive ?? true, isDefault: ad.isDefault || false,
      displayLocations: ad.displayLocations || ["home_banner"],
      approvalStatus: ad.approvalStatus || "approved", priority: ad.priority || "medium",
      adminNotes: ad.adminNotes || "",
      startDate: ad.startDate ? ad.startDate.slice(0, 16) : "",
      endDate: ad.endDate ? ad.endDate.slice(0, 16) : "",
      cropData: ad.cropData || defaultForm().cropData,
      layoutConfig: { ...defaultForm().layoutConfig, ...(ad.layoutConfig || {}) },
      buttonStyle:  { ...defaultForm().buttonStyle,  ...(ad.buttonStyle  || {}) },
    });
    setLocalMediaFile(null); setLocalMediaUrl(""); setGalleryFiles([]);
    setEditingId(ad._id); setActiveTab("templates"); setShowForm(true);
  };

  const handleFilePick = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setLocalMediaFile(file); setLocalMediaUrl(URL.createObjectURL(file));
    setField("mediaType", file.type.startsWith("video/") ? "video" : "image"); e.target.value = "";
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.title || !form.advertiserName) { showToast("Advertiser name and title are required", "error"); return; }
    if (!localMediaFile && !form.mediaUrl) { showToast("Please select a media file", "error"); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      if (localMediaFile) fd.append("media", localMediaFile);
      if (galleryFiles.length) galleryFiles.forEach(f => fd.append("gallery", f));
      ["advertiserName","advertiserEmail","advertiserPhone","companyName","title","tagline","description","longDescription","mediaUrl","thumbnailUrl","websiteUrl","instagramUrl","facebookUrl","youtubeUrl","otherUrl","ctaText","badge","approvalStatus","priority","adminNotes","startDate","endDate"]
        .forEach(k => { if (form[k] !== undefined && form[k] !== "") fd.append(k, form[k]); });
      fd.append("isActive", form.isActive); fd.append("isDefault", form.isDefault);
      fd.append("displayLocations", JSON.stringify(form.displayLocations));
      fd.append("cropData", JSON.stringify(form.cropData));
      fd.append("layoutConfig", JSON.stringify(form.layoutConfig));
      fd.append("buttonStyle", JSON.stringify(form.buttonStyle));
      const url = editingId ? `${API}/admin/ads/${editingId}` : `${API}/admin/ads`;
      await axios[editingId ? "patch" : "post"](url, fd, { headers: { ...authHeader, "Content-Type": "multipart/form-data" } });
      showToast(editingId ? "Ad updated!" : "Ad published!");
      setShowForm(false); fetchAds(); fetchAnalytics();
    } catch (e) { showToast(e.response?.data?.message || "Failed to save ad", "error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this ad permanently?")) return;
    try { await axios.delete(`${API}/admin/ads/${id}`, { headers: authHeader }); showToast("Ad deleted"); fetchAds(); fetchAnalytics(); }
    catch { showToast("Failed to delete", "error"); }
  };

  const handleToggleActive = async (ad) => {
    try { await axios.patch(`${API}/admin/ads/${ad._id}`, { isActive: !ad.isActive }, { headers: authHeader }); fetchAds(); }
    catch { showToast("Failed to toggle", "error"); }
  };

  const handleApprove = async (id) => {
    try { await axios.patch(`${API}/admin/ads/${id}`, { approvalStatus: "approved", isActive: true }, { headers: authHeader }); showToast("Ad approved and live!"); fetchAds(); fetchAnalytics(); }
    catch { showToast("Failed to approve", "error"); }
  };

  const applyTemplate = (template) => {
    if (!template) { setForm(f => ({ ...f, layoutConfig: defaultForm().layoutConfig, buttonStyle: defaultForm().buttonStyle })); return; }
    setForm(f => ({ ...f, layoutConfig: { ...defaultForm().layoutConfig, ...template.layoutConfig }, buttonStyle: { ...defaultForm().buttonStyle, ...template.buttonStyle } }));
  };

  // Form editor tabs (no requests here)
  const formTabs = [
    { id: "templates",  label: "Templates",  icon: HiOutlineSparkles },
    { id: "media",      label: "Media",      icon: HiOutlinePhoto },
    { id: "layout",     label: "Layout",     icon: HiOutlineAdjustmentsHorizontal },
    { id: "button",     label: "Button",     icon: HiOutlineCursorArrowRipple },
    { id: "components", label: "Components", icon: HiOutlineSquare3Stack3D },
    { id: "schedule",   label: "Schedule",   icon: HiOutlineCalendarDays },
    { id: "advertiser", label: "Advertiser", icon: HiOutlineUser },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#000", color: "#f4f4f5", fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, padding: "12px 18px", borderRadius: 10,
              background: toast.type === "error" ? "#0f0404" : "#040f04",
              border: `1px solid ${toast.type === "error" ? "#3f0f0f" : "#14532d"}`,
              color: toast.type === "error" ? "#f87171" : "#86efac",
              fontSize: 13, fontWeight: 600, boxShadow: "0 8px 32px rgba(0,0,0,0.6)" }}>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HEADER ── */}
      <div style={{ padding: "16px 24px", borderBottom: "1px solid #111", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "#fff" }}>Ad Manager</h1>
          <p style={{ fontSize: 11, color: "#3f3f46", margin: "2px 0 0" }}>Manage banner advertisements and incoming ad requests</p>
        </div>

        {/* Top-level tabs */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", border: "1px solid #222" }}>
            {[
              { id: "ads",      label: "Manage Ads",  icon: HiOutlineChartBarSquare },
              { id: "requests", label: "Ad Requests",  icon: HiOutlineClipboardDocumentList },
              { id: "preview",  label: "Preview Model", icon: HiOutlineEye },
            ].map(t => (
              <button key={t.id} onClick={() => { setPageTab(t.id); setShowForm(false); }}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", border: "none", whiteSpace: "nowrap",
                  background: pageTab === t.id ? "#fff" : "#0a0a0a",
                  color: pageTab === t.id ? "#000" : "#52525b",
                }}>
                <t.icon style={{ fontSize: 13 }} /> {t.label}
              </button>
            ))}
          </div>
          {pageTab === "ads" && !showForm && (
            <button onClick={openCreate} style={{ ...actionBtn, gap: 6 }}>
              <HiOutlinePlus style={{ fontSize: 14 }} /> New Ad
            </button>
          )}
          {showForm && (
            <button onClick={() => setShowForm(false)} style={secondaryBtn}>
              <HiOutlineXMark style={{ fontSize: 14 }} /> Close Editor
            </button>
          )}
        </div>
      </div>

      {/* ── ANALYTICS BAR (only on ads tab) ── */}
      {pageTab === "ads" && analyticsData && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", borderBottom: "1px solid #111" }}>
          {[
            { label: "Total",    value: analyticsData.totalAds,                    color: "#71717a" },
            { label: "Live",     value: analyticsData.activeAds,                   color: "#22c55e" },
            { label: "Pending",  value: analyticsData.pendingAds,                  color: "#f59e0b" },
            { label: "Rejected", value: analyticsData.rejectedAds,                 color: "#ef4444" },
            { label: "Views",    value: analyticsData.totalViews?.toLocaleString(), color: "#a1a1aa" },
            { label: "CTR",      value: analyticsData.avgCTR,                      color: "#22c55e" },
          ].map((item, i) => (
            <div key={item.label} style={{ padding: "12px 16px", textAlign: "center", borderRight: i < 5 ? "1px solid #111" : "none" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: item.color }}>{item.value ?? "—"}</div>
              <div style={{ fontSize: 10, color: "#3f3f46", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 2 }}>{item.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── AD REQUESTS PAGE ── */}
      {pageTab === "requests" && (
        <div style={{ padding: 24 }}>
          <AdRequestsTab API={API} authHeader={authHeader} showToast={showToast} />
        </div>
      )}

      {/* ── AD PREVIEW TAB ── */}
      {pageTab === "preview" && (
        <div style={{ padding: 24 }}>
          <AdPreviewTab API={API} authHeader={authHeader} showToast={showToast} />
        </div>
      )}

      {/* ── ADS PAGE ── */}
      {pageTab === "ads" && (
        <>
          {/* Ad list */}
          {!showForm && (
            <div style={{ padding: 24 }}>
              {loading ? (
                <div style={{ textAlign: "center", padding: 60, color: "#3f3f46" }}>Loading ads…</div>
              ) : ads.length === 0 ? (
                <div style={{ textAlign: "center", padding: 60 }}>
                  <FaAd style={{ fontSize: 36, color: "#1c1c1c", display: "block", margin: "0 auto 12px" }} />
                  <div style={{ color: "#3f3f46", fontSize: 14 }}>No ads yet. Create your first one.</div>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 10 }}>
                  {ads.map(ad => (
                    <div key={ad._id} style={{ background: "#0a0a0a", border: "1px solid #111", borderRadius: 12, overflow: "hidden" }}>
                      <div style={{ height: 90, background: "#111", position: "relative", overflow: "hidden" }}>
                        {ad.mediaUrl && (
                          ad.mediaType === "video"
                            ? <video src={repairUrl(ad.mediaUrl)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            : <img src={repairUrl(ad.mediaUrl)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        )}
                        <div style={{ position: "absolute", top: 8, left: 8 }}><StatusBadge ad={ad} /></div>
                        <div style={{ position: "absolute", top: 8, right: 8, padding: "2px 6px", borderRadius: 4, background: "rgba(0,0,0,0.7)", fontSize: 9, color: "#52525b", fontWeight: 600 }}>{ad.mediaType?.toUpperCase()}</div>
                      </div>
                      <div style={{ padding: "12px 14px" }}>
                        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", color: "#f4f4f5" }}>{ad.title}</div>
                        <div style={{ fontSize: 11, color: "#52525b", marginBottom: 8 }}>{ad.advertiserName}{ad.companyName ? ` · ${ad.companyName}` : ""}</div>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 10 }}>
                          {(ad.displayLocations || []).map(loc => (
                            <span key={loc} style={{ padding: "2px 6px", borderRadius: 4, background: "#111", fontSize: 9, color: "#3f3f46", fontWeight: 600, border: "1px solid #1a1a1a" }}>{loc.replace("_", " ").toUpperCase()}</span>
                          ))}
                        </div>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <button onClick={() => openEdit(ad)} style={{ ...secondaryBtn, flex: 1, justifyContent: "center", padding: "6px 0", fontSize: 12 }}>
                            <HiOutlinePencil style={{ fontSize: 12 }} /> Edit
                          </button>
                          {ad.approvalStatus !== "approved" && (
                            <button onClick={() => handleApprove(ad._id)} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "6px 10px", borderRadius: 7, background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)", cursor: "pointer", fontSize: 12 }} title="Approve">
                              <HiOutlineCheck style={{ fontSize: 12 }} />
                            </button>
                          )}
                          <button onClick={() => handleToggleActive(ad)} style={{ display: "inline-flex", alignItems: "center", padding: "6px 10px", borderRadius: 7, background: "#111", border: "1px solid #222", color: ad.isActive ? "#52525b" : "#22c55e", cursor: "pointer" }}>
                            {ad.isActive ? <HiOutlineEyeSlash style={{ fontSize: 12 }} /> : <HiOutlineEye style={{ fontSize: 12 }} />}
                          </button>
                          <button onClick={() => handleDelete(ad._id)} style={{ display: "inline-flex", alignItems: "center", padding: "6px 10px", borderRadius: 7, background: "rgba(239,68,68,0.06)", border: "1px solid #3f0f0f", color: "#ef4444", cursor: "pointer" }}>
                            <HiOutlineTrash style={{ fontSize: 12 }} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Form editor */}
          {showForm && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", height: "calc(100vh - 110px)", overflow: "hidden" }}>

              {/* Left editor */}
              <div style={{ display: "flex", flexDirection: "column", borderRight: "1px solid #111", overflow: "hidden" }}>
                {/* Tab bar */}
                <div style={{ display: "flex", borderBottom: "1px solid #111", background: "#000", overflowX: "auto" }}>
                  {formTabs.map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                      display: "flex", alignItems: "center", gap: 5, padding: "10px 14px",
                      fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em",
                      cursor: "pointer", border: "none", whiteSpace: "nowrap",
                      background: "transparent",
                      color: activeTab === t.id ? "#fff" : "#3f3f46",
                      borderBottom: activeTab === t.id ? "2px solid #fff" : "2px solid transparent",
                    }}>
                      <t.icon style={{ fontSize: 12 }} />{t.label}
                    </button>
                  ))}
                  <div style={{ flex: 1 }} />
                </div>

                {/* Tab content */}
                <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>

                  {activeTab === "templates" && (
                    <TemplateSelector form={form} localMediaUrl={localMediaUrl || (form.mediaType === "image" ? repairUrl(form.mediaUrl) : "")} onApply={applyTemplate} />
                  )}

                  {activeTab === "media" && (
                    <div>
                      <Section title="Primary Media">
                        <div onClick={() => fileInputRef.current?.click()}
                          style={{ border: "2px dashed #1a1a1a", borderRadius: 10, padding: "20px", textAlign: "center", cursor: "pointer", background: "#050505", marginBottom: 12, transition: "border-color 0.2s" }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = "#333"}
                          onMouseLeave={e => e.currentTarget.style.borderColor = "#1a1a1a"}>
                          {localMediaUrl ? (
                            <div>
                              {form.mediaType === "video"
                                ? <video src={localMediaUrl} style={{ maxHeight: 120, borderRadius: 8, maxWidth: "100%" }} muted />
                                : <img src={localMediaUrl} style={{ maxHeight: 120, borderRadius: 8, maxWidth: "100%", objectFit: "contain" }} alt="" />
                              }
                              <div style={{ marginTop: 8, fontSize: 11, color: "#22c55e", fontWeight: 600 }}>Click to replace</div>
                            </div>
                          ) : form.mediaUrl ? (
                            <div>
                              {form.mediaType === "video"
                                ? <video src={repairUrl(form.mediaUrl)} style={{ maxHeight: 110, borderRadius: 8, maxWidth: "100%" }} muted />
                                : <img src={repairUrl(form.mediaUrl)} style={{ maxHeight: 110, borderRadius: 8, maxWidth: "100%", objectFit: "contain" }} alt="" />
                              }
                              <div style={{ marginTop: 8, fontSize: 11, color: "#52525b" }}>Click to replace</div>
                            </div>
                          ) : (
                            <div>
                              <HiOutlineCloudArrowUp style={{ fontSize: 28, color: "#222", display: "block", margin: "0 auto 8px" }} />
                              <div style={{ fontSize: 13, color: "#52525b", marginBottom: 3 }}>Click to upload image or video</div>
                              <div style={{ fontSize: 10, color: "#222" }}>JPG, PNG, MP4, MOV · Max 200MB</div>
                            </div>
                          )}
                        </div>
                        <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={handleFilePick} style={{ display: "none" }} />
                      </Section>
                      <Section title="Crop">
                        <CropPanel localMediaUrl={localMediaUrl || (form.mediaType === "image" ? repairUrl(form.mediaUrl) : "")} form={form} onChange={(k, v) => setField(k, v)} />
                      </Section>
                      <Section title="Ad Content">
                        {[
                          { key: "title",       label: "Title *",          ph: "India's No 1 platform" },
                          { key: "tagline",     label: "Tagline",          ph: "Short punchy line" },
                          { key: "ctaText",     label: "CTA Button Text",  ph: "Learn More" },
                          { key: "badge",       label: "Badge Text",       ph: "SPONSOR" },
                        ].map(({ key, label, ph }) => (
                          <div key={key} style={fieldGroup}><label style={labelStyle}>{label}</label><input value={form[key]} onChange={e => setField(key, e.target.value)} style={inputStyle} placeholder={ph} /></div>
                        ))}
                        <div style={fieldGroup}><label style={labelStyle}>Description</label><textarea value={form.description} onChange={e => setField("description", e.target.value)} style={{ ...inputStyle, height: 60, resize: "vertical" }} placeholder="One line shown on banner" /></div>
                      </Section>
                      <Section title="Links">
                        {[
                          { key: "websiteUrl",   label: "Website URL",   ph: "https://example.com" },
                          { key: "instagramUrl", label: "Instagram URL", ph: "https://instagram.com/..." },
                          { key: "facebookUrl",  label: "Facebook URL",  ph: "https://facebook.com/..." },
                          { key: "youtubeUrl",   label: "YouTube URL",   ph: "https://youtube.com/..." },
                          { key: "otherUrl",     label: "Other URL",     ph: "https://..." },
                        ].map(({ key, label, ph }) => (
                          <div key={key} style={fieldGroup}><label style={labelStyle}>{label}</label><input value={form[key]} onChange={e => setField(key, e.target.value)} style={inputStyle} placeholder={ph} /></div>
                        ))}
                      </Section>
                    </div>
                  )}

                  {activeTab === "layout" && (
                    <div>
                      <Section title="Text Position">
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 5, marginBottom: 14 }}>
                          {[["tl","↖ TL"],["tc","↑ TC"],["tr","↗ TR"],["ml","← ML"],["mc","⊙ MC"],["mr","→ MR"],["bl","↙ BL"],["bc","↓ BC"],["br","↘ BR"]].map(([pos, label]) => (
                            <button type="button" key={pos} onClick={() => setLayout("textPosition", pos)} style={{ ...toggleBtn(form.layoutConfig.textPosition === pos), fontSize: 10, padding: "6px 4px", textAlign: "center" }}>{label}</button>
                          ))}
                        </div>
                      </Section>
                      <Section title="Overlay">
                        <div style={fieldGroup}>
                          <label style={labelStyle}>Direction</label>
                          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                            {["to-top","to-bottom","to-left","to-right","radial","none"].map(d => (
                              <button type="button" key={d} onClick={() => setLayout("overlayDirection", d)} style={{ ...toggleBtn(form.layoutConfig.overlayDirection === d), fontSize: 10 }}>{d}</button>
                            ))}
                          </div>
                        </div>
                        <div style={fieldGroup}><label style={labelStyle}>Opacity: {form.layoutConfig.overlayOpacity}%</label><input type="range" min={0} max={100} value={form.layoutConfig.overlayOpacity} onChange={e => setLayout("overlayOpacity", parseInt(e.target.value))} style={{ width: "100%", accentColor: "#22c55e" }} /></div>
                        <ColorInput label="Overlay Color" value={form.layoutConfig.overlayColor} onChange={v => setLayout("overlayColor", v)} />
                      </Section>
                      <Section title="Typography">
                        <div style={fieldGroup}>
                          <label style={labelStyle}>Title Size</label>
                          <div style={{ display: "flex", gap: 5 }}>{["sm","md","lg","xl"].map(s => <button type="button" key={s} onClick={() => setLayout("titleSize", s)} style={{ ...toggleBtn(form.layoutConfig.titleSize === s), flex: 1 }}>{s.toUpperCase()}</button>)}</div>
                        </div>
                        <div style={fieldGroup}>
                          <label style={labelStyle}>Title Weight</label>
                          <div style={{ display: "flex", gap: 5 }}>{["bold","extrabold","black"].map(w => <button type="button" key={w} onClick={() => setLayout("titleWeight", w)} style={{ ...toggleBtn(form.layoutConfig.titleWeight === w), flex: 1 }}>{w}</button>)}</div>
                        </div>
                        <ColorInput label="Title Color" value={form.layoutConfig.titleColor} onChange={v => setLayout("titleColor", v)} />
                        <ColorInput label="Description Color" value={form.layoutConfig.descColor} onChange={v => setLayout("descColor", v)} />
                      </Section>
                      <Section title="Badge">
                        <div style={fieldGroup}><label style={labelStyle}>Badge Override</label><input value={form.layoutConfig.badgeText} onChange={e => setLayout("badgeText", e.target.value)} style={inputStyle} placeholder="Leave blank to use Badge field" /></div>
                        <ColorInput label="Badge Background" value={form.layoutConfig.badgeColor} onChange={v => setLayout("badgeColor", v)} />
                      </Section>
                      <Section title="Timing">
                        <div style={fieldGroup}><label style={labelStyle}>Slide Duration: {form.layoutConfig.slideDuration / 1000}s</label><input type="range" min={3000} max={15000} step={500} value={form.layoutConfig.slideDuration} onChange={e => setLayout("slideDuration", parseInt(e.target.value))} style={{ width: "100%", accentColor: "#22c55e" }} /></div>
                      </Section>
                    </div>
                  )}

                  {activeTab === "button" && (
                    <div>
                      <Section title="Style">
                        <div style={fieldGroup}>
                          <label style={labelStyle}>Variant</label>
                          <div style={{ display: "flex", gap: 5 }}>{["filled","outline","ghost"].map(v => <button type="button" key={v} onClick={() => setButton("variant", v)} style={{ ...toggleBtn(form.buttonStyle.variant === v), flex: 1, textTransform: "capitalize" }}>{v}</button>)}</div>
                        </div>
                        <div style={fieldGroup}>
                          <label style={labelStyle}>Radius</label>
                          <div style={{ display: "flex", gap: 5 }}>{["sm","md","lg","full"].map(r => <button type="button" key={r} onClick={() => setButton("radius", r)} style={{ ...toggleBtn(form.buttonStyle.radius === r), flex: 1 }}>{r}</button>)}</div>
                        </div>
                      </Section>
                      <Section title="Colors">
                        <ColorInput label="Background" value={form.buttonStyle.bgColor}    onChange={v => setButton("bgColor", v)} />
                        <ColorInput label="Text"       value={form.buttonStyle.textColor}  onChange={v => setButton("textColor", v)} />
                        <ColorInput label="Border"     value={form.buttonStyle.borderColor} onChange={v => setButton("borderColor", v)} />
                      </Section>
                      <Section title="Icon">
                        <div style={fieldGroup}>
                          <label style={labelStyle}>Icon</label>
                          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>{["none","arrow","globe","instagram","chevron"].map(i => <button type="button" key={i} onClick={() => setButton("icon", i)} style={toggleBtn(form.buttonStyle.icon === i)}>{i}</button>)}</div>
                        </div>
                        <div style={fieldGroup}>
                          <label style={labelStyle}>Position</label>
                          <div style={{ display: "flex", gap: 5 }}>{["left","right"].map(p => <button type="button" key={p} onClick={() => setButton("iconPosition", p)} style={{ ...toggleBtn(form.buttonStyle.iconPosition === p), flex: 1 }}>{p}</button>)}</div>
                        </div>
                      </Section>
                    </div>
                  )}

                  {activeTab === "components" && (
                    <div>
                      <Section title="Banner Components">
                        <ToggleRow label="Badge Label"      value={form.layoutConfig.showBadge}       onChange={v => setLayout("showBadge", v)}       hint="SPONSOR / custom badge pill" />
                        <ToggleRow label="Sponsor Tag"      value={form.layoutConfig.showSponsorTag}  onChange={v => setLayout("showSponsorTag", v)}  hint="Amber SPONSOR tag next to badge" />
                        <ToggleRow label="Description"      value={form.layoutConfig.showDescription} onChange={v => setLayout("showDescription", v)} hint="Short description below title" />
                        <ToggleRow label="Progress Bar"     value={form.layoutConfig.showProgressBar} onChange={v => setLayout("showProgressBar", v)} hint="Slide timer at bottom" />
                        <ToggleRow label="Details Button"   value={form.layoutConfig.showDetailsBtn}  onChange={v => setLayout("showDetailsBtn", v)}  hint="Secondary Details → button" />
                        <ToggleRow label="Mute Button"      value={form.layoutConfig.showMuteBtn}     onChange={v => setLayout("showMuteBtn", v)}     hint="Video ads only" />
                      </Section>
                      <Section title="Display">
                        <div style={fieldGroup}>
                          <label style={labelStyle}>Banners Placement</label>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 12, padding: 10, background: "#050505", borderRadius: 8, border: "1px solid #111" }}>
                            {[
                              { id: "banners:home_0", label: "Home Level 0" },
                              { id: "banners:home_1", label: "Home Level 1" },
                              { id: "banners:home_2", label: "Home Level 2" },
                              { id: "banners:editors", label: "Explore Editors" },
                              { id: "banners:gigs",    label: "Explore Gigs" },
                              { id: "banners:jobs",    label: "Jobs Page" },
                              { id: "banners:explore", label: "Explore Page" },
                            ].map(loc => (
                              <button type="button" key={loc.id} onClick={() => {
                                const locs = form.displayLocations.includes(loc.id) ? form.displayLocations.filter(l => l !== loc.id) : [...form.displayLocations, loc.id];
                                setField("displayLocations", locs);
                              }} style={{ ...toggleBtn(form.displayLocations.includes(loc.id)), textAlign: "left", padding: "8px 10px" }}>
                                {loc.label}
                              </button>
                            ))}
                          </div>

                          <label style={labelStyle}>Reels Placement</label>
                          <div style={{ display: "flex", gap: 6 }}>
                            {["reels_feed"].map(loc => (
                              <button type="button" key={loc} onClick={() => {
                                const locs = form.displayLocations.includes(loc) ? form.displayLocations.filter(l => l !== loc) : [...form.displayLocations, loc];
                                setField("displayLocations", locs);
                              }} style={toggleBtn(form.displayLocations.includes(loc))}>
                                {loc.replace(/_/g, " ").toUpperCase()}
                              </button>
                            ))}
                          </div>
                        </div>
                        <ToggleRow label="Active"         value={form.isActive}  onChange={v => setField("isActive", v)}  hint="Visible to users" />
                        <ToggleRow label="Default Banner" value={form.isDefault} onChange={v => setField("isDefault", v)} hint="Fallback when no live ads" />
                        <div style={{ ...fieldGroup, marginTop: 12 }}>
                          <label style={labelStyle}>Approval Status</label>
                          <select value={form.approvalStatus} onChange={e => setField("approvalStatus", e.target.value)} style={inputStyle}>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </div>
                        <div style={fieldGroup}>
                          <label style={labelStyle}>Priority</label>
                          <div style={{ display: "flex", gap: 5 }}>{["low","medium","high","urgent"].map(p => <button type="button" key={p} onClick={() => setField("priority", p)} style={{ ...toggleBtn(form.priority === p), flex: 1, textTransform: "capitalize" }}>{p}</button>)}</div>
                        </div>
                        <div style={fieldGroup}><label style={labelStyle}>Admin Notes</label><textarea value={form.adminNotes} onChange={e => setField("adminNotes", e.target.value)} style={{ ...inputStyle, height: 56, resize: "vertical" }} placeholder="Internal notes…" /></div>
                      </Section>
                    </div>
                  )}

                  {activeTab === "schedule" && (
                    <div>
                      <Section title="Schedule">
                        <div style={fieldGroup}><label style={labelStyle}>Start Date & Time</label><input type="datetime-local" value={form.startDate} onChange={e => setField("startDate", e.target.value)} style={inputStyle} /></div>
                        <div style={fieldGroup}><label style={labelStyle}>End Date & Time</label><input type="datetime-local" value={form.endDate} onChange={e => setField("endDate", e.target.value)} style={inputStyle} /><div style={{ fontSize: 10, color: "#3f3f46", marginTop: 4 }}>Leave blank for no expiry</div></div>
                      </Section>
                      <Section title="Status Guide">
                        {[
                          { color: "#22c55e", label: "LIVE",     desc: "Active + Approved + within date range" },
                          { color: "#f59e0b", label: "PENDING",  desc: "Active but awaiting approval" },
                          { color: "#52525b", label: "INACTIVE", desc: "isActive is off" },
                          { color: "#ef4444", label: "REJECTED", desc: "Admin rejected this ad" },
                        ].map(item => (
                          <div key={item.label} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 8 }}>
                            <span style={{ padding: "2px 7px", borderRadius: 4, fontSize: 9, fontWeight: 800, background: `${item.color}15`, color: item.color, flexShrink: 0 }}>{item.label}</span>
                            <span style={{ fontSize: 12, color: "#52525b" }}>{item.desc}</span>
                          </div>
                        ))}
                      </Section>
                    </div>
                  )}

                  {activeTab === "advertiser" && (
                    <div>
                      <Section title="Advertiser Details">
                        {[
                          { key: "advertiserName",  label: "Name *",        ph: "John Doe" },
                          { key: "advertiserEmail", label: "Email",         ph: "john@example.com" },
                          { key: "advertiserPhone", label: "Phone",         ph: "+91 98765 43210" },
                          { key: "companyName",     label: "Company",       ph: "Acme Corp" },
                        ].map(({ key, label, ph }) => (
                          <div key={key} style={fieldGroup}><label style={labelStyle}>{label}</label><input value={form[key]} onChange={e => setField(key, e.target.value)} style={inputStyle} placeholder={ph} /></div>
                        ))}
                      </Section>
                      <Section title="Long Description">
                        <textarea value={form.longDescription} onChange={e => setField("longDescription", e.target.value)} style={{ ...inputStyle, height: 160, resize: "vertical" }} placeholder="Rich description shown on the ad details page…" />
                      </Section>
                    </div>
                  )}

                </div>

                {/* Publish footer */}
                <div style={{ padding: "12px 18px", borderTop: "1px solid #111", display: "flex", gap: 8, alignItems: "center", background: "#000" }}>
                  <button onClick={handleSubmit} disabled={saving} style={{ ...actionBtn, flex: 1, justifyContent: "center", opacity: saving ? 0.6 : 1, fontSize: 13 }}>
                    {saving
                      ? <><HiOutlineArrowPath style={{ fontSize: 14, animation: "spin 1s linear infinite" }} /> Saving…</>
                      : <><HiOutlineCloudArrowUp style={{ fontSize: 14 }} /> {editingId ? "Save Changes" : "Publish Ad"}</>
                    }
                  </button>
                  <button onClick={() => setShowForm(false)} style={{ ...secondaryBtn, fontSize: 13 }}>Cancel</button>
                </div>
              </div>

              {/* Right: preview */}
              <div style={{ background: "#000", overflowY: "auto", display: "flex", flexDirection: "column", borderLeft: "1px solid #111" }}>
                <div style={{ padding: "14px 18px", borderBottom: "1px solid #111" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#3f3f46", textTransform: "uppercase", letterSpacing: "0.1em" }}>Live Preview</div>
                </div>
                <div style={{ padding: "20px 18px", flex: 1 }}>
                  <LiveBannerPreview form={form} localMediaUrl={localMediaUrl} />
                  <div style={{ marginTop: 16, padding: 12, background: "#0a0a0a", borderRadius: 8, border: "1px solid #111" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#3f3f46", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Config</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
                      {[
                        { label: "Status",   value: form.isActive ? "Active" : "Inactive" },
                        { label: "Approval", value: form.approvalStatus },
                        { label: "Priority", value: form.priority },
                        { label: "Position", value: form.layoutConfig.textPosition?.toUpperCase() },
                        { label: "Overlay",  value: `${form.layoutConfig.overlayOpacity}%` },
                        { label: "Duration", value: `${form.layoutConfig.slideDuration / 1000}s` },
                      ].map(({ label, value }) => (
                        <div key={label} style={{ fontSize: 11 }}>
                          <span style={{ color: "#3f3f46" }}>{label}: </span>
                          <span style={{ color: "#a1a1aa", fontWeight: 600 }}>{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}
        </>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #000; }
        ::-webkit-scrollbar-thumb { background: #1c1c1c; border-radius: 4px; }
        select option { background: #0a0a0a; color: #f4f4f5; }
      `}</style>
    </div>
  );
};

export default AdManagerPage;