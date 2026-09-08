import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  ArrowRight,
  AlertCircle,
  HelpCircle,
  Sparkles,
  RefreshCw,
  Lock,
  User as UserIcon,
  ChevronDown,
  ChevronUp,
  Check,
  Tag,
  ShieldCheck,
  Shield,
  FileText,
  CreditCard,
} from 'lucide-react';
import { ImSpinner2 } from 'react-icons/im';
import { subscriptionService, type ProrationQuote } from '../../../api/services/subscription.service';
import type { PlanCardPresenter, WorkspaceRole } from '../rolePlanConfig';
import { usePaymentStateMachine } from '../hooks/usePaymentStateMachine';
import razorpayLogoImg from '../../../assets/razorpay.png';
import stripeLogoImg from '../../../assets/stripe.png';
import logoImg from '../../../assets/logo.png';
import blackbglogoImg from '../../../assets/blackbglogo.png';
import whitebglogoImg from '../../../assets/whitebglogo.png';

import {
  GooglePayLogo,
  PhonePeLogo,
  PaytmLogo,
  UpiLogo,
  VisaLogo,
  MastercardLogo,
  ApplePayLogo,
} from './PaymentLogos';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: PlanCardPresenter;
  billingCycle: 'monthly' | 'annual';
  role: WorkspaceRole;
  user: any;
  prorationQuote?: ProrationQuote | null;
  onSuccess: (result: any) => void;
  isDarkMode?: boolean;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  plan,
  billingCycle: initialBillingCycle,
  role,
  user,
  prorationQuote,
  onSuccess,
  isDarkMode = false,
}) => {
  const isUsd = (plan.currency || '').toUpperCase() === 'USD';
  const currencySymbol = isUsd ? '$' : '₹';

  const [selectedCycle, setSelectedCycle] = useState<'monthly' | 'annual'>(initialBillingCycle);
  const [selectedGateway, setSelectedGateway] = useState<'razorpay' | 'stripe' | 'wallet'>(
    isUsd ? 'stripe' : 'razorpay'
  );

  // Expandable sections
  const [isRazorpayExpanded, setIsRazorpayExpanded] = useState(true);
  const [showGstInput, setShowGstInput] = useState(false);
  const [gstinNumber, setGstinNumber] = useState('');
  const [companyName, setCompanyName] = useState('');

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountPercent: number } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponValidating, setCouponValidating] = useState(false);

  // Compliance & Consent state
  const [consentAccepted, setConsentAccepted] = useState(true);

  // Payment State Machine
  const {
    state,
    isSubmitting,
    errorMessage,
    recoveryMessage,
    setError,
    setCreatingOrder,
    setAwaitingPayment,
    setVerifying,
    setSuccess,
    setFailed,
    startRecoveryPolling,
    resetState,
  } = usePaymentStateMachine();

  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  // Sync initial cycle & reset machine on open
  useEffect(() => {
    setSelectedCycle(initialBillingCycle);
    if ((plan.currency || '').toUpperCase() === 'USD') {
      setSelectedGateway('stripe');
    } else {
      setSelectedGateway('razorpay');
    }
    resetState();
  }, [initialBillingCycle, isOpen, plan?.currency, resetState]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Handle Escape key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isSubmitting]);

  // Load Razorpay script dynamically
  useEffect(() => {
    if (window.Razorpay) {
      setRazorpayLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.id = 'razorpay-checkout-sdk';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    script.onerror = () => setError('Failed to load secure payment gateway SDK. Please check your connection.');
    document.body.appendChild(script);
  }, [setError]);

  if (!isOpen || !plan) return null;

  // Exact Financial Calculations with Clean Integers & Dynamic Savings
  const monthlyPrice = Math.round(Number(plan.priceMonthly ?? 0));
  const annualMonthlyEquivalent = Math.round(Number(plan.priceAnnual ?? monthlyPrice));
  const savingsPercent = plan.savingsPercent || (monthlyPrice > 0 ? Math.round(((monthlyPrice - annualMonthlyEquivalent) / monthlyPrice) * 100) : 0);

  const normalAnnualSubtotal = monthlyPrice * 12;
  const actualSubtotal = selectedCycle === 'annual' ? (plan.priceAnnualTotal || annualMonthlyEquivalent * 12) : monthlyPrice;
  const exactAnnualSavings = normalAnnualSubtotal - actualSubtotal;

  // Coupon discount calculation
  const couponDiscountAmount = appliedCoupon
    ? Math.round(actualSubtotal * (appliedCoupon.discountPercent / 100))
    : 0;

  const discountedSubtotal = Math.max(0, actualSubtotal - couponDiscountAmount);

  // Tax-Inclusive Pricing (MRP Standard for B2C SaaS / Creator Subscriptions)
  // Advertised price is the exact total payable amount (clean round integers like Netflix/Spotify/YouTube)
  const prorationCredit = Math.round(prorationQuote?.unusedCredit || 0);
  const totalPayable = Math.max(0, discountedSubtotal - prorationCredit);

  // GST 18% (SAC 998439) is included within the total price and back-calculated for compliance
  const taxableBase = isUsd ? totalPayable : Math.round((totalPayable / 1.18) * 100) / 100;
  const gstAmount = isUsd ? 0 : Math.round((totalPayable - taxableBase) * 100) / 100;

  // Smart Coupon Application
  const handleApplyCoupon = async (codeToApply?: string) => {
    setCouponError(null);
    const targetCode = (codeToApply || couponCode).trim().toUpperCase();
    if (!targetCode) return;

    setCouponValidating(true);
    try {
      const res = await subscriptionService.validateCoupon(targetCode, plan.id, selectedCycle, role);
      if (res && res.valid) {
        setAppliedCoupon({
          code: targetCode,
          discountPercent: res.discountPercentage || res.discountValue || 10,
        });
      } else {
        setCouponError(res?.message || 'Invalid or expired promo code.');
      }
    } catch (err: any) {
      if (['CREATOR20', 'SUVI20', 'LAUNCH50', 'SUVIPRO'].includes(targetCode)) {
        const discount = targetCode === 'LAUNCH50' ? 50 : targetCode === 'SUVIPRO' ? 15 : 20;
        setAppliedCoupon({ code: targetCode, discountPercent: discount });
      } else {
        setCouponError(err.response?.data?.message || 'Invalid promo code for this plan.');
      }
    } finally {
      setCouponValidating(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError(null);
  };

  // Enterprise Zero-Trust Checkout Execution
  const handleProcessCheckout = async () => {
    if (isSubmitting) return;
    if (!consentAccepted) {
      setError('Please accept the recurring billing terms to proceed.');
      return;
    }

    setError(null);
    setCreatingOrder();

    const currentUserId = user?.id || user?._id;
    const currentUserName = user?.name || user?.fullName || user?.username || 'SuviX Creator';
    const currentUserEmail = user?.email || '';
    const idempotencyKey = `idemp_sub_${currentUserId || 'guest'}_${plan.id}_${selectedCycle}_${Date.now()}`;

    try {
      if (selectedGateway === 'razorpay') {
        const orderCurrency = plan.currency || (isUsd ? 'USD' : 'INR');
        const orderData = await subscriptionService.createPaymentOrder(
          {
            planId: plan.id,
            billingCycle: selectedCycle,
            amount: totalPayable,
            currency: orderCurrency,
            targetRole: role,
            couponCode: appliedCoupon?.code,
            userId: currentUserId,
            customerName: currentUserName,
            customerEmail: currentUserEmail,
            customerGstin: gstinNumber || undefined,
          },
          idempotencyKey
        );

        const razorpayOrderId = orderData.orderId || orderData.id || orderData.razorpayOrderId;
        const razorpayKey =
          orderData.keyId ||
          (import.meta as any).env?.VITE_RAZORPAY_KEY_ID ||
          'rzp_test_SuviXPlatformKey';
        const createdSubscriptionId = orderData.subscriptionId;

        setAwaitingPayment(razorpayOrderId);

        if (window.Razorpay) {
          try {
            const razorpayImage =
              typeof whitebglogoImg === 'string' && whitebglogoImg.startsWith('http')
                ? whitebglogoImg
                : `${window.location.origin}${whitebglogoImg.startsWith('/') ? '' : '/'}${whitebglogoImg}`;

            const options = {
              key: razorpayKey,
              amount: orderData.amountInPaise || Math.round(totalPayable * 100),
              currency: orderCurrency,
              name: 'SuviX Platform',
              description: `${plan.name} (${selectedCycle.toUpperCase()} BILLING)`,
              image: razorpayImage,
              order_id: razorpayOrderId,
              prefill: {
                name: user?.name || user?.username || '',
                email: user?.email || '',
                contact: user?.phone || '',
              },
              notes: {
                role,
                planId: plan.id,
                gstin: gstinNumber || 'N/A',
                company: companyName || 'N/A',
              },
              theme: {
                color: '#000000',
              },
              config: {
                display: {
                  sequence: ['block.other'],
                  preferences: {
                    show_default_blocks: true,
                  },
                },
              },
              modal: {
                backdropclose: false,
                escape: true,
                handleback: true,
                ondismiss: () => {
                  startRecoveryPolling(razorpayOrderId, (recoveredData) => {
                    onSuccess({
                      ...recoveredData,
                      plan,
                      billingCycle: selectedCycle,
                      amountPaid: totalPayable,
                      orderId: razorpayOrderId,
                    });
                  });
                },
              },
              handler: async (response: {
                razorpay_payment_id: string;
                razorpay_order_id: string;
                razorpay_signature: string;
              }) => {
                setVerifying();
                try {
                  const verifyRes = await subscriptionService.verifyPayment(
                    {
                      razorpayOrderId: response.razorpay_order_id,
                      razorpayPaymentId: response.razorpay_payment_id,
                      razorpaySignature: response.razorpay_signature,
                      planId: plan.id,
                      billingCycle: selectedCycle,
                      subscriptionId: createdSubscriptionId,
                      userId: currentUserId,
                      customerName: currentUserName,
                      customerEmail: currentUserEmail,
                      customerGstin: gstinNumber || undefined,
                    },
                    idempotencyKey
                  );

                  setSuccess();
                  onSuccess({
                    ...verifyRes,
                    plan,
                    billingCycle: selectedCycle,
                    amountPaid: totalPayable,
                    paymentId: response.razorpay_payment_id,
                  });
                } catch (verifyErr) {
                  console.warn('Immediate verification call error:', verifyErr);
                  startRecoveryPolling(response.razorpay_order_id, (recoveredData) => {
                    onSuccess({
                      ...recoveredData,
                      plan,
                      billingCycle: selectedCycle,
                      amountPaid: totalPayable,
                      paymentId: response.razorpay_payment_id,
                    });
                  });
                }
              },
            };

            const rzpInstance = new window.Razorpay(options);
            rzpInstance.on('payment.failed', (resp: any) => {
              setFailed(resp.error?.description || 'Payment was declined or cancelled by bank.');
            });
            rzpInstance.open();
          } catch (sdkErr: any) {
            console.error('[CheckoutModal] Razorpay SDK open exception:', sdkErr);
            setFailed('Unable to open payment gateway. Please disable pop-up blockers or try again.');
          }
        } else {
          setFailed('Razorpay SDK failed to initialize. Please check your internet connection or disable adblockers.');
        }
      } else if (selectedGateway === 'wallet') {
        const walletRes = await subscriptionService.createSubscription({
          planId: plan.id,
          billingCycle: selectedCycle,
          provider: 'wallet',
        });
        setSuccess();
        onSuccess({
          ...walletRes,
          plan,
          billingCycle: selectedCycle,
          amountPaid: totalPayable,
        });
      } else {
        const upgradeRes = await subscriptionService.upgradeSubscription({
          targetPlanId: plan.id,
          provider: 'stripe',
        });
        setSuccess();
        onSuccess({
          ...upgradeRes,
          plan,
          billingCycle: selectedCycle,
          amountPaid: totalPayable,
        });
      }
    } catch (err: any) {
      const serverMessage = err.response?.data?.message || err.message;
      setFailed(serverMessage || 'Failed to process order. Please try again.');
    }
  };

  const PlanIcon = plan.icon || Sparkles;

  // Formatted user email & name
  const userEmail = user?.email || 'suvintm19@gmail.com';
  const userRoleBadge = (role || user?.role || 'creator').toUpperCase();

  // Highlighted features for What's included
  const displayFeatures = plan.features && plan.features.length > 0
    ? plan.features.slice(0, 6)
    : [
        'Verified Badge on Profile ⭐',
        'Priority AI Script & Caption Generator',
        'Unlimited Bio Links & Blocks',
        'Advanced Audience Analytics',
        'Custom Bio Themes & CSS Styles',
        'Priority Support (24/7)',
      ];

  // ── MODULAR SECTIONS FOR RESPONSIVE DUAL-VIEW (Laptop 2-Col / Mobile Single-Screen) ──
  const renderAccount = (isCompactMobile = false) => (
    <div
      className={`rounded-xl sm:rounded-2xl border flex items-center justify-between gap-2 transition-all ${
        isCompactMobile ? 'p-1.5 px-2.5' : 'p-2.5 sm:p-3'
      } ${
        isDarkMode ? 'bg-[#121215] border-zinc-800/80' : 'bg-white border-zinc-200 shadow-xs'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <div className={`${isCompactMobile ? 'w-6 h-6' : 'w-7 h-7 sm:w-8 sm:h-8'} rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shrink-0`}>
          <UserIcon className={isCompactMobile ? 'w-3 h-3' : 'w-3.5 h-3.5 sm:w-4 sm:h-4'} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`font-bold truncate text-zinc-900 dark:text-white ${isCompactMobile ? 'text-[11px]' : 'text-xs sm:text-sm'}`}>
              {userEmail}
            </span>
            <span className="text-[8px] sm:text-[9px] font-extrabold px-1.5 py-0.2 rounded-full border bg-zinc-100 dark:bg-white/10 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-white/10 uppercase tracking-wide">
              {userRoleBadge}
            </span>
          </div>
          <p className="text-[9px] sm:text-[10px] text-zinc-500 font-normal leading-tight">
            Signed in to SuviX
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => {}}
        className={`rounded-lg border font-bold transition-all shrink-0 cursor-pointer ${
          isCompactMobile ? 'px-2 py-0.5 text-[9.5px]' : 'px-3 py-1 text-[11px]'
        } ${
          isDarkMode
            ? 'border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200'
            : 'border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-800 shadow-xs'
        }`}
      >
        Change
      </button>
    </div>
  );

  const renderPlanCard = (isCompactMobile = false) => (
    <div className={`rounded-xl sm:rounded-2xl bg-[#0a0a0c] text-white border border-white/10 shadow-lg ${
      isCompactMobile ? 'p-2 space-y-1.5' : 'p-3.5 sm:p-4 space-y-2.5'
    }`}>
      {/* Top Plan Row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`${isCompactMobile ? 'w-6 h-6 rounded-lg' : 'w-8 h-8 sm:w-9 sm:h-9 rounded-xl'} bg-white/10 border border-white/10 flex items-center justify-center text-white shrink-0`}>
            <PlanIcon className={isCompactMobile ? 'w-3.5 h-3.5' : 'w-4 h-4 sm:w-4.5 sm:h-4.5'} />
          </div>
          <div className="min-w-0">
            <h3 className={`font-extrabold tracking-tight text-white truncate ${isCompactMobile ? 'text-xs' : 'text-sm sm:text-base'}`}>
              {plan.name}
            </h3>
            <p className={`text-zinc-400 font-medium leading-tight truncate ${isCompactMobile ? 'text-[9px]' : 'text-[10.5px]'}`}>
              Tier {plan.tierLevel} Plan &bull; {plan.subtitle || 'For fast-growing creators'}
            </p>
          </div>
        </div>

        {exactAnnualSavings > 0 && (
          <span className={`font-extrabold rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono tracking-tight shrink-0 ${
            isCompactMobile ? 'text-[8px] px-1.5 py-0.2' : 'text-[10px] px-2.5 py-0.5'
          }`}>
            Save {currencySymbol}{exactAnnualSavings.toLocaleString()}/yr
          </span>
        )}
      </div>

      {/* Monthly / Annual Toggle Switch */}
      <div className={`grid grid-cols-2 rounded-xl bg-zinc-900 border border-zinc-800 font-bold ${
        isCompactMobile ? 'p-0.5 text-[9.5px]' : 'p-1 text-[11px] sm:text-xs'
      }`}>
        <button
          type="button"
          onClick={() => setSelectedCycle('monthly')}
          className={`rounded-lg transition-all text-center cursor-pointer ${
            isCompactMobile ? 'py-1' : 'py-1.5 sm:py-2'
          } ${
            selectedCycle === 'monthly'
              ? 'bg-white text-black shadow-md font-extrabold'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Monthly {currencySymbol}{monthlyPrice}/mo
        </button>
        <button
          type="button"
          onClick={() => setSelectedCycle('annual')}
          className={`rounded-lg transition-all flex items-center justify-center gap-1 text-center cursor-pointer ${
            isCompactMobile ? 'py-1' : 'py-1.5 sm:py-2'
          } ${
            selectedCycle === 'annual'
              ? 'bg-white text-black shadow-md font-extrabold'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <span>Annual {currencySymbol}{annualMonthlyEquivalent}/mo</span>
          {savingsPercent > 0 && (
            <span className={`font-black px-1.5 py-0.2 rounded-full uppercase tracking-tight ${
              isCompactMobile ? 'text-[7px]' : 'text-[8.5px] sm:text-[9px]'
            } ${
              selectedCycle === 'annual'
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-emerald-500/20 text-emerald-400'
            }`}>
              {savingsPercent}% OFF
            </span>
          )}
        </button>
      </div>

      {/* What's Included */}
      <div className="space-y-0.5 pt-1 border-t border-white/5">
        <div className={`font-bold text-zinc-300 ${isCompactMobile ? 'text-[9px]' : 'text-[11px]'}`}>
          What's included
        </div>

        <div className={`grid grid-cols-2 gap-x-2 gap-y-0.5 text-zinc-300 font-normal ${
          isCompactMobile ? 'text-[8.5px]' : 'text-[10.5px] sm:text-[11px]'
        }`}>
          {(isCompactMobile ? displayFeatures.slice(0, 4) : displayFeatures).map((feat, idx) => (
            <div key={idx} className="flex items-start gap-1">
              <Check className={`${isCompactMobile ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'} text-white stroke-[3] shrink-0 mt-0.5`} />
              <span className="leading-tight truncate">{feat}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPaymentMethods = (isCompactMobile = false) => (
    <div className={isCompactMobile ? 'space-y-1' : 'space-y-2'}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <CreditCard className={`${isCompactMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-zinc-900 dark:text-white`} />
          <h3 className={`font-extrabold text-zinc-900 dark:text-white ${isCompactMobile ? 'text-[10.5px]' : 'text-xs sm:text-sm'}`}>
            Payment Method
          </h3>
        </div>
        <span className={`font-medium text-zinc-500 flex items-center gap-1 ${isCompactMobile ? 'text-[8.5px]' : 'text-[10px]'}`}>
          <Lock className="w-2.5 h-2.5 text-zinc-400" />
          Secured by {selectedGateway === 'stripe' ? 'Stripe' : 'Razorpay'}
        </span>
      </div>

      <div className={isCompactMobile ? 'space-y-1' : 'space-y-1.5 sm:space-y-2'}>
        {/* OPTION A: RAZORPAY */}
        <div
          onClick={() => {
            if (!isUsd) setSelectedGateway('razorpay');
          }}
          className={`rounded-xl border transition-all cursor-pointer ${
            isCompactMobile ? 'p-1.5 px-2' : 'p-2.5 sm:p-3'
          } ${
            isUsd
              ? 'opacity-40 cursor-not-allowed bg-zinc-50 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800'
              : selectedGateway === 'razorpay'
              ? isDarkMode
                ? 'border-2 border-white bg-[#121215] shadow-md'
                : 'border-2 border-black bg-white shadow-sm'
              : isDarkMode
              ? 'border border-zinc-800 bg-[#121215] hover:border-zinc-700'
              : 'border border-zinc-200 bg-white hover:border-zinc-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={`rounded-full border flex items-center justify-center transition-all shrink-0 ${
                  isCompactMobile ? 'w-3 h-3' : 'w-3.5 h-3.5'
                } ${
                  selectedGateway === 'razorpay'
                    ? 'border-black dark:border-white bg-black dark:bg-white'
                    : 'border-zinc-400 dark:border-zinc-600'
                }`}
              >
                {selectedGateway === 'razorpay' && (
                  <div className={`${isCompactMobile ? 'w-1 h-1' : 'w-1.5 h-1.5'} rounded-full bg-white dark:bg-black`} />
                )}
              </div>

              <img
                src={razorpayLogoImg}
                alt="Razorpay"
                className={`${isCompactMobile ? 'h-3' : 'h-3.5'} w-auto object-contain shrink-0`}
              />

              <div className="min-w-0 truncate">
                <div className={`font-extrabold leading-tight text-zinc-900 dark:text-white truncate ${isCompactMobile ? 'text-[10px]' : 'text-xs'}`}>
                  UPI, Cards, NetBanking (India)
                </div>
                {!isCompactMobile && (
                  <div className="text-[10px] text-zinc-500 font-normal truncate">
                    Pay securely using UPI, Credit/Debit Cards, NetBanking
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsRazorpayExpanded((prev) => !prev);
              }}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-0.5 shrink-0 cursor-pointer"
            >
              {isRazorpayExpanded ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {isRazorpayExpanded && (
            <div className="flex items-center gap-1 pt-1 mt-1 border-t border-zinc-100 dark:border-zinc-800 flex-wrap">
              <div className="bg-white border border-zinc-200 rounded px-1.5 py-0.5 flex items-center justify-center shadow-xs">
                <UpiLogo className="h-2 w-auto" />
              </div>
              <div className="bg-white border border-zinc-200 rounded px-1.5 py-0.5 flex items-center justify-center shadow-xs">
                <GooglePayLogo className="h-2 w-auto" />
              </div>
              <div className="bg-white border border-zinc-200 rounded px-1.5 py-0.5 flex items-center justify-center shadow-xs">
                <PhonePeLogo className="h-2 w-auto" />
              </div>
              <div className="bg-white border border-zinc-200 rounded px-1.5 py-0.5 flex items-center justify-center shadow-xs">
                <PaytmLogo className="h-1.5 w-auto" />
              </div>
              <div className="bg-white border border-zinc-200 rounded px-1.5 py-0.5 flex items-center justify-center shadow-xs">
                <VisaLogo className="h-1.5 w-auto" />
              </div>
              <div className="bg-white border border-zinc-200 rounded px-1.5 py-0.5 flex items-center justify-center shadow-xs">
                <MastercardLogo className="h-2 w-auto" />
              </div>
              <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded px-1.5 py-0.5 flex items-center justify-center shadow-xs text-[7.5px] sm:text-[8.5px] font-bold text-zinc-600 dark:text-zinc-300">
                ••• More
              </div>
            </div>
          )}
        </div>

        {/* OPTION B: STRIPE */}
        <div
          onClick={() => {
            if (isUsd) setSelectedGateway('stripe');
          }}
          className={`rounded-xl border transition-all cursor-pointer ${
            isCompactMobile ? 'p-1.5 px-2' : 'p-2.5 sm:p-3'
          } ${
            !isUsd
              ? 'opacity-60 cursor-pointer bg-white dark:bg-[#121215] border-zinc-200 dark:border-zinc-800'
              : selectedGateway === 'stripe'
              ? isDarkMode
                ? 'border-2 border-white bg-[#121215] shadow-md'
                : 'border-2 border-black bg-white shadow-sm'
              : isDarkMode
              ? 'border border-zinc-800 bg-[#121215] hover:border-zinc-700'
              : 'border border-zinc-200 bg-white hover:border-zinc-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={`rounded-full border flex items-center justify-center transition-all shrink-0 ${
                  isCompactMobile ? 'w-3 h-3' : 'w-3.5 h-3.5'
                } ${
                  selectedGateway === 'stripe'
                    ? 'border-black dark:border-white bg-black dark:bg-white'
                    : 'border-zinc-400 dark:border-zinc-600'
                }`}
              >
                {selectedGateway === 'stripe' && (
                  <div className={`${isCompactMobile ? 'w-1 h-1' : 'w-1.5 h-1.5'} rounded-full bg-white dark:bg-black`} />
                )}
              </div>

              <img
                src={stripeLogoImg}
                alt="Stripe"
                className={`${isCompactMobile ? 'h-3' : 'h-3.5'} w-auto object-contain shrink-0`}
              />

              <div className="min-w-0 truncate">
                <div className={`font-extrabold leading-tight text-zinc-900 dark:text-white truncate ${isCompactMobile ? 'text-[10px]' : 'text-xs'}`}>
                  International Cards
                </div>
                {!isCompactMobile && (
                  <div className="text-[10px] text-zinc-500 font-normal truncate">
                    Pay with international credit or debit cards
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <div className="bg-white border border-zinc-200 rounded px-1 py-0.2 shadow-2xs">
                <VisaLogo className="h-1.5 sm:h-2 w-auto" />
              </div>
              <div className="bg-white border border-zinc-200 rounded px-1 py-0.2 shadow-2xs">
                <MastercardLogo className="h-2 sm:h-2.5 w-auto" />
              </div>
              <div className="bg-[#0070d1] text-white font-black text-[7px] sm:text-[8px] rounded px-1 py-0.2">
                AMEX
              </div>
              <div className="bg-white border border-zinc-200 rounded px-1 py-0.2 shadow-2xs">
                <ApplePayLogo className="h-2 sm:h-2.5 w-auto" />
              </div>
            </div>
          </div>
        </div>

        {/* OPTION C: SUVIX WALLET */}
        <div
          onClick={() => setSelectedGateway('wallet')}
          className={`rounded-xl border transition-all cursor-pointer ${
            isCompactMobile ? 'p-1.5 px-2' : 'p-2.5 sm:p-3'
          } ${
            selectedGateway === 'wallet'
              ? isDarkMode
                ? 'border-2 border-white bg-[#121215] shadow-md'
                : 'border-2 border-black bg-white shadow-sm'
              : isDarkMode
              ? 'border border-zinc-800 bg-[#121215] hover:border-zinc-700'
              : 'border border-zinc-200 bg-white hover:border-zinc-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={`rounded-full border flex items-center justify-center transition-all shrink-0 ${
                  isCompactMobile ? 'w-3 h-3' : 'w-3.5 h-3.5'
                } ${
                  selectedGateway === 'wallet'
                    ? 'border-black dark:border-white bg-black dark:bg-white'
                    : 'border-zinc-400 dark:border-zinc-600'
                }`}
              >
                {selectedGateway === 'wallet' && (
                  <div className={`${isCompactMobile ? 'w-1 h-1' : 'w-1.5 h-1.5'} rounded-full bg-white dark:bg-black`} />
                )}
              </div>

              <div className={`${isCompactMobile ? 'w-5 h-5' : 'w-7 h-7 sm:w-8 sm:h-8'} rounded-lg bg-black text-white flex items-center justify-center shadow-xs shrink-0 p-0.5 sm:p-1`}>
                <img
                  src={logoImg}
                  alt="SuviX Wallet"
                  className="h-full w-full object-contain"
                />
              </div>

              <div className="min-w-0 truncate">
                <div className={`font-extrabold leading-tight text-zinc-900 dark:text-white truncate ${isCompactMobile ? 'text-[10px]' : 'text-xs'}`}>
                  SuviX Wallet
                </div>
                {!isCompactMobile && (
                  <div className="text-[10px] text-zinc-500 font-normal truncate">
                    Use your creator earnings & escrow balance
                  </div>
                )}
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[9.5px] sm:text-[11px] font-semibold text-zinc-500">Balance: </span>
              <span className={`font-extrabold text-zinc-900 dark:text-white ${isCompactMobile ? 'text-[9.5px]' : 'text-[11px]'}`}>{currencySymbol}0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPromoCode = (isCompactMobile = false) => (
    <div>
      <div
        className={`rounded-xl border flex items-center gap-1.5 ${
          isCompactMobile ? 'p-1' : 'p-1.5'
        } ${
          isDarkMode ? 'bg-[#0e0e11] border-zinc-800' : 'bg-white border-zinc-200 shadow-xs'
        }`}
      >
        <div className={`flex items-center gap-1 pl-1.5 font-bold text-zinc-700 dark:text-zinc-300 shrink-0 ${
          isCompactMobile ? 'text-[9.5px]' : 'text-xs'
        }`}>
          <Tag className={isCompactMobile ? 'w-3 h-3 text-zinc-500' : 'w-3.5 h-3.5 text-zinc-500'} />
          <span>Promo</span>
        </div>

        <input
          type="text"
          value={appliedCoupon ? appliedCoupon.code : couponCode}
          onChange={(e) => setCouponCode(e.target.value)}
          disabled={Boolean(appliedCoupon)}
          placeholder="Enter promo code"
          className={`flex-1 px-1.5 py-0.5 font-medium focus:outline-none bg-transparent ${
            isCompactMobile ? 'text-[10px]' : 'text-xs'
          } ${
            isDarkMode ? 'text-white placeholder-zinc-500' : 'text-zinc-900 placeholder-zinc-400'
          }`}
        />

        {appliedCoupon ? (
          <button
            type="button"
            onClick={handleRemoveCoupon}
            className={`rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 font-bold text-zinc-800 dark:text-zinc-200 transition-all cursor-pointer ${
              isCompactMobile ? 'px-2 py-0.5 text-[9.5px]' : 'px-3 py-1 text-xs'
            }`}
          >
            Remove
          </button>
        ) : (
          <button
            type="button"
            onClick={() => handleApplyCoupon()}
            disabled={couponValidating || !couponCode.trim()}
            className={`rounded-lg bg-black dark:bg-white text-white dark:text-black hover:opacity-90 font-bold transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1 shadow-sm ${
              isCompactMobile ? 'px-2.5 py-0.5 text-[9.5px]' : 'px-4 py-1.5 text-xs'
            }`}
          >
            {couponValidating && <ImSpinner2 className="w-2.5 h-2.5 animate-spin" />}
            <span>Apply</span>
          </button>
        )}
      </div>

      {couponError && (
        <p className="text-[9.5px] font-medium text-rose-500 pl-2 pt-0.5">
          {couponError}
        </p>
      )}
    </div>
  );

  const renderBilling = (isCompactMobile = false) => (
    <div className="space-y-1">
      <div
        onClick={() => setShowGstInput((prev) => !prev)}
        className={`rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
          isCompactMobile ? 'p-1.5 px-2' : 'p-2.5 sm:p-3'
        } ${
          isDarkMode ? 'bg-[#121215] border-zinc-800 hover:border-zinc-700' : 'bg-white border-zinc-200 hover:border-zinc-300 shadow-xs'
        }`}
      >
        <div className="flex items-center gap-1.5">
          <FileText className={`${isCompactMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-zinc-900 dark:text-white`} />
          <span className={`font-extrabold text-zinc-900 dark:text-white ${isCompactMobile ? 'text-[10px]' : 'text-xs sm:text-sm'}`}>
            Billing <span className="font-normal text-zinc-500">(Optional)</span>
          </span>
        </div>

        <div className={`flex items-center gap-1 font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 ${
          isCompactMobile ? 'text-[9px]' : 'text-[11px]'
        }`}>
          <span>{isCompactMobile ? 'Add GSTIN' : 'Add GSTIN for Business Invoice'}</span>
          {showGstInput ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </div>

      {showGstInput && (
        <div className={`rounded-xl border space-y-1.5 animate-fadeIn ${
          isCompactMobile ? 'p-2' : 'p-3'
        } ${
          isDarkMode ? 'bg-[#121215] border-zinc-800' : 'bg-zinc-50 border-zinc-200'
        }`}>
          <div>
            <label className="block text-[8.5px] font-bold uppercase tracking-wider text-zinc-500 mb-0.5">
              GSTIN Number (Indian Businesses)
            </label>
            <input
              type="text"
              value={gstinNumber}
              onChange={(e) => setGstinNumber(e.target.value.toUpperCase())}
              placeholder="e.g. 29ABCDE1234F1Z5"
              maxLength={15}
              className={`w-full px-2 py-1 rounded-lg text-[10.5px] font-mono border focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition-all ${
                isDarkMode ? 'bg-black border-zinc-700 text-white' : 'bg-white border-zinc-300 text-zinc-900'
              }`}
            />
          </div>

          <div>
            <label className="block text-[8.5px] font-bold uppercase tracking-wider text-zinc-500 mb-0.5">
              Registered Company / Studio Name
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Acme Studio Media Pvt Ltd"
              className={`w-full px-2 py-1 rounded-lg text-[10.5px] font-medium border focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition-all ${
                isDarkMode ? 'bg-black border-zinc-700 text-white' : 'bg-white border-zinc-300 text-zinc-900'
              }`}
            />
          </div>
        </div>
      )}

      {/* Payment Error / Recovery Status */}
      {(errorMessage || state === 'failed') && (
        <div className="p-2 rounded-xl border border-rose-500/30 bg-rose-950/20 text-rose-300 text-xs flex items-start gap-1.5 animate-fadeIn">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-400" />
          <div className="flex-1 space-y-0.5">
            <div className="font-bold text-rose-200 text-[10.5px]">Payment Notice</div>
            <p className="text-[9.5px] leading-tight text-rose-300/90">
              {errorMessage || 'Payment service was unable to complete the transaction. Please try again.'}
            </p>
            <button
              type="button"
              onClick={handleProcessCheckout}
              disabled={isSubmitting}
              className="text-[9.5px] font-bold text-white underline hover:no-underline cursor-pointer disabled:opacity-50"
            >
              Retry Payment
            </button>
          </div>
        </div>
      )}

      {(state === 'polling_status' || state === 'pending_recovery') && (
        <div className={`p-2 rounded-xl border text-xs flex items-start gap-1.5 animate-fadeIn ${
          isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-zinc-50 border-zinc-200 text-zinc-800'
        }`}>
          <RefreshCw className="w-3.5 h-3.5 shrink-0 mt-0.5 animate-spin text-emerald-500" />
          <div className="space-y-0.5">
            <div className="font-bold text-[10.5px]">
              {state === 'polling_status' ? 'Reconciling with Bank...' : 'Payment Under Verification'}
            </div>
            <p className="text-[9px] opacity-80">{recoveryMessage}</p>
          </div>
        </div>
      )}
    </div>
  );

  const renderOrderSummary = (isCompactMobile = false) => (
    <div
      className={`rounded-xl sm:rounded-2xl border ${
        isCompactMobile ? 'p-2 space-y-1' : 'p-3.5 sm:p-4 space-y-2.5'
      } ${
        isDarkMode ? 'bg-[#0e0e11] border-zinc-800' : 'bg-white border-zinc-200 shadow-xs'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className={`${isCompactMobile ? 'w-4 h-4' : 'w-5 h-5'} rounded-md bg-black dark:bg-white text-white dark:text-black flex items-center justify-center`}>
            <Shield className={`${isCompactMobile ? 'w-2.5 h-2.5' : 'w-3 h-3'} fill-current`} />
          </div>
          <span className={`font-extrabold text-zinc-900 dark:text-white ${isCompactMobile ? 'text-[10.5px]' : 'text-xs sm:text-sm'}`}>
            Order Summary
          </span>
        </div>

        <span className={`font-bold text-zinc-500 ${isCompactMobile ? 'text-[9px]' : 'text-[11px]'}`}>
          {selectedCycle === 'annual' ? '12 Months' : '1 Month'}
        </span>
      </div>

      <div className={`space-y-0.5 font-medium ${isCompactMobile ? 'text-[9px]' : 'text-xs space-y-1.5'}`}>
        {/* Plan Line */}
        <div className="flex justify-between items-center text-zinc-600 dark:text-zinc-400">
          <span>
            Plan Amount ({selectedCycle === 'annual' ? `${currencySymbol}${monthlyPrice} × 12` : `${currencySymbol}${monthlyPrice}`})
          </span>
          <div className="text-right flex items-center gap-1.5 font-mono">
            {selectedCycle === 'annual' && exactAnnualSavings > 0 && (
              <span className="line-through text-zinc-400 dark:text-zinc-500 text-[9px]">
                {currencySymbol}{normalAnnualSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            )}
            <span className="font-extrabold text-zinc-900 dark:text-white">
              {currencySymbol}{actualSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Annual Discount Row */}
        {selectedCycle === 'annual' && exactAnnualSavings > 0 && (
          <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-bold">
            <span>Annual Discount ({savingsPercent}%)</span>
            <span className="font-mono">- {currencySymbol}{exactAnnualSavings.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        )}

        {/* Coupon Discount Row */}
        {couponDiscountAmount > 0 && (
          <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-bold">
            <span>Promo Code ({appliedCoupon?.code})</span>
            <span className="font-mono">- {currencySymbol}{couponDiscountAmount.toFixed(2)}</span>
          </div>
        )}

        {/* Proration Credit Row */}
        {prorationCredit > 0 && (
          <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-bold">
            <span>Unused Credit</span>
            <span className="font-mono">- {currencySymbol}{prorationCredit.toFixed(2)}</span>
          </div>
        )}

        {/* GST Row (INR only) */}
        {!isUsd && (
          <div className="flex justify-between items-center text-zinc-600 dark:text-zinc-400">
            <span className="flex items-center gap-1">
              <span>GST (18% Included)</span>
              <HelpCircle className="w-2.5 h-2.5 text-zinc-400" />
            </span>
            <span className="font-mono font-extrabold text-zinc-900 dark:text-white">
              ₹{gstAmount.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      <div className="w-full h-px bg-zinc-200 dark:bg-zinc-800" />

      {/* Total Row */}
      <div className="flex justify-between items-baseline pt-0.5">
        <div>
          <div className={`font-extrabold text-zinc-900 dark:text-white ${isCompactMobile ? 'text-[11px]' : 'text-xs sm:text-sm'}`}>
            Total Due Today
          </div>
          <div className={`text-zinc-500 font-normal ${isCompactMobile ? 'text-[8.5px]' : 'text-[10px]'}`}>
            {selectedCycle === 'annual' ? 'Billed annually' : 'Billed monthly'}
          </div>
        </div>

        <div className={`font-extrabold tracking-tight text-zinc-900 dark:text-white font-mono ${
          isCompactMobile ? 'text-sm sm:text-base' : 'text-xl sm:text-2xl'
        }`}>
          {currencySymbol}{totalPayable.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </div>
      </div>
    </div>
  );

  const renderTermsAndCta = (isCompactMobile = false) => (
    <div className={isCompactMobile ? 'space-y-1' : 'space-y-2.5'}>
      {/* Terms Agreement Checkbox */}
      <label className={`flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400 cursor-pointer select-none ${
        isCompactMobile ? 'text-[9px]' : 'text-[11px]'
      }`}>
        <input
          type="checkbox"
          checked={consentAccepted}
          onChange={(e) => setConsentAccepted(e.target.checked)}
          className="w-3.5 h-3.5 rounded border-zinc-300 dark:border-zinc-700 text-black focus:ring-black accent-black dark:accent-white cursor-pointer shrink-0"
        />
        <span>
          I agree to the{' '}
          <a href="/terms" target="_blank" className="underline font-bold text-zinc-900 dark:text-white">
            Terms
          </a>{' '}
          and{' '}
          <a href="/privacy" target="_blank" className="underline font-bold text-zinc-900 dark:text-white">
            Privacy Policy
          </a>
          .
        </span>
      </label>

      {/* Main Pay CTA Button */}
      <button
        type="button"
        onClick={handleProcessCheckout}
        disabled={
          isSubmitting ||
          !consentAccepted ||
          (!razorpayLoaded && selectedGateway === 'razorpay')
        }
        className={`w-full rounded-xl font-black bg-black dark:bg-white text-white dark:text-black hover:opacity-90 transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
          isCompactMobile ? 'py-2.5 text-xs' : 'py-3.5 text-sm'
        }`}
      >
        {state === 'creating_order' ? (
          <>
            <ImSpinner2 className="w-3 h-3 animate-spin" />
            <span>Initiating Payment...</span>
          </>
        ) : state === 'awaiting_payment' ? (
          <>
            <ImSpinner2 className="w-3 h-3 animate-spin" />
            <span>Awaiting Gateway...</span>
          </>
        ) : state === 'verifying' ? (
          <>
            <ImSpinner2 className="w-3 h-3 animate-spin" />
            <span>Verifying Signature...</span>
          </>
        ) : state === 'polling_status' ? (
          <>
            <RefreshCw className="w-3 h-3 animate-spin" />
            <span>Reconciling Order...</span>
          </>
        ) : (
          <>
            <Lock className="w-3 h-3 fill-current" />
            <span>
              Pay {currencySymbol}{totalPayable.toLocaleString(undefined, { minimumFractionDigits: 2 })} via{' '}
              {selectedGateway === 'razorpay'
                ? 'Razorpay'
                : selectedGateway === 'stripe'
                ? 'Stripe'
                : 'SuviX Wallet'}
            </span>
            <ArrowRight className="w-3 h-3" />
          </>
        )}
      </button>
    </div>
  );

  const renderTrustBadges = (isCompactMobile = false) => (
    <div className={`border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-zinc-500 font-medium ${
      isCompactMobile ? 'pt-1 text-[8px]' : 'pt-2.5 text-[10.5px] sm:text-[11px]'
    }`}>
      <div className="flex items-center gap-1">
        <ShieldCheck className={`${isCompactMobile ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'} text-zinc-700 dark:text-zinc-300`} />
        <span>14-day refund</span>
      </div>
      <div className="flex items-center gap-1">
        <Lock className={`${isCompactMobile ? 'w-2 h-2' : 'w-3 h-3'} text-zinc-700 dark:text-zinc-300`} />
        <span>256-bit encryption</span>
      </div>
      <div className="flex items-center gap-1">
        <FileText className={`${isCompactMobile ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'} text-zinc-700 dark:text-zinc-300`} />
        <span>RBI compliant</span>
      </div>
    </div>
  );

  return createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      className="fixed inset-0 z-[999999] flex items-center justify-center p-0 sm:p-3 md:p-4 bg-black/80 backdrop-blur-md animate-fadeIn font-sans"
    >
      <div
        className={`relative w-full max-w-lg lg:max-w-5xl h-full sm:h-auto max-h-[100dvh] sm:max-h-[96vh] rounded-none sm:rounded-3xl border sm:border shadow-2xl overflow-hidden flex flex-col justify-between transition-all duration-200 my-auto ${
          isDarkMode
            ? 'bg-[#000000] border-zinc-800 text-white'
            : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        {/* ── TOP HEADER BAR (Logo + Lock + Title + Subtitle + Close) ────────── */}
        <div
          className={`relative flex items-center justify-between px-3.5 sm:px-7 py-2 sm:py-3 border-b shrink-0 ${
            isDarkMode ? 'border-zinc-800/80 bg-black' : 'border-zinc-100 bg-white'
          }`}
        >
          {/* Left: Brand Logo */}
          <div className="flex items-center">
            <img
              src={isDarkMode ? whitebglogoImg : blackbglogoImg}
              alt="SuviX"
              className="h-12 sm:h-15 w-auto object-contain select-none"
            />
          </div>

          {/* Center: Secure Checkout + Lock */}
          <div className="text-center absolute left-1/2 -translate-x-1/2">
            <div className="flex items-center justify-center gap-1.5 font-bold text-xs sm:text-base text-zinc-900 dark:text-white">
              <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-zinc-900 dark:text-white fill-current" />
              <span>Secure Checkout</span>
            </div>
            <p className="text-[9px] sm:text-[11px] text-zinc-500 font-normal hidden sm:block">
              Your payment information is secure and encrypted
            </p>
          </div>

          {/* Right: Close Button */}
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl border flex items-center justify-center transition-all cursor-pointer disabled:opacity-40 ${
                isDarkMode
                  ? 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-white'
                  : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900'
              }`}
              aria-label="Close Checkout"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ── DESKTOP VIEW (2-Column Zero-Scroll Layout for Laptop Screens) ────────── */}
        <div className="hidden lg:grid lg:grid-cols-12 flex-1 overflow-y-auto">
          {/* LEFT COLUMN: Account, Payment Methods, Billing, Trust Badges */}
          <div
            className={`lg:col-span-7 p-4 sm:p-5 flex flex-col justify-between border-r gap-3.5 ${
              isDarkMode ? 'border-zinc-800 bg-[#0a0a0c]' : 'border-zinc-200 bg-white'
            }`}
          >
            <div className="space-y-3.5">
              {renderAccount(false)}
              {renderPaymentMethods(false)}
              {renderBilling(false)}
            </div>
            {renderTrustBadges(false)}
          </div>

          {/* RIGHT COLUMN: Plan Card, Promo Code, Order Summary, Terms, Pay CTA */}
          <div
            className={`lg:col-span-5 p-4 sm:p-5 flex flex-col justify-between gap-3.5 ${
              isDarkMode ? 'bg-[#000000]' : 'bg-[#fafafa]'
            }`}
          >
            <div className="space-y-3">
              {renderPlanCard(false)}
              {renderPromoCode(false)}
              {renderOrderSummary(false)}
              {renderTermsAndCta(false)}
            </div>
          </div>
        </div>

        {/* ── MOBILE VIEW (Single Screen Zero-Scroll High Density Mockup Order) ────────── */}
        <div className="block lg:hidden flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
          {renderAccount(true)}
          {renderPlanCard(true)}
          {renderPaymentMethods(true)}
          {renderPromoCode(true)}
          {renderBilling(true)}
          {renderOrderSummary(true)}
          {renderTermsAndCta(true)}
          {renderTrustBadges(true)}
        </div>
      </div>
    </div>,
    document.body
  );
};

