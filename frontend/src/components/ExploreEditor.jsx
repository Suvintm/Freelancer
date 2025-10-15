import { useState, useEffect, useRef, createRef } from "react";
import axios from "axios";
import {
  FaStar,
  FaCheckCircle,
  FaUserTie,
  FaSearch,
  FaGlobe,
  FaArrowLeft,
  FaCode,
  FaArrowRight,
} from "react-icons/fa";
import { useAppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";


const ExploreEditors = () => {
  const { backendURL, user } = useAppContext();
  const [editors, setEditors] = useState([]);
  const [filteredEditors, setFilteredEditors] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Refs for scrollable sections
  const skillsRefs = useRef({});
  const langsRefs = useRef({});


  const navigate = useNavigate();


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
      const name = (editor.user?.name || "").toLowerCase();
      const skills = (editor.skills || []).join(" ").toLowerCase();
      const languages = (editor.languages || []).join(" ").toLowerCase();
      return name.includes(q) || skills.includes(q) || languages.includes(q);
    });
    setFilteredEditors(filtered);
  }, [searchQuery, editors]);

  const scrollBar = (ref, direction) => {
    if (ref?.current) {
      ref.current.scrollBy({
        left: direction === "left" ? -150 : 150,
        behavior: "smooth",
      });
    }
  };

  if (error) return <p className="text-center mt-6 text-red-500">{error}</p>;

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-gray-100 rounded-2xl p-6 flex items-center space-x-4 animate-pulse"
          >
            <div className="w-20 h-20 bg-gray-300 rounded-full" />
            <div className="flex-1 space-y-3">
              <div className="h-4 w-32 bg-gray-300 rounded" />
              <div className="h-3 w-48 bg-gray-200 rounded" />
              <div className="h-3 w-40 bg-gray-200 rounded" />
              <div className="h-8 w-24 bg-gray-300 rounded-full mt-2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

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
            className="w-full py-3 pl-12 pr-4 border border-gray-500 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition"
          />
          <FaSearch className="absolute left-4 top-3.5 text-gray-800" />
        </div>
      </div>

      {/* Editor cards */}
      {filteredEditors.length === 0 ? (
        <p className="text-center text-gray-500">No editors found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEditors.map((editor) => {
            // Initialize non-hook refs (createRef is safe to call conditionally)
            if (!skillsRefs.current[editor._id])
              skillsRefs.current[editor._id] = createRef();
            if (!langsRefs.current[editor._id])
              langsRefs.current[editor._id] = createRef();

            return (
              <div
                key={editor._id}
                className="bg-white rounded-2xl shadow-lg p-4 hover:shadow-2xl transition"
              >
                {/* Top Section */}
                <div className="flex items-center space-x-4">
                  <div className="flex flex-col items-center w-1/3 space-y-2">
                    <div className="relative">
                      <img
                        src={
                          editor.user?.profilePicture ||
                          "https://randomuser.me/api/portraits/lego/1.jpg"
                        }
                        alt={editor.user?.name}
                        className="w-24 h-24 rounded-full object-cover border-2 border-green-500"
                      />
                      {editor.online && (
                        <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white" />
                      )}
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col justify-between pl-4">
                    <div>
                      <h3 className="font-semibold text-lg text-black items-start text-center">
                        {editor.user?.name}
                      </h3>
                      <p className="flex items-center gap-2 text-gray-600 text-sm sm:text-base mb-1">
                        <FaUserTie /> {editor.user?.role}{" "}
                        {editor.topRated && (
                          <span className="text-blue-500 font-semibold ml-1">
                            Top Rated
                          </span>
                        )}
                        {editor.verified && (
                          <FaCheckCircle className="text-green-500 ml-1" />
                        )}
                      </p>
                      {editor.country && (
                        <p className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                          <FaGlobe /> {editor.country}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => navigate(`/editor/${editor.user?._id}`)}
                      className="mt-2 w-full py-2 bg-green-500 text-white font-medium rounded-xl hover:bg-green-600 transition"
                    >
                      View Profile
                    </button>
                  </div>
                </div>

                {/* Bottom Section: Scrollable Bars */}
                <div className="mt-4 space-y-2">
                  {/* Languages */}
                  {editor.languages && editor.languages.length > 0 && (
                    <div>
                      <p className="text-gray-500 flex gap-2 flex-row items-center  text-sm mb-1">
                        {" "}
                        <FaGlobe /> Languages:
                      </p>
                      <div className="relative flex items-center">
                        <button
                          onClick={() =>
                            scrollBar(langsRefs.current[editor._id], "left")
                          }
                          className="absolute left-0 z-10 p-1 bg-white rounded-full shadow hover:bg-gray-100"
                        >
                          <FaArrowLeft />
                        </button>
                        <div
                          ref={langsRefs.current[editor._id]}
                          className="flex space-x-2 overflow-x-auto py-1 px-6"
                        >
                          {editor.languages.map((lang, idx) => (
                            <span
                              key={idx}
                              className="flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full whitespace-nowrap text-sm shadow-sm"
                            >
                              {lang}
                            </span>
                          ))}
                        </div>
                        <button
                          onClick={() =>
                            scrollBar(langsRefs.current[editor._id], "right")
                          }
                          className="absolute right-0 z-10 p-1 bg-white rounded-full shadow hover:bg-gray-100"
                        >
                          <FaArrowRight />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Skills */}
                  {editor.skills && editor.skills.length > 0 && (
                    <div>
                      <p className="text-gray-500 text-sm mb-1 items-center flex flex-row gap-2">
                        {" "}
                        <FaCode className="text-green-500" /> Skills:
                      </p>
                      <div className="relative flex items-center">
                        <button
                          onClick={() =>
                            scrollBar(skillsRefs.current[editor._id], "left")
                          }
                          className="absolute left-0 z-10 p-1 bg-white rounded-full shadow hover:bg-gray-100"
                        >
                          <FaArrowLeft />
                        </button>
                        <div
                          ref={skillsRefs.current[editor._id]}
                          className="flex space-x-2 overflow-x-auto py-1 px-6"
                        >
                          {editor.skills.map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-green-100 text-green-800 rounded-full whitespace-nowrap text-sm shadow-sm"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                        <button
                          onClick={() =>
                            scrollBar(skillsRefs.current[editor._id], "right")
                          }
                          className="absolute right-0 z-10 p-1 bg-white rounded-full shadow hover:bg-gray-100"
                        >
                          <FaArrowRight />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ExploreEditors;
