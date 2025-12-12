import { useState, useEffect } from "react";
import axios from "axios";
import {
  FaArrowLeft,
  FaFilter,
  FaCheck,
  FaClock,
  FaTimes,
  FaExclamationTriangle,
  FaRupeeSign,
  FaComments,
  FaChevronRight,
} from "react-icons/fa";
import { useAppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import Sidebar from "../components/Sidebar.jsx";
import EditorNavbar from "../components/EditorNavbar.jsx";

const STATUS_CONFIG = {
  new: { label: "New", color: "text-blue-400", bg: "bg-blue-500/20", icon: FaClock },
  accepted: { label: "Accepted", color: "text-green-400", bg: "bg-green-500/20", icon: FaCheck },
  in_progress: { label: "In Progress", color: "text-yellow-400", bg: "bg-yellow-500/20", icon: FaClock },
  submitted: { label: "Submitted", color: "text-purple-400", bg: "bg-purple-500/20", icon: FaCheck },
  completed: { label: "Completed", color: "text-emerald-400", bg: "bg-emerald-500/20", icon: FaCheck },
  rejected: { label: "Rejected", color: "text-red-400", bg: "bg-red-500/20", icon: FaTimes },
  cancelled: { label: "Cancelled", color: "text-gray-400", bg: "bg-gray-500/20", icon: FaTimes },
  disputed: { label: "Disputed", color: "text-orange-400", bg: "bg-orange-500/20", icon: FaExclamationTriangle },
};

const MyOrders = () => {
  const { backendURL, user } = useAppContext();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingText, setLoadingText] = useState("Loading your orders...");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchOrders();
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

  const getOtherParty = (order) => {
    if (user?.role === "editor") {
      return order.client;
    }
    return order.editor;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
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
    <div className="min-h-screen flex flex-col md:flex-row bg-[#050509] text-white">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <EditorNavbar onMenuClick={() => setSidebarOpen(true)} />

      <main className="flex-1 px-4 md:px-8 py-6 md:ml-64 md:mt-20">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-3 rounded-xl bg-[#111319] border border-[#262A3B] hover:bg-[#1a1d25] transition-all"
          >
            <FaArrowLeft />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">My Orders</h1>
            <p className="text-gray-400 text-sm">{orders.length} orders total</p>
          </div>
        </div>

        {/* Status Filters */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-4 mb-6">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              statusFilter === "all"
                ? "bg-blue-600 text-white"
                : "bg-[#111319] text-gray-400 hover:bg-[#1a1d25]"
            }`}
          >
            All
          </button>
          {Object.entries(STATUS_CONFIG).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                statusFilter === key
                  ? `${config.bg} ${config.color} border border-current`
                  : "bg-[#111319] text-gray-400 hover:bg-[#1a1d25]"
              }`}
            >
              {config.label}
            </button>
          ))}
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <FaComments className="text-6xl text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No orders yet</h3>
            <p className="text-gray-400 text-sm">Your orders will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {orders.map((order, index) => {
                const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.new;
                const StatusIcon = statusConfig.icon;
                const otherParty = getOtherParty(order);

                return (
                  <motion.div
                    key={order._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => navigate(`/chat/${order._id}`)}
                    className="bg-[#111319] border border-[#262A3B] rounded-2xl p-5 cursor-pointer hover:border-blue-500/30 transition-all group"
                  >
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
                            <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                              {order.title}
                            </h3>
                            <p className="text-gray-400 text-sm mt-0.5">
                              {user?.role === "editor" ? "Client: " : "Editor: "}
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
                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                          <span className="text-gray-500">#{order.orderNumber}</span>
                          <span className="flex items-center gap-1 text-green-400 font-medium">
                            <FaRupeeSign /> {order.amount}
                          </span>
                          <span>Deadline: {formatDate(order.deadline)}</span>
                        </div>

                        {/* Payment Status */}
                        <div className="mt-2">
                          <span className={`text-xs px-2 py-1 rounded-lg ${
                            order.paymentStatus === "escrow" 
                              ? "bg-yellow-500/20 text-yellow-400"
                              : order.paymentStatus === "released"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-gray-500/20 text-gray-400"
                          }`}>
                            Payment: {order.paymentStatus}
                          </span>
                        </div>
                      </div>

                      {/* Arrow */}
                      <FaChevronRight className="text-gray-500 group-hover:text-blue-400 transition-colors" />
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
};

export default MyOrders;
