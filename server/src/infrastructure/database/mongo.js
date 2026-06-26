import mongoose from "mongoose";
import logger from '../../infrastructure/monitoring/logger.js';

export const connectMongo = async (retries = 5) => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { 
      serverSelectionTimeoutMS: 5000, 
      maxPoolSize: 10 
    });
    logger.info("MongoDB connected successfully");
    
    const db = mongoose.connection.db;
    await Promise.all([
      db.collection("users").createIndex({ bio: "text", name: "text" }),
      db.collection("reels").createIndex({ isPublished: 1, createdAt: -1 }),
    ]);
    logger.info("Production database indexes verified ✅");
    return true;
  } catch (error) {
    logger.error(`MongoDB connection failed: ${error.message}`);
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      return connectMongo(retries - 1);
    }
    return false;
  }
};

export const disconnectMongo = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
};
