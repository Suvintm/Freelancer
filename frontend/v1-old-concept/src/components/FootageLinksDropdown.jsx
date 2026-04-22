// FootageLinksDropdown.jsx - Collapsible section showing shared drive/footage links
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaChevronDown,
  FaFolder,
  FaExternalLinkAlt,
  FaCircle,
} from "react-icons/fa";
import { HiOutlineFolderOpen } from "react-icons/hi2";

// Provider info helper
const getProviderInfo = (provider) => {
  switch (provider) {
    case "google_drive":
      return { name: "Google Drive", color: "from-yellow-500 to-green-500", icon: "📁", bg: "bg-yellow-500/20" };
    case "dropbox":
      return { name: "Dropbox", color: "from-blue-400 to-blue-600", icon: "📦", bg: "bg-blue-500/20" };
    case "onedrive":
      return { name: "OneDrive", color: "from-blue-500 to-cyan-500", icon: "☁️", bg: "bg-cyan-500/20" };
    case "wetransfer":
      return { name: "WeTransfer", color: "from-purple-500 to-pink-500", icon: "📤", bg: "bg-purple-500/20" };
    case "mega":
      return { name: "MEGA", color: "from-red-500 to-orange-500", icon: "📂", bg: "bg-red-500/20" };
    default:
      return { name: "External Link", color: "from-gray-500 to-gray-700", icon: "🔗", bg: "bg-gray-500/20" };
  }
};

const FootageLinksDropdown = ({ messages, userRole, orderId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [seenLinks, setSeenLinks] = useState([]);

  // Filter only drive_link messages
  const footageLinks = messages?.filter(msg => msg.type === "drive_link" && msg.externalLink) || [];

  // Load seen links from localStorage
  useEffect(() => {
    const key = `footage_seen_${orderId}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      setSeenLinks(JSON.parse(saved));
    }
  }, [orderId]);

  // Mark links as seen when dropdown opens (for editors)
  useEffect(() => {
    if (isOpen && userRole === "editor" && footageLinks.length > 0) {
      const allLinkIds = footageLinks.map(msg => msg._id);
      const key = `footage_seen_${orderId}`;
      localStorage.setItem(key, JSON.stringify(allLinkIds));
      setSeenLinks(allLinkIds);
    }
  }, [isOpen, userRole, footageLinks, orderId]);

  // Count unseen links (for editors)
  const unseenCount = userRole === "editor" 
    ? footageLinks.filter(msg => !seenLinks.includes(msg._id)).length 
    : 0;

  if (footageLinks.length === 0) return null;

  return (
    <div className="border-b border-zinc-800/50 light:border-zinc-200">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-transparent hover:bg-zinc-800/30 light:hover:bg-zinc-100 transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/15 light:bg-emerald-100">
            <HiOutlineFolderOpen className="text-emerald-500 w-4 h-4" />
          </div>
          <span className="text-white light:text-zinc-900 font-semibold text-sm">Your Footage</span>
          <span className="text-zinc-500 light:text-zinc-400 text-xs">({footageLinks.length})</span>
          
          {/* New Badge for unseen links */}
          {unseenCount > 0 && (
            <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full animate-pulse">
              {unseenCount} NEW
            </span>
          )}
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <FaChevronDown className="text-zinc-400 light:text-zinc-500 w-3 h-3" />
        </motion.div>
      </button>

      {/* Dropdown Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="bg-zinc-900/50 light:bg-zinc-50 border-t border-zinc-800/50 light:border-zinc-200 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 light:scrollbar-thumb-zinc-300 scrollbar-track-transparent">
              <div className="p-3 space-y-2">
                {footageLinks.map((msg, index) => {
                  const link = msg.externalLink;
                  const providerInfo = getProviderInfo(link.provider);
                  const isNew = userRole === "editor" && !seenLinks.includes(msg._id);
                  const sentDate = new Date(msg.createdAt);

                  return (
                    <motion.div
                      key={msg._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`relative p-3 rounded-xl border transition-all ${
                        isNew 
                          ? "bg-emerald-500/10 light:bg-emerald-50 border-emerald-500/30 light:border-emerald-200" 
                          : "bg-zinc-800/50 light:bg-white border-zinc-700/50 light:border-zinc-200 hover:border-zinc-600 light:hover:border-zinc-300"
                      }`}
                    >
                      {/* New indicator dot */}
                      {isNew && (
                        <div className="absolute top-2 right-2">
                          <FaCircle className="text-emerald-400 text-[8px] animate-pulse" />
                        </div>
                      )}

                      <div className="flex items-start gap-3">
                        {/* Provider Icon */}
                        <div className={`w-10 h-10 rounded-xl ${providerInfo.bg} flex items-center justify-center text-xl shrink-0`}>
                          {providerInfo.icon}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-white light:text-zinc-900 text-sm truncate">
                            {link.title || "Raw Footage"}
                          </h4>
                          <p className="text-zinc-400 light:text-zinc-500 text-xs">{providerInfo.name}</p>
                          {link.description && (
                            <p className="text-zinc-300 light:text-zinc-600 text-[11px] mt-1 line-clamp-1">{link.description}</p>
                          )}
                          <p className="text-zinc-500 light:text-zinc-400 text-[10px] mt-1">
                            {sentDate.toLocaleDateString()} at {sentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>

                        {/* Open Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(link.url, "_blank");
                          }}
                          className={`shrink-0 px-3 py-2 bg-gradient-to-r ${providerInfo.color} text-white text-xs font-bold rounded-lg flex items-center gap-1.5 hover:opacity-90 transition shadow-lg`}
                        >
                          <FaExternalLinkAlt className="text-[10px]" />
                          Open
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FootageLinksDropdown;
