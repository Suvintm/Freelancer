import { useEffect, useState } from "react";
import axios from "axios";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-toastify";
import {
  FaArrowLeft,
  FaGlobe,
  FaEnvelope,
  FaUserEdit,
  FaPlus,
  FaTimes,
  FaSave,
} from "react-icons/fa";
import countryList from "react-select-country-list";
import Select from "react-select";
import { PageLoader } from "./LoadingSpinner.jsx";

const UpdateProfile = () => {
  const { user, backendURL } = useAppContext();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [countries, setCountries] = useState([]);

  const [formData, setFormData] = useState({
    about: "",
    experience: "",
    contactEmail: "",
    country: "",
    skillInput: "",
    skills: [],
    languageInput: "",
    languages: [],
    certifications: [],
    existingCertifications: [],
  });

  useEffect(() => {
    setCountries(countryList().getData());
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${backendURL}/api/profile`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      const p = res.data.profile;
      setProfile(p);
      setFormData({
        ...formData,
        about: p?.about || "",
        experience: p?.experience || "",
        contactEmail: p?.contactEmail || "",
        country: p?.location?.country || "",
        skills: p?.skills?.filter(Boolean) || [],
        languages: p?.languages?.filter(Boolean) || [],
        existingCertifications: p?.certifications?.filter(c => c?.image) || [],
      });
    } catch (err) {
      console.error("Error fetching profile:", err);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleCountryChange = (selected) =>
    setFormData({ ...formData, country: selected.label });

  const addSkill = () => {
    const skill = formData.skillInput.trim();
    if (skill && !formData.skills.includes(skill)) {
      if (formData.skills.length >= 20) {
        toast.warning("Maximum 20 skills allowed");
        return;
      }
      setFormData({
        ...formData,
        skills: [...formData.skills, skill],
        skillInput: "",
      });
    }
  };

  const removeSkill = (skill) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((s) => s !== skill),
    });
  };

  const addLanguage = () => {
    const lang = formData.languageInput.trim();
    if (lang && !formData.languages.includes(lang)) {
      if (formData.languages.length >= 10) {
        toast.warning("Maximum 10 languages allowed");
        return;
      }
      setFormData({
        ...formData,
        languages: [...formData.languages, lang],
        languageInput: "",
      });
    }
  };

  const removeLanguage = (lang) => {
    setFormData({
      ...formData,
      languages: formData.languages.filter((l) => l !== lang),
    });
  };

  const handleCertUpload = (e) => {
    const files = Array.from(e.target.files);
    const totalCerts = formData.existingCertifications.length + formData.certifications.length;

    if (totalCerts + files.length > 10) {
      toast.warning("Maximum 10 certifications allowed");
      return;
    }

    // Validate file sizes
    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Max 5MB per file.`);
        return false;
      }
      return true;
    });

    setFormData({
      ...formData,
      certifications: [...formData.certifications, ...validFiles],
    });
  };

  const removeCert = (index, type = "local") => {
    if (type === "local") {
      const updated = [...formData.certifications];
      updated.splice(index, 1);
      setFormData({ ...formData, certifications: updated });
    } else {
      const updated = [...formData.existingCertifications];
      updated.splice(index, 1);
      setFormData({ ...formData, existingCertifications: updated });
    }
  };

  const isFormValid =
    formData.about.trim() &&
    formData.experience.trim() &&
    formData.contactEmail.trim() &&
    formData.country.trim() &&
    formData.skills.length > 0 &&
    formData.languages.length > 0;

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!isFormValid) {
      toast.error("Please fill all required fields!");
      return;
    }

    try {
      setUpdating(true);
      const formPayload = new FormData();
      formPayload.append("about", formData.about);
      formPayload.append("experience", formData.experience);
      formPayload.append("contactEmail", formData.contactEmail);
      formPayload.append("country", formData.country);
      formPayload.append("skills", formData.skills.join(","));
      formPayload.append("languages", formData.languages.join(","));

      formData.certifications.forEach((file) => {
        formPayload.append("certifications", file);
      });

      const res = await axios.put(`${backendURL}/api/profile`, formPayload, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Profile updated successfully!");
      setProfile(res.data.profile);

      setFormData({
        ...formData,
        certifications: [],
        existingCertifications: res.data.profile.certifications?.filter(c => c?.image) || [],
      });
    } catch (err) {
      console.error("Update failed:", err);
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setUpdating(false);
    }
  };

  const handleKeyPress = (e, action) => {
    if (e.key === "Enter") {
      e.preventDefault();
      action();
    }
  };

  const experienceOptions = [
    "0-6 months",
    "6-12 months",
    "1-2 years",
    "2-3 years",
    "3-5 years",
    "5+ years",
  ];

  if (loading) {
    return <PageLoader text="Loading profile..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar */}
      <nav className="w-full bg-white shadow py-4 px-6 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <FaUserEdit className="text-green-600 text-xl" />
          <h1 className="font-bold text-lg">Edit Your Profile</h1>
        </div>
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-gray-700 hover:text-green-600 transition"
        >
          <FaArrowLeft /> Back
        </button>
      </nav>

      {/* Main Form */}
      <main className="flex-grow py-8 px-4 md:px-10 flex justify-center">
        <form
          onSubmit={handleUpdate}
          className="w-full max-w-2xl bg-white p-6 md:p-8 rounded-2xl shadow-md border space-y-6"
        >
          {/* About */}
          <div>
            <label className="block mb-2 font-medium text-gray-700">
              About <span className="text-red-500">*</span>
            </label>
            <textarea
              name="about"
              value={formData.about}
              onChange={handleChange}
              placeholder="Tell something about yourself..."
              rows="4"
              maxLength={1000}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400 outline-none transition resize-none"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">
              {formData.about.length}/1000
            </p>
          </div>

          {/* Contact Email */}
          <div>
            <label className="block mb-2 font-medium text-gray-700">
              Contact Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <FaEnvelope className="absolute left-3 top-3.5 text-gray-400" />
              <input
                type="email"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleChange}
                placeholder="Enter your contact email"
                className="w-full p-3 pl-10 border rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400 outline-none transition"
              />
            </div>
          </div>

          {/* Country */}
          <div>
            <label className="block mb-2 font-medium text-gray-700">
              Location <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <FaGlobe className="text-gray-400" />
              <Select
                options={countries}
                value={
                  formData.country
                    ? { label: formData.country, value: formData.country }
                    : null
                }
                onChange={handleCountryChange}
                placeholder="Select your country"
                className="flex-1"
                styles={{
                  control: (base) => ({
                    ...base,
                    borderRadius: "0.5rem",
                    borderColor: "#e5e7eb",
                  }),
                }}
              />
            </div>
          </div>

          {/* Experience */}
          <div>
            <label className="block mb-2 font-medium text-gray-700">
              Experience <span className="text-red-500">*</span>
            </label>
            <select
              name="experience"
              value={formData.experience}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400 outline-none transition"
            >
              <option value="">Select experience</option>
              {experienceOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Skills */}
          <div>
            <label className="block mb-2 font-medium text-gray-700">
              Skills <span className="text-red-500">*</span>
              <span className="text-xs text-gray-400 ml-2">
                ({formData.skills.length}/20)
              </span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                name="skillInput"
                value={formData.skillInput}
                onChange={handleChange}
                onKeyPress={(e) => handleKeyPress(e, addSkill)}
                placeholder="Type a skill and press Enter or click +"
                className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400 outline-none transition"
              />
              <button
                type="button"
                onClick={addSkill}
                className="bg-green-500 text-white px-4 rounded-lg hover:bg-green-600 transition"
              >
                <FaPlus />
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {formData.skills.map((s, i) => (
                <span
                  key={i}
                  className="bg-green-100 text-green-800 px-3 py-1.5 rounded-full flex items-center gap-2 text-sm"
                >
                  {s}
                  <FaTimes
                    className="cursor-pointer hover:text-red-500 transition"
                    onClick={() => removeSkill(s)}
                  />
                </span>
              ))}
            </div>
          </div>

          {/* Languages */}
          <div>
            <label className="block mb-2 font-medium text-gray-700">
              Languages <span className="text-red-500">*</span>
              <span className="text-xs text-gray-400 ml-2">
                ({formData.languages.length}/10)
              </span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                name="languageInput"
                value={formData.languageInput}
                onChange={handleChange}
                onKeyPress={(e) => handleKeyPress(e, addLanguage)}
                placeholder="Type a language and press Enter or click +"
                className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400 outline-none transition"
              />
              <button
                type="button"
                onClick={addLanguage}
                className="bg-green-500 text-white px-4 rounded-lg hover:bg-green-600 transition"
              >
                <FaPlus />
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {formData.languages.map((l, i) => (
                <span
                  key={i}
                  className="bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full flex items-center gap-2 text-sm"
                >
                  {l}
                  <FaTimes
                    className="cursor-pointer hover:text-red-500 transition"
                    onClick={() => removeLanguage(l)}
                  />
                </span>
              ))}
            </div>
          </div>

          {/* Certifications */}
          <div>
            <label className="block mb-2 font-medium text-gray-700">
              Certifications{" "}
              <span className="text-xs text-gray-400">
                (Optional - {formData.existingCertifications.length + formData.certifications.length}/10)
              </span>
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleCertUpload}
              className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-400"
            />
            <p className="text-xs text-gray-400 mt-1">Max 5MB per file. JPEG, PNG, WebP accepted.</p>

            <div className="flex flex-wrap gap-3 mt-3">
              {/* Existing certifications */}
              {formData.existingCertifications.map((cert, i) => (
                <div key={`existing-${i}`} className="relative group">
                  <img
                    src={cert.image}
                    alt={cert.title || "Certificate"}
                    className="w-20 h-20 object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition"
                    onClick={() => removeCert(i, "existing")}
                  >
                    <FaTimes />
                  </button>
                </div>
              ))}

              {/* New uploads */}
              {formData.certifications.map((file, i) => {
                const preview = URL.createObjectURL(file);
                return (
                  <div key={`new-${i}`} className="relative group">
                    <img
                      src={preview}
                      alt="New cert"
                      className="w-20 h-20 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition"
                      onClick={() => removeCert(i, "local")}
                    >
                      <FaTimes />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!isFormValid || updating}
            className={`w-full py-3 rounded-lg text-white font-semibold flex items-center justify-center gap-2 transition-all ${isFormValid && !updating
                ? "bg-green-500 hover:bg-green-600 shadow-md hover:shadow-lg"
                : "bg-gray-400 cursor-not-allowed"
              }`}
          >
            {updating ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <FaSave /> Update Profile
              </>
            )}
          </button>
        </form>
      </main>
    </div>
  );
};

export default UpdateProfile;
