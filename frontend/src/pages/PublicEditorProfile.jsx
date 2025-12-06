import { useEffect, useState } from "react";
import {
  FaEnvelope,
  FaMapMarkerAlt,
  FaAward,
  FaCode,
  FaLanguage,
  FaBriefcase,
  FaUser,
  FaArrowAltCircleRight,
} from "react-icons/fa";
import axios from "axios";
import { useAppContext } from "../context/AppContext";
import { useParams, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import ReactCountryFlag from "react-country-flag";
import PublicPortfolio from "../components/PublicPortfolio.jsx";

// ✅ Full Global Country Code List
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
  Bahamas: "BS",
  Bahrain: "BH",
  Bangladesh: "BD",
  Barbados: "BB",
  Belarus: "BY",
  Belgium: "BE",
  Belize: "BZ",
  Benin: "BJ",
  Bhutan: "BT",
  Bolivia: "BO",
  BosniaAndHerzegovina: "BA",
  Botswana: "BW",
  Brazil: "BR",
  Brunei: "BN",
  Bulgaria: "BG",
  BurkinaFaso: "BF",
  Burundi: "BI",
  Cambodia: "KH",
  Cameroon: "CM",
  Canada: "CA",
  CapeVerde: "CV",
  CentralAfricanRepublic: "CF",
  Chad: "TD",
  Chile: "CL",
  China: "CN",
  Colombia: "CO",
  Comoros: "KM",
  Congo: "CG",
  CostaRica: "CR",
  Croatia: "HR",
  Cuba: "CU",
  Cyprus: "CY",
  CzechRepublic: "CZ",
  Denmark: "DK",
  Djibouti: "DJ",
  Dominica: "DM",
  DominicanRepublic: "DO",
  Ecuador: "EC",
  Egypt: "EG",
  ElSalvador: "SV",
  Estonia: "EE",
  Eswatini: "SZ",
  Ethiopia: "ET",
  Fiji: "FJ",
  Finland: "FI",
  France: "FR",
  Gabon: "GA",
  Gambia: "GM",
  Georgia: "GE",
  Germany: "DE",
  Ghana: "GH",
  Greece: "GR",
  Grenada: "GD",
  Guatemala: "GT",
  Guinea: "GN",
  Guyana: "GY",
  Haiti: "HT",
  Honduras: "HN",
  Hungary: "HU",
  Iceland: "IS",
  India: "IN",
  Indonesia: "ID",
  Iran: "IR",
  Iraq: "IQ",
  Ireland: "IE",
  Israel: "IL",
  Italy: "IT",
  Jamaica: "JM",
  Japan: "JP",
  Jordan: "JO",
  Kazakhstan: "KZ",
  Kenya: "KE",
  Kiribati: "KI",
  Kuwait: "KW",
  Kyrgyzstan: "KG",
  Laos: "LA",
  Latvia: "LV",
  Lebanon: "LB",
  Lesotho: "LS",
  Liberia: "LR",
  Libya: "LY",
  Liechtenstein: "LI",
  Lithuania: "LT",
  Luxembourg: "LU",
  Madagascar: "MG",
  Malawi: "MW",
  Malaysia: "MY",
  Maldives: "MV",
  Mali: "ML",
  Malta: "MT",
  MarshallIslands: "MH",
  Mauritania: "MR",
  Mauritius: "MU",
  Mexico: "MX",
  Micronesia: "FM",
  Moldova: "MD",
  Monaco: "MC",
  Mongolia: "MN",
  Montenegro: "ME",
  Morocco: "MA",
  Mozambique: "MZ",
  Myanmar: "MM",
  Namibia: "NA",
  Nauru: "NR",
  Nepal: "NP",
  Netherlands: "NL",
  NewZealand: "NZ",
  Nicaragua: "NI",
  Niger: "NE",
  Nigeria: "NG",
  NorthKorea: "KP",
  NorthMacedonia: "MK",
  Norway: "NO",
  Oman: "OM",
  Pakistan: "PK",
  Palau: "PW",
  Panama: "PA",
  PapuaNewGuinea: "PG",
  Paraguay: "PY",
  Peru: "PE",
  Philippines: "PH",
  Poland: "PL",
  Portugal: "PT",
  Qatar: "QA",
  Romania: "RO",
  Russia: "RU",
  Rwanda: "RW",
  SaintKittsAndNevis: "KN",
  SaintLucia: "LC",
  SaintVincentAndTheGrenadines: "VC",
  Samoa: "WS",
  SanMarino: "SM",
  SaoTomeAndPrincipe: "ST",
  SaudiArabia: "SA",
  Senegal: "SN",
  Serbia: "RS",
  Seychelles: "SC",
  SierraLeone: "SL",
  Singapore: "SG",
  Slovakia: "SK",
  Slovenia: "SI",
  SolomonIslands: "SB",
  Somalia: "SO",
  SouthAfrica: "ZA",
  SouthKorea: "KR",
  SouthSudan: "SS",
  Spain: "ES",
  SriLanka: "LK",
  Sudan: "SD",
  Suriname: "SR",
  Sweden: "SE",
  Switzerland: "CH",
  Syria: "SY",
  Taiwan: "TW",
  Tajikistan: "TJ",
  Tanzania: "TZ",
  Thailand: "TH",
  TimorLeste: "TL",
  Togo: "TG",
  Tonga: "TO",
  TrinidadAndTobago: "TT",
  Tunisia: "TN",
  Turkey: "TR",
  Turkmenistan: "TM",
  Tuvalu: "TV",
  Uganda: "UG",
  Ukraine: "UA",
  UnitedArabEmirates: "AE",
  UnitedKingdom: "GB",
  UnitedStates: "US",
  Uruguay: "UY",
  Uzbekistan: "UZ",
  Vanuatu: "VU",
  Venezuela: "VE",
  Vietnam: "VN",
  Yemen: "YE",
  Zambia: "ZM",
  Zimbabwe: "ZW",
};

