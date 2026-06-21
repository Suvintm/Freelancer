import express from "express";
import { authenticate } from "../../../middleware/authMiddleware.js";
import { getConversations, getMessageHistory, sendMessage, getContacts } from "../controllers/messageController.js";
import { publicApiLimiter } from "../../../middleware/rateLimiter.js";

const router = express.Router();

router.get("/conversations", authenticate, publicApiLimiter, getConversations);
router.get("/history/:otherUserId", authenticate, publicApiLimiter, getMessageHistory);
router.post("/send", authenticate, publicApiLimiter, sendMessage);
router.get("/contacts", authenticate, publicApiLimiter, getContacts);

export default router;
