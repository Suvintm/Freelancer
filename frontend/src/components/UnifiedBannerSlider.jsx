/**
 * UnifiedBannerSlider.jsx
 * Reads layoutConfig, buttonStyle, cropData from each ad document
 * so every ad can look completely different based on admin configuration.
 */
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    HiOutlineBriefcase,
    HiOutlineUserGroup,
    HiArrowRight,
    HiSpeakerWave,
    HiSpeakerXMark,
} from "react-icons/hi2";
import { useSocket } from "../context/SocketContext";
import { FaAd, FaInstagram, FaGlobe, FaChevronRight } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

// ─── URL repair ──────────────────────────────────────────────────────────────
const repairUrl = (url) => {
    if (!url || typeof url !== "string") return url;
    if (!url.includes("cloudinary") && !url.includes("res_") && !url.includes("_com")) return url;
    let fixed = url;
    fixed = fixed.replace(/^(https?):?\/*_+/gi, "$1://");
    fixed = fixed.replace(/_+res_+cloudinary_+com/g, "res.cloudinary.com").replace(/res_cloudinary_com/g, "res.cloudinary.com").replace(/cloudinary_com/g, "cloudinary.com");
    if (fixed.includes("res.cloudinary.com")) {
        fixed = fixed.replace(/res\.cloudinary\.com_+/g, "res.cloudinary.com/");
        fixed = fixed.replace(/image_upload_+/g, "image/upload/").replace(/video_upload_+/g, "video/upload/").replace(/raw_upload_+/g, "raw/upload/");
        fixed = fixed.replace(/([/_]?v\d+)_+/g, "$1/");
        fixed = fixed.replace(/(res\.cloudinary\.com\/[^/_]+)_+(image|video|raw|authenticated)_*/g, "$1/$2/");
        fixed = fixed.replace(/advertisements_images_+/g, "advertisements/images/").replace(/advertisements_videos_+/g, "advertisements/videos/").replace(/advertisements_gallery_+/g, "advertisements/gallery/");
        fixed = fixed.replace(/_+(upload|image|video|v\d+)_+/g, "/$1/");
        fixed = fixed.replace(/_([a-z0-9\-_]+\.(webp|jpg|jpeg|png|mp4|mov|m4v|json))/gi, "/$1");
        fixed = fixed.replace(/([^:])\/\/+/g, "$1/");
    }
    fixed = fixed.replace(/_jpg([/_?#]|$)/gi, ".jpg$1").replace(/_jpeg([/_?#]|$)/gi, ".jpeg$1").replace(/_png([/_?#]|$)/gi, ".png$1").replace(/_mp4([/_?#]|$)/gi, ".mp4$1").replace(/_webp([/_?#]|$)/gi, ".webp$1");
    return fixed;
};

// ─── Resolve layout defaults ─────────────────────────────────────────────────
const resolveLayout = (lc = {}) => ({
    textPosition:     lc.textPosition     ?? "bl",
    overlayDirection: lc.overlayDirection ?? "to-top",
    overlayOpacity:   lc.overlayOpacity   ?? 75,
    overlayColor:     lc.overlayColor     ?? "#040408",
    titleSize:        lc.titleSize        ?? "md",
    titleWeight:      lc.titleWeight      ?? "black",
    titleColor:       lc.titleColor       ?? "#ffffff",
    descColor:        lc.descColor        ?? "rgba(212,212,216,0.75)",
    showBadge:        lc.showBadge        ?? true,
    showSponsorTag:   lc.showSponsorTag   ?? true,
    showDescription:  lc.showDescription  ?? true,
    showProgressBar:  lc.showProgressBar  ?? true,
    showDetailsBtn:   lc.showDetailsBtn   ?? true,
    showMuteBtn:      lc.showMuteBtn      ?? true,
    slideDuration:    lc.slideDuration    ?? 5000,
    badgeText:        lc.badgeText        ?? "",
    badgeColor:       lc.badgeColor       ?? "rgba(255,255,255,0.12)",
});

const resolveButton = (bs = {}) => ({
    variant:      bs.variant      ?? "filled",
    bgColor:      bs.bgColor      ?? "#ffffff",
    textColor:    bs.textColor    ?? "#000000",
    borderColor:  bs.borderColor  ?? "#ffffff",
    radius:       bs.radius       ?? "md",
    icon:         bs.icon         ?? "chevron",
    iconPosition: bs.iconPosition ?? "right",
});

// ─── Overlay gradient ────────────────────────────────────────────────────────
const buildOverlay = (lc) => {
    const hexToRgba = (hex, opacity) => {
        try {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r},${g},${b},${(opacity / 100).toFixed(2)})`;
        } catch { return `rgba(4,4,8,${(opacity / 100).toFixed(2)})`; }
    };
    const color = lc.overlayColor || "#040408";
    const op    = lc.overlayOpacity ?? 75;
    const dirs  = {
        "to-top":    `linear-gradient(to top, ${hexToRgba(color, op)} 0%, ${hexToRgba(color, Math.round(op * 0.35))} 42%, transparent 75%)`,
        "to-bottom": `linear-gradient(to bottom, ${hexToRgba(color, op)} 0%, transparent 75%)`,
        "to-left":   `linear-gradient(to left, ${hexToRgba(color, op)} 0%, transparent 75%)`,
        "to-right":  `linear-gradient(to right, ${hexToRgba(color, op)} 0%, transparent 75%)`,
        "radial":    `radial-gradient(ellipse at center, transparent 30%, ${hexToRgba(color, op)} 100%)`,
        "none":      "none",
    };
    return dirs[lc.overlayDirection] || dirs["to-top"];
};

// ─── Text position → flex alignment ─────────────────────────────────────────
const textPosToFlex = (pos) => {
    const map = {
        tl: { justifyContent: "flex-start",  alignItems: "flex-start" },
        tc: { justifyContent: "flex-start",  alignItems: "center"     },
        tr: { justifyContent: "flex-start",  alignItems: "flex-end"   },
        ml: { justifyContent: "center",       alignItems: "flex-start" },
        mc: { justifyContent: "center",       alignItems: "center"     },
        mr: { justifyContent: "center",       alignItems: "flex-end"   },
        bl: { justifyContent: "flex-end",     alignItems: "flex-start" },
        bc: { justifyContent: "flex-end",     alignItems: "center"     },
        br: { justifyContent: "flex-end",     alignItems: "flex-end"   },
    };
    return map[pos] || map["bl"];
};

// ─── Button radius ───────────────────────────────────────────────────────────
const btnRadius = (r) => ({ sm: "6px", md: "8px", lg: "12px", full: "999px" }[r] || "8px");

// ─── Crop transform ──────────────────────────────────────────────────────────
const buildCropStyle = (cd) => {
    if (!cd || (cd.x === 0 && cd.y === 0)) return { width: "100%", height: "100%", objectFit: "cover" };
    const zoom   = cd.zoom || 1;
    const scaleX = zoom;
    const offsetX = -(cd.x / 100) * 100 * scaleX;
    const offsetY = -(cd.y / 100) * 100 * scaleX;
    return {
        position: "absolute",
        width: `${scaleX * 100}%`,
        height: `${scaleX * 100}%`,
        objectFit: "cover",
        transform: `translate(${offsetX}%, ${offsetY}%)`,
        top: 0, left: 0,
    };
};

// ─── Animation variants ──────────────────────────────────────────────────────
const mediaVariants = {
    enter:  { opacity: 0, scale: 1.06 },
    center: { opacity: 1, scale: 1,    transition: { duration: 0.7, ease: [0.25, 0.1, 0.25, 1] } },
    exit:   { opacity: 0, scale: 0.97, transition: { duration: 0.45, ease: [0.4, 0, 1, 1] } },
};
const hudVariants = {
    hidden: {},
    show:   { transition: { staggerChildren: 0.07, delayChildren: 0.18 } },
    exit:   { transition: { staggerChildren: 0.04, staggerDirection: -1 } },
};
const hudItem = {
    hidden: { opacity: 0, y: 14 },
    show:   { opacity: 1, y: 0,  transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] } },
    exit:   { opacity: 0, y: -8, transition: { duration: 0.22, ease: [0.4, 0, 1, 1] } },
};

// ─── Loading Skeleton ────────────────────────────────────────────────────────
const BannerSkeleton = () => (
    <div className="relative w-full rounded-[1.5rem] overflow-hidden bg-zinc-900 border border-white/5 aspect-[16/10] lg:aspect-[1.8/1]">
        <div className="absolute inset-0" style={{ background: "linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.035) 50%,transparent 60%)", backgroundSize: "200% 100%", animation: "ubShimmer 1.8s infinite" }} />
        <div className="absolute bottom-0 inset-x-0 p-6 space-y-3">
            <div className="h-2.5 w-14 bg-white/8 rounded-full animate-pulse" />
            <div className="h-6 w-48 bg-white/10 rounded-lg animate-pulse" />
            <div className="h-3.5 w-64 bg-white/6 rounded-lg animate-pulse" />
            <div className="h-8 w-28 bg-white/10 rounded-xl animate-pulse mt-2" />
        </div>
        <style>{`@keyframes ubShimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}`}</style>
    </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const UnifiedBannerSlider = ({ filter = null }) => {
    const { backendURL } = useAppContext();
    const { socket }     = useSocket();
    const navigate       = useNavigate();
    const queryClient    = useQueryClient();

    const [verticalIndex,     setVerticalIndex]     = useState(0);
    const [horizontalIndices, setHorizontalIndices] = useState([0, 0, 0]);
    const [isMuted,           setIsMuted]           = useState(true);
    const [isHovered,         setIsHovered]         = useState(false);
    const [mediaReady,        setMediaReady]        = useState(false);
    const [inView,            setInView]            = useState(true);
    const [progress,          setProgress]          = useState(0);
    const [dragStart,         setDragStart]         = useState(null);

    const containerRef  = useRef(null);
    const progressTimer = useRef(null);
    const TICK_MS       = 50;

    // ── Intersection observer ─────────────────────────────────────────────
    useEffect(() => {
        const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.2 });
        if (containerRef.current) io.observe(containerRef.current);
        return () => io.disconnect();
    }, []);

    // ── Data ──────────────────────────────────────────────────────────────
    const { data: adsData, isLoading } = useQuery({
        queryKey: ["home-ads", backendURL],
        queryFn: async () => {
            const [adsRes, settingsRes] = await Promise.all([
                axios.get(`${backendURL}/api/ads?location=home_banner`),
                axios.get(`${backendURL}/api/ads/settings`),
            ]);
            return { ads: adsRes.data.ads || [], showAds: settingsRes.data.showSuvixAds !== false };
        },
        staleTime: 10 * 60 * 1000,
    });

    // ── Real-time refresh ─────────────────────────────────────────────────
    useEffect(() => {
        if (!socket) return;
        const handleAdsUpdated = () => {
            console.log("📢 ads:updated received — refetching banner ads");
            queryClient.invalidateQueries({ queryKey: ["home-ads"] });
        };
        socket.on("ads:updated", handleAdsUpdated);
        return () => socket.off("ads:updated", handleAdsUpdated);
    }, [socket, queryClient]);

    // ── Build levels ──────────────────────────────────────────────────────
    const levels = useMemo(() => {
        const dbAds   = adsData?.ads || [];
        const showAds = adsData?.showAds ?? true;

        const adsLevel = showAds && dbAds.length > 0 ? {
            id: "home_banner_0",
            label: "HOME BANNER LEVEL 0",
            color: "text-amber-400",
            icon: FaAd,
            items: dbAds.map(ad => ({
                _id:          ad._id,
                title:        ad.title,
                description:  ad.description || ad.tagline || "",
                mediaUrl:     repairUrl(ad.mediaUrl),
                mediaType:    ad.mediaType,
                link:         ad.websiteUrl || `/ad-details/${ad._id}`,
                linkText:     ad.ctaText || "Learn More",
                badge:        ad.badge || "SPONSOR",
                isExternal:   !!ad.websiteUrl,
                isAd:         true,
                cropData:     ad.cropData     || {},
                layoutConfig: ad.layoutConfig || {},
                buttonStyle:  ad.buttonStyle  || {},
            }))
        } : null;

        const all = adsLevel ? [adsLevel] : [];
        return all;
    }, [adsData]);

    useEffect(() => { if (verticalIndex >= levels.length) setVerticalIndex(0); }, [levels.length]);

    const currentLevel = levels[verticalIndex] ?? levels[0];
    const hIdx         = horizontalIndices[verticalIndex] ?? 0;
    const currentItem  = currentLevel?.items[hIdx];

    // Per-item resolved config
    const lc = useMemo(() => resolveLayout(currentItem?.layoutConfig), [currentItem]);
    const bs = useMemo(() => resolveButton(currentItem?.buttonStyle),  [currentItem]);
    const cd = currentItem?.cropData || {};

    const DURATION_MS = lc.slideDuration || 5000;

    useEffect(() => { setMediaReady(false); }, [verticalIndex, hIdx]);

    // ── Progress ticker ───────────────────────────────────────────────────
    const advance = useCallback(() => {
        if (!levels.length) return;
        const lvl    = levels[verticalIndex];
        const isLast = hIdx >= lvl.items.length - 1;
        if (isLast) {
            const nextV = (verticalIndex + 1) % levels.length;
            setVerticalIndex(nextV);
            setHorizontalIndices(prev => { const n = [...prev]; n[nextV] = 0; return n; });
        } else {
            setHorizontalIndices(prev => { const n = [...prev]; n[verticalIndex] = hIdx + 1; return n; });
        }
        setProgress(0);
    }, [levels, verticalIndex, hIdx]);

    useEffect(() => {
        if (isHovered || !inView || !currentItem || currentItem.mediaType === "video") return;
        clearInterval(progressTimer.current);
        setProgress(0);
        progressTimer.current = setInterval(() => {
            setProgress(p => { if (p >= 100) { advance(); return 0; } return p + (TICK_MS / DURATION_MS) * 100; });
        }, TICK_MS);
        return () => clearInterval(progressTimer.current);
    }, [isHovered, inView, verticalIndex, hIdx, advance, currentItem?.mediaType, DURATION_MS]);

    useEffect(() => { if (isHovered) clearInterval(progressTimer.current); }, [isHovered]);

    const handleVideoTimeUpdate = useCallback((e) => {
        if (!isHovered && inView && e.target.currentTime >= 5) advance();
    }, [isHovered, inView, advance]);

    const goTo = (v, h) => {
        setVerticalIndex(v);
        setHorizontalIndices(prev => { const n = [...prev]; n[v] = h; return n; });
        setProgress(0);
    };

    const handleHorizontal = (dir) => {
        const len  = currentLevel.items.length;
        const next = dir === "next" ? (hIdx + 1) % len : (hIdx - 1 + len) % len;
        goTo(verticalIndex, next);
    };

    const onTouchStart = (e) => setDragStart(e.touches[0].clientX);
    const onTouchEnd   = (e) => {
        if (dragStart === null) return;
        const dx = e.changedTouches[0].clientX - dragStart;
        if (Math.abs(dx) > 50) handleHorizontal(dx < 0 ? "next" : "prev");
        setDragStart(null);
    };

    const handleCardClick = () => {
        if (!currentItem?.link) return;
        currentItem.link.startsWith("http") ? window.open(currentItem.link, "_blank") : navigate(currentItem.link);
    };

    // ── Derived styles — MUST be before any early returns ────────────────
    const isAdLevel   = currentItem?.isAd;
    const overlayBg   = buildOverlay(lc);
    const cropStyle   = buildCropStyle(cd);
    const flexPos     = textPosToFlex(lc.textPosition);
    const titleFS     = { sm: "13px", md: "16px", lg: "20px", xl: "24px" }[lc.titleSize] || "16px";
    const titleFW     = { bold: 700, black: 900, extrabold: 800 }[lc.titleWeight] || 900;
    const titleAlign  = flexPos.alignItems === "flex-end" ? "right" : flexPos.alignItems === "center" ? "center" : "left";
    const rad         = btnRadius(bs.radius);

    const btnBaseStyle = useMemo(() => {
        const base = { display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", cursor: "pointer", borderRadius: rad, border: "none", transition: "all 0.15s" };
        if (bs.variant === "filled")  return { ...base, background: bs.bgColor, color: bs.textColor };
        if (bs.variant === "outline") return { ...base, background: "transparent", color: bs.borderColor, border: `1.5px solid ${bs.borderColor}` };
        if (bs.variant === "ghost")   return { ...base, background: "rgba(255,255,255,0.1)", color: "#fff", backdropFilter: "blur(8px)" };
        return base;
    }, [bs, rad]);

    const btnIcon = useMemo(() => {
        const icons = { arrow: <HiArrowRight className="text-[10px]" />, globe: <FaGlobe className="text-[9px]" />, instagram: <FaInstagram className="text-[9px]" />, chevron: <FaChevronRight className="text-[8px]" />, none: null };
        if (currentItem?.link?.includes("instagram")) return <FaInstagram className="text-[9px]" />;
        if (currentItem?.link?.startsWith("http") && bs.icon !== "instagram") return icons.globe;
        return icons[bs.icon] || icons.chevron;
    }, [bs.icon, currentItem?.link]);

    // ── Early returns AFTER all hooks ─────────────────────────────────────
    if (isLoading && !adsData) return <BannerSkeleton />;
    if (!currentItem) return null;

    return (
        <>
            {currentLevel.label && (
                <div className="px-1 mb-3 flex items-center gap-2.5">
                    <div className="w-1 h-5 bg-amber-500 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
                    <h2 className="text-[13px] font-black tracking-widest text-white/90 uppercase select-none">
                        {currentLevel.label}
                    </h2>
                    <div className="flex-1 h-px bg-gradient-to-r from-white/20 to-transparent ml-2 opacity-50" />
                </div>
            )}
            <div
                ref={containerRef}
                className="relative w-full overflow-hidden rounded-[1.5rem] bg-zinc-950 border border-white/6 shadow-xl shadow-black/50 cursor-pointer select-none aspect-[16/10] lg:aspect-[1.8/1]"
                style={{ willChange: "transform", transform: "translateZ(0)" }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            onClick={handleCardClick}
        >
            {/* ── PROGRESS BAR ─────────────────────────────────────────── */}
            {lc.showProgressBar && (
                <div className="absolute bottom-0 inset-x-0 h-[2px] z-50 bg-white/8">
                    <motion.div className="h-full bg-white/60" style={{ width: `${progress}%` }} transition={{ ease: "linear" }} />
                </div>
            )}

            {/* ── MEDIA LAYER ──────────────────────────────────────────── */}
            <AnimatePresence mode="sync">
                <motion.div
                    key={`media-${verticalIndex}-${hIdx}`}
                    variants={mediaVariants} initial="enter" animate="center" exit="exit"
                    className="absolute inset-0"
                    style={{ willChange: "opacity, transform" }}
                >
                    {!mediaReady && <div className="absolute inset-0 bg-zinc-900 z-10" />}

                    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
                        {currentItem.mediaType === "video" ? (
                            <video
                                key={currentItem.mediaUrl}
                                src={currentItem.mediaUrl}
                                autoPlay={inView} loop muted={isMuted} playsInline crossOrigin="anonymous"
                                onTimeUpdate={handleVideoTimeUpdate}
                                onLoadedData={() => setMediaReady(true)}
                                ref={(el) => { if (el) { inView ? el.play().catch(() => {}) : el.pause(); } }}
                                style={{ ...cropStyle, opacity: mediaReady ? 1 : 0, transition: "opacity 0.5s ease" }}
                            />
                        ) : (
                            <img
                                src={currentItem.mediaUrl}
                                alt={currentItem.title}
                                crossOrigin="anonymous"
                                onLoad={() => setMediaReady(true)}
                                style={{ ...cropStyle, opacity: mediaReady ? 1 : 0, transition: "opacity 0.5s ease" }}
                            />
                        )}
                    </div>

                    {/* Overlay */}
                    <div className="absolute inset-0 pointer-events-none" style={{ background: overlayBg }} />
                </motion.div>
            </AnimatePresence>

            {/* ── CONTENT HUD ──────────────────────────────────────────── */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={`hud-${verticalIndex}-${hIdx}`}
                    variants={hudVariants} initial="hidden" animate="show" exit="exit"
                    className="absolute inset-0 p-4 pb-3.5 z-20 pointer-events-none"
                    style={{ display: "flex", flexDirection: "column", ...flexPos }}
                >
                    {/* Badge row */}
                    {lc.showBadge && (
                        <motion.div variants={hudItem} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 8px", borderRadius: 6, background: lc.badgeColor || "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.1)", fontSize: "7.5px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.16em", color: "#fff" }}>
                                <currentLevel.icon className={`${currentLevel.color} text-[9px] flex-shrink-0`} />
                                {(lc.badgeText || currentItem.badge || currentLevel.label).toUpperCase()}
                            </span>
                            {isAdLevel && lc.showSponsorTag && (
                                <span style={{ padding: "2px 6px", borderRadius: 6, background: "rgba(245,158,11,0.85)", fontSize: "6.5px", fontWeight: 900, textTransform: "uppercase", color: "#fff" }}>
                                    SPONSOR
                                </span>
                            )}
                        </motion.div>
                    )}

                    {/* Title */}
                    <motion.h2 variants={hudItem} style={{ fontSize: titleFS, fontWeight: titleFW, color: lc.titleColor, lineHeight: 1.2, letterSpacing: "-0.02em", margin: "0 0 4px", textShadow: "0 2px 12px rgba(0,0,0,0.5)", maxWidth: "80%", textAlign: titleAlign }}>
                        {currentItem.title}
                    </motion.h2>

                    {/* Description */}
                    {lc.showDescription && (
                        <motion.p variants={hudItem} style={{ fontSize: "9.5px", color: lc.descColor, fontWeight: 500, lineHeight: 1.5, margin: "0 0 10px", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", maxWidth: "72%" }}>
                            {currentItem.description}
                        </motion.p>
                    )}

                    {/* CTA row */}
                    <motion.div variants={hudItem} style={{ display: "flex", alignItems: "center", gap: 6, pointerEvents: "auto" }}>
                        <button
                            onClick={(e) => { e.stopPropagation(); currentItem.link.startsWith("http") ? window.open(currentItem.link, "_blank") : navigate(currentItem.link); }}
                            style={btnBaseStyle}
                            onMouseEnter={e => { e.currentTarget.style.opacity = "0.85"; e.currentTarget.style.transform = "scale(0.97)"; }}
                            onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "scale(1)"; }}
                        >
                            {bs.iconPosition === "left" && btnIcon}
                            {currentItem.linkText}
                            {bs.iconPosition !== "left" && btnIcon}
                        </button>

                        {isAdLevel && lc.showDetailsBtn && (
                            <button onClick={(e) => { e.stopPropagation(); navigate(`/ad-details/${currentItem._id || currentItem.id}`); }}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/18 active:scale-95 text-white rounded-lg text-[9px] font-bold transition-all backdrop-blur-md border border-white/10">
                                Details <HiArrowRight className="text-[10px]" />
                            </button>
                        )}

                        {isAdLevel && lc.showMuteBtn && currentItem.mediaType === "video" && (
                            <button onClick={(e) => { e.stopPropagation(); setIsMuted(p => !p); }}
                                className="w-7 h-7 flex items-center justify-center bg-white/10 hover:bg-white/18 active:scale-95 rounded-lg text-white transition-all backdrop-blur-md border border-white/10"
                                aria-label={isMuted ? "Unmute" : "Mute"}>
                                {isMuted ? <HiSpeakerXMark className="w-3.5 h-3.5" /> : <HiSpeakerWave className="w-3.5 h-3.5" />}
                            </button>
                        )}
                    </motion.div>
                </motion.div>
            </AnimatePresence>


            {/* ── SLIDE DOTS ───────────────────────────────────────────── */}
            {currentLevel.items.length > 1 && (
                <div className="absolute top-4 right-4 z-30 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    {currentLevel.items.map((_, idx) => (
                        <button key={idx} onClick={() => goTo(verticalIndex, idx)} className="transition-all duration-300"
                            style={{ width: idx === hIdx ? 18 : 5, height: 5, borderRadius: 99, background: idx === hIdx ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.25)" }} />
                    ))}
                </div>
            )}

            <style>{`@keyframes ubShimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}`}</style>
        </div>
    </>
);
};

export default UnifiedBannerSlider;