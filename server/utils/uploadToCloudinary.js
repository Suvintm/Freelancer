import cloudinary from "../config/cloudinary.js";

// ✅ Upload file buffer to Cloudinary (Public Access)
export const uploadToCloudinary = async (fileBuffer, folder = "profiles", options = {}) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "auto",
        access_mode: "public",
        timeout: 120000, // 👈 120 seconds for video transcoding
        ...options
      },
      (error, result) => {
        if (error) {
          console.error("❌ Cloudinary upload error:", error);
          return reject(new Error(`Upload failed: ${error.message}`));
        }
        console.log("✅ Cloudinary upload success:", result.secure_url);
        // Return full result to preserve 'eager' transformations
        resolve(result);
      }
    );

    stream.end(fileBuffer);
  });
};

// ✅ Delete file from Cloudinary (any type)
export const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "auto",
    });
    return result;
  } catch (error) {
    console.error("Cloudinary deletion error:", error);
    throw new Error("Failed to delete file from Cloudinary");
  }
};
