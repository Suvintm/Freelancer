// FinalDeliveryCard.jsx - Compact premium card for final delivery messages
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaPlay,
  FaEye,
  FaCheck,
  FaEdit,
  FaDownload,
  FaFilm,
  FaImage,
  FaTrophy,
  FaCheckCircle,
} from "react-icons/fa";
import { HiOutlineSparkles, HiOutlineArrowDownTray, HiOutlinePencilSquare } from "react-icons/hi2";

const STATUS_CONFIG = {
  pending: { label: "Pending", color: "text-amber-400", bg: "bg-amber-500/20", border: "border-amber-500/30" },
  previewed: { label: "Previewed", color: "text-blue-400", bg: "bg-blue-500/20", border: "border-blue-500/30" },
  accepted: { label: "Accepted", color: "text-green-400", bg: "bg-green-500/20", border: "border-green-500/30" },
  changes_requested: { label: "Changes", color: "text-orange-400", bg: "bg-orange-500/20", border: "border-orange-500/30" },
  downloaded: { label: "Completed", color: "text-emerald-400", bg: "bg-emerald-500/20", border: "border-emerald-500/30" },
};

const FinalDeliveryCard = ({ delivery, isClient, onPreview, onAccept, onRequestChanges }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  if (!delivery) return null;

  const isVideo = delivery.mimeType?.startsWith("video/");
  const statusConfig = STATUS_CONFIG[delivery.status] || STATUS_CONFIG.pending;
  const previewsRemaining = (delivery.maxPreviews || 20) - (delivery.previewCount || 0);
  const isCompleted = delivery.status === "downloaded";

  const formatSize = (bytes) => {
    if (!bytes) return "";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

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
      className="w-full max-w-xs"
    >
      {/* Gradient border */}
      <div className={`p-[1.5px] rounded-2xl ${isCompleted ? "bg-gradient-to-r from-emerald-500 to-teal-500" : "bg-gradient-to-r from-violet-500 to-fuchsia-500"}`}>
        <div className="bg-zinc-900 light:bg-white rounded-2xl overflow-hidden">
          
          {/* Compact Header */}
          <div className="px-3 py-2.5 flex items-center justify-between border-b border-zinc-800 light:border-zinc-200">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${isCompleted ? "bg-emerald-500/15" : "bg-violet-500/15"}`}>
                {isVideo ? (
                  <FaFilm className={`w-3.5 h-3.5 ${isCompleted ? "text-emerald-400" : "text-violet-400"}`} />
                ) : (
                  <FaImage className={`w-3.5 h-3.5 ${isCompleted ? "text-emerald-400" : "text-violet-400"}`} />
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-white light:text-zinc-900 font-semibold text-sm">Final Delivery</span>
                <HiOutlineSparkles className={`w-3.5 h-3.5 ${isCompleted ? "text-emerald-400" : "text-violet-400"}`} />
              </div>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusConfig.bg} ${statusConfig.color} border ${statusConfig.border}`}>
              {statusConfig.label}
            </span>
          </div>

          {/* Compact Thumbnail */}
          <div className="relative aspect-[16/9] bg-zinc-950 light:bg-zinc-100">
            {delivery.thumbnailUrl && (
              <>
                {!imageLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
                  </div>
                )}
                <img
                  src={delivery.thumbnailUrl}
                  alt="Preview"
                  className={`w-full h-full object-cover ${imageLoaded ? "opacity-100" : "opacity-0"}`}
                  onLoad={() => setImageLoaded(true)}
                />
              </>
            )}
            
            {/* Play overlay */}
            {isVideo && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <div className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center">
                  <FaPlay className="text-white text-sm ml-0.5" />
                </div>
              </div>
            )}

            {/* Badges */}
            <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 rounded text-amber-400 text-[9px] flex items-center gap-1">
              <FaEye className="text-[8px]" /> Watermarked
            </div>
            
            {delivery.duration && (
              <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/60 rounded text-white text-[10px] font-mono">
                {formatDuration(delivery.duration)}
              </div>
            )}
          </div>

          {/* Compact Info & Actions */}
          <div className="p-3 space-y-2.5">
            {/* File info */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400 light:text-zinc-500 truncate max-w-[65%]">{delivery.fileName || "Final Output"}</span>
              <span className="text-zinc-500 light:text-zinc-400 font-mono text-[10px]">{formatSize(delivery.fileSize)}</span>
            </div>

            {/* Actions (Client only, not completed) */}
            {isClient && !isCompleted && (
              <div className="flex gap-2">
                {previewsRemaining > 0 && (
                  <button
                    onClick={onPreview}
                    className="flex-1 py-2 bg-zinc-800 light:bg-zinc-100 text-white light:text-zinc-700 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-zinc-700 light:hover:bg-zinc-200 transition border border-zinc-700 light:border-zinc-200"
                  >
                    <FaPlay className="text-[10px]" /> Preview
                  </button>
                )}
                <button
                  onClick={onAccept}
                  className="flex-1 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 hover:opacity-90 transition"
                >
                  <HiOutlineArrowDownTray className="text-sm" /> Accept
                </button>
              </div>
            )}

            {/* Request Changes */}
            {isClient && !isCompleted && delivery.status !== "changes_requested" && (
              <button
                onClick={onRequestChanges}
                className="w-full py-1.5 text-orange-400 text-[11px] flex items-center justify-center gap-1 hover:bg-orange-500/10 rounded-lg transition"
              >
                <HiOutlinePencilSquare className="text-xs" /> Request Changes
              </button>
            )}

            {/* Editor view */}
            {!isClient && !isCompleted && (
              <p className="text-zinc-500 text-[11px] text-center">Waiting for client...</p>
            )}

            {/* Completed - Compact celebration */}
            {isCompleted && (
              <div className="bg-emerald-500/10 light:bg-emerald-50 rounded-xl p-3 border border-emerald-500/20 light:border-emerald-200">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                    <FaCheck className="text-white text-sm" />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-1">
                      <FaTrophy className="text-amber-400 text-xs" />
                      <span className="text-emerald-400 light:text-emerald-600 font-bold text-sm">Completed!</span>
                    </div>
                    <span className="text-zinc-500 light:text-zinc-400 text-[10px]">Payment released</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default FinalDeliveryCard;
