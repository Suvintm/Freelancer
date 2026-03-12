import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    HiPlay, 
    HiOutlineEye, 
    HiChevronLeft, 
    HiChevronRight,
    HiSparkles,
    HiOutlineArrowRight
} from "react-icons/hi2";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { useAppContext } from "../context/AppContext";
import MusicVisualizer from "./MusicVisualizer";
import { repairUrl } from "../utils/urlHelper.jsx";

// ─── Robust scrollable parent finder ─────────────────────────────────────────
const findScrollableParent = (el) => {
    if (!el) return null;

    // Priority 1: Semantic <main> tag (most reliable in this app)
    const main = document.querySelector('main');
    if (main) return main;

    // Priority 2: Walk up the tree
    let node = el.parentElement;
    while (node && node !== document.body) {
        try {
            const style = window.getComputedStyle(node);
            const overflowY = style.overflowY || style.overflow;
            if (overflowY === 'auto' || overflowY === 'scroll') return node;
        } catch (_) {}
        node = node.parentElement;
    }

    return window;
};

const SuggestedReels = () => {
    const { backendURL } = useAppContext();
    const navigate = useNavigate();
    const scrollRef = useRef(null);
    const mainContainerRef = useRef(null);
    const isInteracting = useRef(false);
    const [showControls, setShowControls] = useState(false);

    const { data: reels = [], isLoading: loading } = useQuery({
        queryKey: ['homeData', 'suggested-reels', backendURL],
        queryFn: async () => {
            const { data } = await axios.get(`${backendURL}/api/reels/feed?page=1&limit=12`);
            return data.reels || [];
        },
        staleTime: 5 * 60 * 1000,
    });

    // ── Auto-reset horizontal scroll on vertical scroll ──────────────────────
    useEffect(() => {
        let cleanup = () => {};

        const init = () => {
            const scrollableParent = findScrollableParent(mainContainerRef.current);
            const target = scrollableParent || window;

            const getScrollTop = () =>
                target === window ? window.scrollY : target.scrollTop;

            let lastY = getScrollTop();
            let ticking = false;

            const handleScroll = () => {
                if (ticking || isInteracting.current) return;
                ticking = true;

                window.requestAnimationFrame(() => {
                    const currentY = getScrollTop();
                    const diffY = Math.abs(currentY - lastY);

                    // If significant vertical movement occurs
                    if (diffY > 10 && scrollRef.current) {
                        const { scrollLeft } = scrollRef.current;
                        
                        if (scrollLeft > 20) {
                            if (mainContainerRef.current) {
                                const rect = mainContainerRef.current.getBoundingClientRect();
                                const vh = window.innerHeight;
                                const elementCenter = rect.top + rect.height / 2;
                                
                                // Only reset if the section is mostly out of the center viewport
                                // This prevents "jumping" while the user is looking at it
                                if (Math.abs(elementCenter - vh / 2) > vh * 0.45) {
                                    scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
                                }
                            }
                        }
                    }

                    lastY = currentY;
                    ticking = false;
                });
            };

            target.addEventListener('scroll', handleScroll, { passive: true });
            return () => target.removeEventListener('scroll', handleScroll);
        };

        const timer = setTimeout(() => {
            cleanup = init();
        }, 500); // Give layout more time to settle

        return () => {
            clearTimeout(timer);
            cleanup();
        };
    }, []);

    const handleTouchStart = () => { isInteracting.current = true; };
    const handleTouchEnd = () => {
        // Delay resetting interaction so the momentum scroll can finish
        setTimeout(() => { isInteracting.current = false; }, 1000);
    };

    const scroll = (direction) => {
        if (scrollRef.current) {
            const { scrollLeft, clientWidth } = scrollRef.current;
            const scrollTo = direction === 'left'
                ? scrollLeft - clientWidth * 0.8
                : scrollLeft + clientWidth * 0.8;
            scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
        }
    };

    if (loading) {
        return (
            <div className="space-y-4 py-4">
                <div className="flex items-center justify-between px-1">
                    <div className="h-5 w-32 bg-white/8 rounded-lg animate-pulse" />
                    <div className="h-4 w-16 bg-white/8 rounded-lg animate-pulse" />
                </div>
                <div className="flex gap-4 overflow-hidden">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="flex-shrink-0 w-40 md:w-48 h-72 md:h-80 bg-zinc-900 rounded-2xl overflow-hidden relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 shimmer" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (reels.length === 0) return (
        <div className="py-12 flex flex-col items-center justify-center text-center opacity-40">
            <HiSparkles className="text-4xl mb-3 text-purple-500" />
            <h3 className="font-bold text-white uppercase tracking-widest text-[10px]">No Reels Found</h3>
        </div>
    );

    return (
        <div
            ref={mainContainerRef}
            className="group/main relative mb-8"
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => setShowControls(false)}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 mb-0.5">
                        <HiPlay className="text-white text-base" />
                        <h2 className="text-[11px] font-black text-white light:text-slate-900 tracking-[0.15em] uppercase">Suggested Reels</h2>
                    </div>
                    <div className="flex items-center gap-1.5 opacity-40 ml-5">
                        <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-bold uppercase tracking-wider">Live Feed</span>
                    </div>
                </div>
                <button
                    onClick={() => navigate("/reels-explore")}
                    className="group/btn flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 transition-all"
                >
                    <span className="text-[9px] font-black text-zinc-400 group-hover/btn:text-white uppercase tracking-widest">Explore All</span>
                    <HiOutlineArrowRight className="text-xs text-zinc-500 group-hover/btn:text-white transition-colors" />
                </button>
            </div>

            <div className="relative">
                {/* Desktop Controls */}
                <AnimatePresence>
                    {showControls && (
                        <>
                            <motion.button
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                onClick={() => scroll('left')}
                                className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-40 w-12 h-12 items-center justify-center rounded-full bg-[#0a0a0c]/80 backdrop-blur-xl border border-white/10 hover:border-purple-500/40 text-white shadow-2xl transition-all"
                            >
                                <HiChevronLeft className="text-xl" />
                            </motion.button>
                            <motion.button
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                onClick={() => scroll('right')}
                                className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-40 w-12 h-12 items-center justify-center rounded-full bg-[#0a0a0c]/80 backdrop-blur-xl border border-white/10 hover:border-purple-500/40 text-white shadow-2xl transition-all"
                            >
                                <HiChevronRight className="text-xl" />
                            </motion.button>
                        </>
                    )}
                </AnimatePresence>

                {/* Horizontal Scroll Area */}
                <div
                    ref={scrollRef}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    onMouseDown={() => { isInteracting.current = true; }}
                    onMouseUp={() => { setTimeout(() => { isInteracting.current = false; }, 1000); }}
                    className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide snap-x px-1"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {reels.map((reel, idx) => (
                        <ReelThumbnail key={reel._id} reel={reel} index={idx} />
                    ))}

                    {/* View More Card */}
                    <motion.div
                        whileHover={{ y: -8, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate("/reels-explore")}
                        className="flex-shrink-0 w-40 md:w-48 h-72 md:h-80 rounded-3xl relative overflow-hidden cursor-pointer group snap-start"
                    >
                        <div className="absolute inset-0 bg-[#0d0d12] border border-white/5 group-hover:border-purple-500/30 transition-colors" />
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 backdrop-blur-xl border border-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-2xl shadow-purple-500/10">
                                <HiOutlineArrowRight className="text-2xl text-purple-400" />
                            </div>
                            <h3 className="text-sm font-black text-white uppercase tracking-widest leading-tight">View<br />Entire Feed</h3>
                            <p className="text-[9px] text-zinc-500 font-bold mt-2 uppercase tracking-tighter">Discover 100+<br />New Stories</p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

// ─── Reel Thumbnail (unchanged) ───────────────────────────────────────────────
const ReelThumbnail = ({ reel, index }) => {
    const navigate = useNavigate();
    const [isHovered, setIsHovered] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const videoRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => setIsVisible(entry.isIntersecting),
            { threshold: 0.6 }
        );
        if (containerRef.current) observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (videoRef.current) {
            if (isVisible || isHovered) {
                videoRef.current.play().catch(() => {});
            } else {
                videoRef.current.pause();
                videoRef.current.currentTime = 0;
            }
        }
    }, [isVisible, isHovered]);

    const handleMouseEnter = () => {
        setIsHovered(true);
        if (videoRef.current) {
            videoRef.current.currentTime = 0;
            videoRef.current.play().catch(() => {});
        }
    };

    return (
        <motion.div
            ref={containerRef}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, type: "spring", damping: 20 }}
            whileHover={{ y: -8, scale: 1.05 }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => navigate(`/reels?id=${reel._id}`)}
            className="flex-shrink-0 w-40 md:w-48 h-72 md:h-80 bg-[#0a0a0c] rounded-[2rem] overflow-hidden relative cursor-pointer transition-all snap-start group shadow-2xl shadow-black/40"
        >
            {reel.mediaType === "video" ? (
                <video
                    ref={videoRef}
                    src={reel.mediaUrl}
                    className="w-full h-full object-contain transition-all duration-500 group-hover:scale-110 no-copy"
                    muted loop playsInline preload="metadata"
                    onContextMenu={(e) => e.preventDefault()}
                    onDoubleClick={(e) => e.preventDefault()}
                    controlsList="nodownload nofullscreen noremoteplayback"
                    disablePictureInPicture
                />
            ) : (
                <img
                    src={reel.mediaUrl}
                    alt={reel.title}
                    className="w-full h-full object-contain transition-all duration-500 group-hover:scale-110 no-copy"
                    onContextMenu={(e) => e.preventDefault()}
                    onDoubleClick={(e) => e.preventDefault()}
                />
            )}

            <div
                className="absolute inset-0 z-20 cursor-pointer"
                onContextMenu={(e) => e.preventDefault()}
                onDoubleClick={(e) => e.preventDefault()}
            />

            {/* Badges */}
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                {(() => {
                    const isNew = reel.createdAt && (new Date() - new Date(reel.createdAt)) < 24 * 60 * 60 * 1000;
                    if (!isNew) return null;
                    return (
                        <motion.div
                            animate={{ opacity: [0.8, 1, 0.8], scale: [1, 1.05, 1] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            className="px-3 py-1 rounded-full border border-white/40 bg-white flex items-center justify-center min-w-[35px]"
                        >
                            <span className="text-black text-[7px] font-bold uppercase tracking-[0.1em]">NEW</span>
                        </motion.div>
                    );
                })()}
                <span className="px-2 py-0.5 rounded-md bg-white/10 backdrop-blur-md border border-white/10 text-white text-[7px] font-black uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-all duration-300">
                    Trending
                </span>
            </div>

            {/* Metadata */}
            <div className="absolute inset-x-0 bottom-0 p-4 translate-y-4 group-hover:translate-y-0 transition-all duration-500 z-30">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <img
                                src={(typeof reel.editor?.profilePicture === 'string' && reel.editor.profilePicture.length > 0) 
                                    ? repairUrl(reel.editor.profilePicture) 
                                    : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=2080&auto=format&fit=crop'}
                                alt={reel.editor?.name}
                                className="w-6 h-6 rounded-full border border-white/20 object-cover"
                            />
                            <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full border border-black ring-1 ring-emerald-500/50" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] text-white font-bold tracking-tight truncate max-w-[80px] drop-shadow-md">{reel.editor?.name}</span>
                            {reel.mediaType === "video" && (
                                <div className="mt-0.5 scale-[0.6] origin-left opacity-70">
                                    <MusicVisualizer isPlaying={isVisible || isHovered} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <h3 className="text-[11px] font-bold text-white line-clamp-2 leading-tight drop-shadow-md">
                    {reel.title}
                </h3>
                <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all duration-500 delay-100">
                    <div className="flex items-center gap-1">
                        <HiOutlineEye className="text-[10px] text-zinc-400" />
                        <span className="text-[9px] font-bold text-zinc-400">{reel.viewsCount || 0}</span>
                    </div>
                    <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
                        <HiPlay className="text-[10px] text-white" />
                    </div>
                </div>
            </div>

            {/* Play indicator */}
            <AnimatePresence>
                {(!isHovered && !isVisible) && reel.mediaType === "video" && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10"
                    >
                        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
                            <HiPlay className="text-white text-xs ml-0.5" />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default SuggestedReels;