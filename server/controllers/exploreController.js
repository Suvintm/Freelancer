// controllers/exploreController.js
import { Profile } from "../models/Profile.js";
import User from "../models/User.js";

// GET /api/explore/editors
export const getAllEditors = async (req, res) => {
  try {
    // Find all profiles where user role is editor and profileCompleted is true
    const editors = await Profile.find().populate({
      path: "user",
      match: { role: "editor", profileCompleted: true },
      select: "name email profilePicture role profileCompleted", // select needed fields
    });

    // Remove profiles where user is null (filtered by populate match)
    const filteredEditors = editors.filter((p) => p.user !== null);

    res.status(200).json({ editors: filteredEditors });
  } catch (error) {
    console.error("Get All Editors Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
