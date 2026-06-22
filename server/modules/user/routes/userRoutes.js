import express from "express";
import { authenticate } from "../../../middleware/authMiddleware.js";
import { 
   getMyBasicInfo, 
   updateMyBasicInfo, 
   updateProfilePicture,
   updateMinimalProfile,
   updateCoverBanner,
   followUser,
   unfollowUser
} from "../controllers/userController.js";
import { upload } from "../../../middleware/upload.js";
import { publicApiLimiter, heavyLimiter } from "../../../middleware/rateLimiter.js";

const router = express.Router();

router.get("/me", authenticate, publicApiLimiter, getMyBasicInfo);
router.patch("/me", authenticate, heavyLimiter, updateMyBasicInfo);
router.post("/me/profile-picture", authenticate, heavyLimiter, upload.single("image"), updateProfilePicture);
router.put("/me/cover-banner", authenticate, heavyLimiter, updateCoverBanner);
router.put("/profile/minimal", authenticate, heavyLimiter, updateMinimalProfile);
router.post("/follow", authenticate, heavyLimiter, followUser);
router.post("/unfollow", authenticate, heavyLimiter, unfollowUser);

export default router;

