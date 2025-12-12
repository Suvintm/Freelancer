import express from "express";
import {
  createOrderFromGig,
  createOrderFromRequest,
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

// Create orders
router.post("/gig", createOrderFromGig);
router.post("/request", createOrderFromRequest);

// Get orders
router.get("/", getMyOrders);
router.get("/stats", getOrderStats);
router.get("/:id", getOrder);

// Order actions
router.patch("/:id/accept", acceptOrder);
router.patch("/:id/reject", rejectOrder);
router.patch("/:id/submit", submitWork);
router.patch("/:id/complete", completeOrder);
router.patch("/:id/dispute", raiseDispute);

export default router;
