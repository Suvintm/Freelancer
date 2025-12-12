// ChatPage.jsx - Real-time chat with WebSocket
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  FaArrowLeft,
  FaPaperPlane,
  FaPaperclip,
  FaFileVideo,
  FaChevronDown,
  FaCheck,
  FaCheckDouble,
  FaFile,
  FaImage,
  FaTimes,
  FaCircle,
  FaCamera,
  FaVideo,
  FaFileAlt,
  FaPlay,
  FaReply,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { useSocket } from "../context/SocketContext";
import MediaPreviewModal from "./MediaPreviewModal";
import ProjectDetailsDropdown from "./ProjectDetailsDropdown";
import axios from "axios";
import { toast } from "react-toastify";
import chattexture from "../assets/chattexture.png";

const ChatPage = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const { user, backendURL } = useAppContext();
  const socketContext = useSocket();
  
  // Destructure with defaults to handle null context
  const {
    socket = null,
    joinRoom = () => {},
    leaveRoom = () => {},
    startTyping = () => {},
    stopTyping = () => {},
    markAsRead = () => {},
    isUserOnline = () => false,
    getTypingUsers = () => [],
    onlineUsers = [],
  } = socketContext || {};

  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const docInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  
  // Media states
  const [showMediaMenu, setShowMediaMenu] = useState(false);
  const [previewMedia, setPreviewMedia] = useState(null);
  
  // Reply state
  const [replyingTo, setReplyingTo] = useState(null);

  // Get the other party in the chat
  const otherParty = user?.role === "editor" ? order?.client : order?.editor;
  const otherPartyId = otherParty?._id;
  
  // Check online status
  const isOnline = otherPartyId ? onlineUsers.includes(otherPartyId) : false;
  
  // Debug logging
  useEffect(() => {
    console.log("🔍 ChatPage Debug:", {
      orderId,
      socket: !!socket,
      socketConnected: socket?.connected,
      otherPartyId,
      onlineUsers,
      isOnline,
    });
  }, [orderId, socket, otherPartyId, onlineUsers, isOnline]);

  // Fetch order and messages
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = user?.token;
        
        // Fetch order details
        const orderRes = await axios.get(`${backendURL}/api/orders/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOrder(orderRes.data.order);

        // Fetch messages
        const msgRes = await axios.get(`${backendURL}/api/messages/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessages(msgRes.data.messages || []);
      } catch (err) {
        toast.error("Failed to load chat");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchData();
    }
  }, [orderId, backendURL, user?.token]);

  // Join room on mount, leave on unmount
  useEffect(() => {
    if (orderId && socket) {
      joinRoom(orderId);
      markAsRead(orderId);

      return () => {
        leaveRoom(orderId);
      };
    }
  }, [orderId, socket, joinRoom, leaveRoom, markAsRead]);

  // Listen for new messages
  useEffect(() => {
    if (!socket) {
      console.log("⚠️ ChatPage: No socket available for listeners");
      return;
    }

    console.log("🔊 ChatPage: Setting up socket listeners for order:", orderId);

    const handleNewMessage = (message) => {
      console.log("💬 ChatPage received message:", message);
      const msgOrderId = message.orderId || message.order;
      if (msgOrderId === orderId || String(msgOrderId) === String(orderId)) {
        console.log("✅ Message matches this chat, adding to UI");
        setMessages((prev) => [...prev, message]);
        scrollToBottom();
        
        // Mark as read if in focus
        if (document.hasFocus()) {
          markAsRead(orderId);
        }
      } else {
        console.log("❌ Message for different order:", msgOrderId, "vs", orderId);
      }
    };

    const handleTypingStart = ({ orderId: typingOrderId, userId, userName }) => {
      console.log("⌨️ ChatPage: Typing start from:", userName);
      if (typingOrderId === orderId && userId !== user?._id) {
        setTypingUsers((prev) => {
          if (!prev.find((u) => u.id === userId)) {
            return [...prev, { id: userId, name: userName }];
          }
          return prev;
        });
      }
    };

    const handleTypingStop = ({ orderId: typingOrderId, userId }) => {
      console.log("⌨️ ChatPage: Typing stop from:", userId);
      if (typingOrderId === orderId) {
        setTypingUsers((prev) => prev.filter((u) => u.id !== userId));
      }
    };

    socket.on("message:new", handleNewMessage);
    socket.on("typing:start", handleTypingStart);
    socket.on("typing:stop", handleTypingStop);

    return () => {
      console.log("🔇 ChatPage: Removing socket listeners");
      socket.off("message:new", handleNewMessage);
      socket.off("typing:start", handleTypingStart);
      socket.off("typing:stop", handleTypingStop);
    };
  }, [socket, orderId, user?._id, markAsRead]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle typing
  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    startTyping(orderId);
  };

  const handleInputBlur = () => {
    stopTyping(orderId);
  };

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      stopTyping(orderId);

      const token = user?.token;
      const messageData = { 
        content: newMessage.trim(), 
        type: "text",
      };

      // Add reply data if replying to a message
      if (replyingTo) {
        messageData.replyTo = replyingTo._id;
        messageData.replyPreview = {
          senderName: replyingTo.sender?.name || "Unknown",
          content: replyingTo.content?.substring(0, 100) || (replyingTo.type === "image" ? "📷 Photo" : replyingTo.type === "video" ? "🎥 Video" : "📎 File"),
          type: replyingTo.type,
        };
      }

      await axios.post(
        `${backendURL}/api/messages/${orderId}`,
        messageData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setNewMessage("");
      setReplyingTo(null); // Clear reply state
    } catch (err) {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Max 50MB
    if (file.size > 50 * 1024 * 1024) {
      toast.error("File too large (max 50MB)");
      return;
    }

    try {
      setUploading(true);
      const token = user?.token;

      const formData = new FormData();
      formData.append("file", file);

      const res = await axios.post(
        `${backendURL}/api/messages/${orderId}/file`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast.success("File sent!");
    } catch (err) {
      toast.error("Failed to upload file");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Key press handler
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050509] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050509] flex flex-col">
      {/* Header */}
      <header className="bg-[#111319] border-b border-[#262A3B] px-4 py-3 flex items-center gap-4 sticky top-0 z-20">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl bg-[#1a1d25] hover:bg-[#262A3B] transition-all"
        >
          <FaArrowLeft className="text-white" />
        </button>

        {/* User Info */}
        <div className="flex items-center gap-3 flex-1">
          <div className="relative">
            <img
              src={otherParty?.profilePicture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
              alt={otherParty?.name}
              className="w-10 h-10 rounded-xl object-cover"
            />
            {/* Online Indicator */}
            <div
              className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#111319] ${
                isOnline ? "bg-green-500" : "bg-gray-500"
              }`}
            />
          </div>
          <div>
            <h2 className="text-white font-semibold text-sm">{otherParty?.name || "Chat"}</h2>
            <div className="flex items-center gap-1">
              {typingUsers.length > 0 ? (
                <span className="text-green-400 text-xs font-medium flex items-center gap-1">
                  <motion.span
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    typing...
                  </motion.span>
                </span>
              ) : (
                <span className={`text-xs ${isOnline ? "text-green-400" : "text-gray-500"}`}>
                  {isOnline ? "Online" : "Offline"}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Order Info */}
        <div className="hidden md:block text-right">
          <p className="text-gray-400 text-xs">Order #{order?.orderNumber}</p>
          <p className="text-white text-sm truncate max-w-[200px]">{order?.title}</p>
        </div>
      </header>

      {/* Project Details Dropdown */}
      <ProjectDetailsDropdown order={{ ...order, currentUserId: user?._id }} />

      {/* Messages Area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-3"
        style={{
          backgroundImage: `url(${chattexture})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed", // Background stays fixed while messages scroll
        }}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-gray-500 text-sm">No messages yet. Say hello! 👋</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.sender?._id === user?._id || msg.sender === user?._id;
            const senderName = msg.sender?.name || (isMe ? user?.name : otherParty?.name);

            return (
              <motion.div
                key={msg._id || index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${isMe ? "justify-end" : "justify-start"} group`}
              >
                {/* Reply Button (appears on left for my messages) */}
                {isMe && (
                  <button
                    onClick={() => setReplyingTo(msg)}
                    className="opacity-0 group-hover:opacity-100 p-2 mr-2 self-center text-gray-400 hover:text-white transition-all"
                    title="Reply"
                  >
                    <FaReply className="text-sm" />
                  </button>
                )}

                <div
                  className={`max-w-[75%] md:max-w-[60%] rounded-2xl px-3 py-2 ${
                    isMe
                      ? "bg-[#005C4B] text-white rounded-br-none"
                      : "bg-[#202C33] text-white rounded-bl-none"
                  }`}
                >
                  {/* Reply Preview (if this message is a reply) */}
                  {msg.replyPreview && (
                    <div className="mb-2 pl-2 border-l-2 border-blue-400 bg-black/20 rounded-r-lg py-1 pr-2">
                      <p className="text-xs text-blue-400 font-medium">{msg.replyPreview.senderName}</p>
                      <p className="text-xs text-gray-300 truncate">
                        {msg.replyPreview.type === "image" ? "📷 Photo" : 
                         msg.replyPreview.type === "video" ? "🎥 Video" :
                         msg.replyPreview.type === "file" ? "📎 File" :
                         msg.replyPreview.content}
                      </p>
                    </div>
                  )}

                  {/* Image Message */}
                  {(msg.type === "file" || msg.type === "image") && 
                   msg.mediaUrl?.match(/\.(jpg|jpeg|png|gif|webp)$/i) && (
                    <div
                      className="cursor-pointer rounded-lg overflow-hidden mb-1"
                      onClick={() => setPreviewMedia({ 
                        url: msg.mediaUrl, 
                        name: msg.mediaName || msg.fileName,
                        type: "image"
                      })}
                    >
                      <img
                        src={msg.mediaUrl}
                        alt={msg.mediaName || "Image"}
                        className="max-w-[280px] max-h-[300px] object-cover rounded-lg"
                        loading="lazy"
                      />
                    </div>
                  )}

                  {/* Video Message */}
                  {(msg.type === "file" || msg.type === "video") && 
                   msg.mediaUrl?.match(/\.(mp4|mov|webm|avi)$/i) && (
                    <div
                      className="relative cursor-pointer rounded-lg overflow-hidden mb-1"
                      onClick={() => setPreviewMedia({ 
                        url: msg.mediaUrl, 
                        name: msg.mediaName || msg.fileName,
                        type: "video"
                      })}
                    >
                      <video
                        src={msg.mediaUrl}
                        className="max-w-[280px] max-h-[200px] object-cover rounded-lg"
                        muted
                        preload="metadata"
                      />
                      {/* Play Button Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                          <FaPlay className="text-white text-xl ml-1" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Document/File Message */}
                  {msg.type === "file" && 
                   !msg.mediaUrl?.match(/\.(jpg|jpeg|png|gif|webp|mp4|mov|webm|avi)$/i) && 
                   msg.mediaUrl && (
                    <div
                      className="flex items-center gap-3 p-3 bg-black/20 rounded-lg cursor-pointer mb-1"
                      onClick={() => setPreviewMedia({ 
                        url: msg.mediaUrl, 
                        name: msg.mediaName || msg.fileName,
                        type: "document"
                      })}
                    >
                      <div className="w-10 h-10 rounded-lg bg-blue-500/30 flex items-center justify-center">
                        <FaFile className="text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{msg.mediaName || msg.fileName || "Document"}</p>
                        <p className="text-xs opacity-60">{msg.mediaSize ? `${(msg.mediaSize / 1024 / 1024).toFixed(2)} MB` : "File"}</p>
                      </div>
                    </div>
                  )}

                  {/* Text Message */}
                  {msg.content && !msg.content.startsWith("Sent a file:") && (
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  )}

                  {/* Time & Status */}
                  <div className={`flex items-center gap-1 mt-1 ${isMe ? "justify-end" : "justify-start"}`}>
                    <span className="text-[10px] opacity-60">
                      {new Date(msg.createdAt).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {isMe && (
                      <span className="text-[10px]">
                        {msg.seen ? (
                          // Double blue tick for seen
                          <FaCheckDouble className="text-[#53BDEB]" />
                        ) : msg.delivered ? (
                          // Double gray tick for delivered
                          <FaCheckDouble className="text-gray-400" />
                        ) : (
                          // Single gray tick for sent
                          <FaCheck className="text-gray-400" />
                        )}
                      </span>
                    )}
                  </div>
                </div>

                {/* Reply Button (appears on right for their messages) */}
                {!isMe && (
                  <button
                    onClick={() => setReplyingTo(msg)}
                    className="opacity-0 group-hover:opacity-100 p-2 ml-2 self-center text-gray-400 hover:text-white transition-all"
                    title="Reply"
                  >
                    <FaReply className="text-sm" />
                  </button>
                )}
              </motion.div>
            );
          })
        )}

        {/* Typing Indicator */}
        <AnimatePresence>
          {typingUsers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex justify-start"
            >
              <div className="bg-[#1a1d25] border border-[#262A3B] rounded-2xl rounded-bl-none px-4 py-3">
                <div className="flex items-center gap-1">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                    className="w-2 h-2 bg-green-400 rounded-full"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                    className="w-2 h-2 bg-green-400 rounded-full"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                    className="w-2 h-2 bg-green-400 rounded-full"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Reply Preview Bar */}
      <AnimatePresence>
        {replyingTo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-[#0D1117] border-t border-[#262A3B] px-4 py-2 overflow-hidden"
          >
            <div className="flex items-center gap-3">
              <div className="w-1 h-10 bg-blue-500 rounded-full" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-blue-400 font-medium">
                  Replying to {replyingTo.sender?.name || "Unknown"}
                </p>
                <p className="text-sm text-gray-400 truncate">
                  {replyingTo.type === "image" ? "📷 Photo" : 
                   replyingTo.type === "video" ? "🎥 Video" :
                   replyingTo.type === "file" ? "📎 File" :
                   replyingTo.content}
                </p>
              </div>
              <button
                onClick={() => setReplyingTo(null)}
                className="p-2 text-gray-400 hover:text-white transition-all"
              >
                <FaTimes />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="bg-[#111319] border-t border-[#262A3B] px-4 py-3 sticky bottom-0">
        <div className="flex items-center gap-3">
          {/* Hidden File Inputs */}
          <input
            type="file"
            ref={imageInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*"
          />
          <input
            type="file"
            ref={videoInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept="video/*"
          />
          <input
            type="file"
            ref={docInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept=".pdf,.doc,.docx,.txt,.zip,.rar"
          />

          {/* Media Menu Button */}
          <div className="relative">
            <button
              onClick={() => setShowMediaMenu(!showMediaMenu)}
              disabled={uploading}
              className="p-3 rounded-xl bg-[#1a1d25] hover:bg-[#262A3B] transition-all disabled:opacity-50"
            >
              {uploading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"
                />
              ) : (
                <FaPaperclip className="text-gray-400" />
              )}
            </button>

            {/* Media Options Menu */}
            <AnimatePresence>
              {showMediaMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute bottom-14 left-0 bg-[#1a1d25] border border-[#262A3B] rounded-xl shadow-xl overflow-hidden z-50"
                >
                  {/* Photo Option */}
                  <button
                    onClick={() => {
                      imageInputRef.current?.click();
                      setShowMediaMenu(false);
                    }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-[#262A3B] transition-all w-full"
                  >
                    <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center">
                      <FaCamera className="text-pink-400" />
                    </div>
                    <span className="text-white text-sm font-medium">Photo</span>
                  </button>

                  {/* Video Option */}
                  <button
                    onClick={() => {
                      videoInputRef.current?.click();
                      setShowMediaMenu(false);
                    }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-[#262A3B] transition-all w-full"
                  >
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <FaVideo className="text-purple-400" />
                    </div>
                    <span className="text-white text-sm font-medium">Video</span>
                  </button>

                  {/* Document Option */}
                  <button
                    onClick={() => {
                      docInputRef.current?.click();
                      setShowMediaMenu(false);
                    }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-[#262A3B] transition-all w-full"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <FaFileAlt className="text-blue-400" />
                    </div>
                    <span className="text-white text-sm font-medium">Document</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Message Input */}
          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              onKeyDown={handleKeyPress}
              placeholder="Type a message..."
              rows={1}
              className="w-full bg-[#1a1d25] border border-[#262A3B] rounded-xl px-4 py-3 text-white text-sm placeholder:text-gray-500 resize-none focus:ring-2 focus:ring-blue-500/30 transition-all"
            />
          </div>

          {/* Send Button */}
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending}
            className="p-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
              />
            ) : (
              <FaPaperPlane className="text-white" />
            )}
          </button>
        </div>
      </div>

      {/* Media Preview Modal */}
      <MediaPreviewModal
        isOpen={!!previewMedia}
        onClose={() => setPreviewMedia(null)}
        media={previewMedia}
      />
    </div>
  );
};

export default ChatPage;
