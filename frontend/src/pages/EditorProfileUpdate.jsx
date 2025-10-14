import { useState } from "react";
import { FaArrowAltCircleRight, FaPlus } from "react-icons/fa";
import { useAppContext } from "../context/AppContext";
import axios from "axios";
import logo from "../assets/logo.png";
import UpdateProfile from "../components/UpdateProfile"; // ✅ new component import

const EditorProfileUpdate = () => {
  const { user, setUser, backendURL } = useAppContext();
  const [profileImage, setProfileImage] = useState(
    user?.profilePicture ||
      "https://cdn-icons-png.flaticon.com/512/847/847969.png"
  );
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleBack = () => window.history.back();

  const handleImageChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setProfileImage(URL.createObjectURL(selected)); // preview
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select an image first.");
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("profilePicture", file);

      const token = user?.token;
      const res = await axios.patch(
        `${backendURL}/api/auth/update-profile-picture`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const updatedUser = { ...user, ...res.data.user };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));

      alert("✅ Profile picture updated successfully!");
    } catch (error) {
      console.error("Error uploading:", error);
      alert("❌ Failed to update profile picture.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ✅ Top Navbar */}
      <nav className="w-full bg-white shadow-sm py-4 px-6 flex justify-between items-center">
        <div className="flex items-center gap-2 justify-center">
          <img
            src={logo}
            alt="Logo"
            className="w-8 h-8 rounded-full object-cover"
          />
          <h1 className="text-xl font-bold">SuviX</h1>
        </div>
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-black hover:text-green-600 transition-colors"
        >
          <span>Back</span> <FaArrowAltCircleRight />
        </button>
      </nav>

      {/* ✅ Main Section */}
      <main className="flex flex-col items-center justify-start flex-grow py-10 px-6">
        {/* Profile Section */}
        <div className="relative mt-4">
          <img
            src={profileImage}
            alt="Profile"
            className="w-40 h-40 rounded-full object-cover border-4 border-green-500 shadow-md"
          />
          <label
            htmlFor="uploadProfile"
            className="absolute bottom-2 right-2 bg-green-500 hover:bg-green-600 text-white p-2 rounded-full shadow-lg cursor-pointer transition-all duration-200"
          >
            <FaPlus className="text-sm" />
            <input
              id="uploadProfile"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </label>
        </div>

        <h2 className="mt-4 text-2xl font-semibold text-gray-800">
          {user?.name || "Editor Name"}
        </h2>
        <p className="text-gray-500">{user?.email}</p>

        <button
          onClick={handleUpload}
          disabled={uploading}
          className={`mt-6 bg-green-500 hover:bg-green-600 text-white font-medium px-6 py-2 rounded-full shadow transition-all duration-200 ${
            uploading ? "opacity-70 cursor-not-allowed" : ""
          }`}
        >
          {uploading ? "Uploading..." : "Change Your Profile"}
        </button>

        {/* ✅ Update Profile Section */}
        <div className="w-full max-w-4xl mt-12">
          <div className="bg-white shadow-md rounded-2xl p-2 items-center justify-center">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">
              Update Your Profile
            </h3>
            <UpdateProfile /> {/* You’ll design this */}
          </div>
        </div>
      </main>
    </div>
  );
};

export default EditorProfileUpdate;
