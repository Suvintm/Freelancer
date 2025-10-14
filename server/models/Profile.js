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
    skills: { type: [String], default: [] },
    languages: { type: [String], default: [] },
    experience: { type: String, default: "" },
    certifications: [
      {
        title: { type: String, default: "" },
        image: { type: String, default: "" },  
      },
    ],
    contactEmail: { type: String, default: "" },
    location: { country: { type: String, default: "" } },
  },
  { timestamps: true }
);

export const Profile = mongoose.model("Profile", profileSchema);
