import User from "../models/User.js";

// GET EDITOR PROFILE
export const getEditorProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select("-password");
    if (!user || user.role !== "editor") {
      return res.status(404).json({ message: "Editor not found" });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server Error" });
  }
};

// UPDATE EDITOR PROFILE
export const updateEditorProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      name,
      profilePicture,
      title,
      location,
      phone,
      about,
      skills,
      certifications,
      projectRate,
      languages,
      portfolio,
      experience,
      education,
    } = req.body;

    const user = await User.findById(userId);
    if (!user || user.role !== "editor") {
      return res.status(404).json({ message: "Editor not found" });
    }

    user.name = name || user.name;
    user.profilePicture = profilePicture || user.profilePicture;
    user.editorProfile.title = title || user.editorProfile.title;
    user.editorProfile.location = location || user.editorProfile.location;
    user.editorProfile.contact = {
      ...user.editorProfile.contact,
      phone: phone || user.editorProfile.contact?.phone,
    };
    user.editorProfile.about = about || user.editorProfile.about;
    if (skills) user.editorProfile.skills = skills;
    if (certifications) user.editorProfile.certifications = certifications;
    user.editorProfile.projectRate =
      projectRate || user.editorProfile.projectRate;
    if (languages) user.editorProfile.languages = languages;
    if (portfolio) user.editorProfile.portfolio = portfolio;
    if (experience) user.editorProfile.experience = experience;
    if (education) user.editorProfile.education = education;

    await user.save();
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server Error" });
  }
};

// ADD GIG
export const addGig = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, price, image, description } = req.body;

    if (!title || !price) {
      return res.status(400).json({ message: "Title and price are required" });
    }

    const user = await User.findById(userId);
    if (!user || user.role !== "editor") {
      return res.status(404).json({ message: "Editor not found" });
    }

    const newGig = {
      _id: new mongoose.Types.ObjectId(),
      title,
      price,
      image,
      description,
    };
    if (!user.editorProfile.gigs) user.editorProfile.gigs = [];
    user.editorProfile.gigs.push(newGig);

    await user.save();
    res.json(user.editorProfile.gigs);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server Error" });
  }
};

// UPDATE GIG
export const updateGig = async (req, res) => {
  try {
    const userId = req.user.id;
    const { gigId, title, price, image, description } = req.body;

    const user = await User.findById(userId);
    if (!user || user.role !== "editor") {
      return res.status(404).json({ message: "Editor not found" });
    }

    const gigIndex = user.editorProfile.gigs.findIndex(
      (g) => g._id.toString() === gigId.toString()
    );
    if (gigIndex === -1)
      return res.status(404).json({ message: "Gig not found" });

    if (title) user.editorProfile.gigs[gigIndex].title = title;
    if (price) user.editorProfile.gigs[gigIndex].price = price;
    if (image) user.editorProfile.gigs[gigIndex].image = image;
    if (description)
      user.editorProfile.gigs[gigIndex].description = description;

    await user.save();
    res.json(user.editorProfile.gigs[gigIndex]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server Error" });
  }
};

// DELETE GIG
export const deleteGig = async (req, res) => {
  try {
    const userId = req.user.id;
    const { gigId } = req.params;

    const user = await User.findById(userId);
    if (!user || user.role !== "editor") {
      return res.status(404).json({ message: "Editor not found" });
    }

    const gigExists = user.editorProfile.gigs.some(
      (g) => g._id.toString() === gigId.toString()
    );
    if (!gigExists) return res.status(404).json({ message: "Gig not found" });

    user.editorProfile.gigs = user.editorProfile.gigs.filter(
      (g) => g._id.toString() !== gigId.toString()
    );

    await user.save();
    res.json({
      message: "Gig deleted successfully",
      gigs: user.editorProfile.gigs,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server Error" });
  }
};
