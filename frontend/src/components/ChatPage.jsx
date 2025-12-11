// ChatBoxPage.jsx
import React, { useState, useRef, useEffect } from "react";
import {
  FaArrowLeft,
  FaPaperPlane,
  FaPaperclip,
  FaFileVideo,
  FaChevronDown,
  FaCheck,
  FaCheckDouble,
  FaMicrophone,
  FaStop,
  FaSmile,
  FaMoneyBill,
  FaPercentage,
  FaWallet,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import chattexture from "../assets/chattexture.png";

const ChatBoxPage = () => {
  const navigate = useNavigate();
  const { chatId } = useParams();
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [typing, setTyping] = useState(false);

  // Dummy Chat User
  const chatUser = {
    name: "John Smith",
    role: "Client",
    avatar: "https://randomuser.me/api/portraits/men/75.jpg",
    online: true,
  };

  // Dummy Project Details
  const projectDetails = {
    orderName: "Wedding Teaser – Order #1023",
    chatId: chatId,
    client: "John Smith",
    editor: "Aadhya Editing Studio",
  };

  // Payment stages
  const paymentStage = 2;
  const paymentStages = [
    "Client paid – money in escrow",
    "Escrow verified",
    "Editor payment released",
  ];

  // Work stages
  const workStage = 1;
  const workStages = [
    "Order Accepted",
    "In Progress",
    "Draft Submitted",
    "Completed",
  ];

  // Dummy messages
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "client",
      text: "Hello! I uploaded the raw footage. Please check.",
      time: "2:44 PM",
      delivered: true,
      seen: false,
      reactions: {},
    },
    {
      id: 2,
      sender: "editor",
      text: "Sure! Checking the files now.",
      time: "2:45 PM",
      delivered: true,
      seen: true,
      reactions: {},
    },
    {
      id: 3,
      sender: "client",
      file: {
        type: "video",
        name: "raw_footage.mp4",
        size: "120MB",
        url: null,
      },
      time: "2:47 PM",
      delivered: true,
      seen: false,
      reactions: {},
    },
  ]);

  const [newMessage, setNewMessage] = useState("");

  // Auto scroll
  useEffect(() => {
    scrollToBottom({ behavior: "smooth" });

    const unseenEditorIds = messages
      .filter((m) => m.sender === "editor" && !m.seen)
      .map((m) => m.id);

    if (unseenEditorIds.length > 0) {
      const t = setTimeout(() => {
        setMessages((prev) =>
          prev.map((m) =>
            unseenEditorIds.includes(m.id) ? { ...m, seen: true } : m
          )
        );
      }, 900);
      return () => clearTimeout(t);
    }
  }, [messages]);

  const scrollToBottom = ({ behavior = "auto" } = {}) => {
    messagesEndRef.current?.scrollIntoView({ behavior, block: "end" });
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: "editor",
        text: newMessage,
        time: "Now",
        delivered: true,
        seen: false,
        reactions: {},
      },
    ]);

    setNewMessage("");
    setTyping(false);

    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m, i) =>
          i === prev.length - 1 ? { ...m, delivered: true, seen: false } : m
        )
      );
    }, 200);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (!file) return;

    const fileObj = {
      type: file.type.includes("video")
        ? "video"
        : file.type.includes("audio")
        ? "audio"
        : "file",
      name: file.name,
      size: `${Math.round(file.size / 1024 / 1024)}MB`,
      url: URL.createObjectURL(file),
    };

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: "editor",
        file: fileObj,
        time: "Now",
        delivered: true,
        seen: false,
        reactions: {},
      },
    ]);

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleReaction = (messageId, emoji = "❤️") => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m;
        const reactions = { ...(m.reactions || {}) };
        reactions[emoji] = (reactions[emoji] || 0) + 1;
        return { ...m, reactions };
      })
    );
  };

  const lastTapRef = useRef(0);
  const handleBubbleTap = (msg) => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      handleReaction(msg.id, "❤️");
    }
    lastTapRef.current = now;
  };

  useEffect(() => {
    return () => {
      if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      setMediaRecorder(mr);
      setAudioChunks([]);

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) {
          setAudioChunks((prev) => [...prev, e.data]);
        }
      };

      mr.onstop = () => {
        const blob = new Blob(audioChunks, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);

        const fileObj = {
          type: "audio",
          name: `voice_${Date.now()}.webm`,
          size: `${Math.round(blob.size / 1024 / 1024)}MB`,
          url,
          blob,
        };

        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            sender: "editor",
            file: fileObj,
            time: "Now",
            delivered: true,
            seen: false,
            reactions: {},
          },
        ]);

        setRecording(false);
      };

      mr.start();
      setRecording(true);
    } catch (err) {
      console.error("Mic denied", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }
  };

  useEffect(() => {
    const unseen = messages.some((m) => m.sender === "client" && !m.seen);
    if (unseen) {
      const t = setTimeout(() => {
        setMessages((prev) =>
          prev.map((m) => (m.sender === "client" ? { ...m, seen: true } : m))
        );
      }, 900);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setTyping(false);
    }, 3000);
    return () => clearTimeout(t);
  }, [typing]);

  const renderReactions = (reactions) => {
    if (!reactions || Object.keys(reactions).length === 0) return null;
    return (
      <div className="flex gap-1 items-center mt-2">
        {Object.entries(reactions)
          .slice(0, 3)
          .map(([emoji, count]) => (
            <div
              key={emoji}
              className="px-2 py-0.5 bg-white/10 text-xs rounded-xl flex items-center gap-1"
            >
              <span>{emoji}</span>
              <span className="text-[11px] text-gray-300">{count}</span>
            </div>
          ))}
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 text-white flex flex-col"
      style={{
        backgroundImage: `url(${chattexture})`,
        backgroundSize: "200px 200px",
        backgroundRepeat: "repeat",
      }}
    >
      {/* ---------------- HEADER ---------------- */}
      <div className="flex items-center gap-4 px-5 py-4 bg-[#0e0f11]/90 backdrop-blur-xl border-b border-white/10">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition"
        >
          <FaArrowLeft />
        </button>

        <div className="relative">
          <img src={chatUser.avatar} className="w-12 h-12 rounded-xl object-cover" />
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#0e0f11] ${
              chatUser.online ? "bg-green-400 animate-pulse" : "bg-gray-600"
            }`}
          />
        </div>

        <div className="flex flex-col">
          <span className="font-semibold text-lg">{chatUser.name}</span>
          <span className="text-xs text-gray-400">{chatUser.role}</span>
        </div>

        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="ml-auto flex items-center gap-1 text-gray-300 hover:text-white"
        >
          <span className="text-sm">Status</span>
          <FaChevronDown className={`transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* ---------------- DROPDOWN ---------------- */}
      <AnimatePresence>
        {dropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="bg-[#111315]/95 backdrop-blur-xl border-b border-white/10 px-5 py-4 space-y-6"
          >
            {/* Project Info */}
            <div>
              <p className="text-sm font-semibold text-white">Project Details</p>
              <div className="text-xs text-gray-300 space-y-1 mt-2">
                <p>Order Name: {projectDetails.orderName}</p>
                <p>Client: {projectDetails.client}</p>
                <p>Editor: {projectDetails.editor}</p>
                <p>Chat ID: {projectDetails.chatId}</p>
              </div>
            </div>

            {/* Status Sections Left + Payment Receipt Right */}
            <div className="flex gap-6">

              {/* LEFT SIDE — PAYMENT + WORK STATUS */}
              <div className="flex-1 space-y-6">
                {/* Payment Status */}
                <div>
                  <p className="text-sm font-semibold mb-2">Payment Status</p>
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      {paymentStages.map((_, i) => (
                        <div key={i} className="flex flex-col items-center">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              i <= paymentStage ? "bg-emerald-400" : "bg-gray-700"
                            }`}
                          ></div>
                          {i < paymentStages.length - 1 && (
                            <div
                              className={`w-1 h-6 ${
                                i < paymentStage ? "bg-emerald-400" : "bg-gray-700"
                              }`}
                            ></div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-col text-xs text-gray-300 gap-4">
                      {paymentStages.map((t, i) => (
                        <p
                          key={i}
                          className={`${
                            i <= paymentStage ? "text-emerald-400" : "text-gray-500"
                          }`}
                        >
                          {t}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Work Status */}
                <div>
                  <p className="text-sm font-semibold mb-2">Project Workflow</p>
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      {workStages.map((_, i) => (
                        <div key={i} className="flex flex-col items-center">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              i <= workStage ? "bg-blue-400" : "bg-gray-700"
                            }`}
                          ></div>
                          {i < workStages.length - 1 && (
                            <div
                              className={`w-1 h-6 ${
                                i < workStage ? "bg-blue-400" : "bg-gray-700"
                              }`}
                            ></div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-col text-xs text-gray-300 gap-4">
                      {workStages.map((t, i) => (
                        <p
                          key={i}
                          className={`${
                            i <= workStage ? "text-blue-400" : "text-gray-500"
                          }`}
                        >
                          {t}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT SIDE — PAYMENT RECEIPT */}
              <div className="flex-1 bg-[#141618] p-5 rounded-xl border border-white/10 shadow-lg">
                <p className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <FaWallet className="text-green-400" /> Payment Breakdown
                </p>

                <div className="space-y-3">
                  {/* Amount Paid */}
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-white text-sm flex items-center gap-2">
                      <FaMoneyBill className="text-green-400" /> Amount Paid
                    </span>
                    <span className="text-green-400 font-bold text-lg">₹600</span>
                  </div>

                  {/* Platform Fee */}
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-orange-300 text-sm flex items-center gap-2">
                      <FaPercentage className="text-orange-400" /> Platform Fee (10%)
                    </span>
                    <span className="text-orange-400 font-bold text-md">-₹60</span>
                  </div>

                  <div className="border-t border-white/10 my-2"></div>

                  {/* Final Received */}
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-green-300 text-sm flex items-center gap-2">
                      <FaWallet className="text-green-500" /> Amount to Editor
                    </span>
                    <span className="text-green-500 font-extrabold text-2xl">₹540</span>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------------- CHAT AREA ---------------- */}
      <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isSender = msg.sender === "editor";

          return (
            <div key={msg.id} className={`flex ${isSender ? "justify-end" : "justify-start"}`}>
              <motion.div
                onDoubleClick={() => handleReaction(msg.id, "❤️")}
                onClick={() => handleBubbleTap(msg)}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`max-w-[70%] p-3 rounded-2xl text-sm shadow-lg break-words ${
                  isSender
                    ? "bg-[#1D4ED8] text-white rounded-br-none"
                    : "bg-[#111315] text-gray-200 rounded-bl-none border border-white/10"
                }`}
              >
                {msg.file ? (
                  <>
                    {msg.file.type === "video" && (
                      <div className="flex items-center gap-3">
                        <div className="w-28 h-16 rounded-lg overflow-hidden bg-black/40 flex items-center justify-center">
                          {msg.file.url ? (
                            <video src={msg.file.url} className="w-full h-full object-cover" muted />
                          ) : (
                            <FaFileVideo className="text-2xl text-blue-300" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{msg.file.name}</p>
                          <p className="text-xs text-gray-400">{msg.file.size}</p>
                        </div>
                      </div>
                    )}

                    {msg.file.type === "audio" && (
                      <div className="flex items-center gap-3">
                        <audio controls src={msg.file.url} />
                        <div>
                          <p className="font-medium">{msg.file.name}</p>
                          <p className="text-xs text-gray-400">{msg.file.size}</p>
                        </div>
                      </div>
                    )}

                    {msg.file.type === "file" && (
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center text-gray-300">
                          📎
                        </div>
                        <div>
                          <p className="font-medium">{msg.file.name}</p>
                          <p className="text-xs text-gray-400">{msg.file.size}</p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p>{msg.text}</p>
                )}

                {renderReactions(msg.reactions)}

                <div className="flex items-center justify-end gap-1 mt-1 text-[10px] opacity-70">
                  <span>{msg.time}</span>
                  {isSender ? (
                    msg.seen ? (
                      <FaCheckDouble className="text-blue-300" />
                    ) : (
                      <FaCheck className="text-gray-300" />
                    )
                  ) : msg.delivered ? (
                    <FaCheck className="text-gray-300" />
                  ) : null}
                </div>
              </motion.div>
            </div>
          );
        })}

        <AnimatePresence>
          {typing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.95 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-3"
            >
              <div className="w-10 h-10 bg-white/5 rounded-xl" />
              <div className="bg-[#111315] px-3 py-2 rounded-2xl text-sm text-gray-300">
                <div className="flex gap-1 items-center">
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" />
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse delay-150" />
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse delay-300" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* ---------------- INPUT BAR ---------------- */}
      <div className="p-4 bg-[#0E0F11]/95 border-t border-white/10 flex items-center gap-3">
        <button
          onClick={() => fileInputRef.current.click()}
          className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition"
        >
          <FaPaperclip />
        </button>

        <input type="file" hidden ref={fileInputRef} onChange={handleFileUpload} />

        <input
          className="flex-1 bg-[#111315] border border-white/10 rounded-2xl px-4 py-2 text-sm focus:ring-2 focus:ring-white/10 outline-none"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value);
            setTyping(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
        />

        {/* Voice Message */}
        <div className="relative">
          {!recording ? (
            <button
              onMouseDown={startRecording}
              onTouchStart={startRecording}
              className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition"
            >
              <FaMicrophone />
            </button>
          ) : (
            <button
              onMouseUp={stopRecording}
              onTouchEnd={stopRecording}
              className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center hover:scale-110 transition"
            >
              <FaStop />
            </button>
          )}
        </div>

        <button
          onClick={sendMessage}
          className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition"
        >
          <FaPaperPlane className="text-white text-sm" />
        </button>
      </div>
    </div>
  );
};

export default ChatBoxPage;
