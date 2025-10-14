import { useEffect, useState } from "react";
import {
  FaEdit,
  FaEnvelope,
  FaMapMarkerAlt,
  FaAward,
  FaCode,
  FaLanguage,
  FaBriefcase,
  FaUser,
  FaFilm,
  FaImage,
  FaPlus,
  FaCheckCircle,
  FaUserTie,
} from "react-icons/fa";
import axios from "axios";
import { useAppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import ReactCountryFlag from "react-country-flag";
import PortfolioSection from "../components/PortfolioSection.jsx";

// ✅ Country name to ISO Alpha-2 code mapping
const countryNameToCode = {
  Afghanistan: "AF",
  Albania: "AL",
  Algeria: "DZ",
  Andorra: "AD",
  Angola: "AO",
  Argentina: "AR",
  Armenia: "AM",
  Australia: "AU",
  Austria: "AT",
  Azerbaijan: "AZ",
  Bangladesh: "BD",
  Belgium: "BE",
  Brazil: "BR",
  Canada: "CA",
  Chile: "CL",
  China: "CN",
  Colombia: "CO",
  Croatia: "HR",
  Cuba: "CU",
  Czechia: "CZ",
  Denmark: "DK",
  Egypt: "EG",
  Finland: "FI",
  France: "FR",
  Germany: "DE",
  Ghana: "GH",
  Greece: "GR",
  Hungary: "HU",
  Iceland: "IS",
  India: "IN",
  Indonesia: "ID",
  Iran: "IR",
  Iraq: "IQ",
  Ireland: "IE",
  Israel: "IL",
  Italy: "IT",
  Japan: "JP",
  Kenya: "KE",
  Malaysia: "MY",
  Mexico: "MX",
  Nepal: "NP",
  Netherlands: "NL",
  "New Zealand": "NZ",
  Nigeria: "NG",
  Norway: "NO",
  Pakistan: "PK",
  Peru: "PE",
  Poland: "PL",
  Portugal: "PT",
  Qatar: "QA",
  Romania: "RO",
  Russia: "RU",
  SaudiArabia: "SA",
  Singapore: "SG",
  Slovakia: "SK",
  Slovenia: "SI",
  SouthAfrica: "ZA",
  Spain: "ES",
  SriLanka: "LK",
  Sweden: "SE",
  Switzerland: "CH",
  Thailand: "TH",
  Turkey: "TR",
  Ukraine: "UA",
  UAE: "AE",
  UK: "GB",
  USA: "US",
  Vietnam: "VN",
  Zimbabwe: "ZW",
  // Add more countries as needed
};

const EditorProfile = () => {
  const { user, backendURL } = useAppContext();
  const [profile, setProfile] = useState(null);
  const [portfolios, setPortfolios] = useState([]);
  const [activeTab, setActiveTab] = useState("about");
  const [loading, setLoading] = useState(true);
  const [loadingPortfolio, setLoadingPortfolio] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCert, setSelectedCert] = useState(null);

  const navigate = useNavigate();

  // ✅ Fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${backendURL}/api/profile`, {
          headers: { Authorization: `Bearer ${user?.token}` },
        });
        setTimeout(() => {
          setProfile(res.data.profile);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error("Error fetching profile:", error);
        setLoading(false);
      }
    };
    fetchProfile();
  }, [backendURL, user?.token]);

  // ✅ Skeleton Loading
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[80vh]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-green-500 border-solid mb-4"></div>
        <p className="text-gray-600 font-medium">Loading your profile...</p>
      </div>
    );
  }

  // ✅ No Profile Case
  if (!profile) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <p className="text-gray-600 text-lg">
          No profile found. Please create or update your profile.
        </p>
      </div>
    );
  }

  const isVideo = (url) => url?.match(/\.(mp4|mov|avi|mkv|webm)$/i) !== null;

  return (
    <div className="min-h-screen bg-gray-100 py-0 px-0 md:px-12">
      {/* Sidebar */}
      <aside
        className={`bg-white shadow-md flex flex-col fixed top-0 left-0 z-50 h-screen transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } w-64`}
      >
        <div className="flex items-center gap-2 px-6 py-4">
          <img
            onClick={() => navigate("/editor-home")}
            src={logo}
            alt="SuviX"
            className="w-10 h-10 cursor-pointer"
          />
          <h1
            onClick={() => navigate("/editor-home")}
            className="text-2xl font-bold"
          >
            SuviX
          </h1>
          <button
            className="md:hidden ml-auto"
            onClick={() => setSidebarOpen(false)}
          >
            ✕
          </button>
        </div>
        <nav className="flex-1 px-4 py-2 flex flex-col gap-2">
          <button
            onClick={() => navigate("/editor-home")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-gray-200"
          >
            <FaBriefcase /> Dashboard
          </button>
          <button
            onClick={() => navigate("/editor-my-orders")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-gray-200"
          >
            <FaCheckCircle /> My Orders
          </button>
          <button
            onClick={() => navigate("/editor-profile")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-gray-200"
          >
            <FaUserTie /> Profile
          </button>
          <button
            onClick={() => navigate("/editor-messages")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-gray-200"
          >
            <FaEnvelope /> Messages
          </button>
        </nav>
      </aside>
      {/* Desktop Navbar */}
      <header className="hidden md:flex fixed top-0 left-64 right-0 bg-white shadow-md h-16 px-6 items-center justify-between z-40">
        <div className="flex items-center gap-3">
          <img
            src={logo}
            alt="SuviX"
            className="w-8 h-8 cursor-pointer"
            onClick={() => navigate("/editor-home")}
          />
          <h2 className="text-xl font-bold">SuviX</h2>
        </div>
        <nav className="flex gap-6 text-gray-600 font-medium">
          <button onClick={() => navigate("/editor-home")}>Dashboard</button>
          <button onClick={() => navigate("/editor-my-orders")}>Orders</button>
          <button onClick={() => navigate("/editor-profile")}>Profile</button>
          <button onClick={() => navigate("/editor-messages")}>Messages</button>
        </nav>
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate("/editor-profile")}
        >
          <img
            src={
              user?.profilePicture ||
              "https://randomuser.me/api/portraits/women/44.jpg"
            }
            alt="Profile"
            className="w-9 h-9 rounded-full border-2 border-green-500"
          />
          <span className="font-semibold text-gray-700">
            {user?.name || "Editor"}
          </span>
        </div>
      </header>

      {/* Mobile Navbar */}
      <div className="md:hidden flex justify-between items-center bg-white shadow-md px-4 py-3">
        <button onClick={() => setSidebarOpen(true)}>☰</button>
        <div className="flex items-center gap-2">
          <img
            onClick={() => navigate("/editor-home")}
            src={logo}
            alt="SuviX"
            className="w-8 h-8"
          />
          <h2
            onClick={() => navigate("/editor-home")}
            className="text-lg font-bold"
          >
            SuviX
          </h2>
        </div>
        <div onClick={() => navigate("/editor-profile")} className="relative">
          <img
            src={
              user?.profilePicture ||
              "https://randomuser.me/api/portraits/women/44.jpg"
            }
            alt="Profile"
            className="w-8 h-8 rounded-full border-2 border-green-500 cursor-pointer"
          />
        </div>
      </div>

      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-md overflow-hidden">
        {/* Profile Header */}
        <div className="flex md:mt-20 md:flex-row items-center md:items-start gap-6 p-6 border-b border-gray-200">
          <div>
            <img
              src={
                profile?.user?.profilePicture ||
                "https://cdn-icons-png.flaticon.com/512/847/847969.png"
              }
              alt="Profile"
              className="w-28 h-28 rounded-full border-4 border-green-500 object-cover"
            />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-bold text-gray-800">
              {profile?.user?.name}
            </h2>
            <p className="text-gray-600">
              {profile?.user?.role === "editor"
                ? "Professional Editor"
                : "Client"}
            </p>

            <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-3 text-gray-600 text-sm">
              {profile.location?.country && (
                <div className="flex items-center gap-1">
                  <FaMapMarkerAlt className="text-green-500" />
                  <ReactCountryFlag
                    countryCode={
                      countryNameToCode[profile.location.country] || "IN"
                    }
                    svg
                    style={{ width: "1.5em", height: "1.5em" }}
                    title={profile.location.country}
                  />
                  {profile.location.country}
                </div>
              )}

              {profile.contactEmail && (
                <div className="flex items-center gap-1">
                  <FaEnvelope className="text-green-500" />{" "}
                  {profile.contactEmail}
                </div>
              )}
            </div>

            <button
              onClick={() => navigate("/editor-profile-update")}
              className="mt-5 inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-5 py-2 rounded-full transition-all duration-200"
            >
              <FaEdit /> Edit Profile
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex justify-center md:justify-start border-b border-gray-200">
          <button
            onClick={() => setActiveTab("about")}
            className={`px-6 py-3 font-semibold ${
              activeTab === "about"
                ? "text-green-600 border-b-2 border-green-500"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            About
          </button>
          <button
            onClick={() => setActiveTab("portfolio")}
            className={`px-6 py-3 font-semibold ${
              activeTab === "portfolio"
                ? "text-green-600 border-b-2 border-green-500"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Portfolio
          </button>
        </div>

        {/* About Section */}
        {activeTab === "about" && (
          <div className="p-6 space-y-6">
            {profile.about && (
              <div>
                <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                  <FaUser className="text-green-500" /> About Me
                </h3>
                <p className="text-gray-700 mt-2">{profile.about}</p>
              </div>
            )}

            {profile.experience && (
              <div>
                <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                  <FaBriefcase className="text-green-500" /> Experience
                </h3>
                <p className="text-gray-700 mt-2">{profile.experience}</p>
              </div>
            )}

            {profile.skills?.length > 0 && (
              <div>
                <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                  <FaCode className="text-green-500" /> Skills
                </h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  {profile.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* languages */}

            {profile.languages?.length > 0 && (
              <div>
                <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                  <FaLanguage className="text-green-500" /> Languages
                </h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  {profile.languages.map((language, index) => (
                    <span
                      key={index}
                      className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium"
                    >
                      {language}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {profile.certifications?.length > 0 && (
              <div>
                <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                  <FaAward className="text-green-500" /> Certifications
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-3">
                  {profile.certifications.map((cert, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all bg-white cursor-pointer"
                      onClick={() => {
                        setSelectedCert(cert);
                        setModalOpen(true);
                      }}
                    >
                      <img
                        src={cert.image}
                        alt={cert.title}
                        className="w-full h-40 object-cover"
                      />
                      <div className="p-3">
                        <p className="text-gray-700 font-semibold">
                          {cert.title}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Modal */}
                {modalOpen && selectedCert && (
                  <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-4 max-w-lg w-full relative">
                      <button
                        className="absolute top-2 right-2 text-gray-700 text-xl font-bold"
                        onClick={() => setModalOpen(false)}
                      >
                        ✕
                      </button>
                      <h3 className="text-lg font-semibold mb-2">
                        {selectedCert.title}
                      </h3>
                      <img
                        src={selectedCert.image}
                        alt={selectedCert.title}
                        className="w-full h-auto object-contain rounded"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Portfolio Section */}
        {activeTab === "portfolio" && (
          <div className="p-6">
            <PortfolioSection />
          </div>
        )}
      </div>
    </div>
  );
};

export default EditorProfile;
