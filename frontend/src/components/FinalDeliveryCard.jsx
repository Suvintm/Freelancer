/**
 * FinalDeliveryCard.jsx - Professional Final Delivery Card
 * 
 * Features:
 * - Real file quality details (resolution, size, duration, codec, fps, bitrate)
 * - 24-hour countdown timer with hours:minutes:seconds
 * - Aspect-ratio aware preview (16:9, 4:3, 1:1, etc.)
 * - Accept & Download button → redirects to high-quality download
 * - Professional corporate design with gradient accents
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  FaPlay,
  FaEye,
  FaCheck,
  FaDownload,
  FaFilm,
  FaImage,
  FaTrophy,
  FaClock,
  FaTimes,
  FaMusic,
  FaExpand,
  FaVideo,
} from "react-icons/fa";
import { 
  HiOutlineSparkles, 
  HiOutlineArrowDownTray, 
  HiOutlinePencilSquare,
  HiOutlineClock,
  HiOutlineInformationCircle,
} from "react-icons/hi2";
import { 
  BiVideo, 
  BiImage, 
  BiMusic,
  BiTime,
  BiData,
  BiCodeBlock,
} from "react-icons/bi";

// === Status Configuration ===
const STATUS_CONFIG = {
  pending: { 
    label: "Pending Review", 
    icon: HiOutlineClock,
    color: "text-amber-400", 
    bg: "bg-amber-500/20", 
    border: "border-amber-500/30",
  },
  previewed: { 
    label: "Previewed", 
    icon: FaEye,
    color: "text-blue-400", 
    bg: "bg-blue-500/20", 
    border: "border-blue-500/30",
  },
  accepted: { 
    label: "Approved", 
    icon: FaCheck,
    color: "text-emerald-400", 
    bg: "bg-emerald-500/20", 
    border: "border-emerald-500/30",
  },
  changes_requested: { 
    label: "Revision Needed", 
    icon: HiOutlinePencilSquare,
    color: "text-orange-400", 
    bg: "bg-orange-500/20", 
    border: "border-orange-500/30",
  },
  downloaded: { 
    label: "Completed", 
    icon: FaCheck,
    color: "text-emerald-400", 
    bg: "bg-emerald-500/20", 
    border: "border-emerald-500/30",
  },
  expired: { 
    label: "Expired", 
    icon: HiOutlineClock,
    color: "text-zinc-400", 
    bg: "bg-zinc-700/50", 
    border: "border-zinc-600/50",
  },
};

// === Format Utilities ===
const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const formatDuration = (seconds) => {
  if (!seconds) return null;
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const formatResolution = (width, height) => {
  if (!width || !height) return null;
  if (width >= 3840) return { label: "4K Ultra HD", detail: `${width}×${height}` };
  if (width >= 2560) return { label: "2K QHD", detail: `${width}×${height}` };
  if (width >= 1920) return { label: "Full HD", detail: `${width}×${height}` };
  if (width >= 1280) return { label: "HD", detail: `${width}×${height}` };
  if (width >= 854) return { label: "SD", detail: `${width}×${height}` };
  return { label: "Custom", detail: `${width}×${height}` };
};

const getAspectRatio = (width, height) => {
  if (!width || !height) return "16:9";
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

const getAspectClass = (aspectRatio) => {
  switch (aspectRatio) {
    case "16:9": return "aspect-video";
    case "4:3": return "aspect-[4/3]";
    case "1:1": return "aspect-square";
    case "9:16": return "aspect-[9/16]";
    default: return "aspect-video";
  }
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
  const [imageLoaded, setImageLoaded] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  if (!delivery) return null;

  // Determine file type
  const isVideo = delivery.mimeType?.startsWith("video/");
  const isImage = delivery.mimeType?.startsWith("image/");
  const isAudio = delivery.mimeType?.startsWith("audio/");
  
  const statusConfig = STATUS_CONFIG[delivery.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;
  const isCompleted = delivery.status === "downloaded";
  const isExpired = delivery.status === "expired" || delivery.isExpired;
  const isPending = delivery.status === "pending" || delivery.status === "previewed";

  // Calculate aspect ratio
  const aspectRatio = delivery.aspectRatio || getAspectRatio(delivery.width, delivery.height);
  const aspectClass = getAspectClass(aspectRatio);
  const resolution = formatResolution(delivery.width, delivery.height);

  // === 24-Hour Countdown Timer ===
  useEffect(() => {
    const targetDate = expiresAt || delivery.expiresAt;
    if (!targetDate || isExpired || !showTimer) {
      setTimeLeft(null);
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const expiry = new Date(targetDate);
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft(null);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ hours, mins, secs, total: diff });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, delivery.expiresAt, isExpired, showTimer]);

  // Handle Accept & Download
  const handleAcceptAndDownload = () => {
    // Get orderId from delivery object
    const orderId = delivery.orderId || delivery.order?._id || delivery.order;
    
    // Validate orderId before navigation
    if (!orderId || orderId === "undefined") {
      console.error("[FinalDeliveryCard] orderId is missing!", delivery);
      if (onAccept) {
        onAccept();
      }
      return;
    }
    
    if (onAccept) {
      onAccept();
    }
    
    // Navigate to download page with orderId
    navigate(`/download/${orderId}`, { 
      state: { delivery: { ...delivery, orderId } } 
    });
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="w-full max-w-sm"
      >
        {/* Gradient Border */}
        <div className={`p-[2px] rounded-2xl ${
          isCompleted 
            ? "bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500" 
            : isExpired
            ? "bg-zinc-700"
            : "bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500"
        }`}>
          <div className="bg-zinc-950 rounded-2xl overflow-hidden">
            
            {/* === Header === */}
            <div className="px-4 py-3 flex items-center justify-between border-b border-white/5 bg-black/30">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  isVideo ? "bg-purple-500/20" :
                  isImage ? "bg-blue-500/20" :
                  isAudio ? "bg-amber-500/20" :
                  "bg-violet-500/15"
                }`}>
                  {isVideo ? <BiVideo className="text-xl text-purple-400" /> :
                   isImage ? <BiImage className="text-xl text-blue-400" /> :
                   isAudio ? <BiMusic className="text-xl text-amber-400" /> :
                   <FaFilm className="text-lg text-violet-400" />}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-white font-semibold text-sm">Final Delivery</span>
                    <HiOutlineSparkles className={`w-4 h-4 ${isCompleted ? "text-emerald-400" : "text-violet-400"}`} />
                  </div>
                  <span className="text-[10px] text-zinc-500">
                    {isVideo ? "Video" : isImage ? "Image" : isAudio ? "Audio" : "File"} • 
                    {delivery.version ? ` v${delivery.version}` : ""} 
                  </span>
                </div>
              </div>
              
              {/* Status Badge */}
              <div className={`px-2.5 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1 ${statusConfig.bg} ${statusConfig.color} border ${statusConfig.border}`}>
                <StatusIcon className="text-xs" />
                {statusConfig.label}
              </div>
            </div>

            {/* === Preview with Correct Aspect Ratio === */}
            <div 
              className={`relative ${aspectClass} bg-zinc-900 cursor-pointer group overflow-hidden`}
              onClick={() => setShowPreviewModal(true)}
            >
              {delivery.thumbnailUrl ? (
                <>
                  {!imageLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
                      <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
                    </div>
                  )}
                  <img
                    src={delivery.thumbnailUrl}
                    alt="Preview"
                    className={`w-full h-full object-contain bg-black ${imageLoaded ? "opacity-100" : "opacity-0"} transition-opacity`}
                    onLoad={() => setImageLoaded(true)}
                  />
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
                  {isVideo ? <FaFilm className="text-4xl text-zinc-700" /> :
                   isImage ? <FaImage className="text-4xl text-zinc-700" /> :
                   <FaMusic className="text-4xl text-zinc-700" />}
                </div>
              )}
              
              {/* Play button overlay for video */}
              {isVideo && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-colors">
                  <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FaPlay className="text-white text-lg ml-1" />
                  </div>
                </div>
              )}

              {/* Watermark Badge */}
              <div className="absolute top-2 left-2 px-2.5 py-1 bg-black/70 backdrop-blur-sm rounded-lg text-amber-400 text-[10px] font-semibold flex items-center gap-1.5">
                <FaEye className="text-[9px]" />
                Preview (Watermarked)
              </div>

              {/* Duration Badge */}
              {(isVideo || isAudio) && delivery.duration && (
                <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 backdrop-blur-sm rounded-lg text-white text-xs font-mono">
                  {formatDuration(delivery.duration)}
                </div>
              )}

              {/* Aspect Ratio Badge */}
              <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 backdrop-blur-sm rounded-lg text-zinc-300 text-[10px] font-medium">
                {aspectRatio}
              </div>
            </div>

            {/* === File Quality Details Grid === */}
            <div className="p-3 space-y-3">
              {/* Filename */}
              <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2 border border-white/5">
                <span className="text-zinc-500 text-xs">📄</span>
                <span className="text-sm text-white font-medium truncate flex-1" title={delivery.fileName}>
                  {delivery.fileName || delivery.originalName || "Final Output"}
                </span>
              </div>

              {/* Technical Specs Grid */}
              <div className="grid grid-cols-2 gap-2">
                {/* Resolution */}
                {resolution && (
                  <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
                    <div className="flex items-center gap-1.5 mb-1">
                      <FaExpand className="text-[10px] text-indigo-400" />
                      <span className="text-[9px] text-zinc-500 uppercase tracking-wide">Quality</span>
                    </div>
                    <p className="text-xs font-bold text-white">{resolution.label}</p>
                    <p className="text-[10px] text-zinc-500">{resolution.detail}</p>
                  </div>
                )}

                {/* File Size */}
                <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <BiData className="text-xs text-blue-400" />
                    <span className="text-[9px] text-zinc-500 uppercase tracking-wide">Size</span>
                  </div>
                  <p className="text-xs font-bold text-white">{formatBytes(delivery.fileSize)}</p>
                  <p className="text-[10px] text-zinc-500">Original</p>
                </div>

                {/* Duration */}
                {delivery.duration && (
                  <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
                    <div className="flex items-center gap-1.5 mb-1">
                      <BiTime className="text-xs text-green-400" />
                      <span className="text-[9px] text-zinc-500 uppercase tracking-wide">Duration</span>
                    </div>
                    <p className="text-xs font-bold text-white">{formatDuration(delivery.duration)}</p>
                  </div>
                )}

                {/* Codec */}
                {delivery.codec && (
                  <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
                    <div className="flex items-center gap-1.5 mb-1">
                      <BiCodeBlock className="text-xs text-amber-400" />
                      <span className="text-[9px] text-zinc-500 uppercase tracking-wide">Codec</span>
                    </div>
                    <p className="text-xs font-bold text-white uppercase">{delivery.codec}</p>
                  </div>
                )}

                {/* Frame Rate */}
                {delivery.frameRate && (
                  <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
                    <div className="flex items-center gap-1.5 mb-1">
                      <FaVideo className="text-[10px] text-pink-400" />
                      <span className="text-[9px] text-zinc-500 uppercase tracking-wide">FPS</span>
                    </div>
                    <p className="text-xs font-bold text-white">{delivery.frameRate} fps</p>
                  </div>
                )}

                {/* Bitrate */}
                {delivery.bitrate && (
                  <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[10px] text-cyan-400">⚡</span>
                      <span className="text-[9px] text-zinc-500 uppercase tracking-wide">Bitrate</span>
                    </div>
                    <p className="text-xs font-bold text-white">
                      {delivery.bitrate > 1000 
                        ? `${(delivery.bitrate / 1000).toFixed(1)} Mbps` 
                        : `${delivery.bitrate} Kbps`}
                    </p>
                  </div>
                )}
              </div>

              {/* === 24-Hour Timer === */}
              {showTimer && timeLeft && !isExpired && !isCompleted && (
                <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                        <FaClock className="text-amber-400 text-sm" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-amber-300">Download Timer</p>
                        <p className="text-[10px] text-amber-400/70">File auto-expires</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-amber-400 font-mono tracking-wider">
                        {timeLeft.hours.toString().padStart(2, "0")}:
                        {timeLeft.mins.toString().padStart(2, "0")}:
                        {timeLeft.secs.toString().padStart(2, "0")}
                      </p>
                      <p className="text-[9px] text-amber-400/60">hrs : min : sec</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Quality Notice for Pending */}
              {isPending && isClient && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-2.5">
                  <div className="flex items-start gap-2">
                    <HiOutlineInformationCircle className="text-blue-400 text-sm flex-shrink-0 mt-0.5" />
                    <p className="text-[10px] text-blue-300 leading-relaxed">
                      <strong>Preview is watermarked.</strong> After accepting, you'll get the 
                      <strong className="text-blue-200"> original full-quality file</strong> with zero compression.
                    </p>
                  </div>
                </div>
              )}

              {/* Expired Notice */}
              {isExpired && (
                <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <HiOutlineClock className="text-zinc-400" />
                    <div>
                      <p className="text-xs text-zinc-400 font-medium">Download Expired</p>
                      <p className="text-[10px] text-zinc-500">The download window has ended.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* === Action Buttons === */}
              {isClient && isPending && !isExpired && (
                <div className="space-y-2">
                  {/* Preview Button */}
                  <button
                    onClick={onPreview}
                    className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all border border-white/10 hover:border-white/20"
                  >
                    <FaPlay className="text-xs" />
                    Preview with Watermark
                  </button>

                  {/* Accept & Download Button */}
                  <button
                    onClick={handleAcceptAndDownload}
                    className="w-full py-3 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 hover:from-emerald-600 hover:via-green-600 hover:to-teal-600 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30"
                  >
                    <HiOutlineArrowDownTray className="text-lg" />
                    Accept & Download Full Quality
                  </button>

                  {/* Request Changes */}
                  {delivery.status !== "changes_requested" && (
                    <button
                      onClick={onRequestChanges}
                      className="w-full py-2 text-orange-400 text-xs flex items-center justify-center gap-1.5 hover:bg-orange-500/10 rounded-xl transition-colors"
                    >
                      <HiOutlinePencilSquare className="text-sm" />
                      Request Changes
                    </button>
                  )}
                </div>
              )}

              {/* Editor View */}
              {!isClient && !isCompleted && !isExpired && (
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-xs text-zinc-400">
                    {isPending ? "⏳ Waiting for client review..." : ""}
                    {delivery.status === "changes_requested" ? "📝 Client requested changes" : ""}
                  </p>
                </div>
              )}

              {/* === Completed State === */}
              {isCompleted && (
                <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-xl p-4">
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                      <FaCheck className="text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <FaTrophy className="text-amber-400 text-sm" />
                        <span className="text-emerald-400 font-bold">Completed!</span>
                      </div>
                      <span className="text-zinc-500 text-xs">Payment released to editor</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* === Full Screen Preview Modal === */}
      <AnimatePresence>
        {showPreviewModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4"
            onClick={() => setShowPreviewModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-4xl max-h-[80vh] w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setShowPreviewModal(false)}
                className="absolute top-4 right-4 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              >
                <FaTimes />
              </button>

              {/* Preview content with correct aspect ratio */}
              <div className={`relative ${aspectClass} bg-black rounded-xl overflow-hidden`}>
                {delivery.thumbnailUrl ? (
                  <img
                    src={delivery.previewUrl || delivery.thumbnailUrl}
                    alt="Full Preview"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FaFilm className="text-6xl text-zinc-700" />
                  </div>
                )}
                
                {/* Watermark overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-white/20 text-4xl font-bold rotate-[-30deg]">
                    PREVIEW
                  </span>
                </div>
              </div>

              {/* File info below preview */}
              <div className="mt-4 text-center">
                <p className="text-white font-medium">{delivery.fileName || "Final Output"}</p>
                <p className="text-zinc-500 text-sm">
                  {resolution?.label} • {formatBytes(delivery.fileSize)} • {aspectRatio}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FinalDeliveryCard;
