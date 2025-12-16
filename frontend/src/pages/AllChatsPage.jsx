// AllChatsPage.jsx - Displays list of chats with tabs: All, Gigs, Requested
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaArrowLeft,
  FaSearch,
  FaComments,
  FaShoppingCart,
  FaEnvelope,
  FaChevronRight,
  FaRupeeSign,
  FaClock,
  FaCircle,
  FaCheckCircle,
  FaExclamationCircle,
  FaHourglassHalf,
  FaCreditCard,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { useSocket } from "../context/SocketContext";
import axios from "axios";
import { toast } from "react-toastify";
import Sidebar from "../components/Sidebar.jsx";
import EditorNavbar from "../components/EditorNavbar.jsx";

// Status configuration for different order states
const STATUS_CONFIG = {
  new: { label: "New Request", color: "text-amber-400", bg: "bg-amber-500/20" },
  awaiting_payment: { label: "Awaiting Payment", color: "text-orange-400", bg: "bg-orange-500/20" },
  accepted: { label: "Accepted", color: "text-green-400", bg: "bg-green-500/20" },
  in_progress: { label: "In Progress", color: "text-yellow-400", bg: "bg-yellow-500/20" },
  submitted: { label: "Submitted", color: "text-purple-400", bg: "bg-purple-500/20" },
  completed: { label: "Completed", color: "text-emerald-400", bg: "bg-emerald-500/20" },
  rejected: { label: "Rejected", color: "text-red-400", bg: "bg-red-500/20" },
  cancelled: { label: "Cancelled", color: "text-gray-400", bg: "bg-gray-500/20" },
};

// Tab configuration
const TABS = [
  { id: "all", label: "All", icon: FaComments },
  { id: "gigs", label: "Gigs", icon: FaShoppingCart },
  { id: "requested", label: "Requested", icon: FaEnvelope },
];

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
  
  let color = "text-green-400 bg-green-500/20";
  if (percentUsed >= 90 || daysLeft <= 1) {
    color = "text-red-400 bg-red-500/20";
  } else if (percentUsed >= 70 || daysLeft <= 2) {
    color = "text-orange-400 bg-orange-500/20";
  } else if (percentUsed >= 50 || daysLeft <= 3) {
    color = "text-yellow-400 bg-yellow-500/20";
  }
  
  if (daysLeft < 0) {
    return { text: "Overdue", color: "text-red-500 bg-red-500/30", daysLeft: 0 };
  }
  
  return { 
    text: daysLeft === 0 ? "Today" : daysLeft === 1 ? "1 day left" : `${daysLeft} days left`,
    color,
    daysLeft
  };
};

