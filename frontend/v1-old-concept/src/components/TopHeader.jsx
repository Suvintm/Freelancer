import { FaSearch, FaCalendar, FaMap, FaSun, FaMoon } from "react-icons/fa";
import { HiOutlineMapPin } from "react-icons/hi2";
import { useTheme } from "../context/ThemeContext";

const TopHeader = ({ onToggleView, currentView = "map" }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3 flex items-center justify-between">
      {/* Left: Logo & Title */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
          <HiOutlineMapPin className="text-white text-xl" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Local Editors Network</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">Find trusted editors nearby</p>
        </div>
      </div>

      {/* Center: Search Bar */}
      <div className="hidden md:flex flex-1 max-w-md mx-8">
        <div className="relative w-full">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            placeholder="Search editors, skills..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:border-violet-500 dark:focus:border-violet-400 transition-colors"
          />
        </div>
      </div>

      {/* Right: View Toggles & Theme */}
      <div className="flex items-center gap-2">
        {/* Calendar View Toggle */}
        <button
          onClick={() => onToggleView && onToggleView("calendar")}
          className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${
            currentView === "calendar"
              ? "bg-violet-600 text-white"
              : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
          }`}
        >
          <FaCalendar className="text-xs" />
          <span className="hidden sm:inline">Calendar</span>
        </button>

        {/* Map View Toggle */}
        <button
          onClick={() => onToggleView && onToggleView("map")}
          className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${
            currentView === "map"
              ? "bg-violet-600 text-white"
              : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
          }`}
        >
          <FaMap className="text-xs" />
          <span className="hidden sm:inline">Map</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center transition-colors"
        >
          {theme === 'dark' ? (
            <FaSun className="text-amber-400 text-sm" />
          ) : (
            <FaMoon className="text-gray-700 text-sm" />
          )}
        </button>

        {/* User Profile (placeholder) */}
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
          <span className="text-white text-xs font-bold">U</span>
        </div>
      </div>
    </div>
  );
};

export default TopHeader;
