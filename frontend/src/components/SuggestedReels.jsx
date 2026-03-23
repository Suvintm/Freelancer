import React, {
    useState,
    useEffect,
    useRef,
    useCallback,
    memo,
    useMemo,
} from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
    HiOutlineEye,
    HiChevronLeft,
    HiChevronRight,
    HiSparkles,
    HiOutlineArrowRight,
    HiHeart,
    HiOutlineHeart,
    HiPlay,
} from "react-icons/hi2";

import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { useAppContext } from "../context/AppContext";
import MusicVisualizer from "./MusicVisualizer";
import { repairUrl } from "../utils/urlHelper.jsx";

// ─── Constants ────────────────────────────────────────────────────────────────
const CARD_W    = 152;                          // card width px
const CARD_H    = Math.round(CARD_W * (16/9)); // 270px  — 9:16 portrait
const GAP       = 14;                           // gap between cards px
const REEL_LIMIT = 14;
const STALE_MS  = 5 * 60 * 1000;
const FALLBACK_AVATAR =
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=400&auto=format&fit=crop";

// ─── Tiny helpers ─────────────────────────────────────────────────────────────
const fmt = (n) => {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
    if (n >= 1_000)     return (n / 1_000).toFixed(1) + "K";
    return String(n || 0);
};
const isNewReel = (createdAt) =>
    !!createdAt && Date.now() - new Date(createdAt).getTime() < 86_400_000;

// ─── Skeleton Card ────────────────────────────────────────────────────────────
const SkeletonCard = memo(({ idx }) => (
    <div
        className="flex-shrink-0 rounded-[22px] overflow-hidden relative"
        style={{ width: CARD_W, height: CARD_H, animationDelay: `${idx * 70}ms` }}
    >
        <div className="absolute inset-0 bg-zinc-900" />
        <div
            className="absolute inset-0"
            style={{
                background:
                    "linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.04) 50%,transparent 60%)",
                backgroundSize: "200% 100%",
                animation: "srShimmer 1.6s infinite",
            }}
        />
        <div className="absolute bottom-0 inset-x-0 p-3 space-y-2">
            <div className="flex items-end gap-2">
                <div className="w-7 h-7 rounded-full bg-zinc-800 flex-shrink-0" />
                <div className="flex flex-col gap-1.5 flex-1 pb-0.5">
                    <div className="h-2 w-16 rounded-full bg-zinc-800" />
                    <div className="h-1.5 w-10 rounded-full bg-zinc-800/60" />
                </div>
            </div>
            <div className="h-2 w-20 rounded-full bg-zinc-800/50" />
            <div className="h-1.5 w-12 rounded-full bg-zinc-800/30" />
        </div>
    </div>
));
SkeletonCard.displayName = "SkeletonCard";

