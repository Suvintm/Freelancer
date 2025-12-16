import { useState } from "react";
import axios from "axios";
import {
  FaArrowLeft,
  FaSave,
  FaPlus,
  FaTimes,
  FaRupeeSign,
  FaClock,
  FaImage,
  FaInfoCircle,
  FaCloudUploadAlt,
} from "react-icons/fa";
import { useAppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import Sidebar from "../components/Sidebar.jsx";
import EditorNavbar from "../components/EditorNavbar.jsx";

// Default banner for gigs without custom banner
const DEFAULT_GIG_BANNER = "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&q=80";

const CATEGORIES = [
  "Wedding",
  "Birthday",
  "Corporate",
  "Music Video",
  "Short Film",
  "Social Media",
  "Commercial",
  "Documentary",
  "YouTube",
  "Other",
];

const CreateGig = () => {
  const { backendURL, user } = useAppContext();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    price: "",
    deliveryDays: "",
    samples: [],
  });

  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: "" });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.description.trim()) newErrors.description = "Description is required";
    if (!formData.category) newErrors.category = "Select a category";
    if (!formData.price || formData.price < 100) newErrors.price = "Minimum price is ₹100";
    if (!formData.deliveryDays || formData.deliveryDays < 1) newErrors.deliveryDays = "Minimum 1 day";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);
      setLoadingText("Creating your gig...");
      const token = user?.token;

      // Use FormData for multipart upload
      const submitData = new FormData();
      submitData.append("title", formData.title.trim());
      submitData.append("description", formData.description.trim());
      submitData.append("category", formData.category);
      submitData.append("price", formData.price);
      submitData.append("deliveryDays", formData.deliveryDays);
      submitData.append("samples", JSON.stringify(formData.samples));
      
      if (bannerFile) {
        submitData.append("thumbnail", bannerFile);
      }

      await axios.post(
        `${backendURL}/api/gigs`,
        submitData,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
          } 
        }
      );

      setLoadingText("Gig created successfully!");
      toast.success("Gig created! It's now live.");
      setTimeout(() => navigate("/my-gigs"), 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create gig");
    } finally {
      setLoading(false);
      setLoadingText("");
    }
  };

  const addSample = () => {
    const url = prompt("Enter portfolio/sample video URL:");
    if (url && url.trim()) {
      setFormData({ ...formData, samples: [...formData.samples, url.trim()] });
    }
  };

  const removeSample = (index) => {
    setFormData({
      ...formData,
      samples: formData.samples.filter((_, i) => i !== index),
    });
  };

  // Handle banner image upload
  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const removeBanner = () => {
    setBannerFile(null);
    setBannerPreview(null);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#050509] light:bg-slate-100 text-white light:text-slate-900 transition-colors duration-200">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <EditorNavbar onMenuClick={() => setSidebarOpen(true)} />

      <main className="flex-1 px-4 md:px-8 py-6 md:ml-64 md:mt-20">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-3 rounded-xl bg-[#111319] light:bg-white border border-[#262A3B] light:border-slate-300 hover:bg-[#1a1d25] light:hover:bg-slate-50 transition-all light:shadow-sm"
          >
            <FaArrowLeft className="light:text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white light:text-slate-900">Create New Gig</h1>
            <p className="text-gray-400 light:text-slate-500 text-sm">Offer your video editing services</p>
          </div>
        </div>

        {/* Form Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Banner Upload */}
            <div className="bg-[#111319] light:bg-white border border-[#262A3B] light:border-slate-300 rounded-2xl p-6 light:shadow-md">
              <label className="block text-sm font-semibold text-white light:text-slate-900 mb-3">
                <FaCloudUploadAlt className="inline mr-2 text-purple-400" />
                Gig Banner (Optional)
              </label>
              <p className="text-gray-400 light:text-slate-500 text-xs mb-4">
                Add a banner image to make your gig stand out. Recommended: 800x400px
              </p>
              
              {bannerPreview ? (
                <div className="relative rounded-xl overflow-hidden">
                  <img 
                    src={bannerPreview} 
                    alt="Banner preview" 
                    className="w-full h-48 object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeBanner}
                    className="absolute top-3 right-3 p-2 bg-red-500 hover:bg-red-600 rounded-full text-white transition-all"
                  >
                    <FaTimes />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-[#262A3B] light:border-slate-300 rounded-xl cursor-pointer hover:border-purple-500/50 light:hover:border-purple-400 transition-all bg-[#0B0B0D] light:bg-slate-50">
                  <FaCloudUploadAlt className="text-4xl text-gray-500 light:text-slate-400 mb-3" />
                  <span className="text-gray-400 light:text-slate-500 text-sm">Click to upload banner image</span>
                  <span className="text-gray-500 light:text-slate-400 text-xs mt-1">PNG, JPG up to 5MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBannerChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Title */}
            <div className="bg-[#111319] light:bg-white border border-[#262A3B] light:border-slate-300 rounded-2xl p-6 light:shadow-md">
              <label className="block text-sm font-semibold text-white light:text-slate-900 mb-3">
                Gig Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Professional Wedding Video Editing"
                maxLength={100}
                className={`w-full bg-[#0B0B0D] light:bg-slate-50 border ${
                  errors.title ? "border-red-500" : "border-[#262A3B] light:border-slate-300"
                } rounded-xl px-4 py-3 text-sm light:text-slate-900 placeholder:text-gray-500 light:placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/30 transition-all`}
              />
              {errors.title && (
                <p className="text-red-400 text-xs mt-2">{errors.title}</p>
              )}
              <p className="text-gray-500 light:text-slate-500 text-xs mt-2">{formData.title.length}/100 characters</p>
            </div>

            {/* Description */}
            <div className="bg-[#111319] light:bg-white border border-[#262A3B] light:border-slate-300 rounded-2xl p-6 light:shadow-md">
              <label className="block text-sm font-semibold text-white light:text-slate-900 mb-3">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe what you offer, your style, software used, etc..."
                rows={5}
                maxLength={2000}
                className={`w-full bg-[#0B0B0D] light:bg-slate-50 border ${
                  errors.description ? "border-red-500" : "border-[#262A3B] light:border-slate-300"
                } rounded-xl px-4 py-3 text-sm light:text-slate-900 placeholder:text-gray-500 light:placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/30 resize-none transition-all`}
              />
              {errors.description && (
                <p className="text-red-400 text-xs mt-2">{errors.description}</p>
              )}
              <p className="text-gray-500 light:text-slate-500 text-xs mt-2">{formData.description.length}/2000 characters</p>
            </div>

            {/* Category */}
            <div className="bg-[#111319] light:bg-white border border-[#262A3B] light:border-slate-300 rounded-2xl p-6 light:shadow-md">
              <label className="block text-sm font-semibold text-white light:text-slate-900 mb-3">
                Category *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: cat })}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                      formData.category === cat
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-[#0B0B0D] light:bg-slate-50 text-gray-400 light:text-slate-600 border border-[#262A3B] light:border-slate-300 hover:border-blue-500/30 light:hover:border-blue-400"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              {errors.category && (
                <p className="text-red-400 text-xs mt-3">{errors.category}</p>
              )}
            </div>

            {/* Price & Delivery */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Price */}
              <div className="bg-[#111319] light:bg-white border border-[#262A3B] light:border-slate-300 rounded-2xl p-6 light:shadow-md">
                <label className="block text-sm font-semibold text-white light:text-slate-900 mb-3">
                  <FaRupeeSign className="inline mr-2 text-green-400" />
                  Price (₹) *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="500"
                  min={100}
                  className={`w-full bg-[#0B0B0D] light:bg-slate-50 border ${
                    errors.price ? "border-red-500" : "border-[#262A3B] light:border-slate-300"
                  } rounded-xl px-4 py-3 text-sm light:text-slate-900 placeholder:text-gray-500 light:placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/30 transition-all`}
                />
                {errors.price && (
                  <p className="text-red-400 text-xs mt-2">{errors.price}</p>
                )}
                <p className="text-gray-500 light:text-slate-500 text-xs mt-2">Minimum ₹100</p>
              </div>

              {/* Delivery Days */}
              <div className="bg-[#111319] light:bg-white border border-[#262A3B] light:border-slate-300 rounded-2xl p-6 light:shadow-md">
                <label className="block text-sm font-semibold text-white light:text-slate-900 mb-3">
                  <FaClock className="inline mr-2 text-blue-400" />
                  Delivery Time (Days) *
                </label>
                <input
                  type="number"
                  name="deliveryDays"
                  value={formData.deliveryDays}
                  onChange={handleChange}
                  placeholder="3"
                  min={1}
                  max={90}
                  className={`w-full bg-[#0B0B0D] light:bg-slate-50 border ${
                    errors.deliveryDays ? "border-red-500" : "border-[#262A3B] light:border-slate-300"
                  } rounded-xl px-4 py-3 text-sm light:text-slate-900 placeholder:text-gray-500 light:placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/30 transition-all`}
                />
                {errors.deliveryDays && (
                  <p className="text-red-400 text-xs mt-2">{errors.deliveryDays}</p>
                )}
              </div>
            </div>

            {/* Samples */}
            <div className="bg-[#111319] light:bg-white border border-[#262A3B] light:border-slate-300 rounded-2xl p-6 light:shadow-md">
              <label className="block text-sm font-semibold text-white light:text-slate-900 mb-3">
                <FaImage className="inline mr-2 text-purple-400" />
                Sample Works (Optional)
              </label>
              <p className="text-gray-400 light:text-slate-500 text-xs mb-4">
                Add links to your portfolio videos to showcase your work
              </p>

              {formData.samples.length > 0 && (
                <div className="space-y-2 mb-4">
                  {formData.samples.map((url, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-[#0B0B0D] light:bg-slate-50 border border-[#262A3B] light:border-slate-300 rounded-lg px-3 py-2"
                    >
                      <span className="flex-1 text-sm text-gray-300 light:text-slate-700 truncate">{url}</span>
                      <button
                        type="button"
                        onClick={() => removeSample(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={addSample}
                className="flex items-center gap-2 px-4 py-2 bg-[#0B0B0D] light:bg-slate-50 border border-dashed border-[#262A3B] light:border-slate-300 rounded-xl text-gray-400 light:text-slate-500 hover:border-blue-500/50 light:hover:border-blue-400 hover:text-blue-400 transition-all"
              >
                <FaPlus /> Add Sample Link
              </button>
            </div>

            {/* Info Box */}
            <div className="bg-[#0a1a20] light:bg-blue-50 border border-blue-500/20 light:border-blue-200 rounded-2xl p-4">
              <div className="flex gap-3">
                <FaInfoCircle className="text-blue-400 light:text-blue-500 text-lg flex-shrink-0 mt-1" />
                <div>
                  <p className="text-blue-300 light:text-blue-700 text-sm font-medium">Tips for a great gig</p>
                  <ul className="text-gray-400 light:text-slate-600 text-xs mt-2 space-y-1 list-disc list-inside">
                    <li>Be specific about what's included</li>
                    <li>Mention the software you use</li>
                    <li>Set a competitive but fair price</li>
                    <li>Keep delivery time realistic</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-2xl text-white font-semibold flex items-center justify-center gap-3 transition-all disabled:opacity-50 shadow-lg shadow-blue-500/20"
            >
              {loading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                  {loadingText}
                </>
              ) : (
                <>
                  <FaSave /> Publish Gig
                </>
              )}
            </button>
          </form>
        </motion.div>
      </main>
    </div>
  );
};

export default CreateGig;
