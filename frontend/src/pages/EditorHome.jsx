import { useState, useEffect } from "react";
import {
  FaExclamationCircle,
  FaArrowAltCircleRight,
  FaFacebookMessenger,
  FaPlayCircle,
  FaUsers,
  FaBriefcase,
  FaClipboardList,
  FaChartLine,
  FaArrowRight,
  FaUniversity,
} from "react-icons/fa";
import { useAppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";
import EditorNavbar from "../components/EditorNavbar.jsx";
import ExploreEditor from "../components/ExploreEditor.jsx";
import ExploreGigs from "../components/ExploreGigs.jsx";
import EditorKYCForm from "../components/EditorKYCForm.jsx";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import reelIcon from "../assets/reelicon.png";

const EditorHome = () => {
  const { user, backendURL } = useAppContext();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("editors");
  const [stats, setStats] = useState({ totalOrders: 0, activeGigs: 0 });
  const [showKYC, setShowKYC] = useState(false);
  const navigate = useNavigate();

  // Fetch basic stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = user?.token;
        if (!token) return;

        const [ordersRes, gigsRes] = await Promise.all([
          axios.get(`${backendURL}/api/editor/analytics/orders?period=30`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${backendURL}/api/editor/analytics/gigs`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setStats({
          totalOrders: ordersRes.data.analytics?.totalOrders || 0,
          activeGigs: gigsRes.data.analytics?.activeGigs || 0,
        });
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      }
    };

    fetchStats();
  }, [backendURL, user?.token]);

  // Navigate to chats page when chats tab is selected
  useEffect(() => {
    if (activeTab === "chats") {
      navigate("/chats");
    }
  }, [activeTab, navigate]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#050509] text-white">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <EditorNavbar onMenuClick={() => setSidebarOpen(true)} />

      <main className="flex-1 px-4 md:px-8 py-6 pt-20 md:pt-6 md:ml-64 md:mt-20">
        {/* Profile Incomplete Notice */}
        {!user?.profileCompleted && (
          <div className="bg-gradient-to-r from-[#151823] to-[#111319] border border-[#262A3B] rounded-2xl p-5 md:p-6 mb-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="bg-[#1F2430] p-3 rounded-full">
                <FaExclamationCircle className="text-[#F97316] text-2xl" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold text-lg md:text-xl">
                  Complete Your Profile
                </h3>
                <p className="text-[#9CA3AF] text-sm mt-1">
                  Your profile is incomplete. Complete it to appear in{" "}
                  <span className="font-semibold text-white">Explore Editors</span>{" "}
                  and get noticed by clients.
                </p>
              </div>
              <button
                onClick={() => navigate("/editor-profile")}
                className="bg-[#1463FF] hover:bg-[#275DFF] flex items-center justify-center gap-2 text-white font-medium px-5 py-2.5 rounded-2xl transition-all shadow-[0_12px_30px_rgba(20,99,255,0.55)]"
              >
                Complete Profile <FaArrowAltCircleRight />
              </button>
            </div>
          </div>
        )}

        {/* KYC Banner - Show when not verified */}
        {user?.kycStatus !== "verified" && (
          <div className="bg-gradient-to-r from-[#0f1a14] to-[#0d1911] border border-emerald-500/30 rounded-2xl p-5 md:p-6 mb-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="bg-emerald-500/20 p-3 rounded-full">
                <FaUniversity className="text-emerald-400 text-2xl" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold text-lg md:text-xl">
                  Link Bank Account to Receive Payouts
                </h3>
                <p className="text-gray-400 text-sm mt-1">
                  Complete your KYC verification to receive payments directly to your bank account when orders are completed.
                </p>
              </div>
              <button
                onClick={() => setShowKYC(true)}
                className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 flex items-center justify-center gap-2 text-white font-medium px-5 py-2.5 rounded-2xl transition-all shadow-[0_12px_30px_rgba(16,185,129,0.3)]"
              >
                Complete KYC <FaArrowAltCircleRight />
              </button>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/editor-my-orders")}
            className="bg-[#111319] border border-[#262A3B] hover:border-emerald-500/30 rounded-2xl p-5 flex items-center gap-4 transition-all group"
          >
            <div className="p-3 rounded-xl bg-emerald-500/10">
              <FaClipboardList className="text-emerald-400 text-xl" />
            </div>
            <div className="text-left flex-1">
              <p className="text-white font-medium">My Orders</p>
              <p className="text-gray-500 text-sm">{stats.totalOrders} total</p>
            </div>
            <FaArrowRight className="text-gray-500 group-hover:text-emerald-400 transition-colors" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/my-gigs")}
            className="bg-[#111319] border border-[#262A3B] hover:border-blue-500/30 rounded-2xl p-5 flex items-center gap-4 transition-all group"
          >
            <div className="p-3 rounded-xl bg-blue-500/10">
              <FaBriefcase className="text-blue-400 text-xl" />
            </div>
            <div className="text-left flex-1">
              <p className="text-white font-medium">My Gigs</p>
              <p className="text-gray-500 text-sm">{stats.activeGigs} active</p>
            </div>
            <FaArrowRight className="text-gray-500 group-hover:text-blue-400 transition-colors" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/chats")}
            className="bg-[#111319] border border-[#262A3B] hover:border-purple-500/30 rounded-2xl p-5 flex items-center gap-4 transition-all group"
          >
            <div className="p-3 rounded-xl bg-purple-500/10">
              <FaFacebookMessenger className="text-purple-400 text-xl" />
            </div>
            <div className="text-left flex-1">
              <p className="text-white font-medium">Messages</p>
              <p className="text-gray-500 text-sm">Chat with clients</p>
            </div>
            <FaArrowRight className="text-gray-500 group-hover:text-purple-400 transition-colors" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/editor-analytics")}
            className="bg-[#111319] border border-[#262A3B] hover:border-amber-500/30 rounded-2xl p-5 flex items-center gap-4 transition-all group"
          >
            <div className="p-3 rounded-xl bg-amber-500/10">
              <FaChartLine className="text-amber-400 text-xl" />
            </div>
            <div className="text-left flex-1">
              <p className="text-white font-medium">Analytics</p>
              <p className="text-gray-500 text-sm">View insights</p>
            </div>
            <FaArrowRight className="text-gray-500 group-hover:text-amber-400 transition-colors" />
          </motion.button>
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-center mb-8">
          <motion.div
            layout
            className="inline-flex p-1.5 bg-[#111319] border border-[#262A3B] rounded-2xl shadow-inner"
          >
            {[
              { id: "editors", label: "Explore Editors", icon: FaUsers },
              { id: "gigs", label: "Explore Gigs", icon: FaBriefcase },
              { id: "reels", label: "Reels", icon: FaPlayCircle },
            ].map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => tab.id === "reels" ? navigate("/reels") : setActiveTab(tab.id)}
                className={`relative px-5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                  activeTab === tab.id
                    ? "text-white"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="editorTabBg"
                    className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <tab.icon size={14} />
                  {tab.label}
                </span>
              </motion.button>
            ))}
          </motion.div>
        </div>

        {/* Explore Content */}
        <div className="bg-[#111319] border border-[#262A3B] rounded-3xl p-4 md:p-6">
          {/* Section Header */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">
              {activeTab === "editors" ? "Explore Other Editors" : "Browse Services"}
            </h2>
            <p className="text-gray-400">
              {activeTab === "editors" 
                ? "See what other editors are offering and get inspired"
                : "Find services that complement your skills"
              }
            </p>
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === "editors" && (
              <motion.div
                key="editors"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <ExploreEditor />
              </motion.div>
            )}
            {activeTab === "gigs" && (
              <motion.div
                key="gigs"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <ExploreGigs />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Floating Reels Button */}
        <motion.button
          onClick={() => navigate("/reels")}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="fixed bottom-6 right-6 z-[200] w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/30"
        >
          <img src={reelIcon} alt="reels" className="w-6 h-6 object-contain" />
        </motion.button>
      </main>

      {/* KYC Form Modal */}
      {showKYC && (
        <EditorKYCForm
          onSuccess={() => {
            setShowKYC(false);
          }}
          onClose={() => setShowKYC(false)}
        />
      )}
    </div>
  );
};

export default EditorHome;

