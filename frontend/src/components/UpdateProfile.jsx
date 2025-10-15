import { useEffect, useState } from "react";
import axios from "axios";
import { useAppContext } from "../context/AppContext";
import {
  FaArrowLeft,
  FaGlobe,
  FaEnvelope,
  FaUserEdit,
  FaPlus,
  FaTimes,
} from "react-icons/fa";
import countryList from "react-select-country-list";
import Select from "react-select";

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
    const timer = setTimeout(() => {
      fetchProfile();
    }, 2000);
    return () => clearTimeout(timer);
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
        skills: p?.skills || [],
        languages: p?.languages || [],
        existingCertifications: p?.certifications || [],
      });
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleCountryChange = (selected) =>
    setFormData({ ...formData, country: selected.label });

  const addSkill = () => {
    if (
      formData.skillInput.trim() &&
      !formData.skills.includes(formData.skillInput.trim())
    ) {
      setFormData({
        ...formData,
        skills: [...formData.skills, formData.skillInput.trim()],
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
    if (
      formData.languageInput.trim() &&
      !formData.languages.includes(formData.languageInput.trim())
    ) {
      setFormData({
        ...formData,
        languages: [...formData.languages, formData.languageInput.trim()],
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
    setFormData({
      ...formData,
      certifications: [...formData.certifications, ...files],
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
    if (!isFormValid) return alert("Please fill all required fields!");

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

      alert("✅ Profile updated successfully!");
      setProfile(res.data.profile);

      setFormData({
        ...formData,
        certifications: [],
        existingCertifications: res.data.profile.certifications || [],
      });
    } catch (err) {
      console.error("Update failed:", err);
      alert("❌ Failed to update profile.");
    } finally {
      setUpdating(false);
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

  if (loading)
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col animate-pulse">
        <nav className="w-full bg-white shadow py-4 px-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-200 rounded-full" />
            <div className="w-40 h-5 bg-gray-200 rounded-md" />
          </div>
          <div className="w-24 h-5 bg-gray-200 rounded-md" />
        </nav>
        <main className="flex-grow py-10 px-6 md:px-10 flex justify-center">
          <div className="w-full max-w-2xl bg-white p-8 rounded-2xl shadow-md border space-y-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="w-1/3 h-4 bg-gray-200 rounded" />
                <div className="w-full h-10 bg-gray-200 rounded-lg" />
              </div>
            ))}
            <div className="w-full h-12 bg-gray-200 rounded-lg" />
          </div>
        </main>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar */}
      <nav className="w-full bg-white shadow py-4 px-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <FaUserEdit className="text-green-600 text-xl" />
          <h1 className="font-bold text-lg">Edit Your Profile</h1>
        </div>
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-gray-700 hover:text-green-600"
        >
          <FaArrowLeft /> Back
        </button>
      </nav>

      {/* Main Form */}
      <main className="flex-grow py-10 px-2 md:px-10 flex justify-center">
        <form
          onSubmit={handleUpdate}
          className="w-full max-w-2xl bg-white p-8 rounded-2xl shadow-md border"
        >
          {/* About */}
          <label className="block mb-2 font-medium text-gray-700">
            About *
          </label>
          <textarea
            name="about"
            value={formData.about}
            onChange={handleChange}
            placeholder="Tell something about yourself..."
            rows="4"
            className="w-full p-3 border rounded-lg mb-4 focus:ring-2 focus:ring-green-400"
          />

          {/* Contact Email */}
          <label className="block mb-2 font-medium text-gray-700">
            Contact Email *
          </label>
          <div className="relative mb-4">
            <FaEnvelope className="absolute left-3 top-3 text-gray-400" />
            <input
              type="email"
              name="contactEmail"
              value={formData.contactEmail}
              onChange={handleChange}
              placeholder="Enter your contact email"
              className="w-full p-3 pl-10 border rounded-lg focus:ring-2 focus:ring-green-400"
            />
          </div>

          {/* Country */}
          <label className="block mb-2 font-medium text-gray-700">
            Location *
          </label>
          <div className="flex items-center mb-4">
            <FaGlobe className="text-gray-400 mr-2" />
            <Select
              options={countries}
              value={
                formData.country
                  ? { label: formData.country, value: formData.country }
                  : null
              }
              onChange={handleCountryChange}
              placeholder="Select your country"
              className="w-full"
            />
          </div>

          {/* Experience */}
          <label className="block mb-2 font-medium text-gray-700">
            Experience *
          </label>
          <select
            name="experience"
            value={formData.experience}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg mb-4 focus:ring-2 focus:ring-green-400"
          >
            <option value="">Select experience</option>
            {experienceOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>

          {/* Skills */}
          <label className="block mb-2 font-medium text-gray-700">
            Skills *
          </label>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              name="skillInput"
              value={formData.skillInput}
              onChange={handleChange}
              placeholder="Enter a skill"
              className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-green-400"
            />
            <button
              type="button"
              onClick={addSkill}
              className="bg-green-500 text-white px-4 rounded-lg hover:bg-green-600"
            >
              <FaPlus />
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {formData.skills.map((s, i) => (
              <span
                key={i}
                className="bg-green-100 text-green-800 px-3 py-1 rounded-full flex items-center gap-1"
              >
                {s}
                <FaTimes
                  className="cursor-pointer"
                  onClick={() => removeSkill(s)}
                />
              </span>
            ))}
          </div>

          {/* Languages */}
          <label className="block mb-2 font-medium text-gray-700">
            Languages *
          </label>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              name="languageInput"
              value={formData.languageInput}
              onChange={handleChange}
              placeholder="Enter a language"
              className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-green-400"
            />
            <button
              type="button"
              onClick={addLanguage}
              className="bg-green-500 text-white px-4 rounded-lg hover:bg-green-600"
            >
              <FaPlus />
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {formData.languages.map((l, i) => (
              <span
                key={i}
                className="bg-green-100 text-green-800 px-3 py-1 rounded-full flex items-center gap-1"
              >
                {l}
                <FaTimes
                  className="cursor-pointer"
                  onClick={() => removeLanguage(l)}
                />
              </span>
            ))}
          </div>

          {/* Certifications */}
          <label className="block mb-2 font-medium text-gray-700">
            Certifications (Optional)
          </label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleCertUpload}
            className="mb-2"
          />

          <div className="flex flex-wrap gap-2 mb-4">
            {/* Existing certifications */}
            {formData.existingCertifications.map((cert, i) =>
              cert?.image ? (
                <div key={i} className="relative">
                  <img
                    src={cert.image}
                    alt={cert.title || "Certificate"}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <FaTimes
                    className="absolute top-0 right-0 text-red-600 cursor-pointer"
                    onClick={() => removeCert(i, "existing")}
                  />
                </div>
              ) : null
            )}

            {/* New uploads */}
            {formData.certifications.map((file, i) => {
              const preview = file ? URL.createObjectURL(file) : null;
              return preview ? (
                <div key={i} className="relative">
                  <img
                    src={preview}
                    alt="cert"
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <FaTimes
                    className="absolute top-0 right-0 text-red-600 cursor-pointer"
                    onClick={() => removeCert(i, "local")}
                  />
                </div>
              ) : null;
            })}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!isFormValid || updating}
            className={`w-full py-3 rounded-lg text-white font-semibold ${
              isFormValid
                ? "bg-green-500 hover:bg-green-600"
                : "bg-gray-400 cursor-not-allowed"
            } transition-all`}
          >
            {updating ? "Updating..." : "Update Profile"}
          </button>
        </form>
      </main>
    </div>
  );
};

export default UpdateProfile;
