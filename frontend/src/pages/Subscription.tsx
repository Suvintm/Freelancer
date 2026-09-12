import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
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
import { ActivePlanCelebrationOverlay } from '../features/subscription/components/ActivePlanCelebrationOverlay';
import { PlanExpirationCountdown } from '../features/subscription/components/PlanExpirationCountdown';
import { round2 } from '../utils/money';

// Lazy load heavy modal dialogs to maximize initial page performance
const CheckoutModal = lazy(() =>
  import('../features/subscription/components/CheckoutModal').then((m) => ({ default: m.CheckoutModal }))
);
const SubscriptionSuccessModal = lazy(() =>
  import('../features/subscription/components/SubscriptionSuccessModal').then((m) => ({
    default: m.SubscriptionSuccessModal,
  }))
);
const UpgradeStoryModal = lazy(() =>
  import('../features/subscription/components/UpgradeStoryModal').then((m) => ({
    default: m.UpgradeStoryModal,
  }))
);

import {
  Check,
  X,
  Download,
  Receipt,
  Twitter,
  Instagram,
  Youtube,
  Linkedin,
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
  Calculator,
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

  const [nowTimestamp] = useState(() => Date.now());
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [rolePlansCache, setRolePlansCache] = useState<Partial<Record<WorkspaceRole, Plan[]>>>({});
  const [activePlan, setActivePlan] = useState<any>(null);
  const [_usageSummary, setUsageSummary] = useState<UsageSummary | null>(null);
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
    currentPeriodEnd?: string | Date | null;
  } | null>(null);

  // Upgrade Story Modal state
  const [showUpgradeStoryModal, setShowUpgradeStoryModal] = useState(false);
  const [storyTargetPlan, setStoryTargetPlan] = useState<PlanCardPresenter | null>(null);

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
    } catch {
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

  const maxSavingsPercent = useMemo(() => {
    const validSavings = displayPlans
      .map((p) => p.savingsPercent)
      .filter((s): s is number => typeof s === 'number' && s > 0);
    return validSavings.length > 0 ? Math.max(...validSavings) : 20;
  }, [displayPlans]);

  const comparisonMatrix = useMemo(() => {
    return getDynamicComparisonMatrix(displayPlans, selectedRole);
  }, [displayPlans, selectedRole]);

  // Normalized active subscription cycle (monthly vs annual)
  const activeCycle: 'monthly' | 'annual' = useMemo(() => {
    if (!activePlan) return 'monthly';
    const c = (activePlan.billingCycle || activePlan.interval || 'monthly').toLowerCase();
    return c === 'annual' || c === 'yearly' || c === 'year' ? 'annual' : 'monthly';
  }, [activePlan]);

  // Check if current user subscription is expired or inactive
  const isSubscriptionExpired = useMemo(() => {
    if (!activePlan) return false;
    const status = (activePlan.status || '').toLowerCase();
    if (['expired', 'cancelled', 'canceled', 'ended', 'inactive', 'unpaid', 'past_due'].includes(status)) {
      return true;
    }
    const endStr = activePlan.currentPeriodEnd || activePlan.expiresAt || activePlan.validUntil;
    if (endStr) {
      const endTime = new Date(endStr).getTime();
      if (!isNaN(endTime) && endTime < nowTimestamp) {
        return true;
      }
    }
    return false;
  }, [activePlan, nowTimestamp]);

  // Plan is genuinely active and within valid prepaid period
  const isPlanActive = useMemo(() => {
    return Boolean(activePlan && !isSubscriptionExpired);
  }, [activePlan, isSubscriptionExpired]);

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

    // Guard against re-purchasing the EXACT same tier AND billing cycle ONLY when actively valid
    const isExactCurrent = Boolean(
      isPlanActive &&
      activePlan.tierLevel === displayPlan.tierLevel &&
      displayPlan.tierLevel > 0 &&
      activeCycle === billingCycle
    );
    if (isExactCurrent) {
      triggerToast(`You are already subscribed to the ${displayPlan.name} (${billingCycle}) plan!`, 'info');
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

    // Guard: Active on Annual trying to buy Monthly for same tier (already covered)
    const isCoveredByActiveAnnual = Boolean(
      isPlanActive &&
      activePlan &&
      activePlan.tierLevel === displayPlan.tierLevel &&
      activeCycle === 'annual' &&
      billingCycle === 'monthly'
    );
    if (isCoveredByActiveAnnual) {
      const expiryFormatted = activePlan?.currentPeriodEnd
        ? new Date(activePlan.currentPeriodEnd).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })
        : 'the end of your annual period';
      triggerToast(
        `You currently have active Annual access for ${displayPlan.name} (valid until ${expiryFormatted}).`,
        'info'
      );
      return;
    }

    // 1. Lower Tier Guard: In prepaid model, user already has higher tier access (only when currently active!)
    const isLowerTier = Boolean(
      isPlanActive &&
      activePlan &&
      activePlan.tierLevel &&
      displayPlan.tierLevel < activePlan.tierLevel
    );

    if (isLowerTier) {
      const expiryFormatted = activePlan?.currentPeriodEnd
        ? new Date(activePlan.currentPeriodEnd).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })
        : 'the end of your current cycle';
      triggerToast(
        `You currently have active access on ${activePlan?.planName || 'a higher tier'} (valid until ${expiryFormatted}). You can choose this plan after your current plan validity completes.`,
        'info'
      );
      return;
    }

    // 2. Paid Plan Upgrade: Upgrading to higher tier OR upgrading active Monthly to Annual on same tier (only when currently active!)
    const isUpgradeToAnnualOnSameTier = Boolean(
      isPlanActive &&
      activePlan &&
      activePlan.tierLevel === displayPlan.tierLevel &&
      activeCycle === 'monthly' &&
      billingCycle === 'annual'
    );

    const isHigherTierUpgrade = Boolean(
      isPlanActive &&
      activePlan &&
      activePlan.tierLevel &&
      displayPlan.tierLevel > activePlan.tierLevel
    );

    if (isPlanActive && (isHigherTierUpgrade || isUpgradeToAnnualOnSameTier)) {
      try {
        const quote = await subscriptionService.getQuoteUpgrade(displayPlan.id, billingCycle, user?.id).catch(() => null);
        setProrationQuote(quote);
      } catch (e) {
        console.warn('Proration quote skipped:', e);
      }
      setSelectedCheckoutPlan(displayPlan);
      setStoryTargetPlan(displayPlan);
      setShowUpgradeStoryModal(true);
      return;
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
      currentPeriodEnd: result.currentPeriodEnd || result.subscription?.currentPeriodEnd || result.activeSubscription?.currentPeriodEnd || activePlan?.currentPeriodEnd,
    });
    setShowSuccessModal(true);
    await loadData();
  };

  const handleTestSuccessModal = () => {
    const samplePlan = displayPlans.find((p) => p.tierLevel === 2) || displayPlans[1] || displayPlans[0];
    const testAmount =
      billingCycle === 'annual'
        ? (samplePlan.priceAnnualTotal || (samplePlan.priceAnnual ? samplePlan.priceAnnual * 12 : (samplePlan.priceMonthly ? samplePlan.priceMonthly * 12 : 0)))
        : (samplePlan.priceMonthly || 0);

    setSuccessData({
      plan: samplePlan,
      billingCycle: billingCycle,
      amountPaid: testAmount,
      paymentId: `pay_${Math.random().toString(36).substring(2, 8).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    });
    setShowSuccessModal(true);
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
    } catch {
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
        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
          className="relative w-full rounded-3xl p-6 sm:p-8 lg:p-9 bg-transparent border-none transition-all overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-6 sm:gap-8"
        >
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
                  {plans.length === 0 || displayPlans.some((p) => p.isOfflineFallback) ? 'Save --' : `Save ${maxSavingsPercent}%`}
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

              {/* Billing & Invoices History Button */}
              {user && (
                <button
                  type="button"
                  onClick={() => setShowInvoicesModal(true)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer shadow-xs active:scale-95 ${
                    isDarkMode
                      ? 'border-white/15 bg-white/5 hover:bg-white/10 text-zinc-200'
                      : 'border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-800'
                  }`}
                  title="View Billing History & Download Tax Invoices"
                >
                  <Receipt className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Invoices</span>
                  {invoices.length > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500 text-black leading-none">
                      {invoices.length}
                    </span>
                  )}
                </button>
              )}

              {/* Test Button to Preview Subscription Success Modal (Dev Only) */}
              {(import.meta as any).env?.DEV && (
                <button
                  type="button"
                  onClick={handleTestSuccessModal}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-all cursor-pointer shadow-xs active:scale-95"
                  title="Test and preview the Subscription Activated success modal"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500" />
                  <span>Preview Success Popup</span>
                </button>
              )}

              {/* Interactive Story Explainer Modal Button */}
              <button
                type="button"
                onClick={() => {
                  const target = displayPlans.find((p) => p.tierLevel === 3) || displayPlans[2] || displayPlans[1];
                  setStoryTargetPlan(target);
                  setShowUpgradeStoryModal(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border border-violet-500/40 bg-violet-500/10 hover:bg-violet-500/20 text-violet-600 dark:text-violet-400 transition-all cursor-pointer shadow-xs active:scale-95"
                title="View the interactive story scenario and live proration math breakdown"
              >
                <Calculator className="w-3.5 h-3.5 text-violet-500" />
                <span>How Upgrades Work (Story & Math)</span>
              </button>
            </div>
          </div>
        </motion.section>

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
          <section className={`grid grid-cols-1 md:grid-cols-2 ${
            displayPlans.length === 1 ? 'lg:grid-cols-1 max-w-md mx-auto' :
            displayPlans.length === 2 ? 'lg:grid-cols-2 max-w-3xl mx-auto' :
            displayPlans.length === 4 ? 'lg:grid-cols-4' :
            displayPlans.length === 5 ? 'lg:grid-cols-3 xl:grid-cols-5' :
            displayPlans.length >= 6 ? 'lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-6' :
            'lg:grid-cols-3'
          } gap-4 sm:gap-5 items-stretch`}>
            {displayPlans.map((displayPlan, planIndex) => {
              const isOffline = Boolean(displayPlan.isOfflineFallback || plans.length === 0 || (displayPlan.tierLevel > 1 && displayPlan.priceMonthly === null));
              const price = isOffline ? null : (billingCycle === 'annual' ? displayPlan.priceAnnual : displayPlan.priceMonthly);
              const formattedPrice = price !== null && price !== undefined ? `${currencySymbol}${price}` : '--';
              
              const planTitle = isOffline ? `Plan ${planIndex + 1}` : displayPlan.name;
              const planSubtitle = isOffline ? '--' : displayPlan.subtitle;

              const isSameTierPlan = Boolean(
                activePlan && (
                  (activePlan.planId && activePlan.planId === displayPlan.id) ||
                  (activePlan.tierLevel === displayPlan.tierLevel && (activePlan.role === selectedRole || !activePlan.role)) ||
                  (activePlan.planName && activePlan.planName.toLowerCase().includes(displayPlan.name.toLowerCase()))
                )
              );

              // 1. Expired state resolution (separated by exact cycle vs other cycle)
              const isExactExpiredPlan = isSameTierPlan && isSubscriptionExpired && activeCycle === billingCycle;
              const isExpiredPlanOtherCycle = isSameTierPlan && isSubscriptionExpired && activeCycle !== billingCycle;

              // 2. Active plan cycle state resolution
              const isCurrentPlan = isSameTierPlan && isPlanActive && activeCycle === billingCycle;
              const isUpgradeToAnnual = isSameTierPlan && isPlanActive && activeCycle === 'monthly' && billingCycle === 'annual';
              const isCoveredByAnnual = isSameTierPlan && isPlanActive && activeCycle === 'annual' && billingCycle === 'monthly';

              const isUpgrade = isPlanActive && activePlan.tierLevel && displayPlan.tierLevel > activePlan.tierLevel;
              const isLowerTier = isPlanActive && activePlan.tierLevel && displayPlan.tierLevel < activePlan.tierLevel;

              let buttonLabel = displayPlan.buttonText;
              if (isOffline) {
                buttonLabel = 'Unavailable';
              } else if (isExactExpiredPlan) {
                buttonLabel = billingCycle === 'annual' ? 'Renew Annual Plan' : 'Renew Monthly Plan';
              } else if (isExpiredPlanOtherCycle) {
                buttonLabel = billingCycle === 'annual'
                  ? `Get Yearly (${displayPlan.savingsPercent || maxSavingsPercent}% off)`
                  : 'Get Monthly Plan';
              } else if (isCurrentPlan) {
                buttonLabel = 'Current Plan';
              } else if (isUpgradeToAnnual) {
                buttonLabel = `Upgrade to Yearly (${displayPlan.savingsPercent || maxSavingsPercent}% off)`;
              } else if (isCoveredByAnnual) {
                buttonLabel = 'Covered by Annual Plan';
              } else if (isUpgrade) {
                buttonLabel = 'Upgrade';
              } else if (isLowerTier) {
                buttonLabel = 'Included in Current Plan';
              }

              // Card Specific Icon Selector
              const CardIcon = displayPlan.tierLevel === 1 ? Send : displayPlan.tierLevel === 2 ? Rocket : Crown;
              const isPopular = !isOffline && (displayPlan.isPopular || Boolean(displayPlan.badge));

              // Strikethrough comparison calculation: on annual view, show monthly price as crossed-out anchor
              const originalMonthlyPrice = (!isOffline && billingCycle === 'annual' && displayPlan.priceMonthly && displayPlan.priceAnnual && displayPlan.priceMonthly > displayPlan.priceAnnual)
                ? displayPlan.priceMonthly
                : null;

              return (
                <motion.div
                  key={displayPlan.key}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.35,
                    delay: planIndex * 0.08,
                    ease: [0.25, 1, 0.5, 1],
                  }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className={`relative rounded-2xl p-5 sm:p-6 flex flex-col justify-between transition-colors duration-200 transform-gpu will-change-transform ${
                    isCurrentPlan
                      ? isDarkMode
                        ? 'bg-[#0e0e11] border-2 border-emerald-500/70 shadow-2xl shadow-emerald-950/40 scale-[1.01] z-10'
                        : 'bg-white border-2 border-emerald-500/80 shadow-xl shadow-emerald-500/15 scale-[1.01] z-10'
                      : isExactExpiredPlan
                      ? isDarkMode
                        ? 'bg-[#0e0e11] border-2 border-amber-500/60 shadow-xl z-10'
                        : 'bg-white border-2 border-amber-500/70 shadow-lg z-10'
                      : isPopular
                      ? isDarkMode
                        ? 'bg-[#0e0e11] border-2 border-white/40 shadow-2xl scale-[1.02] z-10'
                        : 'bg-white border-2 border-zinc-900 shadow-xl scale-[1.02] z-10'
                      : isDarkMode
                      ? 'bg-[#0e0e11] border border-white/10 hover:border-white/20 shadow-md'
                      : 'bg-white border border-zinc-200 hover:border-zinc-300 shadow-sm'
                  }`}
                >
                  {/* Active Plan Celebration Lottie Overlay (only shown when plan is active, not expired) */}
                  {isCurrentPlan && isPlanActive && (
                    <ActivePlanCelebrationOverlay
                      isActive={true}
                      isDarkMode={isDarkMode}
                      showBadge={false}
                    />
                  )}

                  {/* Top Attached Expiration & Renewal Countdown Pill for Active or Exact Expired Plan */}
                  {(isCurrentPlan || isExactExpiredPlan) && (
                    <div className="absolute -top-3.5 left-4 sm:left-6 z-30">
                      <PlanExpirationCountdown
                        currentPeriodEnd={activePlan?.currentPeriodEnd || activePlan?.expiresAt}
                        currentPeriodStart={activePlan?.currentPeriodStart || activePlan?.startDate}
                        cancelAtPeriodEnd={activePlan?.cancelAtPeriodEnd}
                        status={isSubscriptionExpired ? 'expired' : activePlan?.status}
                        isDarkMode={isDarkMode}
                      />
                    </div>
                  )}

                  {/* Top Popular / Dynamic Badge (only shown when not current plan and not exact expired plan to prevent overlap) */}
                  {(isPopular || displayPlan.badge) && !isCurrentPlan && !isExactExpiredPlan && (
                    <div className="absolute -top-2.5 right-6 z-20">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-md flex items-center gap-1 ${
                        isDarkMode ? 'bg-white text-black' : 'bg-black text-white'
                      }`}>
                        <Star className="w-3 h-3 fill-current" />
                        <span>{displayPlan.badge || 'Most Popular'}</span>
                      </span>
                    </div>
                  )}

                  <div className="relative z-10">
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
                          {displayPlan.badge || (displayPlan.tierLevel === 1 ? 'For Starters' : displayPlan.tierLevel === 2 ? 'Pro Tier' : 'Advanced')}
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
                        <div className="space-y-0.5 mt-0.5">
                          <p className={`text-[11px] font-bold ${isDarkMode ? 'text-zinc-300' : 'text-zinc-800'}`}>
                            {isOffline ? 'Save --' : `Save ${displayPlan.savingsPercent || maxSavingsPercent}% with yearly`}
                          </p>
                          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-normal">
                            {!isUsd
                              ? 'All taxes & GST included in price'
                              : '0% tax for overseas creators (Export of Services)'}
                          </p>
                        </div>
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

                  {/* Active Plan Tax Invoice Quick Download Pill */}
                  {isCurrentPlan && displayPlan.tierLevel > 0 && (
                    <div className={`relative z-10 p-2.5 rounded-xl border flex items-center justify-between text-xs mb-3.5 transition-colors ${
                      isDarkMode ? 'bg-white/[0.03] border-white/10 text-zinc-300' : 'bg-zinc-50 border-zinc-200 text-zinc-700'
                    }`}>
                      <div className="flex items-center gap-2 min-w-0 pr-1">
                        <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                          <Receipt className="w-3.5 h-3.5 text-emerald-500" />
                        </div>
                        <div className="truncate">
                          <span className="text-[11px] font-semibold block truncate leading-tight">
                            {invoices.length > 0 ? (invoices[0].invoiceNumber || 'Latest Tax Invoice') : 'Official GST Invoice'}
                          </span>
                          <span className="text-[9.5px] text-zinc-400 dark:text-zinc-500 block leading-none mt-0.5">
                            {invoices.length > 0 ? (invoices[0].invoiceDate || 'Tax Compliant') : 'Generated upon billing'}
                          </span>
                        </div>
                      </div>

                      {invoices.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => handleDownloadPdf(invoices[0])}
                          disabled={actionLoading === 'invoice-' + invoices[0].id}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-bold text-[11px] transition-all shadow-xs shrink-0 ${
                            isDarkMode
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 active:scale-95 cursor-pointer'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 active:scale-95 cursor-pointer'
                          }`}
                          title="Download Official Tax Invoice (PDF)"
                        >
                          {actionLoading === 'invoice-' + invoices[0].id ? (
                            <ImSpinner2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Download className="w-3 h-3" />
                          )}
                          <span>Download PDF</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={true}
                          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10.5px] font-medium border opacity-60 cursor-not-allowed shrink-0 ${
                            isDarkMode ? 'bg-white/5 text-zinc-500 border-white/10' : 'bg-zinc-100 text-zinc-400 border-zinc-200'
                          }`}
                          title="Invoice will be generated when payment is completed"
                        >
                          <Download className="w-3 h-3 opacity-40" />
                          <span>Pending</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Action CTA Button */}
                  <button
                    onClick={() => handlePlanCardClick(displayPlan)}
                    disabled={isOffline || isCurrentPlan || isLowerTier || isCoveredByAnnual || actionLoading === 'upgrade' || actionLoading === 'starter-' + displayPlan.id}
                    className={`relative z-10 w-full py-3 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md flex items-center justify-center gap-1.5 ${
                      isOffline
                        ? isDarkMode ? 'bg-white/5 text-zinc-500 border border-white/10 cursor-not-allowed' : 'bg-zinc-100 text-zinc-400 border border-zinc-200 cursor-not-allowed'
                        : isCurrentPlan
                        ? isDarkMode ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-600/40 cursor-default' : 'bg-emerald-50 text-emerald-700 border border-emerald-300 cursor-default'
                        : isExactExpiredPlan
                        ? isDarkMode
                          ? 'bg-amber-500 hover:bg-amber-400 text-black font-extrabold shadow-lg shadow-amber-950/50 active:scale-95 cursor-pointer'
                          : 'bg-amber-600 hover:bg-amber-700 text-white font-extrabold shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer'
                        : isCoveredByAnnual || isLowerTier
                        ? isDarkMode ? 'bg-white/5 text-zinc-500 border border-white/10 cursor-not-allowed opacity-60' : 'bg-zinc-100 text-zinc-400 border border-zinc-200 cursor-not-allowed opacity-75'
                        : isUpgradeToAnnual
                        ? isDarkMode
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold shadow-lg shadow-emerald-950/50 active:scale-95 cursor-pointer'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer'
                        : isPopular
                        ? isDarkMode
                          ? 'bg-white hover:bg-zinc-200 text-black shadow-lg active:scale-95 cursor-pointer'
                          : 'bg-black hover:bg-zinc-800 text-white shadow-lg active:scale-95 cursor-pointer'
                        : isDarkMode
                        ? 'bg-white/10 hover:bg-white/15 text-white border border-white/10 active:scale-95 cursor-pointer'
                        : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border border-zinc-200 active:scale-95 cursor-pointer'
                    }`}
                  >
                    {actionLoading === 'starter-' + displayPlan.id && <ImSpinner2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{buttonLabel}</span>
                    {!isCurrentPlan && !isOffline && !isLowerTier && !isCoveredByAnnual && <ArrowRight className="w-3.5 h-3.5 ml-0.5" />}
                  </button>
                </motion.div>
              );
            })}
          </section>
        )}

        {/* ── 4. EXPANDABLE FEATURE COMPARISON MATRIX ───────────────────────── */}
        <section
          style={{ contentVisibility: 'auto', containIntrinsicSize: '600px' }}
          className={`w-full rounded-3xl border overflow-hidden transition-all ${
            isDarkMode ? 'bg-[#101013] border-white/10' : 'bg-white border-zinc-200 shadow-md'
          }`}
        >
          <button
            onClick={() => setShowMatrix((prev) => !prev)}
            className="w-full p-6 sm:p-7 flex items-center justify-between text-left hover:opacity-90 transition-opacity cursor-pointer"
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

          <AnimatePresence>
            {showMatrix && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.35, ease: [0.04, 0.62, 0.23, 0.98] }}
                className="border-t border-white/[0.06] p-6 sm:p-7 overflow-x-auto"
              >
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
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* ── 5. ENTERPRISE BILLING FAQS ────────────────────────────────────── */}
        <section
          style={{ contentVisibility: 'auto', containIntrinsicSize: '500px' }}
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
                    className="w-full p-4 sm:p-5 flex items-center justify-between text-left font-normal text-xs sm:text-sm cursor-pointer"
                  >
                    <span className={isDarkMode ? 'text-zinc-200' : 'text-zinc-800'}>{faq.question}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4 shrink-0 ml-2" /> : <ChevronDown className="w-4 h-4 shrink-0 ml-2" />}
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className={`px-4 sm:px-5 pb-5 text-xs font-normal leading-relaxed overflow-hidden ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}
                      >
                        {faq.answer}
                      </motion.div>
                    )}
                  </AnimatePresence>
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
            data-lenis-prevent="true"
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
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                      <Receipt className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold tracking-tight">Official Billing & Invoices</h3>
                      <p className={`text-[11px] font-normal ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                        Digitally signed & GST (SAC 998439) compliant tax receipts
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowInvoicesModal(false)}
                  className={`p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors cursor-pointer ${
                    isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-black'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {invoices.length === 0 ? (
                  <div className="py-10 px-4 text-center flex flex-col items-center justify-center space-y-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                      isDarkMode ? 'bg-white/5 border-white/10 text-zinc-500' : 'bg-zinc-50 border-zinc-200 text-zinc-400'
                    }`}>
                      <Receipt className="w-6 h-6 opacity-60" />
                    </div>
                    <div className="max-w-xs space-y-1">
                      <h4 className={`text-xs font-bold ${isDarkMode ? 'text-zinc-300' : 'text-zinc-800'}`}>
                        No Invoices Generated Yet
                      </h4>
                      <p className={`text-[11px] leading-relaxed ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>
                        When you subscribe to a paid plan or process a renewal, your official tax invoices will appear here automatically with instant PDF download.
                      </p>
                    </div>
                  </div>
                ) : (
                  invoices.map((inv) => {
                    const isPaid = (inv.status || '').toLowerCase() === 'paid' || (inv.status || '').toLowerCase() === 'success';
                    const isPending = (inv.status || '').toLowerCase() === 'pending' || (inv.status || '').toLowerCase() === 'processing';
                    const isUsd = (inv.currency || '').toUpperCase() === 'USD';
                    const currSymbol = isUsd ? '$' : '₹';
                    const totalVal = Number(inv.totalAmount || 0);
                    const prorationCreditVal = Number(inv.prorationCredit || 0);

                    // Parse Line Items & Extract Upgrade Metadata
                    let parsedItems: any[] = [];
                    let upgradeMeta: any = null;
                    if (inv.lineItems) {
                      try {
                        parsedItems = typeof inv.lineItems === 'string' ? JSON.parse(inv.lineItems) : inv.lineItems;
                        if (Array.isArray(parsedItems)) {
                          upgradeMeta = parsedItems.find((it: any) => it.type === 'UPGRADE_METADATA');
                        }
                      } catch {
                        // ignore malformed line items
                      }
                    }

                    const isUpgrade = inv.isProrated || prorationCreditVal > 0 || (inv.lineItems && inv.lineItems.includes('PRORATION')) || upgradeMeta !== null;
                    const isDowngrade = inv.lineItems && inv.lineItems.includes('DOWNGRADE');
                    const invTaxRate = inv.taxRate ? Number(inv.taxRate) : 18;
                    const taxableVal = isUsd ? totalVal : (inv.subtotal ? Number(inv.subtotal) : Math.round((totalVal / (1 + invTaxRate / 100)) * 100) / 100);
                    const gstVal = isUsd ? 0 : (inv.taxAmount ? Number(inv.taxAmount) : Math.round((totalVal - taxableVal) * 100) / 100);

                    // Upgrade pathway names and dates
                    const fromPlanName = upgradeMeta?.fromPlanName || activePlan?.planName || 'Previous Plan';
                    const toPlanName = upgradeMeta?.toPlanName || inv.planName || activePlan?.planName || 'Upgraded Plan';
                    const fromPlanPrice = upgradeMeta?.fromPlanPrice ? Number(upgradeMeta.fromPlanPrice) : 0;
                    const toPlanPrice = upgradeMeta?.toPlanPrice ? Number(upgradeMeta.toPlanPrice) : totalVal;
                    const remainingDaysCount = upgradeMeta?.remainingDays || 0;
                    const proratedTargetCharge = upgradeMeta?.proratedTargetCharge ? Number(upgradeMeta.proratedTargetCharge) : round2(totalVal + prorationCreditVal);

                    let formattedValidUntil = 'End of current billing cycle';
                    if (upgradeMeta?.validUntil) {
                      try {
                        const vDate = new Date(upgradeMeta.validUntil);
                        formattedValidUntil = vDate.toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        });
                      } catch {
                        // ignore invalid date string
                      }
                    } else if (inv.currentPeriodEnd) {
                      try {
                        const vDate = new Date(inv.currentPeriodEnd);
                        formattedValidUntil = vDate.toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        });
                      } catch {
                        // ignore invalid date string
                      }
                    }
                    
                    return (
                      <div
                        key={inv.id}
                        className={`p-4 sm:p-5 rounded-2xl border flex flex-col gap-3 transition-all ${
                          isDarkMode
                            ? isUpgrade
                              ? 'bg-gradient-to-b from-[#131422] to-[#0e0f14] border-indigo-500/30 hover:border-indigo-500/50 shadow-lg'
                              : 'bg-white/5 border-white/10 hover:border-white/20'
                            : isUpgrade
                            ? 'bg-gradient-to-b from-indigo-50/50 to-white border-indigo-200 hover:border-indigo-300 shadow-sm'
                            : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300'
                        }`}
                      >
                        {/* Top Row: Invoice Number, Badges, Status & Download */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                            <span className="font-extrabold text-xs sm:text-sm tracking-tight">{inv.invoiceNumber}</span>
                            
                            {isUpgrade && (
                              <span className="text-[9.5px] px-2.5 py-0.5 rounded-full font-extrabold uppercase tracking-wide bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
                                ★ Plan Upgrade
                              </span>
                            )}

                            {isDowngrade && (
                              <span className="text-[9.5px] px-2.5 py-0.5 rounded-full font-extrabold uppercase tracking-wide bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                Downgrade
                              </span>
                            )}

                            <span className={`text-[9.5px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ${
                              isPaid
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                : isPending
                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                                : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                            }`}>
                              {inv.status}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDownloadPdf(inv)}
                            disabled={!isPaid || actionLoading === 'invoice-' + inv.id}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shrink-0 ${
                              !isPaid
                                ? 'opacity-40 cursor-not-allowed border-zinc-300 dark:border-white/10'
                                : isDarkMode
                                ? 'border-indigo-500/40 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 active:scale-95 cursor-pointer shadow-xs'
                                : 'border-indigo-300 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 active:scale-95 cursor-pointer shadow-xs'
                            }`}
                            title={isPaid ? 'Download Official Tax Invoice PDF' : 'Invoice generation pending'}
                          >
                            {actionLoading === 'invoice-' + inv.id ? (
                              <ImSpinner2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Download className="w-3.5 h-3.5" />
                            )}
                            <span>{isPaid ? 'Download PDF' : 'Pending'}</span>
                          </button>
                        </div>

                        {/* Upgrade Pathway Card (If Upgrade Invoice) */}
                        {isUpgrade && (
                          <div className={`p-3 rounded-xl border flex flex-col gap-1.5 text-xs ${
                            isDarkMode
                              ? 'bg-black/40 border-indigo-500/20 text-zinc-300'
                              : 'bg-white border-indigo-100 text-zinc-800 shadow-2xs'
                          }`}>
                            <div className="flex items-center gap-2 flex-wrap font-bold text-[11px] sm:text-xs text-indigo-600 dark:text-indigo-400">
                              <span>{fromPlanName} ({currSymbol}{fromPlanPrice}/mo)</span>
                              <ArrowRight className="w-3 h-3 text-indigo-500" />
                              <span className="text-zinc-900 dark:text-white">{toPlanName} ({currSymbol}{toPlanPrice}/mo)</span>
                              <span className="text-[9px] px-2 py-0.2 rounded-full font-mono bg-indigo-500/10 border border-indigo-500/20">
                                {remainingDaysCount} days remaining
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 text-[10.5px] pt-1.5 border-t border-indigo-500/10 dark:border-white/5">
                              <div>
                                <span className="text-zinc-500 dark:text-zinc-400">New Plan Prorated ({remainingDaysCount}d): </span>
                                <strong className="font-semibold text-zinc-900 dark:text-white">{currSymbol}{proratedTargetCharge.toFixed(2)}</strong>
                              </div>
                              <div>
                                <span className="text-zinc-500 dark:text-zinc-400">Unused Credit Refund: </span>
                                <strong className="font-semibold text-emerald-600 dark:text-emerald-400">- {currSymbol}{prorationCreditVal.toFixed(2)}</strong>
                              </div>
                              <div className="sm:col-span-2 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                                <Check className="w-3 h-3" />
                                <span>Plan Active Immediately &bull; Valid until: {formattedValidUntil}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Middle Row: Date, SAC Code & Big Total Paid Amount Badge */}
                        <div className={`p-3 rounded-xl border flex items-center justify-between gap-2 flex-wrap ${
                          isDarkMode ? 'bg-black/20 border-white/5' : 'bg-zinc-100/70 border-zinc-200/80'
                        }`}>
                          <div>
                            <div className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">
                              Total Paid Today
                            </div>
                            <div className="flex items-baseline gap-1.5">
                              <span className="font-black text-xl sm:text-2xl tracking-tight text-indigo-600 dark:text-indigo-400">
                                {currSymbol}{totalVal.toFixed(2)}
                              </span>
                              <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/25 uppercase">
                                Tax-Inclusive (PAID)
                              </span>
                            </div>
                          </div>

                          <div className="text-right text-[10.5px] text-zinc-500 dark:text-zinc-400 font-medium">
                            <div>Issued: {inv.invoiceDate || 'Recent'}</div>
                            <div className="font-mono text-[10px]">SAC 998439 (SaaS Services)</div>
                          </div>
                        </div>

                        {/* Bottom Row: GST Tax Invoice Compliance Breakdown */}
                        <div className={`text-[10px] p-2 rounded-xl border flex flex-col gap-1 ${
                          isDarkMode ? 'bg-black/30 border-white/5 text-zinc-400' : 'bg-white/90 border-zinc-200 text-zinc-600'
                        }`}>
                          {isUsd ? (
                            <span>Export of Services &bull; 0.0% GST (LUT Sec 16) &bull; Net Amount: ${totalVal.toFixed(2)}</span>
                          ) : (
                            <div className="flex flex-wrap items-center justify-between w-full gap-1">
                              <span>Taxable Base Subtotal: <strong className="text-zinc-800 dark:text-zinc-200">₹{taxableVal.toFixed(2)}</strong></span>
                              <span>18% GST (Included): <strong className="text-zinc-800 dark:text-zinc-200">₹{gstVal.toFixed(2)}</strong> (CGST 9%: ₹{(gstVal / 2).toFixed(2)} + SGST 9%: ₹{(gstVal / 2).toFixed(2)})</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ── 12. ENTERPRISE CHECKOUT & ORDER REVIEW MODAL (Lazy Loaded) ──────────────────── */}
      {selectedCheckoutPlan && (
        <Suspense fallback={null}>
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
            activePlan={activePlan}
            plans={displayPlans}
            prorationQuote={prorationQuote}
            onSuccess={handleCheckoutSuccess}
            isDarkMode={isDarkMode}
          />
        </Suspense>
      )}

      {/* ── 13. SUBSCRIPTION ACTIVATION CELEBRATION MODAL (Lazy Loaded) ────────────────── */}
      {successData && (
        <Suspense fallback={null}>
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
            currentPeriodEnd={successData.currentPeriodEnd}
            isDarkMode={isDarkMode}
          />
        </Suspense>
      )}

      {/* ── 14. UPGRADE PRORATION STORY EXPLAINER MODAL (Lazy Loaded) ────────────────── */}
      {showUpgradeStoryModal && (
        <Suspense fallback={null}>
          <UpgradeStoryModal
            isOpen={showUpgradeStoryModal}
            onClose={() => {
              setShowUpgradeStoryModal(false);
              setStoryTargetPlan(null);
            }}
            onProceedToCheckout={() => {
              setShowUpgradeStoryModal(false);
              if (storyTargetPlan) {
                setSelectedCheckoutPlan(storyTargetPlan);
              }
              setShowCheckoutModal(true);
            }}
            targetPlan={storyTargetPlan || selectedCheckoutPlan || displayPlans.find((p) => p.tierLevel === 3) || displayPlans[2] || displayPlans[1]}
            activePlan={activePlan}
            plans={displayPlans}
            user={user}
            prorationQuote={prorationQuote}
            billingCycle={billingCycle}
            isDarkMode={isDarkMode}
          />
        </Suspense>
      )}

    </div>
  );
}
