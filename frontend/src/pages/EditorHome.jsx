import { useState } from "react";
import {
  FaExclamationCircle,
  FaArrowAltCircleRight,
} from "react-icons/fa";
import { useAppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";
import EditorNavbar from "../components/EditorNavbar.jsx";
import ExploreEditor from "../components/ExploreEditor.jsx";
import ExploreGigs from "../components/ExploreGigs.jsx";

const EditorHome = () => {
  const { user } = useAppContext();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("editors");
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-100">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Navbar */}
      <EditorNavbar onMenuClick={() => setSidebarOpen(true)} />

      {/* Main Content */}
      <main className="flex-1 px-4 md:px-6 py-6 md:ml-64 md:mt-16">
        {/* Profile Incomplete Notice */}
        {!user?.profileCompleted && (
          <div className="bg-gradient-to-r from-green-50 to-green-100 border-2 border-dashed border-green-300 rounded-xl p-5 mb-6 shadow-sm">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="bg-white p-3 rounded-full shadow-sm">
                <FaExclamationCircle className="text-orange-500 text-2xl" />
              </div>
              <div className="flex-1">
                <h3 className="text-green-800 font-semibold text-lg">
                  Complete Your Profile
                </h3>
                <p className="text-gray-600 text-sm mt-1">
                  Your profile is incomplete. To appear in the{" "}
                  <span className="font-semibold">Explore Editors</span> section
                  and get noticed by clients, please complete your profile now.
                </p>
              </div>
              <button
                onClick={() => navigate("/editor-profile")}
                className="bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2 text-white font-medium px-5 py-2.5 rounded-lg transition-all shadow-sm hover:shadow-md"
              >
                Complete Profile <FaArrowAltCircleRight />
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 justify-center mb-6">
          <button
            onClick={() => setActiveTab("editors")}
            className={`px-6 py-2.5 rounded-full font-semibold transition-all ${activeTab === "editors"
                ? "bg-green-500 text-white shadow-md"
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
          >
            Explore Editors
          </button>
          <button
            onClick={() => setActiveTab("gigs")}
            className={`px-6 py-2.5 rounded-full font-semibold transition-all ${activeTab === "gigs"
                ? "bg-green-500 text-white shadow-md"
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
          >
            Explore Gigs
          </button>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
          {activeTab === "editors" && <ExploreEditor />}
          {activeTab === "gigs" && <ExploreGigs />}
        </div>
      </main>
    </div>
  );
};

export default EditorHome;
