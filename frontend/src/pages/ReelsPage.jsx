import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FixedSizeList as List } from "react-window";
import { HiOutlineChevronLeft } from "react-icons/hi2";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { useAppContext } from "../context/AppContext";
import { useReelsContext } from "../context/ReelsContext";
import ReelCard from "../components/ReelCard";
import ReelSkeleton from "../components/ReelSkeleton";
import ReelAdCard from "../components/ReelAdCard";
import ReelCommentsDrawer from "../components/ReelCommentsDrawer";
import usePullToRefresh from "../hooks/usePullToRefresh.jsx";
import analyticsService from "../services/AnalyticsService";

const ReelRow = React.memo(({ 
    index, 
    style, 
    data: { 
        combinedFeed, 
        activeReelIndex, 
        isActive, 
        showComments, 
        preloadDepth, 
        isScrollingFast,
        globalMuted,
        setGlobalMuted,
        handleCommentClick,
        handleLikeUpdate,
        handleFollowUpdate,
        setSkippedAdIndices
    } 
}) => {
    const item = combinedFeed[index];
    if (!item) return null;
    
    const distance = Math.abs(index - activeReelIndex);
    const isReelActive = isActive && index === activeReelIndex && !showComments;
    const isBurstPreloading = !isScrollingFast && distance === 1;

    return (
        <div style={{ ...style, willChange: 'transform' }} className="snap-start snap-always w-full h-full bg-black">
            {item.type === 'reel' ? (
                <ReelCard
                    reel={item.content}
                    isActive={isReelActive}
                    isNearActive={distance <= preloadDepth}
                    isPreloading={isBurstPreloading}
                    onCommentClick={handleCommentClick}
                    onLikeUpdate={handleLikeUpdate}
                    onFollowUpdate={handleFollowUpdate}
                    globalMuted={globalMuted}
                    setGlobalMuted={setGlobalMuted}
                />
            ) : (
                <ReelAdCard
                    ad={item.content}
                    isActive={isReelActive}
                    isNearActive={distance <= preloadDepth}
                    isPreloading={isBurstPreloading}
                    globalMuted={globalMuted}
                    setGlobalMuted={setGlobalMuted}
                    onSkip={() => setSkippedAdIndices(prev => new Set([...prev, item.id]))}
                />
            )}
        </div>
    );
});

