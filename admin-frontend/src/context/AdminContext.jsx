// AdminContext.jsx - Admin authentication state management
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";

const AdminContext = createContext(null);

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin must be used within AdminProvider");
  }
  return context;
};

export const AdminProvider = ({ children }) => {
  const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";
  
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem("adminTheme") || "dark");

  // Theme toggle
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("adminTheme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === "dark" ? "light" : "dark");

  // Check for existing session on mount
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (token) {
      verifyToken(token);
    } else {
      setLoading(false);
    }
  }, []);

  // Verify admin token
  const verifyToken = async (token) => {
    try {
      const res = await axios.get(`${backendURL}/admin/auth/verify`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setAdmin({ ...res.data.admin, token });
      } else {
        localStorage.removeItem("adminToken");
      }
    } catch (err) {
      console.error("Admin verify error:", err);
      localStorage.removeItem("adminToken");
    } finally {
      setLoading(false);
    }
  };

  // Admin login
  const login = async (email, password) => {
    try {
      setError(null);
      const res = await axios.post(`${backendURL}/admin/auth/login`, {
        email,
        password,
      });

      if (res.data.success) {
        localStorage.setItem("adminToken", res.data.token);
        setAdmin({ ...res.data.admin, token: res.data.token });
        return { success: true };
      } else {
        setError(res.data.message);
        return { success: false, message: res.data.message };
      }
    } catch (err) {
      const message = err.response?.data?.message || "Login failed";
      setError(message);
      return { 
        success: false, 
        message,
        lockedUntil: err.response?.data?.lockedUntil,
      };
    }
  };

  // Admin logout
  const logout = async () => {
    try {
      if (admin?.token) {
        await axios.post(`${backendURL}/admin/auth/logout`, {}, {
          headers: { Authorization: `Bearer ${admin.token}` },
        });
      }
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      localStorage.removeItem("adminToken");
      setAdmin(null);
    }
  };

  // Change password
  const changePassword = async (currentPassword, newPassword) => {
    try {
      const res = await axios.post(
        `${backendURL}/admin/auth/change-password`,
        { currentPassword, newPassword },
        { headers: { Authorization: `Bearer ${admin?.token}` } }
      );
      return res.data;
    } catch (err) {
      return { success: false, message: err.response?.data?.message || "Failed to change password" };
    }
  };

  // Create axios instance with admin token
  const createAdminAxios = useCallback(() => {
    const instance = axios.create({
      baseURL: backendURL,
    });

    instance.interceptors.request.use((config) => {
      const token = localStorage.getItem("adminToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    instance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem("adminToken");
          setAdmin(null);
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }
    );

    return instance;
  }, [backendURL]);

  const adminAxios = createAdminAxios();

  const value = {
    admin,
    loading,
    error,
    login,
    logout,
    changePassword,
    adminAxios,
    isAuthenticated: !!admin,
    isSuperAdmin: admin?.role === "superadmin",
    theme,
    toggleTheme,
    backendURL,
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};

export default AdminContext;
