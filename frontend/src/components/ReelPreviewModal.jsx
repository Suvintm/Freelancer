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
    FaChevronUp,
    FaChevronDown,
    FaChevronLeft,
    FaChevronRight,
} from "react-icons/fa";
import { repairUrl } from "../utils/urlHelper.jsx";
import { useAppContext } from "../context/AppContext";
import { useReelsContext } from "../context/ReelsContext";
import logo from "../assets/logo.png";
import axios from "axios";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import FollowingAnimation from "./FollowingAnimation";
import ReelCommentsDrawer from "./ReelCommentsDrawer";
import MusicVisualizer from "./MusicVisualizer";

const ReelPreviewModal = ({ 
    reel: initialReel, 
    reels: reelsArray = [], 
    initialIndex = 0,
    onClose, 
    onCommentClick, 
    isPortfolioMode = false,
    portfolioOwner = null
}) => {
    const { user, backendURL } = useAppContext();
    const { globalMuted, setGlobalMuted } = useReelsContext();
    
    // --- Multi-Reel Navigation State ---
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [reels, setReels] = useState(reelsArray.length > 0 ? reelsArray : [initialReel]);
    const reel = reels[currentIndex];

    const videoRef = useRef(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(0);
    const [commentsCount, setCommentsCount] = useState(0);
    const [viewsCount, setViewsCount] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const [showMuteIcon, setShowMuteIcon] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);
    const [showFollowAnimation, setShowFollowAnimation] = useState(false);
    const [showComments, setShowComments] = useState(false);

    // --- Identification Logic (Moved to Top) ---
    const editor = isPortfolioMode ? (portfolioOwner || reel.user || user) : reel.editor;
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

    // Fetch initial follow status
    useEffect(() => {
        if (!user || user._id === editorId) return;
        axios.get(`${backendURL}/api/users/follow/status/${editorId}`, {
            headers: { Authorization: `Bearer ${user.token}` },
        }).then((res) => setIsFollowing(res.data.isFollowing)).catch(() => {});
    }, [user, editorId, backendURL]);

    // Reset loader when media changes
    useEffect(() => {
        setIsLoaded(false);
    }, [currentIndex, viewType, originalIndex]);

    // Sync with backend on reel change
    useEffect(() => {
        const targetId = reel?.reelId || reel?._id;
        if (!targetId) return;

        // Skip API calls if it's an unpublished portfolio item
        if (isPortfolioMode && !reel.isPublished) {
            setIsLiked(false);
            setLikesCount(0);
            setCommentsCount(0);
            setViewsCount(0);
            return;
        }
        
        const fetchReelData = async () => {
            try {
                const { data } = await axios.get(`${backendURL}/api/reels/${targetId}`);
                const r = data.reel;
                setIsLiked(r.likes?.includes(user?._id));
                setLikesCount(r.likes?.length || 0);
                setCommentsCount(r.commentsCount || 0);
                setViewsCount(r.viewsCount || 0);
                
                // Track view
                axios.post(`${backendURL}/api/reels/${targetId}/view`).catch(() => {});
            } catch (err) {
                console.error("Failed to fetch reel data:", err);
            }
        };

        fetchReelData();
    }, [currentIndex, reel?._id, reel?.reelId, reel?.isPublished, isPortfolioMode, backendURL, user?._id]);

    useEffect(() => {
        if (videoRef.current && isLoaded) {
            videoRef.current.play().catch(err => console.log("Auto-play blocked:", err));
        }
    }, [isLoaded, currentIndex]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowUp" && currentIndex > 0) {
                setCurrentIndex(prev => prev - 1);
            }
            if (e.key === "ArrowDown" && currentIndex < reels.length - 1) {
                setCurrentIndex(prev => prev + 1);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose, currentIndex, reels.length]);

    // Reset view settings when moving to a new reel
    useEffect(() => {
        setViewType("edited");
        setOriginalIndex(0);
        setIsLoaded(false);
    }, [currentIndex]);

    const updateProgress = () => {
        if (videoRef.current) {
            const p = (videoRef.current.currentTime / videoRef.current.duration) * 100;
            setProgress(p);
        }
    };

    const handleLike = async (e) => {
        e.stopPropagation();
        if (isPortfolioMode && !reel.isPublished) return toast.info("Publish this portfolio to enable likes!");
        if (!user) return toast.error("Please login to like");
        
        const targetId = reel.reelId || reel._id;
        const newIsLiked = !isLiked;
        setIsLiked(newIsLiked);
        setLikesCount(prev => newIsLiked ? prev + 1 : prev - 1);
        try {
            await axios.post(`${backendURL}/api/reels/${targetId}/like`, {}, {
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

    // --- NAVIGATION LOGIC ---
    const lastScrollTime = useRef(0);
    const scrollThreshold = 1000; // ms between scrolls

    const handleWheel = (e) => {
        const now = Date.now();
        if (now - lastScrollTime.current < scrollThreshold) return;

        if (Math.abs(e.deltaY) > 30) {
            if (e.deltaY > 0 && currentIndex < reels.length - 1) {
                setCurrentIndex(prev => prev + 1);
                lastScrollTime.current = now;
            } else if (e.deltaY < 0 && currentIndex > 0) {
                setCurrentIndex(prev => prev - 1);
                lastScrollTime.current = now;
            }
        }
    };

    const handleDragEnd = (e, { offset, velocity }) => {
        // Vertical swipe for next/prev reel
        if (Math.abs(offset.y) > 100 || Math.abs(velocity.y) > 500) {
            if (offset.y > 0) {
                // Swipe Down -> Prev Reel
                if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
            } else {
                // Swipe Up -> Next Reel
                if (currentIndex < reels.length - 1) setCurrentIndex(prev => prev + 1);
            }
            return;
        }

        // --- Unified Horizontal Swipe Logic ---
        // Treat Edited + Originals as a sequence: [Edited, Org1, Org2, ...]
        if (isPortfolioMode) {
            const originals = reel.originalClips || (reel.originalClip ? [reel.originalClip] : []);
            
            if (Math.abs(offset.x) > 50 || Math.abs(velocity.x) > 500) {
                if (offset.x < 0) {
                    // Swipe Left -> Move "Forward" in sequence [Edited -> Org1 -> Org2]
                    if (viewType === "edited") {
                        if (originals.length > 0) {
                            setViewType("original");
                            setOriginalIndex(0);
                        }
                    } else if (viewType === "original") {
                        if (originalIndex < originals.length - 1) {
                            setOriginalIndex(prev => prev + 1);
                        }
                    }
                } else if (offset.x > 0) {
                    // Swipe Right -> Move "Backward" in sequence [Org2 -> Org1 -> Edited]
                    if (viewType === "original") {
                        if (originalIndex > 0) {
                            setOriginalIndex(prev => prev - 1);
                        } else {
                            setViewType("edited");
                            setOriginalIndex(0);
                        }
                    } else if (viewType === "edited") {
                        // Already at start
                    }
                }
            }
        }
    };

    if (!reel) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center p-0"
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
                animate={{ 
                    scale: 1,
                    opacity: 1,
                    y: 0
                }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative w-full h-full sm:h-[90vh] sm:max-w-[420px] sm:aspect-[9/16] bg-black overflow-hidden shadow-2xl border-none sm:border sm:border-white/10"
                onClick={(e) => e.stopPropagation()}
            >
                {/* ── VIDEO MAIN PLAYER ── */}
                {/* ── VIDEO MAIN PLAYER AREA ── */}
                <div 
                    className="flex-1 w-full bg-black flex items-center justify-center relative h-full overflow-hidden"
                    onWheel={handleWheel}
                    onContextMenu={(e) => e.preventDefault()}
                >
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentIndex}
                            initial={{ y: "100%", opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: "-100%", opacity: 0 }}
                            transition={{ type: "spring", damping: 30, stiffness: 200 }}
                            className="absolute inset-0 z-0"
                            drag={isPortfolioMode ? true : "y"}
                            dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
                            dragElastic={0.1}
                            onDragEnd={handleDragEnd}
                            onClick={(e) => { e.stopPropagation(); setGlobalMuted(!globalMuted); }}
                            onMouseDown={() => { if (videoRef.current) videoRef.current.pause(); setIsPlaying(false); }}
                            onMouseUp={() => { if (videoRef.current) videoRef.current.play(); setIsPlaying(true); }}
                            onTouchStart={() => { if (videoRef.current) videoRef.current.pause(); setIsPlaying(false); }}
                            onTouchEnd={() => { if (videoRef.current) videoRef.current.play(); setIsPlaying(true); }}
                        >
                            {isVideo ? (
                                <>
                                    <video
                                        key={mediaUrl} 
                                        ref={videoRef}
                                        src={mediaUrl}
                                        className="w-full h-full object-contain pointer-events-none"
                                        autoPlay
                                        loop
                                        playsInline
                                        muted={globalMuted}
                                        controlsList="nodownload"
                                        onLoadedData={() => setIsLoaded(true)}
                                        onTimeUpdate={updateProgress}
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
                                    className="w-full h-full object-contain pointer-events-none"
                                    alt={reel?.title}
                                    onLoad={() => setIsLoaded(true)}
                                />
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {/* WATERMARK */}
                    <div className="absolute bottom-3 right-4 flex items-center gap-1 opacity-20 pointer-events-none grayscale invert scale-75 origin-right z-50">
                        <img src={logo} className="w-4 h-4" alt="" />
                        <span className="text-white font-black text-[8px] tracking-widest uppercase">SuviX</span>
                    </div>

                    {/* NEW Badge - Centered under "SuviX Reels" text */}
                    <div className="absolute top-16 left-0 right-0 z-[70] flex flex-col items-center pointer-events-none">
                        {(() => {
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
                                    className="px-3 py-1 rounded-full border border-white/40 bg-white  flex items-center justify-center min-w-[35px]"
                                >
                                    <span className="text-black  text-[7px] font-bold uppercase tracking-[0.1em]">
                                        NEW
                                    </span>
                                </motion.div>
                            );
                        })()}
                    </div>

                    {/* Top Info Overlay (Fixed above the scrolling content) */}
                    <div className="absolute top-6 left-0 right-0 z-[70] flex flex-col items-center pointer-events-none">
                        <div className="flex items-center gap-2 pointer-events-auto">
                            <img src={logo} className="w-6 h-6 object-contain" alt="SuviX" />
                            <span className="text-white font-normal text-[12px] tracking-widest uppercase text-shadow">
                                {isPortfolioMode ? "Portfolio View" : "SuviX Reels"}
                            </span>
                        </div>

                        {isPortfolioMode && (
                            <>
                                {((reel.originalClips && reel.originalClips.length > 0) || reel.originalClip) && (
                                    <div className="mt-4 flex gap-2 pointer-events-auto">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setViewType("edited"); }}
                                            className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border ${
                                                viewType === "edited" ? "bg-white text-black border-white" : "bg-black/40 text-white/70 border-white/20 hover:bg-black/60"
                                            }`}
                                        >
                                            Edited Clip
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setViewType("original"); }}
                                            className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border ${
                                                viewType === "original" ? "bg-white text-black border-white" : "bg-black/40 text-white/70 border-white/20 hover:bg-black/60"
                                            }`}
                                        >
                                            Original Clip
                                        </button>
                                    </div>
                                )}

                                {/* Original Clips Counter Badge */}
                                <AnimatePresence>
                                    {viewType === "original" && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="mt-3 px-3 py-1 bg-black/40 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-4 pointer-events-auto"
                                        >
                                            <button 
                                                onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    if (originalIndex > 0) {
                                                        setOriginalIndex(prev => prev - 1);
                                                    } else {
                                                        setViewType("edited");
                                                    }
                                                }}
                                                className="text-white/70 hover:text-white transition-colors"
                                            >
                                                <FaChevronLeft className="text-[10px]" />
                                            </button>

                                            <span className="text-[10px] font-black text-white uppercase tracking-widest min-w-[60px] text-center">
                                                Clip {originalIndex + 1} / {(reel.originalClips || (reel.originalClip ? [reel.originalClip] : [])).length}
                                            </span>

                                            <button 
                                                onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    const originals = reel.originalClips || (reel.originalClip ? [reel.originalClip] : []);
                                                    if (originalIndex < originals.length - 1) {
                                                        setOriginalIndex(prev => prev + 1);
                                                    }
                                                }}
                                                className="text-white/70 hover:text-white transition-colors"
                                            >
                                                <FaChevronRight className="text-[10px]" />
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </>
                        )}
                    </div>
                </div>

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
                {!(isPortfolioMode && viewType === "original") && (
                    <div className="absolute right-3 bottom-24 z-[70] flex flex-col items-center gap-5">
                        <div className="flex flex-col items-center gap-1">
                            <motion.button
                                whileTap={{ scale: 0.8 }}
                                onClick={handleLike}
                                className="w-11 h-11 bg-white/10 backdrop-blur-3xl border border-white/10 rounded-full flex items-center justify-center text-white text-lg shadow-lg"
                            >
                                {isLiked ? <FaHeart className="text-red-500" /> : <FaRegHeart />}
                            </motion.button>
                            <span className="text-[10px] font-bold text-white drop-shadow-md">{likesCount}</span>
                        </div>

                        <div className="flex flex-col items-center gap-1">
                            <motion.button
                                whileTap={{ scale: 0.8 }}
                                onClick={(e) => { e.stopPropagation(); setShowComments(true); }}
                                className="w-11 h-11 bg-white/10 backdrop-blur-3xl border border-white/10 rounded-full flex items-center justify-center text-white text-lg shadow-lg"
                            >
                                <FaComment />
                            </motion.button>
                            <span className="text-[10px] font-bold text-white drop-shadow-md">{commentsCount}</span>
                        </div>

                        <div className="flex flex-col items-center gap-1">
                            <div className="w-11 h-11 bg-white/10 backdrop-blur-3xl border border-white/10 rounded-full flex items-center justify-center text-white text-lg opacity-50">
                                <FaEye />
                            </div>
                            <span className="text-[10px] font-bold text-white drop-shadow-md">{viewsCount}</span>
                        </div>

                        <motion.button
                            whileTap={{ scale: 0.8 }}
                            onClick={handleShare}
                            className="w-11 h-11 bg-white/10 backdrop-blur-3xl border border-white/10 rounded-full flex items-center justify-center text-white text-lg shadow-lg"
                        >
                            <FaShare />
                        </motion.button>

                        {isVideo && (
                            <motion.button
                                whileTap={{ scale: 0.8 }}
                                onClick={(e) => { e.stopPropagation(); setGlobalMuted(!globalMuted); }}
                                className="w-11 h-11 bg-white/10 backdrop-blur-3xl border border-white/10 rounded-full flex items-center justify-center text-white text-lg shadow-lg"
                            >
                                {globalMuted ? <FaVolumeMute /> : <FaVolumeUp />}
                            </motion.button>
                        )}
                    </div>
                )}

                {/* ── BOTTOM OVERLAY GRADIENT ── */}
                <div className="absolute bottom-0 inset-x-0 h-64 bg-gradient-to-t from-black/90 via-black/40 to-transparent pt-32 pointer-events-none z-[50]" />

                {/* Info Overlay (Text Container) */}
                <div className="absolute bottom-0 inset-x-0 z-[60] p-5 flex flex-col justify-end pointer-events-none">
                    <div className="relative pb-6 pointer-events-auto">
                        {/* USER HUB */}
                        <div className="flex items-center gap-3 mb-3">
                            <Link to={`/public-profile/${editor?._id}`} onClick={(e) => e.stopPropagation()}>
                                <div className="w-10 h-10 rounded-full border-[1.5px] border-white overflow-hidden shadow-lg p-[1px] bg-white/10">
                                    <img src={repairUrl(editor?.profilePicture)} className="w-full h-full rounded-full object-cover" alt="" />
                                </div>
                            </Link>
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                    <Link to={`/public-profile/${editor?._id}`} onClick={(e) => e.stopPropagation()} className="font-bold text-white text-[14px] tracking-tight hover:underline text-shadow whitespace-nowrap">
                                        {editor?.name}
                                    </Link>
                                    <span className="px-1.5 py-0.5 bg-white/20 text-[8px] font-bold rounded border border-white/10 text-white/90 shrink-0">
                                        {(editor?.role || "editor").toUpperCase()}
                                    </span>
                                    
                                    {!isOwnContent && (
                                        <button
                                            onClick={handleFollow}
                                            className="h-5 px-3 bg-transparent border border-white/30 rounded-full flex items-center justify-center text-white text-[9px] font-bold uppercase tracking-wider active:scale-95 transition-all hover:bg-white/20 shadow-lg ml-1"
                                        >
                                            {isFollowing ? "Following" : "Follow"}
                                        </button>
                                    )}
                                </div>
                                
                                {isVideo && (
                                    <div className="mt-1">
                                        <MusicVisualizer isPlaying={isLoaded && isPlaying} />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* CONTENT */}
                        <div className="max-w-[85%] mb-3">
                            <h2 className="text-xl font-bold text-white leading-tight mb-0.5 text-shadow">{reel.title}</h2>
                            <div className="flex flex-wrap items-baseline gap-1">
                                <p className="text-[12px] font-medium text-white/70 leading-relaxed line-clamp-2 text-shadow inline">
                                    {reel.description}
                                </p>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setShowComments(true); }}
                                    className="text-[12px] font-bold text-white/80 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
                                >
                                    more...
                                </button>
                            </div>
                        </div>

                        {/* PROGRESS */}
                        {isVideo && (
                            <div className="w-full h-[2px] bg-white/10 rounded-full overflow-hidden">
                                <motion.div style={{ width: `${progress}%` }} className="h-full bg-white shadow-[0_0_5px_rgba(255,255,255,0.7)]" />
                            </div>
                        )}
                    </div>
                </div>

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

                {/* --- COMMENT SECTION DRAWER --- */}
                <AnimatePresence>
                    {showComments && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/40 z-[110]"
                                onClick={() => setShowComments(false)}
                            />
                            <ReelCommentsDrawer
                                reel={{ ...reel, _id: reel.reelId || reel._id }}
                                onClose={() => setShowComments(false)}
                                onCommentAdded={(newCount) => setCommentsCount(newCount)}
                                isEmbedded={true}
                            />
                        </>
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.div>
    );
};

export default ReelPreviewModal;
