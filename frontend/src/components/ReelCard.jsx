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
    FaPause,
    FaUserPlus,
    FaCheck,
    FaEye,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-toastify";

const ReelCard = ({ reel, isActive, onCommentClick }) => {
    const { user, backendURL } = useAppContext();
    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(reel.likesCount);
    const [isPlaying, setIsPlaying] = useState(isActive);
    const [isMuted, setIsMuted] = useState(false);
    const [showHeartAnimation, setShowHeartAnimation] = useState(false);
    const videoRef = useRef(null);

    // Initialize like state
    useEffect(() => {
        if (user && reel.likes.includes(user._id)) {
            setIsLiked(true);
        }
    }, [user, reel.likes]);

    // Handle play/pause based on active state
    useEffect(() => {
        if (isActive) {
            setIsPlaying(true);
            videoRef.current?.play().catch(() => setIsPlaying(false));
        } else {
            setIsPlaying(false);
            videoRef.current?.pause();
            if (videoRef.current) videoRef.current.currentTime = 0;
        }
    }, [isActive]);

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleLike = async () => {
        if (!user) {
            toast.error("Please login to like");
            return;
        }

        // Optimistic update
        const newIsLiked = !isLiked;
        setIsLiked(newIsLiked);
        setLikesCount((prev) => (newIsLiked ? prev + 1 : prev - 1));
        if (newIsLiked) setShowHeartAnimation(true);

        try {
            await axios.post(
                `${backendURL}/api/reels/${reel._id}/like`,
                {},
                { headers: { Authorization: `Bearer ${user.token}` } }
            );
        } catch (err) {
            // Revert on error
            setIsLiked(!newIsLiked);
            setLikesCount((prev) => (!newIsLiked ? prev + 1 : prev - 1));
            toast.error("Failed to update like");
        }
    };

    const handleDoubleTap = (e) => {
        e.stopPropagation();
        if (!isLiked) handleLike();
        setShowHeartAnimation(true);
        setTimeout(() => setShowHeartAnimation(false), 1000);
    };

    const handleShare = async () => {
        try {
            await navigator.share({
                title: reel.title,
                text: reel.description,
                url: window.location.href,
            });
        } catch (err) {
            navigator.clipboard.writeText(window.location.href);
            toast.success("Link copied to clipboard!");
        }
    };

    return (
        <div className="relative w-full h-full bg-black snap-start shrink-0">
            {/* Media Layer */}
            <div
                className="absolute inset-0 cursor-pointer"
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

                {/* Video Controls Overlay */}
                {!isPlaying && isActive && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
                            <FaPlay className="text-white text-2xl ml-1" />
                        </div>
                    </div>
                )}

                {/* Double Tap Heart Animation */}
                <AnimatePresence>
                    {showHeartAnimation && (
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1.5, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            className="absolute inset-0 flex items-center justify-center pointer-events-none"
                        >
                            <FaHeart className="text-red-500 text-8xl drop-shadow-2xl" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60 pointer-events-none" />

            {/* Right Sidebar Actions */}
            <div className="absolute right-4 bottom-24 flex flex-col items-center gap-6 z-20">
                {/* Editor Profile */}
                <Link to={`/public-profile/${reel.editor._id}`} className="relative group">
                    <div className="w-12 h-12 rounded-full border-2 border-white p-0.5 overflow-hidden">
                        <img
                            src={reel.editor.profilePicture || "https://via.placeholder.com/40"}
                            alt={reel.editor.name}
                            className="w-full h-full rounded-full object-cover"
                        />
                    </div>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-red-500 rounded-full p-0.5">
                        <FaUserPlus className="text-white text-[10px]" />
                    </div>
                </Link>

                {/* Like */}
                <div className="flex flex-col items-center gap-1">
                    <motion.button
                        whileTap={{ scale: 0.8 }}
                        onClick={handleLike}
                        className="p-2"
                    >
                        {isLiked ? (
                            <FaHeart className="text-red-500 text-3xl drop-shadow-lg" />
                        ) : (
                            <FaRegHeart className="text-white text-3xl drop-shadow-lg" />
                        )}
                    </motion.button>
                    <span className="text-white text-xs font-medium drop-shadow-md">
                        {likesCount}
                    </span>
                </div>

                {/* Comment */}
                <div className="flex flex-col items-center gap-1">
                    <motion.button
                        whileTap={{ scale: 0.8 }}
                        onClick={() => onCommentClick(reel._id)}
                        className="p-2"
                    >
                        <FaComment className="text-white text-3xl drop-shadow-lg" />
                    </motion.button>
                    <span className="text-white text-xs font-medium drop-shadow-md">
                        {reel.commentsCount}
                    </span>
                </div>

                {/* Views (New) */}
                <div className="flex flex-col items-center gap-1 mt-2">
                    <div className="p-2">
                        <FaEye className="text-white text-2xl drop-shadow-lg opacity-90" />
                    </div>
                    <span className="text-white text-xs font-medium drop-shadow-md">
                        {reel.viewsCount}
                    </span>
                </div>

                {/* Share */}
                <motion.button
                    whileTap={{ scale: 0.8 }}
                    onClick={handleShare}
                    className="p-2"
                >
                    <FaShare className="text-white text-3xl drop-shadow-lg" />
                </motion.button>

                {/* Mute Toggle (Video Only) */}
                {reel.mediaType === "video" && (
                    <motion.button
                        whileTap={{ scale: 0.8 }}
                        onClick={() => setIsMuted(!isMuted)}
                        className="p-2 bg-black/20 backdrop-blur-sm rounded-full mt-4"
                    >
                        {isMuted ? (
                            <FaVolumeMute className="text-white text-xl" />
                        ) : (
                            <FaVolumeUp className="text-white text-xl" />
                        )}
                    </motion.button>
                )}
            </div>

            {/* Bottom Info */}
            <div className="absolute bottom-0 left-0 right-0 p-4 pb-20 md:pb-4 z-10 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-white font-bold text-lg drop-shadow-md">
                        {reel.editor.name}
                    </h3>
                    <span className="bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] text-white font-medium border border-white/30">
                        Editor
                    </span>
                </div>

                <h4 className="text-white text-sm font-medium mb-1 line-clamp-1">
                    {reel.title}
                </h4>

                <p className="text-white/80 text-sm line-clamp-2 max-w-[85%]">
                    {reel.description}
                </p>

                {/* Portfolio Link */}
                {reel.portfolio && (
                    <div className="mt-3">
                        <Link
                            to={`/public-profile/${reel.editor._id}`} // Ideally deep link to portfolio
                            className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-md px-3 py-1.5 rounded-lg transition-colors"
                        >
                            <div className="w-4 h-4 rounded bg-orange-500 flex items-center justify-center">
                                <FaPlay className="text-white text-[8px]" />
                            </div>
                            <span className="text-white text-xs font-medium">View Portfolio</span>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReelCard;
