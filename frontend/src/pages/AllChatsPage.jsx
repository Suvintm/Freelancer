// ChatsPage.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaArrowLeft,
  FaSearch,
  FaComments,
  FaCheck,
  FaTimes,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

const ChatsPage = () => {
  const navigate = useNavigate();
  const { user, backendURL } = useAppContext();

  // ---------------------- STATE ----------------------
  const [activeTab, setActiveTab] = useState("ongoing");

  // -------- Dummy Data for New Requests --------
  const [newRequests, setNewRequests] = useState([
    {
      _id: "req001",
      orderName: "Engagement Trailer – Order #1101",
      name: "Client Raj",
      avatar: "https://randomuser.me/api/portraits/men/31.jpg",
      requestText: "Hi, I want you to edit my engagement teaser.",
      timestamp: "1h ago",
    },
    {
      _id: "req002",
      orderName: "Birthday Highlight – Order #1170",
      name: "Client Sneha",
      avatar: "https://randomuser.me/api/portraits/women/22.jpg",
      requestText: "Please accept my project request.",
      timestamp: "3h ago",
    },
  ]);

  // -------- Dummy Ongoing Chats --------
  const [ongoing, setOngoing] = useState([
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
      orderName: "Birthday Cinematic – Order #1040",
      name: "Aadhya Editing Studio",
      role: "editor",
      avatar: "https://randomuser.me/api/portraits/women/12.jpg",
      lastMessage: "",
      timestamp: "12:30 PM",
      unread: 0,
      online: false,
    },
  ]);

  // -------- Dummy Rejected Requests --------
  const [rejected, setRejected] = useState([
    {
      _id: "rej001",
      orderName: "Travel Vlog – Order #1010",
      name: "Freelancer Rahul",
      avatar: "https://randomuser.me/api/portraits/men/20.jpg",
      timestamp: "Yesterday",
    },
  ]);

  // -------- SEARCH --------
  const [search, setSearch] = useState("");

  // Filter logic based on active tab
  const filterList = (list) =>
    list.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase())
    );

  const filteredNewRequests = filterList(newRequests);
  const filteredOngoing = filterList(ongoing);
  const filteredRejected = filterList(rejected);

  // ---------------------- ACCEPT REQUEST ----------------------
  const acceptRequest = (req) => {
    setOngoing((prev) => [
      ...prev,
      {
        _id: req._id,
        orderName: req.orderName,
        name: req.name,
        avatar: req.avatar,
        lastMessage: "",
        timestamp: "Now",
        unread: 0,
        online: false,
        role: "client",
      },
    ]);

    setNewRequests((prev) => prev.filter((r) => r._id !== req._id));
    setActiveTab("ongoing");
  };

  // ---------------------- REJECT REQUEST ----------------------
  const rejectRequest = (req) => {
    setRejected((prev) => [
      ...prev,
      {
        _id: req._id,
        orderName: req.orderName,
        name: req.name,
        avatar: req.avatar,
        timestamp: "Now",
      },
    ]);

    setNewRequests((prev) => prev.filter((r) => r._id !== req._id));
    setActiveTab("rejected");
  };

  // ---------------------- RENDER LIST ITEM ----------------------
  const renderChatItem = (chat, type) => {
    const clickable = type === "ongoing";

    return (
      <motion.div
        key={chat._id}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: clickable ? 1.01 : 1 }}
        onClick={() => clickable && navigate(`/chat/${chat._id}`)}
        className={`flex items-center gap-4 ${
          type === "rejected" ? "bg-[#3b0f0f]/40" : "bg-[#0f1112]"
        } border border-white/5 hover:border-white/15 cursor-pointer rounded-2xl p-4`}
      >
        {/* Avatar */}
        <div className="relative">
          <img
            src={chat.avatar}
            className="w-14 h-14 rounded-2xl object-cover shadow-md"
          />
          {chat.online && type === "ongoing" && (
            <span className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-[#0f1112]" />
          )}
        </div>

        {/* TEXT AREA */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white text-sm">{chat.name}</p>

          <p className="text-[11px] text-gray-400 truncate">
            {chat.orderName}
          </p>

          <p className="text-[10px] text-gray-500">ID: {chat._id}</p>

          {/* ONGOING MESSAGE */}
          {type === "ongoing" && (
            <p className="text-gray-300 text-sm truncate mt-1">
              {chat.lastMessage
                ? chat.lastMessage
                : <span className="text-green-400 font-semibold">Accepted — start conversation</span>}
            </p>
          )}

          {/* REJECTED LABEL */}
          {type === "rejected" && (
            <p className="text-red-400 text-sm mt-1 font-semibold">
              Unable to continue
            </p>
          )}
        </div>

        {/* RIGHT SIDE */}
        <div className="flex flex-col items-end gap-2">
          <span className="text-[11px] text-gray-500">{chat.timestamp}</span>

          {/* UNREAD */}
          {type === "ongoing" && chat.unread > 0 && (
            <span className="px-2 py-0.5 bg-white text-black rounded-full text-[10px] font-bold">
              {chat.unread}
            </span>
          )}

          {/* NEW REQUEST ACTION BUTTONS */}
          {type === "new" && (
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  acceptRequest(chat);
                }}
                className="p-2 bg-green-600 rounded-full hover:bg-green-700"
              >
                <FaCheck />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  rejectRequest(chat);
                }}
                className="p-2 bg-red-600 rounded-full hover:bg-red-700"
              >
                <FaTimes />
              </button>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  // ---------------------- MAIN UI ----------------------
  return (
    <div className="fixed inset-0 bg-[#0B0B0D] text-white flex flex-col">

      {/* HEADER */}
      <div className="px-5 py-5 flex items-center gap-4 border-b border-white/10 bg-[#0e0f11]/80 backdrop-blur-xl">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"
        >
          <FaArrowLeft />
        </button>
        <h1 className="text-xl font-semibold">Messages</h1>
      </div>

      {/* ----------------- TABS ----------------- */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-white/10 bg-[#0d0f10] text-sm font-semibold">
        {["new", "ongoing", "rejected"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-xl transition ${
              activeTab === tab
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:bg-white/10"
            }`}
          >
            {tab === "new" && "New Requests"}
            {tab === "ongoing" && "Ongoing Chats"}
            {tab === "rejected" && "Rejected"}
          </button>
        ))}
      </div>

      {/* SEARCH BAR */}
      <div className="px-5 py-4 border-b border-white/10 bg-[#0B0B0D]">
        <div className="relative">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            className="w-full bg-[#111315] border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm placeholder:text-gray-500 focus:ring-2 focus:ring-white/10"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ----------------- LIST SECTION ----------------- */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2">

        {/* NEW REQUESTS */}
        {activeTab === "new" &&
          (filteredNewRequests.length > 0 ? (
            filteredNewRequests.map((req) =>
              renderChatItem(req, "new")
            )
          ) : (
            <EmptyState />
          ))}

        {/* ONGOING */}
        {activeTab === "ongoing" &&
          (filteredOngoing.length > 0 ? (
            filteredOngoing.map((chat) =>
              renderChatItem(chat, "ongoing")
            )
          ) : (
            <EmptyState />
          ))}

        {/* REJECTED */}
        {activeTab === "rejected" &&
          (filteredRejected.length > 0 ? (
            filteredRejected.map((rej) =>
              renderChatItem(rej, "rejected")
            )
          ) : (
            <EmptyState />
          ))}
      </div>
    </div>
  );
};

// ---------------- EMPTY STATE ----------------
const EmptyState = () => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center mt-20 text-gray-400 gap-3"
  >
    <FaComments className="text-4xl opacity-40" />
    <p>No items found</p>
  </motion.div>
);

export default ChatsPage;
