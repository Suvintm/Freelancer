// src/pages/EditorHome.jsx
import { useState, useEffect } from "react";
import {
  FaUserTie,
  FaBriefcase,
  FaStar,
  FaCheckCircle,
  FaEnvelope,
} from "react-icons/fa";
import logo from "../assets/logo.png";
import axios from "axios";
import { useAppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";

const demoEditors = [
  {
    id: 1,
    name: "Alice Johnson",
    role: "editor",
    skills: ["Video Editing", "After Effects", "Premiere Pro"],
    rating: 4.8,
    price: 30,
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    topRated: true,
    verified: true,
    online: true,
  },
  {
    id: 2,
    name: "Bob Smith",
    role: "editor",
    skills: ["Motion Graphics", "DaVinci Resolve"],
    rating: 4.5,
    price: 25,
    avatar: "https://randomuser.me/api/portraits/men/46.jpg",
    topRated: false,
    verified: true,
    online: false,
  },
];

const demoGigs = [
  {
    id: 1,
    title: "Promo Video Editing",
    description: "I will edit your promotional videos professionally",
    price: 50,
    duration: "3 days",
    category: "Marketing",
  },
  {
    id: 2,
    title: "YouTube Video Editing",
    description: "Full YouTube video editing with thumbnails",
    price: 35,
    duration: "2 days",
    category: "YouTube",
  },
];

const EditorHome = () => {
  const { backendURL, user } = useAppContext();
  const [profile, setProfile] = useState(user || null);
  const [activeTab, setActiveTab] = useState("editors");
  const [filterSkill, setFilterSkill] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigate = useNavigate();

  const stats = [
    { title: "Total Orders", value: 12 },
    { title: "Active Orders", value: 3 },
    { title: "Earnings", value: "$450" },
    { title: "Completed Orders", value: 2 },
  ];

 useEffect(() => {
   const fetchProfile = async () => {
     try {
       const res = await axios.get(`${backendURL}/api/auth/profile`, {
         withCredentials: true,
         headers: {
           Authorization: `Bearer ${user?.token}`, // if you store JWT in context
         },
       });
       setProfile(res.data);
     } catch (err) {
       console.log("Error fetching profile:", err);
     }
   };
   if (!profile && user?.token) fetchProfile();
 }, [backendURL, user?.token]);


  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-100">
      {/* Sidebar */}
      <aside
        className={`bg-white shadow-md flex flex-col fixed md:relative z-50 h-full md:h-auto transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } w-64`}
      >
        <div className="flex items-center gap-2 px-6 py-4">
          <img src={logo} alt="SuviX" className="w-10 h-10" />
          <h1 className="text-2xl font-bold">SuviX</h1>
          <button
            className="md:hidden ml-auto"
            onClick={() => setSidebarOpen(false)}
          >
            ✕
          </button>
        </div>
        <nav className="flex-1 px-4 py-2 flex flex-col gap-2">
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-gray-200"
            onClick={() => navigate("/editor-home")}
          >
            <FaBriefcase /> Dashboard
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-gray-200"
            onClick={() => navigate("/editor-my-orders")}
          >
            <FaCheckCircle /> My Orders
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-gray-200"
            onClick={() => navigate("/editor-profile")}
          >
            <FaUserTie /> Profile
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-gray-200"
            onClick={() => setActiveTab("editors")}
          >
            <FaUserTie /> Explore Editors
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-gray-200"
            onClick={() => setActiveTab("gigs")}
          >
            <FaBriefcase /> Explore Gigs
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-gray-200"
            onClick={() => alert("Messages Page coming soon!")}
          >
            <FaEnvelope /> Messages
          </button>
        </nav>
      </aside>

      {/* Mobile Top Nav */}
      <div className="md:hidden flex justify-between items-center bg-white shadow-md px-4 py-3">
        <button onClick={() => setSidebarOpen(true)}>☰</button>
        <div className="flex items-center gap-2">
          <img
            onClick={() => navigate("/")}
            src={logo}
            alt="SuviX"
            className="w-8 h-8"
          />
          <h2 className="text-lg font-bold">SuviX</h2>
        </div>
        <div onClick={() => navigate("/editor-profile")} className="relative">
          <img
            src={profile?.profilePicture || demoEditors[0].avatar}
            alt="Profile"
            className="w-8 h-8 rounded-full border-2 border-green-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Mobile Quick Access */}
      <div className="md:hidden flex gap-4 justify-around bg-gray-100 p-3">
        <button
          onClick={() => navigate("/editor-my-orders")}
          className="relative px-3 py-2 bg-green-500 text-white rounded-xl"
        >
          My Orders
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
        </button>
        <button
          onClick={() => navigate("/editor-messages")}
          className="relative px-3 py-2 bg-zinc-500 text-white rounded-xl"
        >
          My Messages
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
        </button>
        <button
          className="px-3 py-2 bg-white text-gray-700 rounded-xl shadow-md"
          onClick={() => navigate("/editor-home")}
        >
          Dashboard
        </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 px-4 md:px-6 py-6 md:ml-64">
        {/* Dashboard Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-6">
          {stats.map((stat) => (
            <div
              key={stat.title}
              className="bg-white p-4 sm:p-6 rounded-xl shadow-md text-center"
            >
              <p className="text-gray-500 text-sm sm:text-base">{stat.title}</p>
              <p className="text-xl sm:text-2xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="mb-4 flex gap-4 justify-center flex-wrap">
          <button
            className={`px-4 py-2 rounded-full font-semibold ${
              activeTab === "editors"
                ? "bg-green-500 text-white"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
            onClick={() => setActiveTab("editors")}
          >
            Explore Editors
          </button>
          <button
            className={`px-4 py-2 rounded-full font-semibold ${
              activeTab === "gigs"
                ? "bg-green-500 text-white"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
            onClick={() => setActiveTab("gigs")}
          >
            Explore Gigs
          </button>
        </div>

        {/* Filters */}
        {activeTab === "editors" && (
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4 justify-center items-center">
            <input
              type="text"
              placeholder="Filter by skill..."
              value={filterSkill}
              onChange={(e) => setFilterSkill(e.target.value)}
              className="p-2 border border-gray-300 rounded-xl w-full sm:w-64"
            />
            <button className="px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 w-full sm:w-auto">
              Apply
            </button>
          </div>
        )}

        {/* Explore Editors */}
        {activeTab === "editors" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {demoEditors
              .filter((e) =>
                filterSkill
                  ? e.skills
                      .join(" ")
                      .toLowerCase()
                      .includes(filterSkill.toLowerCase())
                  : true
              )
              .map((editor) => (
                <div
                  key={editor.id}
                  className="bg-white p-4 sm:p-6 rounded-xl shadow-md flex flex-col items-center text-center hover:shadow-xl transition"
                >
                  <div className="relative">
                    <img
                      src={editor.avatar}
                      alt={editor.name}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-full mb-4 object-cover"
                    />
                    {editor.online && (
                      <span className="absolute bottom-0 right-0 w-3 sm:w-4 h-3 sm:h-4 bg-green-400 rounded-full border-2 border-white" />
                    )}
                  </div>
                  <h3 className="font-bold text-lg sm:text-xl mb-1">
                    {editor.name}
                  </h3>
                  <p className="text-gray-500 mb-2 text-sm sm:text-base">
                    <FaUserTie className="inline mr-1" />
                    {editor.role}{" "}
                    {editor.topRated && (
                      <span className="text-blue-500 font-semibold">
                        Top Rated
                      </span>
                    )}{" "}
                    {editor.verified && (
                      <FaCheckCircle className="inline text-green-500" />
                    )}
                  </p>
                  <p className="text-gray-600 text-xs sm:text-sm mb-2">
                    Skills: {editor.skills.join(", ")}
                  </p>
                  <p className="text-yellow-500 font-semibold text-sm sm:text-base mb-2">
                    Rating: {editor.rating} <FaStar className="inline" />
                  </p>
                  <p className="font-bold text-sm sm:text-base mb-2">
                    ${editor.price}/hr
                  </p>
                  <button className="px-3 sm:px-4 py-1 sm:py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 text-sm sm:text-base">
                    View Profile
                  </button>
                </div>
              ))}
          </div>
        )}

        {/* Explore Gigs */}
        {activeTab === "gigs" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {demoGigs.map((gig) => (
              <div
                key={gig.id}
                className="bg-white p-4 sm:p-6 rounded-xl shadow-md flex flex-col justify-between hover:shadow-xl transition"
              >
                <h3 className="font-bold text-lg sm:text-xl mb-2">
                  {gig.title}
                </h3>
                <p className="text-gray-600 text-sm sm:text-base mb-2">
                  {gig.description}
                </p>
                <p className="text-gray-500 text-xs sm:text-sm mb-2">
                  Delivery: {gig.duration}
                </p>
                <p className="font-bold text-sm sm:text-base mb-4">
                  ${gig.price}
                </p>
                <button className="px-3 sm:px-4 py-1 sm:py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 text-sm sm:text-base">
                  Hire
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default EditorHome;
