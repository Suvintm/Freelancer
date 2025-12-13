// EditorAnalytics.jsx - Editor analytics dashboard
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FaChartLine,
  FaRupeeSign,
  FaShoppingCart,
  FaBriefcase,
  FaStar,
  FaArrowUp,
  FaArrowDown,
  FaSync,
  FaClock,
  FaCheckCircle,
  FaMedal,
  FaUserCheck,
} from "react-icons/fa";
import { useAppContext } from "../context/AppContext";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from "recharts";
import Navbar from "../components/Navbar";

const EditorAnalytics = () => {
  const { backendURL, token } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30");
  const [activeTab, setActiveTab] = useState("earnings");
  
  const [earnings, setEarnings] = useState(null);
  const [orders, setOrders] = useState(null);
  const [gigs, setGigs] = useState(null);
  const [profile, setProfile] = useState(null);

  const periodOptions = [
    { value: "7", label: "7 Days" },
    { value: "14", label: "14 Days" },
    { value: "30", label: "30 Days" },
    { value: "60", label: "60 Days" },
  ];

  const tabs = [
    { id: "earnings", label: "Earnings", icon: FaRupeeSign },
    { id: "orders", label: "Orders", icon: FaShoppingCart },
    { id: "gigs", label: "My Gigs", icon: FaBriefcase },
    { id: "profile", label: "Profile", icon: FaStar },
  ];

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [earningsRes, ordersRes, gigsRes, profileRes] = await Promise.all([
        fetch(`${backendURL}/editor/analytics/earnings?period=${period}`, { headers }),
        fetch(`${backendURL}/editor/analytics/orders?period=${period}`, { headers }),
        fetch(`${backendURL}/editor/analytics/gigs`, { headers }),
        fetch(`${backendURL}/editor/analytics/profile`, { headers }),
      ]);

      const [earningsData, ordersData, gigsData, profileData] = await Promise.all([
        earningsRes.json(),
        ordersRes.json(),
        gigsRes.json(),
        profileRes.json(),
      ]);

      if (earningsData.success) setEarnings(earningsData.analytics);
      if (ordersData.success) setOrders(ordersData.analytics);
      if (gigsData.success) setGigs(gigsData.analytics);
      if (profileData.success) setProfile(profileData.analytics);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, color, change, small }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-[#0f0f13] border border-[#1a1a22] rounded-2xl ${small ? "p-4" : "p-6"} hover:border-purple-500/30 transition-all`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-gray-400 text-sm mb-1">{title}</p>
          <p className={`${small ? "text-xl" : "text-2xl"} font-bold text-white`}>{value}</p>
        </div>
        <div className={`p-3 rounded-xl bg-gradient-to-br ${color}`}>
          <Icon className="text-white text-lg" />
        </div>
      </div>
      {subtitle && <p className="text-gray-500 text-xs">{subtitle}</p>}
      {change !== undefined && change !== 0 && (
        <div className={`flex items-center gap-1 mt-2 text-xs ${change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
          {change >= 0 ? <FaArrowUp /> : <FaArrowDown />}
          <span>{Math.abs(change)}% vs previous period</span>
        </div>
      )}
    </motion.div>
  );

  const renderEarningsTab = () => (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Earnings"
          value={`₹${(earnings?.totalEarnings || 0).toLocaleString()}`}
          subtitle="Lifetime"
          icon={FaRupeeSign}
          color="from-emerald-500 to-emerald-600"
        />
        <StatCard
          title={`Last ${period} Days`}
          value={`₹${(earnings?.periodEarnings || 0).toLocaleString()}`}
          icon={FaChartLine}
          color="from-purple-500 to-purple-600"
          change={earnings?.growthPercent}
        />
        <StatCard
          title="Pending"
          value={`₹${(earnings?.pendingEarnings || 0).toLocaleString()}`}
          subtitle={`${earnings?.pendingOrders || 0} orders in progress`}
          icon={FaClock}
          color="from-amber-500 to-amber-600"
        />
        <StatCard
          title="Orders"
          value={earnings?.totalOrders || 0}
          subtitle="Total completed"
          icon={FaCheckCircle}
          color="from-blue-500 to-blue-600"
        />
      </div>

      {/* Earnings Chart */}
      <div className="bg-[#0f0f13] border border-[#1a1a22] rounded-2xl p-6">
        <h3 className="font-semibold text-white mb-6 flex items-center gap-2">
          <FaChartLine className="text-purple-400" />
          Daily Earnings
        </h3>
        <div className="h-72">
          {earnings?.dailyEarnings?.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={earnings.dailyEarnings}>
                <defs>
                  <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a22" />
                <XAxis dataKey="_id" stroke="#6b7280" fontSize={10} tickFormatter={(v) => v?.slice(5)} />
                <YAxis stroke="#6b7280" fontSize={10} tickFormatter={(v) => `₹${v/1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f0f13", border: "1px solid #1a1a22", borderRadius: "12px" }}
                  formatter={(value) => [`₹${value.toLocaleString()}`, "Earnings"]}
                />
                <Area type="monotone" dataKey="earnings" stroke="#8b5cf6" strokeWidth={2} fill="url(#colorEarnings)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              No earnings data yet. Complete orders to see your earnings chart!
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderOrdersTab = () => (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Orders"
          value={orders?.totalOrders || 0}
          icon={FaShoppingCart}
          color="from-blue-500 to-blue-600"
        />
        <StatCard
          title="Completed"
          value={orders?.completedOrders || 0}
          icon={FaCheckCircle}
          color="from-emerald-500 to-emerald-600"
        />
        <StatCard
          title="Completion Rate"
          value={`${orders?.completionRate || 0}%`}
          icon={FaChartLine}
          color="from-purple-500 to-purple-600"
        />
        <StatCard
          title="Active Orders"
          value={orders?.activeOrders || 0}
          icon={FaClock}
          color="from-amber-500 to-amber-600"
        />
      </div>

      {/* Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0f0f13] border border-[#1a1a22] rounded-2xl p-6">
          <h3 className="font-semibold text-white mb-6">Response Time</h3>
          <div className="text-center">
            <p className="text-5xl font-bold text-purple-400">{orders?.avgResponseHours || 0}h</p>
            <p className="text-gray-400 mt-2">Average response time</p>
            <p className="text-xs text-gray-500 mt-1">Time from order received to accepted</p>
          </div>
        </div>

        <div className="bg-[#0f0f13] border border-[#1a1a22] rounded-2xl p-6">
          <h3 className="font-semibold text-white mb-6">Completion Time</h3>
          <div className="text-center">
            <p className="text-5xl font-bold text-emerald-400">{orders?.avgCompletionHours || 0}h</p>
            <p className="text-gray-400 mt-2">Average delivery time</p>
            <p className="text-xs text-gray-500 mt-1">Time from order start to completion</p>
          </div>
        </div>
      </div>

      {/* Daily Orders Chart */}
      <div className="bg-[#0f0f13] border border-[#1a1a22] rounded-2xl p-6">
        <h3 className="font-semibold text-white mb-6">Daily Orders</h3>
        <div className="h-64">
          {orders?.dailyOrders?.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={orders.dailyOrders}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a22" />
                <XAxis dataKey="_id" stroke="#6b7280" fontSize={10} tickFormatter={(v) => v?.slice(5)} />
                <YAxis stroke="#6b7280" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: "#0f0f13", border: "1px solid #1a1a22", borderRadius: "12px" }} />
                <Bar dataKey="total" fill="#3b82f6" name="Orders" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" fill="#10b981" name="Completed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">No order data yet</div>
          )}
        </div>
      </div>
    </div>
  );

  const renderGigsTab = () => (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          title="Total Gigs"
          value={gigs?.totalGigs || 0}
          icon={FaBriefcase}
          color="from-blue-500 to-blue-600"
          small
        />
        <StatCard
          title="Active"
          value={gigs?.activeGigs || 0}
          icon={FaCheckCircle}
          color="from-emerald-500 to-emerald-600"
          small
        />
        <StatCard
          title="Paused"
          value={gigs?.pausedGigs || 0}
          icon={FaClock}
          color="from-gray-500 to-gray-600"
          small
        />
      </div>

      {/* Top Gigs */}
      <div className="bg-[#0f0f13] border border-[#1a1a22] rounded-2xl p-6">
        <h3 className="font-semibold text-white mb-6 flex items-center gap-2">
          <FaMedal className="text-amber-400" />
          Top Performing Gigs
        </h3>
        <div className="space-y-4">
          {gigs?.topGigs?.length > 0 ? (
            gigs.topGigs.map((gig, index) => (
              <div key={gig._id} className="flex items-center gap-4 p-4 bg-[#0a0a0e] rounded-xl">
                <span className="w-8 h-8 flex items-center justify-center bg-purple-500/20 text-purple-400 text-sm font-bold rounded-lg">
                  #{index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{gig.title}</p>
                  <p className="text-xs text-gray-500">{gig.orders} orders • ₹{gig.price}</p>
                </div>
                <div className="text-right">
                  <p className="text-emerald-400 font-bold">₹{gig.revenue?.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">earned</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-8">
              Complete orders to see your top performing gigs!
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderProfileTab = () => (
    <div className="space-y-6">
      {/* Rating & Reviews */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-[#0f0f13] border border-[#1a1a22] rounded-2xl p-6 text-center">
          <div className="text-5xl font-bold text-amber-400 mb-2">
            {profile?.avgRating || "N/A"}
          </div>
          <div className="flex items-center justify-center gap-1 mb-2">
            {[1,2,3,4,5].map((star) => (
              <FaStar 
                key={star} 
                className={star <= Math.round(profile?.avgRating || 0) ? "text-amber-400" : "text-gray-600"} 
              />
            ))}
          </div>
          <p className="text-gray-400 text-sm">{profile?.totalReviews || 0} reviews</p>
        </div>

        <div className="bg-[#0f0f13] border border-[#1a1a22] rounded-2xl p-6">
          <h3 className="font-semibold text-white mb-4">Rating Distribution</h3>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => (
              <div key={rating} className="flex items-center gap-2">
                <span className="w-4 text-sm text-gray-400">{rating}</span>
                <FaStar className="text-amber-400 text-xs" />
                <div className="flex-1 bg-[#1a1a22] rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full"
                    style={{ 
                      width: `${profile?.totalReviews > 0 
                        ? (profile.ratingDistribution?.[rating] / profile.totalReviews) * 100 
                        : 0}%` 
                    }}
                  />
                </div>
                <span className="w-6 text-xs text-gray-500 text-right">
                  {profile?.ratingDistribution?.[rating] || 0}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#0f0f13] border border-[#1a1a22] rounded-2xl p-6">
          <h3 className="font-semibold text-white mb-4">Profile Strength</h3>
          <div className="relative pt-4">
            <div className="flex justify-center mb-4">
              <div className="relative w-32 h-32">
                <svg className="transform -rotate-90 w-32 h-32">
                  <circle cx="64" cy="64" r="56" stroke="#1a1a22" strokeWidth="12" fill="none" />
                  <circle
                    cx="64" cy="64" r="56"
                    stroke="url(#gradient)"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${(profile?.profileStrength || 0) * 3.52} 352`}
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">{profile?.profileStrength || 0}%</span>
                </div>
              </div>
            </div>
            <p className="text-center text-gray-400 text-sm">
              {profile?.profileStrength >= 80 ? "Excellent!" : "Complete your profile to attract more clients"}
            </p>
          </div>
        </div>
      </div>

      {/* Badges */}
      {profile?.badges?.length > 0 && (
        <div className="bg-[#0f0f13] border border-[#1a1a22] rounded-2xl p-6">
          <h3 className="font-semibold text-white mb-6 flex items-center gap-2">
            <FaMedal className="text-amber-400" />
            Your Badges
          </h3>
          <div className="flex flex-wrap gap-3">
            {profile.badges.map((badge) => (
              <div key={badge.id} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-full">
                <span className="text-xl">{badge.icon}</span>
                <span className="text-white font-medium">{badge.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Reviews */}
      <div className="bg-[#0f0f13] border border-[#1a1a22] rounded-2xl p-6">
        <h3 className="font-semibold text-white mb-6">Recent Reviews</h3>
        <div className="space-y-4">
          {profile?.recentReviews?.length > 0 ? (
            profile.recentReviews.map((review, index) => (
              <div key={index} className="p-4 bg-[#0a0a0e] rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <img
                    src={review.client?.profilePicture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                    className="w-10 h-10 rounded-full object-cover"
                    alt=""
                  />
                  <div className="flex-1">
                    <p className="font-medium text-white">{review.client?.name}</p>
                    <p className="text-xs text-gray-500">{review.gig?.title}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map((star) => (
                      <FaStar key={star} className={star <= review.rating ? "text-amber-400" : "text-gray-600"} size={12} />
                    ))}
                  </div>
                </div>
                <p className="text-gray-300 text-sm">{review.review}</p>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-8">
              No reviews yet. Complete orders to receive reviews!
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050509]">
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
            <p className="text-gray-400 text-sm mt-1">Track your performance and grow your business</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-4 py-2 bg-[#0f0f13] border border-[#1a1a22] rounded-xl text-white focus:border-purple-500 focus:outline-none"
            >
              {periodOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <button
              onClick={fetchAnalytics}
              className="p-2 bg-[#0f0f13] border border-[#1a1a22] rounded-xl text-gray-400 hover:text-white transition-colors"
            >
              <FaSync className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/20"
                  : "bg-[#0f0f13] text-gray-400 hover:text-white border border-[#1a1a22]"
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
            {activeTab === "earnings" && renderEarningsTab()}
            {activeTab === "orders" && renderOrdersTab()}
            {activeTab === "gigs" && renderGigsTab()}
            {activeTab === "profile" && renderProfileTab()}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default EditorAnalytics;
