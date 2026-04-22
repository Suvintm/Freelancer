import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import UnifiedNavigation from "../components/UnifiedNavigation.jsx";
import { useAppContext } from "../context/AppContext";
import axios from "axios";
import {
  HiOutlineArrowRight, HiOutlineArrowLeft, HiOutlineCheckCircle,
  HiOutlineXMark, HiOutlinePhoto, HiOutlineVideoCamera,
  HiOutlineUser, HiOutlineEnvelope, HiOutlinePhone,
  HiOutlineRocketLaunch, HiOutlineBolt, HiOutlineCheck,
  HiOutlineClipboardDocumentCheck, HiOutlineBuildingOffice2,
  HiOutlineSparkles, HiOutlineChevronDown, HiOutlineChevronUp,
  HiOutlineEye,
} from "react-icons/hi2";
import {
  FaYoutube, FaInstagram, FaFacebook, FaGlobe,
  FaShoppingCart, FaGraduationCap, FaCalendarAlt, FaUserTie,
  FaChevronRight, FaAd,
} from "react-icons/fa";

// ─── Theme ────────────────────────────────────────────────────────────────────
const P = { mid: "#8b5cf6", light: "#a78bfa", bg: "rgba(139,92,246,0.1)", border: "rgba(139,92,246,0.3)" };
const G = { deep: "#16a34a", mid: "#22c55e", light: "#4ade80", bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.25)" };

// ─── Hardcoded Templates (admin-uploadable later) ─────────────────────────────
const BANNER_TEMPLATES = [
  {
    id: "bold-dark",
    name: "Bold Dark",
    layoutConfig: {
      textPosition: "bl", overlayDirection: "to-top", overlayOpacity: 88,
      overlayColor: "#040408", titleSize: "xl", titleWeight: "black",
      titleColor: "#ffffff", descColor: "rgba(212,212,216,0.8)",
      showBadge: true, showSponsorTag: true, showDescription: true,
      showProgressBar: true, badgeColor: "rgba(139,92,246,0.9)", badgeText: "",
    },
    buttonStyle: { variant: "filled", bgColor: "#ffffff", textColor: "#000000", borderColor: "#ffffff", radius: "md", icon: "chevron", iconPosition: "right" },
  },
  {
    id: "center-stage",
    name: "Center Stage",
    layoutConfig: {
      textPosition: "mc", overlayDirection: "radial", overlayOpacity: 80,
      overlayColor: "#040408", titleSize: "lg", titleWeight: "black",
      titleColor: "#ffffff", descColor: "rgba(255,255,255,0.65)",
      showBadge: true, showSponsorTag: false, showDescription: true,
      showProgressBar: false, badgeColor: "rgba(255,255,255,0.15)", badgeText: "",
    },
    buttonStyle: { variant: "outline", bgColor: "#fff", textColor: "#fff", borderColor: "#ffffff", radius: "full", icon: "arrow", iconPosition: "right" },
  },
  {
    id: "top-left",
    name: "Top Left",
    layoutConfig: {
      textPosition: "tl", overlayDirection: "to-bottom", overlayOpacity: 75,
      overlayColor: "#000000", titleSize: "md", titleWeight: "black",
      titleColor: "#ffffff", descColor: "rgba(255,255,255,0.6)",
      showBadge: true, showSponsorTag: false, showDescription: true,
      showProgressBar: true, badgeColor: "rgba(34,197,94,0.85)", badgeText: "",
    },
    buttonStyle: { variant: "filled", bgColor: "#22c55e", textColor: "#000000", borderColor: "#22c55e", radius: "md", icon: "chevron", iconPosition: "right" },
  },
  {
    id: "minimal",
    name: "Minimal",
    layoutConfig: {
      textPosition: "bl", overlayDirection: "to-top", overlayOpacity: 60,
      overlayColor: "#ffffff", titleSize: "sm", titleWeight: "bold",
      titleColor: "#0f172a", descColor: "rgba(30,41,59,0.7)",
      showBadge: false, showSponsorTag: false, showDescription: true,
      showProgressBar: false, badgeColor: "rgba(0,0,0,0.1)", badgeText: "",
    },
    buttonStyle: { variant: "filled", bgColor: "#0f172a", textColor: "#ffffff", borderColor: "#0f172a", radius: "full", icon: "none", iconPosition: "right" },
  },
  {
    id: "green-brand",
    name: "Green Brand",
    layoutConfig: {
      textPosition: "bl", overlayDirection: "to-top", overlayOpacity: 85,
      overlayColor: "#022c22", titleSize: "lg", titleWeight: "extrabold",
      titleColor: "#ecfdf5", descColor: "rgba(167,243,208,0.8)",
      showBadge: true, showSponsorTag: false, showDescription: true,
      showProgressBar: true, badgeColor: "rgba(34,197,94,0.9)", badgeText: "NEW",
    },
    buttonStyle: { variant: "filled", bgColor: "#22c55e", textColor: "#022c22", borderColor: "#22c55e", radius: "lg", icon: "arrow", iconPosition: "right" },
  },
  {
    id: "purple-neon",
    name: "Purple Neon",
    layoutConfig: {
      textPosition: "bc", overlayDirection: "radial", overlayOpacity: 82,
      overlayColor: "#0d0019", titleSize: "lg", titleWeight: "black",
      titleColor: "#f3e8ff", descColor: "rgba(196,181,253,0.8)",
      showBadge: true, showSponsorTag: true, showDescription: true,
      showProgressBar: true, badgeColor: "rgba(139,92,246,0.85)", badgeText: "",
    },
    buttonStyle: { variant: "outline", bgColor: "#8b5cf6", textColor: "#f3e8ff", borderColor: "#8b5cf6", radius: "full", icon: "arrow", iconPosition: "right" },
  },
];

const REELS_TEMPLATES = [
  {
    id: "reels-dark",
    name: "Dark Clean",
    overlayColor: "#000000", overlayOpacity: 80,
    badgeColor: "rgba(255,255,255,0.12)", badgeText: "SPONSORED",
    titleColor: "#ffffff", descColor: "rgba(255,255,255,0.6)",
    btnBg: "#ffffff", btnText: "#000000", btnRadius: "8px",
  },
  {
    id: "reels-green",
    name: "Green Bold",
    overlayColor: "#022c22", overlayOpacity: 85,
    badgeColor: "rgba(34,197,94,0.8)", badgeText: "SPONSORED",
    titleColor: "#ecfdf5", descColor: "rgba(167,243,208,0.7)",
    btnBg: "#22c55e", btnText: "#000000", btnRadius: "8px",
  },
  {
    id: "reels-purple",
    name: "Purple Glow",
    overlayColor: "#0d0019", overlayOpacity: 82,
    badgeColor: "rgba(139,92,246,0.85)", badgeText: "AD",
    titleColor: "#f3e8ff", descColor: "rgba(196,181,253,0.75)",
    btnBg: "#8b5cf6", btnText: "#ffffff", btnRadius: "999px",
  },
  {
    id: "reels-minimal",
    name: "Minimal White",
    overlayColor: "#ffffff", overlayOpacity: 55,
    badgeColor: "rgba(0,0,0,0.12)", badgeText: "SPONSOR",
    titleColor: "#0f172a", descColor: "rgba(15,23,42,0.65)",
    btnBg: "#0f172a", btnText: "#ffffff", btnRadius: "8px",
  },
];

