/**
 * SubscriptionPlans.jsx - Admin Subscription Plans Management
 * Features: Create, Update, Delete plans, Toggle active status
 */

import { useState, useEffect } from "react";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaCheck,
  FaTimes,
  FaCrown,
  FaRupeeSign,
  FaEye,
  FaCalendarAlt,
  FaListUl,
  FaToggleOn,
  FaToggleOff,
  FaSync,
} from "react-icons/fa";
import { HiSparkles } from "react-icons/hi2";
import { useAdmin } from "../context/AdminContext";
import { toast } from "react-toastify";

// Duration options
const DURATION_OPTIONS = [
  { value: "monthly", label: "Monthly", days: 30 },
  { value: "yearly", label: "Yearly", days: 365 },
  { value: "lifetime", label: "Lifetime", days: 36500 },
];

// Feature options (what the plan unlocks)
const FEATURE_OPTIONS = [
  { value: "profile_insights", label: "Profile Insights" },
  { value: "priority_listing", label: "Priority Listing" },
  { value: "analytics_pro", label: "Analytics Pro" },
  { value: "all", label: "All Features" },
];

const SubscriptionPlans = () => {
  const { adminAxios } = useAdmin();

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    feature: "profile_insights",
    duration: "monthly",
    durationDays: 30,
    price: 0,
    originalPrice: 0,
    currency: "INR",
    discountPercent: 0,
    trialDays: 3,
    features: [""],
    description: "",
    badge: "",
    isActive: true,
    sortOrder: 0,
  });

  // Fetch plans
  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await adminAxios.get("/subscriptions/plans");
      setPlans(res.data.plans || []);
    } catch (error) {
      console.error("Failed to fetch plans:", error);
      toast.error("Failed to load subscription plans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  // Generate slug from name
  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  // Handle form changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newValue = type === "checkbox" ? checked : value;

    // Auto-generate slug from name
    if (name === "name") {
      setFormData((prev) => ({
        ...prev,
        name: value,
        slug: generateSlug(value),
      }));
      return;
    }

    // Update duration days when duration changes
    if (name === "duration") {
      const durationOpt = DURATION_OPTIONS.find((d) => d.value === value);
      setFormData((prev) => ({
        ...prev,
        duration: value,
        durationDays: durationOpt?.days || 30,
      }));
      return;
    }

    // Calculate discount percent when prices change
    if (name === "price" || name === "originalPrice") {
      const newFormData = { ...formData, [name]: parseFloat(value) || 0 };
      if (newFormData.originalPrice > 0 && newFormData.price > 0) {
        newFormData.discountPercent = Math.round(
          ((newFormData.originalPrice - newFormData.price) / newFormData.originalPrice) * 100
        );
      }
      setFormData(newFormData);
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: newValue }));
  };

  // Handle features array
  const handleFeatureChange = (index, value) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData((prev) => ({ ...prev, features: newFeatures }));
  };

  const addFeature = () => {
    setFormData((prev) => ({ ...prev, features: [...prev.features, ""] }));
  };

  const removeFeature = (index) => {
    const newFeatures = formData.features.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, features: newFeatures }));
  };

  // Open modal for create/edit
  const openModal = (plan = null) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        name: plan.name || "",
        slug: plan.slug || "",
        feature: plan.feature || "profile_insights",
        duration: plan.duration || "monthly",
        durationDays: plan.durationDays || 30,
        price: plan.price || 0,
        originalPrice: plan.originalPrice || 0,
        currency: plan.currency || "INR",
        discountPercent: plan.discountPercent || 0,
        trialDays: plan.trialDays || 3,
        features: plan.features?.length ? plan.features : [""],
        description: plan.description || "",
        badge: plan.badge || "",
        isActive: plan.isActive !== false,
        sortOrder: plan.sortOrder || 0,
      });
    } else {
      setEditingPlan(null);
      setFormData({
        name: "",
        slug: "",
        feature: "profile_insights",
        duration: "monthly",
        durationDays: 30,
        price: 0,
        originalPrice: 0,
        currency: "INR",
        discountPercent: 0,
        trialDays: 3,
        features: [""],
        description: "",
        badge: "",
        isActive: true,
        sortOrder: plans.length,
      });
    }
    setShowModal(true);
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price) {
      toast.error("Name and price are required");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        features: formData.features.filter((f) => f.trim()),
        planId: editingPlan?._id,
      };

      await adminAxios.post("/subscriptions/admin/plan", payload);
      toast.success(editingPlan ? "Plan updated!" : "Plan created!");
      setShowModal(false);
      fetchPlans();
    } catch (error) {
      console.error("Failed to save plan:", error);
      toast.error(error.response?.data?.message || "Failed to save plan");
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle active status
  const toggleActive = async (plan) => {
    try {
      await adminAxios.post("/subscriptions/admin/plan", {
        planId: plan._id,
        isActive: !plan.isActive,
      });
      toast.success(plan.isActive ? "Plan deactivated" : "Plan activated");
      fetchPlans();
    } catch (error) {
      toast.error("Failed to update plan status");
    }
  };

  // Delete plan
  const deletePlan = async (planId) => {
    if (!confirm("Are you sure you want to delete this plan?")) return;

    try {
      await adminAxios.post("/subscriptions/admin/plan", {
        planId,
        isActive: false,
        name: "[DELETED] " + plans.find((p) => p._id === planId)?.name,
      });
      toast.success("Plan deactivated (not deleted to preserve data)");
      fetchPlans();
    } catch (error) {
      toast.error("Failed to delete plan");
    }
  };

  return (
    <div className="p-6 min-h-screen bg-zinc-950">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FaCrown className="text-amber-400" />
            Subscription Plans
          </h1>
          <p className="text-zinc-400 text-sm">Manage subscription plans for premium features</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchPlans}
            className="p-3 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors"
          >
            <FaSync className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-400 transition-colors font-medium"
          >
            <FaPlus />
            Create Plan
          </button>
        </div>
      </div>

      {/* Plans List */}
      <div className="grid gap-4">
        {loading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="bg-zinc-900 rounded-xl p-6 animate-pulse">
              <div className="h-6 bg-zinc-800 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-zinc-800 rounded w-1/2"></div>
            </div>
          ))
        ) : plans.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            <FaCrown className="text-4xl mx-auto mb-3 opacity-50" />
            <p>No subscription plans yet</p>
            <button
              onClick={() => openModal()}
              className="mt-4 text-emerald-400 hover:underline"
            >
              Create your first plan →
            </button>
          </div>
        ) : (
          plans.map((plan) => (
            <div
              key={plan._id}
              className={`bg-zinc-900 rounded-xl p-6 border ${
                plan.isActive ? "border-zinc-800" : "border-red-500/30 opacity-60"
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Plan Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                    {plan.badge && (
                      <span className="px-2 py-0.5 text-xs font-bold bg-amber-500/20 text-amber-400 rounded">
                        {plan.badge}
                      </span>
                    )}
                    {!plan.isActive && (
                      <span className="px-2 py-0.5 text-xs font-bold bg-red-500/20 text-red-400 rounded">
                        INACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-400">{plan.description || `${plan.duration} plan for ${plan.feature}`}</p>
                  
                  {/* Features */}
                  {plan.features?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {plan.features.slice(0, 3).map((f, i) => (
                        <span key={i} className="px-2 py-1 bg-zinc-800 text-xs text-zinc-400 rounded">
                          {f}
                        </span>
                      ))}
                      {plan.features.length > 3 && (
                        <span className="px-2 py-1 bg-zinc-800 text-xs text-zinc-400 rounded">
                          +{plan.features.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Pricing */}
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="flex items-baseline gap-1">
                      <FaRupeeSign className="text-zinc-400" />
                      <span className="text-2xl font-bold text-white">{plan.price}</span>
                      <span className="text-zinc-500">/{plan.duration}</span>
                    </div>
                    {plan.discountPercent > 0 && (
                      <div className="text-xs text-emerald-400">
                        Save {plan.discountPercent}%
                      </div>
                    )}
                    <div className="text-xs text-zinc-500 mt-1">
                      {plan.trialDays > 0 && `${plan.trialDays}-day trial`}
                      {plan.totalSubscriptions > 0 && ` • ${plan.totalSubscriptions} subscribers`}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleActive(plan)}
                      className={`p-2.5 rounded-lg transition-colors ${
                        plan.isActive
                          ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                          : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                      }`}
                      title={plan.isActive ? "Deactivate" : "Activate"}
                    >
                      {plan.isActive ? <FaToggleOn /> : <FaToggleOff />}
                    </button>
                    <button
                      onClick={() => openModal(plan)}
                      className="p-2.5 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => deletePlan(plan._id)}
                      className="p-2.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-zinc-900 px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">
                {editingPlan ? "Edit Plan" : "Create Plan"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <FaTimes className="text-zinc-400" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Plan Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., Profile Insights Pro - Monthly"
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Slug (URL-friendly)
                  </label>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    placeholder="profile-insights-monthly"
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Feature & Duration */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Feature
                  </label>
                  <select
                    name="feature"
                    value={formData.feature}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  >
                    {FEATURE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Duration
                  </label>
                  <select
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  >
                    {DURATION_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label} ({opt.days} days)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Pricing */}
              <div className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
                <h4 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
                  <FaRupeeSign className="text-emerald-400" />
                  Pricing
                </h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">
                      Sale Price (₹) *
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      min="0"
                      placeholder="99"
                      className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white text-lg font-bold focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">
                      Original Price (₹)
                    </label>
                    <input
                      type="number"
                      name="originalPrice"
                      value={formData.originalPrice}
                      onChange={handleChange}
                      min="0"
                      placeholder="199"
                      className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    />
                    {formData.discountPercent > 0 && (
                      <p className="text-xs text-emerald-400 mt-1">
                        {formData.discountPercent}% discount
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">
                      Free Trial Days
                    </label>
                    <input
                      type="number"
                      name="trialDays"
                      value={formData.trialDays}
                      onChange={handleChange}
                      min="0"
                      className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Features List */}
              <div className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
                <h4 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
                  <FaListUl className="text-amber-400" />
                  Plan Features
                </h4>
                
                {/* Predefined Feature Suggestions */}
                <div className="mb-4">
                  <p className="text-xs text-zinc-500 mb-2">Quick add (click to add):</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "See who viewed your profile",
                      "Visitor names & photos",
                      "Client vs Editor breakdown",
                      "Last 30 days history",
                      "Real-time notifications",
                      "Export visitor data",
                      "Priority support",
                      "Early access to new features",
                      "Profile visibility boost",
                      "Detailed analytics dashboard",
                    ].map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => {
                          if (!formData.features.includes(suggestion)) {
                            const newFeatures = formData.features.filter(f => f.trim());
                            newFeatures.push(suggestion);
                            setFormData(prev => ({ ...prev, features: newFeatures }));
                          }
                        }}
                        disabled={formData.features.includes(suggestion)}
                        className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${
                          formData.features.includes(suggestion)
                            ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400 cursor-not-allowed"
                            : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-white"
                        }`}
                      >
                        {formData.features.includes(suggestion) ? "✓ " : "+ "}
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Features */}
                <div className="space-y-2">
                  <p className="text-xs text-zinc-500">Added features:</p>
                  {formData.features.length === 0 || (formData.features.length === 1 && !formData.features[0]) ? (
                    <p className="text-xs text-zinc-600 italic py-2">No features added yet. Click suggestions above or add custom below.</p>
                  ) : (
                    formData.features.map((feature, index) => (
                      feature && (
                        <div key={index} className="flex gap-2 items-center group">
                          <span className="text-emerald-400 text-xs">✓</span>
                          <input
                            type="text"
                            value={feature}
                            onChange={(e) => handleFeatureChange(index, e.target.value)}
                            className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                          />
                          <button
                            type="button"
                            onClick={() => removeFeature(index)}
                            className="p-2 text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <FaTimes className="text-xs" />
                          </button>
                        </div>
                      )
                    ))
                  )}
                  
                  {/* Add Custom Feature */}
                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      placeholder="Add custom feature..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const value = e.target.value.trim();
                          if (value) {
                            const newFeatures = formData.features.filter(f => f.trim());
                            newFeatures.push(value);
                            setFormData(prev => ({ ...prev, features: newFeatures }));
                            e.target.value = '';
                          }
                        }
                      }}
                      className="flex-1 px-3 py-2 bg-zinc-900 border border-dashed border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        const input = e.target.previousSibling;
                        const value = input.value.trim();
                        if (value) {
                          const newFeatures = formData.features.filter(f => f.trim());
                          newFeatures.push(value);
                          setFormData(prev => ({ ...prev, features: newFeatures }));
                          input.value = '';
                        }
                      }}
                      className="px-3 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors text-sm"
                    >
                      <FaPlus />
                    </button>
                  </div>
                </div>
              </div>

              {/* Description & Badge */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Short description of the plan"
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Badge
                  </label>
                  <input
                    type="text"
                    name="badge"
                    value={formData.badge}
                    onChange={handleChange}
                    placeholder="e.g., BEST VALUE, POPULAR"
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Status & Order */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="w-5 h-5 rounded bg-zinc-800 border-zinc-700 text-emerald-500 focus:ring-emerald-500"
                  />
                  <label className="text-sm text-zinc-300">Plan is active and visible</label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    name="sortOrder"
                    value={formData.sortOrder}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-400 transition-colors font-medium disabled:opacity-50"
                >
                  {submitting ? "Saving..." : editingPlan ? "Update Plan" : "Create Plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionPlans;
