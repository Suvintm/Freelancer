/**
 * Admin Payment Settings Routes
 */

import express from "express";
import { protectAdmin } from "../middleware/adminAuth.js";
import {
  getPaymentSettings,
  updatePaymentSettings,
  getPaymentAnalytics,
} from "../controllers/adminPaymentController.js";

const router = express.Router();

// All routes require admin auth
router.use(protectAdmin);

// GET /api/admin/payment-settings
router.get("/", getPaymentSettings);

// PUT /api/admin/payment-settings
router.put("/", updatePaymentSettings);

// GET /api/admin/payment-settings/analytics
router.get("/analytics", getPaymentAnalytics);

export default router;
