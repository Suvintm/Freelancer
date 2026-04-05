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
    console.log(`--- Safe Migrating Reel Meta for Suvin [${suvinUuid}] ---`);

    const db = mongoose.connection.db;

    // 1. REELS (editor)
    const reelRes = await db.collection('reels').updateMany(
      { editor: { $in: oldIds.map(id => new mongoose.Types.ObjectId(id)) } },
      { $set: { editor: suvinUuid } }
    );
    console.log(`Updated Reels (editor):`, reelRes.modifiedCount);

    // 2. COMMENTS (user)
    const commentRes = await db.collection('comments').updateMany(
      { user: { $in: oldIds.map(id => new mongoose.Types.ObjectId(id)) } },
      { $set: { user: suvinUuid } }
    );
    console.log(`Updated Comments (user):`, commentRes.modifiedCount);

    // 3. REELINTERACTIONS (user) - Do one by one to avoid duplicate key failures
    const interactions = await db.collection('reelinteractions').find(
      { user: { $in: oldIds.map(id => new mongoose.Types.ObjectId(id)) } }
    ).toArray();

    console.log(`Found ${interactions.length} interactions to migrate.`);
    let interactionsUpdated = 0;
    let interactionsSkipped = 0;

    for (const inter of interactions) {
      try {
        await db.collection('reelinteractions').updateOne(
          { _id: inter._id },
          { $set: { user: suvinUuid } }
        );
        interactionsUpdated++;
      } catch (err) {
        if (err.code === 11000) {
          // Duplicate exists, just delete the old record since the new one is more relevant
          await db.collection('reelinteractions').deleteOne({ _id: inter._id });
          interactionsSkipped++;
        } else {
          throw err;
        }
      }
    }
    console.log(`ReelInteractions: Updated ${interactionsUpdated}, Deleted duplicates ${interactionsSkipped}`);

    // 4. PORTFOLIOS (user)
    const portRes = await db.collection('portfolios').updateMany(
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