const ChatsPage = () => {
  const navigate = useNavigate();
  const { user, backendURL } = useAppContext();
  const socketContext = useSocket();
  const { typingUsers = {}, onlineUsers = [] } = socketContext || {};

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    fetchChats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchChats = async () => {
    try {
      setLoading(true);
      const token = user?.token;

      // Fetch all orders (including new and awaiting_payment)
      const res = await axios.get(`${backendURL}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Include all relevant statuses
      const relevantStatuses = ["new", "awaiting_payment", "accepted", "in_progress", "submitted", "completed"];
      const activeChats = (res.data.orders || []).filter(order => 
        relevantStatuses.includes(order.status)
      );

      // Fetch latest message AND unread count for each chat
      const chatsWithMessages = await Promise.all(
        activeChats.map(async (chat) => {
          try {
            const msgRes = await axios.get(`${backendURL}/api/messages/${chat._id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const messages = msgRes.data.messages || [];
            
            // Count unread messages (not from me and not seen)
            const unreadCount = messages.filter(m => 
              m.sender?._id !== user?._id && 
              m.sender !== user?._id && 
              !m.seen
            ).length;
            
            return {
              ...chat,
              lastMessage: messages.length > 0 ? messages[messages.length - 1] : null,
              unreadCount,
            };
          } catch {
            return { ...chat, lastMessage: null, unreadCount: 0 };
          }
        })
      );

      // Sort by latest message time or creation date
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
  };

  const getOtherParty = (order) => {
    if (user?.role === "editor") {
      return order.client;
    }
    return order.editor;
  };

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

  // Filter chats by tab and search
  const getFilteredChats = () => {
    let filtered = chats;

    // Filter by tab
    if (activeTab === "gigs") {
      filtered = filtered.filter(chat => chat.type === "gig");
    } else if (activeTab === "requested") {
      filtered = filtered.filter(chat => chat.type === "request");
    }

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(chat => {
        const otherParty = getOtherParty(chat);
        return (
          chat.title?.toLowerCase().includes(searchLower) ||
          otherParty?.name?.toLowerCase().includes(searchLower) ||
          chat.orderNumber?.toString().includes(searchLower)
        );
      });
    }

    return filtered;
  };

  const filteredChats = getFilteredChats();

  // Count chats by tab
  const gigCount = chats.filter(c => c.type === "gig").length;
  const requestCount = chats.filter(c => c.type === "request").length;

  // Shimmer skeleton component
  const ShimmerCard = () => (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 animate-pulse">
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

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col md:flex-row bg-black text-white">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <EditorNavbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 px-4 md:px-6 py-6 pt-20 md:pt-6 md:ml-64 md:mt-20">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 rounded-xl bg-zinc-800 animate-pulse" />
            <div className="space-y-2">
              <div className="h-6 w-32 bg-zinc-800 rounded animate-pulse" />
              <div className="h-3 w-24 bg-zinc-800 rounded animate-pulse" />
            </div>
          </div>
          <div className="h-10 w-full bg-zinc-900 rounded-lg mb-4 animate-pulse" />
          <div className="h-12 w-full bg-zinc-900 rounded-xl mb-6 animate-pulse" />
          <div className="space-y-3">
            <ShimmerCard />
            <ShimmerCard />
            <ShimmerCard />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-black light:bg-slate-50 text-white light:text-slate-900 transition-colors duration-200">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <EditorNavbar onMenuClick={() => setSidebarOpen(true)} />

      <main className="flex-1 px-4 md:px-6 py-6 pt-20 md:pt-6 md:ml-64 md:mt-20">
        {/* Header */}
        <div className="flex items-center gap-4 mb-5">
          <button
            onClick={() => navigate(-1)}
            className="p-2.5 rounded-lg bg-zinc-900 light:bg-white border border-zinc-800 light:border-slate-200 hover:bg-zinc-800 light:hover:bg-slate-100 transition-all light:shadow-sm"
          >
            <FaArrowLeft className="text-sm light:text-slate-600" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-white light:text-slate-900">Messages</h1>
            <p className="text-zinc-500 light:text-slate-500 text-xs">{chats.length} conversations</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            const count = tab.id === "all" ? chats.length : tab.id === "gigs" ? gigCount : requestCount;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  isActive 
                    ? "bg-white light:bg-slate-900 text-black light:text-white" 
                    : "bg-zinc-900 light:bg-white border border-zinc-800 light:border-slate-200 text-zinc-400 light:text-slate-600 hover:text-white light:hover:text-slate-900 hover:border-zinc-600 light:hover:border-slate-300"
                }`}
              >
                <tab.icon className="text-xs" />
                {tab.label}
                <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] ${
                  isActive ? "bg-black/10 light:bg-white/20" : "bg-zinc-800 light:bg-slate-100"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 light:text-slate-400 text-sm" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chats..."
            className="w-full bg-zinc-900 light:bg-white border border-zinc-800 light:border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-sm placeholder:text-zinc-600 light:placeholder:text-slate-400 focus:border-zinc-600 light:focus:border-slate-400 outline-none transition-all light:text-slate-900 light:shadow-sm"
          />
        </div>

        {/* Chat List */}
        {filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-zinc-900 light:bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <FaComments className="text-2xl text-zinc-600 light:text-slate-400" />
            </div>
            <h3 className="text-sm font-medium text-zinc-400 light:text-slate-600 mb-1">
              {search ? "No chats found" : "No chats yet"}
            </h3>
            <p className="text-xs text-zinc-600 light:text-slate-500">
              {search ? "Try a different search" : activeTab === "requested" ? "No request orders" : "Accept orders to start chatting!"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {filteredChats.map((chat, index) => {
                const otherParty = getOtherParty(chat);
                const statusConfig = STATUS_CONFIG[chat.status] || STATUS_CONFIG.in_progress;
                const isTyping = typingUsers[chat._id]?.length > 0;
                const isOnline = onlineUsers.includes(otherParty?._id);
                const deadlineStatus = getDeadlineStatus(chat.deadline, chat.createdAt);
                
                // Check if this is awaiting payment (for request orders)
                const isAwaitingPayment = chat.status === "awaiting_payment";
                const isPaid = chat.type === "request" && chat.paymentStatus === "escrow";
                const isNewRequest = chat.status === "new" && chat.type === "request";

                return (
                  <motion.div
                    key={chat._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.02 }}
                    onClick={() => navigate(`/chat/${chat._id}`)}
                    className={`bg-zinc-950 light:bg-white border rounded-xl p-3.5 cursor-pointer hover:border-zinc-600 light:hover:border-slate-300 transition-all group light:shadow-sm ${
                      isAwaitingPayment ? "border-orange-500/30" : 
                      isNewRequest ? "border-amber-500/30" :
                      "border-zinc-800 light:border-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        <img
                          src={otherParty?.profilePicture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                          alt={otherParty?.name}
                          className="w-11 h-11 rounded-xl object-cover"
                        />
                        {/* Online indicator */}
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-zinc-950 light:border-white ${
                          isOnline ? "bg-green-500" : "bg-zinc-600 light:bg-slate-300"
                        }`} />
                        
                        {/* Unread Badge */}
                        {chat.unreadCount > 0 && (
                          <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-[9px] font-bold">
                            {chat.unreadCount > 9 ? "9+" : chat.unreadCount}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="font-medium text-white light:text-slate-900 text-sm truncate group-hover:text-blue-400 transition-colors">
                            {otherParty?.name}
                          </h3>
                          
                          {/* Type Tag */}
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                            chat.type === "gig" 
                              ? "bg-purple-500/20 text-purple-400"
                              : "bg-cyan-500/20 text-cyan-400"
                          }`}>
                            {chat.type === "gig" ? "Gig" : "Request"}
                          </span>

                          {/* Payment Status for Request Orders */}
                          {chat.type === "request" && isPaid && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium bg-green-500/20 text-green-400 flex items-center gap-0.5">
                              <FaCreditCard className="text-[7px]" /> Paid
                            </span>
                          )}
                        </div>
                        
                        {/* Last Message or Status */}
                        {isTyping ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-green-400 font-medium">typing</span>
                            <div className="flex items-center gap-0.5">
                              {[0, 0.2, 0.4].map((delay, i) => (
                                <motion.span
                                  key={i}
                                  animate={{ opacity: [0.4, 1, 0.4] }}
                                  transition={{ duration: 1, repeat: Infinity, delay }}
                                  className="w-1 h-1 bg-green-400 rounded-full"
                                />
                              ))}
                            </div>
                          </div>
                        ) : isNewRequest && user?.role === "editor" ? (
                          <p className="text-[11px] text-amber-400 font-medium flex items-center gap-1">
                            <FaExclamationCircle className="text-[9px]" />
                            New request - Action required
                          </p>
                        ) : isAwaitingPayment && user?.role === "client" ? (
                          <p className="text-[11px] text-orange-400 font-medium flex items-center gap-1">
                            <FaHourglassHalf className="text-[9px]" />
                            Payment required to start
                          </p>
                        ) : chat.lastMessage ? (
                          <p className="text-[11px] text-zinc-500 light:text-slate-500 truncate">
                            {chat.lastMessage.type === "image" ? "📷 Photo" :
                             chat.lastMessage.type === "video" ? "🎥 Video" :
                             chat.lastMessage.type === "file" ? "📎 File" :
                             chat.lastMessage.type === "payment_request" ? "💳 Payment Request" :
                             chat.lastMessage.content?.length > 40 
                               ? `${chat.lastMessage.content.substring(0, 40)}...` 
                               : chat.lastMessage.content || "New message"}
                          </p>
                        ) : (
                          <p className="text-[11px] text-zinc-600 light:text-slate-400 italic">No messages yet</p>
                        )}
                        
                        <div className="flex items-center gap-2 mt-1 text-[9px] text-zinc-600 light:text-slate-500">
                          <span className="flex items-center gap-0.5 text-emerald-400 light:text-emerald-500">
                            <FaRupeeSign className="text-[7px]" /> {chat.amount}
                          </span>
                          {chat.lastMessage && (
                            <span className="flex items-center gap-0.5">
                              <FaClock className="text-[7px]" />
                              {formatDate(chat.lastMessage.createdAt)}
                            </span>
                          )}
                          
                          {/* Deadline Indicator */}
                          {deadlineStatus && !["completed", "cancelled", "rejected", "new", "awaiting_payment"].includes(chat.status) && (
                            <span className={`flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] font-medium ${deadlineStatus.color}`}>
                              <FaCircle className="text-[3px]" />
                              {deadlineStatus.text}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status + Arrow */}
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <span className={`text-[10px] px-2 py-1 rounded-lg font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                          {statusConfig.label}
                        </span>
                        <FaChevronRight className="text-zinc-600 light:text-slate-400 text-[10px] group-hover:text-blue-400 transition-colors" />
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

export default ChatsPage;
