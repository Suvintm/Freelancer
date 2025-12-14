/**
 * KYCDetailsPage - Professional UI using Tailwind CSS
 * Shows Bank Account, verification status, and payout information
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FaUniversity,
  FaCheckCircle,
  FaExclamationCircle,
  FaSpinner,
  FaLock,
  FaUser,
  FaIdCard,
  FaBuilding,
  FaMoneyBillWave,
  FaEdit,
  FaShieldAlt,
  FaClock
} from 'react-icons/fa';
import { useAppContext } from '../context/AppContext';
import Sidebar from '../components/Sidebar';
import EditorNavbar from '../components/EditorNavbar';
import axios from 'axios';

const KYCDetailsPage = () => {
  const { user, backendURL } = useAppContext();
  const [kycData, setKycData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    panNumber: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchKYCStatus = async () => {
      if (!user?.token) {
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get(`${backendURL}/api/profile/kyc-status`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setKycData(res.data);
        
        if (res.data?.bankDetails) {
          setFormData({
            accountHolderName: res.data.bankDetails.accountHolderName || '',
            bankName: res.data.bankDetails.bankName || '',
            accountNumber: res.data.bankDetails.accountNumber || '',
            ifscCode: res.data.bankDetails.ifscCode || '',
            panNumber: res.data.bankDetails.panNumber || '',
          });
        }
      } catch (error) {
        console.error('Failed to fetch KYC status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchKYCStatus();
  }, [user?.token, backendURL]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await axios.post(
        `${backendURL}/api/profile/submit-kyc`,
        formData,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      setMessage({ type: 'success', text: 'KYC details submitted successfully!' });
      setKycData(prev => ({ ...prev, ...res.data }));
      setShowForm(false);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to submit KYC details' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusInfo = () => {
    const status = kycData?.kycStatus || user?.kycStatus || 'not_submitted';
    
    switch (status) {
      case 'verified':
        return {
          icon: FaCheckCircle,
          color: 'text-green-500',
          bgColor: 'bg-green-500/10',
          label: 'Verified',
          description: 'Your bank account is verified. You can receive payouts.'
        };
      case 'pending':
        return {
          icon: FaClock,
          color: 'text-amber-500',
          bgColor: 'bg-amber-500/10',
          label: 'Pending Review',
          description: 'Your KYC is under review. This usually takes 24-48 hours.'
        };
      case 'rejected':
        return {
          icon: FaExclamationCircle,
          color: 'text-red-500',
          bgColor: 'bg-red-500/10',
          label: 'Rejected',
          description: 'Your KYC was rejected. Please review and resubmit.'
        };
      default:
        return {
          icon: FaExclamationCircle,
          color: 'text-gray-500',
          bgColor: 'bg-gray-500/10',
          label: 'Not Submitted',
          description: 'Complete KYC to receive payouts from your orders.'
        };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;
  const isVerified = kycData?.kycStatus === 'verified' || user?.kycStatus === 'verified';
  const bankDetails = kycData?.bankDetails || {};

  return (
    <div className="flex min-h-screen bg-[#050507]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 md:ml-64 flex flex-col">
        <EditorNavbar onMenuClick={() => setSidebarOpen(true)} />

        <div className="flex-1 p-4 md:p-8 max-w-[900px] mx-auto w-full mt-20">
          {/* Header */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-2xl font-semibold text-gray-100 mb-1">KYC Details</h1>
            <p className="text-sm text-gray-500">Manage your bank account and verification</p>
          </motion.div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 py-16 text-gray-500 text-sm">
              <FaSpinner className="animate-spin" />
              <span>Loading KYC details...</span>
            </div>
          ) : (
            <>
              {/* Status Card */}
              <motion.div 
                className="flex flex-wrap items-center gap-5 p-6 bg-[#0a0a0c] border border-white/5 rounded-xl mb-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className={`w-12 h-12 rounded-xl ${statusInfo.bgColor} flex items-center justify-center text-xl flex-shrink-0`}>
                  <StatusIcon className={statusInfo.color} />
                </div>
                <div className="flex-1">
                  <span className={`text-sm font-semibold ${statusInfo.color} block mb-0.5`}>
                    {statusInfo.label}
                  </span>
                  <p className="text-xs text-gray-500">{statusInfo.description}</p>
                </div>
                {!isVerified && (
                  <button 
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#18181b] border border-white/[0.08] rounded-lg text-gray-200 text-sm font-semibold cursor-pointer transition-all hover:bg-[#222225]"
                    onClick={() => setShowForm(!showForm)}
                  >
                    {showForm ? 'Cancel' : (bankDetails.accountNumber ? 'Update Details' : 'Add Bank Details')}
                  </button>
                )}
              </motion.div>

              {/* Message */}
              {message.text && (
                <div className={`flex items-center gap-3 p-4 rounded-lg text-sm mb-6 ${
                  message.type === 'success' 
                    ? 'bg-green-500/10 border border-green-500/20 text-green-500'
                    : 'bg-red-500/10 border border-red-500/20 text-red-500'
                }`}>
                  {message.type === 'success' ? <FaCheckCircle /> : <FaExclamationCircle />}
                  <span>{message.text}</span>
                </div>
              )}

              {/* Bank Details Display */}
              {bankDetails.accountNumber && !showForm && (
                <motion.div 
                  className="bg-[#0a0a0c] border border-white/5 rounded-xl mb-6 overflow-hidden"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center justify-between p-4 px-5 border-b border-white/[0.04]">
                    <h3 className="flex items-center gap-2.5 text-sm font-semibold text-gray-200">
                      <FaUniversity className="text-gray-500" /> Bank Account Details
                    </h3>
                    {!isVerified && (
                      <button 
                        className="flex items-center gap-1.5 px-3 py-2 bg-transparent border border-white/[0.08] rounded-md text-gray-400 text-xs font-medium cursor-pointer transition-all hover:bg-white/[0.04] hover:text-gray-300"
                        onClick={() => setShowForm(true)}
                      >
                        <FaEdit /> Edit
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-[1px] bg-white/[0.03]">
                    <div className="p-5 bg-[#0a0a0c] flex flex-col gap-2">
                      <span className="flex items-center gap-2 text-[0.7rem] text-gray-500 uppercase tracking-wide font-medium">
                        <FaUser className="text-xs" /> Account Holder
                      </span>
                      <span className="text-sm font-medium text-gray-200">
                        {bankDetails.accountHolderName || '-'}
                      </span>
                    </div>
                    
                    <div className="p-5 bg-[#0a0a0c] flex flex-col gap-2">
                      <span className="flex items-center gap-2 text-[0.7rem] text-gray-500 uppercase tracking-wide font-medium">
                        <FaBuilding className="text-xs" /> Bank Name
                      </span>
                      <span className="text-sm font-medium text-gray-200">
                        {bankDetails.bankName || '-'}
                      </span>
                    </div>
                    
                    <div className="p-5 bg-[#0a0a0c] flex flex-col gap-2">
                      <span className="flex items-center gap-2 text-[0.7rem] text-gray-500 uppercase tracking-wide font-medium">
                        <FaMoneyBillWave className="text-xs" /> Account Number
                      </span>
                      <span className="text-sm font-medium text-gray-200 font-mono tracking-wide">
                        {bankDetails.accountNumber 
                          ? '****' + bankDetails.accountNumber.slice(-4) 
                          : '-'}
                      </span>
                    </div>
                    
                    <div className="p-5 bg-[#0a0a0c] flex flex-col gap-2">
                      <span className="flex items-center gap-2 text-[0.7rem] text-gray-500 uppercase tracking-wide font-medium">
                        <FaUniversity className="text-xs" /> IFSC Code
                      </span>
                      <span className="text-sm font-medium text-gray-200">
                        {bankDetails.ifscCode || '-'}
                      </span>
                    </div>
                    
                    <div className="p-5 bg-[#0a0a0c] flex flex-col gap-2">
                      <span className="flex items-center gap-2 text-[0.7rem] text-gray-500 uppercase tracking-wide font-medium">
                        <FaIdCard className="text-xs" /> PAN Number
                      </span>
                      <span className="text-sm font-medium text-gray-200 font-mono tracking-wide">
                        {bankDetails.panNumber 
                          ? bankDetails.panNumber.slice(0, 2) + '****' + bankDetails.panNumber.slice(-2) 
                          : '-'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* KYC Form */}
              {showForm && (
                <motion.div 
                  className="bg-[#0a0a0c] border border-white/5 rounded-xl mb-6 overflow-hidden"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="p-5 border-b border-white/[0.04]">
                    <h3 className="flex items-center gap-2.5 text-base font-semibold text-gray-200 mb-1">
                      <FaShieldAlt className="text-gray-500" /> Bank Account Verification
                    </h3>
                    <p className="text-xs text-gray-500">Enter your bank details for receiving payouts</p>
                  </div>

                  <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-medium text-gray-400">Account Holder Name *</label>
                      <input
                        type="text"
                        placeholder="Enter full name as per bank"
                        value={formData.accountHolderName}
                        onChange={(e) => setFormData(prev => ({ ...prev, accountHolderName: e.target.value }))}
                        required
                        className="px-4 py-3 bg-[#050507] border border-white/[0.08] rounded-lg text-gray-200 text-sm outline-none focus:border-white/20 transition-colors placeholder:text-gray-600"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-medium text-gray-400">Bank Name *</label>
                        <input
                          type="text"
                          placeholder="e.g., State Bank of India"
                          value={formData.bankName}
                          onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
                          required
                          className="px-4 py-3 bg-[#050507] border border-white/[0.08] rounded-lg text-gray-200 text-sm outline-none focus:border-white/20 transition-colors placeholder:text-gray-600"
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-medium text-gray-400">IFSC Code *</label>
                        <input
                          type="text"
                          placeholder="e.g., SBIN0001234"
                          value={formData.ifscCode}
                          onChange={(e) => setFormData(prev => ({ ...prev, ifscCode: e.target.value.toUpperCase() }))}
                          required
                          maxLength={11}
                          className="px-4 py-3 bg-[#050507] border border-white/[0.08] rounded-lg text-gray-200 text-sm outline-none focus:border-white/20 transition-colors placeholder:text-gray-600"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-medium text-gray-400">Account Number *</label>
                      <input
                        type="text"
                        placeholder="Enter bank account number"
                        value={formData.accountNumber}
                        onChange={(e) => setFormData(prev => ({ ...prev, accountNumber: e.target.value.replace(/\D/g, '') }))}
                        required
                        className="px-4 py-3 bg-[#050507] border border-white/[0.08] rounded-lg text-gray-200 text-sm outline-none focus:border-white/20 transition-colors placeholder:text-gray-600"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-medium text-gray-400">PAN Number *</label>
                      <input
                        type="text"
                        placeholder="e.g., ABCDE1234F"
                        value={formData.panNumber}
                        onChange={(e) => setFormData(prev => ({ ...prev, panNumber: e.target.value.toUpperCase() }))}
                        required
                        maxLength={10}
                        className="px-4 py-3 bg-[#050507] border border-white/[0.08] rounded-lg text-gray-200 text-sm outline-none focus:border-white/20 transition-colors placeholder:text-gray-600"
                      />
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-500 px-4 py-3 bg-white/[0.02] rounded-lg">
                      <FaLock className="text-green-500" />
                      <span>Your information is encrypted and secure</span>
                    </div>

                    <div className="flex flex-col md:flex-row gap-3 justify-end pt-2">
                      <button 
                        type="button" 
                        className="flex items-center justify-center gap-2 px-5 py-3 bg-transparent border border-white/10 rounded-lg text-gray-400 text-sm font-medium cursor-pointer transition-all hover:bg-white/[0.03] hover:text-gray-300"
                        onClick={() => setShowForm(false)}
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className={`flex items-center justify-center gap-2 px-5 py-3 bg-[#18181b] border border-white/[0.08] rounded-lg text-gray-200 text-sm font-semibold cursor-pointer transition-all hover:bg-[#222225] ${
                          submitting ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        disabled={submitting}
                      >
                        {submitting ? (
                          <>
                            <FaSpinner className="animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          'Submit for Verification'
                        )}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* Info Section */}
              <motion.div 
                className="p-6 bg-white/[0.02] border border-white/[0.04] rounded-xl"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h4 className="text-sm font-semibold text-gray-200 mb-4">Why KYC is Required?</h4>
                <ul className="flex flex-col gap-3">
                  <li className="flex items-start gap-3 text-sm text-gray-400">
                    <FaCheckCircle className="text-green-500 text-xs mt-1 flex-shrink-0" />
                    <span>Receive payouts from completed orders directly to your bank</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-gray-400">
                    <FaCheckCircle className="text-green-500 text-xs mt-1 flex-shrink-0" />
                    <span>Comply with payment regulations and tax requirements</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-gray-400">
                    <FaCheckCircle className="text-green-500 text-xs mt-1 flex-shrink-0" />
                    <span>Protect your account from unauthorized transactions</span>
                  </li>
                </ul>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default KYCDetailsPage;
