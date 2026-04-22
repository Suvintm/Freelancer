import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { HiOutlineEnvelope, HiOutlineArrowLeft, HiOutlineCheckCircle, HiOutlineExclamationCircle } from "react-icons/hi2";
import { FaSpinner } from "react-icons/fa";
import axios from "axios";
import { useAppContext } from "../context/AppContext";

const ForgotPasswordPage = () => {
  const { backendURL } = useAppContext();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);

    try {
      await axios.post(`${backendURL}/api/auth/forgot-password`, { email });
      setSuccess(true);
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
              <h2 className="text-2xl font-bold text-white mb-3">Check Your Email</h2>
              <p className="text-gray-400 mb-6 leading-relaxed">
                If an account exists with <span className="text-emerald-400">{email}</span>, 
                you will receive a password reset link shortly.
              </p>
              <p className="text-gray-500 text-sm mb-8">
                Don't see the email? Check your spam folder or try again.
              </p>
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                <HiOutlineArrowLeft className="text-lg" />
                Back to Login
              </Link>
            </motion.div>
          ) : (
            // Form State
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-full flex items-center justify-center">
                  <HiOutlineEnvelope className="text-3xl text-emerald-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Forgot Password?</h2>
                <p className="text-gray-400">
                  No worries! Enter your email and we'll send you a reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <HiOutlineEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-12 pr-4 py-3.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    />
                  </div>
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
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </button>

                {/* Back to Login */}
                <div className="text-center pt-4">
                  <Link
                    to="/"
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

        {/* Footer */}
        <p className="text-center text-gray-600 text-sm mt-8">
          © {new Date().getFullYear()} SuviX. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;
