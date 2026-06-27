import express from "express";
import protect, { authorize } from "../../shared/middleware/auth.middleware.js";
import { 
  requestWithdrawal, 
  getMyWithdrawals, 
  getWithdrawalDetails 
} from "./controllers/withdrawalController.js";

const router = express.Router();

// All withdrawal routes are protected
router.use(protect);

router.post("/request", authorize("provider"), requestWithdrawal);
router.get("/my", authorize("provider"), getMyWithdrawals);
router.get("/:id", getWithdrawalDetails);

export default router;






