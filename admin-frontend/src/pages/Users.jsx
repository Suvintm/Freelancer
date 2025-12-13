// Users.jsx - User management page
import { useState, useEffect, useCallback } from "react";
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
  FaDownload,
} from "react-icons/fa";
import { useAdmin } from "../context/AdminContext";
import { toast } from "react-toastify";

const Users = () => {
  const { adminAxios } = useAdmin();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);

  const fetchUsers = useCallback(async () => {
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
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  }, [adminAxios, pagination.page, roleFilter, search]);

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, roleFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination({ ...pagination, page: 1 });
    fetchUsers();
  };

  const handleToggleStatus = async (userId, isBanned) => {
    try {
      const res = await adminAxios.patch(`/admin/users/${userId}/status`, {
        isBanned: !isBanned, // Toggle the ban status
        banReason: !isBanned ? "Banned by admin" : null,
      });
      if (res.data.success) {
        setUsers(users.map(u => u._id === userId ? { ...u, isBanned: !isBanned } : u));
        toast.success(res.data.message);
      }
    } catch (err) {
      toast.error("Failed to update user status");
    }
  };

  const toggleSelectUser = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const selectAllUsers = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(u => u._id));
    }
  };

  const exportToCSV = () => {
    const headers = ["Name", "Email", "Role", "Status", "Joined"];
    const data = users.map(u => [
      u.name,
      u.email,
      u.role,
      u.isBanned ? "Banned" : "Active",
      new Date(u.createdAt).toLocaleDateString(),
    ]);
    
    const csv = [headers.join(","), ...data.map(row => row.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    toast.success("Exported to CSV");
  };

  const ShimmerRow = () => (
    <tr className="animate-pulse">
      <td className="p-4"><div className="w-5 h-5 shimmer rounded" /></td>
      <td className="p-4"><div className="h-10 w-10 shimmer rounded-lg" /></td>
      <td className="p-4"><div className="h-4 w-32 shimmer rounded" /></td>
      <td className="p-4"><div className="h-4 w-40 shimmer rounded" /></td>
      <td className="p-4"><div className="h-6 w-16 shimmer rounded-full" /></td>
      <td className="p-4"><div className="h-4 w-24 shimmer rounded" /></td>
      <td className="p-4"><div className="h-8 w-20 shimmer rounded" /></td>
    </tr>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <FaUsers className="text-blue-400" />
            Users Management
          </h1>
          <p className="text-gray-400 text-sm mt-1">{pagination.total} total users</p>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500/30 transition-colors border border-emerald-500/30"
        >
          <FaDownload />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-dark-700 border border-dark-500 rounded-2xl p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-dark-800 border border-dark-500 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500"
              />
            </div>
          </form>

          <div className="flex items-center gap-2">
            <FaFilter className="text-gray-500" />
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPagination({ ...pagination, page: 1 }); }}
              className="bg-dark-800 border border-dark-500 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
            >
              <option value="all">All Roles</option>
              <option value="editor">Editors</option>
              <option value="client">Clients</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 flex items-center justify-between"
        >
          <span className="text-purple-400">{selectedUsers.length} users selected</span>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30">
              Ban Selected
            </button>
            <button onClick={() => setSelectedUsers([])} className="px-4 py-2 bg-dark-600 text-gray-400 rounded-lg hover:text-white">
              Clear
            </button>
          </div>
        </motion.div>
      )}

      {/* Users Table */}
      <div className="bg-dark-700 border border-dark-500 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-500 text-left text-gray-400 text-sm">
                <th className="p-4">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === users.length && users.length > 0}
                    onChange={selectAllUsers}
                    className="rounded border-dark-500"
                  />
                </th>
                <th className="p-4">User</th>
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Role</th>
                <th className="p-4">Joined</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => <ShimmerRow key={i} />)
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <motion.tr
                    key={user._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`border-b border-dark-500 hover:bg-white/5 transition-colors ${
                      selectedUsers.includes(user._id) ? "bg-purple-500/10" : ""
                    }`}
                  >
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user._id)}
                        onChange={() => toggleSelectUser(user._id)}
                        className="rounded border-dark-500"
                      />
                    </td>
                    <td className="p-4">
                      <img
                        src={user.profilePicture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                        alt={user.name}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                    </td>
                    <td className="p-4">
                      <p className="font-medium">{user.name}</p>
                      {user.isBanned && (
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
                          onClick={() => handleToggleStatus(user._id, user.isBanned)}
                          className={`p-2 rounded-lg transition-colors ${
                            !user.isBanned
                              ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                              : "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                          }`}
                          title={!user.isBanned ? "Ban User" : "Unban User"}
                        >
                          {!user.isBanned ? <FaBan /> : <FaCheck />}
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
          <div className="flex items-center justify-between p-4 border-t border-dark-500">
            <p className="text-gray-400 text-sm">
              Page {pagination.page} of {pagination.pages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
                className="p-2 bg-dark-600 rounded-lg text-gray-400 hover:text-white disabled:opacity-50"
              >
                <FaChevronLeft />
              </button>
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page === pagination.pages}
                className="p-2 bg-dark-600 rounded-lg text-gray-400 hover:text-white disabled:opacity-50"
              >
                <FaChevronRight />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedUser(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-dark-700 border border-dark-500 rounded-2xl p-6 max-w-md w-full"
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
              <div className="flex justify-between text-sm p-3 bg-dark-600 rounded-lg">
                <span className="text-gray-400">Role</span>
                <span className="capitalize">{selectedUser.role}</span>
              </div>
              <div className="flex justify-between text-sm p-3 bg-dark-600 rounded-lg">
                <span className="text-gray-400">Profile Complete</span>
                <span>{selectedUser.profileCompleted ? "Yes" : "No"}</span>
              </div>
              <div className="flex justify-between text-sm p-3 bg-dark-600 rounded-lg">
                <span className="text-gray-400">Joined</span>
                <span>{new Date(selectedUser.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between text-sm p-3 bg-dark-600 rounded-lg">
                <span className="text-gray-400">Auth Provider</span>
                <span className="capitalize">{selectedUser.authProvider || "local"}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedUser(null)}
              className="w-full py-3 bg-dark-600 rounded-xl text-gray-400 hover:text-white transition-colors"
            >
              Close
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Users;
