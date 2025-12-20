/**
 * Editor KYC Form Component
 * Bank account linking for payouts via Razorpay
 */

import { useState, useEffect } from 'react';
import {
  FaUniversity,
  FaIdCard,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSpinner,
  FaLock,
  FaTimes,
  FaUser,
  FaCloudUploadAlt,
  FaFileAlt
} from 'react-icons/fa';
import axios from 'axios';
import { useAppContext } from '../context/AppContext';
import './EditorKYCForm.css';

// IFSC Code validation (Indian bank format)
const validateIFSC = (ifsc) => {
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  return ifscRegex.test(ifsc.toUpperCase());
};

// Account number validation
const validateAccountNumber = (accNum) => {
  return /^\d{9,18}$/.test(accNum);
};

// PAN validation
const validatePAN = (pan) => {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
  return panRegex.test(pan.toUpperCase());
};

const EditorKYCForm = ({ onSuccess, onClose }) => {
  const { backendURL, user, setUser } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [bankInfo, setBankInfo] = useState(null);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    accountHolderName: user?.name || '',
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

  const [files, setFiles] = useState({
    id_proof: null,
    bank_proof: null
  });

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) return setErrors(prev => ({...prev, submit: "Max file size is 5MB"}));
      setFiles(prev => ({ ...prev, [type]: file }));
    }
  };

  // Fetch existing KYC status
  useEffect(() => {
    const fetchKYCStatus = async () => {
      try {
        const token = user?.token || localStorage.getItem('token');
        const res = await axios.get(`${backendURL}/api/profile/kyc-status`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.success && res.data.kycStatus !== 'not_started') {
          setBankInfo(res.data.bankDetails);
        }
      } catch (err) {
        console.error('Failed to fetch KYC status:', err);
      }
    };
    fetchKYCStatus();
  }, [backendURL, user]);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    // Auto-uppercase for IFSC and PAN
    if (name === 'ifscCode' || name === 'panNumber') {
      processedValue = value.toUpperCase();
    }

    setFormData((prev) => ({ ...prev, [name]: processedValue }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // Validate form
  const validate = () => {
    const newErrors = {};

    if (!formData.accountHolderName.trim()) {
      newErrors.accountHolderName = 'Account holder name is required';
    }

    if (!formData.accountNumber) {
      newErrors.accountNumber = 'Account number is required';
    } else if (!validateAccountNumber(formData.accountNumber)) {
      newErrors.accountNumber = 'Invalid account number (9-18 digits)';
    }

    if (formData.accountNumber !== formData.confirmAccountNumber) {
      newErrors.confirmAccountNumber = 'Account numbers do not match';
    }

    if (!formData.ifscCode) {
      newErrors.ifscCode = 'IFSC code is required';
    } else if (!validateIFSC(formData.ifscCode)) {
      newErrors.ifscCode = 'Invalid IFSC code format';
    }

    if (!formData.panNumber) {
      newErrors.panNumber = 'PAN number is required';
    } else if (!validatePAN(formData.panNumber)) {
      newErrors.panNumber = 'Invalid PAN format';
    }

    if (!formData.street.trim()) newErrors.street = 'Street address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';
    if (!formData.postalCode.trim()) newErrors.postalCode = 'Postal code is required';

    if (!files.id_proof) newErrors.id_proof = 'Identity proof is required';
    // Bank proof optional but recommended? Let's make it optional for now or mirror client logic.
    // Making it required ensures robustness.
    if (!files.bank_proof) newErrors.bank_proof = 'Bank proof is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Lookup IFSC for bank info
  const lookupIFSC = async (ifsc) => {
    if (!validateIFSC(ifsc)) return;

    setVerifying(true);
    try {
      const res = await axios.get(`https://ifsc.razorpay.com/${ifsc}`);
      setBankInfo({
        bankName: res.data.BANK,
        branchName: res.data.BRANCH,
        city: res.data.CITY,
      });
    } catch (err) {
      setBankInfo(null);
      setErrors((prev) => ({
        ...prev,
        ifscCode: 'Could not verify IFSC code',
      }));
    } finally {
      setVerifying(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);
    try {
      const token = user?.token || localStorage.getItem('token');
      
      const data = new FormData();
      data.append('accountHolderName', formData.accountHolderName);
      data.append('accountNumber', formData.accountNumber);
      data.append('ifscCode', formData.ifscCode);
      data.append('panNumber', formData.panNumber);
      data.append('bankName', bankInfo?.bankName || '');
      
      // Address & Tax
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
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          } 
        }
      );

      if (res.data.success) {
        // Update user context with actual kycStatus from backend
        setUser((prev) => ({
          ...prev,
          kycStatus: res.data.kycStatus || 'submitted',
          profileCompletionPercent: res.data.profileCompletion,
        }));
        onSuccess?.(res.data);
      }
    } catch (err) {
      console.error('KYC submission error:', err);
      setErrors({
        submit: err.response?.data?.message || 'Failed to submit KYC details',
      });
    } finally {
      setLoading(false);
    }
  };

  // Already verified state
  if (user?.kycStatus === 'verified') {
    return (
      <div className="kyc-form-container">
        <div className="kyc-form-modal">
          <div className="kyc-success-state">
            <div className="kyc-success-icon">
              <FaCheckCircle />
            </div>
            <h2>KYC Verified</h2>
            <p>Your bank account is linked and ready for payouts.</p>
            <div className="kyc-bank-card">
              <FaUniversity />
              <div>
                <span className="kyc-bank-name">{bankInfo?.bankName || 'Bank Account'}</span>
                <span className="kyc-acc-masked">••••••{user?.bankDetails?.accountNumber?.slice(-4) || '****'}</span>
              </div>
            </div>
            <button onClick={onClose} className="kyc-btn-primary">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Pending/Submitted state
  if (user?.kycStatus === 'submitted' || user?.kycStatus === 'pending') {
    return (
      <div className="kyc-form-container">
        <div className="kyc-form-modal">
          <div className="kyc-pending-state">
            <div className="kyc-pending-icon">
              <FaSpinner className="kyc-spin" />
            </div>
            <h2>KYC Under Review</h2>
            <p>Your documents are being verified. This usually takes 1-2 business days.</p>
            <button onClick={onClose} className="kyc-btn-secondary">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="kyc-form-container">
      <div className="kyc-form-modal">
        {/* Header */}
        <div className="kyc-header">
          <div className="kyc-header-content">
            <h2>Complete KYC</h2>
            <p>Link your bank account to receive payouts</p>
          </div>
          <button onClick={onClose} className="kyc-close-btn">
            <FaTimes />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="kyc-form">
          {/* Account Holder Name */}
          <div className="kyc-field">
            <label>
              <FaUser /> Account Holder Name
            </label>
            <input
              type="text"
              name="accountHolderName"
              value={formData.accountHolderName}
              onChange={handleChange}
              placeholder="As per bank records"
              className={errors.accountHolderName ? 'kyc-error' : ''}
            />
            {errors.accountHolderName && (
              <span className="kyc-error-text">{errors.accountHolderName}</span>
            )}
          </div>

          {/* Account Number */}
          <div className="kyc-field">
            <label>
              <FaUniversity /> Account Number
            </label>
            <input
              type="password"
              name="accountNumber"
              value={formData.accountNumber}
              onChange={handleChange}
              placeholder="Enter account number"
              className={errors.accountNumber ? 'kyc-error' : ''}
            />
            {errors.accountNumber && (
              <span className="kyc-error-text">{errors.accountNumber}</span>
            )}
          </div>

          {/* Confirm Account Number */}
          <div className="kyc-field">
            <label>Confirm Account Number</label>
            <input
              type="text"
              name="confirmAccountNumber"
              value={formData.confirmAccountNumber}
              onChange={handleChange}
              placeholder="Re-enter account number"
              className={errors.confirmAccountNumber ? 'kyc-error' : ''}
            />
            {errors.confirmAccountNumber && (
              <span className="kyc-error-text">{errors.confirmAccountNumber}</span>
            )}
          </div>

          {/* IFSC Code */}
          <div className="kyc-field">
            <label>
              <FaIdCard /> IFSC Code
            </label>
            <div className="kyc-ifsc-wrapper">
              <input
                type="text"
                name="ifscCode"
                value={formData.ifscCode}
                onChange={(e) => {
                  handleChange(e);
                  if (e.target.value.length === 11) {
                    lookupIFSC(e.target.value);
                  }
                }}
                placeholder="e.g., HDFC0001234"
                maxLength={11}
                className={errors.ifscCode ? 'kyc-error' : ''}
              />
              {verifying && <FaSpinner className="kyc-spin kyc-ifsc-spinner" />}
            </div>
            {errors.ifscCode && (
              <span className="kyc-error-text">{errors.ifscCode}</span>
            )}
            {bankInfo && (
              <div className="kyc-bank-info">
                ✓ {bankInfo.bankName} - {bankInfo.branchName}
              </div>
            )}
          </div>

          {/* PAN Number */}
          <div className="kyc-field">
            <label>
              <FaIdCard /> PAN Number
            </label>
            <input
              type="text"
              name="panNumber"
              value={formData.panNumber}
              onChange={handleChange}
              placeholder="e.g., ABCDE1234F"
              maxLength={10}
              className={errors.panNumber ? 'kyc-error' : ''}
            />
            {errors.panNumber && (
              <span className="kyc-error-text">{errors.panNumber}</span>
            )}
          </div>

          {/* Address Information */}
          <div className="kyc-section-divider" style={{margin:'1.5rem 0', borderTop:'1px solid #e2e8f0'}}></div>
          <h3 style={{fontSize:'1rem', fontWeight:'600', marginBottom:'1rem', color:'#475569'}}>Address & Tax Details</h3>

          <div className="kyc-field">
            <label>Street Address</label>
            <input
              type="text"
              name="street"
              value={formData.street}
              onChange={handleChange}
              placeholder="House/Building No, Street Area"
              className={errors.street ? 'kyc-error' : ''}
            />
            {errors.street && <span className="kyc-error-text">{errors.street}</span>}
          </div>

          <div style={{display:'flex', gap:'1rem'}}>
             <div className="kyc-field" style={{flex:1}}>
               <label>City</label>
               <input type="text" name="city" value={formData.city} onChange={handleChange} className={errors.city ? 'kyc-error' : ''} />
               {errors.city && <span className="kyc-error-text">{errors.city}</span>}
             </div>
             <div className="kyc-field" style={{flex:1}}>
               <label>State</label>
               <input type="text" name="state" value={formData.state} onChange={handleChange} className={errors.state ? 'kyc-error' : ''} />
               {errors.state && <span className="kyc-error-text">{errors.state}</span>}
             </div>
          </div>
          
          <div style={{display:'flex', gap:'1rem'}}>
             <div className="kyc-field" style={{flex:1}}>
               <label>Postal Code</label>
               <input type="text" name="postalCode" value={formData.postalCode} onChange={handleChange} maxLength={6} className={errors.postalCode ? 'kyc-error' : ''} />
               {errors.postalCode && <span className="kyc-error-text">{errors.postalCode}</span>}
             </div>
             <div className="kyc-field" style={{flex:1}}>
               <label>GSTIN (Optional)</label>
               <input type="text" name="gstin" value={formData.gstin} onChange={handleChange} placeholder="GST Number" />
             </div>
          </div>

          <div className="kyc-section-divider" style={{margin:'1.5rem 0', borderTop:'1px solid #e2e8f0'}}></div>

          {/* Document Uploads */}
          <div className="kyc-field">
            <label><FaCloudUploadAlt /> Document Proofs</label>
            <div className="kyc-file-group" style={{display:'flex', gap:'1rem', marginTop:'0.5rem'}}>
              
              {/* ID Proof */}
              <div className="kyc-file-input" style={{flex:1}}>
                <input 
                  type="file" 
                  id="id_proof_editor" 
                  hidden 
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileChange(e, 'id_proof')}
                />
                <label 
                  htmlFor="id_proof_editor" 
                  style={{
                    display:'flex', flexDirection:'column', alignItems:'center', 
                    padding:'1rem', border: errors.id_proof ? '2px dashed #ef4444' : '2px dashed #cbd5e1', 
                    borderRadius:'0.5rem', cursor:'pointer'
                  }}
                >
                  {files.id_proof ? (
                    <>
                      <FaFileAlt style={{color:'#10b981', fontSize:'1.5rem'}} />
                      <span style={{fontSize:'0.8rem', marginTop:'0.5rem'}}>{files.id_proof.name}</span>
                    </>
                  ) : (
                    <>
                      <FaIdCard style={{fontSize:'1.5rem', color:'#94a3b8'}} />
                      <span style={{fontSize:'0.8rem', marginTop:'0.5rem'}}>Upload ID (PAN/Aadhar)</span>
                    </>
                  )}
                </label>
                {errors.id_proof && <span className="kyc-error-text" style={{fontSize:'0.75rem'}}>{errors.id_proof}</span>}
              </div>

              {/* Bank Proof */}
              <div className="kyc-file-input" style={{flex:1}}>
                <input 
                  type="file" 
                  id="bank_proof_editor" 
                  hidden 
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileChange(e, 'bank_proof')}
                />
                <label 
                  htmlFor="bank_proof_editor" 
                  style={{
                    display:'flex', flexDirection:'column', alignItems:'center', 
                    padding:'1rem', border: errors.bank_proof ? '2px dashed #ef4444' : '2px dashed #cbd5e1', 
                    borderRadius:'0.5rem', cursor:'pointer'
                  }}
                >
                  {files.bank_proof ? (
                    <>
                      <FaFileAlt style={{color:'#3b82f6', fontSize:'1.5rem'}} />
                      <span style={{fontSize:'0.8rem', marginTop:'0.5rem'}}>{files.bank_proof.name}</span>
                    </>
                  ) : (
                    <>
                      <FaUniversity style={{fontSize:'1.5rem', color:'#94a3b8'}} />
                      <span style={{fontSize:'0.8rem', marginTop:'0.5rem'}}>Upload Bank Proof</span>
                    </>
                  )}
                </label>
                {errors.bank_proof && <span className="kyc-error-text" style={{fontSize:'0.75rem'}}>{errors.bank_proof}</span>}
              </div>

            </div>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="kyc-submit-error">
              <FaExclamationTriangle />
              {errors.submit}
            </div>
          )}

          {/* Submit Button */}
          <button type="submit" disabled={loading} className="kyc-submit-btn">
            {loading ? (
              <>
                <FaSpinner className="kyc-spin" />
                Submitting...
              </>
            ) : (
              <>
                <FaLock />
                Submit KYC Details
              </>
            )}
          </button>

          {/* Security Notice */}
          <p className="kyc-security-note">
            <FaLock />
            Your bank details are encrypted and secure. We use bank-grade security.
          </p>
        </form>
      </div>
    </div>
  );
};

export default EditorKYCForm;