// ✅ Green shimmer skeleton
const ShimmerBlock = ({ className }) => (
  <div className={`relative overflow-hidden bg-green-300 rounded ${className}`}>
    <div className="absolute inset-0 -translate-x-full bg-[linear-gradient(90deg,transparent,rgba(16,185,129,0.3),transparent)] animate-[shimmer_1.5s_infinite]"></div>
  </div>
);

const PublicEditorProfile = () => {
  const { backendURL } = useAppContext();
  const { userId } = useParams();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("about");
  const [selectedCert, setSelectedCert] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [portfolioLoading, setPortfolioLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${backendURL}/api/profile/${userId}`);
        setProfile(res.data.profile);
      } catch (error) {
        console.error("Error fetching public profile:", error);
      } finally {
        setLoading(false);
        setTimeout(() => setPortfolioLoading(false), 1500); // shimmer delay
      }
    };
    fetchProfile();
  }, [backendURL, userId]);

  return (
    <div className="min-h-screen bg-gray-100 pb-10">
      <header className="fixed top-0 left-0 right-0 bg-white shadow-md h-16 px-6 flex items-center justify-between z-40">
        <div className="flex items-center gap-3">
          <img
            src={logo}
            alt="SuviX"
            className="w-8 h-8 cursor-pointer"
            onClick={() => navigate("/editor-home")}
          />
          <h2
            className="text-xl font-bold cursor-pointer"
            onClick={() => navigate("/editor-home")}
          >
            SuviX
          </h2>
        </div>
        <button
          onClick={() => navigate("/editor-home")}
          className="flex items-center gap-2 text-black hover:text-green-600 transition-colors"
        >
          <span>Back</span> <FaArrowAltCircleRight />
        </button>
      </header>

      <div className="max-w-5xl mx-auto mt-20">
        {loading ? (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex md:flex-row flex-col items-center gap-6 p-6 shadow-black m-2 rounded-2xl shadow-lg">
              <ShimmerBlock className="w-28 h-28 rounded-full" />
              <div className="flex-1 space-y-4">
                <ShimmerBlock className="w-48 h-6 rounded-md" />
                <ShimmerBlock className="w-32 h-4 rounded-md" />
                <div className="flex gap-4 mt-2">
                  <ShimmerBlock className="w-20 h-4 rounded-full" />
                  <ShimmerBlock className="w-20 h-4 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        ) : profile ? (
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <h1 className="text-3xl font-bold text-center mt-4">
              {profile?.user?.name}'s Profile
            </h1>

            {/* Profile Header */}
            <div className="flex md:flex-row flex-col items-center md:items-start gap-6 p-6 border-black/30 border rounded-2xl shadow-lg m-4">
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
                  {profile?.location?.country && (
                    <div className="flex items-center gap-1">
                      <FaMapMarkerAlt className="text-green-500" />
                      <ReactCountryFlag
                        countryCode={
                          countryNameToCode[
                            profile.location.country.replace(/\s+/g, "")
                          ] || "IN"
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
                          {cert.image && cert.image.trim() !== "" && (
                            <img
                              src={cert.image}
                              alt={cert.title}
                              className="w-full h-40 object-cover"
                            />
                          )}
                          <div className="p-3">
                            <p className="text-gray-700 font-semibold">
                              {cert.title}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

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
                          {selectedCert.image &&
                            selectedCert.image.trim() !== "" && (
                              <img
                                src={selectedCert.image}
                                alt={selectedCert.title}
                                className="w-full h-auto object-contain rounded"
                              />
                            )}
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
                {portfolioLoading ? (
                  <div className="space-y-4">
                    <ShimmerBlock className="w-full h-32 rounded-md" />
                    <ShimmerBlock className="w-full h-32 rounded-md" />
                    <ShimmerBlock className="w-full h-32 rounded-md" />
                  </div>
                ) : (
                  <PublicPortfolio userId={userId} />
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex justify-center items-center h-[70vh]">
            <p className="text-gray-600 text-lg">Profile not found.</p>
          </div>
        )}
      </div>

      {/* ✅ Shimmer Keyframes */}
      <style>
        {`
          @keyframes shimmer {
            100% { transform: translateX(100%); }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          .animate-fadeIn {
            animation: fadeIn 0.5s ease-in-out;
          }
        `}
      </style>
    </div>
  );
};

export default PublicEditorProfile;
