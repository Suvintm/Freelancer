/**
 * Chat Media Gallery Component
 * Professional corporate-style media gallery with light/dark theme support
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
} from "react-icons/fa";
import { 
  HiOutlinePhoto, 
  HiOutlineFilm, 
  HiOutlineDocument,
  HiOutlineFolderOpen,
  HiOutlineExclamationTriangle,
  HiOutlineTrash,
  HiOutlineArrowDownTray,
  HiOutlineXMark
} from "react-icons/hi2";
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

  // Filter counts
  const counts = {
    all: media.length,
    images: media.filter((m) => m.type === "image").length,
    videos: media.filter((m) => m.type === "video").length,
    files: media.filter((m) => ["file", "audio"].includes(m.type)).length,
  };

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

  // Tab config
  const tabs = [
    { id: "all", label: "All", icon: HiOutlineFolderOpen },
    { id: "images", label: "Images", icon: HiOutlinePhoto },
    { id: "videos", label: "Videos", icon: HiOutlineFilm },
    { id: "files", label: "Files", icon: HiOutlineDocument },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
              <HiOutlineFolderOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-zinc-900 dark:text-white font-semibold text-base">Media Gallery</h2>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs">{media.length} files in this conversation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-white transition-colors"
          >
            <HiOutlineXMark className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-5 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
          <div className="flex gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm border border-zinc-200 dark:border-zinc-700"
                      : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-white/50 dark:hover:bg-zinc-800/50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className={`text-[11px] px-1.5 py-0.5 rounded-md ${
                    isActive 
                      ? "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400" 
                      : "bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400"
                  }`}>
                    {counts[tab.id]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Order Status Warning */}
        {!isOrderActive && (
          <div className="mx-5 mt-4 p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg flex items-center gap-3">
            <HiOutlineExclamationTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="text-amber-700 dark:text-amber-400 text-sm">
              This order is completed. Files cannot be deleted.
            </span>
          </div>
        )}

        {/* Content */}
        <div className="p-5 overflow-y-auto" style={{ maxHeight: "calc(85vh - 220px)" }}>
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
            </div>
          ) : filteredMedia.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-zinc-400 dark:text-zinc-500">
              <HiOutlinePhoto className="w-12 h-12 mb-3 opacity-50" />
              <p className="text-sm">No media files found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredMedia.map((msg) => {
                const canDelete = isOrderActive && (msg.sender._id === user._id || msg.sender === user._id);
                const isOwner = msg.sender._id === user._id || msg.sender === user._id;
                
                return (
                  <motion.div
                    key={msg._id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative group rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
                  >
                    {/* Media Preview */}
                    {msg.type === "image" ? (
                      <img
                        src={msg.mediaUrl}
                        alt={msg.mediaName || "Image"}
                        className="w-full h-28 object-cover"
                      />
                    ) : msg.type === "video" ? (
                      <div className="relative w-full h-28">
                        <video
                          src={msg.mediaUrl}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <HiOutlineFilm className="w-5 h-5 text-white" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-28 flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-800">
                        <HiOutlineDocument className="w-8 h-8 text-zinc-400 mb-1" />
                        <span className="text-[10px] text-zinc-500 truncate px-2 text-center max-w-full">
                          {msg.mediaName || "File"}
                        </span>
                      </div>
                    )}

                    {/* Info Footer */}
                    <div className="p-2 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800">
                      <p className="text-zinc-700 dark:text-zinc-300 text-[11px] font-medium truncate">
                        {msg.mediaName || "Untitled"}
                      </p>
                      {msg.mediaSize && (
                        <p className="text-zinc-400 dark:text-zinc-500 text-[10px]">{msg.mediaSize}</p>
                      )}
                    </div>

                    {/* Sender Badge */}
                    <div className="absolute top-2 left-2">
                      <span className={`px-2 py-0.5 text-[10px] font-medium rounded ${
                        isOwner
                          ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                          : "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400"
                      }`}>
                        {isOwner ? "You" : "Other"}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {canDelete && (
                        <button
                          onClick={() => setConfirmDelete(msg._id)}
                          disabled={deleting === msg._id}
                          className="w-7 h-7 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors shadow-sm"
                        >
                          {deleting === msg._id ? (
                            <div className="w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <HiOutlineTrash className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                      <a
                        href={msg.mediaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-7 h-7 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors shadow-sm"
                      >
                        <HiOutlineArrowDownTray className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-between">
          <p className="text-zinc-500 dark:text-zinc-400 text-xs">
            {filteredMedia.length} of {media.length} files shown
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-sm font-medium"
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
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 max-w-sm mx-4 shadow-xl"
            >
              <div className="text-center mb-5">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center mx-auto mb-3">
                  <HiOutlineTrash className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-zinc-900 dark:text-white font-semibold text-base mb-1">Delete File?</h3>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                  This will remove the file from the chat permanently.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 py-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(confirmDelete)}
                  disabled={deleting}
                  className="flex-1 py-2.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors font-medium text-sm"
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
