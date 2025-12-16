// StorageManager.jsx - Admin Storage Settings Management
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    FaDatabase,
    FaEdit,
    FaSave,
    FaTimes,
    FaPlus,
    FaTrash,
    FaInfoCircle,
    FaSpinner,
    FaCheck,
    FaHistory,
    FaUser,
    FaMoneyBillWave,
    FaChevronLeft,
    FaChevronRight,
} from "react-icons/fa";
import { useAdmin } from "../context/AdminContext";
import { toast } from "react-toastify";

const StorageManager = () => {
    const { adminAxios } = useAdmin();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState(null);
    const [editMode, setEditMode] = useState(false);
    
    // Form state
    const [freeStorageMB, setFreeStorageMB] = useState(500);
    const [maxStorageMB, setMaxStorageMB] = useState(51200);
    const [plans, setPlans] = useState([]);
    
    // New plan modal
    const [showAddPlan, setShowAddPlan] = useState(false);
    const [newPlan, setNewPlan] = useState({
        id: "",
        name: "",
        storageMB: 1024,
        price: 99,
        features: "",
        popular: false,
    });

    // Purchases state
    const [purchases, setPurchases] = useState([]);
    const [purchasesLoading, setPurchasesLoading] = useState(false);
    const [purchaseStats, setPurchaseStats] = useState({ totalRevenue: 0, totalCompleted: 0, totalPending: 0 });
    const [purchasePage, setPurchasePage] = useState(1);
    const [purchasePagination, setPurchasePagination] = useState({ total: 0, pages: 1 });
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        fetchSettings();
        fetchPurchases();
    }, []);

    useEffect(() => {
        fetchPurchases();
    }, [purchasePage, statusFilter]);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const { data } = await adminAxios.get("/admin/storage-settings");
            if (data.success) {
                setSettings(data.settings);
                setFreeStorageMB(data.settings.freeStorageMB);
                setMaxStorageMB(data.settings.maxStorageMB);
                setPlans(data.settings.plans || []);
            }
        } catch (error) {
            console.error("Error fetching storage settings:", error);
            toast.error("Failed to load storage settings");
        } finally {
            setLoading(false);
        }
    };

    const fetchPurchases = async () => {
        try {
            setPurchasesLoading(true);
            const params = new URLSearchParams({
                page: purchasePage,
                limit: 10,
                status: statusFilter,
            });
            const { data } = await adminAxios.get(`/admin/storage-purchases?${params}`);
            if (data.success) {
                setPurchases(data.purchases || []);
                setPurchasePagination(data.pagination || { total: 0, pages: 1 });
                setPurchaseStats(data.stats || { totalRevenue: 0, totalCompleted: 0, totalPending: 0 });
            }
        } catch (error) {
            console.error("Error fetching purchases:", error);
        } finally {
            setPurchasesLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const { data } = await adminAxios.put("/admin/storage-settings", {
                freeStorageMB,
                maxStorageMB,
                plans,
            });
            
            if (data.success) {
                toast.success("Storage settings updated successfully");
                setSettings(data.settings);
                setEditMode(false);
            }
        } catch (error) {
            console.error("Error saving storage settings:", error);
            toast.error(error.response?.data?.message || "Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    const handleAddPlan = async () => {
        if (!newPlan.id || !newPlan.name || !newPlan.storageMB || newPlan.price === undefined) {
            toast.error("Please fill all required fields");
            return;
        }

        try {
            setSaving(true);
            const features = newPlan.features.split("\n").filter(f => f.trim());
            
            const { data } = await adminAxios.post("/admin/storage-settings/plans", {
                ...newPlan,
                features,
            });
            
            if (data.success) {
                toast.success("Plan added successfully");
                setPlans(data.plans);
                setShowAddPlan(false);
                setNewPlan({ id: "", name: "", storageMB: 1024, price: 99, features: "", popular: false });
            }
        } catch (error) {
            console.error("Error adding plan:", error);
            toast.error(error.response?.data?.message || "Failed to add plan");
        } finally {
            setSaving(false);
        }
    };

    const handleDeletePlan = async (planId) => {
        if (!window.confirm("Are you sure you want to delete this plan?")) return;
        
        try {
            const { data } = await adminAxios.delete(`/admin/storage-settings/plans/${planId}`);
            if (data.success) {
                toast.success("Plan deleted successfully");
                setPlans(data.plans);
            }
        } catch (error) {
            console.error("Error deleting plan:", error);
            toast.error(error.response?.data?.message || "Failed to delete plan");
        }
    };

    const updatePlanField = (index, field, value) => {
        const updated = [...plans];
        updated[index][field] = value;
        setPlans(updated);
    };

    const formatBytes = (mb) => {
        if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
        return `${mb} MB`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <FaSpinner className="text-4xl animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                        <FaDatabase className="text-white text-xl" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Storage Manager</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Configure storage limits and plans for editors</p>
                    </div>
                </div>
                
                {!editMode ? (
                    <button
                        onClick={() => setEditMode(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                        <FaEdit /> Edit Settings
                    </button>
                ) : (
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                setEditMode(false);
                                fetchSettings();
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                        >
                            <FaTimes /> Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                        >
                            {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
                            Save Changes
                        </button>
                    </div>
                )}
            </div>

            {/* Free Storage Limit */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6"
            >
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                    <FaInfoCircle className="text-blue-500" />
                    Default Storage Limits
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Free Storage */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Free Storage for New Editors
                        </label>
                        {editMode ? (
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min="100"
                                    max="10240"
                                    value={freeStorageMB}
                                    onChange={(e) => setFreeStorageMB(parseInt(e.target.value) || 100)}
                                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                                <span className="text-gray-500 dark:text-gray-400">MB</span>
                            </div>
                        ) : (
                            <p className="text-2xl font-bold text-blue-600">{formatBytes(freeStorageMB)}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">Min: 100 MB, Max: 10 GB</p>
                    </div>

                    {/* Max Storage */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Maximum Purchasable Storage
                        </label>
                        {editMode ? (
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min="1024"
                                    max="102400"
                                    value={maxStorageMB}
                                    onChange={(e) => setMaxStorageMB(parseInt(e.target.value) || 1024)}
                                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                                <span className="text-gray-500 dark:text-gray-400">MB</span>
                            </div>
                        ) : (
                            <p className="text-2xl font-bold text-purple-600">{formatBytes(maxStorageMB)}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">Min: 1 GB, Max: 100 GB</p>
                    </div>
                </div>
            </motion.div>

            {/* Storage Plans */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
            >
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Storage Plans</h2>
                    {editMode && (
                        <button
                            onClick={() => setShowAddPlan(true)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
                        >
                            <FaPlus /> Add Plan
                        </button>
                    )}
                </div>

                <div className="grid gap-4">
                    {plans.map((plan, index) => (
                        <div
                            key={plan.id}
                            className={`p-4 rounded-lg border ${
                                plan.popular 
                                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                                    : "border-gray-200 dark:border-gray-700"
                            }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    {editMode ? (
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-4 gap-4">
                                                <input
                                                    value={plan.name}
                                                    onChange={(e) => updatePlanField(index, "name", e.target.value)}
                                                    placeholder="Plan Name"
                                                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
                                                />
                                                <div className="flex items-center gap-1">
                                                    <input
                                                        type="number"
                                                        value={plan.storageMB}
                                                        onChange={(e) => updatePlanField(index, "storageMB", parseInt(e.target.value))}
                                                        className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
                                                    />
                                                    <span className="text-xs text-gray-500">MB</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-gray-500">₹</span>
                                                    <input
                                                        type="number"
                                                        value={plan.price}
                                                        onChange={(e) => updatePlanField(index, "price", parseInt(e.target.value))}
                                                        className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
                                                    />
                                                </div>
                                                <label className="flex items-center gap-2 text-sm">
                                                    <input
                                                        type="checkbox"
                                                        checked={plan.popular}
                                                        onChange={(e) => updatePlanField(index, "popular", e.target.checked)}
                                                        className="rounded"
                                                    />
                                                    Popular
                                                </label>
                                            </div>
                                            {/* Features editing */}
                                            <div>
                                                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Features (one per line)</label>
                                                <textarea
                                                    value={Array.isArray(plan.features) ? plan.features.join("\n") : ""}
                                                    onChange={(e) => updatePlanField(index, "features", e.target.value.split("\n").filter(f => f.trim()))}
                                                    rows={3}
                                                    placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-start gap-4">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                                    {plan.name}
                                                    {plan.popular && (
                                                        <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">Popular</span>
                                                    )}
                                                </h3>
                                                <p className="text-sm text-gray-500">{formatBytes(plan.storageMB)}</p>
                                                {/* Show features */}
                                                {plan.features && plan.features.length > 0 && (
                                                    <ul className="mt-2 space-y-1">
                                                        {plan.features.map((feature, fi) => (
                                                            <li key={fi} className="text-xs text-gray-400 flex items-center gap-1">
                                                                <FaCheck className="text-green-500 text-[10px]" /> {feature}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xl font-bold text-gray-900 dark:text-white">₹{plan.price}</p>
                                                <p className="text-xs text-gray-500">one-time</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                {editMode && (
                                    <button
                                        onClick={() => handleDeletePlan(plan.id)}
                                        className="ml-4 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                                    >
                                        <FaTrash />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    
                    {plans.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            No storage plans configured. Add one to get started.
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Add Plan Modal */}
            {showAddPlan && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4"
                    >
                        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Add New Plan</h3>
                        
                        <div className="space-y-4">
                            <input
                                placeholder="Plan ID (e.g., premium)"
                                value={newPlan.id}
                                onChange={(e) => setNewPlan({ ...newPlan, id: e.target.value.toLowerCase().replace(/\s/g, "_") })}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                            />
                            <input
                                placeholder="Plan Name"
                                value={newPlan.name}
                                onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                            />
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="text-xs text-gray-500 dark:text-gray-400">Storage (MB)</label>
                                    <input
                                        type="number"
                                        value={newPlan.storageMB}
                                        onChange={(e) => setNewPlan({ ...newPlan, storageMB: parseInt(e.target.value) })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs text-gray-500 dark:text-gray-400">Price (₹)</label>
                                    <input
                                        type="number"
                                        value={newPlan.price}
                                        onChange={(e) => setNewPlan({ ...newPlan, price: parseInt(e.target.value) })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                                    />
                                </div>
                            </div>
                            <textarea
                                placeholder="Features (one per line)"
                                value={newPlan.features}
                                onChange={(e) => setNewPlan({ ...newPlan, features: e.target.value })}
                                rows={3}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                            />
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={newPlan.popular}
                                    onChange={(e) => setNewPlan({ ...newPlan, popular: e.target.checked })}
                                    className="rounded"
                                />
                                Mark as Popular
                            </label>
                        </div>
                        
                        <div className="flex gap-2 mt-6">
                            <button
                                onClick={() => setShowAddPlan(false)}
                                className="flex-1 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddPlan}
                                disabled={saving}
                                className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {saving ? <FaSpinner className="animate-spin" /> : <FaCheck />}
                                Add Plan
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* ============ PURCHASE HISTORY SECTION ============ */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mt-6"
            >
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <FaHistory className="text-2xl text-purple-500" />
                        <h2 className="text-xl font-bold dark:text-white">Purchase History</h2>
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setPurchasePage(1); }}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
                    >
                        <option value="all">All Status</option>
                        <option value="completed">Completed</option>
                        <option value="pending">Pending</option>
                        <option value="failed">Failed</option>
                    </select>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/20 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-emerald-500/20 rounded-lg">
                                <FaMoneyBillWave className="text-emerald-500 text-lg" />
                            </div>
                            <div>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">Total Revenue</p>
                                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">₹{purchaseStats.totalRevenue?.toLocaleString() || 0}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-500/20 rounded-lg">
                                <FaCheck className="text-blue-500 text-lg" />
                            </div>
                            <div>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">Completed</p>
                                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{purchaseStats.totalCompleted || 0}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-amber-500/20 rounded-lg">
                                <FaSpinner className="text-amber-500 text-lg" />
                            </div>
                            <div>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">Pending</p>
                                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{purchaseStats.totalPending || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Purchases Table */}
                {purchasesLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <FaSpinner className="animate-spin text-3xl text-purple-500" />
                    </div>
                ) : purchases.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <FaDatabase className="text-4xl mx-auto mb-3 opacity-50" />
                        <p>No purchases found</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-700/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">User</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Plan</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Amount</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {purchases.map((purchase) => (
                                        <tr key={purchase._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    {purchase.user?.profilePic ? (
                                                        <img src={purchase.user.profilePic} alt="" className="w-8 h-8 rounded-full object-cover" />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                                                            <FaUser className="text-purple-500 text-sm" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-white text-sm">{purchase.user?.name || 'Unknown User'}</p>
                                                        <p className="text-xs text-gray-500">{purchase.user?.email || '-'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white text-sm">{purchase.planName}</p>
                                                    <p className="text-xs text-gray-500">{purchase.storageMB} MB</p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="font-semibold text-gray-900 dark:text-white">₹{purchase.amount}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                    purchase.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                                                    purchase.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                                                    'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                                                }`}>
                                                    {purchase.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-500">
                                                {purchase.purchasedAt 
                                                    ? new Date(purchase.purchasedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                                                    : new Date(purchase.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                                                }
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {purchasePagination.pages > 1 && (
                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <p className="text-sm text-gray-500">
                                    Showing {((purchasePage - 1) * 10) + 1} to {Math.min(purchasePage * 10, purchasePagination.total)} of {purchasePagination.total}
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setPurchasePage(p => Math.max(1, p - 1))}
                                        disabled={purchasePage === 1}
                                        className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
                                    >
                                        <FaChevronLeft className="text-sm" />
                                    </button>
                                    <span className="px-3 py-1 text-sm font-medium">{purchasePage} / {purchasePagination.pages}</span>
                                    <button
                                        onClick={() => setPurchasePage(p => Math.min(purchasePagination.pages, p + 1))}
                                        disabled={purchasePage >= purchasePagination.pages}
                                        className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
                                    >
                                        <FaChevronRight className="text-sm" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </motion.div>
        </div>
    );
};

export default StorageManager;
