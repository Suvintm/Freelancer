// AdminGigs.jsx - Gig management page
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FaBriefcase,
  FaSearch,
  FaFilter,
  FaEye,
  FaToggleOn,
  FaToggleOff,
  FaChevronLeft,
  FaChevronRight,
  FaRupeeSign,
} from "react-icons/fa";
import { useAdmin } from "../../context/AdminContext";
import AdminSidebar from "../../components/admin/AdminSidebar";
import AdminNavbar from "../../components/admin/AdminNavbar";

const AdminGigs = () => {
  const { adminAxios } = useAdmin();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [selectedGig, setSelectedGig] = useState(null);

  useEffect(() => {
    fetchGigs();
  }, [pagination.page, activeFilter]);

  const fetchGigs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: 20,
        ...(activeFilter !== "all" && { isActive: activeFilter }),
        ...(search && { search }),
      });
      
      const res = await adminAxios.get(`/admin/gigs?${params}`);
      if (res.data.success) {
        setGigs(res.data.gigs);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error("Failed to fetch gigs:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination({ ...pagination, page: 1 });
    fetchGigs();
  };

  const handleToggleStatus = async (gigId, currentStatus) => {
    try {
      const res = await adminAxios.patch(`/admin/gigs/${gigId}/status`, {
        isActive: !currentStatus,
      });
      if (res.data.success) {
        setGigs(gigs.map(g => g._id === gigId ? { ...g, isActive: !currentStatus } : g));
      }
    } catch (err) {
      console.error("Failed to toggle gig status:", err);
    }
  };

  const ShimmerRow = () => (
    <tr className="animate-pulse">
      <td className="p-4"><div className="h-12 w-20 bg-[#1a1d25] rounded-lg" /></td>
      <td className="p-4"><div className="h-4 w-48 bg-[#1a1d25] rounded" /></td>
      <td className="p-4"><div className="h-4 w-28 bg-[#1a1d25] rounded" /></td>
      <td className="p-4"><div className="h-4 w-20 bg-[#1a1d25] rounded" /></td>
      <td className="p-4"><div className="h-6 w-16 bg-[#1a1d25] rounded-full" /></td>
      <td className="p-4"><div className="h-8 w-24 bg-[#1a1d25] rounded" /></td>
    </tr>
  );

  return (
    <div className="min-h-screen bg-[#050509] text-white">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <AdminNavbar onMenuClick={() => setSidebarOpen(true)} />

      <main className="md:ml-64 pt-20 px-4 md:px-8 pb-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <FaBriefcase className="text-amber-400" />
              Gigs Management
            </h1>
            <p className="text-gray-400 text-sm mt-1">{pagination.total} total gigs</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-[#111319] border border-[#262A3B] rounded-2xl p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search gigs by title..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-[#0a0a0e] border border-[#262A3B] rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500"
                />
              </div>
            </form>

            <div className="flex items-center gap-2">
              <FaFilter className="text-gray-500" />
              <select
                value={activeFilter}
                onChange={(e) => { setActiveFilter(e.target.value); setPagination({ ...pagination, page: 1 }); }}
                className="bg-[#0a0a0e] border border-[#262A3B] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
              >
                <option value="all">All Gigs</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Gigs Table */}
        <div className="bg-[#111319] border border-[#262A3B] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#262A3B] text-left text-gray-400 text-sm">
                  <th className="p-4">Image</th>
                  <th className="p-4">Title</th>
                  <th className="p-4">Editor</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(5)].map((_, i) => <ShimmerRow key={i} />)
                ) : gigs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      No gigs found
                    </td>
                  </tr>
                ) : (
                  gigs.map((gig) => (
                    <motion.tr
                      key={gig._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-b border-[#262A3B] hover:bg-white/5 transition-colors"
                    >
                      <td className="p-4">
                        <img
                          src={gig.images?.[0] || "https://via.placeholder.com/100"}
                          alt={gig.title}
                          className="w-20 h-12 rounded-lg object-cover"
                        />
                      </td>
                      <td className="p-4">
                        <p className="font-medium truncate max-w-[200px]">{gig.title}</p>
                        <p className="text-xs text-gray-500">{gig.category}</p>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <img
                            src={gig.editor?.profilePicture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                            alt=""
                            className="w-8 h-8 rounded-lg object-cover"
                          />
                          <span className="text-sm">{gig.editor?.name}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="flex items-center gap-1 text-emerald-400">
                          <FaRupeeSign className="text-xs" />
                          {gig.price?.toLocaleString()}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          gig.isActive ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                        }`}>
                          {gig.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedGig(gig)}
                            className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                          >
                            <FaEye />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(gig._id, gig.isActive)}
                            className={`p-2 rounded-lg transition-colors ${
                              gig.isActive
                                ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                                : "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                            }`}
                          >
                            {gig.isActive ? <FaToggleOff /> : <FaToggleOn />}
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-[#262A3B]">
              <p className="text-gray-400 text-sm">
                Page {pagination.page} of {pagination.pages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                  className="p-2 bg-[#1a1d25] rounded-lg text-gray-400 hover:text-white disabled:opacity-50"
                >
                  <FaChevronLeft />
                </button>
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page === pagination.pages}
                  className="p-2 bg-[#1a1d25] rounded-lg text-gray-400 hover:text-white disabled:opacity-50"
                >
                  <FaChevronRight />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Gig Detail Modal */}
        {selectedGig && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#111319] border border-[#262A3B] rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
            >
              {selectedGig.images?.[0] && (
                <img
                  src={selectedGig.images[0]}
                  alt={selectedGig.title}
                  className="w-full h-48 object-cover rounded-xl mb-4"
                />
              )}
              <h3 className="text-xl font-bold mb-4">{selectedGig.title}</h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Price</span>
                  <span className="text-emerald-400">₹{selectedGig.price?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Category</span>
                  <span>{selectedGig.category}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Delivery Time</span>
                  <span>{selectedGig.deliveryTime} days</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Status</span>
                  <span className={selectedGig.isActive ? "text-emerald-400" : "text-red-400"}>
                    {selectedGig.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="pt-4 border-t border-[#262A3B]">
                  <p className="text-gray-400 text-sm mb-2">Description</p>
                  <p className="text-sm">{selectedGig.description}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedGig(null)}
                className="w-full py-3 bg-[#1a1d25] rounded-xl text-gray-400 hover:text-white transition-colors"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminGigs;
