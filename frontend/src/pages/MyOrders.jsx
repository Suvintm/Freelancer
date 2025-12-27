import { useState, useEffect } from "react";
import axios from "axios";
import {
  FaArrowLeft,
  FaCheck,
  FaClock,
  FaTimes,
  FaExclamationTriangle,
  FaRupeeSign,
  FaComments,
  FaChevronRight,
  FaChevronDown,
  FaShoppingCart,
  FaEnvelope,
  FaCalendarAlt,
  FaCircle,
  FaBell,
} from "react-icons/fa";
import { useAppContext } from "../context/AppContext";
import { useSocket } from "../context/SocketContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import Sidebar from "../components/Sidebar.jsx";
import EditorNavbar from "../components/EditorNavbar.jsx";

const STATUS_CONFIG = {
  new: { label: "New", color: "text-red-400", bg: "bg-red-500/20", icon: FaClock },
  accepted: { label: "Accepted", color: "text-green-400", bg: "bg-green-500/20", icon: FaCheck },
  in_progress: { label: "In Progress", color: "text-yellow-400", bg: "bg-yellow-500/20", icon: FaClock },
  submitted: { label: "Submitted", color: "text-purple-400", bg: "bg-purple-500/20", icon: FaCheck },
  completed: { label: "Completed", color: "text-emerald-400", bg: "bg-emerald-500/20", icon: FaCheck },
  rejected: { label: "Rejected", color: "text-red-400", bg: "bg-red-500/20", icon: FaTimes },
  cancelled: { label: "Cancelled", color: "text-gray-400", bg: "bg-gray-500/20", icon: FaTimes },
  disputed: { label: "Disputed", color: "text-orange-400", bg: "bg-orange-500/20", icon: FaExclamationTriangle },
};

