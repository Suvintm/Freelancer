// server/modules/notification/routes/notificationRoutes.js
import express from "express";
import { 
    getMyNotifications, 
    markAsRead, 
    registerFcmToken 
} from "../controllers/notificationController.js";
import { authenticate } from "../../../middleware/authMiddleware.js";
import { publicApiLimiter, interactionLimiter, heavyLimiter } from "../../../middleware/rateLimiter.js";

const router = express.Router();

// All notification routes are protected
router.use(authenticate);

router.get("/", publicApiLimiter, getMyNotifications);
router.patch("/:id/read", interactionLimiter, markAsRead);
router.post("/tokens", heavyLimiter, registerFcmToken);

export default router;
