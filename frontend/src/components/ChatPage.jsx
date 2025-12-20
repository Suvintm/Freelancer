// ChatPage.jsx - Premium Instagram-Style UI with Advanced Features
import React, { useState, useRef, useEffect, useCallback } from "react";
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
  FaMicrophone,
  FaStop,
  FaPause,
  FaEdit,
  FaStar,
  FaSearch,
  FaList,
  FaRegStar,
  FaBolt,
  FaLink,
  FaExternalLinkAlt,
  FaFolder,
  FaFilm,
  FaImage,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { useSocket } from "../context/SocketContext";
import MediaPreviewModal from "./MediaPreviewModal";
import ChatInfoTabs from "./ChatInfoTabs";
import FinalDeliveryCard from "./FinalDeliveryCard";
import SystemMessageCard from "./SystemMessageCard";
import WatermarkPreviewModal from "./WatermarkPreviewModal";
import DownloadConfirmPopup from "./DownloadConfirmPopup";
import ChangesRequestModal from "./ChangesRequestModal";
import CompletedOrderReceipt from "./CompletedOrderReceipt";
import PaymentRequestCard from "./PaymentRequestCard";
import ChatMediaGallery from "./ChatMediaGallery";
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

// 🎙️ Voice Recorder Component
const VoiceRecorder = ({ onSend, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (e) => {
        chunksRef.current.push(e.data);
      };
      
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setDuration(0);
      timerRef.current = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
    } catch (err) {
      toast.error("Microphone access denied");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const handleSend = () => {
    if (audioBlob) {
      onSend(audioBlob, duration);
    }
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 bg-gradient-to-r from-purple-600/20 to-blue-600/20 backdrop-blur-md rounded-2xl px-4 py-3 border border-purple-500/30"
    >
      {/* Waveform Animation */}
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="w-1 bg-purple-500 rounded-full"
            animate={isRecording ? { height: [8, 24, 8] } : { height: 8 }}
            transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
          />
        ))}
      </div>
      
      {/* Timer */}
      <span className="text-white font-mono text-lg min-w-[60px]">{formatTime(duration)}</span>
      
      {/* Controls */}
      <div className="flex items-center gap-2 ml-auto">
        {!isRecording && !audioBlob && (
          <button onClick={startRecording} className="p-3 bg-red-500 rounded-full hover:bg-red-600 transition">
            <FaMicrophone className="text-white" />
          </button>
        )}
        
        {isRecording && (
          <button onClick={stopRecording} className="p-3 bg-red-500 rounded-full hover:bg-red-600 transition animate-pulse">
            <FaStop className="text-white" />
          </button>
        )}
        
        {audioBlob && !isRecording && (
          <>
            <button onClick={handleSend} className="p-3 bg-green-500 rounded-full hover:bg-green-600 transition">
              <FaPaperPlane className="text-white" />
            </button>
          </>
        )}
        
        <button onClick={onCancel} className="p-3 bg-gray-600 rounded-full hover:bg-gray-700 transition">
          <FaTimes className="text-white" />
        </button>
      </div>
    </motion.div>
  );
};

// 🔊 Voice Player Component
const VoicePlayer = ({ audioUrl, duration }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef(null);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="flex items-center gap-3 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-2xl px-4 py-3 min-w-[200px]">
      <audio 
        ref={audioRef} 
        src={audioUrl}
        onTimeUpdate={(e) => setProgress((e.target.currentTime / e.target.duration) * 100)}
        onEnded={() => { setIsPlaying(false); setProgress(0); }}
      />
      
      <button onClick={togglePlay} className="p-2 bg-purple-500 rounded-full hover:bg-purple-600 transition">
        {isPlaying ? <FaPause className="text-white text-xs" /> : <FaPlay className="text-white text-xs ml-0.5" />}
      </button>
      
      {/* Progress bar */}
      <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
        <div className="h-full bg-purple-500 transition-all" style={{ width: `${progress}%` }} />
      </div>
      
      <span className="text-xs text-gray-300 font-mono">{formatTime(duration || 0)}</span>
    </div>
  );
};

// ⚡ Quick Replies Menu
const QuickRepliesMenu = ({ replies, onSelect, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="absolute bottom-full left-0 right-0 mb-2 bg-[#1a1a1a] border border-white/10 rounded-2xl p-2 max-h-60 overflow-y-auto"
    >
      <div className="flex items-center justify-between px-2 pb-2 border-b border-white/10 mb-2">
        <span className="text-sm font-bold text-purple-400">⚡ Quick Replies</span>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full">
          <FaTimes className="text-gray-400 text-xs" />
        </button>
      </div>
      
      {replies.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-4">No quick replies saved</p>
      ) : (
        replies.map((reply) => (
          <button
            key={reply._id}
            onClick={() => onSelect(reply)}
            className="w-full text-left px-3 py-2 hover:bg-white/10 rounded-xl transition group"
          >
            <p className="text-white text-sm font-medium">{reply.title}</p>
            <p className="text-gray-400 text-xs truncate">{reply.content}</p>
          </button>
        ))
      )}
    </motion.div>
  );
};

