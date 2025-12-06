import { useState, useEffect } from "react";
import axios from "axios";
import {
  FaCheckCircle,
  FaStar,
  FaSearch,
  FaMapMarkerAlt,
  FaCode,
  FaGlobe,
  FaUsers,
  FaChevronLeft,
  FaChevronRight,
  FaAward,
  FaBriefcase,
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

  if (error) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">⚠️</span>
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Oops! Something went wrong</h3>
        <p className="text-gray-500 mb-6">{error}</p>
        <button
          onClick={() => fetchEditors(1, "")}
          className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2.5 rounded-full font-medium hover:shadow-lg transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh]">
      {/* Header Section */}
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
          Find Your Perfect Editor
        </h2>
        <p className="text-gray-500">
          Discover talented video editors ready to bring your vision to life
        </p>
      </div>

      {/* Search Bar */}
      <div className="flex justify-center mb-8">
        <div className="relative w-full max-w-xl">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <FaSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by name, skills, or languages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full py-3.5 pl-12 pr-4 bg-white border border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all text-gray-700 placeholder-gray-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Results Info */}
      <div className="flex items-center justify-between mb-6 px-1">
        <p className="text-gray-500 text-sm">
          <span className="font-semibold text-gray-700">{pagination.total}</span> editor
          {pagination.total !== 1 ? "s" : ""} found
        </p>
        {pagination.pages > 1 && (
          <p className="text-gray-400 text-sm">
            Page {pagination.page} of {pagination.pages}
          </p>
        )}
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 animate-pulse shadow-sm border border-gray-100">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-28 bg-gray-200 rounded" />
                  <div className="h-3 w-20 bg-gray-200 rounded" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-3 w-full bg-gray-200 rounded" />
                <div className="h-3 w-3/4 bg-gray-200 rounded" />
              </div>
              <div className="flex gap-2 mt-4">
                <div className="h-6 w-16 bg-gray-200 rounded-full" />
                <div className="h-6 w-20 bg-gray-200 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : editors.length === 0 ? (
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
          {/* Editor Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {editors.map((editor) => (
              <EditorCard key={editor._id} editor={editor} navigate={navigate} />
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-10">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <FaChevronLeft className="text-sm" />
              </button>

              {/* Page Numbers */}
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  let pageNum;
                  if (pagination.pages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.page >= pagination.pages - 2) {
                    pageNum = pagination.pages - 4 + i;
                  } else {
                    pageNum = pagination.page - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-10 h-10 rounded-full font-medium transition-all ${pagination.page === pageNum
                          ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md"
                          : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <FaChevronRight className="text-sm" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Premium Editor Card Component
const EditorCard = ({ editor, navigate }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Generate a random rating for display (you can replace with real data later)
  const rating = (4 + Math.random()).toFixed(1);
  const reviewCount = Math.floor(Math.random() * 50) + 5;

  return (
    <div
      className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Top Gradient Banner */}
      <div className="h-20 bg-gradient-to-br from-green-400 via-emerald-500 to-teal-500 relative">
        {/* Decorative Pattern */}
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <circle cx="5" cy="5" r="1" fill="white" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>

        {/* Verified Badge */}
        {editor.verified && (
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 text-xs font-medium text-green-600">
            <FaCheckCircle /> Verified
          </div>
        )}
      </div>

      {/* Profile Picture - Overlapping */}
      <div className="relative px-5 -mt-10">
        <div className="relative inline-block">
          <img
            src={
              editor.user?.profilePicture ||
              "https://cdn-icons-png.flaticon.com/512/149/149071.png"
            }
            alt={editor.user?.name}
            className="w-20 h-20 rounded-xl object-cover border-4 border-white shadow-lg group-hover:scale-105 transition-transform duration-300"
          />
          {/* Online Indicator */}
          <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-3 border-white shadow-sm" />
        </div>
      </div>

      {/* Content */}
      <div className="px-5 pt-3 pb-5">
        {/* Name & Role */}
        <div className="mb-3">
          <h3 className="font-bold text-lg text-gray-800 group-hover:text-green-600 transition-colors line-clamp-1">
            {editor.user?.name}
          </h3>
          <p className="text-gray-500 text-sm flex items-center gap-1.5">
            <FaBriefcase className="text-green-500 text-xs" />
            <span className="capitalize">{editor.user?.role || "Video Editor"}</span>
          </p>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg">
            <FaStar className="text-amber-400 text-sm" />
            <span className="font-semibold text-gray-800 text-sm">{rating}</span>
          </div>
          <span className="text-gray-400 text-xs">({reviewCount} reviews)</span>
        </div>

        {/* Location */}
        {editor.location?.country && (
          <div className="flex items-center gap-1.5 text-gray-500 text-sm mb-3">
            <FaMapMarkerAlt className="text-green-500 text-xs" />
            <span>{editor.location.country}</span>
          </div>
        )}

        {/* Skills */}
        {editor.skills?.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-gray-400 mb-1.5 flex items-center gap-1">
              <FaCode className="text-green-500" /> Skills
            </p>
            <div className="flex flex-wrap gap-1.5">
              {editor.skills.filter(Boolean).slice(0, 4).map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 rounded-lg text-xs font-medium border border-green-100"
                >
                  {skill}
                </span>
              ))}
              {editor.skills.filter(Boolean).length > 4 && (
                <span className="px-2.5 py-1 bg-gray-100 text-gray-500 rounded-lg text-xs font-medium">
                  +{editor.skills.filter(Boolean).length - 4}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Languages */}
        {editor.languages?.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-400 mb-1.5 flex items-center gap-1">
              <FaGlobe className="text-blue-500" /> Languages
            </p>
            <div className="flex flex-wrap gap-1.5">
              {editor.languages.filter(Boolean).slice(0, 3).map((lang, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium border border-blue-100"
                >
                  {lang}
                </span>
              ))}
              {editor.languages.filter(Boolean).length > 3 && (
                <span className="px-2.5 py-1 bg-gray-100 text-gray-500 rounded-lg text-xs font-medium">
                  +{editor.languages.filter(Boolean).length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Experience Badge */}
        {editor.experience && (
          <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
            <FaAward className="text-purple-500" />
            <span className="text-purple-700 text-sm font-medium">{editor.experience} Experience</span>
          </div>
        )}

        {/* View Profile Button */}
        <button
          onClick={() => navigate(`/editor/${editor.user?._id}`)}
          className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-sm hover:shadow-lg active:scale-[0.98]"
        >
          View Profile
        </button>
      </div>

      {/* Hover Glow Effect */}
      <div
        className={`absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-300 ${isHovered ? "opacity-100" : "opacity-0"
          }`}
        style={{
          boxShadow: "inset 0 0 0 2px rgba(34, 197, 94, 0.3)",
        }}
      />
    </div>
  );
};

export default ExploreEditors;
