import { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../store/slices/authSlice';
import { subscriptionService } from '../api/services/subscription.service';
import type { Plan, ProrationQuote, UsageSummary, InvoiceItem } from '../api/services/subscription.service';
import { useTheme } from '../hooks/useTheme';
import lightLogo from '../assets/lightlogo.png';
import darkLogo from '../assets/darklogo.png';
import subscription1 from '../assets/subscription1.png';
import subscription2 from '../assets/subscription2.png';

import {
  ROLE_CONFIGS,
  ENTERPRISE_FAQS,
  mergeBackendPlansWithPresenter,
  getDynamicComparisonMatrix,
} from '../features/subscription/rolePlanConfig';
import type { WorkspaceRole, PlanCardPresenter } from '../features/subscription/rolePlanConfig';
import { CheckoutModal } from '../features/subscription/components/CheckoutModal';
import { SubscriptionSuccessModal } from '../features/subscription/components/SubscriptionSuccessModal';

import {
  Check,
  X,
  Download,
  PauseCircle,
  PlayCircle,
  Receipt,
  Twitter,
  Instagram,
  Youtube,
  Linkedin,
  Zap,
  ShieldCheck,
  TrendingUp,
  Headphones,
  Sparkles,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Lock,
  Layers,
  RotateCw,
  Users,
  Building2,
  Crown,
  Rocket,
  Send,
  Star,
  ArrowRight,
  Heart,
  Shield,
} from 'lucide-react';
import { ImSpinner2 } from 'react-icons/im';

interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function Subscription() {
  const user = useSelector(selectUser);
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  // Compute normalized user role
  const userRole: WorkspaceRole = useMemo(() => {
    const r = (user?.role || '').toLowerCase();
    if (r === 'client' || r === 'brand') return 'brand';
    if (r === 'freelancer' || r === 'editor') return 'editor';
    if (r === 'user') return 'user';
    return 'creator';
  }, [user?.role]);

  // Active role state (locked to userRole if logged in)
  const [selectedRole, setSelectedRole] = useState<WorkspaceRole>(() => {
    const r = (user?.role || '').toLowerCase();
    if (r === 'client' || r === 'brand') return 'brand';
    if (r === 'freelancer' || r === 'editor') return 'editor';
    if (r === 'user') return 'user';
    return 'creator';
  });

  // Keep selectedRole in sync with authenticated user
  useEffect(() => {
    if (user?.role) {
      setSelectedRole(userRole);
    }
  }, [user?.role, userRole]);

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [rolePlansCache, setRolePlansCache] = useState<Partial<Record<WorkspaceRole, Plan[]>>>({});
  const [activePlan, setActivePlan] = useState<any>(null);
  const [usageSummary, setUsageSummary] = useState<UsageSummary | null>(null);
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Accordion states
  const [showMatrix, setShowMatrix] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Checkout & Celebration Modals state
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedCheckoutPlan, setSelectedCheckoutPlan] = useState<PlanCardPresenter | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState<{
    plan: PlanCardPresenter;
    billingCycle: 'monthly' | 'annual';
    amountPaid: number;
    paymentId?: string;
  } | null>(null);

  // Lifecycle Modals State
  const [prorationQuote, setProrationQuote] = useState<ProrationQuote | null>(null);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [pauseDays, setPauseDays] = useState(30);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showInvoicesModal, setShowInvoicesModal] = useState(false);

  // Manual refresh with 15-second cooldown timer
  const [refreshCooldown, setRefreshCooldown] = useState(0);
  const [isRefreshingPlans, setIsRefreshingPlans] = useState(false);

  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'info' });

  const triggerToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 5000);
  }, []);

  // Cooldown interval countdown
  useEffect(() => {
    if (refreshCooldown <= 0) return;
    const timer = setInterval(() => {
      setRefreshCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [refreshCooldown]);

  // Determine user preferred currency (USD for US/international, INR for India)
  const userCurrency = useMemo(() => {
    const raw = user?.preferred_currency || (user as any)?.preferredCurrency;
    if (raw) return String(raw).toUpperCase();
    const country = user?.location_country || (user as any)?.country;
    if (country && country !== 'India') return 'USD';
    return 'INR';
  }, [user]);

  // 1. Initial Load: Fetch Consolidated Dashboard in 1 Single Roundtrip
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const dashboard = await subscriptionService.getDashboard(selectedRole, user?.id, userCurrency).catch(() => null);
      if (dashboard && dashboard.plans?.length > 0) {
        setPlans(dashboard.plans);
        setRolePlansCache((prev) => ({ ...prev, [selectedRole]: dashboard.plans }));
        if (dashboard.activeSubscription) setActivePlan(dashboard.activeSubscription);
        if (dashboard.usageSummary) setUsageSummary(dashboard.usageSummary);
      } else {
        // Fallback to getPlans if dashboard route not ready
        const fetchedPlans = await subscriptionService.getPlans(selectedRole, userCurrency).catch(() => []);
        setPlans(fetchedPlans);
        setRolePlansCache((prev) => ({ ...prev, [selectedRole]: fetchedPlans }));
      }

      // Fetch user invoices non-blockingly if logged in
      if (user?.id) {
        subscriptionService.getUserInvoices(user.id).then(setInvoices).catch(() => {});
      }
    } catch (err: any) {
      console.warn('Subscription dashboard notice:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedRole, user?.id, userCurrency]);

  // Targeted Subscription-Only Refresh Handler with 15s lock
  const handleManualRefresh = async () => {
    if (refreshCooldown > 0 || isRefreshingPlans) return;
    setIsRefreshingPlans(true);
    setRefreshCooldown(15);
    try {
      const dashboard = await subscriptionService.getDashboard(selectedRole, user?.id, userCurrency).catch(() => null);
      if (dashboard && dashboard.plans?.length > 0) {
        setPlans(dashboard.plans);
        setRolePlansCache((prev) => ({ ...prev, [selectedRole]: dashboard.plans }));
        if (dashboard.activeSubscription) setActivePlan(dashboard.activeSubscription);
        if (dashboard.usageSummary) setUsageSummary(dashboard.usageSummary);
        triggerToast('Live plans synchronized successfully!', 'success');
      } else {
        const fetchedPlans = await subscriptionService.getPlans(selectedRole, userCurrency).catch(() => []);
        if (fetchedPlans && fetchedPlans.length > 0) {
          setPlans(fetchedPlans);
          setRolePlansCache((prev) => ({ ...prev, [selectedRole]: fetchedPlans }));
          triggerToast('Live plans synchronized successfully!', 'success');
        } else {
          triggerToast('Billing cluster is initializing. Please retry in 15 seconds.', 'info');
        }
      }

      if (user?.id) {
        subscriptionService.getUserInvoices(user.id).then(setInvoices).catch(() => {});
      }
    } catch {
      triggerToast('Billing cluster is initializing. Please retry in 15 seconds.', 'info');
    } finally {
      setIsRefreshingPlans(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Return from Netbanking / 3D-Secure Browser Redirects
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const rzpPaymentId = params.get('razorpay_payment_id');
    const rzpOrderId = params.get('razorpay_order_id');
    const rzpSignature = params.get('razorpay_signature');

    if (rzpOrderId) {
      console.log('🔄 [SuviX Subscription] Detected Razorpay redirect callback params:', { rzpOrderId, rzpPaymentId });
      // Clear query params from browser URL without triggering reload
      window.history.replaceState({}, document.title, window.location.pathname);

      const reconcileRedirectPayment = async () => {
        try {
          if (rzpPaymentId && rzpSignature) {
            const verifyRes = await subscriptionService.verifyPayment({
              razorpayOrderId: rzpOrderId,
              razorpayPaymentId: rzpPaymentId,
              razorpaySignature: rzpSignature,
            });
            triggerToast('Payment verified and subscription activated successfully!', 'success');
            setSuccessData({
              plan: plans.find((p) => p.id === verifyRes?.planId) || activePlan || plans[1] || plans[0],
              billingCycle: 'monthly',
              amountPaid: verifyRes?.amount || 0,
              paymentId: rzpPaymentId,
            });
            setShowSuccessModal(true);
          } else {
            const statusRes = await subscriptionService.getPaymentStatus(rzpOrderId);
            const statusObj = statusRes?.data || statusRes || {};
            const rawStatus = (statusObj?.status || '').toString().toUpperCase();
            if (statusObj?.subscriptionActive || ['SUCCESS', 'PAID', 'COMPLETED', 'ACTIVE'].includes(rawStatus)) {
              triggerToast('Subscription activated successfully!', 'success');
              setSuccessData({
                plan: plans.find((p) => p.id === statusObj?.planId) || activePlan || plans[1] || plans[0],
                billingCycle: 'monthly',
                amountPaid: statusObj?.amount || 0,
                paymentId: rzpPaymentId || statusObj?.paymentId,
              });
              setShowSuccessModal(true);
            }
          }
          await loadData();
        } catch (err: any) {
          console.warn('[SuviX Subscription] Reconcile error:', err);
          await loadData();
        }
      };

      reconcileRedirectPayment();
    }
  }, [plans, activePlan, loadData, triggerToast]);

  // 2. Role Switch Handler (With Instant Client-Side Cache)
  const handleRoleChange = async (role: WorkspaceRole) => {
    if (role === selectedRole) return;
    setSelectedRole(role);

    // If cached in client RAM, show immediately (0ms)
    if (rolePlansCache[role]) {
      setPlans(rolePlansCache[role]!);
      return;
    }

    setActionLoading('role-switch');
    try {
      const dashboard = await subscriptionService.getDashboard(role, user?.id, userCurrency).catch(() => null);
      const rolePlans = dashboard?.plans || (await subscriptionService.getPlans(role, userCurrency));
      setPlans(rolePlans);
      setRolePlansCache((prev) => ({ ...prev, [role]: rolePlans }));
    } catch (_err: any) {
      triggerToast('Failed to load ' + role + ' plans from backend', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // 3. Merged Dynamic Presenter Plans
  const currentRoleConfig = useMemo(() => {
    return ROLE_CONFIGS[selectedRole] || ROLE_CONFIGS.creator;
  }, [selectedRole]);

  const displayPlans = useMemo(() => {
    return mergeBackendPlansWithPresenter(plans, selectedRole, userCurrency);
  }, [plans, selectedRole, userCurrency]);

  const isUsd = useMemo(() => {
    return (displayPlans[0]?.currency || userCurrency || 'INR').toUpperCase() === 'USD';
  }, [displayPlans, userCurrency]);

  const currencySymbol = isUsd ? '$' : '₹';

  const comparisonMatrix = useMemo(() => {
    return getDynamicComparisonMatrix(displayPlans, selectedRole);
  }, [displayPlans, selectedRole]);

  const activePlanPresenter = useMemo(() => {
    if (!activePlan) return null;
    return displayPlans.find(
      (p) =>
        (activePlan.planId && p.id === activePlan.planId) ||
        (activePlan.tierLevel && p.tierLevel === activePlan.tierLevel) ||
        (activePlan.planName && p.name.toLowerCase().includes(activePlan.planName.toLowerCase()))
    ) || displayPlans[0];
  }, [activePlan, displayPlans]);

  const [nowTimestamp] = useState(() => Date.now());

  const activePlanTimeInfo = useMemo(() => {
    if (!activePlan) return { daysRemaining: null, formattedRenewal: 'Lifetime Free' };
    const periodEndVal = activePlan.periodEnd || activePlan.currentPeriodEnd;
    const daysRemaining = periodEndVal
      ? Math.max(0, Math.ceil((new Date(periodEndVal).getTime() - nowTimestamp) / (1000 * 60 * 60 * 24)))
      : null;
    const formattedRenewal = periodEndVal
      ? new Date(periodEndVal).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : 'Lifetime Free';
    return { daysRemaining, formattedRenewal };
  }, [activePlan, nowTimestamp]);

  // 4. Enterprise Checkout Handlers
  const handlePlanCardClick = async (displayPlan: PlanCardPresenter) => {
    if (!user) {
      navigate('/register');
      return;
    }

    if (displayPlan.isOfflineFallback && displayPlan.tierLevel > 1) {
      triggerToast('Service is currently synchronizing with the payment cluster. Please retry in a few moments.', 'info');
      return;
    }

    // Guard against re-purchasing active tier
    if (activePlan && activePlan.tierLevel === displayPlan.tierLevel && displayPlan.tierLevel > 0) {
      triggerToast(`You are already subscribed to the ${displayPlan.name} plan!`, 'info');
      return;
    }

    if (displayPlan.tierLevel === 0) {
      setActionLoading(displayPlan.id);
      try {
        await subscriptionService.createSubscription({
          planId: displayPlan.id,
          billingCycle,
          provider: 'free_starter',
        });
        triggerToast('Free Starter plan activated successfully!', 'success');
        await loadData();
      } catch (err: any) {
        triggerToast(err.response?.data?.message || 'Failed to activate free tier', 'error');
      } finally {
        setActionLoading(null);
      }
      return;
    }

    if (displayPlan.priceMonthly && displayPlan.priceMonthly >= 2500) {
      window.open(
        'mailto:contact@suvix.in?subject=' + encodeURIComponent(displayPlan.name + ' Enterprise Plan Inquiry'),
        '_blank'
      );
      return;
    }

    // Paid Plan: Fetch proration in background if user is upgrading
    if (activePlan && activePlan.tierLevel > 1) {
      try {
        const quote = await subscriptionService.getQuoteUpgrade(displayPlan.id).catch(() => null);
        setProrationQuote(quote);
      } catch (e) {
        console.warn('Proration quote skipped:', e);
      }
    } else {
      setProrationQuote(null);
    }

    setSelectedCheckoutPlan(displayPlan);
    setShowCheckoutModal(true);
  };

  const handleCheckoutSuccess = async (result: any) => {
    setShowCheckoutModal(false);
    setSuccessData({
      plan: result.plan || selectedCheckoutPlan!,
      billingCycle: result.billingCycle || billingCycle,
      amountPaid: result.amountPaid || 0,
      paymentId: result.paymentId,
    });
    setShowSuccessModal(true);
    await loadData();
  };

  const handleConfirmPause = async () => {
    setActionLoading('pause');
    try {
      await subscriptionService.pauseSubscription({
        pauseDays,
        reason: 'Paused by user from billing dashboard',
      });
      triggerToast('Subscription paused for ' + pauseDays + ' days', 'success');
      setShowPauseModal(false);
      await loadData();
    } catch (err: any) {
      triggerToast(err.response?.data?.message || 'Failed to pause subscription', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResumeSubscription = async () => {
    setActionLoading('resume');
    try {
      await subscriptionService.resumeSubscription();
      triggerToast('Subscription resumed successfully!', 'success');
      await loadData();
    } catch (err: any) {
      triggerToast(err.response?.data?.message || 'Failed to resume subscription', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmCancel = async () => {
    setActionLoading('cancel');
    try {
      await subscriptionService.cancelSubscription({
        reason: cancelReason || 'Cancelled from web dashboard',
      });
      triggerToast('Subscription set to cancel at end of current billing period.', 'info');
      setShowCancelModal(false);
      await loadData();
    } catch (err: any) {
      triggerToast(err.response?.data?.message || 'Cancellation failed', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownloadPdf = async (inv: InvoiceItem) => {
    setActionLoading('invoice-' + inv.id);
    try {
      await subscriptionService.downloadInvoicePdf(inv.id, inv.invoiceNumber);
      triggerToast('Downloaded ' + inv.invoiceNumber + '.pdf', 'success');
    } catch (_err: any) {
      triggerToast('Failed to download invoice PDF', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className={`relative w-full min-h-screen font-sans transition-colors duration-200 overflow-x-hidden ${isDarkMode ? 'bg-[#000000] text-white' : 'bg-[#ffffff] text-zinc-900'}`}>
      
      {/* BACKGROUND PRISM IMAGE (Behind Top Header, Swapped: Light=subscription2, Dark=subscription1) */}
      <div className="absolute top-0 right-0 pointer-events-none overflow-hidden z-0 flex items-start justify-end w-full max-w-7xl left-1/2 -translate-x-1/2 px-4 sm:px-6 lg:px-8">
        <img
          src={isDarkMode ? subscription1 : subscription2}
          alt="Subscription Tier Prism"
          className="h-[260px] sm:h-[320px] lg:h-[360px] w-auto object-contain object-right opacity-80 sm:opacity-95 transition-opacity"
        />
      </div>

      {/* BACKGROUND GLOWS */}
      {isDarkMode ? (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-white/[0.04] to-transparent rounded-full blur-3xl" />
          <div className="absolute top-[30%] -left-40 w-96 h-96 bg-white/[0.02] rounded-full blur-3xl" />
          <div className="absolute top-[40%] -right-40 w-96 h-96 bg-white/[0.02] rounded-full blur-3xl" />
        </div>
      ) : (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-zinc-200/50 to-transparent rounded-full blur-3xl" />
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toast.show && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border text-sm font-medium transition-all ${
            toast.type === 'success'
              ? isDarkMode ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-300' : 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : toast.type === 'error'
              ? isDarkMode ? 'bg-rose-950/80 border-rose-500/30 text-rose-300' : 'bg-rose-50 border-rose-300 text-rose-800'
              : isDarkMode ? 'bg-zinc-900 border-zinc-700 text-zinc-200' : 'bg-zinc-100 border-zinc-300 text-zinc-800'
          }`}
        >
          <span>{toast.message}</span>
          <button onClick={() => setToast((prev) => ({ ...prev, show: false }))} className="hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 sm:pt-5 pb-12 flex flex-col gap-6 sm:gap-7">

        {/* ── 1. 3D PRISM SHOWCASE HERO BANNER (Controls Placed Next to Text & Centered) ── */}
        <section className="relative w-full rounded-3xl p-6 sm:p-8 lg:p-9 bg-transparent border-none transition-all overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-6 sm:gap-8">
          {/* Top Right Slogan Watermark */}
          <div className="hidden lg:block absolute top-6 right-8 text-right font-mono text-[9px] font-bold uppercase tracking-[0.25em] leading-relaxed text-zinc-400 dark:text-zinc-500 pointer-events-none select-none opacity-80">
            <div>CREATE</div>
            <div>CONNECT</div>
            <div>MONETIZE</div>
            <div>GROW</div>
          </div>

          {/* Left Hero Content */}
          <div className="relative z-10 max-w-xl space-y-2.5 sm:space-y-3 shrink-0">
            <div className="text-[10px] sm:text-[11px] font-bold tracking-widest uppercase text-zinc-500">
              CREATOR MONETIZATION & GROWTH
            </div>

            <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
              One Platform.<br />
              Infinite Opportunities.
            </h1>

            <p className={`text-xs sm:text-sm leading-relaxed font-normal ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Get verified, unlock powerful tools, and connect with brands.<br className="hidden sm:inline" />
              Choose the plan that fits your creator journey.
            </p>

            {/* Stat Badges Row */}
            <div className="pt-2 flex flex-wrap items-center gap-4 sm:gap-6 text-xs">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${isDarkMode ? 'bg-white/10 text-zinc-200' : 'bg-zinc-100 text-zinc-800'}`}>
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className={`font-bold leading-none ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>10K+</div>
                  <div className="text-[10px] text-zinc-500">Creators trust SuviX</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${isDarkMode ? 'bg-white/10 text-zinc-200' : 'bg-zinc-100 text-zinc-800'}`}>
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <div className={`font-bold leading-none ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>500+</div>
                  <div className="text-[10px] text-zinc-500">Brand partnerships</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${isDarkMode ? 'bg-white/10 text-zinc-200' : 'bg-zinc-100 text-zinc-800'}`}>
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className={`font-bold leading-none ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>4K</div>
                  <div className="text-[10px] text-zinc-500">Media vaults</div>
                </div>
              </div>
            </div>
          </div>

          {/* Controls & Role Switcher (Positioned with EXACT Center Alignment in Top Header) */}
          <div className="flex flex-col items-center justify-center gap-3.5 z-20 w-full lg:w-auto lg:absolute lg:left-1/2 lg:-translate-x-1/2 lg:top-1/2 lg:-translate-y-1/2">
            {/* Centered: Billing Cycle Switcher */}
            <div
              className={`inline-flex items-center p-1 rounded-full border transition-all shadow-sm ${
                isDarkMode ? 'bg-[#101014] border-white/10 shadow-inner' : 'bg-zinc-100 border-zinc-200'
              }`}
            >
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-5 py-2 rounded-full text-xs font-semibold transition-all ${
                  billingCycle === 'monthly'
                    ? isDarkMode
                      ? 'bg-white text-black shadow-md'
                      : 'bg-black text-white shadow-md'
                    : isDarkMode
                    ? 'text-zinc-400 hover:text-white'
                    : 'text-zinc-600 hover:text-black'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-semibold transition-all ${
                  billingCycle === 'annual'
                    ? isDarkMode
                      ? 'bg-black text-white shadow-md'
                      : 'bg-white text-black shadow-md'
                    : isDarkMode
                    ? 'text-zinc-400 hover:text-white'
                    : 'text-zinc-600 hover:text-black'
                }`}
              >
                <span>Yearly</span>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tight ${
                    billingCycle === 'annual'
                      ? isDarkMode
                        ? 'bg-black text-white'
                        : 'bg-white text-black'
                      : isDarkMode
                      ? 'bg-white/10 text-white'
                      : 'bg-zinc-200 text-zinc-800'
                  }`}
                >
                  {plans.length === 0 || displayPlans.some((p) => p.isOfflineFallback) ? 'Save --' : 'Save 20%'}
                </span>
              </button>
            </div>

            {/* Status / Offline & Role Badges */}
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              {/* Offline / Warmup Refresh Trigger */}
              {(plans.length === 0 || displayPlans.some((p) => p.isOfflineFallback && p.tierLevel > 1)) && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                    </span>
                    <span className="text-[11px] font-medium">Billing service initializing...</span>
                  </div>
                  <button
                    onClick={handleManualRefresh}
                    disabled={refreshCooldown > 0 || isRefreshingPlans}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                      refreshCooldown > 0 || isRefreshingPlans
                        ? 'border-zinc-200 dark:border-white/10 text-zinc-400 cursor-not-allowed bg-zinc-50 dark:bg-white/5'
                        : 'border-zinc-300 dark:border-white/20 text-zinc-800 dark:text-white hover:bg-zinc-100 dark:hover:bg-white/10 active:scale-95 shadow-sm'
                    }`}
                  >
                    <RotateCw className={`w-3 h-3 ${isRefreshingPlans ? 'animate-spin' : ''}`} />
                    <span>
                      {isRefreshingPlans
                        ? 'Syncing...'
                        : refreshCooldown > 0
                        ? `Retry in ${refreshCooldown}s`
                        : 'Refresh Live Plans'}
                    </span>
                  </button>
                </div>
              )}

              {/* Role Badge */}
              {user ? (
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium border transition-all ${
                    isDarkMode
                      ? 'bg-white/5 border-white/10 text-zinc-300'
                      : 'bg-zinc-100 border-zinc-200 text-zinc-700'
                  }`}
                >
                  <Lock className="w-3 h-3 text-emerald-500" />
                  <span>
                    Role: <strong className="uppercase font-bold tracking-wider text-zinc-900 dark:text-white">{selectedRole}</strong>
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  {[
                    { role: 'creator', label: 'Creators' },
                    { role: 'editor', label: 'Editors' },
                    { role: 'brand', label: 'Brands' },
                    { role: 'user', label: 'Community' },
                  ].map((tab) => (
                    <button
                      key={tab.role}
                      onClick={() => handleRoleChange(tab.role as WorkspaceRole)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                        selectedRole === tab.role
                          ? isDarkMode
                            ? 'bg-white text-black border-white shadow-sm'
                            : 'bg-black text-white border-black shadow-sm'
                          : isDarkMode
                          ? 'border-white/10 bg-white/[0.02] text-zinc-400 hover:text-white'
                          : 'border-zinc-200 bg-white text-zinc-600 hover:text-black'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── 3. DYNAMIC PRICING CARDS GRID (High-Boldness 3-Tier Layout) ── */}
        {(loading || isRefreshingPlans) && plans.length === 0 ? (
          <section className={`grid grid-cols-1 md:grid-cols-2 ${displayPlans.length === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4 sm:gap-5 items-stretch`}>
            {[1, 2, 3].map((idx) => (
              <div
                key={idx}
                className={`relative rounded-2xl p-5 sm:p-6 flex flex-col justify-between border min-h-[480px] overflow-hidden ${
                  isDarkMode ? 'bg-[#0e0e11] border-white/10' : 'bg-white border-zinc-200 shadow-sm'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-white/10 animate-pulse" />
                    <div className="w-20 h-4 rounded-full bg-zinc-100 dark:bg-white/5 animate-pulse" />
                  </div>

                  <div>
                    <div className="w-32 h-5 rounded-md bg-zinc-200 dark:bg-white/15 animate-pulse mb-1.5" />
                    <div className="w-44 h-3 rounded bg-zinc-100 dark:bg-white/10 animate-pulse" />
                  </div>

                  {/* Price skeleton with -- */}
                  <div className="flex items-baseline gap-1.5 my-2">
                    <div className="h-9 w-20 bg-zinc-200 dark:bg-white/15 rounded-lg animate-pulse flex items-center justify-center font-mono text-zinc-400 font-extrabold text-xl">
                      --
                    </div>
                    <span className="text-xs text-zinc-400">/ month</span>
                  </div>

                  {/* Quota Highlights Table Skeleton */}
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/5 space-y-2">
                    <div className="flex justify-between"><div className="w-24 h-2.5 bg-zinc-200 dark:bg-white/10 rounded animate-pulse" /><div className="w-12 h-2.5 bg-zinc-200 dark:bg-white/10 rounded animate-pulse" /></div>
                    <div className="flex justify-between"><div className="w-24 h-2.5 bg-zinc-200 dark:bg-white/10 rounded animate-pulse" /><div className="w-12 h-2.5 bg-zinc-200 dark:bg-white/10 rounded animate-pulse" /></div>
                    <div className="flex justify-between"><div className="w-24 h-2.5 bg-zinc-200 dark:bg-white/10 rounded animate-pulse" /><div className="w-12 h-2.5 bg-zinc-200 dark:bg-white/10 rounded animate-pulse" /></div>
                    <div className="flex justify-between"><div className="w-24 h-2.5 bg-zinc-200 dark:bg-white/10 rounded animate-pulse" /><div className="w-12 h-2.5 bg-zinc-200 dark:bg-white/10 rounded animate-pulse" /></div>
                  </div>

                  {/* Feature lines */}
                  <div className="space-y-2.5 pt-2">
                    {[1, 2, 3, 4, 5].map((fIdx) => (
                      <div key={fIdx} className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-zinc-200 dark:bg-white/10 shrink-0" />
                        <div className="w-full h-3 rounded bg-zinc-100 dark:bg-white/10 animate-pulse" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="w-full h-10 rounded-xl bg-zinc-200 dark:bg-white/10 animate-pulse mt-6 flex items-center justify-center text-xs text-zinc-400 font-semibold">
                  Connecting...
                </div>
              </div>
            ))}
          </section>
        ) : (
          <section className={`grid grid-cols-1 md:grid-cols-2 ${displayPlans.length === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4 sm:gap-5 items-stretch`}>
            {displayPlans.map((displayPlan, planIndex) => {
              const isOffline = Boolean(displayPlan.isOfflineFallback || plans.length === 0 || (displayPlan.tierLevel > 1 && displayPlan.priceMonthly === null));
              const price = isOffline ? null : (billingCycle === 'annual' ? displayPlan.priceAnnual : displayPlan.priceMonthly);
              const formattedPrice = price !== null && price !== undefined ? `${currencySymbol}${price}` : '--';
              
              const planTitle = isOffline ? `Plan ${planIndex + 1}` : displayPlan.name;
              const planSubtitle = isOffline ? '--' : displayPlan.subtitle;

              const isCurrentPlan = activePlan && (
                (activePlan.planId && activePlan.planId === displayPlan.id) ||
                (activePlan.tierLevel === displayPlan.tierLevel && (activePlan.role === selectedRole || !activePlan.role)) ||
                (activePlan.planName && activePlan.planName.toLowerCase().includes(displayPlan.name.toLowerCase()))
              );

              const isUpgrade = activePlan && activePlan.tierLevel && displayPlan.tierLevel > activePlan.tierLevel;
              const isDowngrade = activePlan && activePlan.tierLevel && displayPlan.tierLevel < activePlan.tierLevel;

              let buttonLabel = displayPlan.buttonText;
              if (isOffline) {
                buttonLabel = 'Unavailable';
              } else if (isCurrentPlan) {
                buttonLabel = 'Current Plan';
              } else if (isUpgrade) {
                buttonLabel = 'Upgrade';
              } else if (isDowngrade) {
                buttonLabel = 'Downgrade';
              }

              // Card Specific Icon Selector
              const CardIcon = displayPlan.tierLevel === 1 ? Send : displayPlan.tierLevel === 2 ? Rocket : Crown;
              const isPopular = !isOffline && (displayPlan.isPopular || displayPlan.tierLevel === 2);
              const tierBadgeText = isOffline ? '--' : (displayPlan.tierLevel === 1 ? 'For Beginners' : displayPlan.tierLevel === 2 ? 'Most Popular' : 'For Agencies');

              // Strikethrough comparison calculation (e.g., $19 with strikethrough $24)
              const originalMonthlyPrice = (!isOffline && displayPlan.priceMonthly) ? Math.round(displayPlan.priceMonthly * 1.25) : null;

              return (
                <div
                  key={displayPlan.key}
                  className={`relative rounded-2xl p-5 sm:p-6 flex flex-col justify-between transition-all duration-200 ${
                    isPopular
                      ? isDarkMode
                        ? 'bg-[#0e0e11] border-2 border-white/40 shadow-2xl scale-[1.02] z-10'
                        : 'bg-white border-2 border-zinc-900 shadow-xl scale-[1.02] z-10'
                      : isDarkMode
                      ? 'bg-[#0e0e11] border border-white/10 hover:border-white/20 shadow-md'
                      : 'bg-white border border-zinc-200 hover:border-zinc-300 shadow-sm'
                  }`}
                >
                  {/* Top Popular Badge */}
                  {isPopular && (
                    <div className="absolute -top-2.5 right-6">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-md flex items-center gap-1 ${
                        isDarkMode ? 'bg-white text-black' : 'bg-black text-white'
                      }`}>
                        <Star className="w-3 h-3 fill-current" />
                        <span>Most Popular</span>
                      </span>
                    </div>
                  )}

                  <div>
                    {/* Header Row: Icon + Title + Audience Tag */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border shrink-0 ${
                          isPopular
                            ? isDarkMode
                              ? 'bg-white/10 border-white/20 text-white'
                              : 'bg-zinc-900 border-zinc-900 text-white'
                            : isDarkMode
                            ? 'bg-white/5 border-white/10 text-zinc-300'
                            : 'bg-zinc-100 border-zinc-200 text-zinc-800'
                        }`}>
                          <CardIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className={`text-base font-bold tracking-tight leading-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                            {planTitle}
                          </h3>
                          <p className={`text-[11px] mt-0.5 font-normal ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                            {planSubtitle}
                          </p>
                        </div>
                      </div>

                      {!isPopular && (
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border shrink-0 ${
                          isDarkMode ? 'bg-white/5 border-white/10 text-zinc-400' : 'bg-zinc-100 border-zinc-200 text-zinc-600'
                        }`}>
                          {tierBadgeText}
                        </span>
                      )}
                    </div>

                    {/* Price Block */}
                    <div className="my-3">
                      <div className="flex items-baseline gap-1.5">
                        <span className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                          {formattedPrice}
                        </span>
                        <span className={`text-xs font-normal ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                          / month
                        </span>
                        {originalMonthlyPrice && displayPlan.tierLevel > 1 && (
                          <span className="text-sm font-semibold line-through text-zinc-400 dark:text-zinc-500 ml-1">
                            {currencySymbol}{originalMonthlyPrice}
                          </span>
                        )}
                      </div>

                      {displayPlan.tierLevel > 1 && (
                        <p className={`text-[11px] font-bold mt-0.5 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-800'}`}>
                          {isOffline ? 'Save --' : 'Save 20% with yearly'}
                        </p>
                      )}
                    </div>

                    {/* Structured Quotas Spec Box */}
                    {displayPlan.quotas && displayPlan.quotas.length > 0 && (
                      <div className={`p-3 rounded-xl mb-3.5 space-y-1.5 text-xs font-normal border ${
                        isDarkMode ? 'bg-white/[0.03] border-white/5 text-zinc-300' : 'bg-zinc-50 border-zinc-200 text-zinc-700'
                      }`}>
                        {displayPlan.quotas.map((q, idx) => (
                          <div key={idx} className="flex justify-between items-center text-[11.5px]">
                            <span className={`font-normal ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>{q.label}</span>
                            <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{isOffline ? '--' : q.value}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Features List */}
                    <ul className="space-y-2 text-xs mb-4 font-normal">
                      {isOffline ? (
                        ['--', '--', '--', '--'].map((_, fIdx) => (
                          <li key={fIdx} className="flex items-start gap-2">
                            <span className="w-4 h-4 rounded-full bg-zinc-400/20 dark:bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                              <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500">-</span>
                            </span>
                            <span className={`text-[12px] font-mono leading-tight ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                              --
                            </span>
                          </li>
                        ))
                      ) : (
                        displayPlan.features.map((feat, idx) => {
                          const isBlueBadge = feat.toLowerCase().includes('blue badge') || feat.toLowerCase().includes('verified');
                          return (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="w-4 h-4 rounded-full bg-zinc-900 dark:bg-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                                <Check className="w-2.5 h-2.5 text-white dark:text-black stroke-[3]" />
                              </span>
                              <span className={`text-[12px] leading-tight ${isDarkMode ? 'text-zinc-200' : 'text-zinc-800'}`}>
                                {feat} {isBlueBadge && <span className="inline-block ml-1 text-blue-500 font-bold">✓</span>}
                              </span>
                            </li>
                          );
                        })
                      )}
                    </ul>
                  </div>

                  {/* Action CTA Button */}
                  <button
                    onClick={() => handlePlanCardClick(displayPlan)}
                    disabled={isOffline || isCurrentPlan || actionLoading === 'upgrade' || actionLoading === 'starter-' + displayPlan.id}
                    className={`w-full py-3 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md flex items-center justify-center gap-1.5 ${
                      isOffline
                        ? isDarkMode ? 'bg-white/5 text-zinc-500 border border-white/10 cursor-not-allowed' : 'bg-zinc-100 text-zinc-400 border border-zinc-200 cursor-not-allowed'
                        : isCurrentPlan
                        ? isDarkMode ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-600/40 cursor-default' : 'bg-emerald-50 text-emerald-700 border border-emerald-300 cursor-default'
                        : isPopular
                        ? isDarkMode
                          ? 'bg-white hover:bg-zinc-200 text-black shadow-lg active:scale-95'
                          : 'bg-black hover:bg-zinc-800 text-white shadow-lg active:scale-95'
                        : isDarkMode
                        ? 'bg-white/10 hover:bg-white/15 text-white border border-white/10 active:scale-95'
                        : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border border-zinc-200 active:scale-95'
                    }`}
                  >
                    {actionLoading === 'starter-' + displayPlan.id && <ImSpinner2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{buttonLabel}</span>
                    {!isCurrentPlan && !isOffline && <ArrowRight className="w-3.5 h-3.5 ml-0.5" />}
                  </button>
                </div>
              );
            })}
          </section>
        )}

        {/* ── 4. EXPANDABLE FEATURE COMPARISON MATRIX ───────────────────────── */}
        <section
          className={`w-full rounded-3xl border overflow-hidden transition-all ${
            isDarkMode ? 'bg-[#101013] border-white/10' : 'bg-white border-zinc-200 shadow-md'
          }`}
        >
          <button
            onClick={() => setShowMatrix((prev) => !prev)}
            className="w-full p-6 sm:p-7 flex items-center justify-between text-left hover:opacity-90 transition-opacity"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-2xl ${isDarkMode ? 'bg-white/5 text-zinc-300' : 'bg-zinc-100 text-zinc-800'}`}>
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3
                  className={`text-base sm:text-lg font-semibold tracking-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}
                >
                  Compare All {currentRoleConfig.tabLabel} Features Side-by-Side
                </h3>
                <p
                  className={`text-xs mt-0.5 font-normal ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}
                >
                  Deep dive into exact storage limits, badges, commissions, and API capabilities
                </p>
              </div>
            </div>
            <div className={`p-2 rounded-full border ${isDarkMode ? 'border-white/10 text-zinc-400' : 'border-zinc-200 text-zinc-600'}`}>
              {showMatrix ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {showMatrix && (
            <div className="border-t border-white/[0.06] p-6 sm:p-7 overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead>
                  <tr className={`border-b ${isDarkMode ? 'border-white/10 text-white' : 'border-zinc-200 text-zinc-900'}`}>
                    {comparisonMatrix.headers.map((h, idx) => (
                      <th key={idx} className="pb-4 font-medium uppercase tracking-wider text-[11px] first:pl-2">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-white/[0.04]' : 'divide-zinc-100'}`}>
                  {comparisonMatrix.rows.map((row, idx) => (
                    <tr key={idx} className={`${isDarkMode ? 'hover:bg-white/[0.02]' : 'hover:bg-zinc-50'} transition-colors`}>
                      <td className={`py-3.5 pl-2 font-normal ${isDarkMode ? 'text-zinc-200' : 'text-zinc-800'}`}>
                        {row.featureName}
                      </td>
                      {row.values && row.values.length > 0 ? (
                        row.values.map((val, vIdx) => (
                          <td key={vIdx} className="py-3.5">
                            {typeof val === 'boolean' ? (
                              val ? <Check className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-zinc-600" />
                            ) : (
                              <span className={vIdx === row.values!.length - 1 && val !== '-' ? 'text-emerald-400 font-medium' : isDarkMode ? 'text-zinc-300 font-normal' : 'text-zinc-700 font-normal'}>
                                {val}
                              </span>
                            )}
                          </td>
                        ))
                      ) : (
                        <>
                          <td className="py-3.5">
                            {typeof row.tier1 === 'boolean' ? (
                              row.tier1 ? <Check className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-zinc-600" />
                            ) : (
                              <span className={isDarkMode ? 'text-zinc-400 font-normal' : 'text-zinc-600 font-normal'}>{row.tier1}</span>
                            )}
                          </td>
                          <td className="py-3.5 font-normal">
                            {typeof row.tier2 === 'boolean' ? (
                              row.tier2 ? <Check className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-zinc-600" />
                            ) : (
                              <span className={isDarkMode ? 'text-white font-normal' : 'text-zinc-900 font-normal'}>{row.tier2}</span>
                            )}
                          </td>
                          {row.tier3 !== '' && (
                            <td className="py-3.5 font-medium">
                              {typeof row.tier3 === 'boolean' ? (
                                row.tier3 ? <Check className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-zinc-600" />
                              ) : (
                                <span className="text-emerald-400 font-medium">{row.tier3}</span>
                              )}
                            </td>
                          )}
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── 5. ENTERPRISE BILLING FAQS ────────────────────────────────────── */}
        <section
          className={`w-full rounded-3xl p-6 sm:p-8 border transition-all ${
            isDarkMode ? 'bg-[#101013] border-white/10' : 'bg-white border-zinc-200 shadow-md'
          }`}
        >
          <div className="text-center max-w-xl mx-auto mb-8">
            <h3
              className={`text-xl sm:text-2xl font-semibold tracking-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}
            >
              Frequently Asked Questions
            </h3>
            <p
              className={`text-xs mt-1 font-normal ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}
            >
              Everything you need to know about billing, second-level proration, tax invoices & plans.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-3">
            {ENTERPRISE_FAQS.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className={`rounded-2xl border transition-all overflow-hidden ${
                    isDarkMode ? 'bg-white/[0.02] border-white/10' : 'bg-zinc-50 border-zinc-200'
                  }`}
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-4 sm:p-5 flex items-center justify-between text-left font-normal text-xs sm:text-sm"
                  >
                    <span className={isDarkMode ? 'text-zinc-200' : 'text-zinc-800'}>{faq.question}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4 shrink-0 ml-2" /> : <ChevronDown className="w-4 h-4 shrink-0 ml-2" />}
                  </button>
                  {isOpen && (
                    <div className={`px-4 sm:px-5 pb-5 text-xs font-normal leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ── 6. TRUST, SECURITY & PAYMENT PILLARS ──────────────────── */}
        <section
          className={`w-full rounded-3xl p-6 sm:p-8 border transition-all ${
            isDarkMode ? 'bg-[#101013]/90 border-white/10 shadow-2xl' : 'bg-white border-zinc-200 shadow-lg'
          }`}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7 mb-8">
            <div className="flex items-start gap-3.5">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                  isDarkMode ? 'bg-white/5 text-zinc-300 border border-white/10' : 'bg-zinc-100 text-zinc-800 border border-zinc-200'
                }`}
              >
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                  Secure & Reliable
                </h4>
                <p className={`text-xs mt-1 font-normal leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  256-bit bank-grade encryption with escrow vault protection.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                  isDarkMode ? 'bg-white/5 text-zinc-300 border border-white/10' : 'bg-zinc-100 text-zinc-800 border border-zinc-200'
                }`}
              >
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h4 className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                  Growth Focused
                </h4>
                <p className={`text-xs mt-1 font-normal leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  Tools, analytics, and AI built to scale your revenue.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                  isDarkMode ? 'bg-white/5 text-zinc-300 border border-white/10' : 'bg-zinc-100 text-zinc-800 border border-zinc-200'
                }`}
              >
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <h4 className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                  24/7 Dedicated Support
                </h4>
                <p className={`text-xs mt-1 font-normal leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  Priority ticket handling & dedicated billing managers.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                  isDarkMode ? 'bg-white/5 text-zinc-300 border border-white/10' : 'bg-zinc-100 text-zinc-800 border border-zinc-200'
                }`}
              >
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                  GST Tax Compliant
                </h4>
                <p className={`text-xs mt-1 font-normal leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  Automatic digitally signed SAC 998439 PDF invoices.
                </p>
              </div>
            </div>
          </div>

          <div className={`w-full pt-6 border-t flex flex-wrap items-center justify-between gap-4 text-xs font-normal ${isDarkMode ? 'border-white/10 text-zinc-400' : 'border-zinc-200 text-zinc-600'}`}>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>Accepted Payment Methods: <span className={isDarkMode ? 'text-zinc-200 font-medium' : 'text-zinc-700 font-medium'}>UPI (GPay/PhonePe), Cards, NetBanking, Stripe</span></span>
            </div>
            <div className="flex items-center gap-3 font-semibold">
              <span className="flex items-center gap-1"><CreditCard className="w-3.5 h-3.5" /> Razorpay Secured</span>
              <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> PCI-DSS Level 1</span>
            </div>
          </div>
        </section>

        {/* ── 7. GLOBAL FOOTER ──────────────────────────────────────────────── */}
        <footer className="w-full pt-6 pb-4 border-t border-white/[0.06] dark:border-white/[0.06]">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            <div className="md:col-span-2 space-y-3">
              <Link to="/home" className="flex items-center gap-2">
                <img
                  src={isDarkMode ? lightLogo : darkLogo}
                  alt="SuviX Logo"
                  className="h-6 w-auto object-contain"
                />
              </Link>
              <p className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>
                © 2026 SuviX. All rights reserved.
              </p>
            </div>

            <div>
              <h5 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-800'}`}>
                Platform
              </h5>
              <ul className={`space-y-2 text-xs font-normal ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                <li><Link to="/explore" className="hover:underline">Creators</Link></li>
                <li><Link to="/explore" className="hover:underline">Jobs</Link></li>
                <li><Link to="/explore" className="hover:underline">Brands</Link></li>
                <li><Link to="/subscription" className="hover:underline">Affiliate</Link></li>
              </ul>
            </div>

            <div>
              <h5 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-800'}`}>
                Company
              </h5>
              <ul className={`space-y-2 text-xs font-normal ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                <li><Link to="/about" className="hover:underline">About Us</Link></li>
                <li><Link to="/about" className="hover:underline">Careers</Link></li>
                <li><Link to="/about" className="hover:underline">Blog</Link></li>
                <li><a href="mailto:contact@suvix.in" className="hover:underline">Contact</a></li>
              </ul>
            </div>

            <div>
              <h5 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-800'}`}>
                Legal
              </h5>
              <ul className={`space-y-2 text-xs font-normal ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                <li><Link to="/privacy" className="hover:underline">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:underline">Terms of Service</Link></li>
                <li><Link to="/terms" className="hover:underline">Refund Policy</Link></li>
              </ul>

              <h5 className={`text-xs font-semibold uppercase tracking-wider mt-5 mb-2.5 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-800'}`}>
                Follow Us
              </h5>
              <div className="flex items-center gap-3">
                <a href="https://twitter.com" target="_blank" rel="noreferrer" className={`p-1.5 rounded-full ${isDarkMode ? 'text-zinc-400 hover:text-white bg-white/5' : 'text-zinc-600 hover:text-zinc-900 bg-zinc-100'}`}>
                  <Twitter className="w-3.5 h-3.5" />
                </a>
                <a href="https://instagram.com" target="_blank" rel="noreferrer" className={`p-1.5 rounded-full ${isDarkMode ? 'text-zinc-400 hover:text-white bg-white/5' : 'text-zinc-600 hover:text-zinc-900 bg-zinc-100'}`}>
                  <Instagram className="w-3.5 h-3.5" />
                </a>
                <a href="https://youtube.com" target="_blank" rel="noreferrer" className={`p-1.5 rounded-full ${isDarkMode ? 'text-zinc-400 hover:text-white bg-white/5' : 'text-zinc-600 hover:text-zinc-900 bg-zinc-100'}`}>
                  <Youtube className="w-3.5 h-3.5" />
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noreferrer" className={`p-1.5 rounded-full ${isDarkMode ? 'text-zinc-400 hover:text-white bg-white/5' : 'text-zinc-600 hover:text-zinc-900 bg-zinc-100'}`}>
                  <Linkedin className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </footer>

      </div>



      {/* ── 9. PAUSE MODAL ────────────────────────────────────────────────── */}
      {showPauseModal &&
        createPortal(
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowPauseModal(false);
            }}
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
          >
            <div
              className={`w-full max-w-sm rounded-3xl p-6 border shadow-2xl ${
                isDarkMode ? 'bg-[#101014] border-white/15 text-white' : 'bg-white border-zinc-300 text-zinc-900'
              }`}
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-base font-semibold">Pause Subscription</h3>
                <button onClick={() => setShowPauseModal(false)}><X className="w-4 h-4" /></button>
              </div>
              <p className="text-xs text-zinc-400 mb-4 leading-relaxed font-normal">
                Temporarily freeze your billing for up to 90 days. You will not be charged while paused.
              </p>
              <label className="text-xs font-medium block mb-1">Pause Duration:</label>
              <select
                value={pauseDays}
                onChange={(e) => setPauseDays(Number(e.target.value))}
                className={`w-full p-2.5 rounded-xl text-xs border mb-4 font-normal ${
                  isDarkMode ? 'bg-zinc-900 border-white/10 text-white' : 'bg-zinc-100 border-zinc-300 text-zinc-900'
                }`}
              >
                <option value={15}>15 Days</option>
                <option value={30}>30 Days (Recommended)</option>
                <option value={60}>60 Days</option>
                <option value={90}>90 Days</option>
              </select>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowPauseModal(false)}
                  className="flex-1 py-2 rounded-full text-xs font-medium border border-white/15 text-zinc-400"
                >
                  Keep Active
                </button>
                <button
                  onClick={handleConfirmPause}
                  disabled={actionLoading === 'pause'}
                  className="flex-1 py-2 rounded-full text-xs font-medium bg-amber-500 text-black hover:bg-amber-400"
                >
                  Confirm Pause
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ── 10. CANCEL MODAL ──────────────────────────────────────────────── */}
      {showCancelModal &&
        createPortal(
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowCancelModal(false);
            }}
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
          >
            <div
              className={`w-full max-w-sm rounded-3xl p-6 border shadow-2xl ${
                isDarkMode ? 'bg-[#101014] border-white/15 text-white' : 'bg-white border-zinc-300 text-zinc-900'
              }`}
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-base font-semibold text-rose-400">Cancel Subscription</h3>
                <button onClick={() => setShowCancelModal(false)}><X className="w-4 h-4" /></button>
              </div>
              <p className="text-xs text-zinc-400 mb-3 leading-relaxed font-normal">
                Your benefits will remain active until the end of your billing cycle. You will not be billed again.
              </p>
              <textarea
                placeholder="Reason for cancellation (optional)..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={2}
                className={`w-full p-2.5 rounded-xl text-xs border mb-4 font-normal ${
                  isDarkMode ? 'bg-zinc-900 border-white/10 text-white' : 'bg-zinc-100 border-zinc-300 text-zinc-900'
                }`}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 py-2 rounded-full text-xs font-medium border border-white/15"
                >
                  Keep Plan
                </button>
                <button
                  onClick={handleConfirmCancel}
                  disabled={actionLoading === 'cancel'}
                  className="flex-1 py-2 rounded-full text-xs font-medium bg-rose-600 text-white hover:bg-rose-500"
                >
                  Cancel Plan
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ── 11. INVOICE HISTORY MODAL ─────────────────────────────────────── */}
      {showInvoicesModal &&
        createPortal(
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowInvoicesModal(false);
            }}
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
          >
            <div
              className={`w-full max-w-lg rounded-3xl p-6 sm:p-7 border shadow-2xl max-h-[85vh] flex flex-col ${
                isDarkMode ? 'bg-[#101014] border-white/15 text-white' : 'bg-white border-zinc-300 text-zinc-900'
              }`}
            >
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5" />
                  <h3 className="text-base font-semibold">Billing & Invoices</h3>
                </div>
                <button onClick={() => setShowInvoicesModal(false)}><X className="w-4 h-4" /></button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {invoices.map((inv) => (
                  <div
                    key={inv.id}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                      isDarkMode ? 'bg-white/5 border-white/10' : 'bg-zinc-50 border-zinc-200'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-xs">{inv.invoiceNumber}</div>
                      <div className="text-[11px] text-zinc-400 font-normal">
                        {inv.invoiceDate} • <span className="text-emerald-400 font-medium uppercase">{inv.status}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-xs">
                        {(inv.currency || '').toUpperCase() === 'USD' ? '$' : '₹'}{inv.totalAmount}
                      </span>
                      <button
                        onClick={() => handleDownloadPdf(inv)}
                        disabled={actionLoading === 'invoice-' + inv.id}
                        className={`p-2 rounded-xl border transition-all ${
                          isDarkMode ? 'border-white/10 hover:bg-white/10' : 'border-zinc-300 hover:bg-zinc-200'
                        }`}
                      >
                        {actionLoading === 'invoice-' + inv.id ? (
                          <ImSpinner2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ── 12. ENTERPRISE CHECKOUT & ORDER REVIEW MODAL ──────────────────── */}
      {selectedCheckoutPlan && (
        <CheckoutModal
          isOpen={showCheckoutModal}
          onClose={() => {
            setShowCheckoutModal(false);
            setSelectedCheckoutPlan(null);
          }}
          plan={selectedCheckoutPlan}
          billingCycle={billingCycle}
          role={selectedRole}
          user={user}
          prorationQuote={prorationQuote}
          onSuccess={handleCheckoutSuccess}
          isDarkMode={isDarkMode}
        />
      )}

      {/* ── 13. SUBSCRIPTION ACTIVATION CELEBRATION MODAL ────────────────── */}
      {successData && (
        <SubscriptionSuccessModal
          isOpen={showSuccessModal}
          onClose={() => {
            setShowSuccessModal(false);
            setSuccessData(null);
          }}
          plan={successData.plan}
          billingCycle={successData.billingCycle}
          role={selectedRole}
          amountPaid={successData.amountPaid}
          paymentId={successData.paymentId}
          currency={successData.plan?.currency || userCurrency}
          currencySymbol={currencySymbol}
          isDarkMode={isDarkMode}
        />
      )}

    </div>
  );
}
