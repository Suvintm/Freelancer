// AdminOrders.jsx - Order management page
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FaShoppingCart,
  FaSearch,
  FaFilter,
  FaEye,
  FaChevronLeft,
  FaChevronRight,
  FaRupeeSign,
  FaExclamationTriangle,
} from "react-icons/fa";
import { useAdmin } from "../../context/AdminContext";
import AdminSidebar from "../../components/admin/AdminSidebar";
import AdminNavbar from "../../components/admin/AdminNavbar";

const STATUS_CONFIG = {
  new: { label: "New", color: "text-blue-400", bg: "bg-blue-500/20" },
  accepted: { label: "Accepted", color: "text-green-400", bg: "bg-green-500/20" },
  in_progress: { label: "In Progress", color: "text-yellow-400", bg: "bg-yellow-500/20" },
  submitted: { label: "Submitted", color: "text-purple-400", bg: "bg-purple-500/20" },
  completed: { label: "Completed", color: "text-emerald-400", bg: "bg-emerald-500/20" },
  rejected: { label: "Rejected", color: "text-red-400", bg: "bg-red-500/20" },
  cancelled: { label: "Cancelled", color: "text-gray-400", bg: "bg-gray-500/20" },
  disputed: { label: "Disputed", color: "text-amber-400", bg: "bg-amber-500/20" },
};

const AdminOrders = () => {
  const { adminAxios } = useAdmin();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, [pagination.page, statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: 20,
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(search && { search }),
      });
      
      const res = await adminAxios.get(`/admin/orders?${params}`);
      if (res.data.success) {
        setOrders(res.data.orders);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination({ ...pagination, page: 1 });
    fetchOrders();
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const res = await adminAxios.patch(`/admin/orders/${orderId}/status`, {
        status: newStatus,
      });
      if (res.data.success) {
        setOrders(orders.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
        if (selectedOrder?._id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
      }
    } catch (err) {
      console.error("Failed to update order status:", err);
    }
  };

  const ShimmerRow = () => (
    <tr className="animate-pulse">
      <td className="p-4"><div className="h-4 w-24 bg-[#1a1d25] rounded" /></td>
      <td className="p-4"><div className="h-4 w-40 bg-[#1a1d25] rounded" /></td>
      <td className="p-4"><div className="h-4 w-28 bg-[#1a1d25] rounded" /></td>
      <td className="p-4"><div className="h-4 w-28 bg-[#1a1d25] rounded" /></td>
      <td className="p-4"><div className="h-6 w-20 bg-[#1a1d25] rounded-full" /></td>
      <td className="p-4"><div className="h-4 w-16 bg-[#1a1d25] rounded" /></td>
      <td className="p-4"><div className="h-8 w-16 bg-[#1a1d25] rounded" /></td>
    </tr>
  );

  return (
    <div className="min-h-screen bg-[#050509] text-white">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <AdminNavbar onMenuClick={() => setSidebarOpen(true)} />

      <main className="md:ml-64 pt-20 px-4 md:px-8 pb-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <FaShoppingCart className="text-purple-400" />
              Orders Management
            </h1>
            <p className="text-gray-400 text-sm mt-1">{pagination.total} total orders</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-[#111319] border border-[#262A3B] rounded-2xl p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search by order number or title..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-[#0a0a0e] border border-[#262A3B] rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500"
                />
              </div>
            </form>

            <div className="flex items-center gap-2">
              <FaFilter className="text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPagination({ ...pagination, page: 1 }); }}
                className="bg-[#0a0a0e] border border-[#262A3B] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
              >
                <option value="all">All Statuses</option>
                {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-[#111319] border border-[#262A3B] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#262A3B] text-left text-gray-400 text-sm">
                  <th className="p-4">Order #</th>
                  <th className="p-4">Title</th>
                  <th className="p-4">Client</th>
                  <th className="p-4">Editor</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(5)].map((_, i) => <ShimmerRow key={i} />)
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                      No orders found
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => {
                    const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.new;
                    return (
                      <motion.tr
                        key={order._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="border-b border-[#262A3B] hover:bg-white/5 transition-colors"
                      >
                        <td className="p-4">
                          <span className="text-purple-400 font-mono text-sm">{order.orderNumber}</span>
                        </td>
                        <td className="p-4">
                          <p className="font-medium truncate max-w-[200px]">{order.title}</p>
                          <p className="text-xs text-gray-500">{order.type}</p>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <img
                              src={order.client?.profilePicture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                              alt=""
                              className="w-8 h-8 rounded-lg object-cover"
                            />
                            <span className="text-sm">{order.client?.name}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <img
                              src={order.editor?.profilePicture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                              alt=""
                              className="w-8 h-8 rounded-lg object-cover"
                            />
                            <span className="text-sm">{order.editor?.name}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                            {statusConfig.label}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="flex items-center gap-1 text-emerald-400">
                            <FaRupeeSign className="text-xs" />
                            {order.amount?.toLocaleString()}
                          </span>
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                          >
                            <FaEye />
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-[#262A3B]">
              <p className="text-gray-400 text-sm">
                Page {pagination.page} of {pagination.pages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                  className="p-2 bg-[#1a1d25] rounded-lg text-gray-400 hover:text-white disabled:opacity-50"
                >
                  <FaChevronLeft />
                </button>
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page === pagination.pages}
                  className="p-2 bg-[#1a1d25] rounded-lg text-gray-400 hover:text-white disabled:opacity-50"
                >
                  <FaChevronRight />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Order Detail Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#111319] border border-[#262A3B] rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
            >
              <h3 className="text-xl font-bold mb-4">{selectedOrder.title}</h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Order Number</span>
                  <span className="text-purple-400 font-mono">{selectedOrder.orderNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Amount</span>
                  <span className="text-emerald-400">₹{selectedOrder.amount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Platform Fee</span>
                  <span>₹{selectedOrder.platformFee?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Status</span>
                  <select
                    value={selectedOrder.status}
                    onChange={(e) => handleStatusChange(selectedOrder._id, e.target.value)}
                    className="bg-[#1a1d25] border border-[#262A3B] rounded-lg px-3 py-1 text-sm"
                  >
                    {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                      <option key={key} value={key}>{val.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Created</span>
                  <span>{new Date(selectedOrder.createdAt).toLocaleString()}</span>
                </div>
                <div className="pt-4 border-t border-[#262A3B]">
                  <p className="text-gray-400 text-sm mb-2">Description</p>
                  <p className="text-sm">{selectedOrder.description}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="w-full py-3 bg-[#1a1d25] rounded-xl text-gray-400 hover:text-white transition-colors"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminOrders;
