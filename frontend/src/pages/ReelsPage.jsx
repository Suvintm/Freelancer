import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaArrowLeft, FaSpinner } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAppContext } from "../context/AppContext";
import ReelCard from "../components/ReelCard";
import CommentSection from "../components/CommentSection";
import logo from "../assets/logo.png";

const ReelsPage = () => {
    const { backendURL } = useAppContext();
    const navigate = useNavigate();

    const [reels, setReels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [activeReelIndex, setActiveReelIndex] = useState(0);
    const [showComments, setShowComments] = useState(false);
    const [activeReelId, setActiveReelId] = useState(null);

    const containerRef = useRef(null);
    const observerRef = useRef(null);

    // ----------------------------
    // FETCH REELS
    // ----------------------------
    const fetchReels = async (pageNum = 1, loadMore = false) => {
        try {
            const excludeIds = loadMore ? reels.map(r => r._id).join(",") : "";

            const { data } = await axios.get(
                `${backendURL}/api/reels/feed?page=${pageNum}&limit=5&exclude=${excludeIds}`
            );

            if (loadMore) {
                // APPEND new random reels below (infinite scroll)
                setReels(prev => [...prev, ...data.reels]);
            } else {
                setReels(data.reels);
            }

            setHasMore(data.pagination.hasMore);
            setLoading(false);

        } catch (err) {
            console.error("Error fetching reels:", err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReels(1, false);
    }, []);

    // ----------------------------
    // INFINITE LOOP — NO SCROLL RESET
    // ----------------------------
    const loadMoreReels = async () => {
        if (!hasMore) {
            // No more reels → fetch random again
            await fetchReels(1, true);
            return;
        }

        setPage(prev => prev + 1);
        await fetchReels(page + 1, true);
    };

    // ----------------------------
    // OBSERVER FOR LAST REEL
    // ----------------------------
    const lastReelRef = useCallback(
        (node) => {
            if (loading) return;

            if (observerRef.current) observerRef.current.disconnect();

            observerRef.current = new IntersectionObserver(
                (entries) => {
                    if (entries[0].isIntersecting) {
                        loadMoreReels();
                    }
                },
                { threshold: 0.5 }
            );

            if (node) observerRef.current.observe(node);
        },
        [loading, hasMore, page, reels]
    );

    // ----------------------------
    // ACTIVE REEL DETECTOR
    // ----------------------------
    const handleScroll = () => {
        if (!containerRef.current) return;

        const index = Math.round(
            containerRef.current.scrollTop / containerRef.current.clientHeight
        );

        if (index !== activeReelIndex) {
            setActiveReelIndex(index);

            if (reels[index]) {
                axios.post(`${backendURL}/api/reels/${reels[index]._id}/view`).catch(() => {});
            }
        }
    };

    const handleCommentClick = (reelId) => {
        setActiveReelId(reelId);
        setShowComments(true);
    };

    const handleCommentAdded = (newCount) => {
        setReels(prev =>
            prev.map(r =>
                r._id === activeReelId ? { ...r, commentsCount: newCount } : r
            )
        );
    };

    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">

            {/* HEADER */}
            <div className="absolute top-0 left-0 right-0 px-4 py-4 z-40 flex items-center justify-between bg-gradient-to-b from-black/50 to-transparent">
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 bg-white/15 backdrop-blur-xl rounded-full flex items-center justify-center text-white hover:bg-white/25 transition shadow-lg"
                >
                    <FaArrowLeft className="text-lg" />
                </button>

                <div className="flex items-center gap-2 pointer-events-none">
                    <img src={logo} className="w-8 h-8 rounded-xl opacity-90" />
                    <span className="text-white font-semibold text-lg tracking-wide drop-shadow-lg">
                        SuviX Reels
                    </span>
                </div>

                <div className="w-10" />
            </div>

            {/* REELS FEED */}
            <div
                ref={containerRef}
                onScroll={handleScroll}
                className="
                    flex-1 overflow-y-scroll snap-y snap-mandatory scrollbar-hide
                    scroll-smooth touch-pan-y
                "
            >
                {reels.map((reel, index) => (
                    <div
                        key={reel._id + index}
                        ref={index === reels.length - 1 ? lastReelRef : null}
                        className="w-full h-screen snap-start relative"
                    >
                        <ReelCard
                            reel={reel}
                            isActive={index === activeReelIndex}
                            onCommentClick={handleCommentClick}
                        />

                        <div className="absolute bottom-6 left-6 flex items-center gap-2 opacity-80 select-none">
                            <img src={logo} className="w-7 h-7 rounded-lg shadow-md opacity-90" />
                            <span className="text-white/90 font-semibold tracking-wide text-sm">
                                SuviX
                            </span>
                        </div>
                    </div>
                ))}

                {/* LOADER */}
                {loading && (
                    <div className="w-full h-screen flex items-center justify-center bg-black">
                        <FaSpinner className="text-white text-4xl animate-spin" />
                    </div>
                )}

                {/* EMPTY */}
                {!loading && reels.length === 0 && (
                    <div className="w-full h-screen flex flex-col items-center justify-center text-white">
                        <p className="text-lg font-medium">No reels found</p>
                    </div>
                )}
            </div>

            {/* COMMENTS DRAWER */}
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
