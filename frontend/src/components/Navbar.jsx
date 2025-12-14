import { useAppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";

const Navbar = () => {
  const { user, setUser, setShowAuth } = useAppContext();
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
    <nav className="w-full bg-black shadow-md px-4 md:px-12 py-4 flex justify-between items-center">
      <div className="flex gap-2 items-center justify-center">
        <img src={logo} className="w-10 h-10" alt="" />
        <h1
          className="text-2xl font-bold cursor-pointer"
          onClick={() => navigate("/")}
        >
          SuviX
        </h1>
      </div>

      <div className="flex gap-4 items-center">
        {user ? (
          <>
            <button
              onClick={handleWorkspace}
              className="bg-green-500 hidden sm:flex rounded-2xl text-white px-4 py-2 hover:bg-green-600 transition"
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
            className="bg-green-500 rounded-2xl text-white px-4 py-2 hover:bg-green-600 transition"
          >
            Get Started
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
