import { useState } from "react";
import {
  FaUserTie,
  FaBriefcase,
  FaCheckCircle,
  FaEnvelope,
  FaExclamationCircle,
  FaArrowAltCircleRight,
} from "react-icons/fa";
import logo from "../assets/logo.png";
import { useAppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import ExploreEditor from "../components/ExploreEditor.jsx";
import ExploreGigs from "../components/ExploreGigs.jsx";

const EditorHome = () => {
  const { user } = useAppContext();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("editors");
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-300">
      {/* Sidebar */}
      <aside
        className={`bg-white shadow-md flex flex-col fixed md:relative z-50 h-full md:h-auto transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } w-64`}
      >
        <div className="flex items-center gap-2 px-6 py-4">
          <img
            onClick={() => navigate("/")}
            src={logo}
            alt="SuviX"
            className="w-10 h-10 cursor-pointer"
          />
          <h1 onClick={() => navigate("/")} className="text-2xl font-bold">
            SuviX
          </h1>
          <button
            className="md:hidden ml-auto"
            onClick={() => setSidebarOpen(false)}
          >
            ✕
          </button>
        </div>
        <nav className="flex-1 px-4 py-2 flex flex-col gap-2">
          <button
            onClick={() => navigate("/editor-home")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-gray-200"
          >
            <FaBriefcase /> Dashboard
          </button>
          <button
            onClick={() => navigate("/editor-my-orders")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-gray-200"
          >
            <FaCheckCircle /> My Orders
          </button>
          <button
            onClick={() => navigate("/editor-profile")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-gray-200"
          >
            <FaUserTie /> Profile
          </button>
          <button
            onClick={() => navigate("/editor-messages")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-gray-200"
          >
            <FaEnvelope /> Messages
          </button>
        </nav>
      </aside>

      {/* Desktop Navbar */}
      <header className="hidden md:flex fixed top-0 left-64 right-0 bg-white shadow-md h-16 px-6 items-center justify-between z-40">
        <div className="flex items-center gap-3">
          <img
            src={logo}
            alt="SuviX"
            className="w-8 h-8 cursor-pointer"
            onClick={() => navigate("/editor-home")}
          />
          <h2 className="text-xl font-bold">SuviX</h2>
        </div>
        <nav className="flex gap-6 text-gray-600 font-medium">
          <button onClick={() => navigate("/editor-home")}>Dashboard</button>
          <button onClick={() => navigate("/editor-my-orders")}>Orders</button>
          <button onClick={() => navigate("/editor-profile")}>Profile</button>
          <button onClick={() => navigate("/editor-messages")}>Messages</button>
        </nav>
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate("/editor-profile")}
        >
          <img
            src={
              user?.profilePicture ||
              "https://randomuser.me/api/portraits/women/44.jpg"
            }
            alt="Profile"
            className="w-9 h-9 rounded-full border-2 border-green-500"
          />
          <span className="font-semibold text-gray-700">
            {user?.name || "Editor"}
          </span>
        </div>
      </header>

      {/* Mobile Navbar */}
      <div className="md:hidden flex justify-between items-center bg-white shadow-md px-4 py-3">
        <button onClick={() => setSidebarOpen(true)}>☰</button>
        <div className="flex items-center gap-2">
          <img
            onClick={() => navigate("/")}
            src={logo}
            alt="SuviX"
            className="w-8 h-8"
          />
          <h2 onClick={() => navigate("/")} className="text-lg font-bold">
            SuviX
          </h2>
        </div>
        <div onClick={() => navigate("/editor-profile")} className="relative">
          <img
            src={
              user?.profilePicture ||
              "https://randomuser.me/api/portraits/women/44.jpg"
            }
            alt="Profile"
            className="w-8 h-8 rounded-full border-2 border-green-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 px-4 md:px-6 py-6 md:ml-64 md:mt-16">
        {/* ✅ Notice: Profile not completed */}
        {!user?.profileCompleted && (
          <div className="bg-green-100 border-2 border-dashed   rounded-xl p-5 mb-6 shadow-sm flex flex-col gap-4">
            <div className="bg-white p-2 rounded-full items-center justify-center flex">
              <FaExclamationCircle className="text-red-600 text-xl" />
            </div>
            <div className="flex-1">
              <h3 className="text-green-700 font-semibold text-lg">
                Complete Your Profile
              </h3>
              <p className="text-gray-700 text-sm mt-1">
                Your profile is incomplete. To appear in the{" "}
                <b>Explore Editors</b> section and get noticed by clients,
                please complete your profile now.
              </p>
            </div>
            <button
              onClick={() => navigate("/editor-profile")}
              className="bg-black flex items-center justify-center gap-4 hover:bg-yellow-600 text-white font-medium px-4 py-2 rounded-lg transition-all"
            >
              Complete Profile <FaArrowAltCircleRight />
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 justify-center mb-6">
          <button
            onClick={() => setActiveTab("editors")}
            className={`px-4 py-2 rounded-full font-semibold ${
              activeTab === "editors"
                ? "bg-green-500 text-white"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            Explore Editors
          </button>
          <button
            onClick={() => setActiveTab("gigs")}
            className={`px-4 py-2 rounded-full font-semibold ${
              activeTab === "gigs"
                ? "bg-green-500 text-white"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            Explore Gigs
          </button>
        </div>

        {activeTab === "editors" && <ExploreEditor />}
        {activeTab === "gigs" && <ExploreGigs />}
      </main>
    </div>
  );
};

export default EditorHome;
