import express from "express";
import { authenticate } from "../../../middleware/authMiddleware.js";
import { 
  getMyBasicInfo, 
  updateMyBasicInfo, 
  updateProfilePicture,
  updateMinimalProfile
} from "../controllers/userController.js";
import { upload } from "../../../middleware/upload.js";

const router = express.Router();

router.get("/me", authenticate, getMyBasicInfo);
router.patch("/me", authenticate, updateMyBasicInfo);
router.post("/me/profile-picture", authenticate, upload.single("image"), updateProfilePicture);
router.put("/profile/minimal", authenticate, updateMinimalProfile);

export default router;

export default router;
