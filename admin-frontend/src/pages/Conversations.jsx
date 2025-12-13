// Conversations.jsx - Admin chat viewer to monitor all user conversations
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaComments,
  FaSearch,
  FaFilter,
  FaEye,
  FaTimes,
  FaUser,
  FaUserTie,
  FaPaperclip,
  FaImage,
  FaVideo,
  FaSync,
  FaCalendar,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { useAdmin } from "../context/AdminContext";
import { toast } from "react-toastify";

const Conversations = () => {
  const { adminAxios } = useAdmin();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatData, setChatData] = useState(null);
  
  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  const statusOptions = [
    { value: "all", label: "All Orders" },
    { value: "new", label: "New" },
    { value: "accepted", label: "Accepted" },
    { value: "in_progress", label: "In Progress" },
    { value: "submitted", label: "Submitted" },
    { value: "completed", label: "Completed" },
    { value: "disputed", label: "Disputed" },
    { value: "cancelled", label: "Cancelled" },
  ];

  useEffect(() => {
    fetchConversations();
  }, [page, statusFilter]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const res = await adminAxios.get("/admin/conversations", {
        params: { page, limit: 15, status: statusFilter, search },
      });
      
      if (res.data.success) {
        setConversations(res.data.conversations);
        setPagination(res.data.pagination);
      }
    } catch (error) {
      toast.error("Failed to load conversations");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchConversations();
  };

  const openChatViewer = async (orderId) => {
    try {
      setChatLoading(true);
      setSelectedConversation(orderId);
      
      const res = await adminAxios.get(`/admin/conversations/${orderId}`);
      
      if (res.data.success) {
        setChatData(res.data);
      }
    } catch (error) {
      toast.error("Failed to load chat history");
      setSelectedConversation(null);
    } finally {
      setChatLoading(false);
    }
  };

  const closeChatViewer = () => {
    setSelectedConversation(null);
    setChatData(null);
  };

  const getStatusColor = (status) => {
    const colors = {
      new: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      accepted: "bg-green-500/20 text-green-400 border-green-500/30",
      in_progress: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      submitted: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      completed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      disputed: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
      rejected: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    };
    return colors[status] || colors.new;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getMessageIcon = (type) => {
    switch (type) {
      case "image": return <FaImage className="text-blue-400" />;
      case "video": return <FaVideo className="text-purple-400" />;
      case "file": return <FaPaperclip className="text-amber-400" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600">
              <FaComments className="text-white" />
            </div>
            Conversations
          </h1>
          <p className="text-gray-400 text-sm mt-1">Monitor all user chats for issue resolution</p>
        </div>
        <button
          onClick={fetchConversations}
          className="flex items-center gap-2 px-4 py-2 bg-dark-700 border border-dark-500 rounded-xl text-gray-400 hover:text-white transition-all"
        >
          <FaSync className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search by client, editor, or order ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-dark-700 border border-dark-500 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
          />
        </form>
        <div className="flex gap-3">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-4 py-3 bg-dark-700 border border-dark-500 rounded-xl text-white focus:border-purple-500 focus:outline-none"
          >
            {statusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Conversations List */}
      <div className="bg-dark-700 border border-dark-500 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-400">Loading conversations...</p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FaComments className="text-4xl mx-auto mb-3 opacity-50" />
            <p>No conversations found</p>
          </div>
        ) : (
          <div className="divide-y divide-dark-500">
            {conversations.map((conv) => (
              <motion.div
                key={conv._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 hover:bg-dark-600/50 transition-colors cursor-pointer"
                onClick={() => openChatViewer(conv._id)}
              >
                <div className="flex items-center gap-4">
                  {/* Participants */}
                  <div className="flex -space-x-3">
                    <img
                      src={conv.client?.profilePicture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                      className="w-10 h-10 rounded-full border-2 border-dark-700 object-cover"
                      alt={conv.client?.name}
                    />
                    <img
                      src={conv.editor?.profilePicture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                      className="w-10 h-10 rounded-full border-2 border-dark-700 object-cover"
                      alt={conv.editor?.name}
                    />
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-white truncate">{conv.client?.name}</span>
                      <span className="text-gray-500">↔</span>
                      <span className="font-medium text-white truncate">{conv.editor?.name}</span>
                    </div>
                    <p className="text-sm text-gray-400 truncate">
                      {conv.gig?.title || "Order #" + conv._id.slice(-8)}
                    </p>
                    {conv.lastMessage && (
                      <p className="text-xs text-gray-500 truncate mt-1 flex items-center gap-1">
                        {getMessageIcon(conv.lastMessage.type)}
                        {conv.lastMessage.content || `[${conv.lastMessage.type}]`}
                      </p>
                    )}
                  </div>

                  {/* Right side */}
                  <div className="text-right">
                    <span className={`inline-block px-2 py-1 text-xs rounded-lg border ${getStatusColor(conv.status)}`}>
                      {conv.status?.replace("_", " ")}
                    </span>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                      <FaComments />
                      <span>{conv.messageCount} messages</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {formatDate(conv.updatedAt)}
                    </p>
                  </div>

                  {/* View Button */}
                  <button className="p-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors">
                    <FaEye />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-dark-500">
            <span className="text-sm text-gray-500">
              Page {page} of {pagination.pages} ({pagination.total} total)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg bg-dark-600 text-gray-400 disabled:opacity-50"
              >
                <FaChevronLeft />
              </button>
              <button
                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                className="p-2 rounded-lg bg-dark-600 text-gray-400 disabled:opacity-50"
              >
                <FaChevronRight />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Chat Viewer Modal */}
      <AnimatePresence>
        {selectedConversation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={closeChatViewer}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-dark-800 border border-dark-500 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              {chatLoading ? (
                <div className="p-8 text-center">
                  <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-gray-400">Loading chat history...</p>
                </div>
              ) : chatData ? (
                <>
                  {/* Modal Header */}
                  <div className="p-4 border-b border-dark-500 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex -space-x-3">
                        <img
                          src={chatData.order.client?.profilePicture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                          className="w-10 h-10 rounded-full border-2 border-dark-700 object-cover"
                          alt=""
                        />
                        <img
                          src={chatData.order.editor?.profilePicture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                          className="w-10 h-10 rounded-full border-2 border-dark-700 object-cover"
                          alt=""
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">
                          {chatData.order.client?.name} ↔ {chatData.order.editor?.name}
                        </h3>
                        <p className="text-sm text-gray-400">{chatData.order.gig?.title}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right text-sm">
                        <p className="text-gray-400">{chatData.stats.totalMessages} messages</p>
                        <p className="text-gray-500">₹{chatData.order.amount?.toLocaleString()}</p>
                      </div>
                      <button
                        onClick={closeChatViewer}
                        className="p-2 rounded-lg bg-dark-600 text-gray-400 hover:text-white"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  </div>

                  {/* Stats Bar */}
                  <div className="p-3 bg-dark-700/50 border-b border-dark-500 flex gap-4 text-xs">
                    <span className="text-blue-400">
                      <FaUser className="inline mr-1" />
                      Client: {chatData.stats.clientMessages}
                    </span>
                    <span className="text-purple-400">
                      <FaUserTie className="inline mr-1" />
                      Editor: {chatData.stats.editorMessages}
                    </span>
                    <span className="text-gray-400">
                      <FaPaperclip className="inline mr-1" />
                      Media: {chatData.stats.mediaMessages}
                    </span>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {chatData.messages.map((msg) => {
                      const isClient = msg.sender?._id === chatData.order.client?._id;
                      const isSystem = msg.type === "system";
                      
                      if (isSystem) {
                        return (
                          <div key={msg._id} className="text-center">
                            <span className="inline-block px-3 py-1 bg-dark-600 text-gray-400 text-xs rounded-full">
                              {msg.content}
                            </span>
                          </div>
                        );
                      }

                      return (
                        <div key={msg._id} className={`flex gap-3 ${isClient ? "" : "flex-row-reverse"}`}>
                          <img
                            src={msg.sender?.profilePicture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                            className="w-8 h-8 rounded-full object-cover"
                            alt=""
                          />
                          <div className={`max-w-[70%] ${isClient ? "" : "text-right"}`}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs font-medium ${isClient ? "text-blue-400" : "text-purple-400"}`}>
                                {msg.sender?.name}
                              </span>
                              <span className="text-xs text-gray-600">
                                {formatDate(msg.createdAt)}
                              </span>
                            </div>
                            <div className={`inline-block p-3 rounded-xl ${
                              isClient 
                                ? "bg-blue-500/20 border border-blue-500/30" 
                                : "bg-purple-500/20 border border-purple-500/30"
                            }`}>
                              {msg.type === "image" && msg.mediaUrl && (
                                <img src={msg.mediaUrl} className="max-w-full max-h-48 rounded-lg mb-2" alt="" />
                              )}
                              {msg.type === "video" && msg.mediaUrl && (
                                <video src={msg.mediaUrl} controls className="max-w-full max-h-48 rounded-lg mb-2" />
                              )}
                              {msg.type === "file" && (
                                <div className="flex items-center gap-2 text-sm text-gray-300 mb-2">
                                  <FaPaperclip />
                                  <span>{msg.mediaName || "File"}</span>
                                </div>
                              )}
                              {msg.content && (
                                <p className="text-sm text-white whitespace-pre-wrap">{msg.content}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : null}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Conversations;
