/**
 * Client Messages Page - Professional Corporate Design
 * Chat list with advanced loading animation and Brief type support
 */
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiChatAlt2,
  HiSearch,
  HiShoppingCart,
  HiMail,
  HiChevronRight,
  HiCurrencyRupee,
  HiClock,
  HiRefresh,
  HiInbox,
  HiClipboardList,
  HiCheckCircle,
  HiExclamation,
} from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { useSocket } from "../context/SocketContext";
import axios from "axios";
import { toast } from "react-toastify";
import ClientSidebar from "../components/ClientSidebar.jsx";
import ClientNavbar from "../components/ClientNavbar.jsx";

const STATUS_CONFIG = {
  accepted: { 
    label: "Accepted", 
    color: "text-emerald-400", 
    bg: "bg-emerald-500/10", 
    border: "border-emerald-500/20" 
  },
  in_progress: { 
    label: "In Progress", 
    color: "text-amber-400", 
    bg: "bg-amber-500/10", 
    border: "border-amber-500/20" 
  },
  submitted: { 
    label: "Submitted", 
    color: "text-purple-400", 
    bg: "bg-purple-500/10", 
    border: "border-purple-500/20" 
  },
  completed: { 
    label: "Completed", 
    color: "text-emerald-400", 
    bg: "bg-emerald-500/10", 
    border: "border-emerald-500/20" 
  },
};

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
              className="absolute w-2 h-2 rounded-full bg-emerald-500"
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
        className="absolute inset-4 rounded-full bg-emerald-500/20 border border-emerald-500/30"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Center icon */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{ scale: [0.9, 1, 0.9] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <HiChatAlt2 className="text-emerald-400 text-lg" />
      </motion.div>
    </div>
  );
};

