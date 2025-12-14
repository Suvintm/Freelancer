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
} from "react-icons/fa";
import { useAppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import RazorpayCheckout from "./RazorpayCheckout";

/**
 * ExploreGigs — Browse gigs created by editors
 * Dark theme matching ExploreEditors style
 */

const CATEGORIES = [
  "All",
  "Wedding",
  "Birthday",
  "Corporate",
  "Music Video",
  "Short Film",
  "Social Media",
  "Commercial",
  "Documentary",
  "YouTube",
  "Other",
];

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

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 1,
  });

  // Order modal state
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedGig, setSelectedGig] = useState(null);
  const [orderForm, setOrderForm] = useState({
    description: "",
    deadline: "",
  });
  const [ordering, setOrdering] = useState(false);
  
  // Payment state
  const [showPayment, setShowPayment] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);

  // Loading text animation
  useEffect(() => {
    const texts = [
      "Discovering amazing gigs...",
      "Finding talented editors...",
      "Loading creative services...",
    ];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % texts.length;
      setLoadingText(texts[i]);
    }, 2000);
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

      const res = await axios.get(`${backendURL}/api/gigs?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setGigs(res.data.gigs || []);
      setPagination(res.data.pagination || { page: 1, limit: 12, total: 0, pages: 1 });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to fetch gigs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGigs(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backendURL, user]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchGigs(1);
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedCategory, sortBy, priceRange]);

  const handleCreateOrder = async () => {
    if (!orderForm.deadline) {
      toast.error("Please select a deadline");
      return;
    }

    try {
      setOrdering(true);
      const token = user?.token;

      const res = await axios.post(
        `${backendURL}/api/orders/gig`,
        {
          gigId: selectedGig._id,
          description: orderForm.description,
          deadline: orderForm.deadline,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Order created, now show payment
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

  // Payment success handler
  const handlePaymentSuccess = (data) => {
    setShowPayment(false);
    const orderData = {
      orderNumber: data?.order?.orderNumber || createdOrder?.orderNumber,
      amount: data?.order?.amount || createdOrder?.amount || selectedGig?.price,
      title: data?.order?.title || createdOrder?.title || selectedGig?.title,
      transactionId: data?.order?.razorpayPaymentId || '',
    };
    setCreatedOrder(null);
    setSelectedGig(null);
    setOrderForm({ description: "", deadline: "" });
    // Navigate to success page with order data
    navigate("/payment-success", { state: orderData });
  };

  // Payment failure handler
  const handlePaymentFailure = (error) => {
    toast.error(error?.description || "Payment failed. Please try again.");
  };

  // Close payment modal
  const handlePaymentClose = () => {
    setShowPayment(false);
    toast.info("Payment cancelled. Your order is saved - pay anytime from My Orders.");
  };

  const openOrderModal = (gig) => {
    setSelectedGig(gig);
    setShowOrderModal(true);
  };

  // ============ RENDER ============
  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
        />
        <motion.p
          key={loadingText}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 text-gray-400 text-sm"
        >
          {loadingText}
        </motion.p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0B0D] text-white">
      {/* ============ HEADER ============ */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Explore Gigs</h2>
        <p className="text-gray-400 text-sm">Find the perfect video editing service</p>
      </div>

      {/* ============ SEARCH & FILTERS ============ */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search gigs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#111319] border border-[#262A3B] rounded-xl py-3 pl-12 pr-4 text-sm placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {CATEGORIES.slice(0, 6).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? "bg-blue-600 text-white"
                  : "bg-[#111319] text-gray-400 hover:bg-[#1a1d25]"
              }`}
            >
              {cat}
            </button>
          ))}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-all ${
              showFilters ? "bg-blue-600 text-white" : "bg-[#111319] text-gray-400 hover:bg-[#1a1d25]"
            }`}
          >
            <FaFilter /> More
          </button>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <FaSortAmountDown className="text-gray-500" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-[#111319] border border-[#262A3B] rounded-xl py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500/30"
          >
            <option value="newest">Newest</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
            <option value="popular">Most Popular</option>
          </select>
        </div>
      </div>

      {/* ============ EXPANDED FILTERS ============ */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-[#111319] border border-[#262A3B] rounded-2xl p-4 mb-6"
          >
            <div className="flex flex-wrap gap-4">
              {/* All Categories */}
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      selectedCategory === cat
                        ? "bg-blue-600 text-white"
                        : "bg-[#1a1d25] text-gray-400 hover:bg-[#252830]"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Price Range */}
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">Price:</span>
                <input
                  type="number"
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                  className="w-20 bg-[#1a1d25] border border-[#262A3B] rounded-lg px-2 py-1 text-sm"
                />
                <span className="text-gray-500">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                  className="w-20 bg-[#1a1d25] border border-[#262A3B] rounded-lg px-2 py-1 text-sm"
                />
              </div>

              {/* Clear Filters */}
              <button
                onClick={() => {
                  setSelectedCategory("All");
                  setPriceRange({ min: "", max: "" });
                  setSortBy("newest");
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 flex items-center gap-1"
              >
                <FaTimes /> Clear
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============ GIGS GRID ============ */}
      {gigs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <FaShoppingCart className="text-5xl mb-4 opacity-50" />
          <p className="text-lg">No gigs found</p>
          <p className="text-sm">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {gigs.map((gig, index) => (
            <motion.div
              key={gig._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-[#111319] border border-[#262A3B] rounded-2xl overflow-hidden hover:border-blue-500/30 transition-all group"
            >
              {/* Thumbnail */}
              <div className="relative h-40 bg-[#1a1d25] overflow-hidden">
                {gig.thumbnail ? (
                  <img
                    src={gig.thumbnail}
                    alt={gig.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FaPlay className="text-3xl text-gray-600" />
                  </div>
                )}
                {/* Category Badge */}
                <span className="absolute top-3 left-3 px-2 py-1 bg-black/70 rounded-lg text-xs font-medium">
                  {gig.category}
                </span>
              </div>

              {/* Content */}
              <div className="p-4">
                {/* Editor Info */}
                <div className="flex items-center gap-2 mb-3">
                  <img
                    src={gig.editor?.profilePicture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                    alt={gig.editor?.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <span className="text-sm text-gray-300">{gig.editor?.name}</span>
                </div>

                {/* Title */}
                <h3 className="font-semibold text-white mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">
                  {gig.title}
                </h3>

                {/* Stats */}
                <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                  <span className="flex items-center gap-1">
                    <FaClock /> {gig.deliveryDays} days
                  </span>
                  {gig.rating > 0 && (
                    <span className="flex items-center gap-1 text-yellow-500">
                      <FaStar /> {gig.rating.toFixed(1)}
                    </span>
                  )}
                </div>

                {/* Price & Action */}
                <div className="flex items-center justify-between pt-3 border-t border-[#262A3B]">
                  <div className="flex items-center gap-1 text-green-400 font-bold">
                    <FaRupeeSign className="text-sm" />
                    <span className="text-lg">{gig.price}</span>
                  </div>
                  <button
                    onClick={() => openOrderModal(gig)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-medium transition-all hover:scale-105"
                  >
                    Order Now
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ============ PAGINATION ============ */}
      {pagination.pages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <button
            onClick={() => fetchGigs(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="p-2 rounded-lg bg-[#111319] border border-[#262A3B] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#1a1d25] transition-all"
          >
            <FaChevronLeft />
          </button>
          <span className="text-gray-400 text-sm">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            onClick={() => fetchGigs(pagination.page + 1)}
            disabled={pagination.page === pagination.pages}
            className="p-2 rounded-lg bg-[#111319] border border-[#262A3B] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#1a1d25] transition-all"
          >
            <FaChevronRight />
          </button>
        </div>
      )}

      {/* ============ ORDER MODAL ============ */}
      <AnimatePresence>
        {showOrderModal && selectedGig && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowOrderModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#111319] border border-[#262A3B] rounded-2xl p-6 w-full max-w-lg"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Create Order</h3>
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="p-2 rounded-lg hover:bg-[#1a1d25] transition-all"
                >
                  <FaTimes />
                </button>
              </div>

              {/* Gig Summary */}
              <div className="bg-[#0B0B0D] border border-[#262A3B] rounded-xl p-4 mb-6">
                <div className="flex gap-4">
                  <div className="w-20 h-14 bg-[#1a1d25] rounded-lg overflow-hidden flex-shrink-0">
                    {selectedGig.thumbnail ? (
                      <img src={selectedGig.thumbnail} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FaPlay className="text-gray-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-white text-sm">{selectedGig.title}</h4>
                    <p className="text-gray-400 text-xs mt-1">by {selectedGig.editor?.name}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#262A3B]">
                  <span className="text-gray-400 text-sm">Price</span>
                  <span className="text-green-400 font-bold text-lg">₹{selectedGig.price}</span>
                </div>
              </div>

              {/* Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Project Details (Optional)
                  </label>
                  <textarea
                    value={orderForm.description}
                    onChange={(e) => setOrderForm({ ...orderForm, description: e.target.value })}
                    placeholder="Describe your requirements..."
                    rows={3}
                    className="w-full bg-[#0B0B0D] border border-[#262A3B] rounded-xl px-4 py-3 text-sm placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500/30 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Deadline *
                  </label>
                  <input
                    type="date"
                    value={orderForm.deadline}
                    onChange={(e) => setOrderForm({ ...orderForm, deadline: e.target.value })}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full bg-[#0B0B0D] border border-[#262A3B] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
              </div>

              {/* Payment Info */}
              <div className="bg-[#0a1a10] border border-green-500/20 rounded-xl p-4 mt-6">
                <p className="text-green-400 text-sm font-medium mb-2">💳 Payment Info</p>
                <p className="text-gray-400 text-xs">
                  Your payment will be held securely until the work is complete. 
                  You'll only be charged after you approve the final delivery.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="flex-1 py-3 rounded-xl border border-[#262A3B] text-gray-400 hover:bg-[#1a1d25] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateOrder}
                  disabled={ordering}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {ordering ? (
                    "Processing..."
                  ) : (
                    <>
                      <FaLock className="text-sm" />
                      Pay ₹{selectedGig.price}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============ RAZORPAY PAYMENT MODAL ============ */}
      {showPayment && createdOrder && (
        <RazorpayCheckout
          orderId={createdOrder._id}
          amount={createdOrder.amount || selectedGig?.price}
          currency="INR"
          orderDetails={{
            title: selectedGig?.title || createdOrder.title,
            orderNumber: createdOrder.orderNumber,
          }}
          onSuccess={handlePaymentSuccess}
          onFailure={handlePaymentFailure}
          onClose={handlePaymentClose}
        />
      )}
    </div>
  );
};

export default ExploreGigs;

