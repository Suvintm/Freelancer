// AllChatsPage.jsx - Displays list of active chats (accepted orders)
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
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { useSocket } from "../context/SocketContext";
import axios from "axios";
import { toast } from "react-toastify";
import Sidebar from "../components/Sidebar.jsx";
import EditorNavbar from "../components/EditorNavbar.jsx";

const STATUS_CONFIG = {
  accepted: { label: "Accepted", color: "text-green-400", bg: "bg-green-500/20" },
  in_progress: { label: "In Progress", color: "text-yellow-400", bg: "bg-yellow-500/20" },
  submitted: { label: "Submitted", color: "text-purple-400", bg: "bg-purple-500/20" },
  completed: { label: "Completed", color: "text-emerald-400", bg: "bg-emerald-500/20" },
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

  useEffect(() => {
    fetchChats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchChats = async () => {
    try {
      setLoading(true);
      const token = user?.token;

      // Fetch orders with active chat statuses
      const res = await axios.get(`${backendURL}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Filter only orders with active chats (accepted+)
      const activeChats = (res.data.orders || []).filter(order => 
        ["accepted", "in_progress", "submitted", "completed"].includes(order.status)
      );

      // Fetch latest message for each chat
      const chatsWithMessages = await Promise.all(
        activeChats.map(async (chat) => {
          try {
            const msgRes = await axios.get(`${backendURL}/api/messages/${chat._id}?limit=1`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const messages = msgRes.data.messages || [];
            return {
              ...chat,
              lastMessage: messages.length > 0 ? messages[messages.length - 1] : null,
            };
          } catch {
            return { ...chat, lastMessage: null };
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

  // Filter chats by search
  const filteredChats = chats.filter(chat => {
    const otherParty = getOtherParty(chat);
    const searchLower = search.toLowerCase();
    return (
      chat.title?.toLowerCase().includes(searchLower) ||
      otherParty?.name?.toLowerCase().includes(searchLower) ||
      chat.orderNumber?.toString().includes(searchLower)
    );
  });

  // Shimmer skeleton component
  const ShimmerCard = () => (
    <div className="bg-[#111319] border border-[#262A3B] rounded-2xl p-4 animate-pulse">
      <div className="flex items-center gap-4">
        {/* Avatar skeleton */}
        <div className="w-12 h-12 rounded-xl bg-[#1a1d25]" />
        {/* Content skeleton */}
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 bg-[#1a1d25] rounded" />
          <div className="h-3 w-48 bg-[#1a1d25] rounded" />
          <div className="flex gap-3 mt-2">
            <div className="h-3 w-16 bg-[#1a1d25] rounded" />
            <div className="h-3 w-20 bg-[#1a1d25] rounded" />
          </div>
        </div>
        {/* Status skeleton */}
        <div className="h-6 w-20 bg-[#1a1d25] rounded-lg" />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col md:flex-row bg-[#050509] text-white">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <EditorNavbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 px-4 md:px-8 py-6 pt-20 md:pt-6 md:ml-64 md:mt-20">
          {/* Header skeleton */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#1a1d25] animate-pulse" />
            <div className="space-y-2">
              <div className="h-6 w-32 bg-[#1a1d25] rounded animate-pulse" />
              <div className="h-3 w-24 bg-[#1a1d25] rounded animate-pulse" />
            </div>
          </div>
          {/* Search skeleton */}
          <div className="h-12 w-full bg-[#111319] rounded-xl mb-6 animate-pulse" />
          {/* Chat cards skeleton */}
          <div className="space-y-3">
            <ShimmerCard />
            <ShimmerCard />
            <ShimmerCard />
            <ShimmerCard />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#050509] text-white">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <EditorNavbar onMenuClick={() => setSidebarOpen(true)} />

      <main className="flex-1 px-4 md:px-8 py-6 pt-20 md:pt-6 md:ml-64 md:mt-20">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-3 rounded-xl bg-[#111319] border border-[#262A3B] hover:bg-[#1a1d25] transition-all"
          >
            <FaArrowLeft />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Messages</h1>
            <p className="text-gray-400 text-sm">{chats.length} active conversations</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chats..."
            className="w-full bg-[#111319] border border-[#262A3B] rounded-xl pl-12 pr-4 py-3 text-sm placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500/30 transition-all"
          />
        </div>

        {/* Chat List */}
        {filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <FaComments className="text-6xl text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              {search ? "No chats found" : "No active chats"}
            </h3>
            <p className="text-gray-400 text-sm">
              {search ? "Try a different search" : "Accept orders to start chatting!"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredChats.map((chat, index) => {
                const otherParty = getOtherParty(chat);
                const statusConfig = STATUS_CONFIG[chat.status] || STATUS_CONFIG.in_progress;
                const isTyping = typingUsers[chat._id]?.length > 0;
                const isOnline = onlineUsers.includes(otherParty?._id);

                return (
                  <motion.div
                    key={chat._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => navigate(`/chat/${chat._id}`)}
                    className="bg-[#111319] border border-[#262A3B] rounded-2xl p-4 cursor-pointer hover:border-blue-500/30 hover:bg-[#13161d] transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="relative">
                        <img
                          src={otherParty?.profilePicture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                          alt={otherParty?.name}
                          className="w-12 h-12 rounded-xl object-cover"
                        />
                        {/* Online indicator - only green when actually online */}
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#111319] ${
                          isOnline ? "bg-green-500" : "bg-gray-500"
                        }`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-white text-sm truncate group-hover:text-blue-400 transition-colors">
                            {otherParty?.name}
                          </h3>
                          {/* Type Tag */}
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                            chat.type === "gig" 
                              ? "bg-purple-500/20 text-purple-400"
                              : "bg-cyan-500/20 text-cyan-400"
                          }`}>
                            {chat.type === "gig" ? (
                              <><FaShoppingCart className="inline mr-1 text-[8px]" />Gig</>
                            ) : (
                              <><FaEnvelope className="inline mr-1 text-[8px]" />Request</>
                            )}
                          </span>
                        </div>
                        
                        {/* Typing Indicator or Last Message */}
                        {isTyping ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-green-400 font-medium italic">typing</span>
                            <div className="flex items-center gap-0.5">
                              <motion.span
                                animate={{ opacity: [0.4, 1, 0.4] }}
                                transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                                className="w-1 h-1 bg-green-400 rounded-full"
                              />
                              <motion.span
                                animate={{ opacity: [0.4, 1, 0.4] }}
                                transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                                className="w-1 h-1 bg-green-400 rounded-full"
                              />
                              <motion.span
                                animate={{ opacity: [0.4, 1, 0.4] }}
                                transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                                className="w-1 h-1 bg-green-400 rounded-full"
                              />
                            </div>
                          </div>
                        ) : chat.lastMessage ? (
                          <p className="text-xs text-gray-400">
                            {chat.lastMessage.type === "image" ? "📷 Photo" :
                             chat.lastMessage.type === "video" ? "🎥 Video" :
                             chat.lastMessage.type === "file" ? "📎 File" :
                             chat.lastMessage.content?.length > 35 
                               ? `${chat.lastMessage.content.substring(0, 35)}...more` 
                               : chat.lastMessage.content || "New message"}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-500 italic">No messages yet</p>
                        )}
                        
                        <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-500">
                          <span className="flex items-center gap-1 text-green-400">
                            <FaRupeeSign className="text-[8px]" /> {chat.amount}
                          </span>
                          {chat.lastMessage && (
                            <span className="flex items-center gap-1 text-blue-400">
                              <FaClock className="text-[8px]" />
                              {formatDate(chat.lastMessage.createdAt)}
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-gray-500">
                            <FaClock className="text-[8px]" />
                            Order: {formatDate(chat.createdAt)}
                          </span>
                        </div>
                      </div>

                      {/* Status + Arrow */}
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-2 py-1 rounded-lg ${statusConfig.bg} ${statusConfig.color}`}>
                          {statusConfig.label}
                        </span>
                        <FaChevronRight className="text-gray-500 text-sm group-hover:text-blue-400 transition-colors" />
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
