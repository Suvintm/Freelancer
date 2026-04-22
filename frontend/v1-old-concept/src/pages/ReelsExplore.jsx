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
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAppContext } from "../context/AppContext";
import { useReelsContext } from "../context/ReelsContext";
import ReelGridItem from "../components/ReelGridItem.jsx";
import ReelCommentsDrawer from "../components/ReelCommentsDrawer";
import TrendingReelsCarousel from "../components/TrendingReelsCarousel.jsx";
import { repairUrl } from "../utils/urlHelper.jsx";

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

// ─── Main Component ────────────────────────────────────────────────────────
const ReelsExplore = ({ isTab = false, isSwiping = false }) => {
    const { backendURL } = useAppContext();
    const { prePopulateCache } = useReelsContext();
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

    const [sessionSeed, setSessionSeed] = useState(() => Math.random().toString(36).substring(7));
    const [suggestions, setSuggestions] = useState({ suggestedCreators: [], suggestedReels: [] });
    const [loadingSuggestions, setLoadingSuggestions] = useState(true);

    useEffect(() => {
        setIsReady(true);
    }, []);

    // ── Fetching Logic ──────────────────────────────────────────────────────
    const fetchFeed = useCallback(async (isFresh = true) => {
        try {
            if (isFresh) {
                setLoading(true);
                const newSeed = Math.random().toString(36).substring(7);
                setSessionSeed(newSeed);
                
                const { data } = await axios.get(`${backendURL}/api/reels/feed`, {
                    params: { limit: INITIAL_LIMIT, sessionSeed: newSeed }
                });
                const fetched = data.reels || [];
                setReels(fetched);
                prePopulateCache(fetched);
                setSeenIds(new Set(fetched.map(r => r._id)));
                setHasMore(fetched.length >= INITIAL_LIMIT);
            } else {
                if (loadingMore || !hasMore) return;
                setLoadingMore(true);
                const excludeStr = [...seenIds].join(",");
                const { data } = await axios.get(`${backendURL}/api/reels/feed`, {
                    params: { limit: LOAD_MORE_LIMIT, exclude: excludeStr, sessionSeed: sessionSeed }
                });
                const incoming = data.reels || [];
                if (incoming.length === 0) {
                    setHasMore(false);
                } else {
                    const genuinelyNew = incoming.filter(r => !seenIds.has(r._id));
                    setReels(prev => [...prev, ...genuinelyNew]);
                    prePopulateCache(genuinelyNew);
                    setSeenIds(prev => new Set([...prev, ...genuinelyNew.map(r => r._id)]));
                    if (incoming.length < LOAD_MORE_LIMIT) setHasMore(false);
                }
            }
        } catch (err) {
            console.error("Feed fetch error:", err);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [backendURL, hasMore, loadingMore, seenIds, sessionSeed]);

    const fetchSuggestions = useCallback(async () => {
        setLoadingSuggestions(true);
        try {
            const { data } = await axios.get(`${backendURL}/api/reels/suggestions/discovery`);
            if (data.success) setSuggestions(data.data);
        } catch (err) {
            console.error("Discovery fetch failed", err);
        } finally {
            setLoadingSuggestions(false);
        }
    }, [backendURL]);
    const isMounted = useRef(false);

    // Initial load - Run ONCE on mount
    useEffect(() => {
        if (isMounted.current) return;
        isMounted.current = true;

        fetchFeed(true);
        fetchSuggestions();
        
        axios.get(`${backendURL}/api/reels/tags/unique`)
            .then(({ data }) => setTags(data.tags || []))
            .catch(() => {});
    }, []); // Empty dependencies = ONCE on mount

    useEffect(() => {
        const handleRefresh = () => {
            fetchFeed(true);
            fetchSuggestions();
        };
        window.addEventListener("trigger_explore_refresh", handleRefresh);
        return () => window.removeEventListener("trigger_explore_refresh", handleRefresh);
    }, [fetchFeed, fetchSuggestions]);

    // ── Search & Filter Logic ──────────────────────────────────────────────
    useEffect(() => {
        const t = setTimeout(() => setDebouncedQ(searchQuery), 350);
        return () => clearTimeout(t);
    }, [searchQuery]);

    const filteredReels = useMemo(() => {
        return reels.filter(reel => {
            if (debouncedQ) {
                const q = debouncedQ.toLowerCase();
                const text = `${reel.title} ${reel.description} ${reel.editor?.name} ${reel.hashtags?.join(" ")}`.toLowerCase();
                if (!text.includes(q)) return false;
            }
            if (selectedTag) {
                if (selectedTag === "__trending__") return (reel.viewsCount || 0) > 50;
                const tagWord = selectedTag.replace('#', '').toLowerCase();
                return reel.hashtags?.some(h => h.toLowerCase().includes(tagWord)) || reel.title?.toLowerCase().includes(tagWord);
            }
            return true;
        });
    }, [reels, debouncedQ, selectedTag]);

    const isFiltering = !!debouncedQ || !!selectedTag;

    // ── Render Components ──────────────────────────────────────────────────
    const SuggestedCreatorsSection = () => {
        if (loadingSuggestions || suggestions.suggestedCreators.length === 0) return null;
        return (
            <div className="my-8 mb-10">
                <div className="flex items-center justify-between px-1 mb-4">
                    <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">Suggested Creators</h2>
                    <button className="text-[10px] font-bold text-white/40 hover:text-white transition-colors">See All</button>
                </div>
                <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 snap-x">
                    {suggestions.suggestedCreators.map((creator) => (
                        <motion.div 
                            key={creator._id} 
                            whileTap={{ scale: 0.96 }}
                            className="flex-shrink-0 w-32 bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 flex flex-col items-center text-center snap-start"
                        >
                            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/10 mb-2.5">
                                <img src={repairUrl(creator.profilePicture)} className="w-full h-full object-cover" alt="" />
                            </div>
                            <span className="text-[11px] font-bold text-white truncate w-full mb-0.5">{creator.name}</span>
                            <span className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mb-3">Editor</span>
                            <button 
                                onClick={() => navigate(`/profile/editor/${creator._id}`)}
                                className="w-full py-1.5 rounded-lg bg-white text-black text-[9px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-colors"
                            >
                                View
                            </button>
                        </motion.div>
                    ))}
                </div>
            </div>
        );
    };

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
                                <HiOutlineMagnifyingGlass className="absolute left-3.5 text-zinc-500 text-sm" />
                                <input 
                                    type="text" 
                                    placeholder="Search reels..." 
                                    value={searchQuery} 
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full bg-white/[0.06] border border-white/[0.08] rounded-full pl-9 pr-4 py-2 text-[13px] focus:outline-none focus:border-white/20 transition-all" 
                                />
                            </div>
                        </div>
                    </div>
                </header>
            )}

            <div className="max-w-5xl mx-auto px-3.5 py-4">
                {!isFiltering && !loading && (
                    <div className="mb-2">
                        <TrendingReelsCarousel reels={reels} isSwiping={isSwiping} />
                    </div>
                )}

                {!isFiltering && !loading && <SuggestedCreatorsSection />}

                <div className="mb-4 mt-6">
                    <div className="flex items-center justify-between mb-4 px-1">
                        <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">
                            {isFiltering ? `Searching for "${debouncedQ}"` : "For You · Discovery"}
                        </h2>
                        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide max-w-[200px]">
                            {tags.slice(0, 5).map(tag => (
                                <button key={tag} onClick={() => setSelectedTag(tag === selectedTag ? null : tag)} className={`text-[9px] font-bold px-2 py-0.5 rounded-full border transition-all ${selectedTag === tag ? "bg-white text-black border-white" : "text-zinc-600 border-white/10"}`}>
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-3 md:grid-cols-4 gap-[1px]">
                            {Array.from({ length: 9 }, (_, i) => <SkeletonCard key={i} />)}
                        </div>
                    ) : filteredReels.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                            <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest">No results found</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 md:grid-cols-4 gap-[1.5px]">
                            {filteredReels.map((reel) => (
                                <ReelGridItem key={reel._id} reel={reel} onPreviewStart={(r) => navigate(`/reels?id=${r._id}`)} />
                            ))}
                        </div>
                    )}
                </div>

                {hasMore && !isFiltering && !loading && (
                    <div className="flex justify-center mt-8 mb-10">
                        <button 
                            onClick={() => fetchFeed(false)} 
                            disabled={loadingMore}
                            className="px-8 py-3 rounded-full bg-white/[0.05] border border-white/10 text-[11px] font-black uppercase tracking-widest hover:bg-white/[0.08] transition-all disabled:opacity-50"
                        >
                            {loadingMore ? "Loading..." : "Load More"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default memo(ReelsExplore);