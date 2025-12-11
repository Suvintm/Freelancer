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

// ⭐ NEW REQUEST ITEM COMPONENT ⭐
// Includes dropdown, project details, description, and payment receipt
// ⭐ NEW REQUEST ITEM COMPONENT ⭐
// Includes dropdown, project details, description, deadline, and payment receipt
const NewRequestItem = ({ req, onAccept, onReject }) => {
  const [open, setOpen] = useState(false);

  // Payment logic (dummy values)
  const amountPaid = req.amount || 600;
  const platformFee = Math.round(amountPaid * 0.1);
  const editorReceives = amountPaid - platformFee;

  // Deadline — default demo date if not provided
  const deadline = req.deadline || "12 Feb 2025";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#0f1112] border border-white/10 rounded-2xl p-4 shadow-lg flex flex-col gap-3"
    >
      {/* TOP ROW */}
      <div className="flex items-center gap-3">
        <img src={req.avatar} className="w-12 h-12 rounded-xl object-cover" />

        <div className="flex-1">
          <p className="font-semibold text-white text-sm">{req.name}</p>
          <p className="text-[11px] text-gray-400">{req.orderName}</p>
        </div>

        {/* Dropdown toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="px-3 py-1 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition"
        >
          {open ? "Hide" : "Details"}
        </button>
      </div>

      {/* EXPANDABLE SECTION */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="mt-3 bg-[#131518] rounded-xl border border-white/10 p-4 space-y-4"
          >
            {/* TITLE */}
            <div>
              <p className="text-xs text-gray-400">Project Title</p>
              <p className="font-semibold text-white text-sm">{req.orderName}</p>
            </div>

            {/* DESCRIPTION */}
            <div>
              <p className="text-xs text-gray-400">Project Description</p>
              <p className="text-sm text-gray-300">
                {req.description || "Client has not provided a description."}
              </p>
            </div>

            {/* DEADLINE BOX */}
            <div className="bg-[#1a1410] border border-orange-400/30 rounded-xl p-3 shadow-md flex items-center gap-3">
              <div className="text-orange-400 text-lg">📅</div>
              <div className="flex flex-col">
                <span className="text-xs text-orange-300">Submission Deadline</span>
                <span className="text-orange-400 font-bold text-base">
                  Submit Before: {deadline}
                </span>
              </div>
            </div>

            {/* RECEIPT */}
            <div className="bg-[#101214] border border-white/10 rounded-xl p-4 space-y-3 shadow-lg">
              <p className="text-sm font-semibold">Payment Breakdown</p>

              <div className="flex justify-between items-center">
                <span className="text-gray-300 text-sm">Client Pays</span>
                <span className="text-green-400 font-bold text-lg">₹{amountPaid}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-orange-300 text-sm">Platform Fee (10%)</span>
                <span className="text-orange-400 font-bold">-₹{platformFee}</span>
              </div>

              <div className="border-t border-white/10 my-2" />

              <div className="flex justify-between items-center">
                <span className="text-green-300 text-sm">You Will Receive</span>
                <span className="text-green-500 font-extrabold text-2xl">
                  ₹{editorReceives}
                </span>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => onAccept(req)}
                className="flex-1 bg-green-600 hover:bg-green-700 rounded-xl py-2 font-semibold"
              >
                Accept
              </button>

              <button
                onClick={() => onReject(req)}
                className="flex-1 bg-red-600 hover:bg-red-700 rounded-xl py-2 font-semibold"
              >
                Reject
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};


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
    description: "Need a cinematic teaser with slow-motion transitions.",
    timestamp: "1h ago",
    amount: 600,
    deadline: "15 Feb 2025",
  },
  {
    _id: "req002",
    orderName: "Birthday Highlight – Order #1170",
    name: "Client Sneha",
    avatar: "https://randomuser.me/api/portraits/women/22.jpg",
    description: "Simple short birthday highlight edit.",
    timestamp: "3h ago",
    amount: 800,
    deadline: "20 Feb 2025",
  },
  {
    _id: "req003",
    orderName: "Haldi Ceremony Edit – Order #1215",
    name: "Client Priya",
    avatar: "https://randomuser.me/api/portraits/women/45.jpg",
    description: "Need a colorful, traditional haldi ceremony highlight video.",
    timestamp: "Yesterday",
    amount: 1200,
    deadline: "18 Feb 2025",
  },
  {
    _id: "req004",
    orderName: "Corporate Promo – Order #1308",
    name: "Client Arjun",
    avatar: "https://randomuser.me/api/portraits/men/55.jpg",
    description: "A 1-minute clean corporate promotional video for our brand.",
    timestamp: "2 days ago",
    amount: 1500,
    deadline: "25 Feb 2025",
  },
  {
    _id: "req005",
    orderName: "Baby Shower Montage – Order #1402",
    name: "Client Divya",
    avatar: "https://randomuser.me/api/portraits/women/65.jpg",
    description: "A heartwarming montage with soft music and family moments.",
    timestamp: "4 days ago",
    amount: 700,
    deadline: "14 Feb 2025",
  },
  {
    _id: "req006",
    orderName: "Music Video Edit – Order #1510",
    name: "Client Vikram",
    avatar: "https://randomuser.me/api/portraits/men/28.jpg",
    description: "Energetic cuts, transitions, and VFX sync with beats.",
    timestamp: "5 days ago",
    amount: 2000,
    deadline: "28 Feb 2025",
  },
  {
    _id: "req007",
    orderName: "Travel Reel – Order #1604",
    name: "Client Sana",
    avatar: "https://randomuser.me/api/portraits/women/12.jpg",
    description: "Need a trendy Instagram travel reel with upbeat music.",
    timestamp: "1 week ago",
    amount: 500,
    deadline: "10 Feb 2025",
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

  // Filter logic
  const filterList = (list) =>
    list.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase())
    );

  const filteredNewRequests = filterList(newRequests);
  const filteredOngoing = filterList(ongoing);
  const filteredRejected = filterList(rejected);

  // ---------------------- ACCEPT ----------------------
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

  // ---------------------- REJECT ----------------------
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

  // ---------------------- ONGOING + REJECTED LIST ITEM ----------------------
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

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white text-sm">{chat.name}</p>

          <p className="text-[11px] text-gray-400 truncate">
            {chat.orderName}
          </p>

          <p className="text-[10px] text-gray-500">ID: {chat._id}</p>

          {/* Ongoing */}
          {type === "ongoing" && (
            <p className="text-gray-300 text-sm truncate mt-1">
              {chat.lastMessage ? (
                chat.lastMessage
              ) : (
                <span className="text-green-400 font-semibold">
                  Accepted — start conversation
                </span>
              )}
            </p>
          )}

          {/* Rejected */}
          {type === "rejected" && (
            <p className="text-red-400 text-sm mt-1 font-semibold">
              Unable to continue
            </p>
          )}
        </div>

        {/* Right side */}
        <div className="flex flex-col items-end gap-2">
          <span className="text-[11px] text-gray-500">{chat.timestamp}</span>

          {/* Unread badge */}
          {type === "ongoing" && chat.unread > 0 && (
            <span className="px-2 py-0.5 bg-white text-black rounded-full text-[10px] font-bold">
              {chat.unread}
            </span>
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
{/* ----------------- CORPORATE TABS ----------------- */}
<div className="px-4 py-3 border-b border-white/10 bg-[#0d0f10] flex items-center justify-between">

  {[
    {
      key: "new",
      label: "New",
      count: filteredNewRequests.length,
      icon: <FaComments className="text-xs" />,
    },
    {
      key: "ongoing",
      label: "Ongoing",
      count: filteredOngoing.length,
      icon: <FaCheck className="text-xs" />,
    },
    {
      key: "rejected",
      label: "Rejected",
      count: filteredRejected.length,
      icon: <FaTimes className="text-xs" />,
    },
  ].map((tab) => {
    const isActive = activeTab === tab.key;

    return (
      <button
        key={tab.key}
        onClick={() => setActiveTab(tab.key)}
        className={`relative flex-1 flex flex-col items-center justify-center gap-1 px-2 py-1
          rounded-lg transition-all duration-200
          ${isActive ? "bg-[#0f1a11] border border-green-500/40 shadow-[0_0_10px_rgba(0,255,100,0.4)]" : "hover:bg-white/5"}
        `}
      >
        {/* Count badge above the tab */}
        <span
          className={`absolute -top-2 right-4 px-2 py-[2px] text-[10px] rounded-full font-bold
          ${isActive ? "bg-green-500 text-black" : "bg-green-700 text-white"}
        `}
        >
          {tab.count}
        </span>

        {/* Icon */}
        <div className={`${isActive ? "text-green-400" : "text-gray-400"} text-base`}>
          {tab.icon}
        </div>

        {/* Label */}
        <span
          className={`text-[11px] tracking-wide font-medium ${
            isActive ? "text-green-300" : "text-gray-400"
          }`}
        >
          {tab.label}
        </span>

        {/* Active underline glow */}
        {isActive && (
          <div className="w-6 h-[2px] bg-green-400 rounded-full mt-1 shadow-[0_0_6px_rgba(0,255,100,0.6)]" />
        )}
      </button>
    );
  })}
</div>



      {/* SEARCH */}
      <div className="px-5 py-4 border-b border-white/10 bg-[#0B0B0D]">
        <div className="relative">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search"
            className="w-full bg-[#111315] border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm placeholder:text-gray-500 focus:ring-2 focus:ring-white/10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* LIST SECTION */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2">

        {/* NEW REQUESTS */}
        {activeTab === "new" &&
          (filteredNewRequests.length > 0 ? (
            filteredNewRequests.map((req) => (
              <NewRequestItem
                key={req._id}
                req={req}
                onAccept={acceptRequest}
                onReject={rejectRequest}
              />
            ))
          ) : (
            <EmptyState />
          ))}

        {/* ONGOING */}
        {activeTab === "ongoing" &&
          (filteredOngoing.length > 0 ? (
            filteredOngoing.map((chat) => renderChatItem(chat, "ongoing"))
          ) : (
            <EmptyState />
          ))}

        {/* REJECTED */}
        {activeTab === "rejected" &&
          (filteredRejected.length > 0 ? (
            filteredRejected.map((rej) => renderChatItem(rej, "rejected"))
          ) : (
            <EmptyState />
          ))}
      </div>
    </div>
  );
};

// EMPTY STATE
const EmptyState = () => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center mt-20 text-gray-400 gap-3"
  >
    <FaComments className="text-4xl opacity-40" />
    <p>No items found</p>
  </motion.div>
);

export default ChatsPage;
