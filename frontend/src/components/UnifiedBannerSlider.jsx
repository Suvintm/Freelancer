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

// ─── URL repair (kept local — ads route bypasses global sanitizer) ───────────
const repairUrl = (url) => {
    if (!url || typeof url !== "string") return url;
    if (!url.includes("cloudinary") && !url.includes("res_") && !url.includes("_com")) return url;
    let fixed = url;
    fixed = fixed.replace(/^(https?):?\/*_+/gi, "$1://");
    fixed = fixed.replace(/_+res_+cloudinary_+com/g, "res.cloudinary.com")
                 .replace(/res_cloudinary_com/g, "res.cloudinary.com")
                 .replace(/cloudinary_com/g, "cloudinary.com");
    if (fixed.includes("res.cloudinary.com")) {
        fixed = fixed.replace(/res\.cloudinary\.com_+/g, "res.cloudinary.com/");
        fixed = fixed.replace(/image_upload_+/g, "image/upload/")
                     .replace(/video_upload_+/g, "video/upload/")
                     .replace(/raw_upload_+/g, "raw/upload/");
        fixed = fixed.replace(/([/_]?v\d+)_+/g, "$1/");
        fixed = fixed.replace(/(res\.cloudinary\.com\/[^/_]+)_+(image|video|raw|authenticated)_*/g, "$1/$2/");
        fixed = fixed.replace(/advertisements_images_+/g, "advertisements/images/")
                     .replace(/advertisements_videos_+/g, "advertisements/videos/")
                     .replace(/advertisements_gallery_+/g, "advertisements/gallery/");
        fixed = fixed.replace(/_+(upload|image|video|v\d+)_+/g, "/$1/");
        fixed = fixed.replace(/_([a-z0-9\-_]+\.(webp|jpg|jpeg|png|mp4|mov|m4v|json))/gi, "/$1");
        fixed = fixed.replace(/([^:])\/\/+/g, "$1/");
    }
    fixed = fixed.replace(/_jpg([/_?#]|$)/gi, ".jpg$1")
                 .replace(/_jpeg([/_?#]|$)/gi, ".jpeg$1")
                 .replace(/_png([/_?#]|$)/gi, ".png$1")
                 .replace(/_mp4([/_?#]|$)/gi, ".mp4$1")
                 .replace(/_webp([/_?#]|$)/gi, ".webp$1");
    return fixed;
};

// ─── Animation variants ──────────────────────────────────────────────────────
const mediaVariants = {
    enter:  { opacity: 0, scale: 1.06 },
    center: { opacity: 1, scale: 1,    transition: { duration: 0.7, ease: [0.25, 0.1, 0.25, 1] } },
    exit:   { opacity: 0, scale: 0.97, transition: { duration: 0.45, ease: [0.4, 0, 1, 1] } },
};

// Stagger children inside the content HUD
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
    <div className="relative w-full rounded-[1.5rem] overflow-hidden bg-zinc-900 border border-white/5"
         style={{ height: 192 }}>
        <div className="absolute inset-0"
             style={{
                 background: "linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.035) 50%,transparent 60%)",
                 backgroundSize: "200% 100%",
                 animation: "ubShimmer 1.8s infinite",
             }} />
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
const UnifiedBannerSlider = () => {
    const { backendURL } = useAppContext();
const { socket } = useSocket();
    const navigate       = useNavigate();
    const queryClient    = useQueryClient();

    const [verticalIndex,    setVerticalIndex]    = useState(0);
    const [horizontalIndices,setHorizontalIndices]= useState([0, 0, 0]);
    const [isMuted,          setIsMuted]          = useState(true);
    const [isHovered,        setIsHovered]        = useState(false);
    const [mediaReady,       setMediaReady]       = useState(false);
    const [inView,           setInView]           = useState(true);
    const [progress,         setProgress]         = useState(0);
    const [dragStart,        setDragStart]        = useState(null);

    const containerRef   = useRef(null);
    const progressTimer  = useRef(null);
    const DURATION_MS    = 5000; // 5 s per slide
    const TICK_MS        = 50;

    // ── Intersection observer ─────────────────────────────────────────────
    useEffect(() => {
        const io = new IntersectionObserver(
            ([e]) => setInView(e.isIntersecting),
            { threshold: 0.2 }
        );
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
            return {
                ads:     adsRes.data.ads || [],
                showAds: settingsRes.data.showSuvixAds !== false,
            };
        },
        staleTime: 10 * 60 * 1000,
    });

    // ── Real-time ad refresh via socket ───────────────────────────────────
    // When admin creates/updates/deletes an ad, the server emits "ads:updated".
    // We invalidate the React Query cache so the banner refetches immediately.
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
            id: "advertisements",
            label: "Ads",
            color: "text-amber-400",
            icon: FaAd,
            items: dbAds.map(ad => ({
                _id:         ad._id,
                title:       ad.title,
                description: ad.description || ad.tagline || "",
                mediaUrl:    repairUrl(ad.mediaUrl),
                mediaType:   ad.mediaType,
                link:        ad.websiteUrl || `/ad-details/${ad._id}`,
                linkText:    ad.ctaText || "Learn More",
                badge:       ad.badge || "SPONSOR",
                isExternal:  !!ad.websiteUrl,
                isAd:        true,
            }))
        } : null;

        const base = [
            {
                id:    "editors",
                label: "Editors",
                color: "text-violet-400",
                icon:  HiOutlineUserGroup,
                items: [
                    {
                        id: "explore-editors-1",
                        title: "World-Class Talent",
                        description: "Collaborate with 1,200+ specialized video editors globally.",
                        mediaUrl:  "/hero_banner_1_1766946342128.png",
                        mediaType: "image",
                        link:      "/explore-editors",
                        linkText:  "Find Editor",
                        badge:     "exclusive",
                    },
                    {
                        id: "explore-editors-2",
                        title: "Verified Portfolio",
                        description: "Every editor is manually verified for quality and reliability.",
                        mediaUrl:  "/hero_banner_1_1766946342128.png",
                        mediaType: "image",
                        link:      "/explore-editors",
                        linkText:  "Explore Now",
                        badge:     "featured",
                    },
                ],
            },
            {
                id:    "gigs",
                label: "Services",
                color: "text-emerald-400",
                icon:  HiOutlineBriefcase,
                items: [
                    {
                        id: "browse-gigs-1",
                        title: "Professional Gigs",
                        description: "Starting at ₹499. High-speed delivery guaranteed.",
                        mediaUrl:  "/gig_banner_1_1766948855701.png",
                        mediaType: "image",
                        link:      "/explore-editors?tab=gigs",
                        linkText:  "Book Now",
                        badge:     "hot",
                    },
                ],
            },
        ];

        return adsLevel ? [adsLevel, ...base] : base;
    }, [adsData]);

    // Guard out-of-bounds
    useEffect(() => {
        if (verticalIndex >= levels.length) setVerticalIndex(0);
    }, [levels.length]);

    const currentLevel   = levels[verticalIndex] ?? levels[0];
    const hIdx           = horizontalIndices[verticalIndex] ?? 0;
    const currentItem    = currentLevel?.items[hIdx];

    // ── Reset media-ready on slide change ─────────────────────────────────
    useEffect(() => { setMediaReady(false); }, [verticalIndex, hIdx]);

    // ── Progress ticker ───────────────────────────────────────────────────
    const advance = useCallback(() => {
        if (!levels.length) return;
        const lvl     = levels[verticalIndex];
        const isLast  = hIdx >= lvl.items.length - 1;
        if (isLast) {
            const nextV = (verticalIndex + 1) % levels.length;
            setVerticalIndex(nextV);
            // Reset horizontal to 0 for next level
            setHorizontalIndices(prev => {
                const next = [...prev];
                next[nextV] = 0;
                return next;
            });
        } else {
            setHorizontalIndices(prev => {
                const next = [...prev];
                next[verticalIndex] = hIdx + 1;
                return next;
            });
        }
        setProgress(0);
    }, [levels, verticalIndex, hIdx]);

    useEffect(() => {
        if (isHovered || !inView || !currentItem) return;
        // Skip auto-advance for videos — advance on time-update instead
        if (currentItem.mediaType === "video") return;

        clearInterval(progressTimer.current);
        setProgress(0);
        progressTimer.current = setInterval(() => {
            setProgress(p => {
                if (p >= 100) { advance(); return 0; }
                return p + (TICK_MS / DURATION_MS) * 100;
            });
        }, TICK_MS);

        return () => clearInterval(progressTimer.current);
    }, [isHovered, inView, verticalIndex, hIdx, advance, currentItem?.mediaType]);

    // Pause & reset on hover
    useEffect(() => {
        if (isHovered) {
            clearInterval(progressTimer.current);
        }
    }, [isHovered]);

    const handleVideoTimeUpdate = useCallback((e) => {
        if (!isHovered && inView && e.target.currentTime >= 5) advance();
    }, [isHovered, inView, advance]);

    // ── Navigation helpers ────────────────────────────────────────────────
    const goTo = (v, h) => {
        setVerticalIndex(v);
        setHorizontalIndices(prev => { const n=[...prev]; n[v]=h; return n; });
        setProgress(0);
    };

    const handleHorizontal = (dir) => {
        const len  = currentLevel.items.length;
        const next = dir === "next"
            ? (hIdx + 1) % len
            : (hIdx - 1 + len) % len;
        goTo(verticalIndex, next);
    };

    // ── Touch / drag swipe ────────────────────────────────────────────────
    const onTouchStart = (e) => setDragStart(e.touches[0].clientX);
    const onTouchEnd   = (e) => {
        if (dragStart === null) return;
        const dx = e.changedTouches[0].clientX - dragStart;
        if (Math.abs(dx) > 50) handleHorizontal(dx < 0 ? "next" : "prev");
        setDragStart(null);
    };

    const handleCardClick = () => {
        if (!currentItem?.link) return;
        currentItem.link.startsWith("http")
            ? window.open(currentItem.link, "_blank")
            : navigate(currentItem.link);
    };

    // ── Render ────────────────────────────────────────────────────────────
    if (isLoading && !adsData) return <BannerSkeleton />;
    if (!currentItem) return null;

    const isAdLevel = currentItem.isAd;

    return (
        <div
            ref={containerRef}
            className="relative w-full overflow-hidden rounded-[1.5rem] bg-zinc-950 border border-white/6 shadow-xl shadow-black/50 cursor-pointer select-none"
            style={{ height: 192, willChange: "transform", transform: "translateZ(0)" }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            onClick={handleCardClick}
        >
            {/* ── BOTTOM PROGRESS BAR ──────────────────────────────────── */}
            <div className="absolute bottom-0 inset-x-0 h-[2px] z-50 bg-white/8">
                <motion.div
                    className="h-full bg-white/60"
                    style={{ width: `${progress}%` }}
                    transition={{ ease: "linear" }}
                />
            </div>

            {/* ── MEDIA LAYER with crossfade ───────────────────────────── */}
            <AnimatePresence mode="sync">
                <motion.div
                    key={`media-${verticalIndex}-${hIdx}`}
                    variants={mediaVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="absolute inset-0"
                    style={{ willChange: "opacity, transform" }}
                >
                    {/* Skeleton until loaded */}
                    {!mediaReady && (
                        <div className="absolute inset-0 bg-zinc-900 z-10" />
                    )}

                    {currentItem.mediaType === "video" ? (
                        <video
                            key={currentItem.mediaUrl}
                            src={currentItem.mediaUrl}
                            autoPlay={inView}
                            loop
                            muted={isMuted}
                            playsInline
                            crossOrigin="anonymous"
                            onTimeUpdate={handleVideoTimeUpdate}
                            onLoadedData={() => setMediaReady(true)}
                            className="w-full h-full object-cover"
                            ref={(el) => {
                                if (el) {
                                    inView ? el.play().catch(() => {}) : el.pause();
                                }
                            }}
                            style={{ opacity: mediaReady ? 1 : 0, transition: "opacity 0.5s ease" }}
                        />
                    ) : (
                        <img
                            src={currentItem.mediaUrl}
                            alt={currentItem.title}
                            crossOrigin="anonymous"
                            onLoad={() => setMediaReady(true)}
                            className="w-full h-full object-cover"
                            style={{ opacity: mediaReady ? 1 : 0, transition: "opacity 0.5s ease" }}
                        />
                    )}

                    {/* Dark vignette — only bottom half, light touch */}
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            background:
                                "linear-gradient(to top, rgba(4,4,8,0.88) 0%, rgba(4,4,8,0.35) 42%, transparent 75%)",
                        }}
                    />
                </motion.div>
            </AnimatePresence>

            {/* ── CONTENT HUD — staggered slide-up ────────────────────── */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={`hud-${verticalIndex}-${hIdx}`}
                    variants={hudVariants}
                    initial="hidden"
                    animate="show"
                    exit="exit"
                    className="absolute inset-x-0 bottom-0 p-4 pb-3.5 z-20 pointer-events-none"
                >
                    {/* Badge row */}
                    <motion.div variants={hudItem} className="flex items-center gap-2 mb-1.5">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/12 backdrop-blur-md border border-white/10 text-[7.5px] font-black uppercase tracking-[0.16em] text-white">
                            <currentLevel.icon className={`${currentLevel.color} text-[9px] flex-shrink-0`} />
                            {currentItem.badge?.toUpperCase() || currentLevel.label.toUpperCase()}
                        </span>
                        {isAdLevel && (
                            <span className="px-1.5 py-0.5 rounded-md bg-amber-500/85 text-[6.5px] font-black uppercase tracking-tight text-white">
                                SPONSOR
                            </span>
                        )}
                    </motion.div>

                    {/* Title */}
                    <motion.h2
                        variants={hudItem}
                        className="text-[16px] md:text-[19px] font-black text-white leading-tight tracking-tight mb-1"
                        style={{ textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}
                    >
                        {currentItem.title}
                    </motion.h2>

                    {/* Description */}
                    <motion.p
                        variants={hudItem}
                        className="text-[9.5px] text-zinc-300/75 font-medium leading-relaxed line-clamp-1 mb-2.5 max-w-[72%]"
                    >
                        {currentItem.description}
                    </motion.p>

                    {/* CTA row */}
                    <motion.div
                        variants={hudItem}
                        className="flex items-center gap-2 pointer-events-auto"
                    >
                        {/* Primary CTA */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                currentItem.link.startsWith("http")
                                    ? window.open(currentItem.link, "_blank")
                                    : navigate(currentItem.link);
                            }}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-zinc-100 active:scale-95 text-black rounded-lg text-[10px] font-black uppercase tracking-[0.1em] transition-all shadow-xl shadow-black/30 group/cta"
                        >
                            {currentItem.linkText}
                            {currentItem.link?.includes("instagram") ? (
                                <FaInstagram className="text-[9px]" />
                            ) : currentItem.link?.startsWith("http") ? (
                                <FaGlobe className="text-[9px]" />
                            ) : (
                                <FaChevronRight className="text-[8px] group-hover/cta:translate-x-0.5 transition-transform" />
                            )}
                        </button>

                        {/* "View Details" for ads */}
                        {isAdLevel && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/ad-details/${currentItem._id || currentItem.id}`);
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/18 active:scale-95 text-white rounded-lg text-[9px] font-bold transition-all backdrop-blur-md border border-white/10"
                            >
                                Details
                                <HiArrowRight className="text-[10px]" />
                            </button>
                        )}

                        {/* Mute toggle for video ads */}
                        {isAdLevel && currentItem.mediaType === "video" && (
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsMuted(p => !p); }}
                                className="w-7 h-7 flex items-center justify-center bg-white/10 hover:bg-white/18 active:scale-95 rounded-lg text-white transition-all backdrop-blur-md border border-white/10"
                                aria-label={isMuted ? "Unmute" : "Mute"}
                            >
                                {isMuted
                                    ? <HiSpeakerXMark className="w-3.5 h-3.5" />
                                    : <HiSpeakerWave  className="w-3.5 h-3.5" />
                                }
                            </button>
                        )}
                    </motion.div>
                </motion.div>
            </AnimatePresence>

            {/* ── CATEGORY SWITCHER — vertical column, right side ──────── */}
            <div
                className="absolute right-3 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-1.5 py-2 px-1.5 rounded-2xl bg-black/45 backdrop-blur-xl border border-white/8 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {levels.map((level, idx) => {
                    const active = verticalIndex === idx;
                    return (
                        <button
                            key={level.id}
                            onClick={() => goTo(idx, 0)}
                            title={level.label}
                            className={`relative w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${
                                active
                                    ? "bg-white shadow-lg shadow-white/15 scale-105"
                                    : "bg-transparent hover:bg-white/10"
                            }`}
                        >
                            <level.icon
                                className={`text-[11px] ${active ? "text-black" : level.color}`}
                            />
                            {/* Active glow ring */}
                            {active && (
                                <motion.div
                                    layoutId="vertSwitcherGlow"
                                    className="absolute -inset-1 rounded-full bg-white/12 blur-md -z-10"
                                    transition={{ type: "spring", damping: 20, stiffness: 300 }}
                                />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* ── SLIDE DOTS (only when current level has multiple items) ─ */}
            {currentLevel.items.length > 1 && (
                <div
                    className="absolute top-4 right-4 z-30 flex items-center gap-1.5"
                    onClick={(e) => e.stopPropagation()}
                >
                    {currentLevel.items.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => goTo(verticalIndex, idx)}
                            className="transition-all duration-300"
                            style={{
                                width:   idx === hIdx ? 18 : 5,
                                height:  5,
                                borderRadius: 99,
                                background: idx === hIdx ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.25)",
                            }}
                        />
                    ))}
                </div>
            )}

            {/* ── SHIMMER keyframe ─────────────────────────────────────── */}
            <style>{`
                @keyframes ubShimmer {
                    0%   { background-position: -200% 0; }
                    100% { background-position:  200% 0; }
                }
            `}</style>
        </div>
    );
};

export default UnifiedBannerSlider;