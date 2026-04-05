import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const oldIds = [
  '69b8f1898690e31849924d3a',
  '69b917d9260fe88042551af1'
];

async function checkOldUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;

    console.log('--- Checking old users in MongoDB ---');
    const users = await db.collection('users').find({
      _id: { $in: oldIds.map(id => new mongoose.Types.ObjectId(id)) }
    }).toArray();

    console.log(JSON.stringify(users, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

checkOldUsers();
