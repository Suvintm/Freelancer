// ClientOrders.jsx - Client's order management page
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
  FaShoppingCart,
  FaEnvelope,
  FaCalendarAlt,
  FaEye,
} from "react-icons/fa";
import { useAppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import ClientSidebar from "../components/ClientSidebar.jsx";
import ClientNavbar from "../components/ClientNavbar.jsx";

const STATUS_CONFIG = {
  new: { label: "Pending", color: "text-blue-400", bg: "bg-blue-500/20", icon: FaClock },
  accepted: { label: "Accepted", color: "text-green-400", bg: "bg-green-500/20", icon: FaCheck },
  in_progress: { label: "In Progress", color: "text-yellow-400", bg: "bg-yellow-500/20", icon: FaClock },
  submitted: { label: "Submitted", color: "text-purple-400", bg: "bg-purple-500/20", icon: FaCheck },
  completed: { label: "Completed", color: "text-emerald-400", bg: "bg-emerald-500/20", icon: FaCheck },
  rejected: { label: "Rejected", color: "text-red-400", bg: "bg-red-500/20", icon: FaTimes },
  cancelled: { label: "Cancelled", color: "text-gray-400", bg: "bg-gray-500/20", icon: FaTimes },
  disputed: { label: "Disputed", color: "text-orange-400", bg: "bg-orange-500/20", icon: FaExclamationTriangle },
};

const ClientOrders = () => {
  const { backendURL, user } = useAppContext();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusMessage = (status) => {
    switch (status) {
      case "new": return "Waiting for editor to accept";
      case "accepted": return "Editor has accepted, work will begin soon";
      case "in_progress": return "Editor is working on your project";
      case "submitted": return "Editor has submitted, please review";
      case "completed": return "Project completed successfully";
      case "rejected": return "Editor declined this order";
      default: return "";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col md:flex-row bg-[#050509] text-white">
        <ClientSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <ClientNavbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 flex items-center justify-center md:ml-64 md:mt-20">
          <div className="flex flex-col items-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full"
            />
            <p className="mt-4 text-gray-400 text-sm">Loading your orders...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#050509] light:bg-slate-50 text-white light:text-slate-900 transition-colors duration-200">
      <ClientSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <ClientNavbar onMenuClick={() => setSidebarOpen(true)} />

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
                ? "bg-emerald-600 text-white"
                : "bg-[#111319] text-gray-400 hover:bg-[#1a1d25]"
            }`}
          >
            All
          </button>
          {Object.entries(STATUS_CONFIG).map(([key, config]) => {
            const count = orders.filter(o => o.status === key).length;
            if (key === "cancelled" || key === "disputed") return null; // Hide cancelled/disputed
            return (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                  statusFilter === key
                    ? `${config.bg} ${config.color} border border-current`
                    : "bg-[#111319] text-gray-400 hover:bg-[#1a1d25]"
                }`}
              >
                {config.label}
                {count > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    statusFilter === key ? "bg-white/20" : "bg-gray-700"
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
            <FaComments className="text-6xl text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No orders yet</h3>
            <p className="text-gray-400 text-sm mb-4">Start by browsing editors or gigs</p>
            <button
              onClick={() => navigate("/client-home")}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-xl font-medium transition-all"
            >
              Explore Editors
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {orders.map((order, index) => {
                const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.new;
                const StatusIcon = statusConfig.icon;
                const canChat = ["accepted", "in_progress", "submitted", "completed"].includes(order.status);

                return (
                  <motion.div
                    key={order._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-[#111319] border border-[#262A3B] rounded-2xl p-5 hover:border-emerald-500/30 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      {/* Editor Avatar */}
                      <img
                        src={order.editor?.profilePicture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                        alt={order.editor?.name}
                        className="w-14 h-14 rounded-xl object-cover"
                      />

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-white">{order.title}</h3>
                              {/* Order Type Tag */}
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                order.type === "gig" 
                                  ? "bg-purple-500/20 text-purple-400"
                                  : "bg-cyan-500/20 text-cyan-400"
                              }`}>
                                {order.type === "gig" ? (
                                  <><FaShoppingCart className="inline mr-1 text-[8px]" />Gig</>
                                ) : (
                                  <><FaEnvelope className="inline mr-1 text-[8px]" />Request</>
                                )}
                              </span>
                            </div>
                            <p className="text-gray-400 text-sm">
                              Editor: {order.editor?.name}
                            </p>
                          </div>

                          {/* Status Badge */}
                          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${statusConfig.bg} ${statusConfig.color} text-xs font-medium`}>
                            <StatusIcon className="text-xs" />
                            {statusConfig.label}
                          </div>
                        </div>

                        {/* Status Message */}
                        <p className="text-xs text-gray-500 mb-3">{getStatusMessage(order.status)}</p>

                        {/* Order Details */}
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <span className="text-gray-500">#{order.orderNumber}</span>
                          <span className="flex items-center gap-1 text-green-400 font-medium">
                            <FaRupeeSign /> {order.amount}
                          </span>
                          <span className="flex items-center gap-1">
                            <FaCalendarAlt className="text-orange-400" />
                            {formatDate(order.deadline)}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 mt-4">
                          {canChat && (
                            <button
                              onClick={() => navigate(`/chat/${order._id}`)}
                              className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-xl text-sm font-medium transition-all"
                            >
                              <FaComments />
                              Open Chat
                            </button>
                          )}
                          {order.status === "submitted" && (
                            <button
                              onClick={() => navigate(`/chat/${order._id}`)}
                              className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 rounded-xl text-sm font-medium transition-all"
                            >
                              <FaEye />
                              Review Work
                            </button>
                          )}
                        </div>
                      </div>
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
