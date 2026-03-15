// ─── usePermission ────────────────────────────────────────────────────────
// Check if the currently logged in admin has a given permission
import { useAdmin } from "../context/AdminContext";
import { hasPermission } from "../utils/permissions";

export const usePermission = (permission) => {
  const { admin } = useAdmin();
  return hasPermission(admin?.role, permission);
};

export const useIsSuperAdmin = () => {
  const { admin } = useAdmin();
  return admin?.role === "superadmin";
};
