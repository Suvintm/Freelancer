import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const suvinUuid = '6654021f-8c6b-41d6-a951-5acc40e1b549';
const oldIds = [
  '69b8f1898690e31849924d3a',
  '69b917d9260fe88042551af1'
];

async function checkOldProfiles() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;

    console.log('--- Checking old profiles in MongoDB ---');
    const profiles = await db.collection('profiles').find({
      user: { $in: oldIds.map(id => new mongoose.Types.ObjectId(id)) }
    }).toArray();

    console.log(JSON.stringify(profiles, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

checkOldProfiles();
