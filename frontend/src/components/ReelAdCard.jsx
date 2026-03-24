// ReelAdCard.jsx - Slim & Professional "Low-Profile" Ad UI
// Updated to read reelConfig from the ad document for all styles,
// navigation, overlay, and description. Falls back gracefully if
// reelConfig is missing (existing ads without it).
import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiXMark, HiCheckCircle } from "react-icons/hi2";
import { FaInstagram, FaGlobe, FaChevronRight, FaVolumeUp, FaVolumeMute } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAppContext } from "../context/AppContext";
import { repairUrl } from "../utils/urlHelper.jsx";
import HlsVideoPlayer from "./HlsVideoPlayer";
import VideoQualitySelector from "./VideoQualitySelector";
import { useVideoQuality } from "../hooks/useVideoQuality";
import logo from "../assets/logo.png";

/**
 * ReelAdCard - Reads reelConfig from ad document for:
 * - Button variant, color, radius, text
 * - Overlay opacity and color
 * - Description (reelDescription or fallback)
 * - Navigation on CTA click (btnLinkType: ad_details | external | internal | none)
 * - Show/hide advertiser badge and description
 */
const ReelAdCard = ({ ad, onSkip, isActive=true, isPreloading=false, globalMuted=true, setGlobalMuted }) => {
  const { backendURL } = useAppContext();
  const navigate = useNavigate();
  const videoRef = useRef(null);

  const [canSkip, setCanSkip]             = useState(false);
  const [skipCountdown, setSkipCountdown] = useState(3);
  const [viewed, setViewed]               = useState(false);
  const [progress, setProgress]           = useState(0);
  const [isPlaying, setIsPlaying]         = useState(true);
  const [showMuteIcon, setShowMuteIcon]   = useState(false);
  const [currentQuality, setCurrentQuality] = useState("");
  const [availableQualities, setAvailableQualities] = useState([]);
  
  // Global Quality Hook
  const [preferredQuality, setPreferredQuality] = useVideoQuality();

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
      return { ...base, background: "transparent", color: rc.btnBorderColor, border: `1.5px solid ${rc.btnBorderColor}` };
    }
    // ghost (default)
    return { ...base, background: rc.btnBgColor, color: rc.btnTextColor, backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.15)" };
  }, [rc, btnRadius]);

  // ── Overlay gradient ─────────────────────────────────────────────────
  const overlayGradient = useMemo(() => {
    const hex = rc.overlayColor || "#000000";
    const op = (rc.overlayOpacity / 100).toFixed(2);
    try {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      const rgba    = `rgba(${r},${g},${b},${op})`;
      const rgbaMid = `rgba(${r},${g},${b},0.40)`;
      return `linear-gradient(to top, ${rgba} 0%, ${rgbaMid} 50%, transparent 100%)`;
    } catch {
      return `linear-gradient(to top, rgba(0,0,0,${op}) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)`;
    }
  }, [rc.overlayColor, rc.overlayOpacity]);

  // Description to display (reel-specific first, then fallback)
  const displayDescription = rc.reelDescription || ad?.tagline || ad?.description || "";

  // ── Show mute icon briefly on toggle ────────────────────────────────
  useEffect(() => {
    setShowMuteIcon(true);
    const t = setTimeout(() => setShowMuteIcon(false), 800);
    return () => clearTimeout(t);
  }, [muted]);

  const repairedMediaUrl = useMemo(() => repairUrl(ad?.mediaUrl), [ad?.mediaUrl]);

  // ── Track view ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!viewed && ad?._id) {
      axios.post(`${backendURL}/api/ads/${ad._id}/view`, { location: "reels_feed" }).catch(() => {});
      setViewed(true);
    }
  }, [ad?._id, backendURL, viewed]);

  // ── Video Playback Management ──────────────────────────────────
  useEffect(() => {
    if (ad?.mediaType !== "video" || !videoRef.current) return;
    
    if (!isActive) {
      setIsPlaying(false);
    }
  }, [isActive, ad?.mediaType]);

  // ── Skip timer ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!isActive) return; // Only count down if active
    if (skipCountdown <= 0) { setCanSkip(true); return; }
    const t = setTimeout(() => setSkipCountdown(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [skipCountdown, isActive]);

  // ── Progress bar for video ───────────────────────────────────────────
  useEffect(() => {
    if (ad?.mediaType !== "video" || !videoRef.current) return;
    const updateProgress = () => {
      if (videoRef.current?.duration) {
        setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
      }
    };
    const v = videoRef.current;
    v.addEventListener("timeupdate", updateProgress);
    return () => v.removeEventListener("timeupdate", updateProgress);
  }, [ad?.mediaType]);

  // ── CTA click — reads reelConfig navigation ──────────────────────────
  const handleCTA = (e) => {
    e.stopPropagation();
    if (ad?._id) axios.post(`${backendURL}/api/ads/${ad._id}/click`).catch(() => {});

    const linkType = rc.btnLinkType;

    if (linkType === "ad_details") {
      navigate(`/ad-details/${ad._id}`);
      return;
    }
    if (linkType === "external") {
      const url = rc.btnLink || ad.websiteUrl || ad.instagramUrl;
      if (url) window.open(url, "_blank");
      return;
    }
    if (linkType === "internal" && rc.btnLink) {
      navigate(rc.btnLink);
      return;
    }
    // linkType === "none" — do nothing
  };

  if (!ad) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full aspect-[9/16] max-w-full bg-black mx-auto overflow-hidden select-none relative flex items-center justify-center shadow-[0_0_100px_rgba(0,0,0,0.5)]"
      onClick={(e) => { e.stopPropagation(); setMuted(!muted); }}
      onMouseDown={() => { if (videoRef.current) { videoRef.current.pause(); setIsPlaying(false); } }}
      onMouseUp={() => { if (videoRef.current) { videoRef.current.play(); setIsPlaying(true); } }}
      onTouchStart={() => { if (videoRef.current) { videoRef.current.pause(); setIsPlaying(false); } }}
      onTouchEnd={() => { if (videoRef.current) { videoRef.current.play(); setIsPlaying(true); } }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* ── MEDIA LAYER ── */}
      <div className="absolute inset-0">
        {ad.mediaType === "video" ? (
          <HlsVideoPlayer
            ref={videoRef}
            src={repairedMediaUrl}
            poster={repairedMediaUrl ? repairedMediaUrl.replace(/\.[^./\\]+$/, ".jpg") : ""}
            className="w-full h-full"
            objectFit="contain"
            muted={muted}
            loop
            isActive={isActive || isPreloading}
            autoPlay={isActive}
            isPreloading={isPreloading && !isActive}
            onPlaying={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onQualityChange={setCurrentQuality}
            onAvailableQualities={setAvailableQualities}
            preferredQuality={preferredQuality}
          />
        ) : (
          <img 
            src={repairedMediaUrl} 
            alt="" 
            className="w-full h-full object-contain" 
            crossOrigin="anonymous"
          />
        )}

        {/* Mute/Unmute Indicator */}
        <AnimatePresence>
          {showMuteIcon && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-50"
            >
              <div className="w-16 h-16 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10">
                {muted
                  ? <FaVolumeMute className="text-white text-2xl" />
                  : <FaVolumeUp className="text-white text-2xl" />
                }
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Interactive Video Quality Menu */}
        {ad.mediaType === "video" && (
            <VideoQualitySelector 
                currentQuality={currentQuality}
                availableQualities={availableQualities}
                preferredQuality={preferredQuality}
                setPreferredQuality={setPreferredQuality}
                onMenuOpen={() => { if (videoRef.current) videoRef.current.pause(); }}
                onMenuClose={() => { if (videoRef.current) videoRef.current.play(); }}
            />
        )}
      </div>

      {/* ── TOP PROGRESS BAR ── */}
      <div className="absolute top-0 inset-x-0 z-50 h-[1.2px] bg-white/10">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: ad.mediaType === "video" ? `${progress}%` : "100%" }}
          transition={{ duration: ad.mediaType === "video" ? 0.1 : 5, ease: "linear" }}
          className="h-full bg-white shadow-[0_0_5px_rgba(255,255,255,0.7)]"
        />
      </div>

      {/* ── SIDE CONTROLS ── */}
      <div className="absolute top-1/2 -translate-y-1/2 right-3 z-40 flex flex-col items-center gap-4">
        <AnimatePresence mode="wait">
          {canSkip ? (
            <motion.button
              key="skip-ready"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => { e.stopPropagation(); onSkip(); }}
              className="w-11 h-11 bg-white/10 backdrop-blur-3xl border border-white/20 rounded-full flex flex-col items-center justify-center text-white shadow-xl"
            >
              <HiXMark size={18} />
              <span className="text-[7px] font-black uppercase tracking-tight">Skip</span>
            </motion.button>
          ) : (
            <motion.div
              key="skip-wait"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-11 h-11 bg-black/40 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white font-black text-xs"
            >
              {skipCountdown}
            </motion.div>
          )}
        </AnimatePresence>

        {ad.mediaType === "video" && (
          <button
            onClick={(e) => { e.stopPropagation(); setMuted(!muted); }}
            className="w-10 h-10 bg-black/40 backdrop-blur-md rounded-full border border-white/10 flex items-center justify-center text-white"
          >
            {muted ? <FaVolumeMute size={16} /> : <FaVolumeUp size={16} />}
          </button>
        )}
      </div>

      {/* ── TOP HEADER ── */}
      <div className="absolute top-0 left-0 right-0 p-5 z-50 pointer-events-none flex flex-col items-center">
        <div className="flex items-center gap-2">
          <img src={logo} className="w-6 h-6 object-contain" alt="SuviX" />
          <span className="text-white font-normal text-[12px] tracking-widest uppercase">
            SuviX Reels
          </span>
        </div>
      </div>

      {/* ── BOTTOM OVERLAY ── */}
      <div className="absolute bottom-0 inset-x-0 z-40">
        {/* Gradient from reelConfig */}
        <div
          className="absolute bottom-0 inset-x-0 pt-16 pointer-events-none"
          style={{ height: 220, background: overlayGradient }}
        />

        <div className="relative px-5 pb-6">
          {/* ADVERTISEMENT BAR */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 100 }}
            className="w-full bg-white px-4 py-2.5 rounded-lg mb-4 flex items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-white/20"
          >
            <motion.span
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-black font-black text-[11px] uppercase tracking-[0.25em]"
            >
              Advertisement
            </motion.span>
          </motion.div>

          {/* ADVERTISER BADGE — controlled by reelConfig.showAdvertiserBadge */}
          {rc.showAdvertiserBadge && (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-white/60 font-black text-[9px] uppercase tracking-[0.2em]">
                {ad.companyName || ad.advertiserName || "Sponsored"}
              </span>
              <HiCheckCircle className="text-blue-500 text-[9px]" />
            </div>
          )}

          {/* TITLE */}
          <h2 className="text-xl font-bold text-white leading-tight tracking-tight drop-shadow-md mb-3">
            {ad.title}
          </h2>

          {/* CTA BUTTON — styled from reelConfig */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleCTA}
            style={btnStyleObj}
            className="relative overflow-hidden group"
          >
            <span className="flex items-center gap-2">
              <FaGlobe size={12} className="opacity-40" />
              {rc.ctaText}
            </span>
            <FaChevronRight size={10} className="group-hover:translate-x-1 transition-transform opacity-40" />
            <div className="absolute inset-0 w-1/4 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:animate-[sweep-fast_0.6s_ease-in-out_forwards]" />
          </motion.button>

          {/* DESCRIPTION — controlled by reelConfig.showDescription */}
          {rc.showDescription && displayDescription && (
            <p className="text-[12px] font-medium text-white/60 leading-relaxed line-clamp-2 pr-4 mb-4">
              {displayDescription}
            </p>
          )}

          {/* LINKS FOOTER */}
          <div className="flex items-center gap-5 pt-3 border-t border-white/5 w-fit">
            {ad.websiteUrl && (
              <button
                onClick={handleCTA}
                className="text-white/20 hover:text-white transition-colors"
              >
                <FaGlobe size={14} />
              </button>
            )}
            {ad.instagramUrl && (
              <button
                onClick={(e) => { e.stopPropagation(); window.open(ad.instagramUrl, "_blank"); }}
                className="text-white/20 hover:text-pink-400 transition-colors"
              >
                <FaInstagram size={14} />
              </button>
            )}
          </div>
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

export default ReelAdCard;