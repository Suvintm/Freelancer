import { useState, useEffect } from "react";
import axios from "axios";
import {
  FaArrowLeft,
  FaPlus,
  FaEdit,
  FaTrash,
  FaToggleOn,
  FaToggleOff,
  FaRupeeSign,
  FaClock,
  FaStar,
  FaShoppingCart,
} from "react-icons/fa";
import { useAppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import Sidebar from "../components/Sidebar.jsx";
import EditorNavbar from "../components/EditorNavbar.jsx";

// Default banner for gigs without custom banner
const DEFAULT_GIG_BANNER = "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=400&q=80";

const MyGigs = () => {
  const { backendURL, user } = useAppContext();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingText, setLoadingText] = useState("Loading your gigs...");

  useEffect(() => {
    fetchGigs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchGigs = async () => {
    try {
      setLoading(true);
      const token = user?.token;

      const res = await axios.get(`${backendURL}/api/gigs/my/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setGigs(res.data.gigs || []);
    } catch (err) {
      toast.error("Failed to load gigs");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (gigId, currentStatus) => {
    try {
      const token = user?.token;
      await axios.patch(
        `${backendURL}/api/gigs/${gigId}/toggle`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setGigs((prev) =>
        prev.map((g) => (g._id === gigId ? { ...g, isActive: !currentStatus } : g))
      );

      toast.success(currentStatus ? "Gig paused" : "Gig activated");
    } catch (err) {
      toast.error("Failed to update gig status");
    }
  };

  const handleDelete = async (gigId) => {
    if (!window.confirm("Delete this gig permanently?")) return;

    try {
      const token = user?.token;
      await axios.delete(`${backendURL}/api/gigs/${gigId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setGigs((prev) => prev.filter((g) => g._id !== gigId));
      toast.success("Gig deleted");
    } catch (err) {
      toast.error("Failed to delete gig");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col md:flex-row bg-[#050509] text-white">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <EditorNavbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 flex items-center justify-center md:ml-64 md:mt-20">
          <div className="flex flex-col items-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
            />
            <p className="mt-4 text-gray-400 text-sm">{loadingText}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#050509] light:bg-slate-100 text-white light:text-slate-900 transition-colors duration-200">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <EditorNavbar onMenuClick={() => setSidebarOpen(true)} />

      <main className="flex-1 px-4 md:px-8 py-6 md:ml-64 md:mt-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-3 rounded-xl bg-[#111319] light:bg-white border border-[#262A3B] light:border-slate-200 hover:bg-[#1a1d25] light:hover:bg-slate-100 transition-all light:shadow-sm"
            >
              <FaArrowLeft className="light:text-slate-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white light:text-slate-900">My Gigs</h1>
              <p className="text-gray-400 light:text-slate-500 text-sm">{gigs.length} gigs created</p>
            </div>
          </div>

          <button
            onClick={() => navigate("/create-gig")}
            className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-medium transition-all"
          >
            <FaPlus /> Create Gig
          </button>
        </div>

        {/* Gigs List */}
        {gigs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <FaShoppingCart className="text-6xl text-gray-600 light:text-slate-400 mb-4" />
            <h3 className="text-xl font-semibold text-white light:text-slate-900 mb-2">No gigs yet</h3>
            <p className="text-gray-400 light:text-slate-500 text-sm mb-6">Create your first gig to start getting orders</p>
            <button
              onClick={() => navigate("/create-gig")}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-medium transition-all text-white"
            >
              <FaPlus /> Create Your First Gig
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AnimatePresence>
              {gigs.map((gig, index) => (
                <motion.div
                  key={gig._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-[#111319] light:bg-white border ${
                    gig.isActive ? "border-[#262A3B] light:border-slate-200" : "border-red-500/20"
                  } rounded-2xl overflow-hidden relative light:shadow-md`}
                >
                  {/* Banner Image */}
                  <div className="w-full h-32 overflow-hidden">
                    <img 
                      src={gig.thumbnail || DEFAULT_GIG_BANNER} 
                      alt={gig.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Status Indicator */}
                  {!gig.isActive && (
                    <div className="absolute top-2 right-2 px-3 py-1 bg-red-500/90 text-white text-xs font-medium rounded-full">
                      Paused
                    </div>
                  )}

                  <div className="p-5">
                    <h3 className="font-semibold text-white light:text-slate-900 mb-1 truncate">{gig.title}</h3>
                    <p className="text-gray-400 light:text-slate-500 text-xs mb-3">{gig.category}</p>

                    <div className="flex items-center gap-4 text-xs text-gray-400 light:text-slate-500 mb-4">
                      <span className="flex items-center gap-1 text-green-400 light:text-green-600">
                        <FaRupeeSign /> {gig.price}
                      </span>
                      <span className="flex items-center gap-1">
                        <FaClock /> {gig.deliveryDays}d
                      </span>
                      <span className="flex items-center gap-1">
                        <FaShoppingCart /> {gig.totalOrders}
                      </span>
                      {gig.rating > 0 && (
                        <span className="flex items-center gap-1 text-yellow-500">
                          <FaStar /> {gig.rating.toFixed(1)}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#262A3B] light:border-slate-200">
                      <button
                        onClick={() => handleToggleStatus(gig._id, gig.isActive)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                          gig.isActive
                            ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                            : "bg-gray-500/20 text-gray-400 hover:bg-gray-500/30"
                        }`}
                      >
                        {gig.isActive ? <FaToggleOn /> : <FaToggleOff />}
                        {gig.isActive ? "Active" : "Paused"}
                      </button>
                      <button
                        onClick={() => navigate(`/edit-gig/${gig._id}`)}
                        className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(gig._id)}
                        className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
};

export default MyGigs;
