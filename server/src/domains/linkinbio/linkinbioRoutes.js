import { Router } from 'express';
import authenticate from '../../shared/middleware/auth.middleware.js';
import bioPageController from './controllers/bioPageController.js';
import bioPublicController from './controllers/bioPublicController.js';
import bioAnalyticsController from './controllers/bioAnalyticsController.js';
import bioQrController from './controllers/bioQrController.js';

const router = Router();

// ── 1. PUBLIC VISITOR & TRACKING ROUTES (No Auth Required) ──────────────────
router.get('/public/:username', (req, res, next) => bioPublicController.getPublicProfile(req, res, next));
router.get('/public/:username/:slug', (req, res, next) => bioPublicController.getPublicProfile(req, res, next));
router.post('/track/view', (req, res, next) => bioAnalyticsController.trackView(req, res, next));
router.post('/track/click', (req, res, next) => bioAnalyticsController.trackClick(req, res, next));
router.post('/subscribe/:pageId', (req, res, next) => bioAnalyticsController.subscribe(req, res, next));

// ── 2. ON-DEMAND QR CODE GENERATION (Authenticated) ─────────────────────────
router.post('/qr/generate', authenticate, (req, res, next) => bioQrController.generateQr(req, res, next));
router.get('/qr/status', authenticate, (req, res, next) => bioQrController.getQrStatus(req, res, next));

// ── 3. AUTHENTICATED CREATOR & EDITOR ROUTES ─────────────────────────────────
router.get('/pages', authenticate, (req, res, next) => bioPageController.getPages(req, res, next));
router.post('/pages', authenticate, (req, res, next) => bioPageController.createPage(req, res, next));
router.get('/pages/:id', authenticate, (req, res, next) => bioPageController.getPageById(req, res, next));
router.put('/pages/:id/draft', authenticate, (req, res, next) => bioPageController.saveDraft(req, res, next));
router.post('/pages/:id/publish', authenticate, (req, res, next) => bioPageController.publishPage(req, res, next));
router.put('/pages/:id/set-primary', authenticate, (req, res, next) => bioPageController.setPrimary(req, res, next));
router.delete('/pages/:id', authenticate, (req, res, next) => bioPageController.deletePage(req, res, next));
router.get('/analytics/:pageId', authenticate, (req, res, next) => bioAnalyticsController.getAnalytics(req, res, next));

export default router;
