import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const UserSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.models.User || mongoose.model('User', UserSchema, 'users');

async function findOldUser() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('--- Searching MongoDB legacy users ---');
    
    const oldUsers = await User.find({ 
      $or: [
        { email: 'suvintm1515@gmail.com' },
        { name: /Suvin/i }
      ]
    });
    
    console.log('Legacy Mongo Users Found:', oldUsers);
    
    if (oldUsers.length > 0) {
      const oldId = oldUsers[0]._id;
      console.log('FOUND OLD ID:', oldId);
      
      const PortfolioSchema = new mongoose.Schema({ user: mongoose.Schema.Types.Mixed }, { strict: false });
      const Portfolio = mongoose.models.Portfolio || mongoose.model('Portfolio', PortfolioSchema, 'portfolios');
      
      const count = await Portfolio.countDocuments({ user: oldId });
      console.log(`Portfolios for Old ID [${oldId}]:`, count);
    }

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

findOldUser();