// ─── Reel Thumbnail ───────────────────────────────────────────────────────────
const ReelThumbnail = memo(({ reel, index, priority }) => {
    const navigate      = useNavigate();
    const prefersReduced = useReducedMotion();

    const [visible, setVisible]         = useState(false);
    const [playing, setPlaying]         = useState(false);
    const [liked, setLiked]             = useState(false);
    const [likesCount, setLikesCount]   = useState(reel.likesCount || 0);
    const [videoReady, setVideoReady]   = useState(false);
    const [imgError, setImgError]       = useState(false);

    const containerRef  = useRef(null);
    const videoRef      = useRef(null);

    // ── Intersection Observer → autoplay when card enters viewport ────────
    // threshold 0.25 = starts when 25% of the card is visible (catches the
    // two partially-clipped cards at the edges of the scroll row)
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const io = new IntersectionObserver(
            ([entry]) => setVisible(entry.isIntersecting),
            { threshold: 0.25 }
        );
        io.observe(el);
        return () => io.disconnect();
    }, []);

    // ── Autoplay — driven purely by visibility, no hover needed ──────────
    useEffect(() => {
        const vid = videoRef.current;
        if (!vid || reel.mediaType !== "video") return;

        if (visible) {
            vid.muted = true; // muted = required by browser autoplay policy
            vid.play()
                .then(() => setPlaying(true))
                .catch(() => setPlaying(false));
        } else {
            vid.pause();
            vid.currentTime = 0;
            setPlaying(false);
        }
    }, [visible, reel.mediaType]);

    const handleClick = useCallback(() => navigate(`/reels?id=${reel._id}`), [navigate, reel._id]);

    const handleLike = useCallback((e) => {
        e.stopPropagation();
        setLiked((p) => !p);
        setLikesCount((p) => liked ? p - 1 : p + 1);
    }, [liked]);

    const avatarSrc = useMemo(
        () => reel.editor?.profilePicture
            ? repairUrl(reel.editor.profilePicture)
            : FALLBACK_AVATAR,
        [reel.editor?.profilePicture]
    );

    const isVideo = reel.mediaType === "video";
    const _isNew  = isNewReel(reel.createdAt);

    return (
        <motion.article
            ref={containerRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                delay: Math.min(index * 0.05, 0.35),
                type: prefersReduced ? "tween" : "spring",
                damping: 22, stiffness: 300,
            }}
            onClick={handleClick}
            whileHover={prefersReduced ? {} : { y: -9, scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="flex-shrink-0 rounded-[22px] overflow-hidden relative cursor-pointer snap-start select-none bg-zinc-950"
            style={{ width: CARD_W, height: CARD_H, willChange: "transform" }}
            aria-label={`Watch ${reel.title} by ${reel.editor?.name}`}
        >
            {/* ── Media ─────────────────────────────────────────────────── */}
            {isVideo ? (
                <>
                    {!videoReady && (
                        <div className="absolute inset-0 bg-zinc-900 animate-pulse z-0" />
                    )}
                    {reel.mediaUrl && (
                        <video
                            ref={videoRef}
                            src={repairUrl(reel.mediaUrl)}
                            poster={repairUrl(reel.mediaUrl)?.replace(/\.mp4(\?.*)?$/i, ".jpg")}
                            className="absolute inset-0 w-full h-full object-cover"
                            muted loop playsInline
                            crossOrigin="anonymous"
                            preload={priority ? "auto" : "metadata"}
                            onCanPlay={() => setVideoReady(true)}
                            onContextMenu={(e) => e.preventDefault()}
                            controlsList="nodownload nofullscreen noremoteplayback"
                            disablePictureInPicture
                            style={{ opacity: videoReady ? 1 : 0, transition: "opacity 0.4s ease" }}
                        />
                    )}
                </>
            ) : (
                <img
                    src={imgError || !reel.mediaUrl ? FALLBACK_AVATAR : repairUrl(reel.mediaUrl)}
                    alt={reel.title}
                    loading={priority ? "eager" : "lazy"}
                    onError={() => setImgError(true)}
                    crossOrigin="anonymous"
                    className="absolute inset-0 w-full h-full object-cover"
                />
            )}

            {/* ── Bottom gradient — minimal, only for text legibility ────── */}
            <div
                className="absolute inset-x-0 bottom-0 pointer-events-none z-10"
                style={{
                    height: "52%",
                    background:
                        "linear-gradient(to top,rgba(0,0,0,0.82) 0%,rgba(0,0,0,0.35) 55%,transparent 100%)",
                }}
            />

            {/* ── NEW badge (top-left) ──────────────────────────────────── */}
            {_isNew && (
                <motion.div
                    className="absolute top-3 left-3 z-20"
                    animate={{ opacity: [0.8, 1, 0.8] }}
                    transition={{ duration: 2.1, repeat: Infinity, ease: "easeInOut" }}
                >
                    <span className="px-2 py-[3px] rounded-full bg-white text-black text-[6.5px] font-black uppercase tracking-[0.14em] leading-none shadow-md">
                        NEW
                    </span>
                </motion.div>
            )}

            {/* ── Bottom info overlay ───────────────────────────────────── */}
            <div className="absolute inset-x-0 bottom-0 z-20 px-2.5 pb-2.5 pt-1">

                {/* Row 1 — Avatar  |  [Name + MusicVisualizer] ──────────── */}
                <div className="flex items-end gap-1.5 mb-1">

                    {/* Avatar with online dot */}
                    <div className="relative flex-shrink-0">
                        <img
                            src={avatarSrc}
                            alt={reel.editor?.name || "Editor"}
                            onError={(e) => { e.target.src = FALLBACK_AVATAR; }}
                            className="w-6 h-6 rounded-full border border-white/25 object-cover shadow-md"
                            loading="lazy"
                        />
                        <span className="absolute -bottom-px -right-px w-[6px] h-[6px] bg-emerald-400 rounded-full border border-black" />
                    </div>

                    {/* Name + MusicVisualizer stacked */}
                    <div className="flex flex-col min-w-0 flex-1">
                        <span
                            className="text-[9px] font-bold text-white leading-tight drop-shadow-md truncate"
                            style={{ maxWidth: 80 }}
                        >
                            {reel.editor?.name || "Editor"}
                        </span>
                        {isVideo && (
                            <div className="mt-[2px] scale-[0.78] origin-left">
                                <MusicVisualizer isPlaying={playing} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Row 2 — Title ────────────────────────────────────────── */}
                <h3 className="text-[10px] font-bold text-white line-clamp-1 leading-snug drop-shadow-md mb-1.5">
                    {reel.title}
                </h3>

                {/* Row 3 — Stats ────────────────────────────────────────── */}
                <div className="flex items-center gap-2.5">
                    <button
                        onClick={handleLike}
                        className="flex items-center gap-[3px] active:scale-90 transition-transform"
                        aria-label="Like"
                    >
                        <AnimatePresence mode="wait">
                            {liked ? (
                                <motion.span key="on" initial={{ scale: 0.3 }} animate={{ scale: 1 }} exit={{ scale: 0.3 }}>
                                    <HiHeart className="text-red-500 text-[10px]" />
                                </motion.span>
                            ) : (
                                <motion.span key="off" initial={{ scale: 0.3 }} animate={{ scale: 1 }} exit={{ scale: 0.3 }}>
                                    <HiOutlineHeart className="text-white/50 text-[10px]" />
                                </motion.span>
                            )}
                        </AnimatePresence>
                        <span className="text-[8px] font-bold text-white/50">{fmt(likesCount)}</span>
                    </button>

                    <div className="flex items-center gap-[3px]">
                        <HiOutlineEye className="text-white/35 text-[10px]" />
                        <span className="text-[8px] font-bold text-white/35">{fmt(reel.viewsCount)}</span>
                    </div>
                </div>
            </div>

            {/* ── Subtle border on hover ────────────────────────────────── */}
            <div className="absolute inset-0 rounded-[22px] pointer-events-none z-30 ring-1 ring-white/5" />
        </motion.article>
    );
});
ReelThumbnail.displayName = "ReelThumbnail";

