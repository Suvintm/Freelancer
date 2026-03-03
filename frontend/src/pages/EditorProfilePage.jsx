/**
 * EditorProfilePage - Professional Clean Dark Theme
 * Glass effect header, progress ring, completion banner
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaArrowRight,
  FaAward,
  FaBriefcase,
  FaCalendarAlt,
  FaCheck,
  FaCheckCircle,
  FaChevronRight,
  FaCode,
  FaEdit,
  FaEnvelope,
  FaExclamationCircle,
  FaEye,
  FaGlobe,
  FaImages,
  FaLock,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaRocket,
  FaShieldAlt,
  FaShoppingCart,
  FaStar,
  FaTimes,
  FaUser,
  FaUserFriends,
  FaUserPlus,
} from "react-icons/fa";
import { MdVerified } from "react-icons/md";
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
import SuvixScoreCard from "../components/SuvixScoreCard.jsx";
import SuvixScoreAnalytics from "../components/SuvixScoreAnalytics.jsx";
import AvailabilitySelector from "../components/AvailabilitySelector.jsx";
import SoftwareExpertise from "../components/SoftwareExpertise.jsx";

import _premiereIcon from "../assets/preimerepro.png";
import _aeIcon from "../assets/adobeexpress.png";
import _davinciIcon from "../assets/davinci.png";
import _capcutIcon from "../assets/capcut.png";
import _fcpxIcon from "../assets/FCPX.png";
import _photoshopIcon from "../assets/photoshop.png";
import _canvaIcon from "../assets/canvalogo.png";
import _vnIcon from "../assets/Vnlogo.png";

const SW_ICON_MAP = {
  "Premiere Pro": _premiereIcon,
  "After Effects": _aeIcon,
  "DaVinci Resolve": _davinciIcon,
  "CapCut": _capcutIcon,
  "FCPX": _fcpxIcon,
  "Photoshop": _photoshopIcon,
  "Canva": _canvaIcon,
  "VN Editor": _vnIcon,
};


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
  const { hasActiveSubscription, getSubscription } = useSubscription();
  const hasInsightsSub = hasActiveSubscription("profile_insights");
  const insightsSubscription = getSubscription("profile_insights");
  
  // Calculate days remaining for subscription
  const getDaysRemaining = () => {
    if (!insightsSubscription?.endDate) return 0;
    const endDate = new Date(insightsSubscription.endDate);
    const now = new Date();
    const diff = endDate - now;
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };
  const daysRemaining = getDaysRemaining();

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
          axios.get(`${backendURL}/api/editor/analytics/earnings`, {
            headers: { Authorization: `Bearer ${user?.token}` },
          }).catch(() => ({ data: { analytics: {} } })),
          axios.get(`${backendURL}/api/editor/analytics/orders`, {
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
    { label: "Followers", value: userData?.followers?.length || "0", icon: FaUser, color: "#10B981" },
    { label: "Following", value: userData?.following?.length || "0", icon: FaUser, color: "#6B7280" },
    { label: "Rating", value: displayRating, count: reviewCount > 0 ? `(${reviewCount})` : "", icon: FaStar, color: hasRatings ? "#F59E0B" : "#6B7280", clickable: true, onClick: () => setShowRatingsModal(true) },
    { label: "Projects", value: analytics?.completedOrders || 0, icon: FaBriefcase, color: "#6B7280" },
    { 
      label: "Views", 
      value: hasInsightsSub ? formatNumber(analytics?.profileViews || 0) : null, 
      icon: hasInsightsSub ? FaEye : HiLockClosed, 
      color: hasInsightsSub ? "#10B981" : "#9CA3AF",
      clickable: true,
      locked: !hasInsightsSub,
      onClick: () => navigate("/profile-insights"),
      tag: hasInsightsSub ? "PRO" : "Upgrade",
      tagColor: hasInsightsSub ? "#10B981" : "#F59E0B"
    },
    { label: "Earnings", value: formatCurrency(analytics?.totalEarnings || 0), icon: FaMoneyBillWave, color: "#22C55E" },
  ];

  return (
    <div className="min-h-screen bg-black light:bg-slate-50 text-white light:text-slate-900 transition-colors duration-200">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <EditorNavbar onMenuClick={() => setSidebarOpen(true)} />

      <main className="md:ml-64 pt-2 md:pt-14 px-3 md:px-6 pb-10">
        <div className="max-w-5xl mx-auto">
          
          {/* ==================== SUBSCRIPTION STATUS BADGE ==================== */}
          {hasInsightsSub && daysRemaining > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 flex justify-end"
            >
              <div 
                onClick={() => navigate("/profile-insights")}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-full cursor-pointer hover:border-emerald-500/50 transition-colors"
              >
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <FaEye className="text-[10px] text-emerald-400" />
                </div>
                <span className="text-xs font-medium text-emerald-400">Profile Insights PRO</span>
                <span className="text-[10px] text-zinc-400">•</span>
                <span className={`text-xs font-semibold ${daysRemaining <= 7 ? 'text-amber-400' : 'text-zinc-300'}`}>
                  {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} left
                </span>
                {insightsSubscription?.status === 'trial' && (
                  <span className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-500/20 text-amber-400 rounded">TRIAL</span>
                )}
              </div>
            </motion.div>
          )}

          {/* ==================== PROFILE COMPLETION BANNER ==================== */}
          {completionPercent < 80 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-950 border border-zinc-800/50 rounded-xl p-4 mb-2 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4"
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

          {/* ==================== PROFILE HEADER (HYPER-COMPACT MOBILE OPTIMIZED) ==================== */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl mb-2 bg-black border border-zinc-800/40 p-3 md:p-10"
          >
            <div className="flex flex-col md:flex-row gap-4 md:gap-14 items-center md:items-start">
              
              {/* Desktop Avatar Section (Hidden on Mobile) */}
              <div className="hidden md:block shrink-0">
                <div className="relative">
                  <svg
                    className="absolute -top-1.5 -left-1.5 w-[116px] h-[116px] -rotate-90 pointer-events-none"
                    viewBox={`0 0 ${size + 8} ${size + 8}`}
                  >
                    <circle cx={(size + 8) / 2} cy={(size + 8) / 2} r={radius + 4} fill="none" stroke="#1a1a1a" strokeWidth={strokeWidth} />
                    <circle cx={(size + 8) / 2} cy={(size + 8) / 2} r={radius + 4} fill="none" stroke={progressColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={circumference + 25} strokeDashoffset={strokeDashoffset + 12} />
                  </svg>
                  <div className="relative rounded-full p-[4px] bg-zinc-900 ring-2 ring-black w-[108px] h-[108px]">
                    <div className="w-full h-full rounded-full overflow-hidden bg-zinc-950">
                      <img src={userData?.profilePicture || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} alt="Profile" className="w-full h-full object-cover" />
                    </div>
                  </div>
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[10px] font-black text-white shadow-xl z-20 border border-black/40" style={{ backgroundColor: progressColor }}>
                    {completionPercent}%
                  </div>
                </div>
              </div>

              {/* Info & Stats Section */}
              <div className="flex-1 w-full min-w-0">
                
                {/* Mobile Header Split: [Left: Avatar+Name+Edit] | [Right: Followers+Following] */}
                <div className="flex md:hidden w-full gap-3 items-stretch mb-3">
                  {/* Left Column (50%): Avatar + Name + Edit (Centered) */}
                  <div className="w-1/2 flex flex-col items-center gap-1.5">
                    <div className="relative shrink-0 mb-1">
                      <svg
                        className="absolute -top-1 -left-1 w-20 h-20 -rotate-90 pointer-events-none"
                        viewBox={`0 0 ${size + 8} ${size + 8}`}
                      >
                        <circle cx={(size + 8) / 2} cy={(size + 8) / 2} r={radius + 4} fill="none" stroke="#1a1a1a" strokeWidth={strokeWidth + 2} />
                        <circle cx={(size + 8) / 2} cy={(size + 8) / 2} r={radius + 4} fill="none" stroke={progressColor} strokeWidth={strokeWidth + 2} strokeLinecap="round" strokeDasharray={circumference + 25} strokeDashoffset={strokeDashoffset + 12} />
                      </svg>
                      <div className="relative rounded-full p-[2px] bg-zinc-900 ring-1 ring-black w-18 h-18">
                        <div className="w-full h-full rounded-full overflow-hidden bg-zinc-950">
                          <img src={userData?.profilePicture || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} alt="Profile" className="w-full h-full object-cover" />
                        </div>
                      </div>
                    </div>
                    <div className="w-full text-center">
                      <h1 className="text-base font-black text-white tracking-tight flex items-center justify-center gap-1 leading-none mb-2.5 break-all">
                        {userData?.name || "Your Name"}
                        {isVerified && <MdVerified className="text-blue-500 text-sm shrink-0" />}
                      </h1>
                      <button
                        onClick={() => navigate("/editor-profile-update")}
                        className="w-full py-2 bg-white text-black text-[10px] font-black rounded-md uppercase tracking-wide flex items-center justify-center gap-1"
                      >
                        <FaEdit size={8} /> EDIT
                      </button>
                    </div>
                  </div>

                  {/* Right Column (50%): Followers + Following (Centered with Icons) */}
                  <div className="w-1/2 flex flex-col justify-center gap-5 pt-1 border-l border-zinc-900 ml-1 pl-3">
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1.5 mb-1">
                        <FaUserFriends className="text-[8px] text-zinc-600" />
                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Followers</span>
                      </div>
                      <span className="text-2xl font-black text-white leading-none tracking-tighter">{statsData.find(s => s.label.includes('Followers'))?.value || 0}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1.5 mb-1">
                        <FaUserPlus className="text-[8px] text-zinc-600" />
                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Following</span>
                      </div>
                      <span className="text-2xl font-black text-white leading-none tracking-tighter">{statsData.find(s => s.label.includes('Following'))?.value || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Desktop Name/Edit Row (Hidden on Mobile) */}
                <div className="hidden md:flex items-center gap-5 mb-6">
                  <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
                    {userData?.name || "Your Name"}
                    {isVerified && <MdVerified className="text-blue-500" />}
                  </h1>
                  <button
                    onClick={() => navigate("/editor-profile-update")}
                    className="flex items-center gap-2 px-6 py-2 bg-white text-black text-xs font-black rounded-full uppercase tracking-widest hover:bg-zinc-200 transition-all hover:scale-105 active:scale-95"
                  >
                    <FaEdit className="text-[12px]" />
                    Edit Profile
                  </button>
                </div>

                {/* Subsidiary Stats Row (Ultra Dense on Mobile) */}
                <div className="flex justify-between gap-1 mb-3 bg-zinc-950/40 rounded-lg py-2 px-1 border border-zinc-900/30">
                  {statsData.filter(s => !s.label.includes('Follower') && !s.label.includes('Following')).map((stat) => {
                    const icons = {
                      'Rating': <FaStar className="text-[7px] text-amber-500" />,
                      'Projects': <FaBriefcase className="text-[7px]" />,
                      'Views': <FaEye className="text-[7px]" />,
                      'Earnings': <FaMoneyBillWave className="text-[7px] text-green-500" />
                    };
                    const label = stat.label.split(' ')[0];
                    return (
                      <div key={stat.label} className="flex flex-col items-center flex-1">
                        <div className="flex items-center gap-0.5 mb-0.5">
                          {icons[label]}
                          <span className="hidden xs:inline text-[7px] font-black text-zinc-600 uppercase">{label}</span>
                        </div>
                        <div className="text-[10px] md:text-xl font-black text-white">
                          {stat.locked ? <FaLock className="text-[8px] text-zinc-800" /> : stat.value}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bio & Professional Indicators (Mobile Compact) */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[9px] md:text-base font-black text-zinc-300 uppercase">
                      {userData?.role === "editor" ? "PRO VIDEO EDITOR" : "CLIENT"}
                    </span>
                    {profileData?.experience && (
                      <span className="px-1.5 py-0.5 bg-zinc-900/50 text-zinc-500 text-[7px] md:text-[10px] font-black rounded border border-zinc-800 uppercase">
                        {profileData.experience}
                      </span>
                    )}
                  </div>

                  {profileData?.about && (
                    <div className="max-w-2xl">
                      <div className="text-[10px] md:text-sm font-medium text-zinc-400 leading-tight flex flex-wrap items-center gap-2">
                        <span className="md:hidden">
                          {profileData.about.split(' ').length > 4 
                            ? (
                              <>
                                {profileData.about.split(' ').slice(0, 4).join(' ')}... 
                                <button onClick={() => setActiveTab("about")} className="text-white font-black ml-1 uppercase text-[8px] mr-2">more</button>
                              </>
                            ) : profileData.about
                          }
                        </span>
                        <span className="hidden md:block leading-relaxed">{profileData.about}</span>
                        
                        {/* Mobile Integrated Availability (Next to "MORE") */}
                        <div className="md:hidden inline-block scale-[0.8] origin-left -mt-0.5">
                          <AvailabilitySelector compact={true} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Software Carousel */}
                  {profileData.softwares?.length > 0 && (
                    <div className="pt-1 border-t border-zinc-900/40">
                      <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        {profileData.softwares.map((name) => {
                          const iconSrc = SW_ICON_MAP[name];
                          return (
                            <div key={name} className="flex-shrink-0 flex flex-col items-center gap-1 w-10">
                              {iconSrc ? (
                                <img src={iconSrc} alt={name} className="w-7 h-7 object-contain" />
                              ) : (
                                <div className="w-7 h-7 bg-zinc-800 rounded-lg flex items-center justify-center">
                                  <FaBriefcase className="text-zinc-500 text-[10px]" />
                                </div>
                              )}
                              <span className="text-[7px] font-black text-zinc-600 uppercase tracking-tight text-center leading-none w-full truncate">
                                {name.split(' ')[0]}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Integrated Location Section */}
                  <div className="flex flex-wrap items-center gap-3 pt-2 mt-2 border-t border-zinc-900/50 text-zinc-500 text-[8px] md:text-[11px] font-black uppercase tracking-tight">
                    {profileData.location?.country && (
                      <div className="flex items-center gap-1">
                        <FaMapMarkerAlt size={7} /> <span>{profileData.location.country}</span>
                      </div>
                    )}
                    {profileData.contactEmail && (
                      <div className="flex items-center gap-1">
                        <FaEnvelope size={7} /> <span className="normal-case truncate max-w-[120px] md:max-w-none">{profileData.contactEmail}</span>
                      </div>
                    )}
                    {/* Availability Selector (Desktop View) */}
                    <div className="hidden md:block ml-auto">
                      <AvailabilitySelector compact={true} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ==================== TABS ==================== */}
          <div className="flex justify-center mb-2.5">
            <div className="inline-flex bg-zinc-950/80 border border-zinc-900 rounded-lg p-1 relative">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      relative px-2.5 py-1.5 rounded-md text-[10px] md:text-sm font-black uppercase tracking-widest transition-all flex items-center gap-1.5 z-10
                      ${isActive 
                        ? "text-black" 
                        : "text-zinc-500 hover:text-zinc-300"
                      }
                    `}
                  >
                    {isActive && (
                      <motion.div 
                        layoutId="activeTab"
                        className="absolute inset-0 bg-white rounded-md -z-10"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
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

                    {/* Software Expertise */}
                    {profileData.softwares?.length > 0 && (
                      <div className="bg-zinc-950 border border-zinc-800/50 rounded-xl p-4 md:p-5">
                        <div className="flex items-center gap-2.5 mb-4">
                          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                            <FaBriefcase className="text-zinc-400 text-xs" />
                          </div>
                          <h3 className="text-sm font-semibold text-white">Software Expertise</h3>
                        </div>
                        <SoftwareExpertise softwares={profileData.softwares} />
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
                    <SuvixScoreCard />
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
                className="bg-transparent p-1 md:p-2"
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
