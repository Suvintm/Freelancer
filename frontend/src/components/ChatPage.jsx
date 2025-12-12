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
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { useSocket } from "../context/SocketContext";
import axios from "axios";
import { toast } from "react-toastify";
import chattexture from "../assets/chattexture.png";

const ChatPage = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const { user, backendURL } = useAppContext();
  const {
    socket,
    joinRoom,
    leaveRoom,
    startTyping,
    stopTyping,
    markAsRead,
    isUserOnline,
    getTypingUsers,
  } = useSocket();

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);

  // Get the other party in the chat
  const otherParty = user?.role === "editor" ? order?.client : order?.editor;
  const isOnline = otherParty ? isUserOnline(otherParty._id) : false;

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
    if (!socket) return;

    const handleNewMessage = (message) => {
      if (message.orderId === orderId || message.order === orderId) {
        setMessages((prev) => [...prev, message]);
        scrollToBottom();
        
        // Mark as read if in focus
        if (document.hasFocus()) {
          markAsRead(orderId);
        }
      }
    };

    const handleTypingStart = ({ orderId: typingOrderId, userId, userName }) => {
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
      if (typingOrderId === orderId) {
        setTypingUsers((prev) => prev.filter((u) => u.id !== userId));
      }
    };

    socket.on("message:new", handleNewMessage);
    socket.on("typing:start", handleTypingStart);
    socket.on("typing:stop", handleTypingStop);

    return () => {
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
      await axios.post(
        `${backendURL}/api/messages/${orderId}`,
        { content: newMessage.trim(), type: "text" },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setNewMessage("");
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

      {/* Messages Area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-3"
        style={{
          backgroundImage: `url(${chattexture})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
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
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] md:max-w-[60%] rounded-2xl px-4 py-3 ${
                    isMe
                      ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-br-none"
                      : "bg-[#1a1d25] text-white rounded-bl-none border border-[#262A3B]"
                  }`}
                >
                  {/* File Message */}
                  {msg.type === "file" && msg.fileUrl && (
                    <a
                      href={msg.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm hover:underline"
                    >
                      {msg.fileName?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                        <FaImage className="text-lg" />
                      ) : msg.fileName?.match(/\.(mp4|mov|avi|webm)$/i) ? (
                        <FaFileVideo className="text-lg" />
                      ) : (
                        <FaFile className="text-lg" />
                      )}
                      <span className="truncate">{msg.fileName || "File"}</span>
                    </a>
                  )}

                  {/* Text Message */}
                  {msg.content && <p className="text-sm whitespace-pre-wrap">{msg.content}</p>}

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
                          <FaCheckDouble className="text-blue-300" />
                        ) : (
                          <FaCheck className="opacity-60" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
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

      {/* Input Area */}
      <div className="bg-[#111319] border-t border-[#262A3B] px-4 py-3 sticky bottom-0">
        <div className="flex items-center gap-3">
          {/* File Upload */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*,video/*,.pdf,.doc,.docx,.zip"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
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
    </div>
  );
};

export default ChatPage;
