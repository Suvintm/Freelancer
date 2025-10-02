import cloudinary from "../config/cloudinary.js";

export const uploadToCloudinary = async (fileBuffer, folder = "profiles") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          return reject(new Error("Image upload failed"));
        }
        resolve(result.secure_url);
      }
    );
    stream.end(fileBuffer);
  });
};
