import express from "express";
import * as instagramController from "./controllers/instagramController.js";
import { authenticate as authenticateUser } from "../../shared/middleware/auth.middleware.js";

const router = express.Router();

// ─── Authenticated Instagram Management Routes ──────────────────────────────
router.post("/sync-manual",           authenticateUser, instagramController.manualSyncInstagram);
router.get("/accounts",               authenticateUser, instagramController.getInstagramAccounts);
router.get("/posts/:userId",          authenticateUser, instagramController.getInstagramPosts);
router.delete("/account/:accountId",  authenticateUser, instagramController.deleteInstagramAccount);

export default router;
