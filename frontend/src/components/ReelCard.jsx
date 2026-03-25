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
import analyticsService from "../services/AnalyticsService";
import logo from "../assets/logo.png";
import { repairUrl, getPosterUrl } from "../utils/urlHelper.jsx";
import FollowingAnimation from "./FollowingAnimation";
import MusicVisualizer from "./MusicVisualizer";
import LikerAvatars from "./LikerAvatars";
import HlsVideoPlayer from "./HlsVideoPlayer";
import VideoQualitySelector from "./VideoQualitySelector";
import { useVideoQuality } from "../hooks/useVideoQuality";

/**
 * ReelCard — Minimalist Professional UI.
 * Tightened overlay, refined typography, and sleek follow button.
 */
const ReelCard = ({ reel, isActive, isPreloading, onCommentClick, globalMuted, setGlobalMuted }) => {
    const { user, backendURL } = useAppContext();

    const [isLiked, setIsLiked] = useState(user ? reel.likes?.includes(user._id) : false);
    const [likesCount, setLikesCount] = useState(reel.likesCount || 0);
    const [latestLikers, setLatestLikers] = useState(reel.latestLikers || []);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [showHeartAnimation, setShowHeartAnimation] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);
    const [showMuteIcon, setShowMuteIcon] = useState(false);
    const [showFollowAnimation, setShowFollowAnimation] = useState(false);
    const [currentQuality, setCurrentQuality] = useState("");
    const [availableQualities, setAvailableQualities] = useState([]);
    
    // Global Quality Hook
    const [preferredQuality, setPreferredQuality] = useVideoQuality();

    const isFirstRender = useRef(true);

    // — PERFORMANCE CONCEPT: Metadata Hydration Delay —
    // We delay the rendering of complex metadata until the reel is actually active.
    // This reduces the DOM weight and calculation load during the scroll phase.
    const [showMetadata, setShowMetadata] = useState(isActive);
    useEffect(() => {
        if (isActive) {
            setShowMetadata(true);
        } else {
            // Delay unmounting slightly to allow for smooth transition out
            const timer = setTimeout(() => setShowMetadata(false), 500);
            return () => clearTimeout(timer);
        }
    }, [isActive]);

    // Sync local state with props when reel changes
    useEffect(() => {
        setLikesCount(reel.likesCount || 0);
        setLatestLikers(reel.latestLikers || []);
        setIsLiked(user ? reel.likes?.includes(user._id) : false);
    }, [reel, user]);

    // Show mute icon only when globalMuted changes AFTER initial render
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        setShowMuteIcon(true);
        const timer = setTimeout(() => setShowMuteIcon(false), 800);
        return () => clearTimeout(timer);
    }, [globalMuted]);

    const videoRef = useRef(null);
    const progressTimerRef = useRef(null);
    const watchStartRef = useRef(null);

    useEffect(() => {
        if (!user || user._id === reel.editor?._id) return;
        axios.get(`${backendURL}/api/users/follow/status/${reel.editor?._id}`, {
            headers: { Authorization: `Bearer ${user.token}` },
        }).then((res) => setIsFollowing(res.data.isFollowing)).catch(() => {});
    }, [user, reel.editor?._id, backendURL]);

    const sendWatchTime = useCallback(() => {
        if (!watchStartRef.current || !user) return;
        const elapsed = Math.round((Date.now() - watchStartRef.current) / 1000);
        const duration = videoRef.current?.duration || 0;
        const pct = duration ? Math.round((videoRef.current.currentTime / duration) * 100) : 0;

        // — Batch watch completion signal (Product-Grade Efficiency) —
        if (elapsed >= 1) {
            analyticsService.pushEvent({
                reelId: reel._id,
                seconds: elapsed,
                watchPercent: pct,
                type: 'watch'
            });
        }

        // — Batch skip signal (negative signal) —
        if (elapsed < 2 && reel.mediaType === 'video') {
            analyticsService.pushEvent({
                reelId: reel._id,
                seconds: elapsed,
                watchPercent: 0,
                type: 'skip'
            });
        }

        watchStartRef.current = null;
    }, [user, reel._id, reel.mediaType]);

    useEffect(() => {
        if (!videoRef.current || reel.mediaType !== "video") return;
        if (isActive) {
            videoRef.current.muted = globalMuted;
        } else {
            sendWatchTime();
            // Reset for when we scroll back
            videoRef.current.currentTime = 0;
            setIsPlaying(false);
            setProgress(0);
        }
    }, [isActive, globalMuted, reel.mediaType, sendWatchTime]);

    useEffect(() => {
        if (videoRef.current) videoRef.current.muted = globalMuted;
    }, [globalMuted]);

    useEffect(() => {
        if (!isActive) return;
        progressTimerRef.current = setInterval(() => {
            if (videoRef.current?.duration) {
                setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
            }
        }, 100);
        return () => clearInterval(progressTimerRef.current);
    }, [isActive]);

    useEffect(() => () => sendWatchTime(), [sendWatchTime]);

    const handleLike = async () => {
        if (!user) return toast.error("Please login to like");
        const newIsLiked = !isLiked;
        setIsLiked(newIsLiked);
        setLikesCount(prev => newIsLiked ? prev + 1 : prev - 1);
        
        if (newIsLiked) {
            setLatestLikers(prev => {
                const alreadyIn = prev.some(l => l._id === user._id);
                if (alreadyIn) return prev;
                return [...prev, { _id: user._id, name: user.name, profilePicture: user.profilePicture }].slice(-3);
            });
            setShowHeartAnimation(true);
        } else {
            setLatestLikers(prev => prev.filter(l => l._id !== user._id));
        }

        setTimeout(() => setShowHeartAnimation(false), 900);
        try {
            await axios.post(`${backendURL}/api/reels/${reel._id}/like`, {}, { headers: { Authorization: `Bearer ${user.token}` } });
        } catch {
            setIsLiked(!newIsLiked);
            setLikesCount(prev => !newIsLiked ? prev + 1 : prev - 1);
            // Revert latestLikers if needed (complex for optimistic, keeping it simple)
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
            await axios.post(`${backendURL}/api/user/follow/${reel.editor?._id}`, {}, { headers: { Authorization: `Bearer ${user.token}` } });
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

    if (!reel) return null;
    const isOwnReel = user?._id === reel.editor?._id;

    return (
        <div 
            className="h-full aspect-[9/16] max-w-full bg-black relative flex items-center justify-center overflow-hidden mx-auto shadow-[0_0_100px_rgba(0,0,0,0.5)]"
            style={{ 
                willChange: "transform, opacity", 
                transform: "translateZ(0)" 
            }}
        >
            <div 
                className="absolute inset-0 cursor-pointer" 
                onClick={(e) => { e.stopPropagation(); setGlobalMuted(!globalMuted); }}
                onMouseDown={() => { if (videoRef.current) { videoRef.current.pause(); setIsPlaying(false); } }}
                onMouseUp={() => { if (videoRef.current) { videoRef.current.play(); setIsPlaying(true); } }}
                onTouchStart={() => { if (videoRef.current) { videoRef.current.pause(); setIsPlaying(false); } }}
                onTouchEnd={() => { if (videoRef.current) { videoRef.current.play(); setIsPlaying(true); } }}
                onContextMenu={(e) => e.preventDefault()}
            >
                {reel.mediaType === "video" ? (
                    <HlsVideoPlayer 
                        ref={videoRef} 
                        src={repairUrl(reel.mediaUrl)} 
                        poster={getPosterUrl(reel.mediaUrl)}
                        className="w-full h-full" 
                        objectFit="contain"
                        loop 
                        autoPlay={isActive}
                        isActive={isActive || isPreloading}
                        isPreloading={isPreloading && !isActive} // Only strictly true if it's strictly preloading
                        muted={globalMuted}
                        onPlaying={() => {
                            setIsPlaying(true);
                            if (!watchStartRef.current) watchStartRef.current = Date.now();
                        }}
                        onPause={() => setIsPlaying(false)}
                        onQualityChange={setCurrentQuality}
                        onAvailableQualities={setAvailableQualities}
                        preferredQuality={preferredQuality}
                    />
                ) : (
                    <img 
                        src={repairUrl(reel.mediaUrl)} 
                        className="w-full h-full object-contain" 
                        alt="" 
                        crossOrigin="anonymous"
                    />
                )}
            {/* Mute/Unmute Indicator Overlay */}
            <AnimatePresence>
                {showMuteIcon && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        className="absolute inset-0 flex items-center justify-center pointer-events-none z-50"
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

            {/* Interactive Video Quality Menu */}
            {reel.mediaType === "video" && (
                <VideoQualitySelector 
                    currentQuality={currentQuality}
                    availableQualities={availableQualities}
                    preferredQuality={preferredQuality}
                    setPreferredQuality={setPreferredQuality}
                    onMenuOpen={() => { if (videoRef.current) videoRef.current.pause(); }}
                    onMenuClose={() => { if (videoRef.current) videoRef.current.play(); }}
                />
            )}
            </div>

            {/* SIDEBAR (Only visible when active or nearly settled) */}
            <AnimatePresence>
                {showMetadata && (
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3 }}
                        className="absolute right-3 bottom-24 z-50 flex flex-col items-center gap-5"
                    >
                        {[
                            { icon: isLiked ? <FaHeart className="text-red-500" /> : <FaRegHeart />, count: likesCount, action: handleLike },
                            { icon: <FaComment />, count: reel.commentsCount || 0, action: () => onCommentClick(reel._id) },
                            { icon: <FaEye />, count: reel.viewsCount || 0, disabled: true },
                            { icon: <FaShare />, action: () => { const url = `${window.location.origin}/reels?id=${reel._id}`; if(navigator.share) navigator.share({url}); else {navigator.clipboard.writeText(url); toast.success("Copied!");} } }
                        ].map((item, idx) => (
                            <div key={idx} className="flex flex-col items-center gap-1">
                                <motion.button
                                    whileTap={{ scale: 0.8 }}
                                    onClick={(e) => { e.stopPropagation(); !item.disabled && item.action(); }}
                                    className={`w-11 h-11 bg-white/10 backdrop-blur-3xl border border-white/10 rounded-full flex items-center justify-center text-white text-lg ${item.disabled ? "opacity-50" : "shadow-lg"}`}
                                >
                                    {item.icon}
                                </motion.button>
                                {item.count !== undefined && <span className="text-[10px] font-bold text-white drop-shadow-md">{item.count}</span>}
                            </div>
                        ))}
                        
                        {reel.mediaType === "video" && (
                            <motion.button
                                whileTap={{ scale: 0.8 }}
                                onClick={(e) => { e.stopPropagation(); setGlobalMuted(!globalMuted); }}
                                className="w-11 h-11 bg-white/10 backdrop-blur-3xl border border-white/10 rounded-full flex items-center justify-center text-white"
                            >
                                {globalMuted ? <FaVolumeMute size={16} /> : <FaVolumeUp size={16} />}
                            </motion.button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* OVERLAY CONTENT (Deferred hydration for performance) */}
            <div className="absolute inset-0 z-40 p-5 flex flex-col justify-between pointer-events-none">
                {/* TOP HEADER */}
                <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-2">
                        <img src={logo} className="w-6 h-6 object-contain" alt="SuviX" />
                        <span className="text-white font-normal text-[12px] tracking-widest uppercase text-shadow">
                            SuviX Reels
                        </span>
                    </div>
                    
                    {/* NEW Badge - Centered under "SuviX Reels" text */}
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

                {/* BOTTOM INFO (Deferred hydration for performance) */}
                <AnimatePresence>
                    {showMetadata && (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            transition={{ duration: 0.3 }}
                            className="w-full mt-auto"
                        >
                            <div className="absolute bottom-0 inset-x-0 h-64 bg-gradient-to-t from-black/90 via-black/40 to-transparent pt-32 pointer-events-none" />

                            <div className="relative pb-6 pointer-events-auto">
                                {/* WHO LIKED (Latest Likers) */}
                                <LikerAvatars 
                                    latestLikers={latestLikers} 
                                    likesCount={likesCount} 
                                />

                                {/* USER HUB */}
                                <div className="flex items-center gap-3 mb-3">
                                    <Link to={`/public-profile/${reel.editor?._id}`} onClick={(e) => e.stopPropagation()}>
                                        <div className="w-10 h-10 rounded-full border-[1.5px] border-white overflow-hidden shadow-lg p-[1px] bg-white/10">
                                            <img src={repairUrl(reel.editor?.profilePicture)} className="w-full h-full rounded-full object-cover" alt="" />
                                        </div>
                                    </Link>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <Link to={`/public-profile/${reel.editor?._id}`} onClick={(e) => e.stopPropagation()} className="font-bold text-white text-[14px] tracking-tight hover:underline text-shadow whitespace-nowrap">
                                                {reel.editor?.name}
                                            </Link>
                                            <span className="px-1.5 py-0.5 bg-white/20 text-[8px] font-bold rounded border border-white/10 text-white/90 shrink-0">
                                                {(reel.editor?.role || "editor").toUpperCase()}
                                            </span>
                                            
                                            {!isOwnReel && (
                                                <button
                                                    onClick={handleFollow}
                                                    className="h-5 px-3 bg-transparent border border-white/30 rounded-full flex items-center justify-center text-white text-[9px] font-bold uppercase tracking-wider active:scale-95 transition-all hover:bg-white/20 shadow-lg ml-1"
                                                >
                                                    {isFollowing ? "Following" : "Follow"}
                                                </button>
                                            )}
                                        </div>
                                        
                                        {reel.mediaType === "video" && (
                                            <div className="mt-1">
                                                <MusicVisualizer isPlaying={isActive && isPlaying} />
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
                                            onClick={(e) => { e.stopPropagation(); onCommentClick(reel._id); }}
                                            className="text-[12px] font-bold text-white/80 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
                                        >
                                            more...
                                        </button>
                                    </div>
                                </div>

                                {/* PROGRESS */}
                                {reel.mediaType === "video" && (
                                    <div className="w-full h-[2px] bg-white/10 rounded-full overflow-hidden">
                                        <motion.div style={{ width: `${progress}%` }} className="h-full bg-white shadow-[0_0_5px_rgba(255,255,255,0.7)]" />
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* WATERMARK */}
            <div className="absolute bottom-3 right-4 flex items-center gap-1 opacity-20 pointer-events-none grayscale invert scale-75 origin-right">
                <img src={logo} className="w-4 h-4" alt="" />
                <span className="text-white font-black text-[8px] tracking-widest uppercase">SuviX</span>
            </div>

            <AnimatePresence>
                {showHeartAnimation && (
                    <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1.1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="absolute inset-0 flex items-center justify-center pointer-events-none z-[60]">
                        <FaHeart className="text-white text-7xl drop-shadow-2xl opacity-60" />
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showFollowAnimation && (
                    <FollowingAnimation onComplete={() => setShowFollowAnimation(false)} />
                )}
            </AnimatePresence>
        </div>
    );
};

export default React.memo(ReelCard);
