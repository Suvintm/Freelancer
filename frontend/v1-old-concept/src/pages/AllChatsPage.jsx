import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import useRefreshManager from "../hooks/useRefreshManager.js";
import usePullToRefresh from "../hooks/usePullToRefresh.jsx";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaArrowLeft,
  FaSearch,
  FaComments,
  FaShoppingCart,
  FaEnvelope,
  FaChevronRight,
  FaRupeeSign,
  FaCircle,
  FaCreditCard,
  FaClipboardList,
  FaThumbtack,
  FaFilter,
  FaClock,
} from "react-icons/fa";
import { HiOutlineAdjustmentsHorizontal, HiOutlineHashtag } from "react-icons/hi2";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { useSocket } from "../context/SocketContext";
import axios from "axios";
import { toast } from "react-toastify";
import UnifiedNavigation from "../components/UnifiedNavigation.jsx";

// Status configuration for different order states
const STATUS_CONFIG = {
  new: { label: "NEW ORDER", color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20" },
  awaiting_payment: { label: "Awaiting Payment", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  accepted: { label: "Accepted", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  in_progress: { label: "In Progress", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  submitted: { label: "Submitted", color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
  completed: { label: "Completed", color: "text-zinc-400", bg: "bg-zinc-500/10", border: "border-zinc-500/20" },
  rejected: { label: "Rejected", color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20" },
  cancelled: { label: "Cancelled", color: "text-zinc-500", bg: "bg-zinc-500/5", border: "border-zinc-500/10" },
};

// Tab configuration
const TABS = [
  { id: "all", label: "All Chats", icon: FaComments },
  { id: "gigs", label: "Gigs", icon: FaShoppingCart },
  { id: "requested", label: "Requested", icon: FaEnvelope },
  { id: "briefs", label: "Briefs", icon: FaClipboardList },
];

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
  if (percentUsed >= 90 || daysLeft <= 1) color = "text-rose-400 bg-rose-500/10";
  else if (percentUsed >= 70 || daysLeft <= 2) color = "text-amber-400 bg-amber-500/10";
  else if (percentUsed >= 50 || daysLeft <= 3) color = "text-yellow-400 bg-yellow-500/10";
  
  if (daysLeft < 0) return { text: "Overdue", color: "text-rose-500 bg-rose-500/20", daysLeft: 0 };
  return { 
    text: daysLeft === 0 ? "Today" : daysLeft === 1 ? "1d left" : `${daysLeft}d left`,
    color,
    daysLeft
  };
};
const sortChats = (chats) => {
  return [...chats].sort((a, b) => {
    const aPinned = a.pinnedBy?.length > 0;
    const bPinned = b.pinnedBy?.length > 0;
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    const aTime = new Date(a.lastActivityAt || a.updatedAt || a.createdAt);
    const bTime = new Date(b.lastActivityAt || b.updatedAt || b.createdAt);
    return bTime - aTime;
  });
};

const AllChatsPage = () => {
  const navigate = useNavigate();
  const { user, backendURL } = useAppContext();
  const socketContext = useSocket();
  const { typingUsers = {}, onlineUsers = [] } = socketContext || {};

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const scrollContainerRef = useRef(null);
  const { triggerRefresh } = useRefreshManager();
  const [chats, setChats] = useState([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  


  // ── DATA FETCHING ──────────────────────────────────────────────────
  const { data: chatData, isLoading: chatsLoading, refetch } = useQuery({
    queryKey: ['orders', 'chats'],
    queryFn: async () => {
      const token = user?.token;
      const res = await axios.get(`${backendURL}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const allStatuses = ['new', 'awaiting_payment', 'accepted', 'in_progress', 'submitted', 'completed', 'cancelled', 'rejected', 'disputed', 'expired'];
      const activeChats = (res.data.orders || []).filter(order => allStatuses.includes(order.status));

      let unreadCounts = {};
      try {
        const unreadRes = await axios.get(`${backendURL}/api/messages/unread-per-order`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        unreadCounts = unreadRes.data.unreadCounts || {};
      } catch (err) { console.error(err); }

      const chatsWithData = activeChats.map(chat => ({
        ...chat,
        lastMessage: chat.latestMessage || null,
        unreadCount: unreadCounts[chat._id] || 0,
      }));

      return sortChats(chatsWithData);
    },
    enabled: !!user?.token,
  });

  const loading = chatsLoading;
  
  const hasLoadedOnce = useRef(false);

  useEffect(() => {
    if (!loading) hasLoadedOnce.current = true;
  }, [loading]);

  // Pull-to-Refresh Integration
  const { handleTouchStart, handleTouchEnd, PullIndicator } = usePullToRefresh(
    () => triggerRefresh(true, [['orders', 'chats']]), 
    scrollContainerRef
  );

  // Sync state with query data
  useEffect(() => {
    if (chatData) {
      setChats(chatData);
    }
  }, [chatData]);

  // Handle Socket Events for Real-time Refresh
  // Optimized for persistent TabSwitcher (keeps listeners unique)
  useEffect(() => {
    const socket = socketContext?.socket;
    if (!socket || !user?._id) return;

    console.log("[AllChatsPage] Registering socket listeners...");

    const handleSocketUpdate = () => {
      refetch();
    };

    socket.on("message:new", handleSocketUpdate);
    socket.on("message:read", handleSocketUpdate);
    socket.on("order:update", handleSocketUpdate); // Added for broader status updates

    return () => {
      console.log("[AllChatsPage] Cleaning up socket listeners...");
      socket.off("message:new", handleSocketUpdate);
      socket.off("message:read", handleSocketUpdate);
      socket.off("order:update", handleSocketUpdate);
    };
  }, [socketContext?.socket, user?._id, refetch]);



  const togglePin = async (e, orderId) => {
    e.stopPropagation();
    try {
      const res = await axios.patch(`${backendURL}/api/orders/${orderId}/pin`, {}, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      
      setChats(prev => {
        const updated = prev.map(c => {
          if (c._id === orderId) {
            const pinnedBy = [...(c.pinnedBy || [])];
            const userId = user?._id;
            const idx = pinnedBy.indexOf(userId);
            if (idx > -1) pinnedBy.splice(idx, 1);
            else pinnedBy.push(userId);
            return { ...c, pinnedBy };
          }
          return c;
        });
        return sortChats(updated);
      });
      toast.success(res.data.message);
    } catch (err) {
      toast.error("Failed to pin conversation");
    }
  };

  const getOtherParty = (order) => user?.role === "editor" ? order.client : order.editor;

  const formatMessageTime = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
    if (diffDays < 7) return d.toLocaleDateString("en-IN", { weekday: "short" });
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  const filteredChats = chats.filter(chat => {
    const searchLower = search.toLowerCase();
    const otherParty = getOtherParty(chat);
    const matchesSearch = chat.title?.toLowerCase().includes(searchLower) || otherParty?.name?.toLowerCase().includes(searchLower) || chat.orderNumber?.toString().includes(searchLower);
    const matchesTab = activeTab === "all" || (activeTab === "gigs" && chat.type === "gig") || (activeTab === "requested" && chat.type === "request") || (activeTab === "briefs" && chat.type === "brief");
    return matchesSearch && matchesTab;
  });

  const gigCount = chats.filter(c => c.type === "gig").length;
  const requestCount = chats.filter(c => c.type === "request").length;
  const briefCount = chats.filter(c => c.type === "brief").length;

  const ShimmerCard = () => (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-zinc-800" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 bg-zinc-800 rounded" />
          <div className="h-3 w-48 bg-zinc-800 rounded" />
        </div>
        <div className="h-6 w-20 bg-zinc-800 rounded-lg" />
      </div>
    </div>
  );

  if (loading && !hasLoadedOnce.current) {
    return (
      <div className="min-h-screen bg-black text-white">
        <UnifiedNavigation sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 px-4 md:px-6 py-6 pt-24 md:ml-64">
           <div className="space-y-4">
             <div className="h-8 w-48 bg-zinc-900 rounded mb-6" />
             {[1,2,3,4].map(i => <ShimmerCard key={i} />)}
           </div>
        </main>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-black text-white selection:bg-white/10" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <UnifiedNavigation sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main 
        ref={scrollContainerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="flex-1 md:ml-64 md:mt-16 overflow-y-auto px-3 sm:px-4 md:px-8 py-4"
      >
        <PullIndicator />
        {/* Header Section */}
        <div className="flex flex-col gap-3 mb-5">
          <div>
            <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] font-bold tracking-widest uppercase mb-0.5">
              <HiOutlineHashtag className="text-sm" />
              Direct Communication
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Messages</h1>
            <p className="text-zinc-500 text-xs sm:text-sm mt-0.5">Manage your {chats.length} active projects and collaborations</p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative group flex-1">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs group-focus-within:text-white transition-colors" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by project, user or ID..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2.5 text-sm placeholder:text-zinc-600 focus:border-white/20 focus:ring-0 outline-none transition-all"
              />
            </div>
            <button className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-colors shrink-0">
              <HiOutlineAdjustmentsHorizontal className="text-lg text-zinc-400" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1 no-scrollbar" style={{scrollbarWidth:'none'}}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            const count = tab.id === "all" ? chats.length : tab.id === "gigs" ? gigCount : tab.id === "briefs" ? briefCount : requestCount;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[11px] font-bold whitespace-nowrap transition-all border shrink-0 ${
                  isActive 
                    ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.15)]" 
                    : "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
                }`}
              >
                <tab.icon className={`text-[10px] ${isActive ? "text-black" : "text-zinc-500"}`} />
                {tab.label}
                <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${
                  isActive ? "bg-black/10 text-black" : "bg-zinc-800 text-zinc-500"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Chat List Grid */}
        <div className="grid gap-4">
          <AnimatePresence mode="popLayout">
            {filteredChats.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20 bg-zinc-900/30 rounded-3xl border border-zinc-800/50 border-dashed"
              >
                <div className="p-5 bg-zinc-900 rounded-full mb-4">
                  <FaComments className="text-3xl text-zinc-700" />
                </div>
                <h3 className="text-zinc-400 font-bold uppercase tracking-wider text-xs">No conversations found</h3>
                <p className="text-zinc-600 text-sm mt-2">Try adjusting your filters or search terms</p>
              </motion.div>
            ) : (
              filteredChats.map((chat, idx) => {
                const otherParty = getOtherParty(chat);
                const isPinned = chat.pinnedBy?.includes(user?._id);
                const isOnline = onlineUsers.includes(otherParty?._id);
                const status = STATUS_CONFIG[chat.status] || STATUS_CONFIG.in_progress;
                const deadline = getDeadlineStatus(chat.deadline, chat.createdAt);
                const isTyping = typingUsers[chat._id]?.length > 0;

                return (
                  <motion.div
                    key={chat._id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, delay: idx * 0.03 }}
                    onClick={() => navigate(`/chat/${chat._id}`)}
                    className={`group relative bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800 rounded-2xl p-3 sm:p-4 cursor-pointer transition-all duration-300 overflow-hidden ${isPinned ? 'border-white/10 ring-1 ring-white/5' : ''}`}
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      {/* Avatar with Status */}
                      <div className="relative shrink-0">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-zinc-800 ring-2 ring-black">
                          <img
                            src={otherParty?.profilePicture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                            alt={otherParty?.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {isOnline ? (
                          <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#09090B]" />
                        ) : (
                          <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-zinc-700 border-2 border-[#09090B]" />
                        )}
                        {isPinned && (
                          <div className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-white text-black rounded-full flex items-center justify-center shadow-lg transform -rotate-12 border border-zinc-200 z-10">
                            <FaThumbtack className="text-[10px]" />
                          </div>
                        )}
                        {chat.unreadCount > 0 && (
                          <div className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 min-w-[18px] h-4.5 bg-white text-black text-[9px] font-black rounded-full flex items-center justify-center shadow-xl z-20">
                            {chat.unreadCount}
                          </div>
                        )}
                      </div>

                      {/* Content Section */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <h3 className="text-sm sm:text-base font-bold truncate tracking-tight">
                              {otherParty?.name}
                            </h3>
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ring-1 ring-inset shrink-0 ${
                              chat.type === "gig" ? "bg-violet-500/10 text-violet-400 ring-violet-500/20" : 
                              chat.type === "brief" ? "bg-blue-500/10 text-blue-400 ring-blue-500/20" : 
                              "bg-cyan-500/10 text-cyan-400 ring-cyan-500/20"
                            } uppercase tracking-tighter`}>
                              {chat.type}
                            </span>
                            {isPinned && <FaThumbtack className="text-zinc-500 text-[9px] rotate-45 shrink-0" />}
                          </div>
                          <div className="text-zinc-500 text-[10px] font-medium shrink-0">
                            {formatMessageTime(chat.lastMessage?.createdAt || chat.lastActivityAt || chat.updatedAt)}
                          </div>
                        </div>

                        {/* Last Message Preview */}
                        <div className="mb-3">
                          {isTyping ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-emerald-400 font-bold tracking-wide italic">Typing...</span>
                              <div className="flex gap-1">
                                {[0, 0.2, 0.4].map(d => <motion.div key={d} animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: d }} className="w-1 h-1 bg-emerald-400 rounded-full" />)}
                              </div>
                            </div>
                          ) : (
                            <p className={`text-xs sm:text-sm truncate ${chat.unreadCount > 0 ? 'text-zinc-100 font-semibold' : 'text-zinc-500'}`}>
                              {chat.lastMessage?.sender?._id === user?._id && <span className="text-zinc-600 font-bold mr-1">You:</span>}
                              {chat.lastMessage?.type === "image" ? "📷 Shared a photo" :
                               chat.lastMessage?.type === "video" ? "🎥 Shared a reel" :
                               chat.lastMessage?.type === "file" ? "📎 Attached a document" :
                               chat.lastMessage?.content || "No messages yet"}
                            </p>
                          )}
                        </div>

                        {/* Meta Data Row */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <div className="flex items-center gap-1 px-2 py-0.5 bg-black rounded-full border border-zinc-800">
                             <FaRupeeSign className="text-[9px] text-zinc-500" />
                             <span className="text-[10px] font-bold text-zinc-200">{chat.amount?.toLocaleString()}</span>
                          </div>
                          
                          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border ${status.bg} ${status.border} ${status.color} text-[9px] font-black uppercase tracking-widest`}>
                            {status.label}
                          </div>

                          {deadline && !["completed", "cancelled", "rejected"].includes(chat.status) && (
                            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border ${deadline.color} text-[9px] font-bold`}>
                               <FaClock className="text-[9px]" />
                               {deadline.text}
                            </div>
                          )}
                          
                          {chat.type === "request" && chat.paymentStatus === "escrow" && (
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-tight">
                              <FaCreditCard className="text-[9px]" /> Secured
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action - Pin & Navigation */}
                      <div className="flex flex-col items-center gap-1.5 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-300">
                         <button 
                           onClick={(e) => togglePin(e, chat._id)}
                           className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl border transition-all ${isPinned ? 'bg-white text-black border-white shadow-md' : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white hover:border-zinc-600'}`}
                         >
                           <FaThumbtack className={`text-[10px] sm:text-xs ${isPinned ? '' : '-rotate-45'}`} />
                         </button>
                         <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-zinc-800 text-zinc-400 border border-zinc-700 hidden sm:block">
                            <FaChevronRight className="text-[9px] sm:text-[10px]" />
                         </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default AllChatsPage;
