// ─── ProtectedRoute — Redirects to login if not authenticated ────────────
import { Navigate, useLocation } from "react-router-dom";
import { useAdmin } from "../../context/AdminContext";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, admin, loading, isSuperAdmin } = useAdmin();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        height: "100vh", background: "var(--bg-base)",
        flexDirection: "column", gap: 16,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          border: "3px solid var(--border-default)",
          borderTopColor: "var(--brand)",
          animation: "spin 0.8s linear infinite",
        }} />
        <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Verifying session…</p>
      </div>
    );
  }

  // 1. Not logged in -> Login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Logged in but doesn't have required role (Superadmin bypasses)
  if (allowedRoles && !allowedRoles.includes(admin?.role) && !isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
