// AdminActivity.jsx - Activity logs page
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FaHistory,
  FaChevronLeft,
  FaChevronRight,
  FaUser,
  FaSignInAlt,
  FaSignOutAlt,
  FaKey,
  FaEdit,
} from "react-icons/fa";
import { useAdmin } from "../../context/AdminContext";
import AdminSidebar from "../../components/admin/AdminSidebar";
import AdminNavbar from "../../components/admin/AdminNavbar";

const ACTION_ICONS = {
  LOGIN: FaSignInAlt,
  LOGOUT: FaSignOutAlt,
  PASSWORD_CHANGE: FaKey,
  USER_STATUS_CHANGE: FaUser,
  ORDER_STATUS_CHANGE: FaEdit,
  GIG_STATUS_CHANGE: FaEdit,
};

const ACTION_COLORS = {
  LOGIN: "text-emerald-400 bg-emerald-500/20",
  LOGOUT: "text-gray-400 bg-gray-500/20",
  PASSWORD_CHANGE: "text-amber-400 bg-amber-500/20",
  USER_STATUS_CHANGE: "text-blue-400 bg-blue-500/20",
  ORDER_STATUS_CHANGE: "text-purple-400 bg-purple-500/20",
  GIG_STATUS_CHANGE: "text-pink-400 bg-pink-500/20",
};

const AdminActivity = () => {
  const { adminAxios } = useAdmin();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  useEffect(() => {
    fetchLogs();
  }, [pagination.page]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await adminAxios.get(`/admin/activity-logs?page=${pagination.page}&limit=50`);
      if (res.data.success) {
        setLogs(res.data.logs);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error("Failed to fetch activity logs:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  };

  const ShimmerRow = () => (
    <div className="p-4 border-b border-[#262A3B] animate-pulse flex items-start gap-4">
      <div className="w-10 h-10 bg-[#1a1d25] rounded-lg" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-48 bg-[#1a1d25] rounded" />
        <div className="h-3 w-32 bg-[#1a1d25] rounded" />
      </div>
      <div className="h-4 w-20 bg-[#1a1d25] rounded" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050509] text-white">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <AdminNavbar onMenuClick={() => setSidebarOpen(true)} />

      <main className="md:ml-64 pt-20 px-4 md:px-8 pb-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <FaHistory className="text-amber-400" />
            Activity Logs
          </h1>
          <p className="text-gray-400 text-sm mt-1">Track all admin actions and activities</p>
        </div>

        {/* Activity List */}
        <div className="bg-[#111319] border border-[#262A3B] rounded-2xl overflow-hidden">
          {loading ? (
            [...Array(10)].map((_, i) => <ShimmerRow key={i} />)
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <FaHistory className="text-4xl mx-auto mb-4 opacity-50" />
              <p>No activity logs found</p>
            </div>
          ) : (
            <div className="divide-y divide-[#262A3B]">
              {logs.map((log, index) => {
                const Icon = ACTION_ICONS[log.action] || FaEdit;
                const colorClass = ACTION_COLORS[log.action] || "text-gray-400 bg-gray-500/20";
                
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="p-4 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`p-2.5 rounded-lg ${colorClass.split(" ")[1]}`}>
                        <Icon className={colorClass.split(" ")[0]} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{log.adminName}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${colorClass}`}>
                            {log.action?.replace(/_/g, " ")}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 truncate">{log.details}</p>
                        <p className="text-xs text-gray-600 mt-1">
                          IP: {log.ip || "Unknown"}
                        </p>
                      </div>

                      {/* Time */}
                      <div className="text-right">
                        <p className="text-sm text-gray-400">{formatDate(log.timestamp)}</p>
                        <p className="text-xs text-gray-600">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

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
      </main>
    </div>
  );
};

export default AdminActivity;
