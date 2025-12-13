// AdminSidebar.jsx - Admin sidebar navigation
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
  FaUserShield,
} from "react-icons/fa";
import { useAdmin } from "../../context/AdminContext";

const AdminSidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { admin, logout, isSuperAdmin } = useAdmin();

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login");
  };

  const navItems = [
    { path: "/admin/dashboard", icon: FaTachometerAlt, label: "Dashboard" },
    { path: "/admin/users", icon: FaUsers, label: "Users" },
    { path: "/admin/orders", icon: FaShoppingCart, label: "Orders" },
    { path: "/admin/gigs", icon: FaBriefcase, label: "Gigs" },
    { path: "/admin/activity", icon: FaHistory, label: "Activity Logs" },
    ...(isSuperAdmin ? [
      { path: "/admin/admins", icon: FaUserShield, label: "Admins" },
      { path: "/admin/settings", icon: FaCog, label: "Settings" },
    ] : []),
  ];

  const sidebarContent = (
    <>
      {/* Header */}
      <div className="p-6 border-b border-[#262A3B]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
            <FaShieldAlt className="text-xl text-white" />
          </div>
          <div>
            <h2 className="font-bold text-white">SuviX Admin</h2>
            <p className="text-xs text-gray-500">{admin?.role}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive
                  ? "bg-gradient-to-r from-purple-600/20 to-blue-600/20 text-purple-400 border border-purple-500/30"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              }`
            }
          >
            <item.icon className="text-lg" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Admin Info & Logout */}
      <div className="p-4 border-t border-[#262A3B]">
        <div className="px-4 py-3 mb-2">
          <p className="text-sm text-white font-medium truncate">{admin?.name}</p>
          <p className="text-xs text-gray-500 truncate">{admin?.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all"
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
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-64 bg-[#0a0a0e] border-r border-[#262A3B] z-40">
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
              className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            {/* Sidebar */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25 }}
              className="md:hidden fixed left-0 top-0 h-screen w-72 bg-[#0a0a0e] border-r border-[#262A3B] z-50 flex flex-col"
            >
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white"
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

export default AdminSidebar;
