// Analytics.jsx - Advanced business analytics dashboard
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FaChartLine,
  FaRupeeSign,
  FaUsers,
  FaShoppingCart,
  FaBriefcase,
  FaArrowUp,
  FaArrowDown,
  FaSync,
  FaDownload,
  FaCalendar,
} from "react-icons/fa";
import { useAdmin } from "../context/AdminContext";
import { toast } from "react-toastify";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";

const Analytics = () => {
  const { adminAxios } = useAdmin();
  const [period, setPeriod] = useState("30");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("revenue");
  
  const [revenueData, setRevenueData] = useState(null);
  const [userData, setUserData] = useState(null);
  const [orderData, setOrderData] = useState(null);
  const [categoryData, setCategoryData] = useState(null);

  const periodOptions = [
    { value: "7", label: "Last 7 Days" },
    { value: "14", label: "Last 14 Days" },
    { value: "30", label: "Last 30 Days" },
    { value: "60", label: "Last 60 Days" },
    { value: "90", label: "Last 90 Days" },
  ];

  const tabs = [
    { id: "revenue", label: "Revenue", icon: FaRupeeSign },
    { id: "users", label: "Users", icon: FaUsers },
    { id: "orders", label: "Orders", icon: FaShoppingCart },
    { id: "categories", label: "Top Gigs", icon: FaBriefcase },
  ];

  const COLORS = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#6366f1"];

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [revenue, users, orders, categories] = await Promise.all([
        adminAxios.get(`/admin/analytics/revenue?period=${period}`),
        adminAxios.get(`/admin/analytics/users?period=${period}`),
        adminAxios.get(`/admin/analytics/orders?period=${period}`),
        adminAxios.get(`/admin/analytics/categories`),
      ]);

      if (revenue.data.success) setRevenueData(revenue.data.analytics);
      if (users.data.success) setUserData(users.data.analytics);
      if (orders.data.success) setOrderData(orders.data.analytics);
      if (categories.data.success) setCategoryData(categories.data.analytics);
    } catch (error) {
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, color, change }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-dark-700 border border-dark-500 rounded-2xl p-6 hover:border-purple-500/50 transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-gray-400 text-sm mb-1">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <div className={`p-3 rounded-xl bg-gradient-to-br ${color} shadow-lg`}>
          <Icon className="text-white text-lg" />
        </div>
      </div>
      {subtitle && <p className="text-gray-500 text-xs">{subtitle}</p>}
      {change !== undefined && (
        <div className={`flex items-center gap-1 mt-2 text-xs ${change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
          {change >= 0 ? <FaArrowUp /> : <FaArrowDown />}
          <span>{Math.abs(change)}% from previous period</span>
        </div>
      )}
    </motion.div>
  );

  const renderRevenueTab = () => (
    <div className="space-y-6">
      {/* Revenue Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={`₹${(revenueData?.summary?.totalRevenue || 0).toLocaleString()}`}
          subtitle={`${period} day period`}
          icon={FaRupeeSign}
          color="from-emerald-500 to-emerald-600"
          change={revenueData?.summary?.revenueGrowth}
        />
        <StatCard
          title="Platform Fees"
          value={`₹${(revenueData?.summary?.totalPlatformFees || 0).toLocaleString()}`}
          subtitle="Your earnings"
          icon={FaChartLine}
          color="from-purple-500 to-purple-600"
        />
        <StatCard
          title="Total Orders"
          value={revenueData?.summary?.totalOrders || 0}
          subtitle="Completed orders"
          icon={FaShoppingCart}
          color="from-blue-500 to-blue-600"
        />
        <StatCard
          title="Avg Order Value"
          value={`₹${(revenueData?.summary?.avgOrderValue || 0).toLocaleString()}`}
          subtitle="Per order"
          icon={FaRupeeSign}
          color="from-amber-500 to-amber-600"
        />
      </div>

      {/* Revenue Chart */}
      <div className="bg-dark-700 border border-dark-500 rounded-2xl p-6">
        <h3 className="font-semibold mb-6 flex items-center gap-2">
          <FaChartLine className="text-purple-400" />
          Daily Revenue Trend
        </h3>
        <div className="h-80">
          {revenueData?.dailyRevenue?.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData.dailyRevenue}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#262A3B" />
                <XAxis dataKey="_id" stroke="#6b7280" fontSize={10} tickFormatter={(v) => v?.slice(5)} />
                <YAxis stroke="#6b7280" fontSize={10} tickFormatter={(v) => `₹${v/1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#111319", border: "1px solid #262A3B", borderRadius: "8px" }}
                  formatter={(value) => [`₹${value.toLocaleString()}`, "Revenue"]}
                />
                <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">No data available</div>
          )}
        </div>
      </div>
    </div>
  );

  const renderUsersTab = () => (
    <div className="space-y-6">
      {/* User Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Users"
          value={userData?.summary?.totalUsers || 0}
          icon={FaUsers}
          color="from-blue-500 to-blue-600"
        />
        <StatCard
          title="New Users"
          value={userData?.summary?.newUsers || 0}
          subtitle={`Last ${period} days`}
          icon={FaUsers}
          color="from-emerald-500 to-emerald-600"
        />
        <StatCard
          title="Active Clients"
          value={userData?.summary?.activeClients || 0}
          subtitle="Placed orders"
          icon={FaUsers}
          color="from-purple-500 to-purple-600"
        />
        <StatCard
          title="Active Editors"
          value={userData?.summary?.activeEditors || 0}
          subtitle="Received orders"
          icon={FaUsers}
          color="from-amber-500 to-amber-600"
        />
        <StatCard
          title="Banned Users"
          value={userData?.summary?.bannedUsers || 0}
          icon={FaUsers}
          color="from-red-500 to-red-600"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Signups */}
        <div className="bg-dark-700 border border-dark-500 rounded-2xl p-6">
          <h3 className="font-semibold mb-6">Daily Signups</h3>
          <div className="h-64">
            {userData?.dailySignups?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={userData.dailySignups}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262A3B" />
                  <XAxis dataKey="_id" stroke="#6b7280" fontSize={10} tickFormatter={(v) => v?.slice(5)} />
                  <YAxis stroke="#6b7280" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: "#111319", border: "1px solid #262A3B", borderRadius: "8px" }} />
                  <Bar dataKey="editors" fill="#8b5cf6" name="Editors" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="clients" fill="#3b82f6" name="Clients" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">No data</div>
            )}
          </div>
        </div>

        {/* User Distribution */}
        <div className="bg-dark-700 border border-dark-500 rounded-2xl p-6">
          <h3 className="font-semibold mb-6">User Distribution</h3>
          <div className="h-64 flex items-center justify-center">
            {userData?.userDistribution?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={userData.userDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="_id"
                    label={({ _id, count }) => `${_id}: ${count}`}
                  >
                    {userData.userDistribution.map((entry, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "#111319", border: "1px solid #262A3B", borderRadius: "8px" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-gray-500">No data</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderOrdersTab = () => (
    <div className="space-y-6">
      {/* Order Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Orders"
          value={orderData?.summary?.totalOrders || 0}
          subtitle={`Last ${period} days`}
          icon={FaShoppingCart}
          color="from-blue-500 to-blue-600"
        />
        <StatCard
          title="Completed"
          value={orderData?.summary?.completedOrders || 0}
          icon={FaShoppingCart}
          color="from-emerald-500 to-emerald-600"
        />
        <StatCard
          title="Completion Rate"
          value={`${orderData?.summary?.completionRate || 0}%`}
          icon={FaChartLine}
          color="from-purple-500 to-purple-600"
        />
        <StatCard
          title="Avg Completion"
          value={`${orderData?.summary?.avgCompletionHours || 0}h`}
          subtitle="Hours to complete"
          icon={FaCalendar}
          color="from-amber-500 to-amber-600"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Orders */}
        <div className="bg-dark-700 border border-dark-500 rounded-2xl p-6">
          <h3 className="font-semibold mb-6">Daily Orders</h3>
          <div className="h-64">
            {orderData?.dailyOrders?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={orderData.dailyOrders}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262A3B" />
                  <XAxis dataKey="_id" stroke="#6b7280" fontSize={10} tickFormatter={(v) => v?.slice(5)} />
                  <YAxis stroke="#6b7280" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: "#111319", border: "1px solid #262A3B", borderRadius: "8px" }} />
                  <Line type="monotone" dataKey="total" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Total" />
                  <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} dot={false} name="Completed" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">No data</div>
            )}
          </div>
        </div>

        {/* Order Funnel */}
        <div className="bg-dark-700 border border-dark-500 rounded-2xl p-6">
          <h3 className="font-semibold mb-6">Order Status Distribution</h3>
          <div className="space-y-3">
            {orderData?.orderFunnel?.map((item, index) => (
              <div key={item._id} className="flex items-center gap-3">
                <div className="w-24 text-sm text-gray-400 capitalize">{item._id?.replace("_", " ")}</div>
                <div className="flex-1 bg-dark-600 rounded-full h-6 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(item.count / (orderData.summary?.totalOrders || 1)) * 100}%`,
                      backgroundColor: COLORS[index % COLORS.length],
                    }}
                  />
                </div>
                <div className="w-12 text-right text-sm font-medium">{item.count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderCategoriesTab = () => (
    <div className="space-y-6">
      {/* Gig Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Gigs"
          value={categoryData?.summary?.totalGigs || 0}
          icon={FaBriefcase}
          color="from-blue-500 to-blue-600"
        />
        <StatCard
          title="Active Gigs"
          value={categoryData?.summary?.activeGigs || 0}
          icon={FaBriefcase}
          color="from-emerald-500 to-emerald-600"
        />
        <StatCard
          title="Paused Gigs"
          value={categoryData?.summary?.pausedGigs || 0}
          icon={FaBriefcase}
          color="from-amber-500 to-amber-600"
        />
      </div>

      {/* Top Gigs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Revenue */}
        <div className="bg-dark-700 border border-dark-500 rounded-2xl p-6">
          <h3 className="font-semibold mb-6">Top Gigs by Revenue</h3>
          <div className="space-y-3">
            {categoryData?.topGigsByRevenue?.slice(0, 5).map((gig, index) => (
              <div key={gig._id} className="flex items-center gap-3 p-3 bg-dark-600 rounded-xl">
                <span className="w-6 h-6 flex items-center justify-center bg-purple-500/20 text-purple-400 text-xs font-bold rounded-lg">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{gig.title}</p>
                  <p className="text-xs text-gray-500">{gig.orders} orders</p>
                </div>
                <span className="text-emerald-400 font-bold">₹{gig.revenue?.toLocaleString()}</span>
              </div>
            ))}
            {(!categoryData?.topGigsByRevenue || categoryData.topGigsByRevenue.length === 0) && (
              <div className="text-center text-gray-500 py-4">No data available</div>
            )}
          </div>
        </div>

        {/* By Orders */}
        <div className="bg-dark-700 border border-dark-500 rounded-2xl p-6">
          <h3 className="font-semibold mb-6">Top Gigs by Orders</h3>
          <div className="space-y-3">
            {categoryData?.topGigsByOrders?.slice(0, 5).map((gig, index) => (
              <div key={gig._id} className="flex items-center gap-3 p-3 bg-dark-600 rounded-xl">
                <span className="w-6 h-6 flex items-center justify-center bg-blue-500/20 text-blue-400 text-xs font-bold rounded-lg">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{gig.title}</p>
                  <p className="text-xs text-gray-500">₹{gig.revenue?.toLocaleString()}</p>
                </div>
                <span className="text-blue-400 font-bold">{gig.orders} orders</span>
              </div>
            ))}
            {(!categoryData?.topGigsByOrders || categoryData.topGigsByOrders.length === 0) && (
              <div className="text-center text-gray-500 py-4">No data available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600">
              <FaChartLine className="text-white" />
            </div>
            Business Analytics
          </h1>
          <p className="text-gray-400 text-sm mt-1">Comprehensive platform insights and metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 bg-dark-700 border border-dark-500 rounded-xl text-white focus:border-purple-500 focus:outline-none"
          >
            {periodOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button
            onClick={fetchAnalytics}
            className="flex items-center gap-2 px-4 py-2 bg-dark-700 border border-dark-500 rounded-xl text-gray-400 hover:text-white transition-all"
          >
            <FaSync className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/20"
                : "bg-dark-700 text-gray-400 hover:text-white border border-dark-500"
            }`}
          >
            <tab.icon />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === "revenue" && renderRevenueTab()}
          {activeTab === "users" && renderUsersTab()}
          {activeTab === "orders" && renderOrdersTab()}
          {activeTab === "categories" && renderCategoriesTab()}
        </motion.div>
      )}
    </div>
  );
};

export default Analytics;
