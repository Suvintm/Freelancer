// ClientWalletSection.jsx - Wallet balance and refund history
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { 
  FaWallet, FaHistory, FaArrowDown, FaArrowUp, 
  FaExclamationCircle, FaCheckCircle, FaClock, FaRedo 
} from 'react-icons/fa';
import { useAppContext } from '../context/AppContext';
import { toast } from 'react-toastify';

const ClientWalletSection = () => {
  const { user, backendURL } = useAppContext();
  const [balance, setBalance] = useState(0);
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const [walletRes, refundsRes] = await Promise.all([
        axios.get(`${backendURL}/api/refunds/wallet`, {
          headers: { Authorization: `Bearer ${user?.token}` }
        }),
        axios.get(`${backendURL}/api/refunds/my`, {
          headers: { Authorization: `Bearer ${user?.token}` }
        })
      ]);

      setBalance(walletRes.data.balance || 0);
      setRefunds(refundsRes.data.refunds || []);
    } catch (err) {
      console.error("Failed to fetch wallet data:", err);
      toast.error("Failed to load wallet information");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'added_to_wallet': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'processing': 
      case 'initiated': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'failed': return 'text-red-500 bg-red-500/10 border-red-500/20';
      default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': 
      case 'added_to_wallet': return <FaCheckCircle />;
      case 'processing': 
      case 'initiated': return <FaClock />;
      case 'failed': return <FaExclamationCircle />;
      default: return <FaHistory />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Wallet Balance Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-indigo-900/40 to-indigo-800/20 light:from-indigo-50 light:to-white border border-indigo-500/30 light:border-indigo-200 rounded-3xl p-8 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-3 text-indigo-400 light:text-indigo-600 mb-2">
              <FaWallet className="text-xl" />
              <span className="font-medium tracking-wide text-sm uppercase">Available Balance</span>
            </div>
            <h2 className="text-5xl font-bold text-white light:text-slate-900 tracking-tight">
              ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </h2>
            <p className="text-gray-400 light:text-slate-500 text-sm mt-3 max-w-md">
              This balance can be used for future orders or automatically applied when payments fail.
              Refunding to wallet is instant.
            </p>
          </div>
          
          <div className="flex flex-col gap-3">
            <button className="px-6 py-3 bg-white/10 hover:bg-white/20 light:bg-indigo-100 light:hover:bg-indigo-200 text-white light:text-indigo-800 rounded-xl font-medium transition-all backdrop-blur-sm border border-white/10 light:border-indigo-200">
               + Add Funds (Coming Soon)
            </button>
          </div>
        </div>
      </motion.div>

      {/* Refunds History */}
      <div>
        <h3 className="text-xl font-bold text-white light:text-slate-900 mb-4 flex items-center gap-2">
          <FaHistory className="text-indigo-500" /> Refund History
        </h3>
        
        <div className="space-y-3">
          {loading ? (
             [...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-white/5 light:bg-slate-100 rounded-2xl animate-pulse"></div>
            ))
          ) : refunds.length === 0 ? (
            <div className="text-center py-12 bg-white/5 light:bg-slate-50 rounded-2xl border border-white/5 light:border-slate-200">
              <FaHistory className="text-4xl text-gray-600 light:text-slate-300 mx-auto mb-3" />
              <p className="text-gray-400 light:text-slate-500">No refunds found in history</p>
            </div>
          ) : (
            refunds.map((refund, idx) => (
              <motion.div
                key={refund._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white/5 light:bg-white border border-white/10 light:border-slate-200 rounded-2xl p-5 hover:border-indigo-500/30 transition-all flex flex-col md:flex-row gap-4 items-start md:items-center justify-between group"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 ${getStatusColor(refund.status)}`}>
                    {getStatusIcon(refund.status)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-white light:text-slate-900 flex items-center gap-2">
                      Order #{refund.order?.orderNumber || 'Unknown'}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase ${getStatusColor(refund.status)}`}>
                        {refund.status.replace(/_/g, ' ')}
                      </span>
                    </h4>
                    <p className="text-sm text-gray-400 light:text-slate-500 mt-1">
                      Reason: <span className="text-gray-300 light:text-slate-700">{refund.reason?.replace(/_/g, ' ') || 'N/A'}</span>
                    </p>
                    <p className="text-xs text-gray-500 light:text-slate-400 mt-1">
                      {new Date(refund.createdAt).toLocaleDateString()} • {new Date(refund.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                <div className="text-right ml-auto md:ml-0">
                  <p className="text-xl font-bold text-emerald-400 light:text-emerald-600">
                    +₹{refund.amount.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 light:text-slate-500 mt-1">
                    Via {refund.refundMethod === 'wallet' ? 'Wallet Credit' : 'Original Payment'}
                  </p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientWalletSection;