const ReelsPage = ({ isActive = true }) => {
    const { backendURL } = useAppContext();
    const {
        feedCache,
        activeIndexCache,
        pageCache,
        isCacheValid,
        updateCache,
        appendToCache,
        updateReelInCache,
        invalidateCache,
        savePosition,
        prePopulateCache,
        findReelById,
        globalMuted,
        setGlobalMuted,
        preloadDepth, 
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
    const [windowHeight, setWindowHeight] = useState(window.innerHeight);
    const [sessionSeed, setSessionSeed] = useState(() => Math.random().toString(36).substring(7));
    
    // — PRO-LEVEL: Performance Telemetry —
    const lastScrollOffsetRef = useRef(0);
    const lastScrollTimeRef = useRef(Date.now());
    const [isScrollingFast, setIsScrollingFast] = useState(false);
    const scrollStopTimerRef = useRef(null);

    const listRef = useRef(null);
    const viewedReelsRef = useRef(new Set());

    useEffect(() => {
        const handleResize = () => setWindowHeight(window.innerHeight);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const fetchReels = useCallback(async (pageNum = 1, isLoadMore = false) => {
        if (!navigator.onLine) {
            setLoading(false);
            setLoadingMore(false);
            setRefreshing(false);
            if (feedCache.current.length > 0 && reels.length === 0) {
                setReels(feedCache.current);
            }
            return;
        }

        try {
            if (!isLoadMore && pageNum === 1 && reels.length === 0) setLoading(true);
            
            const excludeIdsArr = isLoadMore
                ? feedCache.current.map((r) => r?._id).filter(Boolean)
                : (targetReelId ? [targetReelId] : []);
            const excludeIds = excludeIdsArr.join(",");

            const { data } = await axios.get(`${backendURL}/api/reels/feed`, {
                params: {
                    page: pageNum,
                    limit: 10,
                    exclude: excludeIds,
                    sessionSeed: sessionSeed
                }
            });

            // Parallel loading for specific reel or ad if deep linked
            let specificRes = null;
            let adRes = null;
            if (!isLoadMore && pageNum === 1 && targetReelId) {
                if (targetReelId.startsWith("ad_")) {
                    adRes = await axios.get(`${backendURL}/api/ads/${targetReelId.replace("ad_", "")}`).catch(() => null);
                } else {
                    specificRes = await axios.get(`${backendURL}/api/reels/${targetReelId}`).catch(() => null);
                }
            }

            let fetchedReels = data.reels || [];
            
            // — PRO-LEVEL: Target Preservation Logic —
            // We must ensure the Target (either from network or pre-existing cache) is at Index 0.
            const targetInCache = findReelById(targetReelId);
            const targetObj = specificRes?.data?.reel || targetInCache;

            if (targetObj) {
                fetchedReels = [targetObj, ...fetchedReels.filter(r => r?._id !== targetReelId)];
            } else if (adRes?.data?.ad) {
                setTargetAd(adRes.data.ad);
            }

            if (isLoadMore) {
                const combined = [...feedCache.current, ...fetchedReels];
                const uniqueReels = Array.from(new Map(combined.map(r => [r._id, r])).values());
                setReels(uniqueReels);
                appendToCache(fetchedReels, pageNum);
            } else {
                const uniqueInitial = Array.from(new Map(fetchedReels.map(r => [r?._id, r])).values()).filter(r => r?._id);
                setReels(uniqueInitial);
                updateCache(uniqueInitial, pageNum);
            }

            setHasMore(data.pagination.hasMore);
        } catch (err) {
            console.error("[Reels] Fetch error:", err.message);
            if (reels.length === 0 && feedCache.current.length > 0) {
                setReels(feedCache.current);
            }
        } finally {
            setLoading(false);
            setLoadingMore(false);
            setRefreshing(false);
        }
    }, [backendURL, updateCache, appendToCache, targetReelId, feedCache, reels.length, sessionSeed]);

    useEffect(() => {
        if (!isActive) return;
        
        // — PRO-LEVEL: Instant Deep-Link Handoff —
        if (targetReelId && reels.length === 0) {
            const cachedReel = findReelById(targetReelId);
            if (cachedReel) {
                console.info("[Reels] Found Target Reel in cache. Instant Mount.");
                setReels([cachedReel]);
                setLoading(false);
                // fetchReels(1, false) will still run but won't show a skeleton
            }
        }

        if (reels.length > 0) setLoading(false);

        if (targetReelId) {
            const currentFirstId = (reels.length > 0) ? (reels[0].type === 'ad' ? `ad_${reels[0].content?._id}` : reels[0]._id) : null;
            
            // — PRO-LEVEL: Root-Positioning Logic —
            // If we have a target ID, it MUST be at index 0 to prevent "Scroll Up" leaks.
            if (targetReelId !== currentFirstId) {
                // Not the root! Reset and move to root.
                const cachedReel = findReelById(targetReelId);
                if (cachedReel) {
                    setReels([cachedReel]);
                    setLoading(false);
                    setActiveReelIndex(0);
                    listRef.current?.scrollTo(0);
                    // — PRO-LEVEL: Background Fill —
                    // We have the "Hero" reel, now fill the rest of the feed silently.
                    fetchReels(1, false);
                } else if (reels.length === 0) {
                    setLoading(true);
                    fetchReels(1, false);
                } else {
                    // It's in the list but not first. Force reset to make it first.
                    setReels([]);
                    setLoading(true);
                    fetchReels(1, false);
                }
            }
        } else if (isCacheValid() && reels.length === 0) {
            setReels(feedCache.current);
            setPage(pageCache.current);
            setLoading(false);
            const savedIndex = activeIndexCache.current;
            setTimeout(() => {
                listRef.current?.scrollToItem(savedIndex, "start");
                setActiveReelIndex(savedIndex);
            }, 100);
        } else if (reels.length === 0) {
            fetchReels(1, false);
        }
    }, [isActive, targetReelId, fetchReels, findReelById, isCacheValid, reels.length, feedCache, pageCache, activeIndexCache, savePosition]);

    useEffect(() => {
        const fetchReelAds = async () => {
            try {
                const { data } = await axios.get(`${backendURL}/api/ads`);
                setReelAds(data.ads || []);
            } catch (err) {
                console.error("Ad fetch error:", err);
            }
        };
        fetchReelAds();
    }, [backendURL]);

    useEffect(() => {
        const reel = reels[activeReelIndex];
        if (!reel || viewedReelsRef.current.has(reel._id)) return;
        viewedReelsRef.current.add(reel._id);
        
        if (reel.type === 'ad') {
            axios.post(`${backendURL}/api/ads/${reel._id}/view`).catch(() => {});
        } else {
            analyticsService.pushEvent({ reelId: reel._id, type: 'view' });
        }
    }, [activeReelIndex, reels, backendURL]);

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

    const combinedFeed = useMemo(() => {
        const feed = [];
        let adCounter = 0;
        
        if (targetAd && targetReelId === `ad_${targetAd._id}`) {
             feed.push({ type: 'ad', content: targetAd, id: `ad-target-${targetAd._id}` });
        }

        reels.forEach((reel, index) => {
            if (!reel) return;
            feed.push({ type: 'reel', content: reel, id: reel._id });
            const isTargetAdVisible = targetAd && targetReelId === `ad_${targetAd._id}`;
            const skipRandomInjection = isTargetAdVisible && index < 2;
            const isAdSlot = ((index + 1) % 3 === 0) && reelAds.length > 0 && !skipRandomInjection;
            
            if (isAdSlot) {
                const adIndex = adCounter % reelAds.length;
                const ad = reelAds[adIndex];
                if (targetAd && ad._id === targetAd._id) {
                    adCounter++;
                    return;
                }
                const adId = `ad-random-${reel._id}-${index}`;
                if (!skippedAdIndices.has(adId)) {
                    feed.push({ type: 'ad', content: ad, id: adId });
                    adCounter++;
                }
            }
        });

        return feed;
    }, [reels, reelAds, skippedAdIndices, targetAd, targetReelId]);

    const urlUpdateTimerRef = useRef(null);

    const handleScroll = useCallback(({ scrollOffset }) => {
        if (loading) return;

        const now = Date.now();
        const deltaTime = now - lastScrollTimeRef.current;
        const deltaOffset = Math.abs(scrollOffset - lastScrollOffsetRef.current);
        const velocity = deltaOffset / (deltaTime || 1);
        
        lastScrollOffsetRef.current = scrollOffset;
        lastScrollTimeRef.current = now;

        if (velocity > 5) {
            if (!isScrollingFast) setIsScrollingFast(true);
            if (scrollStopTimerRef.current) clearTimeout(scrollStopTimerRef.current);
            scrollStopTimerRef.current = setTimeout(() => setIsScrollingFast(false), 200);
        }
        
        const index = Math.round(scrollOffset / windowHeight);
        
        if (index !== activeReelIndex && index >= 0 && index < combinedFeed.length) {
            setActiveReelIndex(index);
            savePosition(index);
            
            if (urlUpdateTimerRef.current) clearTimeout(urlUpdateTimerRef.current);
            urlUpdateTimerRef.current = setTimeout(() => {
                const item = combinedFeed[index];
                if (item && item.id) {
                    const currentUrl = new URL(window.location.href);
                    const stableId = item.type === 'ad' ? `ad_${item.content._id}` : item.content._id;
                    if (currentUrl.searchParams.get("id") !== stableId) {
                        currentUrl.searchParams.set("id", stableId);
                        window.history.replaceState(null, '', currentUrl.pathname + currentUrl.search);
                    }
                }
            }, 100);

            if (index >= combinedFeed.length - 2 && hasMore && !loadingMore) loadMore();
        }
    }, [windowHeight, activeReelIndex, combinedFeed, loading, hasMore, loadingMore, savePosition, isScrollingFast]);

    const loadMore = async () => {
        if (loadingMore) return;
        setLoadingMore(true);
        if (!hasMore) {
            viewedReelsRef.current.clear();
            await fetchReels(1, true);
            return;
        }
        const nextPage = page + 1;
        setPage(nextPage);
        await fetchReels(nextPage, true);
    };

    const outerRef = useRef(null);
    const { handleTouchStart, handleTouchEnd, PullIndicator } = usePullToRefresh(
        async () => {
            setRefreshing(true);
            invalidateCache();
            viewedReelsRef.current.clear();
            const newSeed = Math.random().toString(36).substring(7);
            setSessionSeed(newSeed);
            setPage(1);
            setActiveReelIndex(0);
            await fetchReels(1, false);
            listRef.current?.scrollToItem(0, "start");
            setRefreshing(false);
        }, 
        outerRef
    );

    const handleCommentClick = (reelId) => {
        const reel = reels.find(r => r._id === reelId);
        setActiveReel(reel);
        setShowComments(true);
    };

    const handleCommentAdded = (newCount) => {
        if (!activeReel?._id) return;
        setReels(prev => prev.map(r => r._id === activeReel?._id ? { ...r, commentsCount: newCount } : r));
        updateReelInCache(activeReel._id, { commentsCount: newCount });
    };

    const handleLikeUpdate = useCallback((reelId, isLiked, likesCount, latestLikers) => {
        setReels(prev => prev.map(r => r._id === reelId ? { 
            ...r, 
            isLiked, 
            likesCount,
            latestLikers
        } : r));
        updateReelInCache(reelId, { isLiked, likesCount, latestLikers });
    }, [updateReelInCache]);

    const handleFollowUpdate = useCallback((editorId, isFollowing) => {
        setReels(prev => prev.map(r => r.editor?._id === editorId ? {
            ...r,
            isFollowing
        } : r));
        
        reels.forEach(r => {
            if (r.editor?._id === editorId) {
                updateReelInCache(r._id, { isFollowing });
            }
        });
    }, [reels, updateReelInCache]);

    return (
        <div className="relative h-full w-full bg-black flex flex-col overflow-hidden">
            <div className="absolute top-0 left-0 right-0 px-4 py-4 z-40 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
                <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white transition-colors pointer-events-auto">
                    <HiOutlineChevronLeft className="text-2xl" />
                </button>
                <div />
                <div className="w-10 h-10" />
            </div>

            <PullIndicator />

            <div
                className={`flex-1 overflow-hidden origin-top bg-black h-full relative transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${showComments ? "scale-[0.95] translate-y-[-20px] rounded-[20px]" : "scale-100 translate-y-0 rounded-none"}`}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                {loading && <div className="absolute inset-0 z-50"><ReelSkeleton /></div>}

                {!loading && combinedFeed.length > 0 && (
                    <List
                        ref={listRef}
                        outerRef={outerRef}
                        className="scrollbar-hide snap-y snap-mandatory touch-pan-y"
                        height={windowHeight}
                        itemCount={combinedFeed.length}
                        itemSize={windowHeight}
                        width="100%"
                        onScroll={handleScroll}
                        itemKey={(index) => combinedFeed[index]?.id || `reel-fallback-${index}`}
                        overscanCount={preloadDepth} 
                        style={{ overflowX: 'hidden' }}
                        itemData={{
                            combinedFeed,
                            activeReelIndex,
                            isActive,
                            showComments,
                            preloadDepth,
                            isScrollingFast,
                            globalMuted,
                            setGlobalMuted,
                            handleCommentClick,
                            handleLikeUpdate,
                            handleFollowUpdate,
                            setSkippedAdIndices
                        }}
                    >
                        {ReelRow}
                    </List>
                )}

                {!loading && (reels.length === 0 || !combinedFeed.length) && (
                    <div className="w-full h-screen flex flex-col items-center justify-center text-white gap-4">
                        <span className="text-5xl">🎬</span>
                        <p className="text-lg font-semibold">No reels yet</p>
                    </div>
                )}
            </div>

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
