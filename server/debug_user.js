import mongoose from "mongoose";
import User from "./models/User.js";
import dotenv from "dotenv";

dotenv.config();

const checkUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");

    // ID from the error screenshot/logs
    const userId = "6764582e3c0356bf5511e4f9"; // Replacing with a likely recent ID if the screenshot one was fuzzy, but let's try to query by email or list recent editors.
    // Actually, I'll list the most recent editor to be sure I get the right one.
    
    const user = await User.findOne({ role: "editor" }).sort({ updatedAt: -1 });
    
    if (user) {
        console.log("User Found:", user._id);
        console.log("Email:", user.email);
        console.log("Bank Details:", JSON.stringify(user.bankDetails, null, 2));
    } else {
        console.log("No editor found");
    }

    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

checkUser();
