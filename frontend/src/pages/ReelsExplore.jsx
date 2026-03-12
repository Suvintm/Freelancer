import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    HiOutlineChevronLeft,
    HiOutlineMagnifyingGlass,
    HiOutlineVideoCamera,
    HiOutlineSparkles,
    HiOutlineXMark,
    HiOutlineArrowUp,
} from "react-icons/hi2";
import { FaFire } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAppContext } from "../context/AppContext";
import ReelGridItem from "../components/ReelGridItem.jsx";
import ReelPreviewModal from "../components/ReelPreviewModal.jsx";
import ReelCommentsDrawer from "../components/ReelCommentsDrawer";

// ─── Constants ─────────────────────────────────────────────────────────────
const INITIAL_LIMIT = 18;
const LOAD_MORE_LIMIT = 12;

// ─── Skeleton Card ─────────────────────────────────────────────────────────
const SkeletonCard = () => (
    <div
        className="rounded-2xl bg-white/[0.04] overflow-hidden relative w-full"
        style={{ aspectRatio: "9/14" }}
    >
        <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent -translate-x-full animate-[shimmer_1.8s_ease-in-out_infinite]" />
        </div>
    </div>
);

// ─── Tag Pill ──────────────────────────────────────────────────────────────
const TagPill = ({ label, icon, active, onClick }) => (
    <motion.button
        whileTap={{ scale: 0.93 }}
        onClick={onClick}
        className={`
            flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-black
            uppercase tracking-widest transition-all duration-200 whitespace-nowrap border flex-shrink-0
            ${active
                ? "bg-white text-black border-white shadow-[0_0_18px_rgba(255,255,255,0.12)]"
                : "bg-white/[0.04] text-zinc-500 border-white/[0.07] hover:border-white/20 hover:text-zinc-300"
            }
        `}
    >
        {icon && <span className="text-[11px] leading-none">{icon}</span>}
        {label}
    </motion.button>
);

// ─── Load More Button ──────────────────────────────────────────────────────
const LoadMoreButton = ({ onClick, loading: isLoading }) => (
    <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onClick}
        disabled={isLoading}
        className="flex items-center gap-2.5 px-8 py-3 rounded-full bg-white text-black text-[12px] font-black uppercase tracking-widest shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
    >
        {isLoading ? (
            <>
                <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Loading…
            </>
        ) : (
            "Load More"
        )}
    </motion.button>
);

// ─── Search match: title + description + hashtags + editor name ────────────
const reelMatchesSearch = (reel, query) => {
    if (!query || !query.trim()) return true;
    const tokens = query.toLowerCase().trim().split(/\s+/).filter(Boolean);

    // Build one big searchable string from all relevant fields
    const haystack = [
        reel.title || "",
        reel.description || "",
        reel.editor?.name || "",
        ...(Array.isArray(reel.hashtags) ? reel.hashtags : []),
    ]
        .join(" ")
        .toLowerCase();

    // All tokens must match somewhere in the haystack
    return tokens.every(token => haystack.includes(token));
};

