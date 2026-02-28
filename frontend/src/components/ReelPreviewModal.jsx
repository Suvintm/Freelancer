import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineVideoCamera, HiOutlinePlay } from "react-icons/hi2";
import { repairUrl } from "../utils/urlHelper.jsx";

const ReelPreviewModal = ({ reel, onClose }) => {
    const videoRef = useRef(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.play().catch(err => console.log("Auto-play blocked:", err));
        }
    }, [isLoaded]);

    if (!reel) return null;

    const mediaUrl = repairUrl(reel.mediaUrl);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-8"
            onClick={onClose}
        >
            {/* Glassmorphic Overlay */}
            <motion.div 
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            />

            {/* Modal Content */}
            <motion.div
                initial={{ scale: 0.8, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative w-full max-w-[340px] aspect-[9/16] bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl border border-white/10"
                onClick={(e) => e.stopPropagation()}
            >
                {reel.mediaType === "video" ? (
                    <video
                        ref={videoRef}
                        src={mediaUrl}
                        className="w-full h-full object-cover"
                        loop
                        muted
                        playsInline
                        onLoadedData={() => setIsLoaded(true)}
                        crossOrigin="anonymous"
                    />
                ) : (
                    <img
                        src={mediaUrl}
                        alt={reel.title}
                        className="w-full h-full object-cover"
                        onLoad={() => setIsLoaded(true)}
                        crossOrigin="anonymous"
                    />
                )}

                {!isLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                            className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full"
                        />
                    </div>
                )}

                {/* Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                    <div className="flex items-center gap-3 mb-2">
                        <img 
                            src={reel.editor?.profilePicture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} 
                            className="w-8 h-8 rounded-full border border-white/20"
                            alt={reel.editor?.name}
                        />
                        <span className="text-white text-sm font-bold tracking-tight">{reel.editor?.name}</span>
                    </div>
                    <p className="text-white/90 text-xs line-clamp-2 leading-relaxed">
                        {reel.description || reel.title}
                    </p>
                </div>

                {/* Media Indicator */}
                <div className="absolute top-4 right-4 p-2 rounded-full bg-black/20 backdrop-blur-md">
                    {reel.mediaType === "video" ? (
                        <HiOutlineVideoCamera className="text-white text-sm" />
                    ) : (
                        <HiOutlinePlay className="text-white text-sm" />
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default ReelPreviewModal;
