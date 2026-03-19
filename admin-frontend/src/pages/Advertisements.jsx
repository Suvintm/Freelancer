/**
 * AdManagerPage.jsx
 * Production-grade Ad Manager for SuviX admin panel.
 *
 * ENV: VITE_BACKEND_URL=http://localhost:5052/api  (already includes /api)
 * All axios calls use ${API}/admin/ads/...  — no extra /api prefix.
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Cropper from "react-easy-crop";
import {
  HiOutlinePlus, HiOutlineTrash, HiOutlinePencil, HiOutlineEye,
  HiOutlineEyeSlash, HiOutlineCheck, HiOutlineXMark, HiOutlinePhoto,
  HiOutlineVideoCamera, HiOutlineArrowPath, HiOutlineCloudArrowUp,
  HiOutlineBolt, HiOutlineClock, HiOutlineChartBar, HiOutlineStar,
  HiOutlineAdjustmentsHorizontal, HiOutlineCommandLine, HiOutlineRectangleGroup,
  HiOutlineSparkles, HiOutlineCalendarDays, HiOutlineUser, HiArrowRight,
  HiSpeakerWave, HiSpeakerXMark, HiOutlineGlobeAlt, HiOutlineCursorArrowRipple,
  HiOutlineSquare3Stack3D, HiOutlineTag,
} from "react-icons/hi2";
import { FaAd, FaInstagram, FaGlobe, FaChevronRight } from "react-icons/fa";
import axios from "axios";
import TemplateSelector from "./TemplateSelector";
import AdRequestsTab from "./AdRequestsTab";                          // ADD THIS
import { HiOutlineClipboardDocumentList } from "react-icons/hi2";    // ADD THIS (already have hi2 import, add to existing)
// ─── Config ───────────────────────────────────────────────────────────────────
const BANNER_ASPECT = 375 / 192;

// ─── Default form state ───────────────────────────────────────────────────────
const defaultForm = () => ({
  advertiserName: "",
  advertiserEmail: "",
  advertiserPhone: "",
  companyName: "",
  title: "",
  tagline: "",
  description: "",
  longDescription: "",
  mediaType: "image",
  mediaUrl: "",
  thumbnailUrl: "",
  websiteUrl: "",
  instagramUrl: "",
  facebookUrl: "",
  youtubeUrl: "",
  otherUrl: "",
  ctaText: "Learn More",
  badge: "SPONSOR",
  isActive: true,
  isDefault: false,
  displayLocations: ["home_banner"],
  approvalStatus: "approved",
  priority: "medium",
  adminNotes: "",
  startDate: "",
  endDate: "",
  cropData: { x: 0, y: 0, width: 100, height: 100, zoom: 1 },
  layoutConfig: {
    textPosition: "bl",
    overlayDirection: "to-top",
    overlayOpacity: 75,
    overlayColor: "#040408",
    titleSize: "md",
    titleWeight: "black",
    titleColor: "#ffffff",
    descColor: "rgba(212,212,216,0.75)",
    showBadge: true,
    showSponsorTag: true,
    showDescription: true,
    showProgressBar: true,
    showDetailsBtn: true,
    showMuteBtn: true,
    slideDuration: 5000,
    badgeText: "",
    badgeColor: "rgba(255,255,255,0.12)",
  },
  buttonStyle: {
    variant: "filled",
    bgColor: "#ffffff",
    textColor: "#000000",
    borderColor: "#ffffff",
    radius: "md",
    icon: "chevron",
    iconPosition: "right",
  },
});

// ─── URL repair utility ───────────────────────────────────────────────────────
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

// ─── Live Banner Preview ──────────────────────────────────────────────────────
const LiveBannerPreview = ({ form, localMediaUrl }) => {
  const lc = form.layoutConfig;
  const bs = form.buttonStyle;
  const cd = form.cropData;

  const overlayGradient = useMemo(() => {
    const rgba = (hex, opacity) => {
      try {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r},${g},${b},${(opacity / 100).toFixed(2)})`;
      } catch { return `rgba(4,4,8,${(opacity/100).toFixed(2)})`; }
    };
    const color = lc.overlayColor || "#040408";
    const op = lc.overlayOpacity ?? 75;
    const directions = {
      "to-top":    `linear-gradient(to top, ${rgba(color, op)} 0%, ${rgba(color, Math.round(op * 0.4))} 42%, transparent 75%)`,
      "to-bottom": `linear-gradient(to bottom, ${rgba(color, op)} 0%, transparent 75%)`,
      "to-left":   `linear-gradient(to left, ${rgba(color, op)} 0%, transparent 75%)`,
      "to-right":  `linear-gradient(to right, ${rgba(color, op)} 0%, transparent 75%)`,
      "radial":    `radial-gradient(ellipse at center, transparent 30%, ${rgba(color, op)} 100%)`,
      "none":      "none",
    };
    return directions[lc.overlayDirection] || directions["to-top"];
  }, [lc.overlayDirection, lc.overlayOpacity, lc.overlayColor]);

  const textPositionStyle = useMemo(() => {
    const map = {
      tl: { alignItems: "flex-start", justifyContent: "flex-start" },
      tc: { alignItems: "center",     justifyContent: "flex-start" },
      tr: { alignItems: "flex-end",   justifyContent: "flex-start" },
      ml: { alignItems: "flex-start", justifyContent: "center" },
      mc: { alignItems: "center",     justifyContent: "center" },
      mr: { alignItems: "flex-end",   justifyContent: "center" },
      bl: { alignItems: "flex-start", justifyContent: "flex-end" },
      bc: { alignItems: "center",     justifyContent: "flex-end" },
      br: { alignItems: "flex-end",   justifyContent: "flex-end" },
    };
    return map[lc.textPosition] || map["bl"];
  }, [lc.textPosition]);

  const titleFontSize   = { sm: "13px", md: "16px", lg: "20px", xl: "24px" }[lc.titleSize] || "16px";
  const titleFontWeight = { bold: 700, black: 900, extrabold: 800 }[lc.titleWeight] || 900;
  const btnRadius       = { sm: "6px", md: "8px", lg: "12px", full: "999px" }[bs.radius] || "8px";

  const btnStyle = useMemo(() => {
    const base = { borderRadius: btnRadius, display: "flex", alignItems: "center", gap: "6px", padding: "6px 14px", fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", cursor: "pointer", border: "none", transition: "all 0.2s" };
    if (bs.variant === "filled")  return { ...base, background: bs.bgColor, color: bs.textColor };
    if (bs.variant === "outline") return { ...base, background: "transparent", color: bs.borderColor, border: `1.5px solid ${bs.borderColor}` };
    if (bs.variant === "ghost")   return { ...base, background: "rgba(255,255,255,0.1)", color: "#fff", backdropFilter: "blur(8px)" };
    return base;
  }, [bs, btnRadius]);

  const mediaUrl = localMediaUrl || repairUrl(form.mediaUrl);

  const cropStyle = useMemo(() => {
    if (!cd || (cd.x === 0 && cd.y === 0 && cd.width === 100 && cd.height === 100)) {
      return { width: "100%", height: "100%", objectFit: "cover" };
    }
    const scale = Math.max(100 / cd.width, 100 / cd.height);
    return {
      position: "absolute", width: `${scale * 100}%`, height: `${scale * 100}%`,
      objectFit: "cover", transform: `translate(${-(cd.x / 100) * 100 * scale}%, ${-(cd.y / 100) * 100 * scale}%)`,
      top: 0, left: 0,
    };
  }, [cd]);

  const btnIcon = useMemo(() => {
    const icons = {
      arrow: <HiArrowRight style={{ fontSize: "10px" }} />,
      globe: <FaGlobe style={{ fontSize: "9px" }} />,
      instagram: <FaInstagram style={{ fontSize: "9px" }} />,
      chevron: <FaChevronRight style={{ fontSize: "8px" }} />,
      none: null,
    };
    return icons[bs.icon] || icons.chevron;
  }, [bs.icon]);

  return (
    <div style={{ width: "100%", maxWidth: 375, margin: "0 auto" }}>
      <div style={{ fontSize: "10px", color: "#52525b", marginBottom: "8px", textAlign: "center", letterSpacing: "0.05em", textTransform: "uppercase", fontWeight: 600 }}>
        Live Preview · 375×192px
      </div>
      <div style={{ position: "relative", width: "100%", height: 192, borderRadius: "1.5rem", overflow: "hidden", background: "#18181b", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}>
        {mediaUrl ? (
          <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
            {form.mediaType === "video"
              ? <video src={mediaUrl} autoPlay loop muted playsInline style={{ ...cropStyle, objectFit: "cover" }} />
              : <img src={mediaUrl} alt="preview" style={{ ...cropStyle, objectFit: "cover" }} />
            }
          </div>
        ) : (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8 }}>
            <HiOutlinePhoto style={{ fontSize: 32, color: "#3f3f46" }} />
            <span style={{ fontSize: 11, color: "#52525b" }}>Upload media to preview</span>
          </div>
        )}
        <div style={{ position: "absolute", inset: 0, background: overlayGradient, pointerEvents: "none" }} />
        {lc.showProgressBar && (
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: "rgba(255,255,255,0.08)", zIndex: 50 }}>
            <div style={{ width: "40%", height: "100%", background: "rgba(255,255,255,0.6)" }} />
          </div>
        )}
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", padding: "16px 16px 14px", zIndex: 20, pointerEvents: "none", justifyContent: textPositionStyle.justifyContent, alignItems: textPositionStyle.alignItems }}>
          {lc.showBadge && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 8px", borderRadius: 6, background: lc.badgeColor || "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.1)", fontSize: "7.5px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.16em", color: "#fff" }}>
                <FaAd style={{ color: "#fbbf24", fontSize: 9 }} />
                {(lc.badgeText || form.badge || "SPONSOR").toUpperCase()}
              </span>
              {lc.showSponsorTag && (
                <span style={{ padding: "2px 6px", borderRadius: 6, background: "rgba(245,158,11,0.85)", fontSize: "6.5px", fontWeight: 900, textTransform: "uppercase", color: "#fff" }}>SPONSOR</span>
              )}
            </div>
          )}
          <h2 style={{ fontSize: titleFontSize, fontWeight: titleFontWeight, color: lc.titleColor || "#fff", lineHeight: 1.2, letterSpacing: "-0.02em", margin: "0 0 4px", textShadow: "0 2px 12px rgba(0,0,0,0.5)", maxWidth: "80%", textAlign: textPositionStyle.alignItems === "flex-end" ? "right" : textPositionStyle.alignItems === "center" ? "center" : "left" }}>
            {form.title || "Your Ad Title"}
          </h2>
          {lc.showDescription && (
            <p style={{ fontSize: "9.5px", color: lc.descColor || "rgba(212,212,216,0.75)", fontWeight: 500, lineHeight: 1.5, margin: "0 0 10px", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", maxWidth: "72%" }}>
              {form.description || form.tagline || "Your description appears here"}
            </p>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 6, pointerEvents: "auto" }}>
            <button style={btnStyle}>
              {bs.iconPosition === "left" && btnIcon}
              {form.ctaText || "Learn More"}
              {bs.iconPosition === "right" && btnIcon}
            </button>
            {lc.showDetailsBtn && (
              <button style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: btnRadius, background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: "9px", fontWeight: 700, cursor: "pointer" }}>
                Details <HiArrowRight style={{ fontSize: 10 }} />
              </button>
            )}
            {lc.showMuteBtn && form.mediaType === "video" && (
              <button style={{ width: 28, height: 28, borderRadius: btnRadius, background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <HiSpeakerXMark style={{ fontSize: 14 }} />
              </button>
            )}
          </div>
        </div>
        <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", zIndex: 30, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "8px 6px", borderRadius: 16, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.08)" }}>
          {[{ icon: FaAd, color: "#fbbf24", active: true }, { icon: HiOutlineUser, color: "#a78bfa" }, { icon: HiOutlineRectangleGroup, color: "#34d399" }].map((item, i) => (
            <div key={i} style={{ width: 28, height: 28, borderRadius: "50%", background: item.active ? "#fff" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <item.icon style={{ fontSize: 11, color: item.active ? "#000" : item.color }} />
            </div>
          ))}
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

  const onCropComplete = useCallback((_, croppedAreaPixels) => setCroppedArea(croppedAreaPixels), []);

  const applyCrop = () => {
    if (!croppedArea) return;
    onChange("cropData", { x: crop.x, y: crop.y, width: 100, height: 100, zoom });
  };

  const resetCrop = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    onChange("cropData", { x: 0, y: 0, width: 100, height: 100, zoom: 1 });
  };

  if (!localMediaUrl) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 200, gap: 8, color: "#52525b" }}>
        <HiOutlinePhoto style={{ fontSize: 32 }} />
        <span style={{ fontSize: 12 }}>Upload media first to crop</span>
      </div>
    );
  }

  return (
    <div>
      <div style={{ position: "relative", width: "100%", height: 220, background: "#000", borderRadius: 12, overflow: "hidden", marginBottom: 12 }}>
        <Cropper image={localMediaUrl} crop={crop} zoom={zoom} aspect={BANNER_ASPECT} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} style={{ containerStyle: { borderRadius: 12 } }} />
      </div>
      <label style={labelStyle}>Zoom</label>
      <input type="range" min={1} max={3} step={0.01} value={zoom} onChange={e => setZoom(parseFloat(e.target.value))} style={{ width: "100%", marginBottom: 12, accentColor: "#6366f1" }} />
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={applyCrop} style={{ ...actionBtn, flex: 1 }}><HiOutlineCheck /> Apply Crop</button>
        <button onClick={resetCrop} style={{ ...secondaryBtn, flex: 1 }}><HiOutlineArrowPath /> Reset</button>
      </div>
    </div>
  );
};

// ─── Shared style tokens ──────────────────────────────────────────────────────
const labelStyle   = { fontSize: 11, fontWeight: 600, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 5 };
const inputStyle   = { width: "100%", background: "#18181b", border: "1px solid #27272a", borderRadius: 8, padding: "8px 10px", color: "#f4f4f5", fontSize: 13, outline: "none", boxSizing: "border-box" };
const actionBtn    = { display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, background: "#6366f1", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700 };
const secondaryBtn = { display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, background: "#27272a", color: "#a1a1aa", border: "1px solid #3f3f46", cursor: "pointer", fontSize: 13, fontWeight: 600 };
const fieldGroup   = { marginBottom: 14 };
const toggleBtn    = (active) => ({ padding: "5px 12px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer", border: active ? "1px solid #6366f1" : "1px solid #3f3f46", background: active ? "rgba(99,102,241,0.15)" : "#18181b", color: active ? "#818cf8" : "#71717a" });

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 20 }}>
    <div style={{ fontSize: 10, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10, paddingBottom: 6, borderBottom: "1px solid #1c1c1e" }}>{title}</div>
    {children}
  </div>
);

const ColorInput = ({ label, value, onChange }) => (
  <div style={fieldGroup}>
    <label style={labelStyle}>{label}</label>
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <input type="color" value={value?.startsWith("rgba") ? "#ffffff" : (value || "#ffffff")} onChange={e => onChange(e.target.value)} style={{ width: 36, height: 36, borderRadius: 8, border: "1px solid #27272a", background: "none", cursor: "pointer", padding: 2 }} />
      <input value={value || ""} onChange={e => onChange(e.target.value)} style={{ ...inputStyle, flex: 1 }} placeholder="rgba(...) or #hex" />
    </div>
  </div>
);

const ToggleRow = ({ label, value, onChange, hint }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #1c1c1e" }}>
    <div>
      <div style={{ fontSize: 13, color: "#d4d4d8", fontWeight: 500 }}>{label}</div>
      {hint && <div style={{ fontSize: 10, color: "#52525b", marginTop: 1 }}>{hint}</div>}
    </div>
    <button onClick={() => onChange(!value)} style={{ width: 40, height: 22, borderRadius: 11, border: "none", cursor: "pointer", position: "relative", background: value ? "#6366f1" : "#27272a", transition: "background 0.2s" }}>
      <span style={{ position: "absolute", top: 3, left: value ? 21 : 3, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
    </button>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const AdManagerPage = ({ adminURL, token }) => {
  const [ads, setAds]             = useState([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm]   = useState(false);
  const [activeTab, setActiveTab] = useState("templates");
  const [form, setForm]           = useState(defaultForm());
  const [localMediaFile, setLocalMediaFile] = useState(null);
  const [localMediaUrl, setLocalMediaUrl]   = useState("");
  const [galleryFiles, setGalleryFiles]     = useState([]);
  const [toast, setToast]                   = useState(null);
  const [analyticsData, setAnalyticsData]   = useState(null);
  const fileInputRef    = useRef(null);
  const galleryInputRef = useRef(null);

  // ── API base ────────────────────────────────────────────────────────────────
  // VITE_BACKEND_URL=http://localhost:5052/api  (already ends with /api)
  // Routes: ${API}/admin/ads/...   ← no extra /api
  const API           = adminURL || import.meta.env.VITE_BACKEND_URL || "http://localhost:5052/api";
  const resolvedToken = token || localStorage.getItem("adminToken");
  const authHeader    = { Authorization: `Bearer ${resolvedToken}` };

  // ── Fetch ───────────────────────────────────────────────────────────────────
  const fetchAds = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API}/admin/ads`, { headers: authHeader });
      setAds(data.ads || []);
    } catch {
      showToast("Failed to load ads", "error");
    } finally {
      setLoading(false);
    }
  }, [API, resolvedToken]);

  const fetchAnalytics = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/admin/ads/analytics`, { headers: authHeader });
      setAnalyticsData(data.analytics);
    } catch {}
  }, [API, resolvedToken]);

  useEffect(() => { fetchAds(); fetchAnalytics(); }, []);

  // ── Toast ───────────────────────────────────────────────────────────────────
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Form helpers ────────────────────────────────────────────────────────────
  const setField  = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const setLayout = (key, val) => setForm(f => ({ ...f, layoutConfig: { ...f.layoutConfig, [key]: val } }));
  const setButton = (key, val) => setForm(f => ({ ...f, buttonStyle:  { ...f.buttonStyle,  [key]: val } }));

  const openCreate = () => {
    setForm(defaultForm());
    setLocalMediaFile(null);
    setLocalMediaUrl("");
    setGalleryFiles([]);
    setEditingId(null);
    setActiveTab("templates");
    setShowForm(true);
  };

  const openEdit = (ad) => {
    setForm({
      advertiserName:   ad.advertiserName  || "",
      advertiserEmail:  ad.advertiserEmail || "",
      advertiserPhone:  ad.advertiserPhone || "",
      companyName:      ad.companyName     || "",
      title:            ad.title           || "",
      tagline:          ad.tagline         || "",
      description:      ad.description     || "",
      longDescription:  ad.longDescription || "",
      mediaType:        ad.mediaType       || "image",
      mediaUrl:         ad.mediaUrl        || "",
      thumbnailUrl:     ad.thumbnailUrl    || "",
      websiteUrl:       ad.websiteUrl      || "",
      instagramUrl:     ad.instagramUrl    || "",
      facebookUrl:      ad.facebookUrl     || "",
      youtubeUrl:       ad.youtubeUrl      || "",
      otherUrl:         ad.otherUrl        || "",
      ctaText:          ad.ctaText         || "Learn More",
      badge:            ad.badge           || "SPONSOR",
      isActive:         ad.isActive        ?? true,
      isDefault:        ad.isDefault       || false,
      displayLocations: ad.displayLocations || ["home_banner"],
      approvalStatus:   ad.approvalStatus  || "approved",
      priority:         ad.priority        || "medium",
      adminNotes:       ad.adminNotes      || "",
      startDate:        ad.startDate ? ad.startDate.slice(0, 16) : "",
      endDate:          ad.endDate   ? ad.endDate.slice(0, 16)   : "",
      cropData:         ad.cropData    || defaultForm().cropData,
      layoutConfig:     { ...defaultForm().layoutConfig, ...(ad.layoutConfig || {}) },
      buttonStyle:      { ...defaultForm().buttonStyle,  ...(ad.buttonStyle  || {}) },
    });
    setLocalMediaFile(null);
    setLocalMediaUrl("");
    setGalleryFiles([]);
    setEditingId(ad._id);
    setActiveTab("templates");
    setShowForm(true);
  };

  // ── File pick (no upload yet) ───────────────────────────────────────────────
  const handleFilePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLocalMediaFile(file);
    setLocalMediaUrl(URL.createObjectURL(file));
    setField("mediaType", file.type.startsWith("video/") ? "video" : "image");
    e.target.value = "";
  };

  // ── Submit — upload fires ONLY here ────────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.title || !form.advertiserName) {
      showToast("Advertiser name and title are required", "error");
      return;
    }
    if (!localMediaFile && !form.mediaUrl) {
      showToast("Please select a media file", "error");
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      if (localMediaFile) fd.append("media", localMediaFile);
      if (galleryFiles.length) galleryFiles.forEach(f => fd.append("gallery", f));

      const scalar = ["advertiserName","advertiserEmail","advertiserPhone","companyName","title","tagline","description","longDescription","mediaUrl","thumbnailUrl","websiteUrl","instagramUrl","facebookUrl","youtubeUrl","otherUrl","ctaText","badge","approvalStatus","priority","adminNotes","startDate","endDate"];
      scalar.forEach(k => { if (form[k] !== undefined && form[k] !== "") fd.append(k, form[k]); });
      fd.append("isActive",         form.isActive);
      fd.append("isDefault",        form.isDefault);
      fd.append("displayLocations", JSON.stringify(form.displayLocations));
      fd.append("cropData",         JSON.stringify(form.cropData));
      fd.append("layoutConfig",     JSON.stringify(form.layoutConfig));
      fd.append("buttonStyle",      JSON.stringify(form.buttonStyle));

      // ✅ API already has /api — routes are /admin/ads/...
      const url    = editingId ? `${API}/admin/ads/${editingId}` : `${API}/admin/ads`;
      const method = editingId ? "patch" : "post";
      await axios[method](url, fd, { headers: { ...authHeader, "Content-Type": "multipart/form-data" } });

      showToast(editingId ? "Ad updated!" : "Ad published!");
      setShowForm(false);
      fetchAds();
      fetchAnalytics();
    } catch (e) {
      showToast(e.response?.data?.message || "Failed to save ad", "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this ad permanently?")) return;
    try {
      await axios.delete(`${API}/admin/ads/${id}`, { headers: authHeader });
      showToast("Ad deleted");
      fetchAds();
      fetchAnalytics();
    } catch {
      showToast("Failed to delete", "error");
    }
  };

  // ── Toggle active ───────────────────────────────────────────────────────────
  const handleToggleActive = async (ad) => {
    try {
      await axios.patch(`${API}/admin/ads/${ad._id}`, { isActive: !ad.isActive }, { headers: authHeader });
      fetchAds();
    } catch {
      showToast("Failed to toggle", "error");
    }
  };

  // ── Quick approve ───────────────────────────────────────────────────────────
  const handleApprove = async (id) => {
    try {
      await axios.patch(`${API}/admin/ads/${id}`, { approvalStatus: "approved", isActive: true }, { headers: authHeader });
      showToast("Ad approved and live!");
      fetchAds();
      fetchAnalytics();
    } catch {
      showToast("Failed to approve", "error");
    }
  };

  // ── Apply template ──────────────────────────────────────────────────────────
  const applyTemplate = (template) => {
    if (!template) {
      setForm(f => ({ ...f, layoutConfig: defaultForm().layoutConfig, buttonStyle: defaultForm().buttonStyle }));
      return;
    }
    setForm(f => ({
      ...f,
      layoutConfig: { ...defaultForm().layoutConfig, ...template.layoutConfig },
      buttonStyle:  { ...defaultForm().buttonStyle,  ...template.buttonStyle  },
    }));
  };

  // ── Tabs ────────────────────────────────────────────────────────────────────
  const tabs = [
  { id: "templates",  label: "Templates",  icon: HiOutlineSparkles },
  { id: "media",      label: "Media",      icon: HiOutlinePhoto },
  { id: "layout",     label: "Layout",     icon: HiOutlineAdjustmentsHorizontal },
  { id: "button",     label: "Button",     icon: HiOutlineCursorArrowRipple },
  { id: "components", label: "Components", icon: HiOutlineSquare3Stack3D },
  { id: "schedule",   label: "Schedule",   icon: HiOutlineCalendarDays },
  { id: "advertiser", label: "Advertiser", icon: HiOutlineUser },
  { id: "requests",   label: "Ad Requests", icon: HiOutlineClipboardDocumentList }, // ADD THIS LINE
];

  // ── Status badge ────────────────────────────────────────────────────────────
  const StatusBadge = ({ ad }) => {
    const now    = new Date();
    const isLive = ad.isActive && ad.approvalStatus === "approved" && (!ad.endDate || new Date(ad.endDate) >= now);
    const color  = isLive ? "#22c55e" : ad.approvalStatus === "rejected" ? "#ef4444" : "#f59e0b";
    const label  = isLive ? "LIVE"    : ad.approvalStatus === "rejected" ? "REJECTED" : ad.isActive ? "PENDING" : "INACTIVE";
    return <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", background: `${color}22`, color }}>{label}</span>;
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#09090b", color: "#f4f4f5", fontFamily: "'Manrope', system-ui, sans-serif" }}>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, padding: "12px 20px", borderRadius: 10, background: toast.type === "error" ? "#450a0a" : "#052e16", border: `1px solid ${toast.type === "error" ? "#7f1d1d" : "#14532d"}`, color: toast.type === "error" ? "#fca5a5" : "#86efac", fontSize: 13, fontWeight: 600, boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div style={{ padding: "20px 24px", borderBottom: "1px solid #1c1c1e", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Ad Manager</h1>
          <p style={{ fontSize: 12, color: "#71717a", margin: "3px 0 0" }}>Create & manage banner advertisements</p>
        </div>
        <button onClick={openCreate} style={{ ...actionBtn, gap: 8 }}>
          <HiOutlinePlus style={{ fontSize: 16 }} /> New Ad
        </button>
      </div>

      {/* Analytics bar */}
      {analyticsData && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 1, borderBottom: "1px solid #1c1c1e" }}>
          {[
            { label: "Total",    value: analyticsData.totalAds,                   color: "#71717a" },
            { label: "Live",     value: analyticsData.activeAds,                  color: "#22c55e" },
            { label: "Pending",  value: analyticsData.pendingAds,                 color: "#f59e0b" },
            { label: "Rejected", value: analyticsData.rejectedAds,                color: "#ef4444" },
            { label: "Views",    value: analyticsData.totalViews?.toLocaleString(), color: "#818cf8" },
            { label: "CTR",      value: analyticsData.avgCTR,                     color: "#34d399" },
          ].map(item => (
            <div key={item.label} style={{ padding: "12px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: item.color }}>{item.value ?? "–"}</div>
              <div style={{ fontSize: 10, color: "#52525b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>{item.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── AD LIST ── */}
      {!showForm && (
        <div style={{ padding: 24 }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: 60, color: "#52525b" }}>Loading ads…</div>
          ) : ads.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60 }}>
              <FaAd style={{ fontSize: 40, color: "#27272a", display: "block", margin: "0 auto 12px" }} />
              <div style={{ color: "#71717a", fontSize: 14 }}>No ads yet. Create your first one.</div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
              {ads.map(ad => (
                <div key={ad._id} style={{ background: "#111113", border: "1px solid #1c1c1e", borderRadius: 14, overflow: "hidden" }}>
                  <div style={{ height: 100, background: "#18181b", position: "relative", overflow: "hidden" }}>
                    {ad.mediaUrl && (
                      ad.mediaType === "video"
                        ? <video src={repairUrl(ad.mediaUrl)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <img src={repairUrl(ad.mediaUrl)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    )}
                    <div style={{ position: "absolute", top: 8, left: 8 }}><StatusBadge ad={ad} /></div>
                    <div style={{ position: "absolute", top: 8, right: 8, padding: "2px 8px", borderRadius: 6, background: "rgba(0,0,0,0.6)", fontSize: 10, color: "#a1a1aa", fontWeight: 600 }}>{ad.mediaType?.toUpperCase()}</div>
                  </div>
                  <div style={{ padding: "12px 14px" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{ad.title}</div>
                    <div style={{ fontSize: 11, color: "#71717a", marginBottom: 10 }}>{ad.advertiserName}{ad.companyName ? ` · ${ad.companyName}` : ""}</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                      {(ad.displayLocations || []).map(loc => (
                        <span key={loc} style={{ padding: "2px 7px", borderRadius: 5, background: "#1e1e22", fontSize: 9, color: "#71717a", fontWeight: 600 }}>{loc.replace("_", " ").toUpperCase()}</span>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <button onClick={() => openEdit(ad)} style={{ ...secondaryBtn, flex: 1, justifyContent: "center", padding: "7px 0" }}>
                        <HiOutlinePencil style={{ fontSize: 13 }} /> Edit
                      </button>
                      {ad.approvalStatus !== "approved" && (
                        <button onClick={() => handleApprove(ad._id)} style={{ ...secondaryBtn, padding: "7px 12px", color: "#22c55e", borderColor: "#14532d" }} title="Approve">
                          <HiOutlineCheck style={{ fontSize: 13 }} />
                        </button>
                      )}
                      <button onClick={() => handleToggleActive(ad)} style={{ ...toggleBtn(ad.isActive), padding: "7px 12px" }}>
                        {ad.isActive ? <HiOutlineEyeSlash style={{ fontSize: 13 }} /> : <HiOutlineEye style={{ fontSize: 13 }} />}
                      </button>
                      <button onClick={() => handleDelete(ad._id)} style={{ ...secondaryBtn, padding: "7px 12px", color: "#ef4444", borderColor: "#450a0a" }}>
                        <HiOutlineTrash style={{ fontSize: 13 }} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── FORM EDITOR ── */}
      {showForm && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 420px", height: "calc(100vh - 120px)", overflow: "hidden" }}>

          {/* Left: Editor */}
          <div style={{ display: "flex", flexDirection: "column", borderRight: "1px solid #1c1c1e", overflow: "hidden" }}>
            {/* Tab bar */}
            <div style={{ display: "flex", borderBottom: "1px solid #1c1c1e", background: "#0c0c0e", overflowX: "auto" }}>
              {tabs.map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "11px 16px",
                  fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em",
                  cursor: "pointer", border: "none", whiteSpace: "nowrap",
                  background: activeTab === t.id ? "#111113" : "transparent",
                  color: activeTab === t.id ? "#818cf8" : "#52525b",
                  borderBottom: activeTab === t.id ? "2px solid #6366f1" : "2px solid transparent",
                }}>
                  <t.icon style={{ fontSize: 13 }} />{t.label}
                </button>
              ))}
              <div style={{ flex: 1 }} />
              <button onClick={() => setShowForm(false)} style={{ padding: "11px 16px", background: "none", border: "none", color: "#52525b", cursor: "pointer" }}>
                <HiOutlineXMark style={{ fontSize: 18 }} />
              </button>
            </div>

            {/* Tab content */}
            <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>

              {/* TEMPLATES */}
              {activeTab === "templates" && (
                <TemplateSelector
                  form={form}
                  localMediaUrl={localMediaUrl || (form.mediaType === "image" ? repairUrl(form.mediaUrl) : "")}
                  onApply={applyTemplate}
                />
              )}

              {/* MEDIA */}
              {activeTab === "media" && (
                <div>
                  <Section title="Primary Media">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      style={{ border: "2px dashed #27272a", borderRadius: 12, padding: "24px", textAlign: "center", cursor: "pointer", background: "#0c0c0e", marginBottom: 14, transition: "border-color 0.2s" }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = "#6366f1"}
                      onMouseLeave={e => e.currentTarget.style.borderColor = "#27272a"}
                    >
                      {localMediaUrl ? (
                        <div>
                          {form.mediaType === "video"
                            ? <video src={localMediaUrl} style={{ maxHeight: 140, borderRadius: 8, maxWidth: "100%" }} muted />
                            : <img src={localMediaUrl} style={{ maxHeight: 140, borderRadius: 8, maxWidth: "100%", objectFit: "contain" }} alt="" />
                          }
                          <div style={{ marginTop: 8, fontSize: 11, color: "#6366f1", fontWeight: 600 }}>Click to replace</div>
                        </div>
                      ) : form.mediaUrl ? (
                        <div>
                          {form.mediaType === "video"
                            ? <video src={repairUrl(form.mediaUrl)} style={{ maxHeight: 120, borderRadius: 8, maxWidth: "100%" }} muted />
                            : <img src={repairUrl(form.mediaUrl)} style={{ maxHeight: 120, borderRadius: 8, maxWidth: "100%", objectFit: "contain" }} alt="" />
                          }
                          <div style={{ marginTop: 8, fontSize: 11, color: "#71717a" }}>Click to replace</div>
                        </div>
                      ) : (
                        <div>
                          <HiOutlineCloudArrowUp style={{ fontSize: 32, color: "#3f3f46", display: "block", margin: "0 auto 8px" }} />
                          <div style={{ fontSize: 13, color: "#71717a", marginBottom: 4 }}>Click to upload image or video</div>
                          <div style={{ fontSize: 11, color: "#3f3f46" }}>JPG, PNG, MP4, MOV · Max 200MB</div>
                          <div style={{ fontSize: 10, color: "#27272a", marginTop: 6 }}>Upload happens ONLY when you click Publish</div>
                        </div>
                      )}
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={handleFilePick} style={{ display: "none" }} />
                  </Section>
                  <Section title="Crop to Banner Ratio">
                    <CropPanel localMediaUrl={localMediaUrl || (form.mediaType === "image" ? repairUrl(form.mediaUrl) : "")} form={form} onChange={(key, val) => setField(key, val)} />
                  </Section>
                  <Section title="Ad Content">
                    <div style={fieldGroup}><label style={labelStyle}>Title *</label><input value={form.title} onChange={e => setField("title", e.target.value)} style={inputStyle} placeholder="India's No 1 platform" /></div>
                    <div style={fieldGroup}><label style={labelStyle}>Tagline</label><input value={form.tagline} onChange={e => setField("tagline", e.target.value)} style={inputStyle} placeholder="Short punchy line" /></div>
                    <div style={fieldGroup}><label style={labelStyle}>Description (shown on banner)</label><textarea value={form.description} onChange={e => setField("description", e.target.value)} style={{ ...inputStyle, height: 64, resize: "vertical" }} placeholder="One line that fits the banner" /></div>
                    <div style={fieldGroup}><label style={labelStyle}>CTA Button Text</label><input value={form.ctaText} onChange={e => setField("ctaText", e.target.value)} style={inputStyle} placeholder="Learn More" maxLength={30} /></div>
                    <div style={fieldGroup}><label style={labelStyle}>Badge Text</label><input value={form.badge} onChange={e => setField("badge", e.target.value)} style={inputStyle} placeholder="SPONSOR" maxLength={20} /></div>
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

              {/* LAYOUT */}
              {activeTab === "layout" && (
                <div>
                  <Section title="Text Position">
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginBottom: 14 }}>
                      {[["tl","↖ Top Left"],["tc","↑ Top Center"],["tr","↗ Top Right"],["ml","← Mid Left"],["mc","⊙ Center"],["mr","→ Mid Right"],["bl","↙ Bot Left"],["bc","↓ Bot Center"],["br","↘ Bot Right"]].map(([pos, label]) => (
                        <button key={pos} onClick={() => setLayout("textPosition", pos)} style={{ ...toggleBtn(form.layoutConfig.textPosition === pos), fontSize: 10, padding: "7px 4px", textAlign: "center" }}>{label}</button>
                      ))}
                    </div>
                  </Section>
                  <Section title="Overlay Gradient">
                    <div style={fieldGroup}>
                      <label style={labelStyle}>Direction</label>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {["to-top","to-bottom","to-left","to-right","radial","none"].map(d => (
                          <button key={d} onClick={() => setLayout("overlayDirection", d)} style={{ ...toggleBtn(form.layoutConfig.overlayDirection === d), fontSize: 10 }}>{d}</button>
                        ))}
                      </div>
                    </div>
                    <div style={fieldGroup}><label style={labelStyle}>Opacity: {form.layoutConfig.overlayOpacity}%</label><input type="range" min={0} max={100} value={form.layoutConfig.overlayOpacity} onChange={e => setLayout("overlayOpacity", parseInt(e.target.value))} style={{ width: "100%", accentColor: "#6366f1" }} /></div>
                    <ColorInput label="Overlay Color" value={form.layoutConfig.overlayColor} onChange={v => setLayout("overlayColor", v)} />
                  </Section>
                  <Section title="Typography">
                    <div style={fieldGroup}>
                      <label style={labelStyle}>Title Size</label>
                      <div style={{ display: "flex", gap: 6 }}>{["sm","md","lg","xl"].map(s => <button key={s} onClick={() => setLayout("titleSize", s)} style={{ ...toggleBtn(form.layoutConfig.titleSize === s), flex: 1 }}>{s.toUpperCase()}</button>)}</div>
                    </div>
                    <div style={fieldGroup}>
                      <label style={labelStyle}>Title Weight</label>
                      <div style={{ display: "flex", gap: 6 }}>{["bold","extrabold","black"].map(w => <button key={w} onClick={() => setLayout("titleWeight", w)} style={{ ...toggleBtn(form.layoutConfig.titleWeight === w), flex: 1 }}>{w}</button>)}</div>
                    </div>
                    <ColorInput label="Title Color"       value={form.layoutConfig.titleColor} onChange={v => setLayout("titleColor", v)} />
                    <ColorInput label="Description Color" value={form.layoutConfig.descColor}  onChange={v => setLayout("descColor", v)} />
                  </Section>
                  <Section title="Badge">
                    <div style={fieldGroup}><label style={labelStyle}>Badge Text Override</label><input value={form.layoutConfig.badgeText} onChange={e => setLayout("badgeText", e.target.value)} style={inputStyle} placeholder="Leave blank to use Ad Badge field" /></div>
                    <ColorInput label="Badge Background" value={form.layoutConfig.badgeColor} onChange={v => setLayout("badgeColor", v)} />
                  </Section>
                  <Section title="Timing">
                    <div style={fieldGroup}><label style={labelStyle}>Slide Duration: {form.layoutConfig.slideDuration / 1000}s</label><input type="range" min={3000} max={15000} step={500} value={form.layoutConfig.slideDuration} onChange={e => setLayout("slideDuration", parseInt(e.target.value))} style={{ width: "100%", accentColor: "#6366f1" }} /></div>
                  </Section>
                </div>
              )}

              {/* BUTTON */}
              {activeTab === "button" && (
                <div>
                  <Section title="Button Style">
                    <div style={fieldGroup}>
                      <label style={labelStyle}>Variant</label>
                      <div style={{ display: "flex", gap: 6 }}>{["filled","outline","ghost"].map(v => <button key={v} onClick={() => setButton("variant", v)} style={{ ...toggleBtn(form.buttonStyle.variant === v), flex: 1, textTransform: "capitalize" }}>{v}</button>)}</div>
                    </div>
                    <div style={fieldGroup}>
                      <label style={labelStyle}>Corner Radius</label>
                      <div style={{ display: "flex", gap: 6 }}>{["sm","md","lg","full"].map(r => <button key={r} onClick={() => setButton("radius", r)} style={{ ...toggleBtn(form.buttonStyle.radius === r), flex: 1 }}>{r}</button>)}</div>
                    </div>
                  </Section>
                  <Section title="Colors">
                    <ColorInput label="Background Color" value={form.buttonStyle.bgColor}     onChange={v => setButton("bgColor", v)} />
                    <ColorInput label="Text Color"       value={form.buttonStyle.textColor}   onChange={v => setButton("textColor", v)} />
                    <ColorInput label="Border Color"     value={form.buttonStyle.borderColor} onChange={v => setButton("borderColor", v)} />
                  </Section>
                  <Section title="Icon">
                    <div style={fieldGroup}>
                      <label style={labelStyle}>Icon</label>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{["none","arrow","globe","instagram","chevron"].map(i => <button key={i} onClick={() => setButton("icon", i)} style={toggleBtn(form.buttonStyle.icon === i)}>{i}</button>)}</div>
                    </div>
                    <div style={fieldGroup}>
                      <label style={labelStyle}>Icon Position</label>
                      <div style={{ display: "flex", gap: 6 }}>{["left","right"].map(p => <button key={p} onClick={() => setButton("iconPosition", p)} style={{ ...toggleBtn(form.buttonStyle.iconPosition === p), flex: 1, textTransform: "capitalize" }}>{p}</button>)}</div>
                    </div>
                  </Section>
                  <Section title="Preview">
                    <div style={{ padding: 16, background: "#18181b", borderRadius: 10, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <button style={{ borderRadius: { sm: 6, md: 8, lg: 12, full: 999 }[form.buttonStyle.radius] || 8, display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", cursor: "pointer", background: form.buttonStyle.bgColor, color: form.buttonStyle.textColor, border: "none" }}>{form.ctaText || "Learn More"}</button>
                      <button style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: { sm: 6, md: 8, lg: 12, full: 999 }[form.buttonStyle.radius] || 8, background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: "9px", fontWeight: 700 }}>Details <HiArrowRight style={{ fontSize: 10 }} /></button>
                    </div>
                  </Section>
                </div>
              )}

              {/* COMPONENTS */}
              {activeTab === "components" && (
                <div>
                  <Section title="Banner Components">
                    <ToggleRow label="Badge Label"      value={form.layoutConfig.showBadge}       onChange={v => setLayout("showBadge", v)}       hint="The small pill label (SPONSOR / badge)" />
                    <ToggleRow label="Sponsor Tag"      value={form.layoutConfig.showSponsorTag}  onChange={v => setLayout("showSponsorTag", v)}  hint="The amber SPONSOR tag next to badge" />
                    <ToggleRow label="Description Text" value={form.layoutConfig.showDescription} onChange={v => setLayout("showDescription", v)} hint="Short description below title" />
                    <ToggleRow label="Progress Bar"     value={form.layoutConfig.showProgressBar} onChange={v => setLayout("showProgressBar", v)} hint="Slide timer bar at bottom" />
                    <ToggleRow label="Details Button"   value={form.layoutConfig.showDetailsBtn}  onChange={v => setLayout("showDetailsBtn", v)}  hint="Secondary 'Details →' button" />
                    <ToggleRow label="Mute Button"      value={form.layoutConfig.showMuteBtn}     onChange={v => setLayout("showMuteBtn", v)}     hint="Shown only for video ads" />
                  </Section>
                  <Section title="Display Settings">
                    <div style={fieldGroup}>
                      <label style={labelStyle}>Locations</label>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {["home_banner","reels_feed","explore_page"].map(loc => (
                          <button key={loc} onClick={() => {
                            const locs = form.displayLocations.includes(loc)
                              ? form.displayLocations.filter(l => l !== loc)
                              : [...form.displayLocations, loc];
                            setField("displayLocations", locs);
                          }} style={toggleBtn(form.displayLocations.includes(loc))}>{loc.replace("_", " ")}</button>
                        ))}
                      </div>
                    </div>
                    <ToggleRow label="Active"        value={form.isActive}  onChange={v => setField("isActive", v)}  hint="Show this ad to users" />
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
                      <div style={{ display: "flex", gap: 6 }}>{["low","medium","high","urgent"].map(p => <button key={p} onClick={() => setField("priority", p)} style={{ ...toggleBtn(form.priority === p), flex: 1, textTransform: "capitalize" }}>{p}</button>)}</div>
                    </div>
                    <div style={fieldGroup}><label style={labelStyle}>Admin Notes</label><textarea value={form.adminNotes} onChange={e => setField("adminNotes", e.target.value)} style={{ ...inputStyle, height: 64, resize: "vertical" }} placeholder="Internal notes…" /></div>
                  </Section>
                </div>
              )}

              {/* SCHEDULE */}
              {activeTab === "schedule" && (
                <div>
                  <Section title="Schedule">
                    <div style={fieldGroup}><label style={labelStyle}>Start Date & Time</label><input type="datetime-local" value={form.startDate} onChange={e => setField("startDate", e.target.value)} style={inputStyle} /></div>
                    <div style={fieldGroup}><label style={labelStyle}>End Date & Time</label><input type="datetime-local" value={form.endDate} onChange={e => setField("endDate", e.target.value)} style={inputStyle} /><div style={{ fontSize: 11, color: "#52525b", marginTop: 4 }}>Leave blank for no expiry</div></div>
                  </Section>
                  <Section title="Status Guide">
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {[
                        { color: "#22c55e", label: "LIVE",     desc: "Active + Approved + within date range" },
                        { color: "#f59e0b", label: "PENDING",  desc: "Active but waiting for approval" },
                        { color: "#71717a", label: "INACTIVE", desc: "isActive is off — not shown to users" },
                        { color: "#ef4444", label: "REJECTED", desc: "Admin rejected this ad" },
                      ].map(item => (
                        <div key={item.label} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                          <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 800, background: `${item.color}22`, color: item.color, flexShrink: 0 }}>{item.label}</span>
                          <span style={{ fontSize: 12, color: "#71717a" }}>{item.desc}</span>
                        </div>
                      ))}
                    </div>
                  </Section>
                </div>
              )}

              {/* ADVERTISER */}
              {activeTab === "advertiser" && (
                <div>
                  <Section title="Advertiser Details">
                    {[
                      { key: "advertiserName",  label: "Advertiser Name *", ph: "John Doe" },
                      { key: "advertiserEmail", label: "Email",             ph: "john@example.com" },
                      { key: "advertiserPhone", label: "Phone",             ph: "+91 98765 43210" },
                      { key: "companyName",     label: "Company Name",      ph: "Acme Corp" },
                    ].map(({ key, label, ph }) => (
                      <div key={key} style={fieldGroup}><label style={labelStyle}>{label}</label><input value={form[key]} onChange={e => setField(key, e.target.value)} style={inputStyle} placeholder={ph} /></div>
                    ))}
                  </Section>
                  <Section title="Long Description (Ad Details Page)">
                    <textarea value={form.longDescription} onChange={e => setField("longDescription", e.target.value)} style={{ ...inputStyle, height: 180, resize: "vertical" }} placeholder="Rich description shown on the ad details page…" />
                  </Section>
                </div>
              )}
              {/* AD REQUESTS */}
{activeTab === "requests" && (
  <AdRequestsTab API={API} authHeader={authHeader} showToast={showToast} />
)}

            </div>{/* end tab content */}

            {/* Publish footer */}
            <div style={{ padding: "14px 20px", borderTop: "1px solid #1c1c1e", display: "flex", gap: 10, alignItems: "center", background: "#0c0c0e" }}>
              <button onClick={handleSubmit} disabled={saving} style={{ ...actionBtn, flex: 1, justifyContent: "center", opacity: saving ? 0.6 : 1 }}>
                {saving
                  ? <><HiOutlineArrowPath style={{ fontSize: 16, animation: "spin 1s linear infinite" }} /> Uploading & Saving…</>
                  : <><HiOutlineCloudArrowUp style={{ fontSize: 16 }} /> {editingId ? "Save Changes" : "Publish Ad"}</>
                }
              </button>
              <button onClick={() => setShowForm(false)} style={secondaryBtn}>Cancel</button>
            </div>
          </div>

          {/* Right: Live preview */}
          <div style={{ background: "#0a0a0d", overflowY: "auto", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #1c1c1e" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.1em" }}>Live Preview</div>
            </div>
            <div style={{ padding: "24px 20px", flex: 1 }}>
              <LiveBannerPreview form={form} localMediaUrl={localMediaUrl} />
              <div style={{ marginTop: 20, padding: 14, background: "#111113", borderRadius: 10, border: "1px solid #1c1c1e" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Preview Notes</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {[
                    { icon: "⚡", text: "Preview updates live as you type" },
                    { icon: "✂️", text: "Crop is applied on the banner in production" },
                    { icon: "📱", text: "Rendered at exact 375×192px banner ratio" },
                    { icon: "☁️", text: "Media uploads to Cloudinary only on Publish" },
                  ].map(({ icon, text }) => (
                    <div key={text} style={{ fontSize: 11, color: "#71717a", display: "flex", gap: 6 }}><span>{icon}</span>{text}</div>
                  ))}
                </div>
              </div>
              <div style={{ marginTop: 12, padding: 14, background: "#111113", borderRadius: 10, border: "1px solid #1c1c1e" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Current Config</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  {[
                    { label: "Status",   value: form.isActive ? "Active" : "Inactive" },
                    { label: "Approval", value: form.approvalStatus },
                    { label: "Priority", value: form.priority },
                    { label: "Position", value: form.layoutConfig.textPosition?.toUpperCase() },
                    { label: "Overlay",  value: `${form.layoutConfig.overlayOpacity}%` },
                    { label: "Duration", value: `${form.layoutConfig.slideDuration / 1000}s` },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ fontSize: 11 }}>
                      <span style={{ color: "#52525b" }}>{label}: </span>
                      <span style={{ color: "#a1a1aa", fontWeight: 600 }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0c0c0e; }
        ::-webkit-scrollbar-thumb { background: #27272a; border-radius: 4px; }
      `}</style>
    </div>
  );
};

export default AdManagerPage;