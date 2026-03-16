import express from "express";
import { protectAdmin } from "../middleware/adminAuth.js";
import {
  getAllWithdrawals,
  getWithdrawalById,
  updateWithdrawalStatus,
  getWithdrawalStats
} from "../controllers/adminWithdrawalController.js";

const router = express.Router();

// All routes require admin auth
router.use(protectAdmin);

// GET /api/admin/withdrawals
router.get("/", getAllWithdrawals);

// GET /api/admin/withdrawals/stats
router.get("/stats", getWithdrawalStats);

// GET /api/admin/withdrawals/:id
router.get("/:id", getWithdrawalById);

// PATCH /api/admin/withdrawals/:id/status
router.patch("/:id/status", updateWithdrawalStatus);

export default router;