// ─── Main Component ────────────────────────────────────────────────────────
const ReelsExplore = () => {
    const { backendURL } = useAppContext();
    const navigate = useNavigate();

    const [reels, setReels]             = useState([]);
    const [seenIds, setSeenIds]         = useState(new Set());
    const [tags, setTags]               = useState([]);
    const [loading, setLoading]         = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore]         = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedQ, setDebouncedQ]   = useState("");
    const [selectedTag, setSelectedTag] = useState(null);
    const [previewReel, setPreviewReel] = useState(null);
    const [showComments, setShowComments] = useState(false);
    const [activeReel, setActiveReel]   = useState(null);
    const [showScrollTop, setShowScrollTop] = useState(false);

    const searchRef = useRef(null);

    // ── Debounce search ────────────────────────────────────────────────────
    useEffect(() => {
        const t = setTimeout(() => setDebouncedQ(searchQuery), 350);
        return () => clearTimeout(t);
    }, [searchQuery]);

    // ── Scroll-to-top ──────────────────────────────────────────────────────
    useEffect(() => {
        const fn = () => setShowScrollTop(window.scrollY > 700);
        window.addEventListener("scroll", fn, { passive: true });
        return () => window.removeEventListener("scroll", fn);
    }, []);

    // ── Deduplicated append ────────────────────────────────────────────────
    const appendReels = useCallback((incoming) => {
        setSeenIds(prevSeen => {
            const next = new Set(prevSeen);
            const fresh = incoming.filter(r => {
                const id = r._id?.toString();
                if (!id || next.has(id)) return false;
                next.add(id);
                return true;
            });
            if (fresh.length > 0) setReels(prev => [...prev, ...fresh]);
            return next;
        });
    }, []);

    // ── Initial fetch ──────────────────────────────────────────────────────
    useEffect(() => {
        let cancelled = false;

        axios.get(`${backendURL}/api/reels/tags/unique`)
            .then(({ data }) => { if (!cancelled) setTags(data.tags || []); })
            .catch(() => {});

        axios.get(`${backendURL}/api/reels/feed?limit=${INITIAL_LIMIT}`)
            .then(({ data }) => {
                if (cancelled) return;
                const fetched = data.reels || [];
                const ids = new Set(fetched.map(r => r._id?.toString()).filter(Boolean));
                setSeenIds(ids);
                setReels(fetched);
                setHasMore(fetched.length >= INITIAL_LIMIT);
            })
            .catch(() => {})
            .finally(() => { if (!cancelled) setLoading(false); });

        return () => { cancelled = true; };
    }, [backendURL]);

    // ── Manual load more ───────────────────────────────────────────────────
    const handleLoadMore = async () => {
        if (loadingMore || !hasMore) return;
        setLoadingMore(true);
        try {
            const excludeParam = [...seenIds].join(",");
            const { data } = await axios.get(
                `${backendURL}/api/reels/feed?limit=${LOAD_MORE_LIMIT}&exclude=${excludeParam}`
            );
            const incoming = data.reels || [];
            if (incoming.length === 0) {
                setHasMore(false);
            } else {
                const genuinelyNew = incoming.filter(r => !seenIds.has(r._id?.toString()));
                if (genuinelyNew.length === 0) {
                    setHasMore(false);
                } else {
                    appendReels(incoming);
                    if (incoming.length < LOAD_MORE_LIMIT) setHasMore(false);
                }
            }
        } catch {}
        finally { setLoadingMore(false); }
    };

    // ── Comment handlers ───────────────────────────────────────────────────
    const handleCommentClick = useCallback((reelId) => {
        setActiveReel(reels.find(r => r._id === reelId) || null);
        setShowComments(true);
    }, [reels]);

    const handleCommentAdded = useCallback((newCount) => {
        setReels(prev =>
            prev.map(r => r._id === activeReel?._id ? { ...r, commentsCount: newCount } : r)
        );
        if (previewReel?._id === activeReel?._id)
            setPreviewReel(prev => ({ ...prev, commentsCount: newCount }));
    }, [activeReel, previewReel]);

    // ── Client-side filter ─────────────────────────────────────────────────
    const filteredReels = reels.filter(reel => {
        if (!reelMatchesSearch(reel, debouncedQ)) return false;

        if (!selectedTag) return true;

        if (selectedTag === "__trending__") return (reel.viewsCount || 0) > 50;

        const tagWord = selectedTag.replace('#', '').toLowerCase();
        return (
            reel.title?.toLowerCase().includes(tagWord) ||
            reel.description?.toLowerCase().includes(tagWord) ||
            reel.hashtags?.some(h => h.toLowerCase().includes(tagWord))
        );
    });

    const isFiltering = !!debouncedQ || !!selectedTag;

    return (
        <div className="min-h-screen bg-[#050509] text-white">

            {/* ── STICKY HEADER ──────────────────────────────────────────── */}
            <header className="sticky top-0 z-[90] bg-[#050509]/92 backdrop-blur-2xl border-b border-white/[0.04]">
                <div className="max-w-5xl mx-auto px-4 pt-3 pb-2.5 space-y-2.5">

                    {/* Back + search */}
                    <div className="flex items-center gap-2.5">
                        <button
                            onClick={() => navigate(-1)}
                            className="w-8 h-8 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-white transition-colors flex-shrink-0"
                        >
                            <HiOutlineChevronLeft className="text-sm" />
                        </button>

                        <div className="flex-1 relative flex items-center">
                            <HiOutlineMagnifyingGlass className="absolute left-3.5 text-zinc-500 text-sm pointer-events-none z-10" />
                            <input
                                ref={searchRef}
                                type="text"
                                placeholder="Search title, tag, editor…"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full bg-white/[0.06] border border-white/[0.08] rounded-full pl-9 pr-9 py-2 text-[13px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/[0.18] focus:bg-white/[0.08] transition-all duration-200"
                            />
                            <AnimatePresence>
                                {searchQuery && (
                                    <motion.button
                                        initial={{ opacity: 0, scale: 0.7 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.7 }}
                                        onClick={() => { setSearchQuery(""); searchRef.current?.focus(); }}
                                        className="absolute right-3 text-zinc-500 hover:text-white transition-colors z-10"
                                    >
                                        <HiOutlineXMark className="text-sm" />
                                    </motion.button>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Tag pills */}
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-0.5">
                        <TagPill label="All" icon={<HiOutlineSparkles />} active={!selectedTag} onClick={() => setSelectedTag(null)} />
                        <TagPill
                            label="Trending"
                            icon={<FaFire className="text-orange-400" />}
                            active={selectedTag === "__trending__"}
                            onClick={() => setSelectedTag(selectedTag === "__trending__" ? null : "__trending__")}
                        />
                        {tags.slice(0, 16).map(tag => (
                            <TagPill
                                key={tag}
                                label={tag}
                                active={selectedTag === tag}
                                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                            />
                        ))}
                    </div>
                </div>
            </header>

            {/* ── PAGE HEADING ───────────────────────────────────────────── */}
            <div className="max-w-5xl mx-auto px-4 pt-5 pb-3 flex items-center justify-between">
                <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.22em] text-zinc-700 mb-0.5">SuviX</p>
                    <h1 className="text-xl font-black text-white leading-none tracking-tight">Explore Reels</h1>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Live</span>
                </div>
            </div>

            {/* ── MAIN ───────────────────────────────────────────────────── */}
            <main className="max-w-5xl mx-auto px-2 sm:px-4 pb-20">

                {/* Filter strip */}
                <AnimatePresence>
                    {isFiltering && !loading && (
                        <motion.div
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            className="mx-1 mb-3"
                        >
                            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                                <span className="text-[10px] font-semibold text-zinc-500">
                                    <span className="text-white font-black">{filteredReels.length}</span>
                                    {" "}result{filteredReels.length !== 1 ? "s" : ""}
                                    {debouncedQ && <> for <span className="text-zinc-300">"{debouncedQ}"</span></>}
                                    {selectedTag && selectedTag !== "__trending__" && <> · <span className="text-zinc-300">{selectedTag}</span></>}
                                </span>
                                <button
                                    onClick={() => { setSearchQuery(""); setSelectedTag(null); }}
                                    className="flex items-center gap-1 text-[10px] font-bold text-zinc-600 hover:text-white transition-colors"
                                >
                                    <HiOutlineXMark className="text-xs" /> Clear
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Skeletons */}
                {loading && (
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-1.5 sm:gap-2.5">
                        {Array.from({ length: 12 }, (_, i) => <SkeletonCard key={i} />)}
                    </div>
                )}

                {/* Empty state */}
                {!loading && filteredReels.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center py-32 gap-4 text-center"
                    >
                        <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                            <HiOutlineVideoCamera className="text-xl text-zinc-600" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-zinc-400">No reels found</p>
                            <p className="text-[11px] text-zinc-600 mt-1">
                                {isFiltering ? "Try a different keyword or tag" : "Check back soon"}
                            </p>
                        </div>
                        {isFiltering && (
                            <button
                                onClick={() => { setSearchQuery(""); setSelectedTag(null); }}
                                className="px-5 py-2 rounded-full bg-white/[0.06] border border-white/[0.08] text-[11px] font-bold text-zinc-300 hover:text-white transition-colors"
                            >
                                Clear filters
                            </button>
                        )}
                    </motion.div>
                )}

                {/* Grid — 3 cols mobile, 4 cols desktop */}
                {!loading && filteredReels.length > 0 && (
                    <>
                        <div className="grid grid-cols-3 md:grid-cols-4 gap-1.5 sm:gap-2.5">
                            {filteredReels.map((reel, idx) => (
                                <motion.div
                                    key={reel._id}
                                    initial={{ opacity: 0, scale: 0.96 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{
                                        delay: Math.min(idx * 0.025, 0.3),
                                        duration: 0.22,
                                        ease: "easeOut",
                                    }}
                                >
                                    <ReelGridItem
                                        reel={reel}
                                        onPreviewStart={setPreviewReel}
                                    />
                                </motion.div>
                            ))}
                        </div>

                        {/* Load more / End */}
                        <div className="flex flex-col items-center mt-10 mb-4 gap-3">
                            {hasMore && !isFiltering && (
                                <LoadMoreButton onClick={handleLoadMore} loading={loadingMore} />
                            )}
                            {!hasMore && reels.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex flex-col items-center gap-2"
                                >
                                    <div className="w-10 h-px bg-white/10 rounded-full" />
                                    <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-[0.18em]">
                                        No more reels
                                    </p>
                                </motion.div>
                            )}
                        </div>
                    </>
                )}
            </main>

            {/* ── MODALS ─────────────────────────────────────────────────── */}
            <AnimatePresence>
                {previewReel && (
                    <ReelPreviewModal
                        reel={previewReel}
                        onClose={() => setPreviewReel(null)}
                        onCommentClick={handleCommentClick}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showComments && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1100]"
                            onClick={() => setShowComments(false)}
                        />
                        <ReelCommentsDrawer
                            reel={activeReel}
                            onClose={() => setShowComments(false)}
                            onCommentAdded={handleCommentAdded}
                        />
                    </>
                )}
            </AnimatePresence>

            {/* Scroll to top */}
            <AnimatePresence>
                {showScrollTop && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 8 }}
                        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                        className="fixed bottom-6 right-5 z-[200] w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-2xl shadow-black/40"
                    >
                        <HiOutlineArrowUp className="text-sm" />
                    </motion.button>
                )}
            </AnimatePresence>

            <style>{`
                @keyframes shimmer {
                    0%   { transform: translateX(-100%); }
                    100% { transform: translateX(250%);  }
                }
            `}</style>
        </div>
    );
};

export default ReelsExplore;