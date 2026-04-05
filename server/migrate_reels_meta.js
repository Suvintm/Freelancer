import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const suvinUuid = '6654021f-8c6b-41d6-a951-5acc40e1b549';
const oldIds = [
  '69b8f1898690e31849924d3a',
  '69b917d9260fe88042551af1'
];

async function migrateInteractions() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log(`--- Migrating Reel Meta for Suvin [${suvinUuid}] ---`);

    // 1. REELS (editor)
    const reelRes = await mongoose.connection.collection('reels').updateMany(
      { editor: { $in: oldIds.map(id => new mongoose.Types.ObjectId(id)) } },
      { $set: { editor: suvinUuid } }
    );
    console.log(`Updated Reels (editor):`, reelRes.modifiedCount);

    // 2. COMMENTS (user)
    const commentRes = await mongoose.connection.collection('comments').updateMany(
      { user: { $in: oldIds.map(id => new mongoose.Types.ObjectId(id)) } },
      { $set: { user: suvinUuid } }
    );
    console.log(`Updated Comments (user):`, commentRes.modifiedCount);

    // 3. REELINTERACTIONS (user)
    const interRes = await mongoose.connection.collection('reelinteractions').updateMany(
      { user: { $in: oldIds.map(id => new mongoose.Types.ObjectId(id)) } },
      { $set: { user: suvinUuid } }
    );
    console.log(`Updated ReelInteractions (user):`, interRes.modifiedCount);

    // 4. PORTFOLIOS (user) - Reprocessing just in case
    const portRes = await mongoose.connection.collection('portfolios').updateMany(
      { user: { $in: oldIds.map(id => new mongoose.Types.ObjectId(id)) } },
      { $set: { user: suvinUuid } }
    );
    console.log(`Updated Portfolios (user):`, portRes.modifiedCount);

    console.log('--- Migration Finished ✅ ---');
    
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await mongoose.disconnect();
  }
}

migrateInteractions();
