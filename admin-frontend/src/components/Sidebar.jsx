// Sidebar.jsx - Admin sidebar navigation
import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaTachometerAlt,
  FaUsers,
  FaShoppingCart,
  FaBriefcase,
  FaHistory,
  FaCog,
  FaSignOutAlt,
  FaTimes,
  FaShieldAlt,
  FaChartLine,
  FaComments,
  FaWallet,
  FaDatabase,
} from "react-icons/fa";
import { useAdmin } from "../context/AdminContext";

const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { admin, logout, isSuperAdmin } = useAdmin();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navItems = [
    { to: "/dashboard", icon: FaTachometerAlt, label: "Dashboard" },
    { to: "/analytics", icon: FaChartLine, label: "Analytics" },
    { to: "/payments", icon: FaWallet, label: "Payments" },
    { to: "/conversations", icon: FaComments, label: "Conversations" },
    { to: "/users", icon: FaUsers, label: "Users" },
    { to: "/kyc", icon: FaShieldAlt, label: "KYC Verification" },
    { to: "/orders", icon: FaShoppingCart, label: "Orders" },
    { to: "/gigs", icon: FaBriefcase, label: "Gigs" },
    { to: "/activity", icon: FaHistory, label: "Activity Logs" },
    { to: "/storage", icon: FaDatabase, label: "Storage Manager" },
    ...(isSuperAdmin ? [{ to: "/settings", icon: FaCog, label: "Settings" }] : []),
  ];

  const NavItem = ({ item }) => (
    <NavLink
      to={item.to}
      onClick={onClose}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
          isActive
            ? "bg-gradient-to-r from-purple-600/20 to-blue-600/20 text-purple-600 dark:text-purple-400 border border-purple-500/30"
            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-white"
        }`
      }
    >
      <item.icon className="text-lg group-hover:scale-110 transition-transform" />
      <span className="font-medium">{item.label}</span>
    </NavLink>
  );

  const sidebarContent = (
    <>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
            <FaShieldAlt className="text-xl text-white" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900 dark:text-white text-lg">SuviX Admin</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{admin?.role}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {/* Stats Mini Card */}
        <div className="mb-4 p-4 bg-gradient-to-br from-purple-600/10 to-blue-600/10 rounded-xl border border-purple-500/20">
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 text-sm mb-1">
            <FaChartLine />
            <span>Quick Stats</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">Platform Active</p>
        </div>

        {navItems.map((item) => (
          <NavItem key={item.to} item={item} />
        ))}
      </nav>

      {/* Admin Info & Logout */}
      <div className="p-4 border-t border-gray-200 dark:border-zinc-800">
        <div className="px-4 py-3 mb-2 bg-gray-50 dark:bg-zinc-800 rounded-xl">
          <p className="text-sm text-gray-900 dark:text-white font-medium truncate">{admin?.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{admin?.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all border border-red-500/20"
        >
          <FaSignOutAlt />
          <span>Logout</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-64 bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 z-40 transition-colors duration-200">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="md:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
            />
            {/* Sidebar */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25 }}
              className="md:hidden fixed left-0 top-0 h-screen w-72 bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 z-50 flex flex-col transition-colors duration-200"
            >
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800"
              >
                <FaTimes size={20} />
              </button>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
