// ClientProfile.jsx - Client's profile and settings page
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaArrowLeft,
  FaUser,
  FaEnvelope,
  FaCalendarAlt,
  FaEdit,
  FaCheck,
  FaTimes,
  FaClipboardList,
  FaClock,
  FaRupeeSign,
  FaChartLine,
  FaCog,
  FaBell,
  FaLock,
  FaSignOutAlt,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import ClientSidebar from "../components/ClientSidebar.jsx";
import ClientNavbar from "../components/ClientNavbar.jsx";

const ClientProfile = () => {
  const navigate = useNavigate();
  const { user, backendURL, logout } = useAppContext();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    completedOrders: 0,
    totalSpent: 0,
    averageRating: 4.8,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = user?.token;
        if (!token) return;

        const res = await axios.get(`${backendURL}/api/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const orders = res.data.orders || [];
        const completed = orders.filter(o => o.status === "completed").length;
        const totalSpent = orders
          .filter(o => o.status === "completed")
          .reduce((sum, o) => sum + (o.amount || 0), 0);

        setStats({
          totalOrders: orders.length,
          completedOrders: completed,
          totalSpent,
          averageRating: 4.8,
        });

        // Get 5 most recent orders
        setRecentOrders(orders.slice(0, 5));
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [backendURL, user?.token]);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: FaChartLine },
    { id: "orders", label: "Order History", icon: FaClipboardList },
    { id: "settings", label: "Settings", icon: FaCog },
  ];

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
            <p className="mt-4 text-gray-400 text-sm">Loading your profile...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#050509] text-white">
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
            <h1 className="text-2xl font-bold text-white">My Profile</h1>
            <p className="text-gray-400 text-sm">Manage your account</p>
          </div>
        </div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-[#111319] to-[#0f1114] border border-[#262A3B] rounded-3xl p-6 mb-6"
        >
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <img
                src={user?.profilePicture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                alt="Profile"
                className="w-24 h-24 md:w-28 md:h-28 rounded-2xl object-cover border-2 border-emerald-500/30"
              />
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <FaCheck className="text-white text-sm" />
              </div>
            </div>

            {/* Info */}
            <div className="text-center md:text-left flex-1">
              <h2 className="text-2xl font-bold text-white mb-1">{user?.name}</h2>
              <p className="text-gray-400 text-sm flex items-center justify-center md:justify-start gap-2">
                <FaEnvelope className="text-emerald-400" />
                {user?.email}
              </p>
              <p className="text-gray-500 text-xs mt-2 flex items-center justify-center md:justify-start gap-2">
                <FaCalendarAlt />
                Member since {user?.createdAt ? formatDate(user.createdAt) : "2024"}
              </p>
            </div>

            {/* Stats */}
            <div className="flex gap-6 md:gap-8">
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-400">{stats.totalOrders}</p>
                <p className="text-gray-400 text-xs">Orders</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">{stats.completedOrders}</p>
                <p className="text-gray-400 text-xs">Completed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-400">₹{stats.totalSpent.toLocaleString()}</p>
                <p className="text-gray-400 text-xs">Spent</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-[#111319] text-gray-400 hover:bg-[#1a1d25]"
              }`}
            >
              <tab.icon className="text-sm" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#111319] border border-[#262A3B] rounded-2xl p-4">
                  <FaClipboardList className="text-emerald-400 text-xl mb-2" />
                  <p className="text-2xl font-bold text-white">{stats.totalOrders}</p>
                  <p className="text-gray-400 text-xs">Total Orders</p>
                </div>
                <div className="bg-[#111319] border border-[#262A3B] rounded-2xl p-4">
                  <FaCheck className="text-green-400 text-xl mb-2" />
                  <p className="text-2xl font-bold text-white">{stats.completedOrders}</p>
                  <p className="text-gray-400 text-xs">Completed</p>
                </div>
                <div className="bg-[#111319] border border-[#262A3B] rounded-2xl p-4">
                  <FaClock className="text-yellow-400 text-xl mb-2" />
                  <p className="text-2xl font-bold text-white">{stats.totalOrders - stats.completedOrders}</p>
                  <p className="text-gray-400 text-xs">Active</p>
                </div>
                <div className="bg-[#111319] border border-[#262A3B] rounded-2xl p-4">
                  <FaRupeeSign className="text-blue-400 text-xl mb-2" />
                  <p className="text-2xl font-bold text-white">₹{stats.totalSpent.toLocaleString()}</p>
                  <p className="text-gray-400 text-xs">Total Spent</p>
                </div>
              </div>

              {/* Recent Orders */}
              <div className="bg-[#111319] border border-[#262A3B] rounded-2xl p-5">
                <h3 className="text-lg font-semibold text-white mb-4">Recent Orders</h3>
                {recentOrders.length === 0 ? (
                  <p className="text-gray-400 text-sm">No orders yet</p>
                ) : (
                  <div className="space-y-3">
                    {recentOrders.map((order) => (
                      <div
                        key={order._id}
                        onClick={() => navigate(`/chat/${order._id}`)}
                        className="flex items-center gap-3 p-3 rounded-xl bg-[#0a0c0f] hover:bg-[#13161d] cursor-pointer transition-all"
                      >
                        <img
                          src={order.editor?.profilePicture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                          alt=""
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">{order.title}</p>
                          <p className="text-gray-500 text-xs">{order.editor?.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-green-400 text-sm font-medium">₹{order.amount}</p>
                          <p className="text-gray-500 text-xs">{formatDate(order.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "orders" && (
            <motion.div
              key="orders"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="bg-[#111319] border border-[#262A3B] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">All Orders</h3>
                  <button
                    onClick={() => navigate("/client-orders")}
                    className="text-emerald-400 text-sm hover:underline"
                  >
                    View All →
                  </button>
                </div>
                {recentOrders.length === 0 ? (
                  <p className="text-gray-400 text-sm">No orders yet</p>
                ) : (
                  <div className="space-y-3">
                    {recentOrders.map((order) => (
                      <div
                        key={order._id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-[#0a0c0f]"
                      >
                        <div className="flex-1">
                          <p className="text-white text-sm font-medium">{order.title}</p>
                          <p className="text-gray-500 text-xs">{order.editor?.name} • {formatDate(order.createdAt)}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-lg ${
                          order.status === "completed" ? "bg-green-500/20 text-green-400" :
                          order.status === "in_progress" ? "bg-yellow-500/20 text-yellow-400" :
                          "bg-blue-500/20 text-blue-400"
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "settings" && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Account Settings */}
              <div className="bg-[#111319] border border-[#262A3B] rounded-2xl p-5">
                <h3 className="text-lg font-semibold text-white mb-4">Account Settings</h3>
                <div className="space-y-4">
                  <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#0a0c0f] hover:bg-[#13161d] transition-all">
                    <FaUser className="text-gray-400" />
                    <span className="flex-1 text-left text-white text-sm">Edit Profile</span>
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#0a0c0f] hover:bg-[#13161d] transition-all">
                    <FaBell className="text-gray-400" />
                    <span className="flex-1 text-left text-white text-sm">Notification Preferences</span>
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#0a0c0f] hover:bg-[#13161d] transition-all">
                    <FaLock className="text-gray-400" />
                    <span className="flex-1 text-left text-white text-sm">Change Password</span>
                  </button>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-[#111319] border border-red-500/20 rounded-2xl p-5">
                <h3 className="text-lg font-semibold text-red-400 mb-4">Danger Zone</h3>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all"
                >
                  <FaSignOutAlt />
                  <span className="text-sm font-medium">Logout from Account</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default ClientProfile;
