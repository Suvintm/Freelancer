import { useState, useEffect } from "react";
import {
  FaExclamationCircle,
  FaArrowAltCircleRight,
  FaFacebookMessenger,
  FaVideo,
} from "react-icons/fa";
import { FaUsers, FaBriefcase, FaPlayCircle } from "react-icons/fa";

import { useAppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";
import EditorNavbar from "../components/EditorNavbar.jsx";
import ExploreEditor from "../components/ExploreEditor.jsx";
import ExploreGigs from "../components/ExploreGigs.jsx";
import { motion } from "framer-motion";
import { BiCameraMovie } from "react-icons/bi";

import reelIcon from "../assets/reelicon.png";



const EditorHome = () => {
  const { user } = useAppContext();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("editors");
  const navigate = useNavigate();

  // Navigate to chats page when chats tab is selected
  useEffect(() => {
    if (activeTab === "chats") {
      navigate("/chats");
    }
  }, [activeTab, navigate]);



  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#050509] text-white">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Navbar */}
      <EditorNavbar onMenuClick={() => setSidebarOpen(true)} />

      {/* Main Content */}
      <main className="flex-1 px-4 md:px-8 py-6 pt-20 md:pt-6 md:ml-64 md:mt-20">
        {/* Profile Incomplete Notice */}
        {!user?.profileCompleted && (
          <div className="bg-gradient-to-r from-[#151823] to-[#111319] border border-[#262A3B] rounded-2xl p-5 md:p-6 mb-6 ">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="bg-[#1F2430] p-3 rounded-full  ">
                <FaExclamationCircle className="text-[#F97316] text-2xl" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold text-lg md:text-xl">
                  Complete Your Profile
                </h3>
                <p className="text-[#9CA3AF] text-sm mt-1">
                  Your profile is incomplete. To appear in the{" "}
                  <span className="font-semibold text-white">Explore Editors</span>{" "}
                  section and get noticed by clients, please complete your profile now.
                </p>
              </div>
              <button
                onClick={() => navigate("/editor-profile")}
                className="bg-[#1463FF] hover:bg-[#275DFF] flex items-center justify-center gap-2 text-white font-medium px-5 py-2.5 rounded-2xl transition-all shadow-[0_12px_30px_rgba(20,99,255,0.55)] hover:shadow-[0_18px_45px_rgba(20,99,255,0.7)]"
              >
                Complete Profile <FaArrowAltCircleRight />
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        {/* Premium Dark Segmented Tabs */}
       <div className="flex items-center justify-center mb-8">
  <motion.div
    layout
    className="
      bg-[#111319] border border-white/40
      rounded-2xl p-2 flex gap-1 md:gap-4 lg:gap-6
      relative transition-all
      max-w-full overflow-x-auto scrollbar-hide
    "
  >
    {/* Explore Editors */}
    <button
      onClick={() => setActiveTab('editors')}
      className={`
        relative 
        px-3 py-4 
        md:px-6 md:py-2.5 
        lg:px-7 lg:py-3
        rounded-2xl 
        text-xs md:text-sm lg:text-base 
        font-semibold 
        flex items-center gap-2 
        whitespace-nowrap
        transition-all
        ${activeTab === 'editors'
          ? 'text-white'
          : 'text-[#9CA3AF] hover:bg-[#151823]'
        }
      `}
    >
      {activeTab === 'editors' && (
        <motion.div
          layoutId="tabBubble"
          className="absolute inset-0 rounded-2xl bg-[#1463FF]/20"
          transition={{
            type: 'spring',
            stiffness: 320,
            damping: 26,
            mass: 0.4,
          }}
        />
      )}
      <span className="relative z-10 flex items-center gap-2">
        <FaUsers className="text-sm md:text-base lg:text-lg" />
        <span>Explore Editors</span>
      </span>
    </button>

    {/* Explore Gigs */}
    <button
      onClick={() => setActiveTab('gigs')}
      className={`
        relative 
        px-3 py-4 
        md:px-6 md:py-2.5 
        lg:px-7 lg:py-3
        rounded-2xl 
        text-xs md:text-sm lg:text-base 
        font-semibold 
        flex items-center gap-2 
        whitespace-nowrap
        transition-all
        ${activeTab === 'gigs'
          ? 'text-white'
          : 'text-[#9CA3AF] hover:bg-[#151823]'
        }
      `}
    >
      {activeTab === 'gigs' && (
        <motion.div
          layoutId="tabBubble"
          className="absolute inset-0 rounded-2xl bg-[#1463FF]/20"
          transition={{
            type: 'spring',
            stiffness: 320,
            damping: 26,
            mass: 0.4,
          }}
        />
      )}
      <span className="relative z-10 flex items-center gap-2">
        <FaBriefcase className="text-sm md:text-base lg:text-lg" />
        <span>Explore Gigs</span>
      </span>
    </button>

    {/* All Chats */}
    <button
      onClick={() => setActiveTab('chats')}
      className={`
        relative 
        px-3 py-4 
        md:px-6 md:py-2.5 
        lg:px-7 lg:py-3
        rounded-2xl 
        text-xs md:text-sm lg:text-base 
        font-semibold 
        flex items-center gap-2 
        whitespace-nowrap
        transition-all
        ${activeTab === 'chats'
          ? 'text-white'
          : 'text-[#9CA3AF] hover:bg-[#151823]'
        }
      `}
    >
      {activeTab === 'chats' && (
        <motion.div
          layoutId="tabBubble"
          className="absolute inset-0 rounded-2xl bg-[#1463FF]/20"
          transition={{
            type: 'spring',
            stiffness: 320,
            damping: 26,
            mass: 0.4,
          }}
        />
      )}
      <span className="relative z-10 flex items-center gap-2">
        <FaFacebookMessenger className="text-sm md:text-base lg:text-lg" />
        <span>All Chats</span>
      </span>
    </button>

    {/* Watch Reels CTA */}
    <button
      onClick={() => navigate('/reels')}
      className="
        px-3 py-4
        md:px-6 md:py-2.5 
        lg:px-7 lg:py-3
        rounded-2xl 
        text-xs md:text-sm lg:text-base 
        font-semibold 
        whitespace-nowrap
        flex items-center gap-2
        bg-gradient-to-r from-[#1E3A8A] to-[#1D4ED8]
        text-white transition-all
      "
    >
      <FaPlayCircle className="text-sm md:text-lg lg:text-xl" />
      Watch Reels
    </button>
  </motion.div>
</div>




        {/* Content */}
        <div className="bg-[#111319] border border-[#262A3B] rounded-3xl shadow-[0_18px_50px_rgba(0,0,0,0.7)] p-2 md:p-6">
          {activeTab === "editors" && <ExploreEditor />}
          {activeTab === "gigs" && <ExploreGigs />}
          {/* Chats tab triggers navigation via useEffect */}
        </div>

       {/* Floating Instagram Reels Button */}
{/* Floating Instagram Reels Button */}
{/* Floating Reels Button */}
<motion.button
  onClick={() => navigate("/reels")}
  initial={{ scale: 0 }}
  animate={{ scale: 1 }}
  transition={{ type: "spring", stiffness: 260, damping: 20 }}
  className="
    fixed bottom-6 right-6 
    z-[200]
    w-13 h-13 
    rounded-full 
    bg-black 
    border border-blue-500
    animate-spin
    flex items-center justify-center
    active:scale-90
  "
>
  <img
    src={reelIcon}
    alt="reels"
    className="w-6 h-6 object-contain"
  />
</motion.button>



      </main>
    </div>
  );
};

export default EditorHome;
