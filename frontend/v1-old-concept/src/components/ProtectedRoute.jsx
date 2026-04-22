import { Navigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import logo from "../assets/darklogo.png";
import { motion } from "framer-motion";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loadingUser } = useAppContext();

  if (loadingUser) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black">
        {/* Centered Brand Logo - Minimal Pulse */}
        <motion.div
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ duration: 0.5 }}
           className="flex flex-col items-center"
        >
          <img 
            src={logo} 
            alt="SuviX" 
            className="w-32 h-auto object-contain mb-8"
          />
          <p className="text-zinc-500 text-xs font-medium uppercase tracking-[0.4em] animate-pulse">
            Loading
          </p>
        </motion.div>
      </div>
    );
  }


  if (!user) {
    console.log("🔒 ProtectedRoute: No user found. Redirecting to /");
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    console.log(`🔒 ProtectedRoute: Role mismatch. User: ${user.role}, Allowed: ${allowedRoles}. Redirecting to /`);
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
