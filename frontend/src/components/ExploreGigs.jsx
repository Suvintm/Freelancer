import { useState, useEffect } from "react";
import axios from "axios";
import {
  FaSearch,
  FaFilter,
  FaTimes,
  FaSortAmountDown,
  FaClock,
  FaRupeeSign,
  FaStar,
  FaChevronLeft,
  FaChevronRight,
  FaShoppingCart,
  FaPlay,
  FaLock,
  FaArrowRight,
  FaFire,
} from "react-icons/fa";
import { HiSparkles, HiVideoCamera, HiLightningBolt, HiCheckCircle, HiUserGroup } from "react-icons/hi";
import { useAppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import RazorpayCheckout from "./RazorpayCheckout";
import KYCRequiredModal from "./KYCRequiredModal";

/**
 * ExploreGigs - Professional Design
 * Dark base with light: variant overrides for theme toggle
 */

const CATEGORIES = ["All", "Wedding", "Birthday", "Corporate", "Music Video", "Short Film", "Social Media", "Commercial", "Documentary", "YouTube", "Other"];

// Professional default banner for gigs without a thumbnail
const DEFAULT_GIG_BANNER = "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&q=80";

const ExploreGigs = () => {
  const { backendURL, user } = useAppContext();
  const navigate = useNavigate();

  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingText, setLoadingText] = useState("Discovering amazing gigs...");
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  // Hero Banner Images for auto-transition
  const gigBanners = [
    "/gig_banner_1_1766948855701.png",
    "/gig_banner_2_1766948871936.png",
    "/gig_banner_3_1766948889355.png"
  ];

  // Gig category images
  const gigCategoryImages = {
    Wedding: "/gig_wedding_1766948915760.png",
    YouTube: "/gig_youtube_1766948931151.png",
    Corporate: "/gig_corporate_1766948947570.png",
    "Social Media": "/gig_social_1766948962774.png",
    "Music Video": "/gig_music_1766948988595.png",
    Birthday: "/gig_birthday_1766949004406.png",
    Documentary: "/gig_documentary_1766949021115.png",
  };

  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 1 });

  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedGig, setSelectedGig] = useState(null);
  const [orderForm, setOrderForm] = useState({ description: "", deadline: "" });
  const [ordering, setOrdering] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [showKYCModal, setShowKYCModal] = useState(false);

  // Auto-transition banner every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % gigBanners.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const texts = ["Discovering amazing gigs...", "Finding talented editors...", "Loading creative services..."];
    let i = 0;
    const interval = setInterval(() => { i = (i + 1) % texts.length; setLoadingText(texts[i]); }, 2000);
    return () => clearInterval(interval);
  }, []);

  const fetchGigs = async (page = 1) => {
    try {
      setLoading(true);
      const token = user?.token || JSON.parse(localStorage.getItem("user"))?.token;
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "12",
        ...(searchQuery && { search: searchQuery }),
        ...(selectedCategory !== "All" && { category: selectedCategory }),
        ...(priceRange.min && { minPrice: priceRange.min }),
        ...(priceRange.max && { maxPrice: priceRange.max }),
        sort: sortBy === "newest" ? "createdAt" : sortBy === "price_low" ? "price_low" : sortBy === "price_high" ? "price_high" : "popular",
      });
      const res = await axios.get(`${backendURL}/api/gigs?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      setGigs(res.data.gigs || []);
      setPagination(res.data.pagination || { page: 1, limit: 12, total: 0, pages: 1 });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to fetch gigs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGigs(1); }, [backendURL, user]);
  useEffect(() => { const timer = setTimeout(() => fetchGigs(1), 500); return () => clearTimeout(timer); }, [searchQuery, selectedCategory, sortBy, priceRange]);

  const handleCreateOrder = async () => {
    if (!orderForm.deadline) { toast.error("Please select a deadline"); return; }
    try {
      setOrdering(true);
      const res = await axios.post(`${backendURL}/api/orders/gig`, { gigId: selectedGig._id, description: orderForm.description, deadline: orderForm.deadline }, { headers: { Authorization: `Bearer ${user?.token}` } });
      setCreatedOrder(res.data.order);
      setShowOrderModal(false);
      setShowPayment(true);
      toast.info("Order created! Complete payment to confirm.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create order");
    } finally {
      setOrdering(false);
    }
  };

  const handlePaymentSuccess = (data) => {
    setShowPayment(false);
    const orderData = { orderNumber: data?.order?.orderNumber || createdOrder?.orderNumber, amount: data?.order?.amount || createdOrder?.amount || selectedGig?.price, title: data?.order?.title || createdOrder?.title || selectedGig?.title, transactionId: data?.order?.razorpayPaymentId || "" };
    setCreatedOrder(null);
    setSelectedGig(null);
    setOrderForm({ description: "", deadline: "" });
    navigate("/payment-success", { state: orderData });
  };

  const handlePaymentFailure = (error) => { toast.error(error?.description || "Payment failed. Please try again."); };
  const handlePaymentClose = () => { setShowPayment(false); toast.info("Payment cancelled. Your order is saved - pay anytime from My Orders."); };
  const openOrderModal = (gig) => {
    if (user?.role === "client" && user?.clientKycStatus !== "verified") {
      setShowKYCModal(true);
      return;
    }
    setSelectedGig(gig);
    setShowOrderModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full" />
        <motion.p key={loadingText} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-gray-500 light:text-slate-500 text-sm">{loadingText}</motion.p>
      </div>
    );
  }

  return (
    <div className="min-h-[50vh]" style={{ fontFamily: "'Inter', sans-serif" }}>
      
      {/* ============== HERO BANNER WITH IMAGE SLIDESHOW ============== */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 relative overflow-hidden rounded-2xl"
      >
        {/* Background Image Slideshow */}
        <div className="relative h-44 md:h-52">
          <AnimatePresence mode="wait">
            <motion.img
              key={currentBannerIndex}
              src={gigBanners[currentBannerIndex]}
              alt="Gig Banner"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </AnimatePresence>
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-violet-900/30" />
          
          {/* Banner Content */}
          <div className="absolute inset-0 flex flex-col justify-end p-4">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-violet-500/30 backdrop-blur-sm rounded-full mb-2 w-fit">
              <FaShoppingCart className="text-white text-[10px]" />
              <span className="text-white text-[9px] font-semibold uppercase tracking-wide">Gig Marketplace</span>
            </div>
            <h1 className="text-xl font-bold text-white mb-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Browse Creative Services
            </h1>
            <p className="text-white/70 text-xs">
              {pagination.total || 0}+ professional gigs available
            </p>
          </div>
          
          {/* Banner Indicators */}
          <div className="absolute bottom-3 right-4 flex gap-1">
            {gigBanners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentBannerIndex(idx)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  idx === currentBannerIndex 
                    ? "bg-white w-4" 
                    : "bg-white/40 hover:bg-white/60"
                }`}
              />
            ))}
          </div>
        </div>
        
        {/* Stats Strip */}
        <div className="bg-[#0a0a0c] light:bg-white border-t border-white/10 light:border-slate-100 p-3">
          <div className="grid grid-cols-4 gap-2">
            {[
              { value: `${pagination.total || 0}+`, label: "Gigs", icon: FaShoppingCart, color: "text-violet-400" },
              { value: "500+", label: "Orders", icon: HiCheckCircle, color: "text-purple-400" },
              { value: "4.9", label: "Rating", icon: FaStar, color: "text-amber-400" },
              { value: "99%", label: "Success", icon: HiLightningBolt, color: "text-emerald-400" },
            ].map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <stat.icon className={`${stat.color} text-[10px]`} />
                  <span className="text-xs font-bold text-white light:text-slate-900">{stat.value}</span>
                </div>
                <div className="text-[8px] text-gray-500 light:text-slate-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ============== BROWSE BY CATEGORY - WITH IMAGES ============== */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-5 h-5 bg-violet-500/15 rounded-md flex items-center justify-center">
            <HiLightningBolt className="text-violet-400 text-[10px]" />
          </div>
          <h2 className="text-xs font-bold text-white light:text-slate-900">Browse by Category</h2>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[
            { id: "Wedding", label: "Wedding" },
            { id: "YouTube", label: "YouTube" },
            { id: "Corporate", label: "Corporate" },
            { id: "Social Media", label: "Social" },
            { id: "Music Video", label: "Music" },
            { id: "Birthday", label: "Birthday" },
            { id: "Documentary", label: "Documentary" },
          ].filter(cat => gigCategoryImages[cat.id]).map((category, idx) => (
            <motion.button
              key={category.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.03 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory(category.id)}
              className={`relative rounded-xl overflow-hidden transition-all aspect-square ${
                selectedCategory === category.id
                  ? "ring-2 ring-violet-500 ring-offset-1 ring-offset-[#0a0a0c]"
                  : "hover:scale-105"
              }`}
            >
              <img 
                src={gigCategoryImages[category.id]} 
                alt={category.label}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-1 left-0 right-0 text-center">
                <span className="text-[9px] font-bold text-white drop-shadow-md">{category.label}</span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* ============== FEATURED GIGS CAROUSEL ============== */}
      {!loading && gigs.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 bg-amber-500/15 rounded-md flex items-center justify-center">
              <FaStar className="text-amber-400 text-[10px]" />
            </div>
            <h2 className="text-xs font-bold text-white light:text-slate-900">Featured Gigs</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x" style={{ scrollbarWidth: 'none' }}>
            {gigs.slice(0, 5).map((gig, idx) => (
              <motion.div
                key={gig._id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="snap-start flex-shrink-0 w-48 bg-[#0a0a0c] light:bg-white border border-white/10 light:border-slate-200 rounded-xl overflow-hidden hover:border-violet-500/30 transition-all group"
              >
                <div className="relative h-24 bg-white/5 overflow-hidden">
                  <img 
                    src={gig.thumbnail || DEFAULT_GIG_BANNER} 
                    alt={gig.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                  />
                  <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/70 backdrop-blur-sm rounded text-[8px] font-medium text-white">{gig.category}</span>
                </div>
                <div className="p-2.5">
                  <h4 className="text-[11px] font-semibold text-white light:text-slate-900 line-clamp-2 mb-1.5 group-hover:text-violet-400 transition-colors">{gig.title}</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-violet-400 font-bold text-sm">₹{gig.price}</span>
                    <span className="text-[9px] text-gray-500 flex items-center gap-0.5"><FaClock className="text-[8px]" /> {gig.deliveryDays}d</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ============== PROFESSIONAL SEARCH BAR ============== */}
      <div className="mb-4">
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-violet-400">
            <FaSearch className="text-sm" />
          </div>
          <input
            type="text"
            placeholder="Search gigs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full py-3 pl-10 pr-10 bg-white/5 light:bg-slate-50 border border-white/10 light:border-slate-200 rounded-full text-white light:text-slate-900 placeholder:text-gray-500 light:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/40 transition-all text-sm"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")} 
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white/10 light:bg-slate-200 rounded-full flex items-center justify-center text-gray-400 hover:bg-white/20 transition"
            >
              <FaTimes className="text-[10px]" />
            </button>
          )}
        </div>
      </div>

      {/* ============== CATEGORY PILLS (Horizontal Scroll) ============== */}
      <div className="mb-4 relative">
        {/* Gradient Fade Edges */}
        <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-[#0a0a0c] light:from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-[#0a0a0c] light:from-white to-transparent z-10 pointer-events-none" />
        
        <div className="flex gap-2 overflow-x-auto pb-1 px-1 scrollbar-hide snap-x" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {[
            { id: "All", label: "All", icon: HiSparkles, activeColor: "from-violet-500 to-purple-500" },
            { id: "Wedding", label: "Wedding", icon: FaStar, activeColor: "from-pink-500 to-rose-500", hot: true },
            { id: "YouTube", label: "YouTube", icon: FaPlay, activeColor: "from-red-500 to-orange-500" },
            { id: "Social Media", label: "Social", icon: HiVideoCamera, activeColor: "from-purple-500 to-fuchsia-500" },
            { id: "Corporate", label: "Corporate", icon: HiLightningBolt, activeColor: "from-blue-500 to-cyan-500" },
            { id: "Music Video", label: "Music", icon: FaPlay, activeColor: "from-emerald-500 to-green-500" },
          ].map((category) => {
            const isActive = selectedCategory === category.id;
            return (
              <motion.button
                key={category.id}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => setSelectedCategory(category.id)}
                className={`snap-start flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? `bg-gradient-to-r ${category.activeColor} text-white shadow-lg`
                    : "bg-white/5 light:bg-white text-gray-400 light:text-slate-600 border border-white/10 light:border-slate-200 hover:bg-white/10"
                }`}
              >
                <category.icon className={`text-[10px] ${isActive ? "text-white" : "text-violet-400"}`} />
                {category.label}
                {category.hot && !isActive && (
                  <span className="px-1 py-0.5 bg-orange-500 text-white text-[7px] rounded font-bold">
                    <FaFire className="text-[6px]" />
                  </span>
                )}
              </motion.button>
            );
          })}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFilters(!showFilters)}
            className={`snap-start flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all ${
              showFilters
                ? "bg-violet-500/20 text-violet-400 border border-violet-500/30"
                : "bg-white/5 light:bg-white text-gray-400 light:text-slate-600 border border-white/10 light:border-slate-200 hover:bg-white/10"
            }`}
          >
            <FaFilter className="text-[10px]" /> More
          </motion.button>
        </div>
      </div>

      {/* Expanded Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="bg-white/5 light:bg-slate-50 border border-white/10 light:border-slate-200 rounded-2xl p-5 mb-6 overflow-hidden">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      selectedCategory === cat
                        ? "bg-emerald-500 text-white"
                        : "bg-white/5 light:bg-white border border-white/10 light:border-slate-200 text-gray-400 light:text-slate-600 hover:border-emerald-500/50 light:hover:border-emerald-300"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 light:text-slate-500 text-sm">Price:</span>
                <input type="number" placeholder="Min" value={priceRange.min} onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })} className="w-20 bg-white/5 light:bg-white border border-white/10 light:border-slate-200 rounded-lg px-3 py-1.5 text-sm text-white light:text-slate-900" />
                <span className="text-gray-500 light:text-slate-400">-</span>
                <input type="number" placeholder="Max" value={priceRange.max} onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })} className="w-20 bg-white/5 light:bg-white border border-white/10 light:border-slate-200 rounded-lg px-3 py-1.5 text-sm text-white light:text-slate-900" />
              </div>
              <button onClick={() => { setSelectedCategory("All"); setPriceRange({ min: "", max: "" }); setSortBy("newest"); }} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 light:bg-red-50 text-red-400 light:text-red-600 hover:bg-red-500/20 light:hover:bg-red-100 flex items-center gap-1">
                <FaTimes /> Clear
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Info */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500 light:text-slate-500"><span className="font-semibold text-white light:text-slate-900">{pagination.total}</span> gigs found</p>
        {pagination.pages > 1 && <p className="text-sm text-gray-500 light:text-slate-400">Page {pagination.page} of {pagination.pages}</p>}
      </div>

      {/* Gigs Grid */}
      {gigs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500 light:text-slate-400">
          <FaShoppingCart className="text-5xl mb-4 opacity-50" />
          <p className="text-lg font-medium text-gray-300 light:text-slate-600">No gigs found</p>
          <p className="text-sm">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {gigs.map((gig, index) => (
            <motion.div
              key={gig._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="bg-[#0a0a0c] light:bg-white border border-white/10 light:border-slate-200 rounded-2xl overflow-hidden hover:border-emerald-500/30 light:hover:border-emerald-300 hover:shadow-xl transition-all group"
            >
              <div className="relative h-44 bg-white/5 light:bg-slate-100 overflow-hidden">
                <img 
                  src={gig.thumbnail || gig.banner || DEFAULT_GIG_BANNER} 
                  alt={gig.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                />
                <span className="absolute top-3 left-3 px-2.5 py-1 bg-black/70 light:bg-white/90 backdrop-blur-sm rounded-lg text-xs font-medium text-white light:text-slate-700 shadow-sm">{gig.category}</span>
              </div>

              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <img src={gig.editor?.profilePicture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} alt={gig.editor?.name} className="w-7 h-7 rounded-full object-cover border border-white/10 light:border-slate-200" />
                  <span className="text-sm text-gray-400 light:text-slate-600">{gig.editor?.name}</span>
                </div>

                <h3 className="font-semibold text-white light:text-slate-900 mb-2 line-clamp-2 group-hover:text-violet-400 light:group-hover:text-violet-600 transition-colors" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{gig.title}</h3>

                <div className="flex items-center gap-3 text-xs text-gray-500 light:text-slate-500 mb-4">
                  <span className="flex items-center gap-1"><FaClock className="text-violet-400" /> {gig.deliveryDays} days</span>
                  {gig.rating > 0 && <span className="flex items-center gap-1 text-amber-500"><FaStar /> {gig.rating.toFixed(1)}</span>}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/10 light:border-slate-100">
                  <div className="flex items-center gap-1 text-violet-400 light:text-violet-600 font-bold">
                    <FaRupeeSign className="text-sm" />
                    <span className="text-xl">{gig.price}</span>
                  </div>
                  <button onClick={() => openOrderModal(gig)} className="px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-full text-xs font-semibold hover:opacity-90 transition-all flex items-center gap-1.5 shadow-lg shadow-violet-500/25">
                    Order <FaArrowRight className="text-[10px]" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-10">
          <button onClick={() => fetchGigs(pagination.page - 1)} disabled={pagination.page === 1} className="w-10 h-10 rounded-xl bg-white/5 light:bg-white border border-white/10 light:border-slate-200 flex items-center justify-center text-gray-500 light:text-slate-500 hover:bg-white/10 light:hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
            <FaChevronLeft className="text-sm" />
          </button>
          <span className="text-gray-500 light:text-slate-500 text-sm px-3">{pagination.page} / {pagination.pages}</span>
          <button onClick={() => fetchGigs(pagination.page + 1)} disabled={pagination.page === pagination.pages} className="w-10 h-10 rounded-xl bg-white/5 light:bg-white border border-white/10 light:border-slate-200 flex items-center justify-center text-gray-500 light:text-slate-500 hover:bg-white/10 light:hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
            <FaChevronRight className="text-sm" />
          </button>
        </div>
      )}

      {/* Order Modal */}
      <AnimatePresence>
        {showOrderModal && selectedGig && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowOrderModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-[#0a0a0c] light:bg-white border border-white/10 light:border-slate-200 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white light:text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Create Order</h3>
                <button onClick={() => setShowOrderModal(false)} className="p-2 rounded-lg hover:bg-white/10 light:hover:bg-slate-100 text-gray-500 light:text-slate-500 transition-all"><FaTimes /></button>
              </div>

              <div className="bg-white/5 light:bg-slate-50 border border-white/10 light:border-slate-200 rounded-xl p-4 mb-6">
                <div className="flex gap-4">
                  <div className="w-20 h-14 bg-white/5 light:bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                    {selectedGig.thumbnail ? <img src={selectedGig.thumbnail} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><FaPlay className="text-gray-600 light:text-slate-400" /></div>}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-white light:text-slate-900 text-sm">{selectedGig.title}</h4>
                    <p className="text-gray-500 light:text-slate-500 text-xs mt-1">by {selectedGig.editor?.name}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10 light:border-slate-200">
                  <span className="text-gray-500 light:text-slate-500 text-sm">Price</span>
                  <span className="text-emerald-400 light:text-emerald-600 font-bold text-lg">₹{selectedGig.price}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 light:text-slate-700 mb-2">Project Details (Optional)</label>
                  <textarea value={orderForm.description} onChange={(e) => setOrderForm({ ...orderForm, description: e.target.value })} placeholder="Describe your requirements..." rows={3} className="w-full bg-white/5 light:bg-slate-50 border border-white/10 light:border-slate-200 rounded-xl px-4 py-3 text-sm text-white light:text-slate-900 placeholder:text-gray-500 light:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 light:text-slate-700 mb-2">Deadline *</label>
                  <input type="date" value={orderForm.deadline} onChange={(e) => setOrderForm({ ...orderForm, deadline: e.target.value })} min={new Date().toISOString().split("T")[0]} className="w-full bg-white/5 light:bg-slate-50 border border-white/10 light:border-slate-200 rounded-xl px-4 py-3 text-sm text-white light:text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                </div>
              </div>

              <div className="bg-emerald-500/10 light:bg-emerald-50 border border-emerald-500/20 light:border-emerald-200 rounded-xl p-4 mt-6">
                <p className="text-emerald-400 light:text-emerald-700 text-sm font-medium mb-1">💳 Secure Payment</p>
                <p className="text-gray-400 light:text-slate-600 text-xs">Your payment will be held securely until the work is complete.</p>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowOrderModal(false)} className="flex-1 py-3 rounded-xl border border-white/10 light:border-slate-200 text-gray-400 light:text-slate-600 hover:bg-white/5 light:hover:bg-slate-50 font-medium transition-all">Cancel</button>
                <button onClick={handleCreateOrder} disabled={ordering} className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {ordering ? "Processing..." : <><FaLock className="text-sm" /> Pay ₹{selectedGig.price}</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {showPayment && createdOrder && (
        <RazorpayCheckout orderId={createdOrder._id} amount={createdOrder.amount || selectedGig?.price} currency="INR" orderDetails={{ title: selectedGig?.title || createdOrder.title, orderNumber: createdOrder.orderNumber }} onSuccess={handlePaymentSuccess} onFailure={handlePaymentFailure} onClose={handlePaymentClose} />
      )}
      
      {/* KYC Required Modal */}
      <KYCRequiredModal
        isOpen={showKYCModal}
        onClose={() => setShowKYCModal(false)}
        kycStatus={user?.clientKycStatus}
      />
    </div>
  );
};

export default ExploreGigs;
