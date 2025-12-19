/**
 * SubscriptionContext
 * Manages subscription state globally across the app
 * Production-ready with caching and rate limit handling
 */

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { useAppContext } from "./AppContext";

const SubscriptionContext = createContext();

const API_BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

// Cache duration (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

// Get cached data from localStorage
const getCachedData = (key) => {
  try {
    const cached = localStorage.getItem(`suvix_sub_${key}`);
    if (!cached) return null;
    
    const { data, timestamp } = JSON.parse(cached);
    const isExpired = Date.now() - timestamp > CACHE_DURATION;
    
    return isExpired ? null : data;
  } catch {
    return null;
  }
};

// Set cached data to localStorage
const setCachedData = (key, data) => {
  try {
    localStorage.setItem(`suvix_sub_${key}`, JSON.stringify({
      data,
      timestamp: Date.now(),
    }));
  } catch {
    // Ignore storage errors
  }
};

export const SubscriptionProvider = ({ children }) => {
  const { user } = useAppContext();
  const [subscriptions, setSubscriptions] = useState([]);
  const [plans, setPlans] = useState(() => getCachedData("plans") || []);
  const [loading, setLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState(() => {
    // Load cached subscription status for this user
    if (user?._id) {
      return getCachedData(`status_${user._id}`) || {};
    }
    return {};
  });

  // Track if already fetched to prevent duplicate calls
  const hasFetchedPlans = useRef(false);
  const hasFetchedSubs = useRef(false);
  const pendingRequests = useRef({});

  // Fetch available plans (with caching)
  const fetchPlans = useCallback(async (force = false) => {
    // Check cache first
    if (!force && plans.length > 0) {
      return plans;
    }

    // Check localStorage cache
    const cached = getCachedData("plans");
    if (!force && cached && cached.length > 0) {
      setPlans(cached);
      return cached;
    }

    // Prevent duplicate requests
    if (pendingRequests.current.plans) {
      return pendingRequests.current.plans;
    }

    try {
      pendingRequests.current.plans = axios.get(`${API_BASE}/api/subscriptions/plans`);
      const res = await pendingRequests.current.plans;
      const planData = res.data.plans || [];
      
      setPlans(planData);
      setCachedData("plans", planData);
      
      return planData;
    } catch (error) {
      // On rate limit, use cached data
      if (error.response?.status === 429) {
        const cached = getCachedData("plans");
        if (cached) {
          setPlans(cached);
          return cached;
        }
      }
      console.error("Failed to fetch plans:", error);
      return [];
    } finally {
      delete pendingRequests.current.plans;
    }
  }, [plans]);

  // Fetch user's subscriptions (with caching)
  const fetchSubscriptions = useCallback(async (force = false) => {
    if (!user?.token) return [];

    // Check cache first
    const cacheKey = `subs_${user._id}`;
    if (!force) {
      const cached = getCachedData(cacheKey);
      if (cached) {
        setSubscriptions(cached);
        return cached;
      }
    }

    // Prevent duplicate requests
    if (pendingRequests.current.subs) {
      return pendingRequests.current.subs;
    }

    try {
      pendingRequests.current.subs = axios.get(`${API_BASE}/api/subscriptions/my`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const res = await pendingRequests.current.subs;
      const subsData = res.data.subscriptions || [];
      
      setSubscriptions(subsData);
      setCachedData(cacheKey, subsData);
      
      return subsData;
    } catch (error) {
      if (error.response?.status === 429) {
        const cached = getCachedData(cacheKey);
        if (cached) {
          setSubscriptions(cached);
          return cached;
        }
      }
      console.error("Failed to fetch subscriptions:", error);
      return [];
    } finally {
      delete pendingRequests.current.subs;
    }
  }, [user?.token, user?._id]);

  // Check subscription status for a specific feature (with caching)
  const checkFeatureSubscription = useCallback(async (feature, force = false) => {
    if (!user?.token) {
      setSubscriptionStatus((prev) => ({
        ...prev,
        [feature]: { hasSubscription: false, subscription: null, hasUsedTrial: false },
      }));
      return false;
    }

    // Check cache first
    const cacheKey = `status_${user._id}`;
    if (!force && subscriptionStatus[feature]) {
      return subscriptionStatus[feature].hasSubscription;
    }

    // Prevent duplicate requests
    const reqKey = `check_${feature}`;
    if (pendingRequests.current[reqKey]) {
      const result = await pendingRequests.current[reqKey];
      return result.hasSubscription;
    }

    try {
      pendingRequests.current[reqKey] = axios.get(`${API_BASE}/api/subscriptions/check/${feature}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const res = await pendingRequests.current[reqKey];
      
      setSubscriptionStatus((prev) => {
        const newStatus = { ...prev, [feature]: res.data };
        setCachedData(cacheKey, newStatus);
        return newStatus;
      });
      
      return res.data.hasSubscription;
    } catch (error) {
      if (error.response?.status === 429) {
        // Use cached status if rate limited
        return subscriptionStatus[feature]?.hasSubscription || false;
      }
      console.error("Failed to check subscription:", error);
      return false;
    } finally {
      delete pendingRequests.current[reqKey];
    }
  }, [user?.token, user?._id, subscriptionStatus]);

  // Start free trial
  const startTrial = useCallback(async (planId) => {
    if (!user?.token) throw new Error("Not authenticated");

    const res = await axios.post(
      `${API_BASE}/api/subscriptions/start-trial`,
      { planId },
      { headers: { Authorization: `Bearer ${user.token}` } }
    );

    // Clear cache and refresh
    if (user?._id) {
      localStorage.removeItem(`suvix_sub_subs_${user._id}`);
      localStorage.removeItem(`suvix_sub_status_${user._id}`);
    }
    await fetchSubscriptions(true);
    
    return res.data;
  }, [user?.token, user?._id, fetchSubscriptions]);

  // Create order for payment
  const createOrder = useCallback(async (planId) => {
    if (!user?.token) throw new Error("Not authenticated");

    const res = await axios.post(
      `${API_BASE}/api/subscriptions/create-order`,
      { planId },
      { headers: { Authorization: `Bearer ${user.token}` } }
    );

    return res.data;
  }, [user?.token]);

  // Verify payment
  const verifyPayment = useCallback(async (paymentData) => {
    if (!user?.token) throw new Error("Not authenticated");

    const res = await axios.post(
      `${API_BASE}/api/subscriptions/verify-payment`,
      paymentData,
      { headers: { Authorization: `Bearer ${user.token}` } }
    );

    // Clear cache and refresh
    if (user?._id) {
      localStorage.removeItem(`suvix_sub_subs_${user._id}`);
      localStorage.removeItem(`suvix_sub_status_${user._id}`);
    }
    await fetchSubscriptions(true);

    return res.data;
  }, [user?.token, user?._id, fetchSubscriptions]);

  // Cancel subscription
  const cancelSubscription = useCallback(async (subscriptionId) => {
    if (!user?.token) throw new Error("Not authenticated");

    const res = await axios.post(
      `${API_BASE}/api/subscriptions/cancel/${subscriptionId}`,
      {},
      { headers: { Authorization: `Bearer ${user.token}` } }
    );

    // Clear cache and refresh
    if (user?._id) {
      localStorage.removeItem(`suvix_sub_subs_${user._id}`);
      localStorage.removeItem(`suvix_sub_status_${user._id}`);
    }
    await fetchSubscriptions(true);

    return res.data;
  }, [user?.token, user?._id, fetchSubscriptions]);

  // Check if user has active subscription for feature (sync, from cache)
  const hasActiveSubscription = useCallback((feature) => {
    const status = subscriptionStatus[feature];
    return status?.hasSubscription || false;
  }, [subscriptionStatus]);

  // Check if user has used trial for feature
  const hasUsedTrial = useCallback((feature) => {
    const status = subscriptionStatus[feature];
    return status?.hasUsedTrial || false;
  }, [subscriptionStatus]);

  // Get active subscription for feature
  const getSubscription = useCallback((feature) => {
    const status = subscriptionStatus[feature];
    return status?.subscription || null;
  }, [subscriptionStatus]);

  // Initial load - only once per session
  useEffect(() => {
    const init = async () => {
      // Only run if not already fetched
      if (hasFetchedPlans.current) {
        setLoading(false);
        return;
      }

      setLoading(true);
      
      // Fetch plans (uses cache automatically)
      await fetchPlans();
      hasFetchedPlans.current = true;
      
      // Only fetch user-specific data if logged in
      if (user?.token && !hasFetchedSubs.current) {
        await fetchSubscriptions();
        await checkFeatureSubscription("profile_insights");
        hasFetchedSubs.current = true;
      }
      
      setLoading(false);
    };

    init();
  }, [user?.token]);

  // Reset cache flags when user changes
  useEffect(() => {
    hasFetchedSubs.current = false;
  }, [user?._id]);

  const value = {
    // State
    subscriptions,
    plans,
    loading,
    subscriptionStatus,

    // Actions
    fetchPlans,
    fetchSubscriptions,
    checkFeatureSubscription,
    startTrial,
    createOrder,
    verifyPayment,
    cancelSubscription,

    // Helpers
    hasActiveSubscription,
    hasUsedTrial,
    getSubscription,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return context;
};

export default SubscriptionContext;