// ─── View-More card ───────────────────────────────────────────────────────────
const ViewMoreCard = memo(({ onClick }) => (
    <motion.div
        whileHover={{ y: -9, scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        onClick={onClick}
        className="flex-shrink-0 rounded-[22px] overflow-hidden relative cursor-pointer snap-start border border-white/6"
        style={{
            width: CARD_W, height: CARD_H,
            background:
                "radial-gradient(ellipse at 60% 30%,rgba(139,92,246,0.14) 0%,rgba(10,10,14,0.97) 70%)",
        }}
        aria-label="View all reels"
    >
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-5 text-center">
            <motion.div
                animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.07, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600/30 to-indigo-600/30 border border-violet-500/20 flex items-center justify-center shadow-2xl shadow-violet-500/10"
            >
                <HiOutlineArrowRight className="text-2xl text-violet-400" />
            </motion.div>
            <div>
                <h3 className="text-[11px] font-black text-white uppercase tracking-[0.12em] leading-snug">
                    View<br />All Reels
                </h3>
                <p className="text-[8px] text-zinc-500 font-bold mt-1.5 uppercase tracking-tight">
                    100+ stories
                </p>
            </div>
        </div>
        {[0, 1, 2].map((i) => (
            <motion.span
                key={i}
                className="absolute w-1 h-1 rounded-full bg-violet-400/35"
                style={{ top: `${22 + i * 27}%`, right: `${11 + (i % 2) * 14}%` }}
                animate={{ opacity: [0, 0.9, 0], scale: [0.5, 1.6, 0.5] }}
                transition={{ duration: 2.6, delay: i * 0.9, repeat: Infinity }}
            />
        ))}
    </motion.div>
));
ViewMoreCard.displayName = "ViewMoreCard";

// ─── Progress dots ────────────────────────────────────────────────────────────
const ScrollDots = memo(({ total, current }) => {
    const MAX = 7;
    const count = Math.min(total, MAX);
    return (
        <div className="flex items-center justify-center gap-1.5 mt-3 pb-1">
            {Array.from({ length: count }).map((_, i) => {
                const slot   = Math.round((i / Math.max(count - 1, 1)) * (total - 1));
                const isExact = slot === current;
                return (
                    <motion.div
                        key={i}
                        animate={{ width: isExact ? 18 : 4, opacity: isExact ? 1 : 0.25 }}
                        transition={{ duration: 0.28, type: "spring", damping: 18 }}
                        className="h-[3px] rounded-full bg-white"
                    />
                );
            })}
        </div>
    );
});
ScrollDots.displayName = "ScrollDots";

// ─── Auto-reset indicator pill ────────────────────────────────────────────────
// This appears briefly when the list auto-scrolls back to the first card,
// making the auto-reset behaviour visible and clear to the user.
const ResetPill = memo(({ show }) => (
    <AnimatePresence>
        {show && (
            <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.88 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.9 }}
                transition={{ type: "spring", damping: 20, stiffness: 260 }}
                className="absolute -bottom-9 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/12 pointer-events-none whitespace-nowrap"
            >
                <HiChevronLeft className="text-white/60 text-[10px]" />
                <span className="text-[8px] font-black text-white/60 uppercase tracking-widest">
                    Back to start
                </span>
            </motion.div>
        )}
    </AnimatePresence>
));
ResetPill.displayName = "ResetPill";

