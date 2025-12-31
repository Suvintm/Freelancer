/**
 * MyOrders.jsx - Professional Order Management Page
 * Features: Premium cards, theme support, stats, search, filters
 * Matches Explore page aesthetic - All icons from react-icons
 */

import { useState, useEffect } from "react";
import axios from "axios";
import {
  HiOutlineShoppingBag,
  HiOutlineCurrencyRupee,
  HiOutlineClock,
  HiOutlineCheck,
  HiOutlineXMark,
  HiOutlineExclamationTriangle,
  HiOutlineChatBubbleLeftRight,
  HiChevronRight,
  HiChevronDown,
  HiOutlineCalendarDays,
  HiOutlineBell,
  HiMagnifyingGlass,
  HiOutlineFunnel,
  HiArrowLeft,
  HiOutlineSparkles,
  HiOutlineCheckBadge,
  HiOutlineInboxStack,
  HiOutlineDocumentCheck,
  HiOutlinePaperAirplane,
  HiOutlineArchiveBox,
  HiOutlineBanknotes,
} from "react-icons/hi2";
import { FaShoppingCart, FaEnvelope, FaRupeeSign, FaRegImage, FaVideo, FaFile } from "react-icons/fa";
import { useAppContext } from "../context/AppContext";
import { useSocket } from "../context/SocketContext";
import { useTheme } from "../context/ThemeContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import Sidebar from "../components/Sidebar.jsx";
import EditorNavbar from "../components/EditorNavbar.jsx";
import ClientSidebar from "../components/ClientSidebar.jsx";
import ClientNavbar from "../components/ClientNavbar.jsx";

// Status configuration with gradient colors
const STATUS_CONFIG = {
  new: { 
    label: "New", 
    color: "text-rose-400", 
    bg: "bg-rose-500/15", 
    border: "border-rose-500/30",
    icon: HiOutlineBell 
  },
  accepted: { 
    label: "Accepted", 
    color: "text-emerald-400", 
    bg: "bg-emerald-500/15", 
    border: "border-emerald-500/30",
    icon: HiOutlineCheck 
  },
  in_progress: { 
    label: "In Progress", 
    color: "text-amber-400", 
    bg: "bg-amber-500/15", 
    border: "border-amber-500/30",
    icon: HiOutlineClock 
  },
  submitted: { 
    label: "Submitted", 
    color: "text-violet-400", 
    bg: "bg-violet-500/15", 
    border: "border-violet-500/30",
    icon: HiOutlinePaperAirplane 
  },
  completed: { 
    label: "Completed", 
    color: "text-emerald-400", 
    bg: "bg-emerald-500/15", 
    border: "border-emerald-500/30",
    icon: HiOutlineCheckBadge 
  },
  rejected: { 
    label: "Rejected", 
    color: "text-red-400", 
    bg: "bg-red-500/15", 
    border: "border-red-500/30",
    icon: HiOutlineXMark 
  },
  cancelled: { 
    label: "Cancelled", 
    color: "text-gray-400", 
    bg: "bg-gray-500/15", 
    border: "border-gray-500/30",
    icon: HiOutlineXMark 
  },
  disputed: { 
    label: "Disputed", 
    color: "text-orange-400", 
    bg: "bg-orange-500/15", 
    border: "border-orange-500/30",
    icon: HiOutlineExclamationTriangle 
  },
};

// Filter options with icons from HeroIcons
const FILTER_OPTIONS = [
  { value: "all", label: "All", icon: HiOutlineInboxStack },
  { value: "new", label: "New", icon: HiOutlineBell },
  { value: "accepted", label: "Accepted", icon: HiOutlineCheck },
  { value: "in_progress", label: "In Progress", icon: HiOutlineClock },
  { value: "submitted", label: "Submitted", icon: HiOutlinePaperAirplane },
  { value: "completed", label: "Completed", icon: HiOutlineCheckBadge },
];

