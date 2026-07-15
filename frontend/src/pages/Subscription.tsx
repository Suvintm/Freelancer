import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser, setTokens, updateUser } from '../store/slices/authSlice';
import { subscriptionService } from '../api/services/subscription.service';
import type { Plan, UserSubscription } from '../api/services/subscription.service';
import { authService } from '../api/services/auth.service';
import { useTheme } from '../hooks/useTheme';

import { 
  MdCheck, 
  MdKeyboardArrowUp, 
  MdKeyboardArrowDown, 
  MdInfoOutline, 
  MdErrorOutline, 
  MdClose,
  MdWorkspacePremium,
  MdBusinessCenter,
  MdBrush,
  MdPerson,
  MdCalendarToday
} from 'react-icons/md';

import { ImSpinner2 } from 'react-icons/im';

// Declare Razorpay types for TypeScript
interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill: {
    name: string;
    email: string;
  };
  theme: {
    color: string;
  };
}

interface RazorpayInstance {
  open: () => void;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function Subscription() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const { isDarkMode } = useTheme();
  
  const [plans, setPlans] = useState<Plan[]>([]);
  const [activeSub, setActiveSub] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'info' });
  const [showCancelModal, setShowCancelModal] = useState(false);
  
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('monthly');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [now] = useState(() => Date.now());

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const triggerToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 5000);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const plansRes = await subscriptionService.getPlans();
      if (plansRes.success) {
        setPlans(plansRes.plans.sort((a, b) => a.sortOrder - b.sortOrder));
      }

      const subRes = await subscriptionService.getMySubscriptions();
      if (subRes.success && subRes.subscriptions.length > 0) {
        const active = subRes.subscriptions.find(
          s => s.status === 'active' || s.status === 'trial'
        );
        if (active) {
          setActiveSub(active);
        } else {
          setActiveSub(null);
        }
      }
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      triggerToast(errorMsg || 'Failed to load subscription data', 'error');
    } finally {
      setLoading(false);
    }
  }, [triggerToast]);

  useEffect(() => {
    const init = async () => {
      await Promise.resolve();
      loadData();
    };
    init();
  }, [loadData]);

  const refreshUserProfile = async () => {
    try {
      const meRes = await authService.fetchMe();
      if (meRes.success && meRes.user) {
        dispatch(updateUser(meRes.user));
      }
    } catch (err) {
      console.error('Failed to refresh user auth state:', err);
    }
  };

  const handleStartTrial = async (plan: Plan) => {
    setActionLoading(plan._id);
    try {
      const res = await subscriptionService.startTrial(plan._id);
      if (res.success) {
        triggerToast(`${plan.name} free trial activated!`, 'success');
        await loadData();
        await refreshUserProfile();
      }
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      triggerToast(errorMsg || 'Failed to activate trial', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSubscribe = async (plan: Plan) => {
    if (!user) {
      navigate('/login');
      return;
    }

    setActionLoading(plan._id);
    try {
      const orderData = await subscriptionService.createOrder(plan._id);
      
      if (!orderData.orderId) {
        throw new Error('Order creation failed');
      }

      const options: RazorpayOptions = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'SuviX Premium',
        description: `${plan.name} Subscription`,
        order_id: orderData.orderId,
        handler: async (response: RazorpayResponse) => {
          setActionLoading(plan._id);
          try {
            const verifyRes = await subscriptionService.verifyPayment({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              subscriptionId: orderData.subscriptionId,
            });

            if (verifyRes.success) {
              triggerToast(`Subscription to ${plan.name} activated successfully!`, 'success');
              await loadData();
              await refreshUserProfile();
            } else {
              triggerToast('Payment verification failed. Please contact support.', 'error');
            }
          } catch (err: unknown) {
            const errorMsg = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
            triggerToast(errorMsg || 'Failed to verify payment', 'error');
          } finally {
            setActionLoading(null);
          }
        },
        prefill: {
          name: user.name || 'User',
          email: user.email || '',
        },
        theme: {
          color: '#1a73e8', // Google Blue
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      triggerToast(errorMsg || 'Failed to initiate checkout', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (!activeSub) return;
    setActionLoading('cancel');
    try {
      const res = await subscriptionService.cancelSubscription(activeSub._id);
      if (res.success) {
        triggerToast('Subscription cancelled successfully. You retain access until the end date.', 'success');
        setShowCancelModal(false);
        await loadData();
        await refreshUserProfile();
      }
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      triggerToast(errorMsg || 'Cancellation failed', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const getTierIcon = (tier: string, size = 18) => {
    switch (tier) {
      case 'creator': return <MdBrush size={size} />;
      case 'pro': return <MdBusinessCenter size={size} />;
      case 'elite': return <MdWorkspacePremium size={size} />;
      default: return <MdPerson size={size} />;
    }
  };

  const getCardStyle = (tier: string) => {
    if (isDarkMode) {
      return tier === 'pro' 
        ? 'border-t-4 border-t-[#1a73e8] border-zinc-800 bg-[#121212] shadow-lg scale-105 z-10 relative'
        : 'border-t-4 border-t-zinc-700 border-zinc-800 bg-[#121212]';
    } else {
      switch (tier) {
        case 'creator':
          return 'border-t-4 border-t-[#1e8e3e] border-zinc-200 bg-white hover:shadow-md transition-shadow';
        case 'pro':
          return 'border-t-4 border-t-[#1a73e8] border-[#dadce0] bg-white shadow-lg md:scale-105 z-10 relative';
        case 'elite':
          return 'border-t-4 border-t-[#202124] border-zinc-200 bg-white hover:shadow-md transition-shadow';
        default:
          return 'border-t-4 border-t-zinc-300 border-zinc-200 bg-white hover:shadow-md transition-shadow';
      }
    }
  };

  const getBadgeStyle = (tier: string) => {
    switch (tier) {
      case 'creator': return 'bg-[#1e8e3e] text-white'; // Google Green
      case 'pro': return 'bg-[#1a73e8] text-white';     // Google Blue
      case 'elite': return 'bg-[#202124] text-white';   // Almost Black
      default: return 'bg-zinc-200 text-zinc-800';
    }
  };

  const getActionButtonStyle = (tier: string, isCurrent: boolean) => {
    if (isCurrent) {
      return isDarkMode 
        ? 'bg-zinc-800 text-zinc-400 cursor-not-allowed'
        : 'bg-zinc-100 text-zinc-400 cursor-not-allowed';
    }
    
    if (isDarkMode) {
      return tier === 'pro'
        ? 'bg-[#1a73e8] hover:bg-[#1557b0] text-white'
        : 'bg-zinc-800 hover:bg-zinc-700 text-white';
    } else {
      return tier === 'pro'
        ? 'bg-[#1a73e8] hover:bg-[#1557b0] text-white'
        : 'bg-zinc-100 hover:bg-zinc-200 text-[#202124]';
    }
  };

  const currentTier = user?.subscription?.tier || 'free';

  const faqs = [
    {
      q: "Can I cancel my subscription anytime?",
      a: "Yes. You can cancel your premium membership at any time directly from this dashboard. Upon cancellation, you keep all features until the end of your paid billing period."
    },
    {
      q: "How does the 3-day free trial work?",
      a: "Try Creator, Pro, or Elite plans free for 3 days. No upfront charges will be billed. If you wish to continue, the subscription will start automatically at the end of the trial."
    },
    {
      q: "Which features are included in SuviX Premium?",
      a: "Subscriptions unlock nearby geographic search, verified account badges, deep YouTube API metrics integrations, customizable public portfolios, and higher explore page priority."
    },
    {
      q: "What payment methods are supported?",
      a: "We process payments securely through Razorpay, supporting all major credit & debit cards, UPI (GPay, PhonePe, Paytm), Netbanking, and popular digital wallets."
    }
  ];

  const comparisonCategories = [
    {
      title: "Core Platform",
      features: [
        { name: "Home Feed & Custom Profile", free: true, creator: true, pro: true, elite: true },
        { name: "Nearby Search Radius", free: "Limited", creator: "Unlimited", pro: "Unlimited", elite: "Unlimited" },
        { name: "Verified Account Badge 🔵", free: false, creator: false, pro: true, elite: true },
      ]
    },
    {
      title: "Discovery & Marketing",
      features: [
        { name: "Portfolio Public Link", free: false, creator: true, pro: true, elite: true },
        { name: "Explore Feed Priority", free: false, creator: "High", pro: "Boosted", elite: "Maximum" },
        { name: "AI Content Suggestions", free: false, creator: false, pro: true, elite: true },
      ]
    },
    {
      title: "YouTube Creator Tools",
      features: [
        { name: "YT Dashboard Sync", free: "Read-Only", creator: "Full Sync", pro: "Full Sync", elite: "Full Sync" },
        { name: "YT Analytics Deep Dive", free: false, creator: false, pro: true, elite: true },
      ]
    },
    {
      title: "Collaboration & Support",
      features: [
        { name: "Team Collaboration slots", free: false, creator: false, pro: false, elite: "5 Seats" },
        { name: "Remove SuviX branding", free: false, creator: false, pro: false, elite: true },
        { name: "Priority VIP Support", free: false, creator: false, pro: false, elite: "24/7 Priority" },
      ]
    }
  ];

  return (
    <div className={`min-h-screen px-4 pb-12 lg:px-6 mx-auto flex flex-col font-sans ${isDarkMode ? 'bg-[#0f0f0f] text-zinc-200' : 'bg-[#f8f9fa] text-[#202124]'}`}>
      
      {toast.show && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 rounded-md shadow-lg text-xs font-medium ${isDarkMode ? 'bg-zinc-800 text-zinc-200' : 'bg-[#202124] text-white'}`}>
          {toast.type === 'error' ? <MdErrorOutline size={16} className="text-red-400" /> : <MdInfoOutline size={16} className="text-[#8ab4f8]" />}
          <span>{toast.message}</span>
          <button onClick={() => setToast(prev => ({ ...prev, show: false }))} className="ml-2 opacity-70 hover:opacity-100">
            <MdClose size={14} />
          </button>
        </div>
      )}

      <div className="w-full max-w-[1000px] mx-auto mt-8 flex flex-col items-center">
        
        <div className="text-center max-w-2xl mb-12">
          <h1 className="text-3xl lg:text-4xl font-medium tracking-tight mb-4">
            Pricing that scales with you
          </h1>
          <p className={`text-base ${isDarkMode ? 'text-zinc-400' : 'text-[#5f6368]'}`}>
            Choose the right plan to unlock professional creator tools, custom public portfolios, and deep analytics.
          </p>

          <div className="flex items-center justify-center mt-8">
            <div className={`p-1.5 rounded-full border flex items-center gap-1 shadow-sm ${isDarkMode ? 'border-zinc-700 bg-zinc-800/50' : 'border-zinc-200 bg-zinc-100/50'}`}>
              <button 
                onClick={() => setBillingCycle('monthly')}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${billingCycle === 'monthly' ? (isDarkMode ? 'bg-zinc-700 text-white shadow' : 'bg-white text-[#1a73e8] shadow') : (isDarkMode ? 'text-zinc-400' : 'text-[#5f6368]')}`}
              >
                Monthly
              </button>
              <button 
                onClick={() => setBillingCycle('annually')}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${billingCycle === 'annually' ? (isDarkMode ? 'bg-zinc-700 text-white shadow' : 'bg-white text-[#1a73e8] shadow') : (isDarkMode ? 'text-zinc-400' : 'text-[#5f6368]')}`}
              >
                Annually
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${billingCycle === 'annually' ? 'bg-[#1e8e3e] text-white' : 'bg-[#e6f4ea] text-[#1e8e3e]'}`}>
                  Save 20%
                </span>
              </button>
            </div>
          </div>
        </div>

        {activeSub && (
          <div className={`w-full max-w-[800px] mb-8 rounded-lg border p-4 flex flex-col md:flex-row items-center justify-between gap-4 ${isDarkMode ? 'border-zinc-800 bg-zinc-900/40' : 'border-[#e0e0e0] bg-white shadow-sm'}`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-md ${isDarkMode ? 'bg-[#1a73e8]/20 text-[#8ab4f8]' : 'bg-[#e8f0fe] text-[#1a73e8]'}`}>
                {getTierIcon(activeSub.planTier || 'free', 20)}
              </div>
              <div className="text-left">
                <p className="text-[10px] font-medium uppercase tracking-wide text-[#1a73e8] mb-0.5">
                  Current Plan
                </p>
                <h3 className="text-sm font-medium">
                  {activeSub.planName} ({activeSub.isTrial ? 'Trial' : activeSub.planType})
                </h3>
                <div className={`flex items-center gap-1.5 mt-0.5 text-xs ${isDarkMode ? 'text-zinc-400' : 'text-[#5f6368]'}`}>
                  <MdCalendarToday size={12} />
                  <span>Renews: {new Date(activeSub.endDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-2">
              <div className={`px-3 py-1.5 rounded-md text-xs font-medium border ${isDarkMode ? 'border-zinc-700 bg-zinc-800' : 'border-[#e0e0e0] bg-[#f8f9fa]'}`}>
                {Math.max(0, Math.ceil((new Date(activeSub.endDate).getTime() - now) / (1000 * 60 * 60 * 24)))} days remaining
              </div>
              {activeSub.status !== 'cancelled' && activeSub.autoRenew && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="text-xs font-medium text-red-500 hover:text-red-600 transition-colors"
                >
                  Cancel auto-renew
                </button>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <div className="py-20 flex justify-center">
            <ImSpinner2 size={24} className="text-[#1a73e8] animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full items-stretch">
            {plans.map((plan) => {
              const isCurrent = currentTier === plan.planTier;
              const hasHigherTier = 
                (currentTier === 'creator' && (plan.planTier === 'pro' || plan.planTier === 'elite')) ||
                (currentTier === 'pro' && plan.planTier === 'elite');

              const calculatedPrice = billingCycle === 'annually' 
                ? Math.round(plan.price * 0.8) 
                : plan.price;
              
              const calculatedOriginal = billingCycle === 'annually'
                ? Math.round((plan.originalPrice || 0) * 0.8)
                : (plan.originalPrice || 0);

              return (
                <div
                  key={plan._id}
                  className={`relative rounded-lg border p-5 flex flex-col justify-between transition-all duration-200 ${getCardStyle(plan.planTier)}`}
                >
                  {plan.badge && (
                    <span className={`absolute top-0 right-4 -translate-y-1/2 px-2 py-0.5 rounded-sm text-[10px] font-bold tracking-wide uppercase ${getBadgeStyle(plan.planTier)}`}>
                      {plan.badge}
                    </span>
                  )}

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      {getTierIcon(plan.planTier, 18)}
                      <h3 className="text-base font-medium">{plan.name}</h3>
                    </div>

                    <div className="flex items-baseline gap-1 mt-4 mb-2">
                      <span className="text-3xl font-medium tracking-tight">₹{calculatedPrice}</span>
                      <span className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-[#5f6368]'}`}>/mo</span>
                    </div>

                    {calculatedOriginal > 0 && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs line-through ${isDarkMode ? 'text-zinc-500' : 'text-[#80868b]'}`}>₹{calculatedOriginal}</span>
                        <span className="text-xs font-medium text-[#1e8e3e]">
                          {billingCycle === 'annually' ? 'Save 20%' : `${plan.discountPercent}% off`}
                        </span>
                      </div>
                    )}

                    <p className={`text-xs mt-3 mb-5 leading-relaxed min-h-[36px] ${isDarkMode ? 'text-zinc-400' : 'text-[#5f6368]'}`}>
                      {plan.description}
                    </p>

                    <div className="space-y-2 mb-6">
                      {[...plan.features, ...(plan.planTier !== 'free' ? ['Verified Account Badge'] : [])].map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <MdCheck size={14} className={`mt-0.5 shrink-0 ${plan.planTier === 'pro' ? 'text-[#1a73e8]' : isDarkMode ? 'text-zinc-400' : 'text-[#5f6368]'}`} />
                          <span className={`text-xs ${isDarkMode ? 'text-zinc-300' : 'text-[#3c4043]'}`}>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-auto flex flex-col gap-2">
                    {plan.trialDays > 0 && !activeSub && (
                      <button
                        onClick={() => handleStartTrial(plan)}
                        disabled={actionLoading !== null || isCurrent}
                        className={`w-full py-2 rounded text-xs font-medium border transition-colors flex justify-center items-center gap-1 ${isDarkMode ? 'border-zinc-700 hover:bg-zinc-800 text-zinc-300' : 'border-[#dadce0] hover:bg-[#f8f9fa] text-[#1a73e8]'}`}
                      >
                        {actionLoading === plan._id ? (
                          <ImSpinner2 size={12} className="animate-spin" />
                        ) : (
                          <>Free {plan.trialDays}-day trial</>
                        )}
                      </button>
                    )}

                    <button
                      onClick={() => handleSubscribe(plan)}
                      disabled={actionLoading !== null || isCurrent}
                      className={`w-full py-2 rounded text-xs font-medium transition-colors flex justify-center items-center gap-1 ${getActionButtonStyle(plan.planTier, isCurrent)}`}
                    >
                      {actionLoading === plan._id ? (
                        <ImSpinner2 size={12} className="animate-spin" />
                      ) : isCurrent ? (
                        <span>Current Plan</span>
                      ) : hasHigherTier ? (
                        <span>Upgrade</span>
                      ) : (
                        <span>Get Started</span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && (
          <div className="mt-12 w-full max-w-[800px]">
            <div className="text-center mb-6">
              <h2 className="text-lg font-medium">Compare plan features</h2>
            </div>

            <div className={`rounded-lg border overflow-hidden ${isDarkMode ? 'border-zinc-800' : 'border-[#e0e0e0] bg-white'}`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className={`border-b text-xs ${isDarkMode ? 'border-zinc-800 bg-zinc-900' : 'border-[#e0e0e0] bg-[#f8f9fa]'}`}>
                      <th className="p-3 font-medium text-[#5f6368] dark:text-zinc-400 w-[40%]">Features</th>
                      <th className="p-3 text-center font-medium w-[15%]">Free</th>
                      <th className="p-3 text-center font-medium w-[15%]">Creator</th>
                      <th className="p-3 text-center font-medium text-[#1a73e8] w-[15%]">Pro</th>
                      <th className="p-3 text-center font-medium w-[15%]">Elite</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs">
                    {comparisonCategories.map((category, catIdx) => (
                      <div key={`cat-${catIdx}`} className="contents">
                        <tr className={`border-b ${isDarkMode ? 'border-zinc-800/50 bg-zinc-900/30' : 'border-[#f1f3f4] bg-[#f8f9fa]'}`}>
                          <td colSpan={5} className={`p-2.5 font-medium ${isDarkMode ? 'text-zinc-400' : 'text-[#5f6368]'}`}>
                            {category.title}
                          </td>
                        </tr>
                        
                        {category.features.map((feat, featIdx) => (
                          <tr key={`feat-${featIdx}`} className={`border-b last:border-b-0 ${isDarkMode ? 'border-zinc-800/50 hover:bg-zinc-900/20' : 'border-[#f1f3f4] hover:bg-[#f8f9fa]'}`}>
                            <td className={`p-3 ${isDarkMode ? 'text-zinc-300' : 'text-[#3c4043]'}`}>
                              {feat.name}
                            </td>
                            
                            <td className="p-3 text-center">
                              {feat.free === true ? <MdCheck size={16} className="mx-auto text-[#1a73e8]" /> : feat.free === false ? <span className="text-[#9aa0a6]">—</span> : <span className="text-[#5f6368]">{feat.free}</span>}
                            </td>
                            
                            <td className="p-3 text-center">
                              {feat.creator === true ? <MdCheck size={16} className="mx-auto text-[#1e8e3e]" /> : feat.creator === false ? <span className="text-[#9aa0a6]">—</span> : <span className="text-[#3c4043] dark:text-zinc-300">{feat.creator}</span>}
                            </td>
                            
                            <td className={`p-3 text-center ${isDarkMode ? 'bg-[#1a73e8]/5' : 'bg-[#e8f0fe]/30'}`}>
                              {feat.pro === true ? <MdCheck size={16} className="mx-auto text-[#1a73e8]" /> : feat.pro === false ? <span className="text-[#9aa0a6]">—</span> : <span className="text-[#1a73e8]">{feat.pro}</span>}
                            </td>
                            
                            <td className="p-3 text-center">
                              {feat.elite === true ? <MdCheck size={16} className="mx-auto text-[#3c4043] dark:text-zinc-200" /> : feat.elite === false ? <span className="text-[#9aa0a6]">—</span> : <span className="text-[#3c4043] dark:text-zinc-300">{feat.elite}</span>}
                            </td>
                          </tr>
                        ))}
                      </div>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {!loading && (
          <div className="mt-16 w-full max-w-[800px] mb-8">
            <h2 className="text-lg font-medium text-center mb-6">Frequently asked questions</h2>
            <div className="grid gap-3">
              {faqs.map((faq, idx) => (
                <div 
                  key={idx} 
                  className={`rounded-md border ${isDarkMode ? 'border-zinc-800 bg-zinc-900/20' : 'border-[#e0e0e0] bg-white'}`}
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full p-4 flex items-center justify-between text-left"
                  >
                    <span className="text-sm font-medium">{faq.q}</span>
                    {openFaq === idx ? (
                      <MdKeyboardArrowUp size={20} className={isDarkMode ? 'text-zinc-400' : 'text-[#5f6368]'} />
                    ) : (
                      <MdKeyboardArrowDown size={20} className={isDarkMode ? 'text-zinc-400' : 'text-[#5f6368]'} />
                    )}
                  </button>
                  {openFaq === idx && (
                    <div className={`p-4 pt-0 text-sm leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-[#5f6368]'}`}>
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {showCancelModal && activeSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className={`max-w-[400px] w-full rounded-lg p-6 shadow-xl ${isDarkMode ? 'bg-zinc-900 border border-zinc-800' : 'bg-white'}`}>
            <h3 className="text-lg font-medium mb-2">Cancel Subscription</h3>
            <p className={`text-sm mb-6 ${isDarkMode ? 'text-zinc-400' : 'text-[#5f6368]'}`}>
              Are you sure you want to cancel your <strong>{activeSub.planName}</strong> plan? You will lose access to premium features at the end of your billing cycle on {new Date(activeSub.endDate).toLocaleDateString()}.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={actionLoading === 'cancel'}
                className={`px-4 py-2 text-sm font-medium rounded transition-colors ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-300' : 'hover:bg-[#f1f3f4] text-[#3c4043]'}`}
              >
                Keep Plan
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={actionLoading === 'cancel'}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded transition-colors flex items-center gap-2"
              >
                {actionLoading === 'cancel' && <ImSpinner2 size={14} className="animate-spin" />}
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}
