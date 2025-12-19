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
} from "../controllers/orderController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes are protected
router.use(authMiddleware);

// ========== SPECIFIC ROUTES FIRST (before /:id) ==========
// Create orders
router.post("/gig", createOrderFromGig);
router.post("/request/create-payment", createRequestPaymentOrder);
router.post("/request/verify-payment", verifyRequestPayment);

// Get orders - stats must come before /:id
router.get("/stats", getOrderStats);
router.get("/", getMyOrders);

// ========== PARAMETERIZED ROUTES LAST ==========
// Get single order by ID (must be last among GET routes)
router.get("/:id", getOrder);

// Order actions
router.patch("/:id/accept", acceptOrder);
router.patch("/:id/reject", rejectOrder);
router.patch("/:id/submit", submitWork);
router.patch("/:id/complete", completeOrder);
router.patch("/:id/dispute", raiseDispute);

export default router;

