import React, { useState, useRef, useEffect } from "react";
import {
  FaArrowLeft,
  FaPaperPlane,
  FaSmile,
  FaPaperclip,
  FaFileVideo,
  FaCheck,
  FaCheckDouble,
} from "react-icons/fa";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";

const ChatBoxPage = () => {
  const navigate = useNavigate();
  const { chatId } = useParams();
  const fileInputRef = useRef(null);

  // Dummy Chat Info (replace with API later)
  const chatUser = {
    name: "John Smith",
    role: "Client",
    avatar: "https://randomuser.me/api/portraits/men/75.jpg",
  };

  // Dummy Project Status
  const projectStatus = {
    work: "In Progress", // Pending | In Progress | Completed
    payment: "Escrow Success", // Escrow Failed
  };

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
    {
      id: 4,
      sender: "editor",
      text: "Got it! Will share draft by tonight.",
      time: "2:48 PM",
      delivered: true,
    },
  ]);

  const [newMessage, setNewMessage] = useState("");

  // Handle sending message
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

  // Handle file upload
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
    <div className="fixed inset-0 bg-[#0B0B0D] text-white flex flex-col">

      {/* HEADER */}
      <div className="flex items-center gap-4 px-5 py-4 bg-[#0e0f11]/80 backdrop-blur-xl border-b border-white/10">
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
      </div>

      {/* PROJECT STATUS */}
      <div className="px-5 py-3 border-b border-white/10 bg-[#111315] flex justify-between text-sm">
        <span
          className={`px-3 py-1 rounded-full font-semibold ${
            projectStatus.work === "Completed"
              ? "bg-green-600/20 text-green-400 border border-green-600/30"
              : projectStatus.work === "In Progress"
              ? "bg-blue-600/20 text-blue-300 border border-blue-600/30"
              : "bg-yellow-600/20 text-yellow-300 border border-yellow-600/30"
          }`}
        >
          {projectStatus.work}
        </span>

        <span
          className={`px-3 py-1 rounded-full font-semibold ${
            projectStatus.payment === "Escrow Success"
              ? "bg-emerald-600/20 text-emerald-300 border border-emerald-600/30"
              : "bg-red-600/20 text-red-300 border border-red-600/30"
          }`}
        >
          {projectStatus.payment}
        </span>
      </div>

      {/* CHAT MESSAGES */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isSender = msg.sender === "editor";

          return (
            <div
              key={msg.id}
              className={`flex ${
                isSender ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[70%] p-3 rounded-2xl text-sm shadow-lg ${
                  isSender
                    ? "bg-[#1D4ED8] text-white rounded-br-none"
                    : "bg-[#111315] text-gray-200 rounded-bl-none border border-white/10"
                }`}
              >
                {/* FILE MESSAGE */}
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

      {/* INPUT BAR */}
      <div className="p-4 bg-[#0E0F11] border-t border-white/10 flex items-center gap-3">
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
