import { api } from '../client';

export interface Plan {
  _id: string;
  name: string;
  slug: string;
  feature: string;
  planTier: 'free' | 'creator' | 'pro' | 'elite';
  duration: string;
  durationDays: number;
  price: number;
  originalPrice?: number;
  currency: string;
  discountPercent?: number;
  trialDays: number;
  features: string[];
  description: string;
  badge?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface UserSubscription {
  _id: string;
  user: string;
  plan: string | Plan;
  planName: string;
  planType: string;
  feature: string;
  status: 'active' | 'cancelled' | 'expired' | 'trial' | 'payment_pending';
  startDate: string;
  endDate: string;
  amount: number;
  currency: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  autoRenew: boolean;
  isTrial: boolean;
  createdAt: string;
  updatedAt: string;
  planTier?: string;
}

export const subscriptionService = {
  getPlans: async (): Promise<{ success: boolean; plans: Plan[] }> => {
    const res = await api.get('/payments/plans');
    return res.data;
  },

  getMySubscriptions: async (): Promise<{ success: boolean; subscriptions: UserSubscription[] }> => {
    const res = await api.get('/payments/my');
    return res.data;
  },

  checkSubscriptionStatus: async (feature: string): Promise<{
    success: boolean;
    hasSubscription: boolean;
    subscription: UserSubscription | null;
    hasUsedTrial: boolean;
    feature: string;
  }> => {
    const res = await api.get(`/payments/check/${feature}`);
    return res.data;
  },

  startTrial: async (planId: string): Promise<{
    success: boolean;
    message: string;
    subscription: UserSubscription;
  }> => {
    const res = await api.post('/payments/start-trial', { planId });
    return res.data;
  },

  createOrder: async (planId: string): Promise<{
    success: boolean;
    orderId: string;
    amount: number;
    currency: string;
    subscriptionId: string;
    keyId: string;
    plan: {
      name: string;
      duration: string;
      features: string[];
    };
  }> => {
    const res = await api.post('/payments/create-order', { planId });
    return res.data;
  },

  verifyPayment: async (data: {
    orderId: string;
    paymentId: string;
    signature: string;
    subscriptionId: string;
  }): Promise<{ success: boolean; message: string; subscription: UserSubscription }> => {
    const res = await api.post('/payments/verify-payment', data);
    return res.data;
  },

  cancelSubscription: async (id: string): Promise<{
    success: boolean;
    message: string;
    subscription: UserSubscription;
  }> => {
    const res = await api.post(`/payments/cancel/${id}`);
    return res.data;
  },
};
