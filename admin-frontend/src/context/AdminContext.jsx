// ─── AdminContext.jsx — Fixed & Production-Grade ──────────────────────────
// BUGS FIXED:
//  1. adminAxios was recreated on every render (new instance = stale interceptors)
//     → Now a module-level singleton, always reads fresh token from localStorage
//  2. Notifications state added for real-time bell
//  3. Exports queryClient so pages can invalidate queries
// ─────────────────────────────────────────────────────────────────────────────
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";
import { QueryClient } from "@tanstack/react-query";

// ── Module-level singleton (NOT inside component) ─────────────────────────
const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";

export const adminAxios = axios.create({ baseURL: BACKEND });
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 2 * 60 * 1000, // 2 min default
    },
  },
});

// Request interceptor: always reads fresh token from localStorage
adminAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor: handle 401 globally
adminAxios.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("adminToken");
      // Soft redirect — avoids hard browser reload
      window.dispatchEvent(new CustomEvent("admin:unauthorized"));
    }
    return Promise.reject(error);
  }
);

// ── Context ───────────────────────────────────────────────────────────────
const AdminContext = createContext(null);

export const useAdmin = () => {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used within AdminProvider");
  return ctx;
};


export const AdminProvider = ({ children }) => {
  const [admin, setAdmin]               = useState(null);
  const [loading, setLoading]           = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]   = useState(0);
  const [alerts, setAlerts]             = useState({ kycPending: 0, disputedOrders: 0 });

  const verifyToken = useCallback(async () => {
    try {
      const res = await adminAxios.get("/admin/auth/verify");
      if (res.data.success) {
        setAdmin(res.data.admin);
      } else {
        localStorage.removeItem("adminToken");
      }
    } catch {
      localStorage.removeItem("adminToken");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Auth: verify token on mount ────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (token) {
      verifyToken();
    } else {
      setLoading(false);
    }

    const onUnauthorized = () => {
      setAdmin(null);
      setLoading(false);
    };
    window.addEventListener("admin:unauthorized", onUnauthorized);
    return () => window.removeEventListener("admin:unauthorized", onUnauthorized);
  }, [verifyToken]);

  // ── Auth actions ───────────────────────────────────────────────────────
  const login = useCallback(async (email, password, role) => {
    try {
      const res = await adminAxios.post("/admin/auth/login", { email, password, role });
      const { token, admin: adminData } = res.data;
      if (res.data.success) {
        localStorage.setItem("adminToken", token);
        setAdmin(adminData);
        return { success: true };
      }
      return { success: false, message: res.data.message };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Login failed",
        lockedUntil: err.response?.data?.lockedUntil,
        remainingAttempts: err.response?.data?.remainingAttempts,
      };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await adminAxios.post("/admin/auth/logout");
    } catch {
      // Silently ignore logout errors
    } finally {
      localStorage.removeItem("adminToken");
      setAdmin(null);
      queryClient.clear();
    }
  }, []);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    try {
      const res = await adminAxios.post("/admin/auth/change-password", {
        currentPassword, newPassword,
      });
      return res.data;
    } catch (err) {
      return { success: false, message: err.response?.data?.message || "Failed" };
    }
  }, []);

  // ── Notifications ──────────────────────────────────────────────────────
  // ── Notifications ──────────────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await adminAxios.get("/admin/notifications?limit=20");
      if (res.data.success) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch {
      // non-critical — silently skip
    }
  }, []);

  const markNotificationsRead = useCallback(async () => {
    try {
      await adminAxios.patch("/admin/notifications/read-all");
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch {/**/}
  }, []);

  // ── Alerts (dashboard banners) ─────────────────────────────────────────
  const fetchAlerts = useCallback(async () => {
    try {
      const res = await adminAxios.get("/admin/stats/alerts");
      if (res.data.success) {
        // We use the 'counts' object for sidebar badges
        setAlerts(res.data.counts || {});
      }
    } catch {/**/}
  }, []);

  useEffect(() => {
    if (admin) {
      fetchNotifications();
      fetchAlerts();
    }
  }, [admin]);

  const value = {
    admin,
    loading,
    isAuthenticated: !!admin,
    isSuperAdmin: admin?.role === "superadmin",
    login,
    logout,
    changePassword,
    adminAxios,      // direct access if needed
    queryClient,
    backendURL: BACKEND,
    notifications,
    unreadCount,
    alerts,
    fetchNotifications,
    markNotificationsRead,
    fetchAlerts,
    setAdmin,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};

export default AdminContext;
