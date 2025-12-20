import express from "express";
import protect  from "../middleware/authMiddleware.js";
import { toggleSavedEditor, getSavedEditors, updateAvailability } from "../controllers/userController.js";
import { acceptContentPolicy, logContentAccess } from "../controllers/legalController.js";

const router = express.Router();

router.use(protect); // All routes are protected

// Save/Unsave editor
router.route("/saved-editors/:editorId").post(toggleSavedEditor);

// Get all saved editors
router.route("/saved-editors").get(getSavedEditors);

// Update availability
router.route("/availability").put(updateAvailability);

// Legal & Compliance
router.route("/legal/accept-policy").post(acceptContentPolicy);
router.route("/legal/log-access").post(logContentAccess);

export default router;
        