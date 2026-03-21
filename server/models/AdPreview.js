import mongoose from "mongoose";

const adPreviewSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      unique: true,
      default: "default_previews",
    },
    homeAdBanner: {
      url: { type: String, required: true },
      publicId: { type: String, required: true },
      resourceType: { type: String, default: "image" },
    },
    reelAd: {
      url: { type: String, required: true },
      publicId: { type: String, required: true },
      resourceType: { type: String, default: "video" },
    },
  },
  { timestamps: true }
);

// Singleton helper
adPreviewSchema.statics.getPreviews = async function() {
  let previews = await this.findOne({ key: "default_previews" });
  if (!previews) {
    // Initial placeholders
    previews = await this.create({
      key: "default_previews",
      homeAdBanner: {
        url: "https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=2071&auto=format&fit=crop",
        publicId: "sample",
        resourceType: "image",
      },
      reelAd: {
        url: "https://www.w3schools.com/html/movie.mp4",
        publicId: "sample_video",
        resourceType: "video",
      },
    });
  }
  return previews;
};

export const AdPreview = mongoose.model("AdPreview", adPreviewSchema);
