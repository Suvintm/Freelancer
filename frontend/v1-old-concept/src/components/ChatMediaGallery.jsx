/**
 * ChatMediaGallery — Unified Project Asset Panel
 * Dark B/W themed professional asset manager with search, footage links, and media grid.
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaTrash, FaImage, FaVideo, FaFileAlt, FaDownload } from "react-icons/fa";
import {
  HiOutlineXMark,
  HiOutlineMagnifyingGlass,
  HiOutlineLink,
  HiOutlineCpuChip,
  HiOutlineDocumentDuplicate,
  HiOutlinePhoto,
  HiOutlineFilm,
  HiOutlineTrash,
  HiOutlineArrowDownTray,
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
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [footageLinks, setFootageLinks] = useState([]);

  const isOrderActive = ["new", "accepted", "in_progress", "submitted"].includes(orderStatus);

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${backendURL}/api/messages/${orderId}`, {
          headers: { Authorization: `Bearer ${user?.token}` },
        });
        const messages = res.data.messages || [];
        setMedia(messages.filter((msg) => ["image", "video", "file", "audio"].includes(msg.type) && !msg.isDeleted));
        setFootageLinks(messages.filter((msg) => msg.type === "drive_link" && msg.externalLink && !msg.isDeleted));
      } catch (err) {
        console.error("Failed to fetch assets:", err);
        toast.error("Failed to load project assets");
      } finally {
        setLoading(false);
      }
    };
    fetchAssets();
  }, [orderId, backendURL, user?.token]);

  const counts = {
    all: media.length + footageLinks.length,
    media: media.filter((m) => ["image", "video"].includes(m.type)).length,
    files: media.filter((m) => ["file", "audio"].includes(m.type)).length,
    footage: footageLinks.length,
  };

  const filteredAssets = (() => {
    let combined = [];
    if (activeTab === "all") combined = [...media, ...footageLinks];
    else if (activeTab === "media") combined = media.filter((m) => ["image", "video"].includes(m.type));
    else if (activeTab === "files") combined = media.filter((m) => ["file", "audio"].includes(m.type));
    else if (activeTab === "footage") combined = footageLinks;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      combined = combined.filter(
        (a) =>
          a.mediaName?.toLowerCase().includes(q) ||
          a.externalLink?.title?.toLowerCase().includes(q) ||
          a.type?.toLowerCase().includes(q)
      );
    }
    return combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  })();

  const handleDelete = async (msgId) => {
    if (!isOrderActive) { toast.error("Cannot delete from completed orders"); return; }
    const msg = media.find((m) => m._id === msgId);
    if (msg?.sender?._id !== user._id && msg?.sender !== user._id) { toast.error("You can only delete your own files"); return; }
    try {
      setDeleting(msgId);
      await axios.delete(`${backendURL}/api/messages/${msgId}`, { headers: { Authorization: `Bearer ${user?.token}` } });
      setMedia((prev) => prev.filter((m) => m._id !== msgId));
      setConfirmDelete(null);
      toast.success("File deleted");
      onMediaDeleted?.(msgId);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete file");
    } finally {
      setDeleting(null);
    }
  };

  const tabs = [
    { id: "all", label: "All Assets", icon: HiOutlineCpuChip },
    { id: "media", label: "Visuals", icon: HiOutlinePhoto },
    { id: "files", label: "Documents", icon: HiOutlineDocumentDuplicate },
    { id: "footage", label: "Footage", icon: HiOutlineLink },
  ];

  const getProviderIcon = (provider) =>
    ({ google_drive: "📁", dropbox: "📦", onedrive: "☁️", wetransfer: "📤", mega: "📂" }[provider] || "🔗");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#0a0a0c] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[88vh] overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.8)] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0">
          <div>
            <h2 className="text-white font-bold text-base tracking-tight">Project Assets</h2>
            <p className="text-zinc-500 text-xs mt-0.5">{counts.all} item{counts.all !== 1 ? "s" : ""} across all categories</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 text-zinc-500 hover:text-white transition-colors">
            <HiOutlineXMark className="w-5 h-5" />
          </button>
        </div>

        {/* Search + Tabs */}
        <div className="px-5 pt-3 pb-2 border-b border-white/5 bg-white/[0.02] shrink-0 space-y-3">
          <div className="relative">
            <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assets..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-white/20 outline-none transition-all"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                    isActive ? "bg-white text-black shadow" : "text-zinc-500 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${isActive ? "bg-black/15 text-black" : "bg-white/5 text-zinc-500"}`}>
                    {counts[tab.id] ?? 0}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {!isOrderActive && (
          <div className="mx-5 mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl shrink-0">
            <span className="text-amber-400 text-xs font-medium">⚠️ Order is completed — files cannot be deleted.</span>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full" />
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-zinc-600">
              <HiOutlineCpuChip className="w-10 h-10 mb-3 opacity-40" />
              <p className="text-sm font-medium">
                {searchQuery ? `No results for "${searchQuery}"` : "No assets in this category"}
              </p>
            </div>
          ) : activeTab === "footage" ? (
            /* Footage Links — List Layout */
            <div className="space-y-3">
              {filteredAssets.map((msg, idx) => {
                const link = msg.externalLink;
                if (!link) return null;
                return (
                  <motion.div
                    key={msg._id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/[0.08] transition-colors"
                  >
                    <div className="w-11 h-11 rounded-lg bg-white/10 flex items-center justify-center text-xl shrink-0">
                      {getProviderIcon(link.provider)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold truncate">{link.title || "Raw Footage"}</p>
                      <p className="text-zinc-500 text-[11px] mt-0.5">
                        {link.provider?.replace("_", " ") || "External"} · {new Date(msg.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); window.open(link.url, "_blank", "noopener,noreferrer"); }}
                      className="shrink-0 px-3 py-1.5 bg-white text-black text-[11px] font-black uppercase tracking-widest rounded-lg hover:bg-zinc-200 transition-colors"
                    >
                      Open
                    </button>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            /* Media / Docs — Grid Layout */
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredAssets.map((msg) => {
                if (msg.type === "drive_link") return null;
                const canDelete = isOrderActive && (msg.sender?._id === user._id || msg.sender === user._id);
                const isOwner = msg.sender?._id === user._id || msg.sender === user._id;
                return (
                  <motion.div
                    key={msg._id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative group rounded-xl overflow-hidden bg-white/5 border border-white/10"
                  >
                    {msg.type === "image" ? (
                      <img src={msg.mediaUrl} alt={msg.mediaName} className="w-full h-28 object-cover" />
                    ) : msg.type === "video" ? (
                      <div className="relative w-full h-28 bg-black">
                        <video src={msg.mediaUrl} className="w-full h-full object-cover opacity-70" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center">
                            <HiOutlineFilm className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-28 flex flex-col items-center justify-center bg-white/[0.03]">
                        <HiOutlineDocumentDuplicate className="w-8 h-8 text-zinc-500 mb-1" />
                        <span className="text-[10px] text-zinc-500 truncate px-2 text-center">{msg.mediaName || "File"}</span>
                      </div>
                    )}
                    <div className="p-2 bg-black/40">
                      <p className="text-white text-[11px] font-medium truncate">{msg.mediaName || "Untitled"}</p>
                      <p className="text-zinc-600 text-[10px]">{isOwner ? "You" : "Other"}</p>
                    </div>
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {canDelete && (
                        <button
                          onClick={() => setConfirmDelete(msg._id)}
                          disabled={deleting === msg._id}
                          className="w-7 h-7 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center text-red-400 hover:text-red-300 transition-colors"
                        >
                          {deleting === msg._id
                            ? <div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                            : <HiOutlineTrash className="w-3.5 h-3.5" />}
                        </button>
                      )}
                      <button
                        onClick={() => window.open(msg.mediaUrl, "_blank", "noopener,noreferrer")}
                        className="w-7 h-7 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white transition-colors"
                      >
                        <HiOutlineArrowDownTray className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between shrink-0">
          <p className="text-zinc-600 text-xs">{filteredAssets.length} of {counts.all} asset{counts.all !== 1 ? "s" : ""} shown</p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
          >
            Close
          </button>
        </div>
      </motion.div>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 flex items-center justify-center z-10"
            onClick={() => setConfirmDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#111] border border-white/10 rounded-2xl p-6 max-w-sm mx-4 shadow-2xl"
            >
              <div className="text-center mb-5">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-3">
                  <HiOutlineTrash className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="text-white font-bold text-base mb-1">Delete File?</h3>
                <p className="text-zinc-500 text-sm">This will permanently remove the file from the project.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10 transition-colors font-medium text-sm">
                  Cancel
                </button>
                <button onClick={() => handleDelete(confirmDelete)} disabled={!!deleting} className="flex-1 py-2.5 rounded-xl bg-red-500/80 text-white hover:bg-red-500 transition-colors font-bold text-sm">
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
