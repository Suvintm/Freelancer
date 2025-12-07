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
} from "react-icons/fa";
import axios from "axios";
import { useAppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import ReactCountryFlag from "react-country-flag";
import Sidebar from "../components/Sidebar.jsx";
import EditorNavbar from "../components/EditorNavbar.jsx";
import PortfolioSection from "../components/PortfolioSection.jsx";

// Country name to ISO Alpha-2 code mapping
const countryNameToCode = {
  Afghanistan: "AF", Albania: "AL", Algeria: "DZ", Andorra: "AD", Angola: "AO",
  Argentina: "AR", Armenia: "AM", Australia: "AU", Austria: "AT", Azerbaijan: "AZ",
  Bangladesh: "BD", Belgium: "BE", Brazil: "BR", Canada: "CA", Chile: "CL",
  China: "CN", Colombia: "CO", Croatia: "HR", Cuba: "CU", Czechia: "CZ",
  Denmark: "DK", Egypt: "EG", Finland: "FI", France: "FR", Germany: "DE",
  Ghana: "GH", Greece: "GR", Hungary: "HU", Iceland: "IS", India: "IN",
  Indonesia: "ID", Iran: "IR", Iraq: "IQ", Ireland: "IE", Israel: "IL",
  Italy: "IT", Japan: "JP", Kenya: "KE", Malaysia: "MY", Mexico: "MX",
  Nepal: "NP", Netherlands: "NL", "New Zealand": "NZ", Nigeria: "NG", Norway: "NO",
  Pakistan: "PK", Peru: "PE", Poland: "PL", Portugal: "PT", Qatar: "QA",
  Romania: "RO", Russia: "RU", SaudiArabia: "SA", Singapore: "SG", Slovakia: "SK",
  Slovenia: "SI", SouthAfrica: "ZA", Spain: "ES", SriLanka: "LK", Sweden: "SE",
  Switzerland: "CH", Thailand: "TH", Turkey: "TR", Ukraine: "UA", UAE: "AE",
  UK: "GB", USA: "US", Vietnam: "VN", Zimbabwe: "ZW",
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
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState("about");
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCert, setSelectedCert] = useState(null);

  const navigate = useNavigate();

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

  // Premium Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-green-200 rounded-full" />
            <div className="absolute inset-0 border-4 border-green-500 rounded-full border-t-transparent animate-spin" />
          </div>
          <p className="text-gray-500 font-medium">Loading your profile...</p>
        </motion.div>
      </div>
    );
  }

  // No Profile State
  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center bg-white rounded-3xl shadow-xl p-10 max-w-md"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <FaUser className="text-white text-4xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Complete Your Profile</h2>
          <p className="text-gray-500 mb-6">
            Set up your professional profile to start attracting clients
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/editor-profile-update")}
            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            Create Profile
          </motion.button>
        </motion.div>
      </div>
    );
  }

  const tabs = [
    { id: "about", label: "About", icon: FaUser },
    { id: "portfolio", label: "Portfolio", icon: FaImages },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <EditorNavbar onMenuClick={() => setSidebarOpen(true)} />

      {/* Main Content */}
      <div className="md:ml-64 pt-16 md:pt-20 px-4 md:px-8 pb-12">
        <div className="max-w-5xl mx-auto">
          {/* Profile Hero Section */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ duration: 0.5 }}
            className="relative bg-white rounded-3xl shadow-xl overflow-hidden mb-6"
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 h-48 bg-gradient-to-br from-green-400 via-emerald-500 to-teal-500">
              <div className="absolute inset-0 opacity-10">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <defs>
                    <pattern id="dots" width="10" height="10" patternUnits="userSpaceOnUse">
                      <circle cx="5" cy="5" r="1.5" fill="white" />
                    </pattern>
                  </defs>
                  <rect width="100" height="100" fill="url(#dots)" />
                </svg>
              </div>
            </div>

            {/* Profile Content */}
            <div className="relative pt-24 pb-8 px-6 md:px-10">
              <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
                {/* Profile Picture */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="relative -mt-20 md:-mt-16"
                >
                  <div className="relative">
                    <img
                      src={profile?.user?.profilePicture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                      alt="Profile"
                      className="w-32 h-32 md:w-36 md:h-36 rounded-2xl object-cover border-4 border-white shadow-2xl"
                    />
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                      <FaCheckCircle className="text-white text-lg" />
                    </div>
                  </div>
                </motion.div>

                {/* Profile Info */}
                <div className="flex-1 text-center md:text-left">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-1">
                      {profile?.user?.name}
                    </h1>
                    <p className="text-gray-500 text-lg mb-4">
                      {profile?.user?.role === "editor" ? "Professional Video Editor" : "Client"}
                    </p>
                  </motion.div>

                  {/* Stats/Badges Row */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex flex-wrap justify-center md:justify-start gap-3 mb-4"
                  >
                    {profile.location?.country && (
                      <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-gray-100">
                        <FaMapMarkerAlt className="text-green-500" />
                        <ReactCountryFlag
                          countryCode={countryNameToCode[profile.location.country] || "IN"}
                          svg
                          style={{ width: "1.2em", height: "1.2em" }}
                        />
                        <span className="text-gray-700 font-medium">{profile.location.country}</span>
                      </div>
                    )}
                    {profile.experience && (
                      <div className="flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-full border border-purple-100">
                        <FaBriefcase className="text-purple-500" />
                        <span className="text-purple-700 font-medium">{profile.experience}</span>
                      </div>
                    )}
                    {profile.contactEmail && (
                      <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full border border-blue-100">
                        <FaEnvelope className="text-blue-500" />
                        <span className="text-blue-700 font-medium text-sm">{profile.contactEmail}</span>
                      </div>
                    )}
                  </motion.div>
                </div>

                {/* Edit Button */}
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate("/editor-profile-update")}
                  className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  <FaEdit /> Edit Profile
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Tabs Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-lg overflow-hidden"
          >
            {/* Tab Headers */}
            <div className="flex border-b border-gray-100">
              {tabs.map((tab) => (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 font-semibold transition-all relative ${activeTab === tab.id
                      ? "text-green-600 bg-green-50/50"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <tab.icon className={activeTab === tab.id ? "text-green-500" : "text-gray-400"} />
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-400 to-emerald-500"
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
                  className="p-6 md:p-8"
                >
                  {/* About Me */}
                  {profile.about && (
                    <motion.div variants={fadeInUp} className="mb-8">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center">
                          <FaUser className="text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">About Me</h3>
                      </div>
                      <p className="text-gray-600 leading-relaxed text-lg bg-gray-50 p-5 rounded-2xl">
                        {profile.about}
                      </p>
                    </motion.div>
                  )}

                  {/* Skills */}
                  {profile.skills?.length > 0 && (
                    <motion.div variants={fadeInUp} className="mb-8">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center">
                          <FaCode className="text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">Skills</h3>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {profile.skills.map((skill, index) => (
                          <motion.span
                            key={index}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={{ scale: 1.05, y: -2 }}
                            className="px-5 py-2.5 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 rounded-xl font-medium border border-green-100 shadow-sm hover:shadow-md transition-all cursor-default"
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
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center">
                          <FaLanguage className="text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">Languages</h3>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {profile.languages.map((language, index) => (
                          <motion.span
                            key={index}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={{ scale: 1.05, y: -2 }}
                            className="px-5 py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 rounded-xl font-medium border border-blue-100 shadow-sm hover:shadow-md transition-all cursor-default"
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
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
                          <FaAward className="text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">Certifications</h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {profile.certifications.map((cert, index) =>
                          cert.image && (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              whileHover={{ y: -5, scale: 1.02 }}
                              onClick={() => {
                                setSelectedCert(cert);
                                setModalOpen(true);
                              }}
                              className="group relative rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all cursor-pointer bg-white border border-gray-100"
                            >
                              <div className="relative h-40 overflow-hidden">
                                <img
                                  src={cert.image}
                                  alt={cert.title}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <div className="bg-white/90 backdrop-blur-sm p-2 rounded-lg">
                                    <FaChevronRight className="text-gray-700" />
                                  </div>
                                </div>
                              </div>
                              <div className="p-4">
                                <p className="font-semibold text-gray-800 truncate">
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
                  {!profile.about && !profile.skills?.length && !profile.languages?.length && !profile.certifications?.length && (
                    <motion.div variants={fadeInUp} className="text-center py-12">
                      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaUser className="text-gray-400 text-3xl" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">No information yet</h3>
                      <p className="text-gray-500 mb-4">Complete your profile to showcase your skills</p>
                      <button
                        onClick={() => navigate("/editor-profile-update")}
                        className="text-green-600 font-medium hover:underline"
                      >
                        Update Profile →
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {activeTab === "portfolio" && (
                <motion.div
                  key="portfolio"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="p-6 md:p-8"
                >
                  <PortfolioSection />
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
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-3xl w-full relative shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                className="absolute top-4 right-4 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
                onClick={() => setModalOpen(false)}
              >
                <FaTimes />
              </motion.button>
              <h3 className="text-xl font-bold text-gray-800 mb-4 pr-12">
                {selectedCert.title || "Certificate"}
              </h3>
              <img
                src={selectedCert.image}
                alt={selectedCert.title}
                className="w-full h-auto object-contain rounded-2xl"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EditorProfile;