const ClientMessages = () => {
  const navigate = useNavigate();
  const { user, backendURL } = useAppContext();
  const socketContext = useSocket();
  const { onlineUsers = [] } = socketContext || {};

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchChats = useCallback(async () => {
    try {
      setLoading(true);
      const token = user?.token;

      const res = await axios.get(`${backendURL}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Filter only orders with active chats (accepted+)
      const activeChats = (res.data.orders || []).filter(order => 
        ["accepted", "in_progress", "submitted", "completed"].includes(order.status)
      );

      // Fetch unread counts from dedicated endpoint
      let unreadCounts = {};
      try {
        const unreadRes = await axios.get(`${backendURL}/api/messages/unread-per-order`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        unreadCounts = unreadRes.data.unreadCounts || {};
      } catch (err) {
        console.error("Failed to fetch unread counts:", err);
      }

      // Fetch only the last message for each chat
      const chatsWithMessages = await Promise.all(
        activeChats.map(async (chat) => {
          try {
            const msgRes = await axios.get(`${backendURL}/api/messages/${chat._id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const messages = msgRes.data.messages || [];
            
            return {
              ...chat,
              lastMessage: messages.length > 0 ? messages[messages.length - 1] : null,
              unreadCount: unreadCounts[chat._id] || 0,
            };
          } catch {
            return { ...chat, lastMessage: null, unreadCount: unreadCounts[chat._id] || 0 };
          }
        })
      );

      // Sort by latest message time
      chatsWithMessages.sort((a, b) => {
        const aTime = a.lastMessage?.createdAt || a.updatedAt;
        const bTime = b.lastMessage?.createdAt || b.updatedAt;
        return new Date(bTime) - new Date(aTime);
      });

      setChats(chatsWithMessages);
    } catch (err) {
      toast.error("Failed to load chats");
    } finally {
      setLoading(false);
    }
  }, [backendURL, user?.token]);

  useEffect(() => {
    if (user?.token) {
      fetchChats();
    }
  }, [user?.token, fetchChats]);

  const formatDate = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return "Yesterday";
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  // Filter chats by search
  const filteredChats = chats.filter(chat => {
    const searchLower = search.toLowerCase();
    return (
      chat.title?.toLowerCase().includes(searchLower) ||
      chat.editor?.name?.toLowerCase().includes(searchLower) ||
      chat.orderNumber?.toString().includes(searchLower)
    );
  });

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#030303] light:bg-slate-50 text-white light:text-slate-900 transition-colors duration-300" style={{ fontFamily: "'Inter', sans-serif" }}>
      <ClientSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <ClientNavbar onMenuClick={() => setSidebarOpen(true)} />

      <main className="flex-1 px-4 md:px-6 py-5 md:ml-64 md:mt-20">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <HiChatAlt2 className="text-emerald-400 text-lg" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white light:text-slate-900">Messages</h1>
              <p className="text-gray-500 text-[10px]">{chats.length} active conversations</p>
            </div>
          </div>
          <button
            onClick={() => fetchChats()}
            disabled={loading}
            className="p-2 rounded-lg bg-[#0A0A0C] light:bg-white border border-[#1a1a1f] light:border-slate-200 text-gray-400 hover:text-white light:hover:text-slate-900 transition-colors disabled:opacity-50"
          >
            <HiRefresh className={`text-sm ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by editor name or project..."
            className="w-full bg-[#0A0A0C] light:bg-white border border-[#1a1a1f] light:border-slate-200 rounded-lg pl-9 pr-4 py-2.5 text-xs text-white light:text-slate-900 placeholder:text-gray-600 focus:border-[#2a2a30] outline-none transition-all"
          />
        </div>

        {/* Loading State with Advanced Animation */}
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
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#0A0A0C] light:bg-slate-100 flex items-center justify-center">
              <HiInbox className="text-2xl text-gray-500" />
            </div>
            <h3 className="text-sm font-medium text-white light:text-slate-900 mb-1">
              {search ? "No chats found" : "No Active Chats"}
            </h3>
            <p className="text-gray-500 text-xs mb-4">
              {search ? "Try a different search" : "Chats appear when an editor accepts your order"}
            </p>
            {!search && (
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  onClick={() => navigate("/client-home")}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white text-xs font-medium transition-colors"
                >
                  Browse Editors
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
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
                    onClick={() => navigate(`/chat/${chat._id}`)}
                    className="bg-[#0A0A0C] light:bg-white border border-[#1a1a1f] light:border-slate-200 rounded-xl p-3 cursor-pointer hover:border-[#2a2a30] light:hover:border-slate-300 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      {/* Editor Avatar with Online & Unread */}
                      <div className="relative flex-shrink-0">
                        <img
                          src={chat.editor?.profilePicture || "/default-avatar.png"}
                          alt={chat.editor?.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                        {/* Online indicator */}
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0A0A0C] light:border-white ${isOnline ? 'bg-emerald-500' : 'bg-gray-500'}`} />
                        
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
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <h3 className={`text-xs font-medium truncate group-hover:text-emerald-400 transition-colors ${chat.unreadCount > 0 ? 'text-white light:text-slate-900' : 'text-gray-400 light:text-slate-600'}`}>
                            {chat.editor?.name}
                          </h3>
                          {/* Type Tag */}
                          <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-medium border ${typeConfig.bg} ${typeConfig.color} ${typeConfig.border}`}>
                            <TypeIcon className="text-[8px]" />
                            {typeConfig.label}
                          </span>
                        </div>
                        
                        {/* Last Message Preview */}
                        <p className={`text-[11px] truncate mb-1 ${chat.unreadCount > 0 ? 'text-white light:text-slate-800 font-medium' : 'text-gray-500'}`}>
                          {lastMsgContent.length > 40 ? lastMsgContent.substring(0, 40) + "..." : lastMsgContent}
                        </p>
                        
                        <div className="flex flex-wrap items-center gap-2 text-[9px]">
                          <span className="flex items-center gap-0.5 text-emerald-400 font-medium">
                            <HiCurrencyRupee className="text-[9px]" /> {chat.amount?.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-0.5 text-gray-600">
                            <HiClock className="text-[9px]" />
                            {formatDate(chat.lastMessage?.createdAt || chat.createdAt)}
                          </span>
                          
                          {/* Deadline Indicator */}
                          {deadlineStatus && chat.status !== "completed" && (
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
                        <HiChevronRight className="text-gray-600 text-sm group-hover:text-emerald-400 transition-colors" />
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
