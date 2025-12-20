// SavedEditors.jsx - Client's saved/favorite editors page
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaArrowLeft,
  FaStar,
  FaHeart,
  FaMapMarkerAlt,
  FaBriefcase,
  FaEnvelope,
  FaTrash,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import ClientSidebar from "../components/ClientSidebar.jsx";
import ClientNavbar from "../components/ClientNavbar.jsx";

const SavedEditors = () => {
  const navigate = useNavigate();
  const { user, backendURL } = useAppContext();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [savedEditors, setSavedEditors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSavedEditors = async () => {
      try {
        const token = user?.token;
        if (!token) return;

        const res = await axios.get(`${backendURL}/api/user/saved-editors`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.success) {
          setSavedEditors(res.data.savedEditors);
        }
      } catch (err) {
        console.error("Error fetching saved editors:", err);
        toast.error("Failed to load saved editors");
      } finally {
        setLoading(false);
      }
    };

    fetchSavedEditors();
  }, [user, backendURL]);

  const handleRemove = async (editorId) => {
    try {
      const token = user?.token;
      if (!token) return;

      // Optimistic update
      const prevEditors = [...savedEditors];
      setSavedEditors(prev => prev.filter(e => e._id !== editorId));

      const res = await axios.post(`${backendURL}/api/user/saved-editors/${editorId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        toast.info("Editor removed from saved list");
      } else {
        // Revert if failed
        setSavedEditors(prevEditors);
        toast.error("Failed to remove editor");
      }
    } catch (err) {
      console.error("Error removing editor:", err);
      toast.error("Failed to remove editor");
      // Revert if failed (requires storing previous state, simplified here by refetching or just warning)
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col md:flex-row bg-[#050509] text-white">
        <ClientSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <ClientNavbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 flex items-center justify-center md:ml-64 md:mt-20">
          <div className="flex flex-col items-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full"
            />
            <p className="mt-4 text-gray-400 text-sm">Loading saved editors...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#050509] light:bg-slate-50 text-white light:text-slate-900 transition-colors duration-200">
      <ClientSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <ClientNavbar onMenuClick={() => setSidebarOpen(true)} />

      <main className="flex-1 px-4 md:px-8 py-6 md:ml-64 md:mt-20">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-3 rounded-xl bg-[#111319] border border-[#262A3B] hover:bg-[#1a1d25] transition-all"
          >
            <FaArrowLeft />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <FaHeart className="text-pink-500" />
              Saved Editors
            </h1>
            <p className="text-gray-400 text-sm">{savedEditors.length} editors saved</p>
          </div>
        </div>

        {/* Empty State */}
        {savedEditors.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="w-24 h-24 bg-pink-500/10 rounded-3xl flex items-center justify-center mb-6">
              <FaHeart className="text-5xl text-pink-500/50" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No saved editors yet</h3>
            <p className="text-gray-400 text-sm mb-6 text-center max-w-md">
              While browsing editors, click the heart icon to save your favorites for quick access later.
            </p>
            <button
              onClick={() => navigate("/client-home")}
              className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 rounded-xl font-medium transition-all shadow-lg shadow-pink-500/20"
            >
              Explore Editors
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {savedEditors.map((editor, index) => (
                <motion.div
                  key={editor._id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-[#111319] border border-[#262A3B] rounded-2xl p-5 hover:border-pink-500/30 transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={editor.profilePicture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                      alt={editor.name}
                      className="w-16 h-16 rounded-xl object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate">{editor.name}</h3>
                      <p className="text-gray-400 text-sm">Video Editor</p>
                      {editor.location?.country && (
                        <p className="text-gray-500 text-xs flex items-center gap-1 mt-1">
                          <FaMapMarkerAlt />
                          {editor.location.country}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemove(editor._id)}
                      className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <FaTrash className="text-sm" />
                    </button>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 mt-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <FaStar className="text-yellow-400" />
                      {editor.rating || "4.8"}
                    </span>
                    <span className="flex items-center gap-1">
                      <FaBriefcase />
                      {editor.totalProjects || "10"}+ projects
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => navigate(`/public-profile/${editor._id}`)}
                      className="flex-1 py-2 bg-[#1a1d25] hover:bg-[#262A3B] rounded-xl text-sm font-medium transition-all"
                    >
                      View Profile
                    </button>
                    <button
                      onClick={() => navigate(`/public-profile/${editor._id}`)}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-xl text-sm font-medium transition-all"
                    >
                      <FaEnvelope />
                      Contact
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Feature Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20 rounded-2xl p-5"
        >
          <h4 className="text-white font-semibold mb-2">💡 Tip</h4>
          <p className="text-gray-400 text-sm">
            Save your favorite editors by clicking the heart icon on their profile or in the Explore Editors section. 
            This makes it easy to find them later when you need their services.
          </p>
        </motion.div>
      </main>
    </div>
  );
};

export default SavedEditors;
