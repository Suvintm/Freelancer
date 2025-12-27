// ChatInfoTabs.jsx - Unified tab interface for Project Details and Footage Links
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaRupeeSign,
  FaExternalLinkAlt,
  FaCircle,
} from "react-icons/fa";
import { 
  HiOutlineClipboardDocumentList,
  HiOutlineFolderOpen,
  HiOutlineCreditCard,
  HiOutlineClipboardDocumentCheck,
  HiOutlineReceiptPercent,
  HiOutlineCheckCircle
} from "react-icons/hi2";

const PAYMENT_STAGES = [
  { key: "pending", label: "Payment Pending" },
  { key: "escrow", label: "In Escrow" },
  { key: "released", label: "Payment Released" },
];

const WORK_STAGES = [
  { key: "accepted", label: "Order Accepted" },
  { key: "in_progress", label: "In Progress" },
  { key: "submitted", label: "Work Submitted" },
  { key: "completed", label: "Completed" },
];

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

const ChatInfoTabs = ({ order, messages, userRole, orderId, onLinkClick }) => {
  const [activeTab, setActiveTab] = useState(null); // null = closed, 'details' or 'footage'
  const [seenLinks, setSeenLinks] = useState([]);

  // Footage links
  const footageLinks = messages?.filter(msg => msg.type === "drive_link" && msg.externalLink) || [];

  // Load seen links
  useEffect(() => {
    const key = `footage_seen_${orderId}`;
    const saved = localStorage.getItem(key);
    if (saved) setSeenLinks(JSON.parse(saved));
  }, [orderId]);

  // Mark as seen when viewing
  useEffect(() => {
    if (activeTab === 'footage' && userRole === "editor" && footageLinks.length > 0) {
      const allLinkIds = footageLinks.map(msg => msg._id);
      
      // Check if we actually need to update to avoid loop
      const hasNewLinks = allLinkIds.some(id => !seenLinks.includes(id));
      
      if (hasNewLinks) {
        localStorage.setItem(`footage_seen_${orderId}`, JSON.stringify(allLinkIds));
        setSeenLinks(allLinkIds);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, userRole, footageLinks.length, orderId]);

  const unseenCount = userRole === "editor" 
    ? footageLinks.filter(msg => !seenLinks.includes(msg._id)).length 
    : 0;

  // Calculate stages
  const getPaymentStageIndex = () => {
    if (order?.paymentStatus === "released") return 2;
    if (order?.paymentStatus === "escrow" || order?.paymentStatus === "paid") return 1;
    return 0;
  };

  const getWorkStageIndex = () => {
    const statusMap = { accepted: 0, in_progress: 1, submitted: 2, completed: 3 };
    return statusMap[order?.status] || 0;
  };

  const paymentStage = getPaymentStageIndex();
  const workStage = getWorkStageIndex();
  const orderAmount = order?.amount || 0;
  const platformFee = order?.platformFee || 0;
  const editorEarning = order?.editorEarning || orderAmount - platformFee;
  
  // Calculate percentage for display
  const feePercent = orderAmount > 0 ? Math.round((platformFee / orderAmount) * 100) : 10;

  const toggleTab = (tab) => {
    setActiveTab(activeTab === tab ? null : tab);
  };

  const tabs = [
    { 
      id: 'details', 
      label: 'Project Details', 
      icon: HiOutlineClipboardDocumentList,
      color: 'blue'
    },
    ...(footageLinks.length > 0 ? [{
      id: 'footage',
      label: 'Your Footage',
      icon: HiOutlineFolderOpen,
      color: 'emerald',
      badge: unseenCount > 0 ? unseenCount : footageLinks.length
    }] : [])
  ];

  return (
    <div className="border-t border-zinc-800/50 light:border-zinc-200">
      {/* Tab Bar - Single Row */}
      <div className="flex items-center bg-zinc-900/30 light:bg-zinc-50">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => toggleTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 ${
                isActive 
                  ? `border-${tab.color}-500 text-${tab.color}-500 bg-${tab.color}-500/5`
                  : 'border-transparent text-zinc-400 light:text-zinc-500 hover:text-zinc-200 light:hover:text-zinc-700 hover:bg-zinc-800/30 light:hover:bg-zinc-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.badge && (
                <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                  unseenCount > 0 && tab.id === 'footage'
                    ? 'bg-red-500 text-white animate-pulse' 
                    : 'bg-zinc-700 light:bg-zinc-200 text-zinc-300 light:text-zinc-600'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence>
        {activeTab && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="bg-zinc-900/50 light:bg-zinc-50 max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 light:scrollbar-thumb-zinc-300">
              
              {/* Project Details Content */}
              {activeTab === 'details' && (
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Progress Section */}
                  <div className="space-y-4">
                    {/* Payment Progress */}
                    <div className="bg-zinc-800/50 light:bg-white rounded-xl p-4 border border-zinc-700/50 light:border-zinc-200">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 rounded-lg bg-amber-500/15 light:bg-amber-100">
                          <HiOutlineCreditCard className="text-amber-500 w-4 h-4" />
                        </div>
                        <h4 className="text-sm font-semibold text-white light:text-zinc-900">Payment Status</h4>
                      </div>
                      <div className="space-y-2.5 pl-1">
                        {PAYMENT_STAGES.map((stage, index) => {
                          const isActive = index <= paymentStage;
                          const isCurrent = index === paymentStage;
                          return (
                            <div key={stage.key} className="flex items-center gap-3 relative">
                              {index < PAYMENT_STAGES.length - 1 && (
                                <div className={`absolute left-[9px] top-5 w-0.5 h-4 ${
                                  index < paymentStage ? "bg-emerald-500" : "bg-zinc-600 light:bg-zinc-300"
                                }`} />
                              )}
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center z-10 shrink-0 ${
                                isActive ? "bg-emerald-500" : "bg-zinc-600 light:bg-zinc-300"
                              }`}>
                                {isActive && <HiOutlineCheckCircle className="text-white text-xs" />}
                              </div>
                              <span className={`text-xs font-medium ${
                                isCurrent ? "text-emerald-400 light:text-emerald-600"
                                  : isActive ? "text-zinc-300 light:text-zinc-600"
                                  : "text-zinc-500 light:text-zinc-400"
                              }`}>{stage.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Work Progress */}
                    <div className="bg-zinc-800/50 light:bg-white rounded-xl p-4 border border-zinc-700/50 light:border-zinc-200">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 rounded-lg bg-blue-500/15 light:bg-blue-100">
                          <HiOutlineClipboardDocumentCheck className="text-blue-500 w-4 h-4" />
                        </div>
                        <h4 className="text-sm font-semibold text-white light:text-zinc-900">Work Status</h4>
                      </div>
                      <div className="space-y-2.5 pl-1">
                        {WORK_STAGES.map((stage, index) => {
                          const isActive = index <= workStage;
                          const isCurrent = index === workStage;
                          return (
                            <div key={stage.key} className="flex items-center gap-3 relative">
                              {index < WORK_STAGES.length - 1 && (
                                <div className={`absolute left-[9px] top-5 w-0.5 h-4 ${
                                  index < workStage ? "bg-blue-500" : "bg-zinc-600 light:bg-zinc-300"
                                }`} />
                              )}
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center z-10 shrink-0 ${
                                isActive ? "bg-blue-500" : "bg-zinc-600 light:bg-zinc-300"
                              }`}>
                                {isActive && <HiOutlineCheckCircle className="text-white text-xs" />}
                              </div>
                              <span className={`text-xs font-medium ${
                                isCurrent ? "text-blue-400 light:text-blue-600"
                                  : isActive ? "text-zinc-300 light:text-zinc-600"
                                  : "text-zinc-500 light:text-zinc-400"
                              }`}>{stage.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Receipt Section */}
                  <div className="bg-zinc-800/50 light:bg-white rounded-xl p-4 border border-zinc-700/50 light:border-zinc-200 h-fit">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-1.5 rounded-lg bg-emerald-500/15 light:bg-emerald-100">
                        <HiOutlineReceiptPercent className="text-emerald-500 w-4 h-4" />
                      </div>
                      <h4 className="text-sm font-semibold text-white light:text-zinc-900">Order Receipt</h4>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400 light:text-zinc-500 text-sm">Order Amount</span>
                        <span className="text-white light:text-zinc-900 font-semibold flex items-center gap-1">
                          <FaRupeeSign className="text-xs" />
                          {orderAmount.toLocaleString("en-IN")}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400 light:text-zinc-500 text-sm">Platform Fee ({feePercent}%)</span>
                        <span className="text-red-400 font-medium flex items-center gap-1">
                          - <FaRupeeSign className="text-xs" />
                          {platformFee.toLocaleString("en-IN")}
                        </span>
                      </div>

                      <div className="border-t border-zinc-700/50 light:border-zinc-200 my-2" />

                      <div className="flex items-center justify-between bg-emerald-500/10 light:bg-emerald-50 rounded-lg p-3 -mx-1">
                        <span className="text-white light:text-zinc-900 font-semibold text-sm">
                          {order?.editor?._id === order?.currentUserId ? "You Receive" : "Editor Receives"}
                        </span>
                        <span className="text-emerald-400 light:text-emerald-600 font-bold text-lg flex items-center gap-1">
                          <FaRupeeSign className="text-sm" />
                          {editorEarning.toLocaleString("en-IN")}
                        </span>
                      </div>

                      <div className="mt-3 pt-3 border-t border-zinc-700/50 light:border-zinc-200 space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Order ID</span>
                          <span className="text-zinc-300 light:text-zinc-600 font-mono">{order?.orderNumber || order?._id?.slice(-8)}</span>
                        </div>
                        {order?.deadline && (
                          <div className="flex justify-between">
                            <span className="text-zinc-500">Deadline</span>
                            <span className="text-amber-400 light:text-amber-600 font-medium">
                              {new Date(order.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Footage Content */}
              {activeTab === 'footage' && (
                <div className="p-4 space-y-2">
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
                            : "bg-zinc-800/50 light:bg-white border-zinc-700/50 light:border-zinc-200"
                        }`}
                      >
                        {isNew && (
                          <div className="absolute top-2 right-2">
                            <FaCircle className="text-emerald-400 text-[8px] animate-pulse" />
                          </div>
                        )}

                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl ${providerInfo.bg} flex items-center justify-center text-xl shrink-0`}>
                            {providerInfo.icon}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-white light:text-zinc-900 text-sm truncate">
                              {link.title || "Raw Footage"}
                            </h4>
                            <p className="text-zinc-500 light:text-zinc-400 text-[11px]">
                              {providerInfo.name} • {sentDate.toLocaleDateString()}
                            </p>
                          </div>

                          <button
                            onClick={() => {
                              if (onLinkClick) {
                                onLinkClick(link.url, link.title || "Shared Files");
                              } else {
                                window.open(link.url, "_blank");
                              }
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
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatInfoTabs;
