import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './modules/user/models/User.js';
import { Profile } from './modules/profiles/models/Profile.js';
import { Reel } from './modules/reels/models/Reel.js';

dotenv.config();

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for index migration...");

    // 1. Profile Indexes
    await Profile.collection.createIndex({ about: "text", skills: "text", softwares: "text" });
    console.log("✅ Profile text indexes created (about, skills, softwares)");

    // 2. User Indexes
    await User.collection.createIndex({ bio: "text", name: "text" });
    console.log("✅ User text indexes created (bio, name)");

    // 3. Reel Indexes
    await Reel.collection.createIndex({ title: "text", description: "text", hashtags: "text" });
    console.log("✅ Reel text indexes created (title, description, hashtags)");

    console.log("Migration completed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
};

migrate();