// ─── Data ─────────────────────────────────────────────────────────────────────
const AD_TYPES = [
  { id: "youtube",    label: "YouTube Channel",     icon: FaYoutube,       desc: "Grow subscribers" },
  { id: "instagram",  label: "Instagram Page",      icon: FaInstagram,     desc: "Grow followers" },
  { id: "website",    label: "Website / Brand",     icon: FaGlobe,         desc: "Drive traffic" },
  { id: "app",        label: "Mobile App",          icon: HiOutlineBolt,   desc: "More installs" },
  { id: "course",     label: "Online Course",       icon: FaGraduationCap, desc: "Reach learners" },
  { id: "event",      label: "Event / Launch",      icon: FaCalendarAlt,   desc: "Promote events" },
  { id: "freelancer", label: "Freelancer / Editor", icon: FaUserTie,       desc: "Get clients" },
  { id: "ecommerce",  label: "E-commerce Store",    icon: FaShoppingCart,  desc: "Sell products" },
];
const PLACEMENTS = [
  { id: "home_banner", label: "Home Banner",     reach: "~10,000/day", desc: "Every homepage visitor" },
  { id: "reels_feed",  label: "Reels Feed",      reach: "~4,000/day",  desc: "Between reels" },
  { id: "both",        label: "Both Placements", reach: "~14,000/day", desc: "Full coverage", badge: "BEST VALUE" },
];
const DURATIONS = [
  { days: 1,  label: "1 Day",   prices: { home_banner: 499,  reels_feed: 299,  both: 699   } },
  { days: 3,  label: "3 Days",  prices: { home_banner: 1299, reels_feed: 799,  both: 1799  }, save: "14%" },
  { days: 7,  label: "7 Days",  prices: { home_banner: 2499, reels_feed: 1499, both: 3499  }, save: "29%", popular: true },
  { days: 15, label: "15 Days", prices: { home_banner: 4499, reels_feed: 2799, both: 6499  }, save: "39%" },
  { days: 30, label: "30 Days", prices: { home_banner: 7999, reels_feed: 4999, both: 11499 }, save: "45%" },
];
const TYPE_LINKS = {
  youtube:    [{ key: "youtubeUrl",   label: "YouTube Channel URL",       ph: "https://youtube.com/@yourchannel",  icon: FaYoutube,   required: true }],
  instagram:  [{ key: "instagramUrl", label: "Instagram Profile URL",     ph: "https://instagram.com/yourhandle",  icon: FaInstagram, required: true }],
  website:    [{ key: "websiteUrl",   label: "Website URL",               ph: "https://yourwebsite.com",           icon: FaGlobe,     required: true },
               { key: "facebookUrl",  label: "Facebook Page (optional)",  ph: "https://facebook.com/yourpage",     icon: FaFacebook }],
  app:        [{ key: "websiteUrl",   label: "App Store / Play Store URL",ph: "https://play.google.com/...",       icon: FaGlobe,     required: true }],
  course:     [{ key: "websiteUrl",   label: "Course URL",                ph: "https://udemy.com/your-course",     icon: FaGlobe,     required: true }],
  event:      [{ key: "websiteUrl",   label: "Event / Registration URL",  ph: "https://yourregistration.com",      icon: FaGlobe,     required: true }],
  freelancer: [{ key: "websiteUrl",   label: "Portfolio URL",             ph: "https://yourportfolio.com",         icon: FaGlobe,     required: true },
               { key: "instagramUrl", label: "Instagram (optional)",      ph: "https://instagram.com/yourhandle",  icon: FaInstagram }],
  ecommerce:  [{ key: "websiteUrl",   label: "Store URL",                 ph: "https://yourstore.com",             icon: FaGlobe,     required: true }],
};
const CTA_SUGGESTIONS = {
  youtube: ["Subscribe Now","Watch Now","Join Channel"],
  instagram: ["Follow Us","See More","Visit Profile"],
  website: ["Visit Now","Learn More","Explore"],
  app: ["Download Free","Get the App","Install Now"],
  course: ["Enroll Now","Start Learning","View Course"],
  event: ["Register Now","Get Tickets","Join Event"],
  freelancer: ["Hire Me","View Portfolio","Get Quote"],
  ecommerce: ["Shop Now","Browse Store","Get Deal"],
};
const STEPS = ["Type","Placement","Creative","Details","Review"];

// ─── Shared UI ────────────────────────────────────────────────────────────────
const inputCls = (err) =>
  `w-full bg-[#0a0a0a] border ${err ? "border-red-900/60" : "border-white/8"} rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/25 transition-colors`;

const Field = ({ label, required, error, hint, children }) => (
  <div className="space-y-1.5">
    <label className="block text-[11px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.32)" }}>
      {label}{required && <span className="ml-1" style={{ color: P.light }}>*</span>}
    </label>
    {children}
    {hint && !error && <p className="text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.2)" }}>{hint}</p>}
    {error && <p className="text-[11px] font-semibold" style={{ color: "#f87171" }}>{error}</p>}
  </div>
);

