import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaArrowLeft, FaSpinner } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAppContext } from "../context/AppContext";
import ReelCard from "../components/ReelCard";
import CommentSection from "../components/CommentSection";

const ReelsPage = () => {
    const { user, backendURL } = useAppContext();
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

    // Fetch Reels
    const fetchReels = async (pageNum = 1) => {
        try {
            // Exclude current IDs to avoid duplicates in random feed
            const excludeIds = reels.map(r => r._id).join(",");
            const { data } = await axios.get(
                `${backendURL}/api/reels/feed?page=${pageNum}&limit=5&exclude=${excludeIds}`
            );

            if (pageNum === 1) {
                setReels(data.reels);
            } else {
                setReels((prev) => [...prev, ...data.reels]);
            }

            setHasMore(data.pagination.hasMore);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching reels:", err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReels();
    }, []);

    // Intersection Observer for Infinite Scroll & Active Reel
    const lastReelRef = useCallback(
        (node) => {
            if (loading) return;
            if (observerRef.current) observerRef.current.disconnect();

            observerRef.current = new IntersectionObserver(
                (entries) => {
                    if (entries[0].isIntersecting && hasMore) {
                        setPage((prev) => prev + 1);
                        fetchReels(page + 1);
                    }
                },
                { threshold: 0.5 }
            );

            if (node) observerRef.current.observe(node);
        },
        [loading, hasMore, page]
    );

    // Handle Scroll to update active index
    const handleScroll = () => {
        if (!containerRef.current) return;
        const index = Math.round(
            containerRef.current.scrollTop / containerRef.current.clientHeight
        );
        if (index !== activeReelIndex) {
            setActiveReelIndex(index);
            // Increment view count for new active reel
            if (reels[index]) {
                axios.post(`${backendURL}/api/reels/${reels[index]._id}/view`).catch(() => { });
            }
        }
    };

    const handleCommentClick = (reelId) => {
        setActiveReelId(reelId);
        setShowComments(true);
    };

    const handleCommentAdded = (newCount) => {
        // Update local state to reflect new comment count
        setReels((prev) =>
            prev.map((r) =>
                r._id === activeReelId ? { ...r, commentsCount: newCount } : r
            )
        );
    };

    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 p-4 z-40 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
                <button
                    onClick={() => navigate(-1)}
                    className="pointer-events-auto w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                >
                    <FaArrowLeft />
                </button>
                <h1 className="text-white font-bold text-lg drop-shadow-md">Reels</h1>
                <div className="w-10" /> {/* Spacer */}
            </div>

            {/* Reels Container */}
            <div
                ref={containerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
                style={{ scrollBehavior: "smooth" }}
            >
                {reels.map((reel, index) => (
                    <div
                        key={reel._id}
                        ref={index === reels.length - 1 ? lastReelRef : null}
                        className="w-full h-full snap-start relative"
                    >
                        <ReelCard
                            reel={reel}
                            isActive={index === activeReelIndex}
                            onCommentClick={handleCommentClick}
                        />
                    </div>
                ))}

                {loading && (
                    <div className="w-full h-full flex items-center justify-center bg-black">
                        <FaSpinner className="text-white text-4xl animate-spin" />
                    </div>
                )}

                {!loading && reels.length === 0 && (
                    <div className="w-full h-full flex flex-col items-center justify-center text-white">
                        <p className="text-lg font-medium">No reels found</p>
                        <button
                            onClick={() => navigate(-1)}
                            className="mt-4 px-6 py-2 bg-white text-black rounded-full font-semibold"
                        >
                            Go Back
                        </button>
                    </div>
                )}
            </div>

            {/* Comment Drawer */}
            <AnimatePresence>
                {showComments && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-[55]"
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
