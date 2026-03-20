/**
 * UnifiedBannerSlider.jsx
 * Reads layoutConfig, buttonStyle, cropData from each ad document
 * so every ad can look completely different based on admin configuration.
 */
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

//only keep required icons not extra icons
import {
    HiOutlineBriefcase,
    HiOutlineUserGroup,
    HiArrowRight,
    HiSpeakerWave,
    HiSpeakerXMark,
    HiOutlineSparkles,
    HiOutlineVideoCamera,
    HiOutlinePhoto,
    HiOutlineAdjustmentsHorizontal,
    HiOutlineRectangleGroup,
    HiOutlineChartBarSquare,
    HiOutlineCursorArrowRipple,
    HiOutlineSquare3Stack3D,
    HiOutlineClipboardDocumentList,
    HiOutlineUser,
    HiOutlineCalendarDays,
    HiOutlineFilm,
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
    // Final check: if it still has many underscores and is definitely a Cloudinary URL, it's likely mangled
    if (fixed.includes("res.cloudinary.com") && fixed.split('_').length > 5) {
         fixed = fixed.replace(/_+/g, '/');
         fixed = fixed.replace(/(https?):\/+/g, '$1://');
         fixed = fixed.replace(/([^:])\/\/+/g, "$1/");
    }
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
const UnifiedBannerSlider = ({ filter = null, pageName = "home" }) => {
    const { backendURL } = useAppContext();
    const { socket }     = useSocket();
    const navigate       = useNavigate();
    const queryClient    = useQueryClient();

    const [verticalIndex,     setVerticalIndex]     = useState(0);
    const [horizontalIndices, setHorizontalIndices] = useState(new Array(10).fill(0));
    const [isMuted,           setIsMuted]           = useState(true);
    const [isHovered,         setIsHovered]         = useState(false);
    const [mediaReady,        setMediaReady]        = useState(false);
    const [mediaError,        setMediaError]        = useState(false);
    const [showSkeleton,       setShowSkeleton]       = useState(false);
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
        queryKey: ["ads", pageName, backendURL],
        queryFn: async () => {
            // Determine locations to fetch
            let locations = "banners:home_0";
            if (pageName === "home")    locations = "banners:home_0,banners:home_1,banners:home_2";
            if (pageName === "editors") locations = "banners:editors";
            if (pageName === "gigs")    locations = "banners:gigs";
            if (pageName === "jobs")    locations = "banners:jobs";
            if (pageName === "explore") locations = "banners:explore";

            const { data } = await axios.get(`${backendURL}/api/ads?location=${locations}`);
            return data;
        },
        staleTime: 60000,
    });

    // ── Real-time refresh ─────────────────────────────────────────────────
    useEffect(() => {
        if (!socket) return;
        const handleAdsUpdated = () => {
            console.log("📢 ads:updated received — refetching banner ads");
            queryClient.invalidateQueries({ queryKey: ["ads"] });
        };
        socket.on("ads:updated", handleAdsUpdated);
        return () => socket.off("ads:updated", handleAdsUpdated);
    }, [socket, queryClient]);

    // ── Build levels ──────────────────────────────────────────────────────
    const levels = useMemo(() => {
        const dbAds   = adsData?.ads || [];
        const result = [];

        // Helper to format ad for banner
        const formatAd = (ad) => ({
            _id:            ad._id,
            title:          ad.title,
            description:    ad.description || ad.tagline || "",
            mediaUrl:       repairUrl(ad.mediaUrl),
            mediaType:      ad.mediaType,
            linkText:       ad.ctaText || "Learn More",
            badge:          ad.badge || "SPONSOR",
            isAd:           true,
            cropData:       ad.cropData     || {},
            layoutConfig:   ad.layoutConfig || {},
            buttonStyle:    ad.buttonStyle  || {},
            // Navigation
            buttonLinkType: ad.buttonLinkType || "ad_details",
            buttonLink:     ad.buttonLink || "",
            cardLinkType:   ad.cardLinkType || "none",
            cardLink:       ad.cardLink || "",
        });

        // ── Level 0 ──────────────────────────────────────────────────────────
        const level0Ads = dbAds.filter(a => a.displayLocations?.some(l => 
            l === "banners:home_0" || l === "banners:editors" || l === "banners:gigs" || l === "banners:jobs" || l === "banners:explore" ||
            l === "banners_home_0" || l === "banners_editors" || l === "banners_gigs" || l === "banners_jobs" || 
            l === "home_banner_0" || l === "editors_banner" || l === "gigs_banner" || l === "jobs_banner" || l === "home_banner"
        )).map(formatAd);
        
        if (level0Ads.length > 0) {
            result.push({
                id: "home_banner_0",
                label: "HOME BANNER LEVEL 0",
                color: "text-amber-400",
                icon: FaAd,
                items: level0Ads
            });
        }

        // ── Level 1 ──────────────────────────────────────────────────────────
        const level1Ads = dbAds.filter(a => a.displayLocations?.some(l => l === "banners:home_1" || l === "banners_home_1" || l === "home_banner_1")).map(formatAd);
        if (level1Ads.length > 0) {
            result.push({
                id: "home_banner_1",
                label: "HOME BANNER LEVEL 1",
                color: "text-violet-400",
                icon: HiOutlineSparkles,
                items: level1Ads
            });
        }

        // ── Level 2 ──────────────────────────────────────────────────────────
        const level2Ads = dbAds.filter(a => a.displayLocations?.some(l => l === "banners:home_2" || l === "banners_home_2" || l === "home_banner_2")).map(formatAd);
        if (level2Ads.length > 0) {
            result.push({
                id: "home_banner_2",
                label: "HOME BANNER LEVEL 2",
                color: "text-emerald-400",
                icon: HiOutlineFilm,
                items: level2Ads
            });
        }

        if (result.length === 0) {
            result.push({
                id: "empty_state",
                label: "NO BANNERS",
                color: "text-zinc-500",
                icon: FaAd,
                items: [{
                    id: "empty_1",
                    isEmptyState: true,
                }]
            });
        }

        return result;
    }, [adsData]);

    useEffect(() => { if (verticalIndex >= levels.length) setVerticalIndex(0); }, [levels.length]);

    const currentLevel = levels[verticalIndex] ?? levels[0];
    const hIdx         = horizontalIndices[verticalIndex] ?? 0;
    const currentItem  = currentLevel?.items[hIdx];

    const displayTitle = useMemo(() => {
        if (pageName === "home") return currentLevel?.label;
        if (pageName === "editors") return "EXPLORE EDITOR BANNER";
        if (pageName === "gigs")    return "GIG BANNER";
        if (pageName === "jobs")    return "JOB BANNER";
        return currentLevel?.label;
    }, [pageName, currentLevel]);

    // Per-item resolved config
    const lc = useMemo(() => resolveLayout(currentItem?.layoutConfig), [currentItem]);
    const bs = useMemo(() => resolveButton(currentItem?.buttonStyle),  [currentItem]);
    const cd = currentItem?.cropData || {};

    const DURATION_MS = lc.slideDuration || 5000;
    const bannerKey   = `${verticalIndex}-${hIdx}-${currentItem?._id}`;

    // Calculate preload items (next and previous)
    const preloadItems = useMemo(() => {
        if (!currentLevel || !currentLevel.items || currentLevel.items.length <= 1) return [];
        const len = currentLevel.items.length;
        const next = (hIdx + 1) % len;
        const prev = (hIdx - 1 + len) % len;
        
        const unique = [];
        const seen = new Set([currentItem?._id]); // Don't preload current

        [currentLevel.items[next], currentLevel.items[prev]].forEach(item => {
            if (item && item._id && !seen.has(item._id)) {
                unique.push(item);
                seen.add(item._id);
            }
        });
        return unique;
    }, [currentLevel, hIdx, currentItem?._id]);

    useEffect(() => { 
        setMediaReady(false); 
        setMediaError(false);
        setShowSkeleton(false);
        
        // Only show skeleton if it takes more than 150ms to load (prevents flashing for cached items)
        const skeletonTimer = setTimeout(() => {
            if (!mediaReady) setShowSkeleton(true);
        }, 150);

        // FAILSAFE: If media doesn't load in 4s, clear the "loading" state anyway
        const failsafeTimer = setTimeout(() => {
            setMediaReady(true);
        }, 4000);

        return () => {
            clearTimeout(skeletonTimer);
            clearTimeout(failsafeTimer);
        };
    }, [bannerKey]);

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
        const { cardLinkType, cardLink } = currentItem;
        if (!cardLinkType || cardLinkType === "none") return; // nothing happens
        if (cardLinkType === "external" && cardLink) { window.open(cardLink, "_blank"); return; }
        if (cardLinkType === "internal" && cardLink) { navigate(cardLink); return; }
    };

    const handleButtonClick = (e) => {
        e.stopPropagation(); // CRITICAL: never let this bubble to card click
        const item = currentItem;
        if (!item) return;
        const { buttonLinkType, buttonLink, _id } = item;
        if (!buttonLinkType || buttonLinkType === "none") return;
        if (buttonLinkType === "ad_details") { navigate(`/ad-details/${_id}`); return; }
        if (buttonLinkType === "external" && buttonLink) { window.open(buttonLink, "_blank"); return; }
        if (buttonLinkType === "internal" && buttonLink) { navigate(buttonLink); return; }
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
            {currentItem.isEmptyState ? (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/40 z-10">
                    <p className="text-zinc-500 text-sm font-medium">No ads or banners</p>
                </div>
            ) : (
                <>
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
                    {/* Only show loading overlay if media is not ready and skeleton timer triggered */}
                    {!mediaReady && showSkeleton && (
                        <div className="absolute inset-0 bg-zinc-900 z-10 animate-pulse flex items-center justify-center">
                            <div className="w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
                        </div>
                    )}

                    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
                        {currentItem.mediaType === "video" ? (
                            <video
                                key={`vid-${bannerKey}`}
                                src={currentItem.mediaUrl}
                                autoPlay={inView} loop muted={isMuted} playsInline crossOrigin="anonymous"
                                onTimeUpdate={handleVideoTimeUpdate}
                                onLoadedData={() => setMediaReady(true)}
                                onError={() => { setMediaError(true); setMediaReady(true); }}
                                ref={(el) => { if (el) { inView ? el.play().catch(() => {}) : el.pause(); } }}
                                style={{ ...cropStyle, opacity: mediaReady ? 1 : 0, transition: "opacity 0.5s ease" }}
                            />
                        ) : (
                            <img
                                key={`img-${bannerKey}`}
                                src={currentItem.mediaUrl}
                                alt={currentItem.title}
                                crossOrigin="anonymous"
                                onLoad={() => setMediaReady(true)}
                                onError={() => { setMediaError(true); setMediaReady(true); }}
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
                                {(lc.badgeText || currentItem.badge || displayTitle).toUpperCase()}
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
                            onClick={handleButtonClick}
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
            </>
            )}
            
            {/* ── CATEGORY SWITCHER (Show only if > 1 level) ────────────── */}
            {!currentItem.isEmptyState && levels.length > 1 && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-1.5 py-2 px-1.5 rounded-2xl bg-black/45 backdrop-blur-xl border border-white/8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                    {levels.map((level, idx) => {
                        const active = verticalIndex === idx;
                        return (
                            <button key={level.id} onClick={() => goTo(idx, 0)} title={level.label} className={`relative w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${active ? "bg-white shadow-lg shadow-white/15 scale-105" : "bg-transparent hover:bg-white/10"}`}>
                                <level.icon className={`text-[11px] ${active ? "text-black" : level.color}`} />
                                {active && <motion.div layoutId="vertSwitcherGlow" className="absolute -inset-1 rounded-full bg-white/12 blur-md -z-10" transition={{ type: "spring", damping: 20, stiffness: 300 }} />}
                            </button>
                        );
                    })}
                </div>
            )}


            {/* ── SLIDE DOTS ───────────────────────────────────────────── */}
            {!currentItem.isEmptyState && currentLevel.items.length > 1 && (
                <div className="absolute top-4 right-4 z-30 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    {currentLevel.items.map((_, idx) => (
                        <button key={idx} onClick={() => goTo(verticalIndex, idx)} className="transition-all duration-300"
                            style={{ width: idx === hIdx ? 18 : 5, height: 5, borderRadius: 99, background: idx === hIdx ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.25)" }} />
                    ))}
                </div>
            )}

            <style>{`@keyframes ubShimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}`}</style>
            
            {/* ── HIDDEN PRELOADER ─────────────────────────────────────── */}
            <div className="hidden" aria-hidden="true">
                {preloadItems.map((item) => (
                    item.mediaType === "video" ? (
                        <video key={`preload-vid-${item._id}`} src={item.mediaUrl} preload="auto" muted />
                    ) : (
                        <img key={`preload-img-${item._id}`} src={item.mediaUrl} alt="" />
                    )
                ))}
            </div>
        </div>
    </>
);
};

export default UnifiedBannerSlider;