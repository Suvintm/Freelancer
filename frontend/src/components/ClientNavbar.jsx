/**
 * ClientNavbar - Professional Corporate Design
 * Dark base with light: variant overrides for theme toggle
 */

import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaBars,
  FaBell,
  FaSearch,
  FaUserCircle,
  FaSignOutAlt,
  FaCog,
} from "react-icons/fa";
import { HiOutlineSun, HiOutlineMoon } from "react-icons/hi2";
import { motion, AnimatePresence } from "framer-motion";
import { useAppContext } from "../context/AppContext";
import { useTheme } from "../context/ThemeContext";
import logo from "../assets/logo.png";

const ClientNavbar = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAppContext();
  const { theme, toggleTheme } = useTheme();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Get page title based on route
  const getPageTitle = () => {
    switch (location.pathname) {
      case "/client-home": return "Dashboard";
      case "/client-orders": return "My Orders";
      case "/client-messages": return "Messages";
      case "/saved-editors": return "Saved Editors";
      case "/client-profile": return "Profile";
      case "/payments": return "Payments";
      default: return "Dashboard";
    }
  };

  return (
    <>
      {/* DESKTOP NAVBAR */}
      <header 
        className="hidden md:flex fixed top-0 left-64 right-0 h-16 px-8 items-center justify-between z-40 bg-[#050509]/95 light:bg-white/95 backdrop-blur-sm border-b border-white/10 light:border-slate-200 shadow-sm transition-colors duration-200"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {/* PAGE TITLE */}
        <div>
          <h2 
            className="text-xl font-bold text-white light:text-slate-900"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {getPageTitle()}
          </h2>
          <p className="text-xs text-gray-500 light:text-slate-500">Welcome back, {user?.name?.split(" ")[0] || "Client"}</p>
        </div>

        {/* RIGHT SECTION */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2.5 rounded-xl bg-white/5 light:bg-slate-50 hover:bg-white/10 light:hover:bg-slate-100 border border-white/10 light:border-slate-200 transition-all"
          >
            <FaSearch className="text-gray-400 light:text-slate-500" />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-white/5 light:bg-slate-50 hover:bg-white/10 light:hover:bg-slate-100 border border-white/10 light:border-slate-200 transition-all"
            aria-label="Toggle theme"
          >
            <AnimatePresence mode="wait">
              {theme === "dark" ? (
                <motion.div
                  key="moon"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <HiOutlineMoon className="text-lg text-gray-400 light:text-slate-600" />
                </motion.div>
              ) : (
                <motion.div
                  key="sun"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <HiOutlineSun className="text-lg text-amber-500" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>

          {/* Notifications */}
          <button
            onClick={() => navigate("/notifications")}
            className="relative p-2.5 rounded-xl bg-white/5 light:bg-slate-50 hover:bg-white/10 light:hover:bg-slate-100 border border-white/10 light:border-slate-200 transition-all"
          >
            <FaBell className="text-gray-400 light:text-slate-500" />
            <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-[#050509] light:border-white">
              3
            </span>
          </button>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-3 cursor-pointer px-3 py-2 rounded-xl hover:bg-white/5 light:hover:bg-slate-50 border border-transparent hover:border-white/10 light:hover:border-slate-200 transition-all"
            >
              <img
                src={user?.profilePicture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500/30 light:border-emerald-200"
              />
              <div className="hidden lg:block text-left">
                <p className="text-sm font-semibold text-white light:text-slate-900">{user?.name?.split(" ")[0] || "User"}</p>
                <p className="text-[10px] text-gray-500 light:text-slate-500">Client</p>
              </div>
            </button>

            {/* Profile Dropdown */}
            <AnimatePresence>
              {showProfileMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-56 bg-[#0a0a0c] light:bg-white border border-white/10 light:border-slate-200 rounded-xl shadow-2xl overflow-hidden z-50"
                >
                  <div className="p-4 border-b border-white/10 light:border-slate-100">
                    <p className="text-white light:text-slate-900 font-semibold text-sm">{user?.name}</p>
                    <p className="text-gray-500 light:text-slate-500 text-xs truncate">{user?.email}</p>
                  </div>
                  <div className="py-2">
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        navigate("/client-profile");
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 light:text-slate-600 hover:bg-white/5 light:hover:bg-slate-50 hover:text-white light:hover:text-slate-900 transition-all"
                    >
                      <FaUserCircle className="text-gray-500 light:text-slate-400" />
                      My Profile
                    </button>
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        navigate("/client-profile");
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 light:text-slate-600 hover:bg-white/5 light:hover:bg-slate-50 hover:text-white light:hover:text-slate-900 transition-all"
                    >
                      <FaCog className="text-gray-500 light:text-slate-400" />
                      Settings
                    </button>
                    <div className="border-t border-white/10 light:border-slate-100 my-1" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-all"
                    >
                      <FaSignOutAlt className="text-red-400" />
                      Logout
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* MOBILE NAVBAR */}
      <div 
        className="md:hidden flex justify-between items-center sticky top-0 z-40 px-4 py-3 bg-[#050509]/95 light:bg-white/95 backdrop-blur-sm border-b border-white/10 light:border-slate-200 shadow-sm transition-colors duration-200"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {/* MENU BUTTON */}
        <button
          onClick={onMenuClick}
          className="p-2 rounded-xl bg-white/5 light:bg-slate-50 hover:bg-white/10 light:hover:bg-slate-100 text-gray-400 light:text-slate-600 transition-all"
        >
          <FaBars className="text-xl" />
        </button>

        {/* LOGO */}
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate("/client-home")}
        >
          <img src={logo} alt="SuviX" className="w-8 h-8 hover:scale-105 transition-transform" />
          <h2 
            className="text-lg font-bold text-white light:text-slate-900"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Suvi<span className="text-emerald-500">X</span>
          </h2>
        </div>

        {/* RIGHT SIDE ICONS */}
        <div className="flex items-center gap-2">
          {/* THEME TOGGLE */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-white/5 light:bg-slate-50 hover:bg-white/10 light:hover:bg-slate-100 transition-all"
            aria-label="Toggle theme"
          >
            <AnimatePresence mode="wait">
              {theme === "dark" ? (
                <motion.div
                  key="moon"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <HiOutlineMoon className="text-lg text-gray-400 light:text-slate-600" />
                </motion.div>
              ) : (
                <motion.div
                  key="sun"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <HiOutlineSun className="text-lg text-amber-500" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>

          {/* BELL */}
          <button
            onClick={() => navigate("/notifications")}
            className="relative p-2 rounded-xl bg-white/5 light:bg-slate-50 hover:bg-white/10 light:hover:bg-slate-100 transition-all"
          >
            <FaBell className="text-lg text-gray-400 light:text-slate-600" />
            <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full border-2 border-[#050509] light:border-white">
              3
            </span>
          </button>

          {/* PROFILE */}
          <img
            src={user?.profilePicture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
            onClick={() => navigate("/client-profile")}
            className="w-9 h-9 rounded-full object-cover cursor-pointer border-2 border-emerald-500/30 light:border-emerald-300"
            alt="Profile"
          />
        </div>
      </div>

      {/* Mobile Search Bar */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="hidden md:block fixed top-16 left-64 right-0 bg-[#050509] light:bg-white border-b border-white/10 light:border-slate-200 px-8 py-3 z-30"
          >
            <input
              type="text"
              placeholder="Search editors, gigs..."
              className="w-full max-w-md bg-white/5 light:bg-slate-50 border border-white/10 light:border-slate-200 rounded-xl px-4 py-2.5 text-sm text-white light:text-slate-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ClientNavbar;
