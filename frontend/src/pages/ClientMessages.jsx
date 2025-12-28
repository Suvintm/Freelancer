// ClientMessages.jsx - Professional Corporate UI with Advanced Loading Animation
import React, { useState, useEffect } from "react";
import {
  HiChatAlt2,
  HiSearch,
  HiInbox,
  HiClock,
  HiCurrencyRupee,
  HiChevronRight,
  HiExclamation,
  HiCheckCircle,
  HiShoppingCart,
  HiMail,
  HiClipboardList,
} from "react-icons/hi";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { useAppContext } from "../context/AppContext";
import { useSocket } from "../context/SocketContext";
import ClientSidebar from "../components/ClientSidebar.jsx";
import ClientNavbar from "../components/ClientNavbar.jsx";

// Status Configuration
const STATUS_CONFIG = {
  new: { label: "New", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  accepted: { label: "Accepted", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  in_progress: { label: "In Progress", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  submitted: { label: "Submitted", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  completed: { label: "Completed", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  rejected: { label: "Rejected", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
  cancelled: { label: "Cancelled", color: "text-gray-400", bg: "bg-gray-500/10", border: "border-gray-500/20" },
  disputed: { label: "Disputed", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
};

// Order Type Configuration
const ORDER_TYPE_CONFIG = {
  gig: {
    label: "Gig",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    icon: HiShoppingCart,
  },
  request: {
    label: "Request",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
    icon: HiMail,
  },
  brief: {
    label: "Brief",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    icon: HiClipboardList,
  },
};

// Calculate deadline status
const getDeadlineStatus = (deadline, createdAt) => {
  if (!deadline) return null;
  
  const now = new Date();
  const end = new Date(deadline);
  const start = new Date(createdAt);
  
  const totalDuration = end - start;
  const elapsed = now - start;
  const remaining = end - now;
  const percentUsed = (elapsed / totalDuration) * 100;
  
  const daysLeft = Math.ceil(remaining / (1000 * 60 * 60 * 24));
  
  let color = "text-emerald-400 bg-emerald-500/10";
  if (percentUsed >= 90 || daysLeft <= 1) {
    color = "text-red-400 bg-red-500/10";
  } else if (percentUsed >= 70 || daysLeft <= 2) {
    color = "text-orange-400 bg-orange-500/10";
  } else if (percentUsed >= 50 || daysLeft <= 3) {
    color = "text-amber-400 bg-amber-500/10";
  }
  
  if (daysLeft < 0) {
    return { text: "Overdue", color: "text-red-500 bg-red-500/20", daysLeft: 0 };
  }
  
  return { 
    text: daysLeft === 0 ? "Today" : daysLeft === 1 ? "1d left" : `${daysLeft}d left`,
    color,
    daysLeft
  };
};

// Advanced Dotted Circle Spinner Component
const DottedSpinner = () => {
  const dots = 12;
  
  return (
    <div className="relative w-16 h-16">
      {/* Outer rotating ring of dots */}
      <motion.div
        className="absolute inset-0"
        animate={{ rotate: 360 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
      >
        {[...Array(dots)].map((_, i) => {
          const angle = (i / dots) * 360;
          const delay = i * 0.08;
          return (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-violet-500"
              style={{
                left: "50%",
                top: "50%",
                transform: `rotate(${angle}deg) translateY(-24px) translateX(-50%)`,
              }}
              animate={{
                opacity: [0.3, 1, 0.3],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay,
                ease: "easeInOut",
              }}
            />
          );
        })}
      </motion.div>
      
      {/* Inner pulsing circle */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-600/10 flex items-center justify-center">
          <HiChatAlt2 className="text-violet-400 text-sm" />
        </div>
      </motion.div>
    </div>
  );
};

// Format date helper
const formatDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const now = new Date();
  const diff = now - d;
  
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

// WhatsApp-style timestamp formatting
const formatMessageTime = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const now = new Date();
  const diff = now - d;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  // Same day - show time
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  }
  
  // Yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }
  
  // Within last 7 days - show day name
  if (days < 7) {
    return d.toLocaleDateString("en-IN", { weekday: "short" });
  }
  
  // Older - show date
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

const ClientMessages = () => {
  const navigate = useNavigate();
  const { backendURL, user } = useAppContext();
  const socketContext = useSocket();
  const { onlineUsers = [] } = socketContext || {};
  
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [unreadCounts, setUnreadCounts] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetch orders with chat capability
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const token = user?.token;
        const [ordersRes, unreadRes] = await Promise.all([
          axios.get(`${backendURL}/api/orders`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${backendURL}/api/messages/unread-per-order`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        
        // Filter orders that can have chats
        const chatOrders = ordersRes.data.orders.filter(order => 
          ["accepted", "in_progress", "submitted", "completed"].includes(order.status)
        );
        
        // Get last message for each order
        const chatsWithMessages = await Promise.all(
          chatOrders.map(async (order) => {
            try {
              const msgRes = await axios.get(`${backendURL}/api/messages/${order._id}?limit=1`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              return {
                ...order,
                lastMessage: msgRes.data.messages?.[0] || null,
                unreadCount: unreadRes.data.unreadCounts?.[order._id] || 0,
              };
            } catch {
              return { ...order, lastMessage: null, unreadCount: 0 };
            }
          })
        );
        
        // Sort by last message date
        chatsWithMessages.sort((a, b) => {
          const aDate = a.lastMessage?.createdAt || a.createdAt;
          const bDate = b.lastMessage?.createdAt || b.createdAt;
          return new Date(bDate) - new Date(aDate);
        });
        
        setChats(chatsWithMessages);
        setUnreadCounts(unreadRes.data.unreadCounts || {});
      } catch (err) {
        console.error(err);
        toast.error("Failed to load messages");
      } finally {
        setLoading(false);
      }
    };
    
    if (user?.token) fetchChats();
  }, [backendURL, user?.token]);

  // Filter chats by search
  const filteredChats = chats.filter(chat => 
    chat.editor?.name?.toLowerCase().includes(search.toLowerCase()) ||
    chat.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div 
      className="min-h-screen flex flex-col md:flex-row bg-[#09090B] light:bg-[#FAFAFA] text-white light:text-zinc-900"
      style={{ fontFamily: "'Manrope', sans-serif" }}
    >
      <ClientSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <ClientNavbar onMenuClick={() => setSidebarOpen(true)} />
      
      <main className="flex-1 px-4 md:px-6 py-4 pt-18 md:pt-4 md:ml-64 md:mt-16 overflow-x-hidden overflow-y-auto pb-24">
        
        {/* Header */}
        <div className="mb-5">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500/20 to-purple-500/10 rounded-xl flex items-center justify-center">
              <HiChatAlt2 className="text-violet-400 text-lg" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white light:text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Messages</h1>
              <p className="text-zinc-500 text-xs">{chats.length} conversations</p>
            </div>
          </div>
        </div>
        
        {/* Story Strip - Instagram Style */}
        {chats.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5"
          >
            <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide snap-x">
              {/* Get unique editors */}
              {(() => {
                const uniqueEditors = [];
                const seenIds = new Set();
                chats.forEach(chat => {
                  if (chat.editor?._id && !seenIds.has(chat.editor._id)) {
                    seenIds.add(chat.editor._id);
                    uniqueEditors.push({
                      ...chat.editor,
                      chatId: chat._id,
                      isOnline: onlineUsers.includes(chat.editor._id),
                      hasUnread: chat.unreadCount > 0
                    });
                  }
                });
                return uniqueEditors.slice(0, 10).map((editor, idx) => (
                  <motion.button
                    key={editor._id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate(`/chat/${editor.chatId}`)}
                    className="flex flex-col items-center gap-1.5 snap-start flex-shrink-0"
                  >
                    <div className={`relative p-0.5 rounded-full ${editor.hasUnread ? 'bg-gradient-to-br from-violet-500 to-purple-500' : 'bg-gradient-to-br from-zinc-600 to-zinc-700'}`}>
                      <div className="p-0.5 bg-[#09090B] rounded-full">
                        <img 
                          src={editor.profilePicture || "/default-avatar.png"} 
                          alt={editor.name}
                          className="w-14 h-14 rounded-full object-cover"
                        />
                      </div>
                      {/* Online indicator */}
                      {editor.isOnline && (
                        <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#09090B]" />
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-400 font-medium max-w-[60px] truncate">
                      {editor.name?.split(" ")[0]}
                    </span>
                  </motion.button>
                ));
              })()}
            </div>
          </motion.div>
        )}
        
        {/* Search Bar */}
        <div className="relative mb-5">
          <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search chats..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0d0d12] light:bg-white border border-white/[0.06] light:border-zinc-200 rounded-full pl-11 pr-4 py-3 text-white light:text-slate-900 text-sm focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all"
          />
        </div>
        
        {/* Chats List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <DottedSpinner />
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6 text-gray-500 text-xs"
            >
              Loading your messages...
            </motion.p>
            <motion.div
              className="flex gap-1 mt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-gray-600"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </motion.div>
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-500/5 flex items-center justify-center">
              <HiInbox className="text-2xl text-violet-400" />
            </div>
            <h3 className="text-sm font-bold text-white light:text-slate-900 mb-1">
              {search ? "No chats found" : "No Active Chats"}
            </h3>
            <p className="text-zinc-500 text-xs mb-4">
              {search ? "Try a different search" : "Chats appear when an editor accepts your order"}
            </p>
            {!search && (
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  onClick={() => navigate("/client-home")}
                  className="px-5 py-2.5 bg-gradient-to-r from-violet-500 to-purple-500 hover:opacity-90 rounded-xl text-white text-xs font-semibold transition-all shadow-lg shadow-violet-500/25"
                >
                  Browse Editors
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredChats.map((chat, index) => {
                const statusConfig = STATUS_CONFIG[chat.status] || STATUS_CONFIG.in_progress;
                const typeConfig = ORDER_TYPE_CONFIG[chat.type] || ORDER_TYPE_CONFIG.request;
                const TypeIcon = typeConfig.icon;
                const deadlineStatus = getDeadlineStatus(chat.deadline, chat.createdAt);
                const isOnline = chat.editor?._id && onlineUsers.includes(chat.editor._id);
                const lastMsgContent = chat.lastMessage?.content || chat.lastMessage?.type || "No messages yet";

                return (
                  <motion.div
                    key={chat._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.03 }}
                    whileHover={{ scale: 1.01, y: -2 }}
                    onClick={() => navigate(`/chat/${chat._id}`)}
                    className="relative overflow-hidden bg-[#0d0d12] light:bg-white border border-white/[0.06] light:border-zinc-200 rounded-2xl p-4 cursor-pointer hover:border-violet-500/30 light:hover:border-violet-300 transition-all group"
                  >
                    {/* Hover glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/0 to-purple-500/0 group-hover:from-violet-500/5 group-hover:to-purple-500/5 transition-all duration-300" />
                    
                    <div className="relative flex items-center gap-3">
                      {/* Editor Avatar with Online & Unread */}
                      <div className="relative flex-shrink-0">
                        <img
                          src={chat.editor?.profilePicture || "/default-avatar.png"}
                          alt={chat.editor?.name}
                          className="w-12 h-12 rounded-xl object-cover border-2 border-zinc-700 light:border-zinc-200 group-hover:border-emerald-500/50 transition-all"
                        />
                        {/* Online indicator */}
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-zinc-900 light:border-white ${isOnline ? 'bg-emerald-500' : 'bg-zinc-500'}`} />
                        
                        {/* Unread Badge */}
                        {chat.unreadCount > 0 && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full flex items-center justify-center text-white text-[9px] font-bold"
                          >
                            {chat.unreadCount > 9 ? "9+" : chat.unreadCount}
                          </motion.div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Row 1: Name + Timestamp */}
                        <div className="flex items-center justify-between mb-0.5">
                          <h3 className={`text-sm font-semibold truncate group-hover:text-violet-400 transition-colors ${chat.unreadCount > 0 ? 'text-white light:text-slate-900' : 'text-zinc-300 light:text-slate-600'}`}>
                            {chat.editor?.name}
                          </h3>
                          {/* WhatsApp-style Timestamp */}
                          <span className={`text-[10px] flex-shrink-0 ml-2 ${chat.unreadCount > 0 ? 'text-violet-400 font-semibold' : 'text-zinc-500'}`}>
                            {formatMessageTime(chat.lastMessage?.createdAt || chat.updatedAt)}
                          </span>
                        </div>
                        
                        {/* Row 2: Type Tag */}
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-medium border ${typeConfig.bg} ${typeConfig.color} ${typeConfig.border}`}>
                            <TypeIcon className="text-[8px]" />
                            {typeConfig.label}
                          </span>
                        </div>
                        
                        {/* Row 3: Last Message Preview */}
                        <p className={`text-[11px] truncate mb-1.5 ${chat.unreadCount > 0 ? 'text-white light:text-slate-800 font-medium' : 'text-zinc-500'}`}>
                          {/* Add "You:" prefix if current user sent the message */}
                          {chat.lastMessage?.sender?._id === user?._id && <span className="text-zinc-400">You: </span>}
                          {chat.lastMessage?.type === "image" ? "📷 Photo" :
                           chat.lastMessage?.type === "video" ? "🎥 Video" :
                           chat.lastMessage?.type === "file" ? "📎 File" :
                           chat.lastMessage?.type === "system" ? "📢 " + (chat.lastMessage?.content?.substring(0, 30) || "System") :
                           chat.lastMessage?.type === "payment_request" ? "💳 Payment Request" :
                           lastMsgContent.length > 35 ? lastMsgContent.substring(0, 35) + "..." : lastMsgContent}
                        </p>
                        
                        {/* Row 4: Amount + Deadline */}
                        <div className="flex flex-wrap items-center gap-2 text-[9px]">
                          <span className="flex items-center gap-0.5 text-violet-400 font-medium">
                            <HiCurrencyRupee className="text-[9px]" /> {chat.amount?.toLocaleString()}
                          </span>
                          
                          {/* Deadline Indicator or Overdue/Refunded Tags */}
                          {chat.overdueRefunded ? (
                            <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              💸 Refunded
                            </span>
                          ) : chat.isOverdue ? (
                            <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
                              ⚠️ Overdue
                            </span>
                          ) : deadlineStatus && chat.status !== "completed" && (
                            <span className={`flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] font-medium ${deadlineStatus.color}`}>
                              <HiExclamation className="text-[8px]" />
                              {deadlineStatus.text}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status + Arrow */}
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded border ${statusConfig.bg} ${statusConfig.color} ${statusConfig.border}`}>
                          {statusConfig.label}
                        </span>
                        <HiChevronRight className="text-gray-600 text-sm group-hover:text-violet-400 transition-colors" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
};

export default ClientMessages;
