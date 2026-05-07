import express from 'express';
const router = express.Router();
import communityController from '../controllers/communityController.js';
import { authenticate } from '../../../middleware/authMiddleware.js';
import { 
  feedLimiter, 
  interactionLimiter, 
  heavyLimiter, 
  publicApiLimiter 
} from '../../../middleware/rateLimiter.js';

// ── PUBLIC ROUTES ──────────────────────────────────────────────────────────
router.get('/s/:slug', publicApiLimiter, communityController.getBySlug);

// ── PROTECTED ROUTES ────────────────────────────────────────────────────────
router.use(authenticate);

router.get('/me', publicApiLimiter, communityController.getMyCommunities);
router.get('/:communityId', publicApiLimiter, communityController.getById);
router.post('/', heavyLimiter, communityController.create);
router.post('/:communityId/join', interactionLimiter, communityController.join);
router.get('/:communityId/messages', feedLimiter, communityController.getMessages);
router.post('/:communityId/messages', interactionLimiter, communityController.sendMessage);
router.post('/:communityId/messages/:messageId/react', interactionLimiter, communityController.reactToMessage);

export default router;

