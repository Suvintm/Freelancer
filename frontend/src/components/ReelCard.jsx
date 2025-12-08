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

    const videoRef = useRef(null);
    const scrubRef = useRef(null);

    // Like state init
    useEffect(() => {
        if (user && reel.likes.includes(user._id)) {
            setIsLiked(true);
        }
    }, [user, reel.likes]);

    // Video play/pause
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

    // Track progress bar
    useEffect(() => {
        if (!videoRef.current) return;

        const interval = setInterval(() => {
            if (videoRef.current && videoRef.current.duration) {
                const value = (videoRef.current.currentTime / videoRef.current.duration) * 100;
                setProgress(value);
            }
        }, 120);

        return () => clearInterval(interval);
    }, []);

    // Tap to play/pause
    const togglePlay = () => {
        if (!videoRef.current) return;
        if (isPlaying) videoRef.current.pause();
        else videoRef.current.play();
        setIsPlaying(!isPlaying);
    };

    // Like logic
    const handleLike = async () => {
        if (!user) return toast.error("Please login to like");

        const newIsLiked = !isLiked;
        setIsLiked(newIsLiked);
        setLikesCount(prev => newIsLiked ? prev + 1 : prev - 1);

        if (newIsLiked) setShowHeartAnimation(true);

        try {
            await axios.post(
                `${backendURL}/api/reels/${reel._id}/like`,
                {},
                { headers: { Authorization: `Bearer ${user.token}` } }
            );
        } catch {
            setIsLiked(!newIsLiked);
            setLikesCount(prev => !newIsLiked ? prev + 1 : prev - 1);
        }
    };

    // Double Tap ❤️
    const handleDoubleTap = (e) => {
        e.stopPropagation();
        if (!isLiked) handleLike();
        setShowHeartAnimation(true);
        setTimeout(() => setShowHeartAnimation(false), 900);
    };

    // Share
    const handleShare = async () => {
        try {
            await navigator.share({
                title: reel.title,
                text: reel.description,
                url: window.location.href,
            });
        } catch {
            navigator.clipboard.writeText(window.location.href);
            toast.success("Link copied!");
        }
    };

    // Scrub (seek)
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
        <div className="relative w-full h-full bg-black snap-start overflow-hidden">

            {/* MEDIA */}
            <div
                className="absolute inset-0 cursor-pointer select-none"
                onClick={togglePlay}
                onDoubleClick={handleDoubleTap}
            >
                {reel.mediaType === "video" ? (
                    <video
                        ref={videoRef}
                        src={reel.mediaUrl}
                        className="w-full h-full object-cover"
                        loop
                        playsInline
                        muted={isMuted}
                    />
                ) : (
                    <img
                        src={reel.mediaUrl}
                        alt={reel.title}
                        className="w-full h-full object-cover"
                    />
                )}

                {/* Play Overlay */}
                {!isPlaying && isActive && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
                            <FaPlay className="text-white text-4xl ml-1" />
                        </div>
                    </div>
                )}

                {/* Double Tap ❤️ */}
                <AnimatePresence>
                    {showHeartAnimation && (
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1.4, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            className="absolute inset-0 flex items-center justify-center pointer-events-none"
                        >
                            <FaHeart className="text-red-500 text-8xl drop-shadow-2xl" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* GRADIENTS */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/60 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black/90 to-transparent" />

            {/* ================================
                RIGHT ACTION BAR
            ================================= */}
            <div className="absolute right-4 bottom-44 flex flex-col items-center gap-6 z-20">

                {/* Profile */}
                <Link to={`/public-profile/${reel.editor._id}`} className="relative">
                    <div className="w-12 h-12 rounded-full border-2 border-white overflow-hidden">
                        <img
                            src={reel.editor.profilePicture}
                            alt={reel.editor.name}
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
                        animate={isLiked ? { scale: [1, 1.4, 1] } : {}}
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
                    onClick={handleShare}
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

            {/* ================================
                BOTTOM INFO TEXT
            ================================= */}
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

            {/* ================================
                SUVI X BRAND WATERMARK
            ================================= */}
            <div className="absolute bottom-4 right-4 flex items-center gap-1 opacity-90 pointer-events-none z-20">
                <img src={logo} className="w-6 h-6 rounded-md" />
                <span className="text-white font-semibold text-xs tracking-wider opacity-90">
                    SuviX
                </span>
            </div>

            {/* ================================
                TIMELINE SCRUB BAR (NEW)
            ================================= */}
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
        </div>
    );
};

export default ReelCard;
