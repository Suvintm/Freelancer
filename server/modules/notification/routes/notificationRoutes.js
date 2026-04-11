// server/modules/notification/routes/notificationRoutes.js
import express from "express";
import { 
    getMyNotifications, 
    markAsRead, 
    registerFcmToken 
} from "../controllers/notificationController.js";
import { authenticate } from "../../../middleware/authMiddleware.js";

const router = express.Router();

// All notification routes are protected
router.use(authenticate);

router.get("/", getMyNotifications);
router.patch("/:id/read", markAsRead);
router.post("/tokens", registerFcmToken);

export default router;
