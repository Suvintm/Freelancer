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
          // Optional: sound on receive? User asked for "when message is sent", but receiving usually has sound too.
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

      socket.on("message:new", handleNewMessage);
      socket.on("typing:start", handleTypingStart);
      socket.on("typing:stop", handleTypingStop);

      return () => {
        leaveRoom(orderId);
        socket.off("message:new", handleNewMessage);
        socket.off("typing:start", handleTypingStart);
        socket.off("typing:stop", handleTypingStop);
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

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) return toast.error("File max 50MB");

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      await axios.post(`${backendURL}/api/messages/${orderId}/file`, formData, {
        headers: { Authorization: `Bearer ${user?.token}`, "Content-Type": "multipart/form-data" }
      });
      playPopSound();
      toast.success("Sent!");
    } catch (err) {
      toast.error("Upload failed.");
    } finally {
      setUploading(false);
      setShowMediaMenu(false);
      // Reset inputs
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (imageInputRef.current) imageInputRef.current.value = "";
      if (videoInputRef.current) videoInputRef.current.value = "";
      if (docInputRef.current) docInputRef.current.value = "";
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
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2 }}
                className={`flex w-full ${isMe ? "justify-end" : "justify-start"} group mb-1`}
              >
                 {/* Tooltip / Timestamp group */}
                <div className={`relative max-w-[75%] md:max-w-[60%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                  
                  {/* Reply Preview Bubble */}
                  {msg.replyPreview && (
                      <div className={`mb-1 px-3 py-2 rounded-xl text-xs bg-white/10 border-l-2 border-purple-500 w-full opacity-80 backdrop-blur-sm`}>
                         <p className="font-bold text-purple-400">{msg.replyPreview.senderName}</p>
                         <p className="truncate text-gray-300">{msg.replyPreview.content}</p>
                      </div>
                  )}

                  {/* Message Bubble - Gradient for ME, Dark Grey for THEM */}
                  <div 
                    className={`relative px-4 py-2 ${
                        isMe 
                            ? "bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-[20px] rounded-br-sm" 
                            : "bg-[#262626] text-white rounded-[20px] rounded-bl-sm border border-white/5"
                    } shadow-sm backdrop-blur-sm`}
                    onDoubleClick={() => setReplyingTo(msg)}
                  >
                        {/* Media Content */}
                        {(msg.type === "image" || msg.type === "video") && msg.mediaUrl && (
                            <div 
                                className="mb-2 rounded-lg overflow-hidden cursor-pointer"
                                onClick={() => setPreviewMedia({ url: msg.mediaUrl, type: msg.type })}
                            >   
                                {msg.type === "image" ? (
                                    <img src={msg.mediaUrl} alt="media" className="max-w-full h-auto max-h-[300px] object-cover" />
                                ) : (
                                    <div className="relative">
                                        <video src={msg.mediaUrl} className="max-w-full h-auto max-h-[300px]" />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/40"><FaPlay className="text-white" /></div>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {/* File Content */}
                        {msg.type === "file" && (
                            <div className="flex items-center gap-3 p-2 bg-black/20 rounded-lg mb-1 cursor-pointer">
                                <FaFileAlt className="text-white/80" />
                                <div className="overflow-hidden">
                                     <p className="text-xs truncate">{msg.mediaName || "File"}</p>
                                     <p className="text-[10px] opacity-60">Download</p>
                                </div>
                            </div>
                        )}

                        {/* Text Content */}
                        {msg.content && <p className="text-[15px] leading-relaxed whitespace-pre-wrap emoji-font">{msg.content}</p>}
                        
                        {/* Timestamp & Status (Inside Bubble) */}
                        <div className={`flex items-center gap-1 mt-1 ${isMe ? "justify-end text-white/70" : "justify-start text-gray-400"}`}>
                            <span className="text-[10px]">
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isMe && (
                                <span className="ml-1">
                                    {msg.seen ? <FaCheckDouble className="text-blue-200 text-[10px]" /> : <FaCheck className="text-[10px]" />}
                                </span>
                            )}
                        </div>
                  </div>

                  {/* Reply Action Button (Hover) */}
                  <div className={`absolute top-1/2 -translate-y-1/2 ${isMe ? "-left-8" : "-right-8"} opacity-0 group-hover:opacity-100 transition-opacity`}>
                      <button onClick={() => setReplyingTo(msg)} className="p-1.5 bg-white/10 rounded-full hover:bg-white/20 text-gray-300">
                          <FaReply className="text-xs" />
                      </button>
                  </div>

                </div>
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
      <footer className="flex-none bg-black px-4 py-3 sticky bottom-0 z-50">
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
         <input type="file" ref={imageInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
         <input type="file" ref={videoInputRef} className="hidden" accept="video/*" onChange={handleFileUpload} />
         <input type="file" ref={docInputRef} className="hidden" accept="*" onChange={handleFileUpload} />
      </footer>

      {/* Modals */}
      <MediaPreviewModal isOpen={!!previewMedia} onClose={() => setPreviewMedia(null)} media={previewMedia} />
    </div>
  );
};

export default ChatPage;
