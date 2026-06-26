/**
 * shared/middleware/capability.middleware.js
 *
 * Role-based capability gating for SuviX's multi-role platform.
 *
 * INSTEAD of doing this scattered across controllers:
 *   if (req.user.role !== 'editor') return res.status(403)...
 *
 * USE THIS:
 *   router.post('/reels', authenticate, requireCapability('content.upload.reel'), handler)
 *
 * CAPABILITY MAP:
 *   YouTube Creator  → upload posts, reels, stories, connect YT channel, apply for campaigns
 *   Editor           → upload posts, reels, stories (same content, different UI sections)
 *   Brand / Client   → create campaigns, browse creators, make payments
 *   All roles        → subscribe, view notifications, send messages
 *
 * FUTURE (Microservices):
 *   Replace this middleware with a call to an Auth/Permissions microservice.
 *   The route code doesn't change — only this file changes.
 */

import { CAPABILITY_MAP } from '../kernel/constants.js';

/**
 * requireCapability(capability)
 *
 * Returns an Express middleware that blocks the request if the
 * authenticated user's sub-category doesn't have the required capability.
 *
 * @param {string} capability - e.g. 'content.upload.reel'
 */
export const requireCapability = (capability) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  const allowedSubCategories = CAPABILITY_MAP[capability];

  // Unknown capability — fail safe (deny)
  if (!allowedSubCategories) {
    return res.status(403).json({
      success: false,
      message: `Unknown capability: ${capability}`,
    });
  }

  // Admin bypass — admins can do everything
  if (req.user._systemRole === 'admin' || req.user.role === 'admin') {
    return next();
  }

  // Get user's sub-category slug from their primary role
  const userSubCategorySlug = req.user.primaryRole?.subCategorySlug || '';
  const userGroupRole = req.user.primaryRole?.group || '';

  // Check if user's subCategory is in the allowed list
  const hasCapability = allowedSubCategories.some((allowed) =>
    userSubCategorySlug.toLowerCase().includes(allowed.toLowerCase())
  );

  if (!hasCapability) {
    return res.status(403).json({
      success: false,
      message: `Your role (${req.user.primaryRole?.subCategory || userGroupRole}) does not have access to this feature.`,
      required: capability,
      userRole: req.user.primaryRole?.subCategory,
    });
  }

  next();
};

/**
 * requireGroup(group)
 *
 * Simpler check — just needs PROVIDER or CLIENT group.
 * Use when any provider (Creator OR Editor) is allowed.
 *
 * @param {'PROVIDER' | 'CLIENT'} group
 */
export const requireGroup = (group) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  if (req.user._systemRole === 'admin') return next();

  const userGroup = req.user.primaryRole?.group;

  if (userGroup !== group) {
    return res.status(403).json({
      success: false,
      message: `This feature requires ${group} role. You are ${userGroup}.`,
    });
  }

  next();
};

/**
 * requireAnyRole(...roles)
 *
 * Allows multiple app roles.
 * e.g. requireAnyRole('editor', 'admin')
 */
export const requireAnyRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  if (roles.includes(req.user.role) || req.user._systemRole === 'admin') {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: `Access requires one of: ${roles.join(', ')}`,
  });
};
