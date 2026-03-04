// ReelAdCard.jsx - Slim & Professional "Low-Profile" Ad UI
import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiXMark, HiArrowTopRightOnSquare, HiSpeakerWave, HiSpeakerXMark, HiCheckCircle } from "react-icons/hi2";
import { FaInstagram, FaGlobe, FaChevronRight, FaPlay } from "react-icons/fa";
import axios from "axios";
import { useAppContext } from "../context/AppContext";
import logo from "../assets/logo.png";

/**
 * ReelAdCard - Slim Redesign.
 * Tightened overlay, lowered components for maximum media visibility.
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
    const [showMuteIcon, setShowMuteIcon] = useState(false);

    // Show mute icon when muted changes
    useEffect(() => {
        setShowMuteIcon(true);
        const timer = setTimeout(() => setShowMuteIcon(false), 800);
        return () => clearTimeout(timer);
    }, [muted]);

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
            fixed = fixed.replace(/([/_]?v\d+)_+/g, "$1/"); 
            fixed = fixed.replace(/(res\.cloudinary\.com\/[^/_]+)_+(image|video|raw|authenticated)_*/g, "$1/$2/");
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
        if (skipCountdown <= 0) { setCanSkip(true); return; }
        const t = setTimeout(() => setSkipCountdown(s => s - 1), 1000);
        return () => clearTimeout(t);
    }, [skipCountdown]);

    // Progress bar
    useEffect(() => {
        if (ad.mediaType !== "video" || !videoRef.current) return;
        const updateProgress = () => { if (videoRef.current?.duration) setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100); };
        const v = videoRef.current;
        v.addEventListener("timeupdate", updateProgress);
        return () => v.removeEventListener("timeupdate", updateProgress);
    }, [ad.mediaType]);

    const handleCTA = (e) => {
        e.stopPropagation();
        if (ad?._id) axios.post(`${backendURL}/api/ads/${ad._id}/click`).catch(() => {});
        const url = ad.websiteUrl || ad.instagramUrl;
        if (url) window.open(url, "_blank");
    };

    if (!ad) return null;

    return (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="relative w-full h-full bg-black overflow-hidden select-none" 
            onClick={(e) => { e.stopPropagation(); setMuted(!muted); }}
            onMouseDown={() => { if (videoRef.current) { videoRef.current.pause(); setIsPlaying(false); } }}
            onMouseUp={() => { if (videoRef.current) { videoRef.current.play(); setIsPlaying(true); } }}
            onTouchStart={() => { if (videoRef.current) { videoRef.current.pause(); setIsPlaying(false); } }}
            onTouchEnd={() => { if (videoRef.current) { videoRef.current.play(); setIsPlaying(true); } }}
            onContextMenu={(e) => e.preventDefault()}
        >
            {/* ── MEDIA LAYER ── */}
            <div className="absolute inset-0">
                {ad.mediaType === "video" ? (
                    <video 
                        ref={videoRef} 
                        src={repairedMediaUrl} 
                        className="w-full h-full object-contain" 
                        autoPlay 
                        muted={muted} 
                        loop 
                        playsInline 
                        controlsList="nodownload"
                    />
                ) : (
                    <img src={repairedMediaUrl} alt="" className="w-full h-full object-contain" />
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
                                {muted ? (
                                    <HiSpeakerXMark className="text-white text-2xl" />
                                ) : (
                                    <HiSpeakerWave className="text-white text-2xl" />
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── TOP PROGRESS BAR (Ultra Thin) ── */}
            <div className="absolute top-0 inset-x-0 z-50 h-[1.2px] bg-white/10">
                <motion.div initial={{ width: 0 }} animate={{ width: ad.mediaType === "video" ? `${progress}%` : "100%" }} transition={{ duration: ad.mediaType === "video" ? 0.1 : 5, ease: "linear" }} className="h-full bg-white shadow-[0_0_5px_rgba(255,255,255,0.7)]" />
            </div>

            {/* ── SIDE CONTROLS ── */}
            <div className="absolute top-1/2 -translate-y-1/2 right-3 z-40 flex flex-col items-center gap-4">
                <AnimatePresence mode="wait">
                    {canSkip ? (
                        <motion.button key="skip-ready" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} whileTap={{ scale: 0.9 }} onClick={(e) => { e.stopPropagation(); onSkip(); }} className="w-11 h-11 bg-white/10 backdrop-blur-3xl border border-white/20 rounded-full flex flex-col items-center justify-center text-white shadow-xl">
                            <HiXMark size={18} />
                            <span className="text-[7px] font-black uppercase tracking-tight">Skip</span>
                        </motion.button>
                    ) : (
                        <motion.div key="skip-wait" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-11 h-11 bg-black/40 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white font-black text-xs">{skipCountdown}</motion.div>
                    )}
                </AnimatePresence>

                {ad.mediaType === "video" && (
                    <button onClick={(e) => { e.stopPropagation(); setMuted(!muted); }} className="w-10 h-10 bg-black/40 backdrop-blur-md rounded-full border border-white/10 flex items-center justify-center text-white">
                        {muted ? <HiSpeakerXMark size={16} /> : <HiSpeakerWave size={16} />}
                    </button>
                )}
            </div>

            {/* ── TOP HEADER (Centered & Refined) ── */}
            <div className="absolute top-0 left-0 right-0 p-5 z-50 pointer-events-none flex flex-col items-center">
                <div className="flex items-center gap-2">
                    <img src={logo} className="w-6 h-6 object-contain" alt="SuviX" />
                    <span className="text-white font-normal text-[12px] tracking-widest uppercase text-shadow">
                        SuviX Reels
                    </span>
                </div>
            </div>

            {/* ── BOTTOM OVERLAY (The Slim Design) ── */}
            <div className="absolute bottom-0 inset-x-0 z-40">
                <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-black/90 via-black/40 to-transparent pt-16 pointer-events-none" />
                
                <div className="relative px-5 pb-6">
                    {/* ADVERTISEMENT SPECIAL CARD */}
                    <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5, type: "spring", stiffness: 100 }}
                        className="w-full bg-white px-4 py-2.5 rounded-lg mb-4 flex items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-white/20"
                    >
                        <motion.span 
                            animate={{ opacity: [0.7, 1, 0.7] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="text-black font-black text-[11px] uppercase tracking-[0.25em]"
                        >
                            Advertisement
                        </motion.span>
                    </motion.div>

                    {/* ADVERTISER HUB */}
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-white/60 font-black text-[9px] uppercase tracking-[0.2em]">{ad.companyName || ad.advertiserName || "Sponsored"}</span>
                        <HiCheckCircle className="text-blue-500 text-[9px]" />
                    </div>

                    {/* TITLE */}
                    <h2 className="text-xl font-bold text-white leading-tight tracking-tight drop-shadow-md mb-3">{ad.title}</h2>

                    {/* SLIM HORIZONTAL CTA */}
                    <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={handleCTA} className="w-full h-10 bg-white/10 backdrop-blur-md text-white border border-white/20 rounded font-black text-[13px] flex items-center justify-between px-5 shadow-lg mb-3 group relative overflow-hidden">
                        <span className="flex items-center gap-2">
                            <FaGlobe size={12} className="opacity-40" />
                            {ad.ctaText || "Learn More"}
                        </span>
                        <FaChevronRight size={10} className="group-hover:translate-x-1 transition-transform opacity-40" />
                        <div className="absolute inset-0 w-1/4 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:animate-sweep-fast" />
                    </motion.button>

                    {/* DESCRIPTION (Low Profile) */}
                    <p className="text-[12px] font-medium text-white/60 leading-relaxed line-clamp-2 pr-4 mb-4">{ad.tagline || ad.description}</p>

                    {/* LINKS FOOTER */}
                    <div className="flex items-center gap-5 pt-3 border-t border-white/5 w-fit">
                        {ad.websiteUrl && <button onClick={handleCTA} className="text-white/20 hover:text-white transition-colors"><FaGlobe size={14} /></button>}
                        {ad.instagramUrl && <button onClick={(e) => { e.stopPropagation(); window.open(ad.instagramUrl, "_blank"); }} className="text-white/20 hover:text-pink-400 transition-colors"><FaInstagram size={14} /></button>}
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
