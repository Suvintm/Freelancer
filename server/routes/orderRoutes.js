import express from "express";
import {
  createOrderFromGig,
  createRequestPaymentOrder,
  verifyRequestPayment,
  getMyOrders,
  getOrder,
  acceptOrder,
  rejectOrder,
  submitWork,
  completeOrder,
  raiseDispute,
  getOrderStats,
  extendDeadline,
  checkOverdueOrders,
  processOverdueRefunds,
  getDeadlineStatus,
} from "../controllers/orderController.js";
import authMiddleware from "../middleware/authMiddleware.js";

import { requireClientKYC } from "../middleware/kycCheckMiddleware.js";

const router = express.Router();

// All routes are protected
router.use(authMiddleware);

// ========== SPECIFIC ROUTES FIRST (before /:id) ==========
// Create orders - REQUIRE KYC
router.post("/gig", requireClientKYC, createOrderFromGig);
router.post("/request/create-payment", requireClientKYC, createRequestPaymentOrder);
router.post("/request/verify-payment", verifyRequestPayment);

// Get orders - stats must come before /:id
router.get("/stats", getOrderStats);
router.get("/", getMyOrders);

// Overdue processing routes (for cron jobs or admin)
router.post("/check-overdue", checkOverdueOrders);
router.post("/process-overdue-refunds", processOverdueRefunds);

// ========== PARAMETERIZED ROUTES LAST ==========
// Get single order by ID (must be last among GET routes)
router.get("/:id", getOrder);
router.get("/:id/deadline-status", getDeadlineStatus);

// Order actions
router.patch("/:id/accept", acceptOrder);
router.patch("/:id/reject", rejectOrder);
router.patch("/:id/submit", submitWork);
router.patch("/:id/complete", completeOrder);
router.patch("/:id/dispute", raiseDispute);
router.post("/:id/extend-deadline", extendDeadline);

export default router;
