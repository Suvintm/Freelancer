/**
 * FinalOutputCard - Professional Corporate Style
 * 
 * Displays editor's final deliverable with:
 * - Complete file details (resolution, size, duration, codec, fps, bitrate)
 * - Quality disclaimer notice (preview vs. download)
 * - 24-hour download countdown
 * - Approve/Reject/Download actions
 * - Expiry status indicator
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineFilm,
  HiOutlineDownload,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineClock,
  HiOutlineEye,
  HiOutlineInformationCircle,
  HiOutlineRefresh,
} from "react-icons/hi";
import { 
  FaFileVideo, 
  FaFileImage, 
  FaFileAudio, 
  FaClock, 
  FaCheck, 
  FaTimes,
  FaDownload,
  FaExpand,
  FaPlay,
  FaMusic,
} from "react-icons/fa";
import { 
  BiVideo, 
  BiImage, 
  BiMusic,
  BiTime,
  BiData,
  BiCodeBlock,
} from "react-icons/bi";
import axios from "axios";
import { toast } from "react-toastify";
import { useAppContext } from "../context/AppContext";

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
  // Common resolution names
  if (width >= 3840) return `4K (${width}×${height})`;
  if (width >= 2560) return `2K (${width}×${height})`;
  if (width >= 1920) return `Full HD (${width}×${height})`;
  if (width >= 1280) return `HD (${width}×${height})`;
  if (width >= 854) return `SD (${width}×${height})`;
  return `${width}×${height}`;
};

const getFileIcon = (type) => {
  switch (type) {
    case "video": return BiVideo;
    case "photo": return BiImage;
    case "audio": return BiMusic;
    default: return BiVideo;
  }
};

const getTypeLabel = (type) => {
  switch (type) {
    case "video": return "Video";
    case "photo": return "Photo";
    case "audio": return "Audio";
    default: return "File";
  }
};

// === Main Component ===

const FinalOutputCard = ({ output, orderId, isClient, isEditor, onStatusChange }) => {
  const { backendURL, user } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);

  const FileIcon = getFileIcon(output.type);

  // === Countdown Timer ===
  useEffect(() => {
    if (!output.expiresAt || output.isExpired) return;

    const updateTimer = () => {
      const now = new Date();
      const expiry = new Date(output.expiresAt);
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft(null);
        onStatusChange?.();
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ hours, mins, secs, total: diff });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000); // Update every second
    return () => clearInterval(interval);
  }, [output.expiresAt, output.isExpired, onStatusChange]);

  // === Action Handlers ===

  const handleApprove = async () => {
    if (!window.confirm("Approve this output? You'll have 24 hours to download the full quality file.")) return;
    
    setLoading(true);
    try {
      const res = await axios.post(
        `${backendURL}/api/final-output/${output._id}/approve`,
        {},
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      toast.success("✅ Output approved! Download available for 24 hours.");
      onStatusChange?.(res.data.output);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to approve");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (rejectReason.trim().length < 10) {
      toast.error("Please provide detailed feedback (min 10 characters)");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(
        `${backendURL}/api/final-output/${output._id}/reject`,
        { reason: rejectReason },
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      toast.info("📝 Revision requested. Editor has been notified.");
      setShowRejectModal(false);
      setRejectReason("");
      onStatusChange?.(res.data.output);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit feedback");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await axios.get(
        `${backendURL}/api/final-output/${output._id}/download-url`,
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      
      // Create download link
      const link = document.createElement("a");
      link.href = res.data.downloadUrl;
      link.download = res.data.filename || output.originalName || output.filename;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("⬇️ Download started! Full quality file.");
      onStatusChange?.();
    } catch (err) {
      const message = err.response?.status === 410 
        ? "⏰ Download expired. The file has been removed."
        : err.response?.data?.message || "Failed to get download link";
      toast.error(message);
    } finally {
      setDownloading(false);
    }
  };

  // === Status Checks ===
  const isPending = output.status === "pending";
  const isApproved = output.status === "approved" || output.status === "downloaded";
  const isRejected = output.status === "rejected";
  const isExpired = output.isExpired || output.status === "expired";

  // === Render ===
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={`rounded-2xl overflow-hidden shadow-xl ${
          isExpired 
            ? "bg-zinc-900/80 border border-zinc-700/50" 
            : isApproved
            ? "bg-gradient-to-br from-emerald-950/40 via-green-950/30 to-zinc-950 border border-emerald-500/30"
            : isRejected
            ? "bg-gradient-to-br from-red-950/40 via-orange-950/30 to-zinc-950 border border-red-500/30"
            : "bg-gradient-to-br from-indigo-950/40 via-purple-950/30 to-zinc-950 border border-indigo-500/30"
        }`}
      >
        {/* === Header === */}
        <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-black/20">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              output.type === "video" ? "bg-purple-500/20" :
              output.type === "photo" ? "bg-blue-500/20" :
              "bg-amber-500/20"
            }`}>
              <FileIcon className={`text-xl ${
                output.type === "video" ? "text-purple-400" :
                output.type === "photo" ? "text-blue-400" :
                "text-amber-400"
              }`} />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                📦 Final Output
                <span className="text-[10px] font-normal text-zinc-500">v{output.version}</span>
              </h4>
              <p className="text-[11px] text-zinc-500">
                {getTypeLabel(output.type)} Delivery • {new Date(output.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          {/* Status Badge */}
          <div className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
            isExpired ? "bg-zinc-700/50 text-zinc-400" :
            isApproved ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
            isRejected ? "bg-red-500/20 text-red-400 border border-red-500/30" :
            "bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse"
          }`}>
            {isExpired ? <FaClock className="text-[10px]" /> :
             isApproved ? <FaCheck className="text-[10px]" /> :
             isRejected ? <FaTimes className="text-[10px]" /> :
             <HiOutlineClock className="text-sm" />}
            {isExpired ? "Expired" :
             isApproved ? "Approved" :
             isRejected ? "Revision Needed" :
             "Awaiting Review"}
          </div>
        </div>

        {/* === File Details Grid === */}
        <div className="p-4 space-y-3">
          {/* Filename */}
          <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2">
            <span className="text-zinc-400 text-xs">📄</span>
            <span className="text-sm text-white font-medium truncate flex-1" title={output.originalName}>
              {output.originalName || output.filename}
            </span>
          </div>

          {/* Technical Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Resolution */}
            {output.resolution?.width && (
              <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
                <div className="flex items-center gap-1.5 mb-1">
                  <FaExpand className="text-[10px] text-indigo-400" />
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wide">Resolution</span>
                </div>
                <p className="text-xs font-semibold text-white">
                  {formatResolution(output.resolution.width, output.resolution.height)}
                </p>
              </div>
            )}

            {/* Duration */}
            {output.duration && (
              <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
                <div className="flex items-center gap-1.5 mb-1">
                  <BiTime className="text-xs text-green-400" />
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wide">Duration</span>
                </div>
                <p className="text-xs font-semibold text-white">{formatDuration(output.duration)}</p>
              </div>
            )}

            {/* File Size */}
            <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
              <div className="flex items-center gap-1.5 mb-1">
                <BiData className="text-xs text-blue-400" />
                <span className="text-[10px] text-zinc-500 uppercase tracking-wide">Size</span>
              </div>
              <p className="text-xs font-semibold text-white">{formatBytes(output.fileSize)}</p>
            </div>

            {/* Aspect Ratio */}
            {output.aspectRatio && (
              <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[10px] text-purple-400">◫</span>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wide">Aspect</span>
                </div>
                <p className="text-xs font-semibold text-white">{output.aspectRatio}</p>
              </div>
            )}

            {/* Codec */}
            {output.codec && (
              <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
                <div className="flex items-center gap-1.5 mb-1">
                  <BiCodeBlock className="text-xs text-amber-400" />
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wide">Codec</span>
                </div>
                <p className="text-xs font-semibold text-white uppercase">{output.codec}</p>
              </div>
            )}

            {/* Frame Rate */}
            {output.frameRate && (
              <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
                <div className="flex items-center gap-1.5 mb-1">
                  <FaPlay className="text-[10px] text-pink-400" />
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wide">FPS</span>
                </div>
                <p className="text-xs font-semibold text-white">{output.frameRate} fps</p>
              </div>
            )}

            {/* Bitrate */}
            {output.bitrate && (
              <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[10px] text-cyan-400">⚡</span>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wide">Bitrate</span>
                </div>
                <p className="text-xs font-semibold text-white">{(output.bitrate / 1000).toFixed(1)} Mbps</p>
              </div>
            )}
          </div>

          {/* === Quality Disclaimer (Client Only, Pending Status) === */}
          {isPending && isClient && (
            <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-xl p-3">
              <div className="flex items-start gap-2.5">
                <HiOutlineInformationCircle className="text-blue-400 text-lg flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-blue-300 mb-1">Quality Notice</p>
                  <p className="text-[11px] text-blue-200/80 leading-relaxed">
                    The preview may be slightly compressed for faster loading. 
                    After approval, you'll receive the <strong className="text-blue-200">original full-quality file</strong> with 
                    <strong className="text-blue-200"> zero compression</strong> — exactly as the editor created it.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* === Editor Notes === */}
          {output.editorNotes && (
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1.5">📝 Editor's Note</p>
              <p className="text-xs text-zinc-300 leading-relaxed">{output.editorNotes}</p>
            </div>
          )}

          {/* === Download Timer (After Approval) === */}
          {isApproved && !isExpired && timeLeft && (
            <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                    <FaClock className="text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-amber-300">Download Available</p>
                    <p className="text-[10px] text-amber-400/70">File auto-deletes after expiry</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-amber-400 font-mono">
                    {timeLeft.hours.toString().padStart(2, "0")}:
                    {timeLeft.mins.toString().padStart(2, "0")}:
                    {timeLeft.secs.toString().padStart(2, "0")}
                  </p>
                  <p className="text-[10px] text-amber-400/70">remaining</p>
                </div>
              </div>
            </div>
          )}

          {/* === Expired Notice === */}
          {isExpired && (
            <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-zinc-700/50 flex items-center justify-center">
                  <HiOutlineClock className="text-zinc-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-400">Download Period Ended</p>
                  <p className="text-[10px] text-zinc-500">
                    The original file has been removed. Thumbnail preserved for records.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* === Rejection Reason === */}
          {isRejected && output.rejectionReason && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
              <p className="text-[10px] text-red-400 uppercase tracking-wide mb-1.5">⚠️ Revision Requested</p>
              <p className="text-xs text-red-300 leading-relaxed">{output.rejectionReason}</p>
            </div>
          )}
        </div>

        {/* === Action Buttons === */}
        <div className="px-4 py-3 bg-black/30 border-t border-white/5">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Preview Button */}
            {!isExpired && (
              <button 
                onClick={() => setShowPreview(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-all hover:scale-[1.02]"
              >
                <HiOutlineEye className="text-sm" />
                Preview
              </button>
            )}

            {/* Client Actions */}
            {isClient && isPending && (
              <>
                <button
                  onClick={handleApprove}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
                >
                  <HiOutlineCheckCircle className="text-sm" />
                  {loading ? "Processing..." : "Approve Output"}
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium transition-all border border-red-500/30 hover:scale-[1.02] disabled:opacity-50"
                >
                  <HiOutlineRefresh className="text-sm" />
                  Request Changes
                </button>
              </>
            )}

            {/* Download Button (After Approval) */}
            {isClient && isApproved && !isExpired && (
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 hover:from-emerald-600 hover:via-green-600 hover:to-teal-600 text-white text-sm font-bold transition-all shadow-lg shadow-emerald-500/30 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
              >
                <FaDownload className="text-sm" />
                {downloading ? "Preparing..." : "Download Full Quality"}
              </button>
            )}

            {/* Editor Status Message */}
            {isEditor && (
              <p className="text-[11px] text-zinc-500 ml-auto">
                {isPending && "⏳ Waiting for client review..."}
                {isApproved && "🎉 Client approved your work!"}
                {isRejected && "📝 Please review the feedback and resubmit."}
                {isExpired && "📁 Download period ended."}
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* === Reject Modal === */}
      <AnimatePresence>
        {showRejectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => setShowRejectModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5 w-full max-w-md shadow-2xl"
            >
              <h3 className="text-lg font-bold text-white mb-2">Request Revision</h3>
              <p className="text-sm text-zinc-400 mb-4">
                Provide detailed feedback to help the editor make corrections.
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Describe what needs to be changed..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 resize-none"
                rows={4}
                autoFocus
              />
              <p className="text-[10px] text-zinc-500 mt-1.5 mb-4">
                {rejectReason.length}/10 characters minimum
              </p>
              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={loading || rejectReason.length < 10}
                  className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Submit Feedback"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FinalOutputCard;
