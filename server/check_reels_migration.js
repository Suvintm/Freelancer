import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const ReelSchema = new mongoose.Schema({}, { strict: false });
const Reel = mongoose.models.Reel || mongoose.model('Reel', ReelSchema, 'reels');

async function checkReels() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('--- Distinct Editors in Reels ---');
    const editors = await Reel.distinct('editor');
    console.log(editors);

    // Find Suvin's potential reels by title matching his portfolios
    // Titles were: "Suvix", "Dance", "Luxury", "Editing", "smart phone", "Trending dance", "succcess", "ind vs sa", "Rama navami"
    const titles = ["Suvix", "Dance", "Luxury", "Editing", "smart phone", "Trending dance", "succcess", "ind vs sa", "Rama navami"];
    const suvinReels = await Reel.find({ title: { $in: titles } }).lean();
    
    console.log(`Found ${suvinReels.length} reels matching Suvin's portfolio titles.`);
    console.log('Sample IDs and Editors:', suvinReels.map(r => ({ id: r._id, title: r.title, editor: r.editor })));

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

checkReels();
