/**
 * Client Orders Page - Professional Corporate Design
 * Client's order management with Brief/Gig/Request type support
 */
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  HiArrowLeft,
  HiCheckCircle,
  HiClock,
  HiXCircle,
  HiExclamation,
  HiCurrencyRupee,
  HiChatAlt2,
  HiShoppingCart,
  HiMail,
  HiCalendar,
  HiEye,
  HiRefresh,
  HiInbox,
  HiClipboardList,
  HiUserGroup,
  HiChevronRight,
} from "react-icons/hi";
import { useAppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import ClientSidebar from "../components/ClientSidebar.jsx";
import ClientNavbar from "../components/ClientNavbar.jsx";

const STATUS_CONFIG = {
  new: { 
    label: "Pending", 
    color: "text-blue-400", 
    bg: "bg-blue-500/10", 
    border: "border-blue-500/20",
    icon: HiClock 
  },
  accepted: { 
    label: "Accepted", 
    color: "text-emerald-400", 
    bg: "bg-emerald-500/10", 
    border: "border-emerald-500/20",
    icon: HiCheckCircle 
  },
  in_progress: { 
    label: "In Progress", 
    color: "text-amber-400", 
    bg: "bg-amber-500/10", 
    border: "border-amber-500/20",
    icon: HiClock 
  },
  submitted: { 
    label: "Submitted", 
    color: "text-purple-400", 
    bg: "bg-purple-500/10", 
    border: "border-purple-500/20",
    icon: HiCheckCircle 
  },
  completed: { 
    label: "Completed", 
    color: "text-emerald-400", 
    bg: "bg-emerald-500/10", 
    border: "border-emerald-500/20",
    icon: HiCheckCircle 
  },
  rejected: { 
    label: "Rejected", 
    color: "text-red-400", 
    bg: "bg-red-500/10", 
    border: "border-red-500/20",
    icon: HiXCircle 
  },
  cancelled: { 
    label: "Cancelled", 
    color: "text-gray-400", 
    bg: "bg-gray-500/10", 
    border: "border-gray-500/20",
    icon: HiXCircle 
  },
  disputed: { 
    label: "Disputed", 
    color: "text-orange-400", 
    bg: "bg-orange-500/10", 
    border: "border-orange-500/20",
    icon: HiExclamation 
  },
};

const ORDER_TYPE_CONFIG = {
  gig: {
    label: "Gig",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    icon: HiShoppingCart,
  },
  request: {
    label: "Request",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
    icon: HiMail,
  },
  brief: {
    label: "Brief",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    icon: HiClipboardList,
  },
};

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "new", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "in_progress", label: "In Progress" },
  { value: "submitted", label: "Submitted" },
  { value: "completed", label: "Completed" },
];

