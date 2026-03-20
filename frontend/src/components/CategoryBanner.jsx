/**
 * CategoryBanner.jsx
 * A focused, premium banner component for specific pages (Jobs, Editors, Gigs).
 * Unlike UnifiedBannerSlider, this does not have vertical levels.
 * It's designed to look like high-end app banners (Zepto/Flipkart style).
 */
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    HiArrowRight,
    HiSpeakerWave,
    HiSpeakerXMark,
    HiOutlineChevronLeft,
    HiOutlineChevronRight
} from "react-icons/hi2";
import { FaAd, FaInstagram, FaGlobe, FaChevronRight } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

// ─── UTILS (Mirrored from UnifiedBannerSlider for rendering consistency) ───
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
    fixed = fixed.replace(/_jpg([/_?#]|$)/gi, ".jpg$1").replace(/_jpeg([/_?#]|$)/gi, ".jpeg$1").replace(/_png([/_?#|$)/gi, ".png$1").replace(/_mp4([/_?#]|$)/gi, ".mp4$1").replace(/_webp([/_?#]|$)/gi, ".webp$1");
    return fixed;
};

const resolveLayout = (lc = {}) => ({
    textPosition:     lc.textPosition     ?? "bl",
    overlayDirection: lc.overlayDirection ?? "to-top",
    overlayOpacity:   lc.overlayOpacity   ?? 70,
    overlayColor:     lc.overlayColor     ?? "#000000",
    titleSize:        lc.titleSize        ?? "md",
    titleWeight:      lc.titleWeight      ?? "black",
    titleColor:       lc.titleColor       ?? "#ffffff",
    descColor:        lc.descColor        ?? "rgba(255,255,255,0.8)",
    showBadge:        lc.showBadge        ?? true,
    showSponsorTag:   lc.showSponsorTag   ?? true,
    showDescription:  lc.showDescription  ?? true,
    showProgressBar:  lc.showProgressBar  ?? true,
    showDetailsBtn:   lc.showDetailsBtn   ?? true,
    showMuteBtn:      lc.showMuteBtn      ?? true,
    slideDuration:    lc.slideDuration    ?? 5000,
    badgeText:        lc.badgeText        ?? "",
    badgeColor:       lc.badgeColor       ?? "rgba(255,255,255,0.15)",
});

const resolveButton = (bs = {}) => ({
    variant:      bs.variant      ?? "filled",
    bgColor:      bs.bgColor      ?? "#ffffff",
    textColor:    bs.textColor    ?? "#000000",
    borderColor:  bs.borderColor  ?? "#ffffff",
    radius:       bs.radius       ?? "full",
    icon:         bs.icon         ?? "chevron",
    iconPosition: bs.iconPosition ?? "right",
});

const buildOverlay = (lc) => {
    const hexToRgba = (hex, opacity) => {
        try {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r},${g},${b},${((opacity || 70) / 100).toFixed(2)})`;
        } catch { return `rgba(0,0,0,${((opacity || 70) / 100).toFixed(2)})`; }
    };
    const color = lc.overlayColor || "#000000";
    const op    = lc.overlayOpacity ?? 70;
    const dirs  = {
        "to-top":    `linear-gradient(to top, ${hexToRgba(color, op)}, transparent 70%)`,
        "to-bottom": `linear-gradient(to bottom, ${hexToRgba(color, op)}, transparent 70%)`,
        "to-left":   `linear-gradient(to left, ${hexToRgba(color, op)}, transparent 70%)`,
        "to-right":  `linear-gradient(to right, ${hexToRgba(color, op)}, transparent 70%)`,
        "radial":    `radial-gradient(circle at center, transparent 30%, ${hexToRgba(color, op)})`,
        "full":      hexToRgba(color, op)
    };
    return dirs[lc.overlayDirection] || dirs["to-top"];
};

const buildCropStyle = (cd = {}) => ({
    position: "absolute",
    width: "100%",
    height: "100%",
    objectFit: cd.fit || "cover",
    objectPosition: `${cd.x || 50}% ${cd.y || 50}%`,
    transform: `scale(${cd.zoom || 1})`,
});

const textPosToFlex = (pos) => {
    const map = {
        tl: { justifyContent: "flex-start", alignItems: "flex-start" },
        tc: { justifyContent: "flex-start", alignItems: "center" },
        tr: { justifyContent: "flex-start", alignItems: "flex-end" },
        cl: { justifyContent: "center", alignItems: "flex-start" },
        cc: { justifyContent: "center", alignItems: "center" },
        cr: { justifyContent: "center", alignItems: "flex-end" },
        bl: { justifyContent: "flex-end", alignItems: "flex-start" },
        bc: { justifyContent: "flex-end", alignItems: "center" },
        br: { justifyContent: "flex-end", alignItems: "flex-end" },
    };
    return map[pos] || map.bl;
};

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────
const CategoryBanner = ({ location, fallbackItems = [], className = "" }) => {
    const navigate = useNavigate();
    const { backendURL } = useAppContext();
    const [index, setIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [mediaReady, setMediaReady] = useState(false);
    const containerRef = useRef(null);
    const progressTimer = useRef(null);

    // Fetch ads for this location
    const { data: adsData, isLoading } = useQuery({
        queryKey: ["category-ads", location],
        queryFn: async () => {
            const res = await axios.get(`${backendURL}/api/ads?location=${location}`);
            return res.data?.ads || [];
        },
        enabled: !!backendURL && !!location,
        staleTime: 5 * 60 * 1000,
    });

    const items = useMemo(() => {
        return (adsData || []).map(ad => ({
            ...ad,
            isAd: true,
            mediaUrl: repairUrl(ad.mediaUrl),
            thumbnailUrl: repairUrl(ad.thumbnailUrl),
        }));
    }, [adsData]);

    const currentItem = items[index];

    const lc = useMemo(() => resolveLayout(currentItem?.layoutConfig), [currentItem]);
    const bs = useMemo(() => resolveButton(currentItem?.buttonStyle), [currentItem]);
    const cd = currentItem?.cropData || {};

    const DURATION_MS = lc.slideDuration || 5000;
    const TICK_MS = 32;

    const advance = useCallback(() => {
        if (items.length <= 1) return;
        setIndex(prev => (prev + 1) % items.length);
        setProgress(0);
    }, [items.length]);

    useEffect(() => {
        if (isHovered || items.length <= 1 || !currentItem) return;
        clearInterval(progressTimer.current);
        progressTimer.current = setInterval(() => {
            setProgress(p => {
                if (p >= 100) { advance(); return 0; }
                return p + (TICK_MS / DURATION_MS) * 100;
            });
        }, TICK_MS);
        return () => clearInterval(progressTimer.current);
    }, [isHovered, index, items.length, advance, DURATION_MS, currentItem]);

    const handleVideoTimeUpdate = useCallback((e) => {
        if (!isHovered && e.target.currentTime >= 10) advance();
    }, [isHovered, advance]);

    const handleCardClick = () => {
        if (!currentItem?.link) return;
        currentItem.link.startsWith("http") ? window.open(currentItem.link, "_blank") : navigate(currentItem.link);
    };

    if (isLoading && !adsData) return <div className="w-full aspect-[16/7] md:aspect-[18/6] bg-zinc-900 animate-pulse rounded-2xl mb-6" />;
    
    if (items.length === 0) {
        return (
            <div className={`w-full aspect-[16/7] md:aspect-[18/6] bg-zinc-900/40 border border-white/5 rounded-[1.2rem] mb-6 flex items-center justify-center ${className}`}>
                <p className="text-zinc-500 text-sm font-medium">No ads or banners</p>
            </div>
        );
    }

    if (!currentItem) return null;

    const overlayBg = buildOverlay(lc);
    const cropStyle = buildCropStyle(cd);
    const flexPos   = textPosToFlex(lc.textPosition);
    const titleFS   = { sm: "14px", md: "18px", lg: "24px", xl: "32px" }[lc.titleSize] || "18px";
    const titleFW   = { bold: 700, black: 900, extrabold: 800 }[lc.titleWeight] || 900;
    const titleAlign = flexPos.alignItems === "flex-end" ? "right" : flexPos.alignItems === "center" ? "center" : "left";

    return (
        <div className={`relative w-full mb-6 group ${className}`}>
            <div
                ref={containerRef}
                className="relative w-full overflow-hidden rounded-[1.2rem] bg-zinc-950 border border-white/5 shadow-2xl cursor-pointer aspect-[16/7] md:aspect-[18/6]"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={handleCardClick}
            >
                {/* Media Layer */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`slide-${index}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6 }}
                        className="absolute inset-0"
                    >
                        <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
                            {currentItem.mediaType === "video" ? (
                                <video
                                    src={currentItem.mediaUrl}
                                    autoPlay loop muted={isMuted} playsInline crossOrigin="anonymous"
                                    onTimeUpdate={handleVideoTimeUpdate}
                                    onLoadedData={() => setMediaReady(true)}
                                    style={cropStyle}
                                />
                            ) : (
                                <img
                                    src={currentItem.mediaUrl}
                                    alt={currentItem.title}
                                    crossOrigin="anonymous"
                                    onLoad={() => setMediaReady(true)}
                                    style={cropStyle}
                                />
                            )}
                        </div>
                        {/* Overlay */}
                        <div className="absolute inset-0 pointer-events-none" style={{ background: overlayBg }} />
                    </motion.div>
                </AnimatePresence>

                {/* Content HUD */}
                <div 
                    className="absolute inset-0 p-6 z-20 pointer-events-none"
                    style={{ display: "flex", flexDirection: "column", ...flexPos }}
                >
                    {lc.showBadge && (
                        <div className="flex items-center gap-2 mb-3">
                            <span style={{ 
                                display: "inline-flex", padding: "3px 10px", borderRadius: 6, 
                                background: lc.badgeColor || "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)",
                                fontSize: "8px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", color: "#fff" 
                            }}>
                                {currentItem.badge || "PROMOTED"}
                            </span>
                            {currentItem.isAd && lc.showSponsorTag && (
                                <span className="bg-amber-500/90 text-white text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter">
                                    SPONSORED
                                </span>
                            )}
                        </div>
                    )}

                    <h2 style={{ 
                        fontSize: titleFS, fontWeight: titleFW, color: lc.titleColor, lineHeight: 1.1, 
                        textAlign: titleAlign, textShadow: "0 2px 10px rgba(0,0,0,0.5)", maxWidth: "85%" 
                    }}>
                        {currentItem.title}
                    </h2>

                    {lc.showDescription && currentItem.description && (
                        <p style={{ 
                            fontSize: "10px", color: lc.descColor, fontWeight: 500, marginTop: "6px", 
                            maxWidth: "70%", textAlign: titleAlign, opacity: 0.9 
                        }}>
                            {currentItem.description}
                        </p>
                    )}

                    <div className="mt-4 pointer-events-auto flex items-center gap-3">
                        <button 
                            className="group/btn flex items-center gap-2 px-5 py-2 whitespace-nowrap text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
                            style={{ 
                                background: bs.variant === "filled" ? bs.bgColor : "transparent",
                                color: bs.variant === "filled" ? bs.textColor : bs.borderColor,
                                border: bs.variant === "outline" ? `1.5px solid ${bs.borderColor}` : "none",
                                borderRadius: bs.radius === "full" ? "99px" : "8px"
                            }}
                        >
                            {currentItem.linkText || "Learn More"}
                            <HiArrowRight className="text-[12px] group-hover/btn:translate-x-1 transition-transform" />
                        </button>

                        {currentItem.mediaType === "video" && lc.showMuteBtn && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
                                className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md border border-white/10 text-white transition-all shadow-lg"
                            >
                                {isMuted ? <HiSpeakerXMark className="w-4 h-4" /> : <HiSpeakerWave className="w-4 h-4" />}
                            </button>
                        )}
                    </div>
                </div>

                {/* Progress Bar */}
                {items.length > 1 && lc.showProgressBar && (
                    <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/10 z-30">
                        <motion.div 
                            className="h-full bg-white/70"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                )}

                {/* Navigation Dots */}
                {items.length > 1 && (
                    <div className="absolute bottom-4 right-6 z-30 flex items-center gap-1.5 pointer-events-auto">
                        {items.map((_, i) => (
                            <button
                                key={i}
                                onClick={(e) => { e.stopPropagation(); setIndex(i); setProgress(0); }}
                                className={`h-1 transition-all duration-300 rounded-full ${index === i ? "bg-white w-5" : "bg-white/30 w-1.5"}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CategoryBanner;
