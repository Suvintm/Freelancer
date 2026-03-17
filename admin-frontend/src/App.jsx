// ─── App.jsx — Full route map + QueryClientProvider + Toaster ────────────
import { Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { queryClient } from "./context/AdminContext";
import { SocketProvider } from "./context/SocketContext";
import { ThemeProvider } from "./context/ThemeContext";

// Components
import AdminLayout    from "./components/layout/AdminLayout";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import ErrorBoundary  from "./components/ui/ErrorBoundary";

// Pages
import Login              from "./pages/Login";
import Dashboard          from "./pages/Dashboard";
import Users              from "./pages/Users";
import Orders             from "./pages/Orders";
import Gigs               from "./pages/Gigs";
import Activity           from "./pages/Activity";
import Settings           from "./pages/Settings";
import Analytics          from "./pages/Analytics";
import Conversations      from "./pages/Conversations";
import Payments           from "./pages/Payments";
import KYCManagement      from "./pages/KYCManagement";
import ClientKYCRequests  from "./pages/ClientKYCRequests";
import StorageManager     from "./pages/StorageManager";
import Advertisements     from "./pages/Advertisements";
import Banners            from "./pages/Banners";
import SubscriptionPlans  from "./pages/SubscriptionPlans";
import KYCRequestDetail   from "./pages/KYCRequestDetail";
import ServiceAnalytics   from "./pages/ServiceAnalytics";
import AdminManagement    from "./pages/AdminManagement";
import Withdrawals        from "./pages/Withdrawals";
import CloudinaryManager from "./pages/CloudinaryManager";
import NotFound           from "./pages/NotFound";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SocketProvider>
          {/* react-hot-toast replaces react-toastify */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                background: "var(--bg-elevated)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-default)",
                borderRadius: 10,
                fontSize: 13,
                fontFamily: "Inter, sans-serif",
              },
              success: { iconTheme: { primary: "#10b981", secondary: "#fff" } },
              error:   { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
            }}
          />

          <ErrorBoundary>
            <Routes>
              {/* Public */}
              <Route path="/login" element={<Login />} />

              {/* Protected — nested under AdminLayout */}
              <Route
                element={
                  <ProtectedRoute>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard"         element={<Dashboard />} />
                
                {/* Analytics & Finance — Restricted to Superadmin or specialized roles if needed */}
                <Route path="/analytics"         element={<Analytics />} />
                <Route path="/service-analytics" element={<ProtectedRoute allowedRoles={["superadmin"]}><ServiceAnalytics /></ProtectedRoute>} />
                <Route path="/payments"          element={<Payments />} />
                <Route path="/withdrawals"       element={<Withdrawals />} />
                
                <Route path="/conversations"     element={<Conversations />} />
                <Route path="/users"             element={<Users />} />
                <Route path="/kyc"               element={<KYCManagement />} />
                <Route path="/client-kyc"        element={<ClientKYCRequests />} />
                <Route path="/kyc/detail/:type/:id" element={<KYCRequestDetail />} />
                <Route path="/orders"            element={<Orders />} />
                <Route path="/gigs"              element={<Gigs />} />
                <Route path="/advertisements"    element={<Advertisements />} />
                <Route path="/banners"           element={<Banners />} />
                <Route path="/subscriptions"     element={<SubscriptionPlans />} />
                <Route path="/activity"          element={<Activity />} />
                <Route path="/storage"           element={<ProtectedRoute allowedRoles={["superadmin"]}><StorageManager /></ProtectedRoute>} />
                <Route path="/settings"          element={<ProtectedRoute allowedRoles={["superadmin"]}><Settings /></ProtectedRoute>} />
                <Route path="/admin-management"  element={<ProtectedRoute allowedRoles={["superadmin"]}><AdminManagement /></ProtectedRoute>} />
                <Route path="/cloudinary"        element={<CloudinaryManager />} />
              </Route>

              {/* Redirects */}
              <Route path="/"  element={<Navigate to="/dashboard" replace />} />
              <Route path="*"  element={<NotFound />} />
            </Routes>
          </ErrorBoundary>
        </SocketProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
