/**
 * Chat Media Gallery Component
 * Shows all images/videos from chat with delete option
 * Only allows deletion for active orders and messages sent by the user
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaTimes,
  FaTrash,
  FaImage,
  FaVideo,
  FaFileAlt,
  FaDownload,
  FaExclamationTriangle,
  FaDatabase,
} from "react-icons/fa";
import axios from "axios";
import { toast } from "react-toastify";
import { useAppContext } from "../context/AppContext";

const ChatMediaGallery = ({ orderId, orderStatus, onClose, onMediaDeleted }) => {
  const { user, backendURL } = useAppContext();
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [activeTab, setActiveTab] = useState("all");

  // Check if order is active (can delete files)
  const isOrderActive = ["new", "accepted", "in_progress", "submitted"].includes(orderStatus);

  // Fetch media from messages
  useEffect(() => {
    const fetchMedia = async () => {
      try {
        const res = await axios.get(`${backendURL}/api/messages/${orderId}`, {
          headers: { Authorization: `Bearer ${user?.token}` },
        });
        
        const messages = res.data.messages || [];
        
        // Filter only media messages
        const mediaMessages = messages.filter(
          (msg) => ["image", "video", "file", "audio"].includes(msg.type) && !msg.isDeleted
        );
        
        setMedia(mediaMessages);
      } catch (err) {
        console.error("Failed to fetch media:", err);
        toast.error("Failed to load media");
      } finally {
        setLoading(false);
      }
    };

    fetchMedia();
  }, [orderId, backendURL, user?.token]);

  // Filter by type
  const filteredMedia = media.filter((m) => {
    if (activeTab === "all") return true;
    if (activeTab === "images") return m.type === "image";
    if (activeTab === "videos") return m.type === "video";
    if (activeTab === "files") return ["file", "audio"].includes(m.type);
    return true;
  });

  // Handle delete
  const handleDelete = async (msgId) => {
    if (!isOrderActive) {
      toast.error("Cannot delete files from completed orders");
      return;
    }

    const msg = media.find((m) => m._id === msgId);
    if (msg.sender._id !== user._id && msg.sender !== user._id) {
      toast.error("You can only delete your own files");
      return;
    }

    try {
      setDeleting(msgId);
      
      await axios.delete(`${backendURL}/api/messages/${msgId}`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });

      // Remove from local state
      setMedia((prev) => prev.filter((m) => m._id !== msgId));
      setConfirmDelete(null);
      toast.success("File deleted successfully");
      
      // Notify parent to update chat
      onMediaDeleted?.(msgId);
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error(err.response?.data?.message || "Failed to delete file");
    } finally {
      setDeleting(null);
    }
  };

  // Get media icon
  const getMediaIcon = (type) => {
    switch (type) {
      case "image": return FaImage;
      case "video": return FaVideo;
      default: return FaFileAlt;
    }
  };

  // Format size
  const formatSize = (size) => {
    if (!size) return "";
    return size;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#111319] border border-[#262A3B] rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#262A3B]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <FaImage className="text-purple-400" />
            </div>
            <div>
              <h2 className="text-white font-semibold">Chat Media</h2>
              <p className="text-gray-500 text-xs">{media.length} files</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
          >
            <FaTimes />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-4 border-b border-[#262A3B]">
          {[
            { id: "all", label: "All", count: media.length },
            { id: "images", label: "Images", count: media.filter((m) => m.type === "image").length },
            { id: "videos", label: "Videos", count: media.filter((m) => m.type === "video").length },
            { id: "files", label: "Files", count: media.filter((m) => ["file", "audio"].includes(m.type)).length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-purple-500/20 text-purple-400"
                  : "text-gray-400 hover:bg-white/5"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Order Status Warning */}
        {!isOrderActive && (
          <div className="mx-4 mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-2">
            <FaExclamationTriangle className="text-amber-400" />
            <span className="text-amber-400 text-sm">
              This order is completed. Files cannot be deleted.
            </span>
          </div>
        )}

        {/* Content */}
        <div className="p-4 overflow-y-auto" style={{ maxHeight: "calc(80vh - 200px)" }}>
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
            </div>
          ) : filteredMedia.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-500">
              <FaImage className="text-4xl mb-2 opacity-50" />
              <p>No media files</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {filteredMedia.map((msg) => {
                const Icon = getMediaIcon(msg.type);
                const canDelete = isOrderActive && (msg.sender._id === user._id || msg.sender === user._id);
                
                return (
                  <motion.div
                    key={msg._id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="relative group rounded-xl overflow-hidden bg-black/30 border border-white/5"
                  >
                    {/* Media Preview */}
                    {msg.type === "image" ? (
                      <img
                        src={msg.mediaUrl}
                        alt={msg.mediaName || "Image"}
                        className="w-full h-32 object-cover"
                      />
                    ) : msg.type === "video" ? (
                      <div className="relative w-full h-32">
                        <video
                          src={msg.mediaUrl}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <FaVideo className="text-white text-2xl" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-32 flex flex-col items-center justify-center bg-zinc-800">
                        <Icon className="text-3xl text-gray-400 mb-2" />
                        <span className="text-xs text-gray-500 truncate px-2 text-center">
                          {msg.mediaName || "File"}
                        </span>
                      </div>
                    )}

                    {/* Info Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                      <p className="text-white text-xs truncate">{msg.mediaName || "Untitled"}</p>
                      {msg.mediaSize && (
                        <p className="text-gray-400 text-[10px]">{formatSize(msg.mediaSize)}</p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {canDelete && (
                        <button
                          onClick={() => setConfirmDelete(msg._id)}
                          disabled={deleting === msg._id}
                          className="p-1.5 rounded-lg bg-red-500/80 text-white hover:bg-red-600 transition-colors"
                        >
                          {deleting === msg._id ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <FaTrash className="text-xs" />
                          )}
                        </button>
                      )}
                      <a
                        href={msg.mediaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-blue-500/80 text-white hover:bg-blue-600 transition-colors"
                      >
                        <FaDownload className="text-xs" />
                      </a>
                    </div>

                    {/* Sender Badge */}
                    <div className="absolute top-2 left-2">
                      <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${
                        msg.sender._id === user._id || msg.sender === user._id
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-blue-500/20 text-blue-400"
                      }`}>
                        {msg.sender._id === user._id || msg.sender === user._id ? "You" : "Other"}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#262A3B] flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-500 text-xs">
            <FaDatabase className="text-purple-400" />
            <span>Deleting files frees up storage space</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10 transition-colors text-sm"
          >
            Close
          </button>
        </div>
      </motion.div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 flex items-center justify-center z-10"
            onClick={() => setConfirmDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#1a1d24] border border-[#262A3B] rounded-xl p-6 max-w-sm"
            >
              <div className="text-center mb-4">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-3">
                  <FaTrash className="text-red-400 text-xl" />
                </div>
                <h3 className="text-white font-semibold mb-1">Delete File?</h3>
                <p className="text-gray-400 text-sm">
                  This will remove the file from the chat. The message will show as deleted.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 py-2 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(confirmDelete)}
                  disabled={deleting}
                  className="flex-1 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ChatMediaGallery;
