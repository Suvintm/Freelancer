// PaymentsPage.jsx - Payment history page with list and filters
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaArrowLeft,
  FaRupeeSign,
  FaFilter,
  FaSearch,
  FaChartLine,
  FaCalendarAlt,
  FaArrowUp,
  FaArrowDown,
  FaReceipt,
  FaWallet,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import axios from "axios";
import PaymentCard from "../components/PaymentCard";
import PaymentDetailModal from "../components/PaymentDetailModal";
import { toast } from "react-toastify";

const backendURL = import.meta.env.VITE_BACKEND_URL;

const PaymentsPage = () => {
  const navigate = useNavigate();
  const { user } = useAppContext();
  
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    type: "",
    status: "",
    sort: "-createdAt",
  });
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch payments
  const fetchPayments = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.type) params.append("type", filters.type);
      if (filters.status) params.append("status", filters.status);
      params.append("sort", filters.sort);
      
      const { data } = await axios.get(
        `${backendURL}/api/payments/history?${params}`,
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      setPayments(data.payments);
    } catch (err) {
      toast.error("Failed to load payments");
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const { data } = await axios.get(`${backendURL}/api/payments/stats`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      setStats(data);
    } catch (err) {
      console.error("Failed to load stats:", err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchPayments(), fetchStats()]);
      setLoading(false);
    };
    loadData();
  }, [filters]);

  // Filter payments by search
  const filteredPayments = payments.filter((p) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      p.order?.orderNumber?.toLowerCase().includes(query) ||
      p.order?.title?.toLowerCase().includes(query) ||
      p.receiptNumber?.toLowerCase().includes(query)
    );
  });

  const isEditor = user?.role === "editor";

  return (
    <div className="min-h-screen bg-black light:bg-slate-50 text-white light:text-slate-900 transition-colors duration-200">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/90 light:bg-white/90 backdrop-blur-md border-b border-white/10 light:border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white/10 light:hover:bg-slate-100 rounded-full transition light:text-slate-600"
          >
            <FaArrowLeft />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold light:text-slate-900">Payments</h1>
            <p className="text-gray-400 light:text-slate-500 text-sm">
              {isEditor ? "Your earnings history" : "Your payment history"}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Total */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-emerald-900/30 to-emerald-800/20 light:from-emerald-100 light:to-emerald-50 border border-emerald-500/20 light:border-emerald-200 rounded-2xl p-4"
            >
              <div className="flex items-center gap-2 text-emerald-400 light:text-emerald-600 mb-1">
                <FaWallet className="text-sm" />
                <span className="text-xs font-medium">
                  {isEditor ? "Total Earned" : "Total Spent"}
                </span>
              </div>
              <p className="text-2xl font-bold text-white light:text-slate-900">
                ₹{(isEditor ? stats.stats.totalEarnings : stats.stats.totalAmount)?.toLocaleString() || 0}
              </p>
            </motion.div>

            {/* Pending */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-orange-900/30 to-orange-800/20 light:from-orange-100 light:to-orange-50 border border-orange-500/20 light:border-orange-200 rounded-2xl p-4"
            >
              <div className="flex items-center gap-2 text-orange-400 light:text-orange-600 mb-1">
                <FaCalendarAlt className="text-sm" />
                <span className="text-xs font-medium">Pending</span>
              </div>
              <p className="text-2xl font-bold text-white light:text-slate-900">
                ₹{stats.pending.pendingAmount?.toLocaleString() || 0}
              </p>
            </motion.div>

            {/* Transactions */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 light:from-purple-100 light:to-purple-50 border border-purple-500/20 light:border-purple-200 rounded-2xl p-4"
            >
              <div className="flex items-center gap-2 text-purple-400 light:text-purple-600 mb-1">
                <FaReceipt className="text-sm" />
                <span className="text-xs font-medium">Transactions</span>
              </div>
              <p className="text-2xl font-bold text-white light:text-slate-900">
                {stats.stats.totalTransactions || 0}
              </p>
            </motion.div>

            {/* Average */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 light:from-blue-100 light:to-blue-50 border border-blue-500/20 light:border-blue-200 rounded-2xl p-4"
            >
              <div className="flex items-center gap-2 text-blue-400 light:text-blue-600 mb-1">
                <FaChartLine className="text-sm" />
                <span className="text-xs font-medium">Avg Order</span>
              </div>
              <p className="text-2xl font-bold text-white light:text-slate-900">
                ₹{Math.round(stats.stats.avgAmount || 0).toLocaleString()}
              </p>
            </motion.div>
          </div>
        )}

        {/* Search & Filters */}
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 light:text-slate-400" />
            <input
              type="text"
              placeholder="Search by order number or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1a1a1a] light:bg-white border border-white/10 light:border-slate-200 rounded-xl pl-10 pr-4 py-3 text-white light:text-slate-900 focus:outline-none focus:border-purple-500 light:placeholder:text-slate-400"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-3 rounded-xl transition ${
              showFilters ? "bg-purple-500 text-white" : "bg-[#1a1a1a] light:bg-white text-gray-400 light:text-slate-600 light:border light:border-slate-200"
            }`}
          >
            <FaFilter />
          </button>
        </div>

        {/* Filter Options */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-[#1a1a1a] light:bg-white rounded-xl p-4 space-y-4 light:border light:border-slate-200">
                <div className="flex flex-wrap gap-3">
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="bg-black light:bg-slate-100 border border-white/10 light:border-slate-200 rounded-lg px-3 py-2 text-sm light:text-slate-900"
                  >
                    <option value="">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                  </select>
                  
                  <select
                    value={filters.sort}
                    onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
                    className="bg-black light:bg-slate-100 border border-white/10 light:border-slate-200 rounded-lg px-3 py-2 text-sm light:text-slate-900"
                  >
                    <option value="-createdAt">Newest First</option>
                    <option value="createdAt">Oldest First</option>
                    <option value="-amount">Highest Amount</option>
                    <option value="amount">Lowest Amount</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Payments List */}
        <div className="space-y-3">
          {loading ? (
            // Loading skeleton
            [...Array(5)].map((_, i) => (
              <div
                key={i}
                className="bg-[#1a1a1a] rounded-2xl p-4 animate-pulse"
              >
                <div className="flex justify-between items-center">
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-gray-700 rounded" />
                    <div className="h-3 w-48 bg-gray-800 rounded" />
                  </div>
                  <div className="h-6 w-20 bg-gray-700 rounded" />
                </div>
              </div>
            ))
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-16">
              <FaReceipt className="text-6xl text-gray-700 light:text-slate-400 mx-auto mb-4" />
              <p className="text-gray-400 light:text-slate-600">No payments found</p>
              <p className="text-gray-500 light:text-slate-500 text-sm mt-1">
                Complete orders to see your payment history
              </p>
            </div>
          ) : (
            filteredPayments.map((payment, index) => (
              <motion.div
                key={payment._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <PaymentCard
                  payment={payment}
                  isEditor={isEditor}
                  onClick={() => setSelectedPayment(payment)}
                />
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Payment Detail Modal */}
      <PaymentDetailModal
        isOpen={!!selectedPayment}
        onClose={() => setSelectedPayment(null)}
        paymentId={selectedPayment?._id}
        isEditor={isEditor}
      />
    </div>
  );
};

export default PaymentsPage;
