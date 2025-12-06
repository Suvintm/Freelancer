import { useNavigate, useLocation } from "react-router-dom";
import {
    FaBriefcase,
    FaCheckCircle,
    FaUserTie,
    FaEnvelope,
    FaTimes,
} from "react-icons/fa";
import logo from "../assets/logo.png";

const navItems = [
    { path: "/editor-home", icon: FaBriefcase, label: "Dashboard" },
    { path: "/editor-my-orders", icon: FaCheckCircle, label: "My Orders" },
    { path: "/editor-profile", icon: FaUserTie, label: "Profile" },
    { path: "/editor-messages", icon: FaEnvelope, label: "Messages" },
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
            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`bg-white shadow-md flex flex-col fixed top-0 left-0 z-50 h-screen transition-transform duration-300 ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
                    } w-64`}
            >
                {/* Logo */}
                <div className="flex items-center gap-2 px-6 py-4 border-b">
                    <img
                        onClick={() => handleNavigation("/")}
                        src={logo}
                        alt="SuviX"
                        className="w-10 h-10 cursor-pointer hover:opacity-80 transition"
                    />
                    <h1
                        onClick={() => handleNavigation("/")}
                        className="text-2xl font-bold cursor-pointer hover:text-green-600 transition"
                    >
                        SuviX
                    </h1>
                    <button
                        className="md:hidden ml-auto text-gray-500 hover:text-gray-700 text-xl"
                        onClick={onClose}
                        aria-label="Close sidebar"
                    >
                        <FaTimes />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-4 flex flex-col gap-1">
                    {navItems.map(({ path, icon: Icon, label }) => {
                        const isActive = location.pathname === path;
                        return (
                            <button
                                key={path}
                                onClick={() => handleNavigation(path)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                        ? "bg-green-100 text-green-700 font-semibold"
                                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                    }`}
                            >
                                <Icon className={isActive ? "text-green-600" : ""} />
                                {label}
                            </button>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="px-4 py-4 border-t text-xs text-gray-400 text-center">
                    © 2024 SuviX
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
