import { useNavigate, useLocation } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { useSocket } from "../context/SocketContext";
import logo from "../assets/logo.png";
import { HiBell, HiBars3 } from "react-icons/hi2";
import { FaEnvelope } from "react-icons/fa";

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
    const navigate = useNavigate();
    const location = useLocation();

    // Combine notification counts
    const notificationBadge = (unreadCount || 0) + (unreadNotifications || 0);
    const messageBadge = totalUnread || 0;

    return (
        <>
            {/* DESKTOP NAVBAR */}
            <header className="
                hidden md:flex fixed top-0 left-64 right-0 
                h-20 lg:h-20 px-10 lg:px-14 
                items-center justify-between z-40
                bg-[#0D0D0D]/80 backdrop-blur-xl
                border-b border-[#1F1F1F]
                shadow-[0_10px_30px_rgba(0,0,0,0.7)]
            ">
                {/* PAGE TITLE */}
                <h2 className="
                    text-2xl lg:text-3xl 
                    font-semibold text-white tracking-wide
                ">
                    {navItems.find(item => item.path === location.pathname)?.label || "SuviX"}
                </h2>

                {/* RIGHT SECTION */}
                <div className="flex items-center gap-8 lg:gap-10">

                    {/* NOTIFICATION */}
                    <div
                        className="
                            relative cursor-pointer p-3 lg:p-4 
                            rounded-full transition-all
                            hover:bg-[#1A1A1A] group
                        "
                        onClick={() => navigate("/notifications")}
                    >
                        <HiBell className="
                            text-3xl lg:text-4xl 
                            text-gray-400 
                            group-hover:text-[#1463FF]
                            transition
                        " />

                        {notificationBadge > 0 && (
                            <span className="
                                absolute top-1 right-1 
                                w-6 h-6 lg:w-7 lg:h-7
                                flex items-center justify-center
                                bg-red-600 text-white 
                                text-[10px] lg:text-xs font-bold
                                rounded-full border-2 border-[#0D0D0D]
                                shadow-md
                            ">
                                {notificationBadge > 9 ? "9+" : notificationBadge}
                            </span>
                        )}
                    </div>

                    {/* PROFILE */}
                    <div
                        className="
                            flex items-center gap-4 lg:gap-5 cursor-pointer rounded-full
                            px-2 pr-4 lg:px-3 lg:pr-5
                            border border-transparent
                            hover:border-[#2A2A2A] hover:bg-[#1A1A1A]
                            transition-all
                        "
                        onClick={() => navigate("/editor-profile")}
                    >
                        <img
                            src={user?.profilePicture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                            alt="Profile"
                            className="
                                w-12 h-12 lg:w-14 lg:h-14
                                rounded-full object-cover
                                border-2 lg:border-[3px] border-[#1463FF]
                                shadow-[0_0_12px_rgba(20,99,255,0.4)]
                            "
                        />
                        <span className="text-base lg:text-lg font-semibold text-gray-300">
                            {user?.name || "User"}
                        </span>
                    </div>
                </div>
            </header>

            {/* MOBILE NAVBAR */}
            <div className="
                md:hidden flex justify-between items-center sticky top-0 z-40
                px-4 py-3
                bg-[#0D0D0D]/90 backdrop-blur-xl
                border-b border-[#1F1F1F]
                shadow-[0_8px_25px_rgba(0,0,0,0.8)]
            ">
                {/* MENU BUTTON */}
                <button
                    onClick={onMenuClick}
                    className="text-3xl text-gray-300 hover:text-[#1463FF] transition"
                >
                    <HiBars3 />
                </button>

                {/* LOGO */}
                <div
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => navigate("/editor-home")}
                >
                    <img src={logo} alt="SuviX" className="w-8 h-8 rounded-xl" />
                    <h2 className="text-lg font-semibold text-white tracking-wide">SuviX</h2>
                </div>

                {/* RIGHT SIDE ICONS */}
                <div className="flex items-center gap-3">
                    {/* BELL */}
                    <div
                        className="relative cursor-pointer p-2 rounded-full hover:bg-[#1A1A1A] transition"
                        onClick={() => navigate("/notifications")}
                    >
                        <HiBell className="text-2xl text-gray-400" />
                        {unreadCount > 0 && (
                            <span className="
                                absolute top-1 right-1 w-4 h-4
                                flex items-center justify-center
                                bg-red-600 text-white text-[9px] font-bold
                                rounded-full border-2 border-[#0D0D0D]
                            ">
                                {unreadCount > 9 ? "9+" : unreadCount}
                            </span>
                        )}
                    </div>

                    {/* PROFILE */}
                    <img
                        src={user?.profilePicture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                        onClick={() => navigate("/editor-profile")}
                        className="
                            w-8 h-8 rounded-full object-cover cursor-pointer
                            border-2 border-[#1463FF]
                            shadow-[0_0_10px_rgba(20,99,255,0.35)]
                        "
                    />
                </div>
            </div>
        </>
    );
};

export default EditorNavbar;
