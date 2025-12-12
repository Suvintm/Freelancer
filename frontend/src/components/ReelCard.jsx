import React, { useState, useRef, useEffect } from "react";
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
    FaUserPlus
} from "react-icons/fa";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-toastify";
import logo from "../assets/logo.png";

const ReelCard = ({ reel, isActive, onCommentClick }) => {
    const { user, backendURL } = useAppContext();
    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(reel.likesCount);
    const [isPlaying, setIsPlaying] = useState(isActive);
    const [isMuted, setIsMuted] = useState(false);
    const [showHeartAnimation, setShowHeartAnimation] = useState(false);
    const [progress, setProgress] = useState(0);
    const [showSwipeHint, setShowSwipeHint] = useState(false);

    const videoRef = useRef(null);
    const scrubRef = useRef(null);

    // INIT LIKE
    useEffect(() => {
        if (user && reel.likes.includes(user._id)) {
            setIsLiked(true);
        }
    }, [user, reel.likes]);

    // PLAY/PAUSE LOGIC
    useEffect(() => {
        if (!videoRef.current) return;

        if (isActive) {
            setIsPlaying(true);
            videoRef.current.play().catch(() => setIsPlaying(false));
        } else {
            setIsPlaying(false);
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
            setProgress(0);
        }
    }, [isActive]);

    // PROGRESS TRACKER
    useEffect(() => {
        if (!videoRef.current) return;

        const interval = setInterval(() => {
            if (videoRef.current?.duration) {
                const value =
                    (videoRef.current.currentTime / videoRef.current.duration) * 100;
                setProgress(value);
            }
        }, 120);

        return () => clearInterval(interval);
    }, []);

    // SWIPE HINT ONCE
    useEffect(() => {
        const alreadyShown = sessionStorage.getItem("swipeHintShown");

        if (!alreadyShown && isActive) {
            setShowSwipeHint(true);
            sessionStorage.setItem("swipeHintShown", "true");

            setTimeout(() => setShowSwipeHint(false), 1500);
        }
    }, [isActive]);

    // TAP TO PAUSE
    const togglePlay = () => {
        if (!videoRef.current) return;
        if (isPlaying) videoRef.current.pause();
        else videoRef.current.play();
        setIsPlaying(!isPlaying);
    };

    // LIKE LOGIC
    const handleLike = async () => {
        if (!user) return toast.error("Please login to like");

        const newIsLiked = !isLiked;
        setIsLiked(newIsLiked);
        setLikesCount(prev => (newIsLiked ? prev + 1 : prev - 1));

        if (newIsLiked) triggerHeartAnimation();

        try {
            await axios.post(
                `${backendURL}/api/reels/${reel._id}/like`,
                {},
                { headers: { Authorization: `Bearer ${user.token}` } }
            );
        } catch {
            setIsLiked(!newIsLiked);
            setLikesCount(prev => (!newIsLiked ? prev + 1 : prev - 1));
        }
    };

    // ❤️ DOUBLE TAP ANIMATION FIX
    const handleDoubleTap = (e) => {
        e.stopPropagation();
        if (!isLiked) handleLike();
        triggerHeartAnimation();
    };

    // ❤️ Better Floating Animation
    const triggerHeartAnimation = () => {
        setShowHeartAnimation(true);
        setTimeout(() => setShowHeartAnimation(false), 1400);
    };

    // SCRUB BAR
    const handleScrub = (e) => {
        if (!videoRef.current) return;
        const rect = scrubRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percent = Math.min(Math.max(x / rect.width, 0), 1);
        const newTime = percent * videoRef.current.duration;

        videoRef.current.currentTime = newTime;
        setProgress(percent * 100);
    };

    return (
        <div className="w-full h-full flex items-center justify-center bg-black relative">

            {/* DESKTOP CENTERED 9:16 CONTAINER */}
            <div
                className="
                    relative
                    aspect-[9/16]
                    w-full h-full
                    md:max-w-[min(500px,90vw)]
                    md:h-auto
                    bg-black
                    rounded-2xl md:shadow-[0_0_40px_rgba(0,0,0,0.7)]
                    overflow-hidden
                "
            >

                {/* MEDIA WRAPPER */}
                <div
                    className="absolute inset-0 cursor-pointer select-none"
                    onClick={togglePlay}
                >

                    {/* VIDEO */}
                    {reel.mediaType === "video" && (
                        <video
                            ref={videoRef}
                            src={reel.mediaUrl}
                            className="
                                w-full h-full
                                object-contain
                                bg-black
                            "
                            loop
                            playsInline
                            muted={isMuted}
                            onDoubleClick={handleDoubleTap}
                        />
                    )}

                    {/* IMAGE */}
                    {reel.mediaType === "image" && (
                        <img
                            src={reel.mediaUrl}
                            alt={reel.title}
                            className="
                                w-full h-full
                                object-contain
                                bg-black
                            "
                            onDoubleClick={handleDoubleTap}
                        />
                    )}

                    {/* PLAY OVERLAY */}
                    {!isPlaying && isActive && reel.mediaType === "video" && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                            <div className="w-20 h-20 bg-white/15 backdrop-blur-md rounded-full flex items-center justify-center">
                                <FaPlay className="text-white text-4xl ml-1" />
                            </div>
                        </div>
                    )}

                    {/* HEART ANIMATION */}
                    <AnimatePresence>
                        {showHeartAnimation && (
                            <motion.div
                                initial={{ scale: 0.6, opacity: 0, y: 30 }}
                                animate={{ scale: 1.2, opacity: 1, y: 0 }}
                                exit={{ scale: 0.6, opacity: 0, y: -40 }}
                                transition={{ duration: 0.9 }}
                                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                            >
                                <FaHeart className="text-red-500 text-6xl drop-shadow-xl" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* GRADIENTS */}
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black/90 to-transparent" />

                {/* RIGHT ACTION BAR */}
                <div className="absolute z-100 right-4 bottom-44 flex flex-col items-center gap-6">

                    {/* Profile */}
                    <Link to={`/public-profile/${reel.editor._id}`} className="relative">
                        <div className="w-12 h-12 rounded-full border-2 border-white overflow-hidden">
                            <img
                                src={reel.editor.profilePicture}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-red-500 w-5 h-5 rounded-full flex items-center justify-center">
                            <FaUserPlus className="text-white text-[10px]" />
                        </div>
                    </Link>

                    {/* Likes */}
                    <motion.button
                        whileTap={{ scale: 0.8 }}
                        onClick={handleLike}
                        className="flex flex-col items-center text-white"
                    >
                        <motion.div
                            animate={isLiked ? { scale: [1, 1.3, 1] } : {}}
                            className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center"
                        >
                            {isLiked ? (
                                <FaHeart className="text-red-500 text-2xl" />
                            ) : (
                                <FaRegHeart className="text-white text-2xl" />
                            )}
                        </motion.div>
                        <span className="text-xs mt-1">{likesCount}</span>
                    </motion.button>

                    {/* Comments */}
                    <motion.button
                        whileTap={{ scale: 0.8 }}
                        onClick={() => onCommentClick(reel._id)}
                        className="flex flex-col items-center text-white"
                    >
                        <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center">
                            <FaComment className="text-white text-xl" />
                        </div>
                        <span className="text-xs mt-1">{reel.commentsCount}</span>
                    </motion.button>

                    {/* Views */}
                    <div className="flex flex-col items-center text-white">
                        <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center">
                            <FaEye className="text-white text-xl opacity-90" />
                        </div>
                        <span className="text-xs mt-1">{reel.viewsCount}</span>
                    </div>

                    {/* Share */}
                    <motion.button
                        whileTap={{ scale: 0.85 }}
                        onClick={() => navigator.share?.({ url: window.location.href })}
                        className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center"
                    >
                        <FaShare className="text-white text-xl" />
                    </motion.button>

                    {/* Mute */}
                    {reel.mediaType === "video" && (
                        <motion.button
                            whileTap={{ scale: 0.85 }}
                            onClick={() => setIsMuted(!isMuted)}
                            className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center mt-3"
                        >
                            {isMuted ? (
                                <FaVolumeMute className="text-white text-xl" />
                            ) : (
                                <FaVolumeUp className="text-white text-xl" />
                            )}
                        </motion.button>
                    )}
                </div>

                {/* BOTTOM TEXT */}
                <div className="absolute bottom-16 left-5 right-24 z-20 text-white">
                    <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-lg">{reel.editor.name}</h3>
                        <span className="px-2 py-0.5 bg-white/20 text-[10px] rounded border border-white/30">
                            Editor
                        </span>
                    </div>

                    <p className="text-sm font-medium">{reel.title}</p>
                    <p className="text-sm text-white/80 mt-1 line-clamp-2 max-w-[85%]">
                        {reel.description}
                    </p>
                </div>

                {/* WATERMARK */}
                <div className="absolute bottom-4 right-4 flex items-center gap-1 opacity-90 pointer-events-none z-20">
                    <img src={logo} className="w-6 h-6 rounded-md" />
                    <span className="text-white font-semibold text-xs tracking-wider opacity-90">
                        SuviX
                    </span>
                </div>

                {/* SCRUB BAR */}
                {reel.mediaType === "video" && (
                    <div
                        ref={scrubRef}
                        onClick={handleScrub}
                        className="absolute bottom-8 left-5 right-5 h-3 bg-white/20 rounded-full cursor-pointer z-30"
                    >
                        <motion.div
                            style={{ width: `${progress}%` }}
                            className="h-full bg-white rounded-full"
                        />
                    </div>
                )}

                {/* SWIPE RIGHT HINT */}
                <AnimatePresence>
                    {showSwipeHint && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.35 }}
                            className="absolute bottom-24 left-5 z-30 pointer-events-none"
                        >
                            <div className="flex items-center gap-2 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
                                <span className="text-white text-xs font-semibold">
                                    Swipe right to exit
                                </span>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-3.5 w-3.5 text-white"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                >
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
