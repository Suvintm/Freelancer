// ClientKYCPage.jsx - Client KYC Verification Page with Premium UI
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import { 
  FaUser, FaPhone, FaUniversity, FaShieldAlt, FaCheckCircle, 
  FaArrowRight, FaArrowLeft, FaSpinner, FaExclamationTriangle,
  FaLock, FaCreditCard, FaIdCard, FaInfoCircle, FaCloudUploadAlt, FaFileAlt
} from 'react-icons/fa';
import { HiSparkles, HiBadgeCheck } from 'react-icons/hi';
import { toast } from "react-toastify";
import KYCRequiredModal from "../components/KYCRequiredModal";
import ClientSidebar from "../components/ClientSidebar.jsx";
import ClientNavbar from "../components/ClientNavbar.jsx";
import { useAppContext } from '../context/AppContext';
import './ClientKYCPage.css';

const ClientKYCPage = () => {
  const { backendURL, user, setUser } = useAppContext();
  const navigate = useNavigate();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [existingKYC, setExistingKYC] = useState(null);
  
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    bankAccountNumber: '',
    confirmAccountNumber: '',
    ifscCode: '',
    bankName: '',
    accountHolderName: '',
    accountType: 'savings',
    upiId: '',
    panNumber: '',
    preferredRefundMethod: 'original_payment',
    termsAccepted: false,
    street: '',
    city: '',
    state: '',
    postalCode: '',
    gstin: '',
  });

  const [files, setFiles] = useState({
    id_proof: null,
    bank_proof: null
  });

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) return toast.error("Max file size is 5MB");
      setFiles(prev => ({ ...prev, [type]: file }));
      // Clear error
      if (errors[type]) setErrors(prev => ({ ...prev, [type]: null }));
    }
  };

  const [errors, setErrors] = useState({});

  // Fetch existing KYC on mount
  useEffect(() => {
    fetchExistingKYC();
  }, []);

  const fetchExistingKYC = async () => {
    try {
      if (!user?.token) return; // Wait for auth
      
      setChecking(true);
      const res = await axios.get(`${backendURL}/api/client-kyc/my`, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      
      if (res.data.kycExists) {
        setExistingKYC(res.data.kyc);
        // Pre-fill form with existing data
        setFormData(prev => ({
          ...prev,
          fullName: res.data.kyc.fullName || '',
          phone: res.data.kyc.phone || '',
          preferredRefundMethod: res.data.kyc.preferredRefundMethod || 'original_payment',
        }));
      }
    } catch (err) {
      console.error('Failed to fetch KYC:', err);
    } finally {
      setChecking(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateStep = (stepNum) => {
    const newErrors = {};
    
    if (stepNum === 1) {
      if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
      if (!formData.phone.match(/^[6-9]\d{9}$/)) newErrors.phone = 'Enter valid 10-digit phone';
      
      // Address Validation
      if (!formData.street.trim()) newErrors.street = 'Street address is required';
      if (!formData.city.trim()) newErrors.city = 'City is required';
      if (!formData.state.trim()) newErrors.state = 'State is required';
      if (!formData.postalCode.match(/^\d{6}$/)) newErrors.postalCode = 'Enter valid 6-digit PIN code';
    }
    
    if (stepNum === 2) {
      if (formData.preferredRefundMethod === 'bank_transfer') {
        if (!formData.bankAccountNumber) newErrors.bankAccountNumber = 'Account number required';
        if (formData.bankAccountNumber !== formData.confirmAccountNumber) {
          newErrors.confirmAccountNumber = 'Account numbers do not match';
        }
        if (!formData.ifscCode.match(/^[A-Z]{4}0[A-Z0-9]{6}$/)) {
          newErrors.ifscCode = 'Enter valid IFSC code (e.g., SBIN0001234)';
        }
        if (!formData.accountHolderName) newErrors.accountHolderName = 'Account holder name required';
      }
      if (formData.preferredRefundMethod === 'upi') {
        if (!formData.upiId.match(/^[\w.-]+@[\w]+$/)) {
          newErrors.upiId = 'Enter valid UPI ID (e.g., name@upi)';
        }
      }
    }
    
    if (stepNum === 3) {
      if (!files.id_proof) newErrors.id_proof = 'Identity proof is required';
      if (formData.preferredRefundMethod === 'bank_transfer' && !files.bank_proof) {
         newErrors.bank_proof = 'Bank proof is required for bank transfer';
      }
    }

    if (stepNum === 4) {
      if (!formData.termsAccepted) newErrors.termsAccepted = 'Please accept the terms';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;
    
    try {
      setLoading(true);

      const data = new FormData();
      Object.keys(formData).forEach(key => data.append(key, formData[key]));
      if (files.id_proof) data.append("id_proof", files.id_proof);
      if (files.bank_proof) data.append("bank_proof", files.bank_proof);
      
      const res = await axios.post(`${backendURL}/api/client-kyc`, data, {
        headers: { 
          Authorization: `Bearer ${user?.token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (res.data.success) {
        toast.success('KYC submitted successfully!');
        // Update user context
        if (setUser) {
          setUser(prev => ({ ...prev, clientKycStatus: 'pending' }));
        }
        // Update new status and kycData states
        setStatus('pending');
        setKycData({
           status: 'pending',
           submittedAt: new Date(),
           ...formData
        });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit KYC');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div 
            key="step1"
            className="kyc-page__form-step"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <h2><FaUser /> Personal Information</h2>
            
            <div className="kyc-page__field">
              <label>Full Legal Name</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="As per bank account"
                className={errors.fullName ? 'kyc-page__input--error' : ''}
              />
              {errors.fullName && <span className="kyc-page__error">{errors.fullName}</span>}
            </div>

            <div className="kyc-page__field">
              <label>Phone Number</label>
              <div className="kyc-page__phone-input">
                <span className="kyc-page__phone-prefix">+91</span>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  className={errors.phone ? 'kyc-page__input--error' : ''}
                />
              </div>
              {errors.phone && <span className="kyc-page__error">{errors.phone}</span>}
            </div>

            <div className="kyc-page__field">
              <label>PAN Number (Optional)</label>
              <input
                type="text"
                name="panNumber"
                value={formData.panNumber}
                onChange={handleChange}
                placeholder="ABCDE1234F"
                maxLength={10}
                style={{ textTransform: 'uppercase' }}
              />
              <span className="kyc-page__hint">
                <FaInfoCircle /> Required for transactions above ₹50,000
              </span>
            </div>

            {/* Address Section */}
            <div className="kyc-page__section-divider" style={{margin:'2rem 0', borderTop:'1px solid #e2e8f0'}}></div>
            <h3 style={{fontSize:'1.1rem', marginBottom:'1.5rem', color:'#334155'}}>Address & Tax Details</h3>

            <div className="kyc-page__field">
              <label>Street Address</label>
              <input
                type="text"
                name="street"
                value={formData.street}
                onChange={handleChange}
                placeholder="e.g. 123, Main Street, Area"
                className={errors.street ? 'kyc-page__input--error' : ''}
              />
              {errors.street && <span className="kyc-page__error">{errors.street}</span>}
            </div>

            <div className="kyc-page__field-row" style={{display:'flex', gap:'1rem'}}>
              <div className="kyc-page__field" style={{flex:1}}>
                <label>City</label>
                <input type="text" name="city" value={formData.city} onChange={handleChange} className={errors.city ? 'kyc-page__input--error' : ''} />
                {errors.city && <span className="kyc-page__error">{errors.city}</span>}
              </div>
              <div className="kyc-page__field" style={{flex:1}}>
                <label>State</label>
                <input type="text" name="state" value={formData.state} onChange={handleChange} className={errors.state ? 'kyc-page__input--error' : ''} />
                {errors.state && <span className="kyc-page__error">{errors.state}</span>}
              </div>
            </div>

            <div className="kyc-page__field-row" style={{display:'flex', gap:'1rem'}}>
              <div className="kyc-page__field" style={{flex:1}}>
                <label>PIN Code</label>
                <input type="text" name="postalCode" value={formData.postalCode} onChange={handleChange} maxLength={6} className={errors.postalCode ? 'kyc-page__input--error' : ''} />
                {errors.postalCode && <span className="kyc-page__error">{errors.postalCode}</span>}
              </div>
              <div className="kyc-page__field" style={{flex:1}}>
                <label>GSTIN (Optional)</label>
                <input type="text" name="gstin" value={formData.gstin} onChange={handleChange} placeholder="GST Number" style={{ textTransform: 'uppercase' }} />
              </div>
            </div>

            <div className="kyc-page__actions">
              <button className="kyc-page__btn kyc-page__btn--primary" onClick={nextStep}>
                Continue <FaArrowRight />
              </button>
            </div>
          </motion.div>
        );
      case 2:
        return (
          <motion.div 
            key="step2"
            className="kyc-page__form-step"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <h2><FaUniversity /> Refund Account Details</h2>
            
            <div className="kyc-page__field">
              <label>Preferred Refund Method</label>
              <div className="kyc-page__radio-group">
                <label className={`kyc-page__radio ${formData.preferredRefundMethod === 'original_payment' ? 'kyc-page__radio--selected' : ''}`}>
                  <input
                    type="radio"
                    name="preferredRefundMethod"
                    value="original_payment"
                    checked={formData.preferredRefundMethod === 'original_payment'}
                    onChange={handleChange}
                  />
                  <FaCreditCard />
                  <span>Original Payment Method</span>
                </label>
                <label className={`kyc-page__radio ${formData.preferredRefundMethod === 'bank_transfer' ? 'kyc-page__radio--selected' : ''}`}>
                  <input
                    type="radio"
                    name="preferredRefundMethod"
                    value="bank_transfer"
                    checked={formData.preferredRefundMethod === 'bank_transfer'}
                    onChange={handleChange}
                  />
                  <FaUniversity />
                  <span>Bank Account</span>
                </label>
                <label className={`kyc-page__radio ${formData.preferredRefundMethod === 'upi' ? 'kyc-page__radio--selected' : ''}`}>
                  <input
                    type="radio"
                    name="preferredRefundMethod"
                    value="upi"
                    checked={formData.preferredRefundMethod === 'upi'}
                    onChange={handleChange}
                  />
                  <FaIdCard />
                  <span>UPI</span>
                </label>
              </div>
            </div>

            {formData.preferredRefundMethod === 'bank_transfer' && (
              <>
                <div className="kyc-page__field">
                  <label>Account Holder Name</label>
                  <input
                    type="text"
                    name="accountHolderName"
                    value={formData.accountHolderName}
                    onChange={handleChange}
                    placeholder="Name as per bank"
                    className={errors.accountHolderName ? 'kyc-page__input--error' : ''}
                  />
                  {errors.accountHolderName && <span className="kyc-page__error">{errors.accountHolderName}</span>}
                </div>
                <div className="kyc-page__field">
                  <label>Bank Account Number</label>
                  <input
                    type="text"
                    name="bankAccountNumber"
                    value={formData.bankAccountNumber}
                    onChange={handleChange}
                    placeholder="Account Number"
                    className={errors.bankAccountNumber ? 'kyc-page__input--error' : ''}
                  />
                  {errors.bankAccountNumber && <span className="kyc-page__error">{errors.bankAccountNumber}</span>}
                </div>
                <div className="kyc-page__field">
                  <label>Confirm Account Number</label>
                  <input
                    type="text"
                    name="confirmAccountNumber"
                    value={formData.confirmAccountNumber}
                    onChange={handleChange}
                    placeholder="Confirm Account Number"
                    className={errors.confirmAccountNumber ? 'kyc-page__input--error' : ''}
                  />
                  {errors.confirmAccountNumber && <span className="kyc-page__error">{errors.confirmAccountNumber}</span>}
                </div>
                <div className="kyc-page__field">
                  <label>IFSC Code</label>
                  <input
                    type="text"
                    name="ifscCode"
                    value={formData.ifscCode}
                    onChange={handleChange}
                    placeholder="e.g., SBIN0001234"
                    maxLength={11}
                    style={{ textTransform: 'uppercase' }}
                    className={errors.ifscCode ? 'kyc-page__input--error' : ''}
                  />
                  {errors.ifscCode && <span className="kyc-page__error">{errors.ifscCode}</span>}
                </div>
                <div className="kyc-page__field">
                  <label>Bank Name (Optional)</label>
                  <input
                    type="text"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleChange}
                    placeholder="e.g., State Bank of India"
                  />
                </div>
                <div className="kyc-page__field">
                  <label>Account Type</label>
                  <select
                    name="accountType"
                    value={formData.accountType}
                    onChange={handleChange}
                  >
                    <option value="savings">Savings</option>
                    <option value="current">Current</option>
                  </select>
                </div>
              </>
            )}

            {formData.preferredRefundMethod === 'upi' && (
              <div className="kyc-page__field">
                <label>UPI ID</label>
                <input
                  type="text"
                  name="upiId"
                  value={formData.upiId}
                  onChange={handleChange}
                  placeholder="yourname@bankupi"
                  className={errors.upiId ? 'kyc-page__input--error' : ''}
                />
                {errors.upiId && <span className="kyc-page__error">{errors.upiId}</span>}
              </div>
            )}

            <div className="kyc-page__actions">
              <button className="kyc-page__btn kyc-page__btn--secondary" onClick={prevStep}>
                <FaArrowLeft /> Back
              </button>
              <button className="kyc-page__btn kyc-page__btn--primary" onClick={nextStep}>
                Continue <FaArrowRight />
              </button>
            </div>
          </motion.div>
        );
      case 3:
        return (
          <motion.div 
            key="step3"
            className="kyc-page__form-step"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <h2><FaCloudUploadAlt /> Upload Documents</h2>
            <p className="kyc-page__hint">
              <FaInfoCircle /> Accepted formats: JPG, PNG, PDF (Max 5MB per file)
            </p>

            <div className="kyc-page__field">
              <label>Identity Proof (e.g., Aadhaar, Passport, Driving License)</label>
              <div className={`kyc-page__file-upload ${errors.id_proof ? 'kyc-page__file-upload--error' : ''}`}>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => handleFileChange(e, 'id_proof')}
                />
                {files.id_proof ? (
                  <span><FaFileAlt /> {files.id_proof.name}</span>
                ) : (
                  <span><FaCloudUploadAlt /> Choose File</span>
                )}
              </div>
              {errors.id_proof && <span className="kyc-page__error">{errors.id_proof}</span>}
            </div>

            {formData.preferredRefundMethod === 'bank_transfer' && (
              <div className="kyc-page__field">
                <label>Bank Proof (e.g., Bank Statement, Cancelled Cheque)</label>
                <div className={`kyc-page__file-upload ${errors.bank_proof ? 'kyc-page__file-upload--error' : ''}`}>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={(e) => handleFileChange(e, 'bank_proof')}
                  />
                  {files.bank_proof ? (
                    <span><FaFileAlt /> {files.bank_proof.name}</span>
                  ) : (
                    <span><FaCloudUploadAlt /> Choose File</span>
                  )}
                </div>
                {errors.bank_proof && <span className="kyc-page__error">{errors.bank_proof}</span>}
              </div>
            )}

            <div className="kyc-page__actions">
              <button className="kyc-page__btn kyc-page__btn--secondary" onClick={prevStep}>
                <FaArrowLeft /> Back
              </button>
              <button className="kyc-page__btn kyc-page__btn--primary" onClick={nextStep}>
                Continue <FaArrowRight />
              </button>
            </div>
          </motion.div>
        );
      case 4:
        return (
          <motion.div 
            key="step4"
            className="kyc-page__form-step"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <h2><FaShieldAlt /> Review & Confirm</h2>
            <p className="kyc-page__hint">Please review your details before submitting.</p>

            <div className="kyc-page__summary">
              <h3>Personal Details</h3>
              <p><strong>Full Name:</strong> {formData.fullName}</p>
              <p><strong>Phone:</strong> {formData.phone}</p>
              <p><strong>Address:</strong> {formData.street}, {formData.city}, {formData.state} - {formData.postalCode}</p>
              {formData.panNumber && <p><strong>PAN:</strong> {formData.panNumber}</p>}
              {formData.gstin && <p><strong>GSTIN:</strong> {formData.gstin}</p>}

              <h3>Refund Details</h3>
              <p><strong>Method:</strong> {formData.preferredRefundMethod.replace('_', ' ').toUpperCase()}</p>
              {formData.preferredRefundMethod === 'bank_transfer' && (
                <>
                  <p><strong>Account Holder:</strong> {formData.accountHolderName}</p>
                  <p><strong>Account No:</strong> {formData.bankAccountNumber}</p>
                  <p><strong>IFSC:</strong> {formData.ifscCode}</p>
                </>
              )}
              {formData.preferredRefundMethod === 'upi' && (
                <p><strong>UPI ID:</strong> {formData.upiId}</p>
              )}

              <h3>Documents</h3>
              <p><strong>Identity Proof:</strong> {files.id_proof ? files.id_proof.name : 'Not uploaded'}</p>
              {formData.preferredRefundMethod === 'bank_transfer' && (
                <p><strong>Bank Proof:</strong> {files.bank_proof ? files.bank_proof.name : 'Not uploaded'}</p>
              )}
            </div>

            <div className="kyc-page__field kyc-page__terms">
              <label>
                <input
                  type="checkbox"
                  name="termsAccepted"
                  checked={formData.termsAccepted}
                  onChange={handleChange}
                />
                I agree to the <a href="/terms" target="_blank" rel="noopener noreferrer">Terms & Conditions</a> and confirm all information provided is accurate.
              </label>
              {errors.termsAccepted && <span className="kyc-page__error">{errors.termsAccepted}</span>}
            </div>

            <div className="kyc-page__actions">
              <button className="kyc-page__btn kyc-page__btn--secondary" onClick={prevStep}>
                <FaArrowLeft /> Back
              </button>
              <button 
                className="kyc-page__btn kyc-page__btn--primary" 
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? <FaSpinner className="kyc-page__spinner--small" /> : <FaCheckCircle />}
                {loading ? 'Submitting...' : 'Submit KYC'}
              </button>
            </div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] text-white">
        <div className="kyc-page__spinner">
          <FaSpinner />
        </div>
      </div>
    );
  }

  const steps = [
    { num: 1, label: 'Personal', icon: FaUser },
    { num: 2, label: 'Bank Info', icon: FaUniversity },
    { num: 3, label: 'Documents', icon: FaCloudUploadAlt },
    { num: 4, label: 'Confirm', icon: FaShieldAlt },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#050509] text-white">
      <ClientSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <ClientNavbar onMenuClick={() => setSidebarOpen(true)} />
      
      <main className="flex-1 flex flex-col md:ml-64 transition-all duration-300">
        <div className="kyc-page__container p-4 md:p-8 mt-16 md:mt-0">
          {/* Header */}
          <div className="kyc-page__header">
            <div className="kyc-page__header-icon">
              <FaShieldAlt />
            </div>
            <h1>Client Verification</h1>
            <p>Verify your identity to enable refunds and higher limits.</p>
          </div>

          {/* Content based on status */}
          {status === "verified" ? (
            <div className="kyc-page__verified">
              <div className="kyc-page__verified-icon">
                <FaCheckCircle />
              </div>
              <h1>Verification Complete</h1>
              <p>Your account is fully verified and refund-ready.</p>
              
              <div className="kyc-page__verified-details">
                <div className="kyc-page__verified-item">
                  <FaUser />
                  <span>{kycData?.fullName}</span>
                </div>
                {kycData?.displayAccountInfo?.bankAccount && (
                  <div className="kyc-page__verified-item">
                    <FaUniversity />
                    <span>{kycData.displayAccountInfo.bankAccount}</span>
                  </div>
                )}
                {kycData?.displayAccountInfo?.upi && (
                   <div className="kyc-page__verified-item">
                    <FaCreditCard />
                     <span>{kycData.displayAccountInfo.upi}</span>
                   </div>
                )}
              </div>

              <p className="text-sm text-gray-500">
                Verified on {new Date(kycData?.verifiedAt).toLocaleDateString()}
              </p>
            </div>
          ) : status === "pending" || status === "under_review" ? (
            <div className="kyc-page__pending">
              <div className="kyc-page__pending-icon">
                <div className="kyc-page__pending-spinner">
                  <FaClock />
                </div>
              </div>
              <h1>Verification in Progress</h1>
              <p>We are reviewing your documents. This usually takes 24-48 hours.</p>
              
              <div className="kyc-page__pending-timeline">
                <div className="kyc-page__timeline-item kyc-page__timeline-item--done">
                  <FaCheckCircle />
                  <span>Submitted</span>
                </div>
                <div className="kyc-page__timeline-item kyc-page__timeline-item--active">
                  <FaSpinner className="kyc-page__mini-spinner" />
                  <span>Reviewing</span>
                </div>
                <div className="kyc-page__timeline-item">
                  <FaCheckCircle />
                  <span>Verified</span>
                </div>
              </div>

              <p className="kyc-page__pending-note">
                You will be notified via email once the process is complete.
              </p>
            </div>
          ) : status === "rejected" ? (
            <div className="kyc-page__rejected">
              <div className="kyc-page__rejected-icon">
                <FaExclamationTriangle />
              </div>
              <h1>Verification Failed</h1>
              
              {kycData?.rejectionReason && (
                <div className="kyc-page__rejected-reason">
                  <strong>Reason:</strong> {kycData.rejectionReason}
                </div>
              )}
              
              <p>Please fix the issues and submit again.</p>
              
              <button 
                onClick={() => setStatus("not_started")}
                className="kyc-page__btn kyc-page__btn--primary"
              >
                Try Again
              </button>
            </div>
          ) : (
            /* Registration Form */
            <div className="kyc-page__form-wrapper">
              {/* Progress Steps */}
              <div className="kyc-page__steps">
                {steps.map((s, idx) => {
              const StepIcon = s.icon;
              const isActive = step === s.num;
              const isDone = step > s.num;
              
              return (
                <React.Fragment key={s.num}>
                  <div className={`kyc-page__step ${isActive ? 'kyc-page__step--active' : ''} ${isDone ? 'kyc-page__step--done' : ''}`}>
                    <div className="kyc-page__step-circle">
                      {isDone ? <FaCheckCircle /> : <StepIcon />}
                    </div>
                    <span className="kyc-page__step-label">{s.label}</span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={`kyc-page__step-line ${isDone ? 'kyc-page__step-line--done' : ''}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Form Container */}
          <motion.div 
            className="kyc-page__form-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <AnimatePresence mode="wait">
              
              {/* Step 1: Personal Info */}
              {step === 1 && (
                <motion.div 
                  key="step1"
                  className="kyc-page__form-step"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <h2><FaUser /> Personal Information</h2>
                  
                  <div className="kyc-page__field">
                    <label>Full Legal Name</label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="As per bank account"
                      className={errors.fullName ? 'kyc-page__input--error' : ''}
                    />
                    {errors.fullName && <span className="kyc-page__error">{errors.fullName}</span>}
                  </div>

                  <div className="kyc-page__field">
                    <label>Phone Number</label>
                    <div className="kyc-page__phone-input">
                      <span className="kyc-page__phone-prefix">+91</span>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="10-digit mobile number"
                        maxLength={10}
                        className={errors.phone ? 'kyc-page__input--error' : ''}
                      />
                    </div>
                    {errors.phone && <span className="kyc-page__error">{errors.phone}</span>}
                  </div>

                  <div className="kyc-page__field">
                    <label>PAN Number (Optional)</label>
                    <input
                      type="text"
                      name="panNumber"
                      value={formData.panNumber}
                      onChange={handleChange}
                      placeholder="ABCDE1234F"
                      maxLength={10}
                      style={{ textTransform: 'uppercase' }}
                    />
                    <span className="kyc-page__hint">
                      <FaInfoCircle /> Required for transactions above ₹50,000
                    </span>
                  </div>

                  {/* Address Section */}
                  <div className="kyc-page__section-divider" style={{margin:'2rem 0', borderTop:'1px solid #e2e8f0'}}></div>
                  <h3 style={{fontSize:'1.1rem', marginBottom:'1.5rem', color:'#334155'}}>Address & Tax Details</h3>

                  <div className="kyc-page__field">
                    <label>Street Address</label>
                    <input
                      type="text"
                      name="street"
                      value={formData.street}
                      onChange={handleChange}
                      placeholder="e.g. 123, Main Street, Area"
                      className={errors.street ? 'kyc-page__input--error' : ''}
                    />
                    {errors.street && <span className="kyc-page__error">{errors.street}</span>}
                  </div>

                  <div className="kyc-page__field-row" style={{display:'flex', gap:'1rem'}}>
                    <div className="kyc-page__field" style={{flex:1}}>
                      <label>City</label>
                      <input type="text" name="city" value={formData.city} onChange={handleChange} className={errors.city ? 'kyc-page__input--error' : ''} />
                      {errors.city && <span className="kyc-page__error">{errors.city}</span>}
                    </div>
                    <div className="kyc-page__field" style={{flex:1}}>
                      <label>State</label>
                      <input type="text" name="state" value={formData.state} onChange={handleChange} className={errors.state ? 'kyc-page__input--error' : ''} />
                      {errors.state && <span className="kyc-page__error">{errors.state}</span>}
                    </div>
                  </div>

                  <div className="kyc-page__field-row" style={{display:'flex', gap:'1rem'}}>
                    <div className="kyc-page__field" style={{flex:1}}>
                      <label>PIN Code</label>
                      <input type="text" name="postalCode" value={formData.postalCode} onChange={handleChange} maxLength={6} className={errors.postalCode ? 'kyc-page__input--error' : ''} />
                      {errors.postalCode && <span className="kyc-page__error">{errors.postalCode}</span>}
                    </div>
                    <div className="kyc-page__field" style={{flex:1}}>
                      <label>GSTIN (Optional)</label>
                      <input type="text" name="gstin" value={formData.gstin} onChange={handleChange} placeholder="GST Number" style={{ textTransform: 'uppercase' }} />
                    </div>
                  </div>

                  <div className="kyc-page__actions">
                    <button className="kyc-page__btn kyc-page__btn--primary" onClick={nextStep}>
                      Continue <FaArrowRight />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Bank/UPI Details */}
              {step === 2 && (
                <motion.div 
                  key="step2"
                  className="kyc-page__form-step"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <h2><FaUniversity /> Refund Account Details</h2>
                  
                  <div className="kyc-page__field">
                    <label>Preferred Refund Method</label>
                    <div className="kyc-page__radio-group">
                      <label className={`kyc-page__radio ${formData.preferredRefundMethod === 'original_payment' ? 'kyc-page__radio--selected' : ''}`}>
                        <input
                          type="radio"
                          name="preferredRefundMethod"
                          value="original_payment"
                          checked={formData.preferredRefundMethod === 'original_payment'}
                          onChange={handleChange}
                        />
                        <FaCreditCard />
                        <span>Original Payment Method</span>
                      </label>
                      <label className={`kyc-page__radio ${formData.preferredRefundMethod === 'bank_transfer' ? 'kyc-page__radio--selected' : ''}`}>
                        <input
                          type="radio"
                          name="preferredRefundMethod"
                          value="bank_transfer"
                          checked={formData.preferredRefundMethod === 'bank_transfer'}
                          onChange={handleChange}
                        />
                        <FaUniversity />
                        <span>Bank Account</span>
                      </label>
                      <label className={`kyc-page__radio ${formData.preferredRefundMethod === 'upi' ? 'kyc-page__radio--selected' : ''}`}>
                        <input
                          type="radio"
                          name="preferredRefundMethod"
                          value="upi"
                          checked={formData.preferredRefundMethod === 'upi'}
                          onChange={handleChange}
                        />
                        <FaIdCard />
                        <span>UPI</span>
                      </label>
                    </div>
                  </div>

                  {formData.preferredRefundMethod === 'bank_transfer' && (
                    <>
                      <div className="kyc-page__field">
                        <label>Account Holder Name</label>
                        <input
                          type="text"
                          name="accountHolderName"
                          value={formData.accountHolderName}
                          onChange={handleChange}
                          placeholder="Name as per bank"
                          style={{ textTransform: 'uppercase' }}
                          className={errors.accountHolderName ? 'kyc-page__input--error' : ''}
                        />
                        {errors.accountHolderName && <span className="kyc-page__error">{errors.accountHolderName}</span>}
                      </div>

                      <div className="kyc-page__field-row">
                        <div className="kyc-page__field">
                          <label>Account Number</label>
                          <input
                            type="password"
                            name="bankAccountNumber"
                            value={formData.bankAccountNumber}
                            onChange={handleChange}
                            placeholder="Enter account number"
                            className={errors.bankAccountNumber ? 'kyc-page__input--error' : ''}
                          />
                          {errors.bankAccountNumber && <span className="kyc-page__error">{errors.bankAccountNumber}</span>}
                        </div>
                        
                        <div className="kyc-page__field">
                          <label>Confirm Account Number</label>
                          <input
                            type="text"
                            name="confirmAccountNumber"
                            value={formData.confirmAccountNumber}
                            onChange={handleChange}
                            placeholder="Re-enter account number"
                            className={errors.confirmAccountNumber ? 'kyc-page__input--error' : ''}
                          />
                          {errors.confirmAccountNumber && <span className="kyc-page__error">{errors.confirmAccountNumber}</span>}
                        </div>
                      </div>

                      <div className="kyc-page__field-row">
                        <div className="kyc-page__field">
                          <label>IFSC Code</label>
                          <input
                            type="text"
                            name="ifscCode"
                            value={formData.ifscCode}
                            onChange={handleChange}
                            placeholder="e.g., SBIN0001234"
                            maxLength={11}
                            style={{ textTransform: 'uppercase' }}
                            className={errors.ifscCode ? 'kyc-page__input--error' : ''}
                          />
                          {errors.ifscCode && <span className="kyc-page__error">{errors.ifscCode}</span>}
                        </div>
                        
                        <div className="kyc-page__field">
                          <label>Bank Name</label>
                          <input
                            type="text"
                            name="bankName"
                            value={formData.bankName}
                            onChange={handleChange}
                            placeholder="e.g., State Bank of India"
                          />
                        </div>
                      </div>

                      <div className="kyc-page__field">
                        <label>Account Type</label>
                        <select name="accountType" value={formData.accountType} onChange={handleChange}>
                          <option value="savings">Savings Account</option>
                          <option value="current">Current Account</option>
                        </select>
                      </div>
                    </>
                  )}

                  {formData.preferredRefundMethod === 'upi' && (
                    <div className="kyc-page__field">
                      <label>UPI ID</label>
                      <input
                        type="text"
                        name="upiId"
                        value={formData.upiId}
                        onChange={handleChange}
                        placeholder="yourname@upi"
                        className={errors.upiId ? 'kyc-page__input--error' : ''}
                      />
                      {errors.upiId && <span className="kyc-page__error">{errors.upiId}</span>}
                    </div>
                  )}

                  {formData.preferredRefundMethod === 'original_payment' && (
                    <div className="kyc-page__info-box">
                      <FaInfoCircle />
                      <p>Refunds will be processed to the same payment method used during order. This is the fastest refund method.</p>
                    </div>
                  )}

                  <div className="kyc-page__actions">
                    <button className="kyc-page__btn kyc-page__btn--secondary" onClick={prevStep}>
                      <FaArrowLeft /> Back
                    </button>
                    <button className="kyc-page__btn kyc-page__btn--primary" onClick={nextStep}>
                      Continue <FaArrowRight />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Documents */}
              {step === 3 && (
                <motion.div 
                  key="step3"
                  className="kyc-page__form-step"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <h2><FaCloudUploadAlt /> Document Proofs</h2>
                  <p className="kyc-page__subtitle">Upload images of your documents to verify the details provided.</p>
                  
                  <div className="kyc-page__field">
                    <label>Identity Proof (Aadhar/PAN/Voter ID) <span style={{color:'red'}}>*</span></label>
                    <div className="kyc-page__file-input-wrapper">
                      <input 
                        type="file" 
                        onChange={(e) => handleFileChange(e, 'id_proof')} 
                        accept="image/*,.pdf" 
                        id="id_proof_upload"
                        className="kyc-page__file-input"
                        hidden
                      />
                      <label htmlFor="id_proof_upload" className={`kyc-page__file-label ${errors.id_proof ? 'kyc-page__input--error' : ''}`}>
                         {files.id_proof ? (
                           <div className="kyc-page__file-preview">
                              <FaFileAlt style={{color:'#10b981'}} />
                              <span>{files.id_proof.name}</span>
                              <span className="kyc-page__change-file">Change</span>
                           </div>
                         ) : (
                           <div className="kyc-page__file-placeholder">
                              <FaCloudUploadAlt />
                              <span>Click to upload Aadhar/PAN Card</span>
                              <span style={{fontSize:'12px', opacity:0.7}}>Max 5MB</span>
                           </div>
                         )}
                      </label>
                    </div>
                    {errors.id_proof && <span className="kyc-page__error">{errors.id_proof}</span>}
                  </div>

                  <div className="kyc-page__field">
                    <label>Bank Proof {formData.preferredRefundMethod === 'bank_transfer' ? <span style={{color:'red'}}>*</span> : '(Recommended)'}</label>
                    <div className="kyc-page__file-input-wrapper">
                      <input 
                        type="file" 
                        onChange={(e) => handleFileChange(e, 'bank_proof')} 
                        accept="image/*,.pdf" 
                        id="bank_proof_upload"
                        className="kyc-page__file-input"
                        hidden
                      />
                      <label htmlFor="bank_proof_upload" className={`kyc-page__file-label ${errors.bank_proof ? 'kyc-page__input--error' : ''}`}>
                         {files.bank_proof ? (
                           <div className="kyc-page__file-preview">
                              <FaFileAlt style={{color:'#3b82f6'}} />
                              <span>{files.bank_proof.name}</span>
                              <span className="kyc-page__change-file">Change</span>
                           </div>
                         ) : (
                           <div className="kyc-page__file-placeholder">
                              <FaCloudUploadAlt />
                              <span>Click to upload Cancelled Cheque / Statement</span>
                           </div>
                         )}
                      </label>
                    </div>
                    {errors.bank_proof && <span className="kyc-page__error">{errors.bank_proof}</span>}
                  </div>

                  <div className="kyc-page__actions">
                    <button className="kyc-page__btn kyc-page__btn--secondary" onClick={prevStep}>
                      <FaArrowLeft /> Back
                    </button>
                    <button className="kyc-page__btn kyc-page__btn--primary" onClick={nextStep}>
                      Continue <FaArrowRight />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Confirm */}
              {step === 4 && (
                <motion.div 
                  key="step4"
                  className="kyc-page__form-step"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <h2><FaShieldAlt /> Review & Confirm</h2>
                  
                  <div className="kyc-page__summary">
                    <div className="kyc-page__summary-section">
                      <h3>Personal Information</h3>
                      <div className="kyc-page__summary-row">
                        <span>Name</span>
                        <span>{formData.fullName}</span>
                      </div>
                      <div className="kyc-page__summary-row">
                        <span>Phone</span>
                        <span>+91 {formData.phone}</span>
                      </div>
                      {formData.panNumber && (
                        <div className="kyc-page__summary-row">
                          <span>PAN</span>
                          <span>{formData.panNumber.slice(0, 5)}****{formData.panNumber.slice(-1)}</span>
                        </div>
                      )}
                    </div>

                    <div className="kyc-page__summary-section">
                      <h3>Refund Details</h3>
                      <div className="kyc-page__summary-row">
                        <span>Method</span>
                        <span>{formData.preferredRefundMethod === 'original_payment' ? 'Original Payment' : formData.preferredRefundMethod === 'bank_transfer' ? 'Bank Account' : 'UPI'}</span>
                      </div>
                      {formData.preferredRefundMethod === 'bank_transfer' && (
                        <>
                          <div className="kyc-page__summary-row">
                            <span>Account</span>
                            <span>****{formData.bankAccountNumber.slice(-4)}</span>
                          </div>
                          <div className="kyc-page__summary-row">
                            <span>IFSC</span>
                            <span>{formData.ifscCode}</span>
                          </div>
                        </>
                      )}
                      {formData.preferredRefundMethod === 'upi' && (
                        <div className="kyc-page__summary-row">
                          <span>UPI ID</span>
                          <span>{formData.upiId}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="kyc-page__terms">
                    <label className={`kyc-page__checkbox ${errors.termsAccepted ? 'kyc-page__checkbox--error' : ''}`}>
                      <input
                        type="checkbox"
                        name="termsAccepted"
                        checked={formData.termsAccepted}
                        onChange={handleChange}
                      />
                      <span className="kyc-page__checkmark"></span>
                      <span>I confirm that the information provided is accurate and I agree to the <a href="/terms" target="_blank">Terms of Service</a> and <a href="/privacy" target="_blank">Privacy Policy</a></span>
                    </label>
                    {errors.termsAccepted && <span className="kyc-page__error">{errors.termsAccepted}</span>}
                  </div>

                  <div className="kyc-page__security-note">
                    <FaLock />
                    <span>Your data is encrypted and securely stored. We never share your banking details with third parties.</span>
                  </div>

                  <div className="kyc-page__actions">
                    <button className="kyc-page__btn kyc-page__btn--secondary" onClick={prevStep}>
                      <FaArrowLeft /> Back
                    </button>
                    <button 
                      className="kyc-page__btn kyc-page__btn--primary"
                      onClick={handleSubmit}
                      disabled={loading}
                    >
                      {loading ? <><FaSpinner className="kyc-page__btn-spinner" /> Submitting...</> : <>Submit for Verification <FaShieldAlt /></>}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 5: Success */}
              {step === 5 && (
                <motion.div 
                  key="step5"
                  className="kyc-page__form-step kyc-page__success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className="kyc-page__success-icon">
                    <HiSparkles />
                  </div>
                  <h2>KYC Submitted Successfully!</h2>
                  <p>Your verification request has been submitted. Our team will review your details within 24-48 hours.</p>
                  
                  <button 
                    className="kyc-page__btn kyc-page__btn--primary"
                    onClick={() => navigate('/client-home')}
                  >
                    Go to Dashboard <FaArrowRight />
                  </button>
                </motion.div>
              )}

          
            </AnimatePresence>
          </motion.div>
          </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default ClientKYCPage;
