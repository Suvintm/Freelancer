import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    FaHeart,
    FaRegHeart,
    FaComment,
    FaShare,
    FaVolumeUp,
    FaVolumeMute,
    FaPlay,
    FaEye,
    FaUserPlus,
    FaCheck,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-toastify";
import logo from "../assets/logo.png";

/**
 * ReelCard — Production-grade reel card component.
 *
 * Key improvements vs original:
 *  - object-cover (fills frame like Instagram, no black bars)
 *  - Controls auto-hide after 2.5s (tap to show)
 *  - Global mute persists across all reels via props
 *  - Progress bar height 2px (thin, non-intrusive)
 *  - Watch-time tracking on scroll-away
 *  - Follow button with live state
 */
const ReelCard = ({ reel, isActive, onCommentClick, globalMuted, setGlobalMuted }) => {
    const { user, backendURL } = useAppContext();

    // ── State ──
    const [isLiked, setIsLiked] = useState(
        user ? reel.likes?.includes(user._id) : false
    );
    const [likesCount, setLikesCount] = useState(reel.likesCount || 0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [showHeartAnimation, setShowHeartAnimation] = useState(false);
    const [showControls, setShowControls] = useState(false);  // Auto-hide controls
    const [showSwipeHint, setShowSwipeHint] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);

    // ── Refs ──
    const videoRef = useRef(null);
    const scrubRef = useRef(null);
    const controlTimerRef = useRef(null);
    const progressTimerRef = useRef(null);
    const watchStartRef = useRef(null);

    // ─────────────────────────────────────────────────────────────
    // CHECK IF FOLLOWING (on mount)
    // ─────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!user || user._id === reel.editor?._id) return;

        axios
            .get(`${backendURL}/api/users/follow/status/${reel.editor?._id}`, {
                headers: { Authorization: `Bearer ${user.token}` },
            })
            .then((res) => setIsFollowing(res.data.isFollowing))
            .catch(() => {});
    }, [user, reel.editor?._id, backendURL]);

    // ─────────────────────────────────────────────────────────────
    // PLAY / PAUSE based on isActive
    // ─────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!videoRef.current || reel.mediaType !== "video") return;

        if (isActive) {
            videoRef.current.muted = globalMuted;
            videoRef.current.play().then(() => {
                setIsPlaying(true);
                watchStartRef.current = Date.now();
            }).catch(() => setIsPlaying(false));
        } else {
            // Track watch time before pausing
            sendWatchTime();
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
            setIsPlaying(false);
            setProgress(0);
        }
    }, [isActive]);

    // Sync mute changes
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.muted = globalMuted;
        }
    }, [globalMuted]);

    // ─────────────────────────────────────────────────────────────
    // PROGRESS TRACKER
    // ─────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!isActive) return;

        progressTimerRef.current = setInterval(() => {
            if (videoRef.current?.duration) {
                setProgress(
                    (videoRef.current.currentTime / videoRef.current.duration) * 100
                );
            }
        }, 100);

        return () => clearInterval(progressTimerRef.current);
    }, [isActive]);

    // ─────────────────────────────────────────────────────────────
    // SWIPE HINT — once per session
    // ─────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!isActive) return;
        const shown = sessionStorage.getItem("swipeHintShown");
        if (!shown) {
            setShowSwipeHint(true);
            sessionStorage.setItem("swipeHintShown", "true");
            setTimeout(() => setShowSwipeHint(false), 2000);
        }
    }, [isActive]);

    // ─────────────────────────────────────────────────────────────
    // TRACK WATCH TIME
    // ─────────────────────────────────────────────────────────────
    const sendWatchTime = useCallback(() => {
        if (!watchStartRef.current || !user) return;
        const elapsed = Math.round((Date.now() - watchStartRef.current) / 1000);
        if (elapsed < 1) return;

        const pct = videoRef.current?.duration
            ? Math.round((videoRef.current.currentTime / videoRef.current.duration) * 100)
            : 0;

        axios
            .post(
                `${backendURL}/api/reels/${reel._id}/watch-time`,
                { seconds: elapsed, watchPercent: pct },
                { headers: { Authorization: `Bearer ${user.token}` } }
            )
            .catch(() => {});

        watchStartRef.current = null;
    }, [user, reel._id, backendURL]);

    // Send watch time when component unmounts
    useEffect(() => () => sendWatchTime(), [sendWatchTime]);

    // ─────────────────────────────────────────────────────────────
    // CONTROLS AUTO-HIDE
    // ─────────────────────────────────────────────────────────────
    const showControlsTemporarily = () => {
        setShowControls(true);
        clearTimeout(controlTimerRef.current);
        controlTimerRef.current = setTimeout(() => setShowControls(false), 2500);
    };

    // ─────────────────────────────────────────────────────────────
    // TAP to play/pause + show controls
    // ─────────────────────────────────────────────────────────────
    const handleVideoTap = () => {
        if (!videoRef.current) return;
        if (isPlaying) {
            videoRef.current.pause();
        } else {
            videoRef.current.play();
        }
        setIsPlaying(!isPlaying);
        showControlsTemporarily();
    };

    // ─────────────────────────────────────────────────────────────
    // LIKE
    // ─────────────────────────────────────────────────────────────
    const handleLike = async () => {
        if (!user) return toast.error("Please login to like");
        const newIsLiked = !isLiked;
        setIsLiked(newIsLiked);
        setLikesCount((prev) => (newIsLiked ? prev + 1 : prev - 1));
        if (newIsLiked) triggerHeartAnimation();

        try {
            await axios.post(
                `${backendURL}/api/reels/${reel._id}/like`,
                {},
                { headers: { Authorization: `Bearer ${user.token}` } }
            );
        } catch {
            setIsLiked(!newIsLiked);
            setLikesCount((prev) => (!newIsLiked ? prev + 1 : prev - 1));
        }
    };

    const triggerHeartAnimation = () => {
        setShowHeartAnimation(true);
        setTimeout(() => setShowHeartAnimation(false), 900);
    };

    // ─────────────────────────────────────────────────────────────
    // DOUBLE TAP → Like
    // ─────────────────────────────────────────────────────────────
    const lastTapRef = useRef(0);
    const handleTap = (e) => {
        const now = Date.now();
        if (now - lastTapRef.current < 300) {
            // Double-tap
            e.stopPropagation();
            if (!isLiked) handleLike();
            else triggerHeartAnimation();
        } else {
            handleVideoTap();
        }
        lastTapRef.current = now;
    };

    // ─────────────────────────────────────────────────────────────
    // SCRUB (only when controls visible)
    // ─────────────────────────────────────────────────────────────
    const handleScrub = (e) => {
        if (!videoRef.current || !scrubRef.current) return;
        const rect = scrubRef.current.getBoundingClientRect();
        const percent = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
        videoRef.current.currentTime = percent * videoRef.current.duration;
        setProgress(percent * 100);
    };

    // ─────────────────────────────────────────────────────────────
    // FOLLOW / UNFOLLOW
    // ─────────────────────────────────────────────────────────────
    const handleFollow = async (e) => {
        e.preventDefault();
        if (!user) return toast.error("Please login to follow");
        if (followLoading) return;

        setFollowLoading(true);
        const newFollowing = !isFollowing;
        setIsFollowing(newFollowing);

        try {
            await axios.post(
                `${backendURL}/api/users/follow/${reel.editor?._id}`,
                {},
                { headers: { Authorization: `Bearer ${user.token}` } }
            );
        } catch {
            setIsFollowing(!newFollowing);
            toast.error("Failed to update follow status");
        } finally {
            setFollowLoading(false);
        }
    };

    // ─────────────────────────────────────────────────────────────
    // SHARE
    // ─────────────────────────────────────────────────────────────
    const handleShare = () => {
        const url = `${window.location.origin}/reels?id=${reel._id}`;
        if (navigator.share) {
            navigator.share({ title: reel.title, url });
        } else if (navigator.clipboard) {
            navigator.clipboard.writeText(url);
            toast.success("Link copied!");
        }
    };

    // ─────────────────────────────────────────────────────────────
    // Don't render card if no reel data
    // ─────────────────────────────────────────────────────────────
    if (!reel) return null;

    const isOwnReel = user?._id === reel.editor?._id;

    // ─────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────
    return (
        <div className="w-full h-full flex items-center justify-center bg-black relative">

            {/* ── DESKTOP: 9:16 centered container ── */}
            <div
                className="
                    relative aspect-[9/16] w-full h-full
                    md:max-w-[min(420px,85vw)] md:h-auto
                    bg-black rounded-none md:rounded-2xl
                    md:shadow-[0_0_60px_rgba(0,0,0,0.8)]
                    overflow-hidden
                "
            >
                {/* ── MEDIA ── */}
                <div
                    className="absolute inset-0 cursor-pointer select-none"
                    onClick={handleTap}
                >
                    {/* VIDEO */}
                    {reel.mediaType === "video" && (
                        <video
                            ref={videoRef}
                            src={reel.mediaUrl}
                            className="w-full h-full object-cover bg-black"
                            loop
                            playsInline
                            muted={globalMuted}
                            preload="metadata"
                        />
                    )}

                    {/* IMAGE */}
                    {reel.mediaType === "image" && (
                        <img
                            src={reel.mediaUrl}
                            alt={reel.title}
                            className="w-full h-full object-cover bg-black"
                        />
                    )}

                    {/* Paused indicator */}
                    <AnimatePresence>
                        {!isPlaying && isActive && reel.mediaType === "video" && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.7 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.7 }}
                                transition={{ duration: 0.2 }}
                                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                            >
                                <div className="w-20 h-20 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center">
                                    <FaPlay className="text-white text-3xl ml-1" />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Heart double-tap animation */}
                    <AnimatePresence>
                        {showHeartAnimation && (
                            <motion.div
                                initial={{ scale: 0.4, opacity: 0 }}
                                animate={{ scale: 1.3, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                transition={{ duration: 0.45 }}
                                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                            >
                                <FaHeart className="text-white text-7xl drop-shadow-2xl" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* ── GRADIENTS ── */}
                <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
                <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

                {/* ── RIGHT ACTION BAR ── */}
                <div className="absolute z-10 right-3 bottom-28 flex flex-col items-center gap-5">

                    {/* Profile pic + follow button */}
                    <div className="relative">
                        <Link to={`/public-profile/${reel.editor?._id}`}>
                            <div className="w-11 h-11 rounded-full border-2 border-white overflow-hidden shadow-lg">
                                <img
                                    src={reel.editor?.profilePicture}
                                    alt={reel.editor?.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </Link>
                        {/* Follow pill */}
                        {!isOwnReel && (
                            <button
                                onClick={handleFollow}
                                className={`
                                    absolute -bottom-2 left-1/2 -translate-x-1/2
                                    w-5 h-5 rounded-full flex items-center justify-center
                                    text-white text-[9px] shadow-md transition-colors duration-300
                                    ${isFollowing ? "bg-green-500" : "bg-red-500"}
                                `}
                            >
                                {isFollowing ? <FaCheck /> : <FaUserPlus />}
                            </button>
                        )}
                    </div>

                    {/* Like */}
                    <motion.button
                        whileTap={{ scale: 0.82 }}
                        onClick={handleLike}
                        className="flex flex-col items-center text-white"
                    >
                        <div className="w-11 h-11 bg-white/15 backdrop-blur-md rounded-full flex items-center justify-center">
                            {isLiked ? (
                                <FaHeart className="text-red-500 text-xl" />
                            ) : (
                                <FaRegHeart className="text-white text-xl" />
                            )}
                        </div>
                        <span className="text-xs mt-1 font-medium">{likesCount}</span>
                    </motion.button>

                    {/* Comment */}
                    <motion.button
                        whileTap={{ scale: 0.82 }}
                        onClick={() => onCommentClick(reel._id)}
                        className="flex flex-col items-center text-white"
                    >
                        <div className="w-11 h-11 bg-white/15 backdrop-blur-md rounded-full flex items-center justify-center">
                            <FaComment className="text-white text-[17px]" />
                        </div>
                        <span className="text-xs mt-1 font-medium">{reel.commentsCount || 0}</span>
                    </motion.button>

                    {/* View count */}
                    <div className="flex flex-col items-center text-white">
                        <div className="w-11 h-11 bg-white/15 backdrop-blur-md rounded-full flex items-center justify-center">
                            <FaEye className="text-white text-[17px]" />
                        </div>
                        <span className="text-xs mt-1 font-medium">{reel.viewsCount || 0}</span>
                    </div>

                    {/* Share */}
                    <motion.button
                        whileTap={{ scale: 0.85 }}
                        onClick={handleShare}
                        className="w-11 h-11 bg-white/15 backdrop-blur-md rounded-full flex items-center justify-center"
                    >
                        <FaShare className="text-white text-[17px]" />
                    </motion.button>

                    {/* Mute — global, persists across reels */}
                    {reel.mediaType === "video" && (
                        <motion.button
                            whileTap={{ scale: 0.85 }}
                            onClick={() => setGlobalMuted((m) => !m)}
                            className="w-11 h-11 bg-white/15 backdrop-blur-md rounded-full flex items-center justify-center"
                        >
                            {globalMuted ? (
                                <FaVolumeMute className="text-white text-[17px]" />
                            ) : (
                                <FaVolumeUp className="text-white text-[17px]" />
                            )}
                        </motion.button>
                    )}
                </div>

                {/* ── BOTTOM INFO ── */}
                <div className="absolute bottom-10 left-4 right-16 z-10 text-white">
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className="font-bold text-[15px] leading-tight">
                            {reel.editor?.name}
                        </span>
                        <span className="px-2 py-0.5 bg-white/20 text-[9px] rounded border border-white/30 tracking-wide">
                            EDITOR
                        </span>
                    </div>
                    <p className="text-[13px] font-semibold leading-snug">
                        {reel.title}
                    </p>
                    {reel.description && (
                        <p className="text-[12px] text-white/75 mt-0.5 line-clamp-2 leading-snug">
                            {reel.description}
                        </p>
                    )}
                </div>

                {/* ── WATERMARK ── */}
                <div className="absolute bottom-3 right-3 flex items-center gap-1 opacity-80 pointer-events-none z-10">
                    <img src={logo} className="w-5 h-5 rounded-md" alt="SuviX" />
                    <span className="text-white font-bold text-[10px] tracking-widest">
                        SuviX
                    </span>
                </div>

                {/* ── PROGRESS BAR — thin, always visible ── */}
                {reel.mediaType === "video" && (
                    <div
                        ref={scrubRef}
                        onClick={handleScrub}
                        className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/20 cursor-pointer z-20"
                    >
                        <motion.div
                            style={{ width: `${progress}%` }}
                            className="h-full bg-white rounded-r-full transition-none"
                        />
                    </div>
                )}

                {/* ── SWIPE HINT ── */}
                <AnimatePresence>
                    {showSwipeHint && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ duration: 0.3 }}
                            className="absolute bottom-20 left-4 z-20 pointer-events-none"
                        >
                            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
                                <span className="text-white text-xs font-semibold">
                                    Swipe up for next
                                </span>
                                <svg className="h-3 w-3 text-white rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ReelCard;
