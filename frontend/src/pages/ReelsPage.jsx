import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaArrowLeft, FaSpinner } from "react-icons/fa";
import { HiOutlineChevronLeft } from "react-icons/hi2";
import { BiRefresh } from "react-icons/bi";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { useAppContext } from "../context/AppContext";
import { useReelsContext } from "../context/ReelsContext";
import ReelCard from "../components/ReelCard";
import ReelSkeleton from "../components/ReelSkeleton";
import ReelAdCard from "../components/ReelAdCard";
import ReelCommentsDrawer from "../components/ReelCommentsDrawer";
import useReelObserver from "../hooks/useReelObserver";
import usePullToRefresh from "../hooks/usePullToRefresh.jsx";
import logo from "../assets/logo.png";

const ReelsPage = ({ isActive = true }) => {
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
    const [searchParams] = useSearchParams();
    const targetReelId = searchParams.get("id");

    const [reels, setReels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [activeReelIndex, setActiveReelIndex] = useState(0);
    const [showComments, setShowComments] = useState(false);
    const [activeReel, setActiveReel] = useState(null);
    const [reelAds, setReelAds] = useState([]);
    const [skippedAdIndices, setSkippedAdIndices] = useState(new Set());
    const [targetAd, setTargetAd] = useState(null);

    const containerRef = useRef(null);
    const observerRef = useRef(null);
    const viewedReelsRef = useRef(new Set());

    // ─────────────────────────────────────────────────────────────
    // FETCH REELS
    // ─────────────────────────────────────────────────────────────
    const fetchReels = useCallback(async (pageNum = 1, isLoadMore = false) => {
        try {
            // Support background refresh: only set loading true if we have nothing to show
            if (!isLoadMore && pageNum === 1 && reels.length === 0) setLoading(true);
            
            const excludeIdsArr = isLoadMore
                ? feedCache.current.map((r) => r._id)
                : (targetReelId ? [targetReelId] : []);
            
            const excludeIds = excludeIdsArr.join(",");
 
            const { data } = await axios.get(
                `${backendURL}/api/reels/feed?page=${pageNum}&limit=5&exclude=${excludeIds}`
            );
 
            let fetchedReels = data.reels;
 
            // If it's the first page and we have a target ID, fetch that specific item first
            if (!isLoadMore && pageNum === 1 && targetReelId) {
                try {
                    if (targetReelId.startsWith("ad_")) {
                        const actualAdId = targetReelId.replace("ad_", "");
                        const { data: adData } = await axios.get(`${backendURL}/api/ads/${actualAdId}`);
                        if (adData.ad) {
                            setTargetAd(adData.ad);
                        }
                    } else {
                        const { data: specificReelData } = await axios.get(`${backendURL}/api/reels/${targetReelId}`);
                        if (specificReelData.reel) {
                            fetchedReels = [specificReelData.reel, ...fetchedReels];
                        }
                    }
                } catch (specificErr) {
                    console.error("[Reels] Error fetching target item:", specificErr.message);
                }
            }
 
            if (isLoadMore) {
                // Deduplicate by _id to prevent duplicate key errors
                const combined = [...feedCache.current, ...fetchedReels];
                const uniqueReels = Array.from(new Map(combined.map(r => [r._id, r])).values());
                
                setReels(uniqueReels);
                appendToCache(fetchedReels, pageNum); // appendToCache now handles unique internally too
            } else {
                // Even on initial load, deduplicate (especially if targetReelId appeared in fetchedReels)
                const uniqueInitial = Array.from(new Map(fetchedReels.map(r => [r._id, r])).values());
                setReels(uniqueInitial);
                updateCache(uniqueInitial, pageNum);
            }

            setHasMore(data.pagination.hasMore);
        } catch (err) {
            console.error("[Reels] Fetch error:", err.message);
        } finally {
            setLoading(false);
            setLoadingMore(false);
            setRefreshing(false);
        }
    }, [backendURL, updateCache, appendToCache, targetReelId]);

    // ─────────────────────────────────────────────────────────────
    // ON MOUNT — restore from cache if valid, else fresh fetch
    // ─────────────────────────────────────────────────────────────
    useEffect(() => {
        // Since ReelsPage is inside a persistent TabSwitcher, we only re-init when it becomes active
        if (!isActive) return;

        if (targetReelId) {
            // CASE 1: We have a specific target reel from the URL
            const currentFirstId = (reels.length > 0) ? reels[0]._id : null;
            
            if (targetReelId !== currentFirstId) {
                // It's a brand new target or different from what we had at the top. RESET.
                setLoading(true);
                setReels([]);
                setTargetAd(null); // Clear previous target ad
                setActiveReelIndex(0);
                containerRef.current?.scrollTo({ top: 0, behavior: "instant" });
                fetchReels(1, false);
            } else {
                // Target is already at index 0, but we might be scrolled away within the same mount!
                // Force scroll to top (handles scroll persistence in the TabSwitcher environment)
                setActiveReelIndex(0);
                containerRef.current?.scrollTo({ top: 0, behavior: "instant" });
            }
        } else if (isCacheValid() && reels.length === 0) {
            // CASE 2: Regular visit (no target), restore from global cache
            setReels(feedCache.current);
            setPage(pageCache.current);
            setLoading(false);

            const savedIndex = activeIndexCache.current;
            setTimeout(() => {
                const el = document.getElementById(`feed-item-${savedIndex}`);
                el?.scrollIntoView({ behavior: "instant", block: "start" });
                setActiveReelIndex(savedIndex);
            }, 50);
        } else if (!isCacheValid() || reels.length === 0) {
            // CASE 3: Fresh fetch (cache expired or empty state)
            fetchReels(1, false);
        }
    }, [isActive, targetReelId, fetchReels, isCacheValid, reels.length]);

    // Fetch ads for reels feed
    useEffect(() => {
        const fetchReelAds = async () => {
            try {
                // Fetch all active ads so "all" can be displayed in reels page as requested
                const { data } = await axios.get(`${backendURL}/api/ads`);
                setReelAds(data.ads || []);
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

    // Handle openComments parameter (from notifications)
    useEffect(() => {
        const openComments = searchParams.get("openComments");
        if (openComments === "true" && targetReelId && reels.length > 0) {
            const firstReel = reels[0];
            if (firstReel?._id === targetReelId) {
                setActiveReel(firstReel);
                setShowComments(true);
            }
        }
    }, [searchParams, targetReelId, reels]);

    // ─────────────────────────────────────────────────────────────
    // UNIFIED FEED (Reels + Ads)
    // ─────────────────────────────────────────────────────────────
    const combinedFeed = React.useMemo(() => {
        const feed = [];
        let adCounter = 0;
        
        // Console logs to help you debug in the browser console (Press F12)
        console.log(`[Reels] Processing feed. Reels count: ${reels.length}, Ad count: ${reelAds.length}`);
        
        // 1. If we have a deep-linked ad, prepend it
        if (targetAd && targetReelId === `ad_${targetAd._id}`) {
             feed.push({ type: 'ad', content: targetAd, id: `ad-target-${targetAd._id}` });
        }

        reels.forEach((reel, index) => {
            feed.push({ type: 'reel', content: reel, id: reel._id });
            
            // Injection logic: Roughly every 3rd reel
            const seed = reel._id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const isAdSlot = ((index + seed) % 3 === 0) && reelAds.length > 0;
            
            if (isAdSlot) {
                const adIndex = adCounter % reelAds.length;
                const ad = reelAds[adIndex];
                
                // Skip if this ad is already the deep-linked target at the top
                if (targetAd && ad._id === targetAd._id) {
                    adCounter++;
                    return;
                }

                const adId = `ad-random-${reel._id}-${index}`;
                if (!skippedAdIndices.has(adId)) {
                    console.log(`[Reels] Injecting ad at index ${index}: ${reelAds[adIndex].title}`);
                    feed.push({ type: 'ad', content: reelAds[adIndex], id: adId });
                    adCounter++;
                }
            }
        });

        // GUARANTEED FALLBACK: If ads exist but none were injected in the first batch
        if (reels.length > 2 && reelAds.length > 0 && adCounter === 0) {
            const adId = `ad-guaranteed-0`;
            if (!skippedAdIndices.has(adId)) {
                // Insert after the second reel
                console.log(`[Reels] Performing guaranteed insertion after 2nd reel.`);
                const insertPos = 2; // Index 2 is after 2nd reel (0, 1, [AD], 2...)
                feed.splice(insertPos, 0, { type: 'ad', content: reelAds[0], id: adId });
            }
        }

        return feed;
    }, [reels, reelAds, skippedAdIndices]);

    // ─────────────────────────────────────────────────────────────
    // PER-REEL INTERSECTION OBSERVER — accurate active detection
    // ─────────────────────────────────────────────────────────────
    useReelObserver(combinedFeed.length, (index) => {
        setActiveReelIndex(index);
        savePosition(index);

        // Sync URL with the active item (Instagram-style shareability)
        const item = combinedFeed[index];
        if (item && item.id) {
            const currentUrl = new URL(window.location.href);
            const stableId = item.type === 'ad' ? `ad_${item.content._id}` : item.content._id;
            
            if (currentUrl.searchParams.get("id") !== stableId) {
                currentUrl.searchParams.set("id", stableId);
                // Use replaceState to update URL without triggering a full re-render or re-fetch
                window.history.replaceState(null, '', currentUrl.pathname + currentUrl.search);
            }
        }
    }, "feed-item");

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
    const { handleTouchStart, handleTouchEnd, PullIndicator } = usePullToRefresh(
        async () => {
            await handleRefresh();
        }, 
        containerRef
    );

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
        const reel = reels.find(r => r._id === reelId);
        setActiveReel(reel);
        setShowComments(true);
    };

    const handleCommentAdded = (newCount) => {
        setReels((prev) =>
            prev.map((r) =>
                r._id === activeReel?._id ? { ...r, commentsCount: newCount } : r
            )
        );
    };

    // ─────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────
    return (
        <div className="relative h-full w-full bg-black flex flex-col overflow-hidden">

            {/* ── HEADER ── */}
            <div className="absolute top-0 left-0 right-0 px-4 py-4 z-40 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
                <button
                    onClick={() => navigate(-1)}
                    className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white transition-colors pointer-events-auto"
                >
                    <HiOutlineChevronLeft className="text-2xl" />
                </button>

                {/* Removed redundant SuviX Reels text from page level */}
                <div />

                {/* Refresh button */}
                <button
                    onClick={handleRefresh}
                    className="w-10 h-10 flex items-center justify-center text-white/70 hover:text-white transition-colors pointer-events-auto"
                    title="Refresh reels"
                >
                    <BiRefresh className={`text-2xl ${refreshing ? "animate-spin" : ""}`} />
                </button>
            </div>

            {/* ── PULL-TO-REFRESH INDICATOR ── */}
            <PullIndicator />

            {/* ── FEED ── */}
            <motion.div
                ref={containerRef}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                animate={{ 
                    scale: showComments ? 0.95 : 1,
                    y: showComments ? -20 : 0,
                    borderRadius: showComments ? "20px" : "0px",
                }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="flex-1 overflow-y-auto snap-y snap-mandatory scrollbar-hide touch-pan-y origin-top bg-black h-full"
            >
                {/* Skeleton — shown only on first load */}
                {loading && (
                    <>
                        <ReelSkeleton />
                        <ReelSkeleton />
                    </>
                )}

                {/* Combined Feed (Reels + Ads) */}
                {!loading && combinedFeed.map((item, index) => {
                    const isLast = index === combinedFeed.length - 1;
                    
                    return (
                        <div
                            key={item.id}
                            id={`feed-item-${index}`}
                            ref={isLast ? lastReelRef : null}
                            className="w-full h-screen snap-start snap-always relative flex-shrink-0 flex items-center justify-center bg-black"
                        >
                            {item.type === 'reel' ? (
                                <ReelCard
                                    reel={item.content}
                                    isActive={isActive && index === activeReelIndex}
                                    onCommentClick={handleCommentClick}
                                    globalMuted={globalMuted}
                                    setGlobalMuted={setGlobalMuted}
                                />
                            ) : (
                                <ReelAdCard
                                    ad={item.content}
                                    isActive={isActive && index === activeReelIndex}
                                    globalMuted={globalMuted}
                                    setGlobalMuted={setGlobalMuted}
                                    onSkip={() => setSkippedAdIndices(prev => new Set([...prev, item.id]))}
                                />
                            )}
                        </div>
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
            </motion.div>

            {/* ── COMMENTS DRAWER ── */}
            <AnimatePresence>
                {showComments && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/40 z-[55]"
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
        </div>
    );
};

export default ReelsPage;
