import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const UserSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.models.User || mongoose.model('User', UserSchema, 'users');

const PortfolioSchema = new mongoose.Schema({}, { strict: false });
const Portfolio = mongoose.models.Portfolio || mongoose.model('Portfolio', PortfolioSchema, 'portfolios');

async function checkSpecificIds() {
  const idsToCheck = [
    '69b8f1898690e31849924d3a',
    '69b917d9260fe88042551af1'
  ];

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('--- Checking specific Mongo IDs ---');

    for (const id of idsToCheck) {
      const u = await User.findById(id);
      const count = await Portfolio.countDocuments({ user: id });
      const literalCount = await Portfolio.countDocuments({ user: new mongoose.Types.ObjectId(id) });
      const stringCount = await Portfolio.countDocuments({ user: id.toString() });

      console.log(`ID [${id}]:`);
      console.log(`  User Found: ${u ? u.name + ' (' + u.email + ')' : 'NOT FOUND'}`);
      console.log(`  Portfolio Count (ObjectId): ${literalCount}`);
      console.log(`  Portfolio Count (String): ${stringCount}`);
    }

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

checkSpecificIds();
