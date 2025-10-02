import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext"; // use context
import { FaPlus } from "react-icons/fa";

const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

const AuthForm = () => {
  const { setUser, showAuth, setShowAuth, backendURL } = useAppContext();
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

      localStorage.setItem("user", JSON.stringify(res.data.user));
      localStorage.setItem("token", res.data.token);
      setUser(res.data.user);

      if (res.data.user.role === "editor") navigate("/editor-home");
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
    <div className="fixed inset-0 bg-black/20 flex justify-center items-center z-50 p-4">
      {/* Modal content same as before */}
    </div>
  );
};

export default AuthForm;
