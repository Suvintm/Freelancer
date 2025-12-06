import { useNavigate, useLocation } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import logo from "../assets/logo.png";

const navItems = [
    { path: "/editor-home", label: "Dashboard" },
    { path: "/editor-my-orders", label: "Orders" },
    { path: "/editor-profile", label: "Profile" },
    { path: "/editor-messages", label: "Messages" },
];

const EditorNavbar = ({ onMenuClick }) => {
    const { user } = useAppContext();
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <>
            {/* Desktop Navbar */}
            <header className="hidden md:flex fixed top-0 left-64 right-0 bg-white shadow-md h-16 px-6 items-center justify-between z-40">
                <div className="flex items-center gap-3">
                    <img
                        src={logo}
                        alt="SuviX"
                        className="w-8 h-8 cursor-pointer hover:opacity-80 transition"
                        onClick={() => navigate("/editor-home")}
                    />
                    <h2 className="text-xl font-bold">SuviX</h2>
                </div>

                <nav className="flex gap-6 text-gray-600 font-medium">
                    {navItems.map(({ path, label }) => {
                        const isActive = location.pathname === path;
                        return (
                            <button
                                key={path}
                                onClick={() => navigate(path)}
                                className={`py-1 border-b-2 transition-all ${isActive
                                        ? "border-green-500 text-green-600 font-semibold"
                                        : "border-transparent hover:text-gray-900 hover:border-gray-300"
                                    }`}
                            >
                                {label}
                            </button>
                        );
                    })}
                </nav>

                <div
                    className="flex items-center gap-3 cursor-pointer group"
                    onClick={() => navigate("/editor-profile")}
                >
                    <img
                        src={user?.profilePicture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                        alt="Profile"
                        className="w-9 h-9 rounded-full border-2 border-green-500 object-cover group-hover:border-green-600 transition"
                    />
                    <span className="font-semibold text-gray-700 group-hover:text-gray-900 transition">
                        {user?.name || "User"}
                    </span>
                </div>
            </header>

            {/* Mobile Navbar */}
            <div className="md:hidden flex justify-between items-center bg-white shadow-md px-4 py-3 sticky top-0 z-40">
                <button
                    onClick={onMenuClick}
                    className="text-2xl text-gray-700 hover:text-gray-900 transition"
                    aria-label="Open menu"
                >
                    ☰
                </button>

                <div
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => navigate("/")}
                >
                    <img src={logo} alt="SuviX" className="w-8 h-8" />
                    <h2 className="text-lg font-bold">SuviX</h2>
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
        </>
    );
};

export default EditorNavbar;
