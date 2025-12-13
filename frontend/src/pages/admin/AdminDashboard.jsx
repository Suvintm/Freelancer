// AdminDashboard.jsx - Main admin dashboard with stats and charts
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
} from "react-icons/fa";
import { useAdmin } from "../../context/AdminContext";
import AdminSidebar from "../../components/admin/AdminSidebar";
import AdminNavbar from "../../components/admin/AdminNavbar";

const AdminDashboard = () => {
  const { adminAxios } = useAdmin();
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
      value: stats.users.total,
      subtitle: `${stats.users.editors} editors • ${stats.users.clients} clients`,
      icon: FaUsers,
      color: "from-blue-500 to-blue-600",
      change: stats.users.growth,
    },
    {
      title: "Total Orders",
      value: stats.orders.total,
      subtitle: `${stats.orders.active} active • ${stats.orders.completed} completed`,
      icon: FaShoppingCart,
      color: "from-purple-500 to-purple-600",
      extra: stats.orders.disputed > 0 ? `${stats.orders.disputed} disputed` : null,
    },
    {
      title: "Total Revenue",
      value: `₹${stats.revenue.total.toLocaleString()}`,
      subtitle: `Platform Fees: ₹${stats.revenue.platformFees.toLocaleString()}`,
      icon: FaRupeeSign,
      color: "from-emerald-500 to-emerald-600",
      monthly: `₹${stats.revenue.monthly.toLocaleString()} this month`,
    },
    {
      title: "Active Gigs",
      value: stats.gigs.active,
      subtitle: `${stats.gigs.total} total gigs`,
      icon: FaBriefcase,
      color: "from-amber-500 to-amber-600",
    },
  ] : [];

  // Shimmer skeleton
  const ShimmerCard = () => (
    <div className="bg-[#111319] border border-[#262A3B] rounded-2xl p-6 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-3 flex-1">
          <div className="h-4 w-24 bg-[#1a1d25] rounded" />
          <div className="h-8 w-32 bg-[#1a1d25] rounded" />
          <div className="h-3 w-40 bg-[#1a1d25] rounded" />
        </div>
        <div className="w-12 h-12 bg-[#1a1d25] rounded-xl" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050509] text-white">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <AdminNavbar onMenuClick={() => setSidebarOpen(true)} />

      <main className="md:ml-64 pt-20 px-4 md:px-8 pb-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
          <p className="text-gray-400 text-sm">Overview of your platform</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <ShimmerCard />
            <ShimmerCard />
            <ShimmerCard />
            <ShimmerCard />
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 mb-8">
            <div className="flex items-center gap-3 text-red-400">
              <FaExclamationTriangle />
              <span>{error}</span>
            </div>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {statCards.map((card, index) => (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-[#111319] border border-[#262A3B] rounded-2xl p-6 hover:border-[#363A4B] transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">{card.title}</p>
                      <p className="text-2xl font-bold">{card.value}</p>
                    </div>
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${card.color}`}>
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

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Revenue Chart */}
              <div className="bg-[#111319] border border-[#262A3B] rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold flex items-center gap-2">
                    <FaChartLine className="text-purple-400" />
                    Revenue (Last 30 Days)
                  </h3>
                </div>
                <div className="h-64 flex items-end justify-between gap-1">
                  {charts?.revenueByDay?.slice(-15).map((day, i) => (
                    <div
                      key={day._id}
                      className="flex-1 bg-gradient-to-t from-purple-600 to-blue-600 rounded-t-sm opacity-80 hover:opacity-100 transition-opacity"
                      style={{ height: `${Math.max(20, (day.revenue / (charts.revenueByDay.reduce((a, b) => Math.max(a, b.revenue), 1))) * 100)}%` }}
                      title={`${day._id}: ₹${day.revenue.toLocaleString()}`}
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                  <span>15 days ago</span>
                  <span>Today</span>
                </div>
              </div>

              {/* Top Editors */}
              <div className="bg-[#111319] border border-[#262A3B] rounded-2xl p-6">
                <h3 className="font-semibold mb-6 flex items-center gap-2">
                  <FaUsers className="text-emerald-400" />
                  Top Editors by Revenue
                </h3>
                <div className="space-y-4">
                  {charts?.topEditors?.slice(0, 5).map((editor, i) => (
                    <div key={editor._id} className="flex items-center gap-4">
                      <span className="text-gray-500 text-sm w-5">{i + 1}</span>
                      <img
                        src={editor.profilePicture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                        alt={editor.name}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{editor.name}</p>
                        <p className="text-xs text-gray-500">{editor.orders} orders</p>
                      </div>
                      <span className="text-emerald-400 font-semibold">
                        ₹{editor.totalEarnings.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#111319] border border-[#262A3B] rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <FaUserPlus className="text-blue-400" />
                  </div>
                  <span className="text-gray-400 text-sm">New Users This Month</span>
                </div>
                <p className="text-3xl font-bold">{stats?.users.newThisMonth || 0}</p>
              </div>

              <div className="bg-[#111319] border border-[#262A3B] rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-emerald-500/20">
                    <FaCheckCircle className="text-emerald-400" />
                  </div>
                  <span className="text-gray-400 text-sm">Completed Orders</span>
                </div>
                <p className="text-3xl font-bold">{stats?.orders.completed || 0}</p>
              </div>

              <div className="bg-[#111319] border border-[#262A3B] rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <FaRupeeSign className="text-purple-400" />
                  </div>
                  <span className="text-gray-400 text-sm">Monthly Platform Fees</span>
                </div>
                <p className="text-3xl font-bold">₹{(stats?.revenue.monthlyPlatformFees || 0).toLocaleString()}</p>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
