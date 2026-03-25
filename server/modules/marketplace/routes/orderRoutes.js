import express from "express";
import {
  createOrderFromGig,
  createRequestPaymentOrder,
  verifyRequestPayment,
  verifyRequestPaymentCallback,
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
  getNewOrdersCount,
  togglePinOrder,
} from "../controllers/orderController.js";
import authMiddleware from "../../../../middleware/authMiddleware.js";
import { requireClientKYC } from "../../../../middleware/kycCheckMiddleware.js";
import { createGigOrderValidator, disputeValidator, extendDeadlineValidator } from "../../../../middleware/validators.js";

const router = express.Router();

// ========== PUBLIC CALLBACK (For Razorpay Redirects) ==========
router.post("/request/callback", verifyRequestPaymentCallback);

// All other routes are protected
router.use(authMiddleware);

// ========== SPECIFIC ROUTES FIRST (before /:id) ==========
// Create orders - KYC NO LONGER REQUIRED
router.post("/gig", createGigOrderValidator, createOrderFromGig);
router.post("/request/create-payment", createRequestPaymentOrder);
router.post("/request/verify-payment", verifyRequestPayment);

// Get orders - stats must come before /:id
router.get("/new-count", getNewOrdersCount);
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
router.patch("/:id/dispute", disputeValidator, raiseDispute);
router.post("/:id/extend-deadline", extendDeadlineValidator, extendDeadline);
router.patch("/:id/pin", togglePinOrder);

export default router;

