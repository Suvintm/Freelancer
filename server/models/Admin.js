import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const adminSchema = new mongoose.Schema(
  {
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
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // Don't include password in queries by default
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    role: {
      type: String,
      enum: ["superadmin", "admin", "moderator"],
      default: "admin",
    },
    permissions: {
      users: { type: Boolean, default: true },
      orders: { type: Boolean, default: true },
      gigs: { type: Boolean, default: true },
      analytics: { type: Boolean, default: true },
      settings: { type: Boolean, default: false }, // Only superadmin
    },
    
    // Security tracking
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    lastLoginIP: {
      type: String,
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockedUntil: {
      type: Date,
    },
    
    // Session management
    currentSessionToken: {
      type: String,
      select: false,
    },
    
    // Activity logging
    activityLog: [{
      action: String,
      details: String,
      ip: String,
      timestamp: { type: Date, default: Date.now },
    }],
    
    // Password reset
    passwordResetToken: String,
    passwordResetExpires: Date,
    passwordChangedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Constants for security
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000; // 15 minutes

// Hash password before saving
adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  
  const salt = await bcrypt.genSalt(12); // Higher salt rounds for admin
  this.password = await bcrypt.hash(this.password, salt);
  this.passwordChangedAt = Date.now() - 1000; // Ensure token works after password change
  next();
});

// Compare password method
adminSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Check if account is locked
adminSchema.methods.isLocked = function () {
  return this.lockedUntil && this.lockedUntil > Date.now();
};

// Increment login attempts
adminSchema.methods.incLoginAttempts = async function () {
  // Reset if lock has expired
  if (this.lockedUntil && this.lockedUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockedUntil: 1 },
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account if max attempts reached
  if (this.loginAttempts + 1 >= MAX_LOGIN_ATTEMPTS && !this.isLocked()) {
    updates.$set = { lockedUntil: Date.now() + LOCK_TIME };
  }
  
  return this.updateOne(updates);
};

// Reset login attempts on successful login
adminSchema.methods.resetLoginAttempts = function () {
  return this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockedUntil: 1 },
  });
};

// Log admin activity
adminSchema.methods.logActivity = async function (action, details, ip) {
  this.activityLog.push({
    action,
    details,
    ip,
    timestamp: new Date(),
  });
  
  // Keep only last 100 activities
  if (this.activityLog.length > 100) {
    this.activityLog = this.activityLog.slice(-100);
  }
  
  await this.save();
};

// Check if password changed after token was issued
adminSchema.methods.changedPasswordAfter = function (tokenIssuedAt) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return tokenIssuedAt < changedTimestamp;
  }
  return false;
};

// Indexes
adminSchema.index({ email: 1 });
adminSchema.index({ role: 1 });
adminSchema.index({ isActive: 1 });

export default mongoose.model("Admin", adminSchema);
