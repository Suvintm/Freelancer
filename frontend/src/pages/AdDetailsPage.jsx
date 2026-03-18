import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiArrowLeft,
  HiSpeakerWave,
  HiSpeakerXMark,
  HiPlay,
  HiPause,
  HiOutlineGlobeAlt,
  HiOutlineCalendarDays,
  HiOutlineTag,
  HiOutlineCheckBadge,
  HiOutlineArrowTopRightOnSquare,
  HiOutlinePhoto,
  HiChevronLeft,
  HiChevronRight,
} from "react-icons/hi2";
import { FaInstagram, FaFacebook, FaYoutube } from "react-icons/fa";
import { useAppContext } from "../context/AppContext";
import axios from "axios";

// ─── URL repair (same as UnifiedBannerSlider) ────────────────────────────────
const repairUrl = (url) => {
  if (!url || typeof url !== "string") return url;
  if (!url.includes("cloudinary") && !url.includes("res_") && !url.includes("_com")) return url;
  let fixed = url;
  fixed = fixed.replace(/^(https?):?\/*_+/gi, "$1://");
  fixed = fixed.replace(/_+res_+cloudinary_+com/g, "res.cloudinary.com").replace(/res_cloudinary_com/g, "res.cloudinary.com");
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

// ─── Overlay gradient builder (mirrors UnifiedBannerSlider) ─────────────────
const buildOverlay = (lc = {}) => {
  const hexToRgba = (hex, opacity) => {
    try {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r},${g},${b},${(opacity / 100).toFixed(2)})`;
    } catch { return `rgba(4,4,8,${(opacity / 100).toFixed(2)})`; }
  };
  const color = lc.overlayColor || "#040408";
  const op = lc.overlayOpacity ?? 75;
  const dirs = {
    "to-top":    `linear-gradient(to top, ${hexToRgba(color, op)} 0%, ${hexToRgba(color, Math.round(op * 0.35))} 42%, transparent 75%)`,
    "to-bottom": `linear-gradient(to bottom, ${hexToRgba(color, op)} 0%, transparent 75%)`,
    "to-left":   `linear-gradient(to left, ${hexToRgba(color, op)} 0%, transparent 75%)`,
    "to-right":  `linear-gradient(to right, ${hexToRgba(color, op)} 0%, transparent 75%)`,
    "radial":    `radial-gradient(ellipse at center, transparent 30%, ${hexToRgba(color, op)} 100%)`,
    "none":      "none",
  };
  return dirs[lc.overlayDirection] || dirs["to-top"];
};

// ─── Banner Ad Preview (exact replica of live banner) ───────────────────────
const BannerAdPreview = ({ ad }) => {
  const lc = ad.layoutConfig || {};
  const bs = ad.buttonStyle || {};

  const resolvedLc = {
    textPosition: lc.textPosition ?? "bl",
    overlayDirection: lc.overlayDirection ?? "to-top",
    overlayOpacity: lc.overlayOpacity ?? 75,
    overlayColor: lc.overlayColor ?? "#040408",
    titleSize: lc.titleSize ?? "md",
    titleWeight: lc.titleWeight ?? "black",
    titleColor: lc.titleColor ?? "#ffffff",
    descColor: lc.descColor ?? "rgba(212,212,216,0.75)",
    showBadge: lc.showBadge ?? true,
    showSponsorTag: lc.showSponsorTag ?? true,
    showDescription: lc.showDescription ?? true,
    showProgressBar: lc.showProgressBar ?? true,
    badgeText: lc.badgeText ?? "",
    badgeColor: lc.badgeColor ?? "rgba(255,255,255,0.12)",
  };

  const resolvedBs = {
    variant: bs.variant ?? "filled",
    bgColor: bs.bgColor ?? "#ffffff",
    textColor: bs.textColor ?? "#000000",
    borderColor: bs.borderColor ?? "#ffffff",
    radius: bs.radius ?? "md",
    icon: bs.icon ?? "chevron",
    iconPosition: bs.iconPosition ?? "right",
  };

  const posMap = {
    tl: { justifyContent: "flex-start", alignItems: "flex-start" },
    tc: { justifyContent: "flex-start", alignItems: "center" },
    tr: { justifyContent: "flex-start", alignItems: "flex-end" },
    ml: { justifyContent: "center",     alignItems: "flex-start" },
    mc: { justifyContent: "center",     alignItems: "center" },
    mr: { justifyContent: "center",     alignItems: "flex-end" },
    bl: { justifyContent: "flex-end",   alignItems: "flex-start" },
    bc: { justifyContent: "flex-end",   alignItems: "center" },
    br: { justifyContent: "flex-end",   alignItems: "flex-end" },
  };
  const flex = posMap[resolvedLc.textPosition] || posMap["bl"];

  const titleFS = { sm: "13px", md: "16px", lg: "20px", xl: "24px" }[resolvedLc.titleSize] || "16px";
  const titleFW = { bold: 700, black: 900, extrabold: 800 }[resolvedLc.titleWeight] || 900;
  const rad = { sm: "6px", md: "8px", lg: "12px", full: "999px" }[resolvedBs.radius] || "8px";

  const btnStyle = (() => {
    const base = { display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", cursor: "pointer", borderRadius: rad, border: "none" };
    if (resolvedBs.variant === "filled")  return { ...base, background: resolvedBs.bgColor, color: resolvedBs.textColor };
    if (resolvedBs.variant === "outline") return { ...base, background: "transparent", color: resolvedBs.borderColor, border: `1.5px solid ${resolvedBs.borderColor}` };
    if (resolvedBs.variant === "ghost")   return { ...base, background: "rgba(255,255,255,0.1)", color: "#fff" };
    return base;
  })();

  const overlayBg = buildOverlay(resolvedLc);
  const mediaUrl = repairUrl(ad.mediaUrl);

  return (
    <div style={{ position: "relative", width: "100%", borderRadius: "1.5rem", overflow: "hidden", background: "#09090b", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 32px 64px rgba(0,0,0,0.7)" }}>
      {/* Aspect ratio: 375×192 */}
      <div style={{ paddingBottom: `${(192 / 375) * 100}%`, position: "relative" }}>
        <div style={{ position: "absolute", inset: 0 }}>
          {ad.mediaType === "video" ? (
            <video src={mediaUrl} autoPlay loop muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <img src={mediaUrl} alt={ad.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          )}
          {/* Overlay */}
          <div style={{ position: "absolute", inset: 0, background: overlayBg }} />
          {/* Progress bar */}
          {resolvedLc.showProgressBar && (
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: "rgba(255,255,255,0.08)" }}>
              <div style={{ width: "35%", height: "100%", background: "rgba(255,255,255,0.6)" }} />
            </div>
          )}
          {/* Content HUD */}
          <div style={{ position: "absolute", inset: 0, padding: "16px 16px 14px", display: "flex", flexDirection: "column", ...flex }}>
            {resolvedLc.showBadge && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 6, background: resolvedLc.badgeColor, backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.1)", fontSize: "7.5px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.16em", color: "#fff" }}>
                  {(resolvedLc.badgeText || ad.badge || "SPONSOR").toUpperCase()}
                </span>
                {resolvedLc.showSponsorTag && (
                  <span style={{ padding: "2px 6px", borderRadius: 6, background: "rgba(245,158,11,0.85)", fontSize: "6.5px", fontWeight: 900, textTransform: "uppercase", color: "#fff" }}>SPONSOR</span>
                )}
              </div>
            )}
            <h2 style={{ fontSize: titleFS, fontWeight: titleFW, color: resolvedLc.titleColor, lineHeight: 1.2, letterSpacing: "-0.02em", margin: "0 0 4px", textShadow: "0 2px 12px rgba(0,0,0,0.5)", maxWidth: "80%", textAlign: flex.alignItems === "flex-end" ? "right" : flex.alignItems === "center" ? "center" : "left" }}>
              {ad.title}
            </h2>
            {resolvedLc.showDescription && ad.description && (
              <p style={{ fontSize: "9.5px", color: resolvedLc.descColor, fontWeight: 500, lineHeight: 1.5, margin: "0 0 10px", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", maxWidth: "72%" }}>
                {ad.description || ad.tagline}
              </p>
            )}
            <button style={btnStyle} onClick={() => ad.links?.website && window.open(ad.links.website, "_blank")}>
              {ad.ctaText || "Learn More"} ›
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Gallery Viewer ──────────────────────────────────────────────────────────
const GalleryViewer = ({ images }) => {
  const [current, setCurrent] = useState(0);
  if (!images?.length) return null;

  return (
    <div>
      {/* Main image */}
      <div className="relative rounded-2xl overflow-hidden bg-zinc-900 border border-white/5" style={{ aspectRatio: "16/9" }}>
        <AnimatePresence mode="wait">
          <motion.img
            key={current}
            src={repairUrl(images[current])}
            alt=""
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="w-full h-full object-cover"
          />
        </AnimatePresence>
        {images.length > 1 && (
          <>
            <button onClick={() => setCurrent(p => (p - 1 + images.length) % images.length)} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-xl bg-black/50 backdrop-blur border border-white/10 text-white hover:bg-white hover:text-black transition-all">
              <HiChevronLeft className="text-sm" />
            </button>
            <button onClick={() => setCurrent(p => (p + 1) % images.length)} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-xl bg-black/50 backdrop-blur border border-white/10 text-white hover:bg-white hover:text-black transition-all">
              <HiChevronRight className="text-sm" />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
                <button key={i} onClick={() => setCurrent(i)} style={{ width: i === current ? 18 : 5, height: 5, borderRadius: 99, background: i === current ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.3)", transition: "all 0.2s" }} />
              ))}
            </div>
          </>
        )}
      </div>
      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 mt-3">
          {images.map((img, i) => (
            <button key={i} onClick={() => setCurrent(i)} className={`flex-1 rounded-xl overflow-hidden border-2 transition-all ${i === current ? "border-indigo-500" : "border-transparent opacity-50 hover:opacity-80"}`} style={{ aspectRatio: "16/9" }}>
              <img src={repairUrl(img)} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const AdDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { backendURL } = useAppContext();
  const [ad, setAd] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAd = async () => {
      try {
        const res = await axios.get(`${backendURL}/api/ads/${id}`);
        if (res.data.success && res.data.ad) {
          const a = res.data.ad;
          setAd({
            title:           a.title,
            description:     a.description || a.tagline || "",
            longDescription: a.longDescription || "",
            mediaUrl:        repairUrl(a.mediaUrl),
            mediaType:       a.mediaType,
            badge:           a.badge || "SPONSOR",
            ctaText:         a.ctaText || "Learn More",
            companyName:     a.companyName || a.advertiserName || "",
            advertiserName:  a.advertiserName || "",
            startDate:       a.startDate,
            endDate:         a.endDate,
            displayLocations: a.displayLocations || [],
            priority:        a.priority || "medium",
            layoutConfig:    a.layoutConfig || {},
            buttonStyle:     a.buttonStyle || {},
            gallery:         (a.galleryImages || []).map(repairUrl).filter(Boolean),
            links: {
              website:   a.websiteUrl   || null,
              instagram: a.instagramUrl || null,
              facebook:  a.facebookUrl  || null,
              youtube:   a.youtubeUrl   || null,
              other:     a.otherUrl     || null,
            },
          });
        }
      } catch (err) {
        console.error("Failed to fetch ad:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAd();
    window.scrollTo(0, 0);
  }, [id, backendURL]);

  if (loading) return (
    <div className="min-h-screen bg-[#070709] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
        <p className="text-zinc-600 text-sm font-medium tracking-wider uppercase">Loading</p>
      </div>
    </div>
  );

  if (!ad) return (
    <div className="min-h-screen bg-[#070709] flex items-center justify-center text-zinc-500 flex-col gap-4">
      <p className="text-lg font-semibold">Ad not found</p>
      <button onClick={() => navigate(-1)} className="text-sm text-indigo-400 hover:text-indigo-300 underline">Go back</button>
    </div>
  );

  const hasLinks = Object.values(ad.links).some(Boolean);
  const hasGallery = ad.gallery?.length > 0;
  const hasLongDesc = ad.longDescription?.trim().length > 0;

  const linkItems = [
    { key: "website",   label: "Official Website", icon: HiOutlineGlobeAlt,  href: ad.links.website,   color: "hover:bg-white hover:text-black",            bg: "bg-white/5" },
    { key: "instagram", label: "Instagram",         icon: FaInstagram,        href: ad.links.instagram, color: "hover:bg-[#E1306C] hover:border-[#E1306C]",  bg: "bg-[#E1306C]/10 border-[#E1306C]/20" },
    { key: "facebook",  label: "Facebook",          icon: FaFacebook,         href: ad.links.facebook,  color: "hover:bg-[#1877F2] hover:border-[#1877F2]",  bg: "bg-[#1877F2]/10 border-[#1877F2]/20" },
    { key: "youtube",   label: "YouTube",           icon: FaYoutube,          href: ad.links.youtube,   color: "hover:bg-[#FF0000] hover:border-[#FF0000]",  bg: "bg-[#FF0000]/10 border-[#FF0000]/20" },
    { key: "other",     label: "More Info",         icon: HiOutlineArrowTopRightOnSquare, href: ad.links.other, color: "hover:bg-zinc-700", bg: "bg-white/5" },
  ].filter(l => l.href);

  return (
    <div className="min-h-screen bg-[#070709] text-white" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[400px] rounded-full opacity-[0.04]" style={{ background: "radial-gradient(circle, #6366f1, transparent 70%)" }} />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full opacity-[0.03]" style={{ background: "radial-gradient(circle, #a855f7, transparent 70%)" }} />
      </div>

      {/* ── STICKY HEADER ── */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 py-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900/80 backdrop-blur-xl border border-white/8 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800/80 transition-all text-sm font-semibold"
        >
          <HiArrowLeft className="text-base" /> Back
        </button>
        <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900/80 backdrop-blur-xl border border-white/8 rounded-xl">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Sponsored</span>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-20">

        {/* ── BANNER AD DISPLAY — exact live banner replica ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8"
        >
          <BannerAdPreview ad={ad} />
        </motion.div>

        {/* ── TWO-COLUMN LAYOUT ── */}
        <div className="grid lg:grid-cols-[1fr_300px] gap-6">

          {/* ── LEFT: Main Content ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-5"
          >

            {/* Title card */}
            <div className="bg-zinc-900/60 border border-white/6 rounded-2xl p-6">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/25 text-amber-400 text-[10px] font-bold uppercase tracking-widest">
                    {ad.badge}
                  </span>
                  {ad.companyName && (
                    <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/8 text-zinc-400 text-[10px] font-semibold uppercase tracking-wider">
                      {ad.companyName}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400 flex-shrink-0">
                  <HiOutlineCheckBadge className="text-base" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Verified</span>
                </div>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight mb-3">
                {ad.title}
              </h1>
              {ad.description && (
                <p className="text-zinc-400 text-sm leading-relaxed">
                  {ad.description}
                </p>
              )}
            </div>

            {/* Long description */}
            {hasLongDesc && (
              <div className="bg-zinc-900/60 border border-white/6 rounded-2xl p-6">
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4">About this Ad</h3>
                <div className="text-zinc-300 text-sm leading-[1.8] whitespace-pre-line">
                  {ad.longDescription}
                </div>
              </div>
            )}

            {/* Gallery */}
            {hasGallery && (
              <div className="bg-zinc-900/60 border border-white/6 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <HiOutlinePhoto className="text-zinc-400 text-base" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Gallery</h3>
                </div>
                <GalleryViewer images={ad.gallery} />
              </div>
            )}

          </motion.div>

          {/* ── RIGHT: Sidebar ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-4"
          >

            {/* CTA button */}
            {ad.links.website && (
              <a href={ad.links.website} target="_blank" rel="noreferrer" className="block w-full py-4 text-center rounded-xl font-bold text-sm uppercase tracking-widest transition-all active:scale-95 hover:opacity-90" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", boxShadow: "0 8px 24px rgba(99,102,241,0.35)" }}>
                {ad.ctaText || "Visit Now"} →
              </a>
            )}

            {/* Ad details */}
            <div className="bg-zinc-900/60 border border-white/6 rounded-2xl p-5 space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-3">Ad Details</h4>
              {[
                { icon: HiOutlineTag, label: "Priority", value: ad.priority?.charAt(0).toUpperCase() + ad.priority?.slice(1), color: { urgent: "text-red-400", high: "text-orange-400", medium: "text-yellow-400", low: "text-zinc-400" }[ad.priority] || "text-zinc-400" },
                { icon: HiOutlineCalendarDays, label: "Runs until", value: ad.endDate ? new Date(ad.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "No expiry" },
                ...(ad.displayLocations?.length ? [{ icon: HiOutlineGlobeAlt, label: "Placement", value: ad.displayLocations.map(l => l.replace("_", " ")).join(", ") }] : []),
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-white/4 last:border-0">
                  <div className="flex items-center gap-2 text-zinc-500">
                    <Icon className="text-sm" />
                    <span className="text-xs font-medium">{label}</span>
                  </div>
                  <span className={`text-xs font-semibold capitalize ${color || "text-zinc-300"}`}>{value}</span>
                </div>
              ))}
            </div>

            {/* Links */}
            {linkItems.length > 0 && (
              <div className="bg-zinc-900/60 border border-white/6 rounded-2xl p-5">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-3">Connect</h4>
                <div className="space-y-2">
                  {linkItems.map(({ key, label, icon: Icon, href, color, bg }) => (
                    <a
                      key={key}
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      className={`flex items-center justify-between p-3 ${bg} border border-white/5 rounded-xl text-white text-xs font-semibold ${color} transition-all group`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="text-sm" />
                        {label}
                      </div>
                      <HiOutlineArrowTopRightOnSquare className="text-xs opacity-40 group-hover:opacity-100 transition-opacity" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Advertiser info */}
            {ad.advertiserName && (
              <div className="bg-zinc-900/60 border border-white/6 rounded-2xl p-5">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-3">Advertiser</h4>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center text-indigo-400 font-black text-sm">
                    {ad.advertiserName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-200">{ad.advertiserName}</p>
                    {ad.companyName && <p className="text-xs text-zinc-500">{ad.companyName}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Promote CTA */}
            <div className="bg-gradient-to-br from-indigo-950/50 to-purple-950/50 border border-indigo-500/15 rounded-2xl p-5 text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-1">Want to advertise?</p>
              <p className="text-[11px] text-zinc-500 mb-4 leading-relaxed">Reach thousands of video creators on SuviX</p>
              <button
                onClick={() => navigate("/contact")}
                className="w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/10 transition-all"
              >
                Contact Ad Team
              </button>
            </div>

          </motion.div>
        </div>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
      `}</style>
    </div>
  );
};

export default AdDetailsPage;