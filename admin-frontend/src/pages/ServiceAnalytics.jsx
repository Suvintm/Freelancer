/**
 * ServiceAnalytics.jsx - Service Usage Analytics Dashboard
 * 
 * Monitors usage, costs, and performance of:
 * - Cloudinary (storage, bandwidth, credits)
 * - MongoDB (collections, sizes, connections)
 * - Razorpay (transactions, revenue, fees)
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaCloud,
  FaDatabase,
  FaCreditCard,
  FaSync,
  FaChartLine,
  FaImage,
  FaVideo,
  FaFile,
  FaExclamationTriangle,
  FaCheckCircle,
  FaServer,
  FaNetworkWired,
  FaHdd,
  FaClock,
  FaExternalLinkAlt,
} from "react-icons/fa";
import {
  HiOutlineChartBar,
  HiOutlineCurrencyRupee,
  HiOutlineServer,
  HiOutlineCloud,
} from "react-icons/hi2";
import { useAdmin } from "../context/AdminContext";

const ServiceAnalytics = () => {
  const { adminAxios } = useAdmin();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  // Data states
  const [overviewData, setOverviewData] = useState(null);
  const [cloudinaryData, setCloudinaryData] = useState(null);
  const [mongoData, setMongoData] = useState(null);
  const [razorpayData, setRazorpayData] = useState(null);

  // Fetch data based on active tab
  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab]);

  const fetchData = async (tab, isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      let response;
      switch (tab) {
        case "overview":
          response = await adminAxios.get("/admin/analytics/overview");
          if (response.data.success) setOverviewData(response.data.data);
          break;
        case "cloudinary":
          response = await adminAxios.get("/admin/analytics/cloudinary");
          if (response.data.success) setCloudinaryData(response.data.data);
          break;
        case "mongodb":
          response = await adminAxios.get("/admin/analytics/mongodb");
          if (response.data.success) setMongoData(response.data.data);
          break;
        case "razorpay":
          response = await adminAxios.get("/admin/analytics/razorpay");
          if (response.data.success) setRazorpayData(response.data.data);
          break;
      }
      setError(null);
    } catch (err) {
      console.error(`Failed to fetch ${tab} analytics:`, err);
      setError(`Failed to load ${tab} analytics`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchData(activeTab, true);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Progress bar component
  const ProgressBar = ({ percent, color = "purple" }) => {
    const getColor = () => {
      if (percent > 90) return "bg-red-500";
      if (percent > 75) return "bg-amber-500";
      if (color === "purple") return "bg-purple-500";
      if (color === "blue") return "bg-blue-500";
      if (color === "emerald") return "bg-emerald-500";
      return "bg-purple-500";
    };

    return (
      <div className="h-2 bg-dark-600 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(percent, 100)}%` }}
          transition={{ duration: 0.5 }}
          className={`h-full rounded-full ${getColor()}`}
        />
      </div>
    );
  };

  // Tabs configuration
  const tabs = [
    { id: "overview", label: "Overview", icon: HiOutlineChartBar },
    { id: "cloudinary", label: "Cloudinary", icon: HiOutlineCloud },
    { id: "mongodb", label: "MongoDB", icon: HiOutlineServer },
    { id: "razorpay", label: "Razorpay", icon: HiOutlineCurrencyRupee },
  ];

  // Shimmer loading state
  const ShimmerCard = () => (
    <div className="bg-dark-700 border border-dark-500 rounded-2xl p-6">
      <div className="h-4 w-24 shimmer rounded mb-3" />
      <div className="h-8 w-32 shimmer rounded mb-2" />
      <div className="h-3 w-40 shimmer rounded" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600">
              <FaChartLine className="text-white" />
            </div>
            Service Analytics
          </h1>
          <p className="text-gray-400 text-sm mt-1">Monitor usage, costs, and performance</p>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-dark-700 border border-dark-500 rounded-xl text-gray-400 hover:text-white hover:border-purple-500 transition-all disabled:opacity-50"
        >
          <FaSync className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
                : "bg-dark-700 border border-dark-500 text-gray-400 hover:text-white hover:border-purple-500"
            }`}
          >
            <tab.icon className="text-lg" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
          <div className="flex items-center gap-3 text-red-400">
            <FaExclamationTriangle />
            <span>{error}</span>
            <button onClick={handleRefresh} className="ml-auto underline">Retry</button>
          </div>
        </div>
      )}

      {/* Content */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <ShimmerCard />
            <ShimmerCard />
            <ShimmerCard />
            <ShimmerCard />
          </motion.div>
        ) : (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* === OVERVIEW TAB === */}
            {activeTab === "overview" && overviewData && (
              <div className="space-y-6">
                {/* Quick Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-dark-700 border border-dark-500 rounded-2xl p-6 hover:border-purple-500/50 transition-all"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 rounded-xl bg-purple-500/20">
                        <FaCloud className="text-purple-400 text-xl" />
                      </div>
                      <span className="text-gray-400 text-sm">Cloudinary Storage</span>
                    </div>
                    <p className="text-2xl font-bold">{overviewData.cloudinary?.storage || "0 B"}</p>
                    <p className="text-xs text-gray-500 mt-1">Credits: {overviewData.cloudinary?.credits || 0}</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-dark-700 border border-dark-500 rounded-2xl p-6 hover:border-emerald-500/50 transition-all"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 rounded-xl bg-emerald-500/20">
                        <FaDatabase className="text-emerald-400 text-xl" />
                      </div>
                      <span className="text-gray-400 text-sm">MongoDB Size</span>
                    </div>
                    <p className="text-2xl font-bold">{overviewData.mongodb?.size || "0 B"}</p>
                    <p className="text-xs text-gray-500 mt-1">{overviewData.mongodb?.collections || 0} collections</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-dark-700 border border-dark-500 rounded-2xl p-6 hover:border-blue-500/50 transition-all"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 rounded-xl bg-blue-500/20">
                        <FaCreditCard className="text-blue-400 text-xl" />
                      </div>
                      <span className="text-gray-400 text-sm">Total Revenue</span>
                    </div>
                    <p className="text-2xl font-bold">{formatCurrency(overviewData.platform?.revenue || 0)}</p>
                    <p className="text-xs text-gray-500 mt-1">{overviewData.platform?.payments || 0} transactions</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-dark-700 border border-dark-500 rounded-2xl p-6 hover:border-amber-500/50 transition-all"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 rounded-xl bg-amber-500/20">
                        <FaServer className="text-amber-400 text-xl" />
                      </div>
                      <span className="text-gray-400 text-sm">Platform Stats</span>
                    </div>
                    <p className="text-2xl font-bold">{overviewData.platform?.users || 0}</p>
                    <p className="text-xs text-gray-500 mt-1">{overviewData.platform?.orders || 0} orders</p>
                  </motion.div>
                </div>

                {/* Service Status */}
                <div className="bg-dark-700 border border-dark-500 rounded-2xl p-6">
                  <h3 className="font-semibold mb-4">Service Status</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 p-4 bg-dark-600 rounded-xl">
                      <FaCheckCircle className="text-emerald-400" />
                      <div>
                        <p className="font-medium">Cloudinary</p>
                        <p className="text-xs text-gray-500">Connected</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-dark-600 rounded-xl">
                      <FaCheckCircle className="text-emerald-400" />
                      <div>
                        <p className="font-medium">MongoDB</p>
                        <p className="text-xs text-gray-500">Connected</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-dark-600 rounded-xl">
                      {overviewData.razorpay?.enabled ? (
                        <FaCheckCircle className="text-emerald-400" />
                      ) : (
                        <FaExclamationTriangle className="text-amber-400" />
                      )}
                      <div>
                        <p className="font-medium">Razorpay</p>
                        <p className="text-xs text-gray-500">
                          {overviewData.razorpay?.enabled ? "Connected" : "Not Configured"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* === CLOUDINARY TAB === */}
            {activeTab === "cloudinary" && cloudinaryData && (
              <div className="space-y-6">
                {/* Plan Badge */}
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-lg text-sm font-medium">
                    {cloudinaryData.plan || "Free"} Plan
                  </span>
                  {cloudinaryData.estimatedCost > 0 && (
                    <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-lg text-sm">
                      Est. Cost: ${cloudinaryData.estimatedCost.toFixed(2)}/mo
                    </span>
                  )}
                </div>

                {/* Usage Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Storage */}
                  <div className="bg-dark-700 border border-dark-500 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-gray-400 text-sm flex items-center gap-2">
                        <FaHdd className="text-purple-400" /> Storage
                      </span>
                      <span className={`text-sm font-bold ${
                        cloudinaryData.storage.percent > 90 ? "text-red-400" :
                        cloudinaryData.storage.percent > 75 ? "text-amber-400" : "text-emerald-400"
                      }`}>
                        {cloudinaryData.storage.percent}%
                      </span>
                    </div>
                    <p className="text-2xl font-bold mb-2">{cloudinaryData.storage.usedFormatted}</p>
                    <p className="text-xs text-gray-500 mb-3">of {cloudinaryData.storage.limitFormatted}</p>
                    <ProgressBar percent={cloudinaryData.storage.percent} color="purple" />
                  </div>

                  {/* Bandwidth */}
                  <div className="bg-dark-700 border border-dark-500 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-gray-400 text-sm flex items-center gap-2">
                        <FaNetworkWired className="text-blue-400" /> Bandwidth
                      </span>
                      <span className={`text-sm font-bold ${
                        cloudinaryData.bandwidth.percent > 90 ? "text-red-400" :
                        cloudinaryData.bandwidth.percent > 75 ? "text-amber-400" : "text-emerald-400"
                      }`}>
                        {cloudinaryData.bandwidth.percent}%
                      </span>
                    </div>
                    <p className="text-2xl font-bold mb-2">{cloudinaryData.bandwidth.usedFormatted}</p>
                    <p className="text-xs text-gray-500 mb-3">of {cloudinaryData.bandwidth.limitFormatted}</p>
                    <ProgressBar percent={cloudinaryData.bandwidth.percent} color="blue" />
                  </div>

                  {/* Credits */}
                  <div className="bg-dark-700 border border-dark-500 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-gray-400 text-sm flex items-center gap-2">
                        <FaCreditCard className="text-emerald-400" /> Credits
                      </span>
                      <span className={`text-sm font-bold ${
                        cloudinaryData.credits.percent > 90 ? "text-red-400" :
                        cloudinaryData.credits.percent > 75 ? "text-amber-400" : "text-emerald-400"
                      }`}>
                        {cloudinaryData.credits.percent}%
                      </span>
                    </div>
                    <p className="text-2xl font-bold mb-2">{cloudinaryData.credits.used}</p>
                    <p className="text-xs text-gray-500 mb-3">of {cloudinaryData.credits.limit} credits</p>
                    <ProgressBar percent={cloudinaryData.credits.percent} color="emerald" />
                  </div>

                  {/* Transformations */}
                  <div className="bg-dark-700 border border-dark-500 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-gray-400 text-sm flex items-center gap-2">
                        <FaImage className="text-amber-400" /> Transforms
                      </span>
                      <span className={`text-sm font-bold ${
                        cloudinaryData.transformations.percent > 90 ? "text-red-400" :
                        cloudinaryData.transformations.percent > 75 ? "text-amber-400" : "text-emerald-400"
                      }`}>
                        {cloudinaryData.transformations.percent}%
                      </span>
                    </div>
                    <p className="text-2xl font-bold mb-2">{cloudinaryData.transformations.used.toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mb-3">of {cloudinaryData.transformations.limit.toLocaleString()}</p>
                    <ProgressBar percent={cloudinaryData.transformations.percent} />
                  </div>
                </div>

                {/* Resources Breakdown */}
                <div className="bg-dark-700 border border-dark-500 rounded-2xl p-6">
                  <h3 className="font-semibold mb-4">Resource Breakdown</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-4 p-4 bg-dark-600 rounded-xl">
                      <FaImage className="text-2xl text-blue-400" />
                      <div>
                        <p className="text-2xl font-bold">{cloudinaryData.resources.images || 0}</p>
                        <p className="text-xs text-gray-500">Images</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-dark-600 rounded-xl">
                      <FaVideo className="text-2xl text-purple-400" />
                      <div>
                        <p className="text-2xl font-bold">{cloudinaryData.resources.videos || 0}</p>
                        <p className="text-xs text-gray-500">Videos</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-dark-600 rounded-xl">
                      <FaFile className="text-2xl text-amber-400" />
                      <div>
                        <p className="text-2xl font-bold">{cloudinaryData.resources.raw || 0}</p>
                        <p className="text-xs text-gray-500">Other Files</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Last Updated */}
                <p className="text-xs text-gray-500 text-right">
                  <FaClock className="inline mr-1" />
                  Last updated: {new Date(cloudinaryData.lastUpdated).toLocaleString()}
                </p>
              </div>
            )}

            {/* === MONGODB TAB === */}
            {activeTab === "mongodb" && mongoData && (
              <div className="space-y-6">
                {/* Database Info */}
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm font-medium">
                    {mongoData.database || "Database"}
                  </span>
                  <span className="px-3 py-1 bg-dark-600 text-gray-300 rounded-lg text-sm">
                    v{mongoData.version || "Unknown"}
                  </span>
                </div>

                {/* Storage Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-dark-700 border border-dark-500 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-gray-400 text-sm flex items-center gap-2">
                        <FaDatabase className="text-emerald-400" /> Data Size
                      </span>
                      <span className={`text-sm font-bold ${
                        mongoData.storage.percentUsed > 90 ? "text-red-400" :
                        mongoData.storage.percentUsed > 75 ? "text-amber-400" : "text-emerald-400"
                      }`}>
                        {mongoData.storage.percentUsed}%
                      </span>
                    </div>
                    <p className="text-2xl font-bold mb-2">{mongoData.storage.storageSizeFormatted}</p>
                    <p className="text-xs text-gray-500 mb-3">of {mongoData.storage.freeTierLimitFormatted} (Free Tier)</p>
                    <ProgressBar percent={mongoData.storage.percentUsed} color="emerald" />
                  </div>

                  <div className="bg-dark-700 border border-dark-500 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <FaHdd className="text-blue-400" />
                      <span className="text-gray-400 text-sm">Collections</span>
                    </div>
                    <p className="text-2xl font-bold">{mongoData.collections.count}</p>
                    <p className="text-xs text-gray-500 mt-1">{mongoData.documents.total.toLocaleString()} total documents</p>
                  </div>

                  <div className="bg-dark-700 border border-dark-500 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <FaNetworkWired className="text-purple-400" />
                      <span className="text-gray-400 text-sm">Connections</span>
                    </div>
                    <p className="text-2xl font-bold">{mongoData.connections.current}</p>
                    <p className="text-xs text-gray-500 mt-1">of {mongoData.connections.available} available</p>
                  </div>

                  <div className="bg-dark-700 border border-dark-500 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <FaServer className="text-amber-400" />
                      <span className="text-gray-400 text-sm">Index Size</span>
                    </div>
                    <p className="text-2xl font-bold">{mongoData.indexes.sizeFormatted}</p>
                    <p className="text-xs text-gray-500 mt-1">{mongoData.indexes.count} indexes</p>
                  </div>
                </div>

                {/* Collections Table */}
                <div className="bg-dark-700 border border-dark-500 rounded-2xl p-6">
                  <h3 className="font-semibold mb-4">Collections (Top 20 by Size)</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-500 border-b border-dark-500">
                          <th className="pb-3 font-medium">Collection</th>
                          <th className="pb-3 font-medium text-right">Documents</th>
                          <th className="pb-3 font-medium text-right">Size</th>
                          <th className="pb-3 font-medium text-right">Indexes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mongoData.collections.details?.map((coll) => (
                          <tr key={coll.name} className="border-b border-dark-600">
                            <td className="py-3 font-medium">{coll.name}</td>
                            <td className="py-3 text-right text-gray-400">{coll.count.toLocaleString()}</td>
                            <td className="py-3 text-right text-gray-400">{coll.sizeFormatted}</td>
                            <td className="py-3 text-right text-gray-400">{coll.indexes || 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Operations Stats */}
                <div className="bg-dark-700 border border-dark-500 rounded-2xl p-6">
                  <h3 className="font-semibold mb-4">Operation Counts (Since Server Start)</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-dark-600 rounded-xl">
                      <p className="text-2xl font-bold text-blue-400">{mongoData.operations.queries.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">Queries</p>
                    </div>
                    <div className="text-center p-4 bg-dark-600 rounded-xl">
                      <p className="text-2xl font-bold text-emerald-400">{mongoData.operations.inserts.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">Inserts</p>
                    </div>
                    <div className="text-center p-4 bg-dark-600 rounded-xl">
                      <p className="text-2xl font-bold text-amber-400">{mongoData.operations.updates.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">Updates</p>
                    </div>
                    <div className="text-center p-4 bg-dark-600 rounded-xl">
                      <p className="text-2xl font-bold text-red-400">{mongoData.operations.deletes.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">Deletes</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* === RAZORPAY TAB === */}
            {activeTab === "razorpay" && razorpayData && (
              <div className="space-y-6">
                {/* Status */}
                <div className="flex items-center gap-3">
                  {razorpayData.razorpayEnabled ? (
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm font-medium flex items-center gap-2">
                      <FaCheckCircle /> Connected
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-lg text-sm font-medium flex items-center gap-2">
                      <FaExclamationTriangle /> Not Configured
                    </span>
                  )}
                  <a
                    href="https://dashboard.razorpay.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-sm flex items-center gap-2 hover:bg-blue-500/30 transition-colors"
                  >
                    <FaExternalLinkAlt className="text-xs" /> Open Dashboard
                  </a>
                </div>

                {/* Revenue Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-dark-700 border border-dark-500 rounded-2xl p-6">
                    <span className="text-gray-400 text-sm">Today</span>
                    <p className="text-2xl font-bold text-emerald-400 mt-2">{formatCurrency(razorpayData.revenue.today)}</p>
                    <p className="text-xs text-gray-500 mt-1">{razorpayData.transactions.today} transactions</p>
                  </div>

                  <div className="bg-dark-700 border border-dark-500 rounded-2xl p-6">
                    <span className="text-gray-400 text-sm">This Week</span>
                    <p className="text-2xl font-bold text-blue-400 mt-2">{formatCurrency(razorpayData.revenue.week)}</p>
                    <p className="text-xs text-gray-500 mt-1">{razorpayData.transactions.week} transactions</p>
                  </div>

                  <div className="bg-dark-700 border border-dark-500 rounded-2xl p-6">
                    <span className="text-gray-400 text-sm">This Month</span>
                    <p className="text-2xl font-bold text-purple-400 mt-2">{formatCurrency(razorpayData.revenue.month)}</p>
                    <p className="text-xs text-gray-500 mt-1">{razorpayData.transactions.month} transactions</p>
                  </div>

                  <div className="bg-dark-700 border border-dark-500 rounded-2xl p-6">
                    <span className="text-gray-400 text-sm">All Time</span>
                    <p className="text-2xl font-bold mt-2">{formatCurrency(razorpayData.revenue.total)}</p>
                    <p className="text-xs text-gray-500 mt-1">{razorpayData.transactions.total} transactions</p>
                  </div>
                </div>

                {/* Fees & Refunds */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-dark-700 border border-dark-500 rounded-2xl p-6">
                    <h4 className="text-gray-400 text-sm mb-3">Platform Fees Collected</h4>
                    <p className="text-3xl font-bold text-emerald-400">{formatCurrency(razorpayData.platformFees.total)}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      This month: {formatCurrency(razorpayData.platformFees.month)}
                    </p>
                  </div>

                  <div className="bg-dark-700 border border-dark-500 rounded-2xl p-6">
                    <h4 className="text-gray-400 text-sm mb-3">Est. Razorpay Fees</h4>
                    <p className="text-3xl font-bold text-amber-400">{formatCurrency(razorpayData.razorpayFees.estimated)}</p>
                    <p className="text-xs text-gray-500 mt-2">~2.36% (2% + 18% GST)</p>
                  </div>

                  <div className="bg-dark-700 border border-dark-500 rounded-2xl p-6">
                    <h4 className="text-gray-400 text-sm mb-3">Refunds</h4>
                    <p className="text-3xl font-bold text-red-400">{formatCurrency(razorpayData.refunds.totalAmount)}</p>
                    <p className="text-xs text-gray-500 mt-2">{razorpayData.refunds.count} refunds processed</p>
                  </div>
                </div>

                {/* Monthly Trend */}
                {razorpayData.monthlyTrend?.length > 0 && (
                  <div className="bg-dark-700 border border-dark-500 rounded-2xl p-6">
                    <h3 className="font-semibold mb-4">Revenue Trend (Last 6 Months)</h3>
                    <div className="h-48 flex items-end justify-between gap-2">
                      {razorpayData.monthlyTrend.map((month, i) => {
                        const maxRevenue = Math.max(...razorpayData.monthlyTrend.map(m => m.revenue));
                        const heightPercent = maxRevenue > 0 ? (month.revenue / maxRevenue) * 100 : 0;
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center">
                            <div
                              className="w-full bg-gradient-to-t from-purple-600 to-blue-600 rounded-t-sm hover:opacity-80 transition-opacity"
                              style={{ height: `${Math.max(20, heightPercent)}%` }}
                              title={`${month.month}: ${formatCurrency(month.revenue)}`}
                            />
                            <p className="text-xs text-gray-500 mt-2">{month.month}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Recent Transactions */}
                <div className="bg-dark-700 border border-dark-500 rounded-2xl p-6">
                  <h3 className="font-semibold mb-4">Recent Transactions</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-500 border-b border-dark-500">
                          <th className="pb-3 font-medium">Client</th>
                          <th className="pb-3 font-medium">Editor</th>
                          <th className="pb-3 font-medium text-right">Amount</th>
                          <th className="pb-3 font-medium text-center">Status</th>
                          <th className="pb-3 font-medium text-right">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {razorpayData.recentPayments?.map((payment) => (
                          <tr key={payment.id} className="border-b border-dark-600">
                            <td className="py-3">{payment.client}</td>
                            <td className="py-3 text-gray-400">{payment.editor}</td>
                            <td className="py-3 text-right font-medium">{formatCurrency(payment.amount)}</td>
                            <td className="py-3 text-center">
                              <span className={`px-2 py-1 rounded-lg text-xs ${
                                payment.status === "completed" ? "bg-emerald-500/20 text-emerald-400" :
                                payment.status === "pending" ? "bg-amber-500/20 text-amber-400" :
                                "bg-red-500/20 text-red-400"
                              }`}>
                                {payment.status}
                              </span>
                            </td>
                            <td className="py-3 text-right text-gray-500">
                              {new Date(payment.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ServiceAnalytics;
