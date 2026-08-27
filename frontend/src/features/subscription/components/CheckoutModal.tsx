import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  CreditCard,
  QrCode,
  Check,
  Lock,
  ArrowRight,
  AlertCircle,
  HelpCircle,
  Building2,
  Tag,
  CheckCircle2,
  Sparkles,
  Zap,
} from 'lucide-react';
import { ImSpinner2 } from 'react-icons/im';
import { subscriptionService, type ProrationQuote } from '../../../api/services/subscription.service';
import type { PlanCardPresenter, WorkspaceRole } from '../rolePlanConfig';
import razorpayLogoImg from '../../../assets/razorpay.png';
import stripeLogoImg from '../../../assets/stripe.png';
import walletLogoImg from '../../../assets/wallet.png';
import {
  GooglePayLogo,
  PhonePeLogo,
  PaytmLogo,
  UpiLogo,
  VisaLogo,
  MastercardLogo,
  RupayLogo,
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
}) => {
  const [selectedCycle, setSelectedCycle] = useState<'monthly' | 'annual'>(initialBillingCycle);
  const [selectedGateway, setSelectedGateway] = useState<'razorpay' | 'stripe' | 'wallet'>('razorpay');

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountPercent: number } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Business GST state
  const [showGstInput, setShowGstInput] = useState(false);
  const [gstinNumber, setGstinNumber] = useState('');
  const [companyName, setCompanyName] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  // Sync initial cycle
  useEffect(() => {
    setSelectedCycle(initialBillingCycle);
  }, [initialBillingCycle]);

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
    script.onerror = () => setError('Failed to load secure payment gateway SDK. Please check your network.');
    document.body.appendChild(script);
  }, []);

  if (!isOpen) return null;

  // Pricing Calculations
  const baseMonthlyPrice = selectedCycle === 'annual' ? plan.priceAnnual : plan.priceMonthly;
  const billingMonths = selectedCycle === 'annual' ? 12 : 1;
  const subtotalBeforeDiscount = plan.priceMonthly * billingMonths;
  const actualSubtotal = baseMonthlyPrice * billingMonths;
  const annualSavings = subtotalBeforeDiscount - actualSubtotal;

  // Coupon discount
  const couponDiscountAmount = appliedCoupon
    ? Math.round(actualSubtotal * (appliedCoupon.discountPercent / 100) * 100) / 100
    : 0;

  const discountedSubtotal = Math.max(0, actualSubtotal - couponDiscountAmount);

  // Indian GST 18% (SAC 998439)
  const gstRate = 0.18;
  const gstAmount = Math.round(discountedSubtotal * gstRate * 100) / 100;
  const cgst = Math.round((gstAmount / 2) * 100) / 100;
  const sgst = Math.round((gstAmount / 2) * 100) / 100;

  const prorationCredit = prorationQuote?.unusedCredit || 0;
  const totalPayable = Math.max(0, Math.round((discountedSubtotal + gstAmount - prorationCredit) * 100) / 100);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError(null);
    const cleaned = couponCode.trim().toUpperCase();
    if (!cleaned) return;

    if (cleaned === 'SUVI20' || cleaned === 'CREATOR20') {
      setAppliedCoupon({ code: cleaned, discountPercent: 20 });
    } else if (cleaned === 'LAUNCH50') {
      setAppliedCoupon({ code: cleaned, discountPercent: 50 });
    } else if (cleaned === 'SUVIPRO') {
      setAppliedCoupon({ code: cleaned, discountPercent: 15 });
    } else {
      setCouponError('Invalid coupon code. Try CREATOR20 or SUVIPRO');
    }
  };

  const handleProcessCheckout = async () => {
    setError(null);
    setLoading(true);

    const idempotencyKey = 'order_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);

    try {
      if (selectedGateway === 'wallet') {
        // Instant Wallet Debit (Sub-millisecond)
        const walletRes = await subscriptionService.createSubscription({
          planId: plan.id,
          billingCycle: selectedCycle,
          provider: 'suvix_wallet',
        });
        setLoading(false);
        onSuccess({
          ...walletRes,
          plan,
          billingCycle: selectedCycle,
          amountPaid: totalPayable,
          paymentId: 'WAL-' + Date.now().toString().substring(6),
        });
        return;
      }

      // 1. Create Payment Order on Backend
      const orderData = await subscriptionService.createPaymentOrder(
        {
          planId: plan.id,
          billingCycle: selectedCycle,
          amount: totalPayable,
          currency: 'INR',
          targetRole: role,
        },
        idempotencyKey
      );

      const razorpayOrderId = orderData.orderId || orderData.id || orderData.razorpayOrderId;
      const razorpayKey = orderData.keyId || (import.meta as any).env.VITE_RAZORPAY_KEY_ID || 'rzp_test_SuviXPlatformKey';

      // 2. Open Official Razorpay Checkout Modal
      if (window.Razorpay) {
        const options = {
          key: razorpayKey,
          amount: Math.round(totalPayable * 100), // in paise
          currency: 'INR',
          name: 'SuviX Platform',
          description: `${plan.name} (${selectedCycle.toUpperCase()} BILLING)`,
          image: 'https://suvix.in/logo.png',
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
            color: '#10b981', // Emerald
          },
          modal: {
            ondismiss: () => {
              setLoading(false);
            },
          },
          handler: async (response: {
            razorpay_payment_id: string;
            razorpay_order_id: string;
            razorpay_signature: string;
          }) => {
            try {
              // 3. Verify Signature & Provision Entitlements
              const verifyRes = await subscriptionService.verifyPayment(
                {
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                  planId: plan.id,
                  billingCycle: selectedCycle,
                },
                idempotencyKey
              );

              setLoading(false);
              onSuccess({
                ...verifyRes,
                plan,
                billingCycle: selectedCycle,
                amountPaid: totalPayable,
                paymentId: response.razorpay_payment_id,
              });
            } catch (vErr: any) {
              setLoading(false);
              setError(vErr.response?.data?.message || 'Payment verification failed. Please contact support.');
            }
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', (failRes: any) => {
          setLoading(false);
          setError(failRes.error?.description || 'Payment was cancelled or failed.');
        });
        rzp.open();
      } else {
        // Fallback Direct Upgrade
        const upgradeRes = await subscriptionService.upgradeSubscription({
          targetPlanId: plan.id,
          provider: 'direct',
        });
        setLoading(false);
        onSuccess({
          ...upgradeRes,
          plan,
          billingCycle: selectedCycle,
          amountPaid: totalPayable,
        });
      }
    } catch (err: any) {
      setLoading(false);
      setError(err.response?.data?.message || 'Failed to initiate order checkout.');
    }
  };

  const PlanIcon = plan.icon || Sparkles;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fadeIn overflow-y-auto font-sans">
      <div className="relative w-full max-w-4xl rounded-3xl border border-zinc-200 shadow-2xl overflow-hidden transition-all duration-200 my-auto bg-white text-zinc-900">
        
        {/* ── MODAL TOP BAR ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-200 bg-zinc-50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <Lock className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-900">SuviX Checkout</span>
                <span className="text-[9.5px] px-2 py-0.2 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-600 font-medium">
                  256-Bit Encrypted
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-zinc-200/60 text-zinc-400 hover:text-zinc-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── 2-COLUMN SPLIT VIEW ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[480px]">
          
          {/* ════ LEFT COLUMN: Gateway Provider Selection (7 Cols) ════════════ */}
          <div className="lg:col-span-7 p-5 sm:p-6 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-zinc-200 space-y-4 bg-white">
            <div className="space-y-4">
              
              {/* Account Context Pill */}
              <div className="p-3 rounded-2xl border border-zinc-200 flex items-center justify-between gap-3 text-xs bg-zinc-50">
                <div>
                  <div className="text-[10px] text-zinc-500 font-normal uppercase tracking-wider">
                    Billing Account
                  </div>
                  <div className="font-semibold text-zinc-900 truncate max-w-[240px]">
                    {user?.email || 'Authenticated User'}
                  </div>
                </div>
                <span className="text-[10.5px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 capitalize">
                  {role} Workspace
                </span>
              </div>

              {/* Provider Selection Title */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                  Choose Payment Gateway Provider
                </label>

                {/* 3 Rich Provider Cards */}
                <div className="space-y-2.5">
                  
                  {/* Provider 1: Razorpay India */}
                  <div
                    onClick={() => setSelectedGateway('razorpay')}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      selectedGateway === 'razorpay'
                        ? 'border-emerald-500 bg-emerald-50/40 shadow-sm ring-1 ring-emerald-500/30'
                        : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <img src={razorpayLogoImg} alt="Razorpay" className="h-5 w-auto object-contain" />
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100/70 text-emerald-800 font-semibold">
                          Recommended for India
                        </span>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          selectedGateway === 'razorpay'
                            ? 'border-emerald-600 bg-emerald-600 text-white'
                            : 'border-zinc-300 bg-white'
                        }`}
                      >
                        {selectedGateway === 'razorpay' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                    </div>

                    <p className="text-[11px] text-zinc-600 font-normal leading-relaxed">
                      Pay instantly with all popular Indian payment modes inside Razorpay's official secure portal.
                    </p>

                    {/* Supported Methods Icons */}
                    <div className="flex items-center gap-3 pt-2 mt-1 border-t border-zinc-200/70 flex-wrap">
                      <GooglePayLogo className="h-3.5 w-auto" />
                      <PhonePeLogo className="h-3.5 w-auto" />
                      <PaytmLogo className="h-3 w-auto" />
                      <UpiLogo className="h-3 w-auto" />
                      <VisaLogo className="h-3 w-auto" />
                      <MastercardLogo className="h-3.5 w-auto" />
                      <RupayLogo className="h-3 w-auto" />
                      <span className="text-[10px] text-zinc-500 font-medium ml-auto">50+ Banks NetBanking</span>
                    </div>
                  </div>

                  {/* Provider 2: Stripe Global */}
                  <div
                    onClick={() => setSelectedGateway('stripe')}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      selectedGateway === 'stripe'
                        ? 'border-emerald-500 bg-emerald-50/40 shadow-sm ring-1 ring-emerald-500/30'
                        : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <img src={stripeLogoImg} alt="Stripe" className="h-5 w-auto object-contain" />
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200/60">
                          International & Global
                        </span>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          selectedGateway === 'stripe'
                            ? 'border-emerald-600 bg-emerald-600 text-white'
                            : 'border-zinc-300 bg-white'
                        }`}
                      >
                        {selectedGateway === 'stripe' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                    </div>

                    <p className="text-[11px] text-zinc-600 font-normal leading-relaxed">
                      Pay with International Cards, Apple Pay, Google Pay, or Global Currencies through Stripe.
                    </p>

                    <div className="flex items-center gap-3 pt-2 mt-1 border-t border-zinc-200/70 flex-wrap">
                      <ApplePayLogo className="h-4 w-auto" />
                      <GooglePayLogo className="h-3.5 w-auto" />
                      <VisaLogo className="h-3 w-auto" />
                      <MastercardLogo className="h-3.5 w-auto" />
                      <span className="text-[10px] text-zinc-500 font-medium ml-auto">135+ Currencies</span>
                    </div>
                  </div>

                  {/* Provider 3: SuviX Wallet */}
                  <div
                    onClick={() => setSelectedGateway('wallet')}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      selectedGateway === 'wallet'
                        ? 'border-emerald-500 bg-emerald-50/40 shadow-sm ring-1 ring-emerald-500/30'
                        : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <img src={walletLogoImg} alt="Wallet" className="h-5 w-auto object-contain" />
                        <span className="text-xs font-semibold text-zinc-900">SuviX Creator Wallet</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 font-semibold border border-amber-200">
                          Instant 1-Click
                        </span>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          selectedGateway === 'wallet'
                            ? 'border-emerald-600 bg-emerald-600 text-white'
                            : 'border-zinc-300 bg-white'
                        }`}
                      >
                        {selectedGateway === 'wallet' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                    </div>

                    <p className="text-[11px] text-zinc-600 font-normal leading-relaxed">
                      Deduct directly from your creator earnings, sponsorship escrow, or collaboration payout balance.
                    </p>
                  </div>

                </div>
              </div>

              {/* Optional B2B GSTIN Input */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowGstInput((prev) => !prev)}
                  className="text-[11px] text-zinc-500 hover:text-emerald-600 transition-colors flex items-center gap-1 font-medium"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{showGstInput ? 'Hide Business GST Details' : '+ Add GSTIN for Business Tax Invoice (Optional)'}</span>
                </button>

                {showGstInput && (
                  <div className="grid grid-cols-2 gap-2 mt-2 p-3 rounded-2xl bg-zinc-50 border border-zinc-200 animate-fadeIn">
                    <div>
                      <label className="text-[10px] text-zinc-500 block mb-0.5">GSTIN Number</label>
                      <input
                        type="text"
                        placeholder="29AAAAA0000A1Z5"
                        value={gstinNumber}
                        onChange={(e) => setGstinNumber(e.target.value.toUpperCase())}
                        className="w-full p-2 rounded-xl text-xs bg-white border border-zinc-300 text-zinc-900 font-mono uppercase"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500 block mb-0.5">Company Legal Name</label>
                      <input
                        type="text"
                        placeholder="Acme Studio Pvt Ltd"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full p-2 rounded-xl text-xs bg-white border border-zinc-300 text-zinc-900"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

            </div>

            {/* Bottom Security Guarantee */}
            <div className="pt-3 border-t border-zinc-200 flex items-center justify-between text-[10.5px] text-zinc-500">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>PCI-DSS Level 1 & RBI Compliant</span>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Immediate Activation</span>
              </div>
            </div>
          </div>

          {/* ════ RIGHT COLUMN: Transparent Order Summary & Pay CTA (5 Cols) ════ */}
          <div className="lg:col-span-5 p-5 sm:p-6 bg-zinc-50/90 flex flex-col justify-between space-y-4">
            <div className="space-y-3.5">
              
              {/* Plan Emblem & Cycle Switcher */}
              <div className="p-3.5 rounded-2xl border border-zinc-200 bg-white shadow-sm">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                      <PlanIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold tracking-tight text-zinc-900">{plan.name}</h3>
                      <p className="text-[10.5px] text-zinc-500 font-normal">Tier {plan.tierLevel}</p>
                    </div>
                  </div>
                </div>

                {/* Billing Cycle Switcher inside checkout */}
                <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-zinc-100 border border-zinc-200 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setSelectedCycle('monthly')}
                    className={`py-1.5 px-2 rounded-lg font-medium transition-all ${
                      selectedCycle === 'monthly'
                        ? 'bg-white text-zinc-900 shadow-sm'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    Monthly (₹{plan.priceMonthly})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCycle('annual')}
                    className={`py-1.5 px-2 rounded-lg font-medium transition-all flex items-center justify-center gap-1 ${
                      selectedCycle === 'annual'
                        ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    <span>Annual</span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-black/10 text-white font-bold">-20%</span>
                  </button>
                </div>
              </div>

              {/* Coupon Code Input */}
              <form onSubmit={handleApplyCoupon} className="space-y-1">
                <div className="flex gap-1.5">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      placeholder="Coupon Code (e.g. CREATOR20)"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="w-full pl-8 pr-2.5 py-1.5 rounded-xl text-xs bg-white border border-zinc-300 text-zinc-900 uppercase placeholder:normal-case font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-xl text-xs font-medium bg-zinc-200 hover:bg-zinc-300 text-zinc-800 transition-colors border border-zinc-300"
                  >
                    Apply
                  </button>
                </div>

                {appliedCoupon && (
                  <div className="flex items-center gap-1 text-[10.5px] text-emerald-600 font-medium pt-0.5">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Coupon [{appliedCoupon.code}] applied ({appliedCoupon.discountPercent}% OFF)</span>
                  </div>
                )}

                {couponError && (
                  <div className="text-[10px] text-rose-500 pt-0.5">{couponError}</div>
                )}
              </form>

              {/* Itemized Financial Breakdown */}
              <div className="p-3.5 rounded-2xl border border-zinc-200 bg-white space-y-2 text-xs font-normal text-zinc-700 shadow-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Base Subtotal ({selectedCycle === 'annual' ? '12 Months' : '1 Month'}):</span>
                  <span className="font-medium text-zinc-900">₹{actualSubtotal.toFixed(2)}</span>
                </div>

                {selectedCycle === 'annual' && annualSavings > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Annual 20% Commitment Discount:</span>
                    <span>- ₹{annualSavings.toFixed(2)}</span>
                  </div>
                )}

                {couponDiscountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Coupon Promo Discount:</span>
                    <span>- ₹{couponDiscountAmount.toFixed(2)}</span>
                  </div>
                )}

                {prorationCredit > 0 && (
                  <div className="flex justify-between text-cyan-600 font-medium">
                    <span>Unused Plan Proration Credit:</span>
                    <span>- ₹{prorationCredit.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-zinc-500">
                  <span className="flex items-center gap-1">
                    <span>18% Indian GST (SAC 998439):</span>
                    <HelpCircle className="w-3 h-3 opacity-60" />
                  </span>
                  <span className="font-medium text-zinc-900">₹{gstAmount.toFixed(2)}</span>
                </div>

                {gstAmount > 0 && (
                  <div className="flex justify-between text-[10px] text-zinc-400 pl-2">
                    <span>CGST (9%) + SGST (9%):</span>
                    <span>₹{cgst.toFixed(2)} + ₹{sgst.toFixed(2)}</span>
                  </div>
                )}

                <div className="w-full h-px bg-zinc-200 my-2" />

                <div className="flex justify-between items-baseline text-sm font-semibold text-zinc-900">
                  <span>Total Due Today:</span>
                  <span className="text-xl font-bold text-emerald-600">₹{totalPayable.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Pay CTA Button */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleProcessCheckout}
                disabled={loading || (!razorpayLoaded && selectedGateway === 'razorpay')}
                className="w-full py-3 rounded-full text-xs font-semibold bg-emerald-500 text-black hover:bg-emerald-400 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <ImSpinner2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Opening Secure Checkout...</span>
                  </>
                ) : (
                  <>
                    <span>
                      Pay ₹{totalPayable.toFixed(2)} via {selectedGateway === 'razorpay' ? 'Razorpay' : selectedGateway === 'stripe' ? 'Stripe' : 'Wallet'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              <p className="text-[10px] text-center text-zinc-500 font-normal">
                Renews automatically • Self-serve pause or cancel anytime from billing dashboard.
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
