import express from "express";
import { authenticate } from "../../../middleware/authMiddleware.js";
import { getMyBasicInfo, updateMyBasicInfo } from "../controllers/userController.js";

const router = express.Router();

router.get("/me", authenticate, getMyBasicInfo);
router.patch("/me", authenticate, updateMyBasicInfo);

export default router;
