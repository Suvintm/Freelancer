// AdminNavbar.jsx - Admin top navigation bar
import { FaBars, FaBell, FaShieldAlt } from "react-icons/fa";
import { useAdmin } from "../../context/AdminContext";

const AdminNavbar = ({ onMenuClick }) => {
  const { admin } = useAdmin();

  return (
    <header className="fixed top-0 left-0 right-0 md:left-64 h-16 bg-[#0a0a0e]/80 backdrop-blur-xl border-b border-[#262A3B] z-30 flex items-center justify-between px-4 md:px-6">
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="md:hidden p-2 text-gray-400 hover:text-white"
      >
        <FaBars size={20} />
      </button>

      {/* Title */}
      <div className="hidden md:flex items-center gap-2">
        <FaShieldAlt className="text-purple-500" />
        <span className="text-gray-400 text-sm">Admin Panel</span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative p-2 text-gray-400 hover:text-white">
          <FaBell size={18} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* Admin avatar */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">
              {admin?.name?.charAt(0)?.toUpperCase() || "A"}
            </span>
          </div>
          <div className="hidden sm:block">
            <p className="text-sm text-white font-medium">{admin?.name}</p>
            <p className="text-xs text-gray-500 capitalize">{admin?.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminNavbar;
