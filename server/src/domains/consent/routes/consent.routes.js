import express from 'express';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import { consentController } from '../controllers/consent.controller.js';
import { getClientIP } from '../../../shared/middleware/geo-check.middleware.js';

const router = express.Router();

/**
 * Optional JWT extraction: if token is present, attach decoded user to req.user.
 * Does not block anonymous visitors.
 */
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.decode(token);
      if (decoded && (decoded.id || decoded.userId)) {
        req.user = decoded;
      }
    }
  } catch {
    // Ignore token errors for optional auth
  }
  next();
};

/**
 * Rate Limiter for consent logging:
 * Max 20 requests per IP per hour. Real users click once every 6 months.
 */
const consentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => getClientIP(req) || req.ip || 'unknown-ip',
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many consent updates from this IP. Please try again later.',
  },
});

/**
 * @route POST /api/v1/consent/log
 * @desc  Record user/visitor cookie consent choice
 * @access Public (Guest & Authenticated)
 */
router.post('/log', consentLimiter, optionalAuth, consentController.recordConsent);

export default router;
