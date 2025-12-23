import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  HiOutlineLockClosed, 
  HiOutlineEye, 
  HiOutlineEyeSlash, 
  HiOutlineCheckCircle, 
  HiOutlineExclamationCircle,
  HiOutlineExclamationTriangle,
  HiOutlineArrowLeft
} from "react-icons/hi2";
import { FaSpinner, FaCheck, FaTimes } from "react-icons/fa";
import axios from "axios";
import { useAppContext } from "../context/AppContext";

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { backendURL } = useAppContext();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Password strength indicators
  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const passwordStrength = Object.values(passwordChecks).filter(Boolean).length;

  const getStrengthColor = () => {
    if (passwordStrength <= 2) return "bg-red-500";
    if (passwordStrength <= 3) return "bg-yellow-500";
    if (passwordStrength <= 4) return "bg-blue-500";
    return "bg-emerald-500";
  };

  const getStrengthText = () => {
    if (passwordStrength <= 2) return "Weak";
    if (passwordStrength <= 3) return "Fair";
    if (passwordStrength <= 4) return "Good";
    return "Strong";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validations
    if (!password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (!passwordChecks.length) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await axios.post(`${backendURL}/api/auth/reset-password/${token}`, {
        password,
        confirmPassword,
      });
      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/auth");
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center px-4 py-12">
      {/* Background gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
              <span className="text-xl">🎬</span>
            </div>
            <span className="text-2xl font-bold text-white">SuviX</span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-8 shadow-2xl">
          {success ? (
            // Success State
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="w-20 h-20 mx-auto mb-6 bg-emerald-500/10 rounded-full flex items-center justify-center">
                <HiOutlineCheckCircle className="text-4xl text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Password Reset Successful!</h2>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Your password has been changed successfully. You will be redirected to the login page shortly.
              </p>
              <div className="flex items-center justify-center gap-2 text-emerald-400">
                <FaSpinner className="animate-spin" />
                <span>Redirecting to login...</span>
              </div>
            </motion.div>
          ) : (
            // Form State
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-full flex items-center justify-center">
                  <HiOutlineLockClosed className="text-3xl text-emerald-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Reset Password</h2>
                <p className="text-gray-400">
                  Create a new secure password for your account.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-12 pr-12 py-3.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-400"
                    >
                      {showPassword ? <HiOutlineEyeSlash className="text-lg" /> : <HiOutlineEye className="text-lg" />}
                    </button>
                  </div>

                  {/* Password Strength */}
                  {password && (
                    <div className="mt-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                          <div
                            className={`h-full ${getStrengthColor()} transition-all`}
                            style={{ width: `${(passwordStrength / 5) * 100}%` }}
                          />
                        </div>
                        <span className={`text-xs font-medium ${
                          passwordStrength <= 2 ? "text-red-400" : 
                          passwordStrength <= 3 ? "text-yellow-400" : 
                          passwordStrength <= 4 ? "text-blue-400" : "text-emerald-400"
                        }`}>
                          {getStrengthText()}
                        </span>
                      </div>
                      
                      {/* Password Requirements */}
                      <div className="grid grid-cols-2 gap-1.5 text-xs">
                        <div className={`flex items-center gap-1.5 ${passwordChecks.length ? "text-emerald-400" : "text-gray-500"}`}>
                          {passwordChecks.length ? <FaCheck className="text-[10px]" /> : <FaTimes className="text-[10px]" />}
                          8+ characters
                        </div>
                        <div className={`flex items-center gap-1.5 ${passwordChecks.uppercase ? "text-emerald-400" : "text-gray-500"}`}>
                          {passwordChecks.uppercase ? <FaCheck className="text-[10px]" /> : <FaTimes className="text-[10px]" />}
                          Uppercase
                        </div>
                        <div className={`flex items-center gap-1.5 ${passwordChecks.lowercase ? "text-emerald-400" : "text-gray-500"}`}>
                          {passwordChecks.lowercase ? <FaCheck className="text-[10px]" /> : <FaTimes className="text-[10px]" />}
                          Lowercase
                        </div>
                        <div className={`flex items-center gap-1.5 ${passwordChecks.number ? "text-emerald-400" : "text-gray-500"}`}>
                          {passwordChecks.number ? <FaCheck className="text-[10px]" /> : <FaTimes className="text-[10px]" />}
                          Number
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-12 pr-12 py-3.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-400"
                    >
                      {showConfirmPassword ? <HiOutlineEyeSlash className="text-lg" /> : <HiOutlineEye className="text-lg" />}
                    </button>
                  </div>
                  
                  {/* Match indicator */}
                  {confirmPassword && (
                    <div className={`flex items-center gap-1.5 mt-2 text-xs ${
                      password === confirmPassword ? "text-emerald-400" : "text-red-400"
                    }`}>
                      {password === confirmPassword ? (
                        <>
                          <FaCheck className="text-[10px]" />
                          Passwords match
                        </>
                      ) : (
                        <>
                          <FaTimes className="text-[10px]" />
                          Passwords don't match
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
                  >
                    <HiOutlineExclamationCircle className="text-red-400 flex-shrink-0" />
                    <p className="text-red-400 text-sm">{error}</p>
                  </motion.div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || !passwordChecks.length || password !== confirmPassword}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </button>

                {/* Back to Login */}
                <div className="text-center pt-4">
                  <Link
                    to="/auth"
                    className="inline-flex items-center gap-2 text-gray-400 hover:text-emerald-400 transition-colors text-sm"
                  >
                    <HiOutlineArrowLeft />
                    Back to Login
                  </Link>
                </div>
              </form>
            </>
          )}
        </div>

        {/* Security Notice */}
        <div className="flex items-center justify-center gap-2 text-gray-600 text-xs mt-6">
          <HiOutlineLockClosed />
          <span>Your password is encrypted and secure</span>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-600 text-sm mt-4">
          © {new Date().getFullYear()} SuviX. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;
