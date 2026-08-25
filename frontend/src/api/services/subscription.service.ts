import { api } from '../client';

export interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string;
  targetRole: 'creator' | 'editor' | 'brand' | 'user' | 'all';
  tierLevel: number;
  priceMonthly: number;
  priceAnnual: number;
  currency: string;
  trialDays: number;
  features: Record<string, boolean>;
  limits: Record<string, number>;
  badge?: string;
  isPopular?: boolean;
  isActive: boolean;
}

export interface UserSubscription {
  id: string;
  userId: string;
  plan?: Plan;
  planId: string;
  planName: string;
  status: 'active' | 'cancelling' | 'paused' | 'past_due' | 'unpaid' | 'expired' | 'trialing';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  pausedAt?: string;
  pauseResumesAt?: string;
  gracePeriodEndsAt?: string;
  prorationCredit?: number;
}

export interface ProrationQuote {
  currentPlanId: string;
  currentPlanName: string;
  targetPlanId: string;
  targetPlanName: string;
  currentPlanPrice: number;
  targetPlanPrice: number;
  unusedCredit: number;
  netSubtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  remainingDays: number;
  remainingSeconds: number;
  totalPeriodSeconds: number;
  currentPeriodEnd: string;
}

export interface UsageFeatureDetail {
  featureName: string;
  currentUsage: number;
  maxLimit: number;
  remainingQuota: number;
  usagePercentage: number;
  isUnlimited: boolean;
  isOverage: boolean;
  overageUnits: number;
}

export interface UsageSummary {
  userId: string;
  planId: string;
  planName: string;
  usagePeriod: string;
  periodResetAt?: string;
  featureUsages: Record<string, UsageFeatureDetail>;
}

export interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  invoiceDate: string;
  paidAt?: string;
  isProrated: boolean;
  prorationCredit: number;
  lineItems: string;
}

export const subscriptionService = {
  // 1. Fetch Plans (Filtered by Workspace Role)
  getPlans: async (role?: string): Promise<Plan[]> => {
    const res = await api.get('/subscriptions/plans', {
      params: role ? { role } : {},
    });
    return Array.isArray(res.data) ? res.data : (res.data.plans || []);
  },

  // 2. Fetch User Entitlements & Active Subscription
  getEntitlements: async () => {
    const res = await api.get('/subscriptions/entitlements');
    return res.data;
  },

  // 3. Get Real-Time Proration Quote for Plan Upgrade
  getQuoteUpgrade: async (targetPlanId: string): Promise<ProrationQuote> => {
    const res = await api.get('/subscriptions/quote-upgrade', {
      params: { targetPlanId },
    });
    return res.data;
  },

  // 4. Execute Immediate Plan Upgrade
  upgradeSubscription: async (data: {
    targetPlanId: string;
    provider?: string;
    providerPaymentId?: string;
  }) => {
    const res = await api.post('/subscriptions/upgrade', data);
    return res.data;
  },

  // 5. Schedule Plan Downgrade for Period End
  downgradeSubscription: async (data: {
    targetPlanId: string;
    reason?: string;
    feedback?: string;
  }) => {
    const res = await api.post('/subscriptions/downgrade', data);
    return res.data;
  },

  // 6. Pause Subscription
  pauseSubscription: async (data: { pauseDays: number; reason?: string }) => {
    const res = await api.post('/subscriptions/pause', data);
    return res.data;
  },

  // 7. Resume Paused Subscription
  resumeSubscription: async () => {
    const res = await api.post('/subscriptions/resume');
    return res.data;
  },

  // 8. Cancel Subscription
  cancelSubscription: async (data: { reason?: string; feedback?: string }) => {
    const res = await api.post('/subscriptions/cancel', data);
    return res.data;
  },

  // 9. Fetch Live Usage Summary Meters
  getUsageSummary: async (): Promise<UsageSummary> => {
    const res = await api.get('/subscriptions/usage-summary');
    return res.data;
  },

  // 10. Fetch Billing Invoices History
  getUserInvoices: async (): Promise<InvoiceItem[]> => {
    const res = await api.get('/invoices');
    return Array.isArray(res.data) ? res.data : [];
  },

  // 11. Download GST Invoice PDF
  downloadInvoicePdf: async (invoiceId: string, invoiceNumber: string) => {
    const res = await api.get(`/invoices/${invoiceId}/pdf`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${invoiceNumber || 'Invoice'}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};