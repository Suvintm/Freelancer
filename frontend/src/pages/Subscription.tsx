import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../store/slices/authSlice';
import { subscriptionService } from '../api/services/subscription.service';
import type { Plan, ProrationQuote, UsageSummary, InvoiceItem } from '../api/services/subscription.service';
import { useTheme } from '../hooks/useTheme';
import lightLogo from '../assets/lightlogo.png';
import darkLogo from '../assets/darklogo.png';

import {
  ROLE_CONFIGS,
  COMPARISON_MATRICES,
  ENTERPRISE_FAQS,
  mergeBackendPlansWithPresenter,
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

  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'info' });

  const triggerToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 5000);
  }, []);

  // 1. Initial Load: Fetch Plans, Entitlements, Usage & Invoices
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedPlans = await subscriptionService.getPlans(selectedRole).catch(() => []);
      setPlans(fetchedPlans);
      setRolePlansCache((prev) => ({ ...prev, [selectedRole]: fetchedPlans }));

      // Only fetch user-specific entitlements/invoices if authenticated
      if (user?.id) {
        const [entitlements, usage, userInvoices] = await Promise.all([
          subscriptionService.getEntitlements(user.id).catch(() => null),
          subscriptionService.getUsageSummary(user.id).catch(() => null),
          subscriptionService.getUserInvoices(user.id).catch(() => []),
        ]);

        if (entitlements) setActivePlan(entitlements);
        if (usage) setUsageSummary(usage);
        if (userInvoices) setInvoices(userInvoices);
      }
    } catch (err: any) {
      console.warn('Subscription plans notice:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedRole, user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
      const rolePlans = await subscriptionService.getPlans(role);
      setPlans(rolePlans);
      setRolePlansCache((prev) => ({ ...prev, [role]: rolePlans }));
    } catch (err: any) {
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
    return mergeBackendPlansWithPresenter(plans, selectedRole);
  }, [plans, selectedRole]);

  const comparisonMatrix = useMemo(() => {
    return COMPARISON_MATRICES[selectedRole] || COMPARISON_MATRICES.creator;
  }, [selectedRole]);

  // 4. Enterprise Checkout Handlers
  const handlePlanCardClick = async (displayPlan: PlanCardPresenter) => {
    if (!user) {
      navigate('/register');
      return;
    }

    if (displayPlan.tierLevel === 1) {
      if (activePlan?.tierLevel === 1) {
        triggerToast('You are already on the Free Starter tier.', 'info');
        return;
      }
      setActionLoading('starter-' + displayPlan.id);
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

    if (displayPlan.priceMonthly >= 2500) {
      window.location.href =
        'mailto:contact@suvix.in?subject=' + encodeURIComponent(displayPlan.name + ' Enterprise Plan Inquiry');
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
    } catch (err: any) {
      triggerToast('Failed to download invoice PDF', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className={`w-full min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-black text-white' : 'bg-white text-zinc-900'}`}>
        <div className="flex flex-col items-center gap-3">
          <ImSpinner2 className="w-8 h-8 animate-spin opacity-80" />
          <p className="text-xs font-semibold uppercase tracking-wider opacity-60">Loading SuviX Subscriptions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full min-h-full font-sans transition-colors duration-200 ${isDarkMode ? 'bg-black text-white' : 'bg-white text-zinc-900'}`}>
      
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

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 sm:pt-5 pb-12 flex flex-col gap-5 sm:gap-6">

        {/* ── 1 & 2. HERO HEADER + UNIQUE ACTIVE PLAN (Side-by-side in Laptop View) ── */}
        <section className={activePlan ? "grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-center" : "text-center flex flex-col items-center gap-2"}>
          
          {/* ── LEFT COLUMN: Redesigned Hero Header ──────────────────────── */}
          <div className={activePlan ? "lg:col-span-5 flex flex-col items-start text-left gap-2" : "flex flex-col items-center text-center gap-2"}>
            {/* Badge Pill */}
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider border transition-all ${
                isDarkMode
                  ? 'border-white/15 bg-white/[0.04] text-zinc-300'
                  : 'border-zinc-300 bg-zinc-100 text-zinc-700'
              }`}
            >
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>{currentRoleConfig.badgeLabel}</span>
            </div>

            {/* Main Headline */}
            <h1
              className={`text-xl sm:text-2xl md:text-3xl lg:text-3xl font-bold tracking-tight leading-tight ${
                isDarkMode ? 'text-white' : 'text-zinc-900'
              }`}
            >
              {currentRoleConfig.heroHeadline}
            </h1>

            {/* Subtitle */}
            <p
              className={`text-xs sm:text-sm leading-relaxed font-normal ${activePlan ? 'max-w-md' : 'max-w-lg'} ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}
            >
              {currentRoleConfig.heroSubtitle}
            </p>

            {/* Switcher & Role Controls */}
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {/* Monthly / Yearly Switcher */}
              <div
                className={`inline-flex items-center p-0.5 rounded-full border ${
                  isDarkMode ? 'bg-[#111114] border-white/10' : 'bg-zinc-200/70 border-zinc-300'
                }`}
              >
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    billingCycle === 'monthly'
                      ? isDarkMode
                        ? 'bg-white/10 text-white shadow-sm'
                        : 'bg-white text-zinc-900 shadow-sm'
                      : isDarkMode
                      ? 'text-zinc-400 hover:text-zinc-200'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle('annual')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    billingCycle === 'annual'
                      ? isDarkMode
                        ? 'bg-white/10 text-white shadow-sm'
                        : 'bg-white text-zinc-900 shadow-sm'
                      : isDarkMode
                      ? 'text-zinc-400 hover:text-zinc-200'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  <span>Yearly</span>
                  <span
                    className={`text-[8.5px] px-1.5 py-0.2 rounded-full font-medium uppercase tracking-tight ${
                      billingCycle === 'annual'
                        ? isDarkMode
                          ? 'bg-white text-black'
                          : 'bg-zinc-900 text-white'
                        : isDarkMode
                        ? 'bg-white/15 text-white'
                        : 'bg-zinc-300 text-zinc-800'
                    }`}
                  >
                    Save 20%
                  </span>
                </button>
              </div>

              {/* Role Display: Locked if logged in, tabs if guest */}
              {user ? (
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-normal border transition-all ${
                    isDarkMode
                      ? 'bg-white/5 border-white/15 text-zinc-300'
                      : 'bg-zinc-100 border-zinc-300 text-zinc-700'
                  }`}
                >
                  <Lock className="w-3 h-3 text-emerald-400" />
                  <span>
                    Role: <strong className="text-emerald-400 uppercase tracking-wide font-medium">{selectedRole}</strong>
                  </span>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { role: 'creator', label: '🎬 Creators' },
                    { role: 'editor', label: '✂️ Editors' },
                    { role: 'brand', label: '🏢 Brands' },
                    { role: 'user', label: '👤 Community' },
                  ].map((tab) => (
                    <button
                      key={tab.role}
                      onClick={() => handleRoleChange(tab.role as WorkspaceRole)}
                      disabled={actionLoading === 'role-switch'}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${
                        selectedRole === tab.role
                          ? isDarkMode
                            ? 'bg-white text-black border-white shadow-md'
                            : 'bg-zinc-900 text-white border-zinc-900 shadow-md'
                          : isDarkMode
                          ? 'border-white/10 bg-white/[0.02] text-zinc-400 hover:text-white hover:border-white/20'
                          : 'border-zinc-200 bg-white text-zinc-600 hover:text-zinc-900 hover:border-zinc-300'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT COLUMN: Professional Dynamic Active Plan Hub ─────────── */}
          {activePlan && (() => {
            const activePresenter = displayPlans.find(
              (p) =>
                (activePlan.planId && p.id === activePlan.planId) ||
                (activePlan.tierLevel && p.tierLevel === activePlan.tierLevel) ||
                (activePlan.planName && p.name.toLowerCase().includes(activePlan.planName.toLowerCase()))
            ) || displayPlans[0];

            const daysRemaining = activePlan.periodEnd
              ? Math.max(0, Math.ceil((new Date(activePlan.periodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
              : null;

            const formattedRenewal = activePlan.periodEnd
              ? new Date(activePlan.periodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : 'Lifetime Free';

            const roleAccentColor =
              selectedRole === 'creator'
                ? 'from-emerald-500/15 via-teal-500/5 to-transparent'
                : selectedRole === 'editor'
                ? 'from-indigo-500/15 via-purple-500/5 to-transparent'
                : selectedRole === 'brand'
                ? 'from-amber-500/15 via-orange-500/5 to-transparent'
                : 'from-sky-500/15 via-blue-500/5 to-transparent';

            const ActiveIcon = activePresenter?.icon || Zap;

            return (
              <div className="lg:col-span-7">
                <div
                  className={`relative rounded-3xl p-4 sm:p-5 border transition-all overflow-hidden shadow-2xl ${
                    isDarkMode
                      ? 'bg-gradient-to-br from-[#121216]/98 via-[#0e0e11]/98 to-[#09090b]/98 border-white/[0.12] text-white'
                      : 'bg-gradient-to-br from-white via-zinc-50/95 to-zinc-100/70 border-zinc-200 text-zinc-900 shadow-xl'
                  }`}
                >
                  {/* Dynamic Role Aura Glow */}
                  <div className={`absolute -top-12 -right-12 w-44 h-44 rounded-full blur-3xl pointer-events-none bg-gradient-to-br ${roleAccentColor}`} />

                  {/* ── SECTION A: TOP STATUS & HEALTH BAR ── */}
                  <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-white/[0.08] dark:border-white/[0.08]">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                          activePlan.status === 'paused' ? 'bg-amber-400' : 'bg-emerald-400'
                        }`} />
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${
                          activePlan.status === 'paused' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`} />
                      </span>
                      <span className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-300 dark:text-zinc-300">
                        {activePlan.status === 'paused' ? 'Billing Paused' : 'Active Subscription'}
                      </span>
                      <span className={`text-[9px] px-2 py-0.2 rounded-full font-medium border ${
                        activePlan.status === 'paused'
                          ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                          : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                      }`}>
                        {billingCycle === 'annual' ? 'Annual Plan' : 'Monthly Plan'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {daysRemaining !== null && (
                        <span className="text-[10px] text-zinc-400 font-normal">
                          Renews in <strong className="text-zinc-200 font-medium">{daysRemaining}d</strong>
                        </span>
                      )}
                      <span className={`text-[9.5px] px-2 py-0.5 rounded-full font-medium border ${
                        isDarkMode ? 'bg-white/5 border-white/10 text-zinc-300' : 'bg-zinc-100 border-zinc-200 text-zinc-700'
                      }`}>
                        Tier {activePresenter?.tierLevel || 1}
                      </span>
                    </div>
                  </div>

                  {/* ── SECTION B: PLAN IDENTITY & LIVE GAUGES ── */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-center mb-3">
                    {/* Plan Name & Billing Details */}
                    <div className="sm:col-span-5 flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                          isDarkMode
                            ? 'bg-white/5 border-white/10 text-white shadow-inner'
                            : 'bg-zinc-900 border-zinc-800 text-white shadow-md'
                        }`}
                      >
                        <ActiveIcon className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <h3 className={`text-base font-semibold leading-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                          {activePresenter?.name || activePlan.planName || 'Free Starter'}
                        </h3>
                        <p className={`text-[11px] mt-0.5 font-normal ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                          {activePlan.periodEnd ? (
                            <>Next billing: <span className={isDarkMode ? 'text-zinc-200 font-medium' : 'text-zinc-700 font-medium'}>{formattedRenewal}</span></>
                          ) : (
                            'Lifetime Free Access'
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Dynamic Resource Quota Gauges (Real Usage or Tier Allocations) */}
                    <div className="sm:col-span-7 flex flex-col gap-1.5 justify-center">
                      {usageSummary?.featureUsages && Object.keys(usageSummary.featureUsages).length > 0 ? (
                        Object.entries(usageSummary.featureUsages).slice(0, 2).map(([feat, data]) => (
                          <div key={feat} className="w-full">
                            <div className="flex justify-between text-[10px] text-zinc-400 mb-0.5">
                              <span className="capitalize font-normal">{feat.replace('_', ' ')}:</span>
                              <span className={`font-medium ${isDarkMode ? 'text-zinc-200' : 'text-zinc-700'}`}>
                                {data.currentUsage} / {data.isUnlimited ? '∞' : data.maxLimit}
                              </span>
                            </div>
                            <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDarkMode ? 'bg-white/10' : 'bg-zinc-200'}`}>
                              <div
                                className={`h-full transition-all duration-500 ${
                                  data.usagePercentage > 85 ? 'bg-rose-500' : 'bg-emerald-400'
                                }`}
                                style={{ width: `${Math.min(data.usagePercentage || 0, 100)}%` }}
                              />
                            </div>
                          </div>
                        ))
                      ) : activePresenter?.quotas && activePresenter.quotas.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2">
                          {activePresenter.quotas.slice(0, 2).map((q, idx) => (
                            <div
                              key={idx}
                              className={`p-1.5 rounded-xl border text-[10px] ${
                                isDarkMode ? 'bg-white/[0.03] border-white/5' : 'bg-zinc-100/80 border-zinc-200'
                              }`}
                            >
                              <div className="text-zinc-400 text-[9px] font-normal truncate">{q.label}</div>
                              <div className={`font-medium mt-0.2 truncate ${isDarkMode ? 'text-zinc-200' : 'text-zinc-800'}`}>
                                {q.value}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* ── SECTION C: UNLOCKED PRIVILEGES CHIPS ── */}
                  {activePresenter?.features && activePresenter.features.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 mb-3">
                      {activePresenter.features.slice(0, 2).map((feat, idx) => (
                        <div
                          key={idx}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-normal border ${
                            isDarkMode
                              ? 'bg-white/[0.03] border-white/10 text-zinc-300'
                              : 'bg-zinc-100 border-zinc-200 text-zinc-700'
                          }`}
                        >
                          <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span className="truncate max-w-[200px]">{feat}</span>
                        </div>
                      ))}
                      {activePresenter.tierLevel > 1 && (
                        <span className="text-[10px] text-zinc-500 ml-1">
                          +{activePresenter.features.length - 2} more privileges active
                        </span>
                      )}
                    </div>
                  )}

                  {/* ── SECTION D: PROFESSIONAL ACTION RIBBON ── */}
                  <div className={`pt-2.5 border-t flex flex-wrap items-center justify-between gap-2 text-xs ${
                    isDarkMode ? 'border-white/[0.08]' : 'border-zinc-200'
                  }`}>
                    <div className="flex items-center gap-1.5">
                      {activePlan.status === 'paused' ? (
                        <button
                          onClick={handleResumeSubscription}
                          disabled={actionLoading === 'resume'}
                          className={`flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-medium bg-emerald-500 text-black hover:bg-emerald-400 transition-all shadow-sm ${
                            actionLoading === 'resume' ? 'opacity-70' : ''
                          }`}
                        >
                          {actionLoading === 'resume' ? <ImSpinner2 className="w-3 h-3 animate-spin" /> : <PlayCircle className="w-3 h-3" />}
                          <span>Resume Plan</span>
                        </button>
                      ) : activePlan.tierLevel > 1 && (
                        <button
                          onClick={() => setShowPauseModal(true)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${
                            isDarkMode ? 'border-white/15 text-zinc-300 hover:bg-white/5' : 'border-zinc-300 text-zinc-700 hover:bg-zinc-100'
                          }`}
                        >
                          <PauseCircle className="w-3 h-3" />
                          <span>Pause Billing</span>
                        </button>
                      )}

                      {invoices.length > 0 && (
                        <button
                          onClick={() => setShowInvoicesModal(true)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${
                            isDarkMode ? 'border-white/15 text-zinc-300 hover:bg-white/5' : 'border-zinc-300 text-zinc-700 hover:bg-zinc-100'
                          }`}
                        >
                          <Receipt className="w-3 h-3" />
                          <span>Tax Invoices ({invoices.length})</span>
                        </button>
                      )}
                    </div>

                    {activePlan.tierLevel > 1 && (
                      <button
                        onClick={() => setShowCancelModal(true)}
                        className={`text-[11px] font-medium px-2 py-0.5 transition-colors ${
                          isDarkMode ? 'text-zinc-400 hover:text-rose-400' : 'text-zinc-500 hover:text-rose-600'
                        }`}
                      >
                        Cancel Plan
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

        </section>

        {/* ── 3. DYNAMIC PRICING CARDS GRID (Compact, Sleek, Above the Fold) ── */}
        <section className={`grid grid-cols-1 md:grid-cols-2 ${displayPlans.length === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-3.5 sm:gap-4 items-stretch`}>
          {displayPlans.map((displayPlan) => {
            const Icon = displayPlan.icon;
            const price = billingCycle === 'annual' ? displayPlan.priceAnnual : displayPlan.priceMonthly;
            
            const isCurrentPlan = activePlan && (
              (activePlan.planId && activePlan.planId === displayPlan.id) ||
              (activePlan.tierLevel === displayPlan.tierLevel && (activePlan.role === selectedRole || !activePlan.role)) ||
              (activePlan.planName && activePlan.planName.toLowerCase().includes(displayPlan.name.toLowerCase()))
            );

            return (
              <div
                key={displayPlan.key}
                className={`relative rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between transition-all duration-200 shadow-xl border ${
                  isDarkMode
                    ? displayPlan.isPopular
                      ? 'bg-[#101013] border-white/30 hover:border-white/50 text-white scale-[1.01]'
                      : 'bg-[#101013] border-white/10 hover:border-white/20 text-white'
                    : displayPlan.isPopular
                    ? 'bg-[#0e0e11] border-zinc-700 text-white scale-[1.01]'
                    : 'bg-[#0e0e11] border-zinc-800 text-white'
                }`}
              >
                {/* Popular Pill Badge */}
                {displayPlan.isPopular && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                    <span
                      className={`text-[8.5px] font-medium uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-md font-mono ${
                        isDarkMode
                          ? 'bg-white text-black border border-white/20'
                          : 'bg-white text-black border border-black/20'
                      }`}
                    >
                      {displayPlan.badge || 'MOST POPULAR'}
                    </span>
                  </div>
                )}

                <div>
                  {/* Icon Box */}
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center mb-2 border ${
                      isDarkMode
                        ? displayPlan.isPopular
                          ? 'bg-white/10 text-white border-white/20'
                          : 'bg-white/5 text-zinc-300 border-white/10'
                        : 'bg-white/10 text-white border-white/15'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>

                  {/* Plan Name & Subtitle */}
                  <h3 className="text-sm sm:text-base font-semibold tracking-tight leading-tight text-white">
                    {displayPlan.name}
                  </h3>
                  <p className="text-[10.5px] mt-0.5 font-normal text-zinc-400">
                    {displayPlan.subtitle}
                  </p>

                  {/* Price */}
                  <div className="flex items-baseline gap-1 mt-1.5 mb-2">
                    <span className="text-xl sm:text-2xl font-bold tracking-tight text-white">₹{price}</span>
                    <span className="text-[10px] font-normal text-zinc-400">/ month</span>
                  </div>

                  {/* Quota Highlights Pills */}
                  {displayPlan.quotas && displayPlan.quotas.length > 0 && (
                    <div className="p-2 rounded-xl mb-2.5 space-y-0.5 text-[10px] font-normal bg-white/5 text-zinc-300 border border-white/5">
                      {displayPlan.quotas.map((q, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span className="opacity-70">{q.label}:</span>
                          <span className="font-medium text-white">{q.value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="w-full h-px my-2 bg-white/10" />

                  {/* Features List */}
                  <ul className="space-y-1.5 text-[10.5px] mb-3 font-normal">
                    {displayPlan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-400" />
                        <span className="text-zinc-200">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action CTA Button */}
                <button
                  onClick={() => handlePlanCardClick(displayPlan)}
                  disabled={isCurrentPlan || actionLoading === 'upgrade' || actionLoading === 'starter-' + displayPlan.id}
                  className={`w-full py-2 rounded-full text-xs font-medium transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 ${
                    isCurrentPlan
                      ? 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-default'
                      : displayPlan.isPopular
                      ? 'bg-white text-black hover:bg-zinc-200'
                      : 'bg-white/10 text-white hover:bg-white/20 border border-white/15'
                  }`}
                >
                  {actionLoading === 'starter-' + displayPlan.id && <ImSpinner2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isCurrentPlan ? 'Current Plan' : displayPlan.buttonText}</span>
                </button>
              </div>
            );
          })}
        </section>

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
      {showPauseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
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
        </div>
      )}

      {/* ── 10. CANCEL MODAL ──────────────────────────────────────────────── */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
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
        </div>
      )}

      {/* ── 11. INVOICE HISTORY MODAL ─────────────────────────────────────── */}
      {showInvoicesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
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
                    <span className="font-semibold text-xs">₹{inv.totalAmount}</span>
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
        </div>
      )}

      {/* ── 12. ENTERPRISE CHECKOUT & ORDER REVIEW MODAL ──────────────────── */}
      {selectedCheckoutPlan && (
        <CheckoutModal
          isOpen={showCheckoutModal}
          onClose={() => setShowCheckoutModal(false)}
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
          isDarkMode={isDarkMode}
        />
      )}

    </div>
  );
}
