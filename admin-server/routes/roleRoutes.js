import express from "express";
import { protectAdmin, requirePermission, logActivity } from "../middleware/adminAuth.js";
import { 
  getRoles, 
  getRoleById, 
  createRole, 
  updateRole, 
  deleteRole 
} from "../controllers/roleController.js";

const router = express.Router();

// Role management should ideally be restricted to superadmins holding "settings" or specialized "roles" permission
router.use(protectAdmin);
router.use(requirePermission("settings")); 

router.route("/")
  .get(getRoles)
  .post(logActivity("ROLE_CREATED"), createRole);

router.route("/:id")
  .get(getRoleById)
  .patch(logActivity("ROLE_UPDATED"), updateRole)
  .delete(logActivity("ROLE_DELETED"), deleteRole);

export default router;
