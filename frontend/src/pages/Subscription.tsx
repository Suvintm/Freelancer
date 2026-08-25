import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '../store/slices/authSlice';
import { subscriptionService } from '../api/services/subscription.service';
import type { Plan, ProrationQuote, UsageSummary, InvoiceItem } from '../api/services/subscription.service';
import { useTheme } from '../hooks/useTheme';

import {
  MdCheck,
  MdClose,
  MdDownload,
  MdPauseCircle,
  MdPlayCircle,
  MdUpgrade,
  MdCancel,
  MdReceiptLong,
  MdSpeed,
  MdInfoOutline,
} from 'react-icons/md';
import { ImSpinner2 } from 'react-icons/im';

type WorkspaceRole = 'creator' | 'editor' | 'brand' | 'user';

interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function Subscription() {
  const user = useSelector(selectUser);
  const { isDarkMode } = useTheme();

  const [selectedRole, setSelectedRole] = useState<WorkspaceRole>(() => {
    const r = (user?.role || 'creator').toLowerCase();
    if (r === 'client' || r === 'brand') return 'brand';
    if (r === 'freelancer' || r === 'editor') return 'editor';
    if (r === 'user') return 'user';
    return 'creator';
  });

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [activePlan, setActivePlan] = useState<any>(null);
  const [usageSummary, setUsageSummary] = useState<UsageSummary | null>(null);
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState<Plan | null>(null);
  const [prorationQuote, setProrationQuote] = useState<ProrationQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [pauseDays, setPauseDays] = useState(30);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'info' });

  const triggerToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 5000);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [fetchedPlans, entitlements, usage, userInvoices] = await Promise.all([
        subscriptionService.getPlans(selectedRole),
        subscriptionService.getEntitlements().catch(() => null),
        subscriptionService.getUsageSummary().catch(() => null),
        subscriptionService.getUserInvoices().catch(() => []),
      ]);

      setPlans(fetchedPlans);
      if (entitlements) setActivePlan(entitlements);
      if (usage) setUsageSummary(usage);
      if (userInvoices) setInvoices(userInvoices);
    } catch (err: any) {
      triggerToast(err.response?.data?.message || 'Failed to load subscription data', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedRole, triggerToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRoleChange = async (role: WorkspaceRole) => {
    setSelectedRole(role);
    setActionLoading('role-switch');
    try {
      const rolePlans = await subscriptionService.getPlans(role);
      setPlans(rolePlans);
    } catch (err: any) {
      triggerToast('Failed to switch workspace plans', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenUpgradeQuote = async (targetPlan: Plan) => {
    setSelectedUpgradePlan(targetPlan);
    setQuoteLoading(true);
    try {
      const quote = await subscriptionService.getQuoteUpgrade(targetPlan.id);
      setProrationQuote(quote);
    } catch (err: any) {
      triggerToast(err.response?.data?.message || 'Failed to calculate proration quote', 'error');
      setSelectedUpgradePlan(null);
    } finally {
      setQuoteLoading(false);
    }
  };

  const handleConfirmUpgrade = async () => {
    if (!selectedUpgradePlan) return;
    setActionLoading('upgrade');
    try {
      await subscriptionService.upgradeSubscription({
        targetPlanId: selectedUpgradePlan.id,
        provider: 'internal',
      });
      triggerToast('Successfully upgraded to ' + selectedUpgradePlan.name + '!', 'success');
      setSelectedUpgradePlan(null);
      setProrationQuote(null);
      await loadData();
    } catch (err: any) {
      triggerToast(err.response?.data?.message || 'Upgrade failed. Please try again.', 'error');
    } finally {
      setActionLoading(null);
    }
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
      <div className={'min-h-screen flex items-center justify-center ' + (isDarkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900')}>
        <div className='text-center'>
          <ImSpinner2 className='w-10 h-10 animate-spin text-indigo-600 mx-auto mb-3' />
          <p className='text-sm font-medium opacity-75'>Loading Enterprise Subscription Center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={'min-h-screen py-10 px-4 sm:px-6 lg:px-8 ' + (isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900')}>
      <div className='max-w-7xl mx-auto space-y-10'>

        {/* TOAST */}
        {toast.show && (
          <div
            className={'fixed top-5 right-5 z-50 px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 border text-sm font-medium transition-all ' +
              (toast.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 backdrop-blur-md'
                : toast.type === 'error'
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 backdrop-blur-md'
                : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 backdrop-blur-md')
            }
          >
            <span>{toast.message}</span>
            <button onClick={() => setToast((prev) => ({ ...prev, show: false }))} className='hover:opacity-75'>
              <MdClose className='w-4 h-4' />
            </button>
          </div>
        )}

        {/* HEADER & ROLE SELECTOR */}
        <div className='text-center space-y-4'>
          <div className='inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'>
            <MdSpeed className='w-4 h-4' />
            <span>Enterprise SaaS Engine</span>
          </div>
          <h1 className='text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent'>
            Flexible Plans for Every Role
          </h1>
          <p className='max-w-2xl mx-auto text-base text-slate-400'>
            Scale your freelance workspace with transparent second-level proration, sub-2ms feature access, and automated GST billing.
          </p>

          <div className='inline-flex p-1.5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md shadow-xl mt-4'>
            {[
              { role: 'creator', label: '🎬 Content Creator' },
              { role: 'editor', label: '✂️ Video Editor / Freelancer' },
              { role: 'brand', label: '🏢 Brand / Agency' },
              { role: 'user', label: '👤 Community Member' },
            ].map((tab) => (
              <button
                key={tab.role}
                onClick={() => handleRoleChange(tab.role as WorkspaceRole)}
                className={'px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ' +
                  (selectedRole === tab.role
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25 scale-[1.02]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50')
                }
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ACTIVE PLAN HERO CARD */}
        {activePlan && (
          <div className='p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 shadow-2xl relative overflow-hidden'>
            <div className='flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10'>
              <div className='space-y-2'>
                <div className='flex items-center gap-3'>
                  <h2 className='text-2xl sm:text-3xl font-bold text-white'>
                    {activePlan.tier ? activePlan.tier.toUpperCase() : 'FREE CREATOR'}
                  </h2>
                  <span
                    className={'px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ' +
                      (activePlan.status === 'paused'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30')
                    }
                  >
                    {activePlan.status || 'ACTIVE'}
                  </span>
                </div>
                <p className='text-sm text-slate-400'>
                  Current Billing Cycle ends on{' '}
                  <span className='text-slate-200 font-semibold'>
                    {activePlan.periodEnd ? new Date(activePlan.periodEnd).toLocaleDateString() : 'N/A'}
                  </span>
                </p>
              </div>

              <div className='flex flex-wrap items-center gap-3'>
                {activePlan.status === 'paused' ? (
                  <button
                    onClick={handleResumeSubscription}
                    disabled={actionLoading === 'resume'}
                    className='flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition-all'
                  >
                    {actionLoading === 'resume' ? <ImSpinner2 className='w-4 h-4 animate-spin' /> : <MdPlayCircle className='w-4 h-4' />}
                    <span>Resume Subscription</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setShowPauseModal(true)}
                    className='flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all'
                  >
                    <MdPauseCircle className='w-4 h-4 text-amber-400' />
                    <span>Pause Subscription</span>
                  </button>
                )}

                <button
                  onClick={() => setShowCancelModal(true)}
                  className='flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-slate-800/50 hover:bg-rose-500/10 text-rose-400 border border-rose-500/20 transition-all'
                >
                  <MdCancel className='w-4 h-4' />
                  <span>Cancel at Period End</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* REAL-TIME QUOTA & USAGE METERS */}
        {usageSummary && usageSummary.featureUsages && Object.keys(usageSummary.featureUsages).length > 0 && (
          <div className='space-y-4'>
            <div className='flex items-center gap-2'>
              <MdSpeed className='w-5 h-5 text-indigo-400' />
              <h3 className='text-xl font-bold text-slate-200'>Real-Time Quota Meters ({usageSummary.usagePeriod})</h3>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5'>
              {Object.values(usageSummary.featureUsages).map((feat) => {
                const isOver = feat.isOverage;
                const pct = feat.isUnlimited ? 0 : Math.min(100, feat.usagePercentage);

                return (
                  <div
                    key={feat.featureName}
                    className='p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md space-y-3'
                  >
                    <div className='flex items-center justify-between text-xs font-semibold text-slate-400'>
                      <span className='capitalize'>{feat.featureName.replace(/_/g, ' ')}</span>
                      {feat.isUnlimited ? (
                        <span className='text-emerald-400 font-bold'>UNLIMITED</span>
                      ) : (
                        <span className={isOver ? 'text-amber-400' : 'text-slate-300'}>
                          {feat.currentUsage} / {feat.maxLimit}
                        </span>
                      )}
                    </div>

                    {!feat.isUnlimited && (
                      <div className='w-full h-2 rounded-full bg-slate-800 overflow-hidden'>
                        <div
                          className={'h-full rounded-full transition-all duration-500 ' +
                            (isOver
                              ? 'bg-amber-500'
                              : pct > 80
                              ? 'bg-rose-500'
                              : pct > 50
                              ? 'bg-indigo-500'
                              : 'bg-emerald-500')
                          }
                          style={{ width: pct + '%' }}
                        />
                      </div>
                    )}

                    <div className='flex items-center justify-between text-[11px] text-slate-500'>
                      <span>{feat.isUnlimited ? 'Active Unlimited' : pct.toFixed(0) + '% Utilized'}</span>
                      {isOver && <span className='text-amber-400 font-bold'>+{feat.overageUnits} Overage</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* BILLING CYCLE TOGGLE */}
        <div className='flex items-center justify-center gap-4 pt-4'>
          <span className={'text-sm font-semibold ' + (billingCycle === 'monthly' ? 'text-white' : 'text-slate-400')}>
            Monthly Billing
          </span>
          <button
            onClick={() => setBillingCycle((prev) => (prev === 'monthly' ? 'annual' : 'monthly'))}
            className='w-14 h-7 rounded-full bg-slate-800 border border-slate-700 p-1 relative transition-all'
          >
            <div
              className={'w-5 h-5 rounded-full bg-indigo-500 transition-all ' +
                (billingCycle === 'annual' ? 'translate-x-7' : 'translate-x-0')
              }
            />
          </button>
          <div className='flex items-center gap-2'>
            <span className={'text-sm font-semibold ' + (billingCycle === 'annual' ? 'text-white' : 'text-slate-400')}>
              Annual Billing
            </span>
            <span className='px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'>
              Save 20%
            </span>
          </div>
        </div>

        {/* PRICING GRID */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch'>
          {plans.map((plan) => {
            const isCurrent = activePlan && activePlan.tier && activePlan.tier.toLowerCase() === plan.slug;
            const price = billingCycle === 'annual' ? Math.round(plan.priceAnnual / 12) : plan.priceMonthly;

            return (
              <div
                key={plan.id}
                className={'rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 relative ' +
                  (plan.isPopular
                    ? 'bg-gradient-to-b from-indigo-900/40 via-slate-900 to-slate-900 border-2 border-indigo-500 shadow-2xl shadow-indigo-500/10 scale-105'
                    : 'bg-slate-900/60 border border-slate-800 hover:border-slate-700')
                }
              >
                {plan.isPopular && (
                  <div className='absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-extrabold tracking-wider uppercase bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md'>
                    Most Popular
                  </div>
                )}

                <div className='space-y-6'>
                  <div>
                    <h3 className='text-2xl font-bold text-white'>{plan.name}</h3>
                    <p className='text-xs text-slate-400 mt-1 min-h-[32px]'>{plan.description || 'Workspace plan package'}</p>
                  </div>

                  <div className='flex items-baseline gap-1'>
                    <span className='text-4xl sm:text-5xl font-black text-white'>₹{price}</span>
                    <span className='text-sm font-medium text-slate-400'>/ month</span>
                  </div>

                  <div className='space-y-3 pt-4 border-t border-slate-800/80'>
                    <p className='text-xs font-bold uppercase tracking-wider text-slate-400'>What is Included:</p>
                    {plan.features &&
                      Object.entries(plan.features).map(([feat, enabled]) => (
                        <div key={feat} className='flex items-center gap-3 text-xs sm:text-sm'>
                          {enabled ? (
                            <MdCheck className='w-4 h-4 text-emerald-400 shrink-0' />
                          ) : (
                            <MdClose className='w-4 h-4 text-slate-600 shrink-0' />
                          )}
                          <span className={enabled ? 'text-slate-200' : 'text-slate-500'}>
                            {feat.replace(/_/g, ' ')}
                          </span>
                        </div>
                      ))}

                    {plan.limits &&
                      Object.entries(plan.limits).map(([lim, val]) => (
                        <div key={lim} className='flex items-center gap-3 text-xs sm:text-sm'>
                          <MdCheck className='w-4 h-4 text-indigo-400 shrink-0' />
                          <span className='text-slate-300'>
                            <strong>{val === -1 ? 'Unlimited' : val}</strong> {lim.replace(/_/g, ' ')}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>

                <div className='pt-8'>
                  {isCurrent ? (
                    <button
                      disabled
                      className='w-full py-3.5 rounded-2xl text-sm font-bold bg-slate-800/50 text-slate-500 border border-slate-700/50 cursor-not-allowed'
                    >
                      Current Plan
                    </button>
                  ) : (
                    <button
                      onClick={() => handleOpenUpgradeQuote(plan)}
                      className={'w-full py-3.5 rounded-2xl text-sm font-bold transition-all shadow-lg ' +
                        (plan.isPopular
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-500/25'
                          : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700')
                      }
                    >
                      Upgrade to {plan.name}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* BILLING INVOICE HISTORY TABLE */}
        <div className='space-y-4 pt-10'>
          <div className='flex items-center gap-2'>
            <MdReceiptLong className='w-5 h-5 text-indigo-400' />
            <h3 className='text-xl font-bold text-slate-200'>Billing History & GST Invoices</h3>
          </div>

          <div className='rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden backdrop-blur-md'>
            <div className='overflow-x-auto'>
              <table className='w-full text-left text-sm text-slate-300'>
                <thead className='bg-slate-900/90 text-xs uppercase font-bold text-slate-400 border-b border-slate-800'>
                  <tr>
                    <th className='p-4'>Invoice #</th>
                    <th className='p-4'>Date</th>
                    <th className='p-4'>Amount</th>
                    <th className='p-4'>Tax (GST)</th>
                    <th className='p-4'>Status</th>
                    <th className='p-4 text-right'>Action</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-slate-800/50'>
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan={6} className='p-6 text-center text-slate-500'>
                        No billing invoices recorded yet.
                      </td>
                    </tr>
                  ) : (
                    invoices.map((inv) => (
                      <tr key={inv.id} className='hover:bg-slate-800/30 transition-all'>
                        <td className='p-4 font-mono font-semibold text-white'>{inv.invoiceNumber}</td>
                        <td className='p-4 text-slate-400'>{inv.invoiceDate || 'N/A'}</td>
                        <td className='p-4 font-bold text-white'>₹{inv.totalAmount.toFixed(2)}</td>
                        <td className='p-4 text-slate-400'>₹{inv.taxAmount.toFixed(2)} ({inv.taxRate}%)</td>
                        <td className='p-4'>
                          <span className='px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'>
                            {inv.status}
                          </span>
                        </td>
                        <td className='p-4 text-right'>
                          <button
                            onClick={() => handleDownloadPdf(inv)}
                            disabled={actionLoading === ('invoice-' + inv.id)}
                            className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition-all'
                          >
                            {actionLoading === ('invoice-' + inv.id) ? (
                              <ImSpinner2 className='w-3.5 h-3.5 animate-spin' />
                            ) : (
                              <MdDownload className='w-3.5 h-3.5' />
                            )}
                            <span>PDF</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* PRORATION UPGRADE MODAL */}
        {selectedUpgradePlan && (
          <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm'>
            <div className='w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl space-y-6'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <MdUpgrade className='w-6 h-6 text-indigo-400' />
                  <h3 className='text-xl font-bold text-white'>Upgrade to {selectedUpgradePlan.name}</h3>
                </div>
                <button onClick={() => setSelectedUpgradePlan(null)} className='text-slate-400 hover:text-white'>
                  <MdClose className='w-5 h-5' />
                </button>
              </div>

              {quoteLoading ? (
                <div className='py-12 text-center'>
                  <ImSpinner2 className='w-8 h-8 animate-spin text-indigo-500 mx-auto mb-2' />
                  <p className='text-xs text-slate-400'>Calculating exact second-level proration credit...</p>
                </div>
              ) : prorationQuote ? (
                <div className='space-y-4'>
                  <div className='p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5 text-sm'>
                    <div className='flex justify-between text-slate-400'>
                      <span>New Plan Price:</span>
                      <span className='font-semibold text-white'>₹{prorationQuote.targetPlanPrice.toFixed(2)}</span>
                    </div>

                    {prorationQuote.unusedCredit > 0 && (
                      <div className='flex justify-between text-emerald-400'>
                        <span>Unused Credit ({prorationQuote.remainingDays} days left):</span>
                        <span className='font-semibold'>-₹{prorationQuote.unusedCredit.toFixed(2)}</span>
                      </div>
                    )}

                    <div className='flex justify-between text-slate-400 pt-2 border-t border-slate-800'>
                      <span>Net Taxable Subtotal:</span>
                      <span className='font-semibold text-white'>₹{prorationQuote.netSubtotal.toFixed(2)}</span>
                    </div>

                    <div className='flex justify-between text-slate-400'>
                      <span>18% GST Tax (SAC 998439):</span>
                      <span className='font-semibold text-white'>₹{prorationQuote.taxAmount.toFixed(2)}</span>
                    </div>

                    <div className='flex justify-between text-base font-bold text-white pt-2 border-t border-slate-800'>
                      <span>Total Payable Today:</span>
                      <span className='text-indigo-400'>₹{prorationQuote.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className='flex items-center gap-2 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300'>
                    <MdInfoOutline className='w-4 h-4 shrink-0' />
                    <span>Your plan privileges will be upgraded immediately upon payment completion.</span>
                  </div>

                  <div className='flex items-center justify-end gap-3 pt-2'>
                    <button
                      onClick={() => setSelectedUpgradePlan(null)}
                      className='px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300'
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmUpgrade}
                      disabled={actionLoading === 'upgrade'}
                      className='px-6 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg flex items-center gap-2'
                    >
                      {actionLoading === 'upgrade' && <ImSpinner2 className='w-4 h-4 animate-spin' />}
                      <span>Pay ₹{prorationQuote.totalAmount.toFixed(2)} & Upgrade</span>
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* PAUSE MODAL */}
        {showPauseModal && (
          <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm'>
            <div className='w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl space-y-6'>
              <h3 className='text-xl font-bold text-white'>Pause Subscription</h3>
              <p className='text-sm text-slate-400'>
                Keep all your data and portfolio active without being charged. Select how long you want to pause:
              </p>

              <div className='grid grid-cols-3 gap-3'>
                {[30, 60, 90].map((d) => (
                  <button
                    key={d}
                    onClick={() => setPauseDays(d)}
                    className={'py-3 rounded-xl text-sm font-bold border transition-all ' +
                      (pauseDays === d
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-slate-800 text-slate-300 border-slate-700')
                    }
                  >
                    {d} Days
                  </button>
                ))}
              </div>

              <div className='flex items-center justify-end gap-3 pt-2'>
                <button
                  onClick={() => setShowPauseModal(false)}
                  className='px-4 py-2 rounded-xl text-sm font-semibold bg-slate-800 text-slate-300'
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmPause}
                  disabled={actionLoading === 'pause'}
                  className='px-5 py-2 rounded-xl text-sm font-bold bg-amber-600 hover:bg-amber-500 text-white'
                >
                  {actionLoading === 'pause' ? <ImSpinner2 className='w-4 h-4 animate-spin' /> : 'Confirm Pause'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CANCEL MODAL */}
        {showCancelModal && (
          <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm'>
            <div className='w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl space-y-6'>
              <h3 className='text-xl font-bold text-white'>Cancel Subscription?</h3>
              <p className='text-sm text-slate-400'>
                Your subscription will remain active until the end of your current billing period. You will lose access to Verified Badge and high-res uploads afterwards.
              </p>

              <textarea
                placeholder='Help us improve: why are you cancelling?'
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className='w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500'
                rows={3}
              />

              <div className='flex items-center justify-end gap-3 pt-2'>
                <button
                  onClick={() => setShowCancelModal(false)}
                  className='px-4 py-2 rounded-xl text-sm font-semibold bg-slate-800 text-slate-300'
                >
                  Keep Subscription
                </button>
                <button
                  onClick={handleConfirmCancel}
                  disabled={actionLoading === 'cancel'}
                  className='px-5 py-2 rounded-xl text-sm font-bold bg-rose-600 hover:bg-rose-500 text-white'
                >
                  {actionLoading === 'cancel' ? <ImSpinner2 className='w-4 h-4 animate-spin' /> : 'Confirm Cancel'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
