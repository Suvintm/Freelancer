// ─── Centralized Admin API Layer ──────────────────────────────────────────
// Import from here — pages never call adminAxios directly.
// Keeps all endpoint strings in one place for easy maintenance.
import { adminAxios } from "../context/AdminContext";

// ── Auth ──────────────────────────────────────────────────────────────────
export const authApi = {
  login:          (data)    => adminAxios.post("/admin/auth/login", data),
  logout:         ()        => adminAxios.post("/admin/auth/logout"),
  verify:         ()        => adminAxios.get("/admin/auth/verify"),
  changePassword: (data)    => adminAxios.post("/admin/auth/change-password", data),
  getSessions:    ()        => adminAxios.get("/admin/auth/sessions"),
  revokeSession:  (id)      => adminAxios.delete(`/admin/auth/sessions/${id}`),
  updateNotifications: (prefs) => adminAxios.patch("/admin/auth/notifications", { prefs }),
  getRoles:       ()        => adminAxios.get("/admin/auth/roles"),
};

// ── Dashboard / Stats ──────────────────────────────────────────────────────
export const statsApi = {
  getOverview:    (params)  => adminAxios.get("/admin/stats", { params }),
  getAlerts:      ()        => adminAxios.get("/admin/stats/alerts"),
  getRevenueChart:(params)  => adminAxios.get("/admin/analytics/revenue-chart", { params }),
  getOrderChart:  (params)  => adminAxios.get("/admin/analytics/order-stats", { params }),
};

// ── Users ─────────────────────────────────────────────────────────────────
export const usersApi = {
  getAll:       (params)        => adminAxios.get("/admin/users", { params }),
  getById:      (id)            => adminAxios.get(`/admin/users/${id}`),
  toggleStatus: (id, data) => adminAxios.patch(`/admin/users/${id}/status`, data),
  bulkStatusUpdate: (data) => adminAxios.post(`/admin/users/bulk-status`, data),
  getDetails: (id) => adminAxios.get(`/admin/users/${id}`),
  getStats:     ()            => adminAxios.get("/admin/stats"),
  export:       (params)        => adminAxios.get("/admin/users/export", { params, responseType: "blob" }),
};

// ── Orders ────────────────────────────────────────────────────────────────
export const ordersApi = {
  getAll:       (params)        => adminAxios.get("/admin/orders", { params }),
  getById:       (id)            => adminAxios.get(`/admin/orders/${id}`),
  getStats:      ()              => adminAxios.get("/admin/stats"),
  updateStatus: (id, status)    => adminAxios.patch(`/admin/orders/${id}/status`, { status }),
  resolveDispute: (id, data)    => adminAxios.post(`/admin/orders/${id}/resolve-dispute`, data),
  addNote:      (id, note)      => adminAxios.post(`/admin/conversations/${id}/note`, { note }),
  export:       (params)        => adminAxios.get("/admin/orders/export", { params, responseType: "blob" }),
};

// ── Payments ──────────────────────────────────────────────────────────────
export const paymentsApi = {
  getAnalytics: (params) => adminAxios.get("/admin/analytics/razorpay", { params }),
  getAll: (params) => adminAxios.get("/payments/admin/all", { params }),
  getById: (id) => adminAxios.get(`/payments/${id}`),
  getSettings: () => adminAxios.get("/admin/payment-settings"),
  updateSettings: (data) => adminAxios.put("/admin/payment-settings", data),
  initiateRefund: (id, data) => adminAxios.post(`/admin/payment-settings/refund/${id}`, data),
};

// ── Withdrawals (Payouts) ────────────────────────────────────────────────
export const withdrawalsApi = {
  getAll: (params) => adminAxios.get("/admin/withdrawals", { params }),
  getStats: () => adminAxios.get("/admin/withdrawals/stats"),
  getById: (id) => adminAxios.get(`/admin/withdrawals/${id}`),
  updateStatus: (id, data) => adminAxios.patch(`/admin/withdrawals/${id}/status`, data),
};

// ── Gigs ──────────────────────────────────────────────────────────────────
export const gigsApi = {
  getAll: (params) => adminAxios.get("/admin/gigs", { params }),
  updateStatus: (id, isActive) => adminAxios.patch(`/admin/gigs/${id}/status`, { isActive }),
  bulkStatusUpdate: (data) => adminAxios.post("/admin/gigs/bulk-status", data),
  getAnalytics: (params) => adminAxios.get("/admin/analytics/categories", { params }),
  export: (params) => adminAxios.get("/admin/gigs/export", { params, responseType: "blob" }),
};

// ── KYC ───────────────────────────────────────────────────────────────────
export const kycApi = {
  // Editors (User Model)
  getEditorStats:     ()        => adminAxios.get("/admin/kyc/stats/summary"),
  getEditorRequests:  (params)  => adminAxios.get("/admin/kyc/pending", { params }),
  getEditorById:      (id)      => adminAxios.get(`/admin/kyc/${id}`),
  verifyEditor:       (id, data)=> adminAxios.post(`/admin/kyc/${id}/verify`, data),
  
  // Clients (ClientKYC Model)
  getClientStats:     ()        => adminAxios.get("/client-kyc/admin/stats"),
  getClientRequests:  (params)  => adminAxios.get("/client-kyc/admin/pending", { params }),
  getClientById:      (id)      => adminAxios.get(`/client-kyc/admin/${id}`),
  verifyClient:       (id, data)=> adminAxios.post(`/client-kyc/admin/verify/${id}`, data),
};

