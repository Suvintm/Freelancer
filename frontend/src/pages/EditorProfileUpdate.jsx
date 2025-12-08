import { useState, useEffect } from "react";
import { FaArrowAltCircleRight, FaPlus } from "react-icons/fa";
import { motion } from "framer-motion";
import { useAppContext } from "../context/AppContext";
import axios from "axios";
import logo from "../assets/logo.png";
import UpdateProfile from "../components/UpdateProfile"; // ✅ imported

// Optional language options (for UpdateProfile to use)
const LANGUAGE_OPTIONS = [
  "English",
  "Hindi",
  "Kannada",
  "Tamil",
  "Telugu",
  "Malayalam",
  "Marathi",
  "Gujarati",
  "Bengali",
  "Punjabi",
  "Urdu",
  "French",
  "Spanish",
  "German",
  "Arabic",
  "Chinese",
  "Japanese",
  "Korean",
];

const EditorProfileUpdate = () => {
  const { user, setUser, backendURL } = useAppContext();
  const [profileImage, setProfileImage] = useState(
    user?.profilePicture ||
      "https://cdn-icons-png.flaticon.com/512/847/847969.png"
  );
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true); // ✅ shimmer loading

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleBack = () => window.history.back();

  const handleImageChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setProfileImage(URL.createObjectURL(selected)); // preview
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select an image first.");
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

  // ✅ Dark shimmer block
  const ShimmerBlock = ({ className }) => (
    <div
      className={`relative overflow-hidden bg-[#0B1220] rounded-xl ${className}`}
    >
      <div className="absolute inset-0 -translate-x-full bg-[linear-gradient(90deg,transparent,rgba(84, 84, 84, 0.25),transparent)] animate-[shimmer_1.5s_infinite]" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col">
      {/* ✅ Top Navbar - Dark Glass */}
      <nav className="w-full bg-[#050816]/80 border-b border-white/10 backdrop-blur-md py-3.5 px-4 md:px-8 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-2xl overflow-hidden bg-[#0B1220] border border-white/10 flex items-center justify-center">
            <img
              src={logo}
              alt="Logo"
              className="w-8 h-8 rounded-xl object-cover"
            />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-lg font-semibold tracking-tight">SuviX</span>
            <span className="text-[11px] text-gray-400 hidden sm:block">
              Editor Profile · Update
            </span>
          </div>
        </div>

        <motion.button
          onClick={handleBack}
          whileHover={{ x: 2, scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 text-xs md:text-sm 
                     text-gray-200 hover:text-white px-3 py-1.5 rounded-full
                     bg-white/5 border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.7)]"
        >
          <span>Back</span>
          <FaArrowAltCircleRight className="text-base md:text-lg text-[#22C55E]" />
        </motion.button>
      </nav>

      {/* ✅ Main Section */}
      <main className="flex flex-col items-center flex-grow py-8 md:py-10 px-4 md:px-8">
        {loading ? (
          // ✅ Shimmer Skeleton (dark neon style)
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-6xl space-y-6 animate-fadeIn"
          >
            <div className="grid md:grid-cols-[260px,minmax(0,1fr)] gap-6 lg:gap-8">
              {/* Left skeleton (avatar card) */}
              <div className="bg-[#050816] border border-white/10 rounded-3xl p-6 flex flex-col items-center gap-4 shadow-[0_18px_45px_rgba(0,0,0,0.9)]">
                <ShimmerBlock className="w-32 h-32 rounded-full mb-2" />
                <ShimmerBlock className="h-5 w-32" />
                <ShimmerBlock className="h-4 w-40" />
                <ShimmerBlock className="h-10 w-40 mt-2" />
              </div>

              {/* Right skeleton (form card) */}
              <div className="bg-[#050816] border border-white/10 rounded-3xl p-6 md:p-7 shadow-[0_18px_45px_rgba(0,0,0,0.9)] space-y-4">
                <ShimmerBlock className="h-6 w-48" />
                <ShimmerBlock className="h-4 w-1/2" />
                <ShimmerBlock className="h-24 w-full" />
                <ShimmerBlock className="h-24 w-full" />
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-6xl mt-2 md:mt-4 
                       grid gap-6 lg:gap-8 
                       md:grid-cols-[280px,minmax(0,1fr)] items-start"
          >
            {/* ================= LEFT COLUMN: AVATAR + BASIC INFO ================= */}
            <div className="bg-[#050816] border border-white/10 rounded-3xl 
                            px-6 py-1 flex flex-col items-center gap-4 relative">
              {/* Glow accent */}
              <div className="absolute inset-x-10 -top-10 h-28 
                              bg-[radial-gradient(circle_at_top,rgba(0, 0, 0, 0.35),transparent)] pointer-events-none" />

              {/* Profile Image */}
              <div className="relative mt-4">
                <div className="absolute -inset-1 rounded-full
                                bg-gradient-to-br from-[#146322FF] via-transparent to-[#22C5225E]
                                opacity-70 blur-md" />
                <img
                  src={profileImage}
                  alt="Profile"
                  className="relative w-32 h-32 md:w-36 md:h-36 rounded-full object-cover 
                             border-[3px] border-white/80 
                             "
                />

                <label
                  htmlFor="uploadProfile"
                  className="absolute bottom-1 right-1 bg-gradient-to-br from-[#22C55E] to-[#4ADE80]
                             hover:from-[#16A34A] hover:to-[#22C55E]
                             text-white p-2 rounded-full shadow-lg cursor-pointer 
                             border border-emerald-200/70 transition-all duration-200
                             flex items-center justify-center"
                >
                  <FaPlus className="text-xs" />
                  <input
                    id="uploadProfile"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Name + Email */}
              <div className="text-center space-y-1 mt-1">
                <h2 className="text-xl md:text-2xl font-semibold text-white">
                  {user?.name || "Editor Name"}
                </h2>
                <p className="text-xs md:text-sm text-gray-400 break-all">
                  {user?.email}
                </p>
              </div>

              {/* Change Profile Button */}
              <motion.button
                onClick={handleUpload}
                disabled={uploading}
                whileHover={{ scale: uploading ? 1 : 1.03, y: uploading ? 0 : -2 }}
                whileTap={{ scale: uploading ? 1 : 0.98 }}
                className={`mt-4 w-full bg-gradient-to-r from-[#1463FF] to-black/60
                            text-white font-medium px-6 py-2.5 rounded-2xl shadow-lg 
                            text-sm md:text-base flex items-center justify-center
                            transition-all duration-200 ${
                              uploading ? "opacity-70 cursor-not-allowed" : ""
                            }`}
              >
                {uploading ? "Uploading..." : "Change Your Profile Picture"}
              </motion.button>

              {/* Small note */}
              <p className="text-[11px] text-gray-500 text-center mt-1">
                Use a clear, high-quality image for better client trust.
              </p>
            </div>

            {/* ================= RIGHT COLUMN: UPDATE PROFILE FORM ================= */}
            <div className="bg-[#050816] border border-white/10 rounded-3xl 
                            shadow-[0_18px_50px_rgba(0,0,0,0.9)]
                            p-5 md:p-7 lg:p-8 flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
                <div>
                  <h3 className="text-lg md:text-xl font-semibold text-white">
                    Update Your Profile
                  </h3>
                  <p className="text-xs md:text-sm text-gray-400 mt-1">
                    Add your experience, skills, languages, and more. This helps clients
                    understand your editing style & background.
                  </p>
                </div>

                {/* Small badge */}
                <div className="inline-flex items-center px-3 py-1 rounded-full 
                                bg-white/5 border border-white/10 text-[11px] md:text-xs
                                text-gray-300 self-start sm:self-auto">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse" />
                  Profile completion boosts your visibility
                </div>
              </div>

              {/* ✅ Responsive Form Wrapper */}
              <div className="mt-2">
                {/* 
                  We are passing LANGUAGE_OPTIONS so that inside UpdateProfile 
                  you can show a multi-select / chips UI for languages. 
                  (No logic here is changed; you can use this prop in that component.)
                */}
                <UpdateProfile languagesOptions={LANGUAGE_OPTIONS} />
              </div>
            </div>
          </motion.section>
        )}
      </main>

      {/* ✅ Shimmer & Fade-in Keyframes */}
      <style>
        {`
          @keyframes shimmer {
            100% {
              transform: translateX(100%);
            }
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(4px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
    </div>
  );
};

export default EditorProfileUpdate;
