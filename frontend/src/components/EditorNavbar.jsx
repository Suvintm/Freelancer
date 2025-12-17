import { useNavigate, useLocation } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { useSocket } from "../context/SocketContext";
import { useTheme } from "../context/ThemeContext";
import logo from "../assets/logo.png";
import { HiBell, HiBars3, HiOutlineSun, HiOutlineMoon } from "react-icons/hi2";
import ProfileCompletionRing from "./ProfileCompletionRing";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
    { path: "/editor-home", label: "Dashboard" },
    { path: "/editor-my-orders", label: "Orders" },
    { path: "/payments", label: "Payments" },
    { path: "/editor-profile", label: "Profile" },
    { path: "/chats", label: "Messages" },
];

const EditorNavbar = ({ onMenuClick }) => {
    const { user, unreadCount } = useAppContext();
    const { totalUnread, unreadNotifications } = useSocket() || {};
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();

    // Combine notification counts
    const notificationBadge = (unreadCount || 0) + (unreadNotifications || 0);
    const messageBadge = totalUnread || 0;

    return (
        <>
            {/* DESKTOP NAVBAR */}
            <header 
                className="hidden md:flex fixed top-0 left-64 right-0 h-16 px-8 items-center justify-between z-40 bg-white/95 light:bg-white/95 backdrop-blur-sm border-b border-slate-200 light:border-slate-200 shadow-sm transition-colors duration-200"
                style={{ fontFamily: "'Inter', sans-serif" }}
            >
                {/* PAGE TITLE */}
                <div>
                    <h2 
                        className="text-xl font-bold text-slate-900 light:text-slate-900"
                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                        {navItems.find(item => item.path === location.pathname)?.label || "Dashboard"}
                    </h2>
                    <p className="text-xs text-slate-500 light:text-slate-500">Welcome back, {user?.name || "User"}</p>
                </div>

                {/* RIGHT SECTION */}
                <div className="flex items-center gap-4">
                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="p-2.5 rounded-xl bg-slate-50 light:bg-slate-50 hover:bg-slate-100 light:hover:bg-slate-100 border border-slate-200 light:border-slate-200 transition-all"
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
                                    <HiOutlineMoon className="text-lg text-slate-600 light:text-slate-600" />
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

                    {/* NOTIFICATION */}
                    <button
                        className="relative p-2.5 rounded-xl bg-slate-50 light:bg-slate-50 hover:bg-slate-100 light:hover:bg-slate-100 border border-slate-200 light:border-slate-200 transition-all"
                        onClick={() => navigate("/notifications")}
                    >
                        <HiBell className="text-lg text-slate-600 light:text-slate-600" />
                        {notificationBadge > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white light:border-white">
                                {notificationBadge > 9 ? "9+" : notificationBadge}
                            </span>
                        )}
                    </button>

                    {/* PROFILE */}
                    <div
                        className="flex items-center gap-3 cursor-pointer px-3 py-2 rounded-xl hover:bg-slate-50 light:hover:bg-slate-50 border border-transparent hover:border-slate-200 light:hover:border-slate-200 transition-all"
                        onClick={() => navigate("/editor-profile")}
                    >
                        <ProfileCompletionRing 
                            user={user} 
                            size={44} 
                            strokeWidth={3}
                            showDropdown={true}
                        >
                            <img
                                src={user?.profilePicture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                                alt="Profile"
                                className="w-10 h-10 rounded-full object-cover border-2 border-emerald-200 light:border-emerald-200"
                            />
                        </ProfileCompletionRing>
                        <div className="hidden lg:block">
                            <p className="text-sm font-semibold text-slate-900 light:text-slate-900">{user?.name || "User"}</p>
                            <p className="text-[10px] text-slate-500 light:text-slate-500">Editor</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* MOBILE NAVBAR */}
            <div 
                className="md:hidden flex justify-between items-center sticky top-0 z-40 px-4 py-3 bg-white/95 light:bg-white/95 backdrop-blur-sm border-b border-slate-200 light:border-slate-200 shadow-sm transition-colors duration-200"
                style={{ fontFamily: "'Inter', sans-serif" }}
            >
                {/* MENU BUTTON */}
                <button
                    onClick={onMenuClick}
                    className="p-2 rounded-xl bg-slate-50 light:bg-slate-50 hover:bg-slate-100 light:hover:bg-slate-100 text-slate-600 light:text-slate-600 transition-all"
                >
                    <HiBars3 className="text-xl" />
                </button>

                {/* LOGO */}
                <div
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => navigate("/editor-home")}
                >
                    <img src={logo} alt="SuviX" className="w-8 h-8 hover:scale-105 transition-transform" />
                    <h2 
                        className="text-lg font-bold text-slate-900 light:text-slate-900"
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
                        className="p-2 rounded-xl bg-slate-50 light:bg-slate-50 hover:bg-slate-100 light:hover:bg-slate-100 transition-all"
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
                                    <HiOutlineMoon className="text-lg text-slate-600 light:text-slate-600" />
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
                        className="relative p-2 rounded-xl bg-slate-50 light:bg-slate-50 hover:bg-slate-100 light:hover:bg-slate-100 transition-all"
                        onClick={() => navigate("/notifications")}
                    >
                        <HiBell className="text-lg text-slate-600 light:text-slate-600" />
                        {notificationBadge > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full border-2 border-white light:border-white">
                                {notificationBadge > 9 ? "9+" : notificationBadge}
                            </span>
                        )}
                    </button>

                    {/* PROFILE */}
                    <img
                        src={user?.profilePicture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                        onClick={() => navigate("/editor-profile")}
                        className="w-9 h-9 rounded-full object-cover cursor-pointer border-2 border-emerald-300 light:border-emerald-300"
                        alt="Profile"
                    />
                </div>
            </div>
        </>
    );
};

export default EditorNavbar;
