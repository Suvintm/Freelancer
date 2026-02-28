import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaArrowLeft, FaSpinner } from "react-icons/fa";
import { HiOutlineChevronLeft } from "react-icons/hi2";
import { BiRefresh } from "react-icons/bi";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAppContext } from "../context/AppContext";
import { useReelsContext } from "../context/ReelsContext";
import ReelCard from "../components/ReelCard";
import ReelSkeleton from "../components/ReelSkeleton";
import ReelAdCard from "../components/ReelAdCard";
import CommentSection from "../components/CommentSection";
import useReelObserver from "../hooks/useReelObserver";
import useScrollRestore from "../hooks/useScrollRestore";
import logo from "../assets/logo.png";

const ReelsPage = () => {
    // Isolated scroll for Reels page
    useScrollRestore('reelsPage');
    const { backendURL, user } = useAppContext();
    const {
        feedCache,
        activeIndexCache,
        pageCache,
        isCacheValid,
        updateCache,
        appendToCache,
        invalidateCache,
        savePosition,
        globalMuted,
        setGlobalMuted,
    } = useReelsContext();
    const navigate = useNavigate();

    const [reels, setReels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [activeReelIndex, setActiveReelIndex] = useState(0);
    const [showComments, setShowComments] = useState(false);
    const [activeReelId, setActiveReelId] = useState(null);
    const [reelAds, setReelAds] = useState([]);
    const [skippedAdIndices, setSkippedAdIndices] = useState(new Set());

    const containerRef = useRef(null);
    const observerRef = useRef(null);
    const viewedReelsRef = useRef(new Set());

    // ─────────────────────────────────────────────────────────────
    // FETCH REELS
    // ─────────────────────────────────────────────────────────────
    const fetchReels = useCallback(async (pageNum = 1, loadMore = false) => {
        try {
            const excludeIds = loadMore
                ? feedCache.current.map((r) => r._id).join(",")
                : "";

            const { data } = await axios.get(
                `${backendURL}/api/reels/feed?page=${pageNum}&limit=5&exclude=${excludeIds}`
            );

            if (loadMore) {
                const combined = [...feedCache.current, ...data.reels];
                // Deduplicate by _id to prevent duplicate key errors
                const uniqueReels = Array.from(new Map(combined.map(r => [r._id, r])).values());
                setReels(uniqueReels);
                appendToCache(uniqueReels, pageNum);
            } else {
                setReels(data.reels);
                updateCache(data.reels, pageNum);
            }

            setHasMore(data.pagination.hasMore);
        } catch (err) {
            console.error("[Reels] Fetch error:", err.message);
        } finally {
            setLoading(false);
            setLoadingMore(false);
            setRefreshing(false);
        }
    }, [backendURL]);

    // ─────────────────────────────────────────────────────────────
    // ON MOUNT — restore from cache if valid, else fresh fetch
    // ─────────────────────────────────────────────────────────────
    useEffect(() => {
        if (isCacheValid()) {
            setReels(feedCache.current);
            setPage(pageCache.current);
            setLoading(false);

            // Restore scroll position to where the user was
            const savedIndex = activeIndexCache.current;
            setTimeout(() => {
                const el = document.getElementById(`reel-${savedIndex}`);
                el?.scrollIntoView({ behavior: "instant", block: "start" });
                setActiveReelIndex(savedIndex);
            }, 50);
        } else {
            fetchReels(1, false);
        }
    }, []);

    // Fetch ads for reels feed
    useEffect(() => {
        const fetchReelAds = async () => {
            try {
                // Try fetching specifically for reels_feed
                let res = await axios.get(`${backendURL}/api/ads?location=reels_feed`);
                let ads = res.data.ads || [];
                
                // FALLBACK: If no reels_feed ads, try fetching home_banner ads just so they see something
                if (ads.length === 0) {
                    res = await axios.get(`${backendURL}/api/ads?location=home_banner`);
                    ads = res.data.ads || [];
                }
                
                setReelAds(ads);
            } catch (err) {
                console.error("Ad fetch error:", err);
            }
        };
        fetchReelAds();
    }, [backendURL]);

    // ─────────────────────────────────────────────────────────────
    // TRACK VIEW ON ACTIVE REEL CHANGE
    // ─────────────────────────────────────────────────────────────
    useEffect(() => {
        const reel = reels[activeReelIndex];
        if (!reel) return;
        if (viewedReelsRef.current.has(reel._id)) return;

        viewedReelsRef.current.add(reel._id);
        axios.post(`${backendURL}/api/reels/${reel._id}/view`).catch(() => {});
    }, [activeReelIndex, reels, backendURL]);

    // ─────────────────────────────────────────────────────────────
    // PER-REEL INTERSECTION OBSERVER — accurate active detection
    // ─────────────────────────────────────────────────────────────
    useReelObserver(reels.length, (index) => {
        setActiveReelIndex(index);
        savePosition(index);
    });

    // ─────────────────────────────────────────────────────────────
    // INFINITE SCROLL — last reel observer
    // ─────────────────────────────────────────────────────────────
    const lastReelRef = useCallback(
        (node) => {
            if (loadingMore || loading) return;
            if (observerRef.current) observerRef.current.disconnect();

            observerRef.current = new IntersectionObserver(
                ([entry]) => {
                    if (entry.isIntersecting) {
                        loadMore();
                    }
                },
                { threshold: 0.5 }
            );

            if (node) observerRef.current.observe(node);
        },
        [loadingMore, loading, hasMore, page, reels]
    );

    const loadMore = async () => {
        if (loadingMore) return;
        setLoadingMore(true);

        if (!hasMore) {
            // Cycle reels — fetch fresh batch
            viewedReelsRef.current.clear();
            await fetchReels(1, true);
            return;
        }

        const nextPage = page + 1;
        setPage(nextPage);
        await fetchReels(nextPage, true);
    };

    // ─────────────────────────────────────────────────────────────
    // PULL-TO-REFRESH
    // ─────────────────────────────────────────────────────────────
    const touchStartY = useRef(0);
    const isPulling = useRef(false);

    const handleTouchStart = (e) => {
        touchStartY.current = e.touches[0].clientY;
        isPulling.current = containerRef.current?.scrollTop === 0;
    };

    const handleTouchEnd = (e) => {
        if (!isPulling.current) return;
        const delta = e.changedTouches[0].clientY - touchStartY.current;

        if (delta > 90) {
            handleRefresh();
        }
        isPulling.current = false;
    };

    const handleRefresh = async () => {
        if (refreshing) return;
        setRefreshing(true);
        invalidateCache();
        viewedReelsRef.current.clear();
        setPage(1);
        setActiveReelIndex(0);
        await fetchReels(1, false);

        // Scroll back to top
        containerRef.current?.scrollTo({ top: 0, behavior: "instant" });
    };

    // ─────────────────────────────────────────────────────────────
    // COMMENTS
    // ─────────────────────────────────────────────────────────────
    const handleCommentClick = (reelId) => {
        setActiveReelId(reelId);
        setShowComments(true);
    };

    const handleCommentAdded = (newCount) => {
        setReels((prev) =>
            prev.map((r) =>
                r._id === activeReelId ? { ...r, commentsCount: newCount } : r
            )
        );
    };

    // ─────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────
    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">

            {/* ── HEADER ── */}
            <div className="absolute top-0 left-0 right-0 px-4 py-4 z-40 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
                <button
                    onClick={() => navigate(-1)}
                    className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white transition-colors pointer-events-auto"
                >
                    <HiOutlineChevronLeft className="text-2xl" />
                </button>

                <div className="flex items-center gap-2">
                    <img src={logo} className="w-8 h-8 rounded-xl opacity-90" alt="SuviX" />
                    <span className="text-white font-semibold text-lg tracking-wide drop-shadow-lg">
                        SuviX Reels
                    </span>
                </div>

                {/* Refresh button */}
                <button
                    onClick={handleRefresh}
                    className="w-10 h-10 bg-white/15 backdrop-blur-xl rounded-full flex items-center justify-center text-white hover:bg-white/25 transition shadow-lg pointer-events-auto"
                    title="Refresh reels"
                >
                    <BiRefresh className={`text-xl ${refreshing ? "animate-spin" : ""}`} />
                </button>
            </div>

            {/* ── PULL-TO-REFRESH INDICATOR ── */}
            <AnimatePresence>
                {refreshing && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="absolute top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
                    >
                        <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 shadow-xl">
                            <FaSpinner className="text-white animate-spin text-sm" />
                            <span className="text-white text-xs font-semibold">
                                Loading fresh reels...
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── FEED ── */}
            <div
                ref={containerRef}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                className="flex-1 overflow-y-scroll snap-y snap-mandatory scrollbar-hide touch-pan-y"
            >
                {/* Skeleton — shown only on first load */}
                {loading && (
                    <>
                        <ReelSkeleton />
                        <ReelSkeleton />
                    </>
                )}

                {/* Reel cards with ad injection every 5th reel */}
                {!loading && reels.map((reel, index) => {
                    // Insert an ad after every 5th reel (index 4, 9, 14...)
                    const adAfterThis = (index + 1) % 5 === 0 && reelAds.length > 0;
                    const adForSlot = reelAds[Math.floor(index / 5) % reelAds.length];
                    const adSlotIndex = `ad-${index}`;

                    return (
                        <React.Fragment key={reel._id}>
                            <div
                                id={`reel-${index}`}
                                ref={index === reels.length - 1 ? lastReelRef : null}
                                className="w-full h-screen snap-start relative flex-shrink-0"
                            >
                                <ReelCard
                                    reel={reel}
                                    isActive={index === activeReelIndex}
                                    onCommentClick={handleCommentClick}
                                    globalMuted={globalMuted}
                                    setGlobalMuted={setGlobalMuted}
                                />
                            </div>
                            {adAfterThis && adForSlot && !skippedAdIndices.has(adSlotIndex) && (
                                <div
                                    key={adSlotIndex}
                                    className="w-full h-screen snap-start relative flex-shrink-0"
                                >
                                    <ReelAdCard
                                        ad={adForSlot}
                                        onSkip={() => setSkippedAdIndices(prev => new Set([...prev, adSlotIndex]))}
                                    />
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}

                {/* Loading more spinner (bottom) */}
                {loadingMore && (
                    <div className="w-full h-24 flex items-center justify-center bg-black">
                        <FaSpinner className="text-white text-2xl animate-spin" />
                    </div>
                )}

                {/* Empty state */}
                {!loading && reels.length === 0 && (
                    <div className="w-full h-screen flex flex-col items-center justify-center text-white gap-4">
                        <span className="text-5xl">🎬</span>
                        <p className="text-lg font-semibold">No reels yet</p>
                        <p className="text-sm text-white/60">
                            Editors haven't published any reels yet.
                        </p>
                    </div>
                )}
            </div>

            {/* ── COMMENTS DRAWER ── */}
            <AnimatePresence>
                {showComments && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55]"
                            onClick={() => setShowComments(false)}
                        />
                        <CommentSection
                            reelId={activeReelId}
                            onClose={() => setShowComments(false)}
                            onCommentAdded={handleCommentAdded}
                        />
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ReelsPage;