// Order Card Component
const OrderCard = ({ order, user, onAccept, onReject, onNavigate, accepting, rejecting, isDark }) => {
  const [expanded, setExpanded] = useState(false);
  const isNewOrder = order.status === "new";
  const isEditor = user?.role === "editor";
  const canAcceptReject = isNewOrder && isEditor;
  const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.new;
  const StatusIcon = statusConfig.icon;
  const otherParty = isEditor ? order.client : order.editor;

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
  };

  const formatRelativeTime = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    const mins = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    if (mins < 1) return "now";
    if (mins < 60) return `${mins}m`;
    if (hours < 24) return `${hours}h`;
    if (days === 1) return "1d";
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  const handleCardClick = () => {
    if (canAcceptReject) {
      setExpanded(!expanded);
    } else if (order.status !== "rejected" && order.status !== "new") {
      onNavigate(order._id);
    }
  };

  // Payment breakdown
  const orderAmount = order.amount || 0;
  const platformFee = order.platformFee || 0;
  const editorEarning = order.editorEarning || orderAmount - platformFee;
  const feePercent = order.platformFeePercentage || 10;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`relative overflow-hidden rounded-2xl transition-all duration-200 group ${
        isDark 
          ? "bg-[#0d0d12] border border-white/[0.08]" 
          : "bg-white border border-slate-200/80 shadow-sm"
      } ${
        canAcceptReject || (order.status !== "rejected" && order.status !== "new") 
          ? "cursor-pointer active:scale-[0.99]" 
          : ""
      } ${isNewOrder ? "border-rose-500/40" : ""}`}
    >
      {/* Main Card Content */}
      <div className="p-4" onClick={handleCardClick}>
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <img
              src={otherParty?.profilePicture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
              alt={otherParty?.name}
              className={`w-11 h-11 rounded-xl object-cover ${
                isDark ? "ring-1 ring-white/10" : "ring-1 ring-slate-200"
              }`}
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-[#0d0d12]" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title Row */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className={`font-semibold text-sm truncate ${isDark ? "text-white" : "text-slate-900"}`}>
                    {order.title}
                  </h3>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${
                    order.type === "gig" 
                      ? "bg-purple-500/20 text-purple-400"
                      : "bg-cyan-500/20 text-cyan-400"
                  }`}>
                    {order.type === "gig" ? "Gig" : "Request"}
                  </span>
                </div>
                <p className={`text-xs mt-0.5 ${isDark ? "text-zinc-500" : "text-slate-500"}`}>
                  {isEditor ? "Client: " : "Editor: "}{otherParty?.name}
                </p>
              </div>

              {/* Status + Arrow */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold ${statusConfig.bg} ${statusConfig.color}`}>
                  <StatusIcon className="text-xs" />
                  <span className="hidden xs:inline">{statusConfig.label}</span>
                </div>
                {!canAcceptReject && order.status !== "rejected" && order.status !== "new" && (
                  <HiChevronRight className={`text-base ${isDark ? "text-zinc-600" : "text-slate-400"}`} />
                )}
              </div>
            </div>

            {/* Order Details */}
            <div className="flex items-center gap-3 mt-2 text-[10px]">
              <span className={isDark ? "text-zinc-600" : "text-slate-400"}>
                {order.orderNumber}
              </span>
              <span className="flex items-center gap-0.5 text-violet-400 font-semibold">
                <HiOutlineCurrencyRupee className="text-[10px]" />
                {order.amount?.toLocaleString()}
              </span>
              <span className={`flex items-center gap-1 ${isDark ? "text-zinc-500" : "text-slate-500"}`}>
                <HiOutlineCalendarDays className="text-[10px] text-orange-400" />
                {formatDate(order.deadline)}
              </span>
            </div>

            {/* Expand hint for new orders */}
            {canAcceptReject && (
              <div className="flex items-center gap-1 mt-2 text-[10px] text-violet-400">
                <HiChevronDown className={`transition-transform text-xs ${expanded ? "rotate-180" : ""}`} />
                <span>Tap to review</span>
              </div>
            )}
          </div>
        </div>

        {/* Latest Message Preview */}
        {order.latestMessage && !expanded && (
          <div className={`mt-3 py-2 px-3 rounded-lg flex items-center gap-2 ${
            isDark ? "bg-white/[0.03]" : "bg-slate-50"
          }`}>
            <div className="w-1.5 h-1.5 rounded-full bg-violet-500 flex-shrink-0" />
            <p className={`text-[10px] truncate flex-1 ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
              <span className={isDark ? "text-zinc-600" : "text-slate-400"}>
                {order.latestMessage.sender?._id === user?._id ? "You: " : `${otherParty?.name?.split(" ")[0]}: `}
              </span>
              {order.latestMessage.type === "text" 
                ? order.latestMessage.content 
                : order.latestMessage.type === "image" ? "Sent a photo"
                : order.latestMessage.type === "video" ? "Sent a video"
                : order.latestMessage.type === "file" ? "Sent a file"
                : order.latestMessage.type === "system" ? "System message"
                : `Sent ${order.latestMessage.type}`}
            </p>
            <span className={`text-[9px] flex-shrink-0 ${isDark ? "text-zinc-600" : "text-slate-400"}`}>
              {formatRelativeTime(order.latestMessage.createdAt)}
            </span>
          </div>
        )}

        {/* Action Required Badge */}
        {isNewOrder && isEditor && !expanded && (
          <div className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-lg ${
            isDark ? "bg-rose-500/10" : "bg-rose-50"
          }`}>
            <HiOutlineBell className="text-rose-400 text-sm" />
            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">
              Action Required
            </span>
          </div>
        )}
      </div>

      {/* Expanded Details for New Orders */}
      <AnimatePresence>
        {expanded && canAcceptReject && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className={`border-t ${isDark ? "border-white/[0.08]" : "border-slate-200"}`}
          >
            <div className={`p-4 space-y-3 ${isDark ? "bg-black/20" : "bg-slate-50"}`}>
              {/* Description */}
              <div>
                <p className={`text-[10px] uppercase tracking-wider mb-1 font-medium ${isDark ? "text-zinc-500" : "text-slate-500"}`}>
                  Description
                </p>
                <p className={`text-xs leading-relaxed ${isDark ? "text-zinc-300" : "text-slate-700"}`}>
                  {order.description || "No description provided"}
                </p>
              </div>

              {/* Deadline */}
              <div className={`p-3 rounded-xl flex items-center gap-3 ${
                isDark ? "bg-orange-500/10 border border-orange-500/20" : "bg-orange-50 border border-orange-200"
              }`}>
                <div className="w-9 h-9 rounded-lg bg-orange-500/20 flex items-center justify-center">
                  <HiOutlineCalendarDays className="text-orange-400" />
                </div>
                <div>
                  <p className="text-[9px] text-orange-400/80 uppercase tracking-wider">Deadline</p>
                  <p className="text-orange-400 font-bold text-sm">{formatDate(order.deadline)}</p>
                </div>
              </div>

              {/* Payment Breakdown */}
              <div className={`p-3 rounded-xl space-y-2 ${
                isDark ? "bg-[#0d0d12] border border-white/[0.08]" : "bg-white border border-slate-200"
              }`}>
                <p className={`text-xs font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
                  Payment
                </p>
                
                <div className="flex justify-between items-center text-xs">
                  <span className={isDark ? "text-zinc-400" : "text-slate-600"}>Client Pays</span>
                  <span className="text-emerald-400 font-bold">₹{order.amount?.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between items-center text-xs">
                  <span className="text-orange-400">Fee ({feePercent}%)</span>
                  <span className="text-orange-400">-₹{platformFee?.toLocaleString()}</span>
                </div>
                
                <div className={`border-t pt-2 flex justify-between items-center ${isDark ? "border-white/[0.08]" : "border-slate-200"}`}>
                  <span className={`text-xs font-medium ${isDark ? "text-white" : "text-slate-900"}`}>You Get</span>
                  <span className="text-violet-400 font-bold">₹{editorEarning?.toLocaleString()}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-1">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onReject(order._id);
                  }}
                  disabled={rejecting}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/15 text-red-400 font-medium text-sm disabled:opacity-50"
                >
                  <HiOutlineXMark />
                  {rejecting ? "..." : "Decline"}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAccept(order._id);
                  }}
                  disabled={accepting}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white font-semibold text-sm shadow-lg shadow-emerald-500/25 disabled:opacity-50"
                >
                  <HiOutlineCheck />
                  {accepting ? "..." : "Accept"}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Shimmer loading card
const ShimmerCard = ({ isDark }) => (
  <div className={`rounded-2xl p-4 animate-pulse ${isDark ? "bg-[#0d0d12] border border-white/[0.08]" : "bg-white border border-slate-200"}`}>
    <div className="flex items-start gap-3">
      <div className={`w-11 h-11 rounded-xl ${isDark ? "bg-zinc-800" : "bg-slate-200"}`} />
      <div className="flex-1 space-y-2">
        <div className={`h-4 w-3/4 rounded ${isDark ? "bg-zinc-800" : "bg-slate-200"}`} />
        <div className={`h-3 w-1/2 rounded ${isDark ? "bg-zinc-800" : "bg-slate-200"}`} />
      </div>
    </div>
  </div>
);

const MyOrders = () => {
  const { backendURL, user } = useAppContext();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const navigate = useNavigate();
  const isEditor = user?.role === "editor";

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [acceptingId, setAcceptingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const { socket, resetNewOrdersCount } = useSocket();

  // Stats calculations
  const newOrdersCount = orders.filter(o => o.status === "new").length;
  const completedCount = orders.filter(o => o.status === "completed").length;
  const totalEarnings = orders
    .filter(o => o.status === "completed")
    .reduce((sum, o) => sum + (o.editorEarning || o.amount || 0), 0);

  // Real-time updates
  useEffect(() => {
    if (!socket) return;
    const handleNewMessage = (message) => {
      setOrders(prevOrders => {
        const orderIndex = prevOrders.findIndex(o => o._id === (message.orderId || message.order));
        if (orderIndex === -1) return prevOrders;
        const updatedOrders = [...prevOrders];
        const order = { ...updatedOrders[orderIndex] };
        order.latestMessage = {
          content: message.content,
          type: message.type,
          createdAt: message.createdAt,
          sender: message.sender
        };
        order.lastActivityAt = message.createdAt;
        updatedOrders[orderIndex] = order;
        return updatedOrders.sort((a, b) => new Date(b.lastActivityAt) - new Date(a.lastActivityAt));
      });
    };
    socket.on("message:new", handleNewMessage);
    return () => socket.off("message:new", handleNewMessage);
  }, [socket]);

  useEffect(() => {
    fetchOrders();
    if (statusFilter === "all" && resetNewOrdersCount) resetNewOrdersCount();
  }, [statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = user?.token;
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      const res = await axios.get(`${backendURL}/api/orders?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(res.data.orders || []);
    } catch (err) {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (orderId) => {
    try {
      setAcceptingId(orderId);
      await axios.patch(
        `${backendURL}/api/orders/${orderId}/accept`,
        {},
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      toast.success("Order accepted!");
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setAcceptingId(null);
    }
  };

  const handleReject = async (orderId) => {
    try {
      setRejectingId(orderId);
      await axios.patch(
        `${backendURL}/api/orders/${orderId}/reject`,
        {},
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      toast.info("Order declined");
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setRejectingId(null);
    }
  };

  // Filter and sort orders
  const filteredOrders = orders
    .filter(order => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        order.title?.toLowerCase().includes(query) ||
        order.orderNumber?.toLowerCase().includes(query) ||
        (isEditor ? order.client?.name : order.editor?.name)?.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      if (sortBy === "amount") return (b.amount || 0) - (a.amount || 0);
      if (sortBy === "deadline") return new Date(a.deadline) - new Date(b.deadline);
      return new Date(b.lastActivityAt || b.createdAt) - new Date(a.lastActivityAt || a.createdAt);
    });

  const SidebarComponent = isEditor ? Sidebar : ClientSidebar;
  const NavbarComponent = isEditor ? EditorNavbar : ClientNavbar;

  return (
    <div 
      className={`min-h-screen flex flex-col md:flex-row ${
        isDark ? "bg-[#09090B] text-white" : "bg-slate-50 text-slate-900"
      }`}
      style={{ fontFamily: "'Manrope', sans-serif" }}
    >
      <SidebarComponent isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <NavbarComponent onMenuClick={() => setSidebarOpen(true)} />

      <main className="flex-1 px-4 py-4 pt-[72px] md:pt-6 md:ml-64 md:mt-20 pb-24 md:px-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            className={`p-2 rounded-xl ${
              isDark 
                ? "bg-[#0d0d12] border border-white/[0.08]" 
                : "bg-white border border-slate-200 shadow-sm"
            }`}
          >
            <HiArrowLeft className={`text-lg ${isDark ? "text-white" : "text-slate-600"}`} />
          </motion.button>
          
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isDark ? "bg-violet-500/15" : "bg-violet-100"
          }`}>
            <HiOutlineShoppingBag className="text-violet-500 text-lg" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold truncate" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                My Orders
              </h1>
              {newOrdersCount > 0 && (
                <span className="px-2 py-0.5 bg-gradient-to-r from-violet-500 to-purple-500 text-white text-[10px] font-bold rounded-full">
                  {newOrdersCount} New
                </span>
              )}
            </div>
            <p className={`text-[11px] ${isDark ? "text-zinc-500" : "text-slate-500"}`}>
              {orders.length} orders total
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className={`grid grid-cols-4 gap-2 mb-4 p-3 rounded-xl ${
          isDark ? "bg-[#0d0d12] border border-white/[0.08]" : "bg-white border border-slate-200 shadow-sm"
        }`}>
          {[
            { icon: HiOutlineInboxStack, value: orders.length, label: "Total", color: "text-violet-400" },
            { icon: HiOutlineClock, value: newOrdersCount, label: "Pending", color: "text-amber-400" },
            { icon: HiOutlineCheckBadge, value: completedCount, label: "Done", color: "text-emerald-400" },
            { icon: HiOutlineBanknotes, value: `₹${(totalEarnings / 1000).toFixed(1)}K`, label: "Earned", color: "text-violet-400" },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <stat.icon className={`text-sm ${stat.color}`} />
                <span className="text-sm font-bold">{stat.value}</span>
              </div>
              <p className={`text-[9px] ${isDark ? "text-zinc-500" : "text-slate-500"}`}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <HiMagnifyingGlass className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${isDark ? "text-zinc-500" : "text-slate-400"}`} />
          <input
            type="text"
            placeholder="Search orders, clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full rounded-xl pl-9 pr-4 py-2.5 text-sm ${
              isDark 
                ? "bg-[#0d0d12] border border-white/[0.08] placeholder-zinc-600 focus:border-violet-500/50" 
                : "bg-white border border-slate-200 placeholder-slate-400 focus:border-violet-500"
            } focus:outline-none focus:ring-2 focus:ring-violet-500/20`}
          />
        </div>

        {/* Filters + Sort */}
        <div className="flex items-center gap-2 mb-4">
          {/* Filter Pills */}
          <div className="flex-1 flex gap-1.5 overflow-x-auto scrollbar-hide">
            {FILTER_OPTIONS.map((filter) => {
              const count = filter.value === "all" 
                ? orders.length 
                : orders.filter(o => o.status === filter.value).length;
              const FilterIcon = filter.icon;
              return (
                <motion.button
                  key={filter.value}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setStatusFilter(filter.value)}
                  className={`flex items-center gap-1 px-3 py-2 rounded-xl text-[11px] font-semibold whitespace-nowrap transition-all ${
                    statusFilter === filter.value
                      ? "bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg shadow-violet-500/25"
                      : isDark 
                        ? "bg-[#0d0d12] border border-white/[0.08] text-zinc-400"
                        : "bg-white border border-slate-200 text-slate-600"
                  }`}
                >
                  <FilterIcon className="text-xs" />
                  <span className="hidden sm:inline">{filter.label}</span>
                  {count > 0 && statusFilter !== filter.value && (
                    <span className={`text-[9px] px-1 rounded ${
                      isDark ? "bg-white/10" : "bg-slate-100"
                    }`}>
                      {count}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Sort Button */}
          <div className="relative flex-shrink-0">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium ${
                isDark 
                  ? "bg-[#0d0d12] border border-white/[0.08] text-zinc-400"
                  : "bg-white border border-slate-200 text-slate-600 shadow-sm"
              }`}
            >
              <HiOutlineFunnel className="text-sm" />
              <HiChevronDown className={`text-[10px] transition-transform ${showSortDropdown ? "rotate-180" : ""}`} />
            </motion.button>
            
            <AnimatePresence>
              {showSortDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowSortDropdown(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 5, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 5, scale: 0.95 }}
                    className={`absolute right-0 top-full mt-1 py-1 rounded-xl shadow-xl z-50 min-w-[120px] ${
                      isDark ? "bg-[#111319] border border-white/[0.08]" : "bg-white border border-slate-200"
                    }`}
                  >
                    {[
                      { value: "recent", label: "Recent" },
                      { value: "amount", label: "Amount" },
                      { value: "deadline", label: "Deadline" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSortBy(option.value);
                          setShowSortDropdown(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-xs font-medium transition-colors ${
                          sortBy === option.value
                            ? "text-violet-400 bg-violet-500/10"
                            : isDark 
                              ? "text-zinc-400 hover:bg-white/5"
                              : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <ShimmerCard key={i} isDark={isDark} />)}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-3 ${
              isDark ? "bg-violet-500/10" : "bg-violet-50"
            }`}>
              <HiOutlineChatBubbleLeftRight className="text-2xl text-violet-400" />
            </div>
            <h3 className={`text-base font-semibold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>
              {searchQuery ? "No matching orders" : "No orders yet"}
            </h3>
            <p className={`text-xs text-center max-w-[200px] ${isDark ? "text-zinc-500" : "text-slate-500"}`}>
              {searchQuery 
                ? "Try a different search" 
                : isEditor 
                  ? "Orders will appear here" 
                  : "Place your first order"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredOrders.map((order) => (
                <OrderCard
                  key={order._id}
                  order={order}
                  user={user}
                  onAccept={handleAccept}
                  onReject={handleReject}
                  onNavigate={(id) => navigate(`/chat/${id}`)}
                  accepting={acceptingId === order._id}
                  rejecting={rejectingId === order._id}
                  isDark={isDark}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
};

export default MyOrders;