// ✏️ Edit Message Modal
const EditMessageModal = ({ message, onSave, onClose }) => {
  const [content, setContent] = useState(message?.content || "");

  if (!message) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="bg-[#1a1a1a] rounded-2xl p-6 w-full max-w-md border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <FaEdit className="text-purple-400" /> Edit Message
        </h3>
        
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white resize-none focus:outline-none focus:border-purple-500"
          rows={4}
          autoFocus
        />
        
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 py-2 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition">
            Cancel
          </button>
          <button 
            onClick={() => onSave(content)}
            disabled={!content.trim()}
            className="flex-1 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:opacity-90 transition disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// 📁 Drive Link Card - Clean Corporate Style
const DriveLinkCard = ({ link, onLinkClick }) => {
  // Real SVG icons for each provider
  const GoogleDriveIcon = () => (
    <svg viewBox="0 0 87.3 78" className="w-5 h-5">
      <path fill="#0066DA" d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5l5.4 9.35z"/>
      <path fill="#00AC47" d="M43.65 25L29.9 1.2c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44-.2.35c.8-1.4 1.95-2.5 3.3-3.3L43.65 25z"/>
      <path fill="#EA4335" d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.55L73.55 76.8z"/>
      <path fill="#00832D" d="M43.65 25L29.9 1.2A8.86 8.86 0 0026.6.0H.0l29.9 52.15L43.65 25z"/>
      <path fill="#2684FC" d="M59.55 53H27.5l-13.75 23.8c1.35.8 2.85 1.2 4.4 1.2h50.4c1.55 0 3.05-.4 4.4-1.2L59.55 53z"/>
      <path fill="#FFBA00" d="M73.4 26.5L60.7.0C59.35.0 57.85.4 56.5 1.2L43.65 25l15.9 28H87.3c0-1.55-.4-3.1-1.2-4.5L73.4 26.5z"/>
    </svg>
  );
  
  const DropboxIcon = () => (
    <svg viewBox="0 0 43 40" className="w-5 h-5">
      <path fill="#0061FF" d="M12.5 0L0 8.1 12.5 16.2 25 8.1zM0 24.4l12.5 8.1 12.5-8.1-12.5-8.1zM25 16.3l12.5-8.1L25 0 12.5 8.1zM37.5 16.3L25 24.4l12.5 8.1 12.5-8.1zM12.5 35.5L25 27.4 12.5 19.3 0 27.4z"/>
    </svg>
  );
  
  const OneDriveIcon = () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5">
      <path fill="#0078D4" d="M14.5 18H6c-3.31 0-6-2.69-6-6 0-2.97 2.16-5.43 5-5.91V6c0-3.31 2.69-6 6-6 2.97 0 5.43 2.16 5.91 5H17c3.31 0 6 2.69 6 6s-2.69 6-6 6h-2.5z"/>
    </svg>
  );
  
  const WeTransferIcon = () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5">
      <circle fill="#409FFF" cx="12" cy="12" r="12"/>
      <path fill="white" d="M6 8h12v2H6zm0 3h12v2H6zm0 3h8v2H6z"/>
    </svg>
  );
  
  const MegaIcon = () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5">
      <path fill="#D9272E" d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5 16.5l-3.5-5v5h-3v-5l-3.5 5H4.5l5-7.5-5-7.5H7l3.5 5v-5h3v5l3.5-5h2.5l-5 7.5 5 7.5H17z"/>
    </svg>
  );
  
  const getProviderInfo = (provider) => {
    switch (provider) {
      case "google_drive":
        return { name: "Google Drive", btnColor: "bg-[#1a73e8] hover:bg-[#1557b0]", Icon: GoogleDriveIcon };
      case "dropbox":
        return { name: "Dropbox", btnColor: "bg-[#0061ff] hover:bg-[#004dcc]", Icon: DropboxIcon };
      case "onedrive":
        return { name: "OneDrive", btnColor: "bg-[#0078d4] hover:bg-[#005a9e]", Icon: OneDriveIcon };
      case "wetransfer":
        return { name: "WeTransfer", btnColor: "bg-[#409fff] hover:bg-[#2d8ce6]", Icon: WeTransferIcon };
      case "mega":
        return { name: "MEGA", btnColor: "bg-[#d9272e] hover:bg-[#b81f25]", Icon: MegaIcon };
      default:
        return { name: "External Link", btnColor: "bg-zinc-600 hover:bg-zinc-700", Icon: () => <FaExternalLinkAlt className="w-4 h-4 text-zinc-400" /> };
    }
  };

  const providerInfo = getProviderInfo(link.provider);
  const ProviderIcon = providerInfo.Icon;

  return (
    <div className="w-full max-w-[280px]">
      <div className="bg-white light:bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm overflow-hidden">
        {/* Compact Header */}
        <div className="p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center border border-zinc-100 dark:border-zinc-700">
            <ProviderIcon />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-zinc-900 dark:text-white text-[13px] truncate leading-tight">
              {link.title || "Shared Files"}
            </h4>
            <p className="text-zinc-500 dark:text-zinc-400 text-[11px]">{providerInfo.name}</p>
          </div>
        </div>
        
        {/* Description */}
        {link.description && (
          <div className="px-3 pb-2">
            <p className="text-zinc-600 dark:text-zinc-400 text-[11px] leading-relaxed line-clamp-2">{link.description}</p>
          </div>
        )}
        
        {/* Link-style Action Button */}
        <div className="px-3 pb-3">
          <button
            onClick={() => onLinkClick ? onLinkClick(link.url) : window.open(link.url, "_blank")}
            className="w-full py-2 px-3 bg-transparent border border-zinc-200 dark:border-zinc-700 hover:border-blue-400 dark:hover:border-blue-500 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-[12px] font-medium rounded-md flex items-center justify-center gap-2 transition-all group"
          >
            <FaExternalLinkAlt className="text-[9px] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            <span>Open in {providerInfo.name}</span>
            <span className="text-zinc-400 dark:text-zinc-500 text-[10px]">↗</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// 📤 Add Drive Link Modal (Client Only)
const AddDriveLinkModal = ({ onSubmit, onClose }) => {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!url.trim()) return;
    setLoading(true);
    await onSubmit({ url, title, description });
    setLoading(false);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#1a1a1a] rounded-2xl p-6 max-w-md w-full border border-white/10"
      >
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <FaFolder className="text-yellow-500" />
          Share Raw Footage
        </h3>
        
        <p className="text-gray-400 text-sm mb-4">
          Paste a Google Drive, Dropbox, or any cloud storage link for your editor to download the files.
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Link URL *</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://drive.google.com/..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
            />
          </div>
          
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Title (Optional)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Wedding Raw Clips"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
            />
          </div>
          
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Description (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Any notes for the editor..."
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white resize-none focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <button 
            onClick={onClose} 
            className="flex-1 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={!url.trim() || loading}
            className="flex-1 py-3 bg-gradient-to-r from-yellow-500 to-green-500 text-white font-bold rounded-xl hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <FaLink className="text-sm" />
                Share Link
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

import ContentAccessModal from "./ContentAccessModal";

const ChatPage = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const { user, backendURL, refreshUser } = useAppContext();
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

  // --- New Feature States ---
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [quickReplies, setQuickReplies] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [checklist, setChecklist] = useState([]);
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [showDriveLinkModal, setShowDriveLinkModal] = useState(false);
  
  // --- Final Delivery States ---
  const [showWatermarkPreview, setShowWatermarkPreview] = useState(false);
  const [showDownloadConfirm, setShowDownloadConfirm] = useState(false);
  const [showChangesRequest, setShowChangesRequest] = useState(false);
  const [currentDelivery, setCurrentDelivery] = useState(null);
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [deliveryPreviewData, setDeliveryPreviewData] = useState(null);
  
  // --- Media Gallery State ---
  const [showMediaGallery, setShowMediaGallery] = useState(false);

  // --- Legal / Content Access State ---
  const [accessModalOpen, setAccessModalOpen] = useState(false);
  const [pendingDriveLink, setPendingDriveLink] = useState(null);
  const [isAcceptingPolicy, setIsAcceptingPolicy] = useState(false);

  // Handle Drive Link Click
  const handleDriveLinkClick = async (url) => {
    // If not editor, or already accepted, just open
    if (user?.role !== "editor") {
        window.open(url, "_blank");
        return;
    }

    if (user?.legalAcceptance?.contentPolicyAccepted) {
        // Log access silently (optional but good for audit)
        try {
            axios.post(`${backendURL}/api/user/legal/log-access`, 
                { orderId, clientId: order?.client?._id },
                { headers: { Authorization: `Bearer ${user?.token}` } }
            );
        } catch (e) {
            console.error("Failed to log access", e);
        }
        
        toast.info("Opening confidential files...", { autoClose: 2000 });
        window.open(url, "_blank");
        return;
    }

    // Else show modal
    setPendingDriveLink(url);
    setAccessModalOpen(true);
  };

  const handleAcceptPolicy = async () => {
    setIsAcceptingPolicy(true);
    try {
        const token = user?.token;
        
        // 1. Accept Policy
        await axios.post(`${backendURL}/api/user/legal/accept-policy`, 
            { agreementVersion: "v1.0" },
            { headers: { Authorization: `Bearer ${token}` } }
        );

        // 2. Log Access
        await axios.post(`${backendURL}/api/user/legal/log-access`, 
            { orderId, clientId: order?.client?._id },
            { headers: { Authorization: `Bearer ${token}` } }
        );

        // 3. Refresh User Context
        await refreshUser();
        
        // 4. Open Link
        window.open(pendingDriveLink, "_blank");
        
        toast.success("AGREEMENT ACCEPTED. You now have access.");
        setAccessModalOpen(false);
        setPendingDriveLink(null);
    } catch (err) {
        console.error("Policy acceptance failed", err);
        toast.error("Failed to process agreement. Please try again.");
    } finally {
        setIsAcceptingPolicy(false);
    }
  };

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

      // 🆕 Listen for delivery acceptance (real-time card update)
      const handleDeliveryAccepted = ({ messageId, status, acceptedAt }) => {
        setMessages(prev => prev.map(m => 
          m._id === messageId 
            ? { ...m, finalDelivery: { ...m.finalDelivery, status, acceptedAt } } 
            : m
        ));
        // Reload to update header status
        window.location.reload();
      };
      socket.on("delivery:accepted", handleDeliveryAccepted);

      // 🆕 Listen for order completion
      const handleOrderCompleted = ({ orderId: completedOrderId, status, paymentReleased }) => {
        if (completedOrderId === orderId) {
          // Reload to update UI
          window.location.reload();
        }
      };
      socket.on("order:completed", handleOrderCompleted);

      // 🆕 Listen for message updates (finalDelivery status changes)
      const handleMessageUpdated = ({ messageId, updates }) => {
        setMessages(prev => prev.map(m => {
          if (m._id === messageId) {
            const updated = { ...m };
            // Apply nested updates
            Object.entries(updates).forEach(([key, value]) => {
              const keys = key.split('.');
              if (keys.length === 2 && keys[0] === 'finalDelivery') {
                updated.finalDelivery = { ...updated.finalDelivery, [keys[1]]: value };
              }
            });
            return updated;
          }
          return m;
        }));
      };
      socket.on("message:updated", handleMessageUpdated);

      // 🆕 Listen for when editor submits delivery
      const handleDeliverySubmitted = ({ orderId: submittedOrderId }) => {
        if (submittedOrderId === orderId) {
          // Reload to get the new final delivery message
          window.location.reload();
        }
      };
      socket.on("delivery:submitted", handleDeliverySubmitted);

      return () => {
        leaveRoom(orderId);
        socket.off("message:new", handleNewMessage);
        socket.off("typing:start", handleTypingStart);
        socket.off("typing:stop", handleTypingStop);
        socket.off("message:delivered", handleMessageDelivered);
        socket.off("message:seen", handleMessageSeen);
        socket.off("messages:status_update", handleStatusUpdate);
        socket.off("message:read", handleMessageRead);
        socket.off("message:deleted", handleMessageDeleted);
        socket.off("delivery:accepted", handleDeliveryAccepted);
        socket.off("order:completed", handleOrderCompleted);
        socket.off("message:updated", handleMessageUpdated);
        socket.off("delivery:submitted", handleDeliverySubmitted);
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

  // 🎙️ Send Voice Message
  const handleSendVoice = async (audioBlob, duration) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "voice_message.webm");
      formData.append("duration", duration.toString());
      
      await axios.post(`${backendURL}/api/messages/${orderId}/voice`, formData, {
        headers: { 
          Authorization: `Bearer ${user?.token}`,
          "Content-Type": "multipart/form-data"
        }
      });
      
      playPopSound();
      toast.success("Voice message sent!");
      setIsRecordingVoice(false);
    } catch (err) {
      toast.error("Failed to send voice message");
    } finally {
      setUploading(false);
    }
  };

  // 📁 Send Drive Link (Client Only)
  const handleSendDriveLink = async ({ url, title, description }) => {
    try {
      await axios.post(`${backendURL}/api/messages/${orderId}/drive-link`, {
        url,
        title,
        description
      }, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      
      playPopSound();
      toast.success("Raw footage link shared!");
      setShowDriveLinkModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to share link");
    }
  };

  // 🎬 Final Delivery Handlers
  
  // Preview watermarked delivery (Client)
  const handlePreviewDelivery = async (delivery) => {
    setCurrentDelivery(delivery);
    setDeliveryLoading(true);
    try {
      const { data } = await axios.get(`${backendURL}/api/delivery/${orderId}/preview`, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      setDeliveryPreviewData(data.preview);
      setShowWatermarkPreview(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load preview");
    } finally {
      setDeliveryLoading(false);
    }
  };

  // Request changes (Client)
  const handleRequestChanges = async (changesMessage) => {
    setDeliveryLoading(true);
    try {
      await axios.post(`${backendURL}/api/delivery/${orderId}/changes`, 
        { message: changesMessage }, 
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      toast.success("Changes requested successfully");
      setShowChangesRequest(false);
      setShowWatermarkPreview(false);
      // Refresh messages to show the auto-sent message
      fetchMessages();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to request changes");
    } finally {
      setDeliveryLoading(false);
    }
  };

  // Confirm and download (Client)
  const handleConfirmDownload = async (confirmText) => {
    if (!currentDelivery) return;
    setDeliveryLoading(true);
    try {
      const { data } = await axios.post(`${backendURL}/api/delivery/${orderId}/confirm`, 
        { 
          confirmText, 
          token: currentDelivery.downloadToken 
        }, 
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      
      // 🆕 Enhanced high-quality download using fetch + blob
      if (data.downloadUrl) {
        try {
          // Use the filename from response or fallback to original
          const fileName = data.fileName || currentDelivery.fileName || "final_delivery";
          
          // Fetch the file as blob for proper download
          const response = await fetch(data.downloadUrl);
          const blob = await response.blob();
          
          // Create download link with proper filename
          const blobUrl = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = blobUrl;
          link.download = fileName;
          link.style.display = "none";
          document.body.appendChild(link);
          link.click();
          
          // Cleanup
          setTimeout(() => {
            window.URL.revokeObjectURL(blobUrl);
            document.body.removeChild(link);
          }, 100);
        } catch (downloadErr) {
          // Fallback to direct link if blob fails
          console.log("Blob download failed, using direct link:", downloadErr);
          const link = document.createElement("a");
          link.href = data.downloadUrl;
          link.download = data.fileName || currentDelivery.fileName || "final_delivery";
          link.target = "_blank";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }
      
      toast.success("🎉 Order completed! Payment released to editor.");
      setShowDownloadConfirm(false);
      setShowWatermarkPreview(false);
      // Refresh to show completed state
      fetchMessages();
      // Refresh order to update status
      fetchOrder();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to download");
    } finally {
      setDeliveryLoading(false);
    }
  };

  // Upload final delivery (Editor)
  const handleUploadFinalDelivery = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      await axios.post(`${backendURL}/api/delivery/${orderId}/upload`, formData, {
        headers: { 
          Authorization: `Bearer ${user?.token}`,
          "Content-Type": "multipart/form-data"
        }
      });
      
      playPopSound();
      toast.success("🎬 Final delivery sent! Waiting for client review.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to upload final delivery");
    } finally {
      setUploading(false);
    }
  };

  // Ref for final delivery file input
  const finalDeliveryInputRef = useRef(null);

  // ✏️ Edit Message
  const handleEditMessage = async (content) => {
    if (!editingMessage) return;
    try {
      await axios.patch(`${backendURL}/api/messages/${editingMessage._id}/edit`, { content }, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      setMessages(prev => prev.map(m => 
        m._id === editingMessage._id ? { ...m, content, isEdited: true } : m
      ));
      toast.success("Message edited");
      setEditingMessage(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to edit");
    }
  };

  // ⭐ Toggle Star
  const handleToggleStar = async (msgId) => {
    try {
      const res = await axios.patch(`${backendURL}/api/messages/${msgId}/star`, {}, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      setMessages(prev => prev.map(m => 
        m._id === msgId ? { ...m, isStarred: res.data.starred, starredBy: res.data.starred ? [...(m.starredBy || []), user._id] : (m.starredBy || []).filter(id => id !== user._id) } : m
      ));
    } catch (err) {
      toast.error("Failed to star message");
    }
  };

  // 🔍 Search Messages
  const handleSearch = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await axios.get(`${backendURL}/api/messages/${orderId}/search?q=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      setSearchResults(res.data.messages || []);
    } catch (err) {
      console.error("Search error:", err);
    }
  };

  // ⚡ Load Quick Replies
  const loadQuickReplies = useCallback(async () => {
    try {
      const res = await axios.get(`${backendURL}/api/quick-replies`, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      setQuickReplies(res.data.replies || []);
    } catch (err) {
      console.error("Failed to load quick replies");
    }
  }, [backendURL, user?.token]);

  // 📋 Load Checklist
  const loadChecklist = useCallback(async () => {
    try {
      const res = await axios.get(`${backendURL}/api/checklists/${orderId}`, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      setChecklist(res.data.checklist?.items || []);
    } catch (err) {
      console.error("Failed to load checklist");
    }
  }, [backendURL, orderId, user?.token]);

  // Add Checklist Item
  const handleAddChecklistItem = async () => {
    if (!newChecklistItem.trim()) return;
    try {
      const res = await axios.post(`${backendURL}/api/checklists/${orderId}/item`, 
        { text: newChecklistItem.trim() },
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      setChecklist(res.data.checklist?.items || []);
      setNewChecklistItem("");
    } catch (err) {
      toast.error("Failed to add item");
    }
  };

  // Toggle Checklist Item
  const handleToggleChecklistItem = async (itemId) => {
    try {
      const res = await axios.patch(`${backendURL}/api/checklists/${orderId}/item/${itemId}`, {}, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      setChecklist(res.data.checklist?.items || []);
    } catch (err) {
      toast.error("Failed to update item");
    }
  };

  // Delete Checklist Item
  const handleDeleteChecklistItem = async (itemId) => {
    try {
      const res = await axios.delete(`${backendURL}/api/checklists/${orderId}/item/${itemId}`, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      setChecklist(res.data.checklist?.items || []);
    } catch (err) {
      toast.error("Failed to delete item");
    }
  };

  // Load quick replies and checklist on mount
  useEffect(() => {
    loadQuickReplies();
    loadChecklist();
  }, [loadQuickReplies, loadChecklist]);

  // Listen for socket events for edit/checklist
  useEffect(() => {
    if (!socket) return;
    
    const handleMessageEdited = ({ messageId, content, isEdited }) => {
      setMessages(prev => prev.map(m => 
        m._id === messageId ? { ...m, content, isEdited } : m
      ));
    };
    
    const handleChecklistUpdated = ({ checklist: items }) => {
      setChecklist(items || []);
    };
    
    socket.on("message:edited", handleMessageEdited);
    socket.on("checklist:updated", handleChecklistUpdated);
    
    return () => {
      socket.off("message:edited", handleMessageEdited);
      socket.off("checklist:updated", handleChecklistUpdated);
    };
  }, [socket]);

  if (loading) return <div className="min-h-screen bg-[#09090B] light:bg-[#FAFAFA] flex items-center justify-center text-white light:text-zinc-900">Loading...</div>;

  // Calculate deadline status for header
  const getDeadlineStatus = () => {
    if (!order?.deadline) return null;
    
    const now = new Date();
    const end = new Date(order.deadline);
    const start = new Date(order.createdAt);
    
    const totalDuration = end - start;
    const elapsed = now - start;
    const remaining = end - now;
    const percentUsed = (elapsed / totalDuration) * 100;
    
    const daysLeft = Math.ceil(remaining / (1000 * 60 * 60 * 24));
    
    let color = "bg-green-500/20 text-green-400 border-green-500/30";
    if (percentUsed >= 90 || daysLeft <= 1) {
      color = "bg-red-500/20 text-red-400 border-red-500/30";
    } else if (percentUsed >= 70 || daysLeft <= 2) {
      color = "bg-orange-500/20 text-orange-400 border-orange-500/30";
    } else if (percentUsed >= 50 || daysLeft <= 3) {
      color = "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    }
    
    if (daysLeft < 0) {
      return { text: "Overdue!", color: "bg-red-500/30 text-red-500 border-red-500/50", urgent: true };
    }
    
    return { 
      text: daysLeft === 0 ? "Due Today" : daysLeft === 1 ? "1 day left" : `${daysLeft} days left`,
      color,
      urgent: daysLeft <= 1
    };
  };

  const deadlineStatus = getDeadlineStatus();

  return (
    <div className="flex flex-col h-screen bg-[#09090B] light:bg-[#FAFAFA] text-white light:text-zinc-900 font-sans overflow-hidden">
      
      {/* 1. Fixed Header (Glassmorphism) - STICKY */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#09090B]/95 light:bg-white/95 backdrop-blur-md border-b border-white/10 light:border-zinc-200">
        <div className="flex items-center gap-4 px-4 py-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-white/10 light:hover:bg-zinc-100 transition">
            <FaArrowLeft className="text-white light:text-zinc-700 text-lg" />
          </button>

          {/* User Info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative">
              <div className="w-10 h-10 rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500">
                <img 
                  src={otherParty?.profilePicture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} 
                  alt="Profile"
                  className="w-full h-full rounded-full object-cover border-2 border-[#09090B] light:border-white"
                />
              </div>
              {isOnline && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#09090B] light:border-white"></div>}
            </div>
            <div className="flex flex-col justify-center">
              <span className="font-semibold text-sm truncate leading-tight light:text-zinc-900">{otherParty?.name || "Unknown User"}</span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-400 light:text-zinc-500 leading-tight">
                  {isOnline ? "Active now" : "Offline"}
                </span>
                {/* Deadline Badge */}
                {deadlineStatus && order?.status !== "completed" && (
                  <span className={`text-[9px] px-2 py-0.5 rounded border ${deadlineStatus.color} ${deadlineStatus.urgent ? 'animate-pulse' : ''}`}>
                    {deadlineStatus.text}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Feature Buttons */}
          <div className="flex items-center gap-1">
            {/* Media Gallery Toggle */}
            <button 
              onClick={() => setShowMediaGallery(true)}
              className="p-2 rounded-full transition hover:bg-white/10 light:hover:bg-zinc-100 text-gray-400 light:text-zinc-500"
              title="View all media"
            >
              <FaImage className="text-sm" />
            </button>
            
            {/* Search Toggle */}
            <button 
              onClick={() => setShowSearch(!showSearch)}
              className={`p-2 rounded-full transition ${showSearch ? 'bg-purple-500/30 text-purple-400' : 'hover:bg-white/10 light:hover:bg-zinc-100 text-gray-400 light:text-zinc-500'}`}
            >
              <FaSearch className="text-sm" />
            </button>
            
            {/* Checklist Toggle */}
            <button 
              onClick={() => setShowChecklist(!showChecklist)}
              className={`p-2 rounded-full transition ${showChecklist ? 'bg-purple-500/30 text-purple-400' : 'hover:bg-white/10 light:hover:bg-zinc-100 text-gray-400 light:text-zinc-500'}`}
            >
              <FaList className="text-sm" />
            </button>
          </div>
        </div>

        {/* Search Bar (Expandable) */}
        <AnimatePresence>
          {showSearch && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 pb-3 overflow-hidden"
            >
              <div className="flex items-center gap-2 bg-zinc-800/50 light:bg-zinc-100 rounded-xl px-3 py-2">
                <FaSearch className="text-gray-500" />
                <input
                  type="text"
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    handleSearch(e.target.value);
                  }}
                  className="flex-1 bg-transparent text-white light:text-zinc-900 text-sm focus:outline-none placeholder-gray-500 light:placeholder-zinc-400"
                />
                {searchQuery && (
                  <button onClick={() => { setSearchQuery(""); setSearchResults([]); }}>
                    <FaTimes className="text-gray-500 text-xs" />
                  </button>
                )}
              </div>
              
              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                  {searchResults.map((msg) => (
                    <button
                      key={msg._id}
                      onClick={() => {
                        const el = document.getElementById(`msg-${msg._id}`);
                        if (el) {
                          el.scrollIntoView({ behavior: "smooth", block: "center" });
                          el.classList.add("ring-2", "ring-purple-500");
                          setTimeout(() => el.classList.remove("ring-2", "ring-purple-500"), 2000);
                        }
                        setShowSearch(false);
                        setSearchQuery("");
                        setSearchResults([]);
                      }}
                      className="w-full text-left px-3 py-2 bg-white/5 rounded-lg hover:bg-white/10 transition"
                    >
                      <p className="text-xs text-gray-400">{msg.sender?.name}</p>
                      <p className="text-sm text-white truncate">{msg.content}</p>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Integrated Project Details - Tab Interface */}
        <ChatInfoTabs 
          order={{ ...order, currentUserId: user?._id }} 
          messages={messages} 
          userRole={user?.role} 
          orderId={orderId} 
        />
      </header>


      {/* 2. Messages Area (Textured Background) - with padding for fixed header/footer */}
      <div 
        className="flex-1 overflow-y-auto overflow-x-hidden p-4 pt-40 pb-32 space-y-2 relative scroll-smooth"
        style={{
          backgroundImage: `url(${chattexture})`,
          backgroundSize: "cover", // Or "300px" based on texture type
          backgroundRepeat: "repeat",
          backgroundAttachment: "fixed" 
        }}
      >
        {/* Dark overlay for readability */}
        <div className="fixed inset-0 bg-black/70 light:bg-white/70 pointer-events-none z-0" />

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
                className={`flex w-full ${msg.type === "payment_request" ? "justify-center" : isMe ? "justify-end" : "justify-start"} group mb-1 transition-all duration-300`}
              >
                {/* Special: Payment Request Card - Full Width Centered */}
                {msg.type === "payment_request" ? (
                  <PaymentRequestCard 
                    message={msg} 
                    order={order} 
                    onPaymentSuccess={() => {
                      // Refresh order data after successful payment
                      window.location.reload();
                    }}
                  />
                ) : (
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
                    className={`relative px-4 py-2 overflow-hidden ${
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
                            <div className="bg-black/20 rounded-xl p-3 mb-1 max-w-[260px]">
                              <div className="flex items-center gap-3">
                                <div className="p-3 bg-purple-500/20 rounded-xl shrink-0">
                                  <FaFileAlt className="text-purple-400 text-lg" />
                                </div>
                                <div className="flex-1 min-w-0 overflow-hidden">
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

                        {/* 🏷️ System/Platform Message Card */}
                        {msg.type === "system" && (
                          <SystemMessageCard message={msg} userRole={user?.role} />
                        )}

                        {/* 🎙️ Voice Message Player */}
                        {msg.type === "audio" && msg.mediaUrl && (
                          <VoicePlayer audioUrl={msg.mediaUrl} duration={msg.audioDuration} />
                        )}

                        {/* 📁 Drive Link Card */}
                        {msg.type === "drive_link" && msg.externalLink && (
                          <DriveLinkCard link={msg.externalLink} onLinkClick={handleDriveLinkClick} />
                        )}

                        {/* 🎬 Final Delivery Card */}
                        {msg.type === "final_delivery" && msg.finalDelivery && (
                          <FinalDeliveryCard
                            delivery={msg.finalDelivery}
                            isClient={user?.role === "client"}
                            onPreview={() => handlePreviewDelivery(msg.finalDelivery)}
                            onAccept={() => {
                              setCurrentDelivery(msg.finalDelivery);
                              setShowDownloadConfirm(true);
                            }}
                            onRequestChanges={() => {
                              setCurrentDelivery(msg.finalDelivery);
                              setShowChangesRequest(true);
                            }}
                          />
                        )}

                        {/* Text Content */}
                        {msg.content && msg.type === "text" && (
                          <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words emoji-font">{msg.content}</p>
                        )}
                        
                        {/* Edited Indicator */}
                        {msg.isEdited && (
                          <span className="text-[10px] text-gray-400 italic">edited</span>
                        )}
                        
                        {/* Star Indicator */}
                        {msg.starredBy?.includes(user?._id) && (
                          <div className="absolute top-1 right-1">
                            <FaStar className="text-yellow-400 text-xs" />
                          </div>
                        )}
                        
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
                    <div className={`absolute top-1/2 -translate-y-1/2 ${isMe ? "-left-24" : "-right-24"} opacity-0 group-hover:opacity-100 transition-opacity flex gap-1`}>
                        {/* Star */}
                        <button 
                          onClick={() => handleToggleStar(msg._id)} 
                          className={`p-1.5 rounded-full transition ${msg.starredBy?.includes(user?._id) ? 'bg-yellow-500/30 text-yellow-400' : 'bg-white/10 hover:bg-white/20 text-gray-300'}`}
                        >
                          {msg.starredBy?.includes(user?._id) ? <FaStar className="text-xs" /> : <FaRegStar className="text-xs" />}
                        </button>
                        
                        {/* Reply */}
                        <button onClick={() => setReplyingTo(msg)} className="p-1.5 bg-white/10 rounded-full hover:bg-white/20 text-gray-300">
                            <FaReply className="text-xs" />
                        </button>
                        
                        {/* Edit (only for own text messages within 5 mins) */}
                        {isMe && msg.type === "text" && (Date.now() - new Date(msg.createdAt).getTime() < 5 * 60 * 1000) && (
                          <button onClick={() => setEditingMessage(msg)} className="p-1.5 bg-blue-500/20 rounded-full hover:bg-blue-500/40 text-blue-400">
                              <FaEdit className="text-xs" />
                          </button>
                        )}
                        
                        {/* Delete - 🆕 Hidden for completed/cancelled/disputed orders */}
                        {isMe && !["completed", "cancelled", "disputed"].includes(order?.status) && (
                          <button onClick={() => handleDeleteMessage(msg._id)} className="p-1.5 bg-red-500/20 rounded-full hover:bg-red-500/40 text-red-400">
                              <FaTrash className="text-xs" />
                          </button>
                        )}
                    </div>
                  )}

                  </div>
                </motion.div>
                )}
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

          {/* 🧾 Completed Order Receipt */}
          {order?.status === "completed" && (
            <CompletedOrderReceipt order={order} />
          )}

          <div ref={messagesEndRef} className="h-1" />
        </div>
      </div>



      {/* 3. Input Area (Fixed Bottom) - OR Disabled state for completed/awaiting_payment orders */}
      {order?.status === "completed" ? (
        /* Completed Order - Disabled Chat Footer */
        <footer className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-md px-4 py-4 pb-6 z-50 border-t border-white/10" style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}>
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/20 rounded-2xl p-4">
              <div className="flex items-center justify-center gap-2 text-emerald-400 mb-1">
                <FaCheckDouble className="text-sm" />
                <span className="font-semibold">Order Completed</span>
              </div>
              <p className="text-gray-400 text-sm">This chat is now closed. No further messages can be sent.</p>
            </div>
          </div>
        </footer>
      ) : order?.status === "awaiting_payment" ? (
        /* Awaiting Payment - Locked Chat Footer */
        <footer className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-md px-4 py-4 pb-6 z-50 border-t border-orange-500/30" style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}>
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/30 rounded-2xl p-4">
              <div className="flex items-center justify-center gap-2 text-orange-400 mb-1">
                <FaLock className="text-sm" />
                <span className="font-semibold">Chat Locked</span>
              </div>
              <p className="text-zinc-400 text-sm">
                {user?.role === "client" 
                  ? "Complete payment above to unlock chat and start the project." 
                  : "Waiting for client to complete payment. Chat will unlock after payment."}
              </p>
            </div>
          </div>
        </footer>
      ) : order?.status === "new" && order?.type === "request" ? (
        /* New Request Order - Waiting for Editor Response */
        <footer className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-md px-4 py-4 pb-6 z-50 border-t border-amber-500/30" style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}>
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/30 rounded-2xl p-4">
              <div className="flex items-center justify-center gap-2 text-amber-400 mb-1">
                <FaLock className="text-sm" />
                <span className="font-semibold">Awaiting Response</span>
              </div>
              <p className="text-zinc-400 text-sm">
                {user?.role === "client" 
                  ? "Waiting for editor to accept your request. Chat will unlock once they accept." 
                  : "Accept or reject this request to proceed."}
              </p>
            </div>
          </div>
        </footer>
      ) : (
        /* Normal Chat Footer */
        <footer className="fixed bottom-0 left-0 right-0 bg-[#09090B]/95 light:bg-white/95 backdrop-blur-md px-4 py-3 pb-6 z-50 border-t border-white/10 light:border-zinc-200" style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}>
         {/* Reply Preview Context */}
         <AnimatePresence>
            {replyingTo && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="flex items-center justify-between bg-zinc-800 light:bg-zinc-100 border-l-4 border-purple-500 p-3 rounded-t-xl mb-2"
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
                    className="p-3 text-white light:text-zinc-700 bg-zinc-800 light:bg-zinc-100 rounded-full hover:bg-zinc-700 light:hover:bg-zinc-200 transition"
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
                            className="absolute bottom-14 left-0 bg-zinc-800 light:bg-white border border-white/10 light:border-zinc-200 rounded-xl shadow-2xl p-2 w-40 flex flex-col gap-1 z-[60]"
                        >
                             <button onClick={() => imageInputRef.current.click()} className="flex items-center gap-3 p-2 hover:bg-white/10 light:hover:bg-zinc-100 rounded-lg text-sm"><FaCamera className="text-pink-500" /> Photo</button>
                             <button onClick={() => videoInputRef.current.click()} className="flex items-center gap-3 p-2 hover:bg-white/10 light:hover:bg-zinc-100 rounded-lg text-sm"><FaVideo className="text-blue-500" /> Video</button>
                             <button onClick={() => docInputRef.current.click()} className="flex items-center gap-3 p-2 hover:bg-white/10 light:hover:bg-zinc-100 rounded-lg text-sm"><FaFileAlt className="text-yellow-500" /> Document</button>
                             
                             {/* Share Raw Footage - Client Only */}
                             {user?.role === "client" && (
                               <button 
                                 onClick={() => { setShowDriveLinkModal(true); setShowMediaMenu(false); }} 
                                 className="flex items-center gap-3 p-2 hover:bg-white/10 rounded-lg text-sm border-t border-white/10 mt-1 pt-2"
                               >
                                 <FaFolder className="text-green-500" /> Share Footage
                               </button>
                             )}
                             
                             {/* Send Final Output - Editor Only */}
                             {user?.role === "editor" && (
                               <button 
                                 onClick={() => { finalDeliveryInputRef.current?.click(); setShowMediaMenu(false); }} 
                                 className="flex items-center gap-3 p-2 hover:bg-white/10 rounded-lg text-sm border-t border-white/10 mt-1 pt-2 text-yellow-400"
                               >
                                 <FaFilm className="text-yellow-500" /> Send Final Output
                               </button>
                             )}
                         </motion.div>
                     )}
                 </AnimatePresence>
             </div>

             {/* Quick Replies Button */}
             <button 
               onClick={() => { setShowQuickReplies(!showQuickReplies); loadQuickReplies(); }}
               className={`p-3 rounded-full transition ${showQuickReplies ? 'bg-purple-500/30 text-purple-400' : 'hover:bg-white/10 text-gray-400'}`}
             >
               <FaBolt className="text-lg" />
             </button>
             
             {/* Voice Message Button */}
             <button 
               onClick={() => setIsRecordingVoice(true)}
               className="p-3 rounded-full hover:bg-white/10 text-gray-400 transition"
             >
               <FaMicrophone className="text-lg" />
             </button>
             
             {/* Quick Replies Popup */}
             <AnimatePresence>
               {showQuickReplies && (
                 <QuickRepliesMenu 
                   replies={quickReplies}
                   onSelect={(reply) => {
                     setNewMessage(reply.content);
                     setShowQuickReplies(false);
                   }}
                   onClose={() => setShowQuickReplies(false)}
                 />
               )}
             </AnimatePresence>
             
             {/* Text Input or Voice Recorder */}
             {isRecordingVoice ? (
               <div className="flex-1">
                 <VoiceRecorder 
                   onSend={handleSendVoice} 
                   onCancel={() => setIsRecordingVoice(false)} 
                 />
               </div>
             ) : (
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
             )}

             {/* Send Button */}
             <button 
                onClick={handleSendMessage}
                disabled={(!newMessage.trim() && !uploading) || isRecordingVoice}
                className={`p-3 rounded-full transition-all duration-200 transform hover:scale-105 ${
                    newMessage.trim() && !isRecordingVoice ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/30" : "bg-[#262626] text-gray-500"
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
      )}

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
      
      {/* Edit Message Modal */}
      <AnimatePresence>
        {editingMessage && (
          <EditMessageModal 
            message={editingMessage}
            onSave={handleEditMessage}
            onClose={() => setEditingMessage(null)}
          />
        )}
      </AnimatePresence>

      {/* � Add Drive Link Modal (Client Only) */}
      <AnimatePresence>
        {showDriveLinkModal && (
          <AddDriveLinkModal 
            onSubmit={handleSendDriveLink}
            onClose={() => setShowDriveLinkModal(false)}
          />
        )}
      </AnimatePresence>

      {/* 🎬 Final Delivery Modals */}
      <WatermarkPreviewModal
        isOpen={showWatermarkPreview}
        onClose={() => setShowWatermarkPreview(false)}
        preview={deliveryPreviewData}
        onAccept={() => {
          setShowWatermarkPreview(false);
          setShowDownloadConfirm(true);
        }}
        onRequestChanges={() => {
          setShowWatermarkPreview(false);
          setShowChangesRequest(true);
        }}
      />

      <DownloadConfirmPopup
        isOpen={showDownloadConfirm}
        onClose={() => setShowDownloadConfirm(false)}
        onConfirm={handleConfirmDownload}
        editorEarning={order?.editorEarning}
        loading={deliveryLoading}
        orderId={order?._id}
        editorName={order?.editor?.name || "the editor"}
      />

      <ChangesRequestModal
        isOpen={showChangesRequest}
        onClose={() => setShowChangesRequest(false)}
        onSubmit={handleRequestChanges}
        loading={deliveryLoading}
      />

      {/* Hidden file input for final delivery upload (Editor) */}
      <input
        type="file"
        ref={finalDeliveryInputRef}
        onChange={(e) => {
          if (e.target.files?.[0]) {
            handleUploadFinalDelivery(e.target.files[0]);
            e.target.value = "";
          }
        }}
        accept="video/*,image/*"
        className="hidden"
      />

      {/* �📋 Checklist Panel (Sliding) */}
      <AnimatePresence>
        {showChecklist && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25 }}
            className="fixed top-0 right-0 w-full max-w-sm h-full bg-[#0d0d0d] border-l border-white/10 z-[90] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FaList className="text-purple-400" /> Project Checklist
              </h3>
              <button onClick={() => setShowChecklist(false)} className="p-2 hover:bg-white/10 rounded-full">
                <FaTimes className="text-gray-400" />
              </button>
            </div>
            
            {/* Add Item */}
            <div className="p-4 border-b border-white/10">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newChecklistItem}
                  onChange={(e) => setNewChecklistItem(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddChecklistItem()}
                  placeholder="Add a task..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                />
                <button 
                  onClick={handleAddChecklistItem}
                  className="px-4 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition"
                >
                  Add
                </button>
              </div>
            </div>
            
            {/* Checklist Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {checklist.length === 0 ? (
                <div className="text-center py-8">
                  <FaList className="text-gray-600 text-4xl mx-auto mb-3" />
                  <p className="text-gray-500">No tasks yet</p>
                  <p className="text-gray-600 text-sm">Add tasks to track project progress</p>
                </div>
              ) : (
                checklist.map((item) => (
                  <div 
                    key={item._id}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition ${
                      item.completed ? 'bg-green-500/10 border-green-500/30' : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <button 
                      onClick={() => handleToggleChecklistItem(item._id)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition ${
                        item.completed ? 'bg-green-500 border-green-500' : 'border-gray-500'
                      }`}
                    >
                      {item.completed && <FaCheck className="text-white text-xs" />}
                    </button>
                    <span className={`flex-1 text-sm ${item.completed ? 'text-gray-400 line-through' : 'text-white'}`}>
                      {item.text}
                    </span>
                    <button 
                      onClick={() => handleDeleteChecklistItem(item._id)}
                      className="p-1 hover:bg-red-500/20 rounded text-red-400"
                    >
                      <FaTimes className="text-xs" />
                    </button>
                  </div>
                ))
              )}
            </div>
            
            {/* Progress */}
            {checklist.length > 0 && (
              <div className="p-4 border-t border-white/10">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-400">Progress</span>
                  <span className="text-white font-bold">
                    {checklist.filter(i => i.completed).length}/{checklist.length}
                  </span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-green-500 transition-all"
                    style={{ width: `${(checklist.filter(i => i.completed).length / checklist.length) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Media Gallery Modal */}
      <AnimatePresence>
        {showMediaGallery && (
          <ChatMediaGallery
            orderId={orderId}
            orderStatus={order?.status}
            onClose={() => setShowMediaGallery(false)}
            onMediaDeleted={(msgId) => {
              // Update local messages to show as deleted
              setMessages(prev => prev.map(m => 
                m._id === msgId ? { ...m, isDeleted: true, content: "This message was deleted" } : m
              ));
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatPage;
