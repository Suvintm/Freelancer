/**
 * Subscription Middleware
 * Checks if user has an active subscription for a specific feature
 */

import { Subscription } from "../models/Subscription.js";

/**
 * Middleware factory to require subscription for a feature
 * @param {string} feature - The feature to check subscription for
 * @returns {Function} Express middleware
 */
export const requireSubscription = (feature) => {
  return async (req, res, next) => {
    try {
      // User must be authenticated
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      // Check for active subscription
      const hasSubscription = await Subscription.hasActiveSubscription(
        req.user._id,
        feature
      );

      if (!hasSubscription) {
        return res.status(403).json({
          success: false,
          requiresSubscription: true,
          feature,
          message: "This feature requires an active subscription",
        });
      }

      // Get the active subscription and attach to request
      const subscription = await Subscription.getActiveSubscription(
        req.user._id,
        feature
      );
      req.subscription = subscription;

      next();
    } catch (error) {
      console.error("Subscription middleware error:", error);
      res.status(500).json({
        success: false,
        message: "Error checking subscription status",
      });
    }
  };
};

/**
 * Middleware to optionally check subscription (doesn't block)
 * Just attaches subscription status to request
 */
export const checkSubscription = (feature) => {
  return async (req, res, next) => {
    try {
      if (req.user) {
        const subscription = await Subscription.getActiveSubscription(
          req.user._id,
          feature
        );
        req.hasSubscription = !!subscription;
        req.subscription = subscription;
      } else {
        req.hasSubscription = false;
        req.subscription = null;
      }
      next();
    } catch (error) {
      req.hasSubscription = false;
      req.subscription = null;
      next();
    }
  };
};

export default requireSubscription;
