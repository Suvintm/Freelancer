import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";
const JWT_EXPIRES_IN = "7d";

// ---------------- REGISTER ----------------
export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    let profilePicture = undefined;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required." });
    }

    if (!["editor", "client"].includes(role)) {
      return res.status(400).json({ message: "Invalid user role." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered." });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    if (req.file) {
      profilePicture = await uploadToCloudinary(req.file.buffer, "profiles");
    }

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      profilePicture,
    });

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileCompleted: user.profileCompleted,
        profilePicture: user.profilePicture,
      },
      token,
    });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ---------------- LOGIN ----------------
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials." });

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileCompleted: user.profileCompleted,
        profilePicture: user.profilePicture,
      },
      token,
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: error.message });
  }
};


// ---------------- LOGOUT ----------------
export const logout = async (req, res) => {
  try {
    // No server-side token invalidation needed in JWT stateless auth
    res.status(200).json({
      message: "Logout successful. Please remove token from client.",
    });
  } catch (error) {
    console.error("Logout Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


// ---------------- UPDATE PROFILE IMAGE ----------------
export const updateProfilePicture = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ message: "No file uploaded." });

    const profilePicture = await uploadToCloudinary(
      req.file.buffer,
      "profiles"
    );

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profilePicture },
      { new: true }
    ).select("-password");

    res.status(200).json({
      message: "Profile picture updated successfully",
      user,
    });
  } catch (error) {
    console.error("Update Profile Picture Error:", error);
    res.status(500).json({ message: error.message });
  }
};
