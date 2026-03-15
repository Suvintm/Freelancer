import cloudinary from "../config/cloudinary.js";

// ✅ Upload file buffer to Cloudinary (Public Access)
export const uploadToCloudinary = async (fileBuffer, folder = "profiles") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "auto",
        access_mode: "public", // 👈 ensures file is publicly viewable
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          return reject(new Error(`Upload failed: ${error.message}`));
        }
        console.log("✅ Cloudinary upload success:", result.secure_url);
        resolve({ url: result.secure_url, public_id: result.public_id });
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
