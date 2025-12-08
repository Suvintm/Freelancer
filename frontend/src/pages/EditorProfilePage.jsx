import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaEdit,
  FaEnvelope,
  FaMapMarkerAlt,
  FaAward,
  FaCode,
  FaLanguage,
  FaBriefcase,
  FaUser,
  FaTimes,
  FaCheckCircle,
  FaImages,
  FaChevronRight,
} from "react-icons/fa";
import axios from "axios";
import { useAppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import ReactCountryFlag from "react-country-flag";
import { FaStar } from "react-icons/fa";

import Sidebar from "../components/Sidebar.jsx";
import EditorNavbar from "../components/EditorNavbar.jsx";
import PortfolioSection from "../components/PortfolioSection.jsx";

// ----------------------------------------------
// Country Code Mapping
// ----------------------------------------------
const countryNameToCode = {
  Afghanistan: "AF",
  Albania: "AL",
  Algeria: "DZ",
  Andorra: "AD",
  Angola: "AO",
  Argentina: "AR",
  Armenia: "AM",
  Australia: "AU",
  Austria: "AT",
  Azerbaijan: "AZ",
  Bangladesh: "BD",
  Belgium: "BE",
  Brazil: "BR",
  Canada: "CA",
  Chile: "CL",
  China: "CN",
  Colombia: "CO",
  Croatia: "HR",
  Cuba: "CU",
  Czechia: "CZ",
  Denmark: "DK",
  Egypt: "EG",
  Finland: "FI",
  France: "FR",
  Germany: "DE",
  Ghana: "GH",
  Greece: "GR",
  Hungary: "HU",
  Iceland: "IS",
  India: "IN",
  Indonesia: "ID",
  Iran: "IR",
  Iraq: "IQ",
  Ireland: "IE",
  Israel: "IL",
  Italy: "IT",
  Japan: "JP",
  Kenya: "KE",
  Malaysia: "MY",
  Mexico: "MX",
  Nepal: "NP",
  Netherlands: "NL",
  "New Zealand": "NZ",
  Nigeria: "NG",
  Norway: "NO",
  Pakistan: "PK",
  Peru: "PE",
  Poland: "PL",
  Portugal: "PT",
  Qatar: "QA",
  Romania: "RO",
  Russia: "RU",
  SaudiArabia: "SA",
  Singapore: "SG",
  Slovakia: "SK",
  Slovenia: "SI",
  SouthAfrica: "ZA",
  Spain: "ES",
  SriLanka: "LK",
  Sweden: "SE",
  Switzerland: "CH",
  Thailand: "TH",
  Turkey: "TR",
  Ukraine: "UA",
  UAE: "AE",
  UK: "GB",
  USA: "US",
  Vietnam: "VN",
  Zimbabwe: "ZW",
};

// ----------------------------------------------
// Animation Variants
// ----------------------------------------------
const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

// ----------------------------------------------
// Main Component
// ----------------------------------------------
const EditorProfile = () => {
  const { user, backendURL } = useAppContext();
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState("about");
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCert, setSelectedCert] = useState(null);

  const navigate = useNavigate();

  // ----------------------------------------------
  // Fetch Profile (logic unchanged)
  // ----------------------------------------------
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${backendURL}/api/profile`, {
          headers: { Authorization: `Bearer ${user?.token}` },
        });
        setProfile(res.data.profile);
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [backendURL, user?.token]);

  // ----------------------------------------------
  // LOADING SCREEN — Dark Neon
  // ----------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative w-24 h-24 mx-auto mb-6">
            {/* Outer dim ring */}
            <div className="absolute inset-0 rounded-full border-4 border-[#111827]" />

            {/* Blue neon ring */}
            <div className="absolute inset-1 rounded-full border-[3px] border-[#1463FF] border-t-transparent animate-spin shadow-[0_0_28px_rgba(20,99,255,0.7)]" />

            {/* Green reverse ring */}
            <div className="absolute inset-3 rounded-full border-[2px] border-[#22C55E]/70 border-b-transparent animate-spin [animation-direction:reverse] shadow-[0_0_20px_rgba(34,197,94,0.7)]" />
          </div>

          <p className="text-gray-300 text-sm tracking-wide">
            Loading your editor profile...
          </p>
        </motion.div>
      </div>
    );
  }

  // ----------------------------------------------
  // NO PROFILE — Dark Glass Card
  // ----------------------------------------------
  if (!profile) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center bg-[#050816] rounded-3xl
                     shadow-[0_18px_60px_rgba(0,0,0,0.9)]
                     border border-white/5 p-10 max-w-md w-full"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-[#1463FF] via-[#1E3A8A] to-[#22C55E]
                          rounded-2xl flex items-center justify-center mx-auto mb-6
                          shadow-[0_20px_60px_rgba(20,99,255,0.7)]">
            <FaUser className="text-white text-4xl" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">
            Complete Your Editor Profile
          </h2>

          <p className="text-gray-400 text-sm mb-6">
            Set up your professional presence so clients can discover and hire you.
          </p>

          <motion.button
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/editor-profile-update")}
            className="bg-gradient-to-r from-[#1463FF] via-[#2563EB] to-[#22C55E]
                       text-white px-8 py-3 rounded-2xl font-semibold
                       shadow-[0_18px_45px_rgba(20,99,255,0.85)]
                       hover:shadow-[0_22px_60px_rgba(20,99,255,1)]
                       transition-all"
          >
            Create Profile
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // ----------------------------------------------
  // Tabs (logic unchanged)
  // ----------------------------------------------
  const tabs = [
    { id: "about", label: "About", icon: FaUser },
    { id: "portfolio", label: "Portfolio", icon: FaImages },
  ];

  // ----------------------------------------------
  // MAIN PAGE LAYOUT — 2 Column (Profile + Content)
  // ----------------------------------------------
  return (
    <div className="min-h-screen bg-[#020617] text-white">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <EditorNavbar onMenuClick={() => setSidebarOpen(true)} />

      <main className="md:ml-64 pt-16 lg:pt-35 md:pt-20 px-4 md:px-8 pb-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-6xl mx-auto grid gap-6 lg:gap-8
                     md:grid-cols-[320px,minmax(0,1fr)]"
        >
          {/* ------------------------------------------------ */}
          {/* LEFT COLUMN — PROFILE CARD                       */}
          {/* ------------------------------------------------ */}
          <motion.section
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.45 }}
            className="bg-[#050816] border border-white/5 rounded-tr-4xl rounded-bl-4xl
                       shadow-[0_18px_45px_rgba(0,0,0,0.9)]
                       relative overflow-hidden flex flex-col"
          >
            {/* Subtle background gradient */}
            <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

            <div className="relative p-6 md:p-7 lg:p-8 flex flex-col gap-6">
              {/* Avatar + Name */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  {/* Glow outline */}
                  <div className="absolute -inset-1 rounded-full
                                  bg-gradient-to-br from-[#1463FF] via-transparent to-[#22C55E]
                                  opacity-90 blur-md" />

                  <img
                    src={
                      profile?.user?.profilePicture ??
                      "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                    }
                    alt="Profile"
                    className="relative w-28 h-28 md:w-32 md:h-32 rounded-full object-cover
                               border-[3px] border-white/80
                               shadow-[0_18px_45px_rgba(0,0,0,0.9)]"
                  />

                  {/* Verified Badge */}
                  <div className="absolute -bottom-1 -right-2 w-5 h-5
                                  bg-gradient-to-br from-[#22C55E] to-[#4ADE80]
                                  rounded-4xl flex items-center justify-center
                                  
                                  border border-emerald-300/70">
                    <FaCheckCircle className="text-white text-lg" />
                  </div>
                </div>

                <div className="text-center space-y-1">
                  <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
                    {profile?.user?.name}
                  </h1>
                  <p className="text-xs md:text-sm text-gray-400">
                    {profile?.user?.role === "editor"
                      ? "Professional Video Editor"
                      : "Client"}
                  </p>
                </div>
              </div>

              {/* Location / Experience / Email Chips */}
              <div className="flex flex-wrap justify-center gap-2.5">
                {/* Country */}
                {profile.location?.country && (
                  <div className="flex items-center gap-2 bg-[#020617]
                                  border border-white/10 rounded-full px-3.5 py-1.5
                                  shadow-[0_10px_30px_rgba(0,0,0,0.9)]">
                    <FaMapMarkerAlt className="text-yellow-200 text-xs" />
                    <ReactCountryFlag
                      countryCode={
                        countryNameToCode[profile.location.country] || "IN"
                      }
                      svg
                      style={{ width: "1.1em", height: "1.1em" }}
                    />
                    <span className="text-[11px] md:text-xs text-gray-200 font-medium">
                      {profile.location.country}
                    </span>
                  </div>
                )}

                {/* Experience */}
                {profile.experience && (
                  <div className="flex items-center gap-2 bg-[#020617]
                                  border border-purple-500/30 rounded-full px-3.5 py-1.5">
                    <FaBriefcase className="text-green-400 text-xs" />
                    <span className="text-[11px] md:text-xs text-purple-100 font-medium">
                      {profile.experience}
                    </span>
                  </div>
                )}

                {/* Email */}
                {profile.contactEmail && (
                  <div className="flex items-center gap-2 bg-[#020617]
                                  border border-blue-500/30 rounded-full px-3.5 py-1.5 
                                  max-w-full">
                    <FaEnvelope className="text-white text-xs" />
                    <span className="text-[11px] md:text-xs text-blue-100 font-medium truncate max-w-[150px] md:max-w-[190px]">
                      {profile.contactEmail}
                    </span>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

              {/* Quick Stats (optional upgrades later) */}
              <div className="grid grid-cols-3 gap-3 text-center text-[11px] md:text-xs text-gray-300">
                <div className="bg-white/5 border flex items-center justify-center gap-2 border-white/10 rounded-2xl py-2.5">
                <FaStar className="text-yellow-400 text-xs flex items-center justify-center" />
                <div>
                   <p className="font-semibold text-white/90 text-sm">4.9</p>
                  <p className="text-[10px] text-gray-400">Rating</p>
                </div>
                  
                   
                
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl py-2.5">
                  <p className="font-semibold text-white/90 text-sm">24+</p>
                  <p className="text-[10px] text-gray-400">Projects</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl py-2.5">
                  <p className="font-semibold text-white/90 text-sm">2 yrs</p>
                  <p className="text-[10px] text-gray-400">Experience</p>
                </div>
              </div>

              {/* Edit Button */}
              <motion.button
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/editor-profile-update")}
                className="w-full mt-1 bg-gradient-to-r from-[#1463FF]  to-black
                           text-white py-2.5 rounded-2xl text-sm md:text-base
                           font-semibold  
                           transition-all flex items-center justify-center gap-2"
              >
                <FaEdit className="text-sm md:text-base" />
                <span>Edit Profile</span>
              </motion.button>
            </div>
          </motion.section>

          {/* ------------------------------------------------ */}
          {/* RIGHT COLUMN — TABS + CONTENT                    */}
          {/* ------------------------------------------------ */}
          <motion.section
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.45, delay: 0.05 }}
            className="bg-[#050816] border border-white/5 rounded-3xl
                       shadow-[0_18px_50px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col"
          >
            {/* Tab Headers */}
            <div className="flex border-b border-white/5">
              {tabs.map((tab) => (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 md:py-4
                              text-xs md:text-sm lg:text-base font-semibold transition-all relative
                              ${
                                activeTab === tab.id
                                  ? "text-white"
                                  : "text-gray-400 hover:text-gray-100 hover:bg-white/5"
                              }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center border
                      ${
                        activeTab === tab.id
                          ? "border-[#1463FF]/60 bg-[#0B1220]"
                          : "border-white/10 bg-[#020617]"
                      }`}
                  >
                    <tab.icon
                      className={
                        activeTab === tab.id ? "text-[#60A5FA]" : "text-gray-500"
                      }
                    />
                  </div>

                  <span>{tab.label}</span>

                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="editorProfileActiveTab"
                      className="absolute bottom-0 left-0 right-0 h-[3px]
                                 bg-blue-500 max-w-[150px] mx-auto rounded-full
                                  "
                    />
                  )}
                </motion.button>
              ))}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              {/* ---------------- ABOUT TAB ---------------- */}
              {activeTab === "about" && (
                <motion.div
                  key="about"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.25 }}
                  className="p-6 md:p-8 text-gray-200 space-y-8 overflow-y-auto"
                >
                  <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                    className="space-y-10"
                  >
                    {/* About Me */}
                    {profile.about && (
                      <motion.div variants={fadeInUp} className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 md:w-12 md:h-12 rounded-xl 
                                           bg-black border border-white/10
                                          flex items-center justify-center
                                           ">
                            <FaUser className="text-white text-base md:text-lg" />
                          </div>
                          <h3 className="text-lg md:text-xl font-bold text-white tracking-wide">
                            About Me
                          </h3>
                        </div>

                        <p className="leading-relaxed text-gray-300 
                                      bg-[#0A0F1E] p-4 md:p-5 rounded-2xl
                                      border border-white/10 
                                      text-sm md:text-base 
                                      shadow-[0_0_25px_rgba(0,0,0,0.4)]">
                          {profile.about}
                        </p>
                      </motion.div>
                    )}

                    {/* Skills */}
                    {profile.skills?.length > 0 && (
                      <motion.div variants={fadeInUp} className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 md:w-12 md:h-12 rounded-xl 
                                           bg-black border border-white/10
                                          flex items-center justify-center">
                            <FaCode className="text-white text-base md:text-lg" />
                          </div>
                          <h3 className="text-lg md:text-xl font-bold text-white tracking-wide">
                            Skills
                          </h3>
                        </div>

                        <div className="flex flex-wrap gap-2.5">
                          {profile.skills.map((skill, index) => (
                            <motion.span
                              key={index}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.04 }}
                              whileHover={{ scale: 1.06, y: -2 }}
                              className="px-4 py-2 rounded-xl text-xs md:text-sm font-medium
                                         bg-[#0B1220] border border-white/10 text-gray-200
                                         hover:border-[#1463FF]/50 transition-all"
                            >
                              {skill}
                            </motion.span>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Languages */}
                    {profile.languages?.length > 0 && (
                      <motion.div variants={fadeInUp} className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 md:w-12 md:h-12 rounded-xl 
                                           bg-black border border-white/10
                                          flex items-center justify-center">
                            <FaLanguage className="text-white text-base md:text-lg" />
                          </div>
                          <h3 className="text-lg md:text-xl font-bold text-white tracking-wide">
                            Languages
                          </h3>
                        </div>

                        <div className="flex flex-wrap gap-2.5">
                          {profile.languages.map((language, index) => (
                            <motion.span
                              key={index}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.04 }}
                              whileHover={{ scale: 1.06, y: -2 }}
                              className="px-4 py-2 rounded-xl text-xs md:text-sm font-medium
                                         bg-[#0B1220] border border-white/10 text-gray-200
                                         hover:border-[#EC4899]/40 transition-all"
                            >
                              {language}
                            </motion.span>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Certifications */}
                    {profile.certifications?.length > 0 && (
                      <motion.div variants={fadeInUp} className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 md:w-12 md:h-12 rounded-xl 
                                           bg-black border border-white/10
                                          flex items-center justify-center">
                            <FaAward className="text-white text-base md:text-lg" />
                          </div>
                          <h3 className="text-lg md:text-xl font-bold text-white tracking-wide">
                            Certifications
                          </h3>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                          {profile.certifications.map(
                            (cert, index) =>
                              cert.image && (
                                <motion.div
                                  key={index}
                                  initial={{ opacity: 0, y: 18 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.08 }}
                                  whileHover={{ y: -6, scale: 1.02 }}
                                  onClick={() => {
                                    setSelectedCert(cert);
                                    setModalOpen(true);
                                  }}
                                  className="group relative rounded-2xl overflow-hidden cursor-pointer
                                             bg-[#050816] border border-white/10
                                             shadow-[0_0_25px_rgba(0,0,0,0.6)]
                                             hover:border-[#1463FF]/40 transition-all"
                                >
                                  <div className="relative h-36 md:h-40 overflow-hidden">
                                    <img
                                      src={cert.image}
                                      alt={cert.title}
                                      className="w-full h-full object-cover group-hover:scale-110 
                                                 transition-transform duration-500"
                                    />

                                    <div className="absolute inset-0
                                                    bg-gradient-to-t from-black/60 to-transparent
                                                    opacity-0 group-hover:opacity-100 
                                                    transition-opacity" />

                                    <div className="absolute bottom-3 right-3 opacity-0 
                                                    group-hover:opacity-100 transition">
                                      <div className="bg-white/20 backdrop-blur-md px-2 py-2 
                                                      rounded-lg border border-white/20">
                                        <FaChevronRight className="text-white text-sm" />
                                      </div>
                                    </div>
                                  </div>

                                  <div className="p-3.5 md:p-4">
                                    <p className="font-semibold text-gray-200 truncate text-sm">
                                      {cert.title || "Certificate"}
                                    </p>
                                  </div>
                                </motion.div>
                              )
                          )}
                        </div>
                      </motion.div>
                    )}

                    {/* Empty About State */}
                    {!profile.about &&
                      !profile.skills?.length &&
                      !profile.languages?.length &&
                      !profile.certifications?.length && (
                        <motion.div
                          variants={fadeInUp}
                          className="text-center py-12 md:py-14"
                        >
                          <div className="w-20 h-20 rounded-full bg-[#0B1220] border border-white/10 
                                          flex items-center justify-center mx-auto mb-4
                                          shadow-[0_0_30px_rgba(0,0,0,0.6)]">
                            <FaUser className="text-gray-500 text-3xl" />
                          </div>

                          <h3 className="text-lg font-semibold text-white mb-1">
                            No profile details yet
                          </h3>

                          <p className="text-gray-400 mb-4 text-sm">
                            Add information to make your profile stand out.
                          </p>

                          <button
                            onClick={() => navigate("/editor-profile-update")}
                            className="text-[#1463FF] font-medium hover:underline text-sm"
                          >
                            Update Profile →
                          </button>
                        </motion.div>
                      )}
                  </motion.div>
                </motion.div>
              )}

              {/* ---------------- PORTFOLIO TAB ---------------- */}
              {activeTab === "portfolio" && (
                <motion.div
                  key="portfolio"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.25 }}
                  className="p-6 md:p-8 bg-[#050816] rounded-b-3xl
                             border-t border-white/5 shadow-[0_0_30px_rgba(0,0,0,0.6)]
                             overflow-y-auto"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-11 h-11 md:w-12 md:h-12 rounded-xl 
                                           bg-black border border-white/10
                                          flex items-center justify-center">
                      <FaImages className="text-white text-base md:text-lg" />
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-white tracking-wide">
                      Portfolio Gallery
                    </h3>
                  </div>

                  <div
                    className="bg-[#020617] rounded-2xl p-4 md:p-5 
                               border border-white/10 
                               shadow-[0_0_25px_rgba(0,0,0,0.6)]"
                  >
                    <PortfolioSection />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>
        </motion.div>
      </main>

      {/* ---------------- CERTIFICATION MODAL ---------------- */}
      <AnimatePresence>
        {modalOpen && selectedCert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md
                       flex items-center justify-center z-50 p-4"
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 24, stiffness: 260 }}
              className="relative w-full max-w-3xl rounded-3xl overflow-hidden
                         shadow-[0_0_40px_rgba(20,99,255,0.4)]
                         border border-white/10 bg-[#050816]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setModalOpen(false)}
                className="absolute top-5 right-5 w-11 h-11 md:w-12 md:h-12
                           rounded-2xl bg-white/5 hover:bg-white/10
                           flex items-center justify-center text-white
                           shadow-[0_0_15px_rgba(20,99,255,0.6)]
                           backdrop-blur-lg border border-white/10"
              >
                <FaTimes className="text-lg md:text-xl" />
              </motion.button>

              {/* Title */}
              <div className="p-5 md:p-6 pb-2">
                <h3 className="text-lg md:text-2xl font-bold text-white tracking-wide pr-14">
                  {selectedCert.title || "Certificate"}
                </h3>
              </div>

              {/* Image */}
              <div className="p-5 md:p-6 pt-0">
                <motion.img
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25 }}
                  src={selectedCert.image}
                  alt={selectedCert.title}
                  className="w-full max-h-[70vh] object-contain rounded-2xl
                             border border-white/10 
                             shadow-[0_0_35px_rgba(0,0,0,0.6)]"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EditorProfile;
