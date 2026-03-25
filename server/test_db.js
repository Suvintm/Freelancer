import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './modules/user/models/User.js';

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const editors = await User.find({ role: 'editor' }).select('name softwares aiProfile');
    console.log(JSON.stringify(editors, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
