import mongoose from "mongoose";

const profileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    about: {
      type: String,
      default: "",
      maxlength: [1000, "About section cannot exceed 1000 characters"],
    },
    portfolio: [{ type: mongoose.Schema.Types.ObjectId, ref: "Portfolio" }],
    skills: {
      type: [String],
      validate: {
        validator: function (arr) {
          return arr.length <= 20;
        },
        message: "Maximum 20 skills allowed",
      },
    },
    languages: {
      type: [String],
      validate: {
        validator: function (arr) {
          return arr.length <= 10;
        },
        message: "Maximum 10 languages allowed",
      },
    },
    experience: {
      type: String,
      default: "",
      enum: {
        values: ["", "0-6 months", "6-12 months", "1-2 years", "2-3 years", "3-5 years", "5+ years"],
        message: "Invalid experience value",
      },
    },
    certifications: [
      {
        title: {
          type: String,
          maxlength: [100, "Certification title cannot exceed 100 characters"],
        },
        image: { type: String },
      },
    ],
    contactEmail: {
      type: String,
      default: "",
      lowercase: true,
      trim: true,
    },
    location: {
      country: {
        type: String,
        default: "",
        maxlength: [100, "Country name cannot exceed 100 characters"],
      },
    },
    
    // Social Links
    socialLinks: {
      instagram: { type: String, default: "" },
      youtube: { type: String, default: "" },
      twitter: { type: String, default: "" },
      linkedin: { type: String, default: "" },
      website: { type: String, default: "" },
      behance: { type: String, default: "" },
      dribbble: { type: String, default: "" },
    },
    
    // Hourly Rate
    hourlyRate: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
      currency: { type: String, default: "INR" },
    },
    
    // Availability Status
    availability: {
      type: String,
      enum: ["", "full-time", "part-time", "weekends", "not-available"],
      default: "",
    },
    
    // Response Time
    responseTime: {
      type: String,
      enum: ["", "within-hour", "within-day", "1-2-days", "3-5-days"],
      default: "",
    },
  },
  { timestamps: true }
);

// Indexes for faster queries
profileSchema.index({ user: 1 });
profileSchema.index({ skills: 1 });
profileSchema.index({ languages: 1 });

export const Profile = mongoose.model("Profile", profileSchema);
