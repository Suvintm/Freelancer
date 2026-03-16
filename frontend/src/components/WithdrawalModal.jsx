import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaTimes,
  FaUniversity,
  FaRupeeSign,
  FaShieldAlt,
  FaInfoCircle,
  FaCheckCircle,
} from "react-icons/fa";
import axios from "axios";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-toastify";

const WithdrawalModal = ({ isOpen, onClose, availableBalance, onSuccess }) => {
  const { user, backendURL } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    accountNumber: "",
    ifsc: "",
    accountHolderName: "",
    bankName: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (parseFloat(formData.amount) > availableBalance) {
      return toast.error("Amount exceeds available balance");
    }

    if (parseFloat(formData.amount) < 100) {
      return toast.error("Minimum withdrawal amount is ₹100");
    }

    try {
      setLoading(true);
      const { data } = await axios.post(
        `${backendURL}/api/withdrawals/request`,
        formData,
        {
          headers: { Authorization: `Bearer ${user?.token}` },
        }
      );

      toast.success(data.message || "Withdrawal request submitted successfully!");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Withdrawal error:", err);
      toast.error(err.response?.data?.message || "Failed to submit withdrawal request");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-emerald-500/10 border-b border-white/5 px-6 py-6 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30">
                <FaUniversity />
              </div>
              <div>
                <h2 className="text-xl font-bold">Withdraw Funds</h2>
                <p className="text-emerald-400/60 text-xs font-medium uppercase tracking-wider">
                  Secure Bank Transfer
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
            >
              <FaTimes />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Balance Info */}
            <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex justify-between items-center">
              <div className="text-sm text-gray-400">Available for Withdrawal</div>
              <div className="text-xl font-bold text-emerald-400">
                ₹{availableBalance.toLocaleString("en-IN")}
              </div>
            </div>

            <div className="space-y-4">
              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Amount to Withdraw
                </label>
                <div className="relative">
                  <FaRupeeSign className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" />
                  <input
                    required
                    type="number"
                    name="amount"
                    min="100"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={handleInputChange}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 transition-colors font-bold text-lg"
                  />
                </div>
              </div>

              {/* Bank Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Account Holder Name
                  </label>
                  <input
                    required
                    type="text"
                    name="accountHolderName"
                    placeholder="As per bank records"
                    value={formData.accountHolderName}
                    onChange={handleInputChange}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Account Number
                  </label>
                  <input
                    required
                    type="text"
                    name="accountNumber"
                    placeholder="Enter account number"
                    value={formData.accountNumber}
                    onChange={handleInputChange}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    IFSC Code
                  </label>
                  <input
                    required
                    type="text"
                    name="ifsc"
                    placeholder="SBIN0012345"
                    value={formData.ifsc}
                    onChange={handleInputChange}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 transition-colors uppercase"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Bank Name
                  </label>
                  <input
                    required
                    type="text"
                    name="bankName"
                    placeholder="e.g. State Bank of India"
                    value={formData.bankName}
                    onChange={handleInputChange}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Security Note */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex gap-3">
              <FaShieldAlt className="text-blue-400 shrink-0 mt-1" />
              <div className="text-xs text-gray-400 leading-relaxed">
                <span className="text-blue-400 font-bold">Secure Payout:</span> Your bank details are encrypted and used only for processing this withdrawal. Transfers typically take 24-48 hours after approval.
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !formData.amount}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-bold text-lg transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Confirm Withdrawal <FaCheckCircle className="text-sm opacity-70" />
                </>
              )}
            </button>
            <p className="text-center text-[10px] text-gray-600 uppercase tracking-widest font-bold">
              Powered by RazorpayX
            </p>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default WithdrawalModal;
