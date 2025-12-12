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
  FaStar,
  FaCheckCircle,
  FaImages,
  FaChevronRight,
  FaFilm,
  FaPlay,
  FaStarAndCrescent,
  FaRupeeSign,
  FaCalendarAlt,
  FaPaperPlane,
} from "react-icons/fa";
import axios from "axios";
import { useAppContext } from "../context/AppContext";
import { useNavigate, useParams } from "react-router-dom";
import ReactCountryFlag from "react-country-flag";
import Sidebar from "../components/Sidebar.jsx";
import EditorNavbar from "../components/EditorNavbar.jsx";
import PortfolioSection from "../components/PortfolioSection.jsx";
import { toast } from "react-toastify";

// Country name to ISO Alpha-2 code mapping
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

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 },
};

const EditorProfile = () => {
  const { user, backendURL } = useAppContext();
  const { userId } = useParams(); // Get userId from URL params
  const [profile, setProfile] = useState(null);
  const [reels, setReels] = useState([]);
  const [activeTab, setActiveTab] = useState("about");
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCert, setSelectedCert] = useState(null);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [requestData, setRequestData] = useState({
    description: "",
    amount: "",
    deadline: "",
  });
  const [submittingRequest, setSubmittingRequest] = useState(false);

  const navigate = useNavigate();

  // Handle request submission
  const handleSubmitRequest = async () => {
    if (!requestData.amount || requestData.amount < 100) {
      toast.error("Please enter an amount (min ₹100)");
      return;
    }
    if (!requestData.deadline) {
      toast.error("Please select a deadline");
      return;
    }
    if (!requestData.description.trim()) {
      toast.error("Please describe your project");
      return;
    }

    try {
      setSubmittingRequest(true);
      const token = user?.token;

      await axios.post(
        `${backendURL}/api/orders/request`,
        {
          editorId: profile.user._id,
          title: `Project request from ${user?.name}`,
          description: requestData.description.trim(),
          amount: Number(requestData.amount),
          deadline: requestData.deadline,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Request sent! Editor will review your request.");
      setRequestModalOpen(false);
      setRequestData({ description: "", amount: "", deadline: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send request");
    } finally {
      setSubmittingRequest(false);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Use userId from params if available, otherwise fallback to logged-in user
        const targetId = userId || user?._id;
        if (!targetId) return;

        const res = await axios.get(`${backendURL}/api/profile/${targetId}`);
        setProfile(res.data.profile);
        setReels(res.data.reels || []);
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [backendURL, userId, user?._id]);

  // Premium Loading State (dark)
  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-[#1F2937] rounded-full" />
            <div className="absolute inset-1 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-gray-300 font-medium text-sm">
            Loading profile...
          </p>
        </motion.div>
      </div>
    );
  }

  // No Profile State (dark)
  if (!profile) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center bg-[#0B1120] rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.75)] p-10 max-w-md border border-[#1F2937]"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-emerald-300 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_18px_45px_rgba(16,185,129,0.7)]">
            <FaUser className="text-white text-4xl" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Profile Not Found
          </h2>
          <p className="text-gray-400 mb-6 text-sm">
            The user profile you are looking for does not exist or is
            unavailable.
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/explore")}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-full font-semibold shadow-lg"
          >
            Explore Editors
          </motion.button>
        </motion.div>
      </div>
    );
  }

  const tabs = [
    { id: "about", label: "About", icon: FaUser },
    { id: "portfolio", label: "Portfolio", icon: FaImages },
    { id: "reels", label: "Reels", icon: FaFilm },
  ];

  const isOwner = user?._id === profile.user._id;

  return (
    <div className="min-h-screen bg-zinc-900 text-gray-100">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <EditorNavbar onMenuClick={() => setSidebarOpen(true)} />

      {/* Main Content */}
      <div className="md:ml-64 pt-16 lg:pt-35 md:pt-35 px-4 md:px-8 pb-12">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Profile Hero Section - dark corporate */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ duration: 0.5 }}
            className="relative rounded-3xl overflow-hidden bg-black border border-white shadow-[0_20px_60px_rgba(0,0,0,0.9)]"
          >
            {/* Top subtle gradient banner */}
            <div className="absolute inset-x-0 top-0 h-40  ">
              <div className="absolute inset-0 opacity-20">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <defs>
                    <pattern
                      id="profileDotsPublic"
                      width="8"
                      height="8"
                      patternUnits="userSpaceOnUse"
                    >
                      <circle cx="1" cy="1" r="0.7" fill="#ffffffff" />
                    </pattern>
                  </defs>
                  <rect
                    width="100"
                    height="100"
                    fill="url(#profileDotsPublic)"
                  />
                </svg>
              </div>
            </div>

            {/* Content */}
            <div className="relative pt-24 pb-6 px-6 md:px-10">
              <div className="flex flex-col md:flex-row gap-6 md:gap-8">
                {/* Left: Avatar + basic info */}
                <div className="flex flex-col items-center md:items-start gap-4 md:w-1/3">
                  <motion.div
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.15 }}
                    className="relative -mt-20"
                  >
                    <div className="relative">
                      {/* Subtle ring */}
                      <div className="absolute -inset-1 rounded-full " />
                      <img
                        src={
                          profile?.user?.profilePicture ||
                          "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                        }
                        alt="Profile"
                        className="relative w-32 h-32 md:w-36 md:h-36 rounded-full object-cover border-[3px] border-white "
                      />
                      <div className="absolute -bottom-2 -right-1 w-9 h-9 bg-emerald-500 rounded-full flex items-center justify-center border border-white/20">
                        <FaCheckCircle className="text-white text-lg" />
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="text-center md:text-left"
                  >
                    <h1 className="text-2xl md:text-3xl font-semibold text-white tracking-tight">
                      {profile?.user?.name}
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">
                      {profile?.user?.role === "editor"
                        ? "Professional Video Editor"
                        : "Client"}
                    </p>
                    {profile.experience && (
                      <p className="text-xs text-gray-500 mt-1">
                        Experience:{" "}
                        <span className="text-gray-300">
                          {profile.experience}
                        </span>
                      </p>
                    )}
                  </motion.div>
                </div>

                {/* Right: Stats & contact */}
                <div className="flex-1 flex flex-col justify-between">
                  <div className="flex flex-wrap gap-3 justify-center md:justify-end">
                    {/* Country */}
                    {profile.location?.country && (
                      <div className="flex items-center gap-2 bg-[#020617] border border-[#1F2937] rounded-full px-4 py-2 text-xs shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
                        <FaMapMarkerAlt className="text-emerald-400" />
                        <ReactCountryFlag
                          countryCode={
                            countryNameToCode[profile.location.country] || "IN"
                          }
                          svg
                          style={{ width: "1.2em", height: "1.2em" }}
                        />
                        <span className="text-gray-200 font-medium">
                          {profile.location.country}
                        </span>
                      </div>
                    )}

                    {/* Email */}
                    {profile.contactEmail && (
                      <div className="flex items-center gap-2 bg-[#020617] border border-[#1F2937] rounded-full px-4 py-2 text-xs">
                        <FaEnvelope className="text-gray-400" />
                        <span className="text-gray-300 font-medium truncate max-w-[180px] md:max-w-[240px]">
                          {profile.contactEmail}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Summary (about short slice) */}
                  <motion.p
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="mt-4 flex gap-2 items-center text-sm text-gray-300 leading-relaxed line-clamp-3 bg-[#020617]/60 border border-[#111827] rounded-2xl px-4 py-3"
                    >
                      <FaStar className="text-yellow-500"/> RATINGS WILL COME HERE
                    </motion.p>

                  {/* Contact Request Button - Only show if not owner and is client */}
                  {!isOwner && user?.role === "client" && (
                    <motion.button
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35 }}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setRequestModalOpen(true)}
                      className="mt-4 w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/30 transition-all"
                    >
                      <FaPaperPlane />
                      Request / Contact Personally
                    </motion.button>
                  )}
                   
                </div>
              </div>
            </div>
          </motion.div>

          {/* Tabs Section - dark cards */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-black border border-[#111827] rounded-2xl shadow-[0_18px_50px_rgba(0,0,0,0.9)] overflow-hidden"
          >
            {/* Tab Headers */}
            <div className="flex border-b m-4 border-[#111827]">
              {tabs.map((tab) => (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 md:py-4 text-xs md:text-sm font-semibold transition-all relative ${
                    activeTab === tab.id
                      ? "text-blue-500 border border-white/20 rounded-full"
                      : "text-gray-400 hover:text-gray-100 hover:bg-[#020617]/60"
                  }`}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center border text-base ${
                      activeTab === tab.id
                        ? "border-blue-500/70 bg-blue-500/5 text-blue-400"
                        : "border-blue-500 bg-[#020617] text-gray-500"
                    }`}
                  >
                    <tab.icon />
                  </div>

                  <span>{tab.label}</span>

                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="editorProfilePublicActiveTab"
                      className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r max-w-[120px] mx-auto from-blue-400 via-blue-500 to-blue-400"
                    />
                  )}
                </motion.button>
              ))}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              {activeTab === "about" && (
                <motion.div
                  key="about"
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  variants={staggerContainer}
                  className="p-6 md:p-8 bg-black"
                >
                  {/* About Me */}
                  {profile.about && (
                    <motion.div variants={fadeInUp} className="mb-8">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-11 h-11 bg-black border border-black rounded-xl flex items-center justify-center">
                          <FaUser className="text-white" />
                        </div>
                        <h3 className="text-lg md:text-xl font-semibold text-gray-50">
                          About
                        </h3>
                      </div>
                      <p className="text-sm md:text-base text-black font-bold  leading-relaxed bg-gray-100 border border-[#111827] p-5 rounded-2xl">
                        {profile.about}
                      </p>
                    </motion.div>
                  )}

                  {/* Skills */}
                  {profile.skills?.length > 0 && (
                    <motion.div variants={fadeInUp} className="mb-8">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-11 h-11 bg-black border border-black rounded-xl flex items-center justify-center">
                          <FaCode className="text-white" />
                        </div>
                        <h3 className="text-lg md:text-xl font-semibold text-gray-50">
                          Skills
                        </h3>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {profile.skills.map((skill, index) => (
                          <motion.span
                            key={index}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.03 }}
                            whileHover={{ scale: 1.04, y: -2 }}
                            className="px-4 py-2 rounded-full text-xs md:text-sm font-medium bg-[#0B1120] border border-[#1F2937] text-gray-100 hover:border-emerald-500/60 hover:bg-emerald-500/5 transition-all"
                          >
                            {skill}
                          </motion.span>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Languages */}
                  {profile.languages?.length > 0 && (
                    <motion.div variants={fadeInUp} className="mb-8">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-11 h-11 bg-black border border-black rounded-xl flex items-center justify-center">
                          <FaLanguage className="text-white" />
                        </div>
                        <h3 className="text-lg md:text-xl font-semibold text-gray-50">
                          Languages
                        </h3>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {profile.languages.map((language, index) => (
                          <motion.span
                            key={index}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.03 }}
                            whileHover={{ scale: 1.04, y: -2 }}
                            className="px-4 py-2 rounded-full text-xs md:text-sm font-medium bg-[#0B1120] border border-[#1F2937] text-gray-100 hover:border-indigo-400/70 hover:bg-indigo-500/5 transition-all"
                          >
                            {language}
                          </motion.span>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Certifications */}
                  {profile.certifications?.length > 0 && (
                    <motion.div variants={fadeInUp}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-11 h-11 bg-black border border-black rounded-xl flex items-center justify-center">
                          <FaAward className="text-yellow-400" />
                        </div>
                        <h3 className="text-lg md:text-xl font-semibold text-gray-50">
                          Certifications
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {profile.certifications.map(
                          (cert, index) =>
                            cert.image && (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.08 }}
                                whileHover={{ y: -4, scale: 1.01 }}
                                onClick={() => {
                                  setSelectedCert(cert);
                                  setModalOpen(true);
                                }}
                                className="group relative rounded-2xl overflow-hidden bg-[#020617] border border-blue-500/20 shadow-[0_12px_35px_rgba(0,0,0,0.9)] cursor-pointer"
                              >
                                <div className="relative h-40 overflow-hidden">
                                  <img
                                    src={cert.image}
                                    alt={cert.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                  <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="bg-black/60 backdrop-blur-sm p-2 rounded-lg border border-white/10">
                                      <FaChevronRight className="text-gray-100 text-sm" />
                                    </div>
                                  </div>
                                </div>
                                <div className="p-3">
                                  <p className="font-semibold text-gray-100 text-sm truncate">
                                    {cert.title || "Certificate"}
                                  </p>
                                </div>
                              </motion.div>
                            )
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Empty State */}
                  {!profile.about &&
                    !profile.skills?.length &&
                    !profile.languages?.length &&
                    !profile.certifications?.length && (
                      <motion.div
                        variants={fadeInUp}
                        className="text-center py-12"
                      >
                        <div className="w-20 h-20 bg-[#0B1120] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#1F2937]">
                          <FaUser className="text-gray-500 text-3xl" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-100 mb-2">
                          No information yet
                        </h3>
                        <p className="text-gray-500 text-sm">
                          This editor has not added profile details yet.
                        </p>
                      </motion.div>
                    )}
                </motion.div>
              )}

              {activeTab === "portfolio" && (
                <motion.div
                  key="portfolio"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  className="p-6 md:p-8 bg-black"
                >
                  <PortfolioSection
                    portfolios={profile.portfolio}
                    isPublic={true}
                  />
                </motion.div>
              )}

              {activeTab === "reels" && (
                <motion.div
                  key="reels"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  className="p-6 md:p-8 bg-black"
                >
                  {reels.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {reels.map((reel, index) => (
                        <motion.div
                          key={reel._id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.08 }}
                          whileHover={{ y: -4 }}
                          className="group relative aspect-[9/16] rounded-2xl overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.9)] cursor-pointer bg-black border border-[#111827]"
                          onClick={() => navigate(`/reels`)} // Navigate to reels feed for now
                        >
                          {reel.mediaType === "video" ? (
                            <video
                              src={reel.mediaUrl}
                              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                              muted
                              loop
                              onMouseEnter={(e) => e.target.play()}
                              onMouseLeave={(e) => {
                                e.target.pause();
                                e.target.currentTime = 0;
                              }}
                            />
                          ) : (
                            <img
                              src={reel.mediaUrl}
                              alt={reel.title}
                              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                            />
                          )}

                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                          <div className="absolute bottom-4 left-4 right-4 text-white">
                            <h3 className="font-semibold truncate">
                              {reel.title}
                            </h3>
                            <div className="flex items-center gap-3 mt-2 text-xs text-white/80">
                              <span className="flex items-center gap-1">
                                <FaPlay className="text-[10px]" />{" "}
                                {reel.viewsCount || 0}
                              </span>
                              <span className="flex items-center gap-1">
                                Like {reel.likesCount || 0}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 bg-[#0B1120] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#111827]">
                        <FaFilm className="text-gray-500 text-3xl" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-100 mb-2">
                        No reels yet
                      </h3>
                      <p className="text-gray-500 text-sm">
                        This editor hasn&apos;t published any reels.
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* Certification Modal */}
      <AnimatePresence>
        {modalOpen && selectedCert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 10 }}
              className="bg-[#020617] rounded-3xl p-6 max-w-3xl w-full relative shadow-[0_25px_60px_rgba(0,0,0,0.95)] border border-[#111827]"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.button
                whileHover={{ scale: 1.05, rotate: 90 }}
                whileTap={{ scale: 0.95 }}
                className="absolute top-4 right-4 w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-gray-300 hover:bg-white/10 transition-colors border border-white/10"
                onClick={() => setModalOpen(false)}
              >
                <FaTimes />
              </motion.button>
              <h3 className="text-lg md:text-xl font-semibold text-gray-50 mb-4 pr-12">
                {selectedCert.title || "Certificate"}
              </h3>
              <img
                src={selectedCert.image}
                alt={selectedCert.title}
                className="w-full h-auto object-contain rounded-2xl border border-[#111827]"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Request/Contact Modal */}
      <AnimatePresence>
        {requestModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
            onClick={() => setRequestModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-[#0B1120] border border-[#1F2937] rounded-3xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.8)]"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white">Request Project</h2>
                  <p className="text-gray-400 text-sm">Send a request to {profile?.user?.name}</p>
                </div>
                <button
                  onClick={() => setRequestModalOpen(false)}
                  className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all"
                >
                  <FaTimes />
                </button>
              </div>

              {/* Form */}
              <div className="space-y-4">
                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    <FaRupeeSign className="inline mr-2 text-green-400" />
                    Budget Amount (₹) *
                  </label>
                  <input
                    type="number"
                    value={requestData.amount}
                    onChange={(e) => setRequestData({ ...requestData, amount: e.target.value })}
                    placeholder="Enter amount (min ₹100)"
                    min={100}
                    className="w-full bg-[#020617] border border-[#1F2937] rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/30 transition-all"
                  />
                  <p className="text-xs text-gray-500 mt-1">Platform fee: 10%</p>
                </div>

                {/* Deadline */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    <FaCalendarAlt className="inline mr-2 text-orange-400" />
                    Deadline *
                  </label>
                  <input
                    type="date"
                    value={requestData.deadline}
                    onChange={(e) => setRequestData({ ...requestData, deadline: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full bg-[#020617] border border-[#1F2937] rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/30 transition-all"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Project Description *
                  </label>
                  <textarea
                    value={requestData.description}
                    onChange={(e) => setRequestData({ ...requestData, description: e.target.value })}
                    placeholder="Describe your project requirements, video type, duration, etc..."
                    rows={4}
                    maxLength={1000}
                    className="w-full bg-[#020617] border border-[#1F2937] rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/30 resize-none transition-all"
                  />
                  <p className="text-xs text-gray-500 mt-1">{requestData.description.length}/1000</p>
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmitRequest}
                  disabled={submittingRequest}
                  className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
                >
                  {submittingRequest ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      />
                      Sending Request...
                    </>
                  ) : (
                    <>
                      <FaPaperPlane />
                      Send Request
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EditorProfile;
