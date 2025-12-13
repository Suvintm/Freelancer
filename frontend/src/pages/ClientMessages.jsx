// ClientMessages.jsx - Client's chat list page with unread counts & deadline indicator
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
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { useSocket } from "../context/SocketContext";
import axios from "axios";
import { toast } from "react-toastify";
import ClientSidebar from "../components/ClientSidebar.jsx";
import ClientNavbar from "../components/ClientNavbar.jsx";

const STATUS_CONFIG = {
  accepted: { label: "Accepted", color: "text-green-400", bg: "bg-green-500/20" },
  in_progress: { label: "In Progress", color: "text-yellow-400", bg: "bg-yellow-500/20" },
  submitted: { label: "Submitted", color: "text-purple-400", bg: "bg-purple-500/20" },
  completed: { label: "Completed", color: "text-emerald-400", bg: "bg-emerald-500/20" },
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

const ClientMessages = () => {
  const navigate = useNavigate();
  const { user, backendURL } = useAppContext();
  const socketContext = useSocket();
  const { onlineUsers = [] } = socketContext || {};

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

      const res = await axios.get(`${backendURL}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Filter only orders with active chats (accepted+)
      const activeChats = (res.data.orders || []).filter(order => 
        ["accepted", "in_progress", "submitted", "completed"].includes(order.status)
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

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col md:flex-row bg-[#050509] text-white">
        <ClientSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <ClientNavbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 flex items-center justify-center md:ml-64 md:mt-20">
          <div className="flex flex-col items-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full"
            />
            <p className="mt-4 text-gray-400 text-sm">Loading your messages...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#050509] text-white">
      <ClientSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <ClientNavbar onMenuClick={() => setSidebarOpen(true)} />

      <main className="flex-1 px-4 md:px-8 py-6 md:ml-64 md:mt-20">
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
            placeholder="Search by editor name or project..."
            className="w-full bg-[#111319] border border-[#262A3B] rounded-xl pl-12 pr-4 py-3 text-sm placeholder:text-gray-500 focus:ring-2 focus:ring-emerald-500/30 transition-all"
          />
        </div>

        {/* Chat List */}
        {filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <FaComments className="text-6xl text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              {search ? "No chats found" : "No active chats"}
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              {search ? "Try a different search" : "Your chats will appear here once an editor accepts your order"}
            </p>
            {!search && (
              <button
                onClick={() => navigate("/client-home")}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-xl font-medium transition-all"
              >
                Browse Editors
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredChats.map((chat, index) => {
                const statusConfig = STATUS_CONFIG[chat.status] || STATUS_CONFIG.in_progress;
                const deadlineStatus = getDeadlineStatus(chat.deadline, chat.createdAt);
                const isOnline = chat.editor?._id && onlineUsers.includes(chat.editor._id);
                const lastMsgContent = chat.lastMessage?.content || chat.lastMessage?.type || "No messages yet";

                return (
                  <motion.div
                    key={chat._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => navigate(`/chat/${chat._id}`)}
                    className="bg-[#111319] border border-[#262A3B] rounded-2xl p-4 cursor-pointer hover:border-emerald-500/30 hover:bg-[#13161d] transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      {/* Editor Avatar */}
                      <div className="relative">
                        <img
                          src={chat.editor?.profilePicture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                          alt={chat.editor?.name}
                          className="w-12 h-12 rounded-xl object-cover"
                        />
                        {/* Online indicator */}
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#111319] ${isOnline ? 'bg-emerald-500' : 'bg-gray-500'}`} />
                        
                        {/* Unread Badge */}
                        {chat.unreadCount > 0 && (
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {chat.unreadCount > 9 ? "9+" : chat.unreadCount}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`font-semibold text-sm truncate group-hover:text-emerald-400 transition-colors ${chat.unreadCount > 0 ? 'text-white' : 'text-gray-300'}`}>
                            {chat.editor?.name}
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
                        
                        {/* Last Message Preview */}
                        <p className={`text-xs truncate mb-1 ${chat.unreadCount > 0 ? 'text-white font-medium' : 'text-gray-400'}`}>
                          {lastMsgContent.length > 50 ? lastMsgContent.substring(0, 50) + "..." : lastMsgContent}
                        </p>
                        
                        <div className="flex items-center gap-3 text-[10px] text-gray-500">
                          <span className="flex items-center gap-1 text-green-400">
                            <FaRupeeSign className="text-[8px]" /> {chat.amount}
                          </span>
                          <span className="flex items-center gap-1">
                            <FaClock className="text-[8px]" />
                            {formatDate(chat.lastMessage?.createdAt || chat.createdAt)}
                          </span>
                          
                          {/* Deadline Indicator */}
                          {deadlineStatus && chat.status !== "completed" && (
                            <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium ${deadlineStatus.color}`}>
                              <FaCircle className="text-[4px]" />
                              {deadlineStatus.text}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status + Arrow */}
                      <div className="flex flex-col items-end gap-2">
                        <span className={`text-xs px-2 py-1 rounded-lg ${statusConfig.bg} ${statusConfig.color}`}>
                          {statusConfig.label}
                        </span>
                        <FaChevronRight className="text-gray-500 text-sm group-hover:text-emerald-400 transition-colors" />
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

