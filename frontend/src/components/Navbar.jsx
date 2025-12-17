import { useAppContext } from "../context/AppContext";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "../assets/logo.png";
import { FaArrowRight } from "react-icons/fa";

const Navbar = () => {
  const { user, setUser, setShowAuth } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();

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

  // Handle smooth scroll to sections
  const handleNavClick = (e, path) => {
    if (path.startsWith("#")) {
      e.preventDefault();
      
      // If not on homepage, navigate first then scroll
      if (location.pathname !== "/") {
        navigate("/");
        // Wait for navigation then scroll
        setTimeout(() => {
          const element = document.querySelector(path);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }, 100);
      } else {
        const element = document.querySelector(path);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    } else {
      navigate(path);
    }
  };

  const navLinks = [
    { label: "Home", path: "/" },
    { label: "Features", path: "#features" },
    { label: "How It Works", path: "#how-it-works" },
    { label: "Pricing", path: "#pricing" },
    { label: "Testimonials", path: "#testimonials" },
  ];

  return (
    <nav className="w-full bg-white/95 backdrop-blur-sm shadow-sm px-4 md:px-12 py-4 flex justify-between items-center sticky top-0 z-50">
      {/* Logo */}
      <div 
        className="flex gap-2 items-center cursor-pointer group"
        onClick={() => navigate("/")}
      >
        <img src={logo} className="w-10 h-10 group-hover:scale-105 transition-transform" alt="SuviX" />
        <h1 className="text-2xl font-bold text-slate-900">
          Suvi<span className="text-emerald-500">X</span>
        </h1>
      </div>

      {/* Navigation Links - Desktop */}
      <div className="hidden md:flex items-center gap-8">
        {navLinks.map((link) => (
          <a
            key={link.label}
            href={link.path}
            onClick={(e) => handleNavClick(e, link.path)}
            className={`text-sm font-medium transition-colors cursor-pointer ${
              location.pathname === link.path
                ? "text-emerald-600"
                : "text-slate-600 hover:text-emerald-600"
            }`}
          >
            {link.label}
          </a>
        ))}
      </div>

      {/* CTA Buttons */}
      <div className="flex gap-3 items-center">
        {user ? (
          <>
            <button
              onClick={handleWorkspace}
              className="hidden sm:inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-full font-medium transition-all hover:scale-105 shadow-sm"
            >
              Workspace <FaArrowRight className="text-xs" />
            </button>
            <button
              onClick={handleLogout}
              className="text-slate-600 hover:text-slate-900 px-4 py-2.5 rounded-full font-medium transition-colors border border-slate-200 hover:border-slate-300"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setShowAuth(true)}
              className="hidden sm:block text-slate-600 hover:text-slate-900 px-4 py-2.5 font-medium transition-colors"
            >
              Login
            </button>
            <button
              onClick={() => setShowAuth(true)}
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-full font-medium transition-all hover:scale-105 shadow-sm"
            >
              Register Now <FaArrowRight className="text-xs" />
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
