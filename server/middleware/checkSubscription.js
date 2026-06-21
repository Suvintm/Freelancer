/**
 * Subscription Middleware (PostgreSQL / Prisma version)
 * Checks if user has an active subscription for a specific feature
 */

import prisma from "../config/prisma.js";

/**
 * Middleware factory to require subscription for a feature
 * @param {string} feature - The feature to check subscription for
 * @returns {Function} Express middleware
 */
export const requireSubscription = (feature) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?._id || req.user?.id;
      // User must be authenticated
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      // Check for active subscription
      const subscription = await prisma.subscription.findFirst({
        where: {
          userId,
          feature: { in: [feature, "all"] },
          status: { in: ["active", "trial"] },
          endDate: { gte: new Date() }
        },
        include: { plan: true }
      });

      if (!subscription) {
        return res.status(403).json({
          success: false,
          requiresSubscription: true,
          feature,
          message: "This feature requires an active subscription",
        });
      }

      // Attach to request
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
      const userId = req.user?._id || req.user?.id;
      if (userId) {
        const subscription = await prisma.subscription.findFirst({
          where: {
            userId,
            feature: { in: [feature, "all"] },
            status: { in: ["active", "trial"] },
            endDate: { gte: new Date() }
          },
          include: { plan: true }
        });
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