// ─── Main SuggestedReels ──────────────────────────────────────────────────────
const SuggestedReels = () => {
    const { backendURL } = useAppContext();
    const navigate = useNavigate();

    const scrollRef     = useRef(null);
    const sectionRef    = useRef(null);
    const isInteracting = useRef(false);
    const rafRef        = useRef(null);

    const [showLeft, setShowLeft]   = useState(false);
    const [showRight, setShowRight] = useState(true);
    const [activeIdx, setActiveIdx] = useState(0);
    const [showReset, setShowReset] = useState(false);
    const [isDesktop, setIsDesktop] = useState(false);

    // ── Data ──────────────────────────────────────────────────────────────
    const { data: reels = [], isLoading } = useQuery({
        queryKey: ["suggestedReels", backendURL],
        queryFn: async () => {
            const { data } = await axios.get(
                `${backendURL}/api/reels/feed?page=1&limit=${REEL_LIMIT}`
            );
            return data.reels || [];
        },
        staleTime: STALE_MS,
        refetchOnWindowFocus: false,
        retry: 2,
    });

    // ── Responsive ────────────────────────────────────────────────────────
    useEffect(() => {
        const mq = window.matchMedia("(min-width: 768px)");
        const update = () => setIsDesktop(mq.matches);
        update();
        mq.addEventListener("change", update);
        return () => mq.removeEventListener("change", update);
    }, []);

    // ── Horizontal scroll state (shadows + active dot) ────────────────────
    const updateScrollState = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        const { scrollLeft, scrollWidth, clientWidth } = el;
        setShowLeft(scrollLeft > 16);
        setShowRight(scrollLeft < scrollWidth - clientWidth - 16);
        setActiveIdx(Math.round(scrollLeft / (CARD_W + GAP)));
    }, []);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        const handler = () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            rafRef.current = requestAnimationFrame(updateScrollState);
        };
        el.addEventListener("scroll", handler, { passive: true });
        updateScrollState();
        return () => {
            el.removeEventListener("scroll", handler);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [updateScrollState, reels.length]);

    // ── Vertical-page-scroll → auto-reset horizontal list ────────────────
    // When the user scrolls the page down/up (away from the section) AND the
    // horizontal carousel is not at position 0, we smoothly scroll it back.
    // The "Back to start" pill makes the motion deliberate and visible.
    useEffect(() => {
        const handles = [];
        const targets = [window, document.querySelector("main")].filter(Boolean);

        targets.forEach((target) => {
            let lastY    = target === window ? window.scrollY : (target.scrollTop || 0);
            let ticking  = false;

            const fn = () => {
                if (ticking || isInteracting.current) return;
                ticking = true;
                requestAnimationFrame(() => {
                    const currentY = target === window ? window.scrollY : target.scrollTop;
                    const diffY    = Math.abs(currentY - lastY);

                    if (diffY > 35 && scrollRef.current) {
                        const sl = scrollRef.current.scrollLeft;
                        if (sl > CARD_W * 0.5) {
                            const section = sectionRef.current;
                            if (section) {
                                const rect    = section.getBoundingClientRect();
                                const centerY = rect.top + rect.height / 2;
                                const vh      = window.innerHeight;
                                // trigger only when section is >35% away from viewport centre
                                if (Math.abs(centerY - vh / 2) > vh * 0.35) {
                                    setShowReset(true);
                                    // slight delay lets the pill animate in before the scroll
                                    setTimeout(() => {
                                        scrollRef.current?.scrollTo({ left: 0, behavior: "smooth" });
                                    }, 140);
                                    setTimeout(() => setShowReset(false), 2000);
                                }
                            }
                        }
                    }
                    lastY   = currentY;
                    ticking = false;
                });
            };

            target.addEventListener("scroll", fn, { passive: true });
            handles.push({ target, fn });
        });

        return () => handles.forEach(({ target, fn }) => target.removeEventListener("scroll", fn));
    }, []);

    // ── Arrow scroll ──────────────────────────────────────────────────────
    const scroll = useCallback((dir) => {
        if (!scrollRef.current) return;
        const step = (CARD_W + GAP) * 3;
        scrollRef.current.scrollBy({
            left: dir === "right" ? step : -step,
            behavior: "smooth",
        });
    }, []);

    // ── Keyboard nav ──────────────────────────────────────────────────────
    useEffect(() => {
        const el = sectionRef.current;
        if (!el) return;
        const fn = (e) => {
            if (e.key === "ArrowRight") scroll("right");
            if (e.key === "ArrowLeft")  scroll("left");
        };
        el.addEventListener("keydown", fn);
        return () => el.removeEventListener("keydown", fn);
    }, [scroll]);

    const setInteracting = useCallback((v) => { isInteracting.current = v; }, []);

    // ── Loading skeleton ──────────────────────────────────────────────────
    if (isLoading) {
        return (
            <section className="space-y-4 py-2 px-1">
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <div className="h-2 w-16 bg-white/5 rounded-full animate-pulse" />
                        <div className="h-3.5 w-36 bg-white/8 rounded-full animate-pulse" />
                    </div>
                    <div className="h-7 w-24 bg-white/5 rounded-full animate-pulse" />
                </div>
                <div className="flex overflow-hidden" style={{ gap: GAP }}>
                    {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} idx={i} />)}
                </div>
                <style>{`@keyframes srShimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}`}</style>
            </section>
        );
    }

    // ── Empty state ───────────────────────────────────────────────────────
    if (!reels.length) {
        return (
            <div className="py-10 flex flex-col items-center justify-center text-center opacity-35 gap-3">
                <HiSparkles className="text-3xl text-violet-500" />
                <p className="text-[10px] font-black text-white uppercase tracking-[0.18em]">No Reels Yet</p>
            </div>
        );
    }

    // ── Main render ───────────────────────────────────────────────────────
    return (
        <section
            ref={sectionRef}
            className="relative mb-10 outline-none"
            tabIndex={0}
            aria-label="Suggested Reels"
        >
            {/* ── Header ──────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2.5">
                    {/* White play button circle */}
                    <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                        <HiPlay className="text-black text-[13px] ml-[1px]" />
                    </div>

                    <div className="flex flex-col gap-[3px]">
                        {/* Main title */}
                        <h2 className="text-[13px] font-black text-white light:text-slate-900 tracking-[0.08em] uppercase leading-none">
                            Suggested Reels
                        </h2>

                        {/* Live feed — green dot + pencil gray text */}
                        <div className="flex items-center gap-1.5">
                            {/* Pulsing green dot with outer ring */}
                            <span className="relative flex h-[7px] w-[7px] flex-shrink-0">
                                <motion.span
                                    animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                                    className="absolute inline-flex h-full w-full rounded-full bg-emerald-400"
                                />
                                <span className="relative inline-flex h-[7px] w-[7px] rounded-full bg-emerald-500" />
                            </span>
                            <span className="text-[8px] font-semibold text-zinc-500 uppercase tracking-[0.18em]">
                                Live Feed
                            </span>
                        </div>
                    </div>
                </div>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate("/reels-explore")}
                    className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-all"
                >
                    <span className="text-[9px] font-black text-zinc-400 group-hover:text-white uppercase tracking-[0.14em] transition-colors">
                        Explore All
                    </span>
                    <HiOutlineArrowRight className="text-[10px] text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                </motion.button>
            </div>

            {/* ── Scroll wrapper ───────────────────────────────────────────── */}
            <div className="relative">
                {/* Desktop arrow buttons */}
                {isDesktop && (
                    <>
                        <AnimatePresence>
                            {showLeft && (
                                <motion.button
                                    key="al"
                                    initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }}
                                    onClick={() => scroll("left")}
                                    className="absolute -left-5 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-zinc-900/90 backdrop-blur-xl border border-white/10 hover:border-white/22 text-white flex items-center justify-center shadow-2xl transition-colors"
                                    aria-label="Scroll left"
                                >
                                    <HiChevronLeft className="text-lg" />
                                </motion.button>
                            )}
                        </AnimatePresence>
                        <AnimatePresence>
                            {showRight && (
                                <motion.button
                                    key="ar"
                                    initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 6 }}
                                    onClick={() => scroll("right")}
                                    className="absolute -right-5 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-zinc-900/90 backdrop-blur-xl border border-white/10 hover:border-white/22 text-white flex items-center justify-center shadow-2xl transition-colors"
                                    aria-label="Scroll right"
                                >
                                    <HiChevronRight className="text-lg" />
                                </motion.button>
                            )}
                        </AnimatePresence>
                    </>
                )}

                {/* ── Scrollable row ──────────────────────────────────────── */}
                <div
                    ref={scrollRef}
                    onMouseDown={() => setInteracting(true)}
                    onMouseUp={() => setTimeout(() => setInteracting(false), 900)}
                    onTouchStart={() => setInteracting(true)}
                    onTouchEnd={() => setTimeout(() => setInteracting(false), 1100)}
                    className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory px-1 pb-2"
                    style={{ gap: GAP, scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                    {reels.map((reel, idx) => (
                        <ReelThumbnail
                            key={reel._id}
                            reel={reel}
                            index={idx}
                            priority={idx < 3}
                        />
                    ))}
                    <ViewMoreCard onClick={() => navigate("/reels-explore")} />
                </div>

                {/* "Back to start" pill — appears when auto-reset fires */}
                <ResetPill show={showReset} />
            </div>

            {/* ── Progress dots ─────────────────────────────────────────────── */}
            <ScrollDots total={reels.length + 1} current={activeIdx} />

            {/* ── Shimmer keyframe ─────────────────────────────────────────── */}
            <style>{`
                @keyframes srShimmer {
                    0%   { background-position: -200% 0; }
                    100% { background-position:  200% 0; }
                }
            `}</style>
        </section>
    );
};

export default SuggestedReels;