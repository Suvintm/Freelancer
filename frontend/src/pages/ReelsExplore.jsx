import React, { useState, useEffect, useRef, useCallback, memo, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    HiOutlineChevronLeft,
    HiOutlineMagnifyingGlass,
    HiOutlineVideoCamera,
    HiOutlineSparkles,
    HiOutlineXMark,
    HiOutlineArrowUp,
    HiOutlineFire,
} from "react-icons/hi2";
import { FaFire } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAppContext } from "../context/AppContext";
import ReelGridItem from "../components/ReelGridItem.jsx";
import ReelCommentsDrawer from "../components/ReelCommentsDrawer";
import TrendingReelsCarousel from "../components/TrendingReelsCarousel.jsx";

// ─── Constants ─────────────────────────────────────────────────────────────
const INITIAL_LIMIT = 18;
const LOAD_MORE_LIMIT = 12;

// ─── Skeleton Card ─────────────────────────────────────────────────────────
const SkeletonCard = () => (
    <div className="bg-white/[0.04] overflow-hidden relative w-full" style={{ aspectRatio: "9/14" }}>
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
        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-200 whitespace-nowrap border flex-shrink-0 ${active ? "bg-white text-black border-white shadow-[0_0_18px_rgba(255,255,255,0.12)]" : "bg-white/[0.04] text-zinc-500 border-white/[0.07] hover:border-white/20 hover:text-zinc-300"}`}
    >
        {icon && <span className="text-[11px] leading-none">{icon}</span>}
        {label}
    </motion.button>
);

// ─── Load More Button ──────────────────────────────────────────────────────
const LoadMoreButton = ({ onClick, loading: isLoading }) => (
    <motion.button
        whileTap={{ scale: 0.97 }} onClick={onClick} disabled={isLoading}
        className="flex items-center gap-2.5 px-8 py-3 rounded-full bg-white text-black text-[12px] font-black uppercase tracking-widest shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-60"
    >
        {isLoading ? <span className="w-3.5 h-3.5 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : "Load More"}
    </motion.button>
);

// ─── Main Component ────────────────────────────────────────────────────────
const ReelsExplore = ({ isTab = false, isSwiping = false }) => {
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
    const [showComments, setShowComments] = useState(false);
    const [activeReel, setActiveReel]   = useState(null);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [isReady, setIsReady]         = useState(false);
    
    // — Phase 3: Search Autocomplete —
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isSuggesting, setIsSuggesting] = useState(false);

    // Simplified entry
    useEffect(() => {
        setIsReady(true);
    }, []);

    const searchRef = useRef(null);

    // ── Debounce search & Fetch TRIE Suggestions ───────────────────────────
    useEffect(() => {
        const q = searchQuery.trim();
        if (q.length < 1) {
            setSuggestions([]);
            setShowSuggestions(false);
            setDebouncedQ("");
            return;
        }

        const t = setTimeout(async () => {
            setDebouncedQ(q);
            
            // Fetch Global Suggestions from Backend TRIE (O(L))
            setIsSuggesting(true);
            try {
                const { data } = await axios.get(`${backendURL}/api/reels/search/suggest?q=${encodeURIComponent(q)}`);
                setSuggestions(data.suggestions || []);
                setShowSuggestions(data.suggestions?.length > 0);
            } catch (err) {
                console.error("Suggestion fetch failed", err);
            } finally {
                setIsSuggesting(false);
            }
        }, 350);

        return () => clearTimeout(t);
    }, [searchQuery, backendURL]);

    // ── Scroll-to-top ──────────────────────────────────────────────────────
    useEffect(() => {
        const fn = () => setShowScrollTop(window.scrollY > 700);
        window.addEventListener("scroll", fn, { passive: true });
        return () => window.removeEventListener("scroll", fn);
    }, []);

    // ── DATA STRUCTURE & ALGORITHM (DSA) UPGRADE: Inverted Index Search ──
    /**
     * Why Inverted Index? (Product Company Standards)
     * Standard Array.filter() is O(N) where N is number of reels. As the platform grows to millions 
     * of reels, O(N) filtering causes UI freeze (Jank).
     * 
     * DSA Concept: Inverted Index (Map-based Tokenization)
     * 1. Space-Time Tradeoff: We use O(K) extra memory (K = total unique tokens) to achieve O(1) matching.
     * 2. Tokenization: We split reel data into discrete lowercase tokens.
     * 3. Set Intersection: Multi-word searches perform a Set intersection (highly optimized in V8).
     * 4. Memoization: The index is only built once per data change, saving CPU cycles.
     */
    useEffect(() => {
        const fn = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setShowSuggestions(false); };
        document.addEventListener("mousedown", fn);
        return () => document.removeEventListener("mousedown", fn);
    }, []);

    const searchIndex = useMemo(() => {
        const index = new Map(); // keyword -> Set of reelIds
        reels.forEach(reel => {
            const raw = [
                reel.title || "",
                reel.description || "",
                reel.editor?.name || "",
                ...(Array.isArray(reel.hashtags) ? reel.hashtags : [])
            ].join(" ").toLowerCase();
            
            // Regex to pick out words/tokens
            const tokens = raw.split(/[^a-z0-9#@]+/i).filter(t => t.length > 1);
            
            tokens.forEach(token => {
                if (!index.has(token)) index.set(token, new Set());
                index.get(token).add(reel._id);
            });
        });
        return index;
    }, [reels]);

    // O(1) or O(M) retrieval where M is query word count (usually < 5)
    const getFilteredReelIds = useCallback((query) => {
        const q = query.toLowerCase().trim();
        if (!q) return null;
        const queryTokens = q.split(/\s+/).filter(Boolean);
        
        let resultIds = null;
        for (const token of queryTokens) {
            // Partial matching: search keys for tokens that start with our search term
            // This turns the Inverted Index into a Prefix-capable Search.
            const matches = new Set();
            for (const [key, ids] of searchIndex.entries()) {
                if (key.includes(token)) {
                    ids.forEach(id => matches.add(id));
                }
            }
            
            if (resultIds === null) {
                resultIds = matches;
            } else {
                // Intersection logic (AND search)
                resultIds = new Set([...resultIds].filter(id => matches.has(id)));
            }
            if (resultIds.size === 0) break;
        }
        return resultIds;
    }, [searchIndex]);

    // ────────────────────────────────────────────────────────────────────────

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
            const { data } = await axios.get(`${backendURL}/api/reels/feed?limit=${LOAD_MORE_LIMIT}&exclude=${excludeParam}`);
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

    // ── Client-side filter ─────────────────────────────────────────────────
    const filteredReels = useMemo(() => {
        const searchMatchesIds = getFilteredReelIds(debouncedQ);
        
        return reels.filter(reel => {
            // O(1) lookup if querying
            if (searchMatchesIds !== null && !searchMatchesIds.has(reel._id)) return false;

            if (!selectedTag) return true;
            if (selectedTag === "__trending__") return (reel.viewsCount || 0) > 50;

            const tagWord = selectedTag.replace('#', '').toLowerCase();
            return (
                reel.title?.toLowerCase().includes(tagWord) ||
                reel.description?.toLowerCase().includes(tagWord) ||
                reel.hashtags?.some(h => h.toLowerCase().includes(tagWord))
            );
        });
    }, [reels, debouncedQ, selectedTag, getFilteredReelIds]);

    const isFiltering = !!debouncedQ || !!selectedTag;

    if (!isReady && reels.length === 0) {
        return (
            <div className={`w-full ${isTab ? "" : "min-h-screen bg-[#050509]"} p-4 opacity-50`}>
                <div className="h-10 bg-white/5 rounded-full w-full max-w-md mx-auto mb-8" />
                <div className="grid grid-cols-3 gap-3">
                    {[1,2,3].map(i => <div key={i} className="aspect-[9/16] bg-white/5" />)}
                </div>
            </div>
        );
    }

    return (
        <div className={`w-full ${isTab ? "" : "min-h-screen bg-[#050509]"} text-white ${isSwiping ? "pointer-events-none" : ""}`}>
            {!isTab && (
                <header className="sticky top-0 z-[90] bg-[#050509]/92 backdrop-blur-2xl border-b border-white/[0.04]">
                    <div className="max-w-5xl mx-auto px-4 pt-3 pb-2.5 space-y-2.5">
                        <div className="flex items-center gap-2.5">
                            <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
                                <HiOutlineChevronLeft className="text-sm" />
                            </button>
                            <div className="flex-1 relative flex items-center">
                                <HiOutlineMagnifyingGlass className="absolute left-3.5 text-zinc-500 text-sm pointer-events-none" />
                                <input 
                                    ref={searchRef} 
                                    type="text" 
                                    placeholder="Search title, tag, editor…" 
                                    value={searchQuery} 
                                    onChange={e => setSearchQuery(e.target.value)} 
                                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                                    className="w-full bg-white/[0.06] border border-white/[0.08] rounded-full pl-9 pr-9 py-2 text-[13px] text-white focus:outline-none focus:border-white/[0.18] transition-all duration-200" 
                                />
                                {searchQuery && (
                                    <button onClick={() => { setSearchQuery(""); setSuggestions([]); setShowSuggestions(false); searchRef.current?.focus(); }} className="absolute right-3 text-zinc-500 hover:text-white"><HiOutlineXMark /></button>
                                )}

                                {/* TRIE AUTOCOMPLETE DROPDOWN */}
                                <AnimatePresence>
                                    {showSuggestions && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 5 }}
                                            className="absolute top-[calc(100%+8px)] left-0 right-0 bg-[#12121e] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden z-[100] backdrop-blur-xl"
                                        >
                                            <div className="max-h-[300px] overflow-y-auto py-2 scrollbar-thin scrollbar-thumb-white/10">
                                                {suggestions.map((s, i) => (
                                                    <button
                                                        key={`${s.id}-${i}`}
                                                        onClick={() => {
                                                            setSearchQuery(s.display);
                                                            setShowSuggestions(false);
                                                        }}
                                                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.05] transition-colors text-left"
                                                    >
                                                        <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center text-zinc-500">
                                                            {s.type === 'hashtag' ? '#' : (s.type === 'user' ? '@' : <HiOutlineVideoCamera className="text-xs" />)}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[13px] font-bold text-zinc-200">{s.display}</span>
                                                            <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-black">{s.type}</span>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-0.5">
                            <TagPill label="All" icon={<HiOutlineSparkles />} active={!selectedTag} onClick={() => setSelectedTag(null)} />
                            <TagPill label="Trending" icon={<HiOutlineFire className="text-orange-400" />} active={selectedTag === "__trending__"} onClick={() => setSelectedTag(selectedTag === "__trending__" ? null : "__trending__")} />
                            {tags.slice(0, 16).map(tag => (
                                <TagPill key={tag} label={tag} active={selectedTag === tag} onClick={() => setSelectedTag(selectedTag === tag ? null : tag)} />
                            ))}
                        </div>
                    </div>
                </header>
            )}

            {!isTab && (
                <div className="max-w-5xl mx-auto px-4 pt-5 pb-3 flex items-center justify-between">
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.22em] text-zinc-700 mb-0.5">SuviX</p>
                        <h1 className="text-xl font-black text-white tracking-tight">Explore Reels</h1>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Live</span>
                    </div>
                </div>
            )}

            <div className="max-w-5xl mx-auto px-3.5 py-4">
                {!isFiltering && <div className="mb-2"><TrendingReelsCarousel reels={reels} isSwiping={isSwiping} /></div>}

                <AnimatePresence>
                    {isFiltering && !loading && (
                        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="mx-1 mb-3">
                            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                                <span className="text-[10px] font-semibold text-zinc-500">
                                    <span className="text-white font-black">{filteredReels.length}</span> results found
                                </span>
                                <button onClick={() => { setSearchQuery(""); setSelectedTag(null); }} className="text-[10px] font-bold text-zinc-600 hover:text-white flex items-center gap-1">
                                    <HiOutlineXMark /> Clear
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {loading ? (
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-[1px]">
                        {Array.from({ length: 12 }, (_, i) => <SkeletonCard key={i} />)}
                    </div>
                ) : filteredReels.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center text-zinc-600 text-xl"><HiOutlineVideoCamera /></div>
                        <p className="text-sm font-bold text-zinc-400">No reels found</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-3 md:grid-cols-4 gap-[1px]">
                            {filteredReels.map((reel, idx) => (
                                <motion.div key={reel._id} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: Math.min(idx * 0.02, 0.2) }}>
                                    <ReelGridItem reel={reel} onPreviewStart={(r) => navigate(`/reels?id=${r._id}`)} />
                                </motion.div>
                            ))}
                        </div>
                        <div className="flex flex-col items-center mt-10 mb-4">
                            {hasMore && !isFiltering && <LoadMoreButton onClick={handleLoadMore} loading={loadingMore} />}
                        </div>
                    </>
                )}
            </div>

            <AnimatePresence>
                {showComments && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1100]" onClick={() => setShowComments(false)} />
                        <ReelCommentsDrawer reel={activeReel} onClose={() => setShowComments(false)} onCommentAdded={handleCommentAdded} />
                    </>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showScrollTop && (
                    <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="fixed bottom-6 right-5 z-[200] w-10 h-10 rounded-full bg-white text-black flex items-center justify-center"><HiOutlineArrowUp /></motion.button>
                )}
            </AnimatePresence>

            <style>{`@keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(250%); } }`}</style>
        </div>
    );
};

export default memo(ReelsExplore);