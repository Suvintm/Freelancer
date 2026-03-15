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
      select: false,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    role: {
      type: String,
      default: "admin",
    },
    profileImage: {
      type: String,
      default: null,
    },
    permissions: {
      type: Map,
      of: Boolean,
      default: {}
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

    // Notification Preferences
    notificationPrefs: {
      email: {
        newOrders: { type: Boolean, default: true },
        disputes: { type: Boolean, default: true },
        kycSubmissions: { type: Boolean, default: true },
        payoutRequests: { type: Boolean, default: true },
        systemAlerts: { type: Boolean, default: true },
      },
      push: {
        newMessages: { type: Boolean, default: true },
        orderUpdates: { type: Boolean, default: true },
      }
    }
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
adminSchema.index({ role: 1 });
adminSchema.index({ isActive: 1 });

export default mongoose.model("AdminMember", adminSchema);
