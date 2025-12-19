// ClientKYCPage.jsx - Client KYC Verification Page with Premium UI
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
  FaUser, FaPhone, FaUniversity, FaShieldAlt, FaCheckCircle, 
  FaArrowRight, FaArrowLeft, FaSpinner, FaExclamationTriangle,
  FaLock, FaCreditCard, FaIdCard, FaInfoCircle
} from 'react-icons/fa';
import { HiSparkles, HiBadgeCheck } from 'react-icons/hi';
import { useAppContext } from '../context/AppContext';
import ClientNavbar from '../components/ClientNavbar';
import './ClientKYCPage.css';

const ClientKYCPage = () => {
  const { backendURL, user, setUser } = useAppContext();
  const navigate = useNavigate();
  
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
  });

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
    if (!validateStep(3)) return;
    
    try {
      setLoading(true);
      
      const res = await axios.post(`${backendURL}/api/client-kyc`, formData, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      
      if (res.data.success) {
        toast.success('KYC submitted successfully!');
        // Update user context
        if (setUser) {
          setUser(prev => ({ ...prev, clientKycStatus: 'pending' }));
        }
        // Immediately show the processing workflow (pending view)
        setExistingKYC({
           status: 'pending',
           submittedAt: new Date(),
           ...formData
        });
        // fetchExistingKYC(); // Background refresh
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit KYC');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="kyc-page">
        <ClientNavbar />
        <div className="kyc-page__loading">
          <FaSpinner className="kyc-page__spinner" />
          <span>Checking verification status...</span>
        </div>
      </div>
    );
  }

  // Already verified
  if (existingKYC?.status === 'verified') {
    return (
      <div className="kyc-page">
        <ClientNavbar />
        <main className="kyc-page__main">
          <motion.div 
            className="kyc-page__verified"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="kyc-page__verified-icon">
              <HiBadgeCheck />
            </div>
            <h1>KYC Verified</h1>
            <p>Your identity has been verified. You can now place orders and receive refunds securely.</p>
            
            <div className="kyc-page__verified-details">
              <div className="kyc-page__verified-item">
                <FaUser />
                <span>{existingKYC.fullName}</span>
              </div>
              <div className="kyc-page__verified-item">
                <FaPhone />
                <span>{existingKYC.phone}</span>
              </div>
              {existingKYC.displayAccountInfo?.bankAccount && (
                <div className="kyc-page__verified-item">
                  <FaUniversity />
                  <span>Account ending {existingKYC.displayAccountInfo.bankAccount.slice(-4)}</span>
                </div>
              )}
            </div>

            <button 
              className="kyc-page__btn kyc-page__btn--primary"
              onClick={() => navigate('/explore-editors')}
            >
              Browse Editors <FaArrowRight />
            </button>
          </motion.div>
        </main>
      </div>
    );
  }

  // Pending verification
  if (existingKYC?.status === 'pending' || existingKYC?.status === 'under_review') {
    return (
      <div className="kyc-page">
        <ClientNavbar />
        <main className="kyc-page__main">
          <motion.div 
            className="kyc-page__pending"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="kyc-page__pending-icon">
              <FaSpinner className="kyc-page__pending-spinner" />
            </div>
            <h1>Verification In Progress</h1>
            <p>Your KYC documents are being reviewed. This usually takes 24-48 hours.</p>
            
            <div className="kyc-page__pending-timeline">
              <div className="kyc-page__timeline-item kyc-page__timeline-item--done">
                <FaCheckCircle />
                <span>KYC Submitted</span>
              </div>
              <div className="kyc-page__timeline-item kyc-page__timeline-item--active">
                <FaSpinner className="kyc-page__mini-spinner" />
                <span>Under Review</span>
              </div>
              <div className="kyc-page__timeline-item">
                <FaCheckCircle />
                <span>Verified</span>
              </div>
            </div>

            <p className="kyc-page__pending-note">
              You'll receive a notification once your verification is complete.
            </p>
            <button 
              className="kyc-page__btn kyc-page__btn--secondary" 
              style={{ marginTop: '1.5rem' }}
              onClick={fetchExistingKYC}
            >
              Refresh Status
            </button>
          </motion.div>
        </main>
      </div>
    );
  }

  // Rejected - allow resubmission
  if (existingKYC?.status === 'rejected') {
    return (
      <div className="kyc-page">
        <ClientNavbar />
        <main className="kyc-page__main">
          <motion.div 
            className="kyc-page__rejected"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="kyc-page__rejected-icon">
              <FaExclamationTriangle />
            </div>
            <h1>Verification Rejected</h1>
            <p className="kyc-page__rejected-reason">
              <strong>Reason:</strong> {existingKYC.rejectionReason || 'Information provided was incorrect'}
            </p>
            
            <p>Please update your information and resubmit for verification.</p>

            <button 
              className="kyc-page__btn kyc-page__btn--primary"
              onClick={() => {
                setExistingKYC(null);
                setStep(1);
              }}
            >
              Update & Resubmit <FaArrowRight />
            </button>
          </motion.div>
        </main>
      </div>
    );
  }

  const steps = [
    { num: 1, label: 'Personal', icon: FaUser },
    { num: 2, label: 'Bank Details', icon: FaUniversity },
    { num: 3, label: 'Confirm', icon: FaShieldAlt },
  ];

  return (
    <div className="kyc-page">
      <ClientNavbar />
      
      <main className="kyc-page__main">
        <div className="kyc-page__container">
          
          {/* Header */}
          <motion.div 
            className="kyc-page__header"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="kyc-page__header-icon">
              <FaShieldAlt />
            </div>
            <h1>KYC Verification</h1>
            <p>Complete verification to securely place orders and receive refunds</p>
          </motion.div>

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

              {/* Step 3: Confirm */}
              {step === 3 && (
                <motion.div 
                  key="step3"
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

              {/* Step 4: Success */}
              {step === 4 && (
                <motion.div 
                  key="step4"
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
      </main>
    </div>
  );
};

export default ClientKYCPage;
