import express from "express";
import protect  from "../../../middleware/authMiddleware.js";
import { toggleSavedEditor, getSavedEditors, updateAvailability, toggleFollow, getFollowStatus, getUserSuggestions, handleFollowRequest, searchUsers, getFollowers, getFollowing } from "../controllers/userController.js";
import { acceptContentPolicy, logContentAccess } from "../controllers/legalController.js";

const router = express.Router();

router.use(protect); // All routes are protected

// Save/Unsave editor
router.route("/saved-editors/:editorId").post(toggleSavedEditor);

// Get all saved editors
router.route("/saved-editors").get(getSavedEditors);

// Update availability
router.route("/availability").put(updateAvailability);

// FCM Token registration
import { updateFcmToken } from "../controllers/userController.js";
router.route("/fcm-token").post(updateFcmToken);

// Social / Follow system
router.route("/follow/:editorId").post(toggleFollow);
router.route("/follow/status/:editorId").get(getFollowStatus);
router.route("/suggestions").get(getUserSuggestions);
router.route("/search").get(searchUsers);
router.route("/follow-request/:requestId/:status").post(handleFollowRequest);
router.route("/followers/:userId").get(getFollowers);
router.route("/following/:userId").get(getFollowing);

// Legal & Compliance
router.route("/legal/accept-policy").post(acceptContentPolicy);
router.route("/legal/log-access").post(logContentAccess);

export default router;
        

