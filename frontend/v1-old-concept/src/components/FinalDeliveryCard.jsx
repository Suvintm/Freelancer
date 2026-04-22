import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  FaPlay,
  FaPause,
  FaEye,
  FaCheck,
  FaCheckCircle,
  FaExclamationCircle,
  FaFilm,
  FaImage,
  FaClock,
  FaTimes,
  FaDownload,
  FaVolumeUp,
  FaVolumeMute,
  FaGem,
  FaStar,
} from "react-icons/fa";

// === Status Configuration ===
const STATUS_CONFIG = {
  pending: { label: "Client Review Pending", color: "text-amber-400", icon: FaClock, dot: "bg-amber-400/20" },
  previewed: { label: "Previewed", color: "text-blue-400", icon: FaEye, dot: "bg-blue-400/20" },
  accepted: { label: "Approved Delivery", color: "text-emerald-400", icon: FaCheckCircle, dot: "bg-emerald-400/20" },
  changes_requested: { label: "Revision Requested", color: "text-orange-400", icon: FaExclamationCircle, dot: "bg-orange-400/20" },
  downloaded: { label: "Project Completed", color: "text-emerald-400", icon: FaStar, dot: "bg-emerald-400/20" },
  expired: { label: "Delivery Expired", color: "text-zinc-500", icon: FaTimes, dot: "bg-zinc-800" },
};

