/**
 * FinalDeliveryCard.jsx - Instagram Reels-Style (No Border, Natural Aspect)
 * 
 * Design: Video/Image shows at natural aspect ratio with no border/background
 * Details appear BELOW the media, not inside it
 */

import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  FaPlay,
  FaPause,
  FaEye,
  FaCheck,
  FaFilm,
  FaImage,
  FaClock,
  FaTimes,
  FaDownload,
  FaVolumeUp,
  FaVolumeMute,
} from "react-icons/fa";

// === Status Configuration ===
const STATUS_CONFIG = {
  pending: { label: "Waiting for review", color: "text-amber-500", dot: "bg-amber-500" },
  previewed: { label: "Previewed", color: "text-blue-500", dot: "bg-blue-500" },
  accepted: { label: "Approved", color: "text-emerald-500", dot: "bg-emerald-500" },
  changes_requested: { label: "Revision needed", color: "text-orange-500", dot: "bg-orange-500" },
  downloaded: { label: "Completed", color: "text-emerald-500", dot: "bg-emerald-500" },
  expired: { label: "Expired", color: "text-zinc-400", dot: "bg-zinc-400" },
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

  const aspectRatio = delivery?.aspectRatio || getAspectRatio(delivery?.width, delivery?.height);

  // Robust video detection - check mimeType OR file extension
  const videoExtensions = ['.mp4', '.mov', '.avi', '.webm', '.mkv', '.m4v'];
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
  const fileName = delivery?.fileName || delivery?.originalName || '';
  const fileExt = fileName.toLowerCase().slice(fileName.lastIndexOf('.'));
  
  const isVideo = delivery?.mimeType?.startsWith("video/") || videoExtensions.includes(fileExt);
  const isImage = delivery?.mimeType?.startsWith("image/") || imageExtensions.includes(fileExt);
  
  // Get video/image URL - check multiple possible fields
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
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[240px] no-copy"
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* Reel Media - No border, no background, natural aspect */}
        <div 
          className="relative rounded-xl overflow-hidden cursor-pointer group"
          onClick={() => {
            // Editors can always view, Clients use onPreview if provided
            if (isClient && onPreview) {
              onPreview();
            } else {
              setShowPreviewModal(true);
            }
          }}
        >
          {delivery.thumbnailUrl ? (
            <>
              {!imageLoaded && (
                <div className="w-full aspect-video bg-zinc-800 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                </div>
              )}
              <img
                src={delivery.thumbnailUrl}
                alt="Preview"
                className={`w-full h-auto rounded-xl no-copy ${imageLoaded ? "block" : "hidden"}`}
                onLoad={() => setImageLoaded(true)}
                draggable="false"
                onContextMenu={(e) => e.preventDefault()}
              />
            </>
          ) : (
            <div className="w-full aspect-video bg-zinc-800 rounded-xl flex items-center justify-center">
              {isVideo ? <FaFilm className="text-3xl text-zinc-600" /> : <FaImage className="text-3xl text-zinc-600" />}
            </div>
          )}
          
          {/* Play Button - Centered */}
          {isVideo && imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                <FaPlay className="text-white text-base ml-0.5" />
              </div>
            </div>
          )}

          {/* Reels Icon - Bottom Left */}
          <div className="absolute bottom-2 left-2 w-6 h-6 rounded bg-gradient-to-br from-[#833AB4] to-[#C13584] flex items-center justify-center">
            <FaFilm className="text-white text-[10px]" />
          </div>

          {/* Duration - Bottom Right */}
          {isVideo && delivery.duration && (
            <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/70 rounded text-white text-[10px] font-medium">
              {formatDuration(delivery.duration)}
            </div>
          )}

          {/* Completed Overlay */}
          {isCompleted && (
            <div className="absolute inset-0 bg-emerald-500/30 rounded-xl flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">
                <FaCheck className="text-white text-lg" />
              </div>
            </div>
          )}
        </div>

        {/* Details OUTSIDE/BELOW the reel */}
        <div className="mt-2 space-y-1">
          {/* Ratio, Size, Timer Row */}
          <div className="flex items-center gap-2 text-[10px]">
            <span className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-300 font-medium">{aspectRatio}</span>
            <span className="text-zinc-500">{formatBytes(delivery.fileSize)}</span>
            {timeLeft && !isCompleted && (
              <span className="text-amber-400 flex items-center gap-0.5 ml-auto">
                <FaClock className="text-[8px]" />
                {timeLeft.hours}h {timeLeft.mins}m
              </span>
            )}
          </div>

          {/* Status */}
          <div className="flex items-center gap-1">
            <div className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
            <span className={`text-[10px] ${statusConfig.color}`}>{statusConfig.label}</span>
          </div>

          {/* Action Buttons */}
          {isClient && isPending && !isExpired && (
            <div className="flex gap-1.5 pt-1">
              <button
                onClick={() => onPreview ? onPreview() : setShowPreviewModal(true)}
                className="flex-1 py-1.5 bg-zinc-800 text-white rounded-lg text-[10px] font-medium flex items-center justify-center gap-1 hover:bg-zinc-700"
              >
                <FaEye className="text-[9px]" /> Preview
              </button>
              <button
                onClick={handleAcceptAndDownload}
                className="flex-1 py-1.5 bg-emerald-500 text-white rounded-lg text-[10px] font-medium flex items-center justify-center gap-1 hover:bg-emerald-600"
              >
                <FaDownload className="text-[9px]" /> Accept
              </button>
            </div>
          )}

          {/* Request Changes */}
          {isClient && isPending && !isExpired && delivery.status !== "changes_requested" && (
            <button onClick={onRequestChanges} className="w-full text-[9px] text-orange-400 py-0.5">
              Request changes
            </button>
          )}

          {/* Editor Waiting */}
          {!isClient && isPending && !isCompleted && !isExpired && (
            <p className="text-[10px] text-zinc-500">⏳ Waiting for client review...</p>
          )}
        </div>
      </motion.div>

      {/* Preview Modal - Rendered via Portal at document.body for true fullscreen */}
      {ReactDOM.createPortal(
        <AnimatePresence>
          {showPreviewModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-[9999] flex flex-col no-copy"
              style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
              onContextMenu={(e) => e.preventDefault()}
            >
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 z-20 bg-gradient-to-b from-black/80 to-transparent">
              <div className="px-3 py-1.5 bg-zinc-800/80 backdrop-blur-sm rounded-full text-white text-[12px] font-medium">
                Media Preview
              </div>
              
              <button
                onClick={() => setShowPreviewModal(false)}
                className="w-9 h-9 bg-zinc-800/80 backdrop-blur-sm hover:bg-zinc-700 rounded-full flex items-center justify-center text-white transition"
              >
                <FaTimes className="text-base" />
              </button>
            </div>

            {/* Full Video/Image Container - Original Aspect Ratio */}
            <div 
              className="flex-1 flex items-center justify-center p-4"
              onClick={() => setShowPreviewModal(false)}
            >
              {isVideo && videoUrl ? (
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="max-w-full max-h-full object-contain rounded-lg select-none no-copy"
                  onClick={(e) => e.stopPropagation()}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  muted={isMuted}
                  playsInline
                  loop
                  onContextMenu={(e) => e.preventDefault()}
                  controlsList="nodownload"
                />
              ) : delivery.thumbnailUrl || videoUrl ? (
                <img 
                  src={videoUrl || delivery.thumbnailUrl} 
                  alt="Preview" 
                  className="max-w-full max-h-full object-contain rounded-lg select-none no-copy"
                  onClick={(e) => e.stopPropagation()}
                  draggable="false"
                  onContextMenu={(e) => e.preventDefault()}
                />
              ) : (
                <FaFilm className="text-6xl text-zinc-700" />
              )}
            </div>

            {/* Video Controls - Bottom Center */}
            {isVideo && videoUrl && (
              <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex items-center gap-3">
                {/* Play/Pause Button */}
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (videoRef.current) {
                      if (isPlaying) {
                        videoRef.current.pause();
                      } else {
                        try {
                          await videoRef.current.play();
                        } catch (err) {
                          // Ignore AbortError - happens when play is interrupted
                          if (err.name !== 'AbortError') {
                            console.error('Video play error:', err);
                          }
                        }
                      }
                    }
                  }}
                  className="w-12 h-12 bg-zinc-800/80 backdrop-blur-sm hover:bg-zinc-700 rounded-full flex items-center justify-center text-white transition"
                >
                  {isPlaying ? <FaPause className="text-lg" /> : <FaPlay className="text-lg ml-0.5" />}
                </button>
                
                {/* Volume Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMuted(!isMuted);
                    if (videoRef.current) {
                      videoRef.current.muted = !isMuted;
                    }
                  }}
                  className="w-12 h-12 bg-zinc-800/80 backdrop-blur-sm hover:bg-zinc-700 rounded-full flex items-center justify-center text-white transition"
                >
                  {isMuted ? <FaVolumeMute className="text-lg" /> : <FaVolumeUp className="text-lg" />}
                </button>
              </div>
            )}

            {/* Watermark Badge - Only for clients */}
            {isClient && (
              <div className="absolute bottom-20 left-4 px-3 py-1.5 bg-amber-500/20 border border-amber-500/30 rounded-full text-amber-400 text-[11px] font-medium flex items-center gap-1.5 backdrop-blur-sm">
                <FaEye className="text-[10px]" /> Watermarked Preview
              </div>
            )}

            {/* Bottom Info Bar */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/80 to-transparent">
              <div className="max-w-md mx-auto text-center">
                <p className="text-white font-medium">{delivery.fileName || "Final Output"}</p>
                <p className="text-zinc-400 text-sm mt-1">
                  {aspectRatio} • {formatBytes(delivery.fileSize)}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
      )}
    </>
  );
};

export default FinalDeliveryCard;
