import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    index: true,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    index: true,
    trim: true,
  },
  otp: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["register", "login"],
    required: true,
  },
  attempts: {
    type: Number,
    default: 0,
  },
  // Data for registration (stored temporarily until verified)
  registrationData: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600, // Automagically deleted after 10 minutes (600 seconds)
  },
});

export default mongoose.models.Otp || mongoose.model("Otp", otpSchema);
