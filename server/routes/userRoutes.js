import express from "express";
import protect  from "../middleware/authMiddleware.js";
import { toggleSavedEditor, getSavedEditors } from "../controllers/userController.js";

const router = express.Router();

router.use(protect); // All routes are protected

// Save/Unsave editor
router.route("/saved-editors/:editorId").post(toggleSavedEditor);

// Get all saved editors
router.route("/saved-editors").get(getSavedEditors);

export default router;
        