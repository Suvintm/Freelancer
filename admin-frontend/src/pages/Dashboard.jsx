// Dashboard.jsx - Main admin dashboard with stats and charts
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FaUsers,
  FaShoppingCart,
  FaRupeeSign,
  FaBriefcase,
  FaArrowUp,
  FaArrowDown,
  FaChartLine,
  FaUserPlus,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSync,
} from "react-icons/fa";
import { useAdmin } from "../context/AdminContext";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const Dashboard = () => {
  const { adminAxios } = useAdmin();
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsRes, chartsRes] = await Promise.all([
        adminAxios.get("/admin/stats"),
        adminAxios.get("/admin/analytics/charts?period=30"),
      ]);

      if (statsRes.data.success) setStats(statsRes.data.stats);
      if (chartsRes.data.success) setCharts(chartsRes.data.charts);
    } catch (err) {
      setError("Failed to load dashboard data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Stats cards configuration
  const statCards = stats ? [
    {
      title: "Total Users",
      value: stats.users.total.toLocaleString(),
      subtitle: `${stats.users.editors} editors • ${stats.users.clients} clients`,
      icon: FaUsers,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-500/10",
      change: stats.users.growth,
    },
    {
      title: "Total Orders",
      value: stats.orders.total.toLocaleString(),
      subtitle: `${stats.orders.active} active • ${stats.orders.completed} completed`,
      icon: FaShoppingCart,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-500/10",
      extra: stats.orders.disputed > 0 ? `${stats.orders.disputed} disputed` : null,
    },
    {
      title: "Total Revenue",
      value: `₹${stats.revenue.total.toLocaleString()}`,
      subtitle: `Platform Fees: ₹${stats.revenue.platformFees.toLocaleString()}`,
      icon: FaRupeeSign,
      color: "from-emerald-500 to-emerald-600",
      bgColor: "bg-emerald-500/10",
      monthly: `₹${stats.revenue.monthly.toLocaleString()} this month`,
    },
    {
      title: "Active Gigs",
      value: stats.gigs.active.toLocaleString(),
      subtitle: `${stats.gigs.total} total gigs`,
      icon: FaBriefcase,
      color: "from-amber-500 to-amber-600",
      bgColor: "bg-amber-500/10",
    },
  ] : [];

  // Order status colors for pie chart
  const STATUS_COLORS = {
    new: "#3b82f6",
    accepted: "#22c55e",
    in_progress: "#eab308",
    submitted: "#a855f7",
    completed: "#10b981",
    rejected: "#ef4444",
    cancelled: "#6b7280",
    disputed: "#f59e0b",
  };

  // Shimmer skeleton
  const ShimmerCard = () => (
    <div className="bg-dark-700 border border-dark-500 rounded-2xl p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-3 flex-1">
          <div className="h-4 w-24 shimmer rounded" />
          <div className="h-8 w-32 shimmer rounded" />
          <div className="h-3 w-40 shimmer rounded" />
        </div>
        <div className="w-12 h-12 shimmer rounded-xl" />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">Platform overview and analytics</p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-dark-700 border border-dark-500 rounded-xl text-gray-400 hover:text-white hover:border-purple-500 transition-all disabled:opacity-50"
        >
          <FaSync className={loading ? "animate-spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ShimmerCard />
          <ShimmerCard />
          <ShimmerCard />
          <ShimmerCard />
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-3 text-red-400">
            <FaExclamationTriangle />
            <span>{error}</span>
            <button onClick={fetchData} className="ml-auto underline">Retry</button>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((card, index) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-dark-700 border border-dark-500 rounded-2xl p-6 hover:border-purple-500/50 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">{card.title}</p>
                    <p className="text-2xl font-bold">{card.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${card.color} shadow-lg group-hover:scale-110 transition-transform`}>
                    <card.icon className="text-white text-lg" />
                  </div>
                </div>
                <p className="text-gray-500 text-xs">{card.subtitle}</p>
                {card.change !== undefined && (
                  <div className={`flex items-center gap-1 mt-2 text-xs ${card.change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {card.change >= 0 ? <FaArrowUp /> : <FaArrowDown />}
                    <span>{Math.abs(card.change)}% from last month</span>
                  </div>
                )}
                {card.monthly && (
                  <p className="text-emerald-400 text-xs mt-2">{card.monthly}</p>
                )}
                {card.extra && (
                  <p className="text-amber-400 text-xs mt-2 flex items-center gap-1">
                    <FaExclamationTriangle />
                    {card.extra}
                  </p>
                )}
              </motion.div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-dark-700 border border-dark-500 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold flex items-center gap-2">
                  <FaChartLine className="text-purple-400" />
                  Revenue Trend (30 Days)
                </h3>
              </div>
              <div className="h-64">
                {charts?.revenueByDay?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={charts.revenueByDay}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#262A3B" />
                      <XAxis
                        dataKey="_id"
                        stroke="#6b7280"
                        fontSize={10}
                        tickFormatter={(val) => val?.slice(5)}
                      />
                      <YAxis stroke="#6b7280" fontSize={10} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#111319",
                          border: "1px solid #262A3B",
                          borderRadius: "8px",
                        }}
                        formatter={(value) => [`₹${value.toLocaleString()}`, "Revenue"]}
                      />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#a855f7"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    No revenue data available
                  </div>
                )}
              </div>
            </motion.div>

            {/* Orders by Status Pie Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-dark-700 border border-dark-500 rounded-2xl p-6"
            >
              <h3 className="font-semibold mb-6 flex items-center gap-2">
                <FaShoppingCart className="text-blue-400" />
                Orders by Status
              </h3>
              <div className="h-64 flex items-center justify-center">
                {charts?.ordersByStatus?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={charts.ordersByStatus}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="count"
                        nameKey="_id"
                      >
                        {charts.ordersByStatus.map((entry, index) => (
                          <Cell key={index} fill={STATUS_COLORS[entry._id] || "#6b7280"} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#111319",
                          border: "1px solid #262A3B",
                          borderRadius: "8px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-gray-500">No order data available</div>
                )}
              </div>
              {/* Legend */}
              <div className="flex flex-wrap gap-2 mt-4 justify-center">
                {charts?.ordersByStatus?.map((entry) => (
                  <div key={entry._id} className="flex items-center gap-1.5 text-xs">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: STATUS_COLORS[entry._id] || "#6b7280" }}
                    />
                    <span className="text-gray-400 capitalize">{entry._id?.replace("_", " ")}</span>
                    <span className="text-white font-medium">({entry.count})</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Top Editors & Quick Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Editors */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="lg:col-span-2 bg-dark-700 border border-dark-500 rounded-2xl p-6"
            >
              <h3 className="font-semibold mb-6 flex items-center gap-2">
                <FaUsers className="text-emerald-400" />
                Top Editors by Revenue
              </h3>
              <div className="space-y-4">
                {charts?.topEditors?.slice(0, 5).map((editor, i) => (
                  <div key={editor._id || i} className="flex items-center gap-4 p-3 bg-dark-600 rounded-xl">
                    <span className="text-gray-500 text-sm w-6 font-bold">#{i + 1}</span>
                    <img
                      src={editor.profilePicture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                      alt={editor.name}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{editor.name}</p>
                      <p className="text-xs text-gray-500">{editor.orders} orders completed</p>
                    </div>
                    <span className="text-emerald-400 font-bold">
                      ₹{editor.totalEarnings?.toLocaleString()}
                    </span>
                  </div>
                ))}
                {(!charts?.topEditors || charts.topEditors.length === 0) && (
                  <div className="text-center text-gray-500 py-8">No editors data available</div>
                )}
              </div>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="space-y-4"
            >
              <div className="bg-dark-700 border border-dark-500 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <FaUserPlus className="text-blue-400" />
                  </div>
                  <span className="text-gray-400 text-sm">New Users (Month)</span>
                </div>
                <p className="text-3xl font-bold">{stats?.users.newThisMonth || 0}</p>
              </div>

              <div className="bg-dark-700 border border-dark-500 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-emerald-500/20">
                    <FaCheckCircle className="text-emerald-400" />
                  </div>
                  <span className="text-gray-400 text-sm">Completed Orders</span>
                </div>
                <p className="text-3xl font-bold">{stats?.orders.completed || 0}</p>
              </div>

              <div className="bg-dark-700 border border-dark-500 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <FaRupeeSign className="text-purple-400" />
                  </div>
                  <span className="text-gray-400 text-sm">Monthly Platform Fees</span>
                </div>
                <p className="text-3xl font-bold">₹{(stats?.revenue.monthlyPlatformFees || 0).toLocaleString()}</p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
