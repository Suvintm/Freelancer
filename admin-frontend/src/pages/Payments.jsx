// Payments.jsx - Admin payments overview with analytics
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FaWallet,
  FaChartLine,
  FaRupeeSign,
  FaArrowUp,
  FaArrowDown,
  FaSearch,
  FaFilter,
  FaUserTie,
  FaUser,
  FaCheckCircle,
  FaClock,
  FaDownload,
} from "react-icons/fa";
import axios from "axios";
import { useAdmin } from "../context/AdminContext";
import { toast } from "react-toastify";

const backendURL = import.meta.env.VITE_BACKEND_URL;

const Payments = () => {
  const { admin } = useAdmin();
  const [analytics, setAnalytics] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");

  // Fetch analytics
  const fetchAnalytics = async () => {
    try {
      const { data } = await axios.get(
        `${backendURL}/api/payments/admin/analytics`,
        { headers: { Authorization: `Bearer ${admin?.token}` } }
      );
      setAnalytics(data);
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    }
  };

  // Fetch payments
  const fetchPayments = async () => {
    try {
      const { data } = await axios.get(
        `${backendURL}/api/payments/admin/all`,
        { headers: { Authorization: `Bearer ${admin?.token}` } }
      );
      setPayments(data.payments);
    } catch (err) {
      console.error("Failed to fetch payments:", err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchAnalytics(), fetchPayments()]);
      setLoading(false);
    };
    loadData();
  }, []);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Filter payments
  const filteredPayments = payments.filter((p) => {
    if (activeFilter === "all") return true;
    return p.status === activeFilter;
  });

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <FaWallet className="text-purple-500" />
          Payment Analytics
        </h1>
        <p className="text-gray-400 mt-1">Monitor platform revenue and transactions</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-dark-400 rounded-2xl p-6 animate-pulse h-32" />
          ))}
        </div>
      ) : (
        <>
          {/* Revenue Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {/* Total Revenue */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border border-purple-500/20 rounded-2xl p-6"
            >
              <div className="flex items-center gap-2 text-purple-400 mb-2">
                <FaRupeeSign />
                <span className="text-sm font-medium">Total Revenue</span>
              </div>
              <p className="text-3xl font-bold text-white">
                {formatCurrency(analytics?.revenue?.totalRevenue)}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {analytics?.revenue?.totalTransactions} transactions
              </p>
            </motion.div>

            {/* Platform Revenue */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-emerald-900/30 to-green-900/30 border border-emerald-500/20 rounded-2xl p-6"
            >
              <div className="flex items-center gap-2 text-emerald-400 mb-2">
                <FaChartLine />
                <span className="text-sm font-medium">Platform Fee (10%)</span>
              </div>
              <p className="text-3xl font-bold text-white">
                {formatCurrency(analytics?.revenue?.platformRevenue)}
              </p>
              <p className="text-sm text-emerald-400 mt-1 flex items-center gap-1">
                <FaArrowUp className="text-xs" /> Platform earnings
              </p>
            </motion.div>

            {/* Editor Payouts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-orange-900/30 to-red-900/30 border border-orange-500/20 rounded-2xl p-6"
            >
              <div className="flex items-center gap-2 text-orange-400 mb-2">
                <FaUserTie />
                <span className="text-sm font-medium">Editor Payouts</span>
              </div>
              <p className="text-3xl font-bold text-white">
                {formatCurrency(analytics?.revenue?.editorPayouts)}
              </p>
              <p className="text-sm text-gray-400 mt-1">Released to editors</p>
            </motion.div>

            {/* Average Order */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border border-blue-500/20 rounded-2xl p-6"
            >
              <div className="flex items-center gap-2 text-blue-400 mb-2">
                <FaWallet />
                <span className="text-sm font-medium">Avg Order Value</span>
              </div>
              <p className="text-3xl font-bold text-white">
                {formatCurrency(
                  analytics?.revenue?.totalRevenue / (analytics?.revenue?.totalTransactions || 1)
                )}
              </p>
              <p className="text-sm text-gray-400 mt-1">Per transaction</p>
            </motion.div>
          </div>

          {/* Top Earners & Spenders */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Top Editors */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-dark-400 rounded-2xl p-6 border border-dark-300"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <FaUserTie className="text-orange-400" />
                Top Earning Editors
              </h3>
              <div className="space-y-3">
                {analytics?.topEditors?.slice(0, 5).map((editor, i) => (
                  <div key={editor._id} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      i === 0 ? "bg-yellow-500 text-black" :
                      i === 1 ? "bg-gray-400 text-black" :
                      i === 2 ? "bg-orange-600 text-white" :
                      "bg-dark-300 text-gray-400"
                    }`}>
                      {i + 1}
                    </div>
                    <img
                      src={editor.profilePicture || "https://via.placeholder.com/40"}
                      alt={editor.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{editor.name}</p>
                      <p className="text-gray-500 text-xs">{editor.orderCount} orders</p>
                    </div>
                    <p className="text-emerald-400 font-bold">
                      {formatCurrency(editor.totalEarnings)}
                    </p>
                  </div>
                ))}
                {(!analytics?.topEditors || analytics.topEditors.length === 0) && (
                  <p className="text-gray-500 text-center py-4">No data yet</p>
                )}
              </div>
            </motion.div>

            {/* Top Clients */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-dark-400 rounded-2xl p-6 border border-dark-300"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <FaUser className="text-blue-400" />
                Top Spending Clients
              </h3>
              <div className="space-y-3">
                {analytics?.topClients?.slice(0, 5).map((client, i) => (
                  <div key={client._id} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      i === 0 ? "bg-yellow-500 text-black" :
                      i === 1 ? "bg-gray-400 text-black" :
                      i === 2 ? "bg-orange-600 text-white" :
                      "bg-dark-300 text-gray-400"
                    }`}>
                      {i + 1}
                    </div>
                    <img
                      src={client.profilePicture || "https://via.placeholder.com/40"}
                      alt={client.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{client.name}</p>
                      <p className="text-gray-500 text-xs">{client.orderCount} orders</p>
                    </div>
                    <p className="text-blue-400 font-bold">
                      {formatCurrency(client.totalSpent)}
                    </p>
                  </div>
                ))}
                {(!analytics?.topClients || analytics.topClients.length === 0) && (
                  <p className="text-gray-500 text-center py-4">No data yet</p>
                )}
              </div>
            </motion.div>
          </div>

          {/* Recent Transactions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-dark-400 rounded-2xl border border-dark-300"
          >
            <div className="p-6 border-b border-dark-300">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <h3 className="text-lg font-semibold text-white">Recent Transactions</h3>
                {/* Filters */}
                <div className="flex gap-2">
                  {["all", "completed", "pending"].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setActiveFilter(filter)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                        activeFilter === filter
                          ? "bg-purple-500 text-white"
                          : "bg-dark-300 text-gray-400 hover:text-white"
                      }`}
                    >
                      {filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-dark-300/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Transaction</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Client</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Editor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Fee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-300">
                  {filteredPayments.slice(0, 20).map((payment) => (
                    <tr key={payment._id} className="hover:bg-dark-300/30 transition">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-white font-medium truncate max-w-[200px]">
                            {payment.order?.title || "Order"}
                          </p>
                          <p className="text-gray-500 text-xs">{payment.receiptNumber}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-300">{payment.client?.name || "—"}</td>
                      <td className="px-6 py-4 text-gray-300">{payment.editor?.name || "—"}</td>
                      <td className="px-6 py-4 text-white font-medium">{formatCurrency(payment.amount)}</td>
                      <td className="px-6 py-4 text-emerald-400">{formatCurrency(payment.platformFee)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          payment.status === "completed"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-orange-500/20 text-orange-400"
                        }`}>
                          {payment.status === "completed" ? <FaCheckCircle /> : <FaClock />}
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-sm">{formatDate(payment.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredPayments.length === 0 && (
                <div className="text-center py-12">
                  <FaWallet className="text-4xl text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No transactions found</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
};

export default Payments;
