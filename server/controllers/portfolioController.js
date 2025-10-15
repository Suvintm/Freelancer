import { Portfolio } from "../models/Portfolio.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";

// ---------------- CREATE PORTFOLIO ----------------
export const createPortfolio = async (req, res) => {
  try {
    const { title, description } = req.body;
    let originalClip = "";
    let editedClip = "";

    // Upload files to Cloudinary if provided
    if (req.files?.originalClip) {
      const result = await uploadToCloudinary(
        req.files.originalClip[0].buffer,
        "portfolio"
      );
      originalClip = result.url;
    }

    if (req.files?.editedClip) {
      const result = await uploadToCloudinary(
        req.files.editedClip[0].buffer,
        "portfolio"
      );
      editedClip = result.url;
    }

    // Create portfolio
    const portfolio = await Portfolio.create({
      user: req.user._id,
      title,
      description,
      originalClip,
      editedClip,
    });

    // Populate user details before sending response
    const populatedPortfolio = await Portfolio.findById(portfolio._id).populate(
      "user",
      "name email role profilePicture profileCompleted"
    );

    res.status(201).json({
      message: "Portfolio created successfully.",
      portfolio: populatedPortfolio,
    });
  } catch (error) {
    console.error("Create Portfolio Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ---------------- GET ALL PORTFOLIOS ----------------
export const getPortfolios = async (req, res) => {
  try {
    const portfolios = await Portfolio.find({ user: req.user._id }).populate(
      "user",
      "name email role profilePicture profileCompleted"
    );

    res.status(200).json(portfolios);
  } catch (error) {
    console.error("Get Portfolios Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ---------------- GET SINGLE PORTFOLIO ----------------
export const getPortfolio = async (req, res) => {
  try {
    const portfolio = await Portfolio.findById(req.params.id).populate(
      "user",
      "name email role profilePicture profileCompleted"
    );

    if (!portfolio)
      return res.status(404).json({ message: "Portfolio not found" });

    res.status(200).json(portfolio);
  } catch (error) {
    console.error("Get Portfolio Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ---------------- UPDATE PORTFOLIO ----------------
export const updatePortfolio = async (req, res) => {
  try {
    const { title, description } = req.body;
    const portfolio = await Portfolio.findById(req.params.id);
    if (!portfolio)
      return res.status(404).json({ message: "Portfolio not found" });

    if (title !== undefined) portfolio.title = title;
    if (description !== undefined) portfolio.description = description;

    if (req.files?.originalClip) {
      const result = await uploadToCloudinary(
        req.files.originalClip[0].buffer,
        "portfolio"
      );
      portfolio.originalClip = result.url;
    }

    if (req.files?.editedClip) {
      const result = await uploadToCloudinary(
        req.files.editedClip[0].buffer,
        "portfolio"
      );
      portfolio.editedClip = result.url;
    }

    await portfolio.save();

    // Populate user before returning response
    const populatedPortfolio = await Portfolio.findById(portfolio._id).populate(
      "user",
      "name email role profilePicture profileCompleted"
    );

    res.status(200).json({
      message: "Portfolio updated successfully.",
      portfolio: populatedPortfolio,
    });
  } catch (error) {
    console.error("Update Portfolio Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ---------------- DELETE PORTFOLIO ----------------
export const deletePortfolio = async (req, res) => {
  try {
    const portfolio = await Portfolio.findByIdAndDelete(req.params.id);
    if (!portfolio)
      return res.status(404).json({ message: "Portfolio not found" });

    res.status(200).json({ message: "Portfolio deleted successfully" });
  } catch (error) {
    console.error("Delete Portfolio Error:", error);
    res.status(500).json({ message: error.message });
  }
};


// ---------------- GET PORTFOLIOS BY USER ID (PUBLIC) ----------------
export const getPortfoliosByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const portfolios = await Portfolio.find({ user: userId }).sort({ uploadedAt: -1 });
    res.status(200).json(portfolios);
  } catch (error) {
    console.error("Get Portfolios By User ID Error:", error);
    res.status(500).json({ message: error.message });
  }
};
