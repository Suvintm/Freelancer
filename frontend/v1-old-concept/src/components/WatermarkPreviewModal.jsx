// WatermarkPreviewModal.jsx - Modal for previewing watermarked final delivery
import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaTimes,
  FaPlay,
  FaPause,
  FaExpand,
  FaVolumeUp,
  FaVolumeMute,
  FaDownload,
  FaEdit,
  FaEye,
} from "react-icons/fa";

const WatermarkPreviewModal = ({ 
  isOpen, 
  onClose, 
  preview, 
  onAccept, 
  onRequestChanges 
}) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);

  if (!isOpen || !preview) return null;

  const isVideo = preview.mimeType?.startsWith("video/");

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(progress);
    }
  };

  const handleSeek = (e) => {
    if (videoRef.current) {
      const rect = e.target.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      videoRef.current.currentTime = pos * videoRef.current.duration;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/95 z-[100] flex flex-col no-copy"
          onClick={onClose}
          onContextMenu={(e) => e.preventDefault()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <span className="text-white font-bold">Preview</span>
              <span className="text-yellow-400 text-sm flex items-center gap-1">
                <FaEye className="text-xs" />
                {preview.previewsRemaining} previews remaining
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition"
            >
              <FaTimes className="text-white text-xl" />
            </button>
          </div>

          {/* Media Container */}
          <div 
            className="flex-1 flex items-center justify-center p-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative max-w-4xl max-h-full w-full">
              {isVideo ? (
                <div className="relative">
                  <video
                    ref={videoRef}
                    src={preview.watermarkedUrl}
                    className="w-full max-h-[70vh] rounded-lg no-copy"
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={() => setIsPlaying(false)}
                    controlsList="nodownload"
                    disablePictureInPicture
                    onContextMenu={(e) => e.preventDefault()}
                  />
                  
                  {/* Video Controls */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 rounded-b-lg">
                    {/* Progress bar */}
                    <div 
                      className="h-1 bg-white/30 rounded-full mb-3 cursor-pointer"
                      onClick={handleSeek}
                    >
                      <div 
                        className="h-full bg-purple-500 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={togglePlay}
                          className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition"
                        >
                          {isPlaying ? (
                            <FaPause className="text-white" />
                          ) : (
                            <FaPlay className="text-white ml-0.5" />
                          )}
                        </button>
                        
                        <button
                          onClick={toggleMute}
                          className="p-2 hover:bg-white/20 rounded-full transition"
                        >
                          {isMuted ? (
                            <FaVolumeMute className="text-white" />
                          ) : (
                            <FaVolumeUp className="text-white" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <img
                  src={preview.watermarkedUrl}
                  alt="Preview"
                  className="w-full max-h-[70vh] object-contain rounded-lg no-copy"
                  onContextMenu={(e) => e.preventDefault()}
                  draggable={false}
                />
              )}

              {/* Watermark notice */}
              <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/70 rounded-lg flex items-center gap-2">
                <span className="text-yellow-400 text-sm">⚠️ This preview has a watermark</span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div 
            className="p-4 border-t border-white/10 flex flex-col sm:flex-row gap-3 items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-gray-400 text-sm text-center sm:text-left mb-2 sm:mb-0 sm:mr-4">
              Download will be without watermark
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={onRequestChanges}
                className="px-6 py-2.5 bg-orange-500/20 text-orange-400 rounded-xl flex items-center gap-2 hover:bg-orange-500/30 transition font-medium"
              >
                <FaEdit />
                Request Changes
              </button>
              
              <button
                onClick={onAccept}
                className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl flex items-center gap-2 hover:opacity-90 transition font-bold"
              >
                <FaDownload />
                Accept & Download
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WatermarkPreviewModal;
