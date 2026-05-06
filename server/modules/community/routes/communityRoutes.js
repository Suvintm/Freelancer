import express from 'express';
const router = express.Router();
import communityController from '../controllers/communityController.js';
import { authenticate } from '../../../middleware/authMiddleware.js';

// ── PUBLIC ROUTES ──────────────────────────────────────────────────────────
router.get('/s/:slug', communityController.getBySlug);

// ── PROTECTED ROUTES ────────────────────────────────────────────────────────
router.use(authenticate);

router.post('/', communityController.create);
router.post('/:communityId/join', communityController.join);
router.get('/:communityId/messages', communityController.getMessages);
router.post('/:communityId/messages', communityController.sendMessage);

export default router;

