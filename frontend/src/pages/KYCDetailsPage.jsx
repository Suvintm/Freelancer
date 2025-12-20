/**
 * KYCDetailsPage - Professional Dark UI
 * Shows Bank Account, verification status, and allows submission
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
  FaClock,
  FaArrowRight,
  FaCheck,
  FaTimes,
  FaFileAlt,
  FaCloudUploadAlt
} from 'react-icons/fa';
import { HiSparkles } from 'react-icons/hi2';
import { useAppContext } from '../context/AppContext';
import Sidebar from '../components/Sidebar';
import EditorNavbar from '../components/EditorNavbar';
import axios from 'axios';

const KYCDetailsPage = () => {
  const { user, backendURL, setUser } = useAppContext();
  const [kycData, setKycData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifscCode: '',
    ifscCode: '',
    panNumber: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    gstin: '',
  });
  const [files, setFiles] = useState({ id_proof: null, bank_proof: null });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [bankInfo, setBankInfo] = useState(null);
  const [verifyingIfsc, setVerifyingIfsc] = useState(false);

  // Fetch KYC status on mount
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
        
        // Pre-fill form if bank details exist
        if (res.data?.bankDetails) {
          setFormData(prev => ({
            ...prev,
            accountHolderName: res.data.bankDetails.accountHolderName || '',
            bankName: res.data.bankDetails.bankName || '',
            ifscCode: res.data.bankDetails.ifscCode || '',
          }));
          if (res.data.bankDetails.bankName) {
            setBankInfo({ bankName: res.data.bankDetails.bankName });
          }
        }
      } catch (error) {
        console.error('Failed to fetch KYC status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchKYCStatus();
  }, [user?.token, backendURL]);

  // Lookup IFSC for bank info - use backend proxy to avoid CORS
  const lookupIFSC = async (ifsc) => {
    if (ifsc.length !== 11) return;
    
    setVerifyingIfsc(true);
    try {
      const res = await axios.get(`${backendURL}/api/profile/lookup-ifsc/${ifsc}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      if (res.data.success) {
        setBankInfo({
          bankName: res.data.bank,
          branchName: res.data.branch,
          city: res.data.city,
        });
        setFormData(prev => ({ ...prev, bankName: res.data.bank }));
      }
    } catch {
      setBankInfo(null);
    } finally {
      setVerifyingIfsc(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate account numbers match
    if (formData.accountNumber !== formData.confirmAccountNumber) {
      setMessage({ type: 'error', text: 'Account numbers do not match!' });
      return;
    }

    // Validate files
    if (!files.id_proof) {
       setMessage({ type: 'error', text: 'Identity Proof is required' });
       return;
    }
    
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const data = new FormData();
      data.append('accountHolderName', formData.accountHolderName);
      data.append('accountNumber', formData.accountNumber);
      data.append('ifscCode', formData.ifscCode);
      data.append('panNumber', formData.panNumber);
      data.append('bankName', formData.bankName);
      
      // Address & Tax
      data.append('street', formData.street);
      data.append('city', formData.city);
      data.append('state', formData.state);
      data.append('postalCode', formData.postalCode);
      if (formData.gstin) data.append('gstin', formData.gstin);

      // Files
      if (files.id_proof) data.append('id_proof', files.id_proof);
      if (files.bank_proof) data.append('bank_proof', files.bank_proof);

      const res = await axios.post(
        `${backendURL}/api/profile/submit-kyc`,
        data,
        { headers: { 
            Authorization: `Bearer ${user.token}`,
            'Content-Type': 'multipart/form-data'
        } }
      );

      // Update local kycData with response
      setKycData(prev => ({
        ...prev,
        kycStatus: res.data.kycStatus,
        bankDetails: {
          accountHolderName: formData.accountHolderName,
          bankName: formData.bankName,
          ifscCode: formData.ifscCode,
          accountNumber: '••••••' + formData.accountNumber.slice(-4),
          panNumber: formData.panNumber,
          address: {
             street: formData.street, city: formData.city, state: formData.state, postalCode: formData.postalCode
          },
          gstin: formData.gstin
        }
      }));
      
      // Update global user context
      setUser(prev => ({
        ...prev,
        kycStatus: res.data.kycStatus,
        profileCompletionPercent: res.data.profileCompletion,
      }));

      setMessage({ type: 'success', text: res.data.message || 'KYC submitted successfully!' });
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

  // Get status configuration
  const getStatusConfig = () => {
    const status = kycData?.kycStatus || user?.kycStatus || 'not_submitted';
    
    switch (status) {
      case 'verified':
        return {
          icon: FaCheckCircle,
          iconColor: 'text-emerald-400',
          bgColor: 'bg-emerald-500/10',
          borderColor: 'border-emerald-500/20',
          label: 'Verified',
          labelColor: 'text-emerald-400',
          description: 'Your bank account is verified and linked for payouts.',
          gradient: 'from-emerald-500/10 to-green-500/5'
        };
      case 'submitted':
      case 'pending':
        return {
          icon: FaClock,
          iconColor: 'text-amber-400',
          bgColor: 'bg-amber-500/10',
          borderColor: 'border-amber-500/20',
          label: 'Under Review',
          labelColor: 'text-amber-400',
          description: 'Your KYC is being verified. This usually takes 24-48 hours.',
          gradient: 'from-amber-500/10 to-orange-500/5'
        };
      case 'rejected':
        return {
          icon: FaTimes,
          iconColor: 'text-red-400',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/20',
          label: 'Rejected',
          labelColor: 'text-red-400',
          description: 'Your KYC was rejected. Please update details and resubmit.',
          gradient: 'from-red-500/10 to-rose-500/5'
        };
      default:
        return {
          icon: FaExclamationCircle,
          iconColor: 'text-zinc-400',
          bgColor: 'bg-zinc-500/10',
          borderColor: 'border-zinc-500/20',
          label: 'Not Submitted',
          labelColor: 'text-zinc-400',
          description: 'Complete KYC verification to receive payouts.',
          gradient: 'from-zinc-500/10 to-zinc-600/5'
        };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;
  const isVerified = (kycData?.kycStatus || user?.kycStatus) === 'verified';
  const isSubmitted = ['submitted', 'pending', 'verified'].includes(kycData?.kycStatus || user?.kycStatus);
  const bankDetails = kycData?.bankDetails || {};

  return (
    <div className="flex min-h-screen bg-black light:bg-slate-50 transition-colors duration-200">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 md:ml-64 flex flex-col">
        <EditorNavbar onMenuClick={() => setSidebarOpen(true)} />

        <div className="flex-1 p-4 md:p-8 max-w-[800px] mx-auto w-full mt-16 md:mt-20">
          {/* Header */}
          <motion.div 
            className="mb-6"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-xl font-semibold text-white light:text-slate-900 mb-1 flex items-center gap-2">
              <FaShieldAlt className="text-blue-400 light:text-blue-600" />
              KYC Verification
            </h1>
            <p className="text-sm text-zinc-500 light:text-slate-500">Verify your identity to enable payouts</p>
          </motion.div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 py-20 text-zinc-500 text-sm">
              <FaSpinner className="animate-spin" />
              <span>Loading...</span>
            </div>
          ) : (
            <>
              {/* Status Card */}
              <motion.div 
                className={`relative overflow-hidden rounded-2xl border ${statusConfig.borderColor} bg-gradient-to-r ${statusConfig.gradient} mb-6`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="relative p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className={`w-14 h-14 rounded-xl ${statusConfig.bgColor} flex items-center justify-center`}>
                    <StatusIcon className={`text-2xl ${statusConfig.iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-base font-semibold ${statusConfig.labelColor}`}>
                        {statusConfig.label}
                      </span>
                      {isVerified && <HiSparkles className="text-emerald-400 text-sm" />}
                    </div>
                    <p className="text-sm text-zinc-400 light:text-slate-500">{statusConfig.description}</p>
                  </div>
                  {!isVerified && (
                    <button 
                      className="flex items-center gap-2 px-5 py-2.5 bg-white text-black text-sm font-semibold rounded-xl hover:bg-zinc-100 transition-all"
                      onClick={() => setShowForm(!showForm)}
                    >
                      {showForm ? 'Cancel' : (isSubmitted ? 'Update' : 'Start KYC')}
                      {!showForm && <FaArrowRight className="text-xs" />}
                    </button>
                  )}
                </div>
              </motion.div>

              {/* Success/Error Message */}
              {message.text && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-center gap-3 p-4 rounded-xl text-sm mb-6 ${
                    message.type === 'success' 
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                      : 'bg-red-500/10 border border-red-500/20 text-red-400'
                  }`}
                >
                  {message.type === 'success' ? <FaCheckCircle /> : <FaExclamationCircle />}
                  <span>{message.text}</span>
                </motion.div>
              )}

              {/* Bank Details Display (when submitted) */}
              {isSubmitted && !showForm && bankDetails.accountHolderName && (
                <motion.div 
                  className="bg-zinc-900/50 light:bg-white border border-zinc-800 light:border-slate-200 rounded-2xl overflow-hidden mb-6 light:shadow-sm"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-center justify-between p-4 border-b border-zinc-800 light:border-slate-200">
                    <h3 className="flex items-center gap-2 text-sm font-medium text-white light:text-slate-900">
                      <FaUniversity className="text-blue-400 light:text-blue-600" />
                      Bank Account Details
                    </h3>
                    {!isVerified && (
                      <button 
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-400 light:text-slate-500 hover:text-white light:hover:text-slate-900 transition-colors"
                        onClick={() => setShowForm(true)}
                      >
                        <FaEdit className="text-[10px]" /> Edit
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-zinc-800 light:bg-slate-200">
                    {[
                      { icon: FaUser, iconColor: 'text-blue-400 light:text-blue-600', label: 'Account Holder', value: bankDetails.accountHolderName },
                      { icon: FaBuilding, iconColor: 'text-purple-400 light:text-purple-600', label: 'Bank Name', value: bankDetails.bankName },
                      { icon: FaMoneyBillWave, iconColor: 'text-emerald-400 light:text-emerald-600', label: 'Account Number', value: bankDetails.accountNumber },
                      { icon: FaUniversity, iconColor: 'text-amber-400 light:text-amber-600', label: 'IFSC Code', value: bankDetails.ifscCode },
                      { icon: FaIdCard, iconColor: 'text-pink-400 light:text-pink-600', label: 'PAN Number', value: bankDetails.panNumber ? `${bankDetails.panNumber.slice(0,2)}****${bankDetails.panNumber.slice(-2)}` : '-' },
                    ].map((item, idx) => (
                      <div key={idx} className="p-4 bg-zinc-900/80 light:bg-white">
                        <div className="flex items-center gap-2 text-[10px] text-zinc-500 light:text-slate-500 uppercase tracking-wide font-medium mb-2">
                          <item.icon className={`${item.iconColor}`} />
                          {item.label}
                        </div>
                        <span className="text-sm text-white light:text-slate-900 font-medium">{item.value || '-'}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* KYC Form */}
              {showForm && (
                <motion.div 
                  className="bg-zinc-900/50 light:bg-white border border-zinc-800 light:border-slate-200 rounded-2xl overflow-hidden mb-6 light:shadow-sm"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="p-5 border-b border-zinc-800">
                    <h3 className="flex items-center gap-2 text-base font-semibold text-white mb-1">
                      <FaShieldAlt className="text-blue-400" />
                      Bank Account Verification
                    </h3>
                    <p className="text-xs text-zinc-500">Enter your bank details for receiving payouts</p>
                  </div>

                  <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    {/* Account Holder Name */}
                    <div>
                      <label className="flex items-center gap-2 text-xs font-medium text-zinc-400 mb-2">
                        <FaUser className="text-blue-400" />
                        Account Holder Name
                      </label>
                      <input
                        type="text"
                        placeholder="Full name as per bank records"
                        value={formData.accountHolderName}
                        onChange={(e) => setFormData(prev => ({ ...prev, accountHolderName: e.target.value }))}
                        required
                        className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-xl text-white text-sm outline-none focus:border-zinc-600 transition-colors placeholder:text-zinc-600"
                      />
                    </div>

                    {/* IFSC + Bank Name */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="flex items-center gap-2 text-xs font-medium text-zinc-400 mb-2">
                          <FaUniversity className="text-amber-400" />
                          IFSC Code
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="e.g., SBIN0001234"
                            value={formData.ifscCode}
                            onChange={(e) => {
                              const val = e.target.value.toUpperCase();
                              setFormData(prev => ({ ...prev, ifscCode: val }));
                              if (val.length === 11) lookupIFSC(val);
                            }}
                            required
                            maxLength={11}
                            className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-xl text-white text-sm outline-none focus:border-zinc-600 transition-colors placeholder:text-zinc-600"
                          />
                          {verifyingIfsc && (
                            <FaSpinner className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 animate-spin" />
                          )}
                        </div>
                        {bankInfo && (
                          <p className="text-xs text-emerald-400 mt-1.5 flex items-center gap-1">
                            <FaCheck /> {bankInfo.bankName} {bankInfo.branchName && `- ${bankInfo.branchName}`}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="flex items-center gap-2 text-xs font-medium text-zinc-400 mb-2">
                          <FaBuilding className="text-purple-400" />
                          Bank Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., State Bank of India"
                          value={formData.bankName}
                          onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
                          required
                          className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-xl text-white text-sm outline-none focus:border-zinc-600 transition-colors placeholder:text-zinc-600"
                        />
                      </div>
                    </div>

                    {/* Account Number + Confirm */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="flex items-center gap-2 text-xs font-medium text-zinc-400 mb-2">
                          <FaMoneyBillWave className="text-emerald-400" />
                          Account Number
                        </label>
                        <input
                          type="password"
                          placeholder="Enter account number"
                          value={formData.accountNumber}
                          onChange={(e) => setFormData(prev => ({ ...prev, accountNumber: e.target.value.replace(/\D/g, '') }))}
                          required
                          className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-xl text-white text-sm outline-none focus:border-zinc-600 transition-colors placeholder:text-zinc-600"
                        />
                      </div>

                      <div>
                        <label className="flex items-center gap-2 text-xs font-medium text-zinc-400 mb-2">
                          <FaMoneyBillWave className="text-emerald-400" />
                          Confirm Account Number
                        </label>
                        <input
                          type="text"
                          placeholder="Re-enter account number"
                          value={formData.confirmAccountNumber}
                          onChange={(e) => setFormData(prev => ({ ...prev, confirmAccountNumber: e.target.value.replace(/\D/g, '') }))}
                          required
                          className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-xl text-white text-sm outline-none focus:border-zinc-600 transition-colors placeholder:text-zinc-600"
                        />
                      </div>
                    </div>

                    {/* PAN Number */}
                    <div>
                      <label className="flex items-center gap-2 text-xs font-medium text-zinc-400 mb-2">
                        <FaIdCard className="text-pink-400" />
                        PAN Number
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., ABCDE1234F"
                        value={formData.panNumber}
                        onChange={(e) => setFormData(prev => ({ ...prev, panNumber: e.target.value.toUpperCase() }))}
                        required
                        maxLength={10}
                        className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-xl text-white text-sm outline-none focus:border-zinc-600 transition-colors placeholder:text-zinc-600"
                      />
                    </div>

                    {/* Address Section */}
                    <div className="pt-4 border-t border-zinc-800">
                      <h4 className="text-sm font-medium text-white mb-4">Address & Tax Details</h4>
                      
                      {/* Street */}
                      <div className="mb-4">
                        <label className="text-xs text-zinc-400 block mb-2">Street Address</label>
                        <input
                           type="text"
                           placeholder="House No, Street, Area"
                           value={formData.street}
                           onChange={(e) => setFormData(prev => ({...prev, street: e.target.value}))}
                           required
                           className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-xl text-white text-sm outline-none focus:border-zinc-600 transition-colors"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                         <div>
                           <label className="text-xs text-zinc-400 block mb-2">City</label>
                           <input
                              type="text"
                              value={formData.city}
                              onChange={(e) => setFormData(prev => ({...prev, city: e.target.value}))}
                              required
                              className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-xl text-white text-sm outline-none focus:border-zinc-600 transition-colors"
                           />
                         </div>
                         <div>
                           <label className="text-xs text-zinc-400 block mb-2">State</label>
                           <input
                              type="text"
                              value={formData.state}
                              onChange={(e) => setFormData(prev => ({...prev, state: e.target.value}))}
                              required
                              className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-xl text-white text-sm outline-none focus:border-zinc-600 transition-colors"
                           />
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                         <div>
                           <label className="text-xs text-zinc-400 block mb-2">Postal Code</label>
                           <input
                              type="text"
                              value={formData.postalCode}
                              onChange={(e) => setFormData(prev => ({...prev, postalCode: e.target.value}))}
                              required
                              maxLength={6}
                              className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-xl text-white text-sm outline-none focus:border-zinc-600 transition-colors"
                           />
                         </div>
                         <div>
                           <label className="text-xs text-zinc-400 block mb-2">GSTIN (Optional)</label>
                           <input
                              type="text"
                              value={formData.gstin}
                              onChange={(e) => setFormData(prev => ({...prev, gstin: e.target.value.toUpperCase()}))}
                              className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-xl text-white text-sm outline-none focus:border-zinc-600 transition-colors"
                           />
                         </div>
                      </div>
                    </div>

                    {/* Documents Section */}
                    <div className="pt-4 border-t border-zinc-800">
                       <h4 className="text-sm font-medium text-white mb-4">Document Verification</h4>
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* ID Proof */}
                          <div className="relative">
                             <input 
                               type="file" 
                               id="id_proof_upload" 
                               hidden 
                               accept="image/*,.pdf" 
                               onChange={(e) => setFiles(prev => ({...prev, id_proof: e.target.files[0]}))}
                             />
                             <label htmlFor="id_proof_upload" className={`flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${files.id_proof ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-zinc-700 hover:border-zinc-500'}`}>
                                {files.id_proof ? (
                                   <>
                                     <FaCheckCircle className="text-emerald-500 text-xl mb-2" />
                                     <span className="text-xs text-emerald-400 truncate w-full text-center">{files.id_proof.name}</span>
                                     <span className="text-[10px] text-zinc-500 mt-1">Click to change</span>
                                   </>
                                ) : (
                                   <>
                                     <FaCloudUploadAlt className="text-zinc-400 text-xl mb-2" />
                                     <span className="text-xs text-zinc-300">Upload Identity Proof</span>
                                     <span className="text-[10px] text-zinc-500 mt-1">(PAN / Aadhar) *Required</span>
                                   </>
                                )}
                             </label>
                          </div>

                          {/* Bank Proof */}
                          <div className="relative">
                             <input 
                               type="file" 
                               id="bank_proof_upload" 
                               hidden 
                               accept="image/*,.pdf" 
                               onChange={(e) => setFiles(prev => ({...prev, bank_proof: e.target.files[0]}))}
                             />
                             <label htmlFor="bank_proof_upload" className={`flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${files.bank_proof ? 'border-blue-500/50 bg-blue-500/5' : 'border-zinc-700 hover:border-zinc-500'}`}>
                                {files.bank_proof ? (
                                   <>
                                     <FaCheckCircle className="text-blue-500 text-xl mb-2" />
                                     <span className="text-xs text-blue-400 truncate w-full text-center">{files.bank_proof.name}</span>
                                     <span className="text-[10px] text-zinc-500 mt-1">Click to change</span>
                                   </>
                                ) : (
                                   <>
                                     <FaUniversity className="text-zinc-400 text-xl mb-2" />
                                     <span className="text-xs text-zinc-300">Upload Bank Proof</span>
                                     <span className="text-[10px] text-zinc-500 mt-1">(Cheque / Statement) *Required</span>
                                   </>
                                )}
                             </label>
                          </div>
                       </div>
                    </div>

                    {/* Security Note */}
                    <div className="flex items-center gap-2 text-xs text-zinc-500 px-4 py-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                      <FaLock className="text-emerald-400" />
                      <span>Your data is encrypted with bank-grade security</span>
                    </div>

                    {/* Submit */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <button 
                        type="button" 
                        className="flex-1 sm:flex-none px-5 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-300 text-sm font-medium hover:bg-zinc-700 transition-colors"
                        onClick={() => setShowForm(false)}
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        disabled={submitting}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white text-black text-sm font-semibold rounded-xl hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {submitting ? (
                          <>
                            <FaSpinner className="animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <FaCheck />
                            Submit for Verification
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* Why KYC Section */}
              <motion.div 
                className="p-5 bg-zinc-900/30 border border-zinc-800 rounded-2xl"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <FaShieldAlt className="text-blue-400" />
                  Why KYC is Required
                </h4>
                <ul className="space-y-3">
                  {[
                    { icon: FaMoneyBillWave, iconColor: 'text-emerald-400', text: 'Receive payouts directly to your bank account' },
                    { icon: FaShieldAlt, iconColor: 'text-blue-400', text: 'Comply with RBI payment regulations' },
                    { icon: FaLock, iconColor: 'text-purple-400', text: 'Protect your account from unauthorized access' },
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-sm text-zinc-400">
                      <div className={`w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center ${item.iconColor}`}>
                        <item.icon className="text-xs" />
                      </div>
                      <span>{item.text}</span>
                    </li>
                  ))}
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
