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
  FaTimes,
} from "react-icons/fa";
import axios from "axios";
import { useAppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import ReactCountryFlag from "react-country-flag";
import Sidebar from "../components/Sidebar.jsx";
import EditorNavbar from "../components/EditorNavbar.jsx";
import PortfolioSection from "../components/PortfolioSection.jsx";
import { PageLoader } from "../components/LoadingSpinner.jsx";

// Country name to ISO Alpha-2 code mapping
const countryNameToCode = {
  Afghanistan: "AF", Albania: "AL", Algeria: "DZ", Andorra: "AD", Angola: "AO",
  Argentina: "AR", Armenia: "AM", Australia: "AU", Austria: "AT", Azerbaijan: "AZ",
  Bangladesh: "BD", Belgium: "BE", Brazil: "BR", Canada: "CA", Chile: "CL",
  China: "CN", Colombia: "CO", Croatia: "HR", Cuba: "CU", Czechia: "CZ",
  Denmark: "DK", Egypt: "EG", Finland: "FI", France: "FR", Germany: "DE",
  Ghana: "GH", Greece: "GR", Hungary: "HU", Iceland: "IS", India: "IN",
  Indonesia: "ID", Iran: "IR", Iraq: "IQ", Ireland: "IE", Israel: "IL",
  Italy: "IT", Japan: "JP", Kenya: "KE", Malaysia: "MY", Mexico: "MX",
  Nepal: "NP", Netherlands: "NL", "New Zealand": "NZ", Nigeria: "NG", Norway: "NO",
  Pakistan: "PK", Peru: "PE", Poland: "PL", Portugal: "PT", Qatar: "QA",
  Romania: "RO", Russia: "RU", SaudiArabia: "SA", Singapore: "SG", Slovakia: "SK",
  Slovenia: "SI", SouthAfrica: "ZA", Spain: "ES", SriLanka: "LK", Sweden: "SE",
  Switzerland: "CH", Thailand: "TH", Turkey: "TR", Ukraine: "UA", UAE: "AE",
  UK: "GB", USA: "US", Vietnam: "VN", Zimbabwe: "ZW",
};

const EditorProfile = () => {
  const { user, backendURL } = useAppContext();
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState("about");
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCert, setSelectedCert] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${backendURL}/api/profile`, {
          headers: { Authorization: `Bearer ${user?.token}` },
        });
        setProfile(res.data.profile);
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [backendURL, user?.token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <PageLoader text="Loading your profile..." />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <div className="text-center">
          <p className="text-gray-600 text-lg mb-4">
            No profile found. Please create or update your profile.
          </p>
          <button
            onClick={() => navigate("/editor-profile-update")}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg"
          >
            Create Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Navbar */}
      <EditorNavbar onMenuClick={() => setSidebarOpen(true)} />

      {/* Main Content */}
      <div className="md:ml-64 md:mt-16 p-4 md:p-8">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-md overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-green-50 to-green-100 p-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <img
                src={profile?.user?.profilePicture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                alt="Profile"
                className="w-28 h-28 rounded-full border-4 border-white shadow-lg object-cover"
              />
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl font-bold text-gray-800">
                  {profile?.user?.name}
                </h2>
                <p className="text-gray-600">
                  {profile?.user?.role === "editor" ? "Professional Editor" : "Client"}
                </p>

                <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-3 text-gray-600 text-sm">
                  {profile.location?.country && (
                    <div className="flex items-center gap-1 bg-white px-3 py-1 rounded-full shadow-sm">
                      <FaMapMarkerAlt className="text-green-500" />
                      <ReactCountryFlag
                        countryCode={countryNameToCode[profile.location.country] || "IN"}
                        svg
                        style={{ width: "1.2em", height: "1.2em" }}
                      />
                      {profile.location.country}
                    </div>
                  )}
                  {profile.contactEmail && (
                    <div className="flex items-center gap-1 bg-white px-3 py-1 rounded-full shadow-sm">
                      <FaEnvelope className="text-green-500" />
                      {profile.contactEmail}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => navigate("/editor-profile-update")}
                  className="mt-5 inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-5 py-2 rounded-full transition-all shadow-md hover:shadow-lg"
                >
                  <FaEdit /> Edit Profile
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            {[
              { id: "about", label: "About" },
              { id: "portfolio", label: "Portfolio" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-6 py-3 font-semibold transition-all ${activeTab === tab.id
                    ? "text-green-600 border-b-2 border-green-500 bg-green-50"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* About Section */}
          {activeTab === "about" && (
            <div className="p-6 space-y-6">
              {profile.about && (
                <div className="bg-gray-50 p-4 rounded-xl">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-2">
                    <FaUser className="text-green-500" /> About Me
                  </h3>
                  <p className="text-gray-700 leading-relaxed">{profile.about}</p>
                </div>
              )}

              {profile.experience && (
                <div className="bg-gray-50 p-4 rounded-xl">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-2">
                    <FaBriefcase className="text-green-500" /> Experience
                  </h3>
                  <p className="text-gray-700">{profile.experience}</p>
                </div>
              )}

              {profile.skills?.length > 0 && (
                <div>
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-3">
                    <FaCode className="text-green-500" /> Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-sm font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {profile.languages?.length > 0 && (
                <div>
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-3">
                    <FaLanguage className="text-green-500" /> Languages
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.languages.map((language, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-sm font-medium"
                      >
                        {language}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {profile.certifications?.length > 0 && (
                <div>
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-3">
                    <FaAward className="text-green-500" /> Certifications
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {profile.certifications.map((cert, index) => (
                      cert.image && (
                        <div
                          key={index}
                          className="border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group"
                          onClick={() => {
                            setSelectedCert(cert);
                            setModalOpen(true);
                          }}
                        >
                          <img
                            src={cert.image}
                            alt={cert.title}
                            className="w-full h-40 object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="p-3 bg-white">
                            <p className="text-gray-700 font-medium truncate">
                              {cert.title || "Certificate"}
                            </p>
                          </div>
                        </div>
                      )
                    ))}
                  </div>
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

      {/* Certification Modal */}
      {modalOpen && selectedCert && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-white rounded-xl p-4 max-w-2xl w-full relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-2xl"
              onClick={() => setModalOpen(false)}
            >
              <FaTimes />
            </button>
            <h3 className="text-lg font-semibold mb-3">
              {selectedCert.title || "Certificate"}
            </h3>
            <img
              src={selectedCert.image}
              alt={selectedCert.title}
              className="w-full h-auto object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default EditorProfile;
