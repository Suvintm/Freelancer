import { useState, useEffect, useRef, createRef } from "react";
import axios from "axios";
import {
  FaCheckCircle,
  FaUserTie,
  FaSearch,
  FaGlobe,
  FaArrowLeft,
  FaCode,
  FaArrowRight,
  FaUsers,
} from "react-icons/fa";
import { useAppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import EmptyState from "./EmptyState.jsx";

const ExploreEditors = () => {
  const { backendURL, user } = useAppContext();
  const [editors, setEditors] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 1,
  });

  // Refs for scrollable sections
  const skillsRefs = useRef({});
  const langsRefs = useRef({});

  const navigate = useNavigate();

  const fetchEditors = async (page = 1, search = "") => {
    try {
      setLoading(true);
      const token = user?.token || JSON.parse(localStorage.getItem("user"))?.token;

      const params = new URLSearchParams({
        page: page.toString(),
        limit: "12",
        ...(search && { search }),
      });

      const res = await axios.get(`${backendURL}/api/explore/editors?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      setEditors(res.data.editors || []);
      setPagination(res.data.pagination || { page: 1, limit: 12, total: 0, pages: 1 });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to fetch editors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEditors(1, "");
  }, [backendURL, user]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEditors(1, searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      fetchEditors(newPage, searchQuery);
    }
  };

  const scrollBar = (ref, direction) => {
    if (ref?.current) {
      ref.current.scrollBy({
        left: direction === "left" ? -150 : 150,
        behavior: "smooth",
      });
    }
  };

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={() => fetchEditors(1, "")}
          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-gray-50 rounded-2xl p-6 flex items-center space-x-4 animate-pulse"
          >
            <div className="w-20 h-20 bg-gray-200 rounded-full" />
            <div className="flex-1 space-y-3">
              <div className="h-4 w-32 bg-gray-200 rounded" />
              <div className="h-3 w-48 bg-gray-200 rounded" />
              <div className="h-3 w-40 bg-gray-200 rounded" />
              <div className="h-8 w-24 bg-gray-200 rounded-full mt-2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Search bar */}
      <div className="flex justify-center mb-8">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            placeholder="Search by name, skills, or languages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full py-3 pl-12 pr-4 border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition"
          />
          <FaSearch className="absolute left-4 top-3.5 text-gray-400" />
        </div>
      </div>

      {/* Results count */}
      <p className="text-gray-500 text-sm mb-4 text-center">
        {pagination.total} editor{pagination.total !== 1 ? "s" : ""} found
      </p>

      {/* Editor cards */}
      {editors.length === 0 ? (
        <EmptyState
          icon={FaUsers}
          title="No editors found"
          description={
            searchQuery
              ? "Try adjusting your search terms"
              : "No editors have completed their profiles yet"
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {editors.map((editor) => {
              if (!skillsRefs.current[editor._id])
                skillsRefs.current[editor._id] = createRef();
              if (!langsRefs.current[editor._id])
                langsRefs.current[editor._id] = createRef();

              return (
                <div
                  key={editor._id}
                  className="bg-white rounded-2xl shadow-md hover:shadow-lg p-4 transition-all border border-gray-100"
                >
                  {/* Top Section */}
                  <div className="flex items-start gap-4">
                    <div className="relative flex-shrink-0">
                      <img
                        src={
                          editor.user?.profilePicture ||
                          "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                        }
                        alt={editor.user?.name}
                        className="w-20 h-20 rounded-full object-cover border-2 border-green-500"
                      />
                      {editor.online && (
                        <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg text-gray-800 truncate">
                        {editor.user?.name}
                      </h3>
                      <p className="flex items-center gap-2 text-gray-600 text-sm">
                        <FaUserTie className="text-green-500" />
                        <span className="capitalize">{editor.user?.role}</span>
                        {editor.verified && (
                          <FaCheckCircle className="text-green-500" title="Verified" />
                        )}
                      </p>
                      {editor.location?.country && (
                        <p className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                          <FaGlobe /> {editor.location.country}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Skills & Languages */}
                  <div className="mt-4 space-y-3">
                    {/* Languages */}
                    {editor.languages?.length > 0 && (
                      <div>
                        <p className="text-gray-500 flex gap-1 items-center text-xs mb-1">
                          <FaGlobe className="text-blue-500" /> Languages
                        </p>
                        <div className="relative flex items-center">
                          <button
                            onClick={() => scrollBar(langsRefs.current[editor._id], "left")}
                            className="absolute left-0 z-10 p-1 bg-white rounded-full shadow hover:bg-gray-100 text-xs"
                          >
                            <FaArrowLeft />
                          </button>
                          <div
                            ref={langsRefs.current[editor._id]}
                            className="flex gap-1 overflow-x-auto py-1 px-6 scrollbar-hide"
                          >
                            {editor.languages.filter(Boolean).map((lang, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full whitespace-nowrap text-xs"
                              >
                                {lang}
                              </span>
                            ))}
                          </div>
                          <button
                            onClick={() => scrollBar(langsRefs.current[editor._id], "right")}
                            className="absolute right-0 z-10 p-1 bg-white rounded-full shadow hover:bg-gray-100 text-xs"
                          >
                            <FaArrowRight />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Skills */}
                    {editor.skills?.length > 0 && (
                      <div>
                        <p className="text-gray-500 text-xs mb-1 flex items-center gap-1">
                          <FaCode className="text-green-500" /> Skills
                        </p>
                        <div className="relative flex items-center">
                          <button
                            onClick={() => scrollBar(skillsRefs.current[editor._id], "left")}
                            className="absolute left-0 z-10 p-1 bg-white rounded-full shadow hover:bg-gray-100 text-xs"
                          >
                            <FaArrowLeft />
                          </button>
                          <div
                            ref={skillsRefs.current[editor._id]}
                            className="flex gap-1 overflow-x-auto py-1 px-6 scrollbar-hide"
                          >
                            {editor.skills.filter(Boolean).map((skill, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full whitespace-nowrap text-xs"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                          <button
                            onClick={() => scrollBar(skillsRefs.current[editor._id], "right")}
                            className="absolute right-0 z-10 p-1 bg-white rounded-full shadow hover:bg-gray-100 text-xs"
                          >
                            <FaArrowRight />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* View Profile Button */}
                  <button
                    onClick={() => navigate(`/editor/${editor.user?._id}`)}
                    className="mt-4 w-full py-2 bg-green-500 text-white font-medium rounded-xl hover:bg-green-600 transition"
                  >
                    View Profile
                  </button>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-gray-600">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ExploreEditors;
