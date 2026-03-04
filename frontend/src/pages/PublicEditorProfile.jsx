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
  FaUserFriends,
  FaUserPlus,
  FaCircle,
} from "react-icons/fa";
import { HiCheckBadge, HiOutlineTrophy, HiOutlineLockClosed, HiOutlineLockOpen } from "react-icons/hi2";
import { MdVerified } from "react-icons/md";
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
import KYCRequiredModal from "../components/KYCRequiredModal.jsx";
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
  const [showKYCModal, setShowKYCModal] = useState(false);
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [showContactRestriction, setShowContactRestriction] = useState(false);

  const navigate = useNavigate();
  
  const userData = profile?.user || {};
  const isVerified = userData?.kycStatus === 'verified' || profile?.kycVerified;
  const isOwner = user?._id === userData._id;

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

  // Fetch Earned Badges
  useEffect(() => {
    const fetchEarnedBadges = async () => {
      try {
        const targetId = userId || user?._id;
        if (!targetId) return;
        const res = await axios.get(`${backendURL}/api/badges/user/${targetId}`);
        if (res.data.success) {
          setEarnedBadges(res.data.badges || []);
        }
      } catch (error) {
        console.error("Error fetching badges:", error);
      }
    };
    fetchEarnedBadges();
  }, [backendURL, userId, user?._id]);
  
  const [isFollowing, setIsFollowing] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    const fetchFollowStatus = async () => {
      if (!user || !userData?._id || isOwner) return;
      try {
        const res = await axios.get(`${backendURL}/api/user/follow/status/${userData._id}`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setIsFollowing(res.data.isFollowing);
        setIsPending(res.data.isPending);
      } catch (error) {
        console.error("Error fetching follow status:", error);
      }
    };
    if (userData?._id) fetchFollowStatus();
  }, [userData?._id, user, isOwner]);

  const handleFollowToggle = async () => {
    if (!user) {
      toast.error("Please login to follow");
      return;
    }
    if (isOwner) return;

    try {
      setFollowLoading(true);
      const res = await axios.post(`${backendURL}/api/user/follow/${userData._id}`, {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      
      if (res.data.success) {
        setIsFollowing(res.data.isFollowing || false);
        setIsPending(res.data.isPending || false);
        
        // Update local follower count if it was an auto-follow/unfollow
        if (res.data.isFollowing !== undefined) {
          setProfile(prev => ({
            ...prev,
            user: {
              ...prev.user,
              followers: res.data.isFollowing 
                ? [...(prev.user.followers || []), user._id]
                : (prev.user.followers || []).filter(id => id !== user._id)
            }
          }));
        }
        
        toast.success(res.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to toggle follow");
    } finally {
      setFollowLoading(false);
    }
  };

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

    // Check client KYC status before proceeding
    if (user?.role === "client" && user?.clientKycStatus !== "verified") {
      setShowKYCModal(true);
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


  const allTabs = [
    { id: "portfolio", label: "Portfolio", icon: FaImages },
    { id: "about", label: "About", icon: FaUser },
    { id: "gigs", label: "Gigs", icon: FaShoppingCart },
    { id: "achievements", label: "Achievements", icon: HiOutlineTrophy },
  ];

  const tabs = userData?.role === 'client' 
    ? allTabs.filter(tab => ["portfolio", "about"].includes(tab.id))
    : allTabs;

  // Real ratings from profile ratingStats
  const hasRatings = profile?.ratingStats && profile.ratingStats.totalReviews > 0;
  const displayRating = hasRatings ? profile.ratingStats.averageRating?.toFixed(1) : "N/A";
  const reviewCount = hasRatings ? profile.ratingStats.totalReviews : 0;

  const statsData = [
    { label: "Followers", value: userData?.followers?.length || "0", icon: FaUser, color: "#10B981" },
    { label: "Following", value: userData?.following?.length || "0", icon: FaUser, color: "#6B7280" },
    { label: "Rating", value: displayRating, count: reviewCount > 0 ? `(${reviewCount})` : "", icon: FaStar, color: hasRatings ? "#F59E0B" : "#6B7280", clickable: true },
    { label: "Projects", value: profile?.projectsCompleted || "0", icon: FaBriefcase, color: "#6B7280" },
  ];

  return (
    <div className="min-h-screen bg-black light:bg-slate-50 text-white light:text-slate-900 transition-colors duration-200">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <EditorNavbar onMenuClick={() => setSidebarOpen(true)} />

      <main className="md:ml-64 pt-4 md:pt-14 px-3 md:px-6 pb-10">
        <div className="max-w-5xl mx-auto">
          
          {/* ==================== PROFILE HEADER (HYPER-COMPACT MOBILE OPTIMIZED) ==================== */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl mb-2 bg-black border border-zinc-800/40 p-3 md:p-8"
          >
            <div className="flex flex-col md:flex-row gap-4 md:gap-14 items-center md:items-start">
              
              {/* Desktop Avatar Section (Hidden on Mobile) */}
              <div className="hidden md:block shrink-0">
                <div className="relative">
                  <div 
                    className="relative rounded-full p-[3px] bg-zinc-900 ring-2 ring-black w-[108px] h-[108px]"
                  >
                    <div className="w-full h-full rounded-full overflow-hidden bg-zinc-950">
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
              </div>

              {/* Info & Stats Section */}
              <div className="flex-1 w-full min-w-0">
                
                <div className="flex md:hidden w-full gap-3 items-stretch mb-3">
                  {/* Left Column (50%): Avatar + Name + Actions (Centered) */}
                  <div className="w-1/2 flex flex-col items-center gap-1.5">
                    <div className="relative shrink-0 mb-1">
                      <div className="relative rounded-full p-[2px] bg-zinc-900 ring-1 ring-black w-18 h-18 sm:w-20 sm:h-20">
                        <div className="w-full h-full rounded-full overflow-hidden bg-zinc-950">
                          <img 
                            src={userData?.profilePicture || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} 
                            alt="Profile" 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                      </div>
                      {isVerified && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-emerald-600 rounded-full flex items-center justify-center border border-black z-10">
                          <FaCheckCircle className="text-white text-[10px]" />
                        </div>
                      )}
                    </div>
                    <div className="w-full text-center">
                      <h1 className="text-base font-black text-white tracking-tight flex items-center justify-center gap-1 leading-none mb-2.5 break-all">
                        {userData?.name || "Member Name"}
                        {userData?.role === 'editor' && isVerified && <HiCheckBadge className="text-emerald-500 text-sm shrink-0" />}
                        {userData?.role === 'client' && <MdVerified className="text-purple-400 text-sm shrink-0" />}
                      </h1>
                      
                      {!isOwner && (
                        <div className="flex flex-col gap-1.5 w-full">
                          <button
                            onClick={handleFollowToggle}
                            disabled={followLoading}
                            className={`w-full py-2 rounded-md text-[10px] font-black uppercase tracking-wide transition-all flex items-center justify-center gap-1.5 ${
                              isFollowing 
                                ? "bg-zinc-800 text-white border border-zinc-700" 
                                : isPending
                                ? "bg-zinc-900 text-zinc-400 border border-zinc-800"
                                : "bg-white text-black"
                            }`}
                          >
                            {followLoading ? "..." : isFollowing ? "Following" : isPending ? (
                              <>
                                <HiOutlineLockClosed className="text-[10px]" /> Requested
                              </>
                            ) : (
                              <>
                                {userData?.followSettings?.manualApproval && <HiOutlineLockClosed className="text-[10px]" />}
                                Follow
                              </>
                            )}
                          </button>
                          
                          {!isOwner && user && userData?.role === "editor" && (
                            <button
                              onClick={() => {
                                if (user.role === "editor") {
                                  setShowContactRestriction(true);
                                } else if (user.role === "client" && user.clientKycStatus !== "verified") {
                                  setShowKYCModal(true);
                                } else {
                                  setRequestModalOpen(true);
                                }
                              }}
                              className="w-full py-2 bg-emerald-600 text-white text-[10px] font-black rounded-md uppercase tracking-wide"
                            >
                              Contact
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column (50%): Followers + Following (Centered with Icons) */}
                  <div className="w-1/2 flex flex-col justify-center gap-5 pt-1 border-l border-zinc-900 ml-1 pl-3">
                    <div className="flex flex-col items-center">
                      {userData?.role === 'editor' && (
                        <div className="flex items-center gap-1 mb-1.5 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                          <span className="text-[7px] font-black text-blue-400 uppercase tracking-tighter">Video Editor</span>
                          <MdVerified className="text-blue-500 text-[9px]" />
                        </div>
                      )}
                      {userData?.role === 'client' && (
                        <div className="flex items-center gap-1 mb-1.5 bg-purple-500/15 px-1.5 py-0.5 rounded border border-purple-500/30">
                          <span className="text-[7px] font-black text-purple-400 uppercase tracking-tighter">Verified Client</span>
                          <MdVerified className="text-purple-400 text-[9px]" />
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 mb-1">
                        <FaUserFriends className="text-[8px] text-zinc-600" />
                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Followers</span>
                      </div>
                      <span className="text-2xl font-black text-white leading-none tracking-tighter">{userData?.followers?.length || 0}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1.5 mb-1">
                        <FaUserPlus className="text-[8px] text-zinc-600" />
                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Following</span>
                      </div>
                      <span className="text-2xl font-black text-white leading-none tracking-tighter">{userData?.following?.length || 0}</span>
                    </div>

                    {userData?.role === 'editor' && (
                      <div 
                        className="flex flex-col items-center cursor-pointer"
                        onClick={() => reviewCount > 0 && setShowRatingsModal(true)}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <FaStar className="text-[8px]" style={{ color: hasRatings ? "#F59E0B" : "#6B7280" }} />
                          <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Rating</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-2xl font-black text-white leading-none tracking-tighter">{displayRating}</span>
                          {reviewCount > 0 && <span className="text-[10px] text-zinc-500 font-bold">({reviewCount})</span>}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Desktop Name/Action Row (Hidden on Mobile) */}
                <div className="hidden md:flex items-center gap-5 mb-6">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
                      {userData?.name || "Member Name"}
                      {userData?.role === 'editor' && isVerified && <HiCheckBadge className="text-emerald-500" />}
                      {userData?.role === 'client' && <MdVerified className="text-purple-400" />}
                    </h1>
                    {suvixScore && suvixScore.isEligible && (
                      <div className="flex items-center gap-2 bg-zinc-900/50 px-2 py-1 rounded-lg border border-zinc-800">
                        <SuvixScoreBadge score={suvixScore.total} tier={suvixScore.tier} isEligible={suvixScore.isEligible} size="small" showLabel={false} />
                        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: suvixScore.tierColor }}>{suvixScore.tierLabel}</span>
                      </div>
                    )}
                    {userData?.role === 'editor' && (
                      <div 
                        className="flex items-center gap-2 bg-zinc-900/50 px-3 py-1.5 rounded-lg border border-zinc-800 cursor-pointer hover:bg-zinc-800/80 transition-all"
                        onClick={() => reviewCount > 0 && setShowRatingsModal(true)}
                      >
                        <FaStar className="text-sm" style={{ color: hasRatings ? "#F59E0B" : "#6B7280" }} />
                        <span className="text-sm font-black text-white leading-none">{displayRating}</span>
                        {reviewCount > 0 && <span className="text-xs text-zinc-500 font-bold ml-1">({reviewCount} reviews)</span>}
                      </div>
                    )}
                  </div>
                  
                  {!isOwner && (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleFollowToggle}
                        disabled={followLoading}
                        className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                          isFollowing 
                            ? "bg-zinc-800 text-white border border-zinc-700 hover:bg-zinc-700" 
                            : isPending
                            ? "bg-zinc-900 text-zinc-400 border border-zinc-800"
                            : "bg-white text-black hover:bg-zinc-200"
                        }`}
                      >
                        {followLoading ? "..." : isFollowing ? "Following" : isPending ? (
                          <>
                            <HiOutlineLockClosed className="text-sm" /> Requested
                          </>
                        ) : (
                          <>
                            {userData?.followSettings?.manualApproval && <HiOutlineLockClosed className="text-sm" />}
                            Follow
                          </>
                        )}
                      </button>
                      {userData?.role === "editor" && user && (
                        <button
                          onClick={() => {
                            if (user.role === "editor") {
                              setShowContactRestriction(true);
                            } else if (user.role === "client" && user.clientKycStatus !== "verified") {
                              setShowKYCModal(true);
                            } else {
                              setRequestModalOpen(true);
                            }
                          }}
                          className="px-6 py-2 bg-emerald-600 text-white text-xs font-black rounded-full uppercase tracking-widest hover:bg-emerald-500"
                        >
                          Contact Editor
                        </button>
                      )}
                    </div>
                  )}
                </div>


                {/* Bio & Professional Indicators (Mobile Compact) */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[9px] md:text-base font-black text-zinc-300 uppercase leading-none">
                      {userData?.role === "editor" ? "PRO VIDEO EDITOR" : "PREMIUM CLIENT"}
                    </span>
                    {profile?.experience && userData?.role === 'editor' && (
                      <span className="px-1.5 py-0.5 bg-zinc-900/50 text-zinc-500 text-[7px] md:text-[10px] font-black rounded border border-zinc-800 uppercase trackers-widest leading-none">
                        {profile.experience}
                      </span>
                    )}
                    {userData?.role === 'client' && (
                      <span className="px-1.5 py-0.5 bg-zinc-900/50 text-purple-400 text-[7px] md:text-[10px] font-black rounded border border-violet-900/50 uppercase tracking-widest leading-none">
                        ELITE MEMBER
                      </span>
                    )}
                  </div>

                  {profile?.about && (
                    <div className="max-w-2xl">
                      <p className="text-[10px] md:text-sm font-medium text-zinc-400 leading-tight">
                        <span className="md:hidden">
                          {profile.about.split(' ').length > 4 
                            ? (
                              <>
                                {profile.about.split(' ').slice(0, 4).join(' ')}... 
                                <button onClick={() => setActiveTab("about")} className="text-white font-black ml-1 uppercase text-[8px]">more</button>
                              </>
                            ) : profile.about
                          }
                        </span>
                        <span className="hidden md:block leading-relaxed">{profile.about}</span>
                        
                        {/* Mobile Integrated Availability Status */}
                        {userData?.role === 'editor' && userData?.availability && (
                          <div className="md:hidden inline-flex items-center gap-1 px-1.5 py-0.5 bg-zinc-900/50 rounded border border-zinc-800 scale-[0.85] origin-left">
                            <FaCircle className={`text-[6px] ${
                              userData.availability.status === 'available' ? 'text-emerald-500' : 
                              userData.availability.status === 'busy' ? 'text-yellow-500' : 'text-blue-500'
                            }`} />
                            <span className="text-[7px] font-black text-zinc-400 uppercase tracking-widest">
                              {userData.availability.status === 'available' ? 'Available' : 
                               userData.availability.status === 'busy' ? 'Busy' : 'Small Only'}
                            </span>
                          </div>
                        )}
                      </p>
                    </div>
                  )}

                  {/* Software Carousel (Editor only) */}
                  {userData?.role === 'editor' && profile.softwares?.length > 0 && (
                    <div className="pt-2 mt-1 border-t border-zinc-900/40">
                      <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        {profile.softwares.map((name) => {
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

                  {/* Metadata & Indicators Flow */}
                  <div className="flex flex-wrap items-center gap-3 pt-2 mt-2 border-t border-zinc-900/50 text-zinc-500 text-[8px] md:text-[11px] font-black uppercase tracking-tight">
                    {profile.location?.country && (
                      <div className="flex items-center gap-1">
                        <FaMapMarkerAlt size={7} /> 
                        <ReactCountryFlag
                          countryCode={countryNameToCode[profile.location.country] || "IN"}
                          svg
                          style={{ width: "8px", height: "8px" }}
                        />
                        <span>{profile.location.country}</span>
                      </div>
                    )}
                    {profile.contactEmail && (
                      <div className="flex items-center gap-1">
                        <FaEnvelope size={7} /> <span className="normal-case truncate max-w-[100px] md:max-w-none">{profile.contactEmail}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <FaCalendarAlt size={7} /> <span>Member since 2024</span>
                    </div>
                    
                    {/* Availability Status (Desktop Metadata) */}
                    {userData?.role === 'editor' && userData?.availability && (
                      <div className="hidden md:flex items-center gap-1.5 ml-auto px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded">
                        <FaCircle className={`text-[8px] ${
                          userData.availability.status === 'available' ? 'text-emerald-500' : 
                          userData.availability.status === 'busy' ? 'text-yellow-500' : 'text-blue-500'
                        }`} />
                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-300">
                          {userData.availability.status === 'available' ? 'Available' : 
                           userData.availability.status === 'busy' ? 'Busy' : 'Small Only'}
                        </span>
                      </div>
                    )}

                    {isVerified && !userData?.availability && (
                      <div className="md:ml-auto flex items-center gap-1 text-emerald-500/80">
                        <FaCheckCircle size={7} /> <span>Verified</span>
                      </div>
                    )}
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
                        layoutId="activeTabPublic"
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
                    {profile.skills?.length > 0 && userData?.role === 'editor' && (
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

                    {/* Software Expertise */}
                    {profile.softwares?.length > 0 && userData?.role === 'editor' && (
                      <div className="bg-zinc-950 border border-zinc-800/50 rounded-xl p-4 md:p-5">
                        <div className="flex items-center gap-2.5 mb-4">
                          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                            <FaBriefcase className="text-zinc-400 text-xs" />
                          </div>
                          <h3 className="text-sm font-semibold text-white">Software Expertise</h3>
                        </div>
                        <SoftwareExpertise softwares={profile.softwares} />
                      </div>
                    )}

                    {/* Certifications */}
                    {profile.certifications?.length > 0 && userData?.role === 'editor' && (
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
                  {userData?.role === 'editor' && (
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
                  )}
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

            {/* ACHIEVEMENTS TAB */}
            {activeTab === "achievements" && (
              <motion.div
                key="achievements"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="bg-zinc-950 border border-zinc-800/50 rounded-xl p-4 md:p-5"
              >
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <HiOutlineTrophy className="text-amber-500" />
                  Earned Badges ({earnedBadges.length})
                </h3>
                
                {earnedBadges.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {earnedBadges.map((badge) => (
                      <div
                        key={badge.id}
                        className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center"
                      >
                        <div 
                          className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center"
                          style={{ 
                            backgroundColor: `${badge.color}20`,
                            border: `2px solid ${badge.color}`,
                          }}
                        >
                          <HiOutlineTrophy className="w-5 h-5" style={{ color: badge.color }} />
                        </div>
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <HiOutlineLockOpen className="w-3 h-3 text-emerald-400" />
                          <span className="text-xs font-semibold text-white">{badge.name}</span>
                        </div>
                        <p className="text-[10px] text-zinc-500 line-clamp-2">{badge.description}</p>
                        {badge.earnedAt && (
                          <p className="text-[9px] text-zinc-600 mt-1">
                            {new Date(badge.earnedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-zinc-900 flex items-center justify-center">
                      <HiOutlineLockClosed className="text-zinc-600 text-lg" />
                    </div>
                    <p className="text-xs text-zinc-500">No badges earned yet</p>
                    <p className="text-[10px] text-zinc-600 mt-1">Keep working to unlock achievements!</p>
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

      {/* KYC Required Modal */}
      <KYCRequiredModal
        isOpen={showKYCModal}
        onClose={() => setShowKYCModal(false)}
        kycStatus={user?.clientKycStatus}
      />

      {/* Cross-Editor Contact Restriction Popup */}
      <AnimatePresence>
        {showContactRestriction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[6000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowContactRestriction(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-black border border-zinc-800 p-6 rounded-2xl max-w-xs w-full text-center shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaUser className="text-zinc-400 text-lg" />
              </div>
              <p className="text-white text-xs font-medium leading-relaxed mb-6">
                You are an editor, you can't contact other editors. If you want to contact them, you have to open a new account as a normal user or client.
              </p>
              <button
                onClick={() => setShowContactRestriction(false)}
                className="w-full py-2.5 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-zinc-200 transition-colors"
              >
                Understood
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PublicEditorProfile;
