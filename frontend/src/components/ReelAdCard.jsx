// ReelAdCard.jsx - Bottom-Focused Professional Ad UI
import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiXMark, HiArrowTopRightOnSquare, HiSpeakerWave, HiSpeakerXMark, HiCheckCircle } from "react-icons/hi2";
import { FaInstagram, FaGlobe, FaChevronRight, FaPlay } from "react-icons/fa";
import axios from "axios";
import { useAppContext } from "../context/AppContext";

/**
 * ReelAdCard - Redesigned based on user feedback.
 * Features a bottom-anchored black overlay with structured info layers.
 */
const ReelAdCard = ({ ad, onSkip }) => {
    const { backendURL } = useAppContext();
    const videoRef = useRef(null);
    const [canSkip, setCanSkip] = useState(false);
    const [skipCountdown, setSkipCountdown] = useState(3);
    const [viewed, setViewed] = useState(false);
    const [muted, setMuted] = useState(true);
    const [progress, setProgress] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);

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
        return fixed;
    };

    const repairedMediaUrl = useMemo(() => repairUrl(ad?.mediaUrl), [ad?.mediaUrl]);

    // Tracking
    useEffect(() => {
        if (!viewed && ad?._id) {
            axios.post(`${backendURL}/api/ads/${ad._id}/view`, { location: "reels_feed" }).catch(() => {});
            setViewed(true);
        }
    }, [ad?._id, backendURL, viewed]);

    // Skip timer
    useEffect(() => {
        if (skipCountdown <= 0) {
            setCanSkip(true);
            return;
        }
        const t = setTimeout(() => setSkipCountdown(s => s - 1), 1000);
        return () => clearTimeout(t);
    }, [skipCountdown]);

    // Progress bar for video
    useEffect(() => {
        if (ad.mediaType !== "video" || !videoRef.current) return;
        const updateProgress = () => {
            if (videoRef.current?.duration) {
                setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
            }
        };
        const v = videoRef.current;
        v.addEventListener("timeupdate", updateProgress);
        return () => v.removeEventListener("timeupdate", updateProgress);
    }, [ad.mediaType]);

    const handleCTA = (e) => {
        e.stopPropagation();
        if (ad?._id) {
            axios.post(`${backendURL}/api/ads/${ad._id}/click`).catch(() => {});
        }
        const url = ad.websiteUrl || ad.instagramUrl;
        if (url) window.open(url, "_blank");
    };

    const togglePlay = () => {
        if (!videoRef.current) return;
        if (isPlaying) videoRef.current.pause();
        else videoRef.current.play();
        setIsPlaying(!isPlaying);
    };

    if (!ad) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative w-full h-full bg-black overflow-hidden select-none"
            onClick={togglePlay}
        >
            {/* ── MEDIA LAYER ── */}
            <div className="absolute inset-0">
                {ad.mediaType === "video" ? (
                    <video
                        ref={videoRef}
                        src={repairedMediaUrl}
                        className="w-full h-full object-cover"
                        autoPlay
                        muted={muted}
                        loop
                        playsInline
                    />
                ) : (
                    <img 
                        src={repairedMediaUrl} 
                        alt={ad.title} 
                        className="w-full h-full object-cover" 
                    />
                )}
            </div>

            {/* ── TOP PROGRESS BAR (Very Thin, Non-Intrusive) ── */}
            <div className="absolute top-0 inset-x-0 z-50 h-[1.5px] bg-white/10">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: ad.mediaType === "video" ? `${progress}%` : "100%" }}
                    transition={{ duration: ad.mediaType === "video" ? 0.1 : 5, ease: "linear" }}
                    className="h-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                />
            </div>

            {/* ── MIDDLE-RIGHT SIDEBAR (Minimalist) ── */}
            <div className="absolute top-1/2 -translate-y-1/2 right-4 z-40 flex flex-col items-center gap-5">
                <AnimatePresence mode="wait">
                    {canSkip ? (
                        <motion.button
                            key="skip-ready"
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => { e.stopPropagation(); onSkip(); }}
                            className="
                                w-13 h-13 bg-white/10 backdrop-blur-2xl
                                border border-white/20 rounded-full
                                flex flex-col items-center justify-center
                                text-white shadow-xl transition-all
                            "
                        >
                            <HiXMark size={20} />
                            <span className="text-[8px] font-black uppercase tracking-tighter">Skip</span>
                        </motion.button>
                    ) : (
                        <motion.div
                            key="skip-wait"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="
                                w-13 h-13 bg-black/40 backdrop-blur-md
                                border border-white/10 rounded-full
                                flex items-center justify-center
                                text-white font-black text-sm
                            "
                        >
                            {skipCountdown}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Mute Button */}
                {ad.mediaType === "video" && (
                    <button
                        onClick={(e) => { e.stopPropagation(); setMuted(!muted); }}
                        className="w-11 h-11 bg-black/40 backdrop-blur-md rounded-full border border-white/10 flex items-center justify-center text-white"
                    >
                        {muted ? <HiSpeakerXMark size={18} /> : <HiSpeakerWave size={18} />}
                    </button>
                )}
            </div>

            {/* ── BOTTOM OVERLAY (The Core Design) ── */}
            <div className="absolute bottom-0 inset-x-0 z-40">
                {/* Gradient Gradient for legibility */}
                <div className="absolute bottom-0 inset-x-0 h-full bg-gradient-to-t from-black/95 via-black/80 to-transparent pt-32 pointer-events-none" />
                
                <div className="relative px-5 pb-8">
                    {/* Layer 1: Title & Company (ABOVE CTA) */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="mb-4"
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-white font-black text-xs uppercase tracking-[0.2em] opacity-50">
                                {ad.companyName || ad.advertiserName || "SuviX Partner"}
                            </span>
                            <HiCheckCircle className="text-blue-500 text-[10px]" />
                        </div>
                        <h2 className="text-2xl font-black text-white leading-tight tracking-tight drop-shadow-md">
                            {ad.title}
                        </h2>
                    </motion.div>

                    {/* Layer 2: White CTA Bar (THE HORIZONTAL BAR) */}
                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={handleCTA}
                        className="
                            w-full h-12 bg-white text-black 
                            rounded-lg font-black text-[14px] 
                            flex items-center justify-between px-6 
                            shadow-[0_10px_30px_rgba(0,0,0,0.5)]
                            mb-4 relative overflow-hidden group
                        "
                    >
                        <span className="flex items-center gap-2">
                            <FaGlobe className="text-xs opacity-40 group-hover:opacity-100 transition-opacity" />
                            {ad.ctaText || "Learn More"}
                        </span>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold opacity-40">VISIT NOW</span>
                            <FaChevronRight size={10} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                        
                        {/* Subtle gloss sweep */}
                        <div className="absolute inset-0 w-1/4 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12 -translate-x-full group-hover:animate-sweep-fast" />
                    </motion.button>

                    {/* Layer 3: Detailed Description (BELOW CTA) */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="mb-6"
                    >
                        <p className="text-[13px] font-medium text-white/70 leading-relaxed line-clamp-3 pr-2 shadow-sm">
                            {ad.longDescription || ad.description || ad.tagline}
                        </p>
                    </motion.div>

                    {/* Layer 4: Minimalist Social/Web Links */}
                    <div className="flex items-center gap-6 pt-2 border-t border-white/10 w-fit">
                        {ad.websiteUrl && (
                            <button onClick={handleCTA} className="text-white/30 hover:text-white transition-colors">
                                <FaGlobe size={16} />
                            </button>
                        )}
                        {ad.instagramUrl && (
                            <button onClick={(e) => { e.stopPropagation(); window.open(ad.instagramUrl, "_blank"); }} className="text-white/30 hover:text-pink-400 transition-colors">
                                <FaInstagram size={16} />
                            </button>
                        )}
                        <button 
                            onClick={(e) => { e.stopPropagation(); window.open(`/ad-details/${ad._id}`, "_blank"); }}
                            className="text-white/30 hover:text-blue-400 transition-colors"
                        >
                            <HiArrowTopRightOnSquare size={16} />
                        </button>
                        <div className="h-3 w-[1px] bg-white/10" />
                        <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] pt-0.5">
                            Ad Details
                        </span>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes sweep-fast {
                    0% { transform: translateX(-150%) skewX(-12deg); }
                    100% { transform: translateX(450%) skewX(-12deg); }
                }
                .group-hover\\:animate-sweep-fast {
                    animation: sweep-fast 0.6s ease-in-out forwards;
                }
            `}</style>
        </motion.div>
    );
};

export default ReelAdCard;
