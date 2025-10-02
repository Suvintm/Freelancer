import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaPlus } from "react-icons/fa"; // install react-icons if not already

const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

const AuthForm = ({ onClose }) => {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      let res;
      if (isLogin) {
        res = await axios.post("http://localhost:5000/api/auth/login", {
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

        res = await axios.post(
          "http://localhost:5000/api/auth/register",
          data,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
      }

      const user = res.data.user;
      const token = res.data.token;
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", token);

      if (user.role === "editor") navigate("/editor-home");
      else navigate("/client-home");

      onClose();
    } catch (error) {
      console.error(error);
      setMessage(error.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    // 🔹 Overlay closes modal on click
    <div
      className="fixed inset-0 bg-black/20 flex justify-center items-center z-50 p-4"
      onClick={onClose}
    >
      {/* 🔹 Stop click bubbling inside modal */}
      <div
        className="bg-white rounded-xl w-full max-w-md p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-2xl font-bold text-gray-600 hover:text-gray-900"
        >
          &times;
        </button>

        <h2 className="text-2xl font-semibold text-center mb-4">
          {isLogin ? "Login" : "Register"}
        </h2>

        {/* Profile picture (Register only) */}
        {!isLogin && (
          <div className="flex justify-center mb-4">
            <label className="relative cursor-pointer">
              <img
                src={
                  formData.profilePicture
                    ? URL.createObjectURL(formData.profilePicture)
                    : DEFAULT_AVATAR
                }
                alt="Profile"
                className="w-24 h-24 rounded-full border-2 border-gray-300 object-cover"
              />
              <div className="absolute bottom-0 right-0 bg-green-400 w-7 h-7 rounded-full flex justify-center items-center text-white text-sm border-2 border-white">
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
                placeholder="Name"
                value={formData.name}
                onChange={handleChange}
                required
                className="p-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="p-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option className="bg-gray-300 rounded-2xl" value="editor">
                  Editor
                </option>
                <option className="bg-gray-300 rounded-2xl" value="client">
                  Client
                </option>
              </select>
            </>
          )}
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
            className="p-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            className="p-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-green-400 text-white py-3 rounded-2xl font-bold hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Please wait..." : isLogin ? "Login" : "Register"}
          </button>
        </form>

        {/* Toggle */}
        <p
          onClick={toggleForm}
          className="text-green-400 text-center mt-3 cursor-pointer hover:underline"
        >
          {isLogin
            ? "Don't have an account? Register here"
            : "Already have an account? Login"}
        </p>

        {/* Message */}
        {message && <p className="text-red-600 text-center mt-2">{message}</p>}
      </div>
    </div>
  );
};

export default AuthForm;
