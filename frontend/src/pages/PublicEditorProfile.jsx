/**
 * PublicEditorProfile - View-only profile page
 * Same design as EditorProfilePage but without edit/add functionality
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronLeft, FaEnvelope, FaMapMarkerAlt, FaAward, FaCode, FaUser, FaTimes, FaCheckCircle, FaImages, FaShoppingCart, FaStar, FaGlobe, FaEye, FaCalendarAlt, FaPaperPlane, FaRupeeSign, FaBriefcase, FaFilm, FaPlay, FaClock, FaUserFriends, FaUserPlus, FaCircle, FaYoutube, FaInstagram, FaTiktok, FaTwitter, FaLinkedin } from "react-icons/fa";
import { HiCheckBadge, HiOutlineTrophy, HiOutlineLockClosed, HiOutlineLockOpen } from "react-icons/hi2";
import { MdVerified } from "react-icons/md";
import axios from "axios";
import { useAppContext } from "../context/AppContext";
import { useNavigate, useParams } from "react-router-dom";
import ReactCountryFlag from "react-country-flag";
import { toast } from "react-toastify";

import UnifiedNavigation from "../components/UnifiedNavigation.jsx";
import PortfolioSection from "../components/PortfolioSection.jsx";
import EditorRatingsModal from "../components/EditorRatingsModal.jsx";
import SuvixScoreBadge from "../components/SuvixScoreBadge.jsx";
import KYCRequiredModal from "../components/KYCRequiredModal.jsx";
import SoftwareExpertise from "../components/SoftwareExpertise.jsx";
import FollowListModal from "../components/FollowListModal.jsx";

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
  const [followModal, setFollowModal] = useState({ isOpen: false, type: "followers" });

  const navigate = useNavigate();
  
  const userData = profile?.user || {};
  const isVerified = userData?.kycStatus === 'verified' || profile?.kycVerified;
  const isOwner = user?._id === userData._id;

  // Fetch profile
  useEffect(() => {
    if (userData?._id && !activeTab) {
      setActiveTab("portfolio");
    }
  }, [userData?._id, activeTab]);

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
          <h2 className="text-lg font-normal text-white mb-2">Profile Not Found</h2>
          <p className="text-zinc-500 text-sm mb-4">This profile doesn't exist or is unavailable.</p>
          <button
            onClick={() => navigate("/explore")}
            className="px-4 py-2 bg-white text-black text-sm font-normal rounded-lg hover:bg-zinc-200 transition-colors"
          >
            Explore Editors
          </button>
        </motion.div>
      </div>
    );
  }


  const allTabs = [
    { id: "portfolio", label: userData?.role === 'client' ? "Reels" : "Portfolio", icon: userData?.role === 'client' ? FaFilm : FaImages },
    { id: "about", label: "About", icon: FaUser },
    { id: "gigs", label: "Gigs", icon: FaShoppingCart },
    { id: "achievements", label: "Achievements", icon: HiOutlineTrophy },
  ];

  const tabs = userData?.role === 'client' 
    ? allTabs.filter(tab => ["portfolio", "about"].includes(tab.id))
    : allTabs;
  // Progress ring config for clients
  // Progress ring config
  const size = 100;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progressColor = userData?.role === 'editor' ? "white" : "#A855F7"; // White for Editor, Purple for Client
  const strokeDashoffset = 0;
  const strokeDasharray = circumference + 2; // Slight overlap to ensure a solid circle

  return (
    <div className="min-h-screen bg-black light:bg-slate-50 text-white light:text-slate-900 transition-colors duration-200">
      <UnifiedNavigation sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className="md:ml-64 pt-4 md:pt-14 px-3 md:px-6 pb-10">
        <div className="max-w-5xl mx-auto">
          
          {/* ==================== PROFILE HEADER (HYPER-COMPACT MOBILE OPTIMIZED) ==================== */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl mb-2 bg-black border border-zinc-800/40 p-3 md:p-10"
          >
            <div className="flex flex-col md:flex-row gap-4 md:gap-14 items-center md:items-start">
              
              {/* Profile Border & Avatar */}
              <div className="hidden md:block shrink-0">
                <div className="relative">
                  <svg
                    className="absolute -top-1.5 -left-1.5 w-[116px] h-[116px] -rotate-90 pointer-events-none"
                    viewBox={`0 0 ${size + 8} ${size + 8}`}
                  >
                    <circle cx={(size + 8) / 2} cy={(size + 8) / 2} r={radius + 4} fill="none" stroke="#1a1a1a" strokeWidth={strokeWidth} />
                    <circle cx={(size + 8) / 2} cy={(size + 8) / 2} r={radius + 4} fill="none" stroke={progressColor} strokeWidth={strokeWidth} />
                  </svg>
                  <div className="relative rounded-full p-[4px] bg-zinc-900 ring-2 ring-black w-[108px] h-[108px]">
                    <div className="w-full h-full rounded-full overflow-hidden bg-zinc-950">
                      <img src={userData?.profilePicture || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} alt="Profile" className="w-full h-full object-cover" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Info Section */}
              <div className="flex-1 w-full min-w-0">
                
                {/* Mobile Layout */}
                <div className="flex md:hidden w-full gap-3 items-stretch mb-3">
                  <div className="w-1/2 flex flex-col items-center gap-1.5">
                    <div className="relative shrink-0 mb-1">
                      <svg
                        className="absolute -top-1 -left-1 w-20 h-20 -rotate-90 pointer-events-none"
                        viewBox={`0 0 ${size + 8} ${size + 8}`}
                      >
                        <circle cx={(size + 8) / 2} cy={(size + 8) / 2} r={radius + 4} fill="none" stroke="#1a1a1a" strokeWidth={strokeWidth + 2} />
                        <circle cx={(size + 8) / 2} cy={(size + 8) / 2} r={radius + 4} fill="none" stroke={progressColor} strokeWidth={strokeWidth + 2} />
                      </svg>
                      <div className="relative rounded-full p-[2px] bg-zinc-900 ring-1 ring-black w-18 h-18">
                        <div className="w-full h-full rounded-full overflow-hidden bg-zinc-950">
                          <img src={userData?.profilePicture || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} alt="Profile" className="w-full h-full object-cover" />
                        </div>
                      </div>
                    </div>
                    <div className="w-full text-center">
                      <h1 className="text-base font-bold text-white tracking-tight flex items-center justify-center gap-1 leading-none mb-2.5 break-all">
                        {userData?.name}
                        {userData?.role === 'editor' && <MdVerified className="text-blue-500 text-sm shrink-0" />}
                        {userData?.role === 'client' && <MdVerified className="text-blue-500 text-sm shrink-0" />}
                      </h1>
                      {!isOwner && (
                        <button
                          onClick={handleFollowToggle}
                          disabled={followLoading}
                          className={`w-full py-2 rounded-md text-[10px] font-normal uppercase tracking-wide transition-all flex items-center justify-center gap-1.5 ${
                            isFollowing 
                              ? "bg-zinc-800 text-white border border-zinc-700" 
                              : isPending
                              ? "bg-zinc-900 text-zinc-400 border border-zinc-800"
                              : "bg-white text-black"
                          }`}
                        >
                          {followLoading ? "..." : isFollowing ? "Following" : isPending ? "Requested" : "Follow"}
                        </button>
                      )}
                      
                      {/* Editor Specific: Contact Button (Mobile) */}
                      {!isOwner && userData?.role === 'editor' && (
                        <button
                          onClick={() => setRequestModalOpen(true)}
                          className="w-full mt-2 py-2 bg-emerald-600 text-white rounded-md text-[10px] font-normal uppercase tracking-wide flex items-center justify-center gap-1.5 hover:bg-emerald-500 transition-all active:scale-95"
                        >
                          <FaEnvelope className="text-[8px]" /> Contact
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="w-1/2 flex flex-col justify-center gap-4 pt-1 border-l border-zinc-900 ml-1 pl-3">
                    <button 
                      onClick={() => navigate(`/connections/${userData?._id}?tab=followers`)}
                      className="flex flex-col items-center hover:opacity-80 transition-all"
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <FaUserFriends className="text-[8px] text-zinc-600" />
                        <span className="text-[8px] font-normal text-zinc-500 uppercase tracking-widest">Followers</span>
                      </div>
                      <span className="text-xl font-normal text-white leading-none tracking-tighter">{userData?.followers?.length || 0}</span>
                    </button>
                    <button 
                      onClick={() => navigate(`/connections/${userData?._id}?tab=following`)}
                      className="flex flex-col items-center hover:opacity-80 transition-all"
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <FaUserPlus className="text-[8px] text-zinc-600" />
                        <span className="text-[8px] font-normal text-zinc-500 uppercase tracking-widest">Following</span>
                      </div>
                      <span className="text-xl font-normal text-white leading-none tracking-tighter">{userData?.following?.length || 0}</span>
                    </button>

                    {/* Editor Professional Stats (Mobile - Relocated) */}
                    {userData?.role === 'editor' && (
                      <div className="flex flex-col gap-4 border-t border-zinc-900 pt-3 mt-1">
                        <div className="flex flex-col items-center">
                          <div className="flex items-center gap-1 mb-0.5">
                            <FaStar className="text-[8px] text-amber-500/80" />
                            <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-normal">Rating</span>
                          </div>
                          <span className="text-lg font-normal text-white leading-none">{profile?.ratingStats?.averageRating?.toFixed(1) || "0.0"}</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <div className="flex items-center gap-1 mb-0.5">
                            <FaBriefcase className="text-[8px] text-blue-500/80" />
                            <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-normal">Projects</span>
                          </div>
                          <span className="text-lg font-normal text-white leading-none">{profile?.totalCompletedOrders || 0}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Desktop Layout Header */}
                <div className="hidden md:flex items-center gap-8 mb-6">
                  <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
                    {userData?.name}
                    {userData?.role === 'editor' && <MdVerified className="text-blue-500" />}
                    {userData?.role === 'client' && <MdVerified className="text-blue-500" />}
                  </h1>
                  <div className="flex gap-8">
                    <button onClick={() => navigate(`/connections/${userData?._id}?tab=followers`)} className="hover:opacity-80 transition-all flex items-center gap-2">
                       <span className="text-lg font-normal text-white">{userData?.followers?.length || 0}</span>
                       <span className="text-zinc-500 text-sm uppercase tracking-widest font-normal">Followers</span>
                    </button>
                    <button onClick={() => navigate(`/connections/${userData?._id}?tab=following`)} className="hover:opacity-80 transition-all flex items-center gap-2">
                       <span className="text-lg font-normal text-white">{userData?.following?.length || 0}</span>
                       <span className="text-zinc-500 text-sm uppercase tracking-widest font-normal">Following</span>
                    </button>
                  </div>
                  {!isOwner && (
                    <button
                      onClick={handleFollowToggle}
                      disabled={followLoading}
                      className={`px-8 py-2.5 rounded-lg text-xs font-normal uppercase tracking-widest transition-all ${
                        isFollowing ? "bg-zinc-800 text-white border border-zinc-700" : "bg-white text-black"
                      }`}
                    >
                      {followLoading ? "..." : isFollowing ? "Following" : isPending ? "Requested" : "Follow"}
                    </button>
                  )}

                   {/* Editor Specific: Contact Button (Desktop) */}
                  {!isOwner && userData?.role === 'editor' && (
                    <button
                      onClick={() => setRequestModalOpen(true)}
                      className="px-8 py-2.5 bg-emerald-600 text-white rounded-lg text-xs font-normal uppercase tracking-widest hover:bg-emerald-500 transition-all active:scale-95 flex items-center gap-2"
                    >
                      <FaEnvelope /> Contact
                    </button>
                  )}
                </div>

                {/* Desktop Professional Stats Row - Relocated */}
                {userData?.role === 'editor' && (
                  <div className="hidden md:flex items-center gap-8 mb-6 pt-4 border-t border-zinc-900/50">
                    <div className="flex items-center gap-2.5">
                      <FaStar className="text-xs text-amber-500" />
                      <div className="flex flex-col">
                        <span className="text-lg font-normal text-white leading-none">{profile?.ratingStats?.averageRating?.toFixed(1) || "0.0"}</span>
                        <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-normal">Average Rating</span>
                      </div>
                    </div>
                    <div className="w-px h-8 bg-zinc-900/80 mx-2" />
                    <div className="flex items-center gap-2.5">
                      <FaBriefcase className="text-xs text-blue-500" />
                      <div className="flex flex-col">
                        <span className="text-lg font-normal text-white leading-none">{profile?.totalCompletedOrders || 0}</span>
                        <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-normal">Projects Done</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Common Bio Section */}
                {/* Common Bio Section */}
                <div className="flex flex-col gap-1.5">
                  <div className={`${userData?.role === 'client' ? 'text-[11px] md:text-sm' : 'text-[10px] md:text-sm'} font-normal text-zinc-400 leading-tight whitespace-pre-wrap max-w-2xl mb-1`}>
                    {profile?.about || (userData?.role === 'client' ? "I am a content creator looking for top editors." : "Professional video editor.")}
                  </div>

                  {/* Software Carousel (Editor Only) */}
                  {userData?.role === 'editor' && profile?.softwares?.length > 0 && (
                    <div className="flex gap-1.5 overflow-x-auto scrollbar-hide w-full" style={{ scrollbarWidth: 'none' }}>
                      {profile.softwares.map((sw) => {
                        const icon = SW_ICON_MAP[sw];
                        return (
                          <div key={sw} className="flex-shrink-0 flex items-center justify-center w-8 h-8 bg-zinc-950 border border-zinc-900 rounded-md group hover:border-zinc-700 transition-colors">
                            {icon ? (
                              <img src={icon} alt={sw} className="w-4 h-4 object-contain opacity-80 group-hover:opacity-100 transition-opacity" title={sw} />
                            ) : (
                              <FaCode className="text-zinc-600 text-xs" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Social Icons Carousel (Brand Colors) */}
                  {profile?.socialLinks && Object.values(profile.socialLinks).some(link => link) && (
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide w-full" style={{ scrollbarWidth: 'none' }}>
                      {profile.socialLinks.youtube && (
                        <a href={profile.socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-md bg-zinc-900 shadow-sm text-[#FF0000] hover:bg-[#FF0000]/10 transition-all">
                          <FaYoutube size={14} />
                        </a>
                      )}
                      {profile.socialLinks.instagram && (
                        <a href={profile.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-md bg-zinc-900 shadow-sm text-[#E4405F] hover:bg-[#E4405F]/10 transition-all">
                          <FaInstagram size={14} />
                        </a>
                      )}
                      {profile.socialLinks.tiktok && (
                        <a href={profile.socialLinks.tiktok} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-md bg-zinc-900 shadow-sm text-white hover:bg-white/10 transition-all">
                          <FaTiktok size={14} />
                        </a>
                      )}
                      {profile.socialLinks.twitter && (
                        <a href={profile.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-md bg-zinc-900 shadow-sm text-[#1DA1F2] hover:bg-[#1DA1F2]/10 transition-all">
                          <FaTwitter size={14} />
                        </a>
                      )}
                      {profile.socialLinks.linkedin && (
                        <a href={profile.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-md bg-zinc-900 shadow-sm text-[#0077B5] hover:bg-[#0077B5]/10 transition-all">
                          <FaLinkedin size={14} />
                        </a>
                      )}
                      {profile.socialLinks.website && (
                        <a href={profile.socialLinks.website} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-md bg-zinc-900 shadow-sm text-[#10B981] hover:bg-[#10B981]/10 transition-all">
                          <FaGlobe size={14} />
                        </a>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3 pt-1.5 mt-1 border-t border-zinc-900/50 text-zinc-600 text-[8px] font-normal uppercase tracking-tight">
                    <div className="flex items-center gap-1">
                      <FaMapMarkerAlt size={8} /> <span>{profile.location?.country?.toUpperCase() || "INDIA"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FaCalendarAlt size={8} /> <span>Member since 2024</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ==================== TABS ==================== */}
          <div className="w-full px-4 mb-2.5 overflow-hidden">
            <div className="flex overflow-x-auto scrollbar-hide pb-2" style={{ scrollbarWidth: 'none' }}>
              <div className="inline-flex bg-zinc-950/80 border border-zinc-900 rounded-lg p-1 relative mx-auto min-w-max shrink-0">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      relative px-2.5 py-1.5 rounded-md text-[10px] md:text-sm font-normal uppercase tracking-widest transition-all flex items-center gap-1.5 z-10
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
                className="w-full"
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
                          <h3 className="text-sm font-normal text-white">About</h3>
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
                          <h3 className="text-sm font-normal text-white">Skills</h3>
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
                          <h3 className="text-sm font-normal text-white">Languages</h3>
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
                          <h3 className="text-sm font-normal text-white">Software Expertise</h3>
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
                          <h3 className="text-sm font-normal text-white">Certifications</h3>
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
                        <h4 className="text-sm font-normal text-white mb-3">Badges</h4>
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
                        <h4 className="text-sm font-normal text-white mb-3">Performance</h4>
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
                <h3 className="text-sm font-normal text-white mb-4 flex items-center gap-2">
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
                          <span className="text-xs font-normal text-white">{badge.name}</span>
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
                  <h2 className="text-lg font-normal text-white">Contact Editor</h2>
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
                      <span className="text-emerald-400 font-normal">₹{(Number(requestData.amount) - Math.round(Number(requestData.amount) * 0.1)).toLocaleString()}</span>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleSubmitRequest}
                  disabled={submittingRequest}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-green-500 text-white text-sm font-normal rounded-lg hover:from-emerald-500 hover:to-green-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
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
                className="w-full py-2.5 bg-white text-black text-[10px] font-normal uppercase tracking-widest rounded-lg hover:bg-zinc-200 transition-colors"
              >
                Understood
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Follow / Following Modal */}
      <FollowListModal
        isOpen={followModal.isOpen}
        onClose={() => setFollowModal({ ...followModal, isOpen: false })}
        userId={userData?._id}
        type={followModal.type}
      />
    </div>
  );
  
};


export default PublicEditorProfile;
