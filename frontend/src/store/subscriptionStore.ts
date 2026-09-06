import { create } from 'zustand';
import { subscriptionService } from '../api/services/subscription.service';
import type { Plan, SubscriptionDashboardData } from '../api/services/subscription.service';

interface SubscriptionState {
  // Plan catalog cached by workspace role (creator, editor, brand, user)
  plansByRole: Record<string, Plan[]>;
  activeSubscription: any | null;
  usageSummary: any | null;
  selectedRole: string;
  billingCycle: 'monthly' | 'annual';
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setSelectedRole: (role: string) => void;
  setBillingCycle: (cycle: 'monthly' | 'annual') => void;
  fetchDashboard: (role?: string, userId?: string, forceRefresh?: boolean) => Promise<SubscriptionDashboardData | null>;
  invalidateCache: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  plansByRole: {},
  activeSubscription: null,
  usageSummary: null,
  selectedRole: 'creator',
  billingCycle: 'monthly',
  isLoading: false,
  error: null,

  setSelectedRole: (role: string) => {
    set({ selectedRole: role });
    // Check if plans for this role are already in memory; if not, trigger background fetch
    const currentPlans = get().plansByRole[role];
    if (!currentPlans || currentPlans.length === 0) {
      get().fetchDashboard(role);
    }
  },

  setBillingCycle: (cycle: 'monthly' | 'annual') => {
    set({ billingCycle: cycle });
  },

  fetchDashboard: async (role?: string, userId?: string, forceRefresh = false) => {
    const targetRole = role || get().selectedRole;
    
    // If we already have plans cached and not forcing refresh, avoid showing full loader
    const hasCachedPlans = !!(get().plansByRole[targetRole]?.length);
    if (!hasCachedPlans || forceRefresh) {
      set({ isLoading: true, error: null });
    }

    try {
      const data = await subscriptionService.getDashboard(targetRole, userId);
      set((state) => ({
        plansByRole: {
          ...state.plansByRole,
          [targetRole]: data.plans,
        },
        activeSubscription: data.activeSubscription || null,
        usageSummary: data.usageSummary || null,
        selectedRole: targetRole,
        isLoading: false,
        error: null,
      }));
      return data;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to load subscription dashboard';
      set({ isLoading: false, error: msg });
      return null;
    }
  },

  invalidateCache: () => {
    set({ plansByRole: {}, activeSubscription: null, usageSummary: null });
  },
}));
