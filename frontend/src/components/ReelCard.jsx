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
 * ReelCard — Minimalist Professional UI.
 * Tightened overlay, refined typography, and sleek follow button.
 */
const ReelCard = ({ reel, isActive, onCommentClick, globalMuted, setGlobalMuted }) => {
    const { user, backendURL } = useAppContext();

    // ✅ Repair mangled URLs from backend sanitization
    const repairUrl = (url) => {
        if (!url || typeof url !== "string") return url;
        if (!url.includes("cloudinary") && !url.includes("res_") && !url.includes("_com")) return url;
      
        let fixed = url;
        fixed = fixed.replace(/^(https?):?\/*_+/gi, "$1://");
        fixed = fixed.replace(/_+res_+cloudinary_+com/g, "res.cloudinary.com")
                     .replace(/res_cloudinary_com/g, "res.cloudinary.com")
                     .replace(/cloudinary_com/g, "cloudinary.com");
    
        if (fixed.includes("res.cloudinary.com")) {
            fixed = fixed.replace(/res\.cloudinary\.com_+/g, "res.cloudinary.com/");
            fixed = fixed.replace(/image_upload_+/g, "image/upload/")
                         .replace(/video_upload_+/g, "video/upload/")
                         .replace(/raw_upload_+/g, "raw/upload/");
            fixed = fixed.replace(/([\/_]?v\d+)_+/g, "$1/"); 
            fixed = fixed.replace(/(res\.cloudinary\.com\/[^\/_]+)_+(image|video|raw|authenticated)_*/g, "$1/$2/");
            fixed = fixed.replace(/_([a-z0-9\-_]+\.(webp|jpg|jpeg|png|mp4|mov|m4v|json))/gi, "/$1");
            fixed = fixed.replace(/([^:])\/\/+/g, "$1/");
        }
    
        fixed = fixed.replace(/_jpg([/_?#]|$)/gi, ".jpg$1")
                     .replace(/_jpeg([/_?#]|$)/gi, ".jpeg$1")
                     .replace(/_png([/_?#]|$)/gi, ".png$1")
                     .replace(/_mp4([/_?#]|$)/gi, ".mp4$1")
                     .replace(/_webp([/_?#]|$)/gi, ".webp$1");
    
        return fixed;
    };

    const [isLiked, setIsLiked] = useState(user ? reel.likes?.includes(user._id) : false);
    const [likesCount, setLikesCount] = useState(reel.likesCount || 0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [showHeartAnimation, setShowHeartAnimation] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);

    const videoRef = useRef(null);
    const progressTimerRef = useRef(null);
    const watchStartRef = useRef(null);

    useEffect(() => {
        if (!user || user._id === reel.editor?._id) return;
        axios.get(`${backendURL}/api/users/follow/status/${reel.editor?._id}`, {
            headers: { Authorization: `Bearer ${user.token}` },
        }).then((res) => setIsFollowing(res.data.isFollowing)).catch(() => {});
    }, [user, reel.editor?._id, backendURL]);

    useEffect(() => {
        if (!videoRef.current || reel.mediaType !== "video") return;
        if (isActive) {
            videoRef.current.muted = globalMuted;
            videoRef.current.play().then(() => {
                setIsPlaying(true);
                watchStartRef.current = Date.now();
            }).catch(() => setIsPlaying(false));
        } else {
            sendWatchTime();
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
            setIsPlaying(false);
            setProgress(0);
        }
    }, [isActive]);

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

    const sendWatchTime = useCallback(() => {
        if (!watchStartRef.current || !user) return;
        const elapsed = Math.round((Date.now() - watchStartRef.current) / 1000);
        if (elapsed < 1) return;
        const pct = videoRef.current?.duration ? Math.round((videoRef.current.currentTime / videoRef.current.duration) * 100) : 0;
        axios.post(`${backendURL}/api/reels/${reel._id}/watch-time`, { seconds: elapsed, watchPercent: pct }, { headers: { Authorization: `Bearer ${user.token}` } }).catch(() => {});
        watchStartRef.current = null;
    }, [user, reel._id, backendURL]);

    useEffect(() => () => sendWatchTime(), [sendWatchTime]);

    const handleLike = async () => {
        if (!user) return toast.error("Please login to like");
        const newIsLiked = !isLiked;
        setIsLiked(newIsLiked);
        setLikesCount(prev => newIsLiked ? prev + 1 : prev - 1);
        if (newIsLiked) setShowHeartAnimation(true);
        setTimeout(() => setShowHeartAnimation(false), 900);
        try {
            await axios.post(`${backendURL}/api/reels/${reel._id}/like`, {}, { headers: { Authorization: `Bearer ${user.token}` } });
        } catch {
            setIsLiked(!newIsLiked);
            setLikesCount(prev => !newIsLiked ? prev + 1 : prev - 1);
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
            await axios.post(`${backendURL}/api/users/follow/${reel.editor?._id}`, {}, { headers: { Authorization: `Bearer ${user.token}` } });
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
        <div className="w-full h-full bg-black relative flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 cursor-pointer" onClick={() => { if (videoRef.current) isPlaying ? videoRef.current.pause() : videoRef.current.play(); setIsPlaying(!isPlaying); }}>
                {reel.mediaType === "video" ? (
                    <video ref={videoRef} src={repairUrl(reel.mediaUrl)} className="w-full h-full object-cover" loop playsInline muted={globalMuted} />
                ) : (
                    <img src={repairUrl(reel.mediaUrl)} className="w-full h-full object-cover" alt="" />
                )}
            </div>

            <AnimatePresence>
                {!isPlaying && isActive && reel.mediaType === "video" && (
                    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
                        <div className="w-14 h-14 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10">
                            <FaPlay className="text-white text-xl ml-1" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── SIDEBAR (Polished & Small) ── */}
            <div className="absolute right-3 bottom-24 z-40 flex flex-col items-center gap-5">
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
            </div>

            {/* ── BOTTOM INFO (Tight & Minimal) ── */}
            <div className="absolute bottom-0 inset-x-0 z-40 pointer-events-none">
                <div className="absolute bottom-0 inset-x-0 h-64 bg-gradient-to-t from-black/90 via-black/40 to-transparent pt-32" />

                <div className="relative px-5 pb-6 pointer-events-auto">
                    {/* USER HUB */}
                    <div className="flex items-center gap-3 mb-3">
                        <Link to={`/public-profile/${reel.editor?._id}`} onClick={(e) => e.stopPropagation()}>
                            <div className="w-10 h-10 rounded-full border-[1.5px] border-white overflow-hidden shadow-lg p-[1px] bg-white/10">
                                <img src={repairUrl(reel.editor?.profilePicture)} className="w-full h-full rounded-full object-cover" alt="" />
                            </div>
                        </Link>
                        <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2">
                                <Link to={`/public-profile/${reel.editor?._id}`} onClick={(e) => e.stopPropagation()} className="font-bold text-white text-[14px] tracking-tight hover:underline">
                                    {reel.editor?.name}
                                </Link>
                                <span className="px-1.5 py-0.5 bg-white/20 text-[8px] font-bold rounded border border-white/10 text-white/90">EDITOR</span>
                            </div>
                            
                            {!isOwnReel && (
                                <button
                                    onClick={handleFollow}
                                    className="w-fit h-6 px-3 bg-transparent border border-white/40 rounded-full flex items-center justify-center text-white text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all hover:bg-white/10"
                                >
                                    {isFollowing ? "Following" : "Follow"}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* CONTENT */}
                    <div className="max-w-[85%] mb-3">
                        <h2 className="text-xl font-bold text-white leading-tight mb-0.5">{reel.title}</h2>
                        <p className="text-[12px] font-medium text-white/70 leading-relaxed line-clamp-2">{reel.description}</p>
                    </div>

                    {/* PROGRESS */}
                    {reel.mediaType === "video" && (
                        <div className="w-full h-[2px] bg-white/10 rounded-full overflow-hidden">
                            <motion.div style={{ width: `${progress}%` }} className="h-full bg-white shadow-[0_0_5px_rgba(255,255,255,0.7)]" />
                        </div>
                    )}
                </div>
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
        </div>
    );
};

export default ReelCard;
