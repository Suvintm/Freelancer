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

    const containerRef = useRef(null);
    const observerRef = useRef(null);
    const viewedReelsRef = useRef(new Set());

    // ─────────────────────────────────────────────────────────────
    // FETCH REELS
    // ─────────────────────────────────────────────────────────────
    const fetchReels = useCallback(async (pageNum = 1, loadMore = false) => {
        try {
            const excludeIdsArr = loadMore
                ? feedCache.current.map((r) => r._id)
                : (targetReelId ? [targetReelId] : []);
            
            const excludeIds = excludeIdsArr.join(",");
 
            const { data } = await axios.get(
                `${backendURL}/api/reels/feed?page=${pageNum}&limit=5&exclude=${excludeIds}`
            );
 
            let fetchedReels = data.reels;
 
            // If it's the first page and we have a target ID, fetch that specific reel first
            if (!loadMore && pageNum === 1 && targetReelId) {
                try {
                    const { data: specificReelData } = await axios.get(`${backendURL}/api/reels/${targetReelId}`);
                    if (specificReelData.reel) {
                        fetchedReels = [specificReelData.reel, ...fetchedReels];
                    }
                } catch (specificErr) {
                    console.error("[Reels] Error fetching target reel:", specificErr.message);
                }
            }
 
            if (loadMore) {
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
    }, [backendURL]);

    // ─────────────────────────────────────────────────────────────
    // ON MOUNT — restore from cache if valid, else fresh fetch
    // ─────────────────────────────────────────────────────────────
    useEffect(() => {
        if (isCacheValid() && !targetReelId) {
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
    // UNIFIED FEED (Reels + Ads)
    // ─────────────────────────────────────────────────────────────
    const combinedFeed = React.useMemo(() => {
        const feed = [];
        let adCounter = 0;
        
        reels.forEach((reel, index) => {
            feed.push({ type: 'reel', content: reel, id: reel._id });
            
            if ((index + 1) % 5 === 0 && reelAds.length > 0) {
                const adIndex = adCounter % reelAds.length;
                const adId = `ad-slot-${index}`;
                if (!skippedAdIndices.has(adId)) {
                    feed.push({ type: 'ad', content: reelAds[adIndex], id: adId });
                    adCounter++;
                }
            }
        });
        return feed;
    }, [reels, reelAds, skippedAdIndices]);

    // ─────────────────────────────────────────────────────────────
    // PER-REEL INTERSECTION OBSERVER — accurate active detection
    // ─────────────────────────────────────────────────────────────
    useReelObserver(combinedFeed.length, (index) => {
        setActiveReelIndex(index);
        savePosition(index);
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
        <div className="fixed inset-0 bg-black z-50 flex flex-col">

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
                className="flex-1 overflow-y-scroll snap-y snap-mandatory scrollbar-hide touch-pan-y origin-top bg-black"
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
                            className="w-full h-screen snap-start snap-always relative flex-shrink-0"
                        >
                            {item.type === 'reel' ? (
                                <ReelCard
                                    reel={item.content}
                                    isActive={index === activeReelIndex}
                                    onCommentClick={handleCommentClick}
                                    globalMuted={globalMuted}
                                    setGlobalMuted={setGlobalMuted}
                                />
                            ) : (
                                <ReelAdCard
                                    ad={item.content}
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
