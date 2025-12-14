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
  });

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
      const res = await axios.post(
        `${backendURL}/api/profile/submit-kyc`,
        {
          accountHolderName: formData.accountHolderName,
          accountNumber: formData.accountNumber,
          ifscCode: formData.ifscCode,
          panNumber: formData.panNumber,
          bankName: bankInfo?.bankName || '',
        },
        { headers: { Authorization: `Bearer ${token}` } }
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
