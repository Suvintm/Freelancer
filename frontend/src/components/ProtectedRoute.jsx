import { Navigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import logo from "../assets/logo.png";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loadingUser } = useAppContext();

  if (loadingUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black space-y-6 px-4">
        {/* Logo with green border */}
        <div className="p-0 rounded-full border-4 border-white">
          <img
            src={logo}
            alt="Loading..."
            className="w-32 h-32 rounded-full object-cover animate-pulse"
          />
        </div>

        {/* Loading Text */}
        <p className="text-white text-xl font-semibold animate-pulse">
          Loading your experience...
        </p>

        {/* Optional spinner */}
        
      </div>
    );
  }

  if (!user || (allowedRoles && !allowedRoles.includes(user.role))) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
