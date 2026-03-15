import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  HiOutlineCog6Tooth, HiOutlineUserCircle, HiOutlineShieldCheck, 
  HiOutlineCreditCard, HiOutlineServer, HiOutlineKey, HiOutlineDevicePhoneMobile,
  HiOutlineExclamationTriangle, HiOutlineCheckCircle, HiOutlineGlobeAlt,
  HiOutlineBell, HiOutlineCircleStack, HiOutlineArchiveBox, HiOutlineLockClosed
} from "react-icons/hi2";
import { toast } from "react-hot-toast";

import { useAdmin } from "../context/AdminContext";
import { settingsApi, authApi } from "../api/adminApi";
import PageHeader from "../components/ui/PageHeader";
import Badge from "../components/ui/Badge";
import { formatDate } from "../utils/formatters";

const Settings = () => {
  const { admin, changePassword, isSuperAdmin } = useAdmin();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("account");

  // ── Password State ───────────────────────────────────────────────────────
  const [passwordForm, setPasswordForm] = useState({
    current: "",
    new: "",
    confirm: ""
  });

  // ── Queries ──────────────────────────────────────────────────────────────
  
  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: () => settingsApi.get().then(res => res.data.settings),
    enabled: activeTab === "general" && isSuperAdmin
  });

  const { data: sessionsData, isLoading: sessionsLoading } = useQuery({
    queryKey: ["admin-sessions"],
    queryFn: () => authApi.getSessions().then(res => res.data.sessions),
    enabled: activeTab === "account"
  });

  // ── Mutations ────────────────────────────────────────────────────────────

  const updateSettingsMutation = useMutation({
    mutationFn: (data) => settingsApi.update(data),
    onSuccess: () => {
      toast.success("Platform settings updated");
      queryClient.invalidateQueries(["admin-settings"]);
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to update settings")
  });

  const revokeSessionMutation = useMutation({
    mutationFn: (sessionId) => authApi.revokeSession(sessionId),
    onSuccess: () => {
      toast.success("Session revoked successfully");
      queryClient.invalidateQueries(["admin-sessions"]);
    }
  });

  const maintenanceMutation = useMutation({
    mutationFn: (data) => settingsApi.update(data),
    onSuccess: (res) => {
        toast.success("Maintenance status updated");
        queryClient.invalidateQueries(["admin-settings"]);
    }
  });

  const updateNotifMutation = useMutation({
    mutationFn: (prefs) => authApi.updateNotifications(prefs),
    onSuccess: () => {
        toast.success("Notification preferences saved");
        queryClient.invalidateQueries(["admin-verify"]); // Or wherever admin data is stored
    }
  });

  // ── Handlers ────────────────────────────────────────────────────────────

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.new !== passwordForm.confirm) {
      return toast.error("Passwords do not match");
    }
    const res = await changePassword(passwordForm.current, passwordForm.new);
    if (res.success) {
      toast.success("Security updated. Please re-authenticate.");
      setPasswordForm({ current: "", new: "", confirm: "" });
    } else {
      toast.error(res.message);
    }
  };

  const tabs = [
    { id: "account", label: "My Account", icon: HiOutlineUserCircle },
    { id: "general", label: "General", icon: HiOutlineCog6Tooth, superOnly: true },
    { id: "notifications", label: "Alerts", icon: HiOutlineBell },
    { id: "storage", label: "Storage", icon: HiOutlineArchiveBox, superOnly: true },
  ];

  const visibleTabs = tabs.filter(t => !t.superOnly || isSuperAdmin);

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Control Center" 
        subtitle="Configure administrative preferences, manage active sessions, and verify system integrity."
        icon={HiOutlineCog6Tooth}
      />

      <div className="flex flex-col lg:flex-row gap-8">
        {/* ── Sidebar Navigation ─────────────────────────────────────── */}
        <aside className="lg:w-64 space-y-1">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all group ${
                activeTab === tab.id 
                  ? "bg-brand text-white shadow-lg shadow-brand/20" 
                  : "text-muted hover:bg-elevated hover:text-primary"
              }`}
            >
              <tab.icon size={20} className={activeTab === tab.id ? "text-white" : "text-muted group-hover:text-brand"} />
              {tab.label}
            </button>
          ))}
        </aside>

        {/* ── Main Content Area ───────────────────────────────────────── */}
        <main className="flex-1 space-y-6">
          <AnimatePresence mode="wait">
            {activeTab === "account" && (
              <motion.div 
                key="account"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                {/* Profile Overview */}
                <div className="card p-6 flex flex-col md:flex-row gap-6 items-center">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-3xl bg-brand/10 border-4 border-surface shadow-xl flex items-center justify-center">
                            <HiOutlineUserCircle size={48} className="text-brand" />
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-success border-4 border-surface shadow-sm" />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h2 className="text-xl font-black text-primary">{admin?.name}</h2>
                        <p className="text-sm text-muted mb-3">{admin?.email}</p>
                        <div className="flex flex-wrap justify-center md:justify-start gap-2">
                            <Badge label={admin?.role} variant="indigo" solid />
                            <Badge label="Identity Verified" variant="green" />
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Security Update */}
                    <div className="card p-6 space-y-6">
                        <div className="flex items-center gap-3 border-b border-default pb-4">
                            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500"><HiOutlineLockClosed size={20}/></div>
                            <h3 className="font-black text-primary uppercase tracking-tight">Access Security</h3>
                        </div>
                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black uppercase text-muted mb-1.5 block">Current Password</label>
                                <input 
                                  type="password" 
                                  className="input-field py-2.5" 
                                  placeholder="••••••••"
                                  value={passwordForm.current}
                                  onChange={(e) => setPasswordForm({...passwordForm, current: e.target.value})}
                                  required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-muted mb-1.5 block">New Password</label>
                                    <input 
                                      type="password" 
                                      className="input-field py-2.5" 
                                      placeholder="••••••••"
                                      value={passwordForm.new}
                                      onChange={(e) => setPasswordForm({...passwordForm, new: e.target.value})}
                                      required
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-muted mb-1.5 block">Re-Enter</label>
                                    <input 
                                      type="password" 
                                      className="input-field py-2.5" 
                                      placeholder="••••••••"
                                      value={passwordForm.confirm}
                                      onChange={(e) => setPasswordForm({...passwordForm, confirm: e.target.value})}
                                      required
                                    />
                                </div>
                            </div>
                            <button type="submit" className="btn-primary w-full py-3 font-black uppercase tracking-widest text-[10px]">
                                Invalidate Existing Sessions & Update
                            </button>
                        </form>
                    </div>

                    {/* Active Sessions */}
                    <div className="card p-6 space-y-6">
                         <div className="flex items-center gap-3 border-b border-default pb-4">
                            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500"><HiOutlineDevicePhoneMobile size={20}/></div>
                            <h3 className="font-black text-primary uppercase tracking-tight">Active Sessions</h3>
                        </div>
                        <div className="space-y-3">
                            {sessionsLoading ? (
                                [1,2].map(i => <div key={i} className="h-14 w-full bg-elevated animate-pulse rounded-xl" />)
                            ) : sessionsData?.map((sess) => (
                                <div key={sess._id} className="p-3 bg-surface border border-default rounded-xl flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="text-muted"><HiOutlineGlobeAlt size={20}/></div>
                                        <div>
                                            <div className="text-xs font-bold text-primary">{sess.ip}</div>
                                            <div className="text-[10px] text-muted">First used: {formatDate(sess.createdAt)}</div>
                                        </div>
                                    </div>
                                    {sess.current ? (
                                        <Badge label="Current" variant="blue" />
                                    ) : (
                                        <button 
                                          onClick={() => revokeSessionMutation.mutate(sess._id)}
                                          className="text-[10px] font-black text-danger hover:underline"
                                        >
                                            Revoke
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
              </motion.div>
            )}

            {activeTab === "general" && isSuperAdmin && (
              <motion.div 
                key="general"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="card p-8 space-y-10">
                    {/* Platform Configuration */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-3 border-b border-default pb-4">
                            <HiOutlineCog6Tooth size={20} className="text-brand"/>
                            <h3 className="font-black text-primary uppercase tracking-widest text-xs">Platform Governance</h3>
                        </div>
                        <div className="grid md:grid-cols-2 gap-8">
                             <div className="space-y-2">
                                <label className="text-sm font-bold text-primary block">Platform Commission Fee</label>
                                <p className="text-xs text-muted leading-relaxed">Percentage cut taken from every completed freelance job on the network.</p>
                                <div className="flex items-center gap-3 mt-4">
                                    <input 
                                      type="number" 
                                      className="input-field w-32" 
                                      value={settingsData?.platformFee || 10}
                                      onChange={(e) => updateSettingsMutation.mutate({ platformFee: Number(e.target.value) })}
                                    />
                                    <span className="font-black text-xl text-primary">%</span>
                                </div>
                             </div>

                             <div className="space-y-2">
                                <label className="text-sm font-bold text-primary block">Currency Identifier</label>
                                <p className="text-xs text-muted leading-relaxed">The primary currency used for displaying and processing payments.</p>
                                <div className="flex items-center gap-3 mt-4">
                                    <input type="text" className="input-field w-32 bg-elevated opacity-50 cursor-not-allowed" value="INR" disabled />
                                    <Badge label="Locked" variant="secondary" />
                                </div>
                             </div>
                        </div>
                    </section>

                    {/* Global Communication */}
                    <section className="space-y-6 pt-6 border-t border-default">
                        <div className="flex items-center gap-3">
                            <HiOutlineGlobeAlt size={20} className="text-brand"/>
                            <div>
                                <h3 className="font-black text-primary uppercase tracking-widest text-xs">System-Wide Broadcast</h3>
                                <p className="text-xs text-muted mt-1">Deploy a global banner across the entire platform for announcements or alerts.</p>
                            </div>
                        </div>
                        
                        <div className="bg-elevated p-6 rounded-2xl border border-default space-y-6">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-primary">Broadcast Status</span>
                                <button 
                                    onClick={() => updateSettingsMutation.mutate({ 
                                        systemBroadcast: { 
                                            ...settingsData.systemBroadcast, 
                                            isActive: !settingsData.systemBroadcast?.isActive 
                                        } 
                                    })}
                                    className={`relative w-12 h-6 flex items-center px-1 rounded-full transition-all ${
                                        settingsData?.systemBroadcast?.isActive ? 'bg-brand' : 'bg-surface border border-default'
                                    }`}
                                >
                                    <div className={`w-4 h-4 rounded-full shadow-sm transition-all ${
                                        settingsData?.systemBroadcast?.isActive ? 'translate-x-6 bg-white' : 'translate-x-0 bg-muted'
                                    }`} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-muted mb-1.5 block">Banner Message</label>
                                    <textarea 
                                        className="input-field min-h-[60px] py-3 text-xs"
                                        placeholder="e.g. System upgrade scheduled for tonight at 2 AM UTC..."
                                        value={settingsData?.systemBroadcast?.message || ""}
                                        onChange={(e) => updateSettingsMutation.mutate({ 
                                            systemBroadcast: { 
                                                ...settingsData.systemBroadcast, 
                                                message: e.target.value 
                                            } 
                                        })}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-muted mb-1.5 block">Alert Severity</label>
                                    <div className="flex gap-2">
                                        {['info', 'success', 'warning', 'error'].map(type => (
                                            <button 
                                                key={type}
                                                onClick={() => updateSettingsMutation.mutate({ 
                                                    systemBroadcast: { 
                                                        ...settingsData.systemBroadcast, 
                                                        type 
                                                    } 
                                                })}
                                                className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg border transition-all ${
                                                    settingsData?.systemBroadcast?.type === type 
                                                        ? 'bg-primary text-surface border-primary' 
                                                        : 'bg-surface text-muted border-default hover:border-brand/30'
                                                }`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Maintenance Protocol */}
                    <section className="space-y-6 pt-6 border-t border-default">
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <HiOutlineExclamationTriangle size={20} className="text-danger"/>
                                    <div>
                                        <h3 className="font-black text-primary uppercase tracking-widest text-xs">Emergency Protocol</h3>
                                        <p className="text-xs text-muted max-w-md mt-1">Maintenance mode will block public access to the platform while allowing admin operations.</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => maintenanceMutation.mutate({ 
                                        maintenanceMode: !settingsData?.maintenanceMode 
                                    })}
                                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                                        settingsData?.maintenanceMode 
                                        ? "bg-danger text-white hover:bg-danger/90" 
                                        : "bg-surface text-muted border border-default hover:bg-elevated"
                                    }`}
                                >
                                    {settingsData?.maintenanceMode ? "Disable Maintenance" : "Enable Maintenance"}
                                </button>
                            </div>

                            {settingsData?.maintenanceMode && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-4"
                                >
                                    <div className="bg-danger/5 border border-danger/10 p-4 rounded-2xl flex items-center gap-4">
                                        <HiOutlineLockClosed className="text-danger shrink-0" size={24} />
                                        <p className="text-xs text-danger font-bold">Maintenance protocol is ACTIVE. Public frontend users are currently redirected.</p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-muted mb-1.5 block">Public Message</label>
                                            <textarea 
                                                className="input-field min-h-[80px] py-3 text-xs"
                                                value={settingsData?.maintenanceMessage}
                                                onChange={(e) => maintenanceMutation.mutate({ maintenanceMessage: e.target.value })}
                                                placeholder="Enter message for users..."
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-muted mb-1.5 block">Scheduled End Time (Optional)</label>
                                            <input 
                                                type="datetime-local"
                                                className="input-field py-3 text-xs"
                                                value={settingsData?.maintenanceEndTime ? new Date(settingsData.maintenanceEndTime).toISOString().slice(0, 16) : ""}
                                                onChange={(e) => maintenanceMutation.mutate({ maintenanceEndTime: e.target.value })}
                                            />
                                            <p className="text-[10px] text-muted mt-2 leading-tight">If set, users will see a countdown on the maintenance page.</p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </section>
                </div>
              </motion.div>
            )}

            {activeTab === "notifications" && (
                <motion.div 
                    key="notifications"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                >
                    <div className="card p-8">
                        <div className="flex items-center gap-3 border-b border-default pb-4 mb-8">
                            <HiOutlineBell size={24} className="text-brand"/>
                            <h3 className="font-black text-primary uppercase tracking-widest text-xs">Email Communication Preferences</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                            {[
                                { id: "newOrders", label: "New Order Assignments", desc: "Notify when a client places a new order or assigns a task." },
                                { id: "disputes", label: "Dispute Escalations", desc: "High priority alert when an order enters the dispute state." },
                                { id: "kycSubmissions", label: "KYC Verification Requests", desc: "Alert when an editor submits documents for verification." },
                                { id: "payoutRequests", label: "Payout Processing", desc: "Notifications for new withdrawal requests from editors." },
                                { id: "systemAlerts", label: "Critical System Alerts", desc: "Security warnings and infrastructure status updates." },
                            ].map((pref) => (
                                <div key={pref.id} className="flex items-start gap-4 group">
                                    <div className="relative flex items-center mt-1">
                                        <input 
                                            type="checkbox"
                                            checked={admin?.notificationPrefs?.email?.[pref.id] ?? true}
                                            onChange={(e) => {
                                                const newPrefs = {
                                                    ...admin.notificationPrefs,
                                                    email: {
                                                        ...(admin.notificationPrefs?.email || {}),
                                                        [pref.id]: e.target.checked
                                                    }
                                                };
                                                updateNotifMutation.mutate(newPrefs);
                                            }}
                                            className="w-5 h-5 rounded-md border-2 border-default bg-surface checked:bg-brand checked:border-brand transition-all cursor-pointer appearance-none"
                                        />
                                        <HiOutlineCheckCircle className="absolute inset-0 m-auto text-white opacity-0 pointer-events-none group-has-[:checked]:opacity-100 transition-opacity" size={14} />
                                    </div>
                                    <div>
                                        <label className="text-sm font-black text-primary block cursor-pointer">{pref.label}</label>
                                        <p className="text-[10px] text-muted leading-tight mt-1">{pref.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="card p-8">
                        <div className="flex items-center gap-3 border-b border-default pb-4 mb-8">
                            <HiOutlineDevicePhoneMobile size={24} className="text-purple-500"/>
                            <h3 className="font-black text-primary uppercase tracking-widest text-xs">Push & Real-time Alerts</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                            {[
                                { id: "newMessages", label: "Instant Chat Notifications", desc: "Sound & badge alerts for new messages in supervised chats." },
                                { id: "orderUpdates", label: "Stage Transition Alerts", desc: "Real-time updates when orders move between statuses." },
                            ].map((pref) => (
                                <div key={pref.id} className="flex items-start gap-4 group">
                                    <div className="relative flex items-center mt-1">
                                        <input 
                                            type="checkbox"
                                            checked={admin?.notificationPrefs?.push?.[pref.id] ?? true}
                                            onChange={(e) => {
                                                const newPrefs = {
                                                    ...admin.notificationPrefs,
                                                    push: {
                                                        ...(admin.notificationPrefs?.push || {}),
                                                        [pref.id]: e.target.checked
                                                    }
                                                };
                                                updateNotifMutation.mutate(newPrefs);
                                            }}
                                            className="w-5 h-5 rounded-md border-2 border-default bg-surface checked:bg-purple-500 checked:border-purple-500 transition-all cursor-pointer appearance-none"
                                        />
                                        <HiOutlineCheckCircle className="absolute inset-0 m-auto text-white opacity-0 pointer-events-none group-has-[:checked]:opacity-100 transition-opacity" size={14} />
                                    </div>
                                    <div>
                                        <label className="text-sm font-black text-primary block cursor-pointer">{pref.label}</label>
                                        <p className="text-[10px] text-muted leading-tight mt-1">{pref.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}

            {activeTab === "storage" && isSuperAdmin && (
                <motion.div 
                    key="storage"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="card p-12 text-center"
                >
                    <HiOutlineCircleStack size={48} className="text-muted mx-auto mb-4 opacity-20" />
                    <h3 className="text-xl font-black text-primary">Infrastructure Configuration</h3>
                    <p className="text-sm text-muted max-w-md mx-auto mt-2">Cloudinary and MongoDB connection parameters are managed via server-side environment variables for security.</p>
                    <div className="mt-8">
                       <button className="btn-secondary py-2 px-6 text-xs" onClick={() => setActiveTab("general")}>Back to General</button>
                    </div>
                </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default Settings;