const ClientOrders = () => {
  const { backendURL, user } = useAppContext();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);

      const res = await axios.get(`${backendURL}/api/orders?${params}`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });

      setOrders(res.data.orders || []);
    } catch (err) {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [backendURL, user?.token, statusFilter]);

  useEffect(() => {
    if (user?.token) {
      fetchOrders();
    }
  }, [user?.token, fetchOrders]);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusMessage = (status) => {
    const messages = {
      new: "Waiting for editor to accept",
      accepted: "Editor accepted, work begins soon",
      in_progress: "Editor is working on your project",
      submitted: "Editor submitted, please review",
      completed: "Project completed successfully",
      rejected: "Editor declined this order",
      cancelled: "Order was cancelled",
      disputed: "Order is under dispute",
    };
    return messages[status] || "";
  };

  // Get order counts for tabs
  const getOrderCount = (status) => {
    if (status === "all") return orders.length;
    return orders.filter(o => o.status === status).length;
  };

  // Shimmer loading card
  const ShimmerCard = () => (
    <div className="bg-[#0A0A0C] light:bg-white border border-[#1a1a1f] light:border-slate-200 rounded-xl p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-[#151518] light:bg-slate-100 rounded-lg" />
        <div className="flex-1">
          <div className="h-4 bg-[#151518] light:bg-slate-100 rounded w-3/4 mb-2" />
          <div className="h-3 bg-[#151518] light:bg-slate-100 rounded w-1/2" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#030303] light:bg-slate-50 text-white light:text-slate-900 transition-colors duration-300" style={{ fontFamily: "'Inter', sans-serif" }}>
      <ClientSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <ClientNavbar onMenuClick={() => setSidebarOpen(true)} />

      <main className="flex-1 px-4 md:px-6 py-5 md:ml-64 md:mt-20">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <HiShoppingCart className="text-emerald-400 text-lg" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white light:text-slate-900">My Orders</h1>
              <p className="text-gray-500 text-[10px]">{orders.length} orders total</p>
            </div>
          </div>
          <button
            onClick={() => fetchOrders()}
            className="p-2 rounded-lg bg-[#0A0A0C] light:bg-white border border-[#1a1a1f] light:border-slate-200 text-gray-400 hover:text-white light:hover:text-slate-900 transition-colors"
          >
            <HiRefresh className={`text-sm ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Status Tabs - Scrollable on mobile */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-3 mb-5 -mx-4 px-4 md:mx-0 md:px-0">
          {STATUS_TABS.map((tab) => {
            const count = getOrderCount(tab.value);
            const isActive = statusFilter === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isActive
                    ? "bg-white light:bg-slate-900 text-black light:text-white"
                    : "bg-[#0A0A0C] light:bg-white text-gray-500 border border-[#1a1a1f] light:border-slate-200 hover:border-[#2a2a30]"
                }`}
              >
                {tab.label}
                {count > 0 && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                    isActive ? "bg-black/20 light:bg-white/20" : "bg-[#151518] light:bg-slate-100"
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <ShimmerCard key={i} />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#0A0A0C] light:bg-slate-100 flex items-center justify-center">
              <HiInbox className="text-2xl text-gray-500" />
            </div>
            <h3 className="text-sm font-medium text-white light:text-slate-900 mb-1">No Orders Yet</h3>
            <p className="text-gray-500 text-xs mb-4">Start by browsing editors or posting a brief</p>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={() => navigate("/client-home")}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white text-xs font-medium transition-colors"
              >
                Explore Editors
              </button>
              <button
                onClick={() => navigate("/create-brief")}
                className="px-4 py-2 bg-[#0A0A0C] light:bg-white border border-[#1a1a1f] light:border-slate-200 rounded-lg text-gray-400 text-xs font-medium hover:border-[#2a2a30] transition-colors"
              >
                Post a Brief
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {orders.map((order, index) => {
                const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.new;
                const StatusIcon = statusConfig.icon;
                const typeConfig = ORDER_TYPE_CONFIG[order.type] || ORDER_TYPE_CONFIG.request;
                const TypeIcon = typeConfig.icon;
                const canChat = ["accepted", "in_progress", "submitted", "completed"].includes(order.status);

                return (
                  <motion.div
                    key={order._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.03 }}
                    className="bg-[#0A0A0C] light:bg-white border border-[#1a1a1f] light:border-slate-200 rounded-xl p-4 hover:border-[#2a2a30] light:hover:border-slate-300 transition-all group"
                  >
                    {/* Mobile Layout */}
                    <div className="flex items-start gap-3">
                      {/* Editor Avatar */}
                      <img
                        src={order.editor?.profilePicture || "/default-avatar.png"}
                        alt={order.editor?.name}
                        className="w-10 h-10 md:w-11 md:h-11 rounded-lg object-cover flex-shrink-0"
                      />

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Title Row with Tags */}
                        <div className="flex flex-wrap items-start gap-1.5 mb-1">
                          <h3 className="text-sm font-medium text-white light:text-slate-900 mr-1 line-clamp-1">
                            {order.title}
                          </h3>
                          
                          {/* Order Type Tag */}
                          <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium ${typeConfig.bg} ${typeConfig.color} ${typeConfig.border} border`}>
                            <TypeIcon className="text-[9px]" />
                            {typeConfig.label}
                          </span>
                          
                          {/* Status Badge - Mobile Friendly */}
                          <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium ${statusConfig.bg} ${statusConfig.color} ${statusConfig.border} border`}>
                            <StatusIcon className="text-[9px]" />
                            {statusConfig.label}
                          </span>
                          
                          {/* Overdue / Refunded Tag */}
                          {order.overdueRefunded && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                              💸 Refunded
                            </span>
                          )}
                          {order.isOverdue && !order.overdueRefunded && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
                              ⚠️ Overdue
                            </span>
                          )}
                        </div>

                        {/* Editor Name */}
                        <p className="text-gray-500 text-[11px] mb-1.5">
                          Editor: <span className="text-gray-400 light:text-slate-600">{order.editor?.name}</span>
                        </p>

                        {/* Status Message */}
                        <p className="text-[10px] text-gray-600 mb-2">{getStatusMessage(order.status)}</p>

                        {/* Order Details Row */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] mb-3">
                          <span className="text-gray-600">#{order.orderNumber}</span>
                          <span className="flex items-center gap-0.5 text-emerald-400 font-medium">
                            <HiCurrencyRupee className="text-xs" />
                            {order.amount?.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-0.5 text-gray-500">
                            <HiCalendar className="text-xs" />
                            {formatDate(order.deadline)}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2">
                          {canChat && (
                            <button
                              onClick={() => navigate(`/chat/${order._id}`)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 rounded-lg text-[11px] font-medium transition-colors"
                            >
                              <HiChatAlt2 className="text-sm" />
                              Open Chat
                            </button>
                          )}
                          {order.status === "submitted" && (
                            <button
                              onClick={() => navigate(`/chat/${order._id}`)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 rounded-lg text-[11px] font-medium transition-colors"
                            >
                              <HiEye className="text-sm" />
                              Review Work
                            </button>
                          )}
                          {order.status === "new" && (
                            <span className="text-[10px] text-gray-600 italic">
                              Waiting for editor response...
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Arrow for larger screens */}
                      <HiChevronRight className="hidden md:block text-gray-600 group-hover:text-gray-400 transition-colors flex-shrink-0" />
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

export default ClientOrders;
