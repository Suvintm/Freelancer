import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthForm from "./AuthForm";

const Navbar = ({ user, setUser }) => {
  const [showAuth, setShowAuth] = useState(false); // <- define it here
  const navigate = useNavigate();

  const handleWorkspace = () => {
    if (user.role === "editor") navigate("/editor-home");
    else navigate("/client-home");
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    navigate("/");
  };

  return (
    <>
      <nav className="w-full bg-white shadow-md px-4 md:px-12 py-4 flex justify-between items-center">
        <h1
          className="text-2xl font-bold cursor-pointer sm:text-5xl"
          onClick={() => navigate("/")}
        >
          SuviX
        </h1>
        <div className="flex gap-4 items-center">
          {user ? (
            <>
              <button
                onClick={handleWorkspace}
                className="bg-green-500 rounded-2xl sm:flex hidden text-white px-4 py-2 hover:bg-green-600 transition"
              >
                Go to Workspace
              </button>
              <button
                onClick={handleLogout}
                className="bg-black text-white px-4 py-2 rounded-2xl hover:bg-red-700 transition"
              >
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowAuth(true)}
              className="bg-green-500 rounded-2xl text-white px-4 py-2 sm:text-[16px] text-[12px] hover:bg-green-600 transition"
            >
              Get Started
            </button>
          )}
        </div>
      </nav>

      {/* Auth modal */}
      {!user && showAuth && <AuthForm onClose={() => setShowAuth(false)} />}
    </>
  );
};

export default Navbar;
