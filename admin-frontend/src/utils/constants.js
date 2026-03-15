// ─── Status, Role, and shared config constants ────────────────────────────
// Import from here in any component — never hardcode colors inline

export const STATUS_CONFIG = {
  new:         { label: "New",         color: "#3b82f6", bg: "rgba(59,130,246,0.12)"  },
  accepted:    { label: "Accepted",    color: "#10b981", bg: "rgba(16,185,129,0.12)"  },
  in_progress: { label: "In Progress", color: "#f59e0b", bg: "rgba(245,158,11,0.12)"  },
  submitted:   { label: "Submitted",   color: "#8b5cf6", bg: "rgba(139,92,246,0.12)"  },
  completed:   { label: "Completed",   color: "#10b981", bg: "rgba(16,185,129,0.15)"  },
  rejected:    { label: "Rejected",    color: "#ef4444", bg: "rgba(239,68,68,0.12)"   },
  cancelled:   { label: "Cancelled",   color: "#6b7280", bg: "rgba(107,114,128,0.12)" },
  disputed:    { label: "Disputed",    color: "#f97316", bg: "rgba(249,115,22,0.12)"  },
  revision:    { label: "Revision",    color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
};

export const KYC_STATUS_CONFIG = {
  submitted:     { label: "Pending Review", color: "#f59e0b", bg: "rgba(245,158,11,0.12)"  },
  verified:      { label: "Verified",       color: "#10b981", bg: "rgba(16,185,129,0.12)"  },
  rejected:      { label: "Rejected",       color: "#ef4444", bg: "rgba(239,68,68,0.12)"   },
  not_submitted: { label: "Not Submitted",  color: "#6b7280", bg: "rgba(107,114,128,0.10)" },
};

export const ROLE_CONFIG = {
  editor:     { label: "Editor",      color: "#8b5cf6", bg: "rgba(139,92,246,0.12)"  },
  client:     { label: "Client",      color: "#3b82f6", bg: "rgba(59,130,246,0.12)"  },
  superadmin: { label: "Super Admin", color: "#f59e0b", bg: "rgba(245,158,11,0.12)"  },
  admin:      { label: "Admin",       color: "#10b981", bg: "rgba(16,185,129,0.12)"  },
  moderator:  { label: "Moderator",   color: "#6366f1", bg: "rgba(99,102,241,0.12)"  },
};

export const NOTIFICATION_TYPE_CONFIG = {
  kyc_pending: { label: "KYC Pending",  color: "#f59e0b", icon: "shield" },
  dispute:     { label: "Dispute",      color: "#ef4444", icon: "alert"  },
  new_user:    { label: "New User",     color: "#3b82f6", icon: "user"   },
  payment:     { label: "Payment",      color: "#10b981", icon: "wallet" },
  system:      { label: "System Alert", color: "#6366f1", icon: "info"   },
};

export const PAGE_SIZES = [10, 25, 50, 100];

export const SIDEBAR_GROUPS = [
  {
    label: "Overview",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: "dashboard" },
    ],
  },
  {
    label: "Management",
    items: [
      { to: "/users",      label: "Users",            icon: "users",    badgeKey: "bannedUsers"    },
      { to: "/orders",     label: "Orders",           icon: "orders",   badgeKey: "disputedOrders" },
      { to: "/gigs",       label: "Gigs",             icon: "gigs"                                 },
      { to: "/kyc",        label: "KYC",              icon: "kyc",      badgeKey: "kycPending"     },
    ],
  },
  {
    label: "Finance",
    items: [
      { to: "/payments",      label: "Payments",          icon: "payments"      },
      { to: "/subscriptions", label: "Subscription Plans", icon: "subscriptions" },
      { to: "/storage",       label: "Storage Manager",   icon: "storage"       },
    ],
  },
  {
    label: "Content",
    items: [
      { to: "/advertisements", label: "Advertisements", icon: "ads"     },
      { to: "/banners",        label: "Banners",        icon: "banners" },
    ],
  },
  {
    label: "Analytics",
    items: [
      { to: "/analytics",         label: "Business Analytics", icon: "analytics" },
      { to: "/service-analytics", label: "Service Analytics",  icon: "server"    },
    ],
  },
  {
    label: "Moderation",
    items: [
      { to: "/conversations", label: "Conversations", icon: "chat"     },
      { to: "/activity",      label: "Activity Log",  icon: "activity" },
    ],
  },
  {
    label: "System",
    superAdminOnly: true,
    items: [
      { to: "/admin-management", label: "Admin Management", icon: "admins"   },
      { to: "/settings",         label: "Settings",         icon: "settings" },
    ],
  },
];

export const PERMISSIONS_LIST = [
  { key: "dashboard", label: "Dashboard", desc: "View platform overview and KPIs" },
  { key: "analytics", label: "Analytics", desc: "Detailed business metrics" },
  { key: "payments", label: "Payments", desc: "Manage transactions and settlements" },
  { key: "conversations", label: "Conversations", desc: "Monitor user messages" },
  { key: "users", label: "Users", desc: "Manage clients and editors" },
  { key: "kyc", label: "Editor KYC", desc: "Review editor verification" },
  { key: "client_kyc", label: "Client KYC", desc: "Review client verification" },
  { key: "orders", label: "Orders", desc: "Manage project lifecycle" },
  { key: "gigs", label: "Gigs", desc: "Moderate service listings" },
  { key: "advertisements", label: "Advertisements", desc: "Manage platform ads" },
  { key: "subscriptions", label: "Subscriptions", desc: "Manage plan tiers" },
  { key: "activity", label: "Activity Logs", desc: "Audit system actions" },
  { key: "storage", label: "Storage Manager", desc: "Manage cloud assets" },
  { key: "service_analytics", label: "Service", desc: "System health metrics" },
  { key: "settings", label: "Settings", desc: "Core configuration" },
];
