import express from "express";
import { authenticate } from "../../../middleware/authMiddleware.js";
import { getMyBasicInfo, updateMyBasicInfo, updateProfilePicture } from "../controllers/userController.js";
import { upload } from "../../../middleware/upload.js";

const router = express.Router();

router.get("/me", authenticate, getMyBasicInfo);
router.patch("/me", authenticate, updateMyBasicInfo);
router.post("/me/profile-picture", authenticate, upload.single("image"), updateProfilePicture);

export default router;
