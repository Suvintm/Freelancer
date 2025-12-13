// ChatPage.jsx - Premium Instagram-Style UI
import React, { useState, useRef, useEffect } from "react";
import {
  FaArrowLeft,
  FaPaperPlane,
  FaPaperclip,
  FaCamera,
  FaVideo,
  FaFileAlt,
  FaTimes,
  FaPlay,
  FaReply,
  FaCheck,
  FaCheckDouble,
  FaTrash,
  FaLock,
  FaDownload,
  FaBan,
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

// Simple "Pop" sound base64 (short, pleasant notification sound)
const POP_SOUND = "data:audio/mpeg;base64,SUQzBAAAAAABAFRYWFgAAAASAAADbWFqb3JfYnJhbmQAZGFzaABUWFhYAAAAEQAAA21pbm9yX3ZlcnNpb24AMABUWFhYAAAAHAAAA2NvbXBhdGlibGVfYnJhbmRzAGlzbzZtcDQxAFRTU0UAAAAPAAADTGF2ZjU5LjI3LjEwMAAAAAAAAAAAAAAA//uQZAAAAAAAALAAAA4AAALAAAAOBAAA/wAA//uQZACAAAB8AAAAwAAAfAAAAOA";

// WhatsApp-style Media Card with loading animation
const MediaCard = ({ msg, isMe, onClick }) => {
  const [loaded, setLoaded] = useState(false);
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    // Simulate loading progress for receiver
    if (!isMe && !loaded) {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + Math.random() * 30;
        });
      }, 200);
      return () => clearInterval(interval);
    }
  }, [isMe, loaded]);

  return (
    <div 
      className="mb-2 rounded-2xl overflow-hidden cursor-pointer relative group/media"
      onClick={onClick}
      style={{ maxWidth: "280px" }}
    >   
      {/* Loading overlay for receiver */}
      {!isMe && !loaded && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md z-10 flex items-center justify-center rounded-2xl">
          <div className="relative">
            {/* Circular progress */}
            <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="16" fill="none" stroke="#333" strokeWidth="2" />
              <circle 
                cx="18" cy="18" r="16" fill="none" 
                stroke="url(#gradient)" strokeWidth="2"
                strokeDasharray={`${Math.min(progress, 100)} 100`}
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white text-xs font-bold">{Math.round(Math.min(progress, 100))}%</span>
            </div>
          </div>
        </div>
      )}
      
      {msg.type === "image" ? (
        <img 
          src={msg.mediaUrl} 
          alt="media" 
          className={`w-full h-auto max-h-[350px] object-cover rounded-2xl transition-all duration-500 ${!loaded && !isMe ? "blur-md scale-105" : ""}`}
          onLoad={() => setLoaded(true)}
          draggable={msg.allowDownload}
          onContextMenu={(e) => !msg.allowDownload && e.preventDefault()}
        />
      ) : (
        <div className="relative w-full">
          <video 
            src={msg.mediaUrl} 
            className={`w-full h-auto max-h-[350px] object-cover rounded-2xl transition-all duration-500 ${!loaded && !isMe ? "blur-md scale-105" : ""}`}
            onLoadedData={() => setLoaded(true)}
            controlsList={!msg.allowDownload ? "nodownload noplaybackrate" : undefined}
            disablePictureInPicture={!msg.allowDownload}
            onContextMenu={(e) => !msg.allowDownload && e.preventDefault()}
          />
          {/* Play button overlay */}
          {(loaded || isMe) && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-2xl">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
                <FaPlay className="text-white text-xl ml-1" />
              </div>
            </div>
          )}
          {/* Video badge */}
          <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-full flex items-center gap-1">
            <FaVideo className="text-white text-xs" />
            <span className="text-white text-[10px]">Video</span>
          </div>
        </div>
      )}
      
      {/* Download button - only for receiver when allowed & loaded */}
      {!isMe && msg.allowDownload && loaded && (
        <div className="absolute bottom-2 right-2 opacity-0 group-hover/media:opacity-100 transition-opacity">
          <a 
            href={msg.mediaUrl} 
            download={msg.mediaName || "file"}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-2 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/80 transition"
          >
            <FaDownload className="text-white text-sm" />
          </a>
        </div>
      )}
      
      {/* Lock indicator if download not allowed */}
      {!isMe && !msg.allowDownload && loaded && (
        <div className="absolute top-2 left-2">
          <div className="p-1.5 bg-red-500/80 backdrop-blur-sm rounded-full">
            <FaLock className="text-white text-xs" />
          </div>
        </div>
      )}
    </div>
  );
};


