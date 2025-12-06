import { useState } from "react";
import {
  FaCheckCircle,
  FaHourglassHalf,
  FaTimesCircle,
  FaInbox,
} from "react-icons/fa";
import { useAppContext } from "../context/AppContext";
import Sidebar from "../components/Sidebar.jsx";
import EditorNavbar from "../components/EditorNavbar.jsx";
import EmptyState from "../components/EmptyState.jsx";

// Mock orders data - Replace with actual API calls later
const mockOrders = [];

const statusConfig = {
  pending: { icon: FaHourglassHalf, color: "text-yellow-500", bg: "bg-yellow-50" },
  in_progress: { icon: FaHourglassHalf, color: "text-blue-500", bg: "bg-blue-50" },
  completed: { icon: FaCheckCircle, color: "text-green-500", bg: "bg-green-50" },
  cancelled: { icon: FaTimesCircle, color: "text-red-500", bg: "bg-red-50" },
};

const EditorMyorderspage = () => {
  const { user } = useAppContext();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [orders] = useState(mockOrders);

  const filteredOrders = activeFilter === "all"
    ? orders
    : orders.filter((o) => o.status === activeFilter);

  const filters = [
    { id: "all", label: "All Orders" },
    { id: "pending", label: "Pending" },
    { id: "in_progress", label: "In Progress" },
    { id: "completed", label: "Completed" },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-100">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Navbar */}
      <EditorNavbar onMenuClick={() => setSidebarOpen(true)} />

      {/* Main Content */}
      <main className="flex-1 px-4 md:px-6 py-6 md:ml-64 md:mt-16">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">My Orders</h1>
          <p className="text-gray-600 mt-1">
            Manage and track all your orders in one place
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeFilter === filter.id
                  ? "bg-green-500 text-white shadow-md"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Orders List */}
        <div className="bg-white rounded-xl shadow-sm">
          {filteredOrders.length === 0 ? (
            <EmptyState
              icon={FaInbox}
              title="No orders yet"
              description="Once clients start placing orders, they'll appear here. Complete your profile to get noticed!"
            />
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredOrders.map((order) => {
                const StatusIcon = statusConfig[order.status]?.icon || FaHourglassHalf;
                const statusColor = statusConfig[order.status]?.color || "text-gray-500";
                const statusBg = statusConfig[order.status]?.bg || "bg-gray-50";

                return (
                  <div
                    key={order.id}
                    className="p-4 hover:bg-gray-50 transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">
                          {order.title}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Client: {order.client}
                        </p>
                        <p className="text-sm text-gray-400">
                          {order.date}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-green-600">
                          ${order.amount}
                        </span>
                        <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${statusBg} ${statusColor}`}>
                          <StatusIcon className="text-xs" />
                          {order.status.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default EditorMyorderspage;
