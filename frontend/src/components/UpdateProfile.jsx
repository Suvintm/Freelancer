import { useEffect, useState } from "react";
import axios from "axios";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-toastify";
import {
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
import { useNavigate } from "react-router-dom";


const UpdateProfile = ({ languagesOptions = [] }) => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${backendURL}/api/profile`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      const p = res.data.profile;
      setProfile(p);
      setFormData((prev) => ({
        ...prev,
        about: p?.about || "",
        experience: p?.experience || "",
        contactEmail: p?.contactEmail || "",
        country: p?.location?.country || "",
        skills: p?.skills?.filter(Boolean) || [],
        languages: p?.languages?.filter(Boolean) || [],
        existingCertifications:
          p?.certifications?.filter((c) => c?.image) || [],
      }));
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

  // Toggle from quick-select list
  const toggleLanguageFromOptions = (lang) => {
    if (formData.languages.includes(lang)) {
      // remove
      setFormData({
        ...formData,
        languages: formData.languages.filter((l) => l !== lang),
      });
    } else {
      // add (respect max 10)
      if (formData.languages.length >= 10) {
        toast.warning("Maximum 10 languages allowed");
        return;
      }
      setFormData({
        ...formData,
        languages: [...formData.languages, lang],
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
    const totalCerts =
      formData.existingCertifications.length +
      formData.certifications.length;

    if (totalCerts + files.length > 10) {
      toast.warning("Maximum 10 certifications allowed");
      return;
    }

    const validFiles = files.filter((file) => {
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

      setFormData((prev) => ({
        ...prev,
        certifications: [],
        existingCertifications:
          res.data.profile.certifications?.filter((c) => c?.image) || [],
      }));
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
    <form
      onSubmit={handleUpdate}
      className="w-full space-y-7 text-sm md:text-[15px]"
    >
      {/* Header strip (inside card) */}
      <div className="flex items-center gap-2 mb-1">
        <div className="w-9 h-9 rounded-2xl bg-[#0B1220] border border-white/10 flex items-center justify-center">
          <FaUserEdit className="text-[#22C55E]" />
        </div>
        <div>
          <h2 className="font-semibold text-white text-base md:text-lg">
            Profile Details
          </h2>
          <p className="text-[11px] text-gray-400">
            Fill in these details to help clients understand you better.
          </p>
        </div>
      </div>

      {/* About */}
      <div>
        <label className="block mb-2 font-medium text-gray-200">
          About <span className="text-red-500">*</span>
        </label>
        <textarea
          name="about"
          value={formData.about}
          onChange={handleChange}
          placeholder="Tell something about yourself, your editing style, tools, and niche..."
          rows="4"
          maxLength={1000}
          className="w-full p-3.5 rounded-2xl bg-[#020617] border border-white/10
                     text-gray-100 placeholder:text-gray-500
                     focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB]
                     transition resize-none"
        />
        <p className="text-[11px] text-gray-500 mt-1 text-right">
          {formData.about.length}/1000
        </p>
      </div>

      {/* Contact Email + Country (2-col on md+) */}
      <div className="grid md:grid-cols-2 gap-5">
        {/* Contact Email */}
        <div>
          <label className="block mb-2 font-medium text-gray-200">
            Contact Email <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <FaEnvelope className="absolute left-3 top-3.5 text-gray-500" />
            <input
              type="email"
              name="contactEmail"
              value={formData.contactEmail}
              onChange={handleChange}
              placeholder="Enter your contact email"
              className="w-full p-3.5 pl-10 rounded-2xl bg-[#020617] border border-white/10
                         text-gray-100 placeholder:text-gray-500
                         focus:outline-none focus:ring-2 focus:ring-[#22C55E] focus:border-[#22C55E]
                         transition"
            />
          </div>
        </div>

        {/* Country */}
        <div>
          <label className="block mb-2 font-medium text-gray-200">
            Location <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-2">
            <FaGlobe className="text-gray-400" />
            <div className="flex-1">
              <Select
                options={countries}
                value={
                  formData.country
                    ? { label: formData.country, value: formData.country }
                    : null
                }
                onChange={handleCountryChange}
                placeholder="Select your country"
                classNamePrefix="react-select"
                styles={{
                  control: (base, state) => ({
                    ...base,
                    borderRadius: "0.75rem",
                    backgroundColor: "#020617",
                    borderColor: state.isFocused ? "#22C55E" : "#1F2937",
                    boxShadow: state.isFocused
                      ? "0 0 0 1px rgba(34,197,94,0.5)"
                      : "none",
                    ":hover": {
                      borderColor: "#22C55E",
                    },
                    minHeight: "44px",
                  }),
                  menu: (base) => ({
                    ...base,
                    backgroundColor: "#020617",
                    borderRadius: "0.75rem",
                    border: "1px solid rgba(148,163,184,0.4)",
                    overflow: "hidden",
                    zIndex: 30,
                  }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isSelected
                      ? "#22C55E"
                      : state.isFocused
                      ? "rgba(30,64,175,0.6)"
                      : "transparent",
                    color: state.isSelected ? "#0B1120" : "#E5E7EB",
                    fontSize: "13px",
                  }),
                  singleValue: (base) => ({
                    ...base,
                    color: "#E5E7EB",
                    fontSize: "13px",
                  }),
                  input: (base) => ({
                    ...base,
                    color: "#E5E7EB",
                  }),
                  placeholder: (base) => ({
                    ...base,
                    color: "#6B7280",
                    fontSize: "13px",
                  }),
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Experience */}
      <div>
        <label className="block mb-2 font-medium text-gray-200">
          Experience <span className="text-red-500">*</span>
        </label>
        <select
          name="experience"
          value={formData.experience}
          onChange={handleChange}
          className="w-full p-3.5 rounded-2xl bg-[#020617] border border-white/10
                     text-gray-100 placeholder:text-gray-500
                     focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB]
                     transition"
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
     {/* ------------------------- SKILLS SECTION ------------------------- */}
<div>
  <label className="block mb-2 font-medium text-gray-200">
    Skills <span className="text-red-500">*</span>
    <span className="text-[11px] text-gray-400 ml-2">
      ({formData.skills.length}/20)
    </span>
  </label>

  {/* Input row */}
  <div className="flex gap-2">
    <input
      type="text"
      name="skillInput"
      value={formData.skillInput}
      onChange={handleChange}
      onKeyPress={(e) => handleKeyPress(e, addSkill)}
      placeholder="Type a skill and press Enter or click +"
      className="flex-1 p-3.5 rounded-2xl bg-[#020617] border border-white/10
                 text-gray-100 placeholder:text-gray-500
                 focus:outline-none focus:ring-2 focus:ring-[#22C55E] focus:border-[#22C55E]
                 transition"
    />
    <button
      type="button"
      onClick={addSkill}
      className="bg-gradient-to-r from-[#22C55E] to-[#16A34A]
                 text-white px-4 rounded-2xl text-sm
                 hover:brightness-110 transition flex items-center justify-center"
    >
      <FaPlus />
    </button>
  </div>

  {/* ================== QUICK-SELECT SKILL OPTIONS ================== */}
  <div className="mt-3 flex flex-wrap gap-2">

    {[
      "Video Editing",
      "Reels Editing",
      "Wedding Editing",
      "Cinematic Color Grading",
      "Sound Design",
      "Music Sync",
      "Logo Animation",
      "Motion Graphics",
      "VFX Cleanup",
      "Green Screen Keying",
      "Photo Retouching",
      "Thumbnail Design",
      "Social Media Editing",
      "YouTube Editing",
      "After Effects",
      "Premiere Pro",
      "DaVinci Resolve",
      "CapCut Pro",
      "Final Cut Pro",
      "SFX Editing",
    ].map((skill) => {
      const active = formData.skills.includes(skill);
      return (
        <button
          key={skill}
          type="button"
          onClick={() => {
            if (active) {
              setFormData({
                ...formData,
                skills: formData.skills.filter((s) => s !== skill),
              });
            } else {
              if (formData.skills.length >= 20) {
                toast.warning("Maximum 20 skills allowed");
                return;
              }
              setFormData({
                ...formData,
                skills: [...formData.skills, skill],
              });
            }
          }}
          className={`px-3 py-1.5 rounded-full text-xs border transition 
            ${
              active
                ? "bg-emerald-500/20 border-emerald-400 text-emerald-200"
                : "bg-[#020617] border-white/15 text-gray-300 hover:border-emerald-400/70 hover:text-emerald-100"
            }`}
        >
          {skill}
        </button>
      );
    })}
  </div>

  {/* ================== DISPLAY SELECTED SKILLS ================== */}
  <div className="flex flex-wrap gap-2 mt-3">
    {formData.skills.map((s, i) => (
      <span
        key={i}
        className="bg-emerald-500/15 border border-emerald-400/60
                   text-emerald-200 px-3 py-1.5 rounded-full flex items-center gap-2 text-xs"
      >
        {s}
        <FaTimes
          className="cursor-pointer hover:text-red-400 transition"
          onClick={() =>
            setFormData({
              ...formData,
              skills: formData.skills.filter((skill) => skill !== s),
            })
          }
        />
      </span>
    ))}
  </div>
</div>


      {/* Languages */}
      <div>
        <label className="block mb-2 font-medium text-gray-200">
          Languages <span className="text-red-500">*</span>
          <span className="text-[11px] text-gray-400 ml-2">
            ({formData.languages.length}/10)
          </span>
        </label>

        {/* Input row (keep old logic) */}
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            name="languageInput"
            value={formData.languageInput}
            onChange={handleChange}
            onKeyPress={(e) => handleKeyPress(e, addLanguage)}
            placeholder="Type a language and press Enter or click +"
            className="flex-1 p-3.5 rounded-2xl bg-[#020617] border border-white/10
                       text-gray-100 placeholder:text-gray-500
                       focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB]
                       transition"
          />
          <button
            type="button"
            onClick={addLanguage}
            className="bg-gradient-to-r from-[#2563EB] to-[#4F46E5]
                       text-white px-4 rounded-2xl text-sm
                       hover:brightness-110 transition flex items-center justify-center"
          >
            <FaPlus />
          </button>
        </div>

        {/* Quick-select chips from languagesOptions */}
        {languagesOptions.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {languagesOptions.map((lang) => {
              const active = formData.languages.includes(lang);
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => toggleLanguageFromOptions(lang)}
                  className={`px-3 py-1.5 rounded-full text-xs border transition 
                    ${
                      active
                        ? "bg-blue-500/20 border-blue-400 text-blue-100"
                        : "bg-[#020617] border-white/15 text-gray-300 hover:border-blue-400/70 hover:text-blue-100"
                    }`}
                >
                  {lang}
                </button>
              );
            })}
          </div>
        )}

        {/* Selected languages display */}
        <div className="flex flex-wrap gap-2 mt-1">
          {formData.languages.map((l, i) => (
            <span
              key={i}
              className="bg-blue-500/15 border border-blue-400/60
                         text-blue-100 px-3 py-1.5 rounded-full flex items-center gap-2 text-xs"
            >
              {l}
              <FaTimes
                className="cursor-pointer hover:text-red-400 transition"
                onClick={() => removeLanguage(l)}
              />
            </span>
          ))}
        </div>
      </div>

      {/* Certifications */}
      <div>
        <label className="block mb-2 font-medium text-gray-200">
          Certifications{" "}
          <span className="text-[11px] text-gray-400">
            (Optional -{" "}
            {formData.existingCertifications.length +
              formData.certifications.length}
            /10)
          </span>
        </label>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleCertUpload}
          className="w-full p-2 rounded-2xl bg-[#020617] border border-white/10
                     text-xs text-gray-300"
        />
        <p className="text-[11px] text-gray-500 mt-1">
          Max 5MB per file. JPEG, PNG, WebP accepted.
        </p>

        <div className="flex flex-wrap gap-3 mt-3">
          {/* Existing certifications */}
          {formData.existingCertifications.map((cert, i) => (
            <div key={`existing-${i}`} className="relative group">
              <img
                src={cert.image}
                alt={cert.title || "Certificate"}
                className="w-20 h-20 object-cover rounded-lg border border-white/15
                           shadow-[0_0_18px_rgba(0,0,0,0.6)]"
              />
              <button
                type="button"
                className="absolute -top-2 -right-2 bg-red-500 text-white
                           w-5 h-5 rounded-full flex items-center justify-center text-xs
                           opacity-0 group-hover:opacity-100 transition"
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
                  className="w-20 h-20 object-cover rounded-lg border border-white/15
                             shadow-[0_0_18px_rgba(0,0,0,0.6)]"
                />
                <button
                  type="button"
                  className="absolute -top-2 -right-2 bg-red-500 text-white
                             w-5 h-5 rounded-full flex items-center justify-center text-xs
                             opacity-0 group-hover:opacity-100 transition"
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
        className={`w-full py-3.5 rounded-2xl text-white font-semibold 
                    flex items-center justify-center gap-2 text-sm md:text-base
                    transition-all ${
                      isFormValid && !updating
                        ? "bg-gradient-to-r from-[#22C55E] via-[#16A34A] to-[#15803D] hover:shadow-[0_18px_40px_rgba(22,163,74,0.5)] hover:translate-y-[1px]"
                        : "bg-gray-600 cursor-not-allowed opacity-70"
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
  );
};

export default UpdateProfile;