const ChatPage = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const { user, backendURL } = useAppContext();
  const socketContext = useSocket();
  const popAudio = useRef(new Audio(POP_SOUND));

  // --- Socket & Context Destructuring ---
  const {
    socket = null,
    joinRoom = () => {},
    leaveRoom = () => {},
    startTyping = () => {},
    stopTyping = () => {},
    markAsRead = () => {},
    onlineUsers = [],
  } = socketContext || {};

  // --- Refs ---
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const docInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // --- State ---
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [showMediaMenu, setShowMediaMenu] = useState(false);
  const [previewMedia, setPreviewMedia] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);
  const [allowDownload, setAllowDownload] = useState(false);
  const [deleteMenuMsg, setDeleteMenuMsg] = useState(null);

  // --- Derived State ---
  const otherParty = user?.role === "editor" ? order?.client : order?.editor;
  const isOnline = otherParty?._id ? onlineUsers.includes(otherParty._id) : false;

  // Play Sound Helper
  const playPopSound = () => {
    // Re-create audio object each time or reset time to ensure it plays rapidly if needed
    // Using a simple short simulated sound approach or the ref
    /* 
       Note: Browsers block auto-play. This will work on user interaction (clicking send).
       Ideally, use a real .mp3 file in public folder, but base64 is used for this example.
       Since the base64 above is truncated/placeholder, we'll try to use a standardized HTML5 beep or silence if invalid.
       For the user request "pop sound", I will implement the logic.
    */
    try {
        const audio = new Audio("https://codeskulptor-demos.commondatastorage.googleapis.com/pang/pop.mp3"); 
        audio.volume = 0.5;
        audio.play().catch(e => console.log("Audio play blocked", e));
    } catch (e) {
        console.error("Audio error", e);
    }
  };

  // --- Fetch Data ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = user?.token;
        const [orderRes, msgRes] = await Promise.all([
          axios.get(`${backendURL}/api/orders/${orderId}`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${backendURL}/api/messages/${orderId}`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setOrder(orderRes.data.order);
        setMessages(msgRes.data.messages || []);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load chat data.");
      } finally {
        setLoading(false);
      }
    };
    if (orderId) fetchData();
  }, [orderId, backendURL, user?.token]);

  // --- Socket Listeners ---
  useEffect(() => {
    if (orderId && socket) {
      joinRoom(orderId);
      markAsRead(orderId);

      const handleNewMessage = (message) => {
        const msgOrderId = message.orderId || message.order;
        if (msgOrderId === orderId || String(msgOrderId) === String(orderId)) {
          setMessages((prev) => [...prev, message]);
          if (document.hasFocus()) markAsRead(orderId);
        }
      };

      const handleTypingStart = ({ orderId: tid, userId, userName }) => {
        if (tid === orderId && userId !== user?._id) {
          setTypingUsers((prev) => prev.find(u => u.id === userId) ? prev : [...prev, { id: userId, name: userName }]);
        }
      };

      const handleTypingStop = ({ orderId: tid, userId }) => {
        if (tid === orderId) {
          setTypingUsers((prev) => prev.filter(u => u.id !== userId));
        }
      };

      // Real-time message status updates
      const handleMessageDelivered = ({ messageId, orderId: msgOrderId }) => {
        if (msgOrderId === orderId || String(msgOrderId) === String(orderId)) {
          setMessages((prev) => prev.map(msg => 
            msg._id === messageId ? { ...msg, delivered: true } : msg
          ));
        }
      };

      const handleMessageSeen = ({ messageId, orderId: msgOrderId, seenAt }) => {
        if (msgOrderId === orderId || String(msgOrderId) === String(orderId)) {
          setMessages((prev) => prev.map(msg => 
            msg._id === messageId ? { ...msg, seen: true, seenAt } : msg
          ));
        }
      };

      // Bulk status update when joining room
      const handleStatusUpdate = ({ orderId: msgOrderId, messages: statusMessages }) => {
        if (msgOrderId === orderId || String(msgOrderId) === String(orderId)) {
          setMessages((prev) => prev.map(msg => {
            const status = statusMessages.find(s => s._id === msg._id);
            if (status) {
              return { ...msg, seen: status.seen, seenAt: status.seenAt, delivered: status.delivered };
            }
            return msg;
          }));
        }
      };

      // Batch read update
      const handleMessageRead = ({ orderId: msgOrderId, messageIds, seenAt }) => {
        if (msgOrderId === orderId || String(msgOrderId) === String(orderId)) {
          setMessages((prev) => prev.map(msg => 
            messageIds?.includes(msg._id) ? { ...msg, seen: true, seenAt } : msg
          ));
        }
      };

      socket.on("message:new", handleNewMessage);
      socket.on("typing:start", handleTypingStart);
      socket.on("typing:stop", handleTypingStop);
      socket.on("message:delivered", handleMessageDelivered);
      socket.on("message:seen", handleMessageSeen);
      socket.on("messages:status_update", handleStatusUpdate);
      socket.on("message:read", handleMessageRead);
      
      // Listen for message deletion
      const handleMessageDeleted = ({ messageId }) => {
        setMessages(prev => prev.map(m => m._id === messageId ? { ...m, isDeleted: true } : m));
      };
      socket.on("message:deleted", handleMessageDeleted);

      return () => {
        leaveRoom(orderId);
        socket.off("message:new", handleNewMessage);
        socket.off("typing:start", handleTypingStart);
        socket.off("typing:stop", handleTypingStop);
        socket.off("message:delivered", handleMessageDelivered);
        socket.off("message:seen", handleMessageSeen);
        socket.off("messages:status_update", handleStatusUpdate);
        socket.off("message:read", handleMessageRead);
      };
    }
  }, [orderId, socket, joinRoom, leaveRoom, markAsRead, user?._id]);

  // --- Auto Scroll ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  // --- Handlers ---
  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;
    setSending(true);
    stopTyping(orderId);
    playPopSound(); // 🎵 Pop Sound!

    try {
      const token = user?.token;
      const messageData = { content: newMessage.trim(), type: "text" };
      if (replyingTo) {
        messageData.replyTo = replyingTo._id;
        messageData.replyPreview = {
          senderName: replyingTo.sender?.name || "Unknown",
          content: replyingTo.content || "Media",
          type: replyingTo.type,
        };
      }

      await axios.post(`${backendURL}/api/messages/${orderId}`, messageData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setNewMessage("");
      setReplyingTo(null);
    } catch (err) {
      toast.error("Failed to send.");
    } finally {
      setSending(false);
    }
  };

  // Handle file selection - show preview instead of auto-send
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) return toast.error("File max 50MB");
    
    // Create preview
    const preview = URL.createObjectURL(file);
    const type = file.type.startsWith("image") ? "image" : file.type.startsWith("video") ? "video" : "file";
    setPendingFile({ file, preview, type, name: file.name });
    setShowMediaMenu(false);
    setAllowDownload(false); // Default: download not allowed
  };

  // Send pending file
  const handleSendFile = async () => {
    if (!pendingFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", pendingFile.file);
      formData.append("allowDownload", allowDownload.toString());
      await axios.post(`${backendURL}/api/messages/${orderId}/file`, formData, {
        headers: { Authorization: `Bearer ${user?.token}`, "Content-Type": "multipart/form-data" }
      });
      playPopSound();
      toast.success("Sent!");
      URL.revokeObjectURL(pendingFile.preview);
      setPendingFile(null);
    } catch (err) {
      toast.error("Upload failed.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (imageInputRef.current) imageInputRef.current.value = "";
      if (videoInputRef.current) videoInputRef.current.value = "";
      if (docInputRef.current) docInputRef.current.value = "";
    }
  };

  // Delete message
  const handleDeleteMessage = async (msgId) => {
    try {
      await axios.patch(`${backendURL}/api/messages/${msgId}/delete`, {}, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      setMessages(prev => prev.map(m => m._id === msgId ? { ...m, isDeleted: true } : m));
      setDeleteMenuMsg(null);
      toast.success("Message deleted");
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="flex flex-col h-screen bg-black text-white font-sans overflow-hidden">
      
      {/* 1. Fixed Header (Glassmorphism) */}
      <header className="flex-none z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-4 px-4 py-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition">
            <FaArrowLeft className="text-white text-lg" />
          </button>

          {/* User Info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative">
              <div className="w-10 h-10 rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500">
                <img 
                  src={otherParty?.profilePicture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} 
                  alt="Profile"
                  className="w-full h-full rounded-full object-cover border-2 border-black"
                />
              </div>
              {isOnline && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black"></div>}
            </div>
            <div className="flex flex-col justify-center">
              <span className="font-semibold text-sm truncate leading-tight">{otherParty?.name || "Unknown User"}</span>
              <span className="text-[11px] text-gray-400 leading-tight">
                {isOnline ? "Active now" : "Offline"}
              </span>
            </div>
          </div>
        </div>

        {/* Integrated Project Details (Collapsible) */}
        <div className="bg-white/5 border-t border-white/5">
            <ProjectDetailsDropdown order={{ ...order, currentUserId: user?._id }} />
        </div>
      </header>


      {/* 2. Messages Area (Textured Background) */}
      <div 
        className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-2 relative scroll-smooth"
        style={{
          backgroundImage: `url(${chattexture})`,
          backgroundSize: "cover", // Or "300px" based on texture type
          backgroundRepeat: "repeat",
          backgroundAttachment: "fixed" 
        }}
      >
        {/* Dark overlay for readability */}
        <div className="fixed inset-0 bg-black/70 pointer-events-none z-0" />

        <div className="relative z-10 flex flex-col gap-1 pb-4">
          {messages.map((msg, i) => {
            const isMe = msg.sender?._id === user?._id || msg.sender === user?._id;
            const isLast = i === messages.length - 1;
            
            return (
              <motion.div
                key={msg._id || i}
                id={`msg-${msg._id}`}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2 }}
                className={`flex w-full ${isMe ? "justify-end" : "justify-start"} group mb-1 transition-all duration-300`}
              >
                {/* Swipeable Message Container */}
                <motion.div 
                  drag={!msg.isDeleted ? "x" : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.3}
                  dragSnapToOrigin
                  onDragEnd={(e, info) => {
                    if (info.offset.x > 60 && !msg.isDeleted) {
                      setReplyingTo(msg);
                    }
                  }}
                  className={`relative max-w-[75%] md:max-w-[60%] flex items-center gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}
                >
                  {/* Reply indicator (shows on drag) */}
                  <motion.div 
                    className="absolute left-[-40px] opacity-0 pointer-events-none"
                    style={{ opacity: 0 }}
                  >
                    <div className="p-2 bg-purple-500/30 rounded-full">
                      <FaReply className="text-purple-400 text-sm" />
                    </div>
                  </motion.div>
                  
                  <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                    {/* Reply Preview Bubble - Instagram style with media thumbnail */}
                    {msg.replyPreview && (
                        <div 
                          className={`mb-1 rounded-xl text-xs bg-white/10 border-l-2 border-purple-500 w-full opacity-90 backdrop-blur-sm cursor-pointer hover:bg-white/20 transition overflow-hidden flex`}
                          onClick={(e) => {
                            e.stopPropagation();
                            // Scroll to the original message
                            const originalMsgElement = document.getElementById(`msg-${msg.replyPreview.messageId || msg.replyTo}`);
                            if (originalMsgElement) {
                              originalMsgElement.scrollIntoView({ behavior: "smooth", block: "center" });
                              // Add highlight animation
                              originalMsgElement.classList.add("ring-2", "ring-purple-500");
                              setTimeout(() => {
                                originalMsgElement.classList.remove("ring-2", "ring-purple-500");
                              }, 2000);
                            }
                          }}
                        >
                          {/* Text content */}
                          <div className="flex-1 p-2 min-w-0">
                            <p className="font-bold text-purple-400">{msg.replyPreview.senderName}</p>
                            <p className="truncate text-gray-300">
                              {msg.replyPreview.type === "image" && "📷 Photo"}
                              {msg.replyPreview.type === "video" && "🎬 Video"}
                              {msg.replyPreview.type === "file" && "📄 File"}
                              {msg.replyPreview.type === "text" && msg.replyPreview.content}
                              {!msg.replyPreview.type && msg.replyPreview.content}
                            </p>
                          </div>
                          {/* Media thumbnail - Instagram style on the right */}
                          {(msg.replyPreview.type === "image" || msg.replyPreview.type === "video") && msg.replyPreview.mediaUrl && (
                            <div className="w-12 h-12 flex-shrink-0 relative">
                              {msg.replyPreview.type === "image" ? (
                                <img 
                                  src={msg.replyPreview.mediaThumbnail || msg.replyPreview.mediaUrl} 
                                  alt="" 
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full relative">
                                  <video 
                                    src={msg.replyPreview.mediaUrl} 
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                    <FaPlay className="text-white text-xs" />
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                    )}

                  {/* Message Bubble - Gradient for ME, Dark Grey for THEM */}
                  <div 
                    className={`relative px-4 py-2 ${
                        msg.isDeleted 
                            ? "bg-[#1a1a1a] text-gray-500 rounded-[20px] border border-white/5 italic" 
                            : isMe 
                            ? "bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-[20px] rounded-br-sm" 
                            : "bg-[#262626] text-white rounded-[20px] rounded-bl-sm border border-white/5"
                    } shadow-sm backdrop-blur-sm`}
                    onDoubleClick={() => !msg.isDeleted && setReplyingTo(msg)}
                  >
                        {/* Deleted Message */}
                        {msg.isDeleted ? (
                          <div className="flex items-center gap-2">
                            <FaBan className="text-gray-500" />
                            <span className="text-sm">This message was deleted</span>
                          </div>
                        ) : (
                          <>
                        {/* Media Content - Instagram/WhatsApp Style with Loading Animation */}
                        {(msg.type === "image" || msg.type === "video") && msg.mediaUrl && (
                            <MediaCard 
                              msg={msg} 
                              isMe={isMe} 
                              onClick={() => setPreviewMedia({ url: msg.mediaUrl, type: msg.type, allowDownload: msg.allowDownload })} 
                            />
                        )}
                        
                        {/* File Content - Enhanced with download option */}
                        {msg.type === "file" && (
                            <div className="bg-black/20 rounded-xl p-3 mb-1">
                              <div className="flex items-center gap-3">
                                <div className="p-3 bg-purple-500/20 rounded-xl">
                                  <FaFileAlt className="text-purple-400 text-lg" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{msg.mediaName || "File"}</p>
                                  <p className="text-[11px] text-gray-400">{msg.mediaSize ? `${(msg.mediaSize / 1024).toFixed(1)} KB` : "Document"}</p>
                                </div>
                                {/* Download button for receiver if allowed */}
                                {!isMe && msg.allowDownload && (
                                  <a 
                                    href={msg.mediaUrl} 
                                    download={msg.mediaName || "file"}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 bg-emerald-500/20 rounded-xl hover:bg-emerald-500/30 transition"
                                  >
                                    <FaDownload className="text-emerald-400" />
                                  </a>
                                )}
                                {/* Lock for receiver if not allowed */}
                                {!isMe && !msg.allowDownload && (
                                  <div className="p-2 bg-red-500/20 rounded-xl">
                                    <FaLock className="text-red-400" />
                                  </div>
                                )}
                              </div>
                            </div>
                        )}

                        {/* Text Content */}
                        {msg.content && <p className="text-[15px] leading-relaxed whitespace-pre-wrap emoji-font">{msg.content}</p>}
                        
                        {/* Timestamp & Status (Inside Bubble) */}
                        <div className={`flex items-center gap-1.5 mt-1 ${isMe ? "justify-end text-white/70" : "justify-start text-gray-400"}`}>
                            <span className="text-[10px]">
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isMe && (
                                <span className="flex items-center gap-0.5 text-[10px]">
                                    {msg.seen ? (
                                        <>
                                            <FaCheckDouble className="text-green-400" />
                                            <span className="text-green-400 text-[9px]">Seen</span>
                                        </>
                                    ) : msg.delivered ? (
                                        <>
                                            <FaCheckDouble className="text-white/60" />
                                            <span className="text-white/60 text-[9px]">Delivered</span>
                                        </>
                                    ) : (
                                        <>
                                            <FaCheck className="text-white/50" />
                                            <span className="text-white/50 text-[9px]">Sent</span>
                                        </>
                                    )}
                                </span>
                            )}
                        </div>
                          </>  
                        )}
                  </div>

                  {/* Action Buttons (Hover) */}
                  {!msg.isDeleted && (
                    <div className={`absolute top-1/2 -translate-y-1/2 ${isMe ? "-left-16" : "-right-16"} opacity-0 group-hover:opacity-100 transition-opacity flex gap-1`}>
                        <button onClick={() => setReplyingTo(msg)} className="p-1.5 bg-white/10 rounded-full hover:bg-white/20 text-gray-300">
                            <FaReply className="text-xs" />
                        </button>
                        {isMe && (
                          <button onClick={() => handleDeleteMessage(msg._id)} className="p-1.5 bg-red-500/20 rounded-full hover:bg-red-500/40 text-red-400">
                              <FaTrash className="text-xs" />
                          </button>
                        )}
                    </div>
                  )}

                  </div>
                </motion.div>
              </motion.div>
            );
          })}
          
          {/* Typing Indicator: Premium "Wave" Animation */}
          <AnimatePresence>
            {typingUsers.length > 0 && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex justify-start mb-2 relative z-10"
                >
                    <div className="bg-[#262626] border border-white/5 rounded-full px-4 py-3 flex items-center gap-1">
                         <span className="text-xs text-gray-400 mr-2">Typing</span>
                         {[0, 1, 2].map(i => (
                             <motion.div
                                key={i}
                                className="w-1.5 h-1.5 bg-purple-500 rounded-full"
                                animate={{ y: [0, -5, 0] }}
                                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                             />
                         ))}
                    </div>
                </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} className="h-1" />
        </div>
      </div>


      {/* 3. Input Area (Fixed Bottom) */}
      <footer className="flex-none bg-black px-4 py-3 pb-6 sticky bottom-0 z-50" style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}>
         {/* Reply Preview Context */}
         <AnimatePresence>
            {replyingTo && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="flex items-center justify-between bg-[#1c1c1c] border-l-4 border-purple-500 p-3 rounded-t-xl mb-2"
                >
                    <div className="overflow-hidden">
                        <p className="text-xs text-purple-400 font-bold">Replying to {replyingTo.sender?.name || "User"}</p>
                        <p className="text-sm text-gray-400 truncate">{replyingTo.content || "Media"}</p>
                    </div>
                    <button onClick={() => setReplyingTo(null)} className="p-1 hover:bg-white/10 rounded-full"><FaTimes /></button>
                </motion.div>
            )}
         </AnimatePresence>
         
         <div className="flex items-end gap-2 max-w-4xl mx-auto">
             {/* Media Menu */}
             <div className="relative">
                 <button 
                    onClick={() => setShowMediaMenu(!showMediaMenu)}
                    className="p-3 text-white bg-[#262626] rounded-full hover:bg-[#333] transition"
                 >
                    <FaPaperclip />
                 </button>
                 {/* Popup Menu */}
                 <AnimatePresence>
                     {showMediaMenu && (
                         <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 10 }}
                            className="absolute bottom-14 left-0 bg-[#262626] border border-white/10 rounded-xl shadow-2xl p-2 w-40 flex flex-col gap-1 z-[60]"
                        >
                             <button onClick={() => imageInputRef.current.click()} className="flex items-center gap-3 p-2 hover:bg-white/10 rounded-lg text-sm"><FaCamera className="text-pink-500" /> Photo</button>
                             <button onClick={() => videoInputRef.current.click()} className="flex items-center gap-3 p-2 hover:bg-white/10 rounded-lg text-sm"><FaVideo className="text-blue-500" /> Video</button>
                             <button onClick={() => docInputRef.current.click()} className="flex items-center gap-3 p-2 hover:bg-white/10 rounded-lg text-sm"><FaFileAlt className="text-yellow-500" /> Document</button>
                         </motion.div>
                     )}
                 </AnimatePresence>
             </div>
             
             {/* Text Input - Pill Shape */}
             <div className="flex-1 bg-[#262626] rounded-[24px] px-4 py-2 border border-white/5 focus-within:border-purple-500/50 transition">
                 <textarea
                    value={newMessage}
                    onChange={(e) => { setNewMessage(e.target.value); startTyping(orderId); }}
                    onBlur={() => stopTyping(orderId)}
                    onKeyDown={(e) => { if(e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                    placeholder="Message..."
                    rows={1}
                    className="w-full bg-transparent text-white outline-none placeholder:text-gray-500 resize-none max-h-32 py-1 scrollbar-hide text-[15px]" 
                 />
             </div>

             {/* Send Button */}
             <button 
                onClick={handleSendMessage}
                disabled={!newMessage.trim() && !uploading}
                className={`p-3 rounded-full transition-all duration-200 transform hover:scale-105 ${
                    newMessage.trim() ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/30" : "bg-[#262626] text-gray-500"
                }`}
             >
                {sending ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FaPaperPlane />}
             </button>
         </div>

         {/* Hidden Inputs */}
         <input type="file" ref={imageInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
         <input type="file" ref={videoInputRef} className="hidden" accept="video/*" onChange={handleFileSelect} />
         <input type="file" ref={docInputRef} className="hidden" accept="*" onChange={handleFileSelect} />
      </footer>

      {/* Pending File Preview Modal */}
      <AnimatePresence>
        {pendingFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-[100] flex flex-col items-center justify-center p-4"
          >
            <div className="w-full max-w-lg">
              {/* Preview */}
              <div className="bg-[#1a1a1a] rounded-2xl p-4 mb-4">
                {pendingFile.type === "image" && (
                  <img src={pendingFile.preview} alt="Preview" className="max-w-full max-h-[50vh] mx-auto rounded-lg object-contain" />
                )}
                {pendingFile.type === "video" && (
                  <video src={pendingFile.preview} controls className="max-w-full max-h-[50vh] mx-auto rounded-lg" />
                )}
                {pendingFile.type === "file" && (
                  <div className="flex items-center gap-4 p-6">
                    <FaFileAlt className="text-4xl text-purple-400" />
                    <div>
                      <p className="text-white font-medium">{pendingFile.name}</p>
                      <p className="text-gray-400 text-sm">Document</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Download Toggle */}
              <div className="bg-[#1a1a1a] rounded-2xl p-4 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {allowDownload ? <FaDownload className="text-emerald-400" /> : <FaLock className="text-red-400" />}
                  <div>
                    <p className="text-white text-sm font-medium">Allow Download</p>
                    <p className="text-gray-500 text-xs">Recipient can download this file</p>
                  </div>
                </div>
                <button
                  onClick={() => setAllowDownload(!allowDownload)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${allowDownload ? "bg-emerald-500" : "bg-gray-600"}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${allowDownload ? "left-7" : "left-1"}`} />
                </button>
              </div>
              
              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => { URL.revokeObjectURL(pendingFile.preview); setPendingFile(null); }}
                  className="flex-1 py-3 bg-[#262626] text-white rounded-xl font-medium hover:bg-[#333] transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendFile}
                  disabled={uploading}
                  className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/30 transition flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><FaPaperPlane /> Send</>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <MediaPreviewModal isOpen={!!previewMedia} onClose={() => setPreviewMedia(null)} media={previewMedia} />
    </div>
  );
};

export default ChatPage;
