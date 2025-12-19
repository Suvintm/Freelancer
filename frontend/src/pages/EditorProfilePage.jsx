/**
 * EditorProfilePage - Professional Clean Dark Theme
 * Glass effect header, progress ring, completion banner
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaEdit,
  FaEnvelope,
  FaMapMarkerAlt,
  FaAward,
  FaCode,
  FaBriefcase,
  FaUser,
  FaTimes,
  FaCheckCircle,
  FaImages,
  FaChevronRight,
  FaShoppingCart,
  FaStar,
  FaGlobe,
  FaEye,
  FaMoneyBillWave,
  FaCalendarAlt,
  FaRocket,
  FaShieldAlt,
  FaExclamationCircle,
  FaArrowRight,
} from "react-icons/fa";
import { HiCheckBadge, HiLockClosed } from "react-icons/hi2";
import axios from "axios";
import { useAppContext } from "../context/AppContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import ReactCountryFlag from "react-country-flag";

import Sidebar from "../components/Sidebar.jsx";
import EditorNavbar from "../components/EditorNavbar.jsx";
import PortfolioSection from "../components/PortfolioSection.jsx";
import GigsSection from "../components/GigsSection.jsx";
import EditorRatingsModal from "../components/EditorRatingsModal.jsx";
import { useSubscription } from "../context/SubscriptionContext";

// Country Code Mapping
const countryNameToCode = {
  Afghanistan: "AF", Albania: "AL", Algeria: "DZ", India: "IN", USA: "US",
  UK: "GB", Canada: "CA", Australia: "AU", Germany: "DE", France: "FR",
  Japan: "JP", China: "CN", Brazil: "BR", Mexico: "MX", Spain: "ES",
  Italy: "IT", Netherlands: "NL", Singapore: "SG", UAE: "AE", SaudiArabia: "SA",
  Pakistan: "PK", Bangladesh: "BD", Indonesia: "ID", Malaysia: "MY", Philippines: "PH",
  Thailand: "TH", Vietnam: "VN", SouthKorea: "KR", Russia: "RU", Ukraine: "UA",
  Poland: "PL", Turkey: "TR", Egypt: "EG", Nigeria: "NG", SouthAfrica: "ZA",
};

// Progress ring color based on percentage
const getProgressColor = (percent) => {
  if (percent >= 80) return '#00c348ff'; // Green
  if (percent >= 60) return '#61e609ff'; // Blue
  if (percent >= 40) return '#ffa200ff'; // Amber
  return '#EF4444'; // Red
};

const EditorProfile = () => {
  const { user, backendURL } = useAppContext();
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState("portfolio");
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCert, setSelectedCert] = useState(null);
  const [completionData, setCompletionData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [searchParams] = useSearchParams();
  const [showRatingsModal, setShowRatingsModal] = useState(false);

  const navigate = useNavigate();
  const { hasActiveSubscription } = useSubscription();
  const hasInsightsSub = hasActiveSubscription("profile_insights");

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['about', 'portfolio', 'gigs'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, completionRes, earningsRes, ordersRes] = await Promise.all([
          axios.get(`${backendURL}/api/profile`, {
            headers: { Authorization: `Bearer ${user?.token}` },
          }),
          axios.get(`${backendURL}/api/profile/completion-status`, {
            headers: { Authorization: `Bearer ${user?.token}` },
          }),
          axios.get(`${backendURL}/api/editor-analytics/earnings`, {
            headers: { Authorization: `Bearer ${user?.token}` },
          }).catch(() => ({ data: { analytics: {} } })),
          axios.get(`${backendURL}/api/editor-analytics/orders`, {
            headers: { Authorization: `Bearer ${user?.token}` },
          }).catch(() => ({ data: { analytics: {} } })),
        ]);
        setProfile(profileRes.data.profile);
        setCompletionData(completionRes.data);
        setAnalytics({
          totalEarnings: earningsRes.data.analytics?.totalEarnings || 0,
          totalOrders: ordersRes.data.analytics?.totalOrders || 0,
          completedOrders: ordersRes.data.analytics?.completedOrders || 0,
          profileViews: profileRes.data.profile?.profileViews || 0,
        });
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [backendURL, user?.token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-2 border-zinc-800" />
            <div className="absolute inset-1 rounded-full border-2 border-white/20 border-t-transparent animate-spin" />
          </div>
          <p className="text-zinc-500 text-sm">Loading profile...</p>
        </motion.div>
      </div>
    );
  }

  const profileData = profile || {};
  const userData = profileData?.user || user || {};
  const isVerified = user?.kycStatus === 'verified' || profileData?.kycVerified;
  const completionPercent = completionData?.percent || 0;
  const progressColor = getProgressColor(completionPercent);

  // SVG circle calculations - smaller for mobile
  const size = 90;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (completionPercent / 100) * circumference;

  const tabs = [
    { id: "portfolio", label: "Portfolio", icon: FaImages },
    { id: "about", label: "About", icon: FaUser },
    { id: "gigs", label: "My Gigs", icon: FaShoppingCart },
  ];

  // Real ratings from profile ratingStats  
  const hasRatings = profileData?.ratingStats && profileData.ratingStats.totalReviews > 0;
  const displayRating = hasRatings ? profileData.ratingStats.averageRating?.toFixed(1) : "N/A";
  const reviewCount = hasRatings ? profileData.ratingStats.totalReviews : 0;

  // Format large numbers (1000 -> 1K, 1000000 -> 1M)
  const formatNumber = (num) => {
    if (!num || num === 0) return "0";
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + "M";
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + "K";
    return num.toString();
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount || amount === 0) return "₹0";
    if (amount >= 100000) return "₹" + (amount / 100000).toFixed(1).replace(/\.0$/, '') + "L";
    if (amount >= 1000) return "₹" + (amount / 1000).toFixed(1).replace(/\.0$/, '') + "K";
    return "₹" + amount;
  };

  const statsData = [
    { label: "Rating", value: displayRating, count: reviewCount > 0 ? `(${reviewCount})` : "", icon: FaStar, color: hasRatings ? "#F59E0B" : "#6B7280", clickable: true, onClick: () => setShowRatingsModal(true) },
    { label: "Projects", value: analytics?.completedOrders || 0, icon: FaBriefcase, color: "#6B7280" },
    { 
      label: "Views", 
      value: hasInsightsSub ? formatNumber(analytics?.profileViews || 0) : null, 
      icon: hasInsightsSub ? FaEye : HiLockClosed, 
      color: hasInsightsSub ? "#6B7280" : "#9CA3AF",
      clickable: true,
      locked: !hasInsightsSub,
      onClick: () => navigate("/profile-insights")
    },
    { label: "Earnings", value: formatCurrency(analytics?.totalEarnings || 0), icon: FaMoneyBillWave, color: "#22C55E" },
  ];

  return (
    <div className="min-h-screen bg-black light:bg-slate-50 text-white light:text-slate-900 transition-colors duration-200">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <EditorNavbar onMenuClick={() => setSidebarOpen(true)} />

      <main className="md:ml-64 pt-6 md:pt-20 lg:pt-24 px-3 md:px-6 pb-10">
        <div className="max-w-5xl mx-auto">
          
          {/* ==================== PROFILE COMPLETION BANNER ==================== */}
          {completionPercent < 80 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-950 border border-zinc-800/50 rounded-xl p-4 mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <FaExclamationCircle className="text-amber-500 text-sm" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white">Complete your profile</p>
                  <p className="text-xs text-zinc-500">
                    Your profile is {completionPercent}% complete. Reach 80% to get noticed by clients.
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/editor-profile-update')}
                className="flex items-center gap-2 px-4 py-2 bg-white text-black text-xs font-semibold rounded-lg hover:bg-zinc-200 transition-colors whitespace-nowrap"
              >
                Complete Profile <FaArrowRight className="text-[10px]" />
              </button>
            </motion.div>
          )}

          {/* ==================== PROFILE HEADER WITH GLASS EFFECT ==================== */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl mb-4 bg-gradient-to-b from-white via-zinc-950/80 to-white"
          >
            {/* Glass Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.08] via-white/[0.03] to-transparent" />
            <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-sm" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            
            <div className="relative border border-zinc-800/50 rounded-xl">
              <div className="p-4 md:p-6">
                <div className="flex flex-col md:flex-row gap-4 items-center md:items-start">
                  
                  {/* Avatar with Progress Ring */}
                  <div className="relative flex-shrink-0">
                    {/* SVG Progress Ring */}
                    <svg
                      className="absolute -top-1 -left-1"
                      width={size + 8}
                      height={size + 8}
                      style={{ transform: 'rotate(-90deg)' }}
                    >
                      {/* Background circle */}
                      <circle
                        cx={(size + 8) / 2}
                        cy={(size + 8) / 2}
                        r={radius + 4}
                        fill="none"
                        stroke="rgba(255,255,255,0.08)"
                        strokeWidth={strokeWidth}
                      />
                      {/* Progress circle */}
                      <circle
                        cx={(size + 8) / 2}
                        cy={(size + 8) / 2}
                        r={radius + 4}
                        fill="none"
                        stroke={progressColor}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        strokeDasharray={circumference + 25}
                        strokeDashoffset={strokeDashoffset + 12}
                        className="transition-all duration-700"
                      />
                    </svg>

                    {/* Profile Image with White Border */}
                    <div 
                      className="relative rounded-full p-[3px] bg-white"
                      style={{ width: size, height: size }}
                    >
                      <div className="w-full h-full rounded-full overflow-hidden bg-zinc-900">
                        <img
                          src={userData?.profilePicture || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>

                    {/* Verified Badge */}
                    {isVerified && (
                      <div className="absolute bottom-1 right-1 w-7 h-7 bg-emerald-600 rounded-full flex items-center justify-center border-2 border-black z-10">
                        <FaCheckCircle className="text-white text-xs" />
                      </div>
                    )}

                    {/* Percentage Label */}
                    <div 
                      className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-[10px] font-bold text-white"
                      style={{ backgroundColor: progressColor }}
                    >
                      {completionPercent}%
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 text-center md:text-left min-w-0">
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-1">
                      <h1 className="text-xl md:text-2xl font-semibold text-white">
                        {userData?.name || "Your Name"}
                      </h1>
                      {isVerified && (
                        <>
                          <HiCheckBadge className="text-emerald-500 text-xl" />
                          <span className="px-2 py-0.5 bg-emerald-900/50 text-emerald-400 text-[10px] font-medium rounded">
                            VERIFIED
                          </span>
                        </>
                      )}
                      {/* Explore Listed Tag - Shows when verified + 80%+ profile */}
                      {isVerified && completionPercent >= 80 && (
                        <motion.span 
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="px-2.5 py-1 bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 text-[10px] font-bold rounded-lg flex items-center gap-1"
                        >
                          <FaEye className="text-purple-400 text-[10px]" />
                          <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                            EXPLORE LISTED
                          </span>
                        </motion.span>
                      )}
                    </div>

                    <p className="text-zinc-500 text-sm mb-3">
                      {userData?.role === "editor" ? "Professional Video Editor" : "Client"} 
                      {profileData?.experience && ` • ${profileData.experience}`}
                    </p>

                    {/* Info Tags */}
                    <div className="flex flex-wrap justify-center md:justify-start gap-2">
                      {profileData.location?.country && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900/80 border border-zinc-800 rounded text-zinc-400 text-xs">
                          <FaMapMarkerAlt className="text-[10px]" />
                          <ReactCountryFlag
                            countryCode={countryNameToCode[profileData.location.country] || "IN"}
                            svg
                            style={{ width: "12px", height: "12px" }}
                          />
                          <span>{profileData.location.country}</span>
                        </div>
                      )}
                      {profileData.contactEmail && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900/80 border border-zinc-800 rounded text-zinc-400 text-xs">
                          <FaEnvelope className="text-[10px]" />
                          <span className="truncate max-w-[120px] md:max-w-[160px]">{profileData.contactEmail}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900/80 border border-zinc-800 rounded text-zinc-400 text-xs">
                        <FaCalendarAlt className="text-[10px]" />
                        <span>Member since 2024</span>
                      </div>
                    </div>
                  </div>

                  {/* Edit Button */}
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate("/editor-profile-update")}
                    className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-white text-black text-sm font-semibold rounded-lg hover:bg-zinc-200 transition-colors"
                  >
                    <FaEdit className="text-xs" />
                    Edit Profile
                  </motion.button>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-4 gap-2 md:gap-4 mt-5 pt-5 border-t border-zinc-800/50">
                  {statsData.map((stat) => (
                    <div 
                      key={stat.label} 
                      className={`text-center ${stat.clickable ? 'cursor-pointer hover:bg-zinc-800/30 rounded-lg py-2 -my-2 transition-colors' : ''}`}
                      onClick={() => stat.onClick && stat.onClick()}
                    >
                      <div className="flex items-center justify-center gap-1 md:gap-1.5 mb-0.5">
                        <stat.icon className="text-[10px] md:text-xs" style={{ color: stat.color }} />
                        {stat.locked ? (
                          <span className="text-base md:text-lg font-semibold text-zinc-500">—</span>
                        ) : (
                          <span className="text-base md:text-lg font-semibold text-white">{stat.value}</span>
                        )}
                        {stat.count && <span className="text-xs text-zinc-500">{stat.count}</span>}
                      </div>
                      <p className="text-[9px] md:text-[10px] text-zinc-500 uppercase tracking-wide">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Mobile Edit Button */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate("/editor-profile-update")}
                  className="md:hidden w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-black text-sm font-semibold rounded-lg"
                >
                  <FaEdit className="text-xs" />
                  Edit Profile
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* ==================== TABS ==================== */}
          <div className="flex justify-center mb-5">
            <div className="inline-flex bg-zinc-950 border border-zinc-800/50 rounded-lg p-1">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-all flex items-center gap-1.5
                      ${isActive 
                        ? "bg-white text-black" 
                        : "text-zinc-500 hover:text-zinc-300"
                      }
                    `}
                  >
                    <tab.icon className="text-[10px] md:text-xs" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ==================== TAB CONTENT ==================== */}
          <AnimatePresence mode="wait">
            {/* ABOUT TAB */}
            {activeTab === "about" && (
              <motion.div
                key="about"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  
                  {/* Main Content */}
                  <div className="lg:col-span-2 space-y-4">
                    
                    {/* About Me */}
                    {profileData.about && (
                      <div className="bg-zinc-950 border border-zinc-800/50 rounded-xl p-4 md:p-5">
                        <div className="flex items-center gap-2.5 mb-3">
                          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                            <FaUser className="text-zinc-400 text-xs" />
                          </div>
                          <h3 className="text-sm font-semibold text-white">About</h3>
                        </div>
                        <p className="text-zinc-400 text-sm leading-relaxed">
                          {profileData.about}
                        </p>
                      </div>
                    )}

                    {/* Skills */}
                    {profileData.skills?.length > 0 && (
                      <div className="bg-zinc-950 border border-zinc-800/50 rounded-xl p-4 md:p-5">
                        <div className="flex items-center gap-2.5 mb-3">
                          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                            <FaCode className="text-zinc-400 text-xs" />
                          </div>
                          <h3 className="text-sm font-semibold text-white">Skills</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {profileData.skills.map((skill, i) => (
                            <span
                              key={i}
                              className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-300"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Languages */}
                    {profileData.languages?.length > 0 && (
                      <div className="bg-zinc-950 border border-zinc-800/50 rounded-xl p-4 md:p-5">
                        <div className="flex items-center gap-2.5 mb-3">
                          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                            <FaGlobe className="text-zinc-400 text-xs" />
                          </div>
                          <h3 className="text-sm font-semibold text-white">Languages</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {profileData.languages.map((lang, i) => (
                            <span
                              key={i}
                              className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-300"
                            >
                              {lang}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Certifications */}
                    {profileData.certifications?.length > 0 && (
                      <div className="bg-zinc-950 border border-zinc-800/50 rounded-xl p-4 md:p-5">
                        <div className="flex items-center gap-2.5 mb-3">
                          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                            <FaAward className="text-zinc-400 text-xs" />
                          </div>
                          <h3 className="text-sm font-semibold text-white">Certifications</h3>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {profileData.certifications.map((cert, i) => (
                            cert.image && (
                              <div
                                key={i}
                                onClick={() => { setSelectedCert(cert); setModalOpen(true); }}
                                className="relative overflow-hidden rounded-lg border border-zinc-800 cursor-pointer hover:border-zinc-600 transition-colors"
                              >
                                <img
                                  src={cert.image}
                                  alt={cert.name || "Certificate"}
                                  className="w-full h-20 object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-2">
                                  <span className="text-[10px] text-white font-medium truncate">
                                    {cert.name || "Certificate"}
                                  </span>
                                </div>
                              </div>
                            )
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-4">
                    
                    {/* Quick Links */}
                    <div className="bg-zinc-950 border border-zinc-800/50 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-white mb-3">Quick Links</h4>
                      <div className="space-y-2">
                        {[
                          { label: 'Analytics', icon: FaRocket, path: '/editor-analytics' },
                          { label: 'KYC Details', icon: FaShieldAlt, path: '/kyc-details' },
                          { label: 'Payments', icon: FaMoneyBillWave, path: '/payments' },
                        ].map((link) => (
                          <button
                            key={link.label}
                            onClick={() => navigate(link.path)}
                            className="w-full flex items-center justify-between p-2.5 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 transition-colors group"
                          >
                            <div className="flex items-center gap-2.5">
                              <link.icon className="text-xs text-zinc-500" />
                              <span className="text-xs text-zinc-300">{link.label}</span>
                            </div>
                            <FaChevronRight className="text-[10px] text-zinc-600 group-hover:text-zinc-400" />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="bg-zinc-950 border border-zinc-800/50 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-white mb-3">Badges</h4>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { icon: FaStar, label: 'Top Rated', active: true },
                          { icon: FaRocket, label: 'Fast Delivery', active: true },
                          { icon: FaCheckCircle, label: 'Verified', active: isVerified },
                        ].map((badge) => (
                          <div
                            key={badge.label}
                            className={`flex items-center gap-1.5 px-2 py-1 rounded border text-[10px] ${
                              badge.active 
                                ? 'bg-zinc-900 border-zinc-700 text-zinc-300'
                                : 'bg-zinc-950 border-zinc-800 text-zinc-600'
                            }`}
                          >
                            <badge.icon className="text-[9px]" />
                            <span>{badge.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Performance */}
                    <div className="bg-zinc-950 border border-zinc-800/50 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-white mb-3">Performance</h4>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] text-zinc-500">Response Rate</span>
                            <span className="text-[10px] text-white font-medium">98%</span>
                          </div>
                          <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-600 rounded-full" style={{ width: '98%' }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] text-zinc-500">On-time Delivery</span>
                            <span className="text-[10px] text-white font-medium">95%</span>
                          </div>
                          <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-600 rounded-full" style={{ width: '95%' }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] text-zinc-500">Completion Rate</span>
                            <span className="text-[10px] text-white font-medium">100%</span>
                          </div>
                          <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-600 rounded-full" style={{ width: '100%' }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* PORTFOLIO TAB */}
            {activeTab === "portfolio" && (
              <motion.div
                key="portfolio"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="bg-zinc-950 border border-zinc-800/50 rounded-xl p-4 md:p-5"
              >
                <PortfolioSection editorId={userData?._id} isOwnProfile={true} />
              </motion.div>
            )}

            {/* GIGS TAB */}
            {activeTab === "gigs" && (
              <motion.div
                key="gigs"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="bg-zinc-950 border border-zinc-800/50 rounded-xl p-4 md:p-5"
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
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative max-w-3xl w-full bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setModalOpen(false)}
                className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors z-10"
              >
                <FaTimes className="text-sm" />
              </button>
              <img
                src={selectedCert.image}
                alt={selectedCert.name}
                className="w-full max-h-[70vh] object-contain bg-black"
              />
              {selectedCert.name && (
                <div className="p-4 border-t border-zinc-800">
                  <h3 className="text-sm font-medium text-white">{selectedCert.name}</h3>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editor Ratings Modal */}
      <EditorRatingsModal
        isOpen={showRatingsModal}
        onClose={() => setShowRatingsModal(false)}
        editorId={userData?._id}
      />
    </div>
  );
};

export default EditorProfile;
