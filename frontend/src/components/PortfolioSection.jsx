import React, { useState, useEffect } from "react";
import { FaPlus, FaTrash, FaFilm, FaImage } from "react-icons/fa";
import { useAppContext } from "../context/AppContext";
import axios from "axios";

const PortfolioSection = () => {
  const { user, backendURL } = useAppContext();

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [originalFile, setOriginalFile] = useState(null);
  const [editedFile, setEditedFile] = useState(null);
  const [originalPreview, setOriginalPreview] = useState(null);
  const [editedPreview, setEditedPreview] = useState(null);
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(false);

  // Delete confirmation state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // File preview modal state
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [previewType, setPreviewType] = useState(""); // "video" or "image"

  const fetchPortfolios = async () => {
    if (!user) return;
    try {
      const { data } = await axios.get(`${backendURL}/api/portfolio`, {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      });
      // Handle both array response and object with portfolios property
      setPortfolios(Array.isArray(data) ? data : (data.portfolios || []));
    } catch (err) {
      console.error("Error fetching portfolios:", err);
      setPortfolios([]); // Set empty array on error
    }
  };

  useEffect(() => {
    fetchPortfolios();
  }, [user]);

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const previewURL = URL.createObjectURL(file);
    if (type === "original") {
      setOriginalFile(file);
      setOriginalPreview(previewURL);
    }
    if (type === "edited") {
      setEditedFile(file);
      setEditedPreview(previewURL);
    }
  };

  const handleAddPortfolio = async (e) => {
    e.preventDefault();
    if (!title || !description || !originalFile || !editedFile) return;

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("originalClip", originalFile);
    formData.append("editedClip", editedFile);

    try {
      setLoading(true);
      const { data } = await axios.post(
        `${backendURL}/api/portfolio`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        }
      );
      setPortfolios([data.portfolio, ...portfolios]);
      setTitle("");
      setDescription("");
      setOriginalFile(null);
      setEditedFile(null);
      setOriginalPreview(null);
      setEditedPreview(null);
      setShowForm(false);
      setLoading(false);
    } catch (err) {
      console.error("Error uploading portfolio:", err);
      setLoading(false);
    }
  };

  const confirmDelete = (id) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const handleDeletePortfolio = async () => {
    if (!deleteId) return;

    try {
      await axios.delete(`${backendURL}/api/portfolio/${deleteId}`, {
        withCredentials: true,
      });
      setPortfolios(portfolios.filter((p) => p._id !== deleteId));
      setShowDeleteModal(false);
      setDeleteId(null);
    } catch (err) {
      console.error("Error deleting portfolio:", err);
    }
  };

  const isVideo = (url) =>
    url?.endsWith(".mp4") || url?.endsWith(".mov") || url?.endsWith(".webm");

  const openPreview = (fileUrl, type) => {
    setPreviewFile(fileUrl);
    setPreviewType(type);
    setShowPreviewModal(true);
  };

  return (
    <div className="p-6">
      {/* Add Portfolio Button */}
      <button
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-2xl hover:bg-green-700"
        onClick={() => setShowForm(true)}
      >
        <FaPlus /> Add Portfolio
      </button>

      {/* Popup Form */}
      {/* Popup Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 p-4 flex justify-center items-center z-50 overflow-auto">
          <div className="bg-white p-6 rounded-xl w-full max-w-lg sm:max-w-md md:max-w-lg relative shadow-lg max-h-[calc(100vh-2rem)] overflow-y-auto">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-xl font-bold"
              onClick={() => setShowForm(false)}
            >
              &times;
            </button>
            <h2 className="text-xl font-semibold mb-4 text-center">
              Add Portfolio
            </h2>
            <form className="flex flex-col gap-3" onSubmit={handleAddPortfolio}>
              <input
                type="text"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="border-white shadow-md shadow-black px-3 py-2 rounded-2xl"
                required
              />
              <textarea
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="border-white shadow-md shadow-black px-3 py-2 rounded-2xl"
                rows={3}
                required
              />

              {/* Original File Input & Preview */}
              <div>
                <label className="block mb-1 font-semibold">
                  Original File:
                </label>
                <input
                  type="file"
                  accept="video/*,image/*"
                  onChange={(e) => handleFileChange(e, "original")}
                  className="border-white shadow-md shadow-black bg-green-200 px-3 py-2 w-full rounded-2xl"
                  required
                />
                {originalPreview && (
                  <div
                    className="mt-2 cursor-pointer"
                    onClick={() =>
                      openPreview(
                        originalPreview,
                        originalFile.type.startsWith("video")
                          ? "video"
                          : "image"
                      )
                    }
                  >
                    {originalFile.type.startsWith("video") ? (
                      <video
                        src={originalPreview}
                        controls
                        className="w-full h-40 sm:h-32 object-cover rounded-2xl pointer-events-none"
                        controlsList="nodownload noremoteplayback"
                        disablePictureInPicture
                      />
                    ) : (
                      <img
                        src={originalPreview}
                        alt="Original Preview"
                        className="w-full h-40 sm:h-32 object-cover rounded-2xl"
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Edited File Input & Preview */}
              <div>
                <label className="block mb-1 font-semibold">Edited File:</label>
                <input
                  type="file"
                  accept="video/*,image/*"
                  onChange={(e) => handleFileChange(e, "edited")}
                  className="border-white shadow-md shadow-black bg-green-200 px-3 py-2 w-full rounded-2xl"
                  required
                />
                {editedPreview && (
                  <div
                    className="mt-2 cursor-pointer"
                    onClick={() =>
                      openPreview(
                        editedPreview,
                        editedFile.type.startsWith("video") ? "video" : "image"
                      )
                    }
                  >
                    {editedFile.type.startsWith("video") ? (
                      <video
                        src={editedPreview}
                        controls
                        className="w-full h-40 sm:h-32 object-cover rounded-2xl pointer-events-none"
                        controlsList="nodownload noremoteplayback"
                        disablePictureInPicture
                      />
                    ) : (
                      <img
                        src={editedPreview}
                        alt="Edited Preview"
                        className="w-full h-40 sm:h-32 object-cover rounded-2xl"
                      />
                    )}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? "Uploading..." : "Add Portfolio"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Portfolio List */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.isArray(portfolios) && portfolios.map((p) => (
          <div
            key={p._id}
            className="border-black rounded-xl overflow-hidden shadow-md bg-white shadow-black hover:shadow-lg transition-all"
          >
            <div className="p-4">
              <h3 className="font-bold text-lg">{p.title}</h3>
              <p className="text-gray-700 mt-1">{p.description}</p>
            </div>
            <div className="flex flex-col md:flex-row gap-2">
              {p.originalClip && (
                <div
                  className="relative w-full object-cover p-2  rounded-2xl md:w-1/2 cursor-pointer"
                  onClick={() =>
                    openPreview(
                      p.originalClip,
                      isVideo(p.originalClip) ? "video" : "image"
                    )
                  }
                >
                  {isVideo(p.originalClip) ? (
                    <video
                      src={p.originalClip}
                      controls
                      className="w-full h-40 object-cover pointer-events-none"
                    />
                  ) : (
                    <img
                      src={p.originalClip}
                      alt="Original"
                      className="w-full h-40 object-cover"
                    />
                  )}
                  <span className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-2xl m-2 flex items-center gap-1">
                    <FaFilm /> Original
                  </span>
                </div>
              )}
              {p.editedClip && (
                <div
                  className="relative w-full p-2 rounded-2xl md:w-1/2 cursor-pointer"
                  onClick={() =>
                    openPreview(
                      p.editedClip,
                      isVideo(p.editedClip) ? "video" : "image"
                    )
                  }
                >
                  {isVideo(p.editedClip) ? (
                    <video
                      src={p.editedClip}
                      controls
                      className="w-full h-40 object-cover pointer-events-none"
                    />
                  ) : (
                    <img
                      src={p.editedClip}
                      alt="Edited"
                      className="w-full h-40 object-cover"
                    />
                  )}
                  <span className="absolute top-2 left-2 bg-green-600 bg-opacity-80 text-white text-xs px-2 py-1 rounded-2xl m-2 flex items-center gap-1">
                    <FaImage /> Edited
                  </span>
                </div>
              )}
            </div>

            <div className="p-4 flex justify-between items-center">
              <span className="text-sm text-gray-500">
                Uploaded: {new Date(p.uploadedAt).toLocaleString()}
              </span>
              <button
                className="text-red-600 hover:text-red-800"
                onClick={() => confirmDelete(p._id)}
              >
                <FaTrash />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-sm shadow-lg text-center">
            <h3 className="text-lg font-semibold mb-4">Are you sure?</h3>
            <p className="mb-4">
              Do you really want to delete this portfolio? This action cannot be
              undone.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={handleDeletePortfolio}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50">
          <div className="relative w-full max-w-3xl p-4">
            <button
              className="absolute top-2 right-2 text-white text-2xl font-bold"
              onClick={() => setShowPreviewModal(false)}
            >
              &times;
            </button>
            {previewType === "video" ? (
              <video
                src={previewFile}
                controls
                autoPlay
                className="w-full max-h-[80vh] object-contain"
              />
            ) : (
              <img
                src={previewFile}
                alt="Preview"
                className="w-full max-h-[80vh] object-contain rounded"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioSection;