// ── Analytics ─────────────────────────────────────────────────────────────
export const analyticsApi = {
  getRevenue:     (params)      => adminAxios.get("/admin/analytics/revenue", { params }),
  getUsers:       (params)      => adminAxios.get("/admin/analytics/users", { params }),
  getOrders:      (params)      => adminAxios.get("/admin/analytics/orders", { params }),
  getCategories:  (params)      => adminAxios.get("/admin/analytics/categories", { params }),
  getOverview:     ()            => adminAxios.get("/admin/analytics/overview"),
  getCloudinary:  ()            => adminAxios.get("/admin/analytics/cloudinary"),
  getMongoDB:     ()            => adminAxios.get("/admin/analytics/mongodb"),
  getRazorpay:    (params)      => adminAxios.get("/admin/analytics/razorpay", { params }),
  getServiceHealth:()           => adminAxios.get("/admin/analytics/service-health"),
};

// ── Conversations ─────────────────────────────────────────────────────────
export const conversationsApi = {
  getAll:     (params)          => adminAxios.get("/admin/conversations", { params }),
  getById:    (orderId)         => adminAxios.get(`/admin/conversations/${orderId}`),
  addNote:    (orderId, note)   => adminAxios.post(`/admin/conversations/${orderId}/note`, { note }),
  flagMsg:    (orderId, msgId)  => adminAxios.post(`/admin/conversations/${orderId}/flag/${msgId}`),
};

// ── Activity ──────────────────────────────────────────────────────────────
export const activityApi = {
  getLogs: (params)             => adminAxios.get("/admin/activity-logs", { params }),
};

// ── Storage Manager ───────────────────────────────────────────────────────
export const storageApi = {
  getStats:     ()              => adminAxios.get("/admin/storage/stats"),
  getResources: (params)        => adminAxios.get("/admin/storage/resources", { params }),
  deleteFile:   (publicId)      => adminAxios.delete(`/admin/storage/resource/${encodeURIComponent(publicId)}`),
  bulkDelete:   (ids)           => adminAxios.post("/admin/storage/bulk-delete", { publicIds: ids }),
};

// ── Advertisements ────────────────────────────────────────────────────────
export const adsApi = {
  getAll:         (params)       => adminAxios.get("/admin/ads", { params }),
  getById:        (id)           => adminAxios.get(`/admin/ads/${id}`),
  create:         (data)         => adminAxios.post("/admin/ads", data),
  update:         (id, data)     => adminAxios.patch(`/admin/ads/${id}`, data),
  remove:         (id)           => adminAxios.delete(`/admin/ads/${id}`),
};

// ── Subscriptions ─────────────────────────────────────────────────────────
export const subscriptionsApi = {
  getPlans:     ()              => adminAxios.get("/admin/subscriptions"),
  createPlan:   (data)          => adminAxios.post("/admin/subscriptions", data),
  updatePlan:   (id, data)      => adminAxios.patch(`/admin/subscriptions/${id}`, data),
  deletePlan:   (id)            => adminAxios.delete(`/admin/subscriptions/${id}`),
};

// ── Settings ──────────────────────────────────────────────────────────────
export const settingsApi = {
  get:            ()            => adminAxios.get("/admin/settings"),
  update:         (data)        => adminAxios.put("/admin/settings", data),
  getMaintenanceMode: ()        => adminAxios.get("/admin/settings/maintenance"),
  setMaintenanceMode: (data)    => adminAxios.post("/admin/settings/maintenance", data),
};

// ── Admin Management (superadmin only) ────────────────────────────────────
export const adminMgmtApi = {
  getAll:   ()                  => adminAxios.get("/admin/admins"),
  create:   (data)              => adminAxios.post("/admin/admins", data),
  update:   (id, data)          => adminAxios.patch(`/admin/admins/${id}`, data),
  remove:   (id)                => adminAxios.delete(`/admin/admins/${id}`),
};

// ── Role Management (superadmin only) ─────────────────────────────────────
export const rolesApi = {
  getAll:   ()                  => adminAxios.get("/admin/roles"),
  getById:  (id)                => adminAxios.get(`/admin/roles/${id}`),
  create:   (data)              => adminAxios.post("/admin/roles", data),
  update:   (id, data)          => adminAxios.patch(`/admin/roles/${id}`, data),
  remove:   (id)                => adminAxios.delete(`/admin/roles/${id}`),
};

// ── Notifications ─────────────────────────────────────────────────────────
export const notificationsApi = {
  getAll:     (params)          => adminAxios.get("/admin/notifications", { params }),
  markRead:   (id)              => adminAxios.patch(`/admin/notifications/${id}/read`),
  markAllRead:()                => adminAxios.patch("/admin/notifications/read-all"),
};
