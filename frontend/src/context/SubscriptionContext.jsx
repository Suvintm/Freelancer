/**
 * SubscriptionContext
 * Manages subscription state globally across the app
 */

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useAppContext } from "./AppContext";

const SubscriptionContext = createContext();

const API_BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export const SubscriptionProvider = ({ children }) => {
  const { user } = useAppContext();
  const [subscriptions, setSubscriptions] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState({});

  // Fetch available plans
  const fetchPlans = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/subscriptions/plans`);
      setPlans(res.data.plans || []);
    } catch (error) {
      console.error("Failed to fetch plans:", error);
    }
  }, []);

  // Fetch user's subscriptions
  const fetchSubscriptions = useCallback(async () => {
    if (!user?.token) return;

    try {
      const res = await axios.get(`${API_BASE}/api/subscriptions/my`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setSubscriptions(res.data.subscriptions || []);
    } catch (error) {
      console.error("Failed to fetch subscriptions:", error);
    }
  }, [user?.token]);

  // Check subscription status for a specific feature
  const checkFeatureSubscription = useCallback(async (feature) => {
    if (!user?.token) {
      setSubscriptionStatus((prev) => ({
        ...prev,
        [feature]: { hasSubscription: false, subscription: null, hasUsedTrial: false },
      }));
      return false;
    }

    try {
      const res = await axios.get(`${API_BASE}/api/subscriptions/check/${feature}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      
      setSubscriptionStatus((prev) => ({
        ...prev,
        [feature]: res.data,
      }));
      
      return res.data.hasSubscription;
    } catch (error) {
      console.error("Failed to check subscription:", error);
      return false;
    }
  }, [user?.token]);

  // Start free trial
  const startTrial = useCallback(async (planId) => {
    if (!user?.token) throw new Error("Not authenticated");

    const res = await axios.post(
      `${API_BASE}/api/subscriptions/start-trial`,
      { planId },
      { headers: { Authorization: `Bearer ${user.token}` } }
    );

    // Refresh subscriptions
    await fetchSubscriptions();
    
    return res.data;
  }, [user?.token, fetchSubscriptions]);

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

    // Refresh subscriptions
    await fetchSubscriptions();

    return res.data;
  }, [user?.token, fetchSubscriptions]);

  // Cancel subscription
  const cancelSubscription = useCallback(async (subscriptionId) => {
    if (!user?.token) throw new Error("Not authenticated");

    const res = await axios.post(
      `${API_BASE}/api/subscriptions/cancel/${subscriptionId}`,
      {},
      { headers: { Authorization: `Bearer ${user.token}` } }
    );

    // Refresh subscriptions
    await fetchSubscriptions();

    return res.data;
  }, [user?.token, fetchSubscriptions]);

  // Check if user has active subscription for feature
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

  // Initial load
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchPlans();
      if (user?.token) {
        await fetchSubscriptions();
        await checkFeatureSubscription("profile_insights");
      }
      setLoading(false);
    };

    init();
  }, [user?.token, fetchPlans, fetchSubscriptions, checkFeatureSubscription]);

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
