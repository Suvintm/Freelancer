import { Navigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import logo from "../assets/logo.png"; // ✅ same logo as navbar

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loadingUser } = useAppContext();

  if (loadingUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        {/* Logo */}
        <img
          src={logo}
          alt="Loading..."
          className="w-24 h-24 mb-6 animate-pulse"
        />

        {/* Spinning ring */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-green-400 border-t-transparent rounded-full animate-spin"></div>
        </div>

        {/* Text */}
        <p className="mt-6 text-gray-600 text-lg font-medium animate-pulse">
          Loading your experience...
        </p>
      </div>
    );
  }

  if (!user || (allowedRoles && !allowedRoles.includes(user.role))) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