const StepBar = ({ current }) => (
  <div className="flex items-center justify-center gap-0">
    {STEPS.map((label, i) => (
      <React.Fragment key={label}>
        <div className="flex flex-col items-center">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 transition-all"
            style={i < current ? { background: P.mid, borderColor: P.mid, color: "#fff" }
              : i === current ? { background: "transparent", borderColor: P.light, color: P.light }
              : { background: "transparent", borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.2)" }}>
            {i < current ? <HiOutlineCheck className="text-[9px]" /> : i + 1}
          </div>
          <span className="text-[8px] mt-1 font-bold uppercase tracking-wider hidden sm:block"
            style={{ color: i === current ? P.light : i < current ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.15)" }}>
            {label}
          </span>
        </div>
        {i < STEPS.length - 1 && (
          <div className="h-px w-5 sm:w-8 mx-1 mb-2.5 transition-all"
            style={{ background: i < current ? P.mid : "rgba(255,255,255,0.07)" }} />
        )}
      </React.Fragment>
    ))}
  </div>
);

// ─── Banner Preview (375×192) ─────────────────────────────────────────────────
const BannerPreview = ({ form, template }) => {
  const lc = template?.layoutConfig || {};
  const bs = template?.buttonStyle || {};
  const mediaUrl = form.localMediaUrl || null;

  const posMap = {
    tl: { alignItems:"flex-start", justifyContent:"flex-start" },
    tc: { alignItems:"center",     justifyContent:"flex-start" },
    tr: { alignItems:"flex-end",   justifyContent:"flex-start" },
    ml: { alignItems:"flex-start", justifyContent:"center" },
    mc: { alignItems:"center",     justifyContent:"center" },
    mr: { alignItems:"flex-end",   justifyContent:"center" },
    bl: { alignItems:"flex-start", justifyContent:"flex-end" },
    bc: { alignItems:"center",     justifyContent:"flex-end" },
    br: { alignItems:"flex-end",   justifyContent:"flex-end" },
  };
  const pos = posMap[lc.textPosition] || posMap["bl"];

  const hexToRgba = (hex, op) => {
    try {
      const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
      return `rgba(${r},${g},${b},${(op/100).toFixed(2)})`;
    } catch { return `rgba(4,4,8,${(op/100).toFixed(2)})`; }
  };

  const overlayGradient = (() => {
    const c = lc.overlayColor || "#040408";
    const op = lc.overlayOpacity ?? 75;
    const dirs = {
      "to-top":    `linear-gradient(to top, ${hexToRgba(c,op)} 0%, ${hexToRgba(c,Math.round(op*0.4))} 42%, transparent 75%)`,
      "to-bottom": `linear-gradient(to bottom, ${hexToRgba(c,op)} 0%, transparent 75%)`,
      "to-left":   `linear-gradient(to left, ${hexToRgba(c,op)} 0%, transparent 75%)`,
      "to-right":  `linear-gradient(to right, ${hexToRgba(c,op)} 0%, transparent 75%)`,
      "radial":    `radial-gradient(ellipse at center, transparent 30%, ${hexToRgba(c,op)} 100%)`,
      "none":      "none",
    };
    return dirs[lc.overlayDirection] || dirs["to-top"];
  })();

  const titleFS   = { sm:"11px", md:"14px", lg:"17px", xl:"20px" }[lc.titleSize] || "14px";
  const titleFW   = { bold:700, black:900, extrabold:800 }[lc.titleWeight] || 900;
  const btnRadius = { sm:"5px", md:"7px", lg:"10px", full:"999px" }[bs.radius] || "7px";
  const btnStyle  = bs.variant === "filled" ? { background: bs.bgColor, color: bs.textColor }
    : bs.variant === "outline" ? { background: "transparent", color: bs.borderColor, border: `1.5px solid ${bs.borderColor}` }
    : { background: "rgba(255,255,255,0.1)", color: "#fff" };

  return (
    <div style={{ position:"relative", width:"100%", aspectRatio:"375/192", borderRadius:12, overflow:"hidden", background:"#141414", border:"1px solid rgba(255,255,255,0.08)" }}>
      {mediaUrl ? (
        form.mediaType === "video"
          ? <video src={mediaUrl} autoPlay loop muted playsInline style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }} />
          : <img src={mediaUrl} alt="" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }} />
      ) : (
        <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:4 }}>
          <HiOutlinePhoto style={{ fontSize:20, color:"rgba(255,255,255,0.08)" }} />
          <span style={{ fontSize:9, color:"rgba(255,255,255,0.12)" }}>Upload media to see preview</span>
        </div>
      )}
      <div style={{ position:"absolute", inset:0, background:overlayGradient }} />
      <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", padding:"12px 12px 10px", justifyContent:pos.justifyContent, alignItems:pos.alignItems }}>
        {lc.showBadge && (
          <div style={{ display:"flex", alignItems:"center", gap:4, marginBottom:5 }}>
            <span style={{ display:"inline-flex", alignItems:"center", gap:3, padding:"2px 6px", borderRadius:4, background:lc.badgeColor||"rgba(255,255,255,0.12)", fontSize:"6px", fontWeight:900, textTransform:"uppercase", letterSpacing:"0.12em", color:"#fff" }}>
              <FaAd style={{ fontSize:7, color:"#fbbf24" }} />
              {(lc.badgeText || form.badge || "SPONSOR").toUpperCase()}
            </span>
            {lc.showSponsorTag && <span style={{ padding:"2px 5px", borderRadius:4, background:"rgba(245,158,11,0.8)", fontSize:"5.5px", fontWeight:900, textTransform:"uppercase", color:"#fff" }}>SPONSOR</span>}
          </div>
        )}
        <h2 style={{ fontSize:titleFS, fontWeight:titleFW, color:lc.titleColor||"#fff", lineHeight:1.2, margin:"0 0 3px", maxWidth:"80%", textAlign: pos.alignItems==="flex-end"?"right":pos.alignItems==="center"?"center":"left" }}>
          {form.title || "Your Ad Title"}
        </h2>
        {lc.showDescription && (
          <p style={{ fontSize:"8px", color:lc.descColor||"rgba(212,212,216,0.75)", margin:"0 0 7px", overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis", maxWidth:"72%" }}>
            {form.description || "Your description here"}
          </p>
        )}
        <div style={{ display:"flex", alignItems:"center", gap:5 }}>
          <button style={{ ...btnStyle, borderRadius:btnRadius, padding:"5px 10px", fontSize:"8px", fontWeight:800, textTransform:"uppercase", letterSpacing:"0.08em", border:bs.variant==="outline"?`1.5px solid ${bs.borderColor}`:"none" }}>
            {form.ctaText || "Learn More"} {bs.icon !== "none" && "→"}
          </button>
        </div>
      </div>
      {lc.showProgressBar && (
        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:2, background:"rgba(255,255,255,0.06)" }}>
          <div style={{ width:"40%", height:"100%", background:"rgba(255,255,255,0.4)" }} />
        </div>
      )}
    </div>
  );
};

// ─── Reels Card Preview (9:16 vertical) ───────────────────────────────────────
const ReelsPreview = ({ form, template }) => {
  const t = template || REELS_TEMPLATES[0];
  const mediaUrl = form.localMediaUrl || null;

  const hexToRgba = (hex, op) => {
    try {
      const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
      return `rgba(${r},${g},${b},${(op/100).toFixed(2)})`;
    } catch { return `rgba(0,0,0,${(op/100).toFixed(2)})`; }
  };

  return (
    <div style={{ position:"relative", width:"100%", maxWidth:110, aspectRatio:"9/16", borderRadius:12, overflow:"hidden", background:"#141414", border:"1px solid rgba(255,255,255,0.08)", margin:"0 auto" }}>
      {mediaUrl ? (
        form.mediaType === "video"
          ? <video src={mediaUrl} autoPlay loop muted playsInline style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }} />
          : <img src={mediaUrl} alt="" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }} />
      ) : (
        <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:4 }}>
          <HiOutlineVideoCamera style={{ fontSize:16, color:"rgba(255,255,255,0.08)" }} />
          <span style={{ fontSize:7, color:"rgba(255,255,255,0.12)", textAlign:"center", padding:"0 8px" }}>Upload media</span>
        </div>
      )}
      <div style={{ position:"absolute", inset:0, background:`linear-gradient(to top, ${hexToRgba(t.overlayColor, t.overlayOpacity)} 0%, transparent 60%)` }} />
      <div style={{ position:"absolute", top:6, left:6 }}>
        <span style={{ display:"block", padding:"2px 5px", borderRadius:3, background:t.badgeColor, fontSize:"5.5px", fontWeight:900, textTransform:"uppercase", letterSpacing:"0.1em", color:"#fff" }}>{t.badgeText}</span>
      </div>
      <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"0 8px 8px" }}>
        <p style={{ fontSize:"9px", fontWeight:900, color:t.titleColor, marginBottom:2, lineHeight:1.2 }}>{form.title || "Your Channel"}</p>
        <p style={{ fontSize:"7px", color:t.descColor, marginBottom:6 }}>{form.description || "Your description"}</p>
        <button style={{ padding:"4px 10px", borderRadius:t.btnRadius, background:t.btnBg, color:t.btnText, fontSize:"7px", fontWeight:800, textTransform:"uppercase", border:"none" }}>
          {form.ctaText || "Subscribe"}
        </button>
      </div>
    </div>
  );
};

