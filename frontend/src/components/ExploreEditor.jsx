import { useState, useEffect } from "react";
import axios from "axios";
import { FaStar, FaCheckCircle, FaUserTie, FaSearch } from "react-icons/fa";
import { useAppContext } from "../context/AppContext";

const ExploreEditors = () => {
  const { backendURL, user } = useAppContext();
  const [editors, setEditors] = useState([]);
  const [filteredEditors, setFilteredEditors] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchEditors = async () => {
      try {
        setLoading(true);
        const token =
          user?.token || JSON.parse(localStorage.getItem("user"))?.token;

        const res = await axios.get(`${backendURL}/api/explore/editors`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });

        // Artificial delay for shimmer
        setTimeout(() => {
          setEditors(res.data.editors);
          setFilteredEditors(res.data.editors);
          setLoading(false);
        }, 2000);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || "Failed to fetch editors");
        setLoading(false);
      }
    };

    fetchEditors();
  }, [backendURL, user]);

  useEffect(() => {
    const q = searchQuery.toLowerCase();
    const filtered = editors.filter((editor) => {
      const name = editor.user.name.toLowerCase();
      const skills = editor.skills.join(", ").toLowerCase();
      const languages = editor.languages?.join(", ").toLowerCase() || "";
      return name.includes(q) || skills.includes(q) || languages.includes(q);
    });

    setFilteredEditors(filtered);
  }, [searchQuery, editors]);

  if (error) return <p className="text-center mt-6 text-red-500">{error}</p>;

  // ✨ Modern shimmer loader
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-gray-800 rounded-xl p-4 flex flex-col items-center text-center overflow-hidden relative"
          >
            {/* Shimmer gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 animate-shimmer-slow"></div>

            {/* Skeleton content */}
            <div className="relative flex flex-col items-center w-full space-y-3">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-700 rounded-full mb-4" />
              <div className="h-4 w-24 bg-gray-700 rounded mb-2" />
              <div className="h-3 w-32 bg-gray-600 rounded mb-2" />
              <div className="h-3 w-40 bg-gray-600 rounded mb-2" />
              <div className="h-3 w-20 bg-gray-700 rounded mb-2" />
              <div className="w-24 h-8 bg-gray-700 rounded-xl" />
            </div>
          </div>
        ))}

        {/* Shimmer animation keyframes */}
        <style>
          {`
            @keyframes shimmer {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(100%); }
            }
            .animate-shimmer-slow {
              background-size: 200% 100%;
              animation: shimmer 1.8s infinite;
            }
          `}
        </style>
      </div>
    );
  }

  // 🧩 Actual editor grid
  return (
    <div className="mt-6">
      {/* Search bar */}
      <div className="flex justify-center mb-8">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            placeholder="Search by name, skills, or languages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full py-3 pl-12 pr-4 border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
          />
          <FaSearch className="absolute left-4 top-3.5 text-gray-400" />
        </div>
      </div>

      {/* Editor cards */}
      {filteredEditors.length === 0 ? (
        <p className="text-center text-gray-500">No editors found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEditors.map((editor) => (
            <div
              key={editor._id}
              className="bg-white rounded-xl shadow-md p-4 flex flex-col items-center text-center hover:shadow-xl transition"
            >
              <div className="relative">
                <img
                  src={
                    editor.user.profilePicture ||
                    "https://randomuser.me/api/portraits/lego/1.jpg"
                  }
                  alt={editor.user.name}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full mb-4 object-cover"
                />
                {editor.online && (
                  <span className="absolute bottom-0 right-0 w-3 sm:w-4 h-3 sm:h-4 bg-green-400 rounded-full border-2 border-white" />
                )}
              </div>
              <h3 className="font-bold text-lg sm:text-xl mb-1">
                {editor.user.name}
              </h3>
              <p className="text-gray-500 mb-2 text-sm sm:text-base">
                <FaUserTie className="inline mr-1" />
                {editor.user.role}{" "}
                {editor.topRated && (
                  <span className="text-blue-500 font-semibold">Top Rated</span>
                )}
                {editor.verified && (
                  <FaCheckCircle className="inline text-green-500 ml-1" />
                )}
              </p>
              <p className="text-gray-600 text-xs sm:text-sm mb-2">
                Skills: {editor.skills.join(", ") || "N/A"}
              </p>
              {editor.rating && (
                <p className="text-yellow-500 font-semibold text-sm sm:text-base mb-2">
                  Rating: {editor.rating} <FaStar className="inline" />
                </p>
              )}
              {editor.price && (
                <p className="font-bold text-sm sm:text-base mb-2">
                  ${editor.price}/hr
                </p>
              )}
              <button className="px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600">
                View Profile
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExploreEditors;
