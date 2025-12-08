import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaArrowLeft, FaSpinner } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAppContext } from "../context/AppContext";
import ReelCard from "../components/ReelCard";
import CommentSection from "../components/CommentSection";
import logo from "../assets/logo.png"; // ← make sure your logo exists

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

    // -------------------------
    // FETCH REELS (UNCHANGED)
    // -------------------------
    const fetchReels = async (pageNum = 1) => {
        try {
            const excludeIds = reels.map(r => r._id).join(",");
            const { data } = await axios.get(
                `${backendURL}/api/reels/feed?page=${pageNum}&limit=5&exclude=${excludeIds}`
            );

            if (pageNum === 1) {
                setReels(data.reels);
            } else {
                setReels(prev => [...prev, ...data.reels]);
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

    // --------------------------------------------
    // OBSERVER (UNCHANGED — only UI modified later)
    // --------------------------------------------
    const lastReelRef = useCallback(
        (node) => {
            if (loading) return;
            if (observerRef.current) observerRef.current.disconnect();

            observerRef.current = new IntersectionObserver(
                (entries) => {
                    if (entries[0].isIntersecting && hasMore) {
                        setPage(prev => prev + 1);
                        fetchReels(page + 1);
                    }
                },
                { threshold: 0.5 }
            );

            if (node) observerRef.current.observe(node);
        },
        [loading, hasMore, page]
    );

    // --------------------------------------------
    // ACTIVE REEL SCROLL DETECTION (UNCHANGED)
    // --------------------------------------------
    const handleScroll = () => {
        if (!containerRef.current) return;

        const index = Math.round(
            containerRef.current.scrollTop / containerRef.current.clientHeight
        );

        if (index !== activeReelIndex) {
            setActiveReelIndex(index);

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
        setReels(prev =>
            prev.map(r =>
                r._id === activeReelId ? { ...r, commentsCount: newCount } : r
            )
        );
    };

    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">

            {/* ------------------------- */}
            {/* HEADER BAR - Modern Glass */}
            {/* ------------------------- */}
            <div className="absolute top-0 left-0 right-0 px-4 py-4 z-40 flex items-center justify-between 
                            bg-gradient-to-b from-black/50 to-transparent ">
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 bg-white/15 backdrop-blur-xl rounded-full flex items-center justify-center
                               text-white hover:bg-white/25 transition pointer-events-auto shadow-lg"
                >
                    <FaArrowLeft className="text-lg" />
                </button>

                {/* Branding */}
                <div className="flex items-center gap-2 pointer-events-none">
                    <img src={logo} className="w-8 h-8 rounded-xl opacity-90" />
                    <span className="text-white font-semibold text-lg tracking-wide drop-shadow-lg">
                        SuviX Reels
                    </span>
                </div>

                <div className="w-10" />
            </div>

            {/* ------------------------- */}
            {/* REELS FEED VIEWPORT      */}
            {/* ------------------------- */}
            <div
                ref={containerRef}
                onScroll={handleScroll}
                className="
                    flex-1 overflow-y-scroll snap-y snap-mandatory scrollbar-hide
                    scroll-smooth will-change-transform
                    touch-pan-y
                "
                style={{
                    scrollBehavior: "smooth",
                    overscrollBehaviorY: "contain",
                }}
            >
                {reels.map((reel, index) => (
                    <div
                        key={reel._id}
                        ref={index === reels.length - 1 ? lastReelRef : null}
                        className="w-full h-screen snap-start relative"
                    >
                        {/* ======================= */}
                        {/* Reel Card (UI untouched) */}
                        {/* ======================= */}
                        <ReelCard
                            reel={reel}
                            isActive={index === activeReelIndex}
                            onCommentClick={handleCommentClick}
                        />

                        {/* ------------------------------ */}
                        {/* BRAND WATERMARK (Elegant)      */}
                        {/* ------------------------------ */}
                        <div className="absolute bottom-6 left-6 flex items-center gap-2 opacity-80 select-none">
                            <img
                                src={logo}
                                className="w-7 h-7 rounded-lg shadow-md opacity-90"
                            />
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
                        <button
                            onClick={() => navigate(-1)}
                            className="mt-4 px-6 py-2 bg-white text-black rounded-full font-semibold"
                        >
                            Go Back
                        </button>
                    </div>
                )}
            </div>

            {/* ------------------------- */}
            {/* COMMENT DRAWER – Glass    */}
            {/* ------------------------- */}
            <AnimatePresence>
                {showComments && (
                    <>
                        {/* Backdrop */}
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
