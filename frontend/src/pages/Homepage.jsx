import Navbar from "../components/Navbar";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthForm from "../components/AuthForm";
import { useAppContext } from "../context/AppContext";

import banner1 from "../assets/banner1.jpg";
import banner2 from "../assets/banner2.jpg";
import banner3 from "../assets/banner3.jpg";
import banner4 from "../assets/banner4.jpg";
import banner5 from "../assets/banner5.jpg";
import banner6 from "../assets/banner6.jpg";
import {
  FaArrowCircleRight,
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaLinkedin,
  FaUserTie,
  FaBriefcase,
  FaCheckCircle,
} from "react-icons/fa";


const images = [banner1, banner2, banner3, banner4, banner5, banner6];

const Homepage = () => {
  const { user, showAuth, setShowAuth } = useAppContext();
  const [selectedRole, setSelectedRole] = useState("editor");
  const [currentBg, setCurrentBg] = useState(0);
  const navigate = useNavigate();

  // Preload banner images
  useEffect(() => {
    images.forEach((img) => {
      const preImg = new Image();
      preImg.src = img;
    });
  }, []);

  // Background slider
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBg((prev) => (prev + 1) % images.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleGoWorkspace = () => {
    if (user.role === "editor") navigate("/editor-home");
    else navigate("/client-home");
  };

  return (
    <div className="relative flex flex-col min-h-screen">
      <Navbar />

      {/* Header Section */}
      <div className="relative min-h-[60vh] flex flex-col justify-center items-center overflow-hidden">
        {images.map((img, index) => (
          <img
            key={index}
            src={img}
            alt={`banner-${index}`}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[2000ms] ${
              index === currentBg ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
        {/* Role Badge with Icon */}
        {user && (
          <div className="absolute z-50 top-4 right-4 flex items-center gap-2 bg-black text-white px-3 py-1 rounded-full shadow-lg text-sm font-semibold">
            {user.role === "editor" ? <FaUserTie /> : <FaBriefcase />}
            <span className="capitalize">{user.role}</span>
            <FaCheckCircle className="text-blue-400 ml-1" />
          </div>
        )}

        <div className="absolute inset-0 bg-black/70"></div>
        <div className="relative z-10 text-white text-center flex flex-col items-center px-4">
          <h1 className="text-3xl sm:text-5xl font-bold mb-4">
            {user
              ? `Welcome back, ${user.name}!`
              : "Find the Best Freelance Video Editors"}
          </h1>
          <p className="mb-6 text-lg sm:text-xl">
            {user
              ? "Go to your workspace and manage your projects."
              : "Hire top editors or showcase your skills and get projects!"}
          </p>

          {!user && (
            <div className="flex flex-col items-center gap-4">
              <div className="flex gap-4 mb-4">
                <button
                  className={`px-4 py-2 rounded-2xl font-semibold transition ${
                    selectedRole === "editor"
                      ? "bg-black text-white"
                      : "bg-gray-300 text-black"
                  }`}
                  onClick={() => setSelectedRole("editor")}
                >
                  Join as Editor
                </button>
                <button
                  className={`px-4 py-2 rounded-2xl font-semibold transition ${
                    selectedRole === "client"
                      ? "bg-black text-white"
                      : "bg-gray-300 text-black"
                  }`}
                  onClick={() => setSelectedRole("client")}
                >
                  Join as Client
                </button>
              </div>

              <button
                onClick={() => setShowAuth(true)}
                className="bg-green-500 hover:bg-green-600 px-6 py-3 rounded-2xl font-bold text-lg transition"
              >
                Join Now
              </button>
            </div>
          )}

          {user && (
            <button
              onClick={handleGoWorkspace}
              className="bg-green-500 hover:bg-blue-700 px-6 py-3 rounded-2xl font-bold text-lg transition"
            >
              Go to Workspace
            </button>
          )}
        </div>
      </div>

      {/* Features Section */}
      <div className="px-4 py-12 flex-1">
        <h2 className="text-2xl font-bold flex mb-6 gap-2 items-center justify-center">
          <span className="text-green-500 sm:text-3xl">Our Features </span>
          <FaArrowCircleRight />
        </h2>
        <div className="grid sm:grid-cols-3 gap-6">
          <div className="bg-white sm:p-15 p-6 rounded-lg shadow-black shadow-2xl text-center">
            <h3 className="font-semibold mb-2">Hire Experts</h3>
            <p>Browse profiles and hire the best freelancers.</p>
          </div>
          <div className="bg-white sm:p-15 p-6 rounded-lg shadow-black shadow-2xl text-center">
            <h3 className="font-semibold mb-2">Secure Payments</h3>
            <p>Payments are safe and transparent.</p>
          </div>
          <div className="bg-white sm:p-15 p-6 rounded-lg shadow-black shadow-2xl text-center">
            <h3 className="font-semibold mb-2">Showcase Portfolio</h3>
            <p>Upload your work and attract clients worldwide.</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-200 px-6 sm:px-12 py-10 mt-auto">
        <div className="max-w-7xl mx-auto grid sm:grid-cols-4 gap-8">
          <div>
            <h4 className="font-bold mb-4">About</h4>
            <p>
              We connect freelance video editors with clients worldwide,
              providing a secure platform to showcase skills and manage
              projects.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <a href="/" className="hover:text-green-500 transition">
                  Home
                </a>
              </li>
              <li>
                <a
                  href="/editor-home"
                  className="hover:text-green-500 transition"
                >
                  Editors
                </a>
              </li>
              <li>
                <a
                  href="/client-home"
                  className="hover:text-green-500 transition"
                >
                  Clients
                </a>
              </li>
              <li>
                <a href="/contact" className="hover:text-green-500 transition">
                  Contact
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Contact</h4>
            <p>Email: support@suvineditography.com</p>
            <p>Phone: +91 1234567890</p>
            <p>Address: Mumbai, India</p>
          </div>
          <div>
            <h4 className="font-bold mb-4">Follow Us</h4>
            <div className="flex gap-4 text-xl mt-2">
              <a href="#" className="hover:text-green-500 transition">
                <FaFacebook />
              </a>
              <a href="#" className="hover:text-green-500 transition">
                <FaTwitter />
              </a>
              <a href="#" className="hover:text-green-500 transition">
                <FaInstagram />
              </a>
              <a href="#" className="hover:text-green-500 transition">
                <FaLinkedin />
              </a>
            </div>
          </div>
        </div>
        <div className="text-center mt-8 text-gray-400">
          &copy; {new Date().getFullYear()} SuvinEditography. All rights
          reserved.
        </div>
      </footer>

      {/* Auth Modal */}
      {!user && showAuth && <AuthForm />}
    </div>
  );
};

export default Homepage;
