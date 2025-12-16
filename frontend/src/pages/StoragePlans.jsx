/**
 * Storage Plans Page
 * Professional purchase page for storage upgrades with Razorpay
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FaDatabase,
  FaCheck,
  FaCrown,
  FaStar,
  FaRocket,
  FaInfinity,
  FaArrowLeft,
  FaShieldAlt,
  FaCloudUploadAlt,
  FaImages,
  FaVideo,
  FaComments,
  FaHistory,
  FaTrash,
  FaExclamationTriangle,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import axios from "axios";
import toast from "react-hot-toast";

const StoragePlans = () => {
  const { user, backendURL } = useAppContext();
  const navigate = useNavigate();
  const [storageData, setStorageData] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(null);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  
  // New state for detailed breakdown
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [detailedItems, setDetailedItems] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  // Recent purchase state for green +MB indicator
  const [recentPurchase, setRecentPurchase] = useState(null);
  
  // Load recent purchase info on mount
  useEffect(() => {
    const stored = localStorage.getItem('recentStoragePurchase');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Only show if purchase was within last 24 hours
        if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          setRecentPurchase(parsed);
        } else {
          localStorage.removeItem('recentStoragePurchase');
        }
      } catch (e) {
        localStorage.removeItem('recentStoragePurchase');
      }
    }
  }, []);

  // Fetch storage status and plans
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = user?.token;
        if (!token) return;

        const [statusRes, plansRes, historyRes] = await Promise.all([
          axios.get(`${backendURL}/api/storage/status`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${backendURL}/api/storage/plans`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${backendURL}/api/storage/history`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setStorageData({
          storage: statusRes.data?.storage || null,
          breakdown: statusRes.data?.breakdown || null,
        });
        setPlans(plansRes.data?.plans || []);
        setPurchaseHistory(historyRes.data?.purchases || []);
      } catch (err) {
        console.error("Failed to fetch storage data:", err);
        toast.error("Failed to load storage data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [backendURL, user?.token]);

  // Fetch detailed file items
  const fetchDetailedItems = async () => {
    try {
      setLoadingDetails(true);
      const { data } = await axios.get(`${backendURL}/api/storage/status?details=true`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      
      if (data.items) {
        setDetailedItems(data.items);
      }
    } catch (err) {
      console.error("Failed to fetch detailed items:", err);
      toast.error("Failed to load file details");
    } finally {
      setLoadingDetails(false);
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

  // Handle purchase
  const handlePurchase = async (planId) => {
    try {
      setPurchasing(planId);

      // Load Razorpay
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        toast.error("Failed to load payment gateway");
        return;
      }

      // Create order
      const orderRes = await axios.post(
        `${backendURL}/api/storage/purchase`,
        { planId },
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );

      const { order, plan, key, purchaseId } = orderRes.data;

      // Open Razorpay
      const options = {
        key,
        amount: order.amount,
        currency: order.currency,
        name: "SuviX Storage",
        description: `${plan.name} - ${plan.storage}`,
        order_id: order.id,
        handler: async (response) => {
          try {
            // Verify payment
            const verifyRes = await axios.post(
              `${backendURL}/api/storage/verify`,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                purchaseId,
              },
              { headers: { Authorization: `Bearer ${user?.token}` } }
            );

            // Store recent purchase info for display
            if (verifyRes.data?.storage?.increaseFormatted) {
              localStorage.setItem('recentStoragePurchase', JSON.stringify({
                increase: verifyRes.data.storage.increaseFormatted,
                planName: verifyRes.data.storage.planName,
                timestamp: Date.now(),
              }));
            }

            toast.success("Storage upgraded successfully! 🎉");
            // Refresh data
            window.location.reload();
          } catch (err) {
            toast.error("Payment verification failed");
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
        },
        theme: {
          color: "#8B5CF6",
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      console.error("Purchase error:", err);
      console.error("Error response data:", err.response?.data);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || "Failed to initiate purchase";
      toast.error(errorMessage);
    } finally {
      setPurchasing(null);
    }
  };

  // Plan icons
  const planIcons = {
    starter: FaStar,
    pro: FaCrown,
    business: FaRocket,
    unlimited: FaInfinity,
  };

  // Plan colors
  const planColors = {
    starter: { bg: "from-blue-600 to-cyan-500", border: "border-blue-500/30" },
    pro: { bg: "from-purple-600 to-pink-500", border: "border-purple-500/30" },
    business: { bg: "from-orange-500 to-amber-400", border: "border-orange-500/30" },
    unlimited: { bg: "from-emerald-500 to-teal-400", border: "border-emerald-500/30" },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050509] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050509] text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <FaArrowLeft />
            <span>Back</span>
          </button>
          
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Upgrade Your Storage
            </h1>
            <p className="text-gray-400 max-w-xl mx-auto">
              Get more space for your portfolio, reels, and project files. One-time payment, use forever.
            </p>
          </div>
        </div>

        {/* Current Storage Status */}
        {storageData?.storage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#111319] border border-[#262A3B] rounded-2xl p-6 mb-8"
          >
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="p-4 rounded-xl bg-blue-500/10">
                <FaDatabase className="text-3xl text-blue-400" />
              </div>
              
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-lg font-semibold text-white mb-1">Current Storage</h3>
                <p className="text-gray-400 text-sm mb-3 flex items-center flex-wrap gap-2">
                  <span>Plan: <span className="text-purple-400 font-medium uppercase">{storageData.storage.plan}</span></span>
                  <span className="text-gray-600">•</span>
                  <span className="text-gray-500">{storageData.storage.limitFormatted} total</span>
                  
                  {/* Recent Purchase Badge */}
                  {recentPurchase && (
                    <motion.span
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-emerald-400 text-xs font-semibold"
                    >
                      <span>+{recentPurchase.increase}</span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          localStorage.removeItem('recentStoragePurchase');
                          setRecentPurchase(null);
                        }}
                        className="ml-1 text-emerald-400/60 hover:text-emerald-400"
                      >
                        ×
                      </button>
                    </motion.span>
                  )}
                </p>
                
                {/* Progress Bar */}
                <div className="h-3 bg-black/40 rounded-full overflow-hidden mb-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(storageData.storage.usedPercent, 100)}%` }}
                    transition={{ duration: 1 }}
                    className={`h-full rounded-full ${
                      storageData.storage.usedPercent >= 90 ? 'bg-red-500' :
                      storageData.storage.usedPercent >= 70 ? 'bg-amber-500' :
                      'bg-gradient-to-r from-blue-500 to-purple-500'
                    }`}
                  />
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">{storageData.storage.usedFormatted} used</span>
                  <span className="text-emerald-400">{storageData.storage.remainingFormatted} remaining</span>
                </div>
              </div>
              
              <div className="text-center px-6 py-4 bg-black/20 rounded-xl border border-white/5">
                <span className="text-4xl font-bold text-white">{storageData.storage.usedPercent}%</span>
                <p className="text-gray-500 text-xs mt-1">USED</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Storage Breakdown - Enhanced with Sizes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#111319] border border-[#262A3B] rounded-2xl p-6 mb-8"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Storage Breakdown</h3>
          
          <div className="grid gap-4">
            {/* Portfolio Storage */}
            <div 
              onClick={() => setExpandedCategory(expandedCategory === 'portfolios' ? null : 'portfolios')}
              className="p-4 bg-black/30 rounded-xl cursor-pointer hover:bg-black/40 transition"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <FaVideo className="text-purple-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Portfolio Items</p>
                    <p className="text-xs text-gray-500">{storageData?.breakdown?.portfolios || 0} files</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-purple-400">{storageData?.breakdown?.portfolioFormatted || '0 MB'}</p>
                  <p className="text-xs text-gray-500">
                    {(storageData?.storage?.used > 0 && storageData?.breakdown?.portfolioBytes) 
                      ? Math.round((storageData.breakdown.portfolioBytes / storageData.storage.used) * 100) 
                      : 0}% of used
                  </p>
                </div>
              </div>
              {/* Mini progress bar */}
              <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full"
                  style={{ 
                    width: `${(storageData?.storage?.limit && storageData?.breakdown?.portfolioBytes) ? Math.min((storageData.breakdown.portfolioBytes / storageData.storage.limit) * 100, 100) : 0}%` 
                  }}
                />
              </div>
            </div>

            {/* Reels Storage */}
            <div 
              onClick={() => setExpandedCategory(expandedCategory === 'reels' ? null : 'reels')}
              className="p-4 bg-black/30 rounded-xl cursor-pointer hover:bg-black/40 transition"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <FaImages className="text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Reels</p>
                    <p className="text-xs text-gray-500">{storageData?.breakdown?.reels || 0} files</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-400">{storageData?.breakdown?.reelFormatted || '0 MB'}</p>
                  <p className="text-xs text-gray-500">
                    {(storageData?.storage?.used > 0 && storageData?.breakdown?.reelBytes) 
                      ? Math.round((storageData.breakdown.reelBytes / storageData.storage.used) * 100) 
                      : 0}% of used
                  </p>
                </div>
              </div>
              <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full"
                  style={{ 
                    width: `${(storageData?.storage?.limit && storageData?.breakdown?.reelBytes) ? Math.min((storageData.breakdown.reelBytes / storageData.storage.limit) * 100, 100) : 0}%` 
                  }}
                />
              </div>
            </div>

            {/* Chat Files Storage */}
            <div 
              onClick={() => setExpandedCategory(expandedCategory === 'chatFiles' ? null : 'chatFiles')}
              className="p-4 bg-black/30 rounded-xl cursor-pointer hover:bg-black/40 transition"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                    <FaComments className="text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Chat Files</p>
                    <p className="text-xs text-gray-500">{storageData?.breakdown?.chatFiles || 0} files</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-emerald-400">{storageData?.breakdown?.chatFormatted || '0 MB'}</p>
                  <p className="text-xs text-gray-500">
                    {(storageData?.storage?.used > 0 && storageData?.breakdown?.chatBytes) 
                      ? Math.round((storageData.breakdown.chatBytes / storageData.storage.used) * 100) 
                      : 0}% of used
                  </p>
                </div>
              </div>
              <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full"
                  style={{ 
                    width: `${(storageData?.storage?.limit && storageData?.breakdown?.chatBytes) ? Math.min((storageData.breakdown.chatBytes / storageData.storage.limit) * 100, 100) : 0}%` 
                  }}
                />
              </div>
            </div>
          </div>

          {/* Expanded File Details */}
          {expandedCategory && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-4 bg-black/20 rounded-xl border border-white/5"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-white font-medium capitalize">
                  {expandedCategory === 'chatFiles' ? 'Chat Files' : expandedCategory} Details
                </h4>
                {!detailedItems && (
                  <button
                    onClick={fetchDetailedItems}
                    disabled={loadingDetails}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    {loadingDetails ? 'Loading...' : 'Load Details'}
                  </button>
                )}
              </div>
              
              {detailedItems?.[expandedCategory]?.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {detailedItems[expandedCategory].map((item, idx) => (
                    <div 
                      key={item.id || idx}
                      className="flex items-center justify-between p-2 bg-black/30 rounded-lg"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {item.thumbnail ? (
                          <img src={item.thumbnail} className="w-8 h-8 rounded object-cover" alt="" />
                        ) : (
                          <div className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center">
                            {expandedCategory === 'reels' ? <FaImages className="text-xs text-gray-400" /> :
                             expandedCategory === 'portfolios' ? <FaVideo className="text-xs text-gray-400" /> :
                             <FaComments className="text-xs text-gray-400" />}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">{item.title || item.name || 'Untitled'}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right ml-3">
                        <p className="text-sm font-medium text-gray-300">{formatBytes(item.size)}</p>
                        <p className="text-xs text-gray-500">
                          {storageData?.storage?.used > 0 
                            ? Math.round((item.size / storageData?.storage?.used) * 100) 
                            : 0}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : detailedItems ? (
                <p className="text-gray-500 text-sm text-center py-4">No files in this category</p>
              ) : (
                <p className="text-gray-500 text-sm text-center py-4">Click "Load Details" to see file breakdown</p>
              )}
            </motion.div>
          )}
        </motion.div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {plans.map((plan, index) => {
            const Icon = planIcons[plan.id] || FaStar;
            const colors = planColors[plan.id] || planColors.starter;
            const isCurrentPlan = storageData?.storage?.plan === plan.id;
            const isPurchased = purchaseHistory.some(p => p.plan === plan.name && p.status === "completed");

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.1 }}
                className={`relative bg-[#111319] border ${colors.border} rounded-2xl p-6 ${
                  plan.popular ? 'ring-2 ring-purple-500' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-bold rounded-full">
                    POPULAR
                  </div>
                )}

                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors.bg} flex items-center justify-center mb-4`}>
                  <Icon className="text-white text-xl" />
                </div>

                <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                <p className="text-gray-500 text-sm mb-4">
                  {formatBytes(plan.storageBytes)} storage
                </p>

                <div className="mb-4">
                  <span className="text-3xl font-bold text-white">₹{plan.price}</span>
                  <span className="text-gray-500 text-sm ml-1">one-time</span>
                </div>

                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-400">
                      <FaCheck className="text-emerald-400 text-xs" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handlePurchase(plan.id)}
                  disabled={isCurrentPlan || purchasing === plan.id}
                  className={`w-full py-3 rounded-xl font-medium transition-all ${
                    isCurrentPlan
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      : `bg-gradient-to-r ${colors.bg} text-white hover:opacity-90`
                  } ${purchasing === plan.id ? 'opacity-70' : ''}`}
                >
                  {purchasing === plan.id ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </span>
                  ) : isCurrentPlan ? (
                    "Current Plan"
                  ) : (
                    "Upgrade Now"
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-[#111319] border border-[#262A3B] rounded-2xl p-6 mb-8"
        >
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <FaShieldAlt className="text-emerald-400" />
            What's Included
          </h3>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-black/20 rounded-xl">
              <FaCloudUploadAlt className="text-2xl text-blue-400 mb-2" />
              <h4 className="font-semibold text-white mb-1">Portfolio Uploads</h4>
              <p className="text-gray-500 text-sm">Store your edited videos and images</p>
            </div>
            <div className="p-4 bg-black/20 rounded-xl">
              <FaVideo className="text-2xl text-purple-400 mb-2" />
              <h4 className="font-semibold text-white mb-1">Reels Storage</h4>
              <p className="text-gray-500 text-sm">Upload unlimited reels within limit</p>
            </div>
            <div className="p-4 bg-black/20 rounded-xl">
              <FaComments className="text-2xl text-emerald-400 mb-2" />
              <h4 className="font-semibold text-white mb-1">Chat Files</h4>
              <p className="text-gray-500 text-sm">Share files with clients in chat</p>
            </div>
          </div>
        </motion.div>

        {/* Tips Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-r from-amber-500/10 to-orange-500/5 border border-amber-500/20 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-amber-400 mb-3 flex items-center gap-2">
            <FaExclamationTriangle />
            Storage Tips
          </h3>
          <ul className="space-y-2 text-gray-400 text-sm">
            <li className="flex items-start gap-2">
              <FaTrash className="text-amber-400 mt-0.5" />
              <span>Delete unused portfolio items to free up space</span>
            </li>
            <li className="flex items-start gap-2">
              <FaComments className="text-amber-400 mt-0.5" />
              <span>You can delete shared files from active order chats (not completed orders)</span>
            </li>
            <li className="flex items-start gap-2">
              <FaHistory className="text-amber-400 mt-0.5" />
              <span>Storage purchases are one-time - use until it fills up!</span>
            </li>
          </ul>
        </motion.div>

        {/* Purchase History */}
        {purchaseHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mt-8 bg-[#111319] border border-[#262A3B] rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FaHistory className="text-gray-400" />
              Purchase History
            </h3>
            
            <div className="space-y-3">
              {purchaseHistory.map((purchase) => (
                <div
                  key={purchase.id}
                  className="flex items-center justify-between p-3 bg-black/20 rounded-xl"
                >
                  <div>
                    <p className="text-white font-medium">{purchase.plan}</p>
                    <p className="text-gray-500 text-xs">
                      {new Date(purchase.purchasedAt || purchase.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-emerald-400 font-semibold">₹{purchase.amount}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      purchase.status === 'completed' 
                        ? 'bg-emerald-500/20 text-emerald-400' 
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {purchase.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

// Helper function
const formatBytes = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

export default StoragePlans;
