// Settings.jsx - Admin settings page with real API integration
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaCog, FaKey, FaShieldAlt, FaPercent, FaToggleOn, FaToggleOff, FaSave, FaExclamationTriangle, FaSpinner } from "react-icons/fa";
import { useAdmin } from "../context/AdminContext";
import { toast } from "react-toastify";

const Settings = () => {
  const { admin, adminAxios, changePassword, isSuperAdmin } = useAdmin();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Platform settings from API
  const [platformFee, setPlatformFee] = useState(10);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);

  // Fetch settings on mount
  useEffect(() => {
    if (isSuperAdmin) {
      fetchSettings();
    } else {
      setSettingsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuperAdmin]);

  const fetchSettings = async () => {
    try {
      setSettingsLoading(true);
      const res = await adminAxios.get("/admin/settings");
      if (res.data.success) {
        const s = res.data.settings;
        setPlatformFee(s.platformFee || 10);
        setMaintenanceMode(s.maintenanceMode || false);
        setEmailNotifications(s.emailNotificationsEnabled !== false);
      }
    } catch (err) {
      console.error("Failed to fetch settings:", err);
      toast.error("Failed to load settings");
    } finally {
      setSettingsLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    const result = await changePassword(currentPassword, newPassword);
    if (result.success) {
      toast.success("Password changed successfully. Please login again.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      toast.error(result.message);
    }
    setLoading(false);
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      const res = await adminAxios.patch("/admin/settings", {
        platformFee: Number(platformFee),
        maintenanceMode,
        emailNotificationsEnabled: emailNotifications,
      });
      if (res.data.success) {
        toast.success("Settings saved successfully");
      }
    } catch (err) {
      console.error("Failed to save settings:", err);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleMaintenanceToggle = async () => {
    const newValue = !maintenanceMode;
    setMaintenanceMode(newValue);
    
    // Auto-save maintenance mode immediately
    try {
      await adminAxios.patch("/admin/settings", { maintenanceMode: newValue });
      toast.success(`Maintenance mode ${newValue ? "enabled" : "disabled"}`);
    } catch (err) {
      setMaintenanceMode(!newValue); // Revert on error
      toast.error("Failed to toggle maintenance mode");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <FaCog className="text-gray-400" />
          Settings
        </h1>
        <p className="text-gray-400 text-sm mt-1">Manage your account and platform settings</p>
      </div>

      {/* Change Password */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-dark-700 border border-dark-500 rounded-2xl p-6"
      >
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FaKey className="text-amber-400" />
          Change Password
        </h2>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-gray-400 text-sm mb-2">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-dark-800 border border-dark-500 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 text-sm mb-2">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-dark-800 border border-dark-500 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                required
                minLength={8}
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-2">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-dark-800 border border-dark-500 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl text-white font-medium hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50"
          >
            {loading ? "Changing..." : "Change Password"}
          </button>
        </form>
      </motion.div>

      {/* Platform Settings (Superadmin only) */}
      {isSuperAdmin && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-dark-700 border border-dark-500 rounded-2xl p-6"
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FaShieldAlt className="text-purple-400" />
            Platform Settings
            <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full">Superadmin</span>
          </h2>

          {settingsLoading ? (
            <div className="flex items-center justify-center py-8">
              <FaSpinner className="animate-spin text-purple-400 text-2xl" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Platform Fee */}
              <div className="flex items-center justify-between p-4 bg-dark-600 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/20 rounded-lg">
                    <FaPercent className="text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-medium">Platform Fee</p>
                    <p className="text-gray-500 text-sm">Commission on each transaction</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={platformFee}
                    onChange={(e) => setPlatformFee(e.target.value)}
                    className="w-20 bg-dark-700 border border-dark-500 rounded-lg px-3 py-2 text-center text-white focus:outline-none focus:border-purple-500"
                  />
                  <span className="text-gray-400">%</span>
                </div>
              </div>

              {/* Maintenance Mode */}
              <div className="flex items-center justify-between p-4 bg-dark-600 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/20 rounded-lg">
                    <FaExclamationTriangle className="text-amber-400" />
                  </div>
                  <div>
                    <p className="font-medium">Maintenance Mode</p>
                    <p className="text-gray-500 text-sm">Temporarily disable user access</p>
                  </div>
                </div>
                <button
                  onClick={handleMaintenanceToggle}
                  className={`p-2 rounded-lg transition-colors ${
                    maintenanceMode
                      ? "bg-amber-500/20 text-amber-400"
                      : "bg-dark-700 text-gray-500"
                  }`}
                >
                  {maintenanceMode ? <FaToggleOn size={24} /> : <FaToggleOff size={24} />}
                </button>
              </div>

              {maintenanceMode && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                  <p className="text-amber-400 text-sm">
                    ⚠️ Maintenance mode is ON. Users will see a maintenance page instead of the main site.
                  </p>
                </div>
              )}

              {/* Email Notifications */}
              <div className="flex items-center justify-between p-4 bg-dark-600 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <FaCog className="text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-gray-500 text-sm">Receive alerts for important events</p>
                  </div>
                </div>
                <button
                  onClick={() => setEmailNotifications(!emailNotifications)}
                  className={`p-2 rounded-lg transition-colors ${
                    emailNotifications
                      ? "bg-blue-500/20 text-blue-400"
                      : "bg-dark-700 text-gray-500"
                  }`}
                >
                  {emailNotifications ? <FaToggleOn size={24} /> : <FaToggleOff size={24} />}
                </button>
              </div>

              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl text-white font-medium hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50"
              >
                {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
                {saving ? "Saving..." : "Save Settings"}
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* Account Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-dark-700 border border-dark-500 rounded-2xl p-6"
      >
        <h2 className="text-lg font-semibold mb-4">Account Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-dark-600 rounded-xl">
            <p className="text-gray-500 text-sm">Name</p>
            <p className="font-medium">{admin?.name}</p>
          </div>
          <div className="p-4 bg-dark-600 rounded-xl">
            <p className="text-gray-500 text-sm">Email</p>
            <p className="font-medium">{admin?.email}</p>
          </div>
          <div className="p-4 bg-dark-600 rounded-xl">
            <p className="text-gray-500 text-sm">Role</p>
            <p className="font-medium capitalize">{admin?.role}</p>
          </div>
          <div className="p-4 bg-dark-600 rounded-xl">
            <p className="text-gray-500 text-sm">Last Login</p>
            <p className="font-medium">{admin?.lastLogin ? new Date(admin.lastLogin).toLocaleString() : "Never"}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Settings;
