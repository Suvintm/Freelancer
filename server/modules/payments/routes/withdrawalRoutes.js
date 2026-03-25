import express from "express";
import protect, { authorize } from "../../../middleware/authMiddleware.js";
import { 
  requestWithdrawal, 
  getMyWithdrawals, 
  getWithdrawalDetails 
} from "../controllers/withdrawalController.js";

const router = express.Router();

// All withdrawal routes are protected
router.use(protect);

router.post("/request", authorize("editor"), requestWithdrawal);
router.get("/my", authorize("editor"), getMyWithdrawals);
router.get("/:id", getWithdrawalDetails);

export default router;