// Order Card Component with expandable details for new orders
const OrderCard = ({ order, user, onAccept, onReject, onNavigate, accepting, rejecting }) => {
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
      year: "numeric",
    });
  };

  // Calculate payment breakdown
  const orderAmount = order.amount || 0;
  const platformFee = order.platformFee || 0;
  const editorEarning = order.editorEarning || orderAmount - platformFee;
  const feePercent = orderAmount > 0 ? Math.round((platformFee / orderAmount) * 100) : 10;

  const handleCardClick = () => {
    if (canAcceptReject) {
      setExpanded(!expanded);
    } else {
      onNavigate(order._id);
    }
  };

  const formatRelativeTime = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    const mins = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return "Yesterday";
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`bg-[#111319] light:bg-white border ${
        isNewOrder ? "border-blue-500/30" : "border-[#262A3B] light:border-slate-200"
      } rounded-2xl overflow-hidden transition-all light:shadow-sm ${
        canAcceptReject ? "cursor-pointer hover:border-blue-500/50" : 
        order.status !== "rejected" && order.status !== "new" ? "cursor-pointer hover:border-blue-500/30" : ""
      }`}
    >
      {/* Main Card Content */}
      <div className="p-5" onClick={handleCardClick}>
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <img
            src={otherParty?.profilePicture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
            alt={otherParty?.name}
            className="w-14 h-14 rounded-xl object-cover"
          />

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-white light:text-slate-900">{order.title}</h3>
                  {/* Order Type Tag */}
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    order.type === "gig" 
                      ? "bg-purple-500/20 text-purple-400"
                      : "bg-cyan-500/20 text-cyan-400"
                  }`}>
                    {order.type === "gig" ? (
                      <><FaShoppingCart className="inline mr-1 text-[8px]" />From Gig</>
                    ) : (
                      <><FaEnvelope className="inline mr-1 text-[8px]" />Request</>
                    )}
                  </span>
                </div>
                <p className="text-gray-400 light:text-slate-500 text-sm mt-0.5">
                  {isEditor ? "Client: " : "Editor: "}
                  {otherParty?.name}
                </p>
              </div>

              {/* Status Badge */}
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${statusConfig.bg} ${statusConfig.color} text-xs font-medium`}>
                <StatusIcon className="text-xs" />
                {statusConfig.label}
              </div>
            </div>

            {/* Order Details */}
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-400 light:text-slate-500">
              <span className="text-gray-500 light:text-slate-400">#{order.orderNumber}</span>
              <span className="flex items-center gap-1 text-green-400 light:text-green-600 font-medium">
                <FaRupeeSign /> {order.amount}
              </span>
              <span className="flex items-center gap-1">
                <FaCalendarAlt className="text-orange-400" />
                {formatDate(order.deadline)}
              </span>
            </div>

            {/* Show expand hint for new orders */}
            {canAcceptReject && (
              <div className="flex items-center gap-2 mt-2 text-xs text-blue-400">
                <FaChevronDown className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
                <span>Click to {expanded ? "hide" : "view"} details</span>
              </div>
            )}
          </div>

          {/* Arrow for non-new orders */}
          {!canAcceptReject && (
            <div className="flex flex-col items-end gap-2">
              <FaChevronRight className="text-gray-500" />
              {order.latestMessage && (
                <span className="text-[10px] text-gray-500 whitespace-nowrap">
                  {formatRelativeTime(order.latestMessage.createdAt)}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Latest Message Snippet */}
        {order.latestMessage && !expanded && (
          <div className="mt-3 py-2 px-3 bg-[#0a0c0f] rounded-xl border border-white/5 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            <p className="text-[11px] text-gray-400 truncate flex-1">
              <span className="text-gray-500 mr-1">
                {order.latestMessage.sender?._id === user?._id ? "You:" : "Client:"}
              </span>
              {order.latestMessage.type === "text" 
                ? order.latestMessage.content 
                : `Sent a ${order.latestMessage.type}`}
            </p>
          </div>
        )}

        {/* Action Badge for New Orders */}
        {isNewOrder && isEditor && (
          <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl">
            <FaBell className="text-red-400 text-xs animate-bounce" />
            <span className="text-[11px] font-bold text-red-500 uppercase tracking-wider">
              New Order - Action Required
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
            className="border-t border-[#262A3B] light:border-slate-200"
          >
            <div className="p-5 bg-[#0a0c0f] space-y-4">
              {/* Description */}
              <div>
                <p className="text-xs text-gray-400 mb-1">Project Description</p>
                <p className="text-sm text-gray-200">
                  {order.description || "No description provided"}
                </p>
              </div>

              {/* Deadline Box */}
              <div className="bg-[#1a1410] border border-orange-400/30 rounded-xl p-3 flex items-center gap-3">
                <FaCalendarAlt className="text-orange-400 text-lg" />
                <div>
                  <span className="text-xs text-orange-300">Submission Deadline</span>
                  <p className="text-orange-400 font-bold">{formatDate(order.deadline)}</p>
                </div>
              </div>

              {/* Payment Breakdown */}
              <div className="bg-[#101214] border border-white/10 rounded-xl p-4 space-y-3">
                <p className="text-sm font-semibold text-white">Payment Breakdown</p>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-sm">Client Pays</span>
                  <span className="text-green-400 font-bold text-lg">₹{order.amount}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-orange-300 text-sm">Platform Fee ({feePercent}%)</span>
                  <span className="text-orange-400 font-bold">-₹{platformFee}</span>
                </div>
                
                <div className="border-t border-white/10 pt-3 flex justify-between items-center">
                  <span className="text-white font-semibold">You Receive</span>
                  <span className="text-green-400 font-bold text-xl">₹{editorEarning}</span>
                </div>
              </div>

              {/* Accept/Reject Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onReject(order._id);
                  }}
                  disabled={rejecting}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 font-medium transition-all disabled:opacity-50"
                >
                  <FaTimes />
                  {rejecting ? "Rejecting..." : "Reject"}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAccept(order._id);
                  }}
                  disabled={accepting}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-green-500/20 text-green-400 hover:bg-green-500/30 font-medium transition-all disabled:opacity-50"
                >
                  <FaCheck />
                  {accepting ? "Accepting..." : "Accept Order"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const MyOrders = () => {
  const { backendURL, user } = useAppContext();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingText, setLoadingText] = useState("Loading your orders...");
  const [statusFilter, setStatusFilter] = useState("all");
  const [acceptingId, setAcceptingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const { socket, resetNewOrdersCount } = useSocket();

  // Count new orders for badge
  const newOrdersCount = orders.filter(o => o.status === "new").length;

  // Real-time updates via Socket
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      setOrders(prevOrders => {
        const orderIndex = prevOrders.findIndex(o => o._id === (message.orderId || message.order));
        if (orderIndex === -1) return prevOrders;

        const updatedOrders = [...prevOrders];
        const order = { ...updatedOrders[orderIndex] };

        // Update latest message and activity
        order.latestMessage = {
          content: message.content,
          type: message.type,
          createdAt: message.createdAt,
          sender: message.sender
        };
        order.lastActivityAt = message.createdAt;

        updatedOrders[orderIndex] = order;

        // Re-sort by activity
        return updatedOrders.sort((a, b) => new Date(b.lastActivityAt) - new Date(a.lastActivityAt));
      });
    };

    socket.on("message:new", handleNewMessage);
    return () => {
      socket.off("message:new", handleNewMessage);
    };
  }, [socket]);


  useEffect(() => {
    fetchOrders();
    if (statusFilter === "all" && resetNewOrdersCount) {
      resetNewOrdersCount();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const token = user?.token;

      await axios.patch(
        `${backendURL}/api/orders/${orderId}/accept`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Order accepted! Chat is now available.");
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to accept order");
    } finally {
      setAcceptingId(null);
    }
  };

  const handleReject = async (orderId) => {
    try {
      setRejectingId(orderId);
      const token = user?.token;

      await axios.patch(
        `${backendURL}/api/orders/${orderId}/reject`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.info("Order rejected");
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reject order");
    } finally {
      setRejectingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col md:flex-row bg-[#050509] text-white">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <EditorNavbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 flex items-center justify-center md:ml-64 md:mt-20">
          <div className="flex flex-col items-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
            />
            <p className="mt-4 text-gray-400 text-sm">{loadingText}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#050509] light:bg-slate-50 text-white light:text-slate-900 transition-colors duration-200">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <EditorNavbar onMenuClick={() => setSidebarOpen(true)} />

      <main className="flex-1 px-4 md:px-8 py-6 md:ml-64 md:mt-20">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-3 rounded-xl bg-[#111319] light:bg-white border border-[#262A3B] light:border-slate-200 hover:bg-[#1a1d25] light:hover:bg-slate-100 transition-all light:shadow-sm"
          >
            <FaArrowLeft className="light:text-slate-600" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white light:text-slate-900">My Orders</h1>
              {newOrdersCount > 0 && (
                <span className="px-2 py-1 bg-blue-500 text-white text-xs font-bold rounded-full">
                  {newOrdersCount} New
                </span>
              )}
            </div>
            <p className="text-gray-400 light:text-slate-500 text-sm">{orders.length} orders total</p>
          </div>
        </div>

        {/* Status Filters */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-4 mb-6">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              statusFilter === "all"
                ? "bg-blue-600 text-white"
                : "bg-[#111319] light:bg-white text-gray-400 light:text-slate-600 hover:bg-[#1a1d25] light:hover:bg-slate-100 light:border light:border-slate-200"
            }`}
          >
            All
          </button>
          {Object.entries(STATUS_CONFIG).map(([key, config]) => {
            const count = orders.filter(o => o.status === key).length;
            return (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                  statusFilter === key
                    ? `${config.bg} ${config.color} border border-current`
                    : "bg-[#111319] light:bg-white text-gray-400 light:text-slate-600 hover:bg-[#1a1d25] light:hover:bg-slate-100 light:border light:border-slate-200"
                }`}
              >
                {config.label}
                {count > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    statusFilter === key ? "bg-white/20" : "bg-gray-700 light:bg-slate-200"
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <FaComments className="text-6xl text-gray-600 light:text-slate-400 mb-4" />
            <h3 className="text-xl font-semibold text-white light:text-slate-900 mb-2">No orders yet</h3>
            <p className="text-gray-400 light:text-slate-500 text-sm">Your orders will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {orders.map((order, index) => (
                <OrderCard
                  key={order._id}
                  order={order}
                  user={user}
                  onAccept={handleAccept}
                  onReject={handleReject}
                  onNavigate={(id) => navigate(`/chat/${id}`)}
                  accepting={acceptingId === order._id}
                  rejecting={rejectingId === order._id}
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
