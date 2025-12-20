// AdminUsers.jsx - User management page with search, filter, and actions
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FaUsers,
  FaSearch,
  FaFilter,
  FaEye,
  FaBan,
  FaCheck,
  FaChevronLeft,
  FaChevronRight,
  FaUserEdit,
  FaExclamationTriangle,
} from "react-icons/fa";
import { useAdmin } from "../../context/AdminContext";
import AdminSidebar from "../../components/admin/AdminSidebar";
import AdminNavbar from "../../components/admin/AdminNavbar";

const AdminUsers = () => {
  const { adminAxios } = useAdmin();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: 20,
        ...(roleFilter !== "all" && { role: roleFilter }),
        ...(search && { search }),
      });
      
      const res = await adminAxios.get(`/admin/users?${params}`);
      if (res.data.success) {
        setUsers(res.data.users);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination({ ...pagination, page: 1 });
    fetchUsers();
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      const res = await adminAxios.patch(`/admin/users/${userId}/status`, {
        isActive: !currentStatus,
      });
      if (res.data.success) {
        setUsers(users.map(u => u._id === userId ? { ...u, isActive: !currentStatus } : u));
      }
    } catch (err) {
      console.error("Failed to toggle user status:", err);
    }
  };

  const ShimmerRow = () => (
    <tr className="animate-pulse">
      <td className="p-4"><div className="h-10 w-10 bg-[#1a1d25] rounded-lg" /></td>
      <td className="p-4"><div className="h-4 w-32 bg-[#1a1d25] rounded" /></td>
      <td className="p-4"><div className="h-4 w-40 bg-[#1a1d25] rounded" /></td>
      <td className="p-4"><div className="h-6 w-16 bg-[#1a1d25] rounded-full" /></td>
      <td className="p-4"><div className="h-4 w-24 bg-[#1a1d25] rounded" /></td>
      <td className="p-4"><div className="h-8 w-20 bg-[#1a1d25] rounded" /></td>
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
              <FaUsers className="text-blue-400" />
              Users Management
            </h1>
            <p className="text-gray-400 text-sm mt-1">{pagination.total} total users</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-[#111319] border border-[#262A3B] rounded-2xl p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-[#0a0a0e] border border-[#262A3B] rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500"
                />
              </div>
            </form>

            {/* Role Filter */}
            <div className="flex items-center gap-2">
              <FaFilter className="text-gray-500" />
              <select
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value); setPagination({ ...pagination, page: 1 }); }}
                className="bg-[#0a0a0e] border border-[#262A3B] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
              >
                <option value="all">All Roles</option>
                <option value="editor">Editors</option>
                <option value="client">Clients</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-[#111319] border border-[#262A3B] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#262A3B] text-left text-gray-400 text-sm">
                  <th className="p-4">User</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Legal</th>
                  <th className="p-4">Joined</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(5)].map((_, i) => <ShimmerRow key={i} />)
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <motion.tr
                      key={user._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-b border-[#262A3B] hover:bg-white/5 transition-colors"
                    >
                      <td className="p-4">
                        <img
                          src={user.profilePicture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                          alt={user.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      </td>
                      <td className="p-4">
                        <p className="font-medium">{user.name}</p>
                        {user.isActive === false && (
                          <span className="text-xs text-red-400 flex items-center gap-1">
                            <FaBan /> Banned
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-gray-400">{user.email}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          user.role === "editor" ? "bg-purple-500/20 text-purple-400" :
                          user.role === "client" ? "bg-blue-500/20 text-blue-400" :
                          "bg-gray-500/20 text-gray-400"
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="p-4">
                        {user.legalAcceptance?.contentPolicyAccepted ? (
                          <span className="text-emerald-400 text-xs flex items-center gap-1">
                            <FaCheck className="text-[10px]" /> Signed
                          </span>
                        ) : (
                          <span className="text-gray-500 text-xs">Pending</span>
                        )}
                      </td>
                      <td className="p-4 text-gray-400 text-sm">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedUser(user)}
                            className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                            title="View Details"
                          >
                            <FaEye />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(user._id, user.isActive !== false)}
                            className={`p-2 rounded-lg transition-colors ${
                              user.isActive !== false
                                ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                                : "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                            }`}
                            title={user.isActive !== false ? "Ban User" : "Unban User"}
                          >
                            {user.isActive !== false ? <FaBan /> : <FaCheck />}
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

        {/* User Detail Modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#111319] border border-[#262A3B] rounded-2xl p-6 max-w-md w-full"
            >
              <div className="flex items-center gap-4 mb-6">
                <img
                  src={selectedUser.profilePicture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                  alt={selectedUser.name}
                  className="w-16 h-16 rounded-xl object-cover"
                />
                <div>
                  <h3 className="text-xl font-bold">{selectedUser.name}</h3>
                  <p className="text-gray-400 text-sm">{selectedUser.email}</p>
                </div>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Role</span>
                  <span className="capitalize">{selectedUser.role}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Profile Complete</span>
                  <span>{selectedUser.profileCompleted ? "Yes" : "No"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Joined</span>
                  <span>{new Date(selectedUser.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Auth Provider</span>
                  <span className="capitalize">{selectedUser.authProvider || "local"}</span>
                </div>

                {selectedUser.legalAcceptance && (
                    <div className="pt-3 border-t border-[#262A3B] mt-3">
                        <p className="text-xs font-semibold text-gray-300 mb-2">Legal Compliance</p>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-400">Content Policy</span>
                            <span className={selectedUser.legalAcceptance.contentPolicyAccepted ? "text-emerald-400" : "text-yellow-400"}>
                                {selectedUser.legalAcceptance.contentPolicyAccepted ? "Accepted" : "Pending"}
                            </span>
                        </div>
                        {selectedUser.legalAcceptance.contentPolicyAccepted && (
                            <>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-400">Date</span>
                                    <span className="text-xs text-mono">{new Date(selectedUser.legalAcceptance.acceptedAt).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">IP Address</span>
                                    <span className="text-xs text-mono">{selectedUser.legalAcceptance.ipAddress || "N/A"}</span>
                                </div>
                            </>
                        )}
                    </div>
                )}
              </div>

              <button
                onClick={() => setSelectedUser(null)}
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

export default AdminUsers;
