import React, { useState, useEffect } from "react";
import { FaFilm, FaImage } from "react-icons/fa";
import { useAppContext } from "../context/AppContext";
import axios from "axios";

const PublicPortfolio = ({ userId }) => {
  const { backendURL } = useAppContext();
  const [portfolios, setPortfolios] = useState([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [previewType, setPreviewType] = useState("");

  // Fetch portfolios by userId (public route)
  const fetchPortfolios = async () => {
    if (!userId) return;
    try {
      const { data } = await axios.get(
        `${backendURL}/api/portfolio/user/${userId}`
      );
      setPortfolios(data);
    } catch (err) {
      console.error("Error fetching public portfolios:", err);
      setPortfolios([]); // prevent undefined
    }
  };

  useEffect(() => {
    fetchPortfolios();
  }, [userId]);

  // Check if file is a video
  const isVideo = (url) =>
    url?.endsWith(".mp4") || url?.endsWith(".mov") || url?.endsWith(".webm");

  // Open modal preview
  const openPreview = (fileUrl, type) => {
    setPreviewFile(fileUrl);
    setPreviewType(type);
    setShowPreviewModal(true);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800">
        Portfolio Showcase
      </h2>

      {portfolios.length === 0 ? (
        <p className="text-gray-500 text-center">
          No portfolios available yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {portfolios.map((p) => (
            <div
              key={p._id}
              className="border border-gray-300 rounded-xl overflow-hidden shadow-md bg-white hover:shadow-lg transition-all"
            >
              <div className="p-4">
                <h3 className="font-bold text-lg">{p.title}</h3>
                <p className="text-gray-700 mt-1">{p.description}</p>
              </div>

              <div className="flex flex-col md:flex-row gap-2">
                {p.originalClip && (
                  <div
                    className="relative w-full p-2 rounded-2xl md:w-1/2 cursor-pointer"
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
                    <span className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-2xl flex items-center gap-1">
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
                    <span className="absolute top-2 left-2 bg-green-600 bg-opacity-80 text-white text-xs px-2 py-1 rounded-2xl flex items-center gap-1">
                      <FaImage /> Edited
                    </span>
                  </div>
                )}
              </div>

              <div className="p-4 text-sm text-gray-500">
                Uploaded: {new Date(p.uploadedAt).toLocaleString()}
              </div>
            </div>
          ))}
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

export default PublicPortfolio;
