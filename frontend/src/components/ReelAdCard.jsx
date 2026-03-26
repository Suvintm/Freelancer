// ReelAdCard.jsx - Premium, Minimalist "Sponsored" UI
// Optimized for zero-latency and non-intrusive metadata hydration.
import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiXMark, HiCheckCircle } from "react-icons/hi2";
import { FaInstagram, FaGlobe, FaChevronRight, FaVolumeUp, FaVolumeMute } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAppContext } from "../context/AppContext";
import { repairUrl } from "../utils/urlHelper.jsx";
import HlsVideoPlayer from "./HlsVideoPlayer";
import logo from "../assets/logo.png";

const ReelAdCard = ({ ad, onSkip, isActive=true, isNearActive=false, isPreloading=false, globalMuted=true, setGlobalMuted }) => {
  const { backendURL } = useAppContext();
  const navigate = useNavigate();
  const videoRef = useRef(null);

  const [viewed, setViewed]               = useState(false);
  const [progress, setProgress]           = useState(0);
  const [isPlaying, setIsPlaying]         = useState(true);
  const [showMuteIcon, setShowMuteIcon]   = useState(false);
  
  // — PERFORMANCE: Standardized predictive metadata hydration —
  const [showMetadata, setShowMetadata] = useState(isActive || isNearActive);
  useEffect(() => {
      if (isActive || isNearActive) {
          setShowMetadata(true);
      } else {
          const timer = setTimeout(() => setShowMetadata(false), 800);
          return () => clearTimeout(timer);
      }
  }, [isActive, isNearActive]);

  // Sync with global mute state
  const muted = globalMuted;
  const setMuted = setGlobalMuted;

  // ── reelConfig with safe fallbacks ──────────────────────────────────
  const rc = useMemo(() => ({
    ctaText:             ad?.reelConfig?.ctaText             ?? ad?.ctaText        ?? "Learn More",
    btnVariant:          ad?.reelConfig?.btnVariant          ?? "ghost",
    btnBgColor:          ad?.reelConfig?.btnBgColor          ?? "rgba(255,255,255,0.1)",
    btnTextColor:        ad?.reelConfig?.btnTextColor        ?? "#ffffff",
    btnBorderColor:      ad?.reelConfig?.btnBorderColor      ?? "#ffffff",
    btnRadius:           ad?.reelConfig?.btnRadius           ?? "md",
    reelDescription:     ad?.reelConfig?.reelDescription     ?? "",
    showDescription:     ad?.reelConfig?.showDescription     ?? true,
    showAdvertiserBadge: ad?.reelConfig?.showAdvertiserBadge ?? true,
    overlayOpacity:      ad?.reelConfig?.overlayOpacity      ?? 80,
    overlayColor:        ad?.reelConfig?.overlayColor        ?? "#000000",
    btnLinkType:         ad?.reelConfig?.btnLinkType         ?? "ad_details",
    btnLink:             ad?.reelConfig?.btnLink             ?? "",
  }), [ad]);

  // ── Computed styles from reelConfig ─────────────────────────────────
  const btnRadius = useMemo(() =>
    ({ sm: "6px", md: "8px", lg: "12px", full: "999px" }[rc.btnRadius] || "8px"),
    [rc.btnRadius]
  );

  const btnStyleObj = useMemo(() => {
    const base = {
      width: "100%",
      height: 40,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 20px",
      borderRadius: btnRadius,
      fontWeight: 800,
      fontSize: 13,
      marginBottom: 12,
      cursor: "pointer",
      border: "none",
      letterSpacing: "-0.01em",
    };
    if (rc.btnVariant === "filled") {
      return { ...base, background: rc.btnBgColor, color: rc.btnTextColor };
    }
    if (rc.btnVariant === "outline") {
      return { ...base, background: "transparent", color: rc.btnBorderColor, border: `2.5px solid ${rc.btnBorderColor}` };
    }
    return { ...base, background: rc.btnBgColor, color: rc.btnTextColor, backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.15)" };
  }, [rc, btnRadius]);

  const overlayGradient = useMemo(() => {
    const hex = rc.overlayColor || "#000000";
    const op = (rc.overlayOpacity / 100).toFixed(2);
    try {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `linear-gradient(to top, rgba(${r},${g},${b},${op}) 0%, rgba(${r},${g},${b},0.3) 45%, transparent 100%)`;
    } catch {
      return `linear-gradient(to top, rgba(0,0,0,${op}) 0%, rgba(0,0,0,0.3) 45%, transparent 100%)`;
    }
  }, [rc.overlayColor, rc.overlayOpacity]);

  const displayDescription = rc.reelDescription || ad?.tagline || ad?.description || "";

  useEffect(() => {
    setShowMuteIcon(true);
    const t = setTimeout(() => setShowMuteIcon(false), 800);
    return () => clearTimeout(t);
  }, [muted]);

  const repairedMediaUrl = useMemo(() => repairUrl(ad?.mediaUrl), [ad?.mediaUrl]);

  // ── Track view ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!viewed && ad?._id && isActive) {
      axios.post(`${backendURL}/api/ads/${ad._id}/view`, { location: "reels_feed" }).catch(() => {});
      setViewed(true);
    }
  }, [ad?._id, backendURL, viewed, isActive]);

  // ── Progress bar — removed for ads to keep UI ultra-clean ──────────────

  const handleCTA = (e) => {
    e.stopPropagation();
    if (ad?._id) axios.post(`${backendURL}/api/ads/${ad._id}/click`).catch(() => {});
    const linkType = rc.btnLinkType;
    if (linkType === "ad_details") return navigate(`/ad-details/${ad._id}`);
    if (linkType === "external") {
      const url = rc.btnLink || ad.websiteUrl || ad.instagramUrl;
      if (url) window.open(url, "_blank");
    }
    if (linkType === "internal" && rc.btnLink) navigate(rc.btnLink);
  };

  if (!ad) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full aspect-[9/16] max-w-full bg-black mx-auto overflow-hidden select-none relative flex items-center justify-center"
      onClick={(e) => { e.stopPropagation(); setMuted(!muted); }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* ── MEDIA LAYER ── */}
      <div className="absolute inset-0">
        {ad.mediaType === "video" ? (
          <HlsVideoPlayer
            ref={videoRef}
            src={repairedMediaUrl}
            // Poster is removed for HLS ads to avoid flicker during autoplay
            className="w-full h-full"
            objectFit="cover" // Native cover for full-screen feel
            muted={muted}
            loop
            isActive={isActive}
            autoPlay={isActive}
            isPreloading={isPreloading && !isActive}
            onPlaying={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            // Auto quality only — manual quality selector removed for cleaner ad UX
          />
        ) : (
          <img 
            src={repairedMediaUrl} 
            alt="" 
            className="w-full h-full object-cover" 
            crossOrigin="anonymous"
          />
        )}

        {/* Sync Indicator */}
        <AnimatePresence>
          {showMuteIcon && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-50"
            >
              <div className="w-16 h-16 bg-black/20 backdrop-blur-xl rounded-full flex items-center justify-center">
                {muted ? <FaVolumeMute className="text-white text-xl opacity-60" /> : <FaVolumeUp className="text-white text-xl opacity-60" />}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── TOP HEADER ── */}
      <div className="absolute top-0 left-0 right-0 p-5 z-50 pointer-events-none flex flex-col items-center">
        <div className="flex items-center gap-2 opacity-40">
          <img src={logo} className="w-5 h-5 object-contain" alt="SuviX" />
          <span className="text-white font-black text-[10px] tracking-[0.2em] uppercase">
            Sponsored
          </span>
        </div>
      </div>

      {/* ── SKIP CONTROL ── */}
      <div className="absolute top-4 right-4 z-50">
          <button
            onClick={(e) => { e.stopPropagation(); onSkip(); }}
            className="w-10 h-10 bg-black/20 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center text-white/60 hover:text-white transition-colors shadow-2xl"
          >
            <HiXMark size={20} />
          </button>
      </div>

      {/* ── BOTTOM OVERLAY ── */}
      <div className="absolute bottom-0 inset-x-0 z-40">
        <div
          className="absolute bottom-0 inset-x-0 pt-32 pointer-events-none"
          style={{ height: 260, background: overlayGradient }}
        />

        <div className="relative px-5 pb-8">
          <AnimatePresence>
            {showMetadata && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
              >
                {/* ADVERTISER BADGE + SPONSORED TAG */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/5 overflow-hidden">
                     {ad.logo ? <img src={repairUrl(ad.logo)} className="w-full h-full object-cover" alt="" /> : <img src={logo} className="w-4 h-4 opacity-50" alt="" />}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-white font-bold text-[11px] leading-none mb-1">
                      {ad.companyName || ad.advertiserName || "Sponsored"}
                    </span>
                    <span className="text-white/40 font-bold text-[8px] uppercase tracking-wider flex items-center gap-1">
                      Sponsored • {ad.websiteUrl ? "visit site" : "view details"}
                    </span>
                  </div>
                </div>

                {/* TITLE */}
                <h2 className="text-lg font-bold text-white leading-tight tracking-tight mb-4 pr-10">
                  {ad.title}
                </h2>

                {/* CTA BUTTON */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCTA}
                  style={btnStyleObj}
                  className="relative overflow-hidden group pointer-events-auto shadow-2xl"
                >
                  <span className="flex items-center gap-2">
                    {rc.ctaText}
                  </span>
                  <FaChevronRight size={10} className="group-hover:translate-x-1 transition-transform opacity-40" />
                  <div className="absolute inset-0 w-1/4 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full group-hover:animate-[sweep-fast_0.8s_ease-in-out_forwards]" />
                </motion.button>

                {/* DESCRIPTION */}
                {rc.showDescription && displayDescription && (
                  <p className="text-[11px] font-medium text-white/40 leading-relaxed line-clamp-2 pr-6 mb-2">
                    {displayDescription}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <style>{`
        @keyframes sweep-fast {
          0%   { transform: translateX(-150%) skewX(-12deg); }
          100% { transform: translateX(450%) skewX(-12deg); }
        }
      `}</style>
    </motion.div>
  );
};

export default React.memo(ReelAdCard);