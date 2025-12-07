import { useState } from "react";
import {
  FaExclamationCircle,
  FaArrowAltCircleRight,
} from "react-icons/fa";
import { FaUsers, FaBriefcase, FaPlayCircle } from "react-icons/fa";

import { useAppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";
import EditorNavbar from "../components/EditorNavbar.jsx";
import ExploreEditor from "../components/ExploreEditor.jsx";
import ExploreGigs from "../components/ExploreGigs.jsx";
import { motion } from "framer-motion";

const EditorHome = () => {
  const { user } = useAppContext();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("editors");
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#050509] text-white">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Navbar */}
      <EditorNavbar onMenuClick={() => setSidebarOpen(true)} />

      {/* Main Content */}
      <main className="flex-1 px-4 md:px-8 py-6 md:ml-64 md:mt-20">
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
      bg-[#111319] border border-[#262A3B] 
      rounded-3xl p-2 flex gap-2 md:gap-4 lg:gap-6
      relative
      md:scale-105 lg:scale-110
      transition-all
    "
  >
    {/* Explore Editors */}
    <button
      onClick={() => setActiveTab('editors')}
      className={`
        relative 
        px-5 py-2.5 
        md:px-7 md:py-3 
        lg:px-8 lg:py-3.5 
        rounded-2xl 
        text-sm md:text-base lg:text-lg 
        font-semibold 
        flex items-center gap-2 
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
        <FaUsers className="text-base md:text-lg lg:text-xl" />
        <span>Explore Editors</span>
      </span>
    </button>

    {/* Explore Gigs */}
    <button
      onClick={() => setActiveTab('gigs')}
      className={`
        relative 
        px-5 py-2.5 
        md:px-7 md:py-3 
        lg:px-8 lg:py-3.5 
        rounded-2xl 
        text-sm md:text-base lg:text-lg 
        font-semibold 
        flex items-center gap-2 
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
        <FaBriefcase className="text-base md:text-lg lg:text-xl" />
        <span>Explore Gigs</span>
      </span>
    </button>

    {/* Watch Reels CTA */}
    <button
      onClick={() => navigate('/reels')}
      className="
        px-5 py-2.5 
        md:px-7 md:py-3 
        lg:px-8 lg:py-3.5 
        rounded-2xl 
        text-sm md:text-base lg:text-lg
        font-semibold 
        flex items-center gap-2
        bg-gradient-to-r from-[#1E3A8A] to-[#1D4ED8]
        text-white transition-all
      "
    >
      <FaPlayCircle className="text-lg md:text-xl lg:text-2xl" />
      Watch Reels
    </button>
  </motion.div>
</div>



        {/* Content */}
        <div className="bg-[#111319] border border-[#262A3B] rounded-3xl shadow-[0_18px_50px_rgba(0,0,0,0.7)] p-4 md:p-6">
          {activeTab === "editors" && <ExploreEditor />}
          {activeTab === "gigs" && <ExploreGigs />}
        </div>
      </main>
    </div>
  );
};

export default EditorHome;
