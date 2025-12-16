// ClientAnalytics.jsx - Client analytics dashboard
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FaChartLine,
  FaRupeeSign,
  FaShoppingCart,
  FaCheckCircle,
  FaClock,
  FaArrowUp,
  FaArrowDown,
  FaSync,
  FaHeart,
  FaClipboardList,
} from "react-icons/fa";
import { useAppContext } from "../context/AppContext";
import axios from "axios";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import Navbar from "../components/Navbar";

const ClientAnalytics = () => {
  const { backendURL, token } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);

  const COLORS = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#6366f1", "#ec4899"];

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${backendURL}/api/client/analytics/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        setAnalytics(res.data.analytics);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, gradient, change }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-[#0f0f13] to-[#0a0a0e] border border-[#1a1a22] rounded-2xl p-6 hover:border-purple-500/30 transition-all relative overflow-hidden group"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5 group-hover:opacity-10 transition-opacity`} />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient}`}>
            <Icon className="text-white text-xl" />
          </div>
          {change !== undefined && change !== 0 && (
            <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${change >= 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
              {change >= 0 ? <FaArrowUp size={10} /> : <FaArrowDown size={10} />}
              {Math.abs(change)}%
            </div>
          )}
        </div>
        <p className="text-3xl font-bold text-white mb-1">{value}</p>
        <p className="text-gray-500 text-sm">{title}</p>
        {subtitle && <p className="text-gray-600 text-xs mt-1">{subtitle}</p>}
      </div>
    </motion.div>
  );

  const getStatusLabel = (status) => {
    const labels = {
      new: "Pending",
      accepted: "Accepted",
      in_progress: "In Progress",
      submitted: "Under Review",
      completed: "Completed",
      cancelled: "Cancelled",
      disputed: "Disputed",
    };
    return labels[status] || status;
  };

  const getStatusColor = (status) => {
    const colors = {
      new: "text-blue-400",
      accepted: "text-cyan-400",
      in_progress: "text-yellow-400",
      submitted: "text-purple-400",
      completed: "text-emerald-400",
      cancelled: "text-red-400",
      disputed: "text-orange-400",
    };
    return colors[status] || "text-gray-400";
  };

  return (
    <div className="min-h-screen bg-[#050509] light:bg-slate-50 transition-colors duration-200">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600">
                <FaChartLine className="text-white" />
              </div>
              My Analytics
            </h1>
            <p className="text-gray-400 text-sm mt-1">Track your orders and spending</p>
          </div>
          <button
            onClick={fetchAnalytics}
            className="flex items-center gap-2 px-4 py-2 bg-[#0f0f13] border border-[#1a1a22] rounded-xl text-gray-400 hover:text-white transition-colors"
          >
            <FaSync className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Orders"
                value={analytics?.totalOrders || 0}
                icon={FaShoppingCart}
                gradient="from-blue-500 to-cyan-600"
              />
              <StatCard
                title="Active Orders"
                value={analytics?.activeOrders || 0}
                icon={FaClock}
                gradient="from-amber-500 to-orange-600"
              />
              <StatCard
                title="Completed"
                value={analytics?.completedOrders || 0}
                icon={FaCheckCircle}
                gradient="from-emerald-500 to-green-600"
              />
              <StatCard
                title="Total Spent"
                value={`₹${(analytics?.totalSpent || 0).toLocaleString()}`}
                icon={FaRupeeSign}
                gradient="from-purple-500 to-violet-600"
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Spending Chart */}
              <div className="lg:col-span-2 bg-gradient-to-br from-[#0f0f13] to-[#0a0a0e] border border-[#1a1a22] rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                  <FaRupeeSign className="text-purple-400" />
                  Spending Trend (30 Days)
                </h3>
                <div className="h-72">
                  {analytics?.dailySpending?.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analytics.dailySpending}>
                        <defs>
                          <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1a1a22" />
                        <XAxis dataKey="_id" stroke="#6b7280" fontSize={10} tickFormatter={(v) => v?.slice(5)} />
                        <YAxis stroke="#6b7280" fontSize={10} tickFormatter={(v) => `₹${v/1000}k`} />
                        <Tooltip
                          contentStyle={{ backgroundColor: "#0f0f13", border: "1px solid #1a1a22", borderRadius: "12px" }}
                          formatter={(value) => [`₹${value.toLocaleString()}`, "Spent"]}
                        />
                        <Area type="monotone" dataKey="spent" stroke="#8b5cf6" strokeWidth={2} fill="url(#colorSpent)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-600">
                      Complete orders to see your spending trend
                    </div>
                  )}
                </div>
              </div>

              {/* Status Distribution */}
              <div className="bg-gradient-to-br from-[#0f0f13] to-[#0a0a0e] border border-[#1a1a22] rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                  <FaShoppingCart className="text-blue-400" />
                  Order Status
                </h3>
                <div className="h-56">
                  {analytics?.statusDistribution?.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics.statusDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="count"
                          nameKey="_id"
                        >
                          {analytics.statusDistribution.map((entry, index) => (
                            <Cell key={entry._id} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: "#0f0f13", border: "1px solid #1a1a22", borderRadius: "8px" }}
                          formatter={(value, name) => [value, getStatusLabel(name)]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-600">
                      No orders yet
                    </div>
                  )}
                </div>
                {/* Legend */}
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {analytics?.statusDistribution?.map((item, index) => (
                    <div key={item._id} className="flex items-center gap-2 text-xs">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="text-gray-400">{getStatusLabel(item._id)}: {item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Favorite Editors */}
              <div className="bg-gradient-to-br from-[#0f0f13] to-[#0a0a0e] border border-[#1a1a22] rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                  <FaHeart className="text-pink-400" />
                  Favorite Editors
                </h3>
                <div className="space-y-4">
                  {analytics?.favoriteEditors?.length > 0 ? (
                    analytics.favoriteEditors.map((editor, index) => (
                      <div key={editor._id || index} className="flex items-center gap-4 p-4 bg-[#0a0a0e] rounded-xl">
                        <span className="w-8 h-8 flex items-center justify-center bg-purple-500/20 text-purple-400 text-sm font-bold rounded-lg">
                          {index + 1}
                        </span>
                        <img
                          src={editor.profilePicture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                          className="w-12 h-12 rounded-full object-cover border-2 border-purple-500/30"
                          alt=""
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white truncate">{editor.name}</p>
                          <p className="text-sm text-gray-500">{editor.orders} orders together</p>
                        </div>
                        <div className="text-right">
                          <p className="text-emerald-400 font-bold">₹{editor.spent?.toLocaleString()}</p>
                          <p className="text-gray-600 text-xs">total spent</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-600 py-8">
                      Complete orders to see your favorite editors
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-gradient-to-br from-[#0f0f13] to-[#0a0a0e] border border-[#1a1a22] rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                  <FaClipboardList className="text-emerald-400" />
                  Recent Orders
                </h3>
                <div className="space-y-4">
                  {analytics?.recentOrders?.length > 0 ? (
                    analytics.recentOrders.map((order) => (
                      <div key={order._id} className="flex items-center gap-4 p-4 bg-[#0a0a0e] rounded-xl">
                        <img
                          src={order.editor?.profilePicture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                          className="w-12 h-12 rounded-full object-cover"
                          alt=""
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white truncate">{order.gig?.title || "Order"}</p>
                          <p className={`text-sm ${getStatusColor(order.status)}`}>
                            {getStatusLabel(order.status)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-medium">₹{order.amount?.toLocaleString()}</p>
                          <p className="text-gray-600 text-xs">
                            {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-600 py-8">
                      No orders yet
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ClientAnalytics;
