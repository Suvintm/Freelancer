// ─── Permission Utilities ─────────────────────────────────────────────────
// Used with usePermission hook to guard pages and actions

export const PERMISSIONS = {
  superadmin: [
    "users", "orders", "gigs", "payments", "kyc", "analytics",
    "conversations", "activity", "storage", "advertisements",
    "subscriptions", "settings", "admin_management",
  ],
  admin: [
    "users", "orders", "gigs", "payments", "kyc", "analytics",
    "conversations", "activity", "storage", "advertisements",
    "subscriptions",
  ],
  moderator: [
    "users", "orders", "conversations", "activity", "kyc",
  ],
};

export const hasPermission = (adminRole, permission) => {
  if (!adminRole || !permission) return false;
  return PERMISSIONS[adminRole]?.includes(permission) ?? false;
};

export const isSuperAdmin = (adminRole) => adminRole === "superadmin";
