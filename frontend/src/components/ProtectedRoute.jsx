import { Navigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import logo from "../assets/logo.png";
import { motion } from "framer-motion";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loadingUser } = useAppContext();

  if (loadingUser) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black space-y-8 px-4">

      {/* Rotating Neon Ring */}
      <motion.div
        initial={{ rotate: 0, scale: 0.8, opacity: 0 }}
        animate={{ rotate: 360, scale: 1, opacity: 1 }}
        transition={{
          rotate: {
            duration: 2.5,
            ease: "linear",
            repeat: Infinity,
          },
          scale: {
            duration: 0.6,
            ease: "easeOut",
          },
          opacity: { duration: 0.6 }
        }}
        className="
          w-30 h-30 rounded-full border-[6px]
          border-t-[#1463FF] border-r-[#1463FF]/40 border-b-transparent border-l-transparent
          shadow-[0_0_40px_rgba(20,99,255,0.4)]
          flex items-center justify-center
        "
      >
        {/* Center Logo */}
        <motion.img
          src={logo}
          alt="Loading..."
          className="w-28 h-28 rounded-full object-cover"
          initial={{ scale: 0.8, opacity: 0.6 }}
          animate={{
            scale: [0.95, 1, 0.95],
            opacity: 1,
          }}
          transition={{
            duration: 1.6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </motion.div>

      {/* Loading Text */}
      <motion.p
        className="text-white text-xl md:text-2xl font-semibold"
        initial={{ opacity: 0, y: 10 }}
        animate={{
          opacity: [0, 1, 1, 0],
          y: [10, 0, 0, 10],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        Loading your experience...
      </motion.p>
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
