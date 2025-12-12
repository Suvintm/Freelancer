import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBars,
  FaBell,
  FaSearch,
  FaUserCircle,
  FaSignOutAlt,
  FaCog,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useAppContext } from "../context/AppContext";

const ClientNavbar = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const { user, logout } = useAppContext();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 md:left-64 z-30 bg-[#050509]/95 backdrop-blur-md border-b border-[#111827]">
      <div className="flex items-center justify-between px-4 md:px-6 py-3">
        {/* Left: Hamburger (mobile) + Title */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 rounded-xl bg-[#111319] border border-[#262A3B] hover:bg-[#1a1d25] transition-all"
          >
            <FaBars className="text-white" />
          </button>
          <div className="hidden sm:block">
            <h1 className="text-white font-semibold text-lg">
              Welcome back, {user?.name?.split(" ")[0] || "Client"}!
            </h1>
            <p className="text-gray-400 text-xs">Find your perfect video editor</p>
          </div>
        </div>

        {/* Right: Search, Notifications, Profile */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2.5 rounded-xl bg-[#111319] border border-[#262A3B] hover:bg-[#1a1d25] transition-all hidden sm:flex"
          >
            <FaSearch className="text-gray-400 hover:text-white transition-colors" />
          </button>

          {/* Notifications */}
          <button
            onClick={() => navigate("/notifications")}
            className="relative p-2.5 rounded-xl bg-[#111319] border border-[#262A3B] hover:bg-[#1a1d25] transition-all"
          >
            <FaBell className="text-gray-400 hover:text-white transition-colors" />
            {/* Notification Badge */}
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              3
            </span>
          </button>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-1 pr-3 rounded-xl bg-[#111319] border border-[#262A3B] hover:bg-[#1a1d25] transition-all"
            >
              <img
                src={user?.profilePicture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                alt="Profile"
                className="w-8 h-8 rounded-lg object-cover"
              />
              <span className="text-white text-sm font-medium hidden sm:block">
                {user?.name?.split(" ")[0] || "User"}
              </span>
            </button>

            {/* Profile Dropdown */}
            <AnimatePresence>
              {showProfileMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-48 bg-[#111319] border border-[#262A3B] rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden z-50"
                >
                  <div className="p-3 border-b border-[#262A3B]">
                    <p className="text-white font-medium text-sm">{user?.name}</p>
                    <p className="text-gray-400 text-xs truncate">{user?.email}</p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        navigate("/client-profile");
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-[#1a1d25] hover:text-white transition-all"
                    >
                      <FaUserCircle className="text-gray-500" />
                      My Profile
                    </button>
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        navigate("/client-profile");
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-[#1a1d25] hover:text-white transition-all"
                    >
                      <FaCog className="text-gray-500" />
                      Settings
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-all"
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
      </div>

      {/* Mobile Search Bar */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 pb-3"
          >
            <input
              type="text"
              placeholder="Search editors, gigs..."
              className="w-full bg-[#111319] border border-[#262A3B] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:ring-2 focus:ring-emerald-500/30"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default ClientNavbar;
