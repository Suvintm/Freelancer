/**
 * EditorProfilePage - Advanced Professional Redesign
 * Features: Bento grid, glassmorphism, charts, premium styling
 */

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
  FaShoppingCart,
  FaStar,
  FaGlobe,
  FaLink,
  FaClock,
  FaHeart,
  FaEye,
  FaMoneyBillWave,
  FaCalendarAlt,
  FaRocket,
  FaShieldAlt,
} from "react-icons/fa";
import { HiCheckBadge, HiSparkles } from "react-icons/hi2";
import axios from "axios";
import { useAppContext } from "../context/AppContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import ReactCountryFlag from "react-country-flag";
import { 
  AreaChart, 
  Area, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

import Sidebar from "../components/Sidebar.jsx";
import EditorNavbar from "../components/EditorNavbar.jsx";
import PortfolioSection from "../components/PortfolioSection.jsx";
import GigsSection from "../components/GigsSection.jsx";

// Country Code Mapping
const countryNameToCode = {
  Afghanistan: "AF", Albania: "AL", Algeria: "DZ", India: "IN", USA: "US",
  UK: "GB", Canada: "CA", Australia: "AU", Germany: "DE", France: "FR",
  Japan: "JP", China: "CN", Brazil: "BR", Mexico: "MX", Spain: "ES",
  Italy: "IT", Netherlands: "NL", Singapore: "SG", UAE: "AE", SaudiArabia: "SA",
  Pakistan: "PK", Bangladesh: "BD", Indonesia: "ID", Malaysia: "MY", Philippines: "PH",
  Thailand: "TH", Vietnam: "VN", SouthKorea: "KR", Russia: "RU", Ukraine: "UA",
  Poland: "PL", Turkey: "TR", Egypt: "EG", Nigeria: "NG", SouthAfrica: "ZA",
  Kenya: "KE", Ghana: "GH", Argentina: "AR", Chile: "CL", Colombia: "CO",
};

// Sample chart data
const performanceData = [
  { name: 'W1', value: 65 },
  { name: 'W2', value: 78 },
  { name: 'W3', value: 85 },
  { name: 'W4', value: 92 },
];

const skillDistribution = [
  { name: 'Video Editing', value: 40, color: '#22C55E' },
  { name: 'Color Grading', value: 25, color: '#3B82F6' },
  { name: 'Motion Graphics', value: 20, color: '#A855F7' },
  { name: 'Sound Design', value: 15, color: '#F59E0B' },
];

// Animation Variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const EditorProfile = () => {
  const { user, backendURL } = useAppContext();
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState("about");
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCert, setSelectedCert] = useState(null);
  const [searchParams] = useSearchParams();

  const navigate = useNavigate();

  // Check URL for tab parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['about', 'portfolio', 'gigs'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Fetch Profile
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

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-white/5" />
            <div className="absolute inset-1 rounded-full border-[3px] border-emerald-500 border-t-transparent animate-spin" />
            <div className="absolute inset-3 rounded-full border-2 border-blue-500/50 border-b-transparent animate-spin [animation-direction:reverse]" />
          </div>
          <p className="text-gray-400 text-sm">Loading profile...</p>
        </motion.div>
      </div>
    );
  }

  const profileData = profile || {};
  const userData = profileData?.user || user || {};
  const isVerified = user?.kycStatus === 'verified' || profileData?.kycVerified;

  // Tabs config
  const tabs = [
    { id: "about", label: "About", icon: FaUser },
    { id: "portfolio", label: "Portfolio", icon: FaImages },
    { id: "gigs", label: "My Gigs", icon: FaShoppingCart },
  ];

  // Stats data
  const statsData = [
    { label: "Rating", value: profileData?.rating || "5.0", icon: FaStar, color: "#F59E0B" },
    { label: "Projects", value: profileData?.projectsCompleted || "24", icon: FaBriefcase, color: "#3B82F6" },
    { label: "Views", value: "1.2K", icon: FaEye, color: "#A855F7" },
    { label: "Earnings", value: "₹25K", icon: FaMoneyBillWave, color: "#22C55E" },
  ];

  return (
    <div className="min-h-screen bg-[#030712] text-white">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <EditorNavbar onMenuClick={() => setSidebarOpen(true)} />

      <main className="md:ml-64 pt-20 lg:pt-24 px-3 md:px-6 pb-10">
        <div className="max-w-7xl mx-auto">
          
          {/* ==================== HERO SECTION ==================== */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0a0a0c] via-[#0f0f12] to-[#0a0a0c] border border-white/5 mb-6"
          >
            {/* Background gradient effects */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-blue-500/5" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-emerald-500/10 to-transparent rounded-full blur-3xl" />

            <div className="relative p-4 md:p-8">
              <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
                
                {/* Profile Image Section */}
                <div className="flex flex-col items-center lg:items-start gap-4">
                  <div className="relative group">
                    {/* Glow ring */}
                    <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500/30 via-blue-500/30 to-purple-500/30 rounded-full blur-lg opacity-60 group-hover:opacity-100 transition-opacity" />
                    
                    {/* Avatar container */}
                    <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-full p-[3px] bg-gradient-to-r from-emerald-400 via-blue-500 to-purple-500">
                      <img
                        src={userData?.profilePicture || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"}
                        alt="Profile"
                        className="w-full h-full rounded-full object-cover bg-[#1a1a1a]"
                      />
                    </div>
                    
                    {/* Verified badge */}
                    {isVerified && (
                      <div className="absolute -bottom-1 -right-1 w-9 h-9 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full flex items-center justify-center border-4 border-[#0a0a0c] shadow-lg shadow-emerald-500/30">
                        <FaCheckCircle className="text-white text-sm" />
                      </div>
                    )}
                  </div>

                  {/* Edit button (mobile) */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate("/editor-profile-update")}
                    className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-300 hover:bg-white/10 transition-all"
                  >
                    <FaEdit className="text-xs" />
                    Edit Profile
                  </motion.button>
                </div>

                {/* Profile Info Section */}
                <div className="flex-1 min-w-0">
                  {/* Name & Title */}
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h1 className="text-2xl md:text-3xl font-bold text-white">
                      {userData?.name || "Your Name"}
                    </h1>
                    <HiCheckBadge className="text-emerald-400 text-2xl" />
                    {isVerified && (
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/30">
                        VERIFIED
                      </span>
                    )}
                  </div>

                  <p className="text-gray-400 text-sm mb-4">
                    {userData?.role === "editor" ? "Professional Video Editor" : "Client"} 
                    {profileData?.experience && ` • ${profileData.experience}`}
                  </p>

                  {/* Quick Info Pills */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {profileData.location?.country && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full">
                        <FaMapMarkerAlt className="text-amber-400 text-xs" />
                        <ReactCountryFlag
                          countryCode={countryNameToCode[profileData.location.country] || "IN"}
                          svg
                          style={{ width: "1em", height: "1em" }}
                        />
                        <span className="text-xs text-gray-300">{profileData.location.country}</span>
                      </div>
                    )}
                    {profileData.contactEmail && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full">
                        <FaEnvelope className="text-blue-400 text-xs" />
                        <span className="text-xs text-gray-300 truncate max-w-[150px]">{profileData.contactEmail}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full">
                      <FaCalendarAlt className="text-purple-400 text-xs" />
                      <span className="text-xs text-gray-300">Member since 2024</span>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                    {statsData.map((stat, i) => (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-white/[0.03] border border-white/5 rounded-xl p-3 hover:bg-white/[0.05] transition-all"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <stat.icon className="text-xs" style={{ color: stat.color }} />
                          <span className="text-[10px] text-gray-500 uppercase tracking-wider">{stat.label}</span>
                        </div>
                        <p className="text-lg font-bold text-white">{stat.value}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Right Section - Edit & Performance */}
                <div className="hidden lg:flex flex-col gap-3 w-48">
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate("/editor-profile-update")}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all"
                  >
                    <FaEdit className="text-xs" />
                    Edit Profile
                  </motion.button>

                  {/* Mini Performance Chart */}
                  <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Performance</p>
                    <div className="h-14">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={performanceData}>
                          <defs>
                            <linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#22C55E" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <Area type="monotone" dataKey="value" stroke="#22C55E" strokeWidth={2} fill="url(#perfGrad)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-xs text-emerald-400 font-semibold">+28% this month</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ==================== TABS SECTION ==================== */}
          <div className="mb-6">
            <div className="flex items-center justify-center">
              <div className="inline-flex p-1 bg-[#0a0a0c] border border-white/5 rounded-2xl">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <motion.button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`
                        relative px-5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2
                        ${isActive 
                          ? "text-white bg-white/[0.08]" 
                          : "text-gray-500 hover:text-gray-300"
                        }
                      `}
                    >
                      <tab.icon className={`text-sm ${isActive ? 'text-blue-400' : ''}`} />
                      {tab.label}
                      {isActive && (
                        <motion.div
                          layoutId="profileActiveTab"
                          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-500 rounded-full"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ==================== TAB CONTENT ==================== */}
          <AnimatePresence mode="wait">
            {/* ABOUT TAB */}
            {activeTab === "about" && (
              <motion.div
                key="about"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                  
                  {/* Left Column - Main Content */}
                  <div className="lg:col-span-2 space-y-4 md:space-y-6">
                    
                    {/* About Me */}
                    {profileData.about && (
                      <motion.div
                        variants={fadeInUp}
                        initial="hidden"
                        animate="visible"
                        className="bg-[#0a0a0c] border border-white/5 rounded-2xl p-5 md:p-6"
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                            <FaUser className="text-blue-400 text-sm" />
                          </div>
                          <h3 className="text-lg font-semibold text-white">About Me</h3>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed">
                          {profileData.about}
                        </p>
                      </motion.div>
                    )}

                    {/* Skills */}
                    {profileData.skills?.length > 0 && (
                      <motion.div
                        variants={fadeInUp}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: 0.1 }}
                        className="bg-[#0a0a0c] border border-white/5 rounded-2xl p-5 md:p-6"
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                            <FaCode className="text-emerald-400 text-sm" />
                          </div>
                          <h3 className="text-lg font-semibold text-white">Skills & Expertise</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {profileData.skills.map((skill, i) => (
                            <motion.span
                              key={i}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: i * 0.03 }}
                              className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-300 hover:bg-white/10 hover:border-emerald-500/30 transition-all cursor-default"
                            >
                              {skill}
                            </motion.span>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Languages */}
                    {profileData.languages?.length > 0 && (
                      <motion.div
                        variants={fadeInUp}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: 0.15 }}
                        className="bg-[#0a0a0c] border border-white/5 rounded-2xl p-5 md:p-6"
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                            <FaGlobe className="text-purple-400 text-sm" />
                          </div>
                          <h3 className="text-lg font-semibold text-white">Languages</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {profileData.languages.map((lang, i) => (
                            <span
                              key={i}
                              className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-300"
                            >
                              {lang}
                            </span>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Certifications */}
                    {profileData.certifications?.length > 0 && (
                      <motion.div
                        variants={fadeInUp}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: 0.2 }}
                        className="bg-[#0a0a0c] border border-white/5 rounded-2xl p-5 md:p-6"
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                            <FaAward className="text-amber-400 text-sm" />
                          </div>
                          <h3 className="text-lg font-semibold text-white">Certifications</h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {profileData.certifications.map((cert, i) => (
                            cert.image && (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                onClick={() => { setSelectedCert(cert); setModalOpen(true); }}
                                className="relative overflow-hidden rounded-xl border border-white/10 cursor-pointer group hover:border-amber-500/30 transition-all"
                              >
                                <img
                                  src={cert.image}
                                  alt={cert.name || "Certificate"}
                                  className="w-full h-32 object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-3">
                                  <span className="text-xs text-white font-medium truncate">
                                    {cert.name || "Certificate"}
                                  </span>
                                </div>
                                <div className="absolute inset-0 bg-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </motion.div>
                            )
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Right Column - Sidebar */}
                  <div className="space-y-4">
                    
                    {/* Skill Distribution */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="bg-[#0a0a0c] border border-white/5 rounded-2xl p-5"
                    >
                      <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                        <HiSparkles className="text-amber-400" />
                        Skill Distribution
                      </h4>
                      <div className="h-32">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={skillDistribution}
                              cx="50%"
                              cy="50%"
                              innerRadius={30}
                              outerRadius={50}
                              paddingAngle={3}
                              dataKey="value"
                            >
                              {skillDistribution.map((entry, index) => (
                                <Cell key={index} fill={entry.color} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="space-y-2 mt-3">
                        {skillDistribution.map((item) => (
                          <div key={item.name} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                              <span className="text-gray-400">{item.name}</span>
                            </div>
                            <span className="text-gray-300 font-medium">{item.value}%</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>

                    {/* Quick Links */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                      className="bg-[#0a0a0c] border border-white/5 rounded-2xl p-5"
                    >
                      <h4 className="text-sm font-semibold text-white mb-3">Quick Links</h4>
                      <div className="space-y-2">
                        {[
                          { label: 'View Analytics', icon: FaRocket, path: '/editor-analytics', color: '#3B82F6' },
                          { label: 'KYC Details', icon: FaShieldAlt, path: '/kyc-details', color: '#22C55E' },
                          { label: 'Payments', icon: FaMoneyBillWave, path: '/payments', color: '#F59E0B' },
                        ].map((link) => (
                          <button
                            key={link.label}
                            onClick={() => navigate(link.path)}
                            className="w-full flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.05] transition-all group"
                          >
                            <div className="flex items-center gap-3">
                              <link.icon className="text-sm" style={{ color: link.color }} />
                              <span className="text-xs text-gray-300">{link.label}</span>
                            </div>
                            <FaChevronRight className="text-[10px] text-gray-600 group-hover:text-gray-400 transition-colors" />
                          </button>
                        ))}
                      </div>
                    </motion.div>

                    {/* Achievements */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="bg-gradient-to-br from-amber-500/5 to-orange-500/5 border border-amber-500/10 rounded-2xl p-5"
                    >
                      <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                        <FaAward className="text-amber-400" />
                        Achievements
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { icon: FaStar, label: 'Top Rated', color: '#F59E0B' },
                          { icon: FaRocket, label: 'Fast Delivery', color: '#3B82F6' },
                          { icon: FaHeart, label: '100% Positive', color: '#EF4444' },
                        ].map((badge) => (
                          <div
                            key={badge.label}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-black/30 rounded-full border border-white/5"
                          >
                            <badge.icon className="text-[10px]" style={{ color: badge.color }} />
                            <span className="text-[10px] text-gray-300">{badge.label}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* PORTFOLIO TAB */}
            {activeTab === "portfolio" && (
              <motion.div
                key="portfolio"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="bg-[#0a0a0c] border border-white/5 rounded-2xl p-4 md:p-6"
              >
                <PortfolioSection editorId={userData?._id} isOwnProfile={true} />
              </motion.div>
            )}

            {/* GIGS TAB */}
            {activeTab === "gigs" && (
              <motion.div
                key="gigs"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="bg-[#0a0a0c] border border-white/5 rounded-2xl p-4 md:p-6"
              >
                <GigsSection />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Certificate Modal */}
      <AnimatePresence>
        {modalOpen && selectedCert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-3xl w-full bg-[#0a0a0c] border border-white/10 rounded-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setModalOpen(false)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-all z-10"
              >
                <FaTimes />
              </button>
              <img
                src={selectedCert.image}
                alt={selectedCert.name}
                className="w-full max-h-[70vh] object-contain"
              />
              {selectedCert.name && (
                <div className="p-4 border-t border-white/10">
                  <h3 className="text-lg font-semibold text-white">{selectedCert.name}</h3>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EditorProfile;
