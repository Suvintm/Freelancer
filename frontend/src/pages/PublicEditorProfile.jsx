/**
 * PublicEditorProfile - View-only profile page
 * Same design as EditorProfilePage but without edit/add functionality
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaEnvelope,
  FaMapMarkerAlt,
  FaAward,
  FaCode,
  FaUser,
  FaTimes,
  FaCheckCircle,
  FaImages,
  FaShoppingCart,
  FaStar,
  FaGlobe,
  FaEye,
  FaCalendarAlt,
  FaPaperPlane,
  FaRupeeSign,
  FaBriefcase,
  FaFilm,
  FaPlay,
  FaClock,
} from "react-icons/fa";
import { HiCheckBadge } from "react-icons/hi2";
import axios from "axios";
import { useAppContext } from "../context/AppContext";
import { useNavigate, useParams } from "react-router-dom";
import ReactCountryFlag from "react-country-flag";
import { toast } from "react-toastify";

import Sidebar from "../components/Sidebar.jsx";
import EditorNavbar from "../components/EditorNavbar.jsx";
import PortfolioSection from "../components/PortfolioSection.jsx";
import EditorRatingsModal from "../components/EditorRatingsModal.jsx";
import SuvixScoreBadge from "../components/SuvixScoreBadge.jsx";

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

const PublicEditorProfile = () => {
  const { user, backendURL } = useAppContext();
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState("portfolio");
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
  const [showRatingsModal, setShowRatingsModal] = useState(false);
  const [suvixScore, setSuvixScore] = useState(null);

  const navigate = useNavigate();

  // Fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const targetId = userId || user?._id;
        if (!targetId) return;

        const res = await axios.get(`${backendURL}/api/profile/${targetId}`);
        setProfile(res.data.profile);
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [backendURL, userId, user?._id]);

  // Fetch Suvix Score
  useEffect(() => {
    const fetchSuvixScore = async () => {
      try {
        const targetId = userId || user?._id;
        if (!targetId) return;
        const res = await axios.get(`${backendURL}/api/suvix-score/${targetId}`);
        if (res.data.success) {
          setSuvixScore(res.data.score);
        }
      } catch (error) {
        console.error("Error fetching Suvix Score:", error);
      }
    };
    fetchSuvixScore();
  }, [backendURL, userId, user?._id]);

  // Load Razorpay script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Handle request submission with payment
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

      // Load Razorpay
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        toast.error("Failed to load payment gateway. Please try again.");
        setSubmittingRequest(false);
        return;
      }

      // Create payment order
      const payload = {
        editorId: profile.user._id,
        title: `Project request from ${user?.name}`,
        description: requestData.description.trim(),
        amount: Number(requestData.amount),
        deadline: requestData.deadline,
      };
      console.log("Sending request payment payload:", payload);
      
      const createRes = await axios.post(
        `${backendURL}/api/orders/request/create-payment`,
        payload,
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );

      const { order, razorpay, editor } = createRes.data;

      // Open Razorpay checkout
      const options = {
        key: razorpay.key,
        amount: razorpay.amount,
        currency: razorpay.currency,
        name: "SuviX",
        description: `Project Request: ${order.title}`,
        order_id: razorpay.orderId,
        handler: async (response) => {
          try {
            // Verify payment
            const verifyRes = await axios.post(
              `${backendURL}/api/orders/request/verify-payment`,
              {
                orderId: order._id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
              { headers: { Authorization: `Bearer ${user?.token}` } }
            );

            toast.success("Payment successful! Request sent to editor.");
            setRequestModalOpen(false);
            setRequestData({ description: "", amount: "", deadline: "" });

            // Navigate to success page
            navigate("/request-payment-success", {
              state: {
                orderNumber: verifyRes.data.order.orderNumber,
                title: verifyRes.data.order.title,
                amount: verifyRes.data.order.amount,
                deadline: verifyRes.data.order.deadline,
                editorName: verifyRes.data.order.editorName,
                editorPicture: verifyRes.data.order.editorPicture,
                transactionId: response.razorpay_payment_id,
              },
            });
          } catch (err) {
            toast.error(err.response?.data?.message || "Payment verification failed");
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
        },
        theme: {
          color: "#10B981",
        },
        modal: {
          ondismiss: () => {
            setSubmittingRequest(false);
          },
        },
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.open();
      setSubmittingRequest(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to initiate payment");
      setSubmittingRequest(false);
    }
  };

  // Loading
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

  // Not Found
  if (!profile) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center bg-zinc-950 rounded-xl p-8 max-w-md border border-zinc-800"
        >
          <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaUser className="text-zinc-500 text-xl" />
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">Profile Not Found</h2>
          <p className="text-zinc-500 text-sm mb-4">This profile doesn't exist or is unavailable.</p>
          <button
            onClick={() => navigate("/explore")}
            className="px-4 py-2 bg-white text-black text-sm font-semibold rounded-lg hover:bg-zinc-200 transition-colors"
          >
            Explore Editors
          </button>
        </motion.div>
      </div>
    );
  }

  const userData = profile?.user || {};
  const isVerified = userData?.kycStatus === 'verified' || profile?.kycVerified;
  const isOwner = user?._id === userData._id;

  const tabs = [
    { id: "portfolio", label: "Portfolio", icon: FaImages },
    { id: "about", label: "About", icon: FaUser },
    { id: "gigs", label: "Gigs", icon: FaShoppingCart },
  ];

  // Real ratings from profile ratingStats
  const hasRatings = profile?.ratingStats && profile.ratingStats.totalReviews > 0;
  const displayRating = hasRatings ? profile.ratingStats.averageRating?.toFixed(1) : "N/A";
  const reviewCount = hasRatings ? profile.ratingStats.totalReviews : 0;

  const statsData = [
    { label: "Rating", value: displayRating, count: reviewCount > 0 ? `(${reviewCount})` : "", icon: FaStar, color: hasRatings ? "#F59E0B" : "#6B7280", clickable: true },
    { label: "Projects", value: profile?.projectsCompleted || "0", icon: FaBriefcase, color: "#6B7280" },
    { label: "Views", value: "1.2K", icon: FaEye, color: "#6B7280" },
  ];

  return (
    <div className="min-h-screen bg-black light:bg-slate-50 text-white light:text-slate-900 transition-colors duration-200">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <EditorNavbar onMenuClick={() => setSidebarOpen(true)} />

      <main className="md:ml-64 pt-16 md:pt-20 lg:pt-24 px-3 md:px-6 pb-10">
        <div className="max-w-5xl mx-auto">
          
          {/* ==================== PROFILE HEADER ==================== */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-xl mb-5"
          >
            {/* Glass Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.08] via-white/[0.03] to-transparent" />
            <div className="absolute inset-0 bg-zinc-950/90" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            
            <div className="relative border border-zinc-800/50 rounded-xl">
              <div className="p-5 md:p-7">
                <div className="flex flex-col md:flex-row gap-5 items-center md:items-start">
                  
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div 
                      className="relative rounded-full p-[3px] bg-white"
                      style={{ width: 120, height: 120 }}
                    >
                      <div className="w-full h-full rounded-full overflow-hidden bg-zinc-900">
                        <img
                          src={userData?.profilePicture || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>

                    {isVerified && (
                      <div className="absolute bottom-1 right-1 w-7 h-7 bg-emerald-600 rounded-full flex items-center justify-center border-2 border-black z-10">
                        <FaCheckCircle className="text-white text-xs" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 text-center md:text-left min-w-0">
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-1">
                      <h1 className="text-xl md:text-2xl font-semibold text-white">
                        {userData?.name || "Editor Name"}
                      </h1>
                      {isVerified && (
                        <>
                          <HiCheckBadge className="text-emerald-500 text-xl" />
                          <span className="px-2 py-0.5 bg-emerald-900/50 text-emerald-400 text-[10px] font-medium rounded">
                            VERIFIED
                          </span>
                        </>
                      )}
                      {suvixScore && suvixScore.isEligible && (
                        <div className="flex items-center gap-2">
                          <SuvixScoreBadge
                            score={suvixScore.total}
                            tier={suvixScore.tier}
                            isEligible={suvixScore.isEligible}
                            size="small"
                            showLabel={false}
                          />
                          <span 
                            className="px-2 py-0.5 text-[10px] font-medium rounded"
                            style={{ 
                              backgroundColor: suvixScore.tierColor + '20', 
                              color: suvixScore.tierColor 
                            }}
                          >
                            {suvixScore.tierLabel}
                          </span>
                        </div>
                      )}
                    </div>

                    <p className="text-zinc-500 text-sm mb-3">
                      {userData?.role === "editor" ? "Professional Video Editor" : "Client"} 
                      {profile?.experience && ` • ${profile.experience}`}
                    </p>

                    {/* Info Tags */}
                    <div className="flex flex-wrap justify-center md:justify-start gap-2">
                      {profile.location?.country && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900/80 border border-zinc-800 rounded text-zinc-400 text-xs">
                          <FaMapMarkerAlt className="text-[10px]" />
                          <ReactCountryFlag
                            countryCode={countryNameToCode[profile.location.country] || "IN"}
                            svg
                            style={{ width: "12px", height: "12px" }}
                          />
                          <span>{profile.location.country}</span>
                        </div>
                      )}
                      {profile.contactEmail && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900/80 border border-zinc-800 rounded text-zinc-400 text-xs">
                          <FaEnvelope className="text-[10px]" />
                          <span className="truncate max-w-[120px] md:max-w-[160px]">{profile.contactEmail}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900/80 border border-zinc-800 rounded text-zinc-400 text-xs">
                        <FaCalendarAlt className="text-[10px]" />
                        <span>Member since 2024</span>
                      </div>
                    </div>
                  </div>

                  {/* Contact Button (for clients only) */}
                  {!isOwner && user?.role === "client" && (
                    <button
                      onClick={() => setRequestModalOpen(true)}
                      className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-500 transition-colors"
                    >
                      <FaPaperPlane className="text-xs" />
                      Contact
                    </button>
                  )}
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-2 md:gap-4 mt-5 pt-5 border-t border-zinc-800/50">
                  {statsData.map((stat) => (
                    <div 
                      key={stat.label} 
                      className={`text-center ${stat.clickable && (isOwner || reviewCount > 0) ? 'cursor-pointer hover:bg-zinc-800/30 rounded-lg py-2 -my-2 transition-colors' : ''}`}
                      onClick={() => stat.clickable && (isOwner || reviewCount > 0) && setShowRatingsModal(true)}
                    >
                      <div className="flex items-center justify-center gap-1 md:gap-1.5 mb-0.5">
                        <stat.icon className="text-[10px] md:text-xs" style={{ color: stat.color }} />
                        <span className="text-base md:text-lg font-semibold text-white">{stat.value}</span>
                        {stat.count && <span className="text-xs text-zinc-500">{stat.count}</span>}
                      </div>
                      <p className="text-[9px] md:text-[10px] text-zinc-500 uppercase tracking-wide">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Mobile Contact Button */}
                {!isOwner && user?.role === "client" && (
                  <button
                    onClick={() => setRequestModalOpen(true)}
                    className="md:hidden w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-lg"
                  >
                    <FaPaperPlane className="text-xs" />
                    Contact Editor
                  </button>
                )}
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
                <PortfolioSection portfolios={profile.portfolio} isPublic={true} />
              </motion.div>
            )}

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
                    {profile.about && (
                      <div className="bg-zinc-950 border border-zinc-800/50 rounded-xl p-4 md:p-5">
                        <div className="flex items-center gap-2.5 mb-3">
                          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                            <FaUser className="text-zinc-400 text-xs" />
                          </div>
                          <h3 className="text-sm font-semibold text-white">About</h3>
                        </div>
                        <p className="text-zinc-400 text-sm leading-relaxed">
                          {profile.about}
                        </p>
                      </div>
                    )}

                    {/* Skills */}
                    {profile.skills?.length > 0 && (
                      <div className="bg-zinc-950 border border-zinc-800/50 rounded-xl p-4 md:p-5">
                        <div className="flex items-center gap-2.5 mb-3">
                          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                            <FaCode className="text-zinc-400 text-xs" />
                          </div>
                          <h3 className="text-sm font-semibold text-white">Skills</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {profile.skills.map((skill, i) => (
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
                    {profile.languages?.length > 0 && (
                      <div className="bg-zinc-950 border border-zinc-800/50 rounded-xl p-4 md:p-5">
                        <div className="flex items-center gap-2.5 mb-3">
                          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                            <FaGlobe className="text-zinc-400 text-xs" />
                          </div>
                          <h3 className="text-sm font-semibold text-white">Languages</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {profile.languages.map((lang, i) => (
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
                    {profile.certifications?.length > 0 && (
                      <div className="bg-zinc-950 border border-zinc-800/50 rounded-xl p-4 md:p-5">
                        <div className="flex items-center gap-2.5 mb-3">
                          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                            <FaAward className="text-zinc-400 text-xs" />
                          </div>
                          <h3 className="text-sm font-semibold text-white">Certifications</h3>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {profile.certifications.map((cert, i) => (
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

                    {/* Empty State */}
                    {!profile.about && !profile.skills?.length && !profile.languages?.length && !profile.certifications?.length && (
                      <div className="bg-zinc-950 border border-zinc-800/50 rounded-xl p-8 text-center">
                        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-zinc-900 flex items-center justify-center">
                          <FaUser className="text-zinc-600" />
                        </div>
                        <p className="text-zinc-500 text-sm">No information added yet</p>
                      </div>
                    )}
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-4">
                    {/* Badges */}
                    <div className="bg-zinc-950 border border-zinc-800/50 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-white mb-3">Badges</h4>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { icon: FaStar, label: 'Top Rated', active: true },
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
                      </div>
                    </div>
                  </div>
                </div>
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
                {/* Public Gigs Grid - View Only */}
                {profile.gigs?.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {profile.gigs.map((gig, i) => (
                      <motion.div
                        key={gig._id || i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden hover:border-zinc-600 transition-all cursor-pointer"
                        onClick={() => navigate(`/gig/${gig._id}`)}
                      >
                        <div className="aspect-video bg-zinc-950">
                          {gig.thumbnail ? (
                            <img src={gig.thumbnail} alt={gig.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FaPlay className="text-zinc-700" />
                            </div>
                          )}
                        </div>
                        <div className="p-2.5">
                          <h4 className="text-xs font-medium text-white line-clamp-1 mb-1">{gig.title}</h4>
                          <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                            <span className="flex items-center gap-0.5 text-emerald-400">
                              <FaRupeeSign className="text-[8px]" /> {gig.price}
                            </span>
                            <span className="flex items-center gap-0.5">
                              <FaClock className="text-[8px]" /> {gig.deliveryDays}d
                            </span>
                            {gig.rating > 0 && (
                              <span className="flex items-center gap-0.5 text-amber-500">
                                <FaStar className="text-[8px]" /> {gig.rating?.toFixed(1)}
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-zinc-900 flex items-center justify-center">
                      <FaShoppingCart className="text-zinc-600 text-lg" />
                    </div>
                    <p className="text-xs text-zinc-500">No gigs available</p>
                  </div>
                )}
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

      {/* Request/Contact Modal */}
      <AnimatePresence>
        {requestModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setRequestModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-xl p-5"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-semibold text-white">Contact Editor</h2>
                  <p className="text-xs text-zinc-500">Send a project request to {userData?.name}</p>
                </div>
                <button
                  onClick={() => setRequestModalOpen(false)}
                  className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-white"
                >
                  <FaTimes className="text-sm" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                    Budget (₹) *
                  </label>
                  <input
                    type="number"
                    value={requestData.amount}
                    onChange={(e) => setRequestData({ ...requestData, amount: e.target.value })}
                    placeholder="Min ₹100"
                    min={100}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-zinc-600 focus:border-zinc-600 outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                    Deadline *
                  </label>
                  <input
                    type="date"
                    value={requestData.deadline}
                    onChange={(e) => setRequestData({ ...requestData, deadline: e.target.value })}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-white text-sm focus:border-zinc-600 outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                    Project Description *
                  </label>
                  <textarea
                    value={requestData.description}
                    onChange={(e) => setRequestData({ ...requestData, description: e.target.value })}
                    placeholder="Describe your project..."
                    rows={4}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-zinc-600 focus:border-zinc-600 outline-none transition-colors resize-none"
                  />
                </div>

                {/* Payment Info */}
                {requestData.amount && requestData.amount >= 100 && (
                  <div className="p-3 bg-emerald-900/30 border border-emerald-500/30 rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-400">Amount:</span>
                      <span className="text-white font-medium">₹{Number(requestData.amount).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-zinc-400">Platform Fee (10%):</span>
                      <span className="text-zinc-400">-₹{Math.round(Number(requestData.amount) * 0.1).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-1 pt-1 border-t border-emerald-500/20">
                      <span className="text-emerald-400">Editor Receives:</span>
                      <span className="text-emerald-400 font-semibold">₹{(Number(requestData.amount) - Math.round(Number(requestData.amount) * 0.1)).toLocaleString()}</span>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleSubmitRequest}
                  disabled={submittingRequest}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-green-500 text-white text-sm font-semibold rounded-lg hover:from-emerald-500 hover:to-green-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {submittingRequest ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FaRupeeSign className="text-xs" />
                      Pay & Send Request
                    </>
                  )}
                </button>
                <p className="text-xs text-zinc-500 text-center">
                  Payment is held securely until project completion
                </p>
              </div>
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

export default PublicEditorProfile;
