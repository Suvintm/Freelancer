import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaArrowLeft,
  FaSearch,
  FaComments,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

const ChatsPage = () => {
  const navigate = useNavigate();
  const { user, backendURL } = useAppContext();

  // -------- Dummy chat list --------
  const [chats, setChats] = useState([
    {
      _id: "chat001",
      orderName: "Wedding Teaser – Order #1023",
      name: "John Smith",
      role: "client",
      avatar: "https://randomuser.me/api/portraits/men/75.jpg",
      lastMessage: "Sure, I will send the files by tonight!",
      timestamp: "2:45 PM",
      unread: 2,
      online: true,
    },
    {
      _id: "chat002",
      orderName: "Birthday Cinematic Edit – Order #1040",
      name: "Aadhya Editing Studio",
      role: "editor",
      avatar: "https://randomuser.me/api/portraits/women/12.jpg",
      lastMessage: "Thank you! Project delivered successfully 👌",
      timestamp: "12:30 PM",
      unread: 1,
      online: false,
    },
    {
      _id: "chat003",
      orderName: "Travel Vlog – Order #1010",
      name: "Freelancer Rahul",
      role: "editor",
      avatar: "https://randomuser.me/api/portraits/men/20.jpg",
      lastMessage: "Can you share sample videos?",
      timestamp: "Yesterday",
      unread: 3,
      online: true,
    },
  ]);

  const [search, setSearch] = useState("");

  const filteredChats = chats.filter((chat) =>
    chat.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-[#0B0B0D] text-white flex flex-col">

      {/* -------- HEADER -------- */}
      <div className="px-5 py-5 flex items-center gap-4 border-b border-white/10 bg-[#0e0f11]/80 backdrop-blur-xl">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition"
        >
          <FaArrowLeft className="text-lg" />
        </button>

        <h1 className="text-xl font-semibold tracking-wide">Messages</h1>
      </div>

      {/* -------- SEARCH BOX -------- */}
      <div className="px-5 py-4 border-b border-white/10 bg-[#0B0B0D]">
        <div className="relative">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            className="w-full bg-[#111315] border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm placeholder:text-gray-500 focus:ring-2 focus:ring-white/10 outline-none transition"
            placeholder="Search chats"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* -------- CHAT LIST -------- */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-2">

        <AnimatePresence>
          {filteredChats.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 0.8, y: 0 }}
              className="flex flex-col items-center justify-center mt-20 text-gray-400 gap-3"
            >
              <FaComments className="text-4xl opacity-40" />
              <p>No chats found</p>
            </motion.div>
          ) : (
            filteredChats.map((chat) => (
              <motion.div
                key={chat._id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.2 }}
                onClick={() => navigate(`/chat/${chat._id}`)}
                className="flex items-center gap-4 bg-[#0f1112] border border-white/5 hover:border-white/15 cursor-pointer rounded-2xl p-4 shadow-[0_8px_20px_rgba(0,0,0,0.6)]"
              >
                {/* ------- Avatar + Online Badge ------- */}
                <div className="relative">
                  <img
                    src={chat.avatar}
                    className="w-14 h-14 rounded-2xl object-cover shadow-md"
                  />
                  {chat.online && (
                    <span className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-[#0f1112]"></span>
                  )}
                </div>

                {/* ------- MIDDLE TEXT AREA ------- */}
                <div className="flex-1 min-w-0">

                  {/* NAME + ROLE */}
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-white text-sm tracking-wide">
                      {chat.name}
                    </p>

                    <span
                      className={`
                        text-[10px] px-2 py-0.5 rounded-full font-semibold tracking-wide
                        ${
                          chat.role === "editor"
                            ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                            : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        }
                      `}
                    >
                      {chat.role === "editor" ? "Editor" : "Client"}
                    </span>
                  </div>

                  {/* ORDER NAME */}
                  <p className="text-[11px] text-gray-400 truncate max-w-[240px] leading-tight">
                    {chat.orderName}
                  </p>

                  {/* CHAT ID */}
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    Chat ID: {chat._id}
                  </p>

                  {/* LAST MESSAGE */}
                  <p className="text-gray-400 text-sm truncate max-w-[200px] mt-1">
                    {chat.lastMessage.length > 35
                      ? chat.lastMessage.slice(0, 35) + "..."
                      : chat.lastMessage}
                  </p>
                </div>

                {/* ------- RIGHT SIDE: TIME + UNREAD ------- */}
                <div className="flex flex-col items-end justify-between h-full gap-2">
                  <span className="text-[11px] text-gray-500">{chat.timestamp}</span>

                  {chat.unread > 0 && (
                    <span className="px-2 py-0.5 bg-white text-black rounded-full text-[10px] font-bold shadow">
                      {chat.unread}
                    </span>
                  )}
                </div>

              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ChatsPage;
