/**
 * KYCDetailsPage - Professional Step-by-Step Wizard UI
 * Features: Progress bar, 3 steps (Bank → Documents → Address), bank autocomplete with icons
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  FaShieldAlt,
  FaClock,
  FaArrowRight,
  FaArrowLeft,
  FaCheck,
  FaTimes,
  FaCloudUploadAlt,
  FaMapMarkerAlt,
  FaFileAlt
} from 'react-icons/fa';
import { HiSparkles } from 'react-icons/hi2';
import { useAppContext } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import Sidebar from '../components/Sidebar';
import EditorNavbar from '../components/EditorNavbar';
import axios from 'axios';

// Popular Indian Banks with first letter icon (since external logos may not load)
const INDIAN_BANKS = [
  { name: 'State Bank of India', code: 'SBI', color: 'bg-blue-600' },
  { name: 'HDFC Bank', code: 'HDFC', color: 'bg-red-600' },
  { name: 'ICICI Bank', code: 'ICICI', color: 'bg-orange-600' },
  { name: 'Axis Bank', code: 'AXIS', color: 'bg-purple-600' },
  { name: 'Kotak Mahindra Bank', code: 'KOTAK', color: 'bg-red-500' },
  { name: 'Punjab National Bank', code: 'PNB', color: 'bg-orange-500' },
  { name: 'Bank of Baroda', code: 'BOB', color: 'bg-orange-600' },
  { name: 'Canara Bank', code: 'CANARA', color: 'bg-yellow-600' },
  { name: 'Union Bank of India', code: 'UNION', color: 'bg-blue-700' },
  { name: 'Bank of India', code: 'BOI', color: 'bg-blue-500' },
  { name: 'Indian Bank', code: 'INDIAN', color: 'bg-green-600' },
  { name: 'Central Bank of India', code: 'CBI', color: 'bg-red-700' },
  { name: 'IDBI Bank', code: 'IDBI', color: 'bg-green-700' },
  { name: 'Yes Bank', code: 'YES', color: 'bg-blue-500' },
  { name: 'IndusInd Bank', code: 'INDUSIND', color: 'bg-red-600' },
  { name: 'Federal Bank', code: 'FEDERAL', color: 'bg-blue-800' },
  { name: 'IDFC First Bank', code: 'IDFC', color: 'bg-red-500' },
  { name: 'RBL Bank', code: 'RBL', color: 'bg-purple-700' },
  { name: 'South Indian Bank', code: 'SIB', color: 'bg-blue-600' },
  { name: 'Karur Vysya Bank', code: 'KVB', color: 'bg-green-600' },
  { name: 'City Union Bank', code: 'CUB', color: 'bg-blue-700' },
  { name: 'Bandhan Bank', code: 'BANDHAN', color: 'bg-red-600' },
  { name: 'AU Small Finance Bank', code: 'AU', color: 'bg-orange-500' },
  { name: 'Equitas Small Finance Bank', code: 'EQUITAS', color: 'bg-green-500' },
  { name: 'Ujjivan Small Finance Bank', code: 'UJJIVAN', color: 'bg-purple-500' },
];

// Steps configuration
const STEPS = [
  { id: 1, title: 'Bank', icon: FaUniversity },
  { id: 2, title: 'Docs', icon: FaFileAlt },
  { id: 3, title: 'Address', icon: FaMapMarkerAlt },
];

const KYCDetailsPage = () => {
  const { user, backendURL, setUser } = useAppContext();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [kycData, setKycData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  // Step wizard state
  const [currentStep, setCurrentStep] = useState(1);
  
  const [formData, setFormData] = useState({
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    confirmAccountNumber: '',
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
  
  // Bank autocomplete state
  const [bankSuggestions, setBankSuggestions] = useState([]);
  const [showBankDropdown, setShowBankDropdown] = useState(false);
  const [selectedBank, setSelectedBank] = useState(null);

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
        
        if (res.data?.bankDetails) {
          setFormData(prev => ({
            ...prev,
            accountHolderName: res.data.bankDetails.accountHolderName || '',
            ifscCode: res.data.bankDetails.ifscCode || '',
          }));
          if (res.data.bankDetails.bankName) {
            setBankInfo({ bankName: res.data.bankDetails.bankName });
            const bank = INDIAN_BANKS.find(b => b.name === res.data.bankDetails.bankName);
            if (bank) setSelectedBank(bank);
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

  // Lookup IFSC for bank info
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
        // Try to find matching bank
        const matchedBank = INDIAN_BANKS.find(b => 
          res.data.bank.toLowerCase().includes(b.code.toLowerCase()) ||
          b.name.toLowerCase().includes(res.data.bank.toLowerCase().split(' ')[0])
        );
        if (matchedBank) setSelectedBank(matchedBank);
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
    
    if (formData.accountNumber !== formData.confirmAccountNumber) {
      setMessage({ type: 'error', text: 'Account numbers do not match!' });
      return;
    }

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
      data.append('street', formData.street);
      data.append('city', formData.city);
      data.append('state', formData.state);
      data.append('postalCode', formData.postalCode);
      if (formData.gstin) data.append('gstin', formData.gstin);
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

  // Check step completion
  const isStepComplete = (step) => {
    switch (step) {
      case 1:
        return formData.accountHolderName && formData.bankName && formData.accountNumber && formData.ifscCode && formData.panNumber;
      case 2:
        return files.id_proof !== null;
      case 3:
        return formData.street && formData.city && formData.state && formData.postalCode;
      default:
        return false;
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;
  const isVerified = (kycData?.kycStatus || user?.kycStatus) === 'verified';
  const isSubmitted = ['submitted', 'pending', 'verified'].includes(kycData?.kycStatus || user?.kycStatus);
  const bankDetails = kycData?.bankDetails || {};

  // Next/Prev step handlers
  const nextStep = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };
  
  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  return (
    <div className="flex min-h-screen bg-[#09090B] light:bg-[#FAFAFA] transition-colors overflow-x-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 md:ml-64 flex flex-col min-w-0 overflow-x-hidden">
        <EditorNavbar onMenuClick={() => setSidebarOpen(true)} />

        <div className="flex-1 px-2 py-2 sm:px-4 sm:py-3 md:p-6 w-full max-w-[600px] mx-auto mt-12 md:mt-16 pb-20 md:pb-6 min-w-0">
          {/* Header */}
          <motion.div 
            className="mb-3"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-violet-500 to-purple-500 flex items-center justify-center">
                <FaShieldAlt className="text-white text-sm" />
              </div>
              <div>
                <h1 className="text-sm font-semibold text-white light:text-slate-900">KYC Verification</h1>
                <p className="text-[10px] text-gray-500 light:text-slate-500">Verify identity for payouts</p>
              </div>
            </div>
          </motion.div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 py-20 text-zinc-500 text-sm">
              <FaSpinner className="animate-spin" />
              <span>Loading...</span>
            </div>
          ) : (
            <>
              {/* Status Card - Compact */}
              <motion.div 
                className={`relative overflow-hidden rounded-xl border ${statusConfig.borderColor} bg-gradient-to-r ${statusConfig.gradient} mb-4`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="relative px-4 py-3 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${statusConfig.bgColor} flex items-center justify-center shrink-0`}>
                    <StatusIcon className={`text-lg ${statusConfig.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-sm font-semibold ${statusConfig.labelColor}`}>
                        {statusConfig.label}
                      </span>
                      {isVerified && <HiSparkles className="text-emerald-400 text-xs" />}
                    </div>
                    <p className="text-xs text-zinc-500 truncate">{statusConfig.description}</p>
                  </div>
                  {!isVerified && (
                    <button 
                      className="flex items-center gap-1.5 px-4 py-2 bg-white text-black text-xs font-semibold rounded-lg hover:bg-zinc-100 transition-all shrink-0"
                      onClick={() => setShowForm(!showForm)}
                    >
                      {showForm ? 'Cancel' : (isSubmitted ? 'Update' : 'Start KYC')}
                      {!showForm && <FaArrowRight className="text-[10px]" />}
                    </button>
                  )}
                </div>
              </motion.div>

              {/* Success/Error Message - Compact */}
              {message.text && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs mb-3 ${
                    message.type === 'success' 
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                      : 'bg-red-500/10 border border-red-500/20 text-red-400'
                  }`}
                >
                  {message.type === 'success' ? <FaCheckCircle className="text-xs" /> : <FaExclamationCircle className="text-xs" />}
                  <span>{message.text}</span>
                </motion.div>
              )}

              {/* Bank Details Display - Compact */}
              {isSubmitted && !showForm && bankDetails.accountHolderName && (
                <motion.div 
                  className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden mb-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-center justify-between px-3 py-2.5 border-b border-zinc-800">
                    <h3 className="flex items-center gap-2 text-xs font-medium text-white">
                      <FaUniversity className="text-blue-400" />
                      Bank Account Details
                    </h3>
                    {!isVerified && (
                      <button 
                        className="text-[10px] text-zinc-400 hover:text-white transition-colors"
                        onClick={() => setShowForm(true)}
                      >
                        Edit
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-zinc-800">
                    {[
                      { icon: FaUser, iconColor: 'text-blue-400', label: 'Account Holder', value: bankDetails.accountHolderName },
                      { icon: FaBuilding, iconColor: 'text-purple-400', label: 'Bank', value: bankDetails.bankName },
                      { icon: FaMoneyBillWave, iconColor: 'text-emerald-400', label: 'Account No.', value: bankDetails.accountNumber },
                      { icon: FaUniversity, iconColor: 'text-amber-400', label: 'IFSC', value: bankDetails.ifscCode },
                      { icon: FaIdCard, iconColor: 'text-pink-400', label: 'PAN', value: bankDetails.panNumber ? `${bankDetails.panNumber.slice(0,2)}****${bankDetails.panNumber.slice(-2)}` : '-' },
                    ].map((item, idx) => (
                      <div key={idx} className="px-3 py-2.5 bg-zinc-900/80">
                        <div className="flex items-center gap-1.5 text-[9px] text-zinc-500 uppercase tracking-wide font-medium mb-1">
                          <item.icon className={`${item.iconColor} text-[10px]`} />
                          {item.label}
                        </div>
                        <span className="text-xs text-white font-medium">{item.value || '-'}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* KYC Form with Step Wizard */}
              <AnimatePresence>
                {showForm && (
                  <motion.div 
                    className="bg-[#0a0a0c] light:bg-white border border-white/10 light:border-slate-200 rounded-lg overflow-hidden mb-3 w-full"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    {/* Step Progress Bar */}
                    <div className="px-2 py-2 border-b border-white/10 light:border-slate-100 bg-white/5 light:bg-slate-50 w-full">
                      <div className="flex items-center justify-between w-full">
                        {STEPS.map((step, idx) => (
                          <div key={step.id} className="flex items-center flex-1 min-w-0">
                            <div className="flex flex-col items-center shrink-0">
                              <div 
                                className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[9px] sm:text-[10px] font-bold transition-all ${
                                  currentStep === step.id 
                                    ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg shadow-purple-500/30' 
                                    : isStepComplete(step.id)
                                      ? 'bg-emerald-500 text-white'
                                      : 'bg-white/10 light:bg-slate-200 text-gray-400 light:text-slate-400'
                                }`}
                              >
                                {isStepComplete(step.id) && currentStep !== step.id ? (
                                  <FaCheck className="text-[7px] sm:text-[8px]" />
                                ) : (
                                  <step.icon className="text-[9px] sm:text-[10px]" />
                                )}
                              </div>
                              <span className={`text-[7px] sm:text-[8px] mt-0.5 font-medium whitespace-nowrap ${
                                currentStep === step.id ? 'text-purple-400' : 'text-gray-500 light:text-slate-400'
                              }`}>
                                {step.title}
                              </span>
                            </div>
                            {idx < STEPS.length - 1 && (
                              <div className={`flex-1 h-0.5 mx-1 ${
                                isStepComplete(step.id) ? 'bg-emerald-500' : 'bg-white/10 light:bg-slate-200'
                              }`} />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-3 sm:p-4 w-full overflow-hidden">
                      {/* Step 1: Bank Details */}
                      {currentStep === 1 && (
                        <motion.div
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="space-y-3"
                        >
                          <h3 className="text-sm font-semibold text-white light:text-slate-900 flex items-center gap-2">
                            <FaUniversity className="text-violet-400" />
                            Bank Account Details
                          </h3>
                          
                          {/* Account Holder Name */}
                          <div>
                            <label className="flex items-center gap-1.5 text-[10px] font-medium text-gray-400 light:text-slate-500 mb-1.5">
                              <FaUser className="text-violet-400" />
                              Account Holder Name
                            </label>
                            <input
                              type="text"
                              placeholder="Full name as per bank records"
                              value={formData.accountHolderName}
                              onChange={(e) => setFormData(prev => ({ ...prev, accountHolderName: e.target.value }))}
                              required
                              className="w-full px-3 py-2.5 bg-white/5 light:bg-slate-100 border border-white/10 light:border-slate-200 rounded-lg text-white light:text-slate-900 text-xs outline-none focus:border-purple-500 light:focus:border-purple-500 transition-colors placeholder:text-gray-500 light:placeholder:text-slate-400"
                            />
                          </div>

                          {/* Bank Name with Autocomplete */}
                          <div className="relative">
                            <label className="flex items-center gap-2 text-xs font-medium text-zinc-400 mb-2">
                              <FaBuilding className="text-purple-400" />
                              Bank Name
                            </label>
                            <div className="relative">
                              {selectedBank && (
                                <div className={`absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full ${selectedBank.color} flex items-center justify-center text-white text-[10px] font-bold`}>
                                  {selectedBank.code.slice(0, 2)}
                                </div>
                              )}
                              <input
                                type="text"
                                placeholder="Type to search banks..."
                                value={formData.bankName}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setFormData(prev => ({ ...prev, bankName: val }));
                                  if (val.length > 0) {
                                    const filtered = INDIAN_BANKS.filter(bank => 
                                      bank.name.toLowerCase().includes(val.toLowerCase()) ||
                                      bank.code.toLowerCase().includes(val.toLowerCase())
                                    );
                                    setBankSuggestions(filtered);
                                  } else {
                                    setBankSuggestions(INDIAN_BANKS);
                                  }
                                  setShowBankDropdown(true);
                                  setSelectedBank(null);
                                }}
                                onFocus={() => {
                                  setBankSuggestions(INDIAN_BANKS);
                                  setShowBankDropdown(true);
                                }}
                                onBlur={() => setTimeout(() => setShowBankDropdown(false), 200)}
                                required
                                className={`w-full py-3 bg-black border border-zinc-800 rounded-xl text-white text-sm outline-none focus:border-blue-500 transition-colors placeholder:text-zinc-600 ${selectedBank ? 'pl-12' : 'px-4'}`}
                              />
                            </div>
                            
                            {/* Bank Dropdown */}
                            {showBankDropdown && bankSuggestions.length > 0 && (
                              <div className="absolute z-50 w-full mt-1 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto">
                                {bankSuggestions.map((bank, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800 transition-colors text-left border-b border-zinc-800 last:border-0"
                                    onClick={() => {
                                      setFormData(prev => ({ ...prev, bankName: bank.name }));
                                      setSelectedBank(bank);
                                      setShowBankDropdown(false);
                                    }}
                                  >
                                    <div className={`w-10 h-10 rounded-full ${bank.color} flex items-center justify-center text-white text-xs font-bold`}>
                                      {bank.code.slice(0, 3)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm text-white font-medium truncate">{bank.name}</p>
                                      <p className="text-xs text-zinc-500">{bank.code}</p>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* IFSC Code */}
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
                                className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-xl text-white text-sm outline-none focus:border-blue-500 transition-colors placeholder:text-zinc-600"
                              />
                              {verifyingIfsc && (
                                <FaSpinner className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 animate-spin" />
                              )}
                            </div>
                            {bankInfo?.branchName && (
                              <p className="text-xs text-emerald-400 mt-1.5 flex items-center gap-1">
                                <FaCheck /> {bankInfo.bankName} - {bankInfo.branchName}
                              </p>
                            )}
                          </div>

                          {/* Account Numbers */}
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
                                className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-xl text-white text-sm outline-none focus:border-blue-500 transition-colors placeholder:text-zinc-600"
                              />
                            </div>
                            <div>
                              <label className="flex items-center gap-2 text-xs font-medium text-zinc-400 mb-2">
                                <FaMoneyBillWave className="text-emerald-400" />
                                Confirm Account
                              </label>
                              <input
                                type="text"
                                placeholder="Re-enter account number"
                                value={formData.confirmAccountNumber}
                                onChange={(e) => setFormData(prev => ({ ...prev, confirmAccountNumber: e.target.value.replace(/\D/g, '') }))}
                                required
                                className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-xl text-white text-sm outline-none focus:border-blue-500 transition-colors placeholder:text-zinc-600"
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
                              className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-xl text-white text-sm outline-none focus:border-blue-500 transition-colors placeholder:text-zinc-600"
                            />
                          </div>
                        </motion.div>
                      )}

                      {/* Step 2: Documents */}
                      {currentStep === 2 && (
                        <motion.div
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="space-y-4"
                        >
                          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                            <FaFileAlt className="text-purple-400" />
                            Document Verification
                          </h3>
                          
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
                              <label htmlFor="id_proof_upload" className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all ${files.id_proof ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-zinc-700 hover:border-blue-500'}`}>
                                {files.id_proof ? (
                                  <>
                                    <FaCheckCircle className="text-emerald-500 text-3xl mb-3" />
                                    <span className="text-sm text-emerald-400 font-medium">{files.id_proof.name}</span>
                                    <span className="text-[10px] text-zinc-500 mt-1">Click to change</span>
                                  </>
                                ) : (
                                  <>
                                    <FaCloudUploadAlt className="text-zinc-400 text-3xl mb-3" />
                                    <span className="text-sm text-white font-medium">Identity Proof</span>
                                    <span className="text-xs text-zinc-500 mt-1">PAN / Aadhar • Required</span>
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
                              <label htmlFor="bank_proof_upload" className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all ${files.bank_proof ? 'border-blue-500/50 bg-blue-500/5' : 'border-zinc-700 hover:border-blue-500'}`}>
                                {files.bank_proof ? (
                                  <>
                                    <FaCheckCircle className="text-blue-500 text-3xl mb-3" />
                                    <span className="text-sm text-blue-400 font-medium">{files.bank_proof.name}</span>
                                    <span className="text-[10px] text-zinc-500 mt-1">Click to change</span>
                                  </>
                                ) : (
                                  <>
                                    <FaUniversity className="text-zinc-400 text-3xl mb-3" />
                                    <span className="text-sm text-white font-medium">Bank Proof</span>
                                    <span className="text-xs text-zinc-500 mt-1">Cheque / Statement • Optional</span>
                                  </>
                                )}
                              </label>
                            </div>
                          </div>

                          {/* Security Note */}
                          <div className="flex items-center gap-2 text-xs text-zinc-500 px-4 py-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                            <FaLock className="text-emerald-400" />
                            <span>Your documents are encrypted with bank-grade security</span>
                          </div>
                        </motion.div>
                      )}

                      {/* Step 3: Address */}
                      {currentStep === 3 && (
                        <motion.div
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="space-y-4"
                        >
                          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                            <FaMapMarkerAlt className="text-rose-400" />
                            Address & Tax Details
                          </h3>
                          
                          {/* Street */}
                          <div>
                            <label className="text-xs text-zinc-400 block mb-2">Street Address</label>
                            <input
                              type="text"
                              placeholder="House No, Street, Area"
                              value={formData.street}
                              onChange={(e) => setFormData(prev => ({...prev, street: e.target.value}))}
                              required
                              className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-xl text-white text-sm outline-none focus:border-blue-500 transition-colors"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-xs text-zinc-400 block mb-2">City</label>
                              <input
                                type="text"
                                value={formData.city}
                                onChange={(e) => setFormData(prev => ({...prev, city: e.target.value}))}
                                required
                                className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-xl text-white text-sm outline-none focus:border-blue-500 transition-colors"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-zinc-400 block mb-2">State</label>
                              <input
                                type="text"
                                value={formData.state}
                                onChange={(e) => setFormData(prev => ({...prev, state: e.target.value}))}
                                required
                                className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-xl text-white text-sm outline-none focus:border-blue-500 transition-colors"
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
                                className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-xl text-white text-sm outline-none focus:border-blue-500 transition-colors"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-zinc-400 block mb-2">GSTIN (Optional)</label>
                              <input
                                type="text"
                                value={formData.gstin}
                                onChange={(e) => setFormData(prev => ({...prev, gstin: e.target.value.toUpperCase()}))}
                                className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-xl text-white text-sm outline-none focus:border-blue-500 transition-colors"
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* Navigation Buttons */}
                      <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-800">
                        <button 
                          type="button"
                          onClick={prevStep}
                          disabled={currentStep === 1}
                          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                            currentStep === 1 
                              ? 'text-zinc-600 cursor-not-allowed' 
                              : 'text-white bg-zinc-800 hover:bg-zinc-700'
                          }`}
                        >
                          <FaArrowLeft className="text-xs" />
                          Back
                        </button>
                        
                        {currentStep < 3 ? (
                          <button 
                            type="button"
                            onClick={nextStep}
                            className="flex items-center gap-2 px-6 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-semibold hover:bg-blue-600 transition-all"
                          >
                            Next
                            <FaArrowRight className="text-xs" />
                          </button>
                        ) : (
                          <button 
                            type="submit"
                            disabled={submitting}
                            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                          >
                            {submitting ? (
                              <>
                                <FaSpinner className="animate-spin" />
                                Submitting...
                              </>
                            ) : (
                              <>
                                <FaCheck />
                                Submit KYC
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Why KYC Section */}
              {!showForm && (
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
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default KYCDetailsPage;