// === Format Utilities ===
const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const formatDuration = (seconds) => {
  if (!seconds) return null;
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const getAspectRatio = (width, height) => {
  if (!width || !height) return null;
  const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(width, height);
  const ratioW = width / divisor;
  const ratioH = height / divisor;
  
  if (ratioW === 16 && ratioH === 9) return "16:9";
  if (ratioW === 4 && ratioH === 3) return "4:3";
  if (ratioW === 1 && ratioH === 1) return "1:1";
  if (ratioW === 9 && ratioH === 16) return "9:16";
  return `${ratioW}:${ratioH}`;
};

// === Main Component ===
const FinalDeliveryCard = ({ 
  delivery, 
  isClient, 
  onPreview, 
  onAccept, 
  onRequestChanges,
  expiresAt,
  showTimer = true,
}) => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Parse dimensions for dynamic aspect ratio
  const mediaWidth = delivery?.width || 1080;
  const mediaHeight = delivery?.height || 1920;
  const aspectRatioValue = mediaWidth / mediaHeight;
  const aspectRatioLabel = delivery?.aspectRatio || getAspectRatio(mediaWidth, mediaHeight);

  // Robust video detection
  const videoExtensions = ['.mp4', '.mov', '.avi', '.webm', '.mkv', '.m4v'];
  const fileName = delivery?.fileName || delivery?.originalName || 'Asset';
  const fileExt = fileName.toLowerCase().slice(fileName.lastIndexOf('.'));
  
  const isVideo = delivery?.mimeType?.startsWith("video/") || videoExtensions.includes(fileExt);
  const videoUrl = delivery?.previewUrl || delivery?.watermarkedUrl || delivery?.fileUrl || delivery?.url;
  
  const statusConfig = STATUS_CONFIG[delivery?.status] || STATUS_CONFIG.pending;
  const isCompleted = delivery?.status === "downloaded";
  const isExpired = delivery?.status === "expired" || delivery?.isExpired;
  const isPending = delivery?.status === "pending" || delivery?.status === "previewed";

  // Timer
  useEffect(() => {
    const targetDate = expiresAt || delivery?.expiresAt;
    if (!targetDate || isExpired || !showTimer) {
      setTimeLeft(null);
      return;
    }

    const updateTimer = () => {
      const diff = new Date(targetDate) - new Date();
      if (diff <= 0) { setTimeLeft(null); return; }
      setTimeLeft({ hours: Math.floor(diff / 3600000), mins: Math.floor((diff % 3600000) / 60000) });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [expiresAt, delivery?.expiresAt, isExpired, showTimer]);

  if (!delivery) return null;

  const handleAcceptAndDownload = () => {
    const orderId = delivery.orderId || delivery.order?._id || delivery.order;
    if (onAccept) onAccept();
    if (orderId && orderId !== "undefined") {
      navigate(`/download/${orderId}`, { state: { delivery: { ...delivery, orderId } } });
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[200px] sm:max-w-[280px] no-copy group/card relative"
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* ✨ Premium Outer Glow */}
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-blue-500/10 blur-xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-700 pointer-events-none" />

        {/* 🏆 Milestone Header - Special System Card Look */}
        <div className="relative z-10 bg-gradient-to-r from-emerald-500/10 to-transparent backdrop-blur-md rounded-t-2xl border-t border-x border-white/10 px-3 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaGem className="text-[10px] text-emerald-400 animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-[0.1em] text-emerald-400 shadow-emerald-500/50">Final Delivery</span>
          </div>
          <div className="flex items-center gap-1">
             <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[8px] text-zinc-400 font-medium">Verified Asset</span>
          </div>
        </div>

        {/* 🎥 Media Stage - True Natural Aspect Ratio */}
        <div 
          className="relative rounded-b-none overflow-hidden cursor-pointer bg-zinc-950 border-x border-white/10 group transition-all duration-500"
          onClick={() => isClient && onPreview ? onPreview() : setShowPreviewModal(true)}
          style={{
            aspectRatio: mediaWidth && mediaHeight ? `${mediaWidth}/${mediaHeight}` : "9/16",
            maxHeight: "60vh"
          }}
        >
          {delivery.thumbnailUrl ? (
            <div className="w-full h-full relative">
              {!imageLoaded && (
                <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                </div>
              )}
              <img
                src={delivery.thumbnailUrl}
                alt="Premium Delivery"
                className={`w-full h-full object-contain transition-all duration-700 bg-black group-hover:scale-105 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
                onLoad={() => setImageLoaded(true)}
                draggable="false"
              />
            </div>
          ) : (
            <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
              {isVideo ? <FaFilm className="text-4xl text-zinc-700" /> : <FaImage className="text-4xl text-zinc-700" />}
            </div>
          )}

          {/* Luxury Play Button Overlay */}
          {isVideo && imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-all duration-500">
              <motion.div 
                whileHover={{ scale: 1.1 }}
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white/5 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.5)] opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-emerald-500/80 flex items-center justify-center">
                  <FaPlay className="text-white text-xs sm:text-lg ml-1" />
                </div>
              </motion.div>
            </div>
          )}

          {/* Visual Specs Label - Bottom Right */}
          <div className="absolute bottom-3 right-3 px-2 py-0.5 bg-black/70 backdrop-blur-md rounded-md border border-white/5 text-[9px] font-mono text-zinc-400 flex items-center gap-2">
            {isVideo && delivery.duration && (
              <span className="text-white font-bold">{formatDuration(delivery.duration)}</span>
            )}
            <span className="text-emerald-500/80">{aspectRatioLabel}</span>
          </div>
          
          {/* Completion Seal */}
          {isCompleted && (
            <div className="absolute inset-0 bg-emerald-500/10 backdrop-blur-[2px] flex items-center justify-center">
              <div className="bg-emerald-500 text-white p-4 rounded-full shadow-[0_0_30px_rgba(16,185,129,0.5)] ring-4 ring-emerald-500/20">
                <FaCheck className="text-2xl" />
              </div>
            </div>
          )}
        </div>

        {/* ✨ Professional Detail Box - Ultra Premium Style */}
        <div className="relative z-10">
          <div className="backdrop-blur-3xl bg-white/5 border border-white/10 rounded-b-2xl p-4 shadow-2xl group-hover/card:border-emerald-500/30 transition-all duration-500">
            {/* Status Indicator */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className={`p-1.5 rounded-lg ${statusConfig.dot} border border-white/5`}>
                  <statusConfig.icon className={`text-xs ${statusConfig.color} ${isPending ? "animate-pulse" : ""}`} />
                </div>
                <div className="flex flex-col">
                  <span className={`text-[11px] font-black uppercase tracking-wider ${statusConfig.color}`}>
                    {statusConfig.label}
                  </span>
                  {isPending && (
                    <motion.span 
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="text-[8px] text-zinc-500 font-bold"
                    >
                      Unlocked After Approval
                    </motion.span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <span className="block text-[10px] text-white font-mono leading-none">{formatBytes(delivery.fileSize)}</span>
                <span className="text-[8px] text-zinc-500 uppercase tracking-tighter">{fileExt.replace('.','')} High Quality</span>
              </div>
            </div>

            {/* Action Buttons - Premium Design */}
            {isClient && isPending && !isExpired && (
              <div className="grid grid-cols-2 gap-3 mt-4">
                <button
                  onClick={() => onPreview ? onPreview() : setShowPreviewModal(true)}
                  className="py-3 bg-zinc-800/80 hover:bg-zinc-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all border border-white/10"
                >
                  <FaEye className="text-xs" /> Preview
                </button>
                <button
                  onClick={handleAcceptAndDownload}
                  className="py-3 bg-gradient-to-r from-emerald-600 to-green-500 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all border border-white/20 active:scale-95"
                >
                  <FaDownload className="text-xs" /> Approve
                </button>
              </div>
            )}

            {/* Revision Request */}
            {isClient && isPending && !isExpired && delivery.status !== "changes_requested" && (
              <button 
                onClick={onRequestChanges} 
                className="w-full mt-3 text-[9px] text-zinc-500 hover:text-orange-400 transition-colors py-1 flex items-center justify-center gap-2 font-bold uppercase tracking-tighter"
              >
                <FaExclamationCircle /> Request Revision
              </button>
            )}

            {/* Status Label for Editor */}
            {!isClient && isPending && !isCompleted && !isExpired && (
              <div className="mt-4 py-2.5 bg-zinc-900/50 rounded-xl border border-white/5 text-center">
                 <motion.p 
                   animate={{ opacity: [0.4, 0.8, 0.4] }}
                   transition={{ repeat: Infinity, duration: 2.5 }}
                   className="text-[9px] text-emerald-400/80 font-black uppercase tracking-widest"
                 >
                   Awaiting Client Review
                 </motion.p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Luxury Preview Modal */}
      {ReactDOM.createPortal(
        <AnimatePresence>
          {showPreviewModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/98 backdrop-blur-3xl z-[9999] flex flex-col no-copy overflow-hidden"
              onContextMenu={(e) => e.preventDefault()}
            >
              {/* Cinematic Watermark Background (Prevents screen recording theft) */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5 overflow-hidden select-none">
                <div className="flex flex-col gap-20 -rotate-12">
                   {[...Array(5)].map((_, i) => (
                     <div key={i} className="flex gap-40 whitespace-nowrap">
                       {[...Array(5)].map((_, j) => (
                         <span key={j} className="text-7xl font-black text-white uppercase tracking-[1em]">SUVIX PREVIEW</span>
                       ))}
                     </div>
                   ))}
                </div>
              </div>

              {/* Floating Glass Header */}
              <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-8 z-50 bg-gradient-to-b from-black/90 to-transparent">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.4)] border border-white/30">
                    <FaGem className="text-white text-xl" />
                  </div>
                  <div>
                    <h3 className="text-white font-black text-lg tracking-tight leading-tight">{delivery.fileName || "Final Output"}</h3>
                    <div className="flex items-center gap-3 text-zinc-500 text-[11px] font-bold uppercase tracking-widest">
                      <span className="text-emerald-400">{aspectRatioLabel}</span>
                      <span className="w-1 h-1 rounded-full bg-zinc-800" />
                      <span>{formatBytes(delivery.fileSize)}</span>
                      <span className="w-1 h-1 rounded-full bg-zinc-800" />
                      <span>{fileExt.replace('.','')} High Quality</span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="w-14 h-14 bg-white/5 hover:bg-white/10 backdrop-blur-2xl rounded-3xl flex items-center justify-center text-white transition-all border border-white/10 active:scale-90 shadow-2xl"
                >
                  <FaTimes className="text-2xl" />
                </button>
              </div>

              {/* Immersive Preview Stage */}
              <div 
                className="flex-1 flex items-center justify-center p-4 sm:p-20 relative z-10"
                onClick={() => setShowPreviewModal(false)}
              >
                {isVideo && videoUrl ? (
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    className="max-w-full max-h-full object-contain rounded-3xl shadow-[0_0_150px_rgba(0,0,0,1)] ring-1 ring-white/10"
                    onClick={(e) => e.stopPropagation()}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    muted={isMuted}
                    playsInline
                    loop
                    controls
                    controlsList="nodownload"
                  />
                ) : delivery.thumbnailUrl || videoUrl ? (
                  <img 
                    src={videoUrl || delivery.thumbnailUrl} 
                    alt="Premium Delivery Preview" 
                    className="max-w-full max-h-full object-contain rounded-3xl shadow-[0_0_150px_rgba(0,0,0,1)] ring-1 ring-white/10 cursor-default"
                    onClick={(e) => e.stopPropagation()}
                    draggable="false"
                  />
                ) : (
                  <div className="text-center bg-zinc-900 p-20 rounded-[40px] border border-white/5 shadow-2xl">
                    <FaFilm className="text-8xl text-zinc-800 mb-6 mx-auto animate-pulse" />
                    <p className="text-emerald-500/50 text-sm font-black uppercase tracking-widest italic">Preparing Premium View...</p>
                  </div>
                )}
              </div>

              {/* Luxury Floating Status Banner */}
              {isClient && isPending && (
                <motion.div 
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="absolute bottom-12 left-1/2 -translate-x-1/2 px-8 py-4 bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-3xl rounded-[28px] flex items-center gap-4 shadow-[0_20px_60px_rgba(0,0,0,0.5)] z-50"
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center animate-pulse">
                    <FaEye className="text-emerald-400 text-sm" />
                  </div>
                  <div className="text-left pr-4">
                    <p className="text-emerald-400 text-xs font-black uppercase tracking-widest">Watermarked Preview Only</p>
                    <p className="text-zinc-500 text-[10px] font-bold">Unlocks original 4K/Full-Res asset after approval</p>
                  </div>
                  <div className="w-px h-8 bg-emerald-500/10" />
                  <button 
                    onClick={() => {
                        setShowPreviewModal(false);
                        handleAcceptAndDownload();
                    }}
                    className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-white text-[11px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95"
                  >
                    Accept Project
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default FinalDeliveryCard;
