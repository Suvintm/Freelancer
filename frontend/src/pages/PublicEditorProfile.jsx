import { useEffect, useState, useRef } from "react";
import {
  FaEnvelope,
  FaMapMarkerAlt,
  FaAward,
  FaCode,
  FaLanguage,
  FaBriefcase,
  FaUser,
  FaArrowLeft,
  FaHeart,
  FaEye,
  FaFilm,
  FaPlay,
  FaTimes,
  FaShare,
  FaVolumeUp,
  FaVolumeMute,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import axios from "axios";
import { useAppContext } from "../context/AppContext";
import { useParams, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import ReactCountryFlag from "react-country-flag";
import { motion, AnimatePresence } from "framer-motion";

// Country Code Helper
const countryNameToCode = {
  Afghanistan: "AF", Albania: "AL", Algeria: "DZ", Andorra: "AD", Angola: "AO", Argentina: "AR", Armenia: "AM", Australia: "AU", Austria: "AT", Azerbaijan: "AZ", Bahamas: "BS", Bahrain: "BH", Bangladesh: "BD", Barbados: "BB", Belarus: "BY", Belgium: "BE", Belize: "BZ", Benin: "BJ", Bhutan: "BT", Bolivia: "BO", BosniaAndHerzegovina: "BA", Botswana: "BW", Brazil: "BR", Brunei: "BN", Bulgaria: "BG", BurkinaFaso: "BF", Burundi: "BI", Cambodia: "KH", Cameroon: "CM", Canada: "CA", CapeVerde: "CV", CentralAfricanRepublic: "CF", Chad: "TD", Chile: "CL", China: "CN", Colombia: "CO", Comoros: "KM", Congo: "CG", CostaRica: "CR", Croatia: "HR", Cuba: "CU", Cyprus: "CY", CzechRepublic: "CZ", Denmark: "DK", Djibouti: "DJ", Dominica: "DM", DominicanRepublic: "DO", Ecuador: "EC", Egypt: "EG", ElSalvador: "SV", Estonia: "EE", Eswatini: "SZ", Ethiopia: "ET", Fiji: "FJ", Finland: "FI", France: "FR", Gabon: "GA", Gambia: "GM", Georgia: "GE", Germany: "DE", Ghana: "GH", Greece: "GR", Grenada: "GD", Guatemala: "GT", Guinea: "GN", Guyana: "GY", Haiti: "HT", Honduras: "HN", Hungary: "HU", Iceland: "IS", India: "IN", Indonesia: "ID", Iran: "IR", Iraq: "IQ", Ireland: "IE", Israel: "IL", Italy: "IT", Jamaica: "JM", Japan: "JP", Jordan: "JO", Kazakhstan: "KZ", Kenya: "KE", Kiribati: "KI", Kuwait: "KW", Kyrgyzstan: "KG", Laos: "LA", Latvia: "LV", Lebanon: "LB", Lesotho: "LS", Liberia: "LR", Libya: "LY", Liechtenstein: "LI", Lithuania: "LT", Luxembourg: "LU", Madagascar: "MG", Malawi: "MW", Malaysia: "MY", Maldives: "MV", Mali: "ML", Malta: "MT", MarshallIslands: "MH", Mauritania: "MR", Mauritius: "MU", Mexico: "MX", Micronesia: "FM", Moldova: "MD", Monaco: "MC", Mongolia: "MN", Montenegro: "ME", Morocco: "MA", Mozambique: "MZ", Myanmar: "MM", Namibia: "NA", Nauru: "NR", Nepal: "NP", Netherlands: "NL", NewZealand: "NZ", Nicaragua: "NI", Niger: "NE", Nigeria: "NG", NorthKorea: "KP", NorthMacedonia: "MK", Norway: "NO", Oman: "OM", Pakistan: "PK", Palau: "PW", Panama: "PA", PapuaNewGuinea: "PG", Paraguay: "PY", Peru: "PE", Philippines: "PH", Poland: "PL", Portugal: "PT", Qatar: "QA", Romania: "RO", Russia: "RU", Rwanda: "RW", SaintKittsAndNevis: "KN", SaintLucia: "LC", SaintVincentAndTheGrenadines: "VC", Samoa: "WS", SanMarino: "SM", SaoTomeAndPrincipe: "ST", SaudiArabia: "SA", Senegal: "SN", Serbia: "RS", Seychelles: "SC", SierraLeone: "SL", Singapore: "SG", Slovakia: "SK", Slovenia: "SI", SolomonIslands: "SB", Somalia: "SO", SouthAfrica: "ZA", SouthKorea: "KR", SouthSudan: "SS", Spain: "ES", SriLanka: "LK", Sudan: "SD", Suriname: "SR", Sweden: "SE", Switzerland: "CH", Syria: "SY", Taiwan: "TW", Tajikistan: "TJ", Tanzania: "TZ", Thailand: "TH", TimorLeste: "TL", Togo: "TG", Tonga: "TO", TrinidadAndTobago: "TT", Tunisia: "TN", Turkey: "TR", Turkmenistan: "TM", Tuvalu: "TV", Uganda: "UG", Ukraine: "UA", UnitedArabEmirates: "AE", UnitedKingdom: "GB", UnitedStates: "US", Uruguay: "UY", Uzbekistan: "UZ", Vanuatu: "VU", Venezuela: "VE", Vietnam: "VN", Yemen: "YE", Zambia: "ZM", Zimbabwe: "ZW"
};

const PublicEditorProfile = () => {
  const { backendURL } = useAppContext();
  const { userId } = useParams();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ totalReels: 0, totalViews: 0, totalLikes: 0 });
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("about");

  // Reels Popup State
  const [showReelsPopup, setShowReelsPopup] = useState(false);
  const [selectedReelIndex, setSelectedReelIndex] = useState(0);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const [profileRes, reelsRes] = await Promise.all([
          axios.get(`${backendURL}/api/profile/${userId}`),
          axios.get(`${backendURL}/api/reels/editor/${userId}`)
        ]);

        setProfile(profileRes.data.profile);
        setStats(profileRes.data.stats || { totalReels: 0, totalViews: 0, totalLikes: 0 });
        setReels(reelsRes.data.reels || []);
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, [backendURL, userId]);

  const StatCard = ({ icon: Icon, label, value, color }) => (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-white/50 flex items-center gap-4 min-w-[140px] flex-1"
    >
      <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
        <Icon className={`text-xl ${color.replace("bg-", "text-")}`} />
      </div>
      <div>
        <h4 className="text-2xl font-bold text-gray-800">{value}</h4>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{label}</p>
      </div>
    </motion.div>
  );

  const ReelsPopup = ({ reels, initialIndex, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [isPlaying, setIsPlaying] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const videoRef = useRef(null);
    const currentReel = reels[currentIndex];

    useEffect(() => {
      if (currentReel?.mediaType === "video" && videoRef.current) {
        isPlaying ? videoRef.current.play() : videoRef.current.pause();
      }
    }, [isPlaying, currentIndex]);

    const nextReel = () => {
      setCurrentIndex((prev) => (prev + 1) % reels.length);
      setIsPlaying(true);
    };
    const prevReel = () => {
      setCurrentIndex((prev) => (prev - 1 + reels.length) % reels.length);
      setIsPlaying(true);
    };

    return (
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black z-[100] flex items-center justify-center"
        onClick={onClose}
      >
        <button onClick={onClose} className="absolute top-6 right-6 z-20 text-white bg-white/10 p-3 rounded-full backdrop-blur-md hover:bg-white/20 transition">
          <FaTimes size={20} />
        </button>

        <div className="relative w-full max-w-md h-[85vh] bg-black rounded-3xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
          {currentReel.mediaType === "video" ? (
            <video
              ref={videoRef}
              src={currentReel.mediaUrl}
              className="w-full h-full object-cover"
              loop playsInline muted={isMuted}
              onClick={() => setIsPlaying(!isPlaying)}
            />
          ) : (
            <img src={currentReel.mediaUrl} className="w-full h-full object-cover" alt="Reel" />
          )}

          {/* Overlay Controls */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/80 pointer-events-none" />

          {/* Play Button Overlay */}
          {!isPlaying && currentReel.mediaType === "video" && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-white/20 backdrop-blur-md p-4 rounded-full">
                <FaPlay className="text-white text-3xl ml-1" />
              </div>
            </div>
          )}

          {/* Side Actions */}
          <div className="absolute right-4 bottom-24 flex flex-col gap-4 pointer-events-auto">
            <button onClick={() => setIsMuted(!isMuted)} className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20">
              {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
            </button>
            <div className="flex flex-col items-center gap-1">
              <div className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white">
                <FaHeart />
              </div>
              <span className="text-white text-xs">{currentReel.likesCount}</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white">
                <FaEye />
              </div>
              <span className="text-white text-xs">{currentReel.viewsCount}</span>
            </div>
          </div>

          {/* Bottom Info */}
          <div className="absolute bottom-0 left-0 right-0 p-6 pointer-events-auto">
            <h3 className="text-white font-bold text-lg">{currentReel.title}</h3>
            <p className="text-white/80 text-sm mt-1 line-clamp-2">{currentReel.description}</p>
          </div>

          {/* Nav Arrows */}
          {reels.length > 1 && (
            <>
              <button onClick={prevReel} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 rounded-full text-white hover:bg-white/20 pointer-events-auto">
                <FaChevronLeft />
              </button>
              <button onClick={nextReel} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 rounded-full text-white hover:bg-white/20 pointer-events-auto">
                <FaChevronRight />
              </button>
            </>
          )}
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-500"></div>
      </div>
    );
  }

  if (!profile) return <div className="text-center mt-20">Profile not found</div>;

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Header */}
      <header className="fixed top-0 inset-x-0 h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 z-40 flex items-center justify-between px-6">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/editor-home")}>
          <img src={logo} alt="SuviX" className="w-8 h-8" />
          <span className="font-bold text-xl text-gray-800">SuviX</span>
        </div>
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-green-600 font-medium transition-colors">
          <FaArrowLeft /> Back
        </button>
      </header>

      <main className="pt-24 pb-12 px-4 max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="grid md:grid-cols-[350px_1fr] gap-8 items-start">

          {/* Left Column: Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-xl overflow-hidden sticky top-24"
          >
            <div className="h-32 bg-gradient-to-r from-green-400 to-emerald-600 relative">
              <div className="absolute -bottom-16 left-1/2 -translate-x-1/2">
                <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white">
                  <img
                    src={profile.user.profilePicture || "https://via.placeholder.com/150"}
                    alt={profile.user.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            <div className="pt-20 pb-8 px-6 text-center">
              <h1 className="text-2xl font-bold text-gray-900">{profile.user.name}</h1>
              <p className="text-green-600 font-medium mb-4">{profile.user.role === "editor" ? "Professional Video Editor" : "Client"}</p>

              <div className="flex items-center justify-center gap-2 text-gray-500 text-sm mb-6">
                {profile.location?.country && (
                  <>
                    <FaMapMarkerAlt className="text-red-400" />
                    <span className="flex items-center gap-1">
                      {profile.location.country}
                      <ReactCountryFlag
                        countryCode={countryNameToCode[profile.location.country.replace(/\s+/g, "")] || "IN"}
                        svg
                      />
                    </span>
                  </>
                )}
              </div>

              <div className="flex flex-wrap justify-center gap-2 mb-8">
                {profile.skills?.slice(0, 5).map((skill, i) => (
                  <span key={i} className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                    {skill}
                  </span>
                ))}
              </div>

              <button className="w-full py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                Hire Me
              </button>

              {profile.contactEmail && (
                <button className="w-full mt-3 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                  <FaEnvelope /> Contact
                </button>
              )}
            </div>
          </motion.div>

          {/* Right Column: Content */}
          <div className="space-y-8">
            {/* Stats Row */}
            <div className="flex flex-wrap gap-4">
              <StatCard icon={FaEye} label="Total Views" value={stats.totalViews} color="bg-blue-500" />
              <StatCard icon={FaHeart} label="Total Likes" value={stats.totalLikes} color="bg-red-500" />
              <StatCard icon={FaFilm} label="Reels" value={stats.totalReels} color="bg-purple-500" />
              <StatCard icon={FaAward} label="Projects" value={profile.portfolio?.length || 0} color="bg-orange-500" />
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-2xl p-2 shadow-sm flex gap-2">
              {["about", "portfolio", "reels"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3 rounded-xl font-bold capitalize transition-all ${activeTab === tab
                      ? "bg-green-500 text-white shadow-md"
                      : "text-gray-500 hover:bg-gray-50"
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === "about" && (
                  <div className="bg-white rounded-3xl shadow-sm p-8 space-y-8">
                    <section>
                      <h3 className="text-xl font-bold flex items-center gap-2 mb-4">
                        <div className="p-2 bg-green-100 rounded-lg text-green-600"><FaUser /></div>
                        About Me
                      </h3>
                      <p className="text-gray-600 leading-relaxed text-lg">
                        {profile.about || "No bio available."}
                      </p>
                    </section>

                    {profile.experience && (
                      <section>
                        <h3 className="text-xl font-bold flex items-center gap-2 mb-4">
                          <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><FaBriefcase /></div>
                          Experience
                        </h3>
                        <p className="text-gray-600 leading-relaxed">
                          {profile.experience}
                        </p>
                      </section>
                    )}

                    {profile.languages?.length > 0 && (
                      <section>
                        <h3 className="text-xl font-bold flex items-center gap-2 mb-4">
                          <div className="p-2 bg-purple-100 rounded-lg text-purple-600"><FaLanguage /></div>
                          Languages
                        </h3>
                        <div className="flex flex-wrap gap-3">
                          {profile.languages.map((lang, i) => (
                            <span key={i} className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-gray-700 font-medium">
                              {lang}
                            </span>
                          ))}
                        </div>
                      </section>
                    )}
                  </div>
                )}

                {activeTab === "portfolio" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {profile.portfolio?.map((item, i) => (
                      <div key={item._id} className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all group cursor-pointer border border-gray-100">
                        <div className="aspect-[4/3] relative bg-gray-100 overflow-hidden">
                          {item.editedClip?.endsWith(".mp4") ? (
                            <video src={item.editedClip} className="w-full h-full object-cover" muted loop onMouseOver={e => e.target.play()} onMouseOut={e => { e.target.pause(); e.target.currentTime = 0; }} />
                          ) : (
                            <img src={item.editedClip} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          )}
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <FaPlay className="text-white text-3xl drop-shadow-lg" />
                          </div>
                        </div>
                        <div className="p-5">
                          <h3 className="font-bold text-lg text-gray-900 mb-1">{item.title}</h3>
                          <p className="text-gray-500 text-sm line-clamp-2">{item.description}</p>
                          <div className="mt-4 flex items-center justify-between">
                            <span className="text-xs font-medium px-2 py-1 bg-gray-100 rounded-md text-gray-600">
                              {new Date(item.uploadedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {(!profile.portfolio || profile.portfolio.length === 0) && (
                      <div className="col-span-full text-center py-20 text-gray-400">
                        No portfolio items yet.
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "reels" && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {reels.map((reel, i) => (
                      <motion.div
                        key={reel._id}
                        whileHover={{ scale: 1.02 }}
                        className="aspect-[9/16] bg-black rounded-2xl overflow-hidden relative cursor-pointer group shadow-md"
                        onClick={() => {
                          setSelectedReelIndex(i);
                          setShowReelsPopup(true);
                        }}
                      >
                        {reel.mediaType === "video" ? (
                          <video src={reel.mediaUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                        ) : (
                          <img src={reel.mediaUrl} alt={reel.title} className="w-full h-full object-cover" />
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90" />

                        <div className="absolute bottom-3 left-3 right-3 text-white">
                          <div className="flex items-center gap-3 text-xs font-medium mb-1">
                            <span className="flex items-center gap-1"><FaPlay size={10} /> {reel.viewsCount}</span>
                            <span className="flex items-center gap-1"><FaHeart size={10} /> {reel.likesCount}</span>
                          </div>
                          <p className="text-xs line-clamp-1 opacity-80">{reel.title}</p>
                        </div>

                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <FaPlay className="text-white text-3xl drop-shadow-lg" />
                        </div>
                      </motion.div>
                    ))}
                    {reels.length === 0 && (
                      <div className="col-span-full text-center py-20 text-gray-400">
                        No reels published yet.
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Reels Popup Modal */}
      <AnimatePresence>
        {showReelsPopup && reels.length > 0 && (
          <ReelsPopup
            reels={reels}
            initialIndex={selectedReelIndex}
            onClose={() => setShowReelsPopup(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default PublicEditorProfile;
