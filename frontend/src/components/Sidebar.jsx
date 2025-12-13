import { useNavigate, useLocation } from "react-router-dom";
import {
  FaBriefcase,
  FaCheckCircle,
  FaUserTie,
  FaEnvelope,
  FaTimes,
  FaShoppingCart,
  FaClipboardList,
  FaWallet,
} from "react-icons/fa";
import { motion } from "framer-motion";
import logo from "../assets/logo.png";
import { FaCircle } from "react-icons/fa";


const navItems = [
  { path: "/editor-home", icon: FaBriefcase, label: "Dashboard" },
  { path: "/my-gigs", icon: FaShoppingCart, label: "My Gigs" },
  { path: "/my-orders", icon: FaClipboardList, label: "My Orders" },
  { path: "/payments", icon: FaWallet, label: "Payments" },
  { path: "/editor-profile", icon: FaUserTie, label: "Profile" },
  { path: "/chats", icon: FaEnvelope, label: "Messages" },
];

const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path) => {
    navigate(path);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`bg-[#050509] text-white shadow-[0_18px_50px_rgba(0,0,0,0.9)]
        flex flex-col fixed top-0 left-0 z-50 h-screen transition-transform duration-300
        ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        w-64 border-r border-[#111827]`}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-blue-600/20 bg-[#050509]">
          <img
            onClick={() => handleNavigation("/")}
            src={logo}
            className="w-10 h-10 cursor-pointer"
          />
          <div>
            <h1
              onClick={() => handleNavigation("/")}
              className="text-lg font-semibold cursor-pointer hover:text-[#BFDBFE] transition"
            >
              SuviX
            </h1>
            <p className="text-[11px] text-[#6B7280]">Editor Workspace</p>
          </div>
          <button
            onClick={onClose}
            className="md:hidden ml-auto text-[#9CA3AF] hover:text-white text-lg"
          >
            <FaTimes />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-4 flex flex-col gap-2 overflow-y-auto relative">
          {navItems.map(({ path, icon: Icon, label }) => {
  const isActive = location.pathname === path;

  return (
    <button
      key={path}
      onClick={() => handleNavigation(path)}
      className={`
        relative flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium
        transition-all overflow-hidden
        ${isActive
          ? "text-white"
          : "text-[#9CA3AF] hover:text-white hover:bg-[#0A0D14]"
        }
      `}
    >
      {/* Animated Bubble */}
      {isActive && (
        <motion.div
          layoutId="sidebarBubble"
          className="absolute inset-0 bg-[#1463FF]/20  rounded-2xl"
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 22,
          }}
        />
      )}

      {/* Icon + Text */}
      <div className="relative z-10 flex items-center gap-3">
        <Icon
          className={`text-base ${
            isActive ? "text-[#60A5FA]" : "text-[#6B7280]"
          }`}
        />
        <span>{label}</span>
      </div>

      {/* ACTIVE ICON INDICATOR */}
      {isActive && (
        <motion.div
          layoutId="sidebarActiveIcon"
          className="absolute right-4 flex items-center justify-center"
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 20,
            mass: 0.4,
          }}
        >
          <FaCircle className="text-green-500 text-xs drop-shadow-[0_0_6px_rgba(34,197,94,0.9)]" />
        </motion.div>
      )}
    </button>
  );
})}

        </nav>

        {/* Footer */}
        <div className="px-4 py-4 text-[11px] text-[#6B7280] text-center border-t border-[#111827]">
          © 2024 SuviX • All rights reserved
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