// ─── Template Picker ──────────────────────────────────────────────────────────
const TemplatePicker = ({ type, templates, selectedId, onSelect, form }) => {
  const isBanner = type === "banner";
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest mb-2 px-1" style={{ color:"rgba(255,255,255,0.25)" }}>
        {isBanner ? "Banner" : "Reels Card"} Templates
      </p>
      <div 
        className="flex overflow-x-auto pb-4 gap-3 no-scrollbar snap-x"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {templates.map(t => {
          const sel = selectedId === t.id;
          return (
            <button key={t.id} onClick={() => onSelect(t.id)}
              className="relative group flex-shrink-0 snap-start"
              style={{ outline:"none", width: isBanner ? "120px" : "70px" }}>
              <div style={{ borderRadius:8, overflow:"hidden", border:sel ? `2px solid ${P.light}` : "2px solid rgba(255,255,255,0.08)", transition:"border-color 0.15s", boxShadow: sel ? `0 0 0 1px ${P.mid}40` : "none" }}>
                {isBanner
                  ? <BannerPreview form={form} template={t} />
                  : <ReelsPreview form={form} template={t} />
                }
              </div>
              <div className="flex items-center justify-between mt-1 px-1">
                <span style={{ fontSize:8, fontWeight:700, color: sel ? P.light : "rgba(255,255,255,0.4)", display:"block", overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>
                  {t.name}
                </span>
                {sel && <div className="w-2.5 h-2.5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background:P.mid }}>
                  <HiOutlineCheck style={{ fontSize:5, color:"#fff" }} />
                </div>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ─── Sticky Preview Panel ─────────────────────────────────────────────────────
const StickyPreview = ({ form, bannerTemplateId, reelsTemplateId, onBannerTemplate, onReelsTemplate }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const showReels  = form.placement === "reels_feed" || form.placement === "both";
  const showBanner = form.placement === "home_banner" || form.placement === "both";
  
  const [activePreview, setActivePreview] = useState(showReels ? "reels" : "banner");

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (activePreview === "reels" && !showReels) setActivePreview("banner");
    if (activePreview === "banner" && !showBanner) setActivePreview("reels");
  }, [showReels, showBanner]);

  const bannerTpl  = BANNER_TEMPLATES.find(t => t.id === bannerTemplateId) || BANNER_TEMPLATES[0];
  const reelsTpl   = REELS_TEMPLATES.find(t => t.id === reelsTemplateId)   || REELS_TEMPLATES[0];

  const hasBoth = showBanner && showReels;

  return (
    <div className="lg:border-0 border-b overflow-hidden" style={{ background:"#000", borderColor:"rgba(255,255,255,0.07)" }}>
      {/* Preview header row */}
      <div className="flex items-center justify-between px-4 py-2 lg:hidden">
        <div className="flex items-center gap-2">
          <HiOutlineEye style={{ fontSize:13, color: P.light }} />
          <span className="text-xs font-bold" style={{ color:"rgba(255,255,255,0.5)" }}>Live Preview</span>
          {hasBoth && (
            <div className="flex items-center gap-1.5 ml-2 p-0.5 rounded-full bg-white/5 border border-white/10">
              <button onClick={() => setActivePreview("banner")} className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${activePreview === "banner" ? "bg-white/10 text-white" : "text-white/20"}`}><HiOutlinePhoto className="text-[10px]" /></button>
              <button onClick={() => setActivePreview("reels")} className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${activePreview === "reels" ? "bg-white/10 text-white" : "text-white/20"}`}><HiOutlineVideoCamera className="text-[10px]" /></button>
            </div>
          )}
        </div>
        <button onClick={() => setCollapsed(c => !c)}
          className="flex items-center gap-1 text-[11px] font-semibold transition-colors"
          style={{ color:"rgba(255,255,255,0.3)" }}>
          {collapsed ? <><HiOutlineChevronDown className="text-sm" /> Show</> : <><HiOutlineChevronUp className="text-sm" /> Hide</>}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {(!collapsed || isDesktop) && (
          <motion.div initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }} exit={{ height:0, opacity:0 }} transition={{ duration:0.2 }}
            className="overflow-hidden lg:h-auto! lg:opacity-100!">
            <div className="px-4 pb-4 lg:p-0">
              <div className="hidden lg:flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: P.bg, border: `1px solid ${P.border}` }}>
                    <HiOutlineEye style={{ fontSize:15, color: P.light }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">Ad Preview</h3>
                    <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>Updates instantly as you edit</p>
                  </div>
                </div>
                {hasBoth && (
                  <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/8">
                    <button onClick={() => setActivePreview("banner")} 
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${activePreview === "banner" ? "bg-white/10 text-white" : "text-white/25 hover:text-white/40"}`}>BANNER</button>
                    <button onClick={() => setActivePreview("reels")} 
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${activePreview === "reels" ? "bg-white/10 text-white" : "text-white/25 hover:text-white/40"}`}>REELS</button>
                  </div>
                )}
              </div>

              {/* Previews CAROUSEL/STACK */}
              <div className="relative mb-10">
                <AnimatePresence mode="wait">
                  {activePreview === "banner" ? (
                    <motion.div key="banner" initial={{ opacity:0, scale:0.95, x:10 }} animate={{ opacity:1, scale:1, x:0 }} exit={{ opacity:0, scale:0.95, x:-10 }} transition={{ duration:0.2 }}>
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color:"rgba(255,255,255,0.25)" }}>Home Banner · 375×192</p>
                      <BannerPreview form={form} template={bannerTpl} />
                    </motion.div>
                  ) : (
                    <motion.div key="reels" initial={{ opacity:0, scale:0.95, x:10 }} animate={{ opacity:1, scale:1, x:0 }} exit={{ opacity:0, scale:0.95, x:-10 }} transition={{ duration:0.2 }}>
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color:"rgba(255,255,255,0.25)" }}>Reels Card · 9:16</p>
                      <div className="flex justify-center lg:justify-start">
                        <div className="w-[180px] lg:w-[160px]">
                          <ReelsPreview form={form} template={reelsTpl} />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Secondary Small Preview Hint (Desktop only) */}
                {isDesktop && hasBoth && (
                  <div className="absolute top-12 -right-4 w-24 opacity-30 blur-[1px] transform rotate-3 pointer-events-none hidden xl:block">
                     {activePreview === "banner" ? <ReelsPreview form={form} template={reelsTpl} /> : <BannerPreview form={form} template={bannerTpl} />}
                  </div>
                )}
                
                {/* Navigation Dots for Mobile */}
                {hasBoth && !isDesktop && (
                  <div className="flex justify-center gap-1.5 mt-4">
                    <button onClick={() => setActivePreview("banner")} className={`w-1.5 h-1.5 rounded-full transition-all ${activePreview === "banner" ? "bg-white w-4" : "bg-white/20"}`} />
                    <button onClick={() => setActivePreview("reels")} className={`w-1.5 h-1.5 rounded-full transition-all ${activePreview === "reels" ? "bg-white w-4" : "bg-white/20"}`} />
                  </div>
                )}
              </div>

              {/* Template pickers */}
              <div className="space-y-8 pt-6 border-t lg:border-t-0" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                {activePreview === "banner" && showBanner && (
                  <TemplatePicker type="banner" templates={BANNER_TEMPLATES} selectedId={bannerTemplateId} onSelect={onBannerTemplate} form={form} />
                )}
                {activePreview === "reels" && showReels && (
                  <TemplatePicker type="reels" templates={REELS_TEMPLATES} selectedId={reelsTemplateId} onSelect={onReelsTemplate} form={form} />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const AdvertiseNewPage = () => {
  const navigate   = useNavigate();
  const location   = useLocation();
  const { backendURL, user } = useAppContext();
  const fileInputRef = useRef(null);
  const prefill    = location.state || {};

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [step, setStep]               = useState(0);
  const [saving, setSaving]           = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [errors, setErrors]           = useState({});
  const [bannerTemplateId, setBannerTemplateId] = useState(BANNER_TEMPLATES[0].id);
  const [reelsTemplateId, setReelsTemplateId]   = useState(REELS_TEMPLATES[0].id);

  const [form, setForm] = useState({
    adType: "", placement: prefill.placement || "home_banner", days: prefill.days || 7,
    title: "", description: "", ctaText: "", badge: "SPONSOR",
    mediaFile: null, localMediaUrl: "", mediaType: "image",
    youtubeUrl: "", instagramUrl: "", facebookUrl: "", websiteUrl: "", otherUrl: "",
    additionalNotes: "",
    advertiserName: user?.name || "", advertiserEmail: user?.email || "",
    advertiserPhone: "", companyName: "", suvixUserId: user?._id || "",
    agreeTerms: false,
  });

  const setField    = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const clearError  = (k)    => setErrors(e => { const n = { ...e }; delete n[k]; return n; });

  useEffect(() => {
    if (user) { setField("advertiserName", user.name||""); setField("advertiserEmail", user.email||""); setField("suvixUserId", user._id||""); }
  }, [user]);

  useEffect(() => {
    if (form.adType && CTA_SUGGESTIONS[form.adType]) setField("ctaText", CTA_SUGGESTIONS[form.adType][0]);
  }, [form.adType]);

  const price = DURATIONS.find(d => d.days === form.days)?.prices[form.placement] || 0;

  const handleFilePick = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setField("mediaFile", file); setField("localMediaUrl", URL.createObjectURL(file));
    setField("mediaType", file.type.startsWith("video/") ? "video" : "image");
    clearError("mediaFile"); e.target.value = "";
  };

  const validate = () => {
    const e = {};
    if (step === 0 && !form.adType) e.adType = "Select an ad type";
    if (step === 1) { if (!form.placement) e.placement = "Select placement"; if (!form.days) e.days = "Select duration"; }
    if (step === 2) {
      if (!form.title.trim()) e.title = "Title required";
      if (!form.description.trim()) e.description = "Description required";
      if (!form.ctaText.trim()) e.ctaText = "CTA text required";
      if (!form.mediaFile && !form.localMediaUrl) e.mediaFile = "Upload banner image or video";
      (TYPE_LINKS[form.adType]?.filter(l => l.required)||[]).forEach(l => { if (!form[l.key]?.trim()) e[l.key] = `${l.label} required`; });
    }
    if (step === 3) {
      if (!form.advertiserName.trim()) e.advertiserName = "Name required";
      if (!form.advertiserEmail.trim()) e.advertiserEmail = "Email required";
      else if (!/\S+@\S+\.\S+/.test(form.advertiserEmail)) e.advertiserEmail = "Enter valid email";
      if (!form.advertiserPhone.trim()) e.advertiserPhone = "Phone required";
      if (!form.agreeTerms) e.agreeTerms = "You must agree to continue";
    }
    setErrors(e); return Object.keys(e).length === 0;
  };

  const next = () => { if (validate()) setStep(s => Math.min(s+1,4)); };
  const prev = () => setStep(s => Math.max(s-1,0));

  const handleSubmit = async () => {
    if (!validate()) return; setSaving(true);
    try {
      const fd = new FormData();
      if (form.mediaFile) fd.append("media", form.mediaFile);
      ["adType","placement","title","description","ctaText","badge","mediaType","youtubeUrl","instagramUrl","facebookUrl","websiteUrl","otherUrl","advertiserName","advertiserEmail","advertiserPhone","companyName","suvixUserId","additionalNotes"]
        .forEach(k => { if (form[k]) fd.append(k, form[k]); });
      fd.append("days", form.days); fd.append("requestedPrice", price);
      fd.append("bannerTemplateId", bannerTemplateId);
      fd.append("reelsTemplateId",  reelsTemplateId);
      if (user?._id) fd.append("userId", user._id);
      const token = user?.token || JSON.parse(localStorage.getItem("user")||"{}")?.token;
      const { data } = await axios.post(`${backendURL}/api/ad-requests`, fd, {
        headers: { "Content-Type": "multipart/form-data", ...(token ? { Authorization:`Bearer ${token}` } : {}) },
      });
      setSubmitResult(data);
    } catch (err) {
      setErrors({ submit: err.response?.data?.message || "Submission failed. Please try again." });
    } finally { setSaving(false); }
  };


  if (submitResult) return (
    <div className="min-h-screen bg-black text-white flex flex-col md:flex-row">
      <UnifiedNavigation sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <main className="flex-1 md:ml-64 md:mt-16 flex items-center justify-center px-4 py-16">
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} className="max-w-sm w-full">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background:G.bg, border:`1px solid ${G.border}` }}>
            <HiOutlineCheckCircle className="text-2xl" style={{ color:G.light }} />
          </div>
          <h1 className="text-xl font-black text-white text-center mb-1">Request Submitted!</h1>
          <p className="text-sm text-center mb-5" style={{ color:"rgba(255,255,255,0.35)" }}>Your ad is in the review queue.</p>

          {submitResult.requestId && (
            <div className="flex items-center justify-between px-4 py-3 rounded-xl mb-4" style={{ background:P.bg, border:`1px solid ${P.border}` }}>
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color:P.light+"80" }}>Request ID</span>
              <span className="text-sm font-black font-mono" style={{ color:P.light }}>{submitResult.requestId}</span>
            </div>
          )}

          {/* Refund notice */}
          <div className="p-3.5 rounded-xl mb-4 border" style={{ background:"rgba(245,158,11,0.06)", borderColor:"rgba(245,158,11,0.25)" }}>
            <p className="text-xs font-bold mb-1" style={{ color:"#fbbf24" }}>💰 Payment & Refund Policy</p>
            <p className="text-[11px] leading-relaxed" style={{ color:"rgba(255,255,255,0.45)" }}>
              Once approved, you'll receive a payment link. If our team does not respond within <strong className="text-white/70">7 days</strong>, your payment will be fully refunded automatically.
            </p>
          </div>

          <div className="rounded-xl overflow-hidden border border-white/8 mb-4">
            {[
              { n:"1", text:"Team reviews within 24–48 hours" },
              { n:"2", text:"Approval email + payment link sent" },
              { n:"3", text:"Pay to confirm your campaign" },
              { n:"4", text:"Campaign goes live on your start date" },
            ].map(({ n, text }) => (
              <div key={n} className="flex items-center gap-3 px-4 py-3 border-b border-white/5 last:border-0 bg-[#0a0a0a]">
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background:P.bg, border:`1px solid ${P.border}` }}>
                  <span className="text-[9px] font-black" style={{ color:P.light }}>{n}</span>
                </div>
                <p className="text-sm" style={{ color:"rgba(255,255,255,0.6)" }}>{text}</p>
              </div>
            ))}
          </div>

          <p className="text-xs text-center mb-4" style={{ color:"rgba(255,255,255,0.2)" }}>
            Updates sent to <span style={{ color:"rgba(255,255,255,0.45)" }}>{form.advertiserEmail}</span>
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => navigate("/")} className="py-3 rounded-xl border border-white/10 text-sm font-bold transition-all hover:border-white/25" style={{ color:"rgba(255,255,255,0.4)" }}>Back to Home</button>
            <button onClick={() => navigate("/advertise")} className="py-3 rounded-xl text-sm font-black text-white" style={{ background:P.mid }}>View Pricing</button>
          </div>
        </motion.div>
      </main>
    </div>
  );

  // ── Steps ─────────────────────────────────────────────────────────────────────
  const renderStep = () => {
    switch (step) {

      case 0: return (
        <div>
          <h2 className="text-lg font-black text-white mb-1">What are you promoting?</h2>
          <p className="text-sm mb-5" style={{ color:"rgba(255,255,255,0.35)" }}>Select the category that best describes your campaign.</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {AD_TYPES.map(({ id, label, icon:Icon, desc }) => {
              const sel = form.adType === id;
              return (
                <motion.button key={id} whileTap={{ scale:0.97 }}
                  onClick={() => { setField("adType", id); clearError("adType"); }}
                  className="p-3.5 rounded-xl border text-left transition-all"
                  style={sel ? { background:P.bg, borderColor:P.border } : { background:"#0f0f0f", borderColor:"rgba(255,255,255,0.07)" }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2.5"
                    style={{ background:sel ? P.mid+"20" : "rgba(255,255,255,0.04)", border:sel ? `1px solid ${P.border}` : "1px solid rgba(255,255,255,0.06)" }}>
                    <Icon className="text-sm" style={{ color:sel ? P.light : "rgba(255,255,255,0.35)" }} />
                  </div>
                  <p className="text-sm font-bold text-white mb-0.5">{label}</p>
                  <p className="text-[11px]" style={{ color:"rgba(255,255,255,0.28)" }}>{desc}</p>
                  {sel && <div className="mt-2 w-4 h-4 rounded-full flex items-center justify-center" style={{ background:P.mid }}><HiOutlineCheck className="text-[8px] text-white" /></div>}
                </motion.button>
              );
            })}
          </div>
          {errors.adType && <p className="text-xs mt-3 font-semibold" style={{ color:"#f87171" }}>{errors.adType}</p>}
        </div>
      );

      case 1: return (
        <div>
          <h2 className="text-lg font-black text-white mb-1">Placement & Duration</h2>
          <p className="text-sm mb-5" style={{ color:"rgba(255,255,255,0.35)" }}>Choose where your ad appears and for how long.</p>

          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color:"rgba(255,255,255,0.25)" }}>Ad Placement</p>
          <div className="grid sm:grid-cols-3 gap-2 mb-6">
            {PLACEMENTS.map(p => {
              const sel = form.placement === p.id;
              return (
                <motion.button key={p.id} whileTap={{ scale:0.97 }}
                  onClick={() => { setField("placement", p.id); clearError("placement"); }}
                  className="p-4 rounded-xl border text-left transition-all relative"
                  style={sel ? { background:P.bg, borderColor:P.border } : { background:"#0f0f0f", borderColor:"rgba(255,255,255,0.07)" }}>
                  {p.badge && <span className="absolute top-2.5 right-2.5 text-[7px] font-black uppercase px-1.5 py-0.5 rounded-full" style={{ background:G.mid, color:"#000" }}>{p.badge}</span>}
                  <p className="font-black text-white text-sm mb-0.5">{p.label}</p>
                  <p className="text-[11px] mb-2" style={{ color:"rgba(255,255,255,0.35)" }}>{p.desc}</p>
                  <p className="text-[11px] font-bold" style={{ color:sel ? P.light : G.light }}>{p.reach}</p>
                </motion.button>
              );
            })}
          </div>

          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color:"rgba(255,255,255,0.25)" }}>Campaign Duration</p>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-5">
            {DURATIONS.map(d => {
              const p = d.prices[form.placement];
              const sel = form.days === d.days;
              return (
                <motion.button key={d.days} whileTap={{ scale:0.97 }}
                  onClick={() => { setField("days", d.days); clearError("days"); }}
                  className="p-3 rounded-xl border text-center transition-all relative"
                  style={sel ? { background:P.bg, borderColor:P.border } : { background:"#0f0f0f", borderColor:"rgba(255,255,255,0.07)" }}>
                  {d.popular && <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[6px] font-black px-1.5 py-0.5 rounded-full whitespace-nowrap" style={{ background:G.mid, color:"#000" }}>POPULAR</span>}
                  <p className="text-xs font-bold mb-0.5" style={{ color:sel ? P.light : "rgba(255,255,255,0.4)" }}>{d.label}</p>
                  <p className="text-sm font-black text-white">₹{p.toLocaleString("en-IN")}</p>
                  {d.save && <p className="text-[9px] mt-0.5 font-semibold" style={{ color:G.light }}>-{d.save}</p>}
                </motion.button>
              );
            })}
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl border border-white/8 bg-[#0f0f0f]">
            <div>
              <p className="text-[10px] mb-1" style={{ color:"rgba(255,255,255,0.25)" }}>
                {PLACEMENTS.find(p => p.id === form.placement)?.label} · {DURATIONS.find(d => d.days === form.days)?.label}
              </p>
              <p className="text-2xl font-black text-white">₹{price.toLocaleString("en-IN")}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] mb-1" style={{ color:"rgba(255,255,255,0.25)" }}>Per day</p>
              <p className="text-sm font-bold" style={{ color:P.light }}>₹{Math.round(price/form.days).toLocaleString("en-IN")}</p>
              <p className="text-[10px] mt-1 font-semibold" style={{ color:G.light }}>Pay after approval</p>
            </div>
          </div>
        </div>
      );

      case 2: return (
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-black text-white mb-1">Your Ad Creative</h2>
            <p className="text-sm" style={{ color:"rgba(255,255,255,0.35)" }}>Upload your media and write the ad copy — preview updates live above.</p>
          </div>

          <Field label="Banner Media *" error={errors.mediaFile} hint="Image: JPG/PNG/WebP · min 375×192px · max 10MB   |   Video: MP4/MOV · max 60s · 200MB">
            <div onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all bg-[#0a0a0a]"
              style={{ borderColor: errors.mediaFile ? "rgba(239,68,68,0.35)" : form.localMediaUrl ? G.border : "rgba(255,255,255,0.08)" }}
              onMouseEnter={e => { if (!form.localMediaUrl) e.currentTarget.style.borderColor = P.border; }}
              onMouseLeave={e => { if (!form.localMediaUrl) e.currentTarget.style.borderColor = errors.mediaFile ? "rgba(239,68,68,0.35)" : "rgba(255,255,255,0.08)"; }}>
              {form.localMediaUrl ? (
                <div>
                  {form.mediaType === "video"
                    ? <video src={form.localMediaUrl} className="max-h-28 mx-auto rounded-lg" muted />
                    : <img src={form.localMediaUrl} className="max-h-28 mx-auto rounded-lg object-contain" alt="" />
                  }
                  <p className="text-xs font-bold mt-2.5" style={{ color:G.light }}>✓ Uploaded · Click to replace</p>
                </div>
              ) : (
                <div>
                  <div className="flex justify-center gap-3 mb-2.5">
                    <HiOutlinePhoto className="text-2xl" style={{ color:"rgba(255,255,255,0.1)" }} />
                    <HiOutlineVideoCamera className="text-2xl" style={{ color:"rgba(255,255,255,0.1)" }} />
                  </div>
                  <p className="text-sm font-semibold mb-1" style={{ color:"rgba(255,255,255,0.38)" }}>Click to upload image or video</p>
                  <p className="text-xs" style={{ color:"rgba(255,255,255,0.16)" }}>Recommended: 375×192px · 16:5 ratio</p>
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={handleFilePick} className="hidden" />
          </Field>

          <Field label="Ad Headline *" error={errors.title} hint="Short and punchy · max 60 chars">
            <input value={form.title} onChange={e => { setField("title", e.target.value.slice(0,60)); clearError("title"); }}
              className={inputCls(errors.title)} placeholder="e.g. Subscribe to India's Top Editing Channel" />
            <p className="text-[10px] text-right mt-1" style={{ color:"rgba(255,255,255,0.16)" }}>{form.title.length}/60</p>
          </Field>

          <Field label="Short Description *" error={errors.description} hint="One line under the title · max 120 chars">
            <input value={form.description} onChange={e => { setField("description", e.target.value.slice(0,120)); clearError("description"); }}
              className={inputCls(errors.description)} placeholder="e.g. 500K+ subscribers · Free tutorials every week" />
          </Field>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="CTA Button Text *" error={errors.ctaText}>
              <input value={form.ctaText} onChange={e => { setField("ctaText", e.target.value); clearError("ctaText"); }}
                className={inputCls(errors.ctaText)} placeholder="Subscribe Now" maxLength={25} />
              {form.adType && (
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {CTA_SUGGESTIONS[form.adType]?.map(s => (
                    <button key={s} onClick={() => setField("ctaText", s)}
                      className="text-[10px] px-2 py-1 rounded-lg border transition-all"
                      style={{ background:P.bg, borderColor:P.border, color:P.light }}>{s}</button>
                  ))}
                </div>
              )}
            </Field>
            <Field label="Badge Label" hint="Tag above title · default: SPONSOR">
              <input value={form.badge} onChange={e => setField("badge", e.target.value)}
                className={inputCls(false)} placeholder="SPONSOR" maxLength={20} />
            </Field>
          </div>

          {form.adType && TYPE_LINKS[form.adType] && (
            <div className="space-y-3 p-4 rounded-xl border" style={{ background:G.bg, borderColor:G.border }}>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color:G.light+"90" }}>Your Links</p>
              {TYPE_LINKS[form.adType].map(({ key, label, ph, icon:Icon, required:req }) => (
                <Field key={key} label={`${label}${req?" *":""}`} error={errors[key]}>
                  <div className="relative">
                    <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm" style={{ color:"rgba(255,255,255,0.2)" }} />
                    <input value={form[key]} onChange={e => { setField(key, e.target.value); clearError(key); }}
                      className={`${inputCls(errors[key])} pl-9`} placeholder={ph} />
                  </div>
                </Field>
              ))}
              {form.adType !== "website" && (
                <Field label="Website URL (optional)">
                  <div className="relative">
                    <FaGlobe className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm" style={{ color:"rgba(255,255,255,0.2)" }} />
                    <input value={form.websiteUrl} onChange={e => setField("websiteUrl", e.target.value)}
                      className={`${inputCls(false)} pl-9`} placeholder="https://yourwebsite.com" />
                  </div>
                </Field>
              )}
            </div>
          )}

          <Field label="Notes to Admin (optional)" hint="Special instructions for the review team">
            <textarea value={form.additionalNotes} onChange={e => setField("additionalNotes", e.target.value)}
              className={`${inputCls(false)} resize-none h-16`} placeholder="Any context or special requests..." />
          </Field>
        </div>
      );

      case 3: return (
        <div className="max-w-lg">
          <h2 className="text-lg font-black text-white mb-1">Contact Details</h2>
          <p className="text-sm mb-5" style={{ color:"rgba(255,255,255,0.35)" }}>We'll send you review updates and the payment link here.</p>

          {user && (
            <div className="flex items-center gap-3 p-3.5 rounded-xl mb-4 border" style={{ background:G.bg, borderColor:G.border }}>
              <HiOutlineCheckCircle className="text-base flex-shrink-0" style={{ color:G.light }} />
              <div>
                <p className="text-xs font-bold" style={{ color:G.light }}>Logged in — details pre-filled</p>
                <p className="text-[11px]" style={{ color:"rgba(255,255,255,0.3)" }}>Linked to your SuviX account</p>
              </div>
            </div>
          )}

          {/* Refund Policy notice */}
          <div className="p-3.5 rounded-xl mb-4 border" style={{ background:"rgba(245,158,11,0.06)", borderColor:"rgba(245,158,11,0.2)" }}>
            <p className="text-xs font-bold mb-1" style={{ color:"#fbbf24" }}>⚡ Payment & Refund Guarantee</p>
            <p className="text-[11px] leading-relaxed" style={{ color:"rgba(255,255,255,0.4)" }}>
              Payment is required <strong className="text-white/60">after admin approval</strong>. If our team does not respond to your request within <strong className="text-white/60">7 days</strong> of submission, your payment will be <strong className="text-white/60">fully refunded</strong> with no questions asked.
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Full Name *" error={errors.advertiserName}>
                <div className="relative">
                  <HiOutlineUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm" style={{ color:"rgba(255,255,255,0.18)" }} />
                  <input value={form.advertiserName} onChange={e => { setField("advertiserName", e.target.value); clearError("advertiserName"); }}
                    className={`${inputCls(errors.advertiserName)} pl-9`} placeholder="John Doe" />
                </div>
              </Field>
              <Field label="Company / Brand" hint="Optional">
                <div className="relative">
                  <HiOutlineBuildingOffice2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm" style={{ color:"rgba(255,255,255,0.18)" }} />
                  <input value={form.companyName} onChange={e => setField("companyName", e.target.value)}
                    className={`${inputCls(false)} pl-9`} placeholder="Acme Studios" />
                </div>
              </Field>
            </div>

            <Field label="Email Address *" error={errors.advertiserEmail} hint="Payment link and all updates sent here">
              <div className="relative">
                <HiOutlineEnvelope className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm" style={{ color:"rgba(255,255,255,0.18)" }} />
                <input value={form.advertiserEmail} onChange={e => { setField("advertiserEmail", e.target.value); clearError("advertiserEmail"); }}
                  className={`${inputCls(errors.advertiserEmail)} pl-9`} placeholder="you@example.com" type="email" />
              </div>
            </Field>

            <Field label="Phone Number *" error={errors.advertiserPhone} hint="For urgent communication if needed">
              <div className="relative">
                <HiOutlinePhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm" style={{ color:"rgba(255,255,255,0.18)" }} />
                <input value={form.advertiserPhone} onChange={e => { setField("advertiserPhone", e.target.value); clearError("advertiserPhone"); }}
                  className={`${inputCls(errors.advertiserPhone)} pl-9`} placeholder="+91 98765 43210" type="tel" />
              </div>
            </Field>

            <div className="p-4 rounded-xl border transition-all"
              style={errors.agreeTerms ? { background:"rgba(239,68,68,0.05)", borderColor:"rgba(239,68,68,0.3)" } : { background:"#0a0a0a", borderColor:"rgba(255,255,255,0.08)" }}>
              <label className="flex items-start gap-3 cursor-pointer">
                <button type="button" onClick={() => { setField("agreeTerms", !form.agreeTerms); clearError("agreeTerms"); }}
                  className="w-5 h-5 rounded flex-shrink-0 mt-0.5 border-2 flex items-center justify-center transition-all"
                  style={form.agreeTerms ? { background:P.mid, borderColor:P.mid } : { background:"transparent", borderColor:"rgba(255,255,255,0.18)" }}>
                  {form.agreeTerms && <HiOutlineCheck className="text-white text-[10px]" />}
                </button>
                <span className="text-xs leading-relaxed" style={{ color:"rgba(255,255,255,0.38)" }}>
                  I agree to SuviX's{" "}
                  <a href="/advertise#faq" className="underline underline-offset-2" style={{ color:P.light }}>Ad Guidelines</a>
                  {" "}— payment required after approval, 7-day refund if no admin response, no refunds once live.
                </span>
              </label>
              {errors.agreeTerms && <p className="text-xs mt-2 pl-8 font-semibold" style={{ color:"#f87171" }}>{errors.agreeTerms}</p>}
            </div>
          </div>
        </div>
      );

      case 4: {
        const adTypeInfo    = AD_TYPES.find(t => t.id === form.adType);
        const placementInfo = PLACEMENTS.find(p => p.id === form.placement);
        const durationInfo  = DURATIONS.find(d => d.days === form.days);
        return (
          <div className="max-w-2xl">
            <h2 className="text-lg font-black text-white mb-1">Review & Submit</h2>
            <p className="text-sm mb-5" style={{ color:"rgba(255,255,255,0.35)" }}>Everything look good? Submit when ready — no payment today.</p>

            <div className="space-y-3">
              {/* Campaign */}
              <div className="rounded-xl overflow-hidden border border-white/8">
                <div className="px-4 py-2.5 border-b border-white/8" style={{ background:P.bg }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color:P.light }}>Campaign</p>
                </div>
                <div className="grid grid-cols-3 divide-x bg-[#0a0a0a]" style={{ borderColor:"rgba(255,255,255,0.05)" }}>
                  {[
                    { label:"Type",      value:adTypeInfo?.label,    Icon:adTypeInfo?.icon },
                    { label:"Placement", value:placementInfo?.label },
                    { label:"Duration",  value:durationInfo?.label },
                  ].map(({ label, value, Icon }) => (
                    <div key={label} className="p-4">
                      <p className="text-[10px] mb-1.5" style={{ color:"rgba(255,255,255,0.22)" }}>{label}</p>
                      <div className="flex items-center gap-1.5">
                        {Icon && <Icon className="text-sm" style={{ color:P.light }} />}
                        <p className="text-sm font-bold text-white">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Creative */}
              <div className="rounded-xl overflow-hidden border border-white/8">
                <div className="px-4 py-2.5 border-b border-white/8" style={{ background:"rgba(255,255,255,0.03)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color:"rgba(255,255,255,0.3)" }}>Creative</p>
                </div>
                <div className="p-4 bg-[#0a0a0a] flex gap-4 items-start">
                  {form.localMediaUrl && (
                    <div className="w-28 flex-shrink-0 rounded-xl overflow-hidden border border-white/8" style={{ aspectRatio:"375/192" }}>
                      {form.mediaType === "video"
                        ? <video src={form.localMediaUrl} className="w-full h-full object-cover" muted />
                        : <img src={form.localMediaUrl} className="w-full h-full object-cover" alt="" />
                      }
                    </div>
                  )}
                  <div className="space-y-1.5 min-w-0">
                    <p className="text-sm font-black text-white truncate">{form.title}</p>
                    <p className="text-xs truncate" style={{ color:"rgba(255,255,255,0.4)" }}>{form.description}</p>
                    <p className="text-xs" style={{ color:"rgba(255,255,255,0.28)" }}>CTA: <span className="font-semibold" style={{ color:P.light }}>"{form.ctaText}"</span></p>
                    <p className="text-[11px]" style={{ color:"rgba(255,255,255,0.22)" }}>
                      Templates: {BANNER_TEMPLATES.find(t=>t.id===bannerTemplateId)?.name}
                      {(form.placement==="reels_feed"||form.placement==="both") && ` · ${REELS_TEMPLATES.find(t=>t.id===reelsTemplateId)?.name}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div className="rounded-xl overflow-hidden border border-white/8">
                <div className="px-4 py-2.5 border-b border-white/8" style={{ background:"rgba(255,255,255,0.03)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color:"rgba(255,255,255,0.3)" }}>Contact</p>
                </div>
                <div className="bg-[#0a0a0a]">
                  {[{ label:"Name", value:form.advertiserName }, { label:"Email", value:form.advertiserEmail }, { label:"Phone", value:form.advertiserPhone }, { label:"Company", value:form.companyName||"—" }].map(({ label, value }, i, arr) => (
                    <div key={label} className={`flex items-center justify-between px-4 py-3 ${i<arr.length-1?"border-b":""}`} style={{ borderColor:"rgba(255,255,255,0.05)" }}>
                      <span className="text-xs" style={{ color:"rgba(255,255,255,0.28)" }}>{label}</span>
                      <span className="text-xs font-medium" style={{ color:"rgba(255,255,255,0.65)" }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price + refund */}
              <div className="p-5 rounded-xl border" style={{ background:G.bg, borderColor:G.border }}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-[10px] mb-1" style={{ color:"rgba(255,255,255,0.28)" }}>Campaign Total</p>
                    <p className="text-3xl font-black text-white">₹{price.toLocaleString("en-IN")}</p>
                    <p className="text-xs mt-1" style={{ color:"rgba(255,255,255,0.28)" }}>₹{Math.round(price/form.days)}/day · {durationInfo?.label}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 justify-end mb-1"><HiOutlineCheckCircle className="text-sm" style={{ color:G.light }} /><span className="text-xs font-bold" style={{ color:G.light }}>Pay After Approval</span></div>
                    <p className="text-[10px]" style={{ color:"rgba(255,255,255,0.25)" }}>No charge today</p>
                  </div>
                </div>
                <div className="pt-3 border-t" style={{ borderColor:"rgba(34,197,94,0.2)" }}>
                  <p className="text-[11px]" style={{ color:"rgba(255,255,255,0.4)" }}>
                    🔒 <strong className="text-white/60">7-day refund guarantee</strong> — if our team doesn't respond within 7 days of payment, your full amount is automatically refunded.
                  </p>
                </div>
              </div>

              {errors.submit && (
                <div className="p-4 rounded-xl border text-sm" style={{ background:"rgba(239,68,68,0.06)", borderColor:"rgba(239,68,68,0.2)", color:"#f87171" }}>
                  {errors.submit}
                </div>
              )}
            </div>
          </div>
        );
      }

      default: return null;
    }
  };

  // ── Layout ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-black text-white flex flex-col md:flex-row" style={{ fontFamily:"'DM Sans', system-ui, sans-serif" }}>
      <SidebarComponent isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <EditorNavbar onMenuClick={() => setSidebarOpen(true)} />

      <main className="flex-1 md:ml-64 md:mt-16 flex flex-col min-h-0 bg-[#050505]">
        
        {/* ── TOP: sticky nav bar ── */}
        <div className="sticky top-0 z-40 border-b flex-shrink-0" style={{ background:"rgba(0,0,0,0.97)", backdropFilter:"blur(12px)", borderColor:"rgba(255,255,255,0.07)" }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
            <button onClick={() => step === 0 ? navigate("/advertise") : prev()}
              className="flex items-center gap-1.5 text-sm font-semibold flex-shrink-0 transition-colors"
              style={{ color:"rgba(255,255,255,0.32)" }}
              onMouseEnter={e => e.currentTarget.style.color="#fff"}
              onMouseLeave={e => e.currentTarget.style.color="rgba(255,255,255,0.32)"}>
              <HiOutlineArrowLeft className="text-sm" />
              <span className="hidden sm:inline">{step === 0 ? "Back" : "Previous"}</span>
            </button>
            <StepBar current={step} />
            <button onClick={() => navigate("/advertise")} className="flex-shrink-0 transition-colors"
              style={{ color:"rgba(255,255,255,0.2)" }}
              onMouseEnter={e => e.currentTarget.style.color="#fff"}
              onMouseLeave={e => e.currentTarget.style.color="rgba(255,255,255,0.2)"}>
              <HiOutlineXMark className="text-lg" />
            </button>
          </div>
        </div>

        {/* ── TWO COLUMN LAYOUT ON LAPTOP ── */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden max-w-[1600px] mx-auto w-full">
          
          {/* ── PREVIEW (Sticky Column on Desktop - 60% approx) ── */}
          <aside className="w-full lg:w-[55%] xl:w-[60%] flex-shrink-0 lg:border-r border-[rgba(255,255,255,0.07)] overflow-y-auto no-scrollbar lg:sticky lg:top-0 lg:h-[calc(100vh-64px)] bg-black/20">
            <div className="lg:p-12 xl:p-16 max-w-2xl mx-auto lg:mx-0 lg:ml-auto">
              <StickyPreview
                form={form}
                bannerTemplateId={bannerTemplateId}
                reelsTemplateId={reelsTemplateId}
                onBannerTemplate={setBannerTemplateId}
                onReelsTemplate={setReelsTemplateId}
              />
            </div>
          </aside>

          {/* ── FORM (Scrollable Column on Desktop - 40% approx) ── */}
          <div className="flex-1 lg:w-[45%] xl:w-[40%] overflow-y-auto custom-scrollbar bg-[#050505]">
            <div className="max-w-2xl mx-auto lg:mx-0 px-4 sm:px-6 lg:px-12 py-10">
              <AnimatePresence mode="wait">
                <motion.div key={step}
                  initial={{ opacity:0, x:10 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-10 }}
                  transition={{ duration:0.18, ease:[0.22,1,0.36,1] }}>
                  {renderStep()}
                </motion.div>
              </AnimatePresence>

              {/* Nav footer */}
              <div className="flex items-center justify-between mt-12 pt-6 border-t" style={{ borderColor:"rgba(255,255,255,0.07)" }}>
                <button onClick={prev}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl border text-sm font-bold transition-all ${step===0?"invisible":""}`}
                  style={{ borderColor:"rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.4)" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor="rgba(255,255,255,0.25)"; e.currentTarget.style.color="#fff"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor="rgba(255,255,255,0.1)"; e.currentTarget.style.color="rgba(255,255,255,0.4)"; }}>
                  <HiOutlineArrowLeft className="text-sm" /> Back
                </button>

                {step < 4 ? (
                  <motion.button whileTap={{ scale:0.97 }} onClick={next}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm text-white shadow-lg shadow-[#8b5cf6]/20"
                    style={{ background:P.mid }}>
                    Continue <HiOutlineArrowRight className="text-sm" />
                  </motion.button>
                ) : (
                  <motion.button whileTap={{ scale:0.97 }} onClick={handleSubmit} disabled={saving}
                    className="flex items-center gap-2 px-7 py-3 rounded-xl font-black text-sm text-white disabled:opacity-50 shadow-lg shadow-[#16a34a]/20"
                    style={{ background:G.deep }}>
                    {saving ? (
                      <><motion.div animate={{ rotate:360 }} transition={{ repeat:Infinity, duration:0.8, ease:"linear" }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> Submitting…</>
                    ) : (
                      <><HiOutlineClipboardDocumentCheck className="text-sm" /> Submit Ad Request</>
                    )}
                  </motion.button>
                )}
              </div>

              <p className="text-center text-[11px] mt-4" style={{ color:"rgba(255,255,255,0.12)" }}>
                {["Select your ad type to continue","Choose where and how long your ad runs","Upload media and write your ad copy — preview updates live above","Your contact details for review communication","Review everything — no payment today, pay only after approval"][step]}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdvertiseNewPage;