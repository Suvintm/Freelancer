// App.jsx - Main application with routes
import { Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Orders from "./pages/Orders";
import Gigs from "./pages/Gigs";
import Activity from "./pages/Activity";
import Settings from "./pages/Settings";
import Analytics from "./pages/Analytics";
import Conversations from "./pages/Conversations";
import Payments from "./pages/Payments";
import KYCManagement from "./pages/KYCManagement";
import StorageManager from "./pages/StorageManager";
import Banners from "./pages/Banners";

// Components
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./components/AdminLayout";

function App() {
  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
      
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<Login />} />

        {/* Protected Routes with Layout */}
        <Route
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/conversations" element={<Conversations />} />
          <Route path="/users" element={<Users />} />
          <Route path="/kyc" element={<KYCManagement />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/gigs" element={<Gigs />} />
          <Route path="/banners" element={<Banners />} />
          <Route path="/activity" element={<Activity />} />
          <Route path="/storage" element={<StorageManager />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* Redirect root to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* 404 */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}

export default App;
