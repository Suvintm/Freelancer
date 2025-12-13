// FinalDeliveryCard.jsx - Premium card for final delivery messages
import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FaPlay,
  FaEye,
  FaCheck,
  FaEdit,
  FaClock,
  FaDownload,
  FaFilm,
  FaImage,
} from "react-icons/fa";

const STATUS_CONFIG = {
  pending: { label: "Pending Review", color: "text-yellow-400", bg: "bg-yellow-500/20" },
  previewed: { label: "Previewed", color: "text-blue-400", bg: "bg-blue-500/20" },
  accepted: { label: "Accepted", color: "text-green-400", bg: "bg-green-500/20" },
  changes_requested: { label: "Changes Requested", color: "text-orange-400", bg: "bg-orange-500/20" },
  downloaded: { label: "Completed", color: "text-emerald-400", bg: "bg-emerald-500/20" },
};

const FinalDeliveryCard = ({ delivery, isClient, onPreview, onAccept, onRequestChanges }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  if (!delivery) return null;

  const isVideo = delivery.mimeType?.startsWith("video/");
  const isImage = delivery.mimeType?.startsWith("image/");
  const statusConfig = STATUS_CONFIG[delivery.status] || STATUS_CONFIG.pending;
  const previewsRemaining = (delivery.maxPreviews || 20) - (delivery.previewCount || 0);

  // Format file size
  const formatSize = (bytes) => {
    if (!bytes) return "Unknown";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  // Format duration
  const formatDuration = (seconds) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-sm"
    >
      {/* Premium gradient border */}
      <div className="p-[2px] rounded-2xl bg-gradient-to-r from-yellow-500 via-purple-500 to-pink-500">
        <div className="bg-[#0d0d0d] rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isVideo ? (
                  <FaFilm className="text-purple-400" />
                ) : (
                  <FaImage className="text-blue-400" />
                )}
                <span className="text-white font-bold text-sm">Final Delivery</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${statusConfig.bg} ${statusConfig.color}`}>
                {statusConfig.label}
              </span>
            </div>
          </div>

          {/* Thumbnail */}
          <div className="relative aspect-video bg-black">
            {delivery.thumbnailUrl && (
              <>
                {!imageLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                    <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                  </div>
                )}
                <img
                  src={delivery.thumbnailUrl}
                  alt="Preview"
                  className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
                  onLoad={() => setImageLoaded(true)}
                />
              </>
            )}
            
            {/* Play overlay for videos */}
            {isVideo && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <FaPlay className="text-white text-xl ml-1" />
                </div>
              </div>
            )}

            {/* Duration badge */}
            {delivery.duration && (
              <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 rounded text-white text-xs">
                {formatDuration(delivery.duration)}
              </div>
            )}

            {/* Watermark notice */}
            <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 rounded text-yellow-400 text-[10px] flex items-center gap-1">
              <FaEye className="text-[8px]" />
              Preview has watermark
            </div>
          </div>

          {/* Info */}
          <div className="p-4 space-y-3">
            {/* File info */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400 truncate max-w-[60%]">{delivery.fileName || "Final Video"}</span>
              <span className="text-gray-500">{formatSize(delivery.fileSize)}</span>
            </div>

            {/* Preview count (for client) */}
            {isClient && delivery.status !== "downloaded" && (
              <div className="flex items-center gap-2 text-xs">
                <FaClock className="text-gray-400" />
                <span className="text-gray-400">
                  {previewsRemaining > 0 
                    ? `${previewsRemaining} previews remaining`
                    : "No previews remaining"
                  }
                </span>
              </div>
            )}

            {/* Actions (Client only, not completed) */}
            {isClient && delivery.status !== "downloaded" && (
              <div className="space-y-2 pt-2">
                {/* Preview Button */}
                {previewsRemaining > 0 && (
                  <button
                    onClick={onPreview}
                    className="w-full py-2.5 bg-white/10 text-white rounded-xl flex items-center justify-center gap-2 hover:bg-white/20 transition"
                  >
                    <FaPlay className="text-sm" />
                    Preview ({delivery.previewCount || 0}/{delivery.maxPreviews || 20})
                  </button>
                )}

                {/* Accept & Download Button */}
                <button
                  onClick={onAccept}
                  className="w-full py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition"
                >
                  <FaDownload className="text-sm" />
                  Accept & Download
                </button>

                {/* Request Changes Button */}
                {delivery.status !== "changes_requested" && (
                  <button
                    onClick={onRequestChanges}
                    className="w-full py-2 text-orange-400 text-sm hover:text-orange-300 transition flex items-center justify-center gap-2"
                  >
                    <FaEdit className="text-xs" />
                    I Want Changes
                  </button>
                )}
              </div>
            )}

            {/* Editor view - just status */}
            {!isClient && (
              <div className="pt-2 text-center">
                {delivery.status === "downloaded" ? (
                  <div className="flex items-center justify-center gap-2 text-emerald-400">
                    <FaCheck />
                    <span>Delivery Accepted</span>
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">Waiting for client review...</p>
                )}
              </div>
            )}

            {/* Completed status */}
            {delivery.status === "downloaded" && (
              <div className="pt-2 border-t border-white/10">
                <div className="flex items-center justify-center gap-2 text-emerald-400">
                  <FaCheck className="text-lg" />
                  <span className="font-bold">Order Completed!</span>
                </div>
                <p className="text-gray-400 text-xs text-center mt-1">
                  Payment has been released
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default FinalDeliveryCard;
