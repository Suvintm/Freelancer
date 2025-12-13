import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
    },
    password: {
      type: String,
      required: function () {
        // Password not required for OAuth users
        return !this.googleId && !this.facebookId;
      },
      minlength: [8, "Password must be at least 8 characters"],
    },
    role: {
      type: String,
      enum: {
        values: ["editor", "client", "pending"],
        message: "Role must be 'editor', 'client', or 'pending'",
      },
      required: [true, "Role is required"],
    },
    profileCompleted: {
      type: Boolean,
      default: false,
    },
    profilePicture: {
      type: String,
      default: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
    },
    // OAuth fields
    googleId: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple null values
    },
    facebookId: {
      type: String,
      unique: true,
      sparse: true,
    },
    authProvider: {
      type: String,
      enum: ["local", "google", "facebook"],
      default: "local",
    },
    // Ban fields (controlled by admin)
    isBanned: {
      type: Boolean,
      default: false,
    },
    banReason: {
      type: String,
      default: null,
    },
    bannedAt: {
      type: Date,
      default: null,
    },
    bannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
userSchema.index({ email: 1 });
userSchema.index({ role: 1, profileCompleted: 1 });
userSchema.index({ name: 1 });
userSchema.index({ googleId: 1 });

export default mongoose.model("User", userSchema);
