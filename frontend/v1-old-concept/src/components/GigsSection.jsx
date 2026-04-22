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
  FaEye,
} from "react-icons/fa";
import { useAppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";

/**
 * GigsSection - Displays editor's gigs in a clean grid
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
        <div className="w-6 h-6 border-2 border-zinc-700 border-t-white rounded-full animate-spin" />
        <span className="ml-3 text-zinc-500 text-sm">Loading gigs...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-white">Your Gigs</h3>
          <p className="text-xs text-zinc-500">{gigs.length} gigs created</p>
        </div>
        <button
          onClick={() => navigate("/create-gig")}
          className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg text-xs font-semibold hover:bg-zinc-200 transition-colors"
        >
          <FaPlus className="text-[10px]" /> Create Gig
        </button>
      </div>

      {/* Gigs Grid */}
      {gigs.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-zinc-900 flex items-center justify-center">
            <FaShoppingCart className="text-zinc-600 text-lg" />
          </div>
          <h4 className="text-sm font-medium text-zinc-400 mb-1">No gigs yet</h4>
          <p className="text-xs text-zinc-600 mb-3">Create your first gig to start earning</p>
          <button
            onClick={() => navigate("/create-gig")}
            className="text-xs text-blue-400 font-medium hover:underline"
          >
            Create your first gig →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <AnimatePresence>
            {gigs.map((gig, index) => (
              <motion.div
                key={gig._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: index * 0.03 }}
                className={`relative bg-zinc-900 border ${
                  gig.isActive ? "border-zinc-800" : "border-red-900/50"
                } rounded-lg overflow-hidden hover:border-zinc-600 transition-all group cursor-pointer`}
                onClick={() => navigate("/my-gigs")}
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-zinc-950 overflow-hidden">
                  {gig.thumbnail ? (
                    <img
                      src={gig.thumbnail}
                      alt={gig.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FaPlay className="text-lg text-zinc-700" />
                    </div>
                  )}

                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/edit-gig/${gig._id}`);
                      }}
                      className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30"
                    >
                      <FaEdit className="text-xs" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(gig._id, e)}
                      className="w-8 h-8 bg-red-500/50 rounded-full flex items-center justify-center text-white hover:bg-red-500/70"
                    >
                      <FaTrash className="text-xs" />
                    </button>
                  </div>

                  {/* Status Badge */}
                  {!gig.isActive && (
                    <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-red-500 text-white text-[9px] font-medium rounded">
                      Paused
                    </div>
                  )}

                  {/* Price */}
                  <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 bg-black/70 text-white text-[10px] font-medium rounded flex items-center gap-0.5">
                    <FaRupeeSign className="text-[8px]" />
                    {gig.price}
                  </div>
                </div>

                {/* Content */}
                <div className="p-2.5">
                  <h4 className="font-medium text-white text-xs mb-1.5 line-clamp-1 group-hover:text-blue-400 transition-colors">
                    {gig.title}
                  </h4>

                  {/* Stats Row */}
                  <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                    <span className="flex items-center gap-0.5">
                      <FaClock className="text-[8px]" /> {gig.deliveryDays}d
                    </span>
                    <span className="flex items-center gap-0.5">
                      <FaShoppingCart className="text-[8px]" /> {gig.totalOrders || 0}
                    </span>
                    {gig.rating > 0 && (
                      <span className="flex items-center gap-0.5 text-amber-500">
                        <FaStar className="text-[8px]" /> {gig.rating.toFixed(1)}
                      </span>
                    )}
                  </div>

                  {/* Toggle Button */}
                  <button
                    onClick={(e) => handleToggleStatus(gig._id, gig.isActive, e)}
                    className={`mt-2 w-full flex items-center justify-center gap-1 py-1.5 rounded text-[10px] font-medium transition-all ${
                      gig.isActive
                        ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                        : "bg-zinc-800 text-zinc-500 hover:bg-zinc-700"
                    }`}
                  >
                    {gig.isActive ? <FaToggleOn /> : <FaToggleOff />}
                    {gig.isActive ? "Active" : "Paused"}
                  </button>
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
