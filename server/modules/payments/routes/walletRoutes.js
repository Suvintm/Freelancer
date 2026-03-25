import express from "express";
import protect, { authorize } from "../../../middleware/authMiddleware.js";
import { 
  getWalletBalance, 
  getWalletTransactions, 
  getPendingClearance 
} from "../controllers/walletController.js";

const router = express.Router();

// All wallet routes are protected and for editors (or admins)
router.use(protect);

router.get("/balance", getWalletBalance);
router.get("/transactions", getWalletTransactions);
router.get("/pending", getPendingClearance);

export default router;
