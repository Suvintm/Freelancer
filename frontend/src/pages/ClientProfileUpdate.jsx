import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppContext } from "../context/AppContext";
import axios from "axios";
import UpdateProfile from "../components/UpdateProfile";
import { useNavigate } from "react-router-dom";
import UnifiedNavigation from "../components/UnifiedNavigation.jsx";
import { HiOutlineCamera, HiOutlinePlus } from "react-icons/hi2";
import { useTheme } from "../context/ThemeContext";

const ClientProfileUpdate = () => {
  const { user, setUser, backendURL } = useAppContext();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  
  const [profileImage, setProfileImage] = useState(
    user?.profilePicture || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
  );
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    // Check if user is a client, if not, redirect or show message 
    // (Though the route should probably be protected in App.jsx too)
    if (user && user.role !== "client" && user.role !== "admin") {
       // navigate("/editor-profile-update"); // Don't redirect automatically to avoid confusion, but we could
    }
    
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, [user, navigate]);

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
      <UnifiedNavigation sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

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
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-12 w-full bg-black/40 p-6 rounded-[32px] border border-white/5">
              <div className="flex flex-row items-center gap-4 md:gap-8">
                <div className="relative group self-center md:self-auto">
                  <div className={`absolute -inset-1.5 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity ${isDark ? "bg-purple-500" : "bg-purple-200"}`} />
                  <div className={`relative p-1 md:p-2 rounded-full border-2 ${isDark ? "border-white bg-white/5" : "border-zinc-200 bg-zinc-50"} shadow-xl`}>
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
                  </div>
                </div>

                <div className="flex flex-col items-start text-left">
                  <h2 className={`text-xl md:text-3xl font-normal tracking-tight mb-0.5 ${isDark ? "text-white" : "text-zinc-900"}`}>
                    {user?.name || "Member"}
                  </h2>
                  <p className={`text-sm font-normal text-emerald-500 uppercase tracking-tighter`}>
                    @{user?.name}
                  </p>
                  <p className={`text-xs font-normal ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                    {user?.email}
                  </p>
                </div>
              </div>

              <motion.button
                onClick={handleUpload}
                disabled={uploading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center gap-2 md:gap-3 px-6 py-3 rounded-2xl font-normal text-xs tracking-wider uppercase transition-all shadow-xl ${
                  isDark 
                  ? "bg-white text-black hover:bg-zinc-100" 
                  : "bg-zinc-900 text-white hover:bg-black"
                } ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <HiOutlineCamera className="w-5 h-5" />
                {uploading ? "Uploading..." : "Save Photo"}
              </motion.button>
            </div>

            {/* Content Hub - Instagram Style Edit Profile */}
            <div className={`pt-1 border-t ${isDark ? "border-white/5" : "border-zinc-100"}`}>
               <UpdateProfile />
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

export default ClientProfileUpdate;
