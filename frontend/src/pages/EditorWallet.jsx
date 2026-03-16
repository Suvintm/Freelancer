import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaWallet,
  FaClock,
  FaArrowUp,
  FaHistory,
  FaUniversity,
  FaExclamationCircle,
  FaCheckCircle,
  FaInfoCircle,
  FaChevronRight,
  FaRupeeSign,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import WithdrawalModal from "../components/WithdrawalModal";
import EditorKYCForm from "../components/EditorKYCForm";

const EditorWallet = () => {
  const navigate = useNavigate();
  const { user, backendURL } = useAppContext();
  
  const [walletData, setWalletData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showKYCModal, setShowKYCModal] = useState(false);
  const [activeTab, setActiveTab] = useState("earnings"); // earnings | withdrawals

  const fetchData = async () => {
    try {
      setLoading(true);
      const [walletRes, transRes, withdrawRes] = await Promise.all([
        axios.get(`${backendURL}/api/wallet/balance`, {
          headers: { Authorization: `Bearer ${user?.token}` },
        }),
        axios.get(`${backendURL}/api/wallet/transactions`, {
          headers: { Authorization: `Bearer ${user?.token}` },
        }),
        axios.get(`${backendURL}/api/withdrawals/my`, {
          headers: { Authorization: `Bearer ${user?.token}` },
        }),
      ]);

      setWalletData(walletRes.data);
      setTransactions(transRes.data.transactions || []);
      setWithdrawals(withdrawRes.data.withdrawals || []);
    } catch (err) {
      console.error("Failed to fetch wallet data:", err);
      toast.error("Failed to load wallet information");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const stats = [
    {
      label: "Available",
      value: walletData?.walletBalance || 0,
      icon: <FaWallet />,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
    },
    {
      label: "Pending Clearance",
      value: walletData?.pendingBalance || 0,
      icon: <FaClock />,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/20",
    },
    {
      label: "Total Earned",
      value: walletData?.lifetimeEarnings || 0,
      icon: <FaCheckCircle />,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
    },
    {
      label: "Total Withdrawn",
      value: walletData?.totalWithdrawn || 0,
      icon: <FaArrowUp />,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/20",
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-white/10 px-4 py-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">My Wallet</h1>
            <p className="text-gray-400 text-sm">Manage your earnings and withdrawals</p>
          </div>
          <button
            onClick={() => {
              if (user?.kycStatus !== "verified") {
                setShowKYCModal(true);
              } else {
                setShowWithdrawModal(true);
              }
            }}
            disabled={!walletData?.walletBalance || walletData.walletBalance <= 0}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-emerald-500/20"
          >
            <FaArrowUp className="text-xs" /> Withdraw
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`${stat.bgColor} border ${stat.borderColor} rounded-2xl p-5 relative overflow-hidden group`}
            >
              <div className="relative z-10">
                <div className={`${stat.color} mb-3 text-xl`}>{stat.icon}</div>
                <div className="text-gray-400 text-xs font-medium uppercase tracking-wider">
                  {stat.label}
                </div>
                <div className="text-2xl font-bold mt-1">
                  ₹{stat.value.toLocaleString("en-IN")}
                </div>
              </div>
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity text-6xl">
                {stat.icon}
              </div>
            </motion.div>
          ))}
        </div>

        {/* KYC Alert */}
        {user?.kycStatus !== "verified" && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:bg-orange-500/15 transition-all"
            onClick={() => navigate("/kyc")}
          >
            <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 text-xl border border-orange-500/30">
              <FaExclamationCircle />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-orange-400">KYC Verification Required</h4>
              <p className="text-sm text-gray-400">
                Complete your KYC to enable bank withdrawals. This is a one-time process.
              </p>
            </div>
            <FaChevronRight className="text-gray-500" />
          </motion.div>
        )}

        {/* Tabs and History */}
        <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
          <div className="flex border-b border-white/10 p-2 gap-2">
            {[
              { id: "earnings", label: "Earnings Log", icon: <FaRupeeSign /> },
              { id: "withdrawals", label: "Withdrawals", icon: <FaHistory /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-white/10 text-white shadow-inner"
                    : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          <div className="p-1">
            <AnimatePresence mode="wait">
              {activeTab === "earnings" ? (
                <motion.div
                  key="earnings"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="divide-y divide-white/5"
                >
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <div key={i} className="p-6 flex items-center gap-4 animate-pulse">
                        <div className="w-12 h-12 rounded-xl bg-white/5"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-1/4 bg-white/5 rounded"></div>
                          <div className="h-3 w-1/2 bg-white/5 rounded"></div>
                        </div>
                      </div>
                    ))
                  ) : transactions.length === 0 ? (
                    <div className="p-20 text-center text-gray-500">
                      <FaRupeeSign className="text-4xl mx-auto mb-4 opacity-20" />
                      <p>No earnings transactions yet</p>
                    </div>
                  ) : (
                    transactions.map((txn, i) => (
                      <div
                        key={txn._id}
                        className="p-6 hover:bg-white/[0.02] transition-colors group flex items-center gap-4"
                      >
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${
                            txn.status === "cleared"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-amber-500/10 text-amber-400"
                          }`}
                        >
                          {txn.status === "cleared" ? <FaCheckCircle /> : <FaClock />}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                               <h4 className="font-bold flex items-center gap-2">
                                {txn.type === "earning" ? "Order Earning" : txn.type.replace(/_/g, ' ')}
                                {txn.status === "pending_clearance" && (
                                    <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30 uppercase tracking-tighter">
                                        Pending Clearance
                                    </span>
                                )}
                               </h4>
                               <p className="text-sm text-gray-500 mt-0.5">
                                 {txn.type === "earning" ? `Order #${txn.order?.orderNumber || '...'}` : 'Transaction recorded'}
                               </p>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-white">
                                +₹{txn.amount.toLocaleString()}
                              </div>
                              <div className="text-xs text-gray-600">
                                {new Date(txn.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          
                          {txn.status === "pending_clearance" && txn.clearanceDate && (
                            <div className="mt-3 flex items-center gap-2 text-xs text-amber-400/80 bg-amber-500/5 p-2 rounded-lg border border-amber-500/10">
                              <FaInfoCircle /> Available for withdrawal on: {new Date(txn.clearanceDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="withdrawals"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="divide-y divide-white/5"
                >
                   {loading ? (
                    [...Array(5)].map((_, i) => (
                      <div key={i} className="p-6 flex items-center gap-4 animate-pulse">
                        <div className="w-12 h-12 rounded-xl bg-white/5"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-1/4 bg-white/5 rounded"></div>
                          <div className="h-3 w-1/2 bg-white/5 rounded"></div>
                        </div>
                      </div>
                    ))
                  ) : withdrawals.length === 0 ? (
                    <div className="p-20 text-center text-gray-500">
                      <FaHistory className="text-4xl mx-auto mb-4 opacity-20" />
                      <p>No withdrawal requests yet</p>
                    </div>
                  ) : (
                    withdrawals.map((withdraw, i) => (
                        <div
                        key={withdraw._id}
                        className="p-6 hover:bg-white/[0.02] transition-colors group flex items-center gap-4"
                      >
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${
                            withdraw.status === "completed"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : withdraw.status === "failed" || withdraw.status === "rejected"
                              ? "bg-red-500/10 text-red-400"
                              : "bg-blue-500/10 text-blue-400"
                          }`}
                        >
                          {withdraw.status === "completed" ? <FaCheckCircle /> : withdraw.status === "failed" ? <FaExclamationCircle /> : <FaClock />}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                               <h4 className="font-bold flex items-center gap-2 capitalize">
                                {withdraw.status.replace(/_/g, ' ')}
                               </h4>
                               <p className="text-sm text-gray-500 mt-0.5">
                                 Bank: {withdraw.bankDetails?.bankName} (****{withdraw.bankDetails?.accountNumber?.slice(-4)})
                               </p>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-white">
                                ₹{withdraw.amount.toLocaleString()}
                              </div>
                              <div className="text-xs text-gray-600">
                                {new Date(withdraw.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          
                          {withdraw.failureReason && (
                            <div className="mt-2 text-xs text-red-400">
                               Reason: {withdraw.failureReason}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Modals */}
      <WithdrawalModal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        availableBalance={walletData?.walletBalance || 0}
        onSuccess={fetchData}
      />

      {showKYCModal && (
        <EditorKYCForm 
          onSuccess={() => {
            setShowKYCModal(false);
            fetchData();
          }}
          onClose={() => setShowKYCModal(false)}
        />
      )}
    </div>
  );
};

export default EditorWallet;
