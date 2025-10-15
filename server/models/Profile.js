// models/Profile.js
import mongoose from "mongoose";

const profileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    about: { type: String, default: "" },
    portfolio: [{ type: mongoose.Schema.Types.ObjectId, ref: "Portfolio" }],
    skills: { type: [String] },
    languages: { type: [String] },
    experience: { type: String, default: "" },
    certifications: [
      {
        title: { type: String },
        image: { type: String },
      },
    ],
    contactEmail: { type: String, default: "" },
    location: { country: { type: String, default: "" } },
  },
  { timestamps: true }
);

export const Profile = mongoose.model("Profile", profileSchema);
