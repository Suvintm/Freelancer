import { useNavigate, useLocation } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import logo from "../assets/logo.png";
import { HiBell, HiBars3 } from "react-icons/hi2";

const navItems = [
    { path: "/editor-home", label: "Dashboard" },
    { path: "/editor-my-orders", label: "Orders" },
    { path: "/editor-profile", label: "Profile" },
    { path: "/editor-messages", label: "Messages" },
];

const EditorNavbar = ({ onMenuClick }) => {
    const { user, unreadCount } = useAppContext();
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <>
            {/* Desktop Navbar */}
            <header className="hidden md:flex fixed top-0 left-64 right-0 bg-white shadow-sm border-b border-gray-100 h-16 px-8 items-center justify-between z-40 backdrop-blur-sm bg-white/90">
                <div className="flex items-center gap-3">
                    {/* Logo is in sidebar, but we can show breadcrumbs or title here */}
                    <h2 className="text-xl font-bold text-gray-800">
                        {navItems.find(item => item.path === location.pathname)?.label || "SuviX"}
                    </h2>
                </div>

                <div className="flex items-center gap-6">
                    <div
                        className="relative cursor-pointer p-2.5 hover:bg-gray-100 rounded-full transition-all duration-300 group"
                        onClick={() => navigate("/notifications")}
                    >
                        <HiBell className="text-2xl text-gray-500 group-hover:text-green-600 transition-colors" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm transform scale-100 group-hover:scale-110 transition-transform">
                                {unreadCount > 9 ? "9+" : unreadCount}
                            </span>
                        )}
                    </div>

                    <div
                        className="flex items-center gap-3 cursor-pointer group p-1 pr-3 rounded-full hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100"
                        onClick={() => navigate("/editor-profile")}
                    >
                        <img
                            src={user?.profilePicture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                            alt="Profile"
                            className="w-9 h-9 rounded-full border-2 border-green-500 object-cover group-hover:border-green-600 transition shadow-sm"
                        />
                        <span className="font-semibold text-gray-700 group-hover:text-gray-900 transition text-sm">
                            {user?.name || "User"}
                        </span>
                    </div>
                </div>
            </header>

            {/* Mobile Navbar */}
            <div className="md:hidden flex justify-between items-center bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-100 px-4 py-3 sticky top-0 z-40">
                <button
                    onClick={onMenuClick}
                    className="text-2xl text-gray-700 hover:text-green-600 transition p-1"
                    aria-label="Open menu"
                >
                    <HiBars3 />
                </button>

                <div
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => navigate("/")}
                >
                    <img src={logo} alt="SuviX" className="w-8 h-8" />
                    <h2 className="text-lg font-bold text-gray-800">SuviX</h2>
                </div>

                <div className="flex items-center gap-3">
                    <div
                        className="relative cursor-pointer p-2 hover:bg-gray-100 rounded-full transition"
                        onClick={() => navigate("/notifications")}
                    >
                        <HiBell className="text-2xl text-gray-600" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-white">
                                {unreadCount > 9 ? "9+" : unreadCount}
                            </span>
                        )}
                    </div>

                    <div
                        onClick={() => navigate("/editor-profile")}
                        className="relative cursor-pointer"
                    >
                        <img
                            src={user?.profilePicture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                            alt="Profile"
                            className="w-8 h-8 rounded-full border-2 border-green-500 object-cover"
                        />
                    </div>
                </div>
            </div>
        </>
    );
};

export default EditorNavbar;
