import { useState, useEffect } from "react";
import axios from "axios";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaToggleOn,
  FaToggleOff,
  FaRupeeSign,
  FaClock,
  FaStar,
  FaShoppingCart,
  FaPlay,
} from "react-icons/fa";
import { useAppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";

/**
 * GigsSection - Displays editor's gigs in a 2-column grid
 * Used in EditorProfilePages
 */
const GigsSection = () => {
  const { backendURL, user } = useAppContext();
  const navigate = useNavigate();

  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);

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
      console.error("Failed to load gigs:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (gigId, currentStatus, e) => {
    e.stopPropagation();
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

  const handleDelete = async (gigId, e) => {
    e.stopPropagation();
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
      <div className="flex items-center justify-center py-12">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full"
        />
        <span className="ml-3 text-gray-400 text-sm">Loading gigs...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Your Gigs</h3>
          <p className="text-gray-400 text-sm">{gigs.length} gigs created</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/create-gig")}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl font-medium text-sm transition-all shadow-lg shadow-blue-500/20"
        >
          <FaPlus className="text-xs" /> Create Gig
        </motion.button>
      </div>

      {/* Gigs Grid */}
      {gigs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-[#0B1220] rounded-2xl border border-white/5">
          <div className="w-16 h-16 rounded-full bg-[#111827] border border-white/10 flex items-center justify-center mb-4">
            <FaShoppingCart className="text-2xl text-gray-500" />
          </div>
          <h4 className="text-white font-medium mb-1">No gigs yet</h4>
          <p className="text-gray-400 text-sm mb-4">Create your first gig to start getting orders</p>
          <button
            onClick={() => navigate("/create-gig")}
            className="text-blue-400 font-medium hover:underline text-sm"
          >
            Create your first gig →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {gigs.map((gig, index) => (
              <motion.div
                key={gig._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-[#0B1220] border ${
                  gig.isActive ? "border-white/10" : "border-red-500/20"
                } rounded-2xl overflow-hidden hover:border-blue-500/30 transition-all group cursor-pointer`}
                onClick={() => navigate("/my-gigs")}
              >
                {/* Thumbnail */}
                <div className="relative h-32 bg-[#111827] overflow-hidden">
                  {gig.thumbnail ? (
                    <img
                      src={gig.thumbnail}
                      alt={gig.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FaPlay className="text-2xl text-gray-600" />
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  {!gig.isActive && (
                    <div className="absolute top-2 right-2 px-2 py-1 bg-red-500/80 text-white text-xs font-medium rounded-lg">
                      Paused
                    </div>
                  )}
                  
                  {/* Category */}
                  <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 text-white text-xs rounded-lg">
                    {gig.category}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h4 className="font-semibold text-white text-sm mb-2 line-clamp-1 group-hover:text-blue-400 transition-colors">
                    {gig.title}
                  </h4>

                  {/* Stats */}
                  <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                    <span className="flex items-center gap-1 text-green-400 font-medium">
                      <FaRupeeSign className="text-[10px]" /> {gig.price}
                    </span>
                    <span className="flex items-center gap-1">
                      <FaClock className="text-[10px]" /> {gig.deliveryDays}d
                    </span>
                    <span className="flex items-center gap-1">
                      <FaShoppingCart className="text-[10px]" /> {gig.totalOrders}
                    </span>
                    {gig.rating > 0 && (
                      <span className="flex items-center gap-1 text-yellow-500">
                        <FaStar className="text-[10px]" /> {gig.rating.toFixed(1)}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                    <button
                      onClick={(e) => handleToggleStatus(gig._id, gig.isActive, e)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                        gig.isActive
                          ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                          : "bg-gray-500/20 text-gray-400 hover:bg-gray-500/30"
                      }`}
                    >
                      {gig.isActive ? <FaToggleOn /> : <FaToggleOff />}
                      {gig.isActive ? "Active" : "Paused"}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/edit-gig/${gig._id}`);
                      }}
                      className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all"
                    >
                      <FaEdit className="text-xs" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(gig._id, e)}
                      className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
                    >
                      <FaTrash className="text-xs" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default GigsSection;
