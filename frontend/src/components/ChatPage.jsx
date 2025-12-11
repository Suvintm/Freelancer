import React, { useState, useRef } from "react";
import {
  FaArrowLeft,
  FaPaperPlane,
  FaPaperclip,
  FaFileVideo,
  FaChevronDown,
  FaCheck,
  FaCheckDouble,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";

const ChatBoxPage = () => {
  const navigate = useNavigate();
  const { chatId } = useParams();
  const fileInputRef = useRef(null);

  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Dummy Chat User
  const chatUser = {
    name: "John Smith",
    role: "Client",
    avatar: "https://randomuser.me/api/portraits/men/75.jpg",
  };

  // Dummy Project Details
  const projectDetails = {
    orderName: "Wedding Teaser – Order #1023",
    chatId: chatId,
    client: "John Smith",
    editor: "Aadhya Editing Studio",
  };

  // Vertical payment progress (0–3)
  const paymentStage = 2; 
  const paymentStages = [
    "Client paid – money in escrow",
    "Escrow verified",
    "Editor payment released",
  ];

  // Project workflow progress (0–3)
  const workStage = 1;
  const workStages = [
    "Order Accepted",
    "In Progress",
    "Draft Submitted",
    "Completed",
  ];

  // Dummy Messages
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "client",
      text: "Hello! I uploaded the raw footage. Please check.",
      time: "2:44 PM",
      delivered: true,
    },
    {
      id: 2,
      sender: "editor",
      text: "Sure! Checking the files now.",
      time: "2:45 PM",
      delivered: true,
      seen: true,
    },
    {
      id: 3,
      sender: "client",
      file: {
        type: "video",
        name: "raw_footage.mp4",
        size: "120MB",
      },
      time: "2:47 PM",
      delivered: true,
    },
  ]);

  const [newMessage, setNewMessage] = useState("");

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
      },
    ]);

    setNewMessage("");
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: "editor",
        file: {
          type: file.type.includes("video") ? "video" : "file",
          name: file.name,
          size: `${Math.round(file.size / 1024 / 1024)}MB`,
        },
        time: "Now",
        delivered: true,
      },
    ]);
  };

  return (
    <div
      className="fixed inset-0 text-white flex flex-col"
      style={{
        backgroundImage: "url('/assets/chattexture.png')", // your doodle texture
        backgroundSize: "cover",
        backgroundRepeat: "repeat",
        backgroundColor: "#0B0B0D",
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

        <img
          src={chatUser.avatar}
          className="w-12 h-12 rounded-xl object-cover"
        />

        <div className="flex flex-col">
          <span className="font-semibold text-lg">{chatUser.name}</span>
          <span className="text-xs text-gray-400">{chatUser.role}</span>
        </div>

        {/* Dropdown toggle */}
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="ml-auto flex items-center gap-1 text-gray-300 hover:text-white"
        >
          <span className="text-sm">Status</span>
          <FaChevronDown
            className={`transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {/* ---------------- DROPDOWN MENU ---------------- */}
      <AnimatePresence>
        {dropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="bg-[#111315]/95 backdrop-blur-xl border-b border-white/10 px-5 py-4 space-y-5"
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

            {/* Payment Progress */}
            <div>
              <p className="text-sm font-semibold mb-2">Payment Status</p>
              <div className="flex gap-4">
                {/* Vertical Line */}
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

                {/* Text */}
                <div className="flex flex-col text-xs text-gray-300 gap-4">
                  {paymentStages.map((t, i) => (
                    <p
                      key={i}
                      className={`${i <= paymentStage ? "text-emerald-400" : "text-gray-500"}`}
                    >
                      {t}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            {/* Work Progress */}
            <div>
              <p className="text-sm font-semibold mb-2">Project Workflow</p>
              <div className="flex gap-4">
                {/* Vertical Line */}
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

                {/* Text */}
                <div className="flex flex-col text-xs text-gray-300 gap-4">
                  {workStages.map((t, i) => (
                    <p
                      key={i}
                      className={`${i <= workStage ? "text-blue-400" : "text-gray-500"}`}
                    >
                      {t}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------------- CHAT MESSAGES ---------------- */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isSender = msg.sender === "editor";

          return (
            <div
              key={msg.id}
              className={`flex ${isSender ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[70%] p-3 rounded-2xl text-sm shadow-lg ${
                  isSender
                    ? "bg-[#1D4ED8] text-white rounded-br-none"
                    : "bg-[#111315] text-gray-200 rounded-bl-none border border-white/10"
                }`}
              >
                {msg.file ? (
                  <div className="flex items-center gap-3">
                    <FaFileVideo className="text-xl text-blue-300" />
                    <div>
                      <p className="font-medium">{msg.file.name}</p>
                      <p className="text-xs text-gray-400">{msg.file.size}</p>
                    </div>
                  </div>
                ) : (
                  <p>{msg.text}</p>
                )}

                <div className="flex items-center justify-end gap-1 mt-1 text-[10px] opacity-70">
                  <span>{msg.time}</span>
                  {isSender &&
                    (msg.seen ? (
                      <FaCheckDouble className="text-blue-300" />
                    ) : (
                      <FaCheck className="text-gray-300" />
                    ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ---------------- INPUT AREA ---------------- */}
      <div className="p-4 bg-[#0E0F11]/95 border-t border-white/10 flex items-center gap-3">
        <button
          onClick={() => fileInputRef.current.click()}
          className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition"
        >
          <FaPaperclip />
        </button>

        <input
          type="file"
          hidden
          ref={fileInputRef}
          onChange={handleFileUpload}
        />

        <input
          className="flex-1 bg-[#111315] border border-white/10 rounded-2xl px-4 py-2 text-sm focus:ring-2 focus:ring-white/10 outline-none"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />

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
