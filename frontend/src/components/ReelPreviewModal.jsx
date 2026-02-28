import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    FaHeart,
    FaRegHeart,
    FaComment,
    FaShare,
    FaVolumeUp,
    FaVolumeMute,
    FaEye,
    FaTimes,
} from "react-icons/fa";
import { repairUrl } from "../utils/urlHelper.jsx";
import { useAppContext } from "../context/AppContext";
import { useReelsContext } from "../context/ReelsContext";
import logo from "../assets/logo.png";
import axios from "axios";
import { toast } from "react-toastify";
import FollowingAnimation from "./FollowingAnimation";

const ReelPreviewModal = ({ reel, onClose, onCommentClick, isPortfolioMode = false }) => {
    const { user, backendURL } = useAppContext();
    const { globalMuted, setGlobalMuted } = useReelsContext();
    const videoRef = useRef(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isLiked, setIsLiked] = useState(reel.likes?.includes(user?._id));
    const [likesCount, setLikesCount] = useState(reel.likes?.length || 0);
    const [isPlaying, setIsPlaying] = useState(true);
    const [showMuteIcon, setShowMuteIcon] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);
    const [showFollowAnimation, setShowFollowAnimation] = useState(false);

    // --- Identification Logic (Moved to Top) ---
    const editor = isPortfolioMode ? (reel.user || user) : reel.editor;
    const editorId = editor?._id;
    const isOwnContent = user?._id === editorId;

    // --- Portfolio Mode State ---
    const [viewType, setViewType] = useState("edited"); // "edited" or "original"
    const [originalIndex, setOriginalIndex] = useState(0);

    const isVideoFile = (url) => {
        if (!url) return false;
        return url.match(/\.(mp4|webm|mov|ogg)$/i) || url.includes("video");
    };

    // Prepare media URLs based on mode and view type
    const getMediaUrl = () => {
        if (!isPortfolioMode) return repairUrl(reel.mediaUrl);
        
        if (viewType === "edited") {
            return repairUrl(reel.editedClip);
        } else {
            const originals = reel.originalClips || (reel.originalClip ? [reel.originalClip] : []);
            if (originals.length === 0) return "";
            return repairUrl(originals[originalIndex]);
        }
    };

    const mediaUrl = getMediaUrl();
    const isVideo = isPortfolioMode ? isVideoFile(mediaUrl) : reel.mediaType === "video";

    // Show mute icon when globalMuted changes
    useEffect(() => {
        setShowMuteIcon(true);
        const timer = setTimeout(() => setShowMuteIcon(false), 800);
        return () => clearTimeout(timer);
    }, [globalMuted]);

    // Sync muted state with global
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.muted = globalMuted;
        }
    }, [globalMuted]);

    useEffect(() => {
        if (!user || !editorId || isOwnContent) return;
        axios.get(`${backendURL}/api/users/follow/status/${editorId}`, {
            headers: { Authorization: `Bearer ${user.token}` },
        }).then((res) => setIsFollowing(res.data.isFollowing)).catch(() => {});
    }, [user, editorId, isOwnContent, backendURL]);

    useEffect(() => {
        if (videoRef.current && isLoaded) {
            videoRef.current.play().catch(err => console.log("Auto-play blocked:", err));
        }
    }, [isLoaded]);

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [onClose]);

    const updateProgress = () => {
        if (videoRef.current) {
            const p = (videoRef.current.currentTime / videoRef.current.duration) * 100;
            setProgress(p);
        }
    };

    const handleLike = async (e) => {
        e.stopPropagation();
        if (!user) return toast.error("Please login to like");
        const newIsLiked = !isLiked;
        setIsLiked(newIsLiked);
        setLikesCount(prev => newIsLiked ? prev + 1 : prev - 1);
        try {
            await axios.post(`${backendURL}/api/reels/${reel._id}/like`, {}, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
        } catch (err) {
            setIsLiked(!newIsLiked);
            setLikesCount(prev => !newIsLiked ? prev + 1 : prev - 1);
            toast.error("Failed to update like");
        }
    };

    const handleShare = (e) => {
        e.stopPropagation();
        const url = `${window.location.origin}/reels?id=${reel._id}`;
        if (navigator.share) {
            navigator.share({ url });
        } else {
            navigator.clipboard.writeText(url);
            toast.success("Link copied!");
        }
    };

    const handleFollow = async (e) => {
        e.preventDefault(); e.stopPropagation();
        if (!user) return toast.error("Please login to follow");
        if (followLoading) return;
        setFollowLoading(true);
        const newFollowing = !isFollowing;
        setIsFollowing(newFollowing);
        try {
            await axios.post(`${backendURL}/api/user/follow/${editorId}`, {}, { headers: { Authorization: `Bearer ${user.token}` } });
            if (newFollowing) {
                setShowFollowAnimation(true);
                setTimeout(() => setShowFollowAnimation(false), 2000);
            }
        } catch {
            setIsFollowing(!newFollowing);
            toast.error("Failed to update follow status");
        } finally {
            setFollowLoading(false);
        }
    };

    // --- SWIPE LOGIC FOR ORIGINAL CLIPS ---
    const handleDragEnd = (e, { offset, velocity }) => {
        if (!isPortfolioMode || viewType !== "original") return;
        
        const originals = reel.originalClips || (reel.originalClip ? [reel.originalClip] : []);
        if (originals.length <= 1) return;

        if (Math.abs(offset.x) > 50 || Math.abs(velocity.x) > 500) {
            if (offset.x > 0) {
                // Swipe Right -> Prev
                setOriginalIndex(prev => (prev - 1 + originals.length) % originals.length);
            } else {
                // Swipe Left -> Next
                setOriginalIndex(prev => (prev + 1) % originals.length);
            }
            setIsLoaded(false);
        }
    };

    if (!reel) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center p-0 sm:p-4"
            onClick={onClose}
        >
            {/* Glassmorphic Overlay */}
            <motion.div
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            />

            {/* Modal Content */}
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative w-full h-full sm:h-auto sm:max-w-[360px] sm:aspect-[9/16] bg-black sm:rounded-3xl overflow-hidden shadow-2xl border-none sm:border sm:border-white/10"
                onClick={(e) => e.stopPropagation()}
            >
                {/* ── VIDEO MAIN PLAYER ── */}
                <motion.div
                    drag={isPortfolioMode && viewType === "original" ? "x" : false}
                    dragConstraints={{ left: 0, right: 0 }}
                    onDragEnd={handleDragEnd}
                    className="flex-1 w-full bg-black flex items-center justify-center relative rounded-2xl overflow-hidden shadow-2xl h-full"
                    onClick={(e) => { e.stopPropagation(); setGlobalMuted(!globalMuted); }}
                    onMouseDown={() => { if (videoRef.current) videoRef.current.pause(); setIsPlaying(false); }}
                    onMouseUp={() => { if (videoRef.current) videoRef.current.play(); setIsPlaying(true); }}
                    onTouchStart={() => { if (videoRef.current) videoRef.current.pause(); setIsPlaying(false); }}
                    onTouchEnd={() => { if (videoRef.current) videoRef.current.play(); setIsPlaying(true); }}
                    onContextMenu={(e) => e.preventDefault()}
                >
                    {isVideo ? (
                        <>
                            <video
                                key={mediaUrl} // Force re-render on clip change
                                ref={videoRef}
                                src={mediaUrl}
                                className="w-full h-full object-cover"
                                autoPlay
                                loop
                                playsInline
                                muted={globalMuted}
                                controlsList="nodownload"
                                onLoadedData={() => setIsLoaded(true)}
                                onTimeUpdate={updateProgress}
                                onContextMenu={(e) => e.preventDefault()}
                            />
                            {!isLoaded && (
                                <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/50">
                                    <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                </div>
                            )}
                        </>
                    ) : (
                        <img
                            key={mediaUrl}
                            src={mediaUrl}
                            className="w-full h-full object-cover"
                            alt={reel.title}
                            onLoad={() => setIsLoaded(true)}
                        />
                    )}

                    {/* Top Info Badge - Centered & Refined */}
                    <div className="absolute top-6 left-0 right-0 z-[70] flex flex-col items-center">
                        <div className="flex items-center gap-2">
                            <img src={logo} className="w-6 h-6 object-contain" alt="SuviX" />
                            <span className="text-white font-normal text-[12px] tracking-widest uppercase text-shadow">
                                {isPortfolioMode ? "Portfolio View" : "SuviX Reels"}
                            </span>
                        </div>
                        
                        {/* View Type Toggle (Portfolio Only) */}
                        {isPortfolioMode && (
                            <div className="mt-3 flex gap-2">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setViewType("edited"); setIsLoaded(false); }}
                                    className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all border ${
                                        viewType === "edited" 
                                            ? "bg-white text-black border-white" 
                                            : "bg-black/40 text-white/70 border-white/20 backdrop-blur-md"
                                    }`}
                                >
                                    Edited
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setViewType("original"); setIsLoaded(false); }}
                                    className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all border ${
                                        viewType === "original" 
                                            ? "bg-white text-black border-white" 
                                            : "bg-black/40 text-white/70 border-white/20 backdrop-blur-md"
                                    }`}
                                >
                                    Original
                                </button>
                            </div>
                        )}
                        
                        {/* Original Clip Pagination */}
                        {isPortfolioMode && viewType === "original" && (reel.originalClips?.length > 1) && (
                            <div className="mt-2 flex gap-1">
                                {reel.originalClips.map((_, i) => (
                                    <div 
                                        key={i} 
                                        className={`h-1 rounded-full transition-all ${i === originalIndex ? "w-4 bg-white" : "w-1.5 bg-white/30"}`}
                                    />
                                ))}
                            </div>
                        )}

                        {/* NEW Badge */}
                        {!isPortfolioMode && (() => {
                            const isNew = reel.createdAt && (new Date() - new Date(reel.createdAt)) < 24 * 60 * 60 * 1000;
                            if (!isNew) return null;
                            return (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ 
                                        opacity: [0.8, 1, 0.8],
                                        scale: [1, 1.05, 1],
                                    }}
                                    transition={{ 
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                    className="px-2 py-0.5 rounded-full border border-white/40 bg-white/5 backdrop-blur-sm flex items-center justify-center min-w-[35px] mt-1"
                                >
                                    <span className="text-white text-[7px] font-normal uppercase tracking-[0.1em]">
                                        NEW
                                    </span>
                                </motion.div>
                            );
                        })()}
                    </div>
                </motion.div>

                {/* Mute/Unmute Indicator Overlay */}
                <AnimatePresence>
                    {showMuteIcon && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            className="absolute inset-0 flex items-center justify-center pointer-events-none z-[80]"
                        >
                            <div className="w-16 h-16 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10">
                                {globalMuted ? (
                                    <FaVolumeMute className="text-white text-2xl" />
                                ) : (
                                    <FaVolumeUp className="text-white text-2xl" />
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── SIDEBAR CONTROLS ── */}
                <div className="absolute right-4 bottom-24 z-[70] flex flex-col items-center gap-5">
                    <div className="flex flex-col items-center gap-1">
                        <motion.button
                            whileTap={{ scale: 0.8 }}
                            onClick={handleLike}
                            className="w-11 h-11 bg-white/10 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center text-white text-lg shadow-lg"
                        >
                            {isLiked ? <FaHeart className="text-red-500" /> : <FaRegHeart />}
                        </motion.button>
                        <span className="text-[10px] font-bold text-white drop-shadow-md">{likesCount}</span>
                    </div>

                    <div className="flex flex-col items-center gap-1">
                        <motion.button
                            whileTap={{ scale: 0.8 }}
                            onClick={(e) => { e.stopPropagation(); onCommentClick(reel._id); }}
                            className="w-11 h-11 bg-white/10 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center text-white text-lg shadow-lg"
                        >
                            <FaComment />
                        </motion.button>
                        <span className="text-[10px] font-bold text-white drop-shadow-md">{reel.commentsCount || 0}</span>
                    </div>

                    <div className="flex flex-col items-center gap-1">
                        <div className="w-11 h-11 bg-white/10 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center text-white text-lg opacity-70">
                            <FaEye />
                        </div>
                        <span className="text-[10px] font-bold text-white drop-shadow-md">{reel.viewsCount || 0}</span>
                    </div>

                    <motion.button
                        whileTap={{ scale: 0.8 }}
                        onClick={handleShare}
                        className="w-11 h-11 bg-white/10 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center text-white text-lg shadow-lg"
                    >
                        <FaShare />
                    </motion.button>

                    {isVideo && (
                        <motion.button
                            whileTap={{ scale: 0.8 }}
                            onClick={(e) => { e.stopPropagation(); setGlobalMuted(!globalMuted); }}
                            className="w-11 h-11 bg-white/10 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center text-white text-lg shadow-lg"
                        >
                            {globalMuted ? <FaVolumeMute /> : <FaVolumeUp />}
                        </motion.button>
                    )}
                </div>

                {/* ── BOTTOM OVERLAY GRADIENT ── */}
                <div className="absolute bottom-0 inset-x-0 h-80 bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none z-[50]" />

                {/* Info Overlay (Text Container) */}
                <div className="absolute bottom-6 left-0 right-16 px-6 pb-6 pointer-events-none z-[60]">
                    <div className="pointer-events-auto">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full border-[1.5px] border-white overflow-hidden shadow-lg p-[1px] bg-white/10">
                                <img 
                                    src={repairUrl(editor?.profilePicture)} 
                                    className="w-full h-full rounded-full object-cover"
                                    alt={editor?.name}
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <div className="flex flex-col">
                                    <span className="text-white text-sm font-bold tracking-tight">{editor?.name}</span>
                                    <span className="text-[8px] font-black text-white/50 tracking-widest uppercase">EDITOR</span>
                                </div>
                                {!isOwnContent && (
                                    <button
                                        onClick={handleFollow}
                                        className="w-fit h-6 px-4 bg-transparent border border-white rounded-full flex items-center justify-center text-white text-[10px] font-bold uppercase tracking-wider active:scale-95 transition-all hover:bg-white/20 shadow-lg"
                                    >
                                        {isFollowing ? "Following" : "Follow"}
                                    </button>
                                )}
                            </div>
                        </div>
                        <h2 className="text-white font-bold text-base mb-1 drop-shadow-md">{reel.title}</h2>
                        <p className="text-white/80 text-[11px] line-clamp-2 leading-relaxed drop-shadow-md">
                            {reel.description}
                        </p>
                    </div>
                </div>

                {/* Progress Bar */}
                {isVideo && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 z-[70]">
                        <motion.div 
                            className="h-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                )}

                {/* Close Button */}
                <button 
                    onClick={(e) => { e.stopPropagation(); onClose(); }}
                    className="absolute top-6 left-6 w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white z-[100] border border-white/20 hover:bg-white/10 transition-colors shadow-2xl"
                    title="Close (Esc)"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <AnimatePresence>
                    {showFollowAnimation && (
                        <FollowingAnimation onComplete={() => setShowFollowAnimation(false)} />
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.div>
    );
};

export default ReelPreviewModal;
