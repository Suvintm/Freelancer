import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaPlus, FaTimes, FaGoogle } from "react-icons/fa";
import { useAppContext } from "../context/AppContext";

const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

const AuthForm = () => {
  const { showAuth, setShowAuth, backendURL, setUser } = useAppContext();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "editor",
    profilePicture: null,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    if (e.target.name === "profilePicture") {
      setFormData({ ...formData, profilePicture: e.target.files[0] });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const toggleForm = () => {
    setIsLogin(!isLogin);
    setMessage("");
  };

  const handleGoogleLogin = () => {
    // Redirect to backend Google OAuth endpoint
    window.location.href = `${backendURL}/api/auth/google`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      let res;
      if (isLogin) {
        res = await axios.post(`${backendURL}/api/auth/login`, {
          email: formData.email,
          password: formData.password,
        });
      } else {
        const data = new FormData();
        data.append("name", formData.name);
        data.append("email", formData.email);
        data.append("password", formData.password);
        data.append("role", formData.role);
        if (formData.profilePicture)
          data.append("profilePicture", formData.profilePicture);

        res = await axios.post(`${backendURL}/api/auth/register`, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      const user = { ...res.data.user, token: res.data.token };

      localStorage.setItem("user", JSON.stringify(user));
      setUser(user);

      if (user.role === "editor") navigate("/editor-home");
      else navigate("/client-home");

      setShowAuth(false);
    } catch (error) {
      console.error(error);
      setMessage(error.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (!showAuth) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50 p-4"
      onClick={() => setShowAuth(false)}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md p-8 relative shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={() => setShowAuth(false)}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition"
        >
          <FaTimes />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {isLogin ? "Welcome Back!" : "Create Account"}
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {isLogin
              ? "Sign in to continue to SuviX"
              : "Join SuviX and start your journey"}
          </p>
        </div>

        {/* Google OAuth Button */}
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all mb-4 group"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span className="text-gray-700 font-medium">Continue with Google</span>
        </button>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-400">or continue with email</span>
          </div>
        </div>

        {/* Profile Picture (Register only) */}
        {!isLogin && (
          <div className="flex justify-center mb-4">
            <label className="relative cursor-pointer group">
              <img
                src={
                  formData.profilePicture
                    ? URL.createObjectURL(formData.profilePicture)
                    : DEFAULT_AVATAR
                }
                alt="Profile"
                className="w-20 h-20 rounded-full border-2 border-gray-200 object-cover group-hover:border-green-400 transition"
              />
              <div className="absolute bottom-0 right-0 bg-green-500 w-6 h-6 rounded-full flex justify-center items-center text-white text-xs border-2 border-white shadow">
                <FaPlus />
              </div>
              <input
                type="file"
                name="profilePicture"
                accept="image/*"
                onChange={handleChange}
                className="hidden"
              />
            </label>
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3"
          encType="multipart/form-data"
        >
          {!isLogin && (
            <>
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                required
                className="p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition"
              />
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition"
              >
                <option value="editor">I'm an Editor</option>
                <option value="client">I'm a Client</option>
              </select>
            </>
          )}
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            required
            className="p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            className="p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Please wait...
              </span>
            ) : isLogin ? (
              "Sign In"
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        {/* Toggle Form */}
        <p className="text-center mt-4 text-sm text-gray-500">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={toggleForm}
            className="text-green-500 font-medium hover:text-green-600 hover:underline"
          >
            {isLogin ? "Sign up" : "Sign in"}
          </button>
        </p>

        {/* Error Message */}
        {message && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-600 text-sm text-center">{message}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthForm;
