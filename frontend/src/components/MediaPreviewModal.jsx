// MediaPreviewModal.jsx - Full-screen media preview with zoom and controls
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaTimes,
  FaDownload,
  FaExpand,
  FaPlay,
  FaPause,
  FaVolumeUp,
  FaVolumeMute,
} from "react-icons/fa";

const MediaPreviewModal = ({ isOpen, onClose, media }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [videoRef, setVideoRef] = useState(null);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  if (!media) return null;

  const isVideo = media.type === "video" || media.url?.match(/\.(mp4|mov|webm|avi)$/i);
  const isImage = media.type === "image" || media.url?.match(/\.(jpg|jpeg|png|gif|webp)$/i);

  const handleVideoToggle = () => {
    if (videoRef) {
      if (isPlaying) {
        videoRef.pause();
      } else {
        videoRef.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = media.url;
    link.download = media.name || "download";
    link.target = "_blank";
    link.click();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1000] flex items-center justify-center"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/95 backdrop-blur-sm" />

          {/* Content */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative z-10 max-w-[95vw] max-h-[95vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Controls */}
            <div className="absolute top-4 right-4 z-20 flex items-center gap-3">
              {/* Download Button */}
              <button
                onClick={handleDownload}
                className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all"
              >
                <FaDownload className="text-white text-lg" />
              </button>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="p-3 rounded-full bg-white/10 hover:bg-red-500/50 transition-all"
              >
                <FaTimes className="text-white text-lg" />
              </button>
            </div>

            {/* Media Name */}
            <div className="absolute top-4 left-4 z-20">
              <p className="text-white text-sm bg-black/50 px-3 py-1 rounded-full">
                {media.name || "Media Preview"}
              </p>
            </div>

            {/* Image Preview */}
            {isImage && (
              <motion.img
                src={media.url}
                alt={media.name}
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 25 }}
              />
            )}

            {/* Video Preview */}
            {isVideo && (
              <div className="relative">
                <video
                  ref={(ref) => setVideoRef(ref)}
                  src={media.url}
                  className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                  muted={isMuted}
                  loop
                  playsInline
                  onClick={handleVideoToggle}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />

                {/* Video Controls Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent rounded-b-lg">
                  <div className="flex items-center justify-center gap-4">
                    {/* Play/Pause */}
                    <button
                      onClick={handleVideoToggle}
                      className="p-4 rounded-full bg-white/20 hover:bg-white/30 transition-all"
                    >
                      {isPlaying ? (
                        <FaPause className="text-white text-xl" />
                      ) : (
                        <FaPlay className="text-white text-xl ml-1" />
                      )}
                    </button>

                    {/* Mute/Unmute */}
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all"
                    >
                      {isMuted ? (
                        <FaVolumeMute className="text-white text-lg" />
                      ) : (
                        <FaVolumeUp className="text-white text-lg" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Play Icon Overlay (when paused) */}
                {!isPlaying && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  >
                    <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <FaPlay className="text-white text-3xl ml-2" />
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* Non-media file */}
            {!isImage && !isVideo && (
              <div className="bg-[#1a1d25] rounded-2xl p-8 flex flex-col items-center gap-4">
                <div className="w-20 h-20 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <FaDownload className="text-blue-400 text-3xl" />
                </div>
                <p className="text-white font-medium">{media.name}</p>
                <button
                  onClick={handleDownload}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
                >
                  Download File
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MediaPreviewModal;
