/**
 * ⚠️ DANGER: clearAllCollections.js
 * Deletes ALL documents from every collection in the freelance2 database.
 * Database and collection structure is preserved. Only data is removed.
 * Run: node scripts/clearAllCollections.js
 */

import "dotenv/config";
import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI is not set in .env");
  process.exit(1);
}

async function clearAll() {
  console.log("🔌 Connecting to MongoDB...");
  await mongoose.connect(MONGO_URI);
  
  const db = mongoose.connection.db;
  const dbName = db.databaseName;
  console.log(`✅ Connected to database: ${dbName}`);

  const collections = await db.listCollections().toArray();
  
  if (collections.length === 0) {
    console.log("ℹ️  No collections found.");
    process.exit(0);
  }

  console.log(`\n🗂️  Found ${collections.length} collections:\n`);
  
  for (const col of collections) {
    const name = col.name;
    const result = await db.collection(name).deleteMany({});
    console.log(`  🗑️  ${name}: deleted ${result.deletedCount} documents`);
  }

  console.log("\n✅ All collections cleared successfully.");
  await mongoose.disconnect();
  process.exit(0);
}

clearAll().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
