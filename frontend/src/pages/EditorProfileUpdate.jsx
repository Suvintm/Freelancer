import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppContext } from "../context/AppContext";
import axios from "axios";
import UpdateProfile from "../components/UpdateProfile";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";
import EditorNavbar from "../components/EditorNavbar.jsx";
import { HiOutlineCamera, HiOutlinePlus } from "react-icons/hi2";
import { useTheme } from "../context/ThemeContext";
import { useQuery } from "@tanstack/react-query";
import ProfileChecklist from "../components/ProfileChecklist.jsx";

// Optional language options
const LANGUAGE_OPTIONS = [
  "English", "Hindi", "Kannada", "Tamil", "Telugu", "Malayalam", "Marathi", 
  "Gujarati", "Bengali", "Punjabi", "Urdu", "French", "Spanish", "German", 
  "Arabic", "Chinese", "Japanese", "Korean"
];

const EditorProfileUpdate = () => {
  const { user, setUser, backendURL } = useAppContext();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  
  const [profileImage, setProfileImage] = useState(
    user?.profilePicture || "https://cdn-icons-png.flaticon.com/512/847/847969.png"
  );
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const { data: completionRes } = useQuery({
    queryKey: ['completionStatus', 'me'],
    queryFn: async () => {
      const { data } = await axios.get(`${backendURL}/api/profile/completion-status`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      return data;
    },
    enabled: !!user?.token,
  });

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (showHint) {
      const timer = setTimeout(() => setShowHint(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [showHint]);

  const handleImageChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setProfileImage(URL.createObjectURL(selected));
      setShowHint(false);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setShowHint(true);
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("profilePicture", file);

      const token = user?.token;
      const res = await axios.patch(
        `${backendURL}/api/auth/update-profile-picture`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const updatedUser = { ...user, ...res.data.user };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      alert("✅ Profile picture updated successfully!");
    } catch (error) {
      console.error("Error uploading:", error);
      alert("❌ Failed to update profile picture.");
    } finally {
      setUploading(false);
    }
  };

  const ShimmerBlock = ({ className }) => (
    <div className={`relative overflow-hidden ${isDark ? "bg-white/5" : "bg-zinc-100"} rounded-xl ${className}`}>
      <div className="absolute inset-0 -translate-x-full bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.05),transparent)] animate-[shimmer_1.5s_infinite]" />
    </div>
  );

  return (
    <div className={`min-h-screen transition-colors duration-200 ${isDark ? "bg-[#000000]" : "bg-white"} text-white light:text-slate-900 flex flex-col`}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <EditorNavbar onMenuClick={() => setSidebarOpen(true)} />

      <main className="flex-1 md:ml-64 md:mt-16 px-4 md:px-12 py-4 md:py-10 flex flex-col items-center">
        {loading ? (
          <div className="w-full max-w-5xl space-y-12">
             <div className="flex items-center gap-6">
                <ShimmerBlock className="w-32 h-32 rounded-full" />
                <div className="space-y-3">
                   <ShimmerBlock className="h-8 w-64 rounded-lg" />
                   <ShimmerBlock className="h-12 w-48 rounded-2xl" />
                </div>
             </div>
             <ShimmerBlock className="h-[600px] w-full rounded-[48px]" />
          </div>
        ) : (
          <motion.section
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-5xl space-y-4 md:space-y-8"
          >
            {/* ================= AVATAR SECTION ================= */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-12 w-full">
              {/* Left Side: Avatar + Details */}
              <div className="flex flex-row items-center gap-4 md:gap-8">
                {/* Profile Image Circle */}
                <div className="relative group self-center md:self-auto">
                  <div className={`absolute -inset-1.5 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity ${isDark ? "bg-black" : "bg-black"}`} />
                  <div className={`relative p-1 md:p-2 rounded-full border-2 ${isDark ? "border-white bg-white/5" : "border-zinc-200 bg-zinc-50"} shadow-xl shadow-zinc-200/50`}>
                    <img
                      src={profileImage}
                      alt="Profile"
                      className="w-20 h-20 md:w-32 md:h-32 rounded-full object-cover"
                    />
                    <label
                      htmlFor="uploadProfile"
                      className="absolute bottom-0 right-0 p-1.5 md:p-2.5 rounded-full bg-white text-black shadow-2xl cursor-pointer hover:scale-110 active:scale-95 transition-all z-10"
                    >
                      <HiOutlinePlus className="w-4 h-4" />
                      <input id="uploadProfile" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    </label>

                    {/* Animated Hint - Pointing to Plus Icon */}
                    <AnimatePresence>
                      {showHint && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="absolute -top-14 left-1/2 -translate-x-1/2 md:top-auto md:bottom-0 md:left-full md:ml-6 md:translate-x-0 z-50 pointer-events-none whitespace-nowrap"
                        >
                          <div className="flex items-center gap-3 bg-white text-black px-4 py-2.5 rounded-2xl shadow-2xl font-black text-[11px] uppercase tracking-wider relative">
                            {/* Pointing Arrow (Mobile: Down, Desktop: Left) */}
                            <div className="md:hidden absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rotate-45" />
                            <div className="hidden md:block absolute -left-1.5 bottom-3 w-3 h-3 bg-white rotate-45" />
                            
                            <motion.div
                              animate={{ x: [0, -5, 0] }}
                              transition={{ repeat: Infinity, duration: 1.5 }}
                              className="flex items-center gap-2"
                            >
                              <span className="text-emerald-500 text-lg md:block hidden">←</span>
                              <span className="text-emerald-500 text-lg md:hidden block">↓</span>
                              Click here to choose photo
                            </motion.div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Identity Details */}
                <div className="flex flex-col items-start text-left">
                  <h2 className={`text-xl md:text-4xl font-black tracking-tight mb-0.5 ${isDark ? "text-white" : "text-zinc-900"}`}>
                    {user?.name || "Premium Member"}
                  </h2>
                  <p className={`text-sm font-medium ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                    {user?.email}
                  </p>
                </div>
              </div>

              {/* Right Side: Action Button */}
              <motion.button
                onClick={handleUpload}
                disabled={uploading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center gap-2 md:gap-3 px-3 md:px-4 py-1.5 md:py-2 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs tracking-wider uppercase transition-all shadow-xl ${
                  isDark 
                  ? "bg-white text-black hover:bg-zinc-100" 
                  : "bg-zinc-900 text-white hover:bg-black shadow-zinc-200"
                } ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <HiOutlineCamera className="w-4 h-4 md:w-6 md:h-6" />
                {uploading ? "Uploading..." : "Change Photo"}
              </motion.button>
            </div>

            {/* Profile Checklist Integration */}
            <div className="w-full max-w-lg self-center md:self-start mt-2 md:mt-4">
               <ProfileChecklist completionData={completionRes} />
            </div>

            {/* Hub Content */}
            <div className={`pt-8 border-t ${isDark ? "border-white/5" : "border-zinc-100"}`}>
               <UpdateProfile languagesOptions={LANGUAGE_OPTIONS} />
            </div>
          </motion.section>
        )}
      </main>

      <style>
        {`
          @keyframes shimmer {
            100% { transform: translateX(100%); }
          }
        `}
      </style>
    </div>
  );
};

export default EditorProfileUpdate;
